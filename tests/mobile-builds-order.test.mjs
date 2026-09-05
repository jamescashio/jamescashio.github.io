import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { DeckBuilds } from "../src/components/decks.tsx";
import { useDeck } from "../src/lib/store.ts";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function mountDeckBuilds() {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>');
  Object.defineProperty(dom.window.HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    value: () => null,
  });
  const globals = ["window", "document", "navigator", "HTMLElement", "HTMLCanvasElement"];
  const prior = Object.fromEntries(globals.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.defineProperties(globalThis, {
    window: { configurable: true, writable: true, value: dom.window },
    document: { configurable: true, writable: true, value: dom.window.document },
    navigator: { configurable: true, writable: true, value: dom.window.navigator },
    HTMLElement: { configurable: true, writable: true, value: dom.window.HTMLElement },
    HTMLCanvasElement: { configurable: true, writable: true, value: dom.window.HTMLCanvasElement },
  });
  useDeck.setState({ sel: 0, shown: [5] });
  const root = createRoot(dom.window.document.getElementById("root"));

  return {
    document: dom.window.document,
    async render() {
      await act(async () => {
        root.render(createElement(DeckBuilds, { s5: { current: null }, onSelect: () => {} }));
      });
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

test("Builds presents article detail and selector before the proof map in source and focus order", async () => {
  const view = mountDeckBuilds();
  try {
    await view.render();
    const deck = view.document.querySelector('section[data-deck="5"]');
    const details = deck.querySelector(".za-build-details");
    const selector = details.querySelector(".za-build-selector");
    const map = deck.querySelector(".za-build-map");

    assert.ok(details);
    assert.ok(selector);
    assert.ok(map);
    assert.ok(
      details.compareDocumentPosition(map) & view.document.defaultView.Node.DOCUMENT_POSITION_FOLLOWING,
      "article detail must precede the proof map in the mobile reading order",
    );

    const focusable = [...details.querySelectorAll("button")];
    assert.ok(
      focusable[0] === selector.querySelector("button"),
      "Tab must reach article selection before the proof map",
    );
    assert.ok(
      selector.compareDocumentPosition(map) & view.document.defaultView.Node.DOCUMENT_POSITION_FOLLOWING,
      "the full article selector must precede the proof map in source order",
    );
  } finally {
    await view.cleanup();
  }
});
