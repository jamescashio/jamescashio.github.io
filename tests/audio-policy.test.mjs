import assert from "node:assert/strict";
import test from "node:test";

const policy = await import("../src/lib/audio-policy.ts");

test("audio is quiet by default", () => {
  assert.equal(policy.DEFAULT_AUDIO_ENABLED, false);
});

test("airframe sample order follows the visible fleet and keeps Proteus truthful", () => {
  assert.deepEqual(policy.AIRFRAME_SAMPLE_NAMES, [
    "x1",
    "sr71",
    "proteus",
    "starship",
    "epstein",
    "warp",
    "fold",
    "p51",
  ]);
});

test("airframe audio only plays after opt-in on deliberate craft selections", () => {
  for (const trigger of ["pip", "lineage"]) {
    assert.equal(policy.canPlayAirframe({ enabled: true, armed: true, trigger }), true, trigger);
  }

  for (const trigger of ["first-gesture", "scroll", "deck-nav", "tour"]) {
    assert.equal(policy.canPlayAirframe({ enabled: true, armed: true, trigger }), false, trigger);
  }

  assert.equal(policy.canPlayAirframe({ enabled: false, armed: true, trigger: "pip" }), false);
  assert.equal(policy.canPlayAirframe({ enabled: true, armed: false, trigger: "lineage" }), false);
});
