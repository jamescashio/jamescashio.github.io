import { $$ } from "./dom.js";

const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Room cards lean toward a fine pointer and catch a soft glare where it rests.
 * Touch, coarse pointers and reduced motion keep the flat card.
 */
function setupTilt() {
  if (reduced() || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  for (const card of /** @type {HTMLElement[]} */ ($$(".room-card"))) {
    let frame = 0;
    card.addEventListener("pointermove", (event) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = card.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width;
        const y = (event.clientY - box.top) / box.height;
        card.style.setProperty("--tilt-x", `${((0.5 - y) * 6).toFixed(2)}deg`);
        card.style.setProperty("--tilt-y", `${((x - 0.5) * 8).toFixed(2)}deg`);
        card.style.setProperty("--glare-x", `${(x * 100).toFixed(1)}%`);
        card.style.setProperty("--glare-y", `${(y * 100).toFixed(1)}%`);
        card.classList.add("is-tilting");
      });
    });
    card.addEventListener("pointerleave", () => {
      cancelAnimationFrame(frame);
      card.classList.remove("is-tilting");
      card.style.removeProperty("--tilt-x");
      card.style.removeProperty("--tilt-y");
    });
  }
}

/** Section labels draw a short signal line the first time they come into view. */
function setupSignalLines() {
  const kicks = /** @type {HTMLElement[]} */ ($$("main .kick"));
  if (!kicks.length) return;
  if (reduced() || !("IntersectionObserver" in window)) {
    for (const kick of kicks) kick.classList.add("is-seen");
    return;
  }
  const watcher = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-seen");
        watcher.unobserve(entry.target);
      }
    },
    { threshold: 0.8 },
  );
  for (const kick of kicks) watcher.observe(kick);
}

/** The gold line of the headline catches one sweep of light once the page has settled. */
function setupSheen() {
  const line = /** @type {HTMLElement | null} */ (document.querySelector(".hero h1 .em"));
  if (!line || reduced()) return;
  // The sweep is a transparent copy of the words clipped to a light gradient; the gold text underneath never changes.
  line.dataset.text = line.textContent?.trim() ?? "";
  line.classList.add("has-sheen");
}

/**
 * Marks elements while they are on screen (or once, for one time reveals).
 * @param {string} selector
 * @param {string} className
 * @param {boolean} once
 */
function watchView(selector, className, once) {
  const targets = /** @type {HTMLElement[]} */ ($$(selector));
  if (!targets.length) return;
  if (!("IntersectionObserver" in window)) {
    for (const target of targets) target.classList.add(className);
    return;
  }
  const watcher = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        entry.target.classList.toggle(
          className,
          entry.isIntersecting || (once && entry.target.classList.contains(className)),
        );
        if (once && entry.isIntersecting) watcher.unobserve(entry.target);
      }
    },
    { threshold: 0.35 },
  );
  for (const target of targets) watcher.observe(target);
}

export function setupFlourish() {
  // Reduced motion is handled in CSS, so these classes are always safe to set.
  watchView(".room-card", "in-view", false);
  watchView(".brief-artifact-preview", "is-seen", true);
  setupTilt();
  setupSignalLines();
  setupSheen();
}
