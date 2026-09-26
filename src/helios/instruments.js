import { escalationExample, exposureExample, GRAPH_NODES, GRAPH_EDGES, affectedModules } from "../odyssey/data";
import { defaultExperiment } from "../odyssey/study-experiment";

// Sliders are named by their label alone and speak their value with its unit.
const spoken = (value, unit) => `${value} ${unit === " h" ? "hours" : "percent"}`;
const range = (key, label, value, max = 100, unit = "%") =>
  `<label class="lab-range" for="lab-${key}"><span>${label}<output id="value-${key}" for="lab-${key}">${value}${unit}</output></span><input id="lab-${key}" data-key="${key}" type="range" min="0" max="${max}" value="${value}" aria-label="${label}" aria-valuetext="${spoken(value, unit)}" aria-describedby="st-bound"><span class="range-ends" aria-hidden="true"><span>0${unit}</span><span>${max}${unit}</span></span></label>`;
const toggle = (key, label, checked) =>
  `<label class="lab-switch"><span>${label}</span><input data-key="${key}" type="checkbox" ${checked ? "checked" : ""}><span class="switch-track" aria-hidden="true"></span></label>`;
const result = (tag, title, body, color = "cyan") =>
  `<div class="lab-result ${color}"><span class="kick">${tag}</span><h4>${title}</h4><p>${body}</p></div>`;

/** Every control updates the same tested teaching model described by the adjoining note. */
export function mountInstrument(root, initial, fleet, onChange) {
  root.innerHTML = `<div class="lab-visual" aria-hidden="true"></div><div class="lab-controls"></div><div class="lab-answer" role="status" aria-live="polite" aria-atomic="true"></div><div class="lab-footer"><span>Illustration · stays in this browser</span><button type="button" class="text-action" data-reset>Reset example ↺</button></div>`;
  let state = { ...initial };
  let composed = false;
  let controls = "";
  if (state.study === "cascade")
    controls =
      range("severity", "Consequence", state.severity) +
      range("confidence", "Confidence in the evidence", state.confidence);
  if (state.study === "exposure")
    controls =
      toggle("reachable", "Reachable from the assessed network", state.reachable) +
      toggle("auth", "Authentication was observed", state.auth) +
      toggle("critical", "Critical to the example operation", state.critical);
  if (state.study === "briefing")
    controls = `<fieldset class="brief-sources"><legend>Choose the records to include</legend>${[
      ["fleet", "Dated fleet observation"],
      ["routing", "Unverified routing inventory"],
      ["authority", "Human decision boundary"],
    ]
      .map(
        ([id, label]) =>
          `<label><input data-fact="${id}" type="checkbox" ${state.chosen.includes(id) ? "checked" : ""}>${label}</label>`,
      )
      .join("")}</fieldset><button class="btn gold" type="button" data-compose>Compose the brief</button>`;
  if (state.study === "dashboards") controls = range("age", "Age of an example observation", state.age, 48, " h");
  if (state.study === "signal")
    controls =
      range("deviation", "Deviation from the example baseline", state.deviation) +
      toggle("corroborated", "A second observation supports the signal", state.corroborated);
  if (state.study === "graphify")
    controls = `<div class="graph-key"><span><i class="dot" style="background:var(--gold)"></i>Selected</span><span><i class="dot" style="background:var(--cyan)"></i>Affected</span><span><i class="dot" style="background:var(--muted)"></i>Unchanged</span></div><p class="lab-caption">An arrow means “depends on”. Select a module.</p>`;
  root.querySelector(".lab-controls").innerHTML = controls;
  const visual = root.querySelector(".lab-visual");
  const answer = root.querySelector(".lab-answer");

  function paint() {
    if (state.study === "cascade") {
      const next = escalationExample(state.severity, state.confidence);
      visual.innerHTML = `<div class="cascade-track">${["Bounded check", "Gather evidence", "Human decision"].map((label, index) => `<div class="cascade-node ${index === next.level ? "chosen" : ""}"><span>0${index + 1}</span><i></i><strong>${label}</strong></div>`).join("")}</div>`;
      answer.innerHTML = result("THE NEXT ACTION", next.title, next.body, next.level === 2 ? "gold" : "cyan");
    }
    if (state.study === "exposure") {
      const next = exposureExample(state.reachable, state.auth, state.critical);
      visual.innerHTML = `<div class="exposure-path"><span class="${state.reachable ? "lit" : ""}">Network<br><b>${state.reachable ? "Reachable" : "Not observed"}</b></span><i>→</i><span class="${state.auth ? "lit" : "attention"}">Boundary<br><b>${state.auth ? "Auth observed" : "Auth unobserved"}</b></span><i>→</i><span class="${state.critical ? "attention" : ""}">Asset<br><b>${state.critical ? "Critical" : "Routine"}</b></span></div>`;
      answer.innerHTML = result(
        "TRIAGE, BEFORE A VERDICT",
        next.level,
        next.body,
        next.level === "Investigate first" ? "gold" : "cyan",
      );
    }
    if (state.study === "briefing") {
      visual.innerHTML = `<div class="evidence-beams">${[
        ["fleet", "Observation"],
        ["routing", "Unknown"],
        ["authority", "Human"],
      ]
        .map(
          ([id, label]) =>
            `<div class="${state.chosen.includes(id) ? "chosen" : ""}"><i></i><span>${label}</span></div>`,
        )
        .join("")}</div>`;
      root.querySelector("[data-compose]").disabled = state.chosen.length === 0;
      const facts = {
        fleet: {
          title: "The observation",
          body: `${fleet.lxc} containers and ${fleet.qemu} virtual machine were running at the ${fleet.observedLong} observation. Guest runtime alone does not establish service health or recovery.`,
          source: `Dated export · ${fleet.observedLong}`,
        },
        routing: {
          title: "The unknown",
          body: "Current routing counts and end to end route execution remain unverified. An older inventory cannot establish the present state.",
          source: "Latest public evidence · routing withheld",
        },
        authority: {
          title: "The boundary",
          body: "Consequential decisions remain with an accountable person. The example does not authorize changes to a real system.",
          source: "Published operating philosophy",
        },
      };
      answer.innerHTML = composed
        ? `<div class="brief-output"><span class="kick gold">YOUR DECISION BRIEF</span>${state.chosen.map((id) => `<article><h4>${facts[id].title}</h4><p>${facts[id].body}</p><small>${facts[id].source}</small></article>`).join("")}<p class="brief-next"><strong>Next decision</strong><br>Verify the evidence needed for the proposed action before expanding automation.</p></div>`
        : result(
            "ASSEMBLE A BRIEF",
            "Keep the unknowns visible.",
            "Choose your records, then compose. The brief preserves each source and its limits.",
          );
    }
    if (state.study === "dashboards") {
      const stale = state.age >= 24;
      visual.innerHTML = `<div class="age-clock ${stale ? "attention" : ""}" style="--age:${Math.min(1, state.age / 48) * 360}deg"><span>${state.age}<small>example hours</small></span></div><div class="clock-boundary">Review boundary <strong>24 hours</strong></div>`;
      answer.innerHTML = result(
        "SAME OBSERVATION · DIFFERENT REVIEW STATE",
        stale ? "Refresh required" : "Within the example window",
        `The recorded count stays ${fleet.lxc}. ${stale ? "The hypothetical 24-hour boundary has been reached. Ask for a new observation before relying on its current state." : "The hypothetical clock is inside its 24-hour review window. It does not renew the real export."}`,
        stale ? "gold" : "cyan",
      );
    }
    if (state.study === "signal") {
      const crossed = state.deviation >= 30;
      const title = !crossed
        ? "Continue observation"
        : state.corroborated
          ? "Operator review"
          : "Corroborate the signal";
      const body = !crossed
        ? "The example reading stays below the review threshold. Preserve its context and continue observing."
        : state.corroborated
          ? "A second observation supports the exception. Give the accountable person the evidence and a decision to make."
          : "One reading does not establish its cause. Seek a second observation before proposing a consequential response.";
      const points = Array.from(
        { length: 90 },
        (_, i) => `${i * 5},${70 - Math.sin(i * 0.25) * 13 - (i > 45 ? state.deviation * 0.36 : 0)}`,
      ).join(" ");
      visual.innerHTML = `<svg viewBox="0 0 445 115" class="signal-wave"><path d="M0 70H445 M0 30H445 M0 110H445" stroke="rgba(154,169,191,.2)"/><polyline points="${points}" fill="none" stroke="${crossed ? "#F2C87A" : "#38E1FF"}" stroke-width="2.5"/>${state.corroborated ? `<polyline points="${points}" fill="none" stroke="#38E1FF" stroke-width="1.5" transform="translate(0 12)"/>` : ""}<text x="8" y="18">SYNTHETIC SIGNAL / ${state.deviation}% DEVIATION</text></svg>`;
      answer.innerHTML = result("THE NEXT ACTION", title, body, crossed && state.corroborated ? "gold" : "cyan");
    }
    if (state.study === "graphify") {
      visual.setAttribute("aria-hidden", "false");
      const affected = affectedModules(state.selected);
      const positions = Object.fromEntries(GRAPH_NODES.map((n) => [n.id, n]));
      // Buttons remain mounted while the result changes, preserving keyboard focus.
      if (!visual.querySelector(".dependency-map")) {
        visual.innerHTML = `<div class="dependency-map"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="dependency-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerUnits="userSpaceOnUse" markerWidth="2.2" markerHeight="3" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#B6D1DE"/></marker></defs>${GRAPH_EDGES.map(([from, to]) => `<path data-edge="${from}:${to}" d="M${positions[from].x} ${positions[from].y}L${(positions[from].x + positions[to].x) / 2} ${(positions[from].y + positions[to].y) / 2}L${positions[to].x} ${positions[to].y}" vector-effect="non-scaling-stroke"/>`).join("")}</svg>${GRAPH_NODES.map((node) => `<button type="button" data-module="${node.id}" style="--x:${node.x}%;--y:${node.y}%">${node.label}<span></span></button>`).join("")}</div>`;
      }
      visual.querySelectorAll("[data-module]").forEach((button) => {
        const id = button.dataset.module;
        button.setAttribute("aria-pressed", String(id === state.selected));
        button.classList.toggle("affected", affected.includes(id));
        button.querySelector("span").textContent =
          id === state.selected ? "Selected" : affected.includes(id) ? "Affected" : "Unchanged";
      });
      visual.querySelectorAll("[data-edge]").forEach((line) => {
        const [from, to] = line.dataset.edge.split(":");
        line.classList.toggle("affected", affected.includes(from) && (to === state.selected || affected.includes(to)));
      });
      const names = affected.map((id) => positions[id].label);
      answer.innerHTML = result(
        "THE REVIEW SCOPE",
        `${affected.length} ${affected.length === 1 ? "module" : "modules"} affected`,
        affected.length
          ? `${names.join(", ")} depend directly or indirectly on ${positions[state.selected].label}. Their behavior belongs in the review.`
          : `No other module in this example depends on ${positions[state.selected].label}. Its own dependencies still deserve review.`,
        "gold",
      );
    }
  }
  function update() {
    composed = false;
    onChange({ ...state });
    paint();
  }
  root.oninput = (event) => {
    const input = event.target;
    if (input.dataset.key) {
      state[input.dataset.key] = input.type === "checkbox" ? input.checked : Number(input.value);
      const output = root.querySelector(`#value-${input.dataset.key}`);
      const unit = input.dataset.key === "age" ? " h" : "%";
      if (output) output.textContent = `${input.value}${unit}`;
      if (input.type === "range") input.setAttribute("aria-valuetext", spoken(input.value, unit));
      update();
    }
    if (input.dataset.fact) {
      state.chosen = [...root.querySelectorAll("[data-fact]:checked")].map((el) => el.dataset.fact);
      update();
    }
  };
  root.onclick = (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.module) {
      state.selected = button.dataset.module;
      update();
    }
    if (button.hasAttribute("data-compose")) {
      composed = true;
      paint();
    }
    if (button.hasAttribute("data-reset")) {
      const reset = defaultExperiment(state.study);
      onChange(reset);
      mountInstrument(root, reset, fleet, onChange);
      root.querySelector("input,button")?.focus();
    }
  };
  paint();
}
