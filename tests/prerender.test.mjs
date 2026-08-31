import assert from "node:assert/strict";
import test from "node:test";

import { injectPrerenderedApp, renderCashioApp } from "../scripts/prerender.mts";

test("renderCashioApp renders the real nine-deck command tree without browser globals", () => {
  assert.equal("window" in globalThis, false);
  assert.equal("document" in globalThis, false);

  const markup = renderCashioApp();

  assert.match(markup, /OWN THE IRON/);
  assert.equal((markup.match(/data-deck="\d"/g) ?? []).length, 9);
  assert.match(markup, /aria-label="CONTACT deck"/);
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
