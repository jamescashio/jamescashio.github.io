import assert from "node:assert/strict";
import test from "node:test";

import { DECKS } from "../src/lib/content.ts";

let navigation = {};
try {
  navigation = await import("../src/lib/deck-navigation.ts");
} catch {
  // The first TDD run intentionally proves the navigation boundary is missing.
}

test("parses every canonical deck hash into its stable deck index", () => {
  assert.equal(typeof navigation.parseDeckHash, "function", "the deck hash parser must be exposed");

  for (const [index, deck] of DECKS.entries()) {
    assert.deepEqual(navigation.parseDeckHash(`#deck=${deck.id}`), { deck: index, article: 0 });
  }
});

test("formats stable hashes for all decks and only includes an article on Deck 06", () => {
  assert.equal(typeof navigation.formatDeckHash, "function", "the deck hash formatter must be exposed");

  for (const [index, deck] of DECKS.entries()) {
    const expected = deck.id === "builds" ? "#deck=builds&article=1" : `#deck=${deck.id}`;
    assert.equal(navigation.formatDeckHash({ deck: index, article: 0 }), expected);
  }
  assert.equal(navigation.formatDeckHash({ deck: 5, article: 6 }), "#deck=builds&article=7");
  assert.equal(navigation.formatDeckHash({ deck: 0, article: 6 }), "#deck=snapshot");
});

test("restores the selected Deck 06 article and clamps invalid article numbers safely", () => {
  assert.deepEqual(navigation.parseDeckHash("#deck=builds&article=1"), { deck: 5, article: 0 });
  assert.deepEqual(navigation.parseDeckHash("#deck=builds&article=7"), { deck: 5, article: 6 });
  assert.deepEqual(navigation.parseDeckHash("#deck=builds&article=0"), { deck: 5, article: 0 });
  assert.deepEqual(navigation.parseDeckHash("#deck=builds&article=999"), { deck: 5, article: 6 });
  assert.deepEqual(navigation.parseDeckHash("#deck=builds&article=not-a-number"), { deck: 5, article: 0 });
});

test("falls back safely for invalid hashes and leaves the query outside the hash alone", () => {
  const previousWindow = globalThis.window;
  globalThis.window = { location: { search: "?campaign=flight-test" } };

  try {
    assert.deepEqual(navigation.parseDeckHash("#deck=unknown&article=4"), { deck: 0, article: 0 });
    assert.deepEqual(navigation.parseDeckHash("#article=4"), { deck: 0, article: 0 });
    assert.equal(navigation.formatDeckHash({ deck: 5, article: 3 }), "#deck=builds&article=4");
    assert.equal(globalThis.window.location.search, "?campaign=flight-test");
  } finally {
    globalThis.window = previousWindow;
  }
});

test("recognizes an internal flight hash write without treating it like back or forward navigation", () => {
  assert.equal(
    typeof navigation.recordInternalHashWrite,
    "function",
    "the navigation transition boundary must be exposed",
  );
  const written = navigation.recordInternalHashWrite(navigation.createHashTransitionState(), "#deck=routing");
  assert.deepEqual(navigation.classifyHashChange(written, "#deck=routing"), {
    kind: "internal",
    state: { pendingInternalHash: null, restoringDeck: null },
  });
});

test("an internal hash event clears only its marker and preserves programmatic-scroll suppression", () => {
  const restoring = navigation.beginHashRestore(navigation.createHashTransitionState(), 2);
  const written = navigation.recordInternalHashWrite(restoring, "#deck=routing");
  assert.deepEqual(navigation.classifyHashChange(written, "#deck=routing"), {
    kind: "internal",
    state: { pendingInternalHash: null, restoringDeck: 2 },
  });
});

test("restores an external history hash without writing intermediate scroll decks into history", () => {
  const external = navigation.classifyHashChange(
    navigation.recordInternalHashWrite(navigation.createHashTransitionState(), "#deck=routing"),
    "#deck=builds&article=4",
  );
  assert.equal(external.kind, "external");
  assert.deepEqual(external.state, { pendingInternalHash: null, restoringDeck: null });

  const restoring = navigation.beginHashRestore(external.state, 5);
  const intermediate = navigation.consumeScrollDeck(restoring, 2);
  assert.deepEqual(intermediate, {
    writeHash: false,
    updateDeck: false,
    state: { pendingInternalHash: null, restoringDeck: 5 },
  });
  const landed = navigation.consumeScrollDeck(intermediate.state, 5);
  assert.deepEqual(landed, {
    writeHash: false,
    updateDeck: true,
    state: { pendingInternalHash: null, restoringDeck: null },
  });
  assert.deepEqual(navigation.consumeScrollDeck(landed.state, 6), {
    writeHash: true,
    updateDeck: true,
    state: { pendingInternalHash: null, restoringDeck: null },
  });
});

test("keeps the logical deck stable while restoration crosses responsive geometry", () => {
  const restoring = navigation.beginHashRestore(navigation.createHashTransitionState(), 8);

  assert.deepEqual(navigation.consumeScrollDeck(restoring, 4), {
    writeHash: false,
    updateDeck: false,
    state: { pendingInternalHash: null, restoringDeck: 8 },
  });
  assert.deepEqual(navigation.consumeScrollDeck(restoring, 8), {
    writeHash: false,
    updateDeck: true,
    state: { pendingInternalHash: null, restoringDeck: null },
  });
});

test("a genuine user interruption cancels restored-scroll suppression and resumes canonical hash writes", () => {
  assert.equal(
    typeof navigation.cancelHashRestore,
    "function",
    "the restoration cancellation boundary must be exposed",
  );
  const restoring = navigation.beginHashRestore(navigation.createHashTransitionState(), 5);
  const interrupted = navigation.cancelHashRestore(restoring);
  assert.deepEqual(interrupted, { pendingInternalHash: null, restoringDeck: null });
  assert.deepEqual(navigation.consumeScrollDeck(interrupted, 2), {
    writeHash: true,
    updateDeck: true,
    state: { pendingInternalHash: null, restoringDeck: null },
  });
});

test("only manual navigation stops the flight, while hash restoration remains one-way", () => {
  assert.equal(navigation.shouldStopFlightForNavigation("manual"), true);
  assert.equal(navigation.shouldStopFlightForNavigation("flight"), false);
  assert.equal(navigation.shouldStopFlightForNavigation("hash"), false);
  assert.equal(navigation.shouldStopFlightForNavigation("restore"), false);
  assert.equal(typeof navigation.hashWriteModeForNavigation, "function");
  assert.equal(navigation.hashWriteModeForNavigation("manual"), "push");
  assert.equal(navigation.hashWriteModeForNavigation("flight"), "replace");
  assert.equal(navigation.hashWriteModeForNavigation("hash"), null);
  assert.equal(navigation.hashWriteModeForNavigation("restore"), null);
  assert.equal(navigation.shouldWriteHashForNavigation("manual"), true);
  assert.equal(navigation.shouldWriteHashForNavigation("flight"), true);
  assert.equal(navigation.shouldWriteHashForNavigation("hash"), false);
  assert.equal(navigation.shouldWriteHashForNavigation("restore"), false);
  assert.equal(navigation.shouldAnimateNavigation("restore", false), false);
  assert.equal(navigation.shouldAnimateNavigation("manual", false), true);
  assert.equal(navigation.shouldAnimateNavigation("manual", true), false);
});
