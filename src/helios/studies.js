import { gsap } from "gsap";
import { $, $$, press } from "./dom.js";
import { FLEET } from "./fleet.js";
import { PROJECTS, routeExample as sharedRoute } from "../odyssey/data";
import { STUDY_NOTES } from "../odyssey/study-notes";
import { defaultExperiment, shareExperiment } from "../odyssey/study-experiment";
import { mountInstrument } from "./instruments.js";

export function routeExample(intent, priv, src) {
  const r = sharedRoute({ intent, privateData: priv, sources: src });
  return { ...r, color: r.code === "HOLD" ? "var(--gold)" : "var(--cyan)" };
}

export function setupStudies({ scenes, motion, copy }) {
  const studyState = new Map(PROJECTS.map((p) => [p.id, defaultExperiment(p.id)]));
  const outcomes = {
    hermes: "Private information stops an automatic handoff.",
    cascade: "Uncertainty changes the next action.",
    exposure: "Check access and importance before escalating.",
    briefing: "Unknowns belong in the brief.",
    dashboards: "At 24 hours, this example asks for a fresh check.",
    signal: "Corroboration changes what happens next.",
    graphify: "A change to Policy reaches three other modules.",
  };
  const STUDIES = PROJECTS.map((p, i) => {
    const n = STUDY_NOTES[p.id];
    return {
      id: p.id,
      n: String(i + 1).padStart(2, "0"),
      name: p.title,
      cat: p.category,
      sub: p.subtitle,
      cue: p.cue,
      take: outcomes[p.id],
      takebody: n.relevance,
      q: n.question,
      rule: n.rule,
      tr: n.experiment,
      bound: n.boundary,
      source: n.source,
      sourceLabel: n.sourceLabel,
      nextq: STUDY_NOTES[PROJECTS[(i + 1) % 7].id].question,
    };
  });
  const GLYPHS = [
    "M12 2l3 7h7l-5.5 4.5 2 7.5L12 16.5 5.5 21l2-7.5L2 9h7z",
    "M4 4h16v16H4zM4 12h16M12 4v16",
    "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 5v4l3 3",
    "M5 4h14v16H5zM8 9h8M8 13h6",
    "M4 6h16M4 12h16M4 18h10",
    "M3 17l5-6 4 4 5-8 4 5",
    "M6 6h4v4H6zM14 6h4v4h-4zM6 14h4v4H6zM14 14h4v4h-4zM10 8h4M8 10v4M16 10v4M10 16h4",
  ];
  const st = { i: 0, intent: "draft", priv: false, src: false };
  function renderStudies() {
    const list = $("#studies-list");
    list.innerHTML = STUDIES.map(
      (s, i) =>
        `<button class="study" type="button" role="tab" id="study-${s.id}" aria-controls="instrument" tabindex="${i === st.i ? 0 : -1}" data-study="${i}" aria-selected="${i === st.i}"><span class="study-index">${s.n} / 07</span><strong class="study-title">${s.name}</strong><span class="study-purpose">${s.sub}</span><svg class="glyph" viewBox="-5 -5 34 34" fill="none" stroke="currentColor" stroke-width=".8" aria-hidden="true"><circle cx="12" cy="12" r="15" stroke-dasharray="2 3"/><circle cx="12" cy="12" r="12.5" stroke-width=".3"/><path d="${GLYPHS[i]}"/></svg></button>`,
    ).join("");
    list.addEventListener("click", (e) => {
      const b = e.target.closest("[data-study]");
      if (!b) return;
      selectStudy(+b.dataset.study);
    });
  }
  function selectStudy(i, updateUrl = true) {
    st.i = i;
    const s = STUDIES[i];
    $("#instrument").setAttribute("aria-labelledby", "study-" + s.id);
    $("#hermes-controls").hidden = i !== 0;
    $("#st-trace").hidden = i !== 0;
    $("#secondary-instrument").hidden = i === 0;
    $(".ring-progress").style.display = i === 0 ? "" : "none";
    $("#study-source").href = i === 3 || i === 4 ? "/v38/status.json" : s.source;
    $("#study-source").textContent = s.sourceLabel + " ↗";
    if (i > 0)
      mountInstrument($("#secondary-instrument"), studyState.get(s.id), FLEET, (next) => {
        studyState.set(s.id, next);
        history.replaceState(null, "", shareExperiment(next));
      });
    if (updateUrl) history.replaceState(null, "", shareExperiment(studyState.get(s.id)));
    $$("#studies-list [data-study]").forEach((b) => {
      const on = +b.dataset.study === i;
      b.setAttribute("aria-selected", on);
      b.tabIndex = on ? 0 : -1;
    });
    const studyStrip = $("#studies-list");
    const activeStudy = $("#study-" + s.id);
    if (studyStrip.scrollWidth > studyStrip.clientWidth) {
      const stripBox = studyStrip.getBoundingClientRect();
      const tabBox = activeStudy.getBoundingClientRect();
      if (tabBox.left < stripBox.left || tabBox.right > stripBox.right)
        studyStrip.scrollTo({ left: studyStrip.scrollLeft + tabBox.left - stripBox.left - 6, behavior: "instant" });
    }
    $("#st-n").textContent = s.n;
    $("#st-name").textContent = s.name;
    $("#st-sub").textContent = s.sub;
    $("#st-cue").textContent = s.cue;
    $("#st-take").textContent = s.take;
    $("#st-takebody").textContent = s.takebody;
    $("#st-q").textContent = s.q;
    $("#st-rule").textContent = s.rule;
    $("#st-try").textContent = s.tr;
    $("#st-bound").textContent = s.bound;
    const nx = STUDIES[(i + 1) % 7];
    $("#st-nextname").textContent = nx.name;
    $("#st-nextq").textContent = s.nextq;
    if (motion())
      gsap.fromTo(
        "#instrument > *:not(.ring-progress)",
        { y: 8 },
        { y: 0, duration: 0.3, stagger: 0.05, ease: "expo.out", overwrite: true },
      );
  }
  let routeCounterTween;
  function renderRoute(run) {
    routeCounterTween?.kill();
    const r = routeExample(st.intent, st.priv, st.src);
    const experiment = { study: "hermes", intent: st.intent, privateData: st.priv, sources: st.src };
    studyState.set("hermes", experiment);
    scenes.updateRequest(experiment);
    if (location.hash.startsWith("#build=hermes")) history.replaceState(null, "", shareExperiment(experiment));
    $("#st-lane").textContent = r.lane;
    $("#st-lane").style.color = r.color;
    $("#st-code").textContent = r.code;
    $("#st-code").style.color = r.color;
    $("#st-detail").textContent = run ? r.detail : "Choose a task, then follow its five-step route.";
    const box = $("#st-steps");
    gsap.killTweensOf(Array.from(box.children));
    box.innerHTML = r.steps
      .map(
        (t, i) =>
          `<div class="step" data-step><span class="mono" style="font-size:var(--text-label);color:var(--gold);width:22px">0${i + 1}</span><span class="dot" style="background:${r.code === "HOLD" ? "var(--gold)" : "var(--cyan)"};box-shadow:0 0 12px ${r.code === "HOLD" ? "var(--gold)" : "var(--cyan)"}"></span><span style="font-size:14px">${t}</span></div>`,
      )
      .join("");
    const fg = $("#ringfg"),
      tx = $("#ringtxt");
    if (run) {
      const steps = $$("[data-step]", box);
      if (motion()) {
        gsap.set(steps, { opacity: 0.25, x: -8 });
        gsap.to(steps, {
          opacity: 1,
          x: 0,
          duration: 0.45,
          stagger: 0.28,
          ease: "expo.out",
        });
        let k = { v: 0 };
        routeCounterTween = gsap.to(k, {
          v: 5,
          duration: 1.6,
          ease: "none",
          onUpdate: () => {
            const n = Math.round(k.v);
            fg.style.strokeDashoffset = 226 - 226 * (n / 5);
            tx.textContent = `0${n}/05`;
          },
        });
      } else {
        fg.style.strokeDashoffset = 0;
        tx.textContent = "05/05";
      }
    } else {
      fg.style.strokeDashoffset = 226;
      tx.textContent = "00/05";
    }
  }
  $("#intent-group").addEventListener("click", (e) => {
    const b = e.target.closest("[data-intent]");
    if (!b) return;
    st.intent = b.dataset.intent;
    press($("#intent-group"), "data-intent", st.intent);
    renderRoute(false);
  });
  $("#tg-private").addEventListener("click", (e) => {
    st.priv = !st.priv;
    e.currentTarget.setAttribute("aria-pressed", st.priv);
    renderRoute(false);
  });
  $("#tg-sources").addEventListener("click", (e) => {
    st.src = !st.src;
    e.currentTarget.setAttribute("aria-pressed", st.src);
    renderRoute(false);
  });
  $("#route-btn").addEventListener("click", () => renderRoute(true));
  $("#st-next").addEventListener("click", () => selectStudy((st.i + 1) % 7));
  $("#copy-settings").addEventListener("click", () => {
    const ex =
      st.i === 0
        ? { study: "hermes", intent: st.intent, privateData: st.priv, sources: st.src }
        : studyState.get(STUDIES[st.i].id);
    copy(location.origin + location.pathname + shareExperiment(ex), "Your experiment link is copied");
  });
  $$("[data-load]").forEach((a) =>
    a.addEventListener("click", () => {
      const priv = a.dataset.load === "private";
      st.intent = "analyze";
      st.src = true;
      st.priv = priv;
      press($("#intent-group"), "data-intent", "analyze");
      $("#tg-sources").setAttribute("aria-pressed", "true");
      $("#tg-private").setAttribute("aria-pressed", String(priv));
      selectStudy(0);
      renderRoute(false);
      setTimeout(() => $("#route-btn").focus(), 600);
    }),
  );
  renderStudies();
  renderRoute(false);
  $("#studies-list").addEventListener("keydown", (e) => {
    const keys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? 6 : (st.i + (["ArrowRight", "ArrowDown"].includes(e.key) ? 1 : 6)) % 7;
    selectStudy(next);
    $("#study-" + STUDIES[next].id).focus();
  });

  function loadRequest({ intent = st.intent, privateData = st.priv, sources = st.src } = {}, trace = false) {
    st.intent = intent;
    st.priv = privateData;
    st.src = sources;
    press($("#intent-group"), "data-intent", st.intent);
    $("#tg-private").setAttribute("aria-pressed", st.priv);
    $("#tg-sources").setAttribute("aria-pressed", st.src);
    renderRoute(false);
    if (trace) scenes.traceRequest();
  }

  function selectExperiment(experiment) {
    const index = PROJECTS.findIndex((project) => project.id === experiment.study);
    studyState.set(experiment.study, experiment);
    selectStudy(index, false);
    if (experiment.study === "hermes") loadRequest(experiment);
  }
  return {
    studies: STUDIES,
    selectExperiment,
    loadRequest,
    getRequest: () => ({ intent: st.intent, privateData: st.priv, sources: st.src }),
  };
}
