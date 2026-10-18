import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

test("current experience bookmarks never redirect to V39 before V40 can open them", async () => {
  const script = await readFile(new URL("../public/v40-entry.js", import.meta.url), "utf8");
  for (const hash of ["#flight=board", "#film=intro", "#signature", "#lensing", "#build=briefing"]) {
    const url = new URL("https://cashio.us/" + hash);
    let replacement;
    vm.runInNewContext(script, {
      URL,
      location: {
        href: url.href,
        pathname: url.pathname,
        search: "",
        replace: (next) => {
          replacement = next;
        },
      },
      history: { state: null, replaceState: () => {} },
      window: { addEventListener: () => {} },
    });
    assert.equal(replacement, undefined, `${hash} belongs to the current edition`);
  }
});

test("ordinary V40 navigation cannot send a visitor into the version archive", async () => {
  const environment = new JSDOM("<!doctype html><html><body></body></html>");
  Object.assign(globalThis, { window: environment.window, document: environment.window.document });
  const { V40Page } = await import("../src/v40/page.jsx");
  const doc = new JSDOM(renderToStaticMarkup(React.createElement(V40Page))).window.document;
  const archive = [...doc.querySelectorAll('a[href^="/v39/"]')];
  assert.deepEqual(
    archive.map((link) => link.textContent.trim()),
    ["V39.8 First Light · preserved edition"],
    "only the explicitly labeled version history link may open V39",
  );
  assert.ok(doc.querySelector('a[href="#flight=board"]'));
  assert.ok(doc.querySelector('a[href="#experiment=briefing"]'));
  assert.ok(doc.querySelector('a[href="#signature"]'));
  environment.window.close();
});
