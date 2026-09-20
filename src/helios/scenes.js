import { createAtlasTrace } from "./atlas-trace.js";

/* Three illustrative instruments, one visibility/motion contract. No network requests are sent by the models. */
const SVG = "http://www.w3.org/2000/svg";
const COLORS = { local: "#38e1ff", cloud: "#f2c87a", held: "#f08a96" };
const smooth = (t) => t * t * (3 - 2 * t);

export function setupScenes({ motion }) {
  const blocked = () => !!document.querySelector("dialog[open],#helios-studio,#helios-flight");
  const atlas = document.querySelector("#atlas");
  const flow = document.querySelector("#flow-scene");
  const engine = document.querySelector("#engine");
  const visible = new Map([
    [atlas, false],
    [flow, false],
    [engine, false],
  ]);
  let enabled = motion,
    frame = 0,
    previous = 0,
    elapsed = 0,
    particles = [];
  let engineScene = null,
    engineLoading = false,
    angle = 0,
    principle = 0;

  const trace = createAtlasTrace({ isMotionEnabled: () => enabled, onSchedule: sync });

  // The 12 outcomes remain visible as a static manifest while their paths animate above.
  function renderFlow(result, state) {
    const kinds = [
      ...Array(result.local).fill("local"),
      ...Array(result.cloud).fill("cloud"),
      ...Array(result.held).fill("held"),
    ];
    flow.dataset.connected = String(state.net);
    document.querySelector("#schem-label").textContent =
      `${state.arch.toUpperCase()} · ${result.local} LOCAL · ${result.cloud} CLOUD · ${result.held} HELD`;
    document.querySelector("#relay-state").textContent = state.net ? "Connected" : "Offline";
    document
      .querySelector("#schem")
      .setAttribute(
        "aria-label",
        `Twelve illustrative requests: ${result.local} onboard, ${result.cloud} through the external relay, ${result.held} held for human review. Relay ${state.net ? "connected" : "offline"}.`,
      );
    const group = document.querySelector("#packets"),
      slots = document.querySelector("#request-slots");
    group.replaceChildren();
    slots.replaceChildren();
    const counts = { local: 0, cloud: 0, held: 0 };
    particles = kinds.map((kind, i) => {
      const node = document.createElementNS(SVG, "g");
      node.dataset.kind = kind;
      const glow = document.createElementNS(SVG, "circle"),
        dot = document.createElementNS(SVG, "path"),
        facet = document.createElementNS(SVG, "path");
      glow.setAttribute("r", "9");
      glow.setAttribute("opacity", ".16");
      glow.setAttribute("fill", COLORS[kind]);
      dot.setAttribute("d", "M-5 0 0-5 5 0 0 5Z");
      facet.setAttribute("d", "M-5 0 0-5 0 5Z");
      facet.setAttribute("fill", "#ffffff");
      facet.setAttribute("opacity", ".6");
      dot.setAttribute("fill", COLORS[kind]);
      node.append(glow, dot, facet);
      group.append(node);
      const slot = document.createElement("i");
      slot.style.setProperty("--packet-color", COLORS[kind]);
      slots.append(slot);
      return { node, kind, i, index: counts[kind]++ };
    });
    paintFlow(!enabled);
    sync();
  }
  function paintFlow(staticView = false) {
    particles.forEach(({ node, kind, i, index }) => {
      let x, y;
      if (kind === "held") {
        const a = (index / 12) * Math.PI * 2 - Math.PI / 2;
        x = 400 + Math.cos(a) * 77;
        y = 160 + Math.sin(a) * 70;
      } else if (staticView) {
        x = (kind === "local" ? 110 : 615) + (index % 6) * 15;
        y = (kind === "local" ? 281 : 205) + Math.floor(index / 6) * 13;
      } else {
        const p = (elapsed / (kind === "local" ? 5.6 : 8) + i / 12) % 1;
        const forward = p < 0.5;
        const t = smooth(forward ? p * 2 : (1 - p) * 2);
        if (kind === "local") {
          x = 225 + t * 123;
          y = 188 - t * 21 + (forward ? 0 : 13);
        } else {
          x = 455 + t * 170;
          y = 165 - t * t * 32 + (forward ? 0 : 13);
        }
      }
      node.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
    });
  }
  function run(now) {
    frame = 0;
    const delta = previous ? Math.min((now - previous) / 1000, 0.1) : 0;
    if (!previous || delta >= 1 / 30) {
      previous = now;
      elapsed += delta;
      if (visible.get(flow)) paintFlow();
      if (trace.active && visible.get(atlas)) trace.advance(delta);
    }
    if (enabled && !document.hidden && !blocked() && (visible.get(flow) || (trace.active && visible.get(atlas))))
      frame = requestAnimationFrame(run);
  }
  async function loadEngine() {
    if (engineScene || engineLoading) return;
    engineLoading = true;
    try {
      const { createEngineScene } = await import("./engine-scene.js");
      engineScene = createEngineScene(engine, { angle, principle });
      engineScene?.setActive(enabled && visible.get(engine) && !document.hidden && !blocked());
    } catch {
      /* The complete authored vector instrument remains available. */
    }
  }
  function sync() {
    const active = enabled && !document.hidden && !blocked();
    if (active && (visible.get(flow) || (trace.active && visible.get(atlas)))) {
      if (!frame) {
        previous = 0;
        frame = requestAnimationFrame(run);
      }
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
    }
    engineScene?.setActive(active && visible.get(engine));
    if (active && visible.get(engine)) void loadEngine();
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        visible.set(target, isIntersecting);
        target.dataset.sceneActive = String(isIntersecting);
      });
      sync();
    },
    { threshold: 0.05 },
  );
  [atlas, flow, engine].forEach((element) => observer.observe(element));
  window.addEventListener("helios-motion", (event) => {
    enabled = event.detail;
    if (!enabled && trace.active) trace.finish(true);
    paintFlow(!enabled);
    sync();
  });
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("pageshow", sync);
  window.addEventListener("helios-overlay", sync);
  engine.addEventListener("pointerdown", () => {
    if (enabled) void loadEngine();
  });

  return {
    renderFlow,
    flowVisible: () => visible.get(flow),
    updateRequest: trace.update,
    traceRequest: trace.start,
    selectAtlas: trace.stop,
    rotateEngine(next) {
      angle = next;
      engineScene?.setAngle(next);
    },
    selectPrinciple(next) {
      principle = next;
      engine.dataset.principle = String(next);
      engine
        .querySelectorAll("[data-ring-label]")
        .forEach((label) => label.classList.toggle("active", +label.dataset.ringLabel === next));
      engineScene?.setPrinciple(next);
    },
  };
}
