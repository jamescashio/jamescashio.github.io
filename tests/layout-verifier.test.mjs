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

const approvedFlightScenario = {
  viewport: [320, 844],
  activeDeck: "8",
  scrollerId: "main-content",
  scrollerScrollTop: 8760,
  contentPassedUnderSurface: true,
  inactive: {
    tagName: "BUTTON",
    backgroundAlpha: 1,
    beforeScroll: { left: 12, top: 68, width: 288, height: 44 },
    afterScroll: { left: 12, top: 68, width: 288, height: 44 },
  },
  active: {
    tagName: "SECTION",
    backgroundAlpha: 1,
    beforeScroll: { left: 12, top: 68, width: 288, height: 62 },
    afterScroll: { left: 12, top: 68, width: 288, height: 62 },
    stopControl: { tagName: "BUTTON", left: 199.734375, top: 77, width: 91.265625, height: 44 },
  },
};

test("mobile flight acceptance rejects an opaque surface that skips Contact and approved fixed geometry", () => {
  const validate = runtimeSupport.mobileFlightAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  const failures = validate({
    ...approvedFlightScenario,
    activeDeck: "0",
    scrollerId: null,
    contentPassedUnderSurface: false,
    inactive: {
      ...approvedFlightScenario.inactive,
      beforeScroll: { left: 20, top: 80, width: 280, height: 48 },
      afterScroll: { left: 20, top: 80, width: 280, height: 48 },
    },
  });

  assert.ok(failures.some((failure) => /Contact deck/.test(failure)));
  assert.ok(failures.some((failure) => /#main-content/.test(failure)));
  assert.ok(failures.some((failure) => /pass beneath/.test(failure)));
  assert.ok(failures.some((failure) => /inactive geometry/.test(failure)));
});

test("mobile flight acceptance recognizes the approved 320 and 390 Contact geometries", () => {
  const validate = runtimeSupport.mobileFlightAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  assert.deepEqual(validate(approvedFlightScenario), []);
  assert.deepEqual(validate({ ...approvedFlightScenario, viewport: [390, 844] }), []);
});

test("mobile flight acceptance rejects an active STOP target below 44px", () => {
  const validate = runtimeSupport.mobileFlightAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  const failures = validate({
    ...approvedFlightScenario,
    active: {
      ...approvedFlightScenario.active,
      stopControl: { ...approvedFlightScenario.active.stopControl, height: 40 },
    },
  });
  assert.ok(failures.some((failure) => /STOP FLIGHT.*at least 44px/.test(failure)));
});

const approvedCinemaScenario = {
  viewport: [390, 844],
  activeFlightStarted: true,
  skipPresent: false,
  flightPresent: false,
  exposedTabStops: ["EXIT CINEMA"],
  boundariesPassedEachOpening: true,
  allOpeningsMatchedExitGeometry: true,
  exit: { visible: true, left: 228.5, right: 370, top: 780, bottom: 824, width: 141.5, height: 44 },
  tab: {
    defaultPrevented: true,
    activeLabel: "EXIT CINEMA",
    openedFromExactOpener: true,
    escape: { defaultPrevented: true, dialogPresent: false, activeIsOpener: true },
  },
  shiftTab: {
    defaultPrevented: true,
    activeLabel: "EXIT CINEMA",
    openedFromExactOpener: true,
    escape: { defaultPrevented: true, dialogPresent: false, activeIsOpener: true },
  },
};

test("mobile cinema acceptance rejects exposed background controls and an untrapped focus path", () => {
  const validate = runtimeSupport.mobileCinemaAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  const failures = validate({
    viewport: [390, 844],
    activeFlightStarted: true,
    skipPresent: true,
    flightPresent: true,
    exposedTabStops: ["EXIT CINEMA", "EMAIL"],
    exit: { visible: true, left: 270, right: 380, top: 770, bottom: 820, width: 110, height: 50 },
    tab: { defaultPrevented: false, activeLabel: "EMAIL" },
    shiftTab: { defaultPrevented: false, activeLabel: "Skip to content" },
  });

  assert.ok(failures.some((failure) => /skip link/.test(failure)));
  assert.ok(failures.some((failure) => /flight control/.test(failure)));
  assert.ok(failures.some((failure) => /sole exposed tab stop/.test(failure)));
  assert.ok(failures.some((failure) => /Tab loop/.test(failure)));
  assert.ok(failures.some((failure) => /safe margins/.test(failure)));
});

test("mobile cinema acceptance recognizes the approved active-flight PHOTO focus boundary", () => {
  const validate = runtimeSupport.mobileCinemaAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  assert.deepEqual(validate(approvedCinemaScenario), []);
});

test("mobile cinema acceptance recognizes the hand-derived 320 safe-margin geometry", () => {
  const validate = runtimeSupport.mobileCinemaAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  assert.deepEqual(
    validate({
      ...approvedCinemaScenario,
      viewport: [320, 844],
      exit: { ...approvedCinemaScenario.exit, left: 158.5, right: 300 },
    }),
    [],
  );
});

test("mobile cinema acceptance fails closed for every missing or non-finite EXIT rectangle field", () => {
  const validate = runtimeSupport.mobileCinemaAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  for (const property of ["left", "right", "top", "bottom", "width", "height"]) {
    for (const invalid of [undefined, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const exit = { ...approvedCinemaScenario.exit, [property]: invalid };
      if (invalid === undefined) delete exit[property];
      const failures = validate({ ...approvedCinemaScenario, exit });
      assert.ok(
        failures.some((failure) => /finite EXIT rectangle/.test(failure)),
        `${property}=${String(invalid)} must fail closed`,
      );
    }
  }
});

test("mobile cinema acceptance rejects internally inconsistent EXIT rectangles", () => {
  const validate = runtimeSupport.mobileCinemaAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  for (const exit of [
    { ...approvedCinemaScenario.exit, right: 369 },
    { ...approvedCinemaScenario.exit, bottom: 823 },
  ]) {
    const failures = validate({ ...approvedCinemaScenario, exit });
    assert.ok(failures.some((failure) => /internally consistent/.test(failure)));
  }
});

test("mobile cinema acceptance requires isolated openings and Escape restoration for both Tab directions", () => {
  const validate = runtimeSupport.mobileCinemaAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  for (const direction of ["tab", "shiftTab"]) {
    const failures = validate({
      ...approvedCinemaScenario,
      [direction]: {
        ...approvedCinemaScenario[direction],
        openedFromExactOpener: false,
        escape: { defaultPrevented: false, dialogPresent: true, activeIsOpener: false },
      },
      boundariesPassedEachOpening: false,
      allOpeningsMatchedExitGeometry: false,
    });
    assert.ok(failures.some((failure) => /fresh PHOTO opening/.test(failure)));
    assert.ok(failures.some((failure) => /Escape.*exact PHOTO opener/.test(failure)));
    assert.ok(failures.some((failure) => /each PHOTO opening/.test(failure)));
  }
});

const approvedDesktopEveScenario = {
  viewport: [1280, 720],
  hash: "#deck=eve",
  activeDeck: "7",
  directDeepLink: true,
  canonicalLandingSettled: true,
  scrollTop: 12_000,
  intendedScrollTop: 12_000,
  scrollAlignmentDelta: 0,
  inputVisible: true,
  promptSurfaceVisible: true,
  runVisible: true,
  input: { left: 430, right: 850, top: 642, bottom: 660, width: 420, height: 18 },
  promptSurface: { left: 320, right: 960, top: 624, bottom: 680, width: 640, height: 56 },
  runControl: { left: 880, right: 940, top: 630, bottom: 674, width: 60, height: 44 },
  inputTopmostHit: true,
  runTopmostHit: true,
  promptSurfaceSampleHits: [true, true, true, true, true, true, true, true, true],
  fixedStickyEnumerationComplete: true,
  fixedStickyIntersections: [],
  documentWidth: 1280,
  mainClientWidth: 1212,
  mainScrollWidth: 1212,
};

test("desktop E.V.E. acceptance recognizes hand-derived 1280 and unchanged 1440 prompt geometry", () => {
  const validate = runtimeSupport.desktopEveAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  assert.deepEqual(validate(approvedDesktopEveScenario), []);
  assert.deepEqual(
    validate({
      ...approvedDesktopEveScenario,
      viewport: [1440, 900],
      input: { left: 510, right: 930, top: 752, bottom: 770, width: 420, height: 18 },
      promptSurface: { left: 400, right: 1040, top: 734, bottom: 790, width: 640, height: 56 },
      runControl: { left: 960, right: 1020, top: 740, bottom: 784, width: 60, height: 44 },
      documentWidth: 1440,
      mainClientWidth: 1372,
      mainScrollWidth: 1372,
    }),
    [],
  );
});

test("desktop E.V.E. acceptance rejects the observed below-viewport prompt geometry", () => {
  const validate = runtimeSupport.desktopEveAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  const failures = validate({
    ...approvedDesktopEveScenario,
    input: { ...approvedDesktopEveScenario.input, top: 769.703125, bottom: 787.703125 },
    promptSurface: { ...approvedDesktopEveScenario.promptSurface, top: 755, bottom: 803 },
    inputTopmostHit: false,
  });
  assert.ok(failures.some((failure) => /20px bottom safe margin/.test(failure)));
  assert.ok(failures.some((failure) => /input center must be the topmost hit target/.test(failure)));
});

test("desktop E.V.E. acceptance fails closed for every required numeric field", () => {
  const validate = runtimeSupport.desktopEveAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  const mutations = [
    ["viewport width", (value) => ({ ...approvedDesktopEveScenario, viewport: [value, 720] })],
    ["viewport height", (value) => ({ ...approvedDesktopEveScenario, viewport: [1280, value] })],
    ["documentWidth", (value) => ({ ...approvedDesktopEveScenario, documentWidth: value })],
    ["mainClientWidth", (value) => ({ ...approvedDesktopEveScenario, mainClientWidth: value })],
    ["mainScrollWidth", (value) => ({ ...approvedDesktopEveScenario, mainScrollWidth: value })],
    ["scrollTop", (value) => ({ ...approvedDesktopEveScenario, scrollTop: value })],
    ["intendedScrollTop", (value) => ({ ...approvedDesktopEveScenario, intendedScrollTop: value })],
    ["scrollAlignmentDelta", (value) => ({ ...approvedDesktopEveScenario, scrollAlignmentDelta: value })],
  ];
  for (const rectName of ["input", "promptSurface", "runControl"]) {
    for (const property of ["left", "right", "top", "bottom", "width", "height"]) {
      mutations.push([
        `${rectName}.${property}`,
        (value) => ({
          ...approvedDesktopEveScenario,
          [rectName]: { ...approvedDesktopEveScenario[rectName], [property]: value },
        }),
      ]);
    }
  }
  for (const [label, mutate] of mutations) {
    for (const invalid of [undefined, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const failures = validate(mutate(invalid));
      assert.ok(failures.length > 0, `${label}=${String(invalid)} must fail closed`);
    }
  }
});

test("desktop E.V.E. acceptance rejects inconsistent input, form, and RUN rectangles", () => {
  const validate = runtimeSupport.desktopEveAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  for (const rectName of ["input", "promptSurface", "runControl"]) {
    const failures = validate({
      ...approvedDesktopEveScenario,
      [rectName]: { ...approvedDesktopEveScenario[rectName], right: approvedDesktopEveScenario[rectName].right - 1 },
    });
    assert.ok(
      failures.some((failure) => /internally consistent/.test(failure)),
      `${rectName} must be consistent`,
    );
  }
});

test("desktop E.V.E. acceptance requires direct deep-link landing and complete hit-test evidence", () => {
  const validate = runtimeSupport.desktopEveAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  for (const property of [
    "directDeepLink",
    "canonicalLandingSettled",
    "inputVisible",
    "promptSurfaceVisible",
    "runVisible",
    "inputTopmostHit",
    "runTopmostHit",
    "fixedStickyEnumerationComplete",
  ]) {
    for (const invalid of [undefined, false]) {
      const failures = validate({ ...approvedDesktopEveScenario, [property]: invalid });
      assert.ok(failures.length > 0, `${property}=${String(invalid)} must fail closed`);
    }
  }
  for (const sampleHits of [undefined, [], [true, true, true, true, false, true, true, true, true]]) {
    const failures = validate({ ...approvedDesktopEveScenario, promptSurfaceSampleHits: sampleHits });
    assert.ok(failures.length > 0, "full prompt surface samples must fail closed");
  }
  for (const intersections of [undefined, null, {}, [{ label: "HUD", pointerActiveChildren: ["button"] }]]) {
    const failures = validate({ ...approvedDesktopEveScenario, fixedStickyIntersections: intersections });
    assert.ok(failures.length > 0, "fixed/sticky intersection evidence must fail closed");
  }
});

test("desktop E.V.E. acceptance rejects overflow, overlap, containment, and both obscured controls", () => {
  const validate = runtimeSupport.desktopEveAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  const cases = [
    ["document overflow", { documentWidth: 1281 }, /overflow horizontally/],
    ["main overflow", { mainScrollWidth: 1213 }, /main scroller.*overflow horizontally/],
    [
      "fixed HUD overlap",
      { fixedStickyIntersections: [{ label: "HUD", pointerActiveChildren: ["button"] }] },
      /fixed or sticky surface must not cover/,
    ],
    [
      "input outside form",
      { input: { left: 300, right: 850, top: 642, bottom: 660, width: 550, height: 18 } },
      /inside its visible prompt surface/,
    ],
    ["obscured input", { inputTopmostHit: false }, /input center must be the topmost hit target/],
    ["obscured RUN", { runTopmostHit: false }, /RUN center must be the topmost hit target/],
  ];
  for (const [label, mutation, expected] of cases) {
    const failures = validate({ ...approvedDesktopEveScenario, ...mutation });
    assert.ok(
      failures.some((failure) => expected.test(failure)),
      label,
    );
  }
});
