import assert from "node:assert/strict";
import test from "node:test";

import * as content from "../src/lib/content.ts";

const { CRAFT, DECK_CRAFT, LINEAGE, PILOT_CRAFT } = content;

if (globalThis.HTMLElement == null) globalThis.HTMLElement = class {};
const stage = await import("../src/lib/viewscreen-stage.js");

test("the Rutan lineage selection resolves to Proteus instead of a second SpaceX vehicle", () => {
  const rutanIndex = LINEAGE.findIndex(({ name }) => name === "RUTAN");
  assert.notEqual(rutanIndex, -1);
  const craftIndex = PILOT_CRAFT[rutanIndex];
  assert.equal(CRAFT[craftIndex][0], "PROTEUS");
  assert.equal(stage.CRAFT_SPECS?.[craftIndex]?.name, "PROTEUS");
});

test("the Lineage deck and corner HUD resolve the same selected airframe", () => {
  assert.equal(content.resolveCraftIndex?.(4, 2), 2);
  const defaultCraft = content.resolveCraftIndex?.(4, null);
  const defaultPilot = PILOT_CRAFT.indexOf(defaultCraft);
  assert.equal(DECK_CRAFT[4], 2);
  assert.equal(LINEAGE[defaultPilot].name, "RUTAN");
});

test("the Proteus renderer preserves its wider-than-long tandem-wing silhouette", () => {
  const proteus = stage.CRAFT_SPECS?.[2];
  assert.ok(proteus, "craft slot 2 must expose a renderable Proteus specification");
  assert.ok(proteus.pose?.pitch >= 0.4, "Proteus needs a planform-revealing recognition pitch");
  assert.ok(proteus.pose?.motion <= 0.4, "Proteus must settle instead of continuously tumbling");
  assert.ok(proteus.pose?.bloom < 0.8, "Proteus bloom must preserve its white-airframe detail");
  assert.ok(proteus.solidOpacity < 0.7, "Proteus must read as a restrained recognition silhouette");
  assert.ok(proteus.wireOpacity > 0.5, "Proteus needs a crisp tandem-wing outline");
  assert.ok(proteus.lineageSolidOpacity <= 0.08, "Lineage must show Proteus as a restrained blueprint silhouette");
  assert.ok(proteus.lineageWireOpacity >= 0.95, "Lineage must preserve the Proteus planform in cyan wire");
  const parts = proteus.build();
  const bounds = {
    minX: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    minZ: Number.POSITIVE_INFINITY,
    maxZ: Number.NEGATIVE_INFINITY,
  };

  for (const geometry of parts) {
    geometry.computeBoundingBox();
    bounds.minX = Math.min(bounds.minX, geometry.boundingBox.min.x);
    bounds.maxX = Math.max(bounds.maxX, geometry.boundingBox.max.x);
    bounds.minZ = Math.min(bounds.minZ, geometry.boundingBox.min.z);
    bounds.maxZ = Math.max(bounds.maxZ, geometry.boundingBox.max.z);
  }

  const length = bounds.maxX - bounds.minX;
  const span = bounds.maxZ - bounds.minZ;
  assert.ok(span > length * 1.25, `expected Proteus span (${span}) to exceed length (${length})`);
});
