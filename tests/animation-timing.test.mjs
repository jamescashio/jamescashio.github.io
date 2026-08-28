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

test("frame throttling renders the first frame, skips early work, and includes the interval boundary", () => {
  assert.equal(typeof timing.shouldRenderFrame, "function", "the animation clock must expose its frame throttle");
  assert.equal(timing.shouldRenderFrame(1000, null, 16), true, "the first frame must render");
  assert.equal(timing.shouldRenderFrame(1015, 1000, 16), false, "work below the interval must be skipped");
  assert.equal(timing.shouldRenderFrame(1016, 1000, 16), true, "the interval boundary must render");
});
