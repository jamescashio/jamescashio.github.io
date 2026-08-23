import assert from "node:assert/strict";
import test from "node:test";

import * as content from "../src/lib/content.ts";

const { CRAFT, DECK_CRAFT, LINEAGE, LINEAGE_EVIDENCE, PILOT_CRAFT } = content;

if (globalThis.HTMLElement == null) globalThis.HTMLElement = class {};
const stage = await import("../src/lib/viewscreen-stage.js");

test("the Rutan lineage selection resolves to Proteus instead of a second SpaceX vehicle", () => {
  const rutanIndex = LINEAGE.findIndex(({ name }) => name === "RUTAN");
  assert.notEqual(rutanIndex, -1);
  const craftIndex = PILOT_CRAFT[rutanIndex];
  assert.equal(CRAFT[craftIndex][0], "PROTEUS");
  assert.equal(stage.CRAFT_SPECS?.[craftIndex]?.name, "PROTEUS");
});

test("the Hoover lineage resolves to a P-51D in both content and the viewscreen", () => {
  const hooverIndex = LINEAGE.findIndex(({ name }) => name === "HOOVER");
  assert.notEqual(hooverIndex, -1);
  const craftIndex = PILOT_CRAFT[hooverIndex];
  assert.equal(CRAFT[craftIndex][0], "P-51D MUSTANG");
  assert.equal(stage.CRAFT_SPECS?.[craftIndex]?.name, "P-51D MUSTANG");
  assert.equal(stage.CRAFT_SPECS?.[craftIndex]?.exhaust?.[0], 0, "P-51D must not render a rocket plume");
  assert.ok(stage.CRAFT_SPECS?.[craftIndex]?.lineageWireOpacity >= 0.9, "P-51D needs a crisp recognition outline");
});

test("the Lineage deck and corner HUD resolve the same selected airframe", () => {
  assert.equal(content.resolveCraftIndex?.(4, 2), 2);
  const defaultCraft = content.resolveCraftIndex?.(4, null);
  const defaultPilot = PILOT_CRAFT.indexOf(defaultCraft);
  assert.equal(DECK_CRAFT[4], 2);
  assert.equal(LINEAGE[defaultPilot].name, "RUTAN");
});

test("every flight-test mind has a sourced four-fact aircraft dossier", () => {
  assert.equal(LINEAGE_EVIDENCE.length, LINEAGE.length);
  for (const [i, evidence] of LINEAGE_EVIDENCE.entries()) {
    assert.match(evidence.src, /^\/plates\/.+\.webp\?v=32$/);
    assert.ok(evidence.alt.length >= 40, `lineage ${i + 1} needs useful alternative text`);
    assert.ok(evidence.credit.length >= 4, `lineage ${i + 1} needs a visible credit`);
    assert.match(evidence.sourceUrl, /^https:\/\//);
    assert.match(evidence.dataUrl, /^https:\/\//);
    assert.equal(evidence.facts.length, 4, `lineage ${i + 1} needs four compact facts`);
  }
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

test("the Phoenix renderer stays readable as a restrained twin-nacelle barrier-breaker", () => {
  const phoenix = stage.CRAFT_SPECS?.[5];
  assert.ok(phoenix, "craft slot 5 must expose a renderable Phoenix specification");
  assert.ok(phoenix.pose?.motion <= 0.25, "Phoenix should cruise instead of tumbling through the copy");
  assert.ok(phoenix.pose?.bloom <= 0.6, "Phoenix bloom must preserve its launch-core detail");
  assert.ok(phoenix.pose?.exposure <= 0.9, "Phoenix exposure must not white-out the deck");
  assert.ok(phoenix.solidOpacity >= 0.85, "Phoenix should read as a solid machine");
  assert.ok(phoenix.wireOpacity <= 0.16, "Phoenix wire detail must remain subordinate to the hull");
  assert.equal(phoenix.exhaust?.[0], 0, "Phoenix should not use the shared rocket torch while its field is active");

  const bounds = {
    minX: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    minZ: Number.POSITIVE_INFINITY,
    maxZ: Number.NEGATIVE_INFINITY,
  };
  for (const geometry of phoenix.build()) {
    geometry.computeBoundingBox();
    bounds.minX = Math.min(bounds.minX, geometry.boundingBox.min.x);
    bounds.maxX = Math.max(bounds.maxX, geometry.boundingBox.max.x);
    bounds.minZ = Math.min(bounds.minZ, geometry.boundingBox.min.z);
    bounds.maxZ = Math.max(bounds.maxZ, geometry.boundingBox.max.z);
  }

  const length = bounds.maxX - bounds.minX;
  const span = bounds.maxZ - bounds.minZ;
  assert.ok(span > length * 0.5, `expected Phoenix nacelles to form a readable span (${span}) against length (${length})`);
});
