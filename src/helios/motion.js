import { MOTION_KEY, readMotionPreference, saveMotionPreference } from "./motion-preference.js";

const FILM_SRC = "/assets/celestial/helios-arrival.mp4";
const FILM_STYLE = [
  ".hero-film{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:67% 50%;pointer-events:none;opacity:0;z-index:0;transform:scale(1.08);transform-origin:67% 50%}",
  ".hero[data-film=playing] .hero-film{opacity:1;animation:helios-film-push 6.4s cubic-bezier(.22,1,.36,1) forwards}",
  ".hero[data-film=playing] .vignette{background:linear-gradient(90deg,rgba(4,7,14,.9),rgba(4,7,14,.55) 38%,rgba(4,7,14,.08) 72%),linear-gradient(0deg,var(--void),transparent 32%,rgba(4,7,14,.22))}",
  ".hero[data-film=playing] h1{text-shadow:0 10px 48px rgba(4,7,14,.9)}",
  '.hero[data-film=playing]::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,#38e1ff,var(--gold));transform-origin:left;transform:scaleX(0);animation:helios-film-meter 6.4s linear forwards;pointer-events:none;z-index:4}',
  ".hero[data-film=playing] .cta .btn.gold,.hero[data-film=done] .cta .btn.gold{box-shadow:0 0 34px rgba(242,200,122,.4)}",
  ".hero.fold-active canvas.gl{opacity:.82}",
  ".motion-off .hero canvas.gl,.experience-open .hero canvas.gl{opacity:0}",
  '.plate::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(105deg,transparent 40%,rgba(56,225,255,.14) 50%,transparent 60%);transform:translateX(-120%)}',
  ".plate:hover::after{animation:helios-plate-sweep 1.1s cubic-bezier(.22,1,.36,1) forwards}",
  "@keyframes helios-film-push{to{transform:scale(1)}}",
  "@keyframes helios-film-meter{to{transform:scaleX(1)}}",
  "@keyframes helios-plate-sweep{to{transform:translateX(120%)}}",
  ".motion-off .hero-film,.experience-open .hero-film{display:none}",
  ".page-hidden .hero[data-film=playing]::after,.motion-off .hero::after{animation-play-state:paused}",
  ".motion-off .plate::after{display:none}",
  "@media (max-width:700px){.hero-film{height:350px;object-position:78% 20%;transform-origin:78% 20%}}",
  "@media (prefers-reduced-motion:reduce){.hero-film,.hero[data-film=playing]::after,.plate::after{display:none!important;animation:none!important}}",
].join("");

function injectFilmStyle() {
  if (document.getElementById("helios-film-style")) return;
  const style = document.createElement("style");
  style.id = "helios-film-style";
  style.textContent = FILM_STYLE;
  document.head.appendChild(style);
}

function releaseFilmNode(node) {
  if (!node) return;
  node.pause();
  node.removeAttribute("src");
  node.querySelectorAll("source").forEach((source) => source.remove());
  try {
    node.load();
  } catch {
    /* A detached media element can refuse load(); the node is being discarded. */
  }
  node.remove();
}

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
    const heroNode = document.querySelector(".hero");
    const filmNode = document.querySelector("#hero-film");
    if (blocked) {
      if (heroNode?.dataset.film === "playing") {
        heroNode.dataset.film = "done";
        if (enabled && !document.hidden) heroNode.dataset.arrival = "on";
      }
      releaseFilmNode(filmNode);
    } else if (filmNode && heroNode) {
      if (!enabled || document.hidden) filmNode.pause();
      else if (heroNode.dataset.film === "playing") void filmNode.play()?.catch?.(() => {});
    }
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
      document.querySelector(".hero")?.removeAttribute("data-film");
      releaseFilmNode(document.querySelector("#hero-film"));
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
  window.addEventListener("helios-room-ready", ({ detail: room }) => {
    room.querySelectorAll("[data-count]").forEach((el) => {
      el.textContent = el.dataset.count;
    });
    room.querySelectorAll(".bar[data-w]").forEach((el) => {
      el.style.transform = `scaleX(${el.dataset.w})`;
    });
    ambient.observe(room);
    syncAmbient();
  });
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
  const deepLink = () => {
    const hash = location.hash;
    return Boolean(hash) && hash !== "#" && hash !== "#top";
  };
  function finishFilm() {
    const node = document.querySelector("#hero-film");
    if (hero.dataset.film === "playing") hero.dataset.film = "done";
    else hero.removeAttribute("data-film");
    if (enabled && !document.hidden && !query.matches) hero.dataset.arrival = "on";
    releaseFilmNode(node);
  }
  function mountFilm() {
    const existing = document.querySelector("#hero-film");
    if (existing) return existing;
    injectFilmStyle();
    const film = document.createElement("video");
    film.id = "hero-film";
    film.className = "hero-film";
    film.muted = true;
    film.defaultMuted = true;
    film.autoplay = false;
    film.playsInline = true;
    film.setAttribute("muted", "");
    film.setAttribute("playsinline", "");
    film.setAttribute("webkit-playsinline", "");
    film.preload = "auto";
    film.setAttribute("aria-hidden", "true");
    film.tabIndex = -1;
    const source = document.createElement("source");
    source.src = FILM_SRC;
    source.type = "video/mp4";
    film.appendChild(source);
    (poster.closest("picture") || poster).after(film);
    return film;
  }
  function startFilm() {
    const connection = navigator.connection;
    const constrained = connection?.saveData || /^(slow-2g|2g)$/.test(connection?.effectiveType || "");
    const compact = matchMedia("(max-width: 700px), (pointer: coarse)").matches;
    if (!enabled || query.matches || compact || constrained || document.hidden || deepLink() || overlayOpen()) {
      hero.removeAttribute("data-film");
      releaseFilmNode(document.querySelector("#hero-film"));
      return;
    }
    if (hero.dataset.film === "playing" || hero.dataset.film === "done") return;
    const film = mountFilm();
    const play = () => {
      if (!enabled || query.matches || document.hidden || overlayOpen()) return;
      if (hero.dataset.film === "done") return;
      hero.dataset.film = "playing";
      const run = film.play();
      if (run && typeof run.catch === "function") {
        run.catch(() => {
          if (hero.dataset.film === "playing") finishFilm();
        });
      }
    };
    film.addEventListener("ended", finishFilm, { once: true });
    if (film.readyState >= 2) play();
    else film.addEventListener("canplay", play, { once: true });
    film.load();
  }
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (overlayOpen()) return;
    if (hero.dataset.film === "playing") {
      event.preventDefault();
      finishFilm();
    }
  });
  const arrive = () => {
    injectFilmStyle();
    startFilm();
  };
  if (poster.complete && poster.naturalWidth) arrive();
  else poster.addEventListener("load", arrive, { once: true });
  window.__prepareHero = startHero;
  return { isEnabled: () => enabled };
}
