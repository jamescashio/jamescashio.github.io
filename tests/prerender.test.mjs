import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

import { injectPrerenderedApp, renderCashioApp } from "../scripts/prerender.mts";

test("renderCashioApp renders the real nine-deck command tree without browser globals", () => {
  assert.equal("window" in globalThis, false);
  assert.equal("document" in globalThis, false);

  const markup = renderCashioApp();

  assert.match(markup, /OWN THE IRON/);
  assert.equal((markup.match(/data-deck="\d"/g) ?? []).length, 9);
  assert.match(markup, /aria-label="CONTACT deck"/);
});

test("prerendered native hashes share the canonical eight-pixel deck landing", () => {
  const dom = new JSDOM(renderCashioApp());
  const deckIds = ["grid", "routing", "iron", "lineage", "builds", "operator", "eve", "contact"];

  for (const [offset, id] of deckIds.entries()) {
    const anchor = dom.window.document.getElementById(`deck=${id}`);
    const section = dom.window.document.querySelector(`section[data-deck="${offset + 1}"]`);
    assert.ok(anchor, `native ${id} anchor must exist`);
    assert.equal(anchor.parentElement, section, `native ${id} anchor must resolve from the deck's canonical edge`);
    assert.equal(anchor.style.position, "absolute", `native ${id} positioning must not wait for the full stylesheet`);
    assert.equal(anchor.style.left, "0px", `native ${id} must resolve from the deck's left edge`);
    assert.equal(anchor.style.top, "-8px", `native ${id} must match the runtime offsetTop - 8 contract`);
  }

  const builds = dom.window.document.querySelector('section[data-deck="5"]');
  for (let article = 1; article <= 7; article += 1) {
    const anchor = dom.window.document.getElementById(`deck=builds&article=${article}`);
    assert.equal(anchor?.parentElement, builds, `article ${article} must land from the Builds deck edge`);
    assert.equal(anchor?.style.position, "absolute", `article ${article} positioning must be available preactivation`);
    assert.equal(anchor?.style.top, "-8px", `article ${article} must share the canonical Builds landing`);
  }
  dom.window.close();
});

test("renderCashioApp keeps its initial validity markup deterministic across calendar days", () => {
  const realNow = Date.now;
  try {
    Date.now = () => Date.parse("2026-08-31T12:00:00Z");
    const augustMarkup = renderCashioApp();
    Date.now = () => Date.parse("2026-09-01T12:00:00Z");
    const septemberMarkup = renderCashioApp();

    assert.equal(septemberMarkup, augustMarkup);
    assert.match(augustMarkup, /EXPORT STATUS · DATED/);
    assert.match(augustMarkup, /VALID THRU 10-02-2026/);
    assert.doesNotMatch(augustMarkup, /\d+D LEFT/);
  } finally {
    Date.now = realNow;
  }
});

test("injectPrerenderedApp replaces one empty root and preserves its document", () => {
  const documentHtml = [
    "<!doctype html>",
    '<html lang="en">',
    "<head><title>Cashio fixture</title></head>",
    '<body><div id="before">before</div><div id="root"></div><div id="after">after</div></body>',
    "</html>",
  ].join("");

  const result = injectPrerenderedApp(documentHtml, '<main data-test="real-tree">OWN THE IRON</main>');

  assert.match(result, /^<!doctype html>/);
  assert.match(result, /<title>Cashio fixture<\/title>/);
  assert.match(result, /<div id="before">before<\/div>/);
  assert.match(result, /<div id="root" data-prerendered="v35"><main data-test="real-tree">OWN THE IRON<\/main><\/div>/);
  assert.match(result, /<div id="after">after<\/div>/);
  assert.equal((result.match(/id="root"/g) ?? []).length, 1);
});

test("injectPrerenderedApp rejects missing and multiple root markers", () => {
  assert.throws(
    () => injectPrerenderedApp("<!doctype html><html><body></body></html>", "<main />"),
    /exactly one empty root/i,
  );
  assert.throws(
    () =>
      injectPrerenderedApp(
        '<!doctype html><html><body><div id="root"></div><div id="root"></div></body></html>',
        "<main />",
      ),
    /exactly one empty root/i,
  );
});

test("injectPrerenderedApp requires an exact id attribute and preserves replacement tokens literally", () => {
  assert.throws(
    () => injectPrerenderedApp('<!doctype html><div data-id="root"></div>', "<main />"),
    /exactly one empty root/i,
  );

  const appHtml = "<main>$& $' $`</main>";
  const result = injectPrerenderedApp('<!doctype html><div data-id="root"></div><div id="root"></div>', appHtml);

  assert.match(result, /<div data-id="root"><\/div>/);
  assert.ok(result.includes(`<div id="root" data-prerendered="v35">${appHtml}</div>`));
});
