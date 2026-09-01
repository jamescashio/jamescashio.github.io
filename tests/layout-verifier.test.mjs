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

test("early browser exit diagnostics preserve the signal and Chrome stderr", () => {
  assert.equal(
    typeof runtimeSupport.browserExitDiagnostic,
    "function",
    "the verifier must expose actionable early-exit diagnostics",
  );
  const diagnostic = runtimeSupport.browserExitDiagnostic(
    null,
    "SIGTRAP",
    "[FATAL:zygote_host_impl_linux.cc] No usable sandbox!",
  );
  assert.match(diagnostic, /signal SIGTRAP/);
  assert.match(diagnostic, /No usable sandbox!/);
});

test("cleanup skips a browser process that already terminated by signal", async () => {
  const profile = await mkdtemp(path.join(tmpdir(), "cashio-layout-test-signaled-browser-"));
  const resources = fakeResources(profile);
  resources.browser.signalCode = "SIGTRAP";
  resources.browser.killCalls = 0;
  resources.browser.kill = () => {
    resources.browser.killCalls += 1;
  };

  await cleanupLayoutResources(resources, { browserExitTimeoutMs: 25 });

  assert.equal(resources.browser.killCalls, 0);
  assert.equal(resources.server.closed, true);
  await assertProfileRemoved(profile);
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
  // The control is anchored 68px from the bottom of an 844px viewport, so an
  // inactive 44px button sits at 732 and the active 62px panel at 714.
  inactive: {
    tagName: "BUTTON",
    backgroundAlpha: 1,
    beforeScroll: { left: 12, top: 732, width: 288, height: 44 },
    afterScroll: { left: 12, top: 732, width: 288, height: 44 },
  },
  active: {
    tagName: "SECTION",
    backgroundAlpha: 1,
    beforeScroll: { left: 12, top: 714, width: 288, height: 62 },
    afterScroll: { left: 12, top: 714, width: 288, height: 62 },
    criticalTelemetryFontSizesPx: { state: 11, progress: 11, now: 11 },
    stopControl: { tagName: "BUTTON", left: 199.734375, top: 723, width: 91.265625, height: 44 },
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
  escapeObserverReady: true,
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
    escape: {
      observerReady: true,
      observed: true,
      defaultPrevented: true,
      dialogPresent: false,
      activeIsOpener: true,
    },
  },
  shiftTab: {
    defaultPrevented: true,
    activeLabel: "EXIT CINEMA",
    openedFromExactOpener: true,
    escape: {
      observerReady: true,
      observed: true,
      defaultPrevented: true,
      dialogPresent: false,
      activeIsOpener: true,
    },
  },
};

test("mobile cinema acceptance requires the Escape observer to be ready before either close", () => {
  const validate = runtimeSupport.mobileCinemaAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  const scenario = structuredClone(approvedCinemaScenario);
  scenario.tab.escape.observerReady = false;
  scenario.shiftTab.escape.observerReady = true;
  scenario.escapeObserverReady = false;

  const failures = validate(scenario);

  assert.ok(failures.some((failure) => /Escape observer must be ready/.test(failure)));
});

test("mobile cinema Escape requires the exact PHOTO opener even after its observer is ready", () => {
  const validate = runtimeSupport.mobileCinemaAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  const scenario = structuredClone(approvedCinemaScenario);
  scenario.escapeObserverReady = true;
  for (const direction of [scenario.tab, scenario.shiftTab]) {
    direction.escape.observerReady = true;
    direction.escape.observed = true;
  }
  scenario.shiftTab.escape.activeIsOpener = false;

  const failures = validate(scenario);

  assert.equal(
    failures.some((failure) => /Escape observer must be ready/.test(failure)),
    false,
  );
  assert.ok(failures.some((failure) => /Escape.*exact PHOTO opener/.test(failure)));
});

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
  input: { left: 430, right: 850, top: 630, bottom: 674, width: 420, height: 44 },
  promptSurface: { left: 320, right: 960, top: 624, bottom: 680, width: 640, height: 56 },
  runControl: { left: 880, right: 940, top: 630, bottom: 674, width: 60, height: 44 },
  criticalTelemetryFontSizesPx: [10, 10],
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
      input: { left: 510, right: 930, top: 740, bottom: 784, width: 420, height: 44 },
      promptSurface: { left: 400, right: 1040, top: 734, bottom: 790, width: 640, height: 56 },
      runControl: { left: 960, right: 1020, top: 740, bottom: 784, width: 60, height: 44 },
      documentWidth: 1440,
      mainClientWidth: 1372,
      mainScrollWidth: 1372,
    }),
    [],
  );
});

test("touch-target acceptance requires actual 44px by 44px control rectangles", () => {
  const validate = runtimeSupport.touchTargetAcceptanceFailures ?? (() => ["touch-target validator unavailable"]);
  assert.deepEqual(validate({ width: 44, height: 44 }, "aircraft selector"), []);
  for (const [label, rect] of [
    ["narrow", { width: 43.99, height: 44 }],
    ["short", { width: 44, height: 43.99 }],
    ["missing width", { height: 44 }],
    ["non-finite height", { width: 44, height: Number.NaN }],
  ]) {
    assert.ok(validate(rect, "aircraft selector").length > 0, `${label} actual rectangle must fail closed`);
  }
});

test("desktop E.V.E. acceptance rejects undersized input and RUN rectangles", () => {
  const validate = runtimeSupport.desktopEveAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  for (const [label, rectName, mutation] of [
    ["input width", "input", { right: 473.99, width: 43.99 }],
    ["input height", "input", { bottom: 673.99, height: 43.99 }],
    ["RUN width", "runControl", { right: 923.99, width: 43.99 }],
    ["RUN height", "runControl", { bottom: 673.99, height: 43.99 }],
  ]) {
    const failures = validate({
      ...approvedDesktopEveScenario,
      [rectName]: { ...approvedDesktopEveScenario[rectName], ...mutation },
    });
    assert.ok(
      failures.some((failure) => /actual target.*44x44/i.test(failure)),
      `${label} must be rejected from its actual rectangle`,
    );
  }
});

test("desktop E.V.E. acceptance enforces the 10px critical telemetry floor", () => {
  const validate = runtimeSupport.desktopEveAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  assert.deepEqual(validate(approvedDesktopEveScenario), []);
  for (const fontSizes of [[9.99, 10], [10, 9.99], [10, Number.NaN], undefined]) {
    const failures = validate({ ...approvedDesktopEveScenario, criticalTelemetryFontSizesPx: fontSizes });
    assert.ok(
      failures.some((failure) => /critical telemetry.*10px/i.test(failure)),
      `font sizes ${String(fontSizes)} must fail closed`,
    );
  }
});

test("E.V.E. critical telemetry uses finite desktop and mobile viewport floors", () => {
  const validate =
    runtimeSupport.criticalTelemetryAcceptanceFailures ?? (() => ["critical-telemetry validator unavailable"]);
  for (const [viewportWidth, fontSizes] of [
    [1280, [10, 10]],
    [1440, [10, 10]],
    [320, [11, 11]],
    [390, [11, 11]],
  ]) {
    assert.deepEqual(validate(fontSizes, viewportWidth, "E.V.E."), []);
  }
  assert.ok(validate([10.99, 11], 320, "E.V.E.").some((failure) => /11px/.test(failure)));
  assert.ok(validate([11, 10.99], 390, "E.V.E.").some((failure) => /11px/.test(failure)));
  assert.ok(validate([9.99, 10], 1280, "E.V.E.").some((failure) => /10px/.test(failure)));
  assert.ok(validate(undefined, 320, "E.V.E.").length > 0, "missing telemetry evidence must fail closed");
  for (const viewportWidth of [undefined, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.ok(
      validate([10, 10], viewportWidth, "E.V.E.").some((failure) => /viewport width must be finite/i.test(failure)),
      `viewport ${String(viewportWidth)} must fail closed`,
    );
  }
});

test("flight telemetry runtime evidence is numeric and uses the desktop and mobile floors", () => {
  const validate = runtimeSupport.flightTelemetryAcceptanceFailures ?? (() => ["flight validator unavailable"]);
  assert.deepEqual(validate({ state: 10, progress: 10, now: 10 }, 1280), []);
  assert.deepEqual(validate({ state: 10, progress: 10, now: 10 }, 1440), []);
  assert.deepEqual(validate({ state: 11, progress: 11, now: 11 }, 320), []);
  assert.deepEqual(validate({ state: 11, progress: 11, now: 11 }, 390), []);
  for (const [label, viewportWidth, telemetry] of [
    ["desktop state", 1280, { state: 9.99, progress: 10, now: 10 }],
    ["mobile progress", 320, { state: 11, progress: 10.99, now: 11 }],
    ["mobile NOW", 390, { state: 11, progress: 11, now: 10.99 }],
    ["missing", 320, { state: 11, progress: 11 }],
    ["non-finite", 1280, { state: 10, progress: Number.NaN, now: 10 }],
    ["missing viewport", undefined, { state: 11, progress: 11, now: 11 }],
    ["NaN viewport", Number.NaN, { state: 11, progress: 11, now: 11 }],
    ["infinite viewport", Number.POSITIVE_INFINITY, { state: 11, progress: 11, now: 11 }],
  ]) {
    assert.ok(validate(telemetry, viewportWidth).length > 0, `${label} evidence must fail closed`);
  }
});

test("visible ticker telemetry uses finite desktop and mobile font floors", () => {
  const validate = runtimeSupport.tickerTelemetryAcceptanceFailures ?? (() => ["ticker validator unavailable"]);
  for (const scenario of [
    { viewportWidth: 1280, fontSizePx: 10, visible: true },
    { viewportWidth: 1440, fontSizePx: 10, visible: true },
    { viewportWidth: 320, fontSizePx: 11, visible: true },
    { viewportWidth: 390, fontSizePx: 11, visible: true },
  ]) {
    assert.deepEqual(validate(scenario), []);
  }
  for (const [label, scenario] of [
    ["desktop floor", { viewportWidth: 1280, fontSizePx: 9.99, visible: true }],
    ["mobile 320 floor", { viewportWidth: 320, fontSizePx: 10.99, visible: true }],
    ["mobile 390 floor", { viewportWidth: 390, fontSizePx: 10.99, visible: true }],
    ["hidden ticker", { viewportWidth: 1280, fontSizePx: 10, visible: false }],
    ["missing viewport", { fontSizePx: 11, visible: true }],
    ["NaN viewport", { viewportWidth: Number.NaN, fontSizePx: 11, visible: true }],
    ["missing value", { viewportWidth: 320, visible: true }],
    ["infinite value", { viewportWidth: 320, fontSizePx: Number.POSITIVE_INFINITY, visible: true }],
  ]) {
    assert.ok(validate(scenario).length > 0, `${label} evidence must fail closed`);
  }
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

test("visual obstruction evidence includes foreground glyphs and painted pseudo-elements", () => {
  const paints = runtimeSupport.visualPaintEvidence ?? (() => false);
  const transparent = {
    backgroundColor: "rgba(0, 0, 0, 0)",
    backgroundImage: "none",
    boxShadow: "none",
    color: "rgba(0, 0, 0, 0)",
    textShadow: "none",
    borderTopWidth: "0px",
    borderRightWidth: "0px",
    borderBottomWidth: "0px",
    borderLeftWidth: "0px",
    borderTopStyle: "none",
    borderRightStyle: "none",
    borderBottomStyle: "none",
    borderLeftStyle: "none",
    borderTopColor: "rgba(0, 0, 0, 0)",
    borderRightColor: "rgba(0, 0, 0, 0)",
    borderBottomColor: "rgba(0, 0, 0, 0)",
    borderLeftColor: "rgba(0, 0, 0, 0)",
  };

  assert.equal(paints({ ...transparent, color: "rgb(255, 255, 255)" }, true, []), true);
  assert.equal(paints({ ...transparent, textShadow: "rgb(255, 0, 0) 0px 0px 2px" }, true, []), true);
  assert.equal(paints(transparent, false, [{ ...transparent, content: '"WARNING"', color: "rgb(255, 0, 0)" }]), true);
  assert.equal(
    paints(transparent, false, [{ ...transparent, content: '""', backgroundColor: "rgb(255, 0, 0)" }]),
    true,
  );
  assert.equal(paints({ ...transparent, color: "rgb(255, 255, 255)" }, true, [], [{ opacity: "0" }]), false);
  assert.equal(paints(transparent, false, [{ ...transparent, content: "none" }]), false);
});

const normalMotionTransitions = {
  routing: { properties: ["all"], durationsMs: [500], delaysMs: [0] },
  hud: { properties: ["width"], durationsMs: [300], delaysMs: [0] },
  rail: { properties: ["width"], durationsMs: [300], delaysMs: [0] },
  pip: {
    properties: ["height", "background", "box-shadow", "width"],
    durationsMs: [280, 280, 280, 280],
    delaysMs: [0, 0, 0, 0],
  },
};

const reducedMotionTransitions = Object.fromEntries(
  Object.keys(normalMotionTransitions).map((name) => [name, { properties: ["none"], durationsMs: [0], delaysMs: [0] }]),
);

const motionStartRects = {
  routing: { width: 96, height: 6 },
  hud: { width: 200, height: 4 },
  rail: { width: 68, height: 900 },
  pip: { width: 14, height: 4 },
};

const motionIntermediateRects = {
  routing: { width: 180, height: 6 },
  hud: { width: 160, height: 4 },
  rail: { width: 100, height: 900 },
  pip: { width: 18, height: 5.5 },
};

const motionFinalRects = {
  routing: { width: 480, height: 6 },
  hud: { width: 80, height: 4 },
  rail: { width: 220, height: 900 },
  pip: { width: 26, height: 8 },
};

function motionSamples(rects, transitions) {
  return Object.fromEntries(
    Object.keys(normalMotionTransitions).map((name) => [
      name,
      { rect: { ...rects[name] }, transition: { ...transitions[name] } },
    ]),
  );
}

const approvedMotionPreferenceScenario = {
  interruptSettledWithinFrames: 2,
  pipTargetWasUnselected: true,
  pipTargetIsSelected: true,
  normalStart: motionSamples(motionStartRects, normalMotionTransitions),
  normalIntermediate: motionSamples(motionIntermediateRects, normalMotionTransitions),
  expectedFinal: structuredClone(motionFinalRects),
  reducedAfterInterrupt: motionSamples(motionFinalRects, reducedMotionTransitions),
  restoredSamples: [0, 16, 80, 180, 320, 470].map((atMs) => ({
    atMs,
    observedAtMs: atMs + 14,
    elements: motionSamples(motionFinalRects, normalMotionTransitions),
  })),
  reducedAgain: motionSamples(motionFinalRects, reducedMotionTransitions),
};

test("motion preference acceptance proves mid-transition interruption and samples the full restore window", () => {
  const validate = runtimeSupport.motionPreferenceAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  assert.deepEqual(validate(approvedMotionPreferenceScenario), []);
});

test("motion preference acceptance accepts a real subpixel intermediate pip frame", () => {
  const validate = runtimeSupport.motionPreferenceAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  const scenario = structuredClone(approvedMotionPreferenceScenario);
  scenario.normalIntermediate.pip.rect = { width: 24.640625, height: 7.546875 };

  assert.deepEqual(validate(scenario), []);
});

test("motion preference acceptance accepts a moving HUD frame after real scroll retargeting", () => {
  const validate = runtimeSupport.motionPreferenceAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  const scenario = structuredClone(approvedMotionPreferenceScenario);
  scenario.normalStart.hud.rect.width = 123.1875;
  scenario.normalIntermediate.hud.rect.width = 118.359375;
  scenario.expectedFinal.hud.width = 118.71875;
  scenario.reducedAfterInterrupt.hud.rect.width = 118.71875;
  scenario.reducedAgain.hud.rect.width = 118.71875;
  scenario.restoredSamples.forEach((sample) => {
    sample.elements.hud.rect.width = 118.71875;
  });

  assert.deepEqual(validate(scenario), []);
});

test("motion preference acceptance uses the synchronized scroll HUD target across restore and reduced-again", () => {
  const validate = runtimeSupport.motionPreferenceAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  const scenario = structuredClone(approvedMotionPreferenceScenario);
  scenario.normalStart.hud.rect.width = 114.234375;
  scenario.normalIntermediate.hud.rect.width = 105.5;
  scenario.expectedFinal.hud.width = 100.796875;
  scenario.reducedAfterInterrupt.hud.rect.width = 100.796875;
  scenario.reducedAgain.hud.rect.width = 100.796875;
  scenario.restoredSamples.forEach((sample) => {
    sample.elements.hud.rect.width = 100.796875;
  });

  assert.deepEqual(validate(scenario), []);

  const stalePreSyncTarget = structuredClone(scenario);
  stalePreSyncTarget.expectedFinal.hud.width = 109.75;
  const staleFailures = validate(stalePreSyncTarget);
  assert.ok(
    staleFailures.some((failure) => /hud must retain final geometry|hud must not replay stale geometry/.test(failure)),
    "the stale pre-synchronization 49% target must fail against canonical 45% observations",
  );
});

test("motion preference acceptance rejects delayed-only restore evidence and non-semantic geometry", () => {
  const validate = runtimeSupport.motionPreferenceAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  const scenario = structuredClone(approvedMotionPreferenceScenario);
  scenario.restoredSamples = [{ atMs: 600, elements: scenario.restoredSamples.at(-1).elements }];
  scenario.normalIntermediate.pip.rect = { width: 0, height: 0 };
  scenario.reducedAfterInterrupt.hud.transition.properties = ["width"];
  scenario.pipTargetWasUnselected = false;
  const failures = validate(scenario);

  assert.ok(failures.some((failure) => /restore samples must start immediately/.test(failure)));
  assert.ok(failures.some((failure) => /restore samples must cover the first 500ms/.test(failure)));
  assert.ok(failures.some((failure) => /pip normal-intermediate rectangle must be finite and nonzero/.test(failure)));
  assert.ok(
    failures.some((failure) => /hud reduced-after-interrupt transition property must equal none/.test(failure)),
  );
  assert.ok(failures.some((failure) => /pip target must begin unselected and become selected/.test(failure)));
});

test("motion preference acceptance rejects restore captures outside their scheduled timing tolerance", () => {
  const validate = runtimeSupport.motionPreferenceAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  const scenario = structuredClone(approvedMotionPreferenceScenario);
  scenario.restoredSamples = [0, 16, 80, 180, 320, 470].map((atMs) => ({
    atMs,
    observedAtMs: atMs + 20,
    elements: motionSamples(motionFinalRects, normalMotionTransitions),
  }));
  scenario.restoredSamples[3].observedAtMs = 400;

  const failures = validate(scenario);

  assert.ok(failures.some((failure) => /observed restore timing/.test(failure)));
});

test("motion preference acceptance preserves the scheduled restore timestamps separately from observation", () => {
  const validate = runtimeSupport.motionPreferenceAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  const scenario = structuredClone(approvedMotionPreferenceScenario);
  scenario.restoredSamples.forEach((sample) => {
    sample.atMs = sample.observedAtMs;
  });

  const failures = validate(scenario);

  assert.ok(failures.some((failure) => /scheduled restore timestamps/.test(failure)));
});

test("transition normalization repeats duration and delay lists for every effective pip property", () => {
  const normalize = runtimeSupport.normalizeMotionTransitionLists ?? (() => null);
  assert.deepEqual(normalize("height, background, box-shadow, width", "280ms", "0s"), {
    properties: ["height", "background", "box-shadow", "width"],
    durationsMs: [280, 280, 280, 280],
    delaysMs: [0, 0, 0, 0],
  });
});

test("motion preference acceptance identifies one incorrect effective pip transition tuple", () => {
  const validate = runtimeSupport.motionPreferenceAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  const scenario = structuredClone(approvedMotionPreferenceScenario);
  scenario.normalStart.pip.transition = {
    properties: ["height", "background", "box-shadow", "width"],
    durationsMs: [280, 280, 600, 280],
    delaysMs: [0, 0, 0, 0],
  };

  const failures = validate(scenario);

  assert.ok(
    failures.some((failure) => /pip normal-start box-shadow transition duration must equal 280ms/.test(failure)),
  );
});

test("browser version acceptance is optional locally and fail-closed when Chrome 147 is requested", () => {
  const validate = runtimeSupport.browserVersionAcceptanceFailures ?? (() => ["acceptance validator unavailable"]);
  const chrome147 = { product: "Chrome/147.0.7727.57", userAgent: "HeadlessChrome/147.0.0.0" };

  assert.deepEqual(validate(chrome147), []);
  assert.deepEqual(validate(chrome147, "147"), []);
  assert.ok(
    validate({ ...chrome147, product: "Chrome/152.0.0.0" }, "147").some((failure) => /Chrome 147/.test(failure)),
  );
  assert.ok(validate(chrome147, "not-a-major").some((failure) => /positive integer/.test(failure)));
});

function validitySurface(left, width, labelWidth = width - 24) {
  return {
    rect: { left, right: left + width, top: 12, bottom: 56, width, height: 44 },
    label: {
      ariaHidden: false,
      clientWidth: labelWidth,
      scrollWidth: labelWidth,
      rect: { left: left + 12, right: left + 12 + labelWidth, top: 12, bottom: 56, width: labelWidth, height: 44 },
      display: "block",
      visibility: "visible",
      overflowX: "visible",
      textOverflow: "clip",
    },
    siblings: [
      {
        name: "audio",
        rect: { left: left + width + 8, right: left + width + 52, top: 12, bottom: 56, width: 44, height: 44 },
      },
    ],
  };
}

function validValidityGeometryMatrix() {
  const labels = ["EXPORT STATUS · DATED", "EXPORT VALID · 30D LEFT", "EXPORT VALID · 1D LEFT", "EXPORT EXPIRED"];
  return [768, 834, 1024, 1280].flatMap((viewportWidth) =>
    [false, true].flatMap((railOpen) =>
      [false, true].map((tour) => ({
        viewportWidth,
        railOpen,
        tour,
        samples: labels.map((label) => ({
          label,
          header: validitySurface(viewportWidth - 300, 180),
          footer: validitySurface(240, 150),
        })),
      })),
    ),
  );
}

test("validity geometry acceptance covers every supported width, rail, flight, and label state", () => {
  const validate = runtimeSupport.validityGeometryAcceptanceFailures ?? (() => ["validator unavailable"]);
  assert.deepEqual(validate(withFullValidityEvidence()), []);
});

test("validity geometry acceptance rejects overflow, inaccessible text, overlap, escape, and label shift", () => {
  const validate = runtimeSupport.validityGeometryAcceptanceFailures ?? (() => ["validator unavailable"]);
  const matrix = withFullValidityEvidence();
  matrix[0].samples[0].header.label.scrollWidth += 1;
  matrix[1].samples[0].footer.label.ariaHidden = true;
  const overlappingAudio = matrix[2].samples[0].header.siblings.find((sibling) => sibling.name === "audio");
  overlappingAudio.rect.left -= 9;
  overlappingAudio.rect.right -= 9;
  matrix[3].samples[0].footer.rect.left = -1;
  matrix[3].samples[0].footer.rect.right = 149;
  matrix[4].samples[1].header.rect.width += 1;
  matrix[4].samples[1].header.rect.right += 1;

  const failures = validate(matrix);
  assert.ok(failures.some((failure) => /header label must not overflow/.test(failure)));
  assert.ok(failures.some((failure) => /footer label must remain accessible/.test(failure)));
  assert.ok(failures.some((failure) => /header must not overlap audio/.test(failure)));
  assert.ok(failures.some((failure) => /footer must remain within the viewport/.test(failure)));
  assert.ok(failures.some((failure) => /header geometry must stay fixed/.test(failure)));
});

const fullValidityTuples = [
  {
    id: "ssr-placeholder",
    source: "ssr-fixture",
    headerLabel: "EXPORT STATUS · DATED",
    footerLabel: "DATED EXPORT STATUS",
    validThroughText: "VALID THRU 09-30-2026",
  },
  {
    id: "live-longest",
    source: "react-live",
    headerLabel: "EXPORT VALID · 30D LEFT",
    footerLabel: "DATED EXPORT VALID",
    validThroughText: "VALID THRU 09-30-2026",
  },
  {
    id: "live-1d",
    source: "react-live",
    headerLabel: "EXPORT VALID · 1D LEFT",
    footerLabel: "DATED EXPORT VALID",
    validThroughText: "VALID THRU 09-30-2026",
  },
  {
    id: "live-expired",
    source: "react-live",
    headerLabel: "EXPORT EXPIRED",
    footerLabel: "DATED EXPORT EXPIRED",
    validThroughText: "VALID THRU TREAT AS HISTORY",
  },
];

function withFullValidityEvidence(matrix = validValidityGeometryMatrix()) {
  for (const state of matrix) {
    state.samples.forEach((sample, index) => {
      const deckRight = sample.header.rect.left - (state.tour ? 106 : 8);
      sample.fullState = { ...fullValidityTuples[index] };
      sample.identities = {
        header: [
          {
            name: "validity",
            visible: true,
            accessibleText: sample.fullState.headerLabel,
            rect: { ...sample.header.rect },
          },
          {
            name: "audio",
            visible: true,
            accessibleText: "Arm selection audio · AUDIO OFF",
            rect: { ...sample.header.siblings[0].rect },
          },
          {
            name: "navigator",
            visible: true,
            accessibleText: "Open deck navigator",
            rect: {
              left: state.viewportWidth - 60,
              right: state.viewportWidth - 16,
              top: 12,
              bottom: 56,
              width: 44,
              height: 44,
            },
          },
          {
            name: "deck",
            visible: true,
            accessibleText: "DECK 01 · SNAPSHOT",
            rect: {
              left: deckRight - 100,
              right: deckRight,
              top: 12,
              bottom: 56,
              width: 100,
              height: 44,
            },
          },
        ],
        footer: [
          {
            name: "release",
            visible: true,
            accessibleText: 'V35 "ALL TENS"',
            rect: { left: 20, right: 100, top: 12, bottom: 27, width: 80, height: 15 },
          },
          {
            name: "revised",
            visible: true,
            accessibleText: "REVISED 08-31-2026",
            rect: { left: 110, right: 230, top: 12, bottom: 27, width: 120, height: 15 },
          },
          {
            name: "validity",
            visible: true,
            accessibleText: sample.fullState.footerLabel,
            rect: { ...sample.footer.rect },
          },
          {
            name: "verified",
            visible: true,
            accessibleText: "FIGURES VERIFIED 31 August 2026",
            rect: { left: 400, right: 580, top: 12, bottom: 27, width: 180, height: 15 },
          },
          {
            name: "valid-through",
            visible: true,
            accessibleText: sample.fullState.validThroughText,
            rect: { left: 20, right: 170, top: 60, bottom: 75, width: 150, height: 15 },
          },
          {
            name: "zero-calls",
            visible: true,
            accessibleText: "ZERO INFRASTRUCTURE CALLS",
            rect: { left: 180, right: 350, top: 60, bottom: 75, width: 170, height: 15 },
          },
        ],
      };
      if (state.viewportWidth >= 1024) {
        sample.identities.header.push({
          name: "clock",
          visible: true,
          accessibleText: "SD 2026243.1",
          rect: { left: deckRight - 198, right: deckRight - 108, top: 12, bottom: 56, width: 90, height: 44 },
        });
      }
      if (state.viewportWidth >= 1280) {
        sample.identities.header.push({
          name: "airframe-status",
          visible: true,
          accessibleText: "Airframe status",
          rect: { left: 20, right: 300, top: 12, bottom: 56, width: 280, height: 44 },
        });
      }
      if (state.tour) {
        sample.identities.header.push({
          name: "autopilot",
          visible: true,
          accessibleText: "AUTOPILOT",
          rect: {
            left: sample.header.rect.left - 98,
            right: sample.header.rect.left - 8,
            top: 12,
            bottom: 56,
            width: 90,
            height: 44,
          },
        });
      }
      sample.header.siblings = sample.identities.header.filter((identity) => identity.name !== "validity");
      sample.footer.siblings = sample.identities.footer.filter((identity) => identity.name !== "validity");
    });
  }
  return matrix;
}

test("validity geometry acceptance rejects an incorrect or incomplete full state tuple", () => {
  const validate = runtimeSupport.validityGeometryAcceptanceFailures ?? (() => ["validator unavailable"]);
  const matrix = withFullValidityEvidence();
  matrix[0].samples[0].fullState.footerLabel = "DATED EXPORT VALID";
  matrix[1].samples[3].fullState.validThroughText = "VALID THRU 09-30-2026";
  const failures = validate(matrix);
  assert.ok(failures.some((failure) => /SSR placeholder full validity tuple/.test(failure)));
  assert.ok(failures.some((failure) => /expired full validity tuple/.test(failure)));
});

test("validity geometry acceptance rejects missing, hidden, zero-sized, escaped, or overlapping required identities", () => {
  const validate = runtimeSupport.validityGeometryAcceptanceFailures ?? (() => ["validator unavailable"]);
  const matrix = withFullValidityEvidence();
  matrix[0].samples[0].identities.header = matrix[0].samples[0].identities.header.filter(
    (identity) => identity.name !== "audio",
  );
  matrix[1].samples[0].identities.header.find((identity) => identity.name === "navigator").visible = false;
  const clock = matrix
    .find((state) => state.viewportWidth === 1024)
    .samples[0].identities.header.find((identity) => identity.name === "clock");
  clock.rect.width = 0;
  clock.rect.right = clock.rect.left;
  const escaped = matrix[3].samples[0].identities.footer.find((identity) => identity.name === "valid-through");
  escaped.rect.left = 769;
  escaped.rect.right = 919;
  const overlap = matrix[4].samples[0].identities.header.find((identity) => identity.name === "audio");
  overlap.rect.left = matrix[4].samples[0].header.rect.right - 1;
  overlap.rect.right = overlap.rect.left + overlap.rect.width;

  const failures = validate(matrix);
  assert.ok(failures.some((failure) => /required header identity audio must be present/.test(failure)));
  assert.ok(failures.some((failure) => /navigator must remain visible and accessible/.test(failure)));
  assert.ok(failures.some((failure) => /clock must have nonzero finite geometry/.test(failure)));
  assert.ok(failures.some((failure) => /valid-through must remain within the viewport/.test(failure)));
  assert.ok(failures.some((failure) => /validity must not overlap audio/.test(failure)));
});

test("validity geometry stability uses local layout while retaining absolute viewport evidence", () => {
  const validate = runtimeSupport.validityGeometryAcceptanceFailures ?? (() => ["validator unavailable"]);
  const matrix = withFullValidityEvidence();
  const state = matrix[0];
  for (const sample of state.samples) {
    sample.footer.stabilityRect = { ...sample.footer.rect };
    sample.identities.footer.forEach((identity) => {
      identity.stabilityRect = { ...identity.rect };
    });
    sample.footer.siblings.forEach((sibling) => {
      sibling.stabilityRect = { ...sibling.rect };
    });
  }
  const translated = state.samples[1];
  for (const evidence of [
    translated.footer,
    translated.footer.label,
    ...translated.identities.footer,
    ...translated.footer.siblings,
  ]) {
    evidence.rect.top += 20;
    evidence.rect.bottom += 20;
  }
  assert.deepEqual(validate(matrix), []);

  translated.identities.footer.find((identity) => identity.name === "valid-through").stabilityRect.width += 1;
  assert.ok(validate(matrix).some((failure) => /footer identity valid-through geometry must stay fixed/.test(failure)));
});
