import assert from "node:assert/strict";
import { EventEmitter, once } from "node:events";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { WebSocketServer } from "ws";

import * as runtimeSupport from "../scripts/layout-runtime-support.mjs";

const { cleanupLayoutResources, connectCdp } = runtimeSupport;

class FakeSocket extends EventEmitter {
  static instances = [];

  constructor(mode) {
    super();
    this.mode = mode;
    this.closed = false;
    FakeSocket.instances.push(this);
    if (mode !== "connect-stall") queueMicrotask(() => this.emit("open"));
  }

  send(payload) {
    if (this.mode === "close") queueMicrotask(() => this.emit("close", 1006, Buffer.from("simulated close")));
    else if (this.mode === "error") queueMicrotask(() => this.emit("error", new Error("simulated error")));
    else this.lastPayload = payload;
  }

  close() {
    this.closed = true;
  }

  terminate() {
    this.closed = true;
  }
}

function websocketFor(mode) {
  return class extends FakeSocket {
    constructor() {
      super(mode);
    }
  };
}

function fakeResources(profile) {
  const browser = new EventEmitter();
  browser.exitCode = null;
  browser.killed = false;
  browser.kill = () => {
    browser.killed = true;
    browser.exitCode = 0;
    queueMicrotask(() => browser.emit("exit", 0));
  };
  const server = {
    closed: false,
    close(callback) {
      this.closed = true;
      callback();
    },
  };
  return { browser, server, profile };
}

async function assertProfileRemoved(profile) {
  await assert.rejects(stat(profile), (error) => error.code === "ENOENT");
}

test("the portable CDP client works when Node has no global WebSocket", async () => {
  const server = new WebSocketServer({ port: 0, host: "127.0.0.1" });
  await once(server, "listening");
  server.on("connection", (socket) =>
    socket.on("message", (data) => {
      const request = JSON.parse(String(data));
      socket.send(JSON.stringify({ id: request.id, result: { portable: true } }));
    }),
  );
  const originalWebSocket = globalThis.WebSocket;
  let client;
  try {
    globalThis.WebSocket = undefined;
    client = await connectCdp(`ws://127.0.0.1:${server.address().port}`, {
      connectTimeoutMs: 250,
      commandTimeoutMs: 250,
    });
    assert.deepEqual(await client.send("Runtime.enable"), { portable: true });
  } finally {
    globalThis.WebSocket = originalWebSocket;
    client?.socket.terminate();
    for (const socket of server.clients) socket.terminate();
    await new Promise((resolve) => server.close(resolve));
  }
});

test("a stalled CDP connection times out and closes its socket", async () => {
  const startedAt = Date.now();
  await assert.rejects(
    connectCdp("ws://example.invalid", {
      WebSocketImpl: websocketFor("connect-stall"),
      connectTimeoutMs: 25,
      commandTimeoutMs: 250,
    }),
    /connection timed out/i,
  );
  assert.ok(Date.now() - startedAt < 500, "the connection timeout must be bounded");
  assert.equal(FakeSocket.instances.at(-1).closed, true);
});

test("a stalled CDP command times out promptly and all runtime resources are cleaned", async () => {
  const startedAt = Date.now();
  const resources = fakeResources(await mkdtemp(path.join(tmpdir(), "cashio-layout-test-timeout-")));
  let client;
  try {
    client = await connectCdp("ws://example.invalid", {
      WebSocketImpl: websocketFor("stall"),
      connectTimeoutMs: 25,
      commandTimeoutMs: 25,
    });
    await assert.rejects(client.send("Runtime.enable"), /timed out.*Runtime\.enable/i);
  } finally {
    await cleanupLayoutResources({ ...resources, socket: client?.socket });
  }

  assert.ok(Date.now() - startedAt < 500, "the simulated timeout must not leave a hanging promise");
  assert.equal(FakeSocket.instances.at(-1).closed, true);
  assert.equal(resources.browser.killed, true);
  assert.equal(resources.server.closed, true);
  await assertProfileRemoved(resources.profile);
});

test("an early CDP close rejects pending commands and all runtime resources are cleaned", async () => {
  const startedAt = Date.now();
  const resources = fakeResources(await mkdtemp(path.join(tmpdir(), "cashio-layout-test-close-")));
  let client;
  try {
    client = await connectCdp("ws://example.invalid", {
      WebSocketImpl: websocketFor("close"),
      connectTimeoutMs: 25,
      commandTimeoutMs: 250,
    });
    const results = await Promise.allSettled([
      client.send("Runtime.enable"),
      client.send("Emulation.setDeviceMetricsOverride"),
    ]);
    assert.deepEqual(
      results.map((result) => result.status),
      ["rejected", "rejected"],
    );
    assert.match(results[0].reason.message, /closed.*Runtime\.enable/i);
    assert.match(results[1].reason.message, /closed.*Emulation\.setDeviceMetricsOverride/i);
  } finally {
    await cleanupLayoutResources({ ...resources, socket: client?.socket });
  }

  assert.ok(Date.now() - startedAt < 500, "the simulated close must reject before the command timeout");
  assert.equal(resources.browser.killed, true);
  assert.equal(resources.server.closed, true);
  await assertProfileRemoved(resources.profile);
});

test("a CDP socket error rejects pending commands without waiting for their timeout", async () => {
  const client = await connectCdp("ws://example.invalid", {
    WebSocketImpl: websocketFor("error"),
    connectTimeoutMs: 25,
    commandTimeoutMs: 250,
  });
  try {
    await assert.rejects(client.send("Runtime.enable"), /socket error.*Runtime\.enable/i);
  } finally {
    client.socket.close();
  }
});

test("a stuck server shutdown is bounded while remaining resources are cleaned", async () => {
  const profile = await mkdtemp(path.join(tmpdir(), "cashio-layout-test-stuck-server-"));
  const browser = new EventEmitter();
  browser.exitCode = null;
  browser.killed = false;
  browser.kill = () => {
    browser.killed = true;
    browser.exitCode = 0;
    queueMicrotask(() => browser.emit("exit", 0));
  };
  const socket = {
    closed: false,
    close() {
      this.closed = true;
    },
  };
  const server = {
    closeCalled: false,
    idleClosed: false,
    allClosed: false,
    close() {
      this.closeCalled = true;
    },
    closeIdleConnections() {
      this.idleClosed = true;
    },
    closeAllConnections() {
      this.allClosed = true;
    },
  };
  const startedAt = Date.now();
  let outcome;
  let sentinel;
  try {
    outcome = await Promise.race([
      cleanupLayoutResources({ socket, browser, server, profile }, { serverCloseTimeoutMs: 25 }).then(
        () => ({ status: "resolved" }),
        (error) => ({ status: "rejected", error }),
      ),
      new Promise((resolve) => {
        sentinel = setTimeout(() => resolve({ status: "hung" }), 150);
      }),
    ]);
    assert.equal(outcome.status, "rejected", "stuck server cleanup must reject instead of hanging");
    assert.match(outcome.error.message, /server close timed out/i);
    assert.ok(Date.now() - startedAt < 500);
    assert.equal(socket.closed, true);
    assert.equal(browser.killed, true);
    assert.equal(server.closeCalled, true);
    assert.equal(server.idleClosed, true);
    assert.equal(server.allClosed, true);
    await assertProfileRemoved(profile);
  } finally {
    clearTimeout(sentinel);
    await rm(profile, { recursive: true, force: true });
  }
});

test("verification cleanup preserves a primary-only failure", async () => {
  assert.equal(
    typeof runtimeSupport.runWithLayoutCleanup,
    "function",
    "the verifier needs a primary-error-preserving cleanup boundary",
  );
  const primary = new Error("primary verification failure");
  await assert.rejects(
    runtimeSupport.runWithLayoutCleanup(async () => {
      throw primary;
    }, {}),
    (error) => error === primary,
  );
});

test("verification cleanup preserves a cleanup-only failure", async () => {
  const cleanup = new Error("cleanup failure");
  const server = {
    close(callback) {
      callback(cleanup);
    },
  };
  await assert.rejects(
    runtimeSupport.runWithLayoutCleanup(async () => "ok", { server }),
    (error) => error === cleanup,
  );
});

test("verification cleanup reports primary then cleanup failures deterministically", async () => {
  const primary = new Error("primary verification failure");
  const cleanup = new Error("cleanup failure");
  const server = {
    close(callback) {
      callback(cleanup);
    },
  };
  await assert.rejects(
    runtimeSupport.runWithLayoutCleanup(
      async () => {
        throw primary;
      },
      { server },
    ),
    (error) =>
      error instanceof AggregateError &&
      error.errors.length === 2 &&
      error.errors[0] === primary &&
      error.errors[1] === cleanup,
  );
});
