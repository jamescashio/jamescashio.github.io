import { rm } from "node:fs/promises";
import WebSocket from "ws";

/** Distance from the bottom of the viewport to the mobile flight control,
 * matching `bottom-[calc(env(safe-area-inset-bottom,0px)+4.25rem)]` in the tree. */
const MOBILE_FLIGHT_BOTTOM_OFFSET_PX = 20;

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

export function browserExitDiagnostic(code, signal, stderr) {
  const outcome = signal ? `signal ${signal}` : `code ${code ?? "unknown"}`;
  const stderrTail = String(stderr ?? "")
    .trim()
    .slice(-4_096);
  return `browser exited before layout verification (${outcome})${stderrTail ? `\nChrome stderr:\n${stderrTail}` : ""}`;
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
  if (browser && browser.exitCode == null && browser.signalCode == null) {
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

const MOTION_ELEMENTS = ["routing", "hud", "rail", "pip"];
const MOTION_NORMAL_TRANSITIONS = {
  routing: { properties: ["all"], durationsMs: [500], delaysMs: [0] },
  hud: { properties: ["width"], durationsMs: [300], delaysMs: [0] },
  rail: { properties: ["width"], durationsMs: [300], delaysMs: [0] },
  pip: {
    properties: ["height", "background", "box-shadow", "width"],
    durationsMs: [280, 280, 280, 280],
    delaysMs: [0, 0, 0, 0],
  },
};
const MOTION_DIMENSIONS = { routing: ["width"], hud: ["width"], rail: ["width"], pip: ["width", "height"] };
const MOTION_GEOMETRY_TOLERANCE_PX = 0.5;
const MOTION_INTERMEDIATE_EPSILON_PX = 0.01;
const MOTION_RESTORE_SCHEDULE_MS = [0, 16, 80, 180, 320, 470];

function hasFiniteNonzeroMotionRect(rect) {
  return (
    rect != null && Number.isFinite(rect.width) && rect.width > 0 && Number.isFinite(rect.height) && rect.height > 0
  );
}

export function normalizeMotionTransitionLists(propertiesValue, durationsValue, delaysValue) {
  const tokens = (value) =>
    String(value ?? "")
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean);
  const toMilliseconds = (token) => {
    const parsed = Number.parseFloat(token);
    if (!Number.isFinite(parsed)) return Number.NaN;
    return token.toLowerCase().endsWith("ms") ? parsed : parsed * 1_000;
  };
  const properties = tokens(propertiesValue);
  const durations = tokens(durationsValue).map(toMilliseconds);
  const delays = tokens(delaysValue).map(toMilliseconds);
  return {
    properties,
    durationsMs: properties.map((_, index) => durations[index % durations.length]),
    delaysMs: properties.map((_, index) => delays[index % delays.length]),
  };
}

function motionTransitionFailures(name, phase, transition, expected) {
  const failures = [];
  const properties = transition?.properties;
  const durationsMs = transition?.durationsMs;
  const delaysMs = transition?.delaysMs;
  if (!Array.isArray(properties) || properties.length !== expected.properties.length) {
    failures.push(`${name} ${phase} transition property must equal ${expected.properties.join(", ")}`);
  } else if (properties.some((property, index) => property !== expected.properties[index])) {
    failures.push(`${name} ${phase} transition property must equal ${expected.properties.join(", ")}`);
  }
  if (!Array.isArray(durationsMs) || durationsMs.length !== expected.properties.length) {
    failures.push(`${name} ${phase} transition duration list must cover every effective property`);
  }
  if (!Array.isArray(delaysMs) || delaysMs.length !== expected.properties.length) {
    failures.push(`${name} ${phase} transition delay list must cover every effective property`);
  }
  for (const [index, property] of expected.properties.entries()) {
    if (durationsMs?.[index] !== expected.durationsMs[index]) {
      failures.push(`${name} ${phase} ${property} transition duration must equal ${expected.durationsMs[index]}ms`);
    }
    if (delaysMs?.[index] !== expected.delaysMs[index]) {
      failures.push(`${name} ${phase} ${property} transition delay must equal ${expected.delaysMs[index]}ms`);
    }
  }
  return failures;
}

function motionSampleFailures(name, phase, sample, expectedTransition) {
  const failures = [];
  if (!hasFiniteNonzeroMotionRect(sample?.rect)) {
    failures.push(`${name} ${phase} rectangle must be finite and nonzero`);
  }
  failures.push(...motionTransitionFailures(name, phase, sample?.transition, expectedTransition));
  return failures;
}

function motionRectMatches(actual, expected) {
  return (
    hasFiniteNonzeroMotionRect(actual) &&
    hasFiniteNonzeroMotionRect(expected) &&
    Math.abs(actual.width - expected.width) <= MOTION_GEOMETRY_TOLERANCE_PX &&
    Math.abs(actual.height - expected.height) <= MOTION_GEOMETRY_TOLERANCE_PX
  );
}

export function motionPreferenceAcceptanceFailures(scenario) {
  const failures = [];
  if (scenario?.pipTargetWasUnselected !== true || scenario?.pipTargetIsSelected !== true) {
    failures.push("pip target must begin unselected and become selected through its real control");
  }
  if (
    !Number.isInteger(scenario?.interruptSettledWithinFrames) ||
    scenario.interruptSettledWithinFrames < 1 ||
    scenario.interruptSettledWithinFrames > 2
  ) {
    failures.push("normal-to-reduced interruption must settle within two animation frames");
  }

  for (const name of MOTION_ELEMENTS) {
    const expectedNormal = MOTION_NORMAL_TRANSITIONS[name];
    const expectedReduced = { properties: ["none"], durationsMs: [0], delaysMs: [0] };
    failures.push(...motionSampleFailures(name, "normal-start", scenario?.normalStart?.[name], expectedNormal));
    failures.push(
      ...motionSampleFailures(name, "normal-intermediate", scenario?.normalIntermediate?.[name], expectedNormal),
    );
    failures.push(
      ...motionSampleFailures(
        name,
        "reduced-after-interrupt",
        scenario?.reducedAfterInterrupt?.[name],
        expectedReduced,
      ),
    );
    failures.push(...motionSampleFailures(name, "reduced-again", scenario?.reducedAgain?.[name], expectedReduced));

    const startRect = scenario?.normalStart?.[name]?.rect;
    const intermediateRect = scenario?.normalIntermediate?.[name]?.rect;
    const finalRect = scenario?.expectedFinal?.[name];
    if (!hasFiniteNonzeroMotionRect(finalRect))
      failures.push(`${name} expected-final rectangle must be finite and nonzero`);
    for (const dimension of MOTION_DIMENSIONS[name]) {
      const start = startRect?.[dimension];
      const intermediate = intermediateRect?.[dimension];
      const final = finalRect?.[dimension];
      if (
        !Number.isFinite(start) ||
        !Number.isFinite(intermediate) ||
        !Number.isFinite(final) ||
        Math.abs(start - final) <= MOTION_INTERMEDIATE_EPSILON_PX * 2 ||
        Math.abs(intermediate - start) <= MOTION_INTERMEDIATE_EPSILON_PX ||
        Math.abs(intermediate - final) <= MOTION_INTERMEDIATE_EPSILON_PX
      ) {
        failures.push(`${name} ${dimension} must be visibly intermediate under normal motion`);
      }
    }
    if (!motionRectMatches(scenario?.reducedAfterInterrupt?.[name]?.rect, finalRect)) {
      failures.push(`${name} must reach final geometry within two reduced-motion frames`);
    }
    if (!motionRectMatches(scenario?.reducedAgain?.[name]?.rect, finalRect)) {
      failures.push(`${name} must retain final geometry on the second reduced-motion change`);
    }
  }

  const restoredSamples = scenario?.restoredSamples;
  if (
    !Array.isArray(restoredSamples) ||
    restoredSamples.length !== MOTION_RESTORE_SCHEDULE_MS.length ||
    restoredSamples.some((sample, index) => sample?.atMs !== MOTION_RESTORE_SCHEDULE_MS[index])
  ) {
    failures.push("scheduled restore timestamps must remain exactly 0, 16, 80, 180, 320, and 470ms");
  }
  if (!Array.isArray(restoredSamples) || restoredSamples.length === 0 || restoredSamples[0]?.atMs !== 0) {
    failures.push("restore samples must start immediately at 0ms");
  }
  if (
    !Array.isArray(restoredSamples) ||
    restoredSamples.length < 4 ||
    !restoredSamples.some((sample) => sample.atMs > 0 && sample.atMs < 100) ||
    !restoredSamples.some((sample) => sample.atMs >= 100 && sample.atMs < 500) ||
    !restoredSamples.some((sample) => sample.atMs >= 450 && sample.atMs <= 500)
  ) {
    failures.push("restore samples must cover the first 500ms, including early, middle, and late observations");
  }
  if (Array.isArray(restoredSamples)) {
    let previousTime = -1;
    let previousObservedTime = -1;
    for (const sample of restoredSamples) {
      if (!Number.isFinite(sample?.atMs) || sample.atMs < previousTime || sample.atMs < 0 || sample.atMs > 500) {
        failures.push("restore sample times must be finite, ordered, and within 0-500ms");
      }
      previousTime = sample?.atMs;
      if (
        !Number.isFinite(sample?.observedAtMs) ||
        sample.observedAtMs < sample.atMs - 2 ||
        sample.observedAtMs > sample.atMs + 120 ||
        sample.observedAtMs < previousObservedTime
      ) {
        failures.push("observed restore timing must be ordered and within 2ms early to 120ms late of each schedule");
      }
      previousObservedTime = sample?.observedAtMs;
      for (const name of MOTION_ELEMENTS) {
        failures.push(
          ...motionSampleFailures(
            name,
            `normal-restored-${sample?.atMs}ms`,
            sample?.elements?.[name],
            MOTION_NORMAL_TRANSITIONS[name],
          ),
        );
        if (!motionRectMatches(sample?.elements?.[name]?.rect, scenario?.expectedFinal?.[name])) {
          failures.push(
            `${name} must not replay stale geometry during the first 500ms after normal motion is restored`,
          );
        }
      }
    }
  }
  return failures;
}

export function browserVersionAcceptanceFailures(version, expectedMajorValue) {
  if (expectedMajorValue == null || expectedMajorValue === "") return [];
  const expectedMajor = Number(expectedMajorValue);
  if (!Number.isInteger(expectedMajor) || expectedMajor <= 0) {
    return ["expected browser major must be a positive integer"];
  }
  const product = String(version?.product ?? "");
  const match = product.match(/(?:Chrome|HeadlessChrome)\/(\d+)(?:\.|$)/);
  if (!match) return [`Browser.getVersion must report Chrome ${expectedMajor}; received ${product || "no product"}`];
  if (Number(match[1]) !== expectedMajor) {
    return [`Browser.getVersion must report Chrome ${expectedMajor}; received ${product}`];
  }
  return [];
}

const VALIDITY_VIEWPORT_WIDTHS = [768, 834, 1024, 1280];
const VALIDITY_LABELS = [
  "EXPORT STATUS · DATED",
  "EXPORT VALID · 29D LEFT",
  "EXPORT VALID · 1D LEFT",
  "EXPORT EXPIRED",
];
const FULL_VALIDITY_STATES = [
  {
    id: "ssr-placeholder",
    description: "SSR placeholder",
    source: "ssr-fixture",
    headerLabel: "EXPORT STATUS · DATED",
    footerLabel: "DATED EXPORT STATUS",
    validThroughText: "VALID THRU 09-27-2026",
  },
  {
    id: "live-longest",
    description: "longest valid",
    source: "react-live",
    headerLabel: "EXPORT VALID · 29D LEFT",
    footerLabel: "DATED EXPORT VALID",
    validThroughText: "VALID THRU 09-27-2026",
  },
  {
    id: "live-1d",
    description: "1D valid",
    source: "react-live",
    headerLabel: "EXPORT VALID · 1D LEFT",
    footerLabel: "DATED EXPORT VALID",
    validThroughText: "VALID THRU 09-27-2026",
  },
  {
    id: "live-expired",
    description: "expired",
    source: "react-live",
    headerLabel: "EXPORT EXPIRED",
    footerLabel: "DATED EXPORT EXPIRED",
    validThroughText: "VALID THRU TREAT AS HISTORY",
  },
];
const VALIDITY_GEOMETRY_TOLERANCE_PX = 0.5;

function validityRectsOverlap(first, second) {
  return (
    first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top
  );
}

function validityRectMatches(first, second) {
  return (
    hasFiniteRect(first) &&
    hasFiniteRect(second) &&
    RECT_FIELDS.every((property) => Math.abs(first[property] - second[property]) <= VALIDITY_GEOMETRY_TOLERANCE_PX)
  );
}

function validityStabilityRect(evidence) {
  return evidence?.stabilityRect ?? evidence?.rect;
}

function validitySurfaceFailures(surface, surfaceName, viewportWidth, stateName) {
  const failures = [];
  if (!hasFiniteRect(surface?.rect) || !hasConsistentRect(surface.rect)) {
    failures.push(`${stateName} ${surfaceName} must provide a finite consistent rectangle`);
    return failures;
  }
  if (surface.rect.left < 0 || surface.rect.right > viewportWidth) {
    failures.push(`${stateName} ${surfaceName} must remain within the viewport`);
  }
  const label = surface.label;
  if (
    !Number.isFinite(label?.clientWidth) ||
    !Number.isFinite(label?.scrollWidth) ||
    label.clientWidth <= 0 ||
    label.scrollWidth <= 0 ||
    label.scrollWidth > label.clientWidth + VALIDITY_GEOMETRY_TOLERANCE_PX
  ) {
    failures.push(`${stateName} ${surfaceName} label must not overflow`);
  }
  if (
    !hasFiniteRect(label?.rect) ||
    !hasConsistentRect(label.rect) ||
    label.rect.left < surface.rect.left - VALIDITY_GEOMETRY_TOLERANCE_PX ||
    label.rect.right > surface.rect.right + VALIDITY_GEOMETRY_TOLERANCE_PX ||
    label.rect.top < surface.rect.top - VALIDITY_GEOMETRY_TOLERANCE_PX ||
    label.rect.bottom > surface.rect.bottom + VALIDITY_GEOMETRY_TOLERANCE_PX
  ) {
    failures.push(`${stateName} ${surfaceName} label must remain contained without clipping`);
  }
  if (
    label?.ariaHidden === true ||
    label?.display === "none" ||
    ["hidden", "collapse"].includes(label?.visibility) ||
    ["hidden", "clip"].includes(label?.overflowX) ||
    label?.textOverflow === "ellipsis" ||
    Number(label?.opacity) === 0
  ) {
    failures.push(`${stateName} ${surfaceName} label must remain accessible without clipping or ellipsis`);
  }
  if (!Array.isArray(surface.siblings)) {
    failures.push(`${stateName} ${surfaceName} siblings must be enumerated`);
  } else {
    for (const sibling of surface.siblings) {
      if (!hasFiniteRect(sibling?.rect) || !hasConsistentRect(sibling.rect)) {
        failures.push(`${stateName} ${surfaceName} sibling ${sibling?.name ?? "unknown"} must have finite geometry`);
      } else if (validityRectsOverlap(surface.rect, sibling.rect)) {
        failures.push(`${stateName} ${surfaceName} must not overlap ${sibling.name ?? "an adjacent sibling"}`);
      }
    }
  }
  return failures;
}

function expectedValidityIdentityNames(state, surfaceName) {
  if (surfaceName === "footer") {
    return ["release", "revised", "validity", "verified", "valid-through", "zero-calls"];
  }
  const names = ["deck", "validity", "audio", "navigator"];
  if (state.viewportWidth >= 1024) names.push("clock");
  if (state.viewportWidth >= 1280) names.push("airframe-status");
  if (state.tour) names.push("autopilot");
  return names;
}

function validityIdentityFailures(identities, expectedNames, surfaceName, viewportWidth, stateName) {
  const failures = [];
  const evidence = Array.isArray(identities) ? identities : [];
  const accepted = [];
  for (const name of expectedNames) {
    const matches = evidence.filter((identity) => identity?.name === name);
    if (matches.length !== 1) {
      failures.push(`${stateName} required ${surfaceName} identity ${name} must be present exactly once`);
      continue;
    }
    const identity = matches[0];
    if (identity.visible !== true || identity.ariaHidden === true || !String(identity.accessibleText ?? "").trim()) {
      failures.push(`${stateName} ${surfaceName} identity ${name} must remain visible and accessible`);
    }
    if (
      !hasFiniteRect(identity.rect) ||
      !hasConsistentRect(identity.rect) ||
      identity.rect.width <= 0 ||
      identity.rect.height <= 0
    ) {
      failures.push(`${stateName} ${surfaceName} identity ${name} must have nonzero finite geometry`);
      continue;
    }
    if (identity.rect.left < 0 || identity.rect.right > viewportWidth) {
      failures.push(`${stateName} ${surfaceName} identity ${name} must remain within the viewport`);
    }
    accepted.push(identity);
  }
  for (const [index, first] of accepted.entries()) {
    for (const second of accepted.slice(index + 1)) {
      if (validityRectsOverlap(first.rect, second.rect)) {
        failures.push(`${stateName} ${surfaceName} ${first.name} must not overlap ${second.name}`);
      }
    }
  }
  return failures;
}

export function validityGeometryAcceptanceFailures(states) {
  const failures = [];
  const expectedStates = VALIDITY_VIEWPORT_WIDTHS.flatMap((viewportWidth) =>
    [false, true].flatMap((railOpen) =>
      [false, true].map((tour) => `${viewportWidth}:${railOpen ? "open" : "stowed"}:${tour ? "active" : "inactive"}`),
    ),
  );
  const stateKeys = Array.isArray(states)
    ? states.map(
        (state) =>
          `${state?.viewportWidth}:${state?.railOpen ? "open" : "stowed"}:${state?.tour ? "active" : "inactive"}`,
      )
    : [];
  if (
    stateKeys.length !== expectedStates.length ||
    expectedStates.some((expected) => stateKeys.filter((key) => key === expected).length !== 1)
  ) {
    failures.push("validity geometry must cover 768, 834, 1024, and 1280 with each rail and flight state exactly once");
  }
  for (const state of states ?? []) {
    const stateName = `${state.viewportWidth}px ${state.railOpen ? "open rail" : "stowed rail"} ${state.tour ? "active flight" : "inactive flight"}`;
    if (
      !Array.isArray(state.samples) ||
      state.samples.length !== VALIDITY_LABELS.length ||
      VALIDITY_LABELS.some((label) => state.samples.filter((sample) => sample?.label === label).length !== 1)
    ) {
      failures.push(`${stateName} must cover the placeholder, longest valid, 1D, and expired labels exactly once`);
      continue;
    }
    const baseline = state.samples[0];
    for (const expected of FULL_VALIDITY_STATES) {
      const matches = state.samples.filter((sample) => sample?.fullState?.id === expected.id);
      const fullState = matches[0]?.fullState;
      if (
        matches.length !== 1 ||
        Object.entries(expected).some(
          ([property, value]) => property !== "description" && fullState?.[property] !== value,
        ) ||
        matches[0]?.label !== expected.headerLabel
      ) {
        failures.push(`${stateName} ${expected.description} full validity tuple must be exact and complete`);
      }
    }
    for (const sample of state.samples) {
      for (const surfaceName of ["header", "footer"]) {
        const surface = sample[surfaceName];
        failures.push(...validitySurfaceFailures(surface, surfaceName, state.viewportWidth, stateName));
        const expectedNames = expectedValidityIdentityNames(state, surfaceName);
        const identities = sample.identities?.[surfaceName];
        failures.push(
          ...validityIdentityFailures(identities, expectedNames, surfaceName, state.viewportWidth, stateName),
        );
        if (!validityRectMatches(validityStabilityRect(surface), validityStabilityRect(baseline[surfaceName]))) {
          failures.push(`${stateName} ${surfaceName} geometry must stay fixed across validity labels`);
        }
        const baselineIdentities = baseline.identities?.[surfaceName] ?? [];
        for (const name of expectedNames) {
          const identity = identities?.find((candidate) => candidate.name === name);
          const original = baselineIdentities.find((candidate) => candidate.name === name);
          if (
            !identity ||
            !original ||
            !validityRectMatches(validityStabilityRect(identity), validityStabilityRect(original))
          ) {
            failures.push(`${stateName} ${surfaceName} identity ${name} geometry must stay fixed across states`);
          }
        }
        const baselineSiblings = baseline[surfaceName]?.siblings ?? [];
        for (const sibling of surface?.siblings ?? []) {
          const original = baselineSiblings.find((candidate) => candidate.name === sibling.name);
          if (!original || !validityRectMatches(validityStabilityRect(sibling), validityStabilityRect(original))) {
            failures.push(`${stateName} ${surfaceName} sibling ${sibling.name} geometry must stay fixed across labels`);
          }
        }
      }
    }
  }
  return failures;
}

export function visualPaintEvidence(style, hasText, pseudoStyles, ancestorStyles) {
  const colorPaints = (color) => {
    if (!color || color === "transparent") return false;
    const match = color.match(/^rgba?\((.*)\)$/);
    if (!match) return true;
    const channels = match[1].split(/[\s,/]+/).filter(Boolean);
    return channels.length < 4 || Number(channels[3]) > 0;
  };
  const boxPaints = (candidate) => {
    const borderPaints = ["Top", "Right", "Bottom", "Left"].some(
      (side) =>
        Number.parseFloat(candidate?.["border" + side + "Width"]) > 0 &&
        candidate?.["border" + side + "Style"] !== "none" &&
        colorPaints(candidate?.["border" + side + "Color"]),
    );
    return (
      colorPaints(candidate?.backgroundColor) ||
      (candidate?.backgroundImage && candidate.backgroundImage !== "none") ||
      (candidate?.boxShadow && candidate.boxShadow !== "none") ||
      borderPaints
    );
  };
  const foregroundPaints = (candidate, textPresent) =>
    Boolean(textPresent) &&
    (colorPaints(candidate?.color) || (candidate?.textShadow && candidate.textShadow !== "none"));

  const transparentAncestor = (ancestorStyles ?? []).some(
    (ancestor) => Number.parseFloat(ancestor?.opacity ?? "1") === 0,
  );
  if (transparentAncestor || Number.parseFloat(style?.opacity ?? "1") === 0) return false;
  if (boxPaints(style) || foregroundPaints(style, hasText)) return true;
  return (pseudoStyles ?? []).some((pseudo) => {
    const content = String(pseudo?.content ?? "").trim();
    const generated = content !== "" && content !== "none" && content !== "normal";
    return (
      generated &&
      Number.parseFloat(pseudo?.opacity ?? "1") !== 0 &&
      (boxPaints(pseudo) || foregroundPaints(pseudo, true))
    );
  });
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

  // The flight control is anchored to the bottom of the viewport, clear of the
  // deck rail in its own reserved dock cell, keeping content clear.
  // Derive the expected top from the viewport rather than pinning a constant,
  // so a spacing change updates the contract instead of breaking it.
  const viewportHeight = scenario.viewport?.[1] ?? 0;
  const bottomOffsetPx = MOBILE_FLIGHT_BOTTOM_OFFSET_PX;
  if (scenario.inactive?.backgroundAlpha !== 1) failures.push("inactive flight background alpha must equal 1");
  const inactiveRect = { left: 4, top: viewportHeight - bottomOffsetPx - 60, width: 52, height: 60 };
  if (
    !hasExactRect(scenario.inactive?.beforeScroll, inactiveRect) ||
    !hasExactRect(scenario.inactive?.afterScroll, inactiveRect)
  ) {
    failures.push(`inactive geometry must remain fixed at x=4, top=${inactiveRect.top}, width=52, height=60`);
  }

  if (scenario.active?.backgroundAlpha !== 1) failures.push("active flight background alpha must equal 1");
  const activeRect = { left: 4, top: viewportHeight - bottomOffsetPx - 60, width: 52, height: 60 };
  if (
    !hasExactRect(scenario.active?.beforeScroll, activeRect) ||
    !hasExactRect(scenario.active?.afterScroll, activeRect)
  ) {
    failures.push(`active panel geometry must remain fixed at x=4, top=${activeRect.top}, width=52, height=60`);
  }
  if (!(scenario.active?.stopControl?.height >= 44)) {
    failures.push("active STOP FLIGHT target must be at least 44px high");
  }
  failures.push(...flightTelemetryAcceptanceFailures(scenario.active?.criticalTelemetryFontSizesPx, width));
  const stopTop = activeRect.top + 8;
  if (
    !hasExactRect(scenario.active?.stopControl, {
      left: 8,
      top: stopTop,
      width: 44,
      height: 44,
    })
  ) {
    failures.push(`active STOP FLIGHT geometry must remain x=8, top=${stopTop}, width=44, height=44`);
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
  if (
    scenario.escapeObserverReady !== true ||
    [scenario.tab, scenario.shiftTab].some((direction) => direction?.escape?.observerReady !== true)
  ) {
    failures.push("Escape observer must be ready before both close checks");
  }
  if ([scenario.tab, scenario.shiftTab].some((direction) => direction?.escape?.observed !== true)) {
    failures.push("Escape observer must record both close events");
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

export function desktopEveAcceptanceFailures(scenario) {
  const failures = [];
  const viewportWidth = scenario.viewport?.[0];
  const viewportHeight = scenario.viewport?.[1];
  const finiteViewport =
    Array.isArray(scenario.viewport) &&
    scenario.viewport.length === 2 &&
    Number.isFinite(viewportWidth) &&
    Number.isFinite(viewportHeight);
  const validViewport =
    finiteViewport &&
    ((viewportWidth === 1280 && viewportHeight === 720) || (viewportWidth === 1440 && viewportHeight === 900));
  if (!validViewport) failures.push("desktop E.V.E. viewport must be 1280x720 or 1440x900");
  if (scenario.directDeepLink !== true)
    failures.push("desktop E.V.E. must load from a fresh direct #deck=eve deep link");
  if (scenario.hash !== "#deck=eve") failures.push("desktop E.V.E. scenario must use the exact #deck=eve URL");
  if (scenario.activeDeck !== "7") failures.push("desktop E.V.E. scenario must run at the exact E.V.E. deck");
  if (scenario.canonicalLandingSettled !== true) failures.push("desktop E.V.E. canonical scroll landing must settle");

  const landingFields = [scenario.scrollTop, scenario.intendedScrollTop, scenario.scrollAlignmentDelta];
  const finiteLanding = landingFields.every(Number.isFinite);
  if (!finiteLanding) {
    failures.push("desktop E.V.E. scroll landing geometry must be finite");
  } else if (
    scenario.scrollAlignmentDelta < 0 ||
    scenario.scrollAlignmentDelta > 1 ||
    Math.abs(Math.abs(scenario.scrollTop - scenario.intendedScrollTop) - scenario.scrollAlignmentDelta) >
      RECT_CONSISTENCY_TOLERANCE_PX
  ) {
    failures.push("desktop E.V.E. scroll landing must align within 1px");
  }

  const finiteInput = hasFiniteRect(scenario.input);
  const finiteSurface = hasFiniteRect(scenario.promptSurface);
  const finiteRun = hasFiniteRect(scenario.runControl);
  if (!finiteInput) failures.push("E.V.E. input must provide a finite rectangle");
  if (!finiteSurface) failures.push("E.V.E. prompt surface must provide a finite rectangle");
  if (!finiteRun) failures.push("E.V.E. RUN control must provide a finite rectangle");
  if (finiteInput && !hasConsistentRect(scenario.input)) {
    failures.push(`E.V.E. input rectangle must be internally consistent within ${RECT_CONSISTENCY_TOLERANCE_PX}px`);
  }
  if (finiteSurface && !hasConsistentRect(scenario.promptSurface)) {
    failures.push(
      `E.V.E. prompt surface rectangle must be internally consistent within ${RECT_CONSISTENCY_TOLERANCE_PX}px`,
    );
  }
  if (finiteRun && !hasConsistentRect(scenario.runControl)) {
    failures.push(`E.V.E. RUN rectangle must be internally consistent within ${RECT_CONSISTENCY_TOLERANCE_PX}px`);
  }
  if (scenario.inputVisible !== true) failures.push("E.V.E. command input must be visibly rendered");
  if (scenario.promptSurfaceVisible !== true) failures.push("E.V.E. prompt surface must be visibly rendered");
  if (scenario.runVisible !== true) failures.push("E.V.E. RUN control must be visibly rendered");
  if (finiteSurface && (scenario.promptSurface.width < 44 || scenario.promptSurface.height < 44)) {
    failures.push("E.V.E. prompt surface must provide a usable target of at least 44x44");
  }
  failures.push(...touchTargetAcceptanceFailures(scenario.input, "E.V.E. input"));
  failures.push(...touchTargetAcceptanceFailures(scenario.runControl, "E.V.E. RUN control"));
  failures.push(...criticalTelemetryAcceptanceFailures(scenario.criticalTelemetryFontSizesPx, viewportWidth, "E.V.E."));
  if (
    validViewport &&
    finiteInput &&
    (scenario.input.left < 0 ||
      scenario.input.right > viewportWidth ||
      scenario.input.top < 0 ||
      scenario.input.bottom > viewportHeight - 20)
  ) {
    failures.push("E.V.E. input must remain fully visible with a 20px bottom safe margin");
  }
  if (
    validViewport &&
    finiteSurface &&
    (scenario.promptSurface.left < 0 ||
      scenario.promptSurface.right > viewportWidth ||
      scenario.promptSurface.top < 0 ||
      scenario.promptSurface.bottom > viewportHeight - 20)
  ) {
    failures.push("E.V.E. prompt surface must remain fully visible with a 20px bottom safe margin");
  }
  if (
    validViewport &&
    finiteRun &&
    (scenario.runControl.left < 0 ||
      scenario.runControl.right > viewportWidth ||
      scenario.runControl.top < 0 ||
      scenario.runControl.bottom > viewportHeight - 20)
  ) {
    failures.push("E.V.E. RUN control must remain fully visible with a 20px bottom safe margin");
  }
  if (
    finiteInput &&
    finiteSurface &&
    (scenario.input.left < scenario.promptSurface.left ||
      scenario.input.right > scenario.promptSurface.right ||
      scenario.input.top < scenario.promptSurface.top ||
      scenario.input.bottom > scenario.promptSurface.bottom)
  ) {
    failures.push("E.V.E. input must remain inside its visible prompt surface");
  }
  if (
    finiteRun &&
    finiteSurface &&
    (scenario.runControl.left < scenario.promptSurface.left ||
      scenario.runControl.right > scenario.promptSurface.right ||
      scenario.runControl.top < scenario.promptSurface.top ||
      scenario.runControl.bottom > scenario.promptSurface.bottom)
  ) {
    failures.push("E.V.E. RUN control must remain inside its visible prompt surface");
  }
  if (scenario.inputTopmostHit !== true) failures.push("E.V.E. input center must be the topmost hit target");
  if (scenario.runTopmostHit !== true) failures.push("E.V.E. RUN center must be the topmost hit target");
  if (
    !Array.isArray(scenario.promptSurfaceSampleHits) ||
    scenario.promptSurfaceSampleHits.length !== 9 ||
    !scenario.promptSurfaceSampleHits.every((hit) => hit === true)
  ) {
    failures.push("all nine E.V.E. prompt surface samples must resolve to the form or its controls");
  }
  if (scenario.fixedStickyEnumerationComplete !== true) {
    failures.push("fixed and sticky surface enumeration must complete");
  }
  if (!Array.isArray(scenario.fixedStickyIntersections)) {
    failures.push("fixed and sticky intersection evidence must be an array");
  } else if (scenario.fixedStickyIntersections.length !== 0) {
    failures.push("a fixed or sticky surface must not cover the E.V.E. prompt form");
  }

  const finiteWidths = [scenario.documentWidth, scenario.mainClientWidth, scenario.mainScrollWidth].every(
    Number.isFinite,
  );
  if (!finiteWidths) {
    failures.push("desktop E.V.E. document and main widths must be finite");
  } else {
    if (validViewport && scenario.documentWidth > viewportWidth)
      failures.push("desktop E.V.E. must not overflow horizontally");
    if (!(scenario.mainClientWidth > 0) || scenario.mainScrollWidth > scenario.mainClientWidth) {
      failures.push("desktop E.V.E. main scroller must not overflow horizontally");
    }
  }
  if (finiteWidths && scenario.documentWidth <= 0) {
    failures.push("desktop E.V.E. document width must be positive");
  }
  if (finiteWidths && scenario.mainScrollWidth <= 0) {
    failures.push("desktop E.V.E. main scroller must not overflow horizontally");
  }
  return failures;
}

export function touchTargetAcceptanceFailures(rect, label = "control") {
  if (!Number.isFinite(rect?.width) || !Number.isFinite(rect?.height)) {
    return [`${label} actual target must provide finite width and height`];
  }
  if (rect.width < 44 || rect.height < 44) {
    return [`${label} actual target must measure at least 44x44`];
  }
  return [];
}

export function criticalTelemetryAcceptanceFailures(fontSizesPx, viewportWidth, label = "critical") {
  if (!Number.isFinite(viewportWidth)) {
    return [`${label} critical telemetry viewport width must be finite`];
  }
  const minimumPx = viewportWidth < 768 ? 11 : 10;
  if (
    !Array.isArray(fontSizesPx) ||
    fontSizesPx.length !== 2 ||
    !fontSizesPx.every((size) => Number.isFinite(size) && size >= minimumPx)
  ) {
    return [`${label} critical telemetry must expose both safety boundaries at a minimum ${minimumPx}px font size`];
  }
  return [];
}

export function flightTelemetryAcceptanceFailures(fontSizesPx, viewportWidth) {
  if (!Number.isFinite(viewportWidth)) {
    return ["flight telemetry viewport width must be finite"];
  }
  const minimumPx = viewportWidth < 768 ? 11 : 10;
  const fields = ["state", "progress", "now"];
  const failures = [];
  for (const field of fields) {
    const size = fontSizesPx?.[field];
    if (!Number.isFinite(size) || size < minimumPx) {
      failures.push(`flight ${field} telemetry must provide a finite font size of at least ${minimumPx}px`);
    }
  }
  return failures;
}

export function tickerTelemetryAcceptanceFailures(scenario) {
  const failures = [];
  const viewportWidth = scenario?.viewportWidth;
  const fontSizePx = scenario?.fontSizePx;
  if (!Number.isFinite(viewportWidth)) {
    failures.push("ticker telemetry viewport width must be finite");
  }
  if (scenario?.visible !== true) {
    failures.push("ticker telemetry must be visibly rendered in the measured viewport");
  }
  if (!Number.isFinite(fontSizePx)) {
    failures.push("ticker telemetry font size must be finite");
  } else if (Number.isFinite(viewportWidth)) {
    const minimumPx = viewportWidth < 768 ? 11 : 10;
    if (fontSizePx < minimumPx) {
      failures.push(`ticker telemetry font size must be at least ${minimumPx}px`);
    }
  }
  return failures;
}
