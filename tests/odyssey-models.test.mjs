import test from "node:test";
import assert from "node:assert/strict";
import { affectedModules, escalationExample, exposureExample, PROJECTS, routeExample } from "../src/odyssey/data.ts";
import { BRIEF_FACTS, evidenceCommand, evidenceCount, FLEET_EVIDENCE } from "../src/odyssey/fleet-evidence.ts";
import { defaultExperiment, parseExperiment, shareExperiment } from "../src/odyssey/study-experiment.ts";

test("shared settings reproduce all seven experiments, including zero and empty selections", () => {
  const examples = [
    { study: "hermes", intent: "analyze", privateData: true, sources: true },
    { study: "cascade", severity: 70, confidence: 39 },
    { study: "exposure", reachable: false, auth: true, critical: false },
    { study: "briefing", chosen: ["routing"] },
    { study: "briefing", chosen: [] },
    { study: "dashboards", age: 24 },
    { study: "signal", deviation: 0, corroborated: true },
    { study: "graphify", selected: "adapter" },
  ];
  for (const input of examples) assert.deepEqual(parseExperiment(shareExperiment(input)), input);
  for (const project of PROJECTS) {
    const defaults = defaultExperiment(project.id);
    assert.deepEqual(parseExperiment(`#build=${project.id}`), defaults, "existing bookmarks retain their defaults");
  }
  assert.equal(routeExample(parseExperiment(shareExperiment(examples[0]))).code, "HOLD");
  const cascade = parseExperiment(shareExperiment(examples[1]));
  assert.equal(escalationExample(cascade.severity, cascade.confidence).level, 2);
  assert.deepEqual(
    new Set(affectedModules(parseExperiment(shareExperiment(examples[7])).selected)),
    new Set(["router", "ui"]),
  );
});

test("untrusted experiment fragments stay bounded and accept only defined controls", () => {
  for (const hash of ["#evidence", "#build=unknown", "#build=signal-more", "#build=signal&x=" + "a".repeat(512)])
    assert.equal(parseExperiment(hash), null);
  assert.deepEqual(parseExperiment("#build=cascade&severity=999&confidence=-1"), {
    study: "cascade",
    severity: 100,
    confidence: 90,
  });
  assert.deepEqual(parseExperiment("#build=cascade&severity=2e2&confidence=3.5"), defaultExperiment("cascade"));
  assert.deepEqual(parseExperiment("#build=dashboards&age=999"), { study: "dashboards", age: 48 });
  assert.deepEqual(parseExperiment("#build=hermes&intent=unknown&private=true&sources=0"), defaultExperiment("hermes"));
  assert.deepEqual(parseExperiment("#build=briefing&facts=routing,routing,secret,authority"), {
    study: "briefing",
    chosen: ["routing", "authority"],
  });
  assert.deepEqual(parseExperiment("#build=graphify&module=constructor"), defaultExperiment("graphify"));
  const extra = { ...defaultExperiment("signal"), token: "not-for-sharing", arbitrary: "<script>" };
  assert.equal(shareExperiment(extra), "#build=signal&deviation=15&corroborated=0");
});

test("brief selections are independent and canonical links do not change the evidence", () => {
  const first = defaultExperiment("briefing");
  first.chosen.push("routing");
  assert.deepEqual(defaultExperiment("briefing").chosen, ["fleet", "authority"]);
  const saved = parseExperiment(shareExperiment(first));
  assert.deepEqual(saved.chosen, ["fleet", "routing", "authority"]);
  assert.match(BRIEF_FACTS.find((fact) => fact.id === "routing").fact, /did not establish a current routing inventory/);
  assert.equal(FLEET_EVIDENCE.routingVerified, null);
});

test("unknown evidence stays unverified while an observed zero remains zero", () => {
  for (const value of [null, undefined, NaN, Infinity, -1, 1.5, "19", false])
    assert.equal(evidenceCount(value), "Not verified");
  assert.equal(evidenceCount(0), "0");
  assert.equal(evidenceCount(19), "19");
});

test("the latest fleet reconciles container and virtual-machine scopes without renewing its timestamp", () => {
  assert.equal(FLEET_EVIDENCE.containers.running, 19);
  assert.equal(FLEET_EVIDENCE.containers.zeus + FLEET_EVIDENCE.containers.apollo, FLEET_EVIDENCE.containers.running);
  assert.equal(FLEET_EVIDENCE.virtualMachines.running, 1);
  assert.equal(FLEET_EVIDENCE.provenance.observedAtUtc, "2026-09-07T23:14:58.5008542Z");
  assert.equal(FLEET_EVIDENCE.provenance.auditCollectedAtUtc, "2026-09-07T23:29:51.3400781Z");
  assert.equal(FLEET_EVIDENCE.expires, null);
  for (const command of ["fleet", " STATUS ", "sitrep", "current", "verify"]) {
    const text = evidenceCommand(command).join("\n");
    assert.match(text, /19 LXC CONTAINERS · 1 QEMU VIRTUAL MACHINE/);
    assert.doesNotMatch(text, /18\/19|VALID THROUGH|EXPORT VALID/);
  }
});

test("routing aliases cannot promote the archived inventory into the new observation", () => {
  for (const command of ["routes", "LANES"]) {
    const text = evidenceCommand(command).join("\n");
    assert.match(text, /Public lanes: Not verified/);
    assert.match(text, /Private catalog: Not verified/);
    assert.doesNotMatch(text, /\b10\b|\b36\b|Public lanes: 0/);
  }
  assert.match(evidenceCommand("archive").join("\n"), /28 August 2026 · Routing: 21 August 2026/);
  assert.equal(evidenceCommand("whoami"), null, "non-evidence commands retain the established console behavior");
  assert.doesNotMatch(evidenceCommand("42").join("\n"), /EXPIRES|27 SEPTEMBER/);
  const brief = BRIEF_FACTS.map((item) => `${item.fact} ${item.consequence} ${item.source}`).join("\n");
  assert.match(brief, /19 LXC containers and 1 QEMU virtual machine/);
  assert.match(brief, /Current lane counts remain unverified/);
  assert.doesNotMatch(brief, /18 of 19|10 model lanes|28 Aug|21 Aug/);
});

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
