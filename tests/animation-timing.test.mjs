import assert from "node:assert/strict";
import test from "node:test";

let timing = {};
try {
  timing = await import("../src/lib/animation-timing.ts");
} catch {
  // The first TDD run intentionally proves the missing timing boundary.
}

test("backwards frame timestamps cannot produce a negative animation delta", () => {
  assert.equal(typeof timing.frameDeltaSeconds, "function", "the animation clock must expose its bounded delta");
  assert.equal(timing.frameDeltaSeconds(990, 1000), 0);
  assert.equal(timing.frameDeltaSeconds(1016, 1000), 0.016);
  assert.equal(timing.frameDeltaSeconds(1100, 1000), 0.05);
});
