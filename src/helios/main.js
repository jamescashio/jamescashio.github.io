import { setupRooms } from "./rooms.js";
import { setupSignature } from "./signature.js";
import { $, $$ } from "./dom.js";
import { setupStudies, routeExample } from "./studies.js";
import { setupPrivacy } from "./privacy.js";
import { setupAtlas } from "./atlas.js";
import { setupEvidenceConsole } from "./evidence-console.js";
import { FLEET } from "./fleet.js";
import { setupBit } from "./bit.js";
import { gsap } from "gsap";
import { setupNavigation } from "./navigation.js";
import { setupMotion } from "./motion.js";
import { readMotionPreference } from "./motion-preference.js";
import { setupScenes } from "./scenes.js";
import { setupHeroDepth, setupChapterAnnounce, setupNavDepth, setupTypeStyles } from "./zenith.js";

/* =========================================================
   V38 HELIOS · shared teaching models and optional motion.
   Every instrument retains its complete behavior without WebGL.
   ========================================================= */

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let motionOn = !reduced && readMotionPreference() !== "off";
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
/* Hydrate the authored dates and counts from the one public evidence record. */
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

setupAtlas({ scenes, motion: () => motionOn, say: (...args) => Bit.say(...args) });

setupEvidenceConsole({ motion: () => motionOn });

function openMC() {
  navigation.open();
}
$("#copy-email").addEventListener("click", () => copy("doug@cashio.us", "Email address copied"));
/* The copilot reacts to choices; it never makes them. */
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
// The privacy card explains its own result; Bit only reacts with a mood, so it never covers the answer.
$("#pv-reveal").addEventListener("click", () => {
  const prediction = privacy.getPrediction();
  Bit.setMood(prediction === "human" ? "yes" : prediction === "keep" ? "no" : "think", 2200);
});
$("#trace-btn").addEventListener("click", () =>
  Bit.say("TRACE", "Following one request from intent to review. Conceptual, not live.", "think", 3000),
);
$("#eve-form").addEventListener("submit", () =>
  Bit.say("ASK THE EVIDENCE", "Every answer has a date and a boundary.", "think", 1600),
);

setupSignature({ motion: () => motionOn, say: (...args) => Bit.say(...args) });

/* The optional orbital effect ends at rest. */
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

const rooms = setupRooms({ scenes, motion: () => motionOn, copy, say: (...args) => Bit.say(...args) });
const navigation = setupNavigation({
  rooms,
  studies: studyDeck.studies,
  select: studyDeck.selectExperiment,
  mission: (value) => rooms.controller("starship").setMission(value),
  motion: () => motionOn,
  toast,
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
