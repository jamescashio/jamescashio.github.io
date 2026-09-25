import { test } from "node:test";
import assert from "node:assert/strict";
import { EVIDENCE, LORE, evidenceReply } from "../src/helios/evidence-console.js";
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
