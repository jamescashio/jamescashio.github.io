import assert from "node:assert/strict";
import test from "node:test";

/**
 * The procedural textures run before anything is drawn, inside the try block
 * that guards WebGL setup. A throw here is swallowed as "WebGL unavailable"
 * and the stage silently falls back to a blank background, so these functions
 * need a test that actually calls them rather than one that reads the source.
 */

function makeContext2d() {
  const calls = [];
  const record = (name) => () => {
    calls.push(name);
    return undefined;
  };
  const gradient = { addColorStop: record("addColorStop") };
  return {
    calls,
    canvas: null,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    filter: "none",
    font: "",
    save: record("save"),
    restore: record("restore"),
    scale: record("scale"),
    translate: record("translate"),
    rotate: record("rotate"),
    beginPath: record("beginPath"),
    closePath: record("closePath"),
    moveTo: record("moveTo"),
    lineTo: record("lineTo"),
    arc: record("arc"),
    ellipse: record("ellipse"),
    arcTo: record("arcTo"),
    quadraticCurveTo: record("quadraticCurveTo"),
    bezierCurveTo: record("bezierCurveTo"),
    clip: record("clip"),
    setTransform: record("setTransform"),
    transform: record("transform"),
    createPattern: () => null,
    rect: record("rect"),
    fill: record("fill"),
    stroke: record("stroke"),
    fillRect: record("fillRect"),
    strokeRect: record("strokeRect"),
    clearRect: record("clearRect"),
    fillText: record("fillText"),
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    getImageData: (x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) }),
    putImageData: record("putImageData"),
    drawImage: record("drawImage"),
  };
}

function withFakeCanvas(run) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
  const contexts = [];
  const fakeDocument = {
    createElement: () => {
      const context = makeContext2d();
      contexts.push(context);
      const canvas = {
        width: 0,
        height: 0,
        getContext: (kind) => (kind === "2d" ? context : null),
      };
      context.canvas = canvas;
      return canvas;
    },
  };
  Object.defineProperty(globalThis, "document", { configurable: true, value: fakeDocument, writable: true });
  try {
    return run(contexts);
  } finally {
    if (previous) Object.defineProperty(globalThis, "document", previous);
    else delete globalThis.document;
  }
}

test("every procedural texture builds without recursing or throwing", async () => {
  const textures = await import("../src/lib/stage/textures.ts");
  const builders = ["panelTexture", "normalTexture", "glintTexture", "gasTexture", "ringsTexture", "anaTexture"];

  withFakeCanvas((contexts) => {
    for (const name of builders) {
      assert.equal(typeof textures[name], "function", `${name} must be exported`);
      const result = textures[name]();
      assert.ok(result, `${name} must return a texture`);
      assert.equal(result.isTexture, true, `${name} must return a THREE texture`);
    }
    assert.ok(contexts.length >= builders.length, "each texture must take its own 2D context");
    assert.ok(
      contexts.every((context) => context.calls.length > 0),
      "each texture must actually draw something",
    );
  });
});

test("a canvas with no 2D context fails loudly rather than recursing", async () => {
  const textures = await import("../src/lib/stage/textures.ts");
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    writable: true,
    value: { createElement: () => ({ width: 0, height: 0, getContext: () => null }) },
  });
  try {
    assert.throws(() => textures.panelTexture(), /2D canvas context unavailable/);
  } finally {
    if (previous) Object.defineProperty(globalThis, "document", previous);
    else delete globalThis.document;
  }
});
