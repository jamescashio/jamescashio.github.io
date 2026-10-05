/* Local demonstrations inside the original V40 experiment panels. No network calls. */
(() => {
  "use strict";
  const keys = ["hermes", "cascade", "exposure", "briefing", "dashboards", "signal", "graphify"];
  const defaults = {
    cascade: { confidence: 85, consequence: false },
    exposure: { public: true, exploited: false, impact: "limited" },
    briefing: {
      observed: "Example: a backup was restored on a second machine and its files were verified.",
      source: "Example backup receipt · 10-03-2026",
      unknown: "Recovery of the running system was not tested.",
      owner: "The human operator",
    },
    dashboards: { age: 3, window: 7 },
    signal: { count: 2, independent: false, primary: false },
    graphify: { node: "scheduler" },
  };
  const initialState = (name) => Object.assign(Object.create(null), defaults[name]);
  const states = new Map(Object.keys(defaults).map((name) => [name, initialState(name)]));
  const range = (key, label, min, max) =>
    `<label for="lab-${key}">${label} <output id="lab-${key}-value"></output></label><input id="lab-${key}" data-field="${key}" type="range" min="${min}" max="${max}">`;
  const toggle = (key, label) =>
    `<label class="lab-toggle"><input data-field="${key}" type="checkbox"><span>${label}</span></label>`;
  const select = (key, label, options) =>
    `<label for="lab-${key}">${label}</label><select id="lab-${key}" data-field="${key}">${options.map(([v, t]) => `<option value="${v}">${t}</option>`).join("")}</select>`;
  const field = (key, label, multiline = false) =>
    `<label for="lab-${key}">${label}</label>${multiline ? `<textarea id="lab-${key}" data-field="${key}" maxlength="3000" rows="3"></textarea>` : `<input id="lab-${key}" data-field="${key}" maxlength="1000" type="text">`}`;
  const specs = {
    cascade: {
      controls:
        range("confidence", "Illustrative confidence", 0, 100) +
        toggle("consequence", "The action would be difficult to undo"),
      boundary:
        "Toy rule: pause below 80% confidence, or when an action is difficult to undo. This is an illustrative threshold, not a deployed policy or calibrated certainty.",
      try: "Try 95% confidence, then make the action difficult to undo.",
    },
    exposure: {
      controls:
        toggle("public", "Reachable from the internet") +
        toggle("exploited", "Evidence of active exploitation") +
        select("impact", "Potential impact", [
          ["limited", "Limited disruption"],
          ["high", "Significant service or data impact"],
        ]),
      boundary:
        "A simplified prioritization exercise. Real triage needs validated context and a responsible owner; this does not assess your systems.",
      try: "Compare internet reachability alone with reported active exploitation.",
    },
    briefing: {
      controls:
        field("observed", "What did you observe?", true) +
        field("source", "Source and observation date") +
        field("unknown", "What remains unknown?", true) +
        field("owner", "Who decides the next step?"),
      boundary:
        "Your writing stays in this tab until you copy or download it. This tool formats your words; it does not verify their claims.",
      try: "Keep the observation, its source, and its limits together.",
    },
    dashboards: {
      controls:
        range("age", "Observation age", 0, 60) +
        select("window", "Chosen review window", [
          [1, "1 day"],
          [7, "7 days"],
          [30, "30 days"],
        ]),
      boundary: "The review window is hypothetical. Freshness alone does not prove correctness or application health.",
      try: "Move the observation just beyond your chosen review window.",
    },
    signal: {
      controls:
        range("count", "Reports you have", 1, 5) +
        toggle("independent", "The reports come from independent sources") +
        toggle("primary", "At least one points to inspectable primary evidence"),
      boundary:
        "Toy rule: two independent reports plus primary evidence qualify for closer review. They do not automatically prove a claim.",
      try: "Five copies of one story still leave the question open.",
    },
    graphify: {
      controls:
        select("node", "Choose an unavailable component", [
          ["scheduler", "Job scheduler"],
          ["storage", "Shared storage"],
          ["model", "Local model"],
        ]) + '<ul class="lab-path" aria-label="Illustrative downstream effects"></ul>',
      boundary:
        "An invented dependency graph for exploring an idea. This is not the lab’s live topology or an outage prediction.",
      try: "Compare a scheduler interruption with a shared-storage interruption.",
    },
  };
  let host, key;
  function announce(message) {
    if (host) host.querySelector(".lab-feedback").textContent = message;
  }
  function values() {
    const s = states.get(key);
    host.querySelectorAll("[data-field]").forEach((el) => {
      const f = el.dataset.field;
      if (!Object.hasOwn(defaults[key], f)) return;
      s[f] =
        el.type === "checkbox"
          ? el.checked
          : el.type === "range" || (key === "dashboards" && f === "window")
            ? Number(el.value)
            : el.value;
    });
    return s;
  }
  function showResult(code, title, text, held = false) {
    const box = host.querySelector(".lab-result");
    box.hidden = false;
    box.classList.toggle("lab-held", held);
    box.querySelector(".lab-code").textContent = code;
    box.querySelector("h4").textContent = title;
    box.querySelector(".lab-reason").textContent = text;
  }
  function briefText() {
    const s = states.get("briefing"),
      v = (f) => s[f].trim() || "Not specified";
    return `DECISION BRIEF / cAshIo V40\n\nWHAT WAS OBSERVED\n${v("observed")}\n\nSOURCE AND DATE\n${v("source")}\n\nWHAT REMAINS UNKNOWN\n${v("unknown")}\n\nWHO DECIDES\n${v("owner")}\n\nPrepared locally. Claims have not been independently verified by this tool.\n`;
  }
  function update() {
    if (!host) return;
    const s = values();
    host
      .querySelectorAll('input[type="range"]')
      .forEach(
        (el) =>
          (host.querySelector("#" + el.id + "-value").textContent =
            el.value + (key === "cascade" ? "%" : key === "dashboards" ? " days" : "")),
      );
    if (key === "cascade") {
      const held = s.consequence || s.confidence < 80;
      showResult(
        held ? "PAUSE FOR REVIEW" : "ILLUSTRATIVE THRESHOLD MET",
        held ? "Bring in a person." : "Continue within the toy rule.",
        s.consequence
          ? "A difficult-to-undo action takes priority over confidence. The person keeps the decision."
          : s.confidence < 80
            ? "The input is below the illustrative threshold. Pause and review."
            : "The threshold is met and the action is reversible. Human authority still applies.",
        held,
      );
    }
    if (key === "exposure") {
      const urgent = s.exploited || (s.public && s.impact === "high");
      showResult(
        urgent ? "HIGHER PRIORITY IN THIS MODEL" : "CONTEXT STILL MATTERS",
        urgent
          ? "Review this first."
          : s.public || s.impact === "high"
            ? "Investigate next."
            : "Keep it in the review queue.",
        s.exploited
          ? "Validate the reported active exploitation with the responsible owner before selecting a response."
          : s.public && s.impact === "high"
            ? "Internet reachability and significant impact combine in this simplified priority rule."
            : "Collect the missing context, validate the exposure, and assign an owner.",
        urgent,
      );
    }
    if (key === "dashboards") {
      const old = s.age > s.window;
      showResult(
        old ? "HISTORICAL WITHIN THIS MODEL" : "RECENT WITHIN THIS MODEL",
        old ? "Time to refresh the record." : "Inside the chosen window.",
        `${s.age} day${s.age === 1 ? "" : "s"} old against a ${s.window}-day review window. ${old ? "Keep the old record as history and seek a new observation." : "Still check what the observation actually proves."}`,
        old,
      );
    }
    if (key === "signal") {
      const enough = s.count >= 2 && s.independent && s.primary;
      showResult(
        enough ? "CORROBORATION RULE MET" : "MORE EVIDENCE NEEDED",
        enough ? "Ready for closer review." : "Keep the question open.",
        enough
          ? "Inspect quality, timing and contradictions. The rule is a starting point for judgment."
          : s.count < 2
            ? "One report is a starting point. Seek another independent source."
            : !s.independent
              ? "Repeated versions of the same story do not become independent evidence."
              : "Find inspectable primary evidence before treating the reports as corroboration.",
        !enough,
      );
    }
    if (key === "graphify") {
      const sets = {
          scheduler: ["Scheduled jobs", "Daily brief"],
          storage: ["Backups", "Local model", "Scheduled jobs", "Daily brief"],
          model: ["Local model", "Daily brief"],
        },
        affected = sets[s.node];
      const list = host.querySelector(".lab-path");
      list.replaceChildren();
      for (const name of ["Backups", "Local model", "Scheduled jobs", "Daily brief"]) {
        const li = document.createElement("li");
        const active = affected.includes(name);
        li.classList.toggle("affected", active);
        const mark = document.createElement("span");
        mark.textContent = active ? "↳" : "✓";
        mark.setAttribute("aria-hidden", "true");
        const text = document.createElement("span");
        text.textContent = (active ? "Affected: " : "Outside this path: ") + name;
        li.append(mark, text);
        list.append(li);
      }
      showResult(
        "ILLUSTRATIVE DEPENDENCY GRAPH",
        `${affected.length} dependent functions in this model.`,
        s.node === "storage"
          ? "Shared dependencies can spread an interruption across several functions."
          : "Follow downstream connections before assuming the effect stops at the first component.",
      );
    }
    if (key === "briefing") {
      host.querySelector(".lab-result").hidden = true;
      const result = host.querySelector(".lab-brief");
      if (!result.hidden) result.textContent = briefText();
    }
  }
  function applyState() {
    host.querySelectorAll("[data-field]").forEach((el) => {
      if (!Object.hasOwn(defaults[key], el.dataset.field)) return;
      const v = states.get(key)[el.dataset.field];
      if (el.type === "checkbox") el.checked = !!v;
      else el.value = v;
    });
    update();
  }
  function mount() {
    const next = document.querySelector("#local-experiment");
    if (!next || next.closest("x-dc")) return;
    const nextKey = next.dataset.lab;
    if (!Object.hasOwn(specs, nextKey) || (next === host && key === nextKey)) return;
    host = next;
    key = nextKey;
    const spec = specs[key];
    host.innerHTML = `<div class="lab-heading"><span class="lab-kicker">RUN IT HERE</span><span class="lab-local">● Local demonstration</span></div><p class="lab-try"></p><div class="lab-controls">${spec.controls}</div><div class="lab-result" role="status" aria-live="polite"><span class="lab-code"></span><h4></h4><p class="lab-reason"></p></div>${key === "briefing" ? '<div class="lab-actions"><button type="button" class="lab-primary" data-lab-action="brief">Build my brief →</button><button type="button" data-lab-action="copy">Copy brief</button><button type="button" data-lab-action="download">Download .txt ↓</button></div><pre class="lab-brief" tabindex="0" aria-label="Your decision brief" hidden></pre>' : '<div class="lab-actions"><button type="button" data-lab-action="link">Copy scenario link</button></div>'}<p class="lab-boundary"></p><p class="lab-feedback" role="status" aria-live="polite"></p><button type="button" class="lab-reset" data-lab-action="reset">Reset this example</button>`;
    host.querySelector(".lab-try").textContent = spec.try;
    host.querySelector(".lab-boundary").textContent = spec.boundary;
    applyState();
  }
  async function copy(text, message) {
    try {
      await navigator.clipboard.writeText(text);
      announce(message);
    } catch (_) {
      announce(
        "Copy is unavailable in this browser. " +
          (key === "briefing" ? "Use Download .txt instead." : "Your choices remain visible above."),
      );
    }
  }
  function makeLink() {
    const params = new URLSearchParams({ experiment: key });
    for (const [k, v] of Object.entries(states.get(key))) params.set(k, String(v));
    return location.href.split("#")[0] + "#" + params.toString();
  }
  function restore() {
    const params = new URLSearchParams(location.hash.slice(1));
    const k = params.get("experiment"),
      idx = keys.indexOf(k),
      app = window.cashioV40;
    if (idx < 0 || !app) return;
    if (states.has(k) && k !== "briefing")
      for (const [f, v] of Object.entries(defaults[k])) {
        const x = params.get(f);
        if (x === null) continue;
        if (typeof v === "boolean") states.get(k)[f] = x === "true";
        else if (typeof v === "number") {
          const ranges = { confidence: [0, 100], age: [0, 60], count: [1, 5] };
          const n = Number(x);
          if (Number.isFinite(n)) {
            if (f === "window") {
              if ([1, 7, 30].includes(n)) states.get(k)[f] = n;
            } else states.get(k)[f] = Math.round(Math.min(ranges[f][1], Math.max(ranges[f][0], n)));
          }
        } else if (
          (f === "impact" && ["limited", "high"].includes(x)) ||
          (f === "node" && ["scheduler", "storage", "model"].includes(x))
        )
          states.get(k)[f] = x;
      }
    const restored = { exp: idx };
    if (k === "hermes") {
      const intent = params.get("intent");
      if (["draft", "research", "analyze"].includes(intent)) restored.intent = intent;
      for (const [param, field] of [
        ["private", "priv"],
        ["sources", "sources"],
      ]) {
        const v = params.get(param);
        if (["true", "false", "1", "0"].includes(v)) restored[field] = v === "true" || v === "1";
      }
      restored.routed = null;
    }
    app.setState(restored);
    requestAnimationFrame(async () => {
      mount();
      if (host && key === k) applyState();
      await document.fonts.ready;
      document.getElementById("studies")?.scrollIntoView({ behavior: "instant", block: "start" });
    });
  }
  document.addEventListener("input", (e) => {
    if (e.target.closest("#local-experiment")) update();
  });
  document.addEventListener("change", (e) => {
    if (e.target.closest("#local-experiment")) update();
  });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-lab-action]");
    if (!b || !host) return;
    values();
    if (b.dataset.labAction === "reset") {
      states.set(key, initialState(key));
      applyState();
      if (key === "briefing") host.querySelector(".lab-brief").hidden = true;
      announce("Example reset.");
    }
    if (b.dataset.labAction === "brief") {
      const pre = host.querySelector(".lab-brief");
      pre.textContent = briefText();
      pre.hidden = false;
      pre.focus();
      announce("Brief prepared locally.");
    }
    if (b.dataset.labAction === "copy") copy(briefText(), "Brief copied.");
    if (b.dataset.labAction === "link") copy(makeLink(), "Scenario link copied.");
    if (b.dataset.labAction === "download") {
      const blob = new Blob([briefText()], { type: "text/plain;charset=utf-8" }),
        url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = "Cashio-decision-brief.txt";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      announce("Text file prepared for download.");
    }
  });
  new MutationObserver(mount).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-lab"],
  });
  window.addEventListener("cashio-ready", () => {
    mount();
    restore();
  });
  window.addEventListener("hashchange", restore);
})();
