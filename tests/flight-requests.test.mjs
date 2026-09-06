import assert from "node:assert/strict";
import test from "node:test";
import { flightRequests } from "../src/odyssey/flight-requests.ts";
import { computeWorldOutcome } from "../src/odyssey/sovereign-model.ts";

test("individual request identities reconcile with aggregate outcomes in every supported scenario", () => {
  for (const architecture of ["sovereign", "hybrid", "cloud"])
    for (const sensitivity of ["mixed", "public", "private"])
      for (const connected of [true, false])
        for (const allowPrivateEgress of [true, false]) {
          const input = { architecture, sensitivity, connected, allowPrivateEgress };
          const requests = flightRequests(input);
          const outcome = computeWorldOutcome(input);
          assert.equal(new Set(requests.map((r) => r.id)).size, 12);
          for (const route of ["local", "cloud", "held"])
            assert.equal(requests.filter((r) => r.route === route).length, outcome[route]);
          assert.equal(requests.filter((r) => r.sensitive).length, outcome.privateCount);
          if (architecture !== "cloud" || !allowPrivateEgress)
            assert.equal(requests.filter((r) => r.sensitive && r.route === "cloud").length, 0);
        }
});
test("a hybrid blackout moves public requests aboard while preserving private identities", () => {
  const input = { architecture: "hybrid", sensitivity: "mixed", connected: true, allowPrivateEgress: false };
  const connected = flightRequests(input);
  const offline = flightRequests({ ...input, connected: false });
  assert.deepEqual(
    connected.map((r) => [r.id, r.sensitive]),
    offline.map((r) => [r.id, r.sensitive]),
  );
  assert.equal(connected.filter((r) => r.route === "cloud").length, 6);
  assert.ok(offline.every((r) => r.route === "local"));
});
