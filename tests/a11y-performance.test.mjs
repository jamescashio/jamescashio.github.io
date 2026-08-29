import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { CommandDeck } from "../src/components/command-deck.tsx";
import { getSound } from "../src/lib/sound.ts";
import { useDeck } from "../src/lib/store.ts";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let focusHelpers;
let stageScheduler;
try {
  focusHelpers = await import("../src/lib/deck-focus.ts");
} catch {
  focusHelpers = null;
}
try {
  stageScheduler = await import("../src/lib/stage-load-scheduler.ts");
} catch {
  stageScheduler = null;
}

const stylesheet = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const documentMarkup = await readFile(new URL("../index.html", import.meta.url), "utf8");

function responsiveSources(picture) {
  return [...picture.querySelectorAll(":scope > source")].map((source) => ({
    media: source.getAttribute("media"),
    type: source.getAttribute("type"),
    srcset: source.getAttribute("srcset"),
    sizes: source.getAttribute("sizes"),
  }));
}

function selectWidthCandidate(srcset, sizes, viewportWidth, devicePixelRatio) {
  assert.equal(sizes, "100vw", "the selection model requires the viewport-width slot used by production");
  const candidates = srcset
    .split(",")
    .map((candidate) => candidate.trim().match(/^(\S+)\s+(\d+)w$/))
    .map((match) => {
      assert.ok(match, `invalid width candidate in ${srcset}`);
      return { url: match[1], width: Number(match[2]) };
    })
    .sort((a, b) => a.width - b.width);
  const requiredWidth = viewportWidth * devicePixelRatio;
  return candidates.find((candidate) => candidate.width >= requiredWidth) ?? candidates.at(-1);
}

function mountCommandDeck({
  url = "https://cashio.us/#deck=snapshot",
  reducedMotion = true,
  controlledTimers = false,
  capturePulseTimers = false,
  injectStyles = false,
  canvasRuntime = false,
  now = Date.now(),
  responsiveGeometry = false,
  deferredSmoothScroll = false,
  viewport = { width: 1440, height: 900 },
} = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url,
  });
  const realDateNow = Date.now;
  let controlledNow = now;
  const realSetTimeout = dom.window.setTimeout.bind(dom.window);
  const realClearTimeout = dom.window.clearTimeout.bind(dom.window);
  const controlledTimeouts = new Map();
  const clearedControlledTimeouts = [];
  let controlledTimeoutId = 1_000_000;
  let responsiveViewport = "desktop";
  let motionReduced = reducedMotion;
  const motionListeners = new Set();
  const motionMedia = {
    get matches() {
      return motionReduced;
    },
    media: "(prefers-reduced-motion: reduce)",
    addEventListener(type, listener) {
      if (type === "change") motionListeners.add(listener);
    },
    removeEventListener(type, listener) {
      if (type === "change") motionListeners.delete(listener);
    },
  };
  const setTimeout = (callback, delay = 0, ...args) => {
    const timeout = Number(delay);
    if (
      controlledTimers &&
      (timeout === 120 ||
        timeout === 400 ||
        timeout === 500 ||
        timeout === 560 ||
        timeout === 2200 ||
        timeout === 3200 ||
        timeout >= 7000 ||
        (capturePulseTimers && (timeout === 680 || timeout === 1100 || timeout === 1900)))
    ) {
      const id = ++controlledTimeoutId;
      controlledTimeouts.set(id, { callback: () => callback(...args), delay: timeout });
      return id;
    }
    return realSetTimeout(callback, timeout, ...args);
  };
  const clearTimeout = (id) => {
    const controlled = controlledTimeouts.get(id);
    if (controlled) {
      controlledTimeouts.delete(id);
      clearedControlledTimeouts.push(controlled);
    } else realClearTimeout(id);
  };
  if (controlledTimers) Date.now = () => controlledNow;
  const raf = new Map();
  const canvasObservers = { resize: [], visibility: [], ownership: [] };
  const canvasPaints = [];
  const canvasContexts = new WeakMap();
  const scrollPositions = new WeakMap();
  const pendingSmoothScrolls = new WeakMap();
  const contextFor = (canvas) => {
    if (canvasContexts.has(canvas)) return canvasContexts.get(canvas);
    const context = new Proxy(
      {
        measureText: () => ({ width: 36 }),
        createLinearGradient: () => ({ addColorStop: () => {} }),
        createRadialGradient: () => ({ addColorStop: () => {} }),
      },
      {
        get: (target, key) => (key in target ? target[key] : () => {}),
        set(target, key, value) {
          target[key] = value;
          if (key === "fillStyle" || key === "strokeStyle") canvasPaints.push({ canvas, key, value });
          return true;
        },
      },
    );
    canvasContexts.set(canvas, context);
    return context;
  };
  class TestObserver {
    constructor(callback, bucket) {
      this.callback = callback;
      this.bucket = bucket;
      this.disconnected = false;
      canvasObservers[bucket].push(this);
    }
    observe() {}
    disconnect() {
      this.disconnected = true;
    }
  }
  class TestResizeObserver extends TestObserver {
    constructor(callback) {
      super(callback, "resize");
    }
  }
  class TestIntersectionObserver extends TestObserver {
    constructor(callback) {
      super(callback, "visibility");
    }
  }
  class TestMutationObserver extends TestObserver {
    constructor(callback) {
      super(callback, "ownership");
    }
  }
  let rafId = 0;
  const requestAnimationFrame = (callback) => {
    const id = ++rafId;
    raf.set(id, callback);
    return id;
  };
  const cancelAnimationFrame = (id) => raf.delete(id);
  Object.defineProperties(dom.window, {
    innerWidth: { configurable: true, value: viewport.width },
    innerHeight: { configurable: true, value: viewport.height },
    matchMedia: {
      configurable: true,
      value: () => motionMedia,
    },
    requestAnimationFrame: { configurable: true, value: requestAnimationFrame },
    cancelAnimationFrame: { configurable: true, value: cancelAnimationFrame },
    setTimeout: { configurable: true, value: setTimeout },
    clearTimeout: { configurable: true, value: clearTimeout },
  });
  Object.defineProperty(dom.window.HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value() {
      return canvasRuntime ? contextFor(this) : null;
    },
  });
  if (canvasRuntime) {
    Object.assign(dom.window, {
      ResizeObserver: TestResizeObserver,
      IntersectionObserver: TestIntersectionObserver,
      MutationObserver: TestMutationObserver,
    });
  }
  Object.defineProperties(dom.window.HTMLElement.prototype, {
    attachEvent: { configurable: true, value: () => {} },
    detachEvent: { configurable: true, value: () => {} },
    offsetTop: {
      configurable: true,
      get() {
        if (this.dataset?.deck == null) return 0;
        return Number(this.dataset.deck) * (responsiveGeometry && responsiveViewport === "mobile" ? 1100 : 1000);
      },
    },
    offsetHeight: {
      configurable: true,
      get() {
        return this.matches?.("section[data-deck]")
          ? responsiveGeometry && responsiveViewport === "mobile"
            ? 1100
            : 1000
          : 0;
      },
    },
    scrollHeight: {
      configurable: true,
      get() {
        return this.classList?.contains("za-scroll")
          ? responsiveGeometry && responsiveViewport === "mobile"
            ? 9900
            : 9000
          : 0;
      },
    },
    clientHeight: {
      configurable: true,
      get() {
        return this.classList?.contains("za-scroll")
          ? responsiveGeometry && responsiveViewport === "mobile"
            ? 844
            : 1000
          : 0;
      },
    },
    scrollTop: {
      configurable: true,
      get() {
        return scrollPositions.get(this) ?? 0;
      },
      set(value) {
        scrollPositions.set(this, Number(value) || 0);
        pendingSmoothScrolls.delete(this);
      },
    },
    scrollTo: {
      configurable: true,
      value(options) {
        const top = typeof options === "number" ? options : options?.top;
        const requestedTop = top ?? 0;
        this.dataset.requestedScrollTop = String(requestedTop);
        if (typeof options === "object" && options?.behavior) this.dataset.requestedScrollBehavior = options.behavior;
        if (deferredSmoothScroll && typeof options === "object" && options?.behavior === "smooth") {
          pendingSmoothScrolls.set(this, requestedTop);
          return;
        }
        this.scrollTop = requestedTop;
      },
    },
  });
  const globals = [
    "window",
    "document",
    "navigator",
    "HTMLElement",
    "HTMLButtonElement",
    "Event",
    "KeyboardEvent",
    "MouseEvent",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    "ResizeObserver",
    "IntersectionObserver",
    "MutationObserver",
  ];
  const prior = Object.fromEntries(globals.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.defineProperties(globalThis, {
    window: { configurable: true, writable: true, value: dom.window },
    document: { configurable: true, writable: true, value: dom.window.document },
    navigator: { configurable: true, writable: true, value: dom.window.navigator },
    HTMLElement: { configurable: true, writable: true, value: dom.window.HTMLElement },
    HTMLButtonElement: { configurable: true, writable: true, value: dom.window.HTMLButtonElement },
    Event: { configurable: true, writable: true, value: dom.window.Event },
    KeyboardEvent: { configurable: true, writable: true, value: dom.window.KeyboardEvent },
    MouseEvent: { configurable: true, writable: true, value: dom.window.MouseEvent },
    requestAnimationFrame: { configurable: true, writable: true, value: requestAnimationFrame },
    cancelAnimationFrame: { configurable: true, writable: true, value: cancelAnimationFrame },
    ResizeObserver: {
      configurable: true,
      writable: true,
      value: canvasRuntime ? TestResizeObserver : dom.window.ResizeObserver,
    },
    IntersectionObserver: {
      configurable: true,
      writable: true,
      value: canvasRuntime ? TestIntersectionObserver : dom.window.IntersectionObserver,
    },
    MutationObserver: {
      configurable: true,
      writable: true,
      value: canvasRuntime ? TestMutationObserver : dom.window.MutationObserver,
    },
  });
  useDeck.setState({
    deck: 0,
    mode: "technical",
    audio: false,
    alert: false,
    photo: false,
    palette: false,
    tour: false,
    railOpen: false,
    shown: [0],
    bitMood: "idle",
    copyEmailState: "idle",
    craftLock: null,
  });
  const root = createRoot(dom.window.document.getElementById("root"));
  if (injectStyles) {
    const style = dom.window.document.createElement("style");
    style.textContent = stylesheet;
    dom.window.document.head.append(style);
  }
  return {
    dom,
    document: dom.window.document,
    async render() {
      await act(async () => root.render(createElement(CommandDeck)));
    },
    async click(element) {
      await act(async () => element.click());
    },
    async key(element, key, options = {}) {
      let event;
      await act(async () => {
        event = new dom.window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...options });
        element.dispatchEvent(event);
      });
      return event;
    },
    async input(element, value) {
      const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")?.set;
      assert.ok(setter, "expected the native input value setter");
      const propsKey = Object.keys(element).find((key) => key.startsWith("__reactProps$"));
      const onChange = propsKey ? element[propsKey]?.onChange : null;
      assert.equal(typeof onChange, "function", "expected the controlled input change path");
      await act(async () => {
        setter.call(element, value);
        onChange({ target: element });
      });
    },
    async settle() {
      await act(async () => {
        await new Promise((resolve) => dom.window.setTimeout(resolve, 0));
        await new Promise((resolve) => dom.window.setTimeout(resolve, 0));
      });
    },
    async scrollDeck(index) {
      const scroller = dom.window.document.querySelector("main.za-scroll");
      assert.ok(scroller, "expected the command deck scroller");
      await act(async () => {
        scroller.scrollTop = Math.max(0, index * 1000 - 8);
        scroller.dispatchEvent(new dom.window.Event("scroll"));
      });
    },
    async dispatchScroll() {
      const scroller = dom.window.document.querySelector("main.za-scroll");
      assert.ok(scroller, "expected the command deck scroller");
      await act(async () => scroller.dispatchEvent(new dom.window.Event("scroll")));
    },
    async runControlledTimeout(delay, occurrence = 0) {
      const timer = [...controlledTimeouts.entries()].filter(([, candidate]) => candidate.delay === delay)[occurrence];
      assert.ok(timer, `expected a controlled ${delay}ms timeout`);
      controlledTimeouts.delete(timer[0]);
      controlledNow += delay;
      await act(async () => timer[1].callback());
    },
    async runClearedControlledTimeout(delay, occurrence = 0) {
      const timer = clearedControlledTimeouts.filter((candidate) => candidate.delay === delay)[occurrence];
      assert.ok(timer, `expected a cleared ${delay}ms timeout`);
      await act(async () => timer.callback());
    },
    async runLatestAnimationFrame() {
      await act(async () => {
        const pending = [...raf.entries()].at(-1);
        assert.ok(pending, "expected a scheduled animation frame");
        raf.delete(pending[0]);
        pending[1](performance.now());
      });
    },
    async runAnimationFrameBatch() {
      await act(async () => {
        const pending = [...raf.entries()];
        for (const [id, callback] of pending) {
          raf.delete(id);
          callback(performance.now());
        }
      });
    },
    pendingAnimationFrames() {
      return raf.size;
    },
    pendingAnimationFramesNamed(name) {
      return [...raf.values()].filter((callback) => callback.name === name).length;
    },
    canvasPaintCount(canvas) {
      return canvasPaints.filter((paint) => !canvas || paint.canvas === canvas).length;
    },
    canvasPaintValuesSince(index, canvas) {
      return canvasPaints
        .filter((paint) => !canvas || paint.canvas === canvas)
        .slice(index)
        .map((paint) => String(paint.value));
    },
    pendingControlledTimeouts() {
      return controlledTimeouts.size;
    },
    pendingControlledTimeoutsFor(...delays) {
      return [...controlledTimeouts.values()].filter((timer) => delays.includes(timer.delay)).length;
    },
    pendingSmoothScrollTop(element) {
      return pendingSmoothScrolls.get(element) ?? null;
    },
    async canvasObserver(kind, entries = []) {
      const observer = canvasObservers[kind].at(-1);
      assert.ok(observer, `expected a ${kind} observer`);
      await act(async () => observer.callback(entries));
      return observer;
    },
    async resizeToMobile() {
      responsiveViewport = "mobile";
      await act(async () => dom.window.dispatchEvent(new dom.window.Event("resize")));
    },
    async setReducedMotion(next) {
      motionReduced = next;
      await act(async () => {
        for (const listener of motionListeners) listener({ matches: next, media: motionMedia.media });
      });
    },
    async history(direction) {
      const changed = new Promise((resolve, reject) => {
        const timeout = dom.window.setTimeout(
          () => reject(new Error(`history.${direction}() did not change hash`)),
          250,
        );
        dom.window.addEventListener(
          "hashchange",
          () => {
            dom.window.clearTimeout(timeout);
            resolve();
          },
          { once: true },
        );
      });
      await act(async () => {
        dom.window.history[direction]();
        await changed;
      });
      await this.settle();
    },
    window: dom.window,
    async cleanup() {
      await act(async () => root.unmount());
      Date.now = realDateNow;
      dom.window.close();
      for (const [key, descriptor] of Object.entries(prior)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    },
  };
}

function labeledButton(document, label) {
  const button = document.querySelector(`button[aria-label="${label}"]`);
  assert.ok(button, `expected button labelled ${label}`);
  return button;
}

function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

function deferredPromise() {
  let resolve;
  let reject;
  const promise = new Promise((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, reject, resolve };
}

function createSchedulerEnvironment({ idle = true } = {}) {
  let id = 0;
  const frames = new Map();
  const timers = new Map();
  const idles = new Map();
  const listeners = new Map();
  const environment = {
    requestAnimationFrame(callback) {
      const token = ++id;
      frames.set(token, callback);
      return token;
    },
    cancelAnimationFrame(token) {
      frames.delete(token);
    },
    setTimeout(callback, delay) {
      const token = ++id;
      timers.set(token, { callback, delay });
      return token;
    },
    clearTimeout(token) {
      timers.delete(token);
    },
    addEventListener(type, callback, options) {
      listeners.set(type, { callback, options });
    },
    removeEventListener(type, callback, options) {
      const registered = listeners.get(type);
      const capture = (value) => (typeof value === "boolean" ? value : Boolean(value?.capture));
      if (registered?.callback === callback && capture(registered.options) === capture(options)) listeners.delete(type);
    },
  };
  if (idle) {
    environment.requestIdleCallback = (callback) => {
      const token = ++id;
      idles.set(token, callback);
      return token;
    };
    environment.cancelIdleCallback = (token) => idles.delete(token);
  }
  return {
    environment,
    runFrame() {
      const entry = frames.entries().next().value;
      assert.ok(entry, "expected a scheduled animation frame");
      frames.delete(entry[0]);
      entry[1](performance.now());
    },
    runAllIdles() {
      for (const [token, callback] of [...idles]) {
        idles.delete(token);
        callback({ didTimeout: false, timeRemaining: () => 10 });
      }
    },
    runTimer(delay) {
      const entry = [...timers.entries()].find(([, timer]) => timer.delay === delay);
      assert.ok(entry, `expected a ${delay}ms timer`);
      timers.delete(entry[0]);
      entry[1].callback();
    },
    dispatch(type) {
      listeners.get(type)?.callback({ type });
    },
    listenerOptions(type) {
      return listeners.get(type)?.options;
    },
    counts() {
      return { frames: frames.size, timers: timers.size, idles: idles.size, listeners: listeners.size };
    },
  };
}

test("the normal dim token remains at the audited readable value", () => {
  assert.match(stylesheet, /--color-dim:\s*#687f97\s*;/i);
});

test("aircraft pip buttons expose 24px hit targets around separate small marks", async () => {
  const view = mountCommandDeck();
  try {
    await view.render();
    const pip = view.document.querySelector('button[aria-label^="Warp to "]');
    assert.ok(pip, "expected an aircraft pip button");
    assert.ok(pip.querySelector(".za-lcars-pip-mark"), "the visible mark must be separate from its button hit target");
    assert.equal(
      pip.querySelector(".za-lcars-pip-mark").style.width,
      "26px",
      "selected visible width must remain 26px",
    );
  } finally {
    await view.cleanup();
  }
});

test("glyph controls preserve each visible audio label in their accessible names", async () => {
  const view = mountCommandDeck();
  try {
    await view.render();
    for (const label of [
      "Go to Snapshot deck",
      "Run the 30-second flight",
      "Expand command rail",
      "Open deck navigator",
    ])
      labeledButton(view.document, label);
    await view.click(labeledButton(view.document, "Expand command rail"));
    const railAudio = view.document.querySelector('aside button[aria-label*="Arm selection audio"]');
    assert.ok(railAudio, "the expanded rail audio toggle must be named");
    assert.match(railAudio.textContent ?? "", /ARM AUDIO/, "the established rail wording must remain visible");
    assert.match(railAudio.getAttribute("aria-label") ?? "", /ARM AUDIO/);
    assert.equal(railAudio.getAttribute("aria-pressed"), "false");

    const headerAudio = [...view.document.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("AUDIO OFF"),
    );
    assert.ok(headerAudio, "the header audio toggle must retain its visible AUDIO OFF state");
    assert.match(headerAudio.getAttribute("aria-label") ?? "", /AUDIO OFF/);
    assert.equal(headerAudio.getAttribute("aria-pressed"), "false");
  } finally {
    await view.cleanup();
  }
});

test("command chrome frames aggregate evidence as a dated export at valid and expired boundaries", async (t) => {
  for (const [name, now, expected] of [
    ["valid", Date.parse("2026-09-27T12:00:00Z"), /EXPORT VALID/],
    ["expired", Date.parse("2026-09-28T05:00:00Z"), /EXPORT EXPIRED/],
  ]) {
    await t.test(name, async () => {
      const view = mountCommandDeck({ controlledTimers: true, now });
      try {
        await view.render();
        const header = view.document.querySelector("header.za-command-header");
        assert.match(header?.textContent ?? "", /18\/19 AT 28 AUG PROBE/);
        assert.match(header?.textContent ?? "", expected);
        assert.doesNotMatch(header?.textContent ?? "", /NOMINAL|CURRENT/);
        assert.match(view.document.body.textContent, /APOLLO6\/6 · AT 28 AUG PROBE/);
      } finally {
        await view.cleanup();
      }
    });
  }
});

test("presentation and deck navigation expose one selected state per surface", async () => {
  const view = mountCommandDeck();
  try {
    await view.render();
    const modes = [...view.document.querySelectorAll("button")].filter((button) =>
      /^(TECHNICAL|EXECUTIVE)/.test(button.textContent ?? ""),
    );
    assert.equal(modes.length, 2);
    assert.equal(modes.filter((button) => button.getAttribute("aria-pressed") === "true").length, 1);
    assert.equal(modes.filter((button) => button.getAttribute("aria-pressed") === "false").length, 1);

    for (const label of ["Command decks", "Mobile command decks"]) {
      const navigation = view.document.querySelector(`nav[aria-label="${label}"]`);
      assert.ok(navigation, `expected ${label}`);
      const current = navigation.querySelectorAll('[aria-current="page"]');
      assert.equal(current.length, 1, `${label} must expose exactly one current destination`);
      assert.equal(current[0].getAttribute("aria-label")?.toUpperCase().includes("SNAPSHOT"), true);
    }

    const opener = [...view.document.querySelectorAll('button[aria-label="Open deck navigator"]')].at(-1);
    await view.click(opener);
    const dialog = view.document.querySelector('[role="dialog"][aria-label="Deck navigator"]');
    assert.equal(dialog.querySelectorAll('[aria-current="page"]').length, 1);
  } finally {
    await view.cleanup();
  }
});

test("mobile navigation keeps Contact exposed as its current destination", async () => {
  const view = mountCommandDeck({ url: "https://cashio.us/#deck=contact" });
  try {
    await view.render();
    const navigation = view.document.querySelector('nav[aria-label="Mobile command decks"]');
    const current = navigation.querySelectorAll('[aria-current="page"]');
    assert.equal(current.length, 1);
    assert.equal(current[0].getAttribute("aria-label"), "Go to CONTACT");
  } finally {
    await view.cleanup();
  }
});

test("GO and audio controls retain their visible labels in their accessible names", async () => {
  const view = mountCommandDeck();
  try {
    await view.render();
    const go = [...view.document.querySelectorAll("button")].find((button) => button.textContent?.trim() === "GO");
    assert.ok(go);
    assert.match(go.getAttribute("aria-label") ?? "", /\bGO\b/);

    const headerAudio = [...view.document.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("AUDIO OFF"),
    );
    assert.ok(headerAudio);
    assert.match(headerAudio.getAttribute("aria-label") ?? "", /AUDIO OFF/);
  } finally {
    await view.cleanup();
  }
});

test("every deck is a named programmatic destination with a focusable heading", async () => {
  const view = mountCommandDeck();
  try {
    await view.render();
    const decks = [...view.document.querySelectorAll("section[data-deck]")];
    assert.equal(decks.length, 9);
    for (const deck of decks) {
      assert.equal(deck.getAttribute("tabindex"), "-1");
      assert.ok(deck.getAttribute("aria-label"), `deck ${deck.dataset.deck} must have an accessible name`);
      const heading = deck.querySelector("h1, h2");
      assert.ok(heading, `deck ${deck.dataset.deck} must have a heading`);
      assert.equal(heading.getAttribute("tabindex"), "-1");
    }
  } finally {
    await view.cleanup();
  }
});

test("desktop rail deck controls keep stable names when collapsed and open", async () => {
  const view = mountCommandDeck();
  const expected = [
    "Go to SNAPSHOT deck",
    "Go to THE GRID deck",
    "Go to ROUTING deck",
    "Go to THE IRON deck",
    "Go to LINEAGE deck",
    "Go to BUILDS deck",
    "Go to OPERATOR deck",
    "Go to E.V.E. deck",
    "Go to CONTACT deck",
  ];
  try {
    await view.render();
    const navigation = view.document.querySelector('nav[aria-label="Command decks"]');
    const controls = [...navigation.querySelectorAll("button")];
    assert.deepEqual(
      controls.map((button) => button.getAttribute("aria-label")),
      expected,
    );
    assert.deepEqual(
      controls.map((button) => button.textContent),
      ["01", "02", "03", "04", "05", "06", "07", "08", "09"],
    );

    await view.click(labeledButton(view.document, "Expand command rail"));
    const openControls = [...navigation.querySelectorAll("button")];
    assert.deepEqual(
      openControls.map((button) => button.getAttribute("aria-label")),
      expected,
    );
    assert.deepEqual(
      openControls.map((button) => button.textContent),
      [
        "01SNAPSHOT",
        "02THE GRID",
        "03ROUTING",
        "04THE IRON",
        "05LINEAGE",
        "06BUILDS",
        "07OPERATOR",
        "08E.V.E.",
        "09CONTACT",
      ],
    );
  } finally {
    await view.cleanup();
  }
});

test("only the real E.V.E. input owns arrow-key history behavior", async () => {
  const view = mountCommandDeck();
  try {
    await view.render();
    await view.click([...view.document.querySelectorAll("button")].find((button) => button.textContent === "STATUS"));
    await view.click([...view.document.querySelectorAll("button")].find((button) => button.textContent === "SITREP"));
    const input = view.document.querySelector("#eve-command");
    input.focus();

    const inputUp = await view.key(input, "ArrowUp");
    assert.equal(inputUp.defaultPrevented, true);
    assert.equal(input.value, "sitrep");
    const inputUpAgain = await view.key(input, "ArrowUp");
    assert.equal(inputUpAgain.defaultPrevented, true);
    assert.equal(input.value, "status");
    const inputDown = await view.key(input, "ArrowDown");
    assert.equal(inputDown.defaultPrevented, true);
    assert.equal(input.value, "sitrep");
    const inputDownAgain = await view.key(input, "ArrowDown");
    assert.equal(inputDownAgain.defaultPrevented, true);
    assert.equal(input.value, "");
    await view.key(input, "ArrowUp");
    await view.key(input, "ArrowUp");
    assert.equal(input.value, "status");

    await act(async () => useDeck.setState({ tour: true }));
    const flightButton = labeledButton(view.document, "Stop the 30-second flight");
    assert.equal(flightButton.isConnected, true, "the unrelated button must be mounted after flight state changes");
    const select = view.document.createElement("select");
    const editable = view.document.createElement("div");
    editable.setAttribute("contenteditable", "true");
    view.document.body.append(select, editable);
    const unrelated = [flightButton, view.document.querySelector('a[href="mailto:doug@cashio.us"]'), select, editable];
    for (const control of unrelated) {
      assert.equal(control.isConnected, true, `${control.tagName} must be a mounted interactive target`);
      control.focus();
      for (const key of ["ArrowUp", "ArrowDown"]) {
        const event = await view.key(control, key);
        assert.equal(event.defaultPrevented, false, `${control.tagName} ${key} must retain native behavior`);
        assert.equal(input.value, "status", `${control.tagName} ${key} must not walk E.V.E. history`);
        assert.equal(useDeck.getState().tour, true, `${control.tagName} ${key} must not stop flight`);
      }
    }
  } finally {
    await view.cleanup();
  }
});

test("PHOTO opens a visible cinema dialog that exits by button or Escape and restores focus", async () => {
  const view = mountCommandDeck({ controlledTimers: true });
  try {
    await view.render();
    const photo = [...view.document.querySelectorAll('button[data-cmd="photo"]')].at(-1);
    assert.ok(photo, "expected the visible E.V.E. PHOTO control");
    photo.focus();
    await view.click(photo);
    await view.runControlledTimeout(400);
    await view.runLatestAnimationFrame();

    const dialog = view.document.querySelector('[role="dialog"][aria-label="Cinema view"]');
    assert.ok(dialog, "PHOTO must open an exposed cinema dialog");
    assert.match(dialog.textContent ?? "", /CINEMA VIEW · PRESS ESC OR EXIT CINEMA/);
    const exit = [...dialog.querySelectorAll("button")].find((button) => button.textContent === "EXIT CINEMA");
    assert.ok(exit, "cinema dialog must expose an operable native EXIT CINEMA button");
    assert.equal(view.document.activeElement, exit, "opening cinema must move focus into the dialog");
    const inertBackground = view.document.querySelector("main")?.closest("[inert]");
    assert.ok(inertBackground, "background controls must be inside one inert boundary");
    const skipLinkBoundary = view.document.querySelector('a[href="#main-content"]')?.closest("[inert]");
    assert.ok(skipLinkBoundary, "the skip link must be inside an inert boundary while cinema is open");
    assert.equal(
      skipLinkBoundary,
      inertBackground,
      "the skip link must be inert with every other background focus target",
    );

    await view.click(exit);
    await view.runLatestAnimationFrame();
    await view.settle();
    assert.equal(view.document.querySelector('[role="dialog"]'), null);
    assert.equal(view.document.activeElement, photo, "the available PHOTO opener must regain focus");

    await view.click(photo);
    await view.runControlledTimeout(400);
    await view.runLatestAnimationFrame();
    const escape = await view.key(view.document.querySelector('[role="dialog"]'), "Escape");
    await view.runLatestAnimationFrame();
    await view.settle();
    assert.equal(escape.defaultPrevented, true, "Escape must be owned by the cinema dialog");
    assert.equal(view.document.querySelector('[role="dialog"]'), null, "Escape must exit cinema");
  } finally {
    await view.cleanup();
  }
});

test("cinema exit falls back to the E.V.E. input when no opener is available", async () => {
  const view = mountCommandDeck();
  try {
    await view.render();
    await act(async () => useDeck.setState({ photo: true }));
    const dialog = view.document.querySelector('[role="dialog"][aria-label="Cinema view"]');
    assert.ok(dialog, "an externally opened cinema state must remain operable");
    await view.runLatestAnimationFrame();
    await view.click([...dialog.querySelectorAll("button")].find((button) => button.textContent === "EXIT CINEMA"));
    await view.runLatestAnimationFrame();
    await view.settle();
    assert.equal(view.document.activeElement?.id, "eve-command", "exit must recover to the E.V.E. command input");
  } finally {
    await view.cleanup();
  }
});

test("E.V.E. keeps its usable command prompt in a 1280 by 720 first viewport", async () => {
  const view = mountCommandDeck({
    url: "https://cashio.us/#deck=eve",
    viewport: { width: 1280, height: 720 },
  });
  try {
    await view.render();
    const consoleSurface = view.document.querySelector("[data-eve-console]");
    const prompt = view.document.querySelector("#eve-command");
    assert.ok(prompt, "expected the usable E.V.E. command prompt");
    assert.equal(
      consoleSurface?.parentElement?.style.getPropertyValue("--eve-log-height"),
      "220px",
      "the console log must yield enough vertical room for the prompt at laptop height",
    );
  } finally {
    await view.cleanup();
  }
});

test("the yielded HUD still presents the full airframe identity", async () => {
  const view = mountCommandDeck();
  try {
    await view.render();
    for (const target of view.document.querySelectorAll("[data-hud-clear]")) {
      target.getBoundingClientRect = () => ({
        bottom: 690,
        height: 70,
        left: 980,
        right: 1100,
        top: 620,
        width: 120,
        x: 980,
        y: 620,
      });
    }
    await view.runAnimationFrameBatch();
    const hud = view.document.querySelector(".za-corner-hud.yield");
    assert.ok(hud, "expected the overlapping HUD to yield");
    assert.equal(
      hud.querySelector("[data-airframe-compact-identity]")?.textContent,
      "BELL X-1",
      "the compact HUD must retain the complete airframe name rather than ellipsizing or dropping it",
    );
  } finally {
    await view.cleanup();
  }
});

test("Snapshot prose separates the verification date from the preceding word", async () => {
  const view = mountCommandDeck();
  try {
    await view.render();
    const snapshot = view.document.querySelector('section[data-deck="0"]');
    assert.match(snapshot?.textContent ?? "", /Fleet evidence was verified on 28 August 2026/);
  } finally {
    await view.cleanup();
  }
});

test("deck navigator initializes focus, traps both tab directions, closes safely, and restores its opener", async () => {
  const view = mountCommandDeck();
  try {
    await view.render();
    const opener = [...view.document.querySelectorAll('button[aria-label="Open deck navigator"]')].at(-1);
    opener.focus();
    await view.click(opener);
    const dialog = view.document.querySelector('[role="dialog"][aria-label="Deck navigator"]');
    assert.ok(dialog);
    assert.equal(view.document.activeElement?.getAttribute("aria-label"), "Go to SNAPSHOT deck");

    const controls = [...dialog.querySelectorAll("button")];
    controls.at(-1).focus();
    await view.key(controls.at(-1), "Tab");
    assert.equal(view.document.activeElement, controls[0], "Tab must wrap from last to first");
    await view.key(controls[0], "Tab", { shiftKey: true });
    assert.equal(view.document.activeElement, controls.at(-1), "Shift+Tab must wrap from first to last");

    await view.click(dialog.querySelector("div"));
    assert.ok(view.document.querySelector('[role="dialog"]'), "clicking inside must not act like a backdrop click");
    await view.key(dialog, "Escape");
    assert.equal(view.document.querySelector('[role="dialog"]'), null);
    assert.equal(view.document.activeElement, opener, "Escape must return focus to the exact opener");

    await view.click(opener);
    const reopened = view.document.querySelector('[role="dialog"]');
    labeledButton(view.document, "Close deck navigator");
    await view.click(reopened.parentElement);
    assert.equal(view.document.querySelector('[role="dialog"]'), null, "a direct backdrop click must close");
    assert.equal(view.document.activeElement, opener, "backdrop dismissal must return focus to the exact opener");
  } finally {
    await view.cleanup();
  }
});

test("deck navigator selection focuses Contact without displacing the commanded scroll landing", () => {
  const dom = new JSDOM(`<!doctype html><body>
    <button id="opener">OPEN</button>
    <main><section data-deck="8"><h2 tabindex="-1">CONTACT</h2></section></main>
  </body>`);
  try {
    const opener = dom.window.document.querySelector("#opener");
    const scroller = dom.window.document.querySelector("main");
    const contactHeading = dom.window.document.querySelector('section[data-deck="8"] h2');
    const nativeFocus = contactHeading.focus.bind(contactHeading);
    contactHeading.focus = (options) => {
      nativeFocus(options);
      if (!options?.preventScroll) scroller.scrollTop = 9382;
    };
    scroller.scrollTop = 9668;
    opener.focus();
    assert.equal(typeof focusHelpers?.focusDeckHeading, "function");
    assert.equal(focusHelpers.focusDeckHeading(dom.window.document, 8), true);
    assert.equal(dom.window.document.activeElement, contactHeading, "selection must announce the destination heading");
    assert.notEqual(dom.window.document.activeElement, opener);
    assert.equal(scroller.scrollTop, 9668, "focus must preserve the commanded Contact scroll landing");
  } finally {
    dom.window.close();
  }
});

test("deck navigator waits for the commanded smooth landing before focusing its destination", async () => {
  const view = mountCommandDeck({ reducedMotion: false, deferredSmoothScroll: true });
  try {
    await view.render();
    const opener = [...view.document.querySelectorAll('button[aria-label="Open deck navigator"]')].at(-1);
    opener.focus();
    await view.click(opener);

    const contactHeading = view.document.querySelector('section[data-deck="8"] h2');
    const dialog = view.document.querySelector('[role="dialog"][aria-label="Deck navigator"]');
    await view.click(dialog.querySelector('button[aria-label="Go to CONTACT deck"]'));
    const scroller = view.document.querySelector("main.za-scroll");

    assert.equal(scroller.dataset.requestedScrollTop, "7992", "selection must command the Contact landing");
    assert.notEqual(
      view.document.activeElement,
      contactHeading,
      "the heading must not steal focus while the smooth scroll is still in flight",
    );

    await view.scrollDeck(8);
    assert.equal(view.document.activeElement, contactHeading, "the landed destination must receive announcement focus");
    assert.equal(scroller.scrollTop, 7992, "preventScroll focus must preserve the settled Contact landing");
  } finally {
    await view.cleanup();
  }
});

test("Executive navigator selection focuses its technical destination after the remount landing", async () => {
  const view = mountCommandDeck({ controlledTimers: true });
  try {
    await view.render();
    await act(async () => useDeck.setState({ mode: "executive", shown: [0, 8] }));
    assert.equal(view.document.querySelector('section[data-deck="2"]'), null, "Routing must begin unmounted");

    const opener = [...view.document.querySelectorAll('button[aria-label="Open deck navigator"]')].at(-1);
    opener.focus();
    await view.click(opener);
    const dialog = view.document.querySelector('[role="dialog"][aria-label="Deck navigator"]');
    await view.click(dialog.querySelector('button[aria-label="Go to ROUTING deck"]'));

    assert.equal(useDeck.getState().mode, "technical", "selection must remount the technical deck set");
    const routingHeading = view.document.querySelector('section[data-deck="2"] h2');
    assert.ok(routingHeading, "Routing heading must exist after the remount");
    assert.equal(
      view.document.activeElement === routingHeading,
      false,
      "focus must still wait for the commanded landing",
    );

    await view.scrollDeck(2);
    assert.equal(
      view.document.activeElement === routingHeading,
      true,
      "the remounted destination must receive landing focus",
    );
  } finally {
    await view.cleanup();
  }
});

test("superseded navigator intent never steals focus on a later passive visit", async (t) => {
  const selectContact = async (view) => {
    const opener = [...view.document.querySelectorAll('button[aria-label="Open deck navigator"]')].at(-1);
    opener.focus();
    await view.click(opener);
    const dialog = view.document.querySelector('[role="dialog"][aria-label="Deck navigator"]');
    await view.click(dialog.querySelector('button[aria-label="Go to CONTACT deck"]'));
    return view.document.querySelector('section[data-deck="8"] h2');
  };

  await t.test("wheel interruption", async () => {
    const view = mountCommandDeck({ reducedMotion: false, deferredSmoothScroll: true });
    try {
      await view.render();
      const contactHeading = await selectContact(view);
      const scroller = view.document.querySelector("main.za-scroll");

      await act(async () => scroller.dispatchEvent(new view.window.Event("wheel", { bubbles: true })));
      await view.scrollDeck(3);
      await view.scrollDeck(8);

      assert.notEqual(view.document.activeElement, contactHeading, "interrupted focus intent must stay discarded");
    } finally {
      await view.cleanup();
    }
  });

  await t.test("later rail destination", async () => {
    const view = mountCommandDeck({ reducedMotion: false, deferredSmoothScroll: true });
    try {
      await view.render();
      const contactHeading = await selectContact(view);
      await view.click(labeledButton(view.document, "Go to ROUTING deck"));
      await view.scrollDeck(2);
      await view.scrollDeck(8);

      assert.notEqual(
        view.document.activeElement,
        contactHeading,
        "a later rail route must supersede navigator intent",
      );
    } finally {
      await view.cleanup();
    }
  });

  await t.test("external history restoration", async () => {
    const view = mountCommandDeck({ reducedMotion: false, deferredSmoothScroll: true });
    try {
      await view.render();
      const contactHeading = await selectContact(view);
      await view.history("back");
      await view.scrollDeck(0);
      await view.scrollDeck(8);

      assert.notEqual(view.document.activeElement, contactHeading, "Back must discard the superseded navigator intent");
    } finally {
      await view.cleanup();
    }
  });
});

test("contact and Builds expose the responsive layout hooks that prevent collisions and overflow", async () => {
  const view = mountCommandDeck();
  try {
    await view.render();
    assert.ok(view.document.querySelector('section[data-deck="8"] .za-contact-copy'));
    assert.ok(view.document.querySelector('section[data-deck="8"] .za-contact-meta'));
    assert.ok(view.document.querySelector('section[data-deck="8"] .za-receipt-claim'));
    assert.ok(view.document.querySelector('section[data-deck="8"] .za-receipt-status'));
    assert.ok(view.document.querySelector('section[data-deck="5"] .za-build-map'));
    assert.ok(view.document.querySelector('section[data-deck="5"] .za-build-details'));
    assert.ok(view.document.querySelector('section[data-deck="5"] .za-build-selector'));

    assert.match(stylesheet, /\.za-contact-copy\s*\{[^}]*linear-gradient/is);
    assert.doesNotMatch(stylesheet, /\.za-contact-copy\s*\{[^}]*backdrop-filter/is);
    assert.match(stylesheet, /\.za-receipt-(?:claim|status)[^}]*font-size:\s*11px/is);
    assert.match(stylesheet, /\.za-build-details\s*\{[^}]*order:\s*1/is);
    assert.match(stylesheet, /\.za-build-map\s*\{[^}]*order:\s*2/is);
    assert.match(stylesheet, /\.za-build-selector\s*\{[^}]*scroll-snap-type:\s*x\s+mandatory/is);
    assert.match(stylesheet, /\.za-mobile-rail-clearance\s*\{[^}]*padding-top:/is);

    const mobileRanges = [...stylesheet.matchAll(/@media\s*\(max-width:\s*767px\)\s*\{/gi)].map((match) => {
      const open = match.index + match[0].lastIndexOf("{");
      let depth = 1;
      let close = open + 1;
      while (depth > 0 && close < stylesheet.length) {
        if (stylesheet[close] === "{") depth += 1;
        if (stylesheet[close] === "}") depth -= 1;
        close += 1;
      }
      return { open, close };
    });
    const missionRules = [...stylesheet.matchAll(/\.za-mission-stamp span\s*\{([^}]*)\}/gis)].map((match) => ({
      index: match.index,
      declarations: Object.fromEntries(
        match[1]
          .split(";")
          .map((entry) => entry.trim().split(/:\s*/, 2))
          .filter((entry) => entry.length === 2),
      ),
      mobileOnly: mobileRanges.some(({ open, close }) => match.index > open && match.index < close),
    }));
    const desktopMission = Object.assign(
      {},
      ...missionRules.filter((rule) => !rule.mobileOnly).map((rule) => rule.declarations),
    );
    const mobileMission = Object.assign({}, ...missionRules.map((rule) => rule.declarations));
    assert.equal(desktopMission["font-size"], "9px", "desktop mission microtype must retain its existing size");
    assert.ok(
      Number.parseFloat(mobileMission["font-size"]) >= 11,
      `effective mobile mission status must be at least 11px; received ${mobileMission["font-size"]}`,
    );
    assert.deepEqual(
      {
        lineHeight: mobileMission["line-height"],
        letterSpacing: mobileMission["letter-spacing"],
        overflowWrap: mobileMission["overflow-wrap"],
      },
      { lineHeight: "1.45", letterSpacing: "0.08em", overflowWrap: "anywhere" },
      "effective mobile mission status must retain collision-safe tracking and wrapping",
    );
  } finally {
    await view.cleanup();
  }
});

test("Snapshot reserves its desktop action row while 320 and 390 pixel layouts keep the two-column grid", () => {
  const mobileRanges = [...stylesheet.matchAll(/@media\s*\(max-width:\s*767px\)\s*\{/gi)].map((match) => {
    const open = match.index + match[0].lastIndexOf("{");
    let depth = 1;
    let close = open + 1;
    while (depth > 0 && close < stylesheet.length) {
      if (stylesheet[close] === "{") depth += 1;
      if (stylesheet[close] === "}") depth -= 1;
      close += 1;
    }
    return { open, close };
  });
  const actionRules = [...stylesheet.matchAll(/\.za-snapshot-actions\s*\{([^}]*)\}/gis)].map((match) => ({
    index: match.index,
    declarations: Object.fromEntries(
      match[1]
        .split(";")
        .map((entry) => entry.trim().split(/:\s*/, 2))
        .filter((entry) => entry.length === 2),
    ),
    mobileOnly: mobileRanges.some(({ open, close }) => match.index > open && match.index < close),
  }));
  const desktop = Object.assign({}, ...actionRules.filter((rule) => !rule.mobileOnly).map((rule) => rule.declarations));
  const mobile = Object.assign(
    {},
    desktop,
    ...actionRules.filter((rule) => rule.mobileOnly).map((rule) => rule.declarations),
  );

  assert.equal(desktop["min-height"], "48px", "desktop must reserve one stable primary-action row");
  assert.deepEqual(
    {
      display: mobile.display,
      columns: mobile["grid-template-columns"],
      minHeight: mobile["min-height"],
    },
    { display: "grid", columns: "repeat(2, minmax(0, 1fr))", minHeight: "0" },
    "both 320 and 390 pixel layouts must retain the existing compact grid without desktop reservation",
  );
  assert.doesNotMatch(stylesheet, /(?:^|[;{])\s*content-visibility\s*:/i, "real deck offsets must remain measurable");
});

test("resize preserves the Contact deck while responsive geometry settles", async () => {
  const view = mountCommandDeck({
    url: "https://cashio.us/#deck=contact",
    controlledTimers: true,
    responsiveGeometry: true,
  });
  try {
    await view.render();
    await view.resizeToMobile();
    const scroller = view.document.querySelector("main.za-scroll");
    assert.equal(
      scroller.scrollTop,
      7992,
      "the desktop Contact offset must remain until the responsive anchor settles",
    );
    await view.dispatchScroll();
    assert.equal(
      view.window.location.hash,
      "#deck=contact",
      "an intermediate mobile candidate must not rewrite the URL",
    );
    assert.equal(
      useDeck.getState().deck,
      8,
      "an intermediate mobile candidate must not replace the logical Contact deck",
    );
    assert.equal(view.document.querySelector(".za-command-header .za-chip")?.textContent?.trim(), "DECK 09 · CONTACT");

    await view.runControlledTimeout(120);
    await view.runLatestAnimationFrame();

    assert.equal(view.window.location.hash, "#deck=contact");
    assert.equal(useDeck.getState().deck, 8);
    assert.equal(view.document.querySelector(".za-command-header .za-chip")?.textContent?.trim(), "DECK 09 · CONTACT");
    assert.equal(scroller.dataset.requestedScrollTop, "8792", "resize must re-anchor the logical Contact deck");
  } finally {
    await view.cleanup();
  }
});

test("the delayed mount measurement never starts a responsive re-anchor", async () => {
  const view = mountCommandDeck({ controlledTimers: true });
  try {
    await view.render();
    await view.scrollDeck(3);
    assert.equal(view.window.location.hash, "#deck=iron");

    await view.runControlledTimeout(500);
    await view.scrollDeck(4);

    assert.equal(view.window.location.hash, "#deck=lineage", "early manual scrolling must remain authoritative");
    assert.equal(useDeck.getState().deck, 4, "the mount-only measurement must not restore the previous deck");
  } finally {
    await view.cleanup();
  }
});

test("a distant manual jump creates one history entry while smooth-scroll observers and passive scrolling replace it", async () => {
  const view = mountCommandDeck({
    url: "https://cashio.us/#deck=builds&article=7",
    reducedMotion: false,
  });
  try {
    await view.render();
    await view.scrollDeck(5);
    assert.deepEqual({ deck: useDeck.getState().deck, article: useDeck.getState().sel }, { deck: 5, article: 6 });
    const initialLength = view.window.history.length;

    await view.click(labeledButton(view.document, "Go to ROUTING deck"));
    await view.settle();
    assert.equal(view.window.location.hash, "#deck=routing");
    assert.equal(view.window.history.length, initialLength + 1, "manual navigation must push exactly one target entry");

    for (const intermediateDeck of [4, 3, 2]) await view.scrollDeck(intermediateDeck);
    await view.settle();
    assert.equal(
      view.window.location.hash,
      "#deck=routing",
      "smooth-scroll observers must not rewrite the target hash",
    );
    assert.equal(view.window.history.length, initialLength + 1, "smooth scrolling must not add intermediate entries");

    await view.history("back");
    assert.equal(view.window.location.hash, "#deck=builds&article=7");
    await view.scrollDeck(5);
    assert.deepEqual(
      { deck: useDeck.getState().deck, article: useDeck.getState().sel },
      { deck: 5, article: 6 },
      "one Back must restore the complete Builds selection",
    );

    await view.history("forward");
    assert.equal(view.window.location.hash, "#deck=routing");
    await view.scrollDeck(2);
    assert.equal(useDeck.getState().deck, 2, "one Forward must restore the manual target");

    const passiveLength = view.window.history.length;
    await view.scrollDeck(3);
    await view.settle();
    assert.equal(view.window.location.hash, "#deck=iron", "passive scrolling must keep the shareable hash current");
    assert.equal(
      view.window.history.length,
      passiveLength,
      "passive scrolling must replace instead of spamming history",
    );
  } finally {
    await view.cleanup();
  }
});

test("a controlled flight handoff replaces the hash without adding history", async () => {
  const view = mountCommandDeck({ controlledTimers: true });
  try {
    await view.render();
    const initialLength = view.window.history.length;
    await view.click(labeledButton(view.document, "Run the 30-second flight"));
    await view.runControlledTimeout(7500);

    assert.equal(useDeck.getState().deck, 2);
    assert.equal(view.window.location.hash, "#deck=routing");
    assert.equal(view.window.history.length, initialLength, "flight handoffs must replace instead of pushing history");
    assert.equal(useDeck.getState().audio, false, "the controlled handoff must not arm audio");
  } finally {
    await view.cleanup();
  }
});

test("interrupted and timed-out programmatic scrolls resume passive canonical replacement", async (t) => {
  await t.test("wheel cancellation", async () => {
    const view = mountCommandDeck({ controlledTimers: true, reducedMotion: false });
    try {
      await view.render();
      const initialLength = view.window.history.length;
      await view.click(labeledButton(view.document, "Go to ROUTING deck"));
      const scroller = view.document.querySelector("main.za-scroll");
      await act(async () => scroller.dispatchEvent(new view.window.Event("wheel", { bubbles: true })));
      await view.scrollDeck(3);

      assert.equal(view.window.location.hash, "#deck=iron");
      assert.equal(view.window.history.length, initialLength + 1, "cancellation must retain one logical manual entry");
    } finally {
      await view.cleanup();
    }
  });

  await t.test("bounded timeout", async () => {
    const view = mountCommandDeck({ controlledTimers: true, reducedMotion: false });
    try {
      await view.render();
      const initialLength = view.window.history.length;
      await view.click(labeledButton(view.document, "Go to CONTACT deck"));
      await view.scrollDeck(0);
      assert.equal(
        view.window.location.hash,
        "#deck=contact",
        "stalled observers must remain suppressed before timeout",
      );

      await view.runControlledTimeout(3200);
      await view.scrollDeck(3);
      assert.equal(view.window.location.hash, "#deck=iron");
      assert.equal(view.window.history.length, initialLength + 1, "timeout recovery must replace the manual entry");
    } finally {
      await view.cleanup();
    }
  });
});

test("Executive history restoration remounts technical decks and restores Builds article 7", async () => {
  const view = mountCommandDeck({
    url: "https://cashio.us/#deck=builds&article=7",
    reducedMotion: false,
  });
  try {
    await view.render();
    await view.scrollDeck(5);
    await act(async () => useDeck.setState({ mode: "executive", shown: [0, 8] }));
    assert.equal(view.document.querySelector('section[data-deck="5"]'), null, "Executive mode must begin unmounted");

    await view.click(labeledButton(view.document, "Go to CONTACT deck"));
    await view.settle();
    await view.scrollDeck(8);
    assert.equal(view.window.location.hash, "#deck=contact");
    await view.history("back");

    assert.equal(useDeck.getState().mode, "technical");
    assert.ok(
      view.document.querySelector('section[data-deck="5"]'),
      "history restoration must remount technical decks",
    );
    assert.deepEqual({ deck: useDeck.getState().deck, article: useDeck.getState().sel }, { deck: 5, article: 6 });
    assert.equal(view.window.location.hash, "#deck=builds&article=7");
  } finally {
    await view.cleanup();
  }
});

test("Executive GO navigation remounts a technical target and keeps the selected Builds article", async () => {
  const view = mountCommandDeck({ reducedMotion: false });
  try {
    await view.render();
    await act(async () => useDeck.setState({ mode: "executive", sel: 6, shown: [0, 8] }));
    const opener = [...view.document.querySelectorAll('button[aria-label="Open deck navigator"]')].at(-1);
    await view.click(opener);
    await view.click(labeledButton(view.document, "Go to BUILDS deck"));
    await view.settle();

    assert.equal(useDeck.getState().mode, "technical");
    assert.ok(view.document.querySelector('section[data-deck="5"]'), "GO must remount the requested technical deck");
    assert.deepEqual({ deck: useDeck.getState().deck, article: useDeck.getState().sel }, { deck: 5, article: 6 });
    assert.equal(view.window.location.hash, "#deck=builds&article=7");
    assert.equal(
      view.document.querySelector('[role="dialog"]'),
      null,
      "successful GO navigation must close the navigator",
    );
  } finally {
    await view.cleanup();
  }
});

test("the real airframe role-button owns shortcut keys while Enter and Space still activate it", async () => {
  const view = mountCommandDeck();
  const baseline = { deck: 4, sel: 3, audio: true, tour: false, mode: "technical" };
  try {
    await view.render();
    const airframe = view.document.querySelector('[role="button"][aria-label^="Open "][aria-label$=" airframe deck"]');
    assert.ok(airframe, "expected the real focusable airframe widget");
    airframe.focus();

    for (const key of ["ArrowLeft", "ArrowRight", "a", "t", "1", "9"]) {
      await act(async () => useDeck.setState(baseline));
      airframe.focus();
      await view.key(airframe, key);
      const state = useDeck.getState();
      assert.deepEqual(
        { deck: state.deck, sel: state.sel, audio: state.audio, tour: state.tour },
        { deck: 4, sel: 3, audio: true, tour: false },
        `${key} must remain owned by the focused role-button`,
      );
    }

    for (const key of ["Enter", " "]) {
      await act(async () => useDeck.setState(baseline));
      airframe.focus();
      await view.key(airframe, key);
      assert.equal(useDeck.getState().deck, 2, `${JSON.stringify(key)} must activate the Proteus airframe route`);
    }
  } finally {
    await view.cleanup();
  }
});

test("unmodified global printable keys do not trigger hidden page commands", async () => {
  const view = mountCommandDeck();
  try {
    await view.render();
    const baseline = { deck: 4, sel: 3, audio: false, tour: false, alert: false };
    for (const key of ["a", "r", "t", "1", "9"]) {
      await act(async () => useDeck.setState(baseline));
      const event = await view.key(view.document.body, key);
      assert.equal(event.defaultPrevented, false, `${key} must retain its native page behavior`);
      const state = useDeck.getState();
      assert.deepEqual(
        { deck: state.deck, sel: state.sel, audio: state.audio, tour: state.tour, alert: state.alert },
        baseline,
        `${key} must not invoke a global command`,
      );
    }
  } finally {
    await view.cleanup();
  }
});

test("manual vertical navigation still stops the active flight without becoming a hidden page command", async () => {
  const view = mountCommandDeck();
  try {
    await view.render();
    await view.click(labeledButton(view.document, "Run the 30-second flight"));
    assert.equal(useDeck.getState().tour, true);

    const arrow = await view.key(view.document.body, "ArrowDown");
    assert.equal(arrow.defaultPrevented, false, "manual scrolling must retain its native page behavior");
    assert.equal(useDeck.getState().tour, false, "manual vertical navigation must stop the guided flight");

    await view.click(labeledButton(view.document, "Run the 30-second flight"));
    await view.key(view.document.body, "ArrowDown", { ctrlKey: true });
    assert.equal(useDeck.getState().tour, true, "modified vertical keys must retain the existing flight behavior");
  } finally {
    await view.cleanup();
  }
});

test("Ctrl or Command K still owns the deck navigator while Escape closes it", async () => {
  const view = mountCommandDeck();
  try {
    await view.render();
    const ctrlK = await view.key(view.document.body, "k", { ctrlKey: true });
    assert.equal(ctrlK.defaultPrevented, true);
    assert.ok(view.document.querySelector('[role="dialog"][aria-label="Deck navigator"]'));

    const closeWithCtrlK = await view.key(view.document.body, "k", { ctrlKey: true });
    assert.equal(closeWithCtrlK.defaultPrevented, true);
    assert.equal(view.document.querySelector('[role="dialog"]'), null);

    const commandK = await view.key(view.document.body, "k", { metaKey: true });
    assert.equal(commandK.defaultPrevented, true);
    assert.ok(view.document.querySelector('[role="dialog"][aria-label="Deck navigator"]'));
    await view.key(view.document.querySelector('[role="dialog"]'), "Escape");
    assert.equal(view.document.querySelector('[role="dialog"]'), null);
  } finally {
    await view.cleanup();
  }
});

test("Builds article arrows work only while the focused article selector owns them", async () => {
  const view = mountCommandDeck();
  try {
    await view.render();
    await view.click(labeledButton(view.document, "Go to BUILDS deck"));
    const selector = view.document.querySelector('[role="group"][aria-label="Select a test article"]');
    assert.ok(selector, "expected the real Builds article selector");
    const firstArticle = selector.querySelector("button");
    assert.ok(firstArticle, "expected a focusable article selector control");

    await act(async () => useDeck.setState({ sel: 0 }));
    const pageArrow = await view.key(view.document.body, "ArrowRight");
    assert.equal(pageArrow.defaultPrevented, false);
    assert.equal(useDeck.getState().sel, 0, "unfocused page arrows must not select an article");

    firstArticle.focus();
    const selectorArrow = await view.key(firstArticle, "ArrowLeft");
    assert.equal(selectorArrow.defaultPrevented, true, "focused selector arrows must own their navigation");
    assert.equal(useDeck.getState().sel, 6, "selector ArrowLeft must wrap to Article 7");
  } finally {
    await view.cleanup();
  }
});

test("focus cycling and shortcut exclusion cover boundaries and interactive descendants", () => {
  assert.ok(focusHelpers, "the deck focus helper module must exist");
  assert.equal(focusHelpers.nextFocusIndex(2, 3, false), 0);
  assert.equal(focusHelpers.nextFocusIndex(0, 3, true), 2);
  assert.equal(focusHelpers.nextFocusIndex(1, 3, false), 2);
  assert.equal(focusHelpers.nextFocusIndex(-1, 3, false), 0);
  assert.equal(focusHelpers.nextFocusIndex(-1, 3, true), 2);
  assert.equal(focusHelpers.nextFocusIndex(0, 0, false), -1);

  const dom = new JSDOM(
    '<input><textarea></textarea><select></select><button><span></span></button><a><b></b></a><div contenteditable="true"><i></i></div><div role="button" tabindex="0"><em></em></div><div role="slider" tabindex="0"></div><p></p>',
  );
  for (const selector of [
    "input",
    "textarea",
    "select",
    "button",
    "button span",
    "a",
    "a b",
    "[contenteditable]",
    "[contenteditable] i",
    '[role="button"]',
    '[role="button"] em',
    '[role="slider"]',
  ]) {
    assert.equal(focusHelpers.isInteractiveShortcutTarget(dom.window.document.querySelector(selector)), true, selector);
  }
  assert.equal(focusHelpers.isInteractiveShortcutTarget(dom.window.document.querySelector("p")), false);
});

test("every deck and footer reserve the mobile rail and safe-area inset", async () => {
  const view = mountCommandDeck();
  try {
    await view.render();
    const decks = [...view.document.querySelectorAll("section[data-deck]")];
    assert.ok(decks.length >= 9);
    assert.ok(decks.every((deck) => deck.classList.contains("za-mobile-rail-clearance")));
    assert.ok(view.document.querySelector("footer")?.classList.contains("za-mobile-rail-clearance"));
    assert.ok(
      view.document.querySelector('nav[aria-label="Mobile command decks"]')?.classList.contains("za-mobile-rail-safe"),
    );
  } finally {
    await view.cleanup();
  }
});

test("all below-fold plate and selected-aircraft evidence images are lazy and async", async () => {
  const view = mountCommandDeck();
  try {
    await view.render();
    const plates = [...view.document.querySelectorAll("img.za-plate-img")];
    assert.equal(plates.length, 3, "technical mode must render rack, operator, and fold plates");
    for (const image of plates) {
      assert.equal(image.getAttribute("loading"), "lazy");
      assert.equal(image.getAttribute("decoding"), "async");
    }
    const evidence = view.document.querySelector("img.za-airframe-photo");
    assert.equal(evidence?.getAttribute("loading"), "lazy");
    assert.equal(evidence?.getAttribute("decoding"), "async");
    await act(async () => useDeck.setState({ mode: "executive" }));
    const commandPlate = view.document.querySelector('img.za-plate-img[src^="/plates/command.jpg"]');
    assert.ok(commandPlate, "executive mode must render the command plate");
    const commandPicture = commandPlate.closest("picture");
    assert.ok(commandPicture, "the executive command plate must select an optimized format before its JPEG fallback");
    assert.ok(commandPicture.classList.contains("za-plate-picture"));
    assert.match(
      stylesheet,
      /\.za-plate-picture\s*\{[^}]*display:\s*block;[^}]*width:\s*100%;[^}]*height:\s*100%/is,
      "the responsive wrapper must preserve the Plate's reserved geometry",
    );
    const commandSources = responsiveSources(commandPicture);
    assert.deepEqual(commandSources, [
      {
        media: null,
        type: "image/avif",
        srcset: "/plates/command-mobile.avif 768w, /plates/command-desktop.avif 1440w",
        sizes: "100vw",
      },
      {
        media: null,
        type: "image/webp",
        srcset: "/plates/command-mobile.webp 768w, /plates/command-desktop.webp 1440w",
        sizes: "100vw",
      },
    ]);
    const stagePicture = view.document.querySelector("img.za-stage-poster")?.closest("picture");
    assert.ok(stagePicture);
    assert.deepEqual(
      commandSources,
      responsiveSources(stagePicture),
      "both command plates must share one selection set",
    );
    assert.equal(commandPlate.getAttribute("alt"), "Command viewscreen over a starfield");
    assert.equal(commandPlate.getAttribute("loading"), "lazy");
    assert.equal(commandPlate.getAttribute("decoding"), "async");
    assert.equal(commandPlate.getAttribute("width"), "1680");
    assert.equal(commandPlate.getAttribute("height"), "945");
  } finally {
    await view.cleanup();
  }
});

test("stage loading waits for paint, accepts deliberate intent, and cancels cleanly", async () => {
  assert.ok(stageScheduler, "the stage-load scheduler module must exist");
  const fake = createSchedulerEnvironment();
  let loads = 0;
  let ready = 0;
  const cancel = stageScheduler.scheduleStageLoad({
    environment: fake.environment,
    load: async () => (++loads, { stage: true }),
    onReady: () => ready++,
    onFallback: () => assert.fail("successful import must not fall back"),
  });
  assert.equal(loads, 0);
  fake.dispatch("pointerdown");
  assert.equal(loads, 0, "intent before the first frame must not import");
  fake.runFrame();
  assert.equal(loads, 0, "the first animation callback precedes the first completed paint");
  fake.runFrame();
  await flushPromises();
  assert.equal(loads, 1, "early deliberate intent must be remembered until first paint");
  assert.equal(ready, 1);
  cancel();
  assert.deepEqual(fake.counts(), { frames: 0, timers: 0, idles: 0, listeners: 0 });
});

test("stage loading ignores generic idle, starts once for every deliberate intent, and retains a long fallback", async (t) => {
  assert.ok(stageScheduler, "the stage-load scheduler module must exist");
  await t.test("idle and the second frame alone do not load the stage", async () => {
    const fake = createSchedulerEnvironment();
    let loads = 0;
    stageScheduler.scheduleStageLoad({
      environment: fake.environment,
      load: async () => ++loads,
      onReady: () => {},
      onFallback: assert.fail,
    });
    fake.runFrame();
    fake.runFrame();
    fake.runAllIdles();
    await flushPromises();
    assert.equal(loads, 0, "a stationary visitor must retain the poster through idle time");
  });

  for (const intent of ["pointerdown", "keydown", "wheel", "touchstart"]) {
    await t.test(`${intent} starts the stage exactly once after paint`, async () => {
      const fake = createSchedulerEnvironment();
      let loads = 0;
      stageScheduler.scheduleStageLoad({
        environment: fake.environment,
        load: async () => ++loads,
        onReady: () => {},
        onFallback: assert.fail,
      });
      fake.runFrame();
      fake.runFrame();
      fake.dispatch(intent);
      fake.dispatch(intent);
      await flushPromises();
      assert.equal(loads, 1, `${intent} must start one import and remove every intent listener`);
      assert.deepEqual(fake.counts(), { frames: 0, timers: 0, idles: 0, listeners: 0 });
    });
  }

  await t.test("only the 12-second fallback starts a stationary visitor", async () => {
    const fake = createSchedulerEnvironment();
    let loads = 0;
    stageScheduler.scheduleStageLoad({
      environment: fake.environment,
      load: async () => ++loads,
      onReady: () => {},
      onFallback: assert.fail,
    });
    fake.runFrame();
    fake.runFrame();
    fake.runAllIdles();
    await flushPromises();
    assert.equal(loads, 0);
    fake.runTimer(12_000);
    await flushPromises();
    assert.equal(loads, 1);
  });

  await t.test("rejected import reaches the non-WebGL fallback without escaping", async () => {
    const fake = createSchedulerEnvironment();
    let fallback = 0;
    stageScheduler.scheduleStageLoad({
      environment: fake.environment,
      load: async () => {
        throw new Error("WebGL chunk unavailable");
      },
      onReady: assert.fail,
      onFallback: () => fallback++,
    });
    fake.runFrame();
    fake.runFrame();
    fake.dispatch("pointerdown");
    await flushPromises();
    assert.equal(fallback, 1);
  });
});

test("cancelling stage loading removes every intent listener and pending schedule", () => {
  assert.ok(stageScheduler, "the stage-load scheduler module must exist");
  const fake = createSchedulerEnvironment();
  const cancel = stageScheduler.scheduleStageLoad({
    environment: fake.environment,
    load: async () => assert.fail("cancelled scheduling must never import"),
    onReady: assert.fail,
    onFallback: assert.fail,
  });
  assert.equal(fake.counts().listeners, 4, "pointer, keyboard, wheel, and touch intent must be observed");
  cancel();
  assert.deepEqual(fake.counts(), { frames: 0, timers: 0, idles: 0, listeners: 0 });
});

test("scroll and touch stage intent are passive while pointer and keyboard registration stays unchanged", () => {
  assert.ok(stageScheduler, "the stage-load scheduler module must exist");
  const fake = createSchedulerEnvironment();
  const cancel = stageScheduler.scheduleStageLoad({
    environment: fake.environment,
    load: async () => assert.fail("the registration contract must not start loading"),
    onReady: assert.fail,
    onFallback: assert.fail,
  });

  assert.equal(fake.listenerOptions("pointerdown"), undefined);
  assert.equal(fake.listenerOptions("keydown"), undefined);
  assert.deepEqual(fake.listenerOptions("wheel"), { passive: true });
  assert.deepEqual(fake.listenerOptions("touchstart"), { passive: true });

  cancel();
  assert.deepEqual(fake.counts(), { frames: 0, timers: 0, idles: 0, listeners: 0 });
});

test("the real command plate is the immediate responsive viewscreen poster", async () => {
  const view = mountCommandDeck();
  try {
    await view.render();
    const poster = view.document.querySelector('img.za-stage-poster[src="/plates/command.jpg"]');
    assert.ok(poster, "the existing command plate must cover the deferred cinematic stage");
    const picture = poster.closest("picture");
    assert.ok(picture, "the immediate poster must offer optimized formats before the JPEG fallback");
    const sources = responsiveSources(picture);
    assert.equal(sources.length, 2, "each optimized format must expose one width-selection algorithm");
    const avif = sources.find((source) => source.type === "image/avif");
    assert.ok(avif);
    const preloadDocument = new JSDOM(documentMarkup).window.document;
    const preload = preloadDocument.querySelector('link[rel="preload"][as="image"][type="image/avif"]');
    assert.ok(preload);
    assert.equal(
      preload.getAttribute("imagesrcset"),
      avif.srcset,
      "preload and picture candidates must be byte-equivalent",
    );
    assert.equal(
      preload.getAttribute("imagesizes"),
      avif.sizes,
      "preload and picture slot sizes must be byte-equivalent",
    );
    const pictureChoice = selectWidthCandidate(avif.srcset, avif.sizes, 390, 2);
    const preloadChoice = selectWidthCandidate(
      preload.getAttribute("imagesrcset"),
      preload.getAttribute("imagesizes"),
      390,
      2,
    );
    assert.deepEqual(pictureChoice, { url: "/plates/command-desktop.avif", width: 1440 });
    assert.deepEqual(preloadChoice, pictureChoice);
    assert.equal(
      new Set([pictureChoice.url, preloadChoice.url]).size,
      1,
      "a 390px DPR2 preload and picture must resolve one URL instead of competing requests",
    );
    assert.equal(poster.getAttribute("alt"), "", "the decorative poster must not duplicate deck content");
    assert.equal(poster.getAttribute("aria-hidden"), "true");
    assert.equal(poster.getAttribute("width"), "1680");
    assert.equal(poster.getAttribute("height"), "945");
    assert.equal(poster.getAttribute("loading"), "eager");
    assert.equal(poster.getAttribute("fetchpriority"), "high");
    assert.equal(poster.getAttribute("decoding"), "async");
    assert.equal(
      view.document.querySelector("viewscreen-stage"),
      null,
      "the stage must remain deferred without intent",
    );
  } finally {
    await view.cleanup();
  }
});

test("audio-off and reduced-motion rendering drains while the armed sound meter remains scheduled", async () => {
  const view = mountCommandDeck({ reducedMotion: true });
  try {
    await view.render();
    for (let frame = 0; frame < 4; frame++) await view.runAnimationFrameBatch();
    assert.equal(view.pendingAnimationFrames(), 0, "quiet reduced-motion mode must not retain continuous frame work");

    await act(async () => useDeck.setState({ audio: true }));
    assert.ok(view.pendingAnimationFrames() > 0, "arming audio must start the live sound-level meter");
    await view.runAnimationFrameBatch();
    assert.ok(view.pendingAnimationFrames() > 0, "the armed sound-level meter must remain live");

    await act(async () => useDeck.setState({ audio: false }));
    assert.equal(view.pendingAnimationFrames(), 0, "disarming audio must stop its frame loop immediately");
  } finally {
    await view.cleanup();
  }
});

test("only the active command-deck Bit owns continuous frame work", async () => {
  const view = mountCommandDeck({ reducedMotion: false, canvasRuntime: true });
  try {
    await view.render();
    assert.equal(
      view.pendingAnimationFramesNamed("loop"),
      1,
      "the inactive local E.V.E. Bit must not schedule beside the visible global Bit",
    );

    await view.scrollDeck(7);
    assert.equal(view.pendingAnimationFramesNamed("loop"), 1, "the active E.V.E. Bit must own exactly one loop");

    await view.scrollDeck(8);
    assert.equal(view.pendingAnimationFramesNamed("loop"), 1, "leaving E.V.E. must cancel its local Bit loop");
  } finally {
    await view.cleanup();
  }
});

test("reduced-motion mood changes repaint the visible Bit without starting a frame loop", async () => {
  const view = mountCommandDeck({ reducedMotion: true, canvasRuntime: true });
  try {
    await view.render();
    const visibleBit = view.document.querySelector(".za-bit-control canvas");
    assert.ok(visibleBit, "expected the visible global Bit canvas");
    const before = view.canvasPaintCount(visibleBit);
    assert.ok(before > 0, "the initial reduced-motion Bit must paint once");
    assert.equal(view.pendingAnimationFramesNamed("loop"), 0);

    await act(async () => useDeck.setState({ bitMood: "no" }));
    await view.settle();
    assert.equal(useDeck.getState().bitMood, "no");

    const after = view.canvasPaintCount(visibleBit);
    assert.ok(after > before, "the changed mood must repaint the visible Bit");
    assert.ok(
      view.canvasPaintValuesSince(before, visibleBit).some((value) => value.includes("255,154,170")),
      "the repaint must use the selected no-mood palette",
    );
    assert.equal(view.pendingAnimationFramesNamed("loop"), 0, "reduced motion must stay single-frame after repaint");
  } finally {
    await view.cleanup();
  }
});

test("a live reduced-motion change settles Bit and resumes only its active owner", async () => {
  const view = mountCommandDeck({ reducedMotion: false, canvasRuntime: true });
  try {
    await view.render();
    const visibleBit = view.document.querySelector(".za-bit-control canvas");
    assert.ok(visibleBit, "expected the visible global Bit canvas");
    assert.equal(view.pendingAnimationFramesNamed("loop"), 1, "motion-enabled Bit must own one loop");

    await view.runAnimationFrameBatch();
    const beforeReduce = view.canvasPaintCount(visibleBit);
    assert.ok(beforeReduce > 0, "Bit must paint before the live preference change");

    await view.setReducedMotion(true);
    assert.equal(view.pendingAnimationFramesNamed("loop"), 0, "live reduced motion must cancel Bit's owned loop");
    assert.ok(
      view.canvasPaintCount(visibleBit) > beforeReduce,
      "live reduced motion must settle Bit with a final static paint",
    );

    await view.setReducedMotion(false);
    assert.equal(view.pendingAnimationFramesNamed("loop"), 1, "restoring motion must resume only the active Bit loop");
  } finally {
    await view.cleanup();
  }
});

test("a live reduced-motion change settles CountUp without replaying and preserves future reveals", async () => {
  const view = mountCommandDeck({ reducedMotion: false });
  try {
    await view.render();
    const executiveMode = [...view.document.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("EXECUTIVE"),
    );
    const technicalMode = [...view.document.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("TECHNICAL"),
    );
    assert.ok(executiveMode && technicalMode, "expected both presentation-mode controls");
    await view.click(executiveMode);

    const routeMetric = () =>
      [...view.document.querySelectorAll("article")]
        .find((article) => article.textContent?.includes("01 · ROUTE CONTROL"))
        ?.querySelector(".za-display");
    assert.equal(routeMetric()?.textContent, "0", "the motion-enabled reveal must begin at zero");
    assert.equal(view.pendingAnimationFramesNamed("run"), 1, "CountUp must own one reveal frame");

    await view.setReducedMotion(true);
    assert.equal(view.pendingAnimationFramesNamed("run"), 0, "live reduced motion must cancel CountUp's owned frame");
    assert.equal(routeMetric()?.textContent, "10", "live reduced motion must settle the final metric");

    await view.setReducedMotion(false);
    assert.equal(view.pendingAnimationFramesNamed("run"), 0, "restoring motion must not replay a settled metric");
    assert.equal(routeMetric()?.textContent, "10");

    await view.click(technicalMode);
    await view.click(executiveMode);
    assert.equal(routeMetric()?.textContent, "0", "a future mount may begin a normal motion-enabled reveal");
    assert.equal(view.pendingAnimationFramesNamed("run"), 1, "the future reveal must own one frame");
  } finally {
    await view.cleanup();
  }
});

test("COPY EMAIL announces only resolved clipboard success and keeps an honest usable fallback", async () => {
  const view = mountCommandDeck({ url: "https://cashio.us/#deck=contact", controlledTimers: true });
  const sound = getSound();
  const originalSound = { err: sound.err, hail: sound.hail, ok: sound.ok };
  const sounds = [];
  sound.err = () => sounds.push("err");
  sound.hail = () => sounds.push("hail");
  sound.ok = () => sounds.push("ok");

  const setClipboard = (writeText) => {
    Object.defineProperty(view.window.navigator, "clipboard", {
      configurable: true,
      value: writeText ? { writeText } : undefined,
    });
  };
  const copyControl = () =>
    [...view.document.querySelectorAll("button")].find((control) =>
      ["COPY EMAIL", "COPIED", "COPY FAILED"].includes(control.textContent),
    );
  const copyStatus = () => view.document.querySelector('[role="status"][aria-label="Email copy status"]');

  try {
    useDeck.setState({ audio: true });
    const pending = deferredPromise();
    setClipboard(() => pending.promise);
    await view.render();

    const emailLink = [...view.document.querySelectorAll('a[href="mailto:doug@cashio.us"]')].find(
      (link) => link.textContent === "doug@cashio.us",
    );
    assert.ok(emailLink, "the selectable visible address and mailto fallback must remain available");
    assert.equal(copyControl()?.textContent, "COPY EMAIL");
    assert.ok(copyStatus(), "the email copy status must remain mounted before an attempt");
    assert.equal(copyStatus()?.getAttribute("aria-live"), "polite");
    assert.equal(copyStatus()?.textContent, "");

    await view.click(copyControl());
    assert.equal(copyControl()?.textContent, "COPY EMAIL", "an unresolved clipboard promise must not claim success");
    assert.equal(copyStatus()?.textContent, "");
    assert.equal(useDeck.getState().copyEmailState, "idle");
    assert.deepEqual(sounds, []);

    pending.resolve();
    await view.settle();
    assert.equal(copyControl()?.textContent, "COPIED");
    assert.equal(copyStatus()?.textContent, "Email copied to clipboard.");
    assert.equal(useDeck.getState().copyEmailState, "success");
    assert.deepEqual(sounds, ["ok", "hail"]);

    const overlappingPending = deferredPromise();
    setClipboard(() => overlappingPending.promise);
    await view.click(copyControl());
    assert.equal(copyControl()?.textContent, "COPY EMAIL", "a retry must clear success while it is pending");
    assert.equal(copyStatus()?.textContent, "");
    assert.equal(view.pendingControlledTimeoutsFor(2200), 0, "a retry must cancel the prior success reset");
    await view.runClearedControlledTimeout(2200);
    assert.equal(copyControl()?.textContent, "COPY EMAIL", "a stale success timer must not erase a newer attempt");
    overlappingPending.resolve();
    await view.settle();
    assert.equal(copyControl()?.textContent, "COPIED");

    await view.runControlledTimeout(2200);
    assert.equal(copyControl()?.textContent, "COPY EMAIL");
    assert.equal(copyStatus()?.textContent, "");
    assert.equal(useDeck.getState().copyEmailState, "idle");

    sounds.length = 0;
    setClipboard(async () => {
      throw new Error("clipboard denied");
    });
    await view.click(copyControl());
    await view.settle();
    assert.equal(copyControl()?.textContent, "COPY FAILED");
    assert.equal(
      copyStatus()?.textContent,
      "Copy failed. Select doug@cashio.us above to copy it or use the Email button.",
    );
    assert.equal(useDeck.getState().copyEmailState, "error");
    assert.deepEqual(sounds, ["err"]);

    const secondPending = deferredPromise();
    sounds.length = 0;
    setClipboard(() => secondPending.promise);
    await view.click(copyControl());
    assert.equal(copyControl()?.textContent, "COPY EMAIL", "a retry must clear the prior error while it is pending");
    assert.equal(copyStatus()?.textContent, "");
    assert.equal(useDeck.getState().copyEmailState, "idle");
    assert.deepEqual(sounds, []);
    secondPending.reject(new Error("clipboard denied again"));
    await view.settle();

    sounds.length = 0;
    setClipboard(undefined);
    await view.click(copyControl());
    await view.settle();
    assert.equal(copyControl()?.textContent, "COPY FAILED");
    assert.equal(
      copyStatus()?.textContent,
      "Copy failed. Select doug@cashio.us above to copy it or use the Email button.",
    );
    assert.equal(useDeck.getState().copyEmailState, "error");
    assert.deepEqual(sounds, ["err"]);
  } finally {
    sound.err = originalSound.err;
    sound.hail = originalSound.hail;
    sound.ok = originalSound.ok;
    await view.cleanup();
  }
});

test("COPY EMAIL ignores an older clipboard completion after a newer attempt", async () => {
  const view = mountCommandDeck({ url: "https://cashio.us/#deck=contact" });
  const sound = getSound();
  const originalSound = { err: sound.err, hail: sound.hail, ok: sound.ok };
  const sounds = [];
  sound.err = () => sounds.push("err");
  sound.hail = () => sounds.push("hail");
  sound.ok = () => sounds.push("ok");
  const older = deferredPromise();
  let attempt = 0;
  Object.defineProperty(view.window.navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: () => {
        attempt++;
        return attempt === 1 ? older.promise : Promise.reject(new Error("newer attempt denied"));
      },
    },
  });

  try {
    useDeck.setState({ audio: true });
    await view.render();
    const copyControl = () =>
      [...view.document.querySelectorAll("button")].find((control) =>
        ["COPY EMAIL", "COPIED", "COPY FAILED"].includes(control.textContent),
      );
    const copyStatus = () => view.document.querySelector('[role="status"][aria-label="Email copy status"]');

    await view.click(copyControl());
    assert.equal(useDeck.getState().copyEmailState, "idle");
    await view.click(copyControl());
    await view.settle();
    assert.equal(copyControl()?.textContent, "COPY FAILED");
    assert.match(copyStatus()?.textContent ?? "", /^Copy failed\./);
    assert.deepEqual(sounds, ["err"]);

    older.resolve();
    await view.settle();
    assert.equal(copyControl()?.textContent, "COPY FAILED", "an older success must not replace the newer error");
    assert.equal(useDeck.getState().copyEmailState, "error");
    assert.deepEqual(sounds, ["err"], "an older success must not play success audio");
  } finally {
    sound.err = originalSound.err;
    sound.hail = originalSound.hail;
    sound.ok = originalSound.ok;
    await view.cleanup();
  }
});

test("CommandDeck unmount resets copy state and blocks an older pending completion", async () => {
  const view = mountCommandDeck({ url: "https://cashio.us/#deck=contact" });
  const sound = getSound();
  const originalSound = { err: sound.err, hail: sound.hail, ok: sound.ok };
  const sounds = [];
  sound.err = () => sounds.push("err");
  sound.hail = () => sounds.push("hail");
  sound.ok = () => sounds.push("ok");
  const older = deferredPromise();
  let attempt = 0;
  let cleaned = false;
  Object.defineProperty(view.window.navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: () => {
        attempt++;
        return attempt === 1 ? older.promise : Promise.reject(new Error("newer attempt denied"));
      },
    },
  });

  try {
    useDeck.setState({ audio: true });
    await view.render();
    const copyControl = () =>
      [...view.document.querySelectorAll("button")].find((control) =>
        ["COPY EMAIL", "COPIED", "COPY FAILED"].includes(control.textContent),
      );

    await view.click(copyControl());
    await view.click(copyControl());
    await view.settle();
    assert.equal(useDeck.getState().copyEmailState, "error");
    assert.deepEqual(sounds, ["err"]);

    await view.cleanup();
    cleaned = true;
    assert.equal(useDeck.getState().copyEmailState, "idle", "a same-runtime remount must begin with COPY EMAIL");

    older.resolve();
    await flushPromises();
    assert.equal(useDeck.getState().copyEmailState, "idle", "a post-unmount completion must not restore stale state");
    assert.deepEqual(sounds, ["err"], "a post-unmount completion must not play success audio");
  } finally {
    sound.err = originalSound.err;
    sound.hail = originalSound.hail;
    sound.ok = originalSound.ok;
    if (!cleaned) await view.cleanup();
  }
});

test("CommandDeck unmount clears a completed COPY EMAIL success", async () => {
  const view = mountCommandDeck({ url: "https://cashio.us/#deck=contact", controlledTimers: true });
  let cleaned = false;
  Object.defineProperty(view.window.navigator, "clipboard", {
    configurable: true,
    value: { writeText: async () => {} },
  });

  try {
    await view.render();
    const copyControl = [...view.document.querySelectorAll("button")].find((control) =>
      ["COPY EMAIL", "COPIED", "COPY FAILED"].includes(control.textContent),
    );
    await view.click(copyControl);
    await view.settle();
    assert.equal(useDeck.getState().copyEmailState, "success");

    await view.cleanup();
    cleaned = true;
    assert.equal(useDeck.getState().copyEmailState, "idle", "a completed success must not leak across remounts");
  } finally {
    if (!cleaned) await view.cleanup();
  }
});

test("leaving Builds stands down its deck-owned motion without changing the selected article", async () => {
  const view = mountCommandDeck({
    url: "https://cashio.us/#deck=builds&article=7",
    reducedMotion: false,
    injectStyles: true,
  });
  try {
    await view.render();
    await view.scrollDeck(5);
    const scroller = view.document.querySelector("main.za-scroll");
    assert.equal(scroller?.dataset.activeDeck, "5", "Builds must own its animation work while active");
    assert.equal(useDeck.getState().sel, 6);

    await view.click(labeledButton(view.document, "Go to CONTACT deck"));
    await view.settle();

    assert.equal(scroller?.dataset.activeDeck, "8", "the destination deck must replace the active motion owner");
    assert.equal(useDeck.getState().sel, 6, "standing down inactive Builds work must not alter article selection");
    for (const selector of [".za-heartbeat", ".za-boot-scan", ".za-ticker-track"]) {
      const node = view.document.querySelector(selector);
      assert.ok(node, `expected ${selector} to be present in a deck`);
      assert.equal(
        view.window.getComputedStyle(node).animationPlayState,
        "paused",
        `${selector} must stand down when its deck is inactive`,
      );
    }
  } finally {
    await view.cleanup();
  }
});

test("rapid deck navigation restarts the latest warp pulse and cleans its owned timers", async () => {
  const view = mountCommandDeck({
    url: "https://cashio.us/",
    reducedMotion: false,
    controlledTimers: true,
    capturePulseTimers: true,
  });
  let cleaned = false;
  try {
    await view.render();
    await view.click(labeledButton(view.document, "Go to ROUTING deck"));
    const firstFlash = view.document.querySelector(".za-warpflash.on");
    assert.ok(firstFlash, "first navigation must start a warp flash");
    await view.click(labeledButton(view.document, "Go to CONTACT deck"));
    const latestFlash = view.document.querySelector(".za-warpflash.on");
    assert.ok(latestFlash, "latest navigation must retain its warp flash");
    assert.notEqual(latestFlash, firstFlash, "a fresh keyed flash must restart the CSS animation");

    await view.runClearedControlledTimeout(680);
    assert.ok(view.document.querySelector(".za-warpflash.on"), "an earlier timeout must not clear the latest pulse");
    assert.equal(view.document.querySelector("[data-cine]")?.getAttribute("data-cine"), "true");
    await view.runClearedControlledTimeout(1100);
    assert.equal(
      view.document.querySelector("[data-cine]")?.getAttribute("data-cine"),
      "true",
      "an earlier cinematic timeout must not clear the latest letterbox",
    );
    await view.runControlledTimeout(1100);
    assert.equal(
      view.document.querySelector("[data-cine]")?.getAttribute("data-cine"),
      "false",
      "the latest cinematic timeout must clear its letterbox",
    );

    await view.cleanup();
    cleaned = true;
    assert.equal(view.pendingControlledTimeoutsFor(680, 1100), 0, "unmount must clear latest pulse timers");
  } finally {
    if (!cleaned) await view.cleanup();
  }
});

test("reduced motion settles active navigation effects and keeps later navigation immediate", async () => {
  const view = mountCommandDeck({
    url: "https://cashio.us/",
    reducedMotion: false,
    controlledTimers: true,
    capturePulseTimers: true,
    deferredSmoothScroll: true,
  });
  try {
    await view.render();
    const scroller = view.document.querySelector("main.za-scroll");
    await view.click(labeledButton(view.document, "Go to ROUTING deck"));
    assert.equal(scroller.scrollTop, 0, "the harness must keep the native smooth scroll physically pending");
    assert.equal(view.pendingSmoothScrollTop(scroller), 1992, "Routing must be the pending smooth destination");
    assert.ok(view.document.querySelector(".za-warpflash.on"), "motion-enabled navigation must begin its warp flash");
    assert.equal(view.document.querySelector("[data-cine]")?.getAttribute("data-cine"), "true");

    await view.setReducedMotion(true);
    assert.equal(
      scroller.scrollTop,
      1992,
      "a live preference change must finish the pending Routing scroll immediately",
    );
    assert.equal(view.pendingSmoothScrollTop(scroller), null, "the native smooth scroll must no longer be pending");
    assert.equal(
      view.document.querySelector(".za-warpflash.on"),
      null,
      "preference changes must cancel an active warp flash",
    );
    assert.equal(view.document.querySelector(".za-sweep.on"), null, "preference changes must cancel an active sweep");
    assert.equal(view.document.querySelector("[data-cine]")?.getAttribute("data-cine"), "false");
    assert.equal(useDeck.getState().chapOn, false, "preference changes must settle chapter text immediately");

    await view.click(labeledButton(view.document, "Go to CONTACT deck"));
    assert.equal(scroller?.scrollTop, 7992, "reduced motion navigation must land without smooth scrolling");
    assert.equal(view.document.querySelector(".za-warpflash.on"), null);
    assert.equal(view.document.querySelector(".za-sweep.on"), null);
    assert.equal(view.document.querySelector("[data-cine]")?.getAttribute("data-cine"), "false");
  } finally {
    await view.cleanup();
  }
});

test("a live reduced-motion change removes chapter and cinema-bar transitions", async () => {
  const view = mountCommandDeck({ reducedMotion: false });
  try {
    await view.render();
    await view.click(labeledButton(view.document, "Go to ROUTING deck"));
    const chapterOverlay = view.document.querySelector(".za-chapter-overlay");
    const cinemaBars = [...view.document.querySelectorAll(".za-cinema-bar")];
    assert.ok(chapterOverlay, "chapter motion must expose its runtime transition hook");
    assert.equal(cinemaBars.length, 2, "both cinema bars must expose their runtime transition hook");
    assert.ok(chapterOverlay.className.includes("duration-500"));
    assert.ok(cinemaBars.every((bar) => bar.className.includes("duration-700")));

    await view.setReducedMotion(true);
    assert.equal(chapterOverlay.className.includes("transition"), false, "chapter settling must be immediate");
    assert.ok(
      cinemaBars.every((bar) => !bar.className.includes("transition") && !bar.className.includes("duration-700")),
      "cinema bars must remove their live transition classes",
    );
  } finally {
    await view.cleanup();
  }
});

test("a live reduced-motion change finishes Executive READ THE BRIEF scrolling", async () => {
  const view = mountCommandDeck({ reducedMotion: false, deferredSmoothScroll: true });
  try {
    await view.render();
    const executiveMode = [...view.document.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("EXECUTIVE"),
    );
    assert.ok(executiveMode, "expected the Executive mode control");
    await view.click(executiveMode);

    const scroller = view.document.querySelector("main.za-scroll");
    scroller.scrollTop = 321;
    const readBrief = [...view.document.querySelectorAll("button")].find(
      (button) => button.textContent === "READ THE BRIEF",
    );
    assert.ok(readBrief, "expected the Executive READ THE BRIEF control");
    const briefSection = [...view.document.querySelectorAll('section[data-deck="0"]')].find((section) =>
      section.textContent?.includes("THREE OUTCOMES. ONE HUMAN COMMAND."),
    );
    assert.ok(briefSection, "expected the Executive brief destination");
    Object.defineProperty(briefSection, "offsetTop", { configurable: true, value: 864 });
    await view.click(readBrief);

    assert.equal(scroller.scrollTop, 321, "the harness must retain the pending Executive smooth scroll");
    assert.equal(view.pendingSmoothScrollTop(scroller), 864);
    await view.setReducedMotion(true);
    assert.equal(scroller.scrollTop, 864, "the live preference change must land on the Executive brief immediately");
    assert.equal(view.pendingSmoothScrollTop(scroller), null);
  } finally {
    await view.cleanup();
  }
});

test("a live reduced-motion change stops the red pulse without cancelling bounded alert dismissal", async () => {
  const view = mountCommandDeck({ reducedMotion: false, controlledTimers: true, capturePulseTimers: true });
  try {
    await view.render();
    assert.equal(
      Boolean(view.document.querySelector('button[data-cmd="red alert"]')),
      false,
      "RED ALERT must not add a visible command chip or tab stop",
    );
    const input = view.document.querySelector("#eve-command");
    await view.input(input, "red alert");
    await view.click(input.closest("form").querySelector('button[type="submit"]'));

    let border = view.document.querySelector('[class*="border-red"]');
    assert.ok(
      border.className.includes("animate-[za-redpulse"),
      "motion-enabled alerts must begin their bounded pulse",
    );
    assert.equal(view.pendingControlledTimeoutsFor(1900), 1, "red alert must own one bounded dismissal timer");

    await view.setReducedMotion(true);
    border = view.document.querySelector('[class*="border-red"]');
    assert.ok(border, "red alert must retain its static border and banner");
    assert.equal(
      border.className.includes("animate-[za-redpulse"),
      false,
      "reduced motion must suppress the red alert pulse",
    );
    assert.equal(
      view.pendingControlledTimeoutsFor(1900),
      1,
      "preference changes must preserve the active alert's bounded dismissal",
    );
    await view.runControlledTimeout(1900);
    assert.equal(
      view.document.querySelector('[class*="border-red"]'),
      null,
      "the static alert must still dismiss on schedule",
    );
  } finally {
    await view.cleanup();
  }
});

test("reduced-motion styles explicitly disable chapter and cinema-bar transitions", () => {
  assert.equal(
    /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.za-chapter-overlay,[\s\S]*?\.za-cinema-bar[\s\S]*?transition:\s*none\s*!important/i.test(
      stylesheet,
    ),
    true,
    "reduced-motion CSS must explicitly disable chapter and cinema-bar transitions",
  );
});

test("Builds canvas owns its frame work across visibility and inactive-deck transitions", async () => {
  const view = mountCommandDeck({
    url: "https://cashio.us/#deck=builds&article=7",
    reducedMotion: false,
    canvasRuntime: true,
  });
  try {
    await view.render();
    const scroller = view.document.querySelector("main.za-scroll");
    assert.equal(scroller?.dataset.activeDeck, "5");
    assert.equal(useDeck.getState().sel, 6, "the real hash wiring must select Article 7");
    const restingFrames = view.pendingAnimationFrames();
    assert.equal(
      view.pendingAnimationFramesNamed("animationFrame"),
      0,
      "the canvas must not animate before it is visible",
    );

    await view.canvasObserver("ownership", []);
    await view.canvasObserver("visibility", [{ isIntersecting: true }]);
    assert.ok(view.pendingAnimationFrames() > restingFrames, "an active, visible Builds deck may acquire one frame");

    await act(async () => {
      scroller.dataset.activeDeck = "8";
    });
    const ownership = await view.canvasObserver("ownership", []);
    assert.equal(view.pendingAnimationFrames(), restingFrames, "inactive Builds must cancel its pending frame");
    assert.equal(useDeck.getState().sel, 6, "standing down canvas work must not rewrite production selection");

    await act(async () => {
      scroller.dataset.activeDeck = "5";
    });
    await view.canvasObserver("visibility", [{ isIntersecting: false }]);
    await view.canvasObserver("ownership", []);
    assert.equal(
      view.pendingAnimationFrames(),
      restingFrames,
      "hidden Builds must not reacquire work when it becomes active",
    );

    await view.canvasObserver("visibility", [{ isIntersecting: true }]);
    assert.ok(view.pendingAnimationFrames() > restingFrames, "visible active Builds may resume its single owned frame");
    await view.cleanup();
    assert.equal(view.pendingAnimationFrames(), 0, "unmount must cancel the pending canvas frame");
    assert.equal(ownership.disconnected, true, "unmount must disconnect canvas ownership observation");
  } finally {
    if (view.document.defaultView) await view.cleanup();
  }
});
