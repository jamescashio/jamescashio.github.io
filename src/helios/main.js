import { setupRooms } from "./rooms.js";
import { setupSignature } from "./signature.js";
import { setupProofCount } from "./proof-count.js";
import { adoptEnhancements } from "./enhance.js";
import { $, $$ } from "./dom.js";
import { setupStudies } from "./studies.js";
import { setupPrivacy } from "./privacy.js";
import { setupAtlas } from "./atlas.js";
import { setupEvidenceConsole } from "./evidence-console.js";
import { FLEET } from "./fleet.js";
import { setupBit } from "./bit.js";
import { setupCopilotFeedback } from "./copilot-feedback.js";
import { gsap } from "gsap";
import { setupNavigation } from "./navigation.js";
import { setupMotion } from "./motion.js";
import { readMotionPreference } from "./motion-preference.js";
import { setupScenes } from "./scenes.js";
import { setupHeroDepth, setupChapterAnnounce, setupNavDepth } from "./page-motion.js";
import { setupTypeStyles } from "./type-styles.js";

/* The front door: shared teaching models and optional motion.
   Every instrument retains its complete behavior without WebGL. */

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let motionOn = !reduced && readMotionPreference() !== "off";
const scenes = setupScenes({ motion: motionOn });

let toastTimer = 0;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  if (!msg) {
    t.style.opacity = "0";
    clearTimeout(toastTimer);
    return;
  }
  t.style.opacity = "1";
  t.style.transform = "translate(-50%,0)";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.style.opacity = "0";
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
/* Hydrate the authored dates and counts from the one public evidence record. */
window.FLEET = FLEET;
const fleetValue = (path) => path.split(".").reduce((o, k) => o && o[k], FLEET);
/* A published date never changes; the visitor sees how old the observation is today. */
function ageOf(value) {
  const then = new Date(value);
  if (Number.isNaN(then.getTime())) return "";
  const now = new Date();
  const day = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((day(now) - day(then)) / 86400000);
  if (days < 0) return "";
  return days === 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`;
}
document.addEventListener("DOMContentLoaded", () => {
  $$("[data-fleet]").forEach((el) => {
    const v = fleetValue(el.dataset.fleet);
    if (v !== undefined) el.textContent = typeof v === "number" ? v.toLocaleString("en-US") : String(v);
  });
  $$("[data-age-of]").forEach((el) => {
    const age = ageOf(fleetValue(el.dataset.ageOf));
    if (!age) return;
    el.textContent = ` · ${age}`;
    el.hidden = false;
  });
});

const studyDeck = setupStudies({ scenes, motion: () => motionOn, copy });
// Wide screens open the studies; the system map and glossary stay folded until requested, so the page stays short.
if (matchMedia("(min-width: 1100px)").matches) $("#study-lab").setAttribute("open", "");
setupPrivacy({
  loadRequest: studyDeck.loadRequest,
  traceRequest: () => scenes.traceRequest(),
  motion: () => motionOn,
  // The privacy card explains its own result; Bit only reacts with a mood, so it never covers the answer.
  onReveal: (prediction) => Bit.setMood(prediction === "human" ? "yes" : prediction === "keep" ? "no" : "think", 2200),
});

setupAtlas({ scenes, motion: () => motionOn, say: (...args) => Bit.say(...args) });

setupEvidenceConsole({ motion: () => motionOn });
setupProofCount({ motion: () => motionOn });
adoptEnhancements();

function openMC() {
  navigation.open();
}
$("#copy-email").addEventListener("click", () => copy("doug@cashio.us", "Email address copied"));
/* The copilot reacts to choices; it never makes them. */
const Bit = setupBit({ isMotionEnabled: () => motionOn, openMissionControl: openMC });
window.Bit = Bit;
setupCopilotFeedback({ getRequest: () => studyDeck.getRequest(), say: (...args) => Bit.say(...args) });

setupSignature({ motion: () => motionOn, say: (...args) => Bit.say(...args) });

/* The optional orbital effect lives under Mission Control's extras; it closes the menu, returns to the opening and ends at rest. */
$("#fold-btn").addEventListener("click", async () => {
  // Use the same navigation as menu links, including leaving a room and restoring Back correctly.
  navigation.navigate("#top");
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
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

const rooms = setupRooms({ scenes, motion: () => motionOn, copy, say: (...args) => Bit.say(...args) });
const navigation = setupNavigation({
  rooms,
  studies: studyDeck.studies,
  select: studyDeck.selectExperiment,
  mission: (value) => rooms.controller("starship").setMission(value),
  motion: () => motionOn,
});
setupMotion({
  gsap,
  onChange: (on) => {
    motionOn = on;
    rooms.controller("starship")?.render();
  },
  onSceneReady: () => Bit.setMood("yes", 1400),
});
setupHeroDepth({ motion: () => motionOn });
setupChapterAnnounce();
setupNavDepth();
setupTypeStyles();
