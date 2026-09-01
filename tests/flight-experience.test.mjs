import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement, useState } from "react";
import { createRoot } from "react-dom/client";

import { BlackBoxReceipt } from "../src/components/black-box-receipt.tsx";
import { CommandHeader } from "../src/components/command-chrome.tsx";
import { DeckBrief, DeckGrid, DeckIron, DeckOperator, DeckRouting, DeckSnapshot } from "../src/components/decks.tsx";
import { runEve } from "../src/components/eve-console.tsx";
import { FlightControl } from "../src/components/flight-control.tsx";
import { motionDurationMs } from "../src/lib/animation-timing.ts";
import { BOOT, TELEMETRY } from "../src/lib/content.ts";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test("the guided flight uses a bounded stage warp hand-off", () => {
  assert.ok(motionDurationMs("stage-warp") <= 700, "a flight hand-off must finish its stage warp within 700ms");
});

function mount(ui, url = "https://cashio.us/?campaign=flight#deck=eve") {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url });
  Object.defineProperty(dom.window, "matchMedia", {
    configurable: true,
    value: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
  });
  const requestAnimationFrame = (callback) => dom.window.setTimeout(() => callback(Date.now()), 0);
  const cancelAnimationFrame = (id) => dom.window.clearTimeout(id);
  Object.defineProperties(dom.window, {
    requestAnimationFrame: { configurable: true, value: requestAnimationFrame },
    cancelAnimationFrame: { configurable: true, value: cancelAnimationFrame },
  });
  const prior = Object.fromEntries(
    [
      "window",
      "document",
      "navigator",
      "HTMLElement",
      "Event",
      "MouseEvent",
      "requestAnimationFrame",
      "cancelAnimationFrame",
    ].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]),
  );
  Object.defineProperties(globalThis, {
    window: { configurable: true, writable: true, value: dom.window },
    document: { configurable: true, writable: true, value: dom.window.document },
    navigator: { configurable: true, writable: true, value: dom.window.navigator },
    HTMLElement: { configurable: true, writable: true, value: dom.window.HTMLElement },
    Event: { configurable: true, writable: true, value: dom.window.Event },
    MouseEvent: { configurable: true, writable: true, value: dom.window.MouseEvent },
    requestAnimationFrame: { configurable: true, writable: true, value: requestAnimationFrame },
    cancelAnimationFrame: { configurable: true, writable: true, value: cancelAnimationFrame },
  });
  const root = createRoot(dom.window.document.getElementById("root"));

  return {
    document: dom.window.document,
    async render(nextUi) {
      await act(async () => root.render(nextUi));
    },
    async click(control) {
      await act(async () => control.click());
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

function button(document, name) {
  const control = [...document.querySelectorAll("button")].find((candidate) => candidate.textContent === name);
  assert.ok(control, `expected ${name} control`);
  return control;
}

function setBrowserApis({ share, writeText }) {
  Object.defineProperty(navigator, "share", { configurable: true, value: share });
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: writeText ? { writeText } : undefined });
}

test("DeckSnapshot renders the exact identity immediately before the unchanged hero heading", async () => {
  const view = mount(
    createElement(DeckSnapshot, {
      s0: { current: null },
      copyCol: { current: null },
      onEngage: () => {},
      onEve: () => {},
    }),
  );
  try {
    await view.render(
      createElement(DeckSnapshot, {
        s0: { current: null },
        copyCol: { current: null },
        onEngage: () => {},
        onEve: () => {},
      }),
    );
    const identity = [...view.document.querySelectorAll("p")].find(
      (element) => element.textContent === "DOUG CASHIO · ENTERPRISE AI + SECURITY SYSTEMS · OWNER-OPERATOR",
    );
    const hero = [...view.document.querySelectorAll("h1")].find(
      (element) => element.textContent === "OWN THE IRON AND THE ROUTE.",
    );

    assert.ok(identity, "expected exact owner-operator identity");
    assert.ok(hero, "expected unchanged hero heading");
    assert.equal(identity.nextElementSibling, hero, "the identity must immediately precede the hero heading");
  } finally {
    await view.cleanup();
  }
});

test("DeckSnapshot states the exact bounded 45-word introduction without changing identity or hero", async () => {
  const view = mount(
    createElement(DeckSnapshot, {
      s0: { current: null },
      copyCol: { current: null },
      onEngage: () => {},
      onEve: () => {},
    }),
  );
  try {
    await view.render(
      createElement(DeckSnapshot, {
        s0: { current: null },
        copyCol: { current: null },
        onEngage: () => {},
        onEve: () => {},
      }),
    );
    const lede = view.document.querySelector(".za-snapshot-lede")?.textContent;
    assert.equal(
      lede,
      "I run AI and security systems on servers I own, and I publish the evidence that they work.",
      "the hero must open with one plain sentence before any operator shorthand",
    );
    assert.ok(lede.split(/\s+/u).length <= 22, "the plain lede must stay short enough to read at a glance");
    const introduction = view.document.querySelector(".za-snapshot-copy")?.textContent;
    assert.equal(
      introduction,
      "Every claim here is measured and dated. Nineteen services run on two machines in a room I can walk into, and a routing layer picks the best model for each job rather than the cheapest.",
    );
    assert.ok(introduction.split(/\s+/u).length <= 60, "the introduction must stay within the clarity gate");
    assert.match(view.document.body.textContent, /DOUG CASHIO · ENTERPRISE AI \+ SECURITY SYSTEMS · OWNER-OPERATOR/);
    assert.equal(view.document.querySelector("h1")?.textContent, "OWN THE IRON AND THE ROUTE.");
  } finally {
    await view.cleanup();
  }
});

test("DeckSnapshot renders V34's dated aggregate and Executive outcome hierarchy", async () => {
  const view = mount(
    createElement(DeckSnapshot, {
      s0: { current: null },
      copyCol: { current: null },
      onEngage: () => {},
      onEve: () => {},
    }),
  );
  try {
    await view.render(
      createElement(DeckSnapshot, {
        s0: { current: null },
        copyCol: { current: null },
        onEngage: () => {},
        onEve: () => {},
      }),
    );
    assert.match(view.document.body.textContent, /18\/19 AT 31 AUG PROBE/);
    assert.match(view.document.body.textContent, /Detailed evidence, build proof, and operational context\./);
    assert.match(view.document.body.textContent, /Route control, evidence boundary, human authority\./);
    const executive = [...view.document.querySelectorAll(".za-snapshot-modes button")].find((control) =>
      control.textContent?.startsWith("EXECUTIVE"),
    );
    assert.ok(executive, "expected Executive mode control");
    await view.click(executive);
    assert.equal(executive.getAttribute("aria-pressed"), "true");
  } finally {
    await view.cleanup();
  }
});

test("current fleet decks expose only verified aggregate evidence without topology or role-to-host mapping", async () => {
  const ref = { current: null };
  const snapshot = mount(
    createElement(DeckSnapshot, {
      s0: ref,
      copyCol: ref,
      onEngage: () => {},
      onEve: () => {},
    }),
  );
  try {
    await snapshot.render(
      createElement(DeckSnapshot, {
        s0: ref,
        copyCol: ref,
        onEngage: () => {},
        onEve: () => {},
      }),
    );
    const cards = [...snapshot.document.querySelectorAll(".za-panel")];
    assert.equal(cards.length, 5, "Snapshot must retain its five-card evidence rhythm");
    assert.deepEqual(
      cards.map((card) => card.querySelector(".za-display")?.textContent),
      ["ZEUS", "APOLLO", "FLEET", "HOSTS", "PVE"],
    );
    assert.doesNotMatch(
      snapshot.document.body.textContent,
      /ATLAS|ATHENA|GENESIS|GATEWAY|QUORUM SUPPORT|STORAGE|RECOVERY/i,
    );
  } finally {
    await snapshot.cleanup();
  }

  const grid = mount(createElement(DeckGrid, { s1: ref }));
  try {
    await grid.render(createElement(DeckGrid, { s1: ref }));
    const roleCards = [...grid.document.querySelectorAll("section[data-deck='1'] button")];
    assert.equal(roleCards.length, 7, "Grid must retain the seven allowlisted role-family controls");
    for (const card of roleCards) {
      assert.doesNotMatch(card.textContent, /ZEUS|APOLLO/i, "a role family must not be assigned to a public host");
      assert.equal(card.hasAttribute("data-hub"), false, "a role family must not expose a host-mapping attribute");
    }
    assert.equal(
      grid.document.querySelector("section[data-deck='1'] svg"),
      null,
      "Grid must not render topology paths",
    );
  } finally {
    await grid.cleanup();
  }

  const iron = mount(createElement(DeckIron, { s3: ref }));
  try {
    await iron.render(createElement(DeckIron, { s3: ref }));
    const choices = [...iron.document.querySelectorAll("section[data-deck='3'] button .za-display")].map(
      (label) => label.textContent,
    );
    assert.deepEqual(choices, ["ZEUS", "APOLLO"], "Iron may offer only the two freshly probed Proxmox hosts");
    assert.doesNotMatch(iron.document.body.textContent, /ATLAS|ATHENA|GENESIS|GATEWAY|QUORUM SUPPORT|PRIVATE STORAGE/i);
    assert.doesNotMatch(
      iron.document.body.textContent,
      /CLUSTER SSH|ACCESS PATH/i,
      "the public Iron copy must not describe an internal access method",
    );
  } finally {
    await iron.cleanup();
  }
});

test("current status and release surfaces omit raw route identifiers and unprobed fleet topology", async () => {
  const status = JSON.parse(await readFile(new URL("../status.json", import.meta.url), "utf8"));
  const publicStatus = JSON.parse(await readFile(new URL("../public/status.json", import.meta.url), "utf8"));
  const releaseBody = await readFile(new URL("../RELEASE_BODY.md", import.meta.url), "utf8");
  assert.deepEqual(status, publicStatus, "root and public status exports must remain identical");
  assert.deepEqual(Object.keys(status), [
    "release",
    "revised",
    "status",
    "verified",
    "verifiedLong",
    "expires",
    "proxmox",
    "containers",
    "lanes",
    "routingVerified",
    "law",
    "note",
  ]);
  assert.deepEqual(status.proxmox, { version: "9.2.11", hostsOnline: 2, quorate: true });
  assert.deepEqual(status.containers, { running: 18, documented: 19, stopped: 1, zeus: 12, apollo: 6 });
  assert.deepEqual(status.lanes, { public: 10, privateCatalog: 36 });
  for (const surface of [JSON.stringify(status), releaseBody]) {
    assert.doesNotMatch(surface, /deepseek-v4-(?:flash|pro)/i, "raw DeepSeek route identifiers must remain private");
    assert.doesNotMatch(
      surface,
      /ATLAS|ATHENA|GENESIS|GATEWAY|QUORUM SUPPORT|PRIVATE STORAGE|RECOVERY INFRASTRUCTURE/i,
    );
  }
});

test("Executive choice promises outcomes rather than page count", async () => {
  const view = mount(createElement(DeckBrief, { sBrief: { current: null } }));
  try {
    await view.render(createElement(DeckBrief, { sBrief: { current: null } }));
    assert.match(view.document.body.textContent, /ROUTE CONTROL/);
    assert.match(view.document.body.textContent, /EVIDENCE BOUNDARY/);
    assert.match(view.document.body.textContent, /HUMAN AUTHORITY/);
    assert.doesNotMatch(view.document.body.textContent, /One page|Nine decks/);
  } finally {
    await view.cleanup();
  }
});

test("Executive cards keep routing, fleet evidence, and human accountability as separate metrics", async () => {
  const view = mount(createElement(DeckBrief, { sBrief: { current: null } }));
  try {
    Object.defineProperty(view.document.defaultView, "matchMedia", {
      configurable: true,
      value: () => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {} }),
    });
    await view.render(createElement(DeckBrief, { sBrief: { current: null } }));
    const cards = [...view.document.querySelectorAll("article")];
    assert.equal(cards.length, 3);
    assert.equal(cards[0].querySelector(".za-display")?.textContent, "10");
    assert.equal(
      cards[0].querySelector("p")?.textContent,
      "Ten public capability lanes are recorded in the 21 August 2026 routing inventory. Thirty-six private catalog entries are a separate count.",
    );
    assert.doesNotMatch(cards[0].textContent, /18\/19/);
    assert.equal(cards[1].querySelector(".za-display")?.textContent, "18/19");
    assert.equal(
      cards[1].querySelector("p")?.textContent,
      "18 of 19 documented guests were running at the 31 August probe. Two Proxmox hosts were online and quorate. The dated export is evidence, never telemetry.",
    );
    assert.equal(cards[2].querySelector(".za-display")?.textContent, "1");
    assert.match(cards[2].textContent, /OWNER ACCOUNTABLE/);
    assert.equal(
      cards[2].querySelector("p")?.textContent,
      "Owned compute and bounded autonomy leave one person accountable for routing, reliability, and the next decision.",
    );
  } finally {
    await view.cleanup();
  }
});

test("interactive evidence choices expose and update their real selected state", async (t) => {
  const ref = { current: null };

  await t.test("Grid role-family locks", async () => {
    const view = mount(createElement(DeckGrid, { s1: ref }));
    try {
      await view.render(createElement(DeckGrid, { s1: ref }));
      const controls = [...view.document.querySelectorAll("section[data-deck='1'] button")];
      assert.equal(controls.filter((control) => control.getAttribute("aria-pressed") === "true").length, 0);
      assert.equal(
        controls.every((control) => control.getAttribute("aria-pressed") === "false"),
        true,
      );
      await view.click(controls[2]);
      assert.deepEqual(
        controls.map((control) => control.getAttribute("aria-pressed")),
        ["false", "false", "true", "false", "false", "false", "false"],
      );
    } finally {
      await view.cleanup();
    }
  });

  await t.test("Routing lane detail", async () => {
    const view = mount(createElement(DeckRouting, { s2: ref }));
    try {
      await view.render(createElement(DeckRouting, { s2: ref }));
      const controls = [...view.document.querySelectorAll("section[data-deck='2'] button")];
      const detail = view.document.getElementById("routing-lane-detail");
      assert.ok(detail, "expected the controlled routing detail region");
      assert.equal(detail.getAttribute("aria-live"), "polite");
      assert.equal(detail.getAttribute("aria-atomic"), "true");
      assert.equal(
        controls.every((control) => control.getAttribute("aria-controls") === "routing-lane-detail"),
        true,
      );
      assert.deepEqual(
        controls.map((control) => control.getAttribute("aria-pressed")),
        controls.map((_, index) => String(index === 1)),
      );
      await view.click(controls[4]);
      assert.deepEqual(
        controls.map((control) => control.getAttribute("aria-pressed")),
        controls.map((_, index) => String(index === 4)),
      );
    } finally {
      await view.cleanup();
    }
  });

  await t.test("Iron host lock", async () => {
    const view = mount(createElement(DeckIron, { s3: ref }));
    try {
      await view.render(createElement(DeckIron, { s3: ref }));
      const controls = [...view.document.querySelectorAll("section[data-deck='3'] button")];
      assert.deepEqual(
        controls.map((control) => control.getAttribute("aria-pressed")),
        ["true", "false"],
      );
      await view.click(controls[1]);
      assert.deepEqual(
        controls.map((control) => control.getAttribute("aria-pressed")),
        ["false", "true"],
      );
    } finally {
      await view.cleanup();
    }
  });

  await t.test("Operator leash and law controls", async () => {
    const view = mount(createElement(DeckOperator, { s6: ref }));
    try {
      await view.render(createElement(DeckOperator, { s6: ref }));
      const chips = [...view.document.querySelectorAll("section[data-deck='6'] button.za-chip")];
      const rows = [...view.document.querySelectorAll("section[data-deck='6'] .za-law-step")];
      assert.deepEqual(
        chips.map((control) => control.getAttribute("aria-pressed")),
        ["true", "false", "false", "false"],
      );
      assert.deepEqual(
        rows.map((control) => control.getAttribute("aria-pressed")),
        ["true", "false", "false", "false"],
      );
      await view.click(chips[2]);
      assert.deepEqual(
        chips.map((control) => control.getAttribute("aria-pressed")),
        ["false", "false", "true", "false"],
      );
      assert.deepEqual(
        rows.map((control) => control.getAttribute("aria-pressed")),
        ["false", "false", "true", "false"],
      );
    } finally {
      await view.cleanup();
    }
  });
});

test("CommandHeader craft pips expose exactly one current craft and update it on click", async () => {
  function HeaderHarness() {
    const [craftIndex, setCraftIndex] = useState(0);
    return createElement(CommandHeader, {
      audio: false,
      clock: "0000.000",
      craftIndex,
      arrivedDeck: 0,
      hudClassName: "",
      onNavigateCraft: setCraftIndex,
      onOpenNavigator: () => {},
      onToggleAudio: () => {},
      tour: false,
    });
  }

  const view = mount(createElement(HeaderHarness));
  try {
    await view.render(createElement(HeaderHarness));
    const pips = [...view.document.querySelectorAll('button[aria-label^="Warp to"]')];
    assert.equal(pips.filter((pip) => pip.getAttribute("aria-current") === "true").length, 1);
    assert.equal(pips[0].getAttribute("aria-current"), "true");
    await view.click(pips[4]);
    assert.equal(pips.filter((pip) => pip.getAttribute("aria-current") === "true").length, 1);
    assert.equal(pips[4].getAttribute("aria-current"), "true");
  } finally {
    await view.cleanup();
  }
});

test("E.V.E. status keeps routing counts on the separate 21 August 2026 inventory", () => {
  const lines = runEve("status").out;
  assert.ok(lines.includes("ROUTING INVENTORY 21 AUGUST 2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG ENTRIES"));
  assert.equal(
    lines.some((line) => /31 AUG(?:UST)? 2026.*10 PUBLIC/i.test(line)),
    false,
  );
});

test("fleet evidence keeps quorum at the verified cluster aggregate instead of assigning it per host", () => {
  for (const line of [...BOOT, ...TELEMETRY, ...runEve("fleet").out]) {
    assert.doesNotMatch(line, /^(?:ZEUS|APOLLO).*QUORAT|QUORUM ZEUS/i);
  }
  assert.ok(runEve("status").out.includes("2 PROXMOX HOSTS ONLINE · CLUSTER QUORATE"));
});

test("BlackBoxReceipt renders only the exact dated claim set beneath its exact heading", async () => {
  const view = mount(createElement(BlackBoxReceipt));
  try {
    await view.render(createElement(BlackBoxReceipt));
    const receipt = view.document.querySelector('[aria-labelledby="black-box-receipt-heading"]');
    assert.ok(receipt, "expected Black Box Receipt region");
    assert.equal(receipt.querySelector("h3")?.textContent, "BLACK BOX RECEIPT");
    assert.deepEqual(
      [...receipt.querySelectorAll("li.za-receipt-claim")].map((claim) => claim.textContent),
      [
        "08-31-2026 · 18/19 DOCUMENTED GUESTS RUNNING AT PROBE",
        "08-31-2026 · 2 PROXMOX HOSTS QUORATE",
        "08-21-2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG",
      ],
    );
  } finally {
    await view.cleanup();
  }
});

test("the ship's log keeps every superseded deck reachable without republishing its figures", async () => {
  const view = mount(createElement(BlackBoxReceipt));
  try {
    await view.render(createElement(BlackBoxReceipt));
    const receipt = view.document.querySelector('[aria-labelledby="black-box-receipt-heading"]');
    assert.ok(receipt, "expected Black Box Receipt region");
    const links = [...receipt.querySelectorAll("a")].map((anchor) => anchor.getAttribute("href"));
    for (const archive of ["/grid.html", "/index-v44.html", "/command.html"]) {
      assert.ok(links.includes(archive), `ship's log must link the preserved ${archive} marker`);
    }
    const log = receipt.textContent;
    assert.match(log, /SHIP'S LOG/);
    assert.doesNotMatch(log, /19\s*(?:\/|of)\s*19/i, "a superseded fleet figure must never ride along in the log");
    assert.doesNotMatch(log, /08-10-2026/, "a withdrawn export date must never ride along in the log");
  } finally {
    await view.cleanup();
  }
});

test("E.V.E. log recites the canonical release line with its preserved archives", () => {
  const lines = runEve("log").out;
  assert.match(lines[0], /SHIP'S LOG/);
  assert.match(lines[1], /V36 "GREEN BOARD" · THIS DECK · REVISED 08-31-2026/);
  assert.ok(
    lines.some((line) => line.includes("/grid.html")),
    "the log must point at the preserved V31 marker",
  );
  assert.ok(
    lines.some((line) => line.includes("/command.html")),
    "the log must point at the preserved May 2026 archive",
  );
  assert.equal(runEve("shipslog").out.join("\n"), lines.join("\n"), "shipslog must alias log");
  for (const line of lines) {
    assert.doesNotMatch(line, /19\s*\/\s*19/, "the log must never republish a superseded figure");
  }
});

test("FlightControl starts, stops, and restarts through real buttons", async () => {
  let starts = 0;
  let stops = 0;
  const props = (active, elapsedMs) => ({ active, elapsedMs, onStart: () => starts++, onStop: () => stops++ });
  const view = mount(createElement(FlightControl, props(false, 0)));
  try {
    await view.render(createElement(FlightControl, props(false, 0)));
    await view.click(button(view.document, "RUN THE 30-SECOND FLIGHT"));
    assert.equal(starts, 1);

    await view.render(createElement(FlightControl, props(true, 15_000)));
    assert.equal(view.document.querySelector('[aria-current="step"]')?.textContent, "03 · BUILD PROOF");
    assert.match(view.document.body.textContent, /FLIGHT ACTIVE · BEAT 03 \/ 04/);
    await view.click(button(view.document, "STOP FLIGHT"));
    assert.equal(stops, 1);

    await view.render(createElement(FlightControl, props(false, 30_000)));
    await view.click(button(view.document, "RUN THE 30-SECOND FLIGHT"));
    assert.equal(starts, 2);
  } finally {
    await view.cleanup();
  }
});

test("FlightControl keeps every active status readout at the critical telemetry size", async () => {
  const view = mount(
    createElement(FlightControl, { active: true, elapsedMs: 15_000, onStart: () => {}, onStop: () => {} }),
  );
  try {
    await view.render(
      createElement(FlightControl, { active: true, elapsedMs: 15_000, onStart: () => {}, onStop: () => {} }),
    );
    const progress = [...view.document.querySelectorAll('ol[aria-label="Flight progress"] li')];
    const readouts = [
      view.document.querySelector('p[aria-live="polite"]'),
      ...progress,
      [...view.document.querySelectorAll("p")].find((element) => element.textContent?.startsWith("NOW ·")),
    ];

    assert.equal(progress.length, 4, "expected the four canonical flight beats");
    for (const readout of readouts) {
      assert.ok(readout, "expected every active flight status readout");
      assert.equal(
        readout.classList.contains("za-critical-telemetry"),
        true,
        `${readout.textContent} must use the responsive 10px desktop / 11px mobile telemetry treatment`,
      );
    }
  } finally {
    await view.cleanup();
  }
});

test("compact FlightControl fits the collapsed rail while retaining full names and behavior", async () => {
  let starts = 0;
  let stops = 0;
  const view = mount(
    createElement(FlightControl, {
      active: false,
      compact: true,
      elapsedMs: 0,
      onStart: () => starts++,
      onStop: () => stops++,
    }),
  );
  try {
    await view.render(
      createElement(FlightControl, {
        active: false,
        compact: true,
        elapsedMs: 0,
        onStart: () => starts++,
        onStop: () => stops++,
      }),
    );
    const start = button(view.document, "30S");
    assert.equal(start.getAttribute("aria-label"), "Run the 30-second flight");
    assert.equal(start.classList.contains("w-[52px]"), true);
    await view.click(start);
    assert.equal(starts, 1);

    await view.render(
      createElement(FlightControl, {
        active: true,
        compact: true,
        elapsedMs: 15_000,
        onStart: () => starts++,
        onStop: () => stops++,
      }),
    );
    const stop = button(view.document, "30S");
    assert.equal(stop.getAttribute("aria-label"), "Stop the 30-second flight");
    await view.click(stop);
    assert.equal(stops, 1);
  } finally {
    await view.cleanup();
  }
});

test("FlightControl exposes the canonical current beat at each handoff", async () => {
  const view = mount(createElement(FlightControl, { active: true, elapsedMs: 0, onStart: () => {}, onStop: () => {} }));
  try {
    for (const [elapsedMs, expected] of [
      [0, "01 · THESIS"],
      [7_500, "02 · ROUTING LAW"],
      [15_000, "03 · BUILD PROOF"],
      [22_500, "04 · E.V.E. / CONTACT"],
    ]) {
      await view.render(createElement(FlightControl, { active: true, elapsedMs, onStart: () => {}, onStop: () => {} }));
      assert.equal(view.document.querySelector('[aria-current="step"]')?.textContent, expected);
    }
  } finally {
    await view.cleanup();
  }
});

test("BlackBoxReceipt waits for a click and prefers the canonical share URL", async () => {
  const shared = [];
  let copied = 0;
  const view = mount(createElement(BlackBoxReceipt));
  try {
    setBrowserApis({ share: async (payload) => shared.push(payload), writeText: async () => copied++ });
    await view.render(createElement(BlackBoxReceipt));
    assert.equal(shared.length, 0);
    assert.equal(copied, 0);
    await view.click(button(view.document, "COPY / SHARE LINK"));
    assert.deepEqual(shared, [
      { title: "Cashio.us Black Box Receipt", url: "https://cashio.us/?campaign=flight#deck=contact" },
    ]);
    assert.equal(copied, 0);
    assert.equal(view.document.querySelector('[role="status"]')?.textContent, "Receipt link shared.");
  } finally {
    await view.cleanup();
  }
});

test("BlackBoxReceipt treats an aborted share as cancellation without copying", async () => {
  let copied = 0;
  const view = mount(createElement(BlackBoxReceipt));
  try {
    setBrowserApis({
      share: async () => {
        throw new DOMException("cancelled", "AbortError");
      },
      writeText: async () => copied++,
    });
    await view.render(createElement(BlackBoxReceipt));
    await view.click(button(view.document, "COPY / SHARE LINK"));
    assert.equal(copied, 0);
    assert.equal(view.document.querySelector('[role="status"]')?.textContent, "Share cancelled.");
  } finally {
    await view.cleanup();
  }
});

test("BlackBoxReceipt copies after a non-cancellation share failure", async () => {
  const copied = [];
  const view = mount(createElement(BlackBoxReceipt));
  try {
    setBrowserApis({
      share: async () => {
        throw new Error("share unavailable");
      },
      writeText: async (url) => copied.push(url),
    });
    await view.render(createElement(BlackBoxReceipt));
    await view.click(button(view.document, "COPY / SHARE LINK"));
    assert.deepEqual(copied, ["https://cashio.us/?campaign=flight#deck=contact"]);
    assert.equal(view.document.querySelector('[role="status"]')?.textContent, "Receipt link copied.");
  } finally {
    await view.cleanup();
  }
});

test("BlackBoxReceipt keeps its control and explains unavailable or rejected clipboard access", async (t) => {
  await t.test("unavailable", async () => {
    const view = mount(createElement(BlackBoxReceipt));
    try {
      setBrowserApis({ share: undefined, writeText: undefined });
      await view.render(createElement(BlackBoxReceipt));
      const control = button(view.document, "COPY / SHARE LINK");
      await view.click(control);
      assert.equal(control.disabled, false);
      assert.equal(
        view.document.querySelector('[role="status"]')?.textContent,
        "Copy is unavailable in this browser. Select the address bar to copy the receipt link.",
      );
    } finally {
      await view.cleanup();
    }
  });

  await t.test("rejected", async () => {
    const view = mount(createElement(BlackBoxReceipt));
    try {
      setBrowserApis({
        share: undefined,
        writeText: async () => {
          throw new Error("clipboard denied");
        },
      });
      await view.render(createElement(BlackBoxReceipt));
      const control = button(view.document, "COPY / SHARE LINK");
      await view.click(control);
      assert.equal(control.disabled, false);
      assert.equal(
        view.document.querySelector('[role="status"]')?.textContent,
        "Unable to copy the receipt link. Select the address bar to copy it.",
      );
    } finally {
      await view.cleanup();
    }
  });
});
