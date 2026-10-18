import { setupScenes } from "../helios/scenes.js";
import "../helios/room-content.css";
import { parseMissionHash } from "../odyssey/flight-plan";

const loaders = {
  starship: () => import("../helios/room-starship.js"),
  principles: () => import("../helios/room-principles.js"),
  studios: () => import("../helios/room-studios.js"),
  heritage: () => import("../helios/room-heritage.js"),
};
const id = document.documentElement.dataset.room;
const room = document.getElementById(id);
const status = document.getElementById("reading-mode");
const mq = matchMedia("(prefers-reduced-motion: reduce)");
let preference;
try {
  preference = localStorage.getItem("cashio-v40-motion");
} catch {
  /* Storage is optional. */
}
const motion = () => preference !== "off" && !mq.matches;
const motionButton = document.createElement("button");
motionButton.type = "button";
motionButton.className = "btn";
document.querySelector("header").append(motionButton);
function syncMotion() {
  document.documentElement.classList.toggle("motion-off", !motion());
  document.documentElement.dataset.motion = motion() ? "on" : "off";
  motionButton.textContent = mq.matches ? "Reduced motion" : motion() ? "Pause motion" : "Resume motion";
  motionButton.disabled = mq.matches;
  motionButton.setAttribute("aria-pressed", String(!motion()));
  window.dispatchEvent(new CustomEvent("helios-motion", { detail: motion() }));
}
motionButton.addEventListener("click", () => {
  preference = motion() ? "off" : "on";
  try {
    localStorage.setItem("cashio-v40-motion", preference);
  } catch {
    /* Storage is optional. */
  }
  syncMotion();
});
mq.addEventListener("change", syncMotion);
syncMotion();

async function mount() {
  try {
    const module = await loaders[id]();
    const scenes = setupScenes({ motion: motion() });
    scenes.attachRoom(room);
    const say = (_title, message) => {
      status.textContent = message;
    };
    const copy = async (value) => {
      try {
        await navigator.clipboard.writeText(value);
        status.textContent = "Copied.";
      } catch {
        status.textContent = "Copy is unavailable in this browser.";
      }
    };
    const controller = module.mount?.({ scenes, motion, say, copy });
    const restoreMission = () => {
      const mission = parseMissionHash(location.hash.replace(/\.online\./, ".connected."));
      if (id === "starship" && mission)
        controller.setMission({
          arch: mission.architecture,
          sens: mission.sensitivity,
          net: mission.connected,
          permit: mission.allowPrivateEgress,
        });
    };
    restoreMission();
    window.addEventListener("hashchange", restoreMission);
    for (const control of room.querySelectorAll("[data-reading-disabled]")) {
      control.removeAttribute("disabled");
      control.removeAttribute("data-reading-disabled");
      control.removeAttribute("aria-describedby");
    }
    // Principle choices also change their action link after a click.
    const currentLink = (link) => {
      const href = link.getAttribute("href");
      if (!href?.startsWith("#")) return;
      const target = room.querySelector(`[id="${CSS.escape(href.slice(1))}"]`);
      if (!target) link.setAttribute("href", "/" + href);
    };
    new MutationObserver((records) => records.forEach(({ target }) => currentLink(target))).observe(room, {
      subtree: true,
      attributes: true,
      attributeFilter: ["href"],
    });
    status.textContent = "V40 interactive room. Change the controls to explore. Your inputs stay in this browser.";
    room.dataset.roomState = "ready";
    document.title = document.title.replace(" · cAshIo", " · cAshIo V40");
  } catch {
    status.textContent =
      "The interactive controls could not load. The artwork and reading edition remain available below.";
    room.dataset.roomState = "error";
  }
}
void mount();
