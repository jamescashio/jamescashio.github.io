import "./v44.css";
import { applyLegacyRoute } from "./legacy.ts";
import { motionEnabled, onMotionChange, setMotion } from "./motion.ts";
import { Sky, type SkyState } from "./sky.ts";
import { mountHelm } from "./route.ts";
import { mountEve } from "./eve.ts";
import { mountBit } from "./bit.ts";
import { mountCinema } from "./cinema.ts";

// An old alias such as #rooms is rewritten to its station; the page then travels there once it is ready.
const arrivedAlias = applyLegacyRoute();

const root = document.documentElement;
root.classList.add("js");
const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string) => [...document.querySelectorAll<T>(sel)];
const params = new URLSearchParams(location.search);

/* Layout values are read once per resize, never inside a frame. */
const sky = $(".sky")!;
const hud = $("[data-hud]")!;
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
// Scroll speed feeds the warp only while the visitor is scrolling; it fades once the page stops.
const state = (): SkyState => {
  const now = performance.now();
  return {
    transit,
    dim: Math.min(1, transit) * 0.42,
    warpBoost: now < surgeUntil ? 1 : now - lastT < 160 ? warpBoost : 0,
    column,
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

/* The station sheet for narrow screens is built from the one station list in the header. */
const menu = $<HTMLButtonElement>("[data-menu-toggle]")!;
const sheet = $("#station-sheet")!;
sheet.replaceChildren($(".stations ol")!.cloneNode(true));

/* Stations: one owner for the current station, the nav, the sheet and the transit line. */
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
    const stage = transit >= 1 ? "deep" : "gate";
    sky.dataset.stage = stage;
    root.dataset.stage = stage;
    hud.toggleAttribute("data-scrolled", y > 8);
    trackDirection(y);
    skyEngine?.wake();
    skyEngine?.redraw();
  });
};

/* The live gate needs a real GPU. Software renderers keep the painted poster. */
let skyEngine: Sky | null = null;
let filmPlaying = false;
const startSky = () => {
  const canvas = $<HTMLCanvasElement>(".sky-canvas")!;
  const force = params.get("gl") === "force";
  const engine = new Sky(
    canvas,
    state,
    () => (root.dataset.gate = "open"),
    (live) => sky.toggleAttribute("data-live", live),
    force,
  );
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
  engine.hold("film", filmPlaying);
  engine.begin();
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
// Keyboard focus never lands inside something still waiting to fade in: it appears at once.
document.addEventListener("focusin", (e) => {
  const waiting = (e.target as Element).closest?.("[data-reveal]:not(.in)");
  if (waiting) {
    waiting.setAttribute("data-reveal", "now");
    waiting.classList.add("in");
    reveal.unobserve(waiting);
  }
});
// The workshop map's packets run only while the map is on screen.
const mapWatch = new IntersectionObserver((entries) =>
  entries.forEach((e) => (e.target as HTMLElement).toggleAttribute("data-visible", e.isIntersecting)),
);
$$(".system-map").forEach((el) => mapWatch.observe(el));

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

/* Motion control. The button names the action it will take. */
const motionButton = $<HTMLButtonElement>("[data-motion-toggle]")!;
const syncMotion = () => {
  const on = motionEnabled();
  motionButton.setAttribute("aria-label", on ? "Pause motion" : "Resume motion");
  motionButton.querySelector("[data-motion-long]")!.textContent = on ? "Pause motion" : "Resume motion";
  motionButton.querySelector("[data-motion-short]")!.textContent = on ? "Pause" : "Resume";
  motionButton.toggleAttribute("data-paused", !on);
  if (!on) sky.style.setProperty("--transit", "0");
  else onScroll();
};
motionButton.addEventListener("click", () => setMotion(!motionEnabled()));
onMotionChange(syncMotion);
syncMotion();

const sheetOpen = () => !sheet.hidden;
const closeSheet = (returnFocus = false) => {
  sheet.hidden = true;
  menu.setAttribute("aria-expanded", "false");
  if (returnFocus) menu.focus();
};
menu.addEventListener("click", () => {
  const open = !sheetOpen();
  sheet.hidden = !open;
  menu.setAttribute("aria-expanded", String(open));
  if (open)
    (sheet.querySelector<HTMLElement>('a[aria-current="true"]') || sheet.querySelector<HTMLElement>("a"))?.focus();
});
document.addEventListener("keydown", (e) => e.key === "Escape" && sheetOpen() && closeSheet(true));
document.addEventListener("pointerdown", (e) => {
  const t = e.target as Node;
  if (sheetOpen() && !sheet.contains(t) && !menu.contains(t)) closeSheet();
});
// Tabbing out of the sheet closes it, and so does widening the window to the desktop navigation.
sheet.addEventListener("focusout", (e) => {
  const next = e.relatedTarget as Node | null;
  if (next && !sheet.contains(next) && !menu.contains(next)) closeSheet();
});
matchMedia("(min-width: 1180px)").addEventListener("change", (e) => {
  if (!e.matches || !sheetOpen()) return;
  const inside = sheet.contains(document.activeElement);
  closeSheet();
  if (inside) document.querySelector<HTMLElement>('.stations a[aria-current="true"]')?.focus();
});

/* Navigation with a warp surge through the gate. Focus moves to the station's heading, and Back returns. */
const headingOf = (target: HTMLElement) =>
  (target.matches("h1, h2, h3") ? target : target.querySelector<HTMLElement>("h1, h2")) || target;
const go = (id: string, animate = true) => {
  const target = document.getElementById(id);
  if (!target) return;
  const fromY = scrollY;
  closeSheet();
  if (animate) surge(1400);
  target.scrollIntoView({ behavior: animate && motionEnabled() ? "smooth" : "auto" });
  const heading = headingOf(target);
  if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
  if (location.hash !== `#${id}`) {
    // Remember where the visitor was, so Back returns to that place and not the browser's guess.
    history.replaceState({ ...(history.state || {}), y: fromY }, "");
    history.pushState({ station: id }, "", `#${id}`);
  }
};
addEventListener("popstate", (e) => {
  const y = (e.state as { y?: number } | null)?.y;
  // After the browser's own restoration, so the remembered place wins.
  requestAnimationFrame(() => {
    if (typeof y === "number") scrollTo({ top: y, behavior: "auto" });
    else if (!location.hash) scrollTo({ top: 0, behavior: "auto" });
  });
});
$$<HTMLAnchorElement>("[data-transit-go], [data-station-link], [data-station-next], .brand").forEach((a) =>
  a.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
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
    surge(1600);
    toast("Engaging. Hold on to something that is not a houseplant.");
  } else if (typed.endsWith("drummer")) {
    toast("Captain on deck.");
  }
});

mountHelm($<HTMLFormElement>("[data-helm]")!, $("[data-helm-result]")!);
const eve = mountEve($("[data-eve]")!, { warp: () => surge(1600), go, typing: motionEnabled });
// E.V.E. reads the record aloud, once, the first time the evidence station arrives.
const eveWatch = new IntersectionObserver(
  (entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    eveWatch.disconnect();
    void eve.run("status", false);
  },
  { threshold: 0.5 },
);
eveWatch.observe($("[data-eve]")!);
mountBit($<HTMLButtonElement>("[data-bit-open]")!, $<HTMLDialogElement>("[data-bit-dialog]")!, go, () => current);
mountCinema($("[data-screen]")!, (playing) => {
  filmPlaying = playing;
  skyEngine?.hold("film", playing);
});

addEventListener("hashchange", () => {
  const alias = applyLegacyRoute();
  if (alias) go(alias);
});
if (arrivedAlias) requestAnimationFrame(() => go(arrivedAlias, false));

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
