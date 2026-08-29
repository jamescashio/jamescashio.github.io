import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";

import { BlackBoxReceipt } from "../src/components/black-box-receipt.tsx";
import { DeckBrief, DeckSnapshot } from "../src/components/decks.tsx";
import { runEve } from "../src/components/eve-console.tsx";
import { FlightControl } from "../src/components/flight-control.tsx";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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
    assert.match(view.document.body.textContent, /18\/19 AT 28 AUG PROBE/);
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

test("E.V.E. status keeps routing counts on the separate 21 August 2026 inventory", () => {
  const lines = runEve("status").out;
  assert.ok(lines.includes("ROUTING INVENTORY 21 AUGUST 2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG ENTRIES"));
  assert.equal(
    lines.some((line) => /28 AUG(?:UST)? 2026.*10 PUBLIC/i.test(line)),
    false,
  );
});

test("BlackBoxReceipt renders only the exact dated claim set beneath its exact heading", async () => {
  const view = mount(createElement(BlackBoxReceipt));
  try {
    await view.render(createElement(BlackBoxReceipt));
    const receipt = view.document.querySelector('[aria-labelledby="black-box-receipt-heading"]');
    assert.ok(receipt, "expected Black Box Receipt region");
    assert.equal(receipt.querySelector("h3")?.textContent, "BLACK BOX RECEIPT");
    assert.deepEqual(
      [...receipt.querySelectorAll("li")].map((claim) => claim.textContent),
      [
        "08-21-2026 · 19/19 PUBLISHED CONTAINERS RUNNING AT PROBE",
        "08-21-2026 · 2 PROXMOX HOSTS QUORATE",
        "08-21-2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG",
      ],
    );
  } finally {
    await view.cleanup();
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
