import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JSDOM } from "jsdom";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

test("current E.V.E. treats inherited object names as unknown and still answers legitimate commands", async () => {
  const { V40Page } = await import("../src/v40/page.jsx");
  const receiver = {
    state: { eveLog: [], eveInput: "" },
    setState(update) {
      Object.assign(this.state, typeof update === "function" ? update(this.state) : update);
    },
  };
  for (const command of ["constructor", "__proto__", "valueOf", "__defineGetter__"]) {
    assert.doesNotThrow(() => V40Page.prototype.eve.call(receiver, command));
    assert.ok(receiver.state.eveLog.some(([kind, text]) => kind === "er" && text.includes(command)));
  }
  V40Page.prototype.eve.call(receiver, "fleet");
  assert.ok(receiver.state.eveLog.some(([kind, text]) => kind === "ok" && text.includes("containers")));
  V40Page.prototype.eve.call(receiver, "clear");
  assert.deepEqual(receiver.state.eveLog, []);
});

test("fragment destinations reveal only their enclosing disclosures, including encoded IDs", async () => {
  const { revealHashTarget } = await import("../src/v40/navigation.js");
  const doc = new JSDOM(
    '<details id="other"><summary>Other</summary></details><details id="outer"><summary>Films</summary><details id="inner"><summary>Exercise</summary><div id="privacy-test"></div></details></details>',
  ).window.document;
  assert.equal(typeof revealHashTarget, "function");
  assert.equal(revealHashTarget(doc, "#privacy%2Dtest"), doc.getElementById("privacy-test"));
  assert.equal(doc.getElementById("outer").open, true);
  assert.equal(doc.getElementById("inner").open, true);
  assert.equal(doc.getElementById("other").open, false);
  assert.equal(revealHashTarget(doc, "#%broken"), null);
  assert.equal(revealHashTarget(doc, "#film=constructor"), null);
});

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

async function initialSectionLifecycle(initialState = "interactive") {
  const environment = new JSDOM('<!doctype html><html><body><section id="operator"></section></body></html>', {
    url: "https://cashio.us/#operator",
    runScripts: "outside-only",
  });
  const win = environment.window;
  let state = initialState;
  Object.defineProperty(win.document, "readyState", { get: () => state });
  Object.defineProperty(win.document, "fonts", { value: { ready: Promise.resolve() } });
  win.matchMedia = () => ({ matches: true, addEventListener() {} });
  const frames = [];
  win.requestAnimationFrame = (callback) => frames.push(callback);
  let visibleSection = "old browser position";
  win.Element.prototype.scrollIntoView = function () {
    visibleSection = this.id;
  };
  const flush = async () => {
    for (let step = 0; step < 4; step++) {
      for (const callback of frames.splice(0)) await callback();
      await Promise.resolve();
    }
  };
  win.eval(await readFile(new URL("../src/v40/polish.js", import.meta.url), "utf8"));
  win.dispatchEvent(new win.Event("cashio-ready"));
  return {
    win,
    flush,
    visible: () => visibleSection,
    load(position) {
      state = "complete";
      win.dispatchEvent(new win.Event("load"));
      visibleSection = position;
    },
  };
}

for (const initialState of ["interactive", "complete"]) {
  test(`V40 restores its section after the browser finishes loading (${initialState})`, async () => {
    const lifecycle = await initialSectionLifecycle(initialState);
    try {
      await lifecycle.flush();
      if (initialState !== "complete") {
        assert.equal(lifecycle.visible(), "old browser position", "loading has not finished restoring browser state");
        lifecycle.load("browser restored position after load");
        await lifecycle.flush();
      }
      assert.equal(lifecycle.visible(), "operator", "the requested V40 section wins after browser scroll restoration");
    } finally {
      lifecycle.win.close();
    }
  });
}

for (const intent of ["wheel", "touchstart", "pointerdown", "keydown"]) {
  test(`V40 initial section restoration yields to visitor ${intent}`, async () => {
    const lifecycle = await initialSectionLifecycle();
    try {
      await lifecycle.flush();
      lifecycle.win.dispatchEvent(new lifecycle.win.Event(intent));
      lifecycle.load("reader's new position");
      await lifecycle.flush();
      assert.equal(lifecycle.visible(), "reader's new position");
    } finally {
      lifecycle.win.close();
    }
  });
}

for (const action of ["new hash", "open menu"]) {
  test(`V40 initial restoration does not interrupt ${action}`, async () => {
    const lifecycle = await initialSectionLifecycle();
    try {
      await lifecycle.flush();
      if (action === "new hash") lifecycle.win.location.hash = "contact";
      else lifecycle.win.document.querySelector("#mission-dialog").setAttribute("open", "");
      lifecycle.load("reader's new position");
      await lifecycle.flush();
      assert.equal(lifecycle.visible(), "reader's new position");
    } finally {
      lifecycle.win.close();
    }
  });
}
