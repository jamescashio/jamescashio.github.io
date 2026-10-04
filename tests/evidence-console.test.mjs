import { test } from "node:test";
import assert from "node:assert/strict";
import { EVIDENCE, LORE, PAGE, evidenceReply, nearestCommand } from "../src/helios/evidence-console.js";
import { FLEET } from "../src/helios/fleet.js";

test("listed E.V.E. commands answer only from the dated export", () => {
  assert.match(evidenceReply("fleet").join(" "), new RegExp(FLEET.observedLong));
  assert.match(evidenceReply("routes").join(" "), /Routing verification: not established/);
  for (const [command, lines] of Object.entries(EVIDENCE)) {
    for (const line of lines) assert.doesNotMatch(line, /^lore ·/, `${command} must not carry lore`);
  }
});

test("spend stays withheld until it is measured again", () => {
  const cost = evidenceReply("cost").join(" ");
  assert.match(cost, /withheld/);
  assert.doesNotMatch(cost, /\d+\s*¢|per day/);
});

test("unlisted lore replies are labelled and never pose as evidence", () => {
  for (const [command, lines] of Object.entries(LORE)) {
    assert.ok(lines.length > 0, command);
    for (const line of lines) assert.match(line, /^(lore|denied) · /, `${command} is labelled`);
  }
  assert.match(evidenceReply("  Make   It   So ").join(" "), /Order received/);
  assert.match(evidenceReply("admiral").join(" "), new RegExp(`${FLEET.lxc} containers`));
  assert.match(evidenceReply("nonsense")[0], /unknown command: nonsense\. Try help\./);
  assert.doesNotMatch(evidenceReply("nonsense")[0], /Did you mean/);
});

test("plain questions reach their labelled lore reply", () => {
  assert.deepEqual(evidenceReply("What is your name?"), LORE.eve);
  assert.deepEqual(evidenceReply("  Who  are you "), LORE.eve);
  assert.deepEqual(evidenceReply("Doug"), LORE.whoami);
  assert.deepEqual(evidenceReply("hi!"), LORE.hello);
  assert.deepEqual(evidenceReply("fleet?"), EVIDENCE.fleet);
  assert.deepEqual(evidenceReply("What is HERMES?"), EVIDENCE.hermes);
  assert.deepEqual(evidenceReply("show me zeus"), EVIDENCE.hosts);
  assert.deepEqual(evidenceReply("show me the backups"), EVIDENCE.backups);
  assert.match(evidenceReply("does HERMES control Zeus?")[0], /unknown command/);
});

test("the help text lists every evidence command and hints at the hidden ones", () => {
  const help = evidenceReply("help").join(" ");
  for (const command of Object.keys(EVIDENCE)) assert.ok(help.includes(command), command);
  assert.match(help, /not listed/);
  for (const command of Object.keys(LORE)) assert.ok(!help.includes(` ${command} `), `${command} stays hidden`);
});

test("public copy in the console avoids dashes as punctuation", () => {
  for (const lines of [...Object.values(EVIDENCE), ...Object.values(LORE)])
    for (const line of lines) assert.doesNotMatch(line, /[–—]/);
});

test("Individual facts retain their audit date instead of inheriting the later fleet observation", () => {
  for (const command of ["dsh", "routes"]) {
    const reply = evidenceReply(command).join(" ");
    assert.match(reply, /September 18, 2026/);
    assert.doesNotMatch(reply, /October 3, 2026/);
  }
  for (const command of ["fleet", "hosts", "atlas", "hermes"])
    assert.match(evidenceReply(command).join(" "), /October 3, 2026/);
  assert.match(evidenceReply("backups").join(" "), /October 3, 2026/);
  assert.match(evidenceReply("hermes").join(" "), /49 enabled of 56 retained definitions/);
  assert.match(evidenceReply("atlas").join(" "), /Primary local model configuration/);
  assert.match(evidenceReply("atlas").join(" "), /settings read, not an inference test/);
  assert.match(evidenceReply("dsh").join(" "), /September 8, 2026/);
});

test("a near miss names the closest listed command", () => {
  assert.equal(nearestCommand("fleets"), "fleet");
  assert.equal(nearestCommand("host"), "hosts");
  assert.equal(nearestCommand("hermes jobs"), "hermes");
  assert.equal(nearestCommand("kernal"), "kernel");
  assert.equal(nearestCommand("xyzzy"), null);
  assert.equal(nearestCommand("ls"), null);
  assert.match(evidenceReply("Fleets")[0], /unknown command: fleets\. Did you mean fleet\? Try help\./);
});

test("about and contact repeat the page's own words and are neither evidence nor lore", () => {
  assert.deepEqual(evidenceReply("about"), PAGE.about);
  assert.deepEqual(evidenceReply("Who is Doug?"), PAGE.about);
  assert.deepEqual(evidenceReply("contact"), PAGE.contact);
  assert.deepEqual(evidenceReply("hire"), PAGE.contact);
  for (const lines of Object.values(PAGE))
    for (const line of lines) {
      assert.doesNotMatch(line, /^lore/);
      assert.doesNotMatch(line, /[–—]/);
    }
  assert.match(evidenceReply("help").join(" "), /about · contact/);
});
