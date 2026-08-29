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

test("semantic motion completes within the approved readable bounds", () => {
  assert.equal(typeof timing.motionDurationMs, "function", "the motion contract must expose semantic durations");

  const copy = timing.motionDurationMs("deck-copy");
  const acquisition = timing.motionDurationMs("article-acquisition");
  const warp = timing.motionDurationMs("stage-warp");

  assert.ok(copy >= 300 && copy <= 450, `deck copy must resolve in 300–450ms, received ${copy}`);
  assert.ok(
    acquisition >= 450 && acquisition <= 620,
    `article acquisition must resolve in 450–620ms, received ${acquisition}`,
  );
  assert.ok(warp <= 700, `stage warp must decay within 700ms, received ${warp}`);
});

test("inactive deck work stands down without rewriting the selected article", () => {
  assert.equal(typeof timing.deckAnimationState, "function", "the deck motion contract must expose ownership state");

  assert.deepEqual(timing.deckAnimationState({ activeDeck: 5, ownerDeck: 5, selection: 6 }), {
    active: true,
    selection: 6,
  });
  assert.deepEqual(timing.deckAnimationState({ activeDeck: 8, ownerDeck: 5, selection: 6 }), {
    active: false,
    selection: 6,
  });
});
