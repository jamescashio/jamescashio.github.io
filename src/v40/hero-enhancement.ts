import type { PageHost } from "./page-model";
import { conservesData } from "./media-policy";

export interface HeroEnhancement {
  active: () => boolean;
  render: (time: number, pointer: { x: number; y: number }) => void;
  dispose: () => void;
}

// Loaded only after the opening styles. The existing hero clock owns all drawing.
export function installLivingHero() {
  const hero = document.getElementById("top");
  const camera = hero?.querySelector<HTMLElement>(".hero-flight-camera");
  if (!hero || !camera) return;
  const desktop = matchMedia("(min-width: 1000px) and (hover: hover) and (pointer: fine)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let requested = false;
  const eligible = (app?: PageHost) =>
    app &&
    desktop.matches &&
    !reduced.matches &&
    !app.reduce &&
    !conservesData() &&
    !document.hidden &&
    app.heroVisible !== false;
  const start = () => {
    const app = window.cashioV40;
    if (app) app.stopLivingHero = stop;
    if (conservesData() && app?.heroEnhancement) {
      app.heroEnhancement.dispose();
      app.heroEnhancement = undefined;
    }
    if (requested || !app || !eligible(app) || !hero.isConnected) return;
    requested = true;
    const load = async () => {
      if (!eligible(app)) {
        requested = false;
        return;
      }
      try {
        const { createLivingHero } = await import("./living-hero");
        if (!eligible(app)) {
          requested = false;
          return;
        }
        const enhancement = await createLivingHero(app, hero, camera);
        if (!hero.isConnected) enhancement?.dispose();
        else app.heroEnhancement = enhancement ?? undefined;
      } catch {
        // The unchanged poster and SVG remain complete if the optional scene fails.
      }
    };
    if ("requestIdleCallback" in window) window.requestIdleCallback(() => void load(), { timeout: 3000 });
    else setTimeout(() => void load(), 0);
  };
  document.addEventListener("cashio-motion", start);
  document.addEventListener("visibilitychange", start);
  window.addEventListener("cashio-ready", start);
  desktop.addEventListener("change", start);
  reduced.addEventListener("change", start);
  navigator.connection?.addEventListener("change", start);
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) start();
  });
  const stop = () => {
    observer.disconnect();
    document.removeEventListener("cashio-motion", start);
    document.removeEventListener("visibilitychange", start);
    window.removeEventListener("cashio-ready", start);
    desktop.removeEventListener("change", start);
    reduced.removeEventListener("change", start);
    navigator.connection?.removeEventListener("change", start);
    window.cashioV40?.heroEnhancement?.dispose();
  };
  observer.observe(hero);
  start();
}
