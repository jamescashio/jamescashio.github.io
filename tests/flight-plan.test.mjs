import assert from "node:assert/strict";
import test from "node:test";
import { ARTICLES } from "../src/lib/content.ts";

let flight = {};
try {
  flight = await import("../src/lib/flight-plan.ts");
} catch {
  // The first TDD run intentionally proves the flight-plan boundary is missing.
}

test("advertises four ordered beats across a 30-second flight", () => {
  assert.equal(
    typeof flight.flightActionAt,
    "function",
    "the flight plan must expose its elapsed-time action resolver",
  );
  assert.equal(flight.FLIGHT_DURATION_MS, 30_000);
  assert.deepEqual(
    flight.FLIGHT_BEATS.map(({ label, at }) => [label, at]),
    [
      ["THESIS", 0],
      ["ROUTING LAW", 7_500],
      ["BUILD PROOF", 15_000],
      ["E.V.E. / CONTACT", 22_500],
    ],
  );
});

test("routes the Build Proof beat to Article 01 HERMES ORCHESTRATOR", () => {
  const action = flight.flightActionAt(15_000);
  assert.deepEqual(action, {
    kind: "beat",
    label: "BUILD PROOF",
    deck: 5,
    article: 0,
    at: 15_000,
  });
  assert.equal(ARTICLES[action.article].name, "HERMES ORCHESTRATOR");
});

test("hands off to Contact at 30 seconds without adding a fifth advertised beat", () => {
  assert.equal(flight.FLIGHT_BEATS.length, 4);
  assert.deepEqual(flight.flightActionAt(30_000), {
    kind: "complete",
    deck: 8,
    at: 30_000,
  });
  assert.deepEqual(flight.flightActionAt(43_000), {
    kind: "complete",
    deck: 8,
    at: 30_000,
  });
});

test("start, stop, and restart remain deterministic and never carry audio state", () => {
  assert.equal(typeof flight.startFlight, "function", "the flight state helpers must be exposed");

  const started = flight.startFlight(1_000);
  assert.deepEqual(started, { active: true, startedAt: 1_000 });
  assert.equal("audio" in started, false);
  assert.deepEqual(flight.stopFlight(started), { active: false, startedAt: null });
  assert.deepEqual(flight.restartFlight(9_000), { active: true, startedAt: 9_000 });
});

test("identifies each deterministic next handoff without timer drift", () => {
  assert.equal(flight.nextFlightHandoffAt(0), 7_500);
  assert.equal(flight.nextFlightHandoffAt(7_499), 7_500);
  assert.equal(flight.nextFlightHandoffAt(7_500), 15_000);
  assert.equal(flight.nextFlightHandoffAt(22_500), 30_000);
  assert.equal(flight.nextFlightHandoffAt(30_000), null);
});

test("starting the flight forces Technical mode so every advertised beat has a mounted deck", () => {
  assert.equal(typeof flight.prepareFlightStart, "function", "the flight start transition must be exposed");
  assert.deepEqual(flight.prepareFlightStart(5_000), {
    mode: "technical",
    flight: { active: true, startedAt: 5_000 },
  });
});

test("manual vertical arrow keys are flight-stopping navigation input", () => {
  assert.equal(typeof flight.isFlightStopKey, "function", "the manual input contract must be exposed");
  for (const key of ["arrowup", "arrowdown", "pageup", "pagedown", "home", "end", " "]) {
    assert.equal(flight.isFlightStopKey(key), true, key);
  }
  assert.equal(flight.isFlightStopKey("q"), false);
});
