/* Progressive improvements around the original Claude Design component. */
import { destinations } from "./destinations.js";
(() => {
  const root = document.documentElement;
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  let preference;
  try {
    preference = localStorage.getItem("cashio-v40-motion");
  } catch (_) {
    /* Optional browser capability; keep the fallback available. */
  }
  root.dataset.motion = preference === "off" || mq.matches ? "off" : "on";
  function syncButtons() {
    const off = root.dataset.motion === "off";
    document.querySelectorAll("[data-motion-toggle]").forEach((b) => {
      const label = off ? "Resume motion" : "Pause motion";
      if (b.getAttribute("aria-label") !== label) b.setAttribute("aria-label", label);
      if (b.getAttribute("aria-pressed") !== String(off)) b.setAttribute("aria-pressed", String(off));
      if (b.title !== label) b.title = label;
      const text = b.classList.contains("motion-control") ? (off ? "▷" : "Ⅱ") : label;
      if (b.textContent !== text) b.textContent = text;
    });
  }
  function motion(value, save = true) {
    root.dataset.motion = value;
    if (save) {
      preference = value;
      try {
        localStorage.setItem("cashio-v40-motion", value);
      } catch (_) {
        /* Optional browser capability; keep the fallback available. */
      }
    }
    syncButtons();
    document.dispatchEvent(new Event("cashio-motion"));
  }
  mq.addEventListener("change", (e) => motion(e.matches ? "off" : preference || "on", false));
  document.addEventListener("visibilitychange", () => (root.dataset.background = String(document.hidden)));
  const readyVideos = new WeakSet();
  const videoObserver =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          (entries) => {
            for (const { target, isIntersecting } of entries) {
              if (!isIntersecting || target.closest("details:not([open])")) continue;
              readyVideos.add(target);
              videoObserver.unobserve(target);
              bind(target);
            }
          },
          { rootMargin: "250px 0px" },
        )
      : null;
  // The export stores bindings in attributes. Wait for resolved values before
  // assigning src/poster; this also prevents requests for literal {{ expressions }}.
  const bind = (el) => {
    if (el.nodeType !== 1) return;
    if (el.tagName === "VIDEO") {
      if (el.closest("details:not([open])")) return;
      if (videoObserver && el.id !== "cinema-video" && !readyVideos.has(el)) {
        videoObserver.observe(el);
        return;
      }
    }
    for (const attr of ["src", "poster"]) {
      const raw = el.getAttribute("data-bound-" + attr);
      let val = window.cashioAsset ? window.cashioAsset(raw) : raw;
      if (attr === "poster" && el.dataset.v === "hover") {
        const image = el.parentElement?.querySelector("img[srcset]");
        if (image) {
          val = image.currentSrc || image.srcset.split(",")[0].trim().split(/\s+/)[0];
          if (!image.currentSrc) {
            image.addEventListener(
              "load",
              () => {
                if (el.isConnected && image.currentSrc) el.poster = image.currentSrc;
              },
              { once: true },
            );
          }
        }
      }
      if (val && !val.includes("{{") && val !== el.getAttribute(attr)) {
        if (el.tagName === "VIDEO") {
          el.muted = true;
          el.defaultMuted = true;
          el.playsInline = true;
        }
        el.setAttribute(attr, val);
        if (el.tagName === "VIDEO" && attr === "src") document.dispatchEvent(new Event("cashio-media"));
      }
    }
    el.querySelectorAll("[data-bound-src],[data-bound-poster]").forEach(bind);
  };
  new MutationObserver((records) => {
    for (const r of records) {
      if (r.type === "attributes") bind(r.target);
      else r.addedNodes.forEach(bind);
    }
  }).observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["data-bound-src", "data-bound-poster"],
  });
  document.addEventListener(
    "toggle",
    (event) => {
      if (event.target.tagName !== "DETAILS") return;
      if (event.target.open) bind(event.target);
      else event.target.querySelectorAll("video").forEach((video) => video.pause());
      document.dispatchEvent(new Event("cashio-media"));
    },
    true,
  );

  let panel,
    opener,
    cinema,
    cinemaOpener,
    inerted = [];
  const chapters = destinations;
  function openMission(trigger) {
    if (!panel || cinema || document.querySelector("#helios-flight, #helios-studio, .v40-scene-status")) return;
    opener = trigger || document.activeElement;
    panel.querySelector("input").value = "";
    filter("");
    panel.showModal();
    panel.querySelector("input").focus();
  }
  function filter(query) {
    let count = 0;
    panel.querySelectorAll("[data-chapter]").forEach((a) => {
      a.hidden = !a.dataset.search.includes(query.toLowerCase().trim());
      if (!a.hidden) count++;
    });
    panel.querySelector(".mission-empty").hidden = count > 0;
  }
  function ready() {
    if (panel) return;
    panel = document.createElement("dialog");
    panel.className = "mission-panel";
    panel.id = "mission-dialog";
    panel.setAttribute("aria-labelledby", "mission-title");
    panel.innerHTML = `<div class="mission-head"><h2 id="mission-title">Mission Control</h2><button type="button" data-mission-close aria-label="Close Mission Control">ESC ×</button></div><label class="mission-search"><span>Where are we going?</span><input type="search" placeholder="Find a world, experiment or answer…" autocomplete="off"></label><nav class="mission-results" aria-label="All chapters">${chapters.map(([id, title, desc], i) => `<a href="#${id}" data-chapter="${id}" data-search="${(title + " " + desc).toLowerCase()}"><small>${String(i + 1).padStart(2, "0")}</small><strong>${title}</strong><span aria-hidden="true">↗</span></a>`).join("")}<p class="mission-empty" hidden>No matching destination. Try “films” or “Doug”.</p></nav><div class="mission-foot"><span>V41 · Eagle<br>Human in command. Towel optional.</span><button type="button" data-motion-toggle>Pause motion</button></div>`;
    document.body.append(panel);
    panel.addEventListener("close", () => opener?.focus({ preventScroll: true }));
    panel.querySelector("input").addEventListener("input", (e) => filter(e.target.value));
    panel.addEventListener("click", (e) => {
      if (e.target.closest("[data-mission-close]")) panel.close();
      const a = e.target.closest("[data-chapter]");
      if (a) {
        panel.close();
        const section = document.getElementById(a.dataset.chapter);
        setTimeout(() => {
          section?.setAttribute("tabindex", "-1");
          section?.focus({ preventScroll: true });
        }, 0);
      }
      if (e.target === panel) {
        const r = panel.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) panel.close();
      }
    });
    syncButtons();
    if (location.hash) {
      const initialHash = location.hash;
      let cancelled = false;
      const intents = ["wheel", "touchstart", "pointerdown", "keydown"];
      const cleanup = () => intents.forEach((type) => window.removeEventListener(type, cancel, true));
      const cancel = () => {
        cancelled = true;
        cleanup();
      };
      intents.forEach((type) => window.addEventListener(type, cancel, { capture: true, passive: true }));
      (async () => {
        await document.fonts.ready;
        if (cancelled) return;
        // Reload restoration can run after the client selects its section.
        // Align after loading and the browser's restoration, including cached loads.
        if (document.readyState !== "complete")
          await new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
        requestAnimationFrame(() => {
          cleanup();
          if (
            cancelled ||
            location.hash !== initialHash ||
            document.querySelector("dialog[open],#helios-flight,#helios-studio")
          )
            return;
          let id;
          try {
            id = decodeURIComponent(location.hash.slice(1));
          } catch (_) {
            return;
          }
          document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "instant" });
        });
      })();
    }
  }
  window.addEventListener("cashio-ready", ready);
  document.addEventListener("click", (e) => {
    const toggle = e.target.closest("[data-motion-toggle]");
    if (toggle) motion(root.dataset.motion === "off" ? "on" : "off");
    const trigger = e.target.closest("[data-mission-open]");
    if (trigger) openMission(trigger);
  });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (cinema) return;
      panel?.open ? panel.close() : openMission();
    }
    const tab = e.target.closest?.('[role="tab"]');
    if (tab && ["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      const tabs = [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];
      let i = tabs.indexOf(tab);
      i =
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? tabs.length - 1
            : (i + (e.key === "ArrowDown" ? 1 : -1) + tabs.length) % tabs.length;
      tabs[i].click();
      tabs[i].focus();
    }
    if (cinema && e.key === "Tab") {
      const targets = [...cinema.querySelectorAll('button,video[controls],summary,a[href],[tabindex="0"]')].filter(
        (el) => el.getClientRects().length,
      );
      const first = targets[0],
        last = targets.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  });
  // Focus the original screening room, keep keyboard focus inside it, and return
  // visitors to the control they used. No visual changes to the authored cinema.
  new MutationObserver(() => {
    if (!window.cashioV40) return;
    const next = document.getElementById("cinema-dialog");
    if (next?.closest("x-dc")) return;
    if (next === cinema) return;
    if (next) {
      cinema = next;
      cinemaOpener = document.activeElement;
      for (let node = cinema; node && node !== document.body; node = node.parentElement) {
        for (const sibling of node.parentElement.children) {
          if (sibling !== node && !sibling.inert) {
            sibling.inert = true;
            inerted.push(sibling);
          }
        }
      }
      cinema.querySelector("button")?.focus();
    } else {
      cinema = null;
      inerted.forEach((el) => (el.inert = false));
      inerted = [];
      cinemaOpener?.focus({ preventScroll: true });
    }
  }).observe(root, { subtree: true, childList: true });
})();
