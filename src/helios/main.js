import { $, $$, press } from "./dom.js";
import { setupStudies, routeExample } from "./studies.js";
import { setupPrivacy } from "./privacy.js";
import { setupAtlas } from "./atlas.js";
import { setupEvidenceConsole } from "./evidence-console.js";
import { FLEET } from "./fleet.js";
import { setupBit } from "./bit.js";
import { gsap } from "gsap";
import { computeWorldOutcome } from "../odyssey/sovereign-model";
import { setupNavigation } from "./navigation.js";
import { setupMotion } from "./motion.js";
import { readMotionPreference } from "./motion-preference.js";
import { setupScenes } from "./scenes.js";
import { setupHeroDepth, setupChapterAnnounce, setupNavDepth } from "./zenith.js";

/* =========================================================
   V38 HELIOS · shared teaching models and optional motion.
   Every instrument retains its complete behavior without WebGL.
   ========================================================= */

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let motionOn = !reduced && readMotionPreference() !== "off";
const hasGsap = true;
const scenes = setupScenes({ motion: motionOn });

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
/* ---------- 0. Fleet facts: the ONLY place dated evidence lives. Update from the DSH output. ---------- */
window.FLEET = FLEET;
document.addEventListener("DOMContentLoaded", () => {
  $$("[data-fleet]").forEach((el) => {
    const v = el.dataset.fleet.split(".").reduce((o, k) => o && o[k], FLEET);
    if (v !== undefined) el.textContent = String(v);
  });
});

const studyDeck = setupStudies({ scenes, motion: () => motionOn, copy });
const privacy = setupPrivacy({
  loadRequest: studyDeck.loadRequest,
  traceRequest: () => scenes.traceRequest(),
  motion: () => motionOn,
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

setupAtlas({ scenes, motion: () => motionOn, say: (...args) => Bit.say(...args) });

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

setupEvidenceConsole({ motion: () => motionOn });

function openMC() {
  navigation.open();
}
$("#copy-email").addEventListener("click", () => copy("doug@cashio.us", "Email address copied"));
/* ---------- 7b. Bit, the co-pilot (ported from the V36/V37 mascot: faceted polyhedron, four moods) ---------- */
const Bit = setupBit({ isMotionEnabled: () => motionOn, openMissionControl: openMC });
window.Bit = Bit;
// Bit reacts to the instruments
$("#route-btn").addEventListener("click", () => {
  const request = studyDeck.getRequest();
  const r = routeExample(request.intent, request.privateData, request.sources);
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
  if (privacy.getPrediction() === "human")
    Bit.say("CALLED IT", "Correct. Private input always waits for a person.", "yes");
  else if (privacy.getPrediction() === "keep")
    Bit.say("NOT THIS TIME", "The privacy boundary outranks the source requirement.", "no");
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
    body: "Yeager flew the X-1 past the speed of sound in 1947. The lesson I bring to my workshop: define the test, record what happened, and keep the story within the evidence.",
    source: "https://www.nasa.gov/history/x1/",
    sourceLabel: "Explore the X-1 history at NASA",
    idx: "01 / 04",
    line: "Define the test. Record what happened. Let the evidence set the limits.",
  },
  johnson: {
    title: "JOHNSON · SR-71 · 1964",
    credit: "NASA photo by Jim Ross",
    kick: "KELLY JOHNSON · SKUNK WORKS · SR-71 · 1964",
    head: "Small team, few parts, short runway.",
    body: "Johnson's fourteen rules emphasize small teams, direct responsibility and thorough records of important work. My takeaway: keep the path short between finding a problem and being able to fix it.",
    source: "https://www.lockheedmartin.com/content/dam/lockheed-martin/aero/photo/skunkworks/kellys-14-rules.pdf",
    sourceLabel: "Read Kelly's fourteen rules",
    idx: "02 / 04",
    line: "Give the person closest to the problem a clear path to solve it.",
  },
  rutan: {
    title: "RUTAN · PROTEUS · 1998",
    credit: "NASA / ESPO photo",
    kick: "BURT RUTAN · SCALED COMPOSITES · PROTEUS · 1998",
    head: "Build the strange thing. Then prove it in the air.",
    body: "Proteus first flew in 1998, designed for high altitude, long duration work. Its unusual form reminds me to start with the job a system must do, then test whether the design serves it.",
    source: "https://airbornescience.nasa.gov/aircraft/Proteus",
    sourceLabel: "Explore Proteus at NASA",
    idx: "03 / 04",
    line: "Start with the job. Give an unusual design a fair test.",
  },
  hoover: {
    title: "HOOVER · P-51 MUSTANG",
    credit: "U.S. Air National Guard photo by Tech. Sgt. Hampton Stramler",
    kick: "BOB HOOVER · P-51 · ENERGY MANAGEMENT",
    head: "Smooth is fast. Manage the energy you have.",
    body: "Hoover's flying is my reminder to treat capacity as precious. In this workshop, that means choosing a capable route when the task calls for it and keeping the decision understandable to the person in command.",
    source: "https://airandspace.si.edu/stories/editorial/remembering-robert-bob-hoover",
    sourceLabel: "Remember Bob Hoover with the Smithsonian",
    idx: "04 / 04",
    line: "Treat capacity as precious. Keep a human in command.",
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
  $("#hg-source").href = P.source;
  $("#hg-source").textContent = P.sourceLabel + " ↗";
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
  gsap.killTweensOf(Array.from(b.children));
  b.replaceChildren();
  const radius = Math.min(pl.clientWidth * 0.44, 270);
  for (let i = 0; motionOn && i < 16; i++) {
    const d = document.createElement("i");
    d.style.color = i % 4 === 0 ? "var(--cyan)" : "var(--gold)";
    b.appendChild(d);
    const a = (i / 16) * Math.PI * 2 - 0.1;
    gsap.fromTo(
      d,
      { x: Math.cos(a) * radius * 0.5, y: Math.sin(a) * radius * 0.24, opacity: 0.8, scale: 0.7 },
      {
        x: Math.cos(a) * radius,
        y: Math.sin(a) * radius * 0.48,
        opacity: 0,
        scale: 0.2,
        duration: 1.4,
        ease: "expo.out",
        delay: (i % 4) * 0.04,
      },
    );
  }
  Bit.say("SIGNATURE", "Energized. Gold intent, blue possibility.", "yes", 2200);
  signatureTimer = setTimeout(() => {
    gsap.killTweensOf(Array.from(b.children));
    b.replaceChildren();
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
    Bit.say("ORBIT", "A little light. Then back to stillness.", "yes", 2400);
    window.__fold();
  } else Bit.say("ORBIT", "The original artwork is ready to explore on this device.", "think");
});

const navigation = setupNavigation({
  studies: studyDeck.studies,
  select: studyDeck.selectExperiment,
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
setupHeroDepth({ motion: () => motionOn });
setupChapterAnnounce();
setupNavDepth();
