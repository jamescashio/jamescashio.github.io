import assert from "node:assert/strict";
import test from "node:test";

import { createStageNotifier } from "../src/lib/stage-sync.ts";

function recordingStage() {
  const calls = { deck: [], craft: [], progress: [] };
  return {
    calls,
    setDeck: (value) => calls.deck.push(value),
    setCraft: (value) => calls.craft.push(value),
    setProgress: (value) => calls.progress.push(value),
  };
}

test("the stage notifier forwards each value once until it changes", () => {
  const notifier = createStageNotifier();
  const stage = recordingStage();

  assert.equal(notifier.deck(stage, 5), true);
  assert.equal(notifier.deck(stage, 5), false);
  assert.equal(notifier.deck(stage, 5), false);
  assert.equal(notifier.deck(stage, 2), true);
  assert.deepEqual(stage.calls.deck, [5, 2]);

  assert.equal(notifier.craft(stage, 4), true);
  assert.equal(notifier.craft(stage, 4), false);
  assert.deepEqual(stage.calls.craft, [4]);

  assert.equal(notifier.progress(stage, 0.5), true);
  assert.equal(notifier.progress(stage, 0.5), false);
  assert.equal(notifier.progress(stage, 0.75), true);
  assert.deepEqual(stage.calls.progress, [0.5, 0.75]);
});

test("a replacement stage instance receives a complete first sync", () => {
  const notifier = createStageNotifier();
  const first = recordingStage();
  const second = recordingStage();

  notifier.deck(first, 5);
  notifier.craft(first, 4);
  notifier.progress(first, 0.6);

  assert.equal(notifier.deck(second, 5), true, "a new stage must not inherit the old instance's cache");
  assert.equal(notifier.craft(second, 4), true);
  assert.equal(notifier.progress(second, 0.6), true);
  assert.deepEqual(second.calls.deck, [5]);
  assert.deepEqual(second.calls.craft, [4]);
  assert.deepEqual(second.calls.progress, [0.6]);
});

test("an absent stage neither forwards nor records a value", () => {
  const notifier = createStageNotifier();
  const stage = recordingStage();

  assert.equal(notifier.deck(null, 5), false);
  assert.equal(notifier.deck(undefined, 5), false);
  assert.equal(notifier.deck({}, 5), false, "a stage without setDeck must be ignored");
  assert.equal(notifier.deck(stage, 5), true, "a skipped absent stage must not poison the cache");
  assert.deepEqual(stage.calls.deck, [5]);
});
