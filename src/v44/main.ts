import "./v44.css";
import { applyLegacyRoute } from "./legacy.ts";
import { motionEnabled, onMotionChange, setMotion } from "./motion.ts";
import { Sky, type SkyState } from "./sky.ts";
import { mountHelm } from "./route.ts";
import { mountEve } from "./eve.ts";
import { mountBit } from "./bit.ts";
import { mountCinema } from "./cinema.ts";

applyLegacyRoute();
addEventListener("hashchange", applyLegacyRoute);

const root = document.documentElement;
root.classList.add("js");
const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string) => [...document.querySelectorAll<T>(sel)];
const params = new URLSearchParams(location.search);

/* Layout values are read once per resize, never inside a frame. */
const sky = $(".sky")!;
const arrival = $("#arrival")!;
const frame = $(".frame")!;
let heroSpan = innerHeight;
let docSpan = 1;
let column = { left: 0, right: innerWidth };
const measure = () => {
  heroSpan = Math.max(1, arrival.offsetHeight * 0.85);
  docSpan = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const r = frame.getBoundingClientRect();
  column = { left: r.left, right: r.right };
};

let transit = 0;
let lastY = scrollY;
let lastT = performance.now();
let warpBoost = 0;
let surgeUntil = 0;
const state = (): SkyState => ({
  transit,
  dim: Math.min(1, transit) * 0.42,
  warpBoost: performance.now() < surgeUntil ? 1 : warpBoost,
  column,
});

/* Stations: one owner for the current station, the nav and the transit line. */
const fill = $("[data-transit-fill]")!;
const links = $$<HTMLAnchorElement>("[data-station-link]");
let current = "arrival";
const stationObserver = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      current = (e.target as HTMLElement).dataset.station || current;
      links.forEach((a) => a.setAttribute("aria-current", String(a.dataset.stationLink === current)));
    }
  },
  { rootMargin: "-45% 0px -50% 0px" },
);
$$("[data-station]").forEach((s) => stationObserver.observe(s));

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
    sky.dataset.stage = transit >= 1 ? "deep" : "gate";
    skyEngine?.redraw();
  });
};

/* The live gate needs a real GPU. Software renderers keep the painted poster. */
let skyEngine: Sky | null = null;
const startSky = () => {
  const canvas = $<HTMLCanvasElement>(".sky-canvas")!;
  const force = params.get("gl") === "force";
  const engine = new Sky(canvas, state, () => (root.dataset.gate = "open"), force);
  if (!engine.live) {
    root.dataset.gate = "open";
    gateStatus("Open");
    return;
  }
  skyEngine = engine;
  let seen = false;
  try {
    seen = sessionStorage.getItem("cashio-v44-gate") === "1";
    sessionStorage.setItem("cashio-v44-gate", "1");
  } catch {
    /* storage can be unavailable; the gate simply ignites again */
  }
  engine.light(motionEnabled() && !seen);
  engine.redraw();
  engine.start();
  requestAnimationFrame(() => sky.setAttribute("data-live", ""));
};
const gateStatus = (text: string) => $$("[data-gate-status]").forEach((el) => (el.textContent = text));
new MutationObserver(() => root.dataset.gate === "open" && gateStatus("Open")).observe(root, {
  attributes: true,
  attributeFilter: ["data-gate"],
});

/* Reveal as stations arrive. */
const reveal = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("in");
      reveal.unobserve(e.target);
    }
  },
  { rootMargin: "0px 0px -8% 0px" },
);
$$(".station:not(.arrival) .station-head, .station .hull, .after-note").forEach((el) => {
  el.setAttribute("data-reveal", "");
  reveal.observe(el);
});

/* Pointer light on hull plates and a small tilt on worlds, fine pointers only. */
if (matchMedia("(pointer: fine)").matches) {
  document.addEventListener(
    "pointermove",
    (e) => {
      const hull = (e.target as Element).closest?.(".hull") as HTMLElement | null;
      if (!hull) return;
      const r = hull.getBoundingClientRect();
      hull.style.setProperty("--mx", `${e.clientX - r.left}px`);
      hull.style.setProperty("--my", `${e.clientY - r.top}px`);
      if (hull.hasAttribute("data-tilt") && motionEnabled()) {
        hull.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 6}deg`);
        hull.style.setProperty("--rx", `${-((e.clientY - r.top) / r.height - 0.5) * 5}deg`);
      }
    },
    { passive: true },
  );
  $$("[data-tilt]").forEach((el) =>
    el.addEventListener("pointerleave", () => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    }),
  );
}

/* Motion control. */
const motionButton = $<HTMLButtonElement>("[data-motion-toggle]")!;
const syncMotion = () => {
  const on = motionEnabled();
  motionButton.setAttribute("aria-label", on ? "Pause motion" : "Resume motion");
  motionButton.querySelector("[data-motion-long]")!.textContent = on ? "Pause motion" : "Resume motion";
  motionButton.querySelector("[data-motion-short]")!.textContent = on ? "Pause" : "Resume";
  motionButton.setAttribute("aria-pressed", String(!on));
};
motionButton.addEventListener("click", () => setMotion(!motionEnabled()));
onMotionChange(syncMotion);
syncMotion();

/* Station sheet for narrow screens. */
const menu = $<HTMLButtonElement>("[data-menu-toggle]")!;
const sheet = $("#station-sheet")!;
const closeSheet = () => {
  sheet.hidden = true;
  menu.setAttribute("aria-expanded", "false");
};
menu.addEventListener("click", () => {
  const open = sheet.hidden;
  sheet.hidden = !open;
  menu.setAttribute("aria-expanded", String(open));
  if (open) sheet.querySelector("a")?.focus();
});
sheet.addEventListener("click", (e) => (e.target as Element).closest("a") && closeSheet());
document.addEventListener("keydown", (e) => e.key === "Escape" && !sheet.hidden && (closeSheet(), menu.focus()));

/* Navigation with a warp surge through the gate. */
const go = (id: string) => {
  const target = document.getElementById(id);
  if (!target) return;
  if (motionEnabled()) surgeUntil = performance.now() + 1400;
  target.scrollIntoView({ behavior: motionEnabled() ? "smooth" : "auto" });
  history.replaceState(null, "", `#${id}`);
};
$$<HTMLAnchorElement>("[data-transit-go]").forEach((a) =>
  a.addEventListener("click", (e) => {
    e.preventDefault();
    go(a.hash.slice(1));
  }),
);

/* Copy the address, with a fallback the visitor can still read. */
const toast = (text: string) => {
  const el = document.createElement("div");
  el.className = "toast";
  el.setAttribute("role", "status");
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
};
$("[data-copy-email]")?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText("doug@cashio.us");
    toast("Copied doug@cashio.us");
  } catch {
    toast("Copy blocked here. The address is doug@cashio.us");
  }
});

/* Typed eggs, outside form fields. */
let typed = "";
document.addEventListener("keydown", (e) => {
  const t = e.target as HTMLElement;
  if (t.closest("input, textarea, select, [contenteditable]") || e.key.length !== 1) return;
  typed = (typed + e.key.toLowerCase()).slice(-12);
  if (typed.endsWith("zoom")) {
    if (motionEnabled()) surgeUntil = performance.now() + 1600;
    toast("Engaging. Hold on to something that is not a houseplant.");
  } else if (typed.endsWith("drummer")) {
    toast("Captain on deck.");
  }
});

mountHelm($<HTMLFormElement>("[data-helm]")!, $("[data-helm-result]")!);
const eve = mountEve($("[data-eve]")!, {
  warp: () => motionEnabled() && (surgeUntil = performance.now() + 1600),
  go,
  typing: motionEnabled,
});
// E.V.E. reads the record aloud, once, the first time the evidence station arrives.
const eveWatch = new IntersectionObserver(
  (entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    eveWatch.disconnect();
    void eve.run("status");
  },
  { threshold: 0.5 },
);
eveWatch.observe($("[data-eve]")!);
mountBit($<HTMLButtonElement>("[data-bit-open]")!, $<HTMLDialogElement>("[data-bit-dialog]")!, go, () => current);
mountCinema($("[data-screen]")!, (playing) => (playing ? skyEngine?.stop() : skyEngine?.start()));

addEventListener("resize", () => {
  measure();
  onScroll();
});
addEventListener("scroll", onScroll, { passive: true });
requestAnimationFrame(() => {
  measure();
  onScroll();
});

/* The scene waits for the page to settle so text and controls win the first second. */
const idle = (fn: () => void) =>
  "requestIdleCallback" in window ? requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 300);
if (document.readyState === "complete") idle(startSky);
else addEventListener("load", () => idle(startSky), { once: true });
