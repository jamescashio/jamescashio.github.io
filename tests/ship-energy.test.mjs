import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { createShipEnergy } from "../src/odyssey/ship-effects.ts";
import { computeWorldOutcome } from "../src/odyssey/sovereign-model.ts";

test("energy geometry remains bounded and reusable across a complete flight", () => {
  const energy = createShipEnergy();
  const geometries = new Set();
  const materials = new Set();
  let instances = 0;
  let triangles = 0;
  energy.group.traverse((object) => {
    if (!object.geometry) return;
    assert.equal(object.userData.excludeFromFraming, true);
    assert.equal(object.castShadow, false);
    geometries.add(object.geometry);
    materials.add(object.material);
    if (object.isInstancedMesh) instances += object.count;
    triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3;
  });
  assert.ok(instances <= 180, `unexpected instance growth: ${instances}`);
  assert.ok(geometries.size <= 16, `unexpected draw-call growth: ${geometries.size}`);
  assert.ok(triangles <= 4500, `unexpected geometry growth: ${triangles}`);
  for (let step = 0; step <= 90; step++) {
    energy.animate(step / 3);
    energy.setSection(9.2 - (17 * step) / 90, step / 90);
    energy.group.traverse((object) => {
      if (!object.geometry) return;
      assert.ok(geometries.has(object.geometry), "animation allocated new geometry");
      assert.ok(materials.has(object.material), "animation allocated new materials");
      if (object.isInstancedMesh)
        assert.ok([...object.instanceMatrix.array].every(Number.isFinite), "non-finite energy transform");
    });
  }
});

test("relay energy appears only for requests with an available and permitted cloud route", () => {
  const energy = createShipEnergy();
  const relay = energy.group.getObjectByName("External relay waves");
  for (const architecture of ["sovereign", "hybrid", "cloud"])
    for (const sensitivity of ["mixed", "private", "public"])
      for (const connected of [true, false])
        for (const allowPrivateEgress of [true, false]) {
          const input = { architecture, sensitivity, connected, allowPrivateEgress };
          const outcome = computeWorldOutcome(input);
          energy.setFlow(outcome);
          for (const power of [0, 50, 100]) {
            energy.setPropulsion(power);
            energy.animate(3.2);
            assert.equal(relay.visible, outcome.cloud > 0, JSON.stringify({ ...input, power }));
          }
        }
});

test("propulsion extinguishes and restores the same compression and wake geometry without changing the routing instruments", () => {
  const energy = createShipEnergy();
  const diamonds = energy.group.getObjectByName("Engine compression diamonds");
  const wake = energy.group.getObjectByName("Four ion wakes");
  energy.setPropulsion(50);
  const cruise = [...diamonds.instanceMatrix.array];
  energy.setPropulsion(0);
  assert.equal(diamonds.visible, false);
  assert.equal(wake.visible, false);
  energy.setPropulsion(25);
  assert.equal(diamonds.visible, true);
  assert.equal(wake.visible, true);
  assert.notDeepEqual([...diamonds.instanceMatrix.array], cruise);
  energy.setPropulsion(50);
  assert.deepEqual([...diamonds.instanceMatrix.array], cruise, "manual inputs reproduce the same paused frame");
  energy.setPropulsion(Infinity);
  assert.deepEqual([...diamonds.instanceMatrix.array], cruise);
});

test("reactor inspection response follows section progress once and settles without changing routing", () => {
  const energy = createShipEnergy();
  const aperture = energy.group.getObjectByName("Bit energy aperture");
  const ring = aperture.children[0];
  energy.setSection(9.2, 0);
  const restingScale = aperture.scale.x;
  const restingOpacity = ring.material.opacity;
  energy.setSection(2, 0.4);
  assert.equal(aperture.scale.x, restingScale, "the scan edge leads the reactor response");
  energy.setSection(-3, 0.78);
  assert.ok(aperture.scale.x > restingScale && aperture.scale.x < restingScale * 1.04);
  assert.ok(ring.material.opacity > restingOpacity);
  const activeScale = aperture.scale.x;
  energy.animate(20);
  assert.equal(aperture.scale.x, activeScale, "the response follows inspection progress, not a free-running clock");
  for (const endpoint of [1, 0]) {
    energy.setSection(endpoint ? -7.8 : 9.2, endpoint);
    assert.ok(Math.abs(aperture.scale.x - restingScale) < 1e-10);
    assert.ok(Math.abs(ring.material.opacity - restingOpacity) < 1e-10);
  }
});

test("all energy resources belong to the traversable scene and permit complete disposal", () => {
  const energy = createShipEnergy();
  const geometries = new Set();
  const materials = new Set();
  energy.group.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) materials.add(object.material);
  });
  let disposed = 0;
  for (const resource of [...geometries, ...materials]) {
    resource.addEventListener("dispose", () => disposed++);
    resource.dispose();
  }
  energy.group.traverse((object) => {
    if (object instanceof THREE.InstancedMesh) object.dispose();
  });
  assert.equal(disposed, geometries.size + materials.size);
});
