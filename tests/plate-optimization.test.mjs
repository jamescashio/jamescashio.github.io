import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";

import { DeckContact, DeckIron, DeckOperator, DeckSnapshot } from "../src/components/decks.tsx";
import { Plate } from "../src/components/deck-primitives.tsx";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const asset = (path) => new URL(`../${path}`, import.meta.url);

function imageDimensions(buffer, extension) {
  if (extension === "avif") {
    const ispe = buffer.indexOf(Buffer.from("ispe"));
    assert.ok(ispe >= 0, "AVIF must contain an image spatial extents box");
    return { width: buffer.readUInt32BE(ispe + 8), height: buffer.readUInt32BE(ispe + 12) };
  }

  assert.equal(buffer.toString("ascii", 0, 4), "RIFF");
  assert.equal(buffer.toString("ascii", 8, 12), "WEBP");
  const codec = buffer.toString("ascii", 12, 16);
  if (codec === "VP8 ") {
    assert.equal(buffer.toString("hex", 23, 26), "9d012a", "WebP must contain a VP8 frame header");
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (codec === "VP8X") {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }
  assert.equal(codec, "VP8L", `unsupported WebP codec ${codec}`);
  assert.equal(buffer[20], 0x2f, "WebP lossless data must contain its signature byte");
  return {
    width: 1 + (((buffer[22] & 0x3f) << 8) | buffer[21]),
    height: 1 + (((buffer[24] & 0x0f) << 10) | (buffer[23] << 2) | (buffer[22] >> 6)),
  };
}

function staticDocument(ui, url = "https://cashio.us/#deck=snapshot") {
  return new JSDOM(`<!doctype html><body>${renderToStaticMarkup(ui)}</body>`, { url }).window.document;
}

function inlineJpeg(src) {
  const match = src?.match(/^data:image\/jpeg;base64,(.+)$/);
  assert.ok(match, "plate preview must be an inline JPEG");
  const buffer = Buffer.from(match[1], "base64");
  assert.equal(buffer[0], 0xff);
  assert.equal(buffer[1], 0xd8);
  let offset = 2;
  while (offset < buffer.length - 8) {
    while (buffer[offset] === 0xff) offset++;
    const marker = buffer[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    const length = buffer.readUInt16BE(offset);
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      return {
        buffer,
        width: buffer.readUInt16BE(offset + 5),
        height: buffer.readUInt16BE(offset + 3),
      };
    }
    offset += length;
  }
  assert.fail("inline JPEG must expose intrinsic dimensions");
}

test("Snapshot marks every decision-carrying fleet value and date as critical telemetry", () => {
  const ref = { current: null };
  const document = staticDocument(
    createElement(DeckSnapshot, {
      s0: ref,
      copyCol: ref,
      onEngage: () => {},
      onEve: () => {},
    }),
  );
  const fleetSummary = [...document.querySelectorAll("p")].find((node) =>
    node.textContent?.startsWith("MEASURED 28 AUGUST 2026"),
  );
  assert.ok(fleetSummary, "Snapshot must retain its dated fleet summary");
  assert.ok(fleetSummary.classList.contains("za-critical-telemetry"));

  const evidenceCards = [...document.querySelectorAll(".za-panel")];
  assert.equal(evidenceCards.length, 5, "Snapshot must retain its five evidence cards");
  for (const card of evidenceCards) {
    const detail = card.querySelector(".za-mono");
    assert.ok(
      detail?.classList.contains("za-critical-telemetry"),
      `${card.textContent} must remain readable telemetry`,
    );
  }
});

const plateContracts = [
  {
    name: "rack",
    ui: (ref) => createElement(DeckIron, { s3: ref }),
    fallback: "/plates/rack.jpg?v=48",
    width: 1680,
    height: 1120,
    previewWidth: 48,
    previewHeight: 32,
  },
  {
    name: "operator",
    ui: (ref) => createElement(DeckOperator, { s6: ref }),
    fallback: "/plates/operator.jpg?v=48",
    width: 1680,
    height: 1120,
    previewWidth: 48,
    previewHeight: 32,
  },
  {
    name: "fold",
    ui: (ref) => createElement(DeckContact, { s8: ref, onCopy: () => {}, copyEmailState: "idle" }),
    fallback: "/plates/fold.jpg?v=48",
    width: 1680,
    height: 945,
    previewWidth: 48,
    previewHeight: 27,
  },
];

test("Rack, Operator, and Contact render sized responsive formats behind near-view discovery", () => {
  for (const contract of plateContracts) {
    const document = staticDocument(contract.ui({ current: null }));
    const image = document.querySelector(`img[data-src="${contract.fallback}"]`);
    assert.ok(image, `${contract.name} must defer its JPEG fallback until near view`);
    assert.equal(image.getAttribute("width"), String(contract.width));
    assert.equal(image.getAttribute("height"), String(contract.height));
    assert.equal(image.getAttribute("loading"), "lazy");
    assert.equal(image.getAttribute("decoding"), "async");
    assert.equal(image.getAttribute("fetchpriority"), "low");
    const preview = inlineJpeg(image.getAttribute("src"));
    assert.deepEqual(
      { width: preview.width, height: preview.height },
      { width: contract.previewWidth, height: contract.previewHeight },
      `${contract.name} preview must preserve the source composition`,
    );
    assert.ok(preview.buffer.length <= 1_400, `${contract.name} preview must remain an extremely small inline asset`);

    const picture = image.closest("picture");
    assert.ok(
      picture.style.backgroundImage.includes(image.getAttribute("src")),
      `${contract.name} must keep its real preview behind the slow full-resolution decode`,
    );
    assert.equal(picture.style.backgroundSize, "cover");
    assert.equal(picture.style.backgroundPosition, "center");

    const sources = [...picture.querySelectorAll(":scope > source")].map((source) => ({
      type: source.getAttribute("type"),
      srcset: source.getAttribute("data-srcset"),
      activeSrcset: source.getAttribute("srcset"),
      sizes: source.getAttribute("sizes"),
    }));
    assert.deepEqual(sources, [
      {
        type: "image/avif",
        srcset: `/plates/${contract.name}-mobile.avif 768w, /plates/${contract.name}-desktop.avif 1440w`,
        activeSrcset: null,
        sizes: "(min-width: 1024px) 50vw, 100vw",
      },
      {
        type: "image/webp",
        srcset: `/plates/${contract.name}-mobile.webp 768w, /plates/${contract.name}-desktop.webp 1440w`,
        activeSrcset: null,
        sizes: "(min-width: 1024px) 50vw, 100vw",
      },
    ]);
  }
});

test("direct Contact rendering keeps the real fold composition opaque while the full image is unavailable", () => {
  const ref = { current: null };
  const document = staticDocument(
    createElement(
      "div",
      null,
      createElement("img", { className: "za-stage-poster", src: "/plates/command.jpg", alt: "" }),
      createElement(DeckContact, { s8: ref, onCopy: () => {}, copyEmailState: "idle" }),
    ),
    "https://cashio.us/#deck=contact",
  );
  assert.equal(document.location.hash, "#deck=contact");
  assert.equal(document.querySelector(".za-stage-poster")?.getAttribute("src"), "/plates/command.jpg");

  const image = document.querySelector('img[data-src="/plates/fold.jpg?v=48"]');
  assert.ok(image, "Contact must withhold its remote fold candidate during the slow-image state");
  const preview = inlineJpeg(image.getAttribute("src"));
  assert.deepEqual({ width: preview.width, height: preview.height }, { width: 48, height: 27 });
  const picture = image.closest("picture");
  assert.ok(picture.style.backgroundImage.includes(image.getAttribute("src")));
  assert.equal(picture.style.backgroundSize, "cover");
  assert.equal(picture.style.backgroundPosition, "center");
});

test("a deferred plate exposes no remote candidate until its near-view observer intersects", async () => {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: "https://cashio.us/#deck=snapshot",
  });
  const priorWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const priorDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const observations = [];
  let callback;
  let disconnected = false;
  class IntersectionObserver {
    constructor(nextCallback, options) {
      callback = nextCallback;
      assert.equal(options.rootMargin, "640px 0px");
    }
    observe(node) {
      observations.push(node);
    }
    disconnect() {
      disconnected = true;
    }
  }
  Object.defineProperty(dom.window, "IntersectionObserver", { configurable: true, value: IntersectionObserver });
  Object.defineProperties(globalThis, {
    window: { configurable: true, writable: true, value: dom.window },
    document: { configurable: true, writable: true, value: dom.window.document },
  });
  const root = createRoot(dom.window.document.getElementById("root"));
  const previewSrc =
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABAf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=";

  try {
    await act(async () =>
      root.render(
        createElement(Plate, {
          src: "/plates/rack.jpg?v=48",
          alt: "Deferred rack",
          width: 1680,
          height: 1120,
          deferUntilNear: true,
          placeholderSrc: previewSrc,
          sources: [
            {
              type: "image/avif",
              srcSet: "/plates/rack-mobile.avif 768w, /plates/rack-desktop.avif 1440w",
              sizes: "(min-width: 1024px) 50vw, 100vw",
            },
          ],
        }),
      ),
    );
    const image = dom.window.document.querySelector("img");
    const source = dom.window.document.querySelector("source");
    assert.equal(observations.length, 1);
    assert.equal(image.getAttribute("data-src"), "/plates/rack.jpg?v=48");
    assert.equal(source.getAttribute("srcset"), null);
    assert.equal(image.getAttribute("fetchpriority"), "low");
    assert.ok(image.closest("picture").style.backgroundImage.includes(previewSrc));

    await act(async () => callback([{ isIntersecting: false }]));
    assert.equal(image.getAttribute("data-src"), "/plates/rack.jpg?v=48");

    await act(async () => callback([{ isIntersecting: true }]));
    assert.equal(image.getAttribute("src"), "/plates/rack.jpg?v=48");
    assert.equal(image.getAttribute("data-src"), null);
    assert.equal(image.getAttribute("fetchpriority"), null);
    assert.equal(source.getAttribute("srcset"), "/plates/rack-mobile.avif 768w, /plates/rack-desktop.avif 1440w");
    assert.ok(
      image.closest("picture").style.backgroundImage.includes(previewSrc),
      "the opaque preview must remain under a slow full-resolution decode",
    );
    assert.equal(disconnected, true);
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    if (priorWindow) Object.defineProperty(globalThis, "window", priorWindow);
    else delete globalThis.window;
    if (priorDocument) Object.defineProperty(globalThis, "document", priorDocument);
    else delete globalThis.document;
  }
});

test("the responsive supporting plates preserve aspect ratio inside strict byte budgets", async () => {
  const expected = [
    ["rack-desktop", "avif", 1440, 960, 90_000],
    ["rack-desktop", "webp", 1440, 960, 130_000],
    ["rack-mobile", "avif", 768, 512, 35_000],
    ["rack-mobile", "webp", 768, 512, 55_000],
    ["operator-desktop", "avif", 1440, 960, 80_000],
    ["operator-desktop", "webp", 1440, 960, 120_000],
    ["operator-mobile", "avif", 768, 512, 30_000],
    ["operator-mobile", "webp", 768, 512, 50_000],
    ["fold-desktop", "avif", 1440, 810, 120_000],
    ["fold-desktop", "webp", 1440, 810, 180_000],
    ["fold-mobile", "avif", 768, 432, 45_000],
    ["fold-mobile", "webp", 768, 432, 70_000],
  ];
  let combinedBytes = 0;
  for (const [name, extension, width, height, cap] of expected) {
    const path = `public/plates/${name}.${extension}`;
    const [buffer, metadata] = await Promise.all([readFile(asset(path)), stat(asset(path))]);
    assert.deepEqual(imageDimensions(buffer, extension), { width, height }, `${path} dimensions`);
    assert.ok(metadata.size <= cap, `${path} must be at most ${cap} bytes; received ${metadata.size}`);
    combinedBytes += metadata.size;
  }
  assert.ok(combinedBytes <= 610_000, `supporting responsive plates received ${combinedBytes} bytes`);
});

test("the V34 acceptance contract caps initial transfer at 300 KB", async () => {
  assert.match(
    await read("design.md"),
    /initial (?:page )?transfer(?: weight)? is at most 300 KB\./i,
    "the measurable initial-transfer cap must remain release-blocking",
  );
});
