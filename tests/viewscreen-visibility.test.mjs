import assert from "node:assert/strict";
import test from "node:test";

test("a stage mounted in a hidden tab defers WebGL and frames until the tab is visible", async () => {
  const previousGlobals = new Map();
  const setGlobal = (name, value) => {
    previousGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, value, writable: true });
  };
  const restoreGlobals = () => {
    for (const [name, descriptor] of previousGlobals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  };

  const documentListeners = new Map();
  const windowListeners = new Map();
  const frames = new Map();
  let nextFrame = 1;
  let initializations = 0;
  let renders = 0;

  class FakeHTMLElement {
    constructor() {
      this.style = {};
    }

    attachShadow() {
      return { appendChild() {}, innerHTML: "" };
    }
  }

  const fakeDocument = {
    hidden: true,
    createElement: () => ({}),
    addEventListener(type, listener) {
      documentListeners.set(type, listener);
    },
    removeEventListener(type, listener) {
      if (documentListeners.get(type) === listener) documentListeners.delete(type);
    },
  };

  setGlobal("HTMLElement", FakeHTMLElement);
  setGlobal("document", fakeDocument);
  setGlobal("matchMedia", () => ({ matches: false }));
  setGlobal("innerWidth", 1440);
  setGlobal("innerHeight", 900);
  setGlobal("devicePixelRatio", 1);
  setGlobal("addEventListener", (type, listener) => windowListeners.set(type, listener));
  setGlobal("removeEventListener", (type, listener) => {
    if (windowListeners.get(type) === listener) windowListeners.delete(type);
  });
  setGlobal("requestAnimationFrame", (callback) => {
    const id = nextFrame++;
    frames.set(id, callback);
    return id;
  });
  setGlobal("cancelAnimationFrame", (id) => frames.delete(id));

  try {
    const { ViewscreenStage } = await import("../src/lib/viewscreen-stage.js");
    class ProbeStage extends ViewscreenStage {
      _initGL() {
        initializations += 1;
      }

      _resize() {}

      _frame() {
        renders += 1;
      }
    }

    const stage = new ProbeStage();
    stage.connectedCallback();

    assert.equal(stage.paused, true, "the current hidden state must be captured during mount");
    assert.equal(initializations, 0, "a hidden fallback mount must not initialize WebGL");
    assert.equal(frames.size, 0, "a hidden fallback mount must not queue animation work");

    fakeDocument.hidden = false;
    documentListeners.get("visibilitychange")?.();

    assert.equal(stage.paused, false);
    assert.equal(initializations, 1, "becoming visible must initialize the deferred stage exactly once");
    assert.equal(frames.size, 1, "becoming visible must start the stage frame loop");

    const [[frameId, frame]] = frames;
    frames.delete(frameId);
    frame(100);
    assert.equal(renders, 1, "the resumed stage must render its first visible frame");

    stage.disconnectedCallback();
  } finally {
    restoreGlobals();
  }
});
