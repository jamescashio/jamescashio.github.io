export function setupMotion({ gsap, onChange, onSceneReady }) {
  const query = matchMedia("(prefers-reduced-motion: reduce)");
  const button = document.querySelector("#motion-btn");
  let enabled = !query.matches;
  let heroPromise = null;
  function apply(on) {
    enabled = on && !query.matches;
    document.documentElement.classList.toggle("motion-off", !enabled);
    button.setAttribute("aria-pressed", String(enabled));
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
      if (enabled && svg.closest("section")?.dataset.ambient === "on") svg.unpauseAnimations?.();
      else svg.pauseAnimations?.();
    });
    onChange(enabled);
    window.__heroPause?.(!enabled);
    window.dispatchEvent(new CustomEvent("helios-motion", { detail: enabled }));
  }
  button.addEventListener("click", () => {
    apply(!enabled);
    if (enabled) void startHero();
  });
  query.addEventListener("change", () => {
    apply(!query.matches);
    if (enabled) void startHero();
  });
  apply(enabled);
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
        if (entry.isIntersecting && enabled && !document.hidden) svg.unpauseAnimations?.();
        else svg.pauseAnimations?.();
      });
    }
  });
  document.querySelectorAll("section.block").forEach((el) => ambient.observe(el));
  document.addEventListener("visibilitychange", () => {
    document.documentElement.classList.toggle("page-hidden", document.hidden);
    document.querySelectorAll("section.block svg").forEach((svg) => {
      if (!document.hidden && enabled && svg.closest("section")?.dataset.ambient === "on") svg.unpauseAnimations?.();
      else svg.pauseAnimations?.();
    });
  });
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
  // The complete authored scene arrives first; a visitor's engagement activates the live orbit.
  document.querySelector(".hero").addEventListener("pointermove", startHero, { once: true, passive: true });
  document.querySelector("#fold-btn").addEventListener("focus", startHero, { once: true });
  document.querySelector("#fold-btn").addEventListener("pointerenter", startHero, { once: true });
  window.__prepareHero = startHero;
  return { isEnabled: () => enabled };
}
