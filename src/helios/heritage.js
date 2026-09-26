import { $, $$, press } from "./dom.js";
import { gsap } from "gsap";
import { PILOTS } from "./heritage-data.js";

export function setupHeritage({ motion, say }) {
  $("#pilots").addEventListener("click", (e) => {
    const b = e.target.closest("[data-pilot]");
    if (!b) return;
    const k = b.dataset.pilot,
      P = PILOTS[k];
    press($("#pilots"), "data-pilot", k);
    $$("#hangar img.hp").forEach((image) => {
      const active = image.dataset.pilot === k;
      image.classList.toggle("on", active);
      image.setAttribute("aria-hidden", String(!active));
    });
    $("#hg-title").textContent = P.title;
    $("#hg-credit").textContent = P.credit;
    $("#hg-idx").textContent = P.idx;
    $("#hg-kick").textContent = P.kick;
    $("#hg-head").textContent = P.head;
    $("#hg-body").textContent = P.body;
    $("#hg-source").href = P.source;
    $("#hg-source").textContent = P.sourceLabel + " ↗";
    if (motion())
      gsap.fromTo(
        "#hg-card > *",
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "expo.out", overwrite: true },
      );
    say("FLIGHT HERITAGE", P.line, "think", 1800);
  });
}
