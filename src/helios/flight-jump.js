/** The jump into the flight: the island loads on intent and a short warp covers its loading moment. */
const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");

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

/**
 * A short starfield jump that covers the flight's loading moment.
 * @param {{ onHalt?: () => void }} [options] onHalt runs when motion stops the jump early.
 */
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
    host.className = "jump-warp";
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
