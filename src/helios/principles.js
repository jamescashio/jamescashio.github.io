import { $, press } from "./dom.js";
import { gsap } from "gsap";
import { PRINCIPLES as PR } from "./principles-data.js";

export function setupPrinciples({ scenes, motion }) {
  $("#pr-group").addEventListener("click", (e) => {
    const b = e.target.closest("[data-pr]");
    if (!b) return;
    const p = PR[+b.dataset.pr];
    press($("#pr-group"), "data-pr", b.dataset.pr);
    $("#pr-n").textContent = p.n;
    $("#pr-title").textContent = p.title;
    $("#pr-body").textContent = p.body;
    $("#pr-tag").textContent = p.tag;
    $("#pr-ring").textContent = p.ring;
    $("#pr-action").textContent = p.action[0];
    $("#pr-action").href = p.action[1];
    if (motion())
      gsap.fromTo(
        $("#pr-title").parentElement,
        { y: 6 },
        { y: 0, duration: 0.35, ease: "power2.out", overwrite: true },
      );
    scenes.selectPrinciple(+b.dataset.pr);
  });
  (function () {
    const eng = $("#engine"),
      rot = $("#eng-rot");
    let rx = 0,
      drag = null;
    const apply = () => {
      rot.style.transform = `rotate(${rx}deg)`;
      scenes.rotateEngine(rx);
    };
    eng.addEventListener("pointerdown", (e) => {
      drag = { x: e.clientX, r: rx };
      eng.setPointerCapture(e.pointerId);
    });
    eng.addEventListener("pointermove", (e) => {
      if (!drag) return;
      rx = drag.r + (e.clientX - drag.x) * 0.5;
      apply();
    });
    eng.addEventListener("pointerup", () => (drag = null));
    eng.addEventListener("pointercancel", () => (drag = null));
    eng.addEventListener("keydown", (e) => {
      if (["ArrowLeft", "ArrowRight", "Home"].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowLeft") {
        rx -= 10;
        apply();
      }
      if (e.key === "ArrowRight") {
        rx += 10;
        apply();
      }
      if (e.key === "Home") {
        rx = 0;
        apply();
      }
    });
    $("#eng-reset").addEventListener("click", () => {
      rx = 0;
      apply();
    });
  })();
}
