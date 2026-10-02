import { $ } from "./dom.js";
import { gsap } from "gsap";

/**
 * The verified file count counts up once when its card is mostly on screen.
 * The authored number stays in the markup, so reduced motion, no script and assistive tech all read the real figure.
 * @param {{ motion: () => boolean }} options
 */
export function setupProofCount({ motion }) {
  const figure = /** @type {HTMLElement | null} */ ($(".proof-facts strong"));
  if (!figure || !("IntersectionObserver" in window)) return;
  const target = Number(figure.textContent?.replace(/[^0-9]/g, ""));
  if (!Number.isFinite(target) || target <= 0) return;
  const watcher = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      watcher.disconnect();
      if (!motion()) return;
      const state = { value: 0 };
      gsap.to(state, {
        value: target,
        duration: 1.6,
        ease: "power3.out",
        onUpdate: () => {
          figure.textContent = Math.round(state.value).toLocaleString("en-US");
        },
        onComplete: () => {
          figure.textContent = target.toLocaleString("en-US");
        },
      });
    },
    { threshold: 0.6 },
  );
  watcher.observe(figure);
}
