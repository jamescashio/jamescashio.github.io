import { $ } from "./dom.js";
import { gsap } from "gsap";

export function setupSignature({ motion, say }) {
  const signatureImage = $("#sig-art");
  function restoreSignatureArtwork() {
    if (signatureImage.dataset.fallback) return;
    signatureImage.dataset.fallback = "original";
    signatureImage.src = "/v38/assets/celestial.jpg";
  }
  signatureImage.addEventListener("error", restoreSignatureArtwork);
  if (signatureImage.complete && !signatureImage.naturalWidth) restoreSignatureArtwork();
  let signatureTimer;
  const button = $("#sig-btn");
  const label = button.textContent;
  button.addEventListener("click", () => {
    clearTimeout(signatureTimer);
    button.textContent = "◇ Energize again";
    const pl = $("#sigplate");
    pl.classList.remove("on");
    void pl.offsetWidth;
    pl.classList.add("on");
    $("#sig-state").textContent = "ENERGIZED · GOLD INTENT";
    $("#sig-state").style.color = "var(--gold)";
    const b = $("#sigburst");
    gsap.killTweensOf(Array.from(b.children));
    b.replaceChildren();
    const radius = Math.min(pl.clientWidth * 0.44, 270);
    for (let i = 0; motion() && i < 16; i++) {
      const d = document.createElement("i");
      d.style.color = i % 4 === 0 ? "var(--cyan)" : "var(--gold)";
      b.appendChild(d);
      const a = (i / 16) * Math.PI * 2 - 0.1;
      gsap.fromTo(
        d,
        { x: Math.cos(a) * radius * 0.5, y: Math.sin(a) * radius * 0.24, opacity: 0.8, scale: 0.7 },
        {
          x: Math.cos(a) * radius,
          y: Math.sin(a) * radius * 0.48,
          opacity: 0,
          scale: 0.2,
          duration: 1.4,
          ease: "expo.out",
          delay: (i % 4) * 0.04,
        },
      );
    }
    say("SIGNATURE", "Energized. Gold intent, blue possibility.", "yes", 2200);
    signatureTimer = setTimeout(() => {
      gsap.killTweensOf(Array.from(b.children));
      b.replaceChildren();
      pl.classList.remove("on");
      button.textContent = label;
      $("#sig-state").textContent = "DORMANT · GOLD INTENT";
      $("#sig-state").style.color = "";
    }, 4000);
  });
}
