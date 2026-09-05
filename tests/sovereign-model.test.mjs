import test from "node:test";
import assert from "node:assert/strict";
import { computeWorldOutcome, TOTAL_REQUESTS } from "../src/odyssey/sovereign-model.ts";

const base = { architecture: "sovereign", sensitivity: "mixed", connected: true, allowPrivateEgress: false };
const outcome = (changes) => computeWorldOutcome({ ...base, ...changes });

test("every architecture compares the same 12 requests across all 36 supported conditions", () => {
  for (const architecture of ["sovereign", "hybrid", "cloud"])
    for (const sensitivity of ["mixed", "public", "private"])
      for (const connected of [true, false])
        for (const allowPrivateEgress of [true, false]) {
          const result = outcome({ architecture, sensitivity, connected, allowPrivateEgress });
          assert.equal(result.local + result.cloud + result.held, TOTAL_REQUESTS);
          assert.equal(result.privateCount + result.publicCount, TOTAL_REQUESTS);
          assert.ok([result.local, result.cloud, result.held].every((n) => Number.isInteger(n) && n >= 0));
        }
});
test("sovereign processing keeps private requests local when the internet is unavailable", () => {
  const result = outcome({ sensitivity: "private", connected: false, allowPrivateEgress: true });
  assert.deepEqual([result.local, result.cloud, result.held], [12, 0, 0]);
});
test("hybrid routes the same mixed batch across its two boundaries", () => {
  const result = outcome({ architecture: "hybrid" });
  assert.deepEqual([result.local, result.cloud, result.held], [6, 6, 0]);
});
test("hybrid never sends private requests to cloud even if cloud egress is permitted", () => {
  const result = outcome({ architecture: "hybrid", sensitivity: "private", allowPrivateEgress: true });
  assert.deepEqual([result.local, result.cloud, result.held], [12, 0, 0]);
});
test("hybrid outage fallback is local and clearly discloses its capacity assumption", () => {
  const result = outcome({ architecture: "hybrid", connected: false });
  assert.deepEqual([result.local, result.cloud, result.held], [12, 0, 0]);
  assert.match(result.internetDependency, /assumes sufficient local capability and capacity/);
});
test("cloud holds private requests until explicit permission is supplied", () => {
  assert.deepEqual([outcome({ architecture: "cloud" }).cloud, outcome({ architecture: "cloud" }).held], [6, 6]);
  const permitted = outcome({ architecture: "cloud", allowPrivateEgress: true });
  assert.deepEqual([permitted.local, permitted.cloud, permitted.held], [0, 12, 0]);
});
test("cloud outage holds all requests regardless of data type or permission", () => {
  for (const sensitivity of ["mixed", "public", "private"]) {
    const result = outcome({ architecture: "cloud", connected: false, sensitivity, allowPrivateEgress: true });
    assert.deepEqual([result.local, result.cloud, result.held], [0, 0, 12]);
  }
});
test("public-only workload needs no sensitive-data permission to use a connected cloud", () => {
  const result = outcome({ architecture: "cloud", sensitivity: "public" });
  assert.deepEqual([result.privateCount, result.publicCount, result.cloud, result.held], [0, 12, 12, 0]);
});
