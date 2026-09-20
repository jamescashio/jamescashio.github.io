import { gsap } from "gsap";
import { PROJECTS, routeExample as sharedRoute } from "../odyssey/data";
import { STUDY_NOTES } from "../odyssey/study-notes";
import { defaultExperiment, shareExperiment } from "../odyssey/study-experiment";
import { computeWorldOutcome } from "../odyssey/sovereign-model";
import { mountInstrument } from "./instruments.js";
import { setupNavigation } from "./navigation.js";
import { setupMotion } from "./motion.js";

/* =========================================================
   V38 HELIOS · shared teaching models and optional motion.
   Every instrument retains its complete behavior without WebGL.
   ========================================================= */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let motionOn = !reduced;
const hasGsap = true;
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
const FLEET = {
  observedLong: "September 18, 2026",
  observedShort: "Sep 18",
  observedUtc: "2026-09-18T22:53:54Z",
  observedCentral: "5:53 PM Central",
  method: "DeepSeek Harness, read only",
  hosts: 2,
  lxc: 20,
  zeus: 15,
  apollo: 5,
  qemu: 1,
  pve: "9.2.20",
  quorate: true,
  routing: "Not verified",
  pageRevised: "September 18, 2026",
  kernel: { booted: "7.0.14-14-pve", staged: "7.0.14-17-pve" },
  backups: { guestsOk: 20, guestsTotal: 20, freshnessLong: "September 18, 2026", restoreTested: false },
  atlas: { tag: "qwen3.8:27b-atlas", context: 16384 },
  hermes: { jobs: 58, records: 60, budgetPeriod: "September 2026" },
  dsh: { skills: 156, providers: 11, agentsDate: "September 8, 2026" },
  prior: {
    release: "V37.11",
    fleetLong: "September 7, 2026",
    fleetShort: "Sep 7",
    lxc: 19,
    zeus: 14,
    apollo: 5,
    qemu: 1,
    pve: "9.2.11",
    lanes: "Not verified",
    method: "HERMES audit",
  },
  archive: {
    release: "V35 ALL TENS",
    fleetLong: "August 28, 2026",
    fleetShort: "Aug 28",
    routingLong: "August 21, 2026",
    lxc: 18,
    qemu: "Not recorded",
    lanes: 10,
    expiry: "September 27, 2026",
  },
  cost: { cents: 26, sampleLong: "July 21 to 22, 2026", release: "V31" },
};
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
      `<button class="study" type="button" role="tab" id="study-${s.id}" aria-controls="instrument" tabindex="${i === st.i ? 0 : -1}" data-study="${i}" aria-selected="${i === st.i}"><div style="display:flex;justify-content:space-between;align-items:center"><span class="mono" style="font-size:11px;color:var(--gold)">${s.n}</span><span class="cy">◇</span></div><div style="display:flex;flex-direction:column;gap:4px"><span class="syne" style="font-size:20px;font-weight:700">${s.name}</span><span class="mono" style="font-size:10px;color:var(--muted)">${s.cat}</span></div><svg class="glyph" viewBox="0 0 24 24" fill="none" stroke="#38E1FF" stroke-width="1.2"><path d="${GLYPHS[i]}"/></svg></button>`,
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
  $("#secondary-instrument").hidden = i === 0;
  $(".ring-progress").style.display = i === 0 ? "" : "none";
  $("#study-source").href = i === 3 || i === 4 ? "status.json" : s.source;
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
function renderRoute(run) {
  const r = routeExample(st.intent, st.priv, st.src);
  const experiment = { study: "hermes", intent: st.intent, privateData: st.priv, sources: st.src };
  studyState.set("hermes", experiment);
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
        `<div class="step" data-step><span class="mono" style="font-size:11px;color:var(--gold);width:22px">0${i + 1}</span><span class="dot" style="background:${r.code === "HOLD" ? "var(--gold)" : "var(--cyan)"};box-shadow:0 0 12px ${r.code === "HOLD" ? "var(--gold)" : "var(--cyan)"}"></span><span style="font-size:14px">${t}</span></div>`,
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
      gsap.to(k, {
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
const pv = { pick: null };
$$("[data-pv]").forEach((b) =>
  b.addEventListener("click", () => {
    pv.pick = b.dataset.pv;
    $$("[data-pv]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  }),
);
$("#pv-reveal").addEventListener("click", () => {
  $("#pv-answer").textContent = "Human review";
  const res = $("#pv-result");
  res.hidden = false;
  $("#pv-text").innerHTML =
    `<strong>${pv.pick === "human" ? "Correct." : pv.pick === "keep" ? "Not this time." : "Revealed."}</strong> Private input always holds the external route for human review. Your prediction: ${pv.pick === "human" ? "Human review" : pv.pick === "keep" ? "Keep Research" : "none yet"}.`;
  if (hasGsap && motionOn) gsap.from(res, { y: 10, opacity: 0, duration: 0.5, ease: "expo.out" });
});

/* ---------- 3. Sovereign world model (twelve request illustration) ---------- */
const w = { arch: "hybrid", sens: "mixed", net: true, permit: false };
let schemVisible = false;
function world(arch, sens, net, permit) {
  const r = computeWorldOutcome({ architecture: arch, sensitivity: sens, connected: net, allowPrivateEgress: permit });
  return { ...r, data: r.dataHandling, netd: r.internetDependency };
}
function renderWorld() {
  const r = world(w.arch, w.sens, w.net, w.permit);
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
    if (hasGsap && motionOn && schemVisible)
      gsap.to(el, { scaleX: v, duration: 0.7, ease: "expo.out", overwrite: true });
    else el.style.transform = `scaleX(${v})`;
  });
  renderSchematic(r);
  $("#cmp-rows").innerHTML = ["sovereign", "hybrid", "cloud"]
    .map((a) => {
      const x = world(a, w.sens, w.net, w.permit);
      const nm = a === "sovereign" ? "Sovereign / local" : a === "hybrid" ? "Hybrid" : "Cloud";
      return `<div class="cmp${a === w.arch ? " on" : ""}"><strong>${nm}</strong><span>${x.local}</span><span>${x.cloud}</span><span>${x.held}</span></div>`;
    })
    .join("");
}
let schemTl = null;
function renderSchematic(r) {
  const g = $("#packets");
  if (!g) return;
  g.innerHTML = "";
  const archName = w.arch === "sovereign" ? "SOVEREIGN" : w.arch === "hybrid" ? "HYBRID" : "CLOUD";
  $("#schem-label").textContent = `${archName} · ${r.local} LOCAL · ${r.cloud} CLOUD · ${r.held} HELD`;
  $("#relay-state").textContent = w.net ? "CONNECTED" : "OFFLINE";
  $("#relay-state").setAttribute("fill", w.net ? "#F2C87A" : "#F08A96");
  $("#relay-line").setAttribute("stroke", w.net ? "rgba(242,200,122,.35)" : "rgba(208,79,95,.35)");
  $("#relay-line").style.animationPlayState = w.net ? "running" : "paused";
  const kinds = [].concat(Array(r.local).fill("local"), Array(r.cloud).fill("cloud"), Array(r.held).fill("held"));
  if (schemTl) {
    schemTl.kill();
    schemTl = null;
  }
  const dots = kinds.map((k, i) => {
    const col = k === "local" ? "#38E1FF" : k === "cloud" ? "#F2C87A" : "#F08A96";
    const t1 = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    t1.setAttribute("r", "7");
    t1.setAttribute("fill", col);
    t1.setAttribute("opacity", ".18");
    t1.setAttribute("cx", "300");
    t1.setAttribute("cy", "110");
    g.appendChild(t1);
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("r", "4");
    c.setAttribute("fill", col);
    c.setAttribute("filter", "url(#pg)");
    c.setAttribute("cx", "300");
    c.setAttribute("cy", "110");
    g.appendChild(c);
    return { c: [c, t1], k, i };
  });
  if (!(hasGsap && motionOn && schemVisible)) {
    dots.forEach(({ c, k, i }) =>
      c.forEach((el) => {
        const o = (i % 6) * 10 - 25;
        if (k === "local") {
          el.setAttribute("cx", 110 + o);
          el.setAttribute("cy", 150);
        } else if (k === "cloud") {
          el.setAttribute("cx", 520 + o);
          el.setAttribute("cy", 60);
        } else {
          el.setAttribute("cx", 300 + o);
          el.setAttribute("cy", 110);
        }
      }),
    );
    return;
  }
  schemTl = gsap.timeline({ repeat: -1 });
  dots.forEach(({ c, k, i }) => {
    const t = gsap.timeline({ repeat: -1, delay: i * 0.28 });
    if (k === "local") {
      t.fromTo(
        c,
        { attr: { cx: 300, cy: 110 } },
        { attr: { cx: 110, cy: 150 }, duration: 1.6, ease: "power1.inOut", stagger: 0.08 },
      ).to(c, { attr: { cx: 300, cy: 110 }, duration: 1.6, ease: "power1.inOut", stagger: 0.08 });
    } else if (k === "cloud") {
      t.fromTo(
        c,
        { attr: { cx: 110, cy: 150 } },
        { attr: { cx: 300, cy: 110 }, duration: 1.2, ease: "power1.inOut", stagger: 0.08 },
      )
        .to(c, { attr: { cx: 520, cy: 60 }, duration: 1.6, ease: "power1.inOut", stagger: 0.08 })
        .to(c, { attr: { cx: 300, cy: 110 }, duration: 1.6, ease: "power1.inOut", stagger: 0.08 })
        .to(c, { attr: { cx: 110, cy: 150 }, duration: 1.2, ease: "power1.inOut", stagger: 0.08 });
    } else {
      const a = (i / 12) * Math.PI * 2;
      t.set(c, { attr: { cx: 300 + Math.cos(a) * 34, cy: 110 + Math.sin(a) * 34 } }).to(c[0], {
        attr: { r: 6 },
        duration: 0.8,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    }
    schemTl.add(t, 0);
  });
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
const NODEPOS = { operator: [400, 96], dsh: [150, 300], hermes: [400, 320], zeus: [226, 498], apollo: [574, 498] };
$$("[data-node]").forEach((b) =>
  b.addEventListener("click", () => {
    const n = NODES[b.dataset.node];
    const pos = NODEPOS[b.dataset.node];
    $("#sel-halo").style.transform = `translate(${pos[0]}px,${pos[1]}px)`;
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
    $("#nd-value").textContent = n.value;
    $("#nd-unit").textContent = n.unit;
    $("#nd-summary").textContent = n.summary;
    $("#nd-body").textContent = n.body;
    $("#nd-evidence").textContent = n.evidence;
  }),
);
$("#trace-btn").addEventListener("click", () => {
  const labels = [
    "Human intent leaves the operator",
    "HERMES qualifies the route",
    "Zeus receives the work",
    "Result returns for human review",
  ];
  const pk = $("#packet");
  const lab = $("#trace-label");
  if (!(hasGsap && motionOn)) {
    lab.textContent = labels.join(" → ");
    return;
  }
  const tl = gsap.timeline({
    onComplete: () => {
      gsap.set(pk, { opacity: 0 });
      lab.textContent = "Follow one example from human intent to human review. No request is sent.";
    },
  });
  tl.set(pk, { attr: { cx: 400, cy: 96 }, opacity: 1 }).call(() => (lab.textContent = labels[0]));
  tl.to(pk, { attr: { cx: 400, cy: 262 }, duration: 1.4, ease: "power2.inOut" }).call(
    () => (lab.textContent = labels[1]),
  );
  tl.to(pk, { attr: { cx: 400, cy: 378 }, duration: 1, ease: "power2.inOut" })
    .to(pk, { attr: { cx: 226, cy: 486 }, duration: 1.4, ease: "power2.inOut" })
    .call(() => (lab.textContent = labels[2]));
  tl.to(pk, { attr: { cx: 400, cy: 378 }, duration: 1.4, ease: "power2.inOut" })
    .to(pk, { attr: { cx: 400, cy: 96 }, duration: 1.8, ease: "power2.inOut" })
    .call(() => (lab.textContent = labels[3]));
});

/* ---------- 5. Principles engine (draggable) ---------- */
const PR = [
  {
    n: "01",
    title: "Begin with a clear signal.",
    body: "Separate what is known from what is assumed. A useful system makes its evidence visible before it asks for trust.",
    tag: "Evidence before inference",
    ring: "The outer ring represents the boundary of what can be observed.",
  },
  {
    n: "02",
    title: "Give each request the route it needs.",
    body: "Routine work gets a general lane. Evidence requirements change the route. Private information puts a person in the decision.",
    tag: "The boundary gets the final say",
    ring: "The middle ring represents the qualified route a request receives.",
  },
  {
    n: "03",
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
  ["#r1", "#r2", "#r3"].forEach((id, i) => {
    $(id).style.strokeWidth = i === +b.dataset.pr ? "4" : "1.5";
    $(id).style.filter = i === +b.dataset.pr ? "drop-shadow(0 0 8px currentColor)" : "";
  });
});
(function () {
  const eng = $("#engine"),
    rot = $("#eng-rot");
  let rx = 0,
    drag = null;
  const apply = () => {
    rot.style.transform = `rotate(${rx}deg)`;
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
const Bit = (function () {
  const PHI = (1 + Math.sqrt(5)) / 2;
  const norm = (v) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const V = [
    [-1, PHI, 0],
    [1, PHI, 0],
    [-1, -PHI, 0],
    [1, -PHI, 0],
    [0, -1, PHI],
    [0, 1, PHI],
    [0, -1, -PHI],
    [0, 1, -PHI],
    [PHI, 0, -1],
    [PHI, 0, 1],
    [-PHI, 0, -1],
    [-PHI, 0, 1],
  ].map(norm);
  const F = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1],
  ];
  const YES = {
    vertices: [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ],
    faces: [
      [0, 2, 4],
      [2, 1, 4],
      [1, 3, 4],
      [3, 0, 4],
      [2, 0, 5],
      [1, 2, 5],
      [3, 1, 5],
      [0, 3, 5],
    ],
  };
  function stell(spike) {
    const vertices = V.map((v) => v.slice()),
      faces = [];
    F.forEach((f) => {
      const a = V[f[0]],
        b = V[f[1]],
        c = V[f[2]];
      const apex = norm([(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3]);
      const ai = vertices.length;
      vertices.push([apex[0] * spike, apex[1] * spike, apex[2] * spike]);
      faces.push([f[0], f[1], ai], [f[1], f[2], ai], [f[2], f[0], ai]);
    });
    return { vertices, faces };
  }
  const NO = stell(1.78);
  const pal = (m) =>
    m === "yes"
      ? { base: [255, 204, 24], edge: [255, 248, 176], glow: "rgba(255,204,0,0.5)" }
      : m === "no" || m === "alert"
        ? { base: [255, 24, 58], edge: [255, 154, 170], glow: "rgba(255,0,51,0.52)" }
        : m === "think"
          ? { base: [255, 149, 0], edge: [255, 214, 150], glow: "rgba(255,149,0,0.46)" }
          : { base: [38, 205, 236], edge: [200, 252, 255], glow: "rgba(0,249,255,0.46)" };
  const rot = (v, rx, ry) => {
    const cy = Math.cos(ry),
      sy = Math.sin(ry),
      cx = Math.cos(rx),
      sx = Math.sin(rx);
    const x = v[0] * cy + v[2] * sy,
      z1 = v[2] * cy - v[0] * sy;
    return [x, v[1] * cx - z1 * sx, v[1] * sx + z1 * cx];
  };
  const cv = $("#bitcv");
  const ctx = cv.getContext("2d");
  let mood = "idle",
    angle = 0,
    last = 0,
    raf = 0,
    moodTimer = 0,
    look = 0,
    lookT = 0,
    blink = 1,
    nextBlink = performance.now() + 3000;
  window.addEventListener(
    "pointermove",
    (e) => {
      const r = cv.getBoundingClientRect();
      lookT = Math.max(-0.6, Math.min(0.6, ((e.clientX - (r.left + r.width / 2)) / window.innerWidth) * 2));
    },
    { passive: true },
  );
  function draw(now) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const css = cv.clientWidth || 96;
    const want = Math.round(css * dpr);
    if (cv.width !== want) {
      cv.width = want;
      cv.height = want;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const center = css / 2,
      baseR = css * 0.24;
    const el = last ? Math.min(80, Math.max(0, now - last)) : 42;
    last = now;
    if (!reduced && motionOn)
      angle += el * (mood === "no" || mood === "alert" ? 0.0027 : mood === "yes" ? 0.0014 : 0.00105);
    look += (lookT - look) * 0.06;
    if (now > nextBlink) {
      blink = 0.72;
      nextBlink = now + 2600 + Math.random() * 4000;
    }
    blink += (1 - blink) * 0.18;
    const pulse = 0.5 + 0.5 * Math.sin(now * 0.0022);
    const P = pal(mood);
    const geo = mood === "yes" ? YES : mood === "no" || mood === "alert" ? NO : stell(1.08 + pulse * 0.24);
    let rx = -0.52 + Math.sin(angle * 0.72) * 0.13;
    if (mood === "no" || mood === "alert") rx += Math.sin(angle * 9) * 0.1;
    const radius = baseR * (mood === "yes" ? 1.3 : mood === "no" || mood === "alert" ? 0.96 : 1);
    const focal = 5.2;
    const pts = geo.vertices.map((v) => rot(v, rx, angle + look));
    const proj = (p) => {
      const sc = focal / (focal + p[2]);
      return [center + p[0] * radius * sc, center + p[1] * radius * sc * blink];
    };
    ctx.clearRect(0, 0, css, css);
    const halo = ctx.createRadialGradient(center, center, 1, center, center, css * 0.5);
    halo.addColorStop(0, P.glow);
    halo.addColorStop(0.3, `rgba(${P.edge[0]},${P.edge[1]},${P.edge[2]},${(0.1 + pulse * 0.07).toFixed(3)})`);
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, css, css);
    const L = [0.42, -0.5, 0.76];
    geo.faces
      .map((f, i) => [i, (pts[f[0]][2] + pts[f[1]][2] + pts[f[2]][2]) / 3])
      .sort((a, b) => a[1] - b[1])
      .forEach(([i]) => {
        const f = geo.faces[i];
        const a = pts[f[0]],
          b = pts[f[1]],
          c = pts[f[2]];
        const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
          v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
        const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
        const nl = Math.hypot(n[0], n[1], n[2]) || 1;
        const light = (n[0] / nl) * L[0] + (n[1] / nl) * L[1] + (n[2] / nl) * L[2];
        const sh = 0.2 + 0.8 * Math.max(0, light);
        const A = proj(a),
          B = proj(b),
          C = proj(c);
        ctx.beginPath();
        ctx.moveTo(A[0], A[1]);
        ctx.lineTo(B[0], B[1]);
        ctx.lineTo(C[0], C[1]);
        ctx.closePath();
        ctx.fillStyle = `rgba(${Math.round(P.base[0] * sh)},${Math.round(P.base[1] * sh)},${Math.round(P.base[2] * sh)},0.94)`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${P.edge[0]},${P.edge[1]},${P.edge[2]},${mood === "yes" ? "0.82" : "0.54"})`;
        ctx.lineWidth = mood === "yes" ? 0.9 : 0.62;
        ctx.stroke();
      });
  }
  function loop(now) {
    raf = 0;
    if (!canAnimate()) return;
    if (now - last >= 32) draw(now);
    raf = requestAnimationFrame(loop);
  }
  let engaged = false;
  const canAnimate = () =>
    engaged && motionOn && !document.hidden && !document.querySelector("dialog[open],#helios-flight");
  function syncAnimation() {
    if (canAnimate()) {
      if (!raf) raf = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(raf);
      raf = 0;
      draw(last);
    }
  }
  draw(0);
  syncAnimation();
  const engage = () => {
    engaged = true;
    syncAnimation();
  };
  window.addEventListener("pointerdown", engage, { once: true, passive: true });
  window.addEventListener("keydown", engage, { once: true });
  document.addEventListener("visibilitychange", syncAnimation);
  window.addEventListener("helios-motion", syncAnimation);
  window.addEventListener("helios-overlay", syncAnimation);
  let say = function (tag, line, m, hold) {
    $("#bit-tag").textContent = "BIT / " + tag;
    $("#bit-line").textContent = line;
    const box = $("#bitsay");
    box.classList.remove("hide");
    if (hasGsap && motionOn)
      gsap.fromTo(
        box,
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.6)", overwrite: true },
      );
    if (m) setMood(m, hold);
  };
  function setMood(m, hold) {
    if (m !== mood) {
      const b = $("#bit-btn");
      b.classList.remove("pop");
      void b.offsetWidth;
      b.classList.add("pop");
    }
    mood = m;
    clearTimeout(moodTimer);
    if (m !== "idle")
      moodTimer = setTimeout(() => {
        mood = "idle";
      }, hold || 2600);
  }
  $("#bit-x").addEventListener("click", () => $("#bitsay").classList.add("hide"));
  // bubble clears itself; Bit shrinks while the page scrolls; Bit can be dragged to any corner
  let sayTimer = 0;
  const origSay = say;
  say = function (tag, line, m, hold) {
    origSay(tag, line, m, hold);
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => $("#bitsay").classList.add("hide"), 6500);
  };
  let scrollT = 0;
  window.addEventListener(
    "scroll",
    () => {
      $("#bitdock").classList.add("scrolling");
      clearTimeout(scrollT);
      scrollT = setTimeout(() => $("#bitdock").classList.remove("scrolling"), 700);
    },
    { passive: true },
  );
  (function () {
    const dock = $("#bitdock"),
      btn = $("#bit-btn");
    let d = null;
    function place(x, y) {
      const W = window.innerWidth,
        H = window.innerHeight;
      const right = x > W / 2,
        top = y < H / 2;
      dock.classList.toggle("right", right);
      dock.classList.toggle("top", top);
      dock.style.left = right ? "auto" : "18px";
      dock.style.right = right ? "18px" : "auto";
      dock.style.top = top ? "calc(88px + env(safe-area-inset-top,0px))" : "auto";
      dock.style.bottom = top ? "auto" : "calc(18px + env(safe-area-inset-bottom,0px))";
      try {
        localStorage.setItem("v38bit", (right ? "r" : "l") + (top ? "t" : "b"));
      } catch {
        /* Position persistence is optional. */
      }
    }
    try {
      const sv = localStorage.getItem("v38bit");
      if (sv) {
        place(sv[0] === "r" ? window.innerWidth : 0, sv[1] === "t" ? 0 : window.innerHeight);
      }
    } catch {
      /* Position persistence is optional. */
    }
    btn.addEventListener("pointerdown", (e) => {
      d = { x: e.clientX, y: e.clientY, moved: false };
      btn.setPointerCapture(e.pointerId);
    });
    btn.addEventListener("pointermove", (e) => {
      if (!d) return;
      const dx = e.clientX - d.x,
        dy = e.clientY - d.y;
      if (!d.moved && Math.hypot(dx, dy) > 6) {
        d.moved = true;
        btn.classList.add("dragging");
        dock.style.transition = "none";
      }
      if (d.moved) {
        dock.style.transform = `translate(${dx}px,${dy}px)`;
      }
    });
    const end = (e) => {
      if (!d) return;
      if (d.moved) {
        btn.classList.remove("dragging");
        dock.style.transform = "";
        dock.style.transition = "";
        place(e.clientX, e.clientY);
        origSay("PARKED", "I will stay in this corner. Drag me again any time.", "yes", 1500);
        d = null;
        e.preventDefault();
        btn.dataset.skip = "1";
        setTimeout(() => delete btn.dataset.skip, 50);
      }
      d = null;
    };
    btn.addEventListener("pointerup", end);
    btn.addEventListener("pointercancel", () => {
      d = null;
    });
    btn.addEventListener(
      "click",
      (e) => {
        if (btn.dataset.skip) {
          e.stopImmediatePropagation();
        }
      },
      true,
    );
  })();
  $("#bit-btn").addEventListener("click", () => {
    say(
      "MISSION CONTROL",
      "Choose a starting point, or search the universe. Press Esc when you are done.",
      "yes",
      2000,
    );
    openMC();
  });
  return { say: (...a) => say(...a), setMood };
})();
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
const schemObserver = new IntersectionObserver(
  ([entry]) => {
    schemVisible = entry.isIntersecting;
    if (schemVisible && !schemTl && motionOn) renderWorld();
    if (schemTl) {
      if (entry.isIntersecting && motionOn) schemTl.resume();
      else schemTl.pause();
    }
  },
  { threshold: 0.05 },
);
schemObserver.observe($("#packets").closest("svg"));
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && schemVisible && motionOn) schemTl?.resume();
  else schemTl?.pause();
});
