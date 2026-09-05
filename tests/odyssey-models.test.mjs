import test from "node:test";
import assert from "node:assert/strict";
import { affectedModules, escalationExample, exposureExample, PROJECTS, routeExample } from "../src/odyssey/data.ts";

test("every private request holds external execution, independently of intent and sources", () => {
  for (const intent of ["draft", "research", "analyze"]) {
    for (const sources of [true, false]) {
      const result = routeExample({ intent, sources, privateData: true });
      assert.equal(result.lane, "Human review");
      assert.equal(result.code, "HOLD");
      assert.ok(result.steps.includes("External route held"));
    }
  }
});
test("evidence requirements route public work to research", () => {
  for (const intent of ["draft", "research", "analyze"])
    assert.equal(routeExample({ intent, sources: true, privateData: false }).lane, "Research");
  assert.equal(routeExample({ intent: "draft", sources: false, privateData: false }).lane, "Workhorse");
  assert.equal(routeExample({ intent: "analyze", sources: false, privateData: false }).lane, "Synthesis");
});
test("escalation crosses consequence and uncertainty boundaries independently", () => {
  assert.equal(escalationExample(69, 75).level, 1);
  assert.equal(escalationExample(70, 100).level, 2);
  assert.equal(escalationExample(0, 39).level, 2);
  assert.equal(escalationExample(0, 40).level, 1);
  assert.equal(escalationExample(34, 75).level, 0);
  assert.equal(escalationExample(35, 75).level, 1);
});
test("exposure examples do not declare a confirmed vulnerability from incomplete inputs", () => {
  assert.equal(exposureExample(true, false, false).level, "Investigate first");
  assert.equal(exposureExample(true, true, true).level, "Review the boundary");
  assert.equal(exposureExample(false, false, true).level, "Validate the observation");
});
test("dependency impact includes indirect consumers and excludes own dependencies", () => {
  assert.deepEqual(new Set(affectedModules("policy")), new Set(["router", "adapter", "ui"]));
  assert.deepEqual(new Set(affectedModules("adapter")), new Set(["router", "ui"]));
  assert.deepEqual(affectedModules("router"), ["ui"]);
  assert.deepEqual(affectedModules("ui"), []);
  assert.deepEqual(new Set(affectedModules("audit")), new Set(["router", "ui"]));
});
test("all seven studies have stable unique link identifiers", () => {
  assert.equal(PROJECTS.length, 7);
  assert.equal(new Set(PROJECTS.map((project) => project.id)).size, 7);
  assert.ok(PROJECTS.every((project) => /^[a-z]+$/.test(project.id)));
});
