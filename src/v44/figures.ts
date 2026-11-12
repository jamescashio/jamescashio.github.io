/**
 * The record's figures count up to their printed value once, the first time the evidence arrives.
 * The value in the page is the truth: it is printed at build time, shown at once without motion,
 * and restored the instant motion pauses. Only the way it arrives is drawn here.
 */
import { motionEnabled, onMotionChange } from "./motion.ts";
import { $, $$ } from "./dom.ts";

const DURATION = 800;

export function mountFigures() {
  const panel = $(".figures");
  if (!panel || !("IntersectionObserver" in window)) return;
  const figures = $$(".figures dd strong")
    .map((el) => ({ el, value: Number(el.textContent) }))
    .filter((f) => Number.isSafeInteger(f.value) && f.value > 0);
  let raf = 0;
  const finish = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    for (const f of figures) f.el.textContent = String(f.value);
  };
  onMotionChange(() => !motionEnabled() && finish());
  const watch = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      watch.disconnect();
      if (!motionEnabled()) return;
      const start = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - start) / DURATION);
        const eased = 1 - (1 - k) ** 3;
        for (const f of figures) f.el.textContent = String(Math.round(f.value * eased));
        if (k < 1 && motionEnabled()) raf = requestAnimationFrame(step);
        else finish();
      };
      raf = requestAnimationFrame(step);
    },
    { threshold: 0.4 },
  );
  watch.observe(panel);
}
