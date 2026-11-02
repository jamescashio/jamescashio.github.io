// Flight instruments for the V42 opening and chapters. Loaded after the deferred styles,
// so nothing here competes with the first paint. Every effect is finite or pausable.
const root = document.documentElement;
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const motionOn = () => !reduced.matches && root.dataset.motion !== "off";

function systemsCheck(hero: HTMLElement) {
  if (!motionOn() || window.scrollY > 160 || document.visibilityState !== "visible") return;
  let seen = false;
  try {
    seen = window.sessionStorage.getItem("cashio-systems-check") === "1";
    window.sessionStorage.setItem("cashio-systems-check", "1");
  } catch {
    // Private windows can refuse storage; the check simply runs again next visit.
  }
  if (seen) return;
  hero.style.setProperty("--hud-scan-depth", `${Math.min(hero.offsetHeight, window.innerHeight)}px`);
  hero.setAttribute("data-hud-boot", "");
  window.setTimeout(() => {
    hero.removeAttribute("data-hud-boot");
    hero.style.removeProperty("--hud-scan-depth");
  }, 2400);
}

function idleWhenAway(hero: HTMLElement) {
  if (!("IntersectionObserver" in window)) return;
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) hero.removeAttribute("data-hud-idle");
    else hero.setAttribute("data-hud-idle", "");
  }).observe(hero);
}

function chapterSweeps() {
  if (!("IntersectionObserver" in window)) return;
  const titles = Array.from(document.querySelectorAll<HTMLElement>("#v40-root main h2")).filter(
    (h) =>
      !h.closest<HTMLElement>("#top") &&
      parseFloat(window.getComputedStyle(h).fontSize) >= 30 &&
      window.getComputedStyle(h, "::after").content === "none",
  );
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        if (!motionOn()) return;
        const title = entry.target;
        title.setAttribute("data-sweep", "");
        window.setTimeout(() => title.removeAttribute("data-sweep"), 1900);
      }),
    { threshold: 0.6 },
  );
  titles.forEach((t) => io.observe(t));
}

const HOLO = ".continuum-paths a, .showcase-project, .eagle-film-play, .workshop-highlight";
const TILT = ".continuum-paths a, .showcase-project";
function holographicCards() {
  let frame = 0;
  let pending: { card: HTMLElement; x: number; y: number } | null = null;
  const paint = () => {
    frame = 0;
    if (!pending) return;
    const { card, x, y } = pending;
    pending = null;
    const b = card.getBoundingClientRect();
    const nx = Math.min(Math.max((x - b.left) / b.width, 0), 1);
    const ny = Math.min(Math.max((y - b.top) / b.height, 0), 1);
    card.style.setProperty("--holo-x", `${(nx * 100).toFixed(1)}%`);
    card.style.setProperty("--holo-y", `${(ny * 100).toFixed(1)}%`);
    if (card.matches(TILT)) {
      card.style.setProperty("--holo-rx", `${((nx - 0.5) * 7).toFixed(2)}deg`);
      card.style.setProperty("--holo-ry", `${((0.5 - ny) * 6).toFixed(2)}deg`);
    }
    card.setAttribute("data-holo", "on");
  };
  document.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse" || !finePointer.matches || !motionOn()) return;
      const card = e.target instanceof Element ? e.target.closest<HTMLElement>(HOLO) : null;
      if (!card) return;
      pending = { card, x: e.clientX, y: e.clientY };
      if (!frame) frame = window.requestAnimationFrame(paint);
    },
    { passive: true },
  );
  document.addEventListener(
    "pointerout",
    (e) => {
      const card = e.target instanceof Element ? e.target.closest<HTMLElement>(HOLO) : null;
      if (!card || (e.relatedTarget instanceof Node && card.contains(e.relatedTarget))) return;
      if (pending && pending.card === card) pending = null;
      card.style.removeProperty("--holo-rx");
      card.style.removeProperty("--holo-ry");
      card.setAttribute("data-holo", "off");
    },
    { passive: true },
  );
}

export function startFlightInstruments() {
  const hero = document.getElementById("top");
  if (hero) {
    systemsCheck(hero);
    idleWhenAway(hero);
  }
  chapterSweeps();
  holographicCards();
}

startFlightInstruments();
