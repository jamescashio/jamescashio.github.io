import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { createExplorationCarrier } from "../src/odyssey/ship-geometry.ts";
import {
  FLIGHT_SHOTS,
  flightComposition,
  easeFlightShot,
  flightShotDistance,
  flightCarrierDistance,
  shortestFlightTurn,
} from "../src/odyssey/flight-shots.ts";

test("authored flight shots fit their focus spheres at desktop, narrow mobile and short landscape aspects", () => {
  for (const aspect of [1440 / 640, 390 / 380, 320 / 390, 740 / 220]) {
    const vertical = (40 * Math.PI) / 360;
    const horizontal = Math.atan(Math.tan(vertical) * aspect);
    for (const shot of Object.values(FLIGHT_SHOTS)) {
      const distance = flightShotDistance(shot.radius, aspect);
      const angularRadius = Math.asin(shot.radius / distance);
      assert.ok(angularRadius < Math.min(vertical, horizontal), `focus clipped at aspect ${aspect}`);
      assert.ok(Number.isFinite(distance) && distance > shot.radius);
    }
  }
});

test("phone arrival uses a larger broadside while retaining the carrier, relay and caption clearance", () => {
  const ship = createExplorationCarrier();
  ship.group.updateMatrixWorld(true);
  const relay = ship.inspected.find((object) => object.userData.zone === "cloud").parent;
  const all = [],
    owned = [],
    cloud = [];
  ship.group.traverse((object) => {
    if (!object.geometry || object.userData.excludeFromFraming) return;
    object.geometry.computeBoundingBox();
    const bounds = object.geometry.boundingBox;
    let parent = object,
      external = false;
    while (parent) {
      if (parent === relay) external = true;
      parent = parent.parent;
    }
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z]) {
          const point = new THREE.Vector3(x, y, z).applyMatrix4(object.matrixWorld);
          all.push(point);
          (external ? cloud : owned).push(point);
        }
  });
  const frame = (shot, width, height) => {
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 260);
    camera.position.set(
      Math.sin(shot.yaw) * Math.cos(shot.pitch),
      Math.sin(shot.pitch),
      Math.cos(shot.yaw) * Math.cos(shot.pitch),
    );
    camera.lookAt(0, 0, 0);
    camera.rotateZ(shot.roll);
    camera.updateMatrixWorld();
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    const back = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 2);
    const focus = new THREE.Vector3(...shot.focus);
    camera.position
      .copy(focus)
      .addScaledVector(back, flightCarrierDistance(all, focus, right, up, back, camera.aspect));
    camera.setViewOffset(width, height, 0, height * shot.screenShift, width, height);
    camera.updateMatrixWorld();
    const bounds = (points) => {
      const projected = points.map((point) => point.clone().project(camera));
      const minX = Math.min(...projected.map((point) => point.x));
      const maxX = Math.max(...projected.map((point) => point.x));
      const minY = Math.min(...projected.map((point) => point.y));
      const maxY = Math.max(...projected.map((point) => point.y));
      return {
        width: ((maxX - minX) * width) / 2,
        height: ((maxY - minY) * height) / 2,
        minX,
        maxX,
        top: (1 - maxY) / 2,
        bottom: (1 - minY) / 2,
      };
    };
    return { owned: bounds(owned), cloud: bounds(cloud), all: bounds(all) };
  };
  for (const [width, height, viewport] of [
    [372, 261.625, 390],
    [302, 261.625, 320],
    [372, 300, 390],
    [342, 180, 360],
  ]) {
    const before = frame({ ...FLIGHT_SHOTS.arrival, roll: -0.62, screenShift: 0 }, width, height);
    const after = frame(flightComposition("arrival", width, viewport), width, height);
    assert.ok(after.owned.width >= before.owned.width * 1.5, JSON.stringify({ width, before, after }));
    assert.ok(
      after.owned.width * after.owned.height > before.owned.width * before.owned.height * 1.05,
      JSON.stringify({ width, height, before, after }),
    );
    assert.ok(
      after.all.minX >= -0.840001 && after.all.maxX <= 0.840001,
      "physical ship or separate relay clipped horizontally",
    );
    assert.ok(after.all.top >= 0.12 && after.all.bottom <= 0.72, JSON.stringify({ width, after }));
    assert.ok(after.cloud.width > 35, "separate cloud relay must remain legible");
  }
});

test("responsive arrival returns to the original tablet and desktop composition without changing other chapters", () => {
  for (const [canvas, viewport] of [
    [615, 1024],
    [455, 768],
    [858, 1440],
  ]) {
    const arrival = flightComposition("arrival", canvas, viewport);
    assert.equal(arrival.yaw, FLIGHT_SHOTS.arrival.yaw);
    assert.equal(arrival.pitch, FLIGHT_SHOTS.arrival.pitch);
    assert.deepEqual(arrival.focus, FLIGHT_SHOTS.arrival.focus);
    assert.equal(arrival.screenShift, 0);
    assert.equal(arrival.roll, canvas < 600 ? -0.62 : 0);
  }
  for (const shot of ["inside", "isolation", "command"]) {
    const phone = flightComposition(shot, 302, 320);
    assert.equal(phone.yaw, FLIGHT_SHOTS[shot].yaw);
    assert.deepEqual(phone.focus, FLIGHT_SHOTS[shot].focus);
    assert.equal(phone.screenShift, 0);
    assert.equal(phone.roll, -0.62);
  }
});

test("portrait framing pulls back rather than clipping and closeups remain substantially closer than establishing views", () => {
  assert.ok(flightShotDistance(4, 0.7) > flightShotDistance(4, 1.8));
  for (const aspect of [0.8, 1.8]) {
    assert.ok(
      flightShotDistance(FLIGHT_SHOTS.inside.radius, aspect) <
        flightShotDistance(FLIGHT_SHOTS.arrival.radius, aspect) / 2,
    );
    assert.ok(
      flightShotDistance(FLIGHT_SHOTS.command.radius, aspect) <
        flightShotDistance(FLIGHT_SHOTS.arrival.radius, aspect) / 3,
    );
  }
});

test("cinematic easing stays bounded and monotonic, with settled starts and finishes", () => {
  assert.equal(easeFlightShot(-0.2), 0);
  assert.equal(easeFlightShot(1.2), 1);
  assert.equal(easeFlightShot(0.5), 0.5);
  assert.ok(easeFlightShot(0.001) < 0.000001);
  assert.ok(1 - easeFlightShot(0.999) < 0.000001);
  let previous = 0;
  for (let step = 0; step <= 100; step++) {
    const eased = easeFlightShot(step / 100);
    assert.ok(eased >= previous && eased >= 0 && eased <= 1);
    previous = eased;
  }
});

test("orbit transitions use the shorter arc across the angle boundary", () => {
  const turn = shortestFlightTurn(Math.PI - 0.05, -Math.PI + 0.05);
  assert.ok(Math.abs(turn - 0.1) < 1e-10);
  assert.ok(Math.abs(shortestFlightTurn(-Math.PI + 0.05, Math.PI - 0.05) + 0.1) < 1e-10);
});

test("invalid camera dimensions cannot produce an infinite or inverted projection", () => {
  for (const args of [
    [0, 1],
    [1, 0],
    [-1, 1],
    [1, NaN],
    [Infinity, 1],
    [1, 1, 180],
    [1, 1, 0],
  ])
    assert.throws(() => flightShotDistance(...args), RangeError);
});

test("both establishing shots preserve the real carrier and relay silhouette with caption clearance", () => {
  const ship = createExplorationCarrier();
  ship.group.updateMatrixWorld(true);
  const points = [];
  ship.group.traverse((object) => {
    if (!object.geometry || object.userData.excludeFromFraming) return;
    object.geometry.computeBoundingBox();
    const bounds = object.geometry.boundingBox;
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z])
          points.push(new THREE.Vector3(x, y, z).applyMatrix4(object.matrixWorld));
  });
  for (const [width, height] of [
    [1440, 640],
    [390, 380],
    [320, 390],
    [740, 220],
  ]) {
    for (const name of ["arrival", "isolation"]) {
      const shot = FLIGHT_SHOTS[name];
      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 260);
      camera.position.set(
        Math.sin(shot.yaw) * Math.cos(shot.pitch),
        Math.sin(shot.pitch),
        Math.cos(shot.yaw) * Math.cos(shot.pitch),
      );
      camera.lookAt(0, 0, 0);
      if (width < 600) camera.rotateZ(-0.62);
      camera.updateMatrixWorld();
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
      const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
      const back = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 2);
      const focus = new THREE.Vector3(...shot.focus);
      const distance = flightCarrierDistance(points, focus, right, up, back, camera.aspect);
      camera.position.copy(focus).addScaledVector(back, distance);
      camera.updateMatrixWorld();
      let fullest = 0;
      for (const point of points) {
        const projected = point.clone().project(camera);
        assert.ok(Math.abs(projected.x) <= 0.840001, `${name} horizontally clipped at ${width}`);
        assert.ok(Math.abs(projected.y) <= 0.690001, `${name} overlaps caption zone at ${width}`);
        fullest = Math.max(fullest, Math.abs(projected.x) / 0.84, Math.abs(projected.y) / 0.69);
      }
      assert.ok(fullest > 0.99, `${name} should fill the available composition at ${width}`);
    }
  }
});
