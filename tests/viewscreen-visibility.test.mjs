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

test("an active stage settles its warp frame when reduced motion is enabled", async () => {
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

  const frames = new Map();
  let nextFrame = 1;
  class FakeHTMLElement {
    constructor() {
      this.style = {};
    }

    attachShadow() {
      return { appendChild() {}, innerHTML: "" };
    }
  }

  setGlobal("HTMLElement", FakeHTMLElement);
  setGlobal("document", {
    hidden: false,
    createElement: () => ({}),
    addEventListener() {},
    removeEventListener() {},
  });
  let motionReduced = false;
  setGlobal("matchMedia", () => ({ matches: motionReduced }));
  setGlobal("innerWidth", 1440);
  setGlobal("innerHeight", 900);
  setGlobal("devicePixelRatio", 1);
  setGlobal("addEventListener", () => {});
  setGlobal("removeEventListener", () => {});
  setGlobal("requestAnimationFrame", (callback) => {
    const id = nextFrame++;
    frames.set(id, callback);
    return id;
  });
  setGlobal("cancelAnimationFrame", (id) => frames.delete(id));

  try {
    const { ViewscreenStage } = await import("../src/lib/viewscreen-stage.js");
    class ProbeStage extends ViewscreenStage {
      _initGL() {}
      _resize() {}
      _frame() {}
    }
    const stage = new ProbeStage();
    stage.connectedCallback();
    stage.warpT = 1;
    assert.equal(frames.size, 1, "the active stage must own one motion frame");

    stage.setReducedMotion(true);
    assert.equal(stage.warpT, 0, "reduced motion must clear an owned stage warp");
    assert.equal(frames.size, 0, "reduced motion must cancel the active stage frame loop");

    stage.setReducedMotion(false);
    assert.equal(frames.size, 1, "disabling reduced motion must resume the owned stage frame loop");

    stage.dispose();
    assert.equal(frames.size, 0);
    motionReduced = true;
    const initiallyReducedStage = new ProbeStage();
    initiallyReducedStage.connectedCallback();
    assert.equal(frames.size, 0, "an initially reduced stage must not schedule a motion frame");

    initiallyReducedStage.setReducedMotion(false);
    assert.equal(frames.size, 1, "an initially reduced stage must start its frame loop when the preference changes");
    initiallyReducedStage.dispose();
  } finally {
    restoreGlobals();
  }
});

test("an active stage resumes after reduced motion is disabled while hidden", async () => {
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
  const frames = new Map();
  let nextFrame = 1;
  let initializations = 0;

  class FakeHTMLElement {
    constructor() {
      this.style = {};
    }

    attachShadow() {
      return { appendChild() {}, innerHTML: "" };
    }
  }

  const fakeDocument = {
    hidden: false,
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
  setGlobal("addEventListener", () => {});
  setGlobal("removeEventListener", () => {});
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
      _frame() {}
    }

    const stage = new ProbeStage();
    stage.connectedCallback();
    assert.equal(initializations, 1);
    assert.equal(frames.size, 1, "the active stage must begin with one scheduled frame");

    stage.setReducedMotion(true);
    assert.equal(frames.size, 0, "reduced motion must cancel the active frame");

    fakeDocument.hidden = true;
    documentListeners.get("visibilitychange")?.();
    stage.setReducedMotion(false);
    assert.equal(frames.size, 0, "disabling reduced motion while hidden must defer frame work");

    fakeDocument.hidden = false;
    documentListeners.get("visibilitychange")?.();
    assert.equal(initializations, 1, "restoring visibility must not reinitialize the stage");
    assert.equal(frames.size, 1, "restoring visibility must resume the stage frame loop");

    documentListeners.get("visibilitychange")?.();
    assert.equal(frames.size, 1, "repeated visibility events must not schedule duplicate frames");

    stage.dispose();
  } finally {
    restoreGlobals();
  }
});
