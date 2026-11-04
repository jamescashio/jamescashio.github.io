import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

// Starfall is decorative: these tests hold it to its contract. It stays outside React's DOM,
// honours Pause and reduced motion, ignores typing and modifier keys, and leaves nothing behind.
const PAGE = `<!doctype html><html data-motion="on"><body>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <div id="v40-root"><header></header>
    <nav aria-label="Sections"><a href="#top">c</a><a href="#rooms">Worlds</a><a href="#studies">Experiments</a><a href="#contact">Contact</a></nav>
    <main id="main-content">
      <section id="top"><h1>Hero</h1></section>
      <section id="rooms"><h2>Pick a world.</h2></section>
      <section id="studies"><h2>Take the controls.</h2><input id="field" /></section>
      <section id="contact"><h2>Say hello.</h2></section>
    </main>
  </div></body></html>`;

const GLOBALS = [
  "window",
  "document",
  "navigator",
  "matchMedia",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "IntersectionObserver",
  "ResizeObserver",
  "MutationObserver",
  "sessionStorage",
  "getComputedStyle",
  "CustomEvent",
  "HTMLElement",
  "Element",
];

function mount({ reduced = false, motion = "on", hidden = false } = {}) {
  const dom = new JSDOM(PAGE, { url: "https://cashio.us/", pretendToBeVisual: true });
  const { window } = dom;
  window.document.documentElement.dataset.motion = motion;
  Object.defineProperty(window.document, "hidden", { configurable: true, get: () => hidden });
  const queries = [];
  window.matchMedia = (query) => {
    const mq = {
      media: query,
      matches: /reduced-motion/.test(query) ? reduced : /hover: hover/.test(query),
      addEventListener() {},
      removeEventListener() {},
    };
    queries.push(mq);
    return mq;
  };
  const observers = [];
  window.IntersectionObserver = class {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      this.targets = [];
      observers.push(this);
    }
    observe(target) {
      this.targets.push(target);
    }
    disconnect() {
      this.targets = [];
    }
  };
  window.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
  // A frame scheduler the test drives by hand.
  let frames = [];
  window.requestAnimationFrame = (cb) => {
    frames.push(cb);
    return frames.length;
  };
  window.cancelAnimationFrame = () => {};
  window.HTMLCanvasElement.prototype.getContext = () => null;
  for (const key of GLOBALS)
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: window[key] ?? window });
  globalThis.window = window;
  globalThis.document = window.document;
  const flush = () => {
    const pending = frames;
    frames = [];
    pending.forEach((cb) => cb(performance.now()));
  };
  return { window, document: window.document, observers, flush };
}

const typeKeys = (window, target, text, init = {}) => {
  for (const key of text) target.dispatchEvent(new window.KeyboardEvent("keydown", { key, bubbles: true, ...init }));
};
const sfNodes = (document) =>
  document.querySelectorAll(".sf-sky, .sf-nebula, .sf-overlay, .sf-locks, .sf-flight, .sf-toast");

test("Starfall installs once, outside React's root, with every decorative layer hidden from assistive tech", async () => {
  const { installStarfall } = await import("../src/v40/starfall.ts");
  const { document } = mount();
  const rootBefore = document.getElementById("v40-root").innerHTML;
  const stop = installStarfall();
  try {
    assert.ok(document.documentElement.classList.contains("sf-on"));
    assert.equal(document.getElementById("v40-root").innerHTML, rootBefore, "React's DOM is never touched");
    const layers = [...sfNodes(document)];
    assert.equal(layers.length, 7, "two nebula washes, sky, overlay, locks, flight and toast");
    for (const layer of layers) assert.equal(layer.parentElement, document.body);
    for (const layer of layers.filter((l) => !l.classList.contains("sf-toast")))
      assert.equal(layer.getAttribute("aria-hidden"), "true");
    const toast = document.querySelector(".sf-toast");
    assert.equal(toast.getAttribute("role"), "status");
    assert.equal(toast.hasAttribute("aria-hidden"), false);
    assert.equal(
      document.querySelectorAll("[tabindex], .sf-overlay a, .sf-overlay button").length,
      0,
      "nothing focusable",
    );
    const again = installStarfall();
    assert.equal(sfNodes(document).length, 7, "a second install is a no-op");
    again();
    assert.equal(sfNodes(document).length, 7, "the no-op cleanup leaves the first install alone");
  } finally {
    stop();
  }
});

test("cleanup removes every layer, the html flag and all listeners", async () => {
  const { installStarfall } = await import("../src/v40/starfall.ts");
  const { window, document } = mount();
  // Count every listener Starfall adds, and require each one back off at cleanup.
  // jsdom registers a few listeners of its own (mouseover, mouseout); only Starfall's event types count.
  const OURS = new Set([
    "scroll",
    "resize",
    "pointermove",
    "pointerleave",
    "pointerdown",
    "click",
    "keydown",
    "visibilitychange",
    "cashio-starfall",
  ]);
  const live = new Map();
  for (const target of [window, document, document.documentElement]) {
    const add = target.addEventListener.bind(target);
    const remove = target.removeEventListener.bind(target);
    target.addEventListener = (type, fn, opts) => {
      if (OURS.has(type)) live.set(fn, `${type}`);
      return add(type, fn, opts);
    };
    target.removeEventListener = (type, fn, opts) => {
      live.delete(fn);
      return remove(type, fn, opts);
    };
  }
  const stop = installStarfall();
  assert.ok(live.size >= 8, "scroll, pointer, key, click, resize, visibility and egg listeners are attached");
  stop();
  assert.deepEqual([...live.values()], [], "every listener is removed");
  assert.equal(sfNodes(document).length, 0);
  assert.equal(document.documentElement.classList.contains("sf-on"), false);
  assert.equal(document.documentElement.dataset.sfMotion, undefined);
});

test("the motion flag follows Pause and reduced motion, not a background tab", async () => {
  const { installStarfall } = await import("../src/v40/starfall.ts");
  let view = mount({ hidden: true });
  let stop = installStarfall();
  assert.equal(
    view.document.documentElement.dataset.sfMotion,
    "on",
    "a page opened in a background tab still gets its effects",
  );
  view.document.documentElement.dataset.motion = "off";
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(view.document.documentElement.dataset.sfMotion, "off", "Pause turns the effects off");
  stop();
  view = mount({ reduced: true });
  stop = installStarfall();
  assert.equal(view.document.documentElement.dataset.sfMotion, "off", "reduced motion keeps them off");
  stop();
});

test("typed eggs fire from the page but never from a form field or with modifier keys", async () => {
  const { installStarfall } = await import("../src/v40/starfall.ts");
  const { window, document } = mount();
  const stop = installStarfall();
  try {
    const toast = document.querySelector(".sf-toast");
    typeKeys(window, document.getElementById("field"), "zoom");
    assert.equal(toast.textContent, "", "typing in an input is ignored");
    typeKeys(window, document.body, "zoom", { ctrlKey: true });
    assert.equal(toast.textContent, "", "modifier chords are ignored");
    typeKeys(window, document.body, "zoom");
    assert.match(toast.textContent, /test pilot/);
    assert.equal(toast.dataset.show, "true");
  } finally {
    stop();
  }
});

test("E.V.E. commands reach the sky, and a paused page explains instead of moving", async () => {
  const { installStarfall } = await import("../src/v40/starfall.ts");
  let view = mount();
  let stop = installStarfall();
  view.window.dispatchEvent(new view.window.CustomEvent("cashio-starfall", { detail: "starfall" }));
  assert.match(view.document.querySelector(".sf-toast").textContent, /Make a wish/);
  view.window.dispatchEvent(new view.window.CustomEvent("cashio-starfall", { detail: "constructor" }));
  assert.match(view.document.querySelector(".sf-toast").textContent, /Make a wish/, "unknown details are ignored");
  stop();
  view = mount({ motion: "off" });
  stop = installStarfall();
  view.window.dispatchEvent(new view.window.CustomEvent("cashio-starfall", { detail: "engage" }));
  assert.match(view.document.querySelector(".sf-toast").textContent, /Motion is paused/);
  stop();
});

test("E.V.E. answers the Starfall commands and dispatches only known ones", async () => {
  const { V40Page } = await import("../src/v40/page.tsx");
  const { window } = mount();
  const seen = [];
  window.addEventListener("cashio-starfall", (e) => seen.push(e.detail));
  const receiver = {
    state: { eveLog: [], eveInput: "" },
    setState(update) {
      Object.assign(this.state, typeof update === "function" ? update(this.state) : update);
    },
  };
  for (const cmd of ["starfall", "engage", "zoom", "mach", "constructor"]) V40Page.prototype.eve.call(receiver, cmd);
  assert.deepEqual(seen, ["starfall", "engage", "zoom"]);
  assert.ok(receiver.state.eveLog.some(([kind, text]) => kind === "lore" && /Yeager/.test(text)));
});

test("chapter target locks appear with motion and never under reduced motion", async () => {
  const { installStarfall } = await import("../src/v40/starfall.ts");
  for (const reduced of [false, true]) {
    const { document, observers } = mount({ reduced });
    const stop = installStarfall();
    const headings = observers.find((o) => o.options?.threshold === 0.75);
    assert.ok(headings, "chapter headings are observed");
    assert.equal(headings.targets.length, 3);
    const h2 = headings.targets[0];
    h2.getBoundingClientRect = () => ({ left: 40, top: 100, width: 300, height: 60, right: 340, bottom: 160 });
    headings.callback([{ isIntersecting: true, target: h2 }]);
    assert.equal(document.querySelectorAll(".sf-lock").length, reduced ? 0 : 1);
    headings.callback([{ isIntersecting: true, target: h2 }]);
    assert.equal(document.querySelectorAll(".sf-lock").length, reduced ? 0 : 1, "each heading locks only once");
    stop();
  }
});

test("the skip link never triggers a hyperspace jump; chapter links do, once per throttle window", async () => {
  const { installStarfall } = await import("../src/v40/starfall.ts");
  const { window, document } = mount();
  const stop = installStarfall();
  try {
    const jump = document.querySelector(".sf-jump");
    document
      .querySelector(".skip-link")
      .dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
    assert.equal(jump.classList.contains("sf-go"), false);
    const rail = document.querySelector('nav a[href="#rooms"]');
    rail.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
    assert.equal(jump.classList.contains("sf-go"), true);
    jump.classList.remove("sf-go");
    document.querySelector('nav a[href="#studies"]').dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    assert.equal(jump.classList.contains("sf-go"), false, "rapid rail clicks do not stack flashes");
  } finally {
    stop();
  }
});
