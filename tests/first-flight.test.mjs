import test from "node:test";
import assert from "node:assert/strict";
import {
  FIRST_FLIGHT,
  FLIGHT_STEP_MS,
  flightStepIndex,
  missionHash,
  parseMissionHash,
} from "../src/odyssey/flight-plan.ts";
import { computeWorldOutcome } from "../src/odyssey/sovereign-model.ts";

test("the thirty-second narrative agrees with the routing model at every chapter", () => {
  assert.equal(FLIGHT_STEP_MS * FIRST_FLIGHT.length, 30000);
  assert.deepEqual(
    FIRST_FLIGHT.map((s) => {
      const o = computeWorldOutcome(s.input);
      return [o.local, o.cloud, o.held];
    }),
    [
      [6, 6, 0],
      [6, 6, 0],
      [12, 0, 0],
      [0, 0, 12],
    ],
  );
  assert.equal(new Set(FIRST_FLIGHT.map((s) => s.id)).size, 4);
  assert.equal(flightStepIndex("blackout"), 2);
  assert.equal(flightStepIndex("untrusted"), 0);
});
test("mission links reproduce every supported scenario and preserve its decision", () => {
  for (const architecture of ["sovereign", "hybrid", "cloud"])
    for (const sensitivity of ["mixed", "private", "public"])
      for (const connected of [true, false])
        for (const allowPrivateEgress of [true, false]) {
          const input = { architecture, sensitivity, connected, allowPrivateEgress };
          const decoded = parseMissionHash(missionHash(input));
          assert.deepEqual(decoded, input);
          assert.deepEqual(computeWorldOutcome(decoded), computeWorldOutcome(input));
        }
});
test("partial, ambiguous and extra mission parameters cannot change the model", () => {
  for (const hash of [
    "",
    "#mission=cloud",
    "#mission=cloud.private.connected",
    "#mission=cloud.private.connected.true",
    "#mission=cloud.private.connected.permitted&run=1",
    "#mission=unknown.private.connected.held",
    "#mission=cloud.private.connected.held\n",
    "#flight=board",
  ])
    assert.equal(parseMissionHash(hash), null, hash);
});
