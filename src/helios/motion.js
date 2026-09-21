import { MOTION_KEY, readMotionPreference, saveMotionPreference } from "./motion-preference.js";

export function setupMotion({ gsap, onChange, onSceneReady }) {
  const query = matchMedia("(prefers-reduced-motion: reduce)");
  const button = document.querySelector("#motion-btn");
  let preference = readMotionPreference();
  let enabled = preference !== "off" && !query.matches;
  let heroPromise = null;
  const overlayOpen = () => !!document.querySelector("dialog[open],#helios-studio,#helios-flight");
  function syncAmbient() {
    const blocked = overlayOpen();
    document.documentElement.classList.toggle("experience-open", blocked);
    document.documentElement.classList.toggle("page-hidden", document.hidden);
    document.querySelectorAll("main svg").forEach((svg) => {
      if (!blocked && !document.hidden && enabled && svg.closest("section")?.dataset.ambient === "on")
        svg.unpauseAnimations?.();
      else svg.pauseAnimations?.();
    });
    window.__heroPause?.(blocked || !enabled);
  }
  window.addEventListener("helios-overlay", syncAmbient);
  function apply() {
    enabled = preference !== "off" && !query.matches;
    document.documentElement.classList.toggle("motion-off", !enabled);
    button.setAttribute("aria-pressed", String(enabled));
    button.dataset.motionSource = query.matches ? "device" : "visitor";
    button.setAttribute(
      "aria-label",
      enabled
        ? "Motion on: pause animation"
        : query.matches
          ? "Motion off: follows your device setting"
          : "Motion off: resume animation",
    );
    button.querySelector("span").textContent = enabled ? "Motion on" : "Motion off";
    button.title = query.matches
      ? "Reduced motion follows your device setting"
      : enabled
        ? "Pause ambient motion"
        : "Resume ambient motion";
    if (!enabled) {
      document.querySelector(".hero").removeAttribute("data-arrival");
      gsap.globalTimeline.getChildren(false).forEach((animation) => {
        if (animation.repeat() === -1) animation.pause();
        else animation.progress(1).kill();
      });
    }
    document.querySelectorAll("[data-hero],[data-split],[data-stagger]>*").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    document.querySelectorAll("svg").forEach((svg) => {
      if (enabled && !overlayOpen() && !document.hidden && svg.closest("section")?.dataset.ambient === "on")
        svg.unpauseAnimations?.();
      else svg.pauseAnimations?.();
    });
    onChange(enabled);
    syncAmbient();
    window.dispatchEvent(new CustomEvent("helios-motion", { detail: enabled }));
  }
  button.addEventListener("click", () => {
    if (query.matches) return;
    preference = enabled ? "off" : "on";
    saveMotionPreference(preference);
    apply();
  });
  query.addEventListener("change", apply);
  window.addEventListener("storage", (event) => {
    if (event.key !== MOTION_KEY && event.key !== null) return;
    preference = readMotionPreference();
    apply();
  });
  apply();
  document.querySelectorAll("[data-count]").forEach((el) => {
    el.textContent = el.dataset.count;
  });
  document.querySelectorAll(".bar[data-w]").forEach((el) => {
    el.style.transform = `scaleX(${el.dataset.w})`;
  });
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const href = `#${entry.target.id}`;
        document.querySelectorAll(".nav nav a,.sections a").forEach((link) => {
          const active = link.getAttribute("href") === href;
          link.classList.toggle("on", active);
          if (active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      }
    },
    { rootMargin: "-20% 0px -55% 0px" },
  );
  document.querySelectorAll("main>section[id]").forEach((el) => observer.observe(el));
  const ambient = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      entry.target.dataset.ambient = entry.isIntersecting ? "on" : "off";
      entry.target.querySelectorAll("svg").forEach((svg) => {
        if (entry.isIntersecting && enabled && !document.hidden && !overlayOpen()) svg.unpauseAnimations?.();
        else svg.pauseAnimations?.();
      });
    }
  });
  document.querySelectorAll("section.block,.hero").forEach((el) => ambient.observe(el));
  document.addEventListener("visibilitychange", syncAmbient);
  const rail = document.querySelector("#railbar");
  let railFrame = 0;
  window.addEventListener(
    "scroll",
    () => {
      if (railFrame) return;
      railFrame = requestAnimationFrame(() => {
        railFrame = 0;
        rail.style.transform = `scaleX(${scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)})`;
      });
    },
    { passive: true },
  );

  function startHero() {
    if (!enabled || query.matches || document.hidden) return Promise.resolve();
    if (heroPromise) return heroPromise;
    heroPromise = import("./hero.js")
      .then(({ startHero: start }) => {
        start({ getMotion: () => enabled, onReady: onSceneReady });
      })
      .catch(() => {
        heroPromise = null;
        document.querySelector("#fallback").style.opacity = "1";
      });
    return heroPromise;
  }
  // The authored image stays visible. Only the explicit orbit action loads the optional renderer.
  const hero = document.querySelector(".hero");
  const poster = document.querySelector("#fallback");
  const arrive = () => {
    if (enabled && !document.hidden) hero.dataset.arrival = "on";
  };
  if (poster.complete && poster.naturalWidth) arrive();
  else poster.addEventListener("load", arrive, { once: true });
  window.__prepareHero = startHero;
  return { isEnabled: () => enabled };
}
