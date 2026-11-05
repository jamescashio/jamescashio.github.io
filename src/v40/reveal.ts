import type { PageHost } from "./page-model.ts";

export function scramble(this: PageHost, el: Element) {
  if (!(el instanceof HTMLElement)) return;
  // Labels stay readable; the artwork carries the movement.
  el.dataset.scrambled = "1";
}

export function setupReveal(this: PageHost) {
  if (this.sio && !this.reduce)
    document.querySelectorAll<HTMLElement>("[data-scramble]:not([data-sobs])").forEach((el) => {
      el.dataset.sobs = "1";
      this.sio.observe(el);
    });
  // Measure the group before changing styles so the opening pays for one layout.
  const sectionRects = new Map<Element, DOMRect>();
  const inView = (el: HTMLElement) => {
    const section = el.closest("section");
    if (section) {
      if (!sectionRects.has(section)) sectionRects.set(section, section.getBoundingClientRect());
      const bounds = sectionRects.get(section)!;
      // Leave skipped chapters asleep until their intersection observer sees them.
      if (bounds.top >= window.innerHeight || bounds.bottom <= 0) return false;
    }
    return el.getBoundingClientRect().top < window.innerHeight * 0.92;
  };
  const reveals = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-rv])"), (el) => ({
    el,
    visible: this.reduce || inView(el),
    sibling: el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0,
  }));
  reveals.forEach(({ el, visible, sibling }) => {
    el.dataset.rv = "1";
    if (visible) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    el.style.transition = `opacity 640ms cubic-bezier(.23,1,.32,1) ${Math.min(sibling, 6) * 0.05}s, transform 640ms cubic-bezier(.23,1,.32,1) ${Math.min(sibling, 6) * 0.05}s`;
    this.rio.observe(el);
  });
}

export function reveal(this: PageHost, el: Element) {
  if (!(el instanceof HTMLElement)) return;
  el.style.opacity = "1";
  el.style.transform = "none";
  el.querySelectorAll<HTMLElement>("[data-count]").forEach((n) => this.countUp(n));
}

export function countUp(this: PageHost, n: HTMLElement) {
  if (n.dataset.counted) return;
  n.dataset.counted = "1";
  if (this.reduce) {
    n.textContent = Number(n.dataset.count).toLocaleString("en-US");
    return;
  }
  const to = parseFloat(n.dataset.count ?? ""),
    t0 = Date.now(),
    dur = 1400;
  const tick = () => {
    const p = Math.min(1, (Date.now() - t0) / dur),
      e = 1 - Math.pow(1 - p, 4);
    n.textContent = Math.round(to * e).toLocaleString("en-US");
    if (p < 1) setTimeout(tick, 30);
  };
  tick();
}

export function scrollFx(this: PageHost) {
  const y = window.scrollY,
    H = document.documentElement.scrollHeight - window.innerHeight;
  const law = document.getElementById("law");
  const lawBounds = law && !law.closest("details:not([open])") ? law.getBoundingClientRect() : null;
  const pb = document.getElementById("scroll-prog");
  if (pb) pb.style.transform = `scaleX(${H > 0 ? Math.min(1, y / H) : 0})`;
  const hc = document.getElementById("hero-content");
  if (hc && !this.reduce && !hc.classList.contains("continuum-composition")) {
    const heroScroll = Math.max(0, y - hc.offsetTop);
    const k = Math.min(1, heroScroll / 760);
    hc.style.transform = `translateY(${heroScroll * 0.2}px)`;
    hc.style.opacity = String(1 - k * 0.85);
  }
  if (law && lawBounds) {
    const r = lawBounds,
      span = r.height - window.innerHeight;
    const p = Math.max(0, Math.min(1, -r.top / (span || 1)));
    const ws = law.querySelectorAll<HTMLElement>("[data-mword]"),
      n = ws.length;
    ws.forEach((w, i) => {
      const a = this.reduce ? 1 : Math.max(0, Math.min(1, p * (n + 1.5) * 1.1 - i));
      w.style.opacity = String(0.12 + a * 0.88);
      w.style.textShadow =
        a > 0.95
          ? w.dataset.mword === "b"
            ? "0 0 40px rgba(226,230,238,.55)"
            : "0 0 40px rgba(53,120,255,.35)"
          : "none";
    });
    const bar = document.getElementById("law-bar");
    if (bar) bar.style.transform = `scaleX(${p})`;
  }
}
