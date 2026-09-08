import assert from "node:assert/strict";
import test from "node:test";
import { readObservatoryState, shareObservatoryState, isObservatoryRoute } from "../src/odyssey/observatory-state.ts";

test("an Observatory link restores visual choices and a manually composed camera", () => {
  const state = {
    light: "eclipse",
    view: "gate",
    resonance: true,
    world: { clouds: 25, aurora: 82, sun: 245 },
    camera: {
      yaw: 1.1,
      pitch: -0.7,
      distanceRatio: 1.2,
      zoom: 0.85,
      focus: [0.6, 0.25, 0],
      roll: -0.16,
      fov: 54,
      phase: 49.5,
    },
  };
  assert.deepEqual(readObservatoryState(shareObservatoryState(state)), state);
});
test("camera full turns serialize to an equivalent bounded orientation", () => {
  const state = {
    light: "dawn",
    view: "orbit",
    resonance: false,
    world: { clouds: 50, aurora: 50, sun: 0 },
    camera: {
      yaw: Math.PI * 5,
      pitch: 0,
      distanceRatio: 1,
      zoom: 1,
      focus: [0, 0, 0],
      roll: Math.PI * 4,
      fov: 39,
      phase: 12,
    },
  };
  const saved = readObservatoryState(shareObservatoryState(state));
  assert.ok(Math.abs(Math.cos(saved.camera.yaw) - Math.cos(state.camera.yaw)) < 0.00001);
  assert.equal(saved.camera.roll, 0);
});
test("legacy and unsupported links never manufacture a saved scene", () => {
  assert.equal(isObservatoryRoute("#lensing"), true);
  for (const hash of [
    "#lensing",
    "#lensing&v=2",
    "#lensing-other&v=1",
    "#film=sanctuary",
    "#lensing&v=1&" + "a".repeat(800),
  ])
    assert.equal(readObservatoryState(hash), null);
});
test("untrusted visual values stay bounded and unsupported fields have no effect", () => {
  const state = readObservatoryState(
    "#lensing&v=1&light=script&view=javascript&clouds=-50&aurora=900&sun=Infinity&gate=1&url=https://example.invalid",
  );
  assert.deepEqual(state, { light: "dawn", view: "orbit", resonance: true, world: { clouds: 0, aurora: 100, sun: 0 } });
  assert.equal(readObservatoryState("#lensing&v=1&camera=NaN,0,1,1,0,0,0,0,39,0,1").camera, undefined);
});
test("a corrupt camera preserves valid world choices with a normal authored camera", () => {
  const state = readObservatoryState("#lensing&v=1&light=ion&clouds=36&camera=0,0,1");
  assert.equal(state.light, "ion");
  assert.equal(state.world.clouds, 36);
  assert.equal(state.camera, undefined);
});
