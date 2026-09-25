import { routeExample } from "../odyssey/data";
import { shareExperiment } from "../odyssey/study-experiment";

/** The illustration reads the same policy as HERMES; it never chooses a real host. */
export function describeRequest(experiment) {
  const route = routeExample(experiment);
  const held = route.code === "HOLD";
  return {
    route,
    held,
    href: shareExperiment(experiment),
    labels: held
      ? [
          "Human intent leaves the operator",
          "HERMES detects private input",
          "The external route is held",
          "The decision returns to the operator",
        ]
      : [
          "Human intent leaves the operator",
          `HERMES qualifies the ${route.lane} lane`,
          "Zeus receives the work",
          "Result returns for human review",
        ],
    nodes: held ? ["operator", "hermes", "hermes", "operator"] : ["operator", "hermes", "zeus", "operator"],
    summary: held
      ? "Privacy changed the decision. The external route is held for a person; the compute step is skipped."
      : `${route.lane} is the qualified lane. Zeus stands in for the compute step.`,
    segments: held
      ? [
          [0, 1.8, "operator", "hermes", 0],
          [1.8, 3.2, "hermes", "hermes", 1],
          [3.2, 4.8, "hermes", "hermes", 2],
          [4.8, 8, "hermes", "operator", 3],
        ]
      : [
          [0, 1.8, "operator", "hermes", 0],
          [1.8, 2.5, "hermes", "hermes", 1],
          [2.5, 4.1, "hermes", "zeus", 1],
          [4.1, 4.8, "zeus", "zeus", 2],
          [4.8, 6.2, "zeus", "hermes", 3],
          [6.2, 8, "hermes", "operator", 3],
        ],
  };
}

export function createAtlasTrace({ isMotionEnabled, onSchedule }) {
  const $ = (selector) => document.querySelector(selector);
  const atlas = $("#atlas");
  const packet = $("#packet");
  const progressBar = $("#trace-progress");
  const label = $("#trace-label");
  const nodes = [...atlas.querySelectorAll("[data-node]")];
  const steps = [...document.querySelectorAll("[data-trace-step]")];
  const positions = {};
  let request,
    key,
    trace = null;

  function layout() {
    const box = atlas.getBoundingClientRect();
    if (!box.width || !box.height) return;
    for (const node of nodes) {
      const core = node.querySelector(".core").getBoundingClientRect();
      positions[node.dataset.node] = [
        ((core.x + core.width / 2 - box.x) * 800) / box.width,
        ((core.y + core.height / 2 - box.y) * 640) / box.height,
      ];
    }
    atlas.querySelectorAll("[data-link]").forEach((wire) => {
      const [from, to] = wire.dataset.link.split(":").map((id) => positions[id]);
      wire.setAttribute("d", `M${from.join(" ")}L${to.join(" ")}`);
    });
  }
  new ResizeObserver(layout).observe(atlas);
  document.fonts.ready.then(layout);

  function clear() {
    trace = null;
    progressBar.style.transform = "scaleX(0)";
    packet.setAttribute("opacity", "0");
    nodes.forEach((node) => node.classList.remove("trace-active"));
    atlas.querySelectorAll(".tracing").forEach((wire) => wire.classList.remove("tracing"));
    steps.forEach((step) => step.removeAttribute("aria-current"));
    atlas.dataset.tracing = "false";
  }
  function finish(staticView = false) {
    clear();
    atlas.dataset.complete = "true";
    progressBar.style.transform = "scaleX(1)";
    label.textContent = staticView
      ? `${request.labels.join(" → ")}. No request was sent.`
      : `Trace complete. ${request.summary} No request was sent.`;
  }
  function update(experiment) {
    const nextKey = JSON.stringify(experiment);
    if (nextKey === key) return;
    key = nextKey;
    request = describeRequest(experiment);
    clear();
    atlas.dataset.complete = "false";
    atlas.dataset.outcome = request.held ? "held" : "qualified";
    $("#request-journey").dataset.outcome = atlas.dataset.outcome;
    $("#request-source").textContent =
      `${experiment.intent[0].toUpperCase() + experiment.intent.slice(1)} · ${experiment.sources ? "sources required" : "sources optional"}`;
    $("#request-outcome").textContent = request.route.lane;
    $("#request-decision-label").textContent = request.held ? "PRIVACY BOUNDARY" : "QUALIFIED LANE";
    $("#request-summary").textContent = request.summary;
    $("#request-continue").href = request.href;
    $("#request-continue").textContent =
      `Explore this ${request.held ? "human review decision" : request.route.lane.toLowerCase() + " route"} in HERMES`;
    $("#trace-stage-compute").textContent = request.held ? "Hold" : "Compute";
    document
      .querySelectorAll("[data-request-private]")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String((button.dataset.requestPrivate === "true") === experiment.privateData),
        ),
      );
    label.textContent = `R-01 · ${experiment.privateData ? "Private" : "Public"} input. Trace the decision, or continue with these exact settings.`;
  }
  function advance(delta) {
    if (!trace) return;
    trace.time += delta;
    progressBar.style.transform = `scaleX(${Math.min(1, trace.time / 8)})`;
    if (trace.time >= 8) return finish();
    const [start, end, from, to, stage] = request.segments.find((s) => trace.time < s[1]);
    const a = positions[from],
      b = positions[to];
    if (!a || !b) return;
    const t = (trace.time - start) / (end - start);
    const progress = t * t * (3 - 2 * t);
    packet.setAttribute(
      "transform",
      `translate(${a[0] + (b[0] - a[0]) * progress} ${a[1] + (b[1] - a[1]) * progress})`,
    );
    if (trace.stage === stage) return;
    trace.stage = stage;
    nodes.forEach((node) => node.classList.toggle("trace-active", node.dataset.node === request.nodes[stage]));
    steps.forEach((step, i) =>
      i === stage ? step.setAttribute("aria-current", "step") : step.removeAttribute("aria-current"),
    );
    atlas
      .querySelectorAll("[data-link]")
      .forEach((wire) =>
        wire.classList.toggle(
          "tracing",
          request.held
            ? wire.id === "w1"
            : stage < 2
              ? wire.id === "w1"
              : wire.id === "w2" || (stage === 3 && wire.id === "w1"),
        ),
      );
    label.textContent = request.labels[stage];
  }
  function start() {
    clear();
    layout();
    atlas.dataset.complete = "false";
    if (!isMotionEnabled()) return finish(true);
    trace = { time: 0, stage: -1 };
    atlas.dataset.tracing = "true";
    packet.setAttribute("opacity", "1");
    advance(0);
    onSchedule();
  }
  $("#trace-btn").addEventListener("click", start);
  return {
    update,
    start,
    advance,
    finish,
    get active() {
      return trace !== null;
    },
    stop() {
      if (!trace) return;
      clear();
      label.textContent = "Trace stopped. Select Trace a request to follow your decision again.";
    },
  };
}
