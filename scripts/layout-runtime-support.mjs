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

function hasExactRect(rect, expected) {
  return (
    rect != null && Object.entries(expected).every(([property, value]) => Number(rect[property]) === Number(value))
  );
}

const RECT_FIELDS = ["left", "right", "top", "bottom", "width", "height"];
const RECT_CONSISTENCY_TOLERANCE_PX = 0.01;

function hasFiniteRect(rect) {
  return rect != null && RECT_FIELDS.every((property) => Number.isFinite(rect[property]));
}

function hasConsistentRect(rect) {
  return (
    Math.abs(rect.right - rect.left - rect.width) <= RECT_CONSISTENCY_TOLERANCE_PX &&
    Math.abs(rect.bottom - rect.top - rect.height) <= RECT_CONSISTENCY_TOLERANCE_PX
  );
}

export function mobileFlightAcceptanceFailures(scenario) {
  const failures = [];
  const width = scenario.viewport?.[0];
  if (![320, 390].includes(width) || scenario.viewport?.[1] !== 844) {
    failures.push("mobile flight viewport must be 320x844 or 390x844");
  }
  if (scenario.activeDeck !== "8") failures.push("mobile flight scenario must run at the Contact deck");
  if (scenario.scrollerId !== "main-content") failures.push("mobile flight scenario must scroll #main-content");
  if (!(scenario.scrollerScrollTop > 0)) failures.push("#main-content must have a positive scroll position");
  if (!scenario.contentPassedUnderSurface)
    failures.push("receipt or email content must pass beneath the fixed surface");

  if (scenario.inactive?.backgroundAlpha !== 1) failures.push("inactive flight background alpha must equal 1");
  const inactiveRect = { left: 12, top: 68, width: 288, height: 44 };
  if (
    !hasExactRect(scenario.inactive?.beforeScroll, inactiveRect) ||
    !hasExactRect(scenario.inactive?.afterScroll, inactiveRect)
  ) {
    failures.push("inactive geometry must remain fixed at x=12, top=68, width=288, height=44");
  }

  if (scenario.active?.backgroundAlpha !== 1) failures.push("active flight background alpha must equal 1");
  const activeRect = { left: 12, top: 68, width: 288, height: 62 };
  if (
    !hasExactRect(scenario.active?.beforeScroll, activeRect) ||
    !hasExactRect(scenario.active?.afterScroll, activeRect)
  ) {
    failures.push("active panel geometry must remain fixed at x=12, top=68, width=288, height=62");
  }
  if (!(scenario.active?.stopControl?.height >= 44)) {
    failures.push("active STOP FLIGHT target must be at least 44px high");
  }
  if (
    !hasExactRect(scenario.active?.stopControl, {
      left: 199.734375,
      top: 77,
      width: 91.265625,
      height: 44,
    })
  ) {
    failures.push("active STOP FLIGHT geometry must remain x=199.734375, top=77, width=91.265625, height=44");
  }
  return failures;
}

export function mobileCinemaAcceptanceFailures(scenario) {
  const failures = [];
  const viewportWidth = scenario.viewport?.[0];
  const viewportHeight = scenario.viewport?.[1];
  const validViewport = [320, 390].includes(viewportWidth) && viewportHeight === 844;
  if (!validViewport) {
    failures.push("mobile cinema viewport must be 320x844 or 390x844");
  }
  if (!scenario.activeFlightStarted) failures.push("PHOTO cinema must be entered from an active flight");
  if (scenario.skipPresent) failures.push("skip link must be absent while cinema is open");
  if (scenario.flightPresent) failures.push("flight control must be absent while cinema is open");
  if (scenario.exposedTabStops?.length !== 1 || scenario.exposedTabStops[0] !== "EXIT CINEMA") {
    failures.push("EXIT CINEMA must be the sole exposed tab stop");
  }
  const finiteExit = hasFiniteRect(scenario.exit);
  if (!finiteExit) {
    failures.push("EXIT CINEMA must provide a finite EXIT rectangle");
  } else {
    if (!hasConsistentRect(scenario.exit)) {
      failures.push(`EXIT CINEMA rectangle must be internally consistent within ${RECT_CONSISTENCY_TOLERANCE_PX}px`);
    }
    if (!scenario.exit.visible || scenario.exit.width < 44 || scenario.exit.height < 44) {
      failures.push("EXIT CINEMA must be visible and at least 44x44");
    }
    if (
      validViewport &&
      (scenario.exit.left < 20 ||
        scenario.exit.right > viewportWidth - 20 ||
        scenario.exit.top < 20 ||
        scenario.exit.bottom > viewportHeight - 20)
    ) {
      failures.push("EXIT CINEMA must remain within 20px mobile safe margins");
    }
  }
  if (
    !scenario.tab?.defaultPrevented ||
    scenario.tab?.activeLabel !== "EXIT CINEMA" ||
    !scenario.shiftTab?.defaultPrevented ||
    scenario.shiftTab?.activeLabel !== "EXIT CINEMA"
  ) {
    failures.push("Tab loop must keep both directions on EXIT CINEMA");
  }
  if (!scenario.tab?.openedFromExactOpener || !scenario.shiftTab?.openedFromExactOpener) {
    failures.push("Tab and Shift+Tab must each begin from a fresh PHOTO opening");
  }
  for (const direction of [scenario.tab, scenario.shiftTab]) {
    if (!direction?.escape?.defaultPrevented || direction.escape.dialogPresent || !direction.escape.activeIsOpener) {
      failures.push("Escape must close cinema and restore the exact PHOTO opener after each direction");
      break;
    }
  }
  if (!scenario.boundariesPassedEachOpening || !scenario.allOpeningsMatchedExitGeometry) {
    failures.push("skip, flight, tab-stop, and EXIT geometry checks must pass on each PHOTO opening");
  }
  return failures;
}
