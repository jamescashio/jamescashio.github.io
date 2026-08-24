import { rm } from "node:fs/promises";
import WebSocket from "ws";

const DEFAULT_CONNECT_TIMEOUT_MS = 10_000;
const DEFAULT_COMMAND_TIMEOUT_MS = 10_000;
const DEFAULT_CLEANUP_TIMEOUT_MS = 2_000;

function settleWithin(promise, timeoutMs, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function terminateSocket(socket) {
  try {
    if (typeof socket.terminate === "function") socket.terminate();
    else socket.close();
  } catch {
    // Cleanup continues through browser, server, and profile resources.
  }
}

export async function connectCdp(
  endpoint,
  {
    WebSocketImpl = WebSocket,
    connectTimeoutMs = DEFAULT_CONNECT_TIMEOUT_MS,
    commandTimeoutMs = DEFAULT_COMMAND_TIMEOUT_MS,
  } = {},
) {
  const socket = new WebSocketImpl(endpoint);
  await new Promise((resolve, reject) => {
    const finish = (handler, value) => {
      clearTimeout(timer);
      socket.removeListener("open", onOpen);
      socket.removeListener("error", onError);
      socket.removeListener("close", onClose);
      handler(value);
    };
    const onOpen = () => finish(resolve);
    const onError = (error) => {
      terminateSocket(socket);
      finish(reject, new Error(`CDP connection failed: ${error?.message ?? error}`));
    };
    const onClose = () => finish(reject, new Error("CDP socket closed before connection completed"));
    const timer = setTimeout(() => {
      terminateSocket(socket);
      finish(reject, new Error(`CDP connection timed out after ${connectTimeoutMs}ms`));
    }, connectTimeoutMs);
    socket.once("open", onOpen);
    socket.once("error", onError);
    socket.once("close", onClose);
  });

  let nextId = 0;
  let stopped;
  const pending = new Map();
  const rejectPending = (cause) => {
    if (!stopped) stopped = cause;
    for (const { reject, timer, method } of pending.values()) {
      clearTimeout(timer);
      reject(new Error(`${stopped.message} before ${method} completed`));
    }
    pending.clear();
  };
  socket.on("message", (data) => {
    let message;
    try {
      message = JSON.parse(String(data));
    } catch (error) {
      rejectPending(new Error(`CDP returned malformed JSON: ${error.message}`));
      terminateSocket(socket);
      return;
    }
    if (!message.id || !pending.has(message.id)) return;
    const handlers = pending.get(message.id);
    pending.delete(message.id);
    clearTimeout(handlers.timer);
    if (message.error) handlers.reject(new Error(message.error.message));
    else handlers.resolve(message.result);
  });
  socket.on("close", (code, reason) => {
    const detail = reason?.length ? ` (${code}: ${String(reason)})` : "";
    rejectPending(new Error(`CDP socket closed${detail}`));
  });
  socket.on("error", (error) => rejectPending(new Error(`CDP socket error: ${error?.message ?? error}`)));

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      if (stopped) {
        reject(new Error(`${stopped.message}; cannot run ${method}`));
        return;
      }
      const id = ++nextId;
      const timer = setTimeout(() => {
        const timeout = new Error(`CDP command timed out after ${commandTimeoutMs}ms`);
        rejectPending(timeout);
        terminateSocket(socket);
      }, commandTimeoutMs);
      pending.set(id, { resolve, reject, timer, method });
      try {
        socket.send(JSON.stringify({ id, method, params }));
      } catch (error) {
        rejectPending(new Error(`CDP send failed: ${error?.message ?? error}`));
        terminateSocket(socket);
      }
    });

  return { socket, send };
}

export async function cleanupLayoutResources(
  { socket, browser, server, profile },
  { browserExitTimeoutMs = DEFAULT_CLEANUP_TIMEOUT_MS, serverCloseTimeoutMs = DEFAULT_CLEANUP_TIMEOUT_MS } = {},
) {
  const errors = [];
  try {
    socket?.close();
  } catch (error) {
    errors.push(error);
  }
  if (browser && browser.exitCode == null) {
    try {
      const exited = new Promise((resolve) => browser.once("exit", resolve));
      browser.kill();
      await settleWithin(exited, browserExitTimeoutMs, `browser exit timed out after ${browserExitTimeoutMs}ms`);
    } catch (error) {
      errors.push(error);
    }
  }
  if (server) {
    const closed = new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    for (const method of ["closeIdleConnections", "closeAllConnections"]) {
      try {
        server[method]?.();
      } catch (error) {
        errors.push(error);
      }
    }
    try {
      await settleWithin(closed, serverCloseTimeoutMs, `server close timed out after ${serverCloseTimeoutMs}ms`);
    } catch (error) {
      errors.push(error);
    }
  }
  if (profile) {
    try {
      await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) throw new AggregateError(errors, "layout verifier cleanup failed");
}

export async function runWithLayoutCleanup(operation, resources, cleanupOptions) {
  let result;
  let primaryError;
  try {
    result = await operation();
  } catch (error) {
    primaryError = error;
  }

  let cleanupError;
  try {
    await cleanupLayoutResources(resources, cleanupOptions);
  } catch (error) {
    cleanupError = error;
  }

  if (primaryError && cleanupError) {
    throw new AggregateError([primaryError, cleanupError], "layout verification and cleanup both failed");
  }
  if (primaryError) throw primaryError;
  if (cleanupError) throw cleanupError;
  return result;
}
