import { MOTION_KEY, readMotionPreference, saveMotionPreference } from "./motion-preference.js";
import { adoptStyles } from "./adopted-styles";
import FILM_STYLE from "./film.css?inline";
import { $, $$ } from "./dom.js";

const FILM_SRC = "/assets/celestial/helios-arrival.mp4";

// The film rules load with the film, so a visitor who never sees it never parses them.
let filmStyles = null;
function injectFilmStyle() {
  filmStyles ??= adoptStyles(FILM_STYLE);
}

/**
 * Every SVG under a root, typed for the SMIL pause and unpause calls.
 * @param {ParentNode} root
 * @param {string} [selector]
 * @returns {SVGSVGElement[]}
 */
const svgsIn = (root, selector = "svg") => /** @type {SVGSVGElement[]} */ (Array.from(root.querySelectorAll(selector)));
/**
 * Writes the authored counts and bar widths that the markup carries as data attributes.
 * @param {ParentNode} root
 */
function hydrateFigures(root) {
  $$("[data-count]", root).forEach((el) => {
    el.textContent = el.dataset.count;
  });
  $$(".bar[data-w]", root).forEach((el) => {
    el.style.transform = `scaleX(${el.dataset.w})`;
  });
}

/** @param {HTMLVideoElement | null} node */
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
  const button = $("#motion-btn");
  let preference = readMotionPreference();
  let enabled = preference !== "off" && !query.matches;
  let heroPromise = null;
  const overlayOpen = () => !!document.querySelector("dialog[open],#helios-studio,#helios-flight");
  function syncAmbient() {
    const blocked = overlayOpen();
    document.documentElement.classList.toggle("experience-open", blocked);
    document.documentElement.classList.toggle("page-hidden", document.hidden);
    svgsIn(document, "main svg").forEach((svg) => {
      if (!blocked && !document.hidden && enabled && svg.closest("section")?.dataset.ambient === "on")
        svg.unpauseAnimations?.();
      else svg.pauseAnimations?.();
    });
    window.__heroPause?.(blocked || !enabled);
    const heroNode = $(".hero");
    const filmNode = /** @type {HTMLVideoElement} */ ($("#hero-film"));
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
      // A toggle keeps its state in aria-pressed, so the name states the setting rather than an action.
      enabled ? "Motion on" : query.matches ? "Motion off, following your device setting" : "Motion off",
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
      releaseFilmNode(/** @type {HTMLVideoElement} */ ($("#hero-film")));
      gsap.globalTimeline.getChildren(false).forEach((animation) => {
        if (animation.repeat() === -1) animation.pause();
        else animation.progress(1).kill();
      });
    }
    $$("[data-hero],[data-split],[data-stagger]>*").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
    svgsIn(document).forEach((svg) => {
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
  hydrateFigures(document);
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
      /** @type {HTMLElement} */ (entry.target).dataset.ambient = entry.isIntersecting ? "on" : "off";
      svgsIn(entry.target).forEach((svg) => {
        if (entry.isIntersecting && enabled && !document.hidden && !overlayOpen()) svg.unpauseAnimations?.();
        else svg.pauseAnimations?.();
      });
    }
  });
  document.querySelectorAll("section.block,.hero").forEach((el) => ambient.observe(el));
  window.addEventListener("helios-room-ready", ({ detail: room }) => {
    hydrateFigures(room);
    ambient.observe(room);
    syncAmbient();
  });
  document.addEventListener("visibilitychange", syncAmbient);
  const rail = $("#railbar");
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
        $("#fallback").style.opacity = "1";
      });
    return heroPromise;
  }
  // The authored image stays visible. Only the explicit orbit action loads the optional renderer.
  const hero = $(".hero");
  const poster = /** @type {HTMLImageElement} */ ($("#fallback"));
  const deepLink = () => {
    const hash = location.hash;
    return Boolean(hash) && hash !== "#" && hash !== "#top";
  };
  function finishFilm() {
    const node = /** @type {HTMLVideoElement} */ ($("#hero-film"));
    if (hero.dataset.film === "playing") hero.dataset.film = "done";
    else hero.removeAttribute("data-film");
    if (enabled && !document.hidden && !query.matches) hero.dataset.arrival = "on";
    releaseFilmNode(node);
  }
  function mountFilm() {
    const existing = /** @type {HTMLVideoElement} */ ($("#hero-film"));
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
  // The arrival film greets a first visit. Returning visitors start from the still artwork.
  const ARRIVAL_KEY = "cashio-arrival-seen";
  const seenArrival = () => {
    try {
      return localStorage.getItem(ARRIVAL_KEY) === "1";
    } catch {
      return false;
    }
  };
  function startFilm() {
    const connection = navigator.connection;
    const constrained = connection?.saveData || /^(slow-2g|2g)$/.test(connection?.effectiveType || "");
    const compact = matchMedia("(max-width: 700px), (pointer: coarse)").matches;
    if (!enabled || query.matches || compact || constrained || document.hidden || deepLink() || overlayOpen()) {
      hero.removeAttribute("data-film");
      releaseFilmNode(/** @type {HTMLVideoElement} */ ($("#hero-film")));
      return;
    }
    if (seenArrival()) {
      hero.dataset.arrival = "on";
      return;
    }
    if (hero.dataset.film === "playing" || hero.dataset.film === "done") return;
    const film = mountFilm();
    const play = () => {
      if (!enabled || query.matches || document.hidden || overlayOpen()) return;
      if (hero.dataset.film === "done") return;
      hero.dataset.film = "playing";
      try {
        localStorage.setItem(ARRIVAL_KEY, "1");
      } catch {
        /* Remembering the arrival is optional. */
      }
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
  // The film waits for the page to finish loading and the browser to idle, so it never competes with first paint.
  const whenIdle = () =>
    window.requestIdleCallback ? requestIdleCallback(arrive, { timeout: 1500 }) : setTimeout(arrive, 200);
  const afterLoad = () =>
    document.readyState === "complete" ? whenIdle() : addEventListener("load", whenIdle, { once: true });
  if (poster.complete && poster.naturalWidth) afterLoad();
  else poster.addEventListener("load", afterLoad, { once: true });
  window.__prepareHero = startHero;
  return { isEnabled: () => enabled };
}
