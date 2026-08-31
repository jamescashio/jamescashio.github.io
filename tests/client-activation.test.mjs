import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { scheduleClientActivation } from "../src/lib/client-activation.ts";

function frameScheduler() {
  let id = 0;
  const frames = new Map();
  const timers = new Map();
  const listeners = new Map();
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
    readFile(new URL("../index.html", import.meta.url), "utf8"),
    readFile(new URL("../src/bootstrap.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/main.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(documentHtml, /<style data-critical-shell>/);
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
  assert.match(main, /document\.querySelector\("style\[data-critical-shell\]"\)\?\.remove\(\)/);
  assert.match(main, /root\.dataset\.clientActivated = "true"/);
});
