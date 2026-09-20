import { FLEET } from "./fleet.js";
import { setupBit } from "./bit.js";
import { gsap } from "gsap";
import { PROJECTS, routeExample as sharedRoute } from "../odyssey/data";
import { STUDY_NOTES } from "../odyssey/study-notes";
import { defaultExperiment, shareExperiment } from "../odyssey/study-experiment";
import { computeWorldOutcome } from "../odyssey/sovereign-model";
import { mountInstrument } from "./instruments.js";
import { setupNavigation } from "./navigation.js";
import { setupMotion } from "./motion.js";
import { setupScenes } from "./scenes.js";

/* =========================================================
   V38 HELIOS · shared teaching models and optional motion.
   Every instrument retains its complete behavior without WebGL.
   ========================================================= */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let motionOn = !reduced;
const hasGsap = true;
const scenes = setupScenes({ motion: motionOn });
const studyState = new Map(PROJECTS.map((p) => [p.id, defaultExperiment(p.id)]));

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  if (!msg) {
    t.style.opacity = 0;
    clearTimeout(toast.t);
    return;
  }
  t.style.opacity = 1;
  t.style.transform = "translate(-50%,0)";
  clearTimeout(toast.t);
  toast.t = setTimeout(() => {
    t.style.opacity = 0;
    t.style.transform = "translate(-50%,20px)";
  }, 1800);
}
function copy(text, msg) {
  (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
    .then(() => toast(msg || "Copied"))
    .catch(() => {
      prompt("Copy this", text);
    });
}
function press(group, attr, val) {
  $$("[" + attr + "]", group).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset[attr.slice(5)] === val)));
}

/* ---------- 0. Fleet facts: the ONLY place dated evidence lives. Update from the DSH output. ---------- */
window.FLEET = FLEET;
document.addEventListener("DOMContentLoaded", () => {
  $$("[data-fleet]").forEach((el) => {
    const v = el.dataset.fleet.split(".").reduce((o, k) => o && o[k], FLEET);
    if (v !== undefined) el.textContent = String(v);
  });
});

/* ---------- 1. HERMES routing model (deterministic teaching model) ---------- */
function routeExample(intent, priv, src) {
  const r = sharedRoute({ intent, privateData: priv, sources: src });
  return { ...r, color: r.code === "HOLD" ? "var(--gold)" : "var(--cyan)" };
}
const STUDIES = PROJECTS.map((p, i) => {
  const n = STUDY_NOTES[p.id];
  return {
    id: p.id,
    n: String(i + 1).padStart(2, "0"),
    name: p.title,
    cat: p.category,
    sub: p.subtitle,
    cue: p.cue,
    take: n.takeaway,
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
  if (hasGsap && motionOn)
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
  $("#st-detail").textContent = run
    ? r.detail
    : "Choose a task and its boundaries, then run the five-step demonstration. No request leaves this page.";
  const box = $("#st-steps");
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
    if (hasGsap && motionOn) {
      gsap.set(steps, { opacity: 0.25, x: -8 });
      gsap.to(steps, {
        opacity: 1,
        x: 0,
        duration: 0.45,
        stagger: 0.28,
        ease: "expo.out",
        onUpdate: () => {},
        onStart: () => {},
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

/* ---------- 2. Privacy test ---------- */
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
$("#request-privacy").addEventListener("click", (event) => {
  const button = event.target.closest("[data-request-private]");
  if (!button) return;
  loadRequest({ privateData: button.dataset.requestPrivate === "true" }, true);
});
$("#pv-trace").addEventListener("click", () =>
  loadRequest({ intent: "analyze", privateData: true, sources: true }, true),
);
$("#st-trace").addEventListener("click", () => scenes.traceRequest());
const pv = { pick: null };
$$("[data-pv]").forEach((b) =>
  b.addEventListener("click", () => {
    pv.pick = b.dataset.pv;
    $$("[data-pv]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  }),
);
$("#pv-reveal").addEventListener("click", () => {
  loadRequest({ intent: "analyze", privateData: true, sources: true });
  $("#pv-trace").hidden = false;
  $("#pv-answer").textContent = "Human review";
  const res = $("#pv-result");
  res.hidden = false;
  $("#pv-text").innerHTML =
    `<strong>${pv.pick === "human" ? "Correct." : pv.pick === "keep" ? "Not this time." : "Revealed."}</strong> Private input always holds the external route for human review. Your prediction: ${pv.pick === "human" ? "Human review" : pv.pick === "keep" ? "Keep Research" : "none yet"}.`;
  if (hasGsap && motionOn) gsap.from(res, { y: 10, opacity: 0, duration: 0.5, ease: "expo.out" });
});

/* ---------- 3. Sovereign world model (twelve request illustration) ---------- */
const w = { arch: "hybrid", sens: "mixed", net: true, permit: false };
let lastWorld = null;
function world(arch, sens, net, permit) {
  const r = computeWorldOutcome({ architecture: arch, sensitivity: sens, connected: net, allowPrivateEgress: permit });
  return { ...r, data: r.dataHandling, netd: r.internetDependency };
}
function renderWorld() {
  const r = world(w.arch, w.sens, w.net, w.permit);
  const settings = JSON.stringify(w);
  const preset = Object.entries(MISSIONS).find(([, values]) =>
    Object.keys(values).every((key) => values[key] === w[key]),
  );
  $$("[data-mission]").forEach((button) =>
    button.setAttribute("aria-pressed", String(button.dataset.mission === preset?.[0])),
  );
  $("#mission-state").textContent = preset
    ? `${$("[data-mission=" + preset[0] + "] strong").textContent} · selected`
    : "Custom flight plan · your settings";
  if (lastWorld && lastWorld.settings !== settings) {
    const changes = ["local", "cloud", "held"].filter((key) => lastWorld[key] !== r[key]);
    $("#w-change").textContent = changes.length
      ? changes.map((key) => `${key[0].toUpperCase() + key.slice(1)}: ${lastWorld[key]} → ${r[key]}`).join(" · ")
      : "Settings changed; the request counts stay the same.";
    const feedback = $("#decision-change");
    feedback.dataset.held = String(r.held > 0);
    const rect = feedback.getBoundingClientRect();
    if (motionOn && rect.bottom > 0 && rect.top < innerHeight)
      gsap.fromTo(feedback, { y: 5 }, { y: 0, duration: 0.35, ease: "power2.out", overwrite: true });
  }
  lastWorld = { settings, local: r.local, cloud: r.cloud, held: r.held };
  const set = (id, v) => {
    $(id).textContent = v;
  };
  set("#n-local", r.local);
  set("#n-cloud", r.cloud);
  set("#n-held", r.held);
  set("#w-summary", r.summary);
  set("#w-data", r.data);
  set("#w-net", r.netd);
  set("#net-label", w.net ? "Connected" : "Offline");
  $("#relay-chip").textContent = w.net ? "CLOUD RELAY CONNECTED" : "CLOUD RELAY OFFLINE";
  $("#relay-chip").style.color = w.net ? "var(--gold)" : "var(--heldtext)";
  const sc = { "#b-local": r.local / 12, "#b-cloud": r.cloud / 12, "#b-held": r.held / 12 };
  Object.entries(sc).forEach(([id, v]) => {
    const el = $(id);
    if (hasGsap && motionOn && scenes.flowVisible())
      gsap.to(el, { scaleX: v, duration: 0.7, ease: "expo.out", overwrite: true });
    else el.style.transform = `scaleX(${v})`;
  });
  scenes.renderFlow(r, w);
  $("#cmp-rows").innerHTML = ["sovereign", "hybrid", "cloud"]
    .map((a) => {
      const x = world(a, w.sens, w.net, w.permit);
      const nm = a === "sovereign" ? "Sovereign / local" : a === "hybrid" ? "Hybrid" : "Cloud";
      return `<div class="cmp${a === w.arch ? " on" : ""}"><strong>${nm}</strong><span>${x.local}</span><span>${x.cloud}</span><span>${x.held}</span></div>`;
    })
    .join("");
}
$("#arch-group").addEventListener("click", (e) => {
  const b = e.target.closest("[data-arch]");
  if (!b) return;
  w.arch = b.dataset.arch;
  press($("#arch-group"), "data-arch", w.arch);
  renderWorld();
});
$("#sens-group").addEventListener("click", (e) => {
  const b = e.target.closest("[data-sens]");
  if (!b) return;
  w.sens = b.dataset.sens;
  press($("#sens-group"), "data-sens", w.sens);
  renderWorld();
});
$("#tg-net").addEventListener("click", (e) => {
  w.net = !w.net;
  e.currentTarget.setAttribute("aria-pressed", w.net);
  renderWorld();
});
$("#tg-permit").addEventListener("click", (e) => {
  w.permit = !w.permit;
  e.currentTarget.setAttribute("aria-pressed", w.permit);
  renderWorld();
});
const MISSIONS = {
  routine: { arch: "hybrid", sens: "mixed", net: true, permit: false },
  blackout: { arch: "hybrid", sens: "mixed", net: false, permit: false },
  classified: { arch: "cloud", sens: "private", net: true, permit: false },
};
$("#missions").addEventListener("click", (e) => {
  const b = e.target.closest("[data-mission]");
  if (!b) return;
  Object.assign(w, MISSIONS[b.dataset.mission]);
  press($("#arch-group"), "data-arch", w.arch);
  press($("#sens-group"), "data-sens", w.sens);
  $("#tg-net").setAttribute("aria-pressed", w.net);
  $("#tg-permit").setAttribute("aria-pressed", w.permit);
  renderWorld();
});
$("#copy-mission").addEventListener("click", () =>
  copy(
    `${location.origin}${location.pathname}#mission=${w.arch}.${w.sens}.${w.net ? "connected" : "offline"}.${w.permit ? "permitted" : "held"}`,
    "Mission link copied",
  ),
);
renderWorld();

/* ---------- 4. System atlas ---------- */
const NODES = {
  operator: {
    name: "The operator",
    role: "Authority",
    value: "Human",
    unit: "in command",
    summary: "A person owns the consequential decision.",
    body: "Policy defines what automation may do. Escalation preserves the evidence and returns decisions beyond that boundary to an accountable person.",
    evidence: "Published operating philosophy",
  },
  dsh: {
    name: "DSH",
    role: "Operator console",
    value: String(FLEET.dsh.skills),
    unit: "skills · " + FLEET.dsh.providers + " providers",
    summary: "The DeepSeek Harness is where I sit.",
    body:
      "A locally installed agent runtime with " +
      FLEET.dsh.skills +
      " skills and " +
      FLEET.dsh.providers +
      " configured providers, placed beside HERMES rather than replacing it yet. It collected the " +
      FLEET.observedLong +
      " record on this page through a read-only bridge. Its operating brief is dated " +
      FLEET.dsh.agentsDate +
      ".",
    evidence: "Local metadata probe · " + FLEET.observedLong,
  },
  hermes: {
    name: "HERMES",
    role: "Orchestration",
    value: String(FLEET.hermes.jobs),
    unit: "enabled scheduled jobs",
    summary: "Intent becomes a qualified route.",
    body:
      FLEET.hermes.jobs +
      " of " +
      FLEET.hermes.records +
      " scheduled jobs were enabled on the orchestration host at the " +
      FLEET.observedLong +
      " observation, budget period " +
      FLEET.hermes.budgetPeriod +
      ". No live end to end route verification was established, so routing stays unverified. The HERMES study lets you explore a browser-only routing model.",
    evidence: "Audit · " + FLEET.observedLong + " · routing withheld",
  },
  zeus: {
    name: "Zeus",
    role: "Owned compute",
    value: String(FLEET.zeus),
    unit: "LXC containers at observation",
    summary: "Physical ownership. Visible evidence.",
    body:
      FLEET.zeus +
      " LXC containers were running at this dated observation. Guest runtime does not establish application availability or failover readiness.",
    evidence: "Fleet observation · " + FLEET.observedLong,
  },
  apollo: {
    name: "Apollo",
    role: "Owned compute",
    value: String(FLEET.apollo),
    unit: "LXC containers at observation",
    summary: "A second host in the same estate.",
    body:
      FLEET.apollo +
      " LXC containers were running at this dated observation. The two-host cluster was quorate; quorum alone does not establish workload failover. Private service locations are withheld.",
    evidence: "Fleet observation · " + FLEET.observedLong,
  },
};
$$("[data-node]").forEach((b) =>
  b.addEventListener("click", () => {
    const n = NODES[b.dataset.node];
    scenes.selectAtlas(b.dataset.node);
    if (hasGsap && motionOn)
      gsap.fromTo(
        "#nd-name, #nd-value, #nd-summary, #nd-body",
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "expo.out", overwrite: true },
      );
    Bit.say(n.role.toUpperCase(), n.summary, "think", 1400);
    $$("[data-node]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    $("#nd-role").textContent = n.role;
    $("#nd-name").textContent = n.name;
    $("#atlas-inspect-link").textContent = `Inspect ${n.name}: role and evidence ↗`;
    $("#nd-value").textContent = n.value;
    $("#nd-unit").textContent = n.unit;
    $("#nd-summary").textContent = n.summary;
    $("#nd-body").textContent = n.body;
    $("#nd-evidence").textContent = n.evidence;
  }),
);
/* ---------- 5. Principles engine (draggable) ---------- */
const PR = [
  {
    n: "01",
    action: ["Inspect the dated evidence", "#evidence"],
    title: "Begin with a clear signal.",
    body: "Separate what is known from what is assumed. A useful system makes its evidence visible before it asks for trust.",
    tag: "Evidence before inference",
    ring: "The outer ring represents the boundary of what can be observed.",
  },
  {
    n: "02",
    action: ["Try this routing rule", "#build=hermes"],
    title: "Give each request the route it needs.",
    body: "Routine work gets a general lane. Evidence requirements change the route. Private information puts a person in the decision.",
    tag: "The boundary gets the final say",
    ring: "The middle ring represents the qualified route a request receives.",
  },
  {
    n: "03",
    action: ["Test when evidence needs review", "#build=dashboards"],
    title: "Trust has a timestamp.",
    body: "A source. A date. A clear boundary. Running guests do not establish application health, recovery or failover readiness.",
    tag: "Keep the claim inside the evidence",
    ring: "The core represents the human who verifies before acting.",
  },
];
$("#pr-group").addEventListener("click", (e) => {
  const b = e.target.closest("[data-pr]");
  if (!b) return;
  const p = PR[+b.dataset.pr];
  press($("#pr-group"), "data-pr", b.dataset.pr);
  $("#pr-n").textContent = p.n;
  $("#pr-title").textContent = p.title;
  $("#pr-body").textContent = p.body;
  $("#pr-tag").textContent = p.tag;
  $("#pr-ring").textContent = p.ring;
  $("#pr-action").textContent = p.action[0];
  $("#pr-action").href = p.action[1];
  if (motionOn)
    gsap.fromTo($("#pr-title").parentElement, { y: 6 }, { y: 0, duration: 0.35, ease: "power2.out", overwrite: true });
  scenes.selectPrinciple(+b.dataset.pr);
});
(function () {
  const eng = $("#engine"),
    rot = $("#eng-rot");
  let rx = 0,
    drag = null;
  const apply = () => {
    rot.style.transform = `rotate(${rx}deg)`;
    scenes.rotateEngine(rx);
  };
  eng.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, r: rx };
    eng.setPointerCapture(e.pointerId);
  });
  eng.addEventListener("pointermove", (e) => {
    if (!drag) return;
    rx = drag.r + (e.clientX - drag.x) * 0.5;
    apply();
  });
  eng.addEventListener("pointerup", () => (drag = null));
  eng.addEventListener("pointercancel", () => (drag = null));
  eng.addEventListener("keydown", (e) => {
    if (["ArrowLeft", "ArrowRight", "Home"].includes(e.key)) e.preventDefault();
    if (e.key === "ArrowLeft") {
      rx -= 10;
      apply();
    }
    if (e.key === "ArrowRight") {
      rx += 10;
      apply();
    }
    if (e.key === "Home") {
      rx = 0;
      apply();
    }
  });
  $("#eng-reset").addEventListener("click", () => {
    rx = 0;
    apply();
  });
})();

/* ---------- 6. E.V.E. console ---------- */
const EVE = {
  help: [
    "Commands: fleet · hosts · kernel · backups · atlas · dsh · hermes · routes · archive · cost · help",
    `Every reply is a dated fact from the published export. No live telemetry. Page revised ${FLEET.pageRevised}.`,
  ],
  fleet: [
    `observation: ${FLEET.observedLong} at ${FLEET.observedCentral} (${FLEET.observedUtc})`,
    `hosts at the observation: ${FLEET.hosts} responded, ${FLEET.quorate ? "quorate with an Athena QDevice" : "quorum not observed"} · pve-manager ${FLEET.pve}`,
    `lxc_running: ${FLEET.lxc} (zeus ${FLEET.zeus}, apollo ${FLEET.apollo}) · qemu_running: ${FLEET.qemu}`,
    `method: ${FLEET.method} · owner-run`,
  ],
  kernel: [
    `booted: ${FLEET.kernel.booted} on both hosts`,
    `staged: ${FLEET.kernel.staged} on both hosts, reboot pending`,
  ],
  backups: [
    `freshness: ${FLEET.backups.guestsOk} of ${FLEET.backups.guestsTotal} guests ok on ${FLEET.backups.freshnessLong}`,
    `restore_tested: ${FLEET.backups.restoreTested} · freshness is a file age check, not a restore drill`,
  ],
  atlas: [
    `primary model: ${FLEET.atlas.tag} · active context ${FLEET.atlas.context}`,
    "inference host for recurring work · private catalog withheld",
  ],
  dsh: [
    `DeepSeek Harness: ${FLEET.dsh.skills} skills · ${FLEET.dsh.providers} providers · operator console`,
    `operating brief dated ${FLEET.dsh.agentsDate} · coexists with HERMES`,
  ],
  hermes: [
    `scheduled jobs: ${FLEET.hermes.jobs} enabled of ${FLEET.hermes.records} records · budget period ${FLEET.hermes.budgetPeriod}`,
    "verified route count: withheld as unknown",
  ],
  routes: [
    "routingVerified: null",
    "lanes.public: null · lanes.privateCatalog: null",
    "withheld: no authoritative live end to end route verification was established",
    "the HERMES study on this page is a browser-only model, not this record",
  ],
  archive: [
    `${FLEET.prior.release} · fleet observed ${FLEET.prior.fleetLong} · ${FLEET.prior.method} · lxc ${FLEET.prior.lxc} (zeus ${FLEET.prior.zeus}, apollo ${FLEET.prior.apollo}) · qemu ${FLEET.prior.qemu} · pve ${FLEET.prior.pve}`,
    `${FLEET.archive.release} · fleet observed ${FLEET.archive.fleetLong} · routing observed ${FLEET.archive.routingLong}`,
    `lxc_running: ${FLEET.archive.lxc} · qemu: ${FLEET.archive.qemu.toLowerCase()} · public lanes: ${FLEET.archive.lanes}`,
    `original expiry ${FLEET.archive.expiry}; that expiry does not extend the later observation`,
  ],
  cost: [
    "V31 export · sample July 21 to 22, 2026 · observed AI provider usage 26¢ per day",
    "scope: ai provider usage in the dated sample",
    "excludes: owned infrastructure, electricity, and Doug’s time",
    "not an audited bill · does not establish today’s spend or a percentage saving",
  ],
  hosts: [
    `zeus: ${FLEET.zeus} LXC at observation · apollo: ${FLEET.apollo} LXC at observation · ${FLEET.qemu} QEMU VM in the cluster`,
    "quorum observed; quorum alone does not establish workload failover",
    "private service locations are withheld from the public record",
  ],
};
$("#eve-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const inp = $("#eve-in");
  const cmd = inp.value.trim().toLowerCase();
  if (!cmd) return;
  const out = $("#eve-out");
  const add = (h) => {
    const s = document.createElement("span");
    s.textContent = h;
    out.appendChild(s);
  };
  add("↳ " + cmd);
  const lines = EVE[cmd] || [`unknown command: ${cmd.replace(/</g, "&lt;")}. Try help.`];
  lines.forEach((l, i) =>
    setTimeout(
      () => {
        add(l);
        out.scrollTop = out.scrollHeight;
        if (i === lines.length - 1) {
          add(" ");
        }
      },
      hasGsap && motionOn ? 140 * (i + 1) : 0,
    ),
  );
  inp.value = "";
});

function openMC() {
  navigation.open();
}
$("#copy-email").addEventListener("click", () => copy("doug@cashio.us", "Email address copied"));
/* ---------- 7b. Bit, the co-pilot (ported from the V36/V37 mascot: faceted polyhedron, four moods) ---------- */
const Bit = setupBit({ isMotionEnabled: () => motionOn, openMissionControl: openMC });
window.Bit = Bit;
// Bit reacts to the instruments
$("#route-btn").addEventListener("click", () => {
  const r = routeExample(st.intent, st.priv, st.src);
  Bit.say("THINKING", "Qualifying the route…", "think", 900);
  setTimeout(() => {
    if (r.code === "HOLD")
      Bit.say(
        "HELD FOR A HUMAN",
        "Private input. I will not send this anywhere. The decision is yours.",
        "alert",
        2600,
      );
    else Bit.say("ROUTED", `${r.lane} lane. Every step is on the panel; nothing left this page.`, "yes", 2400);
  }, 900);
});
$("#pv-reveal").addEventListener("click", () => {
  if (pv.pick === "human") Bit.say("CALLED IT", "Correct. Private input always waits for a person.", "yes");
  else if (pv.pick === "keep") Bit.say("NOT THIS TIME", "The privacy boundary outranks the source requirement.", "no");
  else Bit.say("THE RULE", "Private input always holds the external route for human review.", "think");
});
$("#tg-net").addEventListener("click", () => {
  if (!w.net) Bit.say("BLACKOUT", "Cloud link is down. Watch what stays aboard.", "alert", 2200);
  else Bit.say("RELAY UP", "Connection restored. Public work may leave the ship again.", "yes", 1800);
});
$("#trace-btn").addEventListener("click", () =>
  Bit.say("TRACE", "Following one request from intent to review. Conceptual, not live.", "think", 3000),
);
$("#eve-form").addEventListener("submit", () =>
  Bit.say("ASK THE EVIDENCE", "Every answer has a date and a boundary.", "think", 1600),
);

/* ---------- 7e. Flight heritage hangar ---------- */
const PILOTS = {
  yeager: {
    title: "YEAGER · BELL X-1 · 1947",
    credit: "NASA / USAF photo by Lt. Robert A. Hoover",
    kick: "CHUCK YEAGER · BELL X-1 · OCTOBER 14, 1947",
    head: "Fly the card. Report what the machine did.",
    body: "The first supersonic flight was a test card flown to the letter and a report that said exactly what happened, cracked ribs and all. Doug Cashio applies the same discipline: run the check, record the result, and never let the story get ahead of the data.",
    idx: "01 / 04",
    line: "Yeager flew the card and reported what the machine did. So do I.",
  },
  johnson: {
    title: "JOHNSON · SR-71 · 1964",
    credit: "NASA photo by Jim Ross",
    kick: "KELLY JOHNSON · SKUNK WORKS · SR-71 · 1964",
    head: "Small team, few parts, short runway.",
    body: "Kelly Johnson's team made sustained Mach 3 flight practical through small teams, direct authority, and ruthless control of complexity. Doug Cashio applies the same discipline: shorten the path between the person who sees the problem and the person who can change the machine.",
    idx: "02 / 04",
    line: "Fourteen rules, one small team, Mach 3. Complexity is the enemy.",
  },
  rutan: {
    title: "RUTAN · PROTEUS · 1998",
    credit: "NASA / ESPO photo",
    kick: "BURT RUTAN · SCALED COMPOSITES · PROTEUS · 1998",
    head: "Build the strange thing. Then prove it in the air.",
    body: "Rutan's aircraft look wrong until they fly, and then they set records. Doug Cashio applies the same discipline: an unusual architecture earns its place by working under load, not by looking conventional in a slide.",
    idx: "03 / 04",
    line: "Rutan built the strange thing and proved it in the air. Local AI is that kind of strange.",
  },
  hoover: {
    title: "HOOVER · P-51 MUSTANG",
    credit: "U.S. Air National Guard photo by Tech. Sgt. Hampton Stramler",
    kick: "BOB HOOVER · P-51 · ENERGY MANAGEMENT",
    head: "Smooth is fast. Manage the energy you have.",
    body: "Hoover could pour tea during a barrel roll because he never wasted energy. Doug Cashio applies the same discipline: spend the capable route only where it matters, and keep the whole system smooth under a human hand.",
    idx: "04 / 04",
    line: "Hoover managed energy so well he poured tea in a roll. Budget the same way.",
  },
};
$("#pilots").addEventListener("click", (e) => {
  const b = e.target.closest("[data-pilot]");
  if (!b) return;
  const k = b.dataset.pilot,
    P = PILOTS[k];
  press($("#pilots"), "data-pilot", k);
  $$("#hangar img.hp").forEach((im) => im.classList.toggle("on", im.dataset.pilot === k));
  $("#hg-title").textContent = P.title;
  $("#hg-credit").textContent = P.credit;
  $("#hg-idx").textContent = P.idx;
  $("#hg-kick").textContent = P.kick;
  $("#hg-head").textContent = P.head;
  $("#hg-body").textContent = P.body;
  if (hasGsap && motionOn)
    gsap.fromTo(
      "#hg-card > *",
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "expo.out", overwrite: true },
    );
  Bit.say("FLIGHT HERITAGE", P.line, "think", 1800);
});

/* ---------- 7f. Signature energize ---------- */
const signatureImage = $("#sig-art");
function restoreSignatureArtwork() {
  if (signatureImage.dataset.fallback) return;
  signatureImage.dataset.fallback = "original";
  signatureImage.src = "/v38/assets/celestial.jpg";
}
signatureImage.addEventListener("error", restoreSignatureArtwork);
if (signatureImage.complete && !signatureImage.naturalWidth) restoreSignatureArtwork();
let signatureTimer;
$("#sig-btn").addEventListener("click", () => {
  clearTimeout(signatureTimer);
  const pl = $("#sigplate");
  pl.classList.remove("on");
  void pl.offsetWidth;
  pl.classList.add("on");
  $("#sig-state").textContent = "ENERGIZED · GOLD INTENT";
  $("#sig-state").style.color = "var(--gold)";
  const b = $("#sigburst");
  b.innerHTML = "";
  for (let i = 0; i < 26; i++) {
    const d = document.createElement("i");
    b.appendChild(d);
    if (hasGsap && motionOn) {
      const a = Math.random() * Math.PI * 2,
        r = 120 + Math.random() * 220;
      gsap.fromTo(
        d,
        { x: 0, y: 0, opacity: 1, scale: 0.6 + Math.random() },
        {
          x: Math.cos(a) * r,
          y: Math.sin(a) * r * 0.6,
          opacity: 0,
          scale: 0.2,
          duration: 1.2 + Math.random() * 0.8,
          ease: "expo.out",
          delay: Math.random() * 0.15,
        },
      );
    }
  }
  Bit.say("SIGNATURE", "Energized. Gold intent, blue possibility.", "yes", 2200);
  signatureTimer = setTimeout(() => {
    pl.classList.remove("on");
    $("#sig-state").textContent = "DORMANT · GOLD INTENT";
    $("#sig-state").style.color = "";
  }, 4000);
});

/* ---------- 7d. The fold ---------- */
$("#fold-btn").addEventListener("click", async () => {
  if (!motionOn) {
    Bit.say("AT REST", "Motion is off. The controls and stories are still yours to explore.", "think");
    return;
  }
  await window.__prepareHero?.();
  if (window.__fold) {
    Bit.say("FOLD", "Initiating fold. Hold on to something.", "alert", 2400);
    window.__fold();
  } else Bit.say("FOLD", "The fold needs WebGL. This device is showing the still.", "think");
});

const navigation = setupNavigation({
  studies: STUDIES,
  select(ex) {
    const i = PROJECTS.findIndex((p) => p.id === ex.study);
    studyState.set(ex.study, ex);
    selectStudy(i, false);
    if (ex.study === "hermes") {
      st.intent = ex.intent;
      st.priv = ex.privateData;
      st.src = ex.sources;
      press($("#intent-group"), "data-intent", st.intent);
      $("#tg-private").setAttribute("aria-pressed", st.priv);
      $("#tg-sources").setAttribute("aria-pressed", st.src);
      renderRoute(false);
    }
  },
  mission(next) {
    Object.assign(w, next);
    press($("#arch-group"), "data-arch", w.arch);
    press($("#sens-group"), "data-sens", w.sens);
    $("#tg-net").setAttribute("aria-pressed", w.net);
    $("#tg-permit").setAttribute("aria-pressed", w.permit);
    renderWorld();
  },
  motion: () => motionOn,
  toast,
});
setupMotion({
  gsap,
  onChange: (on) => {
    motionOn = on;
    renderWorld();
  },
  onSceneReady: () => Bit.setMood("yes", 1400),
});
