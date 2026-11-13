import "./v44.css";
import { applyLegacyRoute } from "./legacy.ts";
import { motionEnabled, onMotionChange, setMotion } from "./motion.ts";
import { Sky, type SkyState } from "./sky.ts";
import { POSTERS, posterFor, projectPoster } from "./layout.ts";
import { mountStations } from "./stations.ts";
import { mountPlates } from "./plates.ts";
import { mountCopyEmail } from "./toast.ts";
import { mountHelm } from "./route.ts";
import { mountEve } from "./eve.ts";
import { mountBit } from "./bit.ts";
import { mountCinema } from "./cinema.ts";
import { mountAge } from "./age.ts";
import { mountFigures } from "./figures.ts";
import { mountPassage } from "./passage.ts";
import "./events.ts";
import { $, $$ } from "./dom.ts";

// An old alias such as #rooms is rewritten to its station; the page then travels there once it is ready.
const arrivedAlias = applyLegacyRoute();

const root = document.documentElement;
root.classList.add("js");
const params = new URLSearchParams(location.search);

/* Layout values are read once per resize, never inside a frame. */
const sky = $(".sky")!;
const hud = $("[data-hud]")!;
const arrival = $("#arrival")!;
const posterImage = $<HTMLImageElement>(".sky-poster")!;
let heroSpan = innerHeight;
let docSpan = 1;
let layout = projectPoster(POSTERS[0], innerWidth, innerHeight);
const measure = () => {
  heroSpan = Math.max(1, arrival.offsetHeight * 0.85);
  docSpan = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  // The live gate takes the layout of the poster on screen, placed as the stylesheet places it, so the two always agree.
  const position = getComputedStyle(posterImage)
    .objectPosition.split(" ")
    .map((v) => (v.endsWith("%") ? parseFloat(v) / 100 : 0.5)) as [number, number];
  layout = projectPoster(posterFor(posterImage.currentSrc || posterImage.src), innerWidth, innerHeight, position);
  // The poster zooms toward its own ring as the camera flies through.
  sky.style.setProperty("--ring-x", `${(innerWidth / 2 + layout.ring[0] * innerHeight).toFixed(1)}px`);
  sky.style.setProperty("--ring-y", `${(innerHeight / 2 - layout.ring[1] * innerHeight).toFixed(1)}px`);
  sky.style.setProperty("--ring-r", `${(layout.ring[2] * innerHeight).toFixed(1)}px`);
};

let transit = 0;
let lastY = scrollY;
let lastT = performance.now();
let warpBoost = 0;
let surgeUntil = 0;
let station = "arrival";
// Scroll speed feeds the warp only while the visitor is scrolling; it fades once the page stops.
const state = (): SkyState => {
  const now = performance.now();
  return {
    transit,
    dim: Math.min(1, transit) * 0.42,
    warpBoost: now < surgeUntil ? 1 : now - lastT < 160 ? warpBoost : 0,
    layout,
    station,
  };
};
// A surge flies the live gate's warp; the painted poster answers with a short pulse of light.
let pulse = 0;
const surge = (ms: number) => {
  if (!motionEnabled()) return;
  surgeUntil = performance.now() + ms;
  skyEngine?.wake();
  sky.setAttribute("data-surge", "");
  clearTimeout(pulse);
  pulse = window.setTimeout(() => sky.removeAttribute("data-surge"), Math.min(ms, 900));
};

// On phones Bit steps aside while the visitor reads downward, and returns when they pause or scroll back.
let scrollIdle = 0;
let lastDirectionY = scrollY;
const trackDirection = (y: number) => {
  if (Math.abs(y - lastDirectionY) < 6) return;
  if (y > lastDirectionY && y > innerHeight * 0.5) root.dataset.scrolling = "down";
  else delete root.dataset.scrolling;
  lastDirectionY = y;
  clearTimeout(scrollIdle);
  scrollIdle = window.setTimeout(() => delete root.dataset.scrolling, 1400);
};

const fill = $("[data-transit-fill]")!;
let ticking = false;
const onScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const y = scrollY;
    const now = performance.now();
    const v = Math.abs(y - lastY) / Math.max(1, now - lastT);
    lastY = y;
    lastT = now;
    warpBoost = Math.min(0.9, Math.max(0, (v - 2.2) / 5));
    transit = Math.min(1, Math.max(0, y / heroSpan));
    fill.style.setProperty("--progress", String(Math.min(1, y / docSpan)));
    // The painted poster flies toward the ring too, so every visitor gets the approach.
    sky.style.setProperty("--transit", motionEnabled() ? transit.toFixed(3) : "0");
    // The arrival's words gather a shade behind them while the ring flies past.
    root.style.setProperty("--transit", motionEnabled() ? transit.toFixed(3) : "0");
    const stage = transit >= 1 ? "deep" : "gate";
    sky.dataset.stage = stage;
    root.dataset.stage = stage;
    hud.toggleAttribute("data-scrolled", y > 8);
    trackDirection(y);
    if (skyWaiting && transit <= 0.001) startSky();
    skyEngine?.wake();
    skyEngine?.redraw();
  });
};

/* The live gate needs a real GPU. Software renderers keep the painted poster. */
let skyEngine: Sky | null = null;
let flareOff = 0;
let filmPlaying = false;
const gateStatus = (text: string) => $$("[data-gate-status]").forEach((el) => (el.textContent = text));
// The live scene takes over from its painting only at the gate, where both show the same frame; a visitor
// who has already set off keeps the poster until they come back to the top.
let skyWaiting = false;
const startSky = () => {
  if (transit > 0.001) {
    skyWaiting = true;
    return;
  }
  skyWaiting = false;
  const canvas = $<HTMLCanvasElement>(".sky-canvas")!;
  const force = params.get("gl") === "force";
  let seen = false;
  try {
    seen = sessionStorage.getItem("cashio-v44-gate") === "1";
    sessionStorage.setItem("cashio-v44-gate", "1");
  } catch {
    /* storage can be unavailable; the gate simply opens again */
  }
  // Once per visit, with motion on, the gate makes its entrance: a light front on the live gate, a flare on the poster.
  const entrance = motionEnabled() && !seen;
  const engine = new Sky(
    canvas,
    state,
    () => (root.dataset.gate = "open"),
    (live) => sky.toggleAttribute("data-live", live),
    force,
  );
  if (!engine.live) {
    if (entrance) {
      sky.setAttribute("data-flare", "");
      flareOff = window.setTimeout(() => sky.removeAttribute("data-flare"), 2400);
    }
    root.dataset.gate = "open";
    return;
  }
  skyEngine = engine;
  // The readout says Open by default, which is true of the poster; only the live entrance reads Aligning first.
  if (entrance) gateStatus("Aligning");
  engine.light(entrance);
  engine.hold("film", filmPlaying);
  engine.begin();
  requestAnimationFrame(() => sky.setAttribute("data-live", ""));
};
new MutationObserver(() => root.dataset.gate === "open" && gateStatus("Open")).observe(root, {
  attributes: true,
  attributeFilter: ["data-gate"],
});

/* Motion control. The button names the action it will take. */
const motionButton = $<HTMLButtonElement>("[data-motion-toggle]")!;
const syncMotion = () => {
  const on = motionEnabled();
  motionButton.setAttribute("aria-label", on ? "Pause motion" : "Resume motion");
  motionButton.querySelector("[data-motion-long]")!.textContent = on ? "Pause motion" : "Resume motion";
  motionButton.querySelector("[data-motion-short]")!.textContent = on ? "Pause" : "Resume";
  motionButton.toggleAttribute("data-paused", !on);
  if (!on) {
    sky.style.setProperty("--transit", "0");
    root.style.setProperty("--transit", "0");
  } else onScroll();
};
motionButton.addEventListener("click", () => setMotion(!motionEnabled()));
onMotionChange(syncMotion);
syncMotion();

/* Each station lights the deep sky in its own color; the live gate and the painted poster both follow. */
const stations = mountStations({
  surge,
  onStation: (id) => {
    station = id;
    sky.dataset.at = id;
    skyEngine?.wake();
  },
});
mountPlates();
mountCopyEmail();
mountAge();
mountFigures();
mountPassage();
mountHelm($<HTMLFormElement>("[data-helm]")!, $("[data-helm-result]")!);
// A decision at the helm reaches the sky: the far gate flares on the live scene, the painted gate on the poster.
document.addEventListener("v44:route", (e) => {
  const held = e.detail.id === "hold";
  if (skyEngine) skyEngine.pulse(held);
  else if (motionEnabled()) {
    sky.toggleAttribute("data-held", held);
    sky.removeAttribute("data-flare");
    void sky.offsetWidth;
    sky.setAttribute("data-flare", "");
    clearTimeout(flareOff);
    flareOff = window.setTimeout(() => sky.removeAttribute("data-flare"), 2400);
  }
});
const eve = mountEve($("[data-eve]")!, { warp: () => surge(1600), go: stations.go, typing: motionEnabled });
// E.V.E. reads the record once, the first time the evidence station arrives, as her own line.
const eveWatch = new IntersectionObserver(
  (entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    eveWatch.disconnect();
    void eve.run("opening", false);
  },
  { threshold: 0.2 },
);
eveWatch.observe($("[data-eve]")!);
mountBit(
  $<HTMLButtonElement>("[data-bit-open]")!,
  $<HTMLDialogElement>("[data-bit-dialog]")!,
  stations.go,
  stations.current,
);
mountCinema($("[data-screen]")!, (playing) => {
  filmPlaying = playing;
  skyEngine?.hold("film", playing);
});
// Only if the address still names that station; a newer hash wins.
if (arrivedAlias) requestAnimationFrame(() => location.hash === `#${arrivedAlias}` && stations.go(arrivedAlias, false));

// The page grows when a transcript or a record list opens and when fonts arrive, not only on resize.
let measuring = 0;
const remeasure = () => {
  cancelAnimationFrame(measuring);
  measuring = requestAnimationFrame(() => {
    measure();
    onScroll();
  });
};
addEventListener("resize", remeasure);
// A rotation or resize can swap the poster file for another composition; the gate follows once it loads.
posterImage.addEventListener("load", remeasure);
new ResizeObserver(remeasure).observe($("main")!);
addEventListener("scroll", onScroll, { passive: true });
requestAnimationFrame(() => {
  measure();
  onScroll();
});

// Everything that needs script is mounted; switch its controls on. Without script they stay honestly off.
$$<HTMLButtonElement | HTMLInputElement>("[data-needs-js]").forEach((control) => (control.disabled = false));

/* The scene waits for the page to settle so text and controls win the first second. */
const idle = (fn: () => void) =>
  "requestIdleCallback" in window ? requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 300);
if (document.readyState === "complete") idle(startSky);
else addEventListener("load", () => idle(startSky), { once: true });
