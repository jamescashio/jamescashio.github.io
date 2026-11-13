import { setupScenes } from "../helios/scenes.js";
import type { RoomModule } from "../helios/room-contract";
import "../helios/room-content.css";
import { parseMissionHash } from "../odyssey/flight-plan";
import { setupRoomScenes } from "./room-scenes.ts";

const loaders = {
  starship: () => import("../helios/room-starship.js"),
  principles: () => import("../helios/room-principles.js"),
  studios: () => import("../helios/room-studios.js"),
  heritage: () => import("../helios/room-heritage.js"),
};
const id = document.documentElement.dataset.room as keyof typeof loaders;
const room = document.getElementById(id)!;
const status = document.getElementById("reading-mode")!;
const mq = matchMedia("(prefers-reduced-motion: reduce)");
let preference: string | null | undefined;
const readSaved = () => {
  try {
    return localStorage.getItem("cashio-v40-motion");
  } catch {
    return null;
  }
};
preference = readSaved();
// What this room last read or wrote, so a return from another page adopts only a newer choice.
let seen = preference;
const motion = () => preference !== "off" && !mq.matches;
const motionButton = document.createElement("button");
motionButton.type = "button";
motionButton.className = "room-motion";
(document.querySelector("header .room-bar-actions") || document.querySelector("header"))!.append(motionButton);
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
    seen = preference;
  } catch {
    /* Storage is optional. */
  }
  syncMotion();
});
mq.addEventListener("change", syncMotion);
// A Pause chosen on another open page of the site reaches this room too.
addEventListener("storage", (e) => {
  if (e.key !== "cashio-v40-motion") return;
  preference = seen = e.newValue;
  syncMotion();
});
// Back to a cached room: the setting may have changed on another page while this one slept.
addEventListener("pageshow", (e) => {
  if (!e.persisted) return;
  const saved = readSaved();
  if (saved !== seen) preference = seen = saved;
  syncMotion();
});
syncMotion();
setupRoomScenes(motion);
// The passage to and from the front door stays still while motion is paused.
for (const moment of ["pageswap", "pagereveal"])
  addEventListener(moment, (event) => {
    if (!motion())
      (event as Event & { viewTransition?: { skipTransition(): void } | null }).viewTransition?.skipTransition();
  });

async function mount() {
  try {
    const module: RoomModule = await loaders[id]();
    const scenes = setupScenes({ motion: motion() });
    scenes.attachRoom(room);
    const say = (_title: string, message: string) => {
      status.textContent = message;
    };
    const copy = async (value: string) => {
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
      if (id === "starship" && mission && controller && "setMission" in controller)
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
    const currentLink = (link: Node) => {
      if (!(link instanceof Element)) return;
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
    status.textContent = "Interactive room. Change the controls to explore. Your inputs stay in this browser.";
    room.dataset.roomState = "ready";
  } catch {
    status.textContent =
      "The interactive controls could not load. The artwork and reading edition remain available below.";
    room.dataset.roomState = "error";
  }
}
void mount();
