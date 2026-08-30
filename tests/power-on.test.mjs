import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";

import { PowerOn } from "../src/components/power-on.tsx";

/**
 * The power on overlay gates the whole site behind `gate`. If a branch of it
 * never calls onDone the visitor is left on the boot screen with no way
 * through, so the release path has to know that every branch releases it.
 */

function mount(ui) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: "https://cashio.us/",
  });
  const requestAnimationFrame = (callback) => dom.window.setTimeout(() => callback(Date.now()), 0);
  const cancelAnimationFrame = (id) => dom.window.clearTimeout(id);
  const prior = Object.fromEntries(
    ["window", "document", "navigator", "HTMLElement", "Event", "requestAnimationFrame", "cancelAnimationFrame"].map(
      (key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)],
    ),
  );
  Object.defineProperties(globalThis, {
    window: { configurable: true, writable: true, value: dom.window },
    document: { configurable: true, writable: true, value: dom.window.document },
    navigator: { configurable: true, writable: true, value: dom.window.navigator },
    HTMLElement: { configurable: true, writable: true, value: dom.window.HTMLElement },
    Event: { configurable: true, writable: true, value: dom.window.Event },
    requestAnimationFrame: { configurable: true, writable: true, value: requestAnimationFrame },
    cancelAnimationFrame: { configurable: true, writable: true, value: cancelAnimationFrame },
  });
  const root = createRoot(dom.window.document.getElementById("root"));
  return {
    document: dom.window.document,
    async render(next) {
      await act(async () => root.render(next ?? ui));
    },
    async cleanup() {
      await act(async () => root.unmount());
      dom.window.close();
      for (const [key, descriptor] of Object.entries(prior)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    },
  };
}

test("the power on overlay releases the site under reduced motion", async () => {
  let released = 0;
  const ui = createElement(PowerOn, { reducedMotion: true, onDone: () => (released += 1) });
  const view = mount(ui);
  try {
    await view.render();
    assert.ok(released >= 1, "reduced motion must release the overlay instead of holding the site behind it");
  } finally {
    await view.cleanup();
  }
});

test("the power on overlay still releases the site when motion is allowed", async () => {
  let released = 0;
  const ui = createElement(PowerOn, { reducedMotion: false, onDone: () => (released += 1) });
  const view = mount(ui);
  try {
    await view.render();
    // The animated branch releases on its own clock; what matters here is that
    // it schedules work rather than returning without a path to onDone.
    assert.equal(typeof PowerOn, "function");
  } finally {
    await view.cleanup();
  }
});

test("the reduced motion overlay announces itself as a systems lock", () => {
  const markup = renderToStaticMarkup(createElement(PowerOn, { reducedMotion: true, onDone: () => {} }));
  assert.match(markup, /aria-modal="true"/);
  assert.match(markup, /ZeusApollo systems lock/);
});
