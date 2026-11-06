/**
 * Hull plates: how they arrive and how they answer the pointer. Plates fade in as their station
 * arrives, keyboard focus never waits on a fade, and fine pointers get a light and a small tilt.
 */
import { motionEnabled } from "./motion.ts";
import { $$ } from "./dom.ts";

export function mountPlates() {
  const reveal = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("in");
        reveal.unobserve(e.target);
      }
    },
    // A plate starts to arrive a little before it reaches the screen.
    { rootMargin: "0px 0px 12% 0px" },
  );
  $$(".station:not(.arrival) .station-head, .station .hull, .after-note").forEach((el) => {
    el.setAttribute("data-reveal", "");
    reveal.observe(el);
  });
  // Focus finishes any fade at once, whether the plate is still waiting or already part way in.
  document.addEventListener("focusin", (e) => {
    const plate = (e.target as Element).closest?.("[data-reveal]");
    if (!plate || plate.getAttribute("data-reveal") === "now") return;
    plate.setAttribute("data-reveal", "now");
    plate.classList.add("in");
    reveal.unobserve(plate);
  });

  // The workshop map's packets run only while the map is on screen.
  const mapWatch = new IntersectionObserver((entries) =>
    entries.forEach((e) => (e.target as HTMLElement).toggleAttribute("data-visible", e.isIntersecting)),
  );
  $$(".system-map").forEach((el) => mapWatch.observe(el));

  if (!matchMedia("(pointer: fine)").matches) return;
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
