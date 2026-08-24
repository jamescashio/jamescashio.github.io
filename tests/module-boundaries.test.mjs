import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CommandHeader, DesktopCommandRail, MobileCommandNavigation } from "../src/components/command-chrome.tsx";
import { DeckNavigator } from "../src/components/deck-navigator.tsx";
import { DeckShell, Kicker, Plate, Title } from "../src/components/deck-primitives.tsx";
import { FlightControl } from "../src/components/flight-control.tsx";
import { BlackBoxReceipt } from "../src/components/black-box-receipt.tsx";

const noop = () => {};

test("command chrome exports typed desktop, header, and mobile navigation boundaries", () => {
  const desktop = renderToStaticMarkup(
    createElement(DesktopCommandRail, {
      audio: false,
      deck: 0,
      elapsedMs: 0,
      hudClassName: "",
      mode: "technical",
      onDeckHover: noop,
      onNavigate: noop,
      onStopFlight: noop,
      onToggleAudio: noop,
      onToggleFlight: noop,
      onToggleRail: noop,
      railOpen: false,
      tour: false,
    }),
  );
  assert.match(desktop, /aria-label="Command decks"/);
  assert.match(desktop, /Run the 30-second flight/);
  assert.match(desktop, /aria-label="Expand command rail"/);

  const header = renderToStaticMarkup(
    createElement(CommandHeader, {
      audio: false,
      clock: "0000.000",
      craftIndex: 0,
      deck: 0,
      hudClassName: "",
      onNavigateCraft: noop,
      onOpenNavigator: noop,
      onToggleAudio: noop,
      tour: false,
    }),
  );
  assert.match(header, /AUDIO OFF/);
  assert.match(header, /Open deck navigator/);

  const mobile = renderToStaticMarkup(
    createElement(MobileCommandNavigation, {
      deck: 0,
      hudClassName: "",
      mode: "technical",
      onNavigate: noop,
      onOpenNavigator: noop,
    }),
  );
  assert.match(mobile, /aria-label="Mobile command decks"/);
  assert.match(mobile, /aria-label="Go to SNAPSHOT"/);
});

test("deck primitives and focused visitor components remain independently importable", () => {
  assert.equal(typeof DeckShell, "function");
  assert.equal(typeof Kicker, "function");
  assert.equal(typeof Title, "function");
  assert.equal(typeof Plate, "function");
  assert.equal(typeof DeckNavigator, "function");
  assert.equal(typeof FlightControl, "function");
  assert.equal(typeof BlackBoxReceipt, "function");
});

test("command and deck parents compose focused modules without retaining the old owners", async () => {
  const commandDeck = await readFile(new URL("../src/components/command-deck.tsx", import.meta.url), "utf8");
  const decks = await readFile(new URL("../src/components/decks.tsx", import.meta.url), "utf8");

  for (const legacyChrome of ["<aside", "<header", 'aria-label="Mobile command decks"']) {
    assert.doesNotMatch(commandDeck, new RegExp(legacyChrome), `CommandDeck still owns ${legacyChrome}`);
  }
  for (const component of [
    "DesktopCommandRail",
    "CommandHeader",
    "MobileCommandNavigation",
    "MobileFlightControl",
    "DeckNavigator",
  ]) {
    assert.match(commandDeck, new RegExp(`<${component}\\b`), `CommandDeck must compose ${component}`);
  }

  for (const declaration of ["Kicker", "Title", "CountUp", "DeckShell", "Ticker", "Plate"]) {
    assert.doesNotMatch(decks, new RegExp(`function ${declaration}\\b`), `decks.tsx still declares ${declaration}`);
  }
  assert.match(decks, /from "\.\/deck-primitives"/);
  assert.match(decks, /<BlackBoxReceipt\b/);
});
