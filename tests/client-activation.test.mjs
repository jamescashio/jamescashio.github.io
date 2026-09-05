import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { JSDOM } from "jsdom";

import { scheduleClientActivation } from "../src/lib/client-activation.ts";

function frameScheduler() {
  let id = 0;
  const frames = new Map();
  const timers = new Map();
  const listeners = new Map();
  const reportedErrors = [];
  return {
    scheduler: {
      requestAnimationFrame(callback) {
        const next = ++id;
        frames.set(next, callback);
        return next;
      },
      cancelAnimationFrame(frame) {
        frames.delete(frame);
      },
      setTimeout(callback, delay) {
        const next = ++id;
        timers.set(next, { callback, delay });
        return next;
      },
      clearTimeout(timer) {
        timers.delete(timer);
      },
      addEventListener(type, listener) {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type).add(listener);
      },
      removeEventListener(type, listener) {
        listeners.get(type)?.delete(listener);
      },
      reportError(error) {
        reportedErrors.push(error);
      },
    },
    runNext() {
      const entry = frames.entries().next().value;
      assert.ok(entry, "expected a scheduled animation frame");
      frames.delete(entry[0]);
      entry[1](performance.now());
    },
    pending() {
      return frames.size + timers.size;
    },
    runDelay(delay) {
      const entry = [...timers.entries()].find(([, timer]) => timer.delay === delay);
      assert.ok(entry, `expected a scheduled ${delay}ms activation delay`);
      timers.delete(entry[0]);
      entry[1].callback();
    },
    dispatchIntent(type, event = { type }) {
      for (const listener of [...(listeners.get(type) ?? [])]) listener(event);
    },
    listenerCount() {
      return [...listeners.values()].reduce((count, entries) => count + entries.size, 0);
    },
    reportedErrors,
  };
}

test("a click completed before asynchronous activation is replayed once after the client is ready", async () => {
  const frames = frameScheduler();
  let resolveActivation;
  const activation = new Promise((resolve) => {
    resolveActivation = resolve;
  });
  let replayed = 0;
  const target = { click: () => (replayed += 1) };
  let prevented = 0;
  let stopped = 0;
  scheduleClientActivation(() => activation, frames.scheduler);

  frames.dispatchIntent("pointerdown", { type: "pointerdown", target });
  frames.dispatchIntent("click", {
    type: "click",
    target,
    preventDefault: () => (prevented += 1),
    stopImmediatePropagation: () => (stopped += 1),
  });
  assert.equal(replayed, 0);
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);

  resolveActivation();
  await activation;
  await Promise.resolve();
  assert.equal(replayed, 1);
  assert.equal(frames.listenerCount(), 0);
});

test("a non-Snapshot initial route starts activation synchronously", () => {
  const frames = frameScheduler();
  let activations = 0;

  scheduleClientActivation(
    () => {
      activations += 1;
    },
    frames.scheduler,
    { defer: false },
  );

  assert.equal(activations, 1, "a direct-link route must not paint the unrelated Snapshot shell first");
  assert.equal(frames.pending(), 0);
  assert.equal(frames.listenerCount(), 0);
});

test("the first Ctrl+K command is preserved until the hydrated shortcut handler is ready", async () => {
  const frames = frameScheduler();
  const dom = new JSDOM("<!doctype html><body><button>OPEN</button></body>");
  const target = dom.window.document.querySelector("button");
  let resolveActivation;
  const activation = new Promise((resolve) => {
    resolveActivation = resolve;
  });
  let opened = 0;
  let prevented = 0;
  let stopped = 0;
  dom.window.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key.toLowerCase() === "k") opened += 1;
  });
  scheduleClientActivation(() => activation, frames.scheduler);

  frames.dispatchIntent("keydown", {
    type: "keydown",
    key: "k",
    code: "KeyK",
    ctrlKey: true,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    repeat: false,
    location: 0,
    target,
    preventDefault: () => (prevented += 1),
    stopImmediatePropagation: () => (stopped += 1),
  });
  assert.equal(opened, 0);

  resolveActivation();
  await activation;
  await Promise.resolve();

  assert.equal(opened, 1, "the original navigator command must run exactly once after hydration");
  assert.equal(prevented, 1, "the browser must not consume Ctrl+K before replay");
  assert.equal(stopped, 1);
  dom.window.close();
});

test("the first touch swipe preserves its coordinates and navigates exactly once after hydration", async () => {
  const frames = frameScheduler();
  const dom = new JSDOM("<!doctype html><body><main></main></body>");
  const target = dom.window.document.querySelector("main");
  let resolveActivation;
  const activation = new Promise((resolve) => {
    resolveActivation = resolve;
  });
  let swipeStart = null;
  const navigations = [];
  target.addEventListener("touchstart", (event) => {
    swipeStart = event.touches[0].clientX;
  });
  target.addEventListener("touchend", (event) => {
    const dx = event.changedTouches[0].clientX - swipeStart;
    if (Math.abs(dx) >= 72) navigations.push(dx < 0 ? "next" : "previous");
  });
  scheduleClientActivation(() => activation, frames.scheduler);

  frames.dispatchIntent("touchstart", {
    type: "touchstart",
    target,
    touches: [{ identifier: 7, clientX: 260, clientY: 420, target }],
  });
  frames.dispatchIntent("touchend", {
    type: "touchend",
    target,
    changedTouches: [{ identifier: 7, clientX: 120, clientY: 423, target }],
    preventDefault() {},
    stopImmediatePropagation() {},
  });
  assert.deepEqual(navigations, []);

  resolveActivation();
  await activation;
  await Promise.resolve();

  assert.deepEqual(navigations, ["next"], "the preserved swipe must reach the real handler exactly once");
  dom.window.close();
});

test("pointerdown before touchstart preserves the browser-ordered first swipe exactly once", async () => {
  const frames = frameScheduler();
  const dom = new JSDOM('<!doctype html><body><main tabindex="-1"></main></body>');
  const target = dom.window.document.querySelector("main");
  let resolveActivation;
  const activation = new Promise((resolve) => {
    resolveActivation = resolve;
  });
  let swipeStart = null;
  const navigations = [];
  target.addEventListener("touchstart", (event) => {
    swipeStart = event.touches[0].clientX;
  });
  target.addEventListener("touchend", (event) => {
    const dx = event.changedTouches[0].clientX - swipeStart;
    if (Math.abs(dx) >= 72) navigations.push(dx < 0 ? "next" : "previous");
  });
  scheduleClientActivation(() => activation, frames.scheduler);

  frames.dispatchIntent("pointerdown", { type: "pointerdown", target });
  frames.dispatchIntent("touchstart", {
    type: "touchstart",
    target,
    touches: [{ identifier: 9, clientX: 280, clientY: 420, target }],
  });
  frames.dispatchIntent("touchend", {
    type: "touchend",
    target,
    changedTouches: [{ identifier: 9, clientX: 100, clientY: 423, target }],
    preventDefault() {},
    stopImmediatePropagation() {},
  });

  resolveActivation();
  await activation;
  await Promise.resolve();

  assert.deepEqual(navigations, ["next"], "the Pointer Events ordering must not consume the complete swipe");
  assert.equal(frames.listenerCount(), 0);
  dom.window.close();
});

test("pointerdown on a control descendant replays the stable activatable ancestor once", async () => {
  const frames = frameScheduler();
  const dom = new JSDOM("<!doctype html><body><button><span>GO</span></button></body>");
  const button = dom.window.document.querySelector("button");
  const child = button.querySelector("span");
  let resolveActivation;
  const activation = new Promise((resolve) => {
    resolveActivation = resolve;
  });
  let clicks = 0;
  let prevented = false;
  button.addEventListener("click", () => (clicks += 1));
  scheduleClientActivation(() => activation, frames.scheduler);

  frames.dispatchIntent("pointerdown", { type: "pointerdown", target: child });
  frames.dispatchIntent("click", {
    type: "click",
    target: button,
    preventDefault: () => (prevented = true),
    stopImmediatePropagation() {},
  });
  if (!prevented) button.click();
  assert.equal(clicks, 0, "the unhydrated control must not run before its real handler exists");

  resolveActivation();
  await activation;
  await Promise.resolve();

  assert.equal(clicks, 1);
  dom.window.close();
});

test("an external anchor keeps its native navigation click and is never replayed", async () => {
  const frames = frameScheduler();
  const dom = new JSDOM('<!doctype html><body><a href="https://example.net/"><span>LEAVE</span></a></body>', {
    url: "https://cashio.us/",
  });
  const anchor = dom.window.document.querySelector("a");
  const child = anchor.querySelector("span");
  let resolveActivation;
  const activation = new Promise((resolve) => {
    resolveActivation = resolve;
  });
  let clicks = 0;
  let prevented = false;
  anchor.addEventListener("click", (event) => {
    event.preventDefault();
    clicks += 1;
  });
  scheduleClientActivation(() => activation, frames.scheduler);

  frames.dispatchIntent("pointerdown", { type: "pointerdown", target: child });
  frames.dispatchIntent("click", {
    type: "click",
    target: anchor,
    preventDefault: () => (prevented = true),
    stopImmediatePropagation() {},
  });
  if (!prevented) anchor.click();
  assert.equal(clicks, 1, "the native external action must remain available during activation");

  resolveActivation();
  await activation;
  await Promise.resolve();
  assert.equal(clicks, 1, "activation must not duplicate external navigation");
  dom.window.close();
});

test("an external-anchor descendant inside main tabindex=-1 keeps one native click", async () => {
  const frames = frameScheduler();
  const dom = new JSDOM(
    '<!doctype html><body><main tabindex="-1"><a href="https://example.net/"><span>LEAVE</span></a></main></body>',
    { url: "https://cashio.us/" },
  );
  const anchor = dom.window.document.querySelector("a");
  const child = anchor.querySelector("span");
  let resolveActivation;
  const activation = new Promise((resolve) => {
    resolveActivation = resolve;
  });
  let clicks = 0;
  let prevented = false;
  anchor.addEventListener("click", (event) => {
    event.preventDefault();
    clicks += 1;
  });
  scheduleClientActivation(() => activation, frames.scheduler);

  frames.dispatchIntent("pointerdown", { type: "pointerdown", target: child });
  frames.dispatchIntent("click", {
    type: "click",
    target: child,
    preventDefault: () => (prevented = true),
    stopImmediatePropagation() {},
  });
  if (!prevented) child.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }));

  assert.equal(clicks, 1, "main must not replace or suppress the native external-anchor target");
  resolveActivation();
  await activation;
  await Promise.resolve();
  assert.equal(clicks, 1, "hydration must not replay the external navigation");
  dom.window.close();
});

test("failed activation cleans interception, reports the error, and replays no application command", async () => {
  const frames = frameScheduler();
  const dom = new JSDOM("<!doctype html><body><button>OPEN</button></body>");
  const target = dom.window.document.querySelector("button");
  let rejectActivation;
  const activation = new Promise((_, reject) => {
    rejectActivation = reject;
  });
  let clicks = 0;
  target.addEventListener("click", () => (clicks += 1));
  const queuedMicrotasks = [];
  const nativeQueueMicrotask = globalThis.queueMicrotask;
  globalThis.queueMicrotask = (callback) => queuedMicrotasks.push(callback);
  try {
    scheduleClientActivation(() => activation, frames.scheduler);
    frames.dispatchIntent("pointerdown", { type: "pointerdown", target });
    frames.dispatchIntent("click", {
      type: "click",
      target,
      preventDefault() {},
      stopImmediatePropagation() {},
    });

    const error = new Error("hydration failed");
    rejectActivation(error);
    await activation.catch(() => undefined);
    await Promise.resolve();

    assert.equal(clicks, 0, "a failed client must not replay a command whose handler is unavailable");
    assert.deepEqual(frames.reportedErrors, [error], "the original failure must be surfaced through the host");
    assert.equal(frames.listenerCount(), 0, "failed activation must remove every interception listener");
    assert.equal(queuedMicrotasks.length, 0, "failure reporting must not manufacture an unhandled throw");
  } finally {
    globalThis.queueMicrotask = nativeQueueMicrotask;
    dom.window.close();
  }
});

test("client activation yields two frames so the prerendered initial route paints before hydration", () => {
  const frames = frameScheduler();
  let activations = 0;
  scheduleClientActivation(() => {
    activations += 1;
  }, frames.scheduler);

  assert.equal(activations, 0);
  assert.equal(frames.pending(), 1);
  frames.runNext();
  assert.equal(activations, 0, "the first rendering opportunity must remain free for the prerendered route");
  assert.equal(frames.pending(), 1);
  frames.runNext();
  assert.equal(activations, 0, "hydration must not compete with the prerendered route's LCP frame");
  assert.equal(frames.pending(), 1);
  frames.runDelay(250);
  assert.equal(activations, 1);
  assert.equal(frames.pending(), 0);
  assert.equal(frames.listenerCount(), 0);
});

test("cancelled client activation never starts stale hydration work", () => {
  const frames = frameScheduler();
  let activations = 0;
  const cancel = scheduleClientActivation(() => {
    activations += 1;
  }, frames.scheduler);

  frames.runNext();
  frames.runNext();
  cancel();

  assert.equal(frames.pending(), 0);
  assert.equal(activations, 0);
  assert.equal(frames.listenerCount(), 0);
});

for (const intent of ["pointerdown", "keydown", "touchstart", "hashchange", "popstate"]) {
  test(`${intent} intent activates hydration immediately during the post-paint delay`, () => {
    const frames = frameScheduler();
    let activations = 0;
    scheduleClientActivation(() => {
      activations += 1;
    }, frames.scheduler);
    frames.runNext();
    frames.runNext();

    frames.dispatchIntent(intent);
    frames.dispatchIntent(intent);

    assert.equal(activations, 1, "intent must activate exactly once");
    assert.equal(frames.pending(), 0);
    assert.equal(frames.listenerCount(), 0);
  });
}

test("the prerendered route has a readable inline shell while the full stylesheet waits for activation", async () => {
  const [documentHtml, bootstrap, main] = await Promise.all([
    readFile(new URL("../command-deck.html", import.meta.url), "utf8"),
    readFile(new URL("../src/bootstrap.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/main.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(documentHtml, /<style data-critical-shell>/);
  assert.match(documentHtml, /<style data-critical-fonts>/);
  for (const selector of [
    ".za-systems-\\6fnline",
    "#main-content",
    "section[data-deck]",
    ".za-snapshot-lede",
    ".za-snapshot-copy",
    ".za-snapshot-modes",
    ".za-mobile-rail-scroll",
    ".za-command-header button.za-chip",
    "font-weight: 600",
    "min-height: 60px",
    ".za-corner-hud {",
    ".za-corner-hud .za-airframe",
    ".za-bit-control {",
    "@media (min-width: 768px)",
    "grid-template-columns: repeat(5, minmax(0, 1fr))",
  ]) {
    assert.ok(documentHtml.includes(selector), `critical shell must cover ${selector}`);
  }
  assert.match(
    documentHtml,
    /\.za-command-header button\[aria-label="Open deck navigator"\]\s*\{[^}]*min-width:\s*44px;/,
    "the critical shell must preserve the navigator's activated 44px width",
  );
  assert.doesNotMatch(bootstrap, /styles\.css/, "the full stylesheet must not block the prerendered LCP");
  assert.match(main, /import "\.\/styles\.css";/, "normal activation must restore the complete design stylesheet");
  assert.match(documentHtml, /#root:not\(\[data-client-activated\]\) \.za-vs-hud/);
  assert.match(
    documentHtml,
    /font-family: "Exo 2";[\s\S]*?font-weight: 400;[\s\S]*?src: url\("\/fonts\/exo2-500\.woff2"\)/,
    "the critical shell must use the same normal-weight body face as the activated design",
  );
  assert.match(
    documentHtml,
    /\.za-bracket > \.za-mono:not\(\.za-critical-telemetry\) \{[\s\S]*?font-size: 11px;[\s\S]*?line-height: 1\.5;/,
    "desktop operator copy must keep its activated geometry",
  );
  assert.match(
    documentHtml,
    /\.za-corner-hud \.za-airframe \{[\s\S]*?width: 250px;[\s\S]*?min-height: 143\.5px;[\s\S]*?padding: 12px;[\s\S]*?font-size: 10px;[\s\S]*?line-height: 1\.625;/,
    "desktop airframe HUD must keep its activated geometry",
  );
  assert.match(
    documentHtml,
    /\.za-btn,[\s\S]*?\.za-btn-ghost \{[\s\S]*?line-height: 1\.5;/,
    "desktop snapshot actions must keep their activated height",
  );
  assert.match(
    documentHtml,
    /@media \(max-width: 767px\) \{[\s\S]*?\.za-snapshot-lede \{[\s\S]*?min-height: 0;[\s\S]*?\.za-critical-telemetry \{[\s\S]*?font-size: 11px;[\s\S]*?\.za-panel \{[\s\S]*?min-height: 95\.25px;/,
    "the exact Lighthouse phone shell must retain its activated snapshot geometry",
  );
  assert.match(
    documentHtml,
    /@media \(min-width: 1024px\) \{[\s\S]*?\.za-panel \{[\s\S]*?min-height: 99\.25px;/,
    "desktop status panels must retain their activated height without leaking into phone layout",
  );
  assert.match(
    documentHtml,
    /\.za-bit-control,[\s\S]*?\.za-bit-control canvas \{[\s\S]*?width: 104px;[\s\S]*?height: 104px;/,
    "desktop Bit must keep its activated footprint",
  );
  assert.match(
    main,
    /clientReady\.then\(\(\) => \{[\s\S]*?document\.querySelector\("style\[data-critical-shell\]"\)\?\.remove\(\);[\s\S]*?root\.dataset\.clientActivated = "true"/,
    "activation must retire only shell rules and become observable after React layout effects are ready",
  );
  assert.doesNotMatch(main, /style\[data-critical-fonts\][\s\S]*?remove/);
});

test("the hashed pre-paint route helper aligns a direct deck before the app markup can render", async () => {
  const documentHtml = await readFile(new URL("../command-deck.html", import.meta.url), "utf8");
  const sourceDocument = new JSDOM(documentHtml).window.document;
  const helper = sourceDocument.querySelector("script[data-critical-route]");
  const bootstrap = sourceDocument.querySelector('script[type="module"][src="/src/bootstrap.ts"]');

  assert.ok(helper, "the pre-paint route helper must be present in the document head");
  assert.ok(bootstrap, "the deferred activation bootstrap must remain present");
  assert.ok(
    helper.compareDocumentPosition(bootstrap) & sourceDocument.defaultView.Node.DOCUMENT_POSITION_FOLLOWING,
    "the pre-paint route helper must execute before client activation",
  );

  const helperSource = helper.textContent ?? "";
  const helperHash = createHash("sha256").update(helperSource).digest("base64");
  const csp = sourceDocument.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute("content");
  assert.match(
    csp ?? "",
    new RegExp(`script-src 'self' 'sha256-${helperHash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}'`),
  );

  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {
    runScripts: "outside-only",
    url: "https://cashio.us/#deck=iron",
  });
  dom.window.eval(helperSource);

  const main = dom.window.document.createElement("main");
  main.id = "main-content";
  Object.defineProperty(main, "scrollHeight", { configurable: true, value: 5_000 });
  Object.defineProperty(main, "clientHeight", { configurable: true, value: 844 });
  const section = dom.window.document.createElement("section");
  section.dataset.deck = "3";
  Object.defineProperty(section, "offsetTop", { configurable: true, value: 3_600 });
  const anchor = dom.window.document.createElement("span");
  anchor.id = "deck=iron";
  section.append(anchor);
  main.append(section);
  dom.window.document.body.append(main);
  await Promise.resolve();

  assert.equal(main.scrollTop, 3_592, "the direct Iron route must align at the canonical eight-pixel inset");
  dom.window.close();
});
