import test from "node:test";
import assert from "node:assert/strict";
import { runEve } from "../src/components/eve-console.tsx";
import { runPublicEve } from "../src/odyssey/public-console.ts";

test("public console commands reach the named homepage sections independently of historical deck positions", () => {
  const cases = [
    [["snapshot", "deck 01"], "#evidence"],
    [["grid", "the grid", "deck 02"], "#universe"],
    [["routing", "deck 03"], "#build=hermes"],
    [["iron", "the iron", "deck 04"], "#universe"],
    [["lineage", "deck 05"], "#lineage"],
    [["builds", "deck 06"], "#work"],
    [["operator", "deck 07"], "#operator"],
    [["eve", "E.V.E.", "deck 08"], "#evidence"],
    [["contact", "talk", "deck 09"], "#contact"],
  ];
  for (const [commands, destination] of cases) {
    for (const command of commands) {
      const reply = runPublicEve(`  ${command.toUpperCase()}  `);
      assert.equal(reply.destination?.href, destination, command);
      assert.ok(reply.destination.label.length > 8, "links name the destination");
    }
  }
  assert.match(runPublicEve("routing").out.join(" "), /ILLUSTRATION.*NO LIVE ROUTING/);
  assert.match(runPublicEve("help").out.join(" "), /builds · lineage · operator/);
});

test("the public console keeps current evidence separate from historical replies", () => {
  for (const command of ["status", "sitrep", "current", "fleet", "verify", "evidence"]) {
    const reply = runPublicEve(command).out.join("\n");
    assert.match(reply, /19 LXC CONTAINERS · 1 QEMU VIRTUAL MACHINE/);
    assert.match(reply, /2026-09-07T23:14:58.5008542Z/);
    assert.doesNotMatch(reply, /18\/19|VALID THROUGH|EXPORT VALID/);
  }
  for (const command of ["routes", "lanes"]) {
    const reply = runPublicEve(command);
    assert.match(reply.out.join(" "), /Public lanes: Not verified.*Private catalog: Not verified/);
    assert.equal(reply.destination, undefined, "a fleet command does not silently open a model");
  }
  assert.match(runPublicEve("archive").out.join(" "), /HISTORICAL ARCHIVE.*28 August 2026/);
  assert.match(runEve("status").out.join(" "), /18\/19 AT 28 AUG PROBE/);
});

test("shared personality, history, and local controls preserve the original console replies", () => {
  for (const command of [
    "whoami",
    "withheld",
    "photo",
    "red alert",
    "history",
    "tron",
    "yeager",
    "engage",
    "make it so",
    "not a command",
  ]) {
    assert.deepEqual(runPublicEve(command, ["fleet", "whoami"]), runEve(command, ["fleet", "whoami"]), command);
  }
  assert.deepEqual(runPublicEve("history").out, ["NO COMMAND HISTORY"]);
  assert.deepEqual(runEve("talk"), { out: ["CHANNEL LOCK · OPEN", "DOUG@CASHIO.US"], go: 8 });
  assert.deepEqual(runEve("lineage"), { out: ["NAVIGATING · LINEAGE"], go: 4 });
  assert.match(runPublicEve("  BIT  ").out.join(" "), /HUMAN IS STILL IN COMMAND/);
  assert.equal(runPublicEve("rutan").destination.href, "#lineage");
});

test("cost replies distinguish the published July sample from current spending", () => {
  const current = runPublicEve("cost");
  const legacy = runEve("cost");
  assert.deepEqual(current.out, legacy.out);
  assert.match(current.out.join(" "), /HISTORICAL.*\$0\.26\/DAY.*21–22 JULY 2026/);
  assert.match(current.out.join(" "), /EXCLUDES.*INFRASTRUCTURE.*ELECTRICITY/);
  assert.match(current.out.join(" "), /CURRENT SPEND AND SAVINGS COMPARISON REMAIN UNVERIFIED/);
  assert.equal(current.destination.href, "#smart-routing");
});

test("inherited object keys and arbitrary text always produce renderable command output", () => {
  for (const run of [runPublicEve, runEve]) {
    for (const command of ["constructor", "__proto__", "toString", "hasOwnProperty", "<script>alert(1)</script>"]) {
      const reply = run(command);
      assert.equal(reply.bad, true, command);
      assert.ok(Array.isArray(reply.out) && reply.out.every((line) => typeof line === "string"), command);
      assert.match(reply.out[0], /^UNKNOWN COMMAND/);
    }
  }
});
