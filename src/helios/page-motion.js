/**
 * Small, finite motion around the authored artwork: hero depth, a solid header past the hero and the
 * chapter rail's arrival label. Everything here yields to the Motion control, the device's reduced
 * motion setting, hidden tabs and open scenes. Nothing here changes content or state.
 */
import { $ } from "./dom.js";

const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");

/** The hero artwork answers the pointer with a few pixels of depth. */
export function setupHeroDepth({ motion }) {
  const hero = $(".hero");
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

/** Once the page leaves the hero, the header turns solid so headings never show through it. */
export function setupNavDepth() {
  const nav = document.getElementById("nav");
  if (!nav) return;
  let deep = null;
  const update = () => {
    const next = window.scrollY > 120;
    if (next === deep) return;
    nav.classList.toggle("deep", (deep = next));
    // The opening keeps two actions in view; the chapter rail arrives once the reader moves on.
    document.documentElement.classList.toggle("at-top", !next);
  };
  window.addEventListener("scroll", update, { passive: true });
  update();
}

/** When a new chapter becomes current, its rail label appears briefly so visitors know where they are. */
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
    links.forEach((link) => link.classList.remove("rail-announce"));
    if (current.getAttribute("href") === "#top" || !roomy.matches) return;
    current.classList.add("rail-announce");
    clearTimeout(timer);
    timer = setTimeout(() => current.classList.remove("rail-announce"), 1700);
  });
  links.forEach((link) => observer.observe(link, { attributes: true, attributeFilter: ["class"] }));
}
