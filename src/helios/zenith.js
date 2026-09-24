/**
 * V39 Zenith: small, finite motion around the authored artwork.
 * Everything here yields to the Motion control, the device's reduced motion setting,
 * hidden tabs and open scenes. Nothing here changes content or state.
 */

const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");

/** The hero artwork answers the pointer with a few pixels of depth. */
export function setupHeroDepth({ motion }) {
  const hero = document.querySelector(".hero");
  if (!hero || !matchMedia("(pointer: fine)").matches) return;
  let inView = true;
  let raf = 0;
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  const active = () =>
    motion() &&
    !reducedQuery.matches &&
    inView &&
    !document.hidden &&
    !document.documentElement.classList.contains("experience-open");
  function frame() {
    raf = 0;
    if (!active()) return;
    current.x += (target.x - current.x) * 0.06;
    current.y += (target.y - current.y) * 0.06;
    hero.style.setProperty("--px", current.x.toFixed(4));
    hero.style.setProperty("--py", current.y.toFixed(4));
    if (Math.abs(target.x - current.x) > 0.0005 || Math.abs(target.y - current.y) > 0.0005)
      raf = requestAnimationFrame(frame);
  }
  hero.addEventListener(
    "pointermove",
    (event) => {
      if (!active()) return;
      target.x = event.clientX / innerWidth - 0.5;
      target.y = event.clientY / Math.max(1, hero.clientHeight) - 0.5;
      if (!raf) raf = requestAnimationFrame(frame);
    },
    { passive: true },
  );
  hero.addEventListener("pointerleave", () => {
    target.x = 0;
    target.y = 0;
    if (active() && !raf) raf = requestAnimationFrame(frame);
  });
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
  }).observe(hero);
  window.addEventListener("helios-motion", (event) => {
    if (event.detail) return;
    cancelAnimationFrame(raf);
    raf = 0;
    target.x = target.y = current.x = current.y = 0;
    hero.style.setProperty("--px", "0");
    hero.style.setProperty("--py", "0");
  });
}

/** When a new chapter becomes current, its rail label appears briefly so visitors know where they are. */
/** Once the page leaves the hero, the header turns solid so headings never show through it. */
export function setupNavDepth() {
  const nav = document.getElementById("nav");
  if (!nav) return;
  let deep = null;
  const update = () => {
    const next = window.scrollY > 120;
    if (next !== deep) nav.classList.toggle("deep", (deep = next));
  };
  window.addEventListener("scroll", update, { passive: true });
  update();
}

export function setupChapterAnnounce() {
  const links = [...document.querySelectorAll(".sections a")];
  // Only where the gutter can hold a label without covering content.
  const roomy = matchMedia("(min-width: 1840px)");
  if (!links.length) return;
  let timer = 0;
  let last = null;
  const observer = new MutationObserver(() => {
    const current = links.find((link) => link.classList.contains("on"));
    if (!current || current === last) return;
    last = current;
    links.forEach((link) => link.classList.remove("zenith-announce"));
    if (current.getAttribute("href") === "#top" || !roomy.matches) return;
    current.classList.add("zenith-announce");
    clearTimeout(timer);
    timer = setTimeout(() => current.classList.remove("zenith-announce"), 1700);
  });
  links.forEach((link) => observer.observe(link, { attributes: true, attributeFilter: ["class"] }));
}

/** Warm the flight module when a visitor shows intent, so boarding feels instant. */
export function setupFlightPrefetch(load) {
  let warmed = false;
  const warm = (event) => {
    if (warmed || !event.target.closest?.("a[data-flight],a[href^='#flight=']")) return;
    if (navigator.connection?.saveData) return;
    warmed = true;
    load().catch(() => {
      warmed = false;
    });
  };
  document.addEventListener("pointerover", warm, { passive: true });
  document.addEventListener("focusin", warm);
  document.addEventListener("touchstart", warm, { passive: true });
}

/** A short starfield jump that covers the flight's loading moment. */
export function createWarp({ onHalt } = {}) {
  let host = null;
  let raf = 0;
  let started = 0;
  let safety = 0;
  let release = null;
  // A live Motion change or a new reduced motion preference stops the jump at once.
  const halt = () => {
    if (!host) return;
    end();
    onHalt?.();
  };
  window.addEventListener("helios-motion", (event) => {
    if (!event.detail) halt();
  });
  reducedQuery.addEventListener?.("change", (event) => {
    if (event.matches) halt();
  });
  function start() {
    if (reducedQuery.matches || host) return false;
    host = document.createElement("div");
    host.className = "zenith-warp";
    host.setAttribute("aria-hidden", "true");
    const canvas = document.createElement("canvas");
    host.append(canvas);
    document.body.append(host);
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      end();
      return false;
    }
    const stars = Array.from({ length: innerWidth < 700 ? 140 : 260 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: Math.random() * 0.9,
      v: 0.5 + Math.random() * 1.3,
      gold: Math.random() < 0.2,
    }));
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const reach = Math.hypot(cx, cy);
    started = performance.now();
    requestAnimationFrame(() => host?.classList.add("on"));
    const frame = (now) => {
      if (!host) return;
      if (reducedQuery.matches) {
        halt();
        return;
      }
      const t = (now - started) / 1000;
      const pull = Math.min(1, t / 0.7);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, reach * (0.12 + pull * 0.3));
      glow.addColorStop(0, `rgba(255, 236, 190, ${0.1 + pull * 0.35})`);
      glow.addColorStop(0.4, `rgba(56, 225, 255, ${0.05 + pull * 0.12})`);
      glow.addColorStop(1, "rgba(4, 7, 14, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = "round";
      for (const star of stars) {
        const head = (star.r + t * star.v * (0.25 + pull * 1.9)) % 1.15;
        const tail = Math.max(0, head - (0.015 + pull * 0.22) * star.v);
        const cos = Math.cos(star.a);
        const sin = Math.sin(star.a);
        ctx.strokeStyle = star.gold
          ? `rgba(242, 200, 122, ${0.35 + head * 0.6})`
          : `rgba(191, 233, 245, ${0.3 + head * 0.65})`;
        ctx.lineWidth = dpr * (0.6 + head * 2.2);
        ctx.beginPath();
        ctx.moveTo(cx + cos * tail * reach, cy + sin * tail * reach);
        ctx.lineTo(cx + cos * head * reach, cy + sin * head * reach);
        ctx.stroke();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    safety = setTimeout(end, 6000);
    return true;
  }
  /** Resolves once the jump has been visible long enough to read as a moment, not a flicker. */
  function settle(minimum = 620) {
    if (!host) return Promise.resolve();
    const wait = Math.max(0, minimum - (performance.now() - started));
    return new Promise((resolve) => {
      const timer = setTimeout(done, wait);
      function done() {
        clearTimeout(timer);
        release = null;
        resolve();
      }
      release = done;
    });
  }
  function end() {
    clearTimeout(safety);
    release?.();
    if (!host) return;
    const node = host;
    host = null;
    node.classList.remove("on");
    node.classList.add("off");
    setTimeout(() => {
      cancelAnimationFrame(raf);
      node.remove();
    }, 440);
  }
  return { start, settle, end, active: () => Boolean(host) };
}
