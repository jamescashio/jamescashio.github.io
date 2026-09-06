import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { createExplorationCarrier } from "../src/odyssey/ship-geometry.ts";

test("hull reveal clips only armor, preserves inner hardware, and can reverse without mutating geometry", () => {
  const ship = createExplorationCarrier();
  const armor = ship.group.getObjectByName("Dorsal armor");
  const scanner = ship.group.getObjectByName("Hull inspection sweep");
  const meshes = [];
  ship.group.traverse((object) => {
    if (object instanceof THREE.Mesh) meshes.push(object);
  });
  const sectioned = meshes.filter((mesh) => mesh.userData.sectionedArmor);
  const solid = meshes.filter((mesh) => !mesh.userData.sectionedArmor);
  assert.ok(sectioned.length > 5);
  assert.ok(solid.length > 5);
  assert.ok(sectioned.every((mesh) => mesh.material.clippingPlanes.length === 1 && mesh.material.clipShadows));
  assert.ok(solid.every((mesh) => !mesh.material.clippingPlanes));
  const initialGeometry = meshes.map((mesh) => mesh.geometry.uuid);
  const plane = sectioned[0].material.clippingPlanes[0];
  assert.ok(ship.isSurfaceVisible(sectioned[0], new THREE.Vector3(0, 0, 8.9)));
  ship.setCutawayProgress(0.5);
  assert.equal(armor.visible, true);
  assert.equal(scanner.visible, true);
  assert.ok(plane.constant < 1 && plane.constant > 0);
  assert.equal(ship.isSurfaceVisible(sectioned[0], new THREE.Vector3(0, 0, 4)), false);
  assert.equal(ship.isSurfaceVisible(sectioned[0], new THREE.Vector3(0, 0, -4)), true);
  assert.equal(ship.isSurfaceVisible(solid[0], new THREE.Vector3(0, 0, 4)), true);
  ship.setCutawayProgress(0.25);
  assert.ok(plane.constant > 4);
  ship.setCutawayProgress(1);
  assert.equal(armor.visible, false);
  assert.equal(scanner.visible, false);
  assert.equal(ship.isSurfaceVisible(sectioned[0], new THREE.Vector3(0, 0, -10)), false);
  ship.setCutawayProgress(0);
  assert.equal(armor.visible, true);
  assert.equal(scanner.visible, false);
  assert.equal(plane.constant, 9.2);
  assert.deepEqual(
    meshes.map((mesh) => mesh.geometry.uuid),
    initialGeometry,
  );
});

test("command glazing reflects the existing inspection plane and settles at both motion-safe endpoints", () => {
  const ship = createExplorationCarrier();
  const canopy = ship.group.getObjectByName("Panoramic bridge glazing");
  const scanner = ship.group.getObjectByName("Hull inspection sweep");
  const shader = {
    uniforms: {},
    vertexShader: "#include <begin_vertex>",
    fragmentShader: "#include <opaque_fragment>",
  };
  canopy.material.onBeforeCompile(shader);
  assert.equal(canopy.material.transmission, 0, "glazing must not require a transmission render pass");
  assert.equal(canopy.userData.excludeFromFraming, true, "finish geometry must not change authored shots");
  assert.equal(shader.uniforms.glazingSweepActive.value, 0);
  for (const progress of [0.35, 0.7, 0.35]) {
    ship.setCutawayProgress(progress);
    assert.equal(shader.uniforms.glazingSweepActive.value, 1);
    assert.equal(shader.uniforms.glazingSweepZ.value, scanner.position.z);
  }
  for (const endpoint of [1, 0]) {
    ship.setCutawayProgress(endpoint);
    assert.equal(
      shader.uniforms.glazingSweepActive.value,
      0,
      "direct reduced-motion steps must leave no moving reflection",
    );
  }
});

test("engine throats remain physically recessed and replaced armor finishes leave no unattached live materials", () => {
  const released = [];
  const originalDispose = THREE.Material.prototype.dispose;
  let ship;
  THREE.Material.prototype.dispose = function () {
    released.push(this);
    originalDispose.call(this);
  };
  try {
    ship = createExplorationCarrier();
  } finally {
    THREE.Material.prototype.dispose = originalDispose;
  }
  const nozzles = [];
  const attached = new Set();
  ship.group.traverse((object) => {
    if (object.name === "Recessed ion engine") nozzles.push(object);
    if (object.material) attached.add(object.material);
  });
  assert.equal(nozzles.length, 4);
  for (const nozzle of nozzles) {
    const cavity = nozzle.getObjectByName("Tapered engine cavity");
    const throat = nozzle.getObjectByName("Recessed luminous throat");
    assert.ok(throat.position.z > 0.1, "the engine throat sits inside the casing, behind its aft lip");
    assert.equal(cavity.geometry.parameters.openEnded, true);
    assert.ok(cavity.geometry.parameters.radiusTop > cavity.geometry.parameters.radiusBottom);
    assert.equal(cavity.material.side, THREE.DoubleSide, "the liner is visible from inside the nozzle");
    const plume = nozzle.getObjectByName("Fading ion plume");
    assert.equal(plume.material.depthWrite, false);
    assert.equal(plume.material.blending, THREE.AdditiveBlending);
  }
  assert.ok(released.some((material) => material.name === "Ceramic deck with titanium shoulders"));
  assert.ok(released.some((material) => material.name === "Blue titanium wing armor"));
  assert.ok(
    released.every((material) => !attached.has(material)),
    "active material references must never be disposed",
  );
});
