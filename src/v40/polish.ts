declare global {
  interface Window {
    cashioAsset?: (value: string | null) => string | null;
  }
}
/* Progressive improvements around the original Claude Design component. */
import { destinations } from "./destinations.ts";
import { presentation } from "./evidence.ts";
import { missionDeskMarkup, bindMissionDesk } from "./mission-desk.ts";
(() => {
  const root = document.documentElement;
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  let preference: string | null | undefined;
  try {
    preference = localStorage.getItem("cashio-v40-motion");
  } catch {
    /* Optional browser capability; keep the fallback available. */
  }
  root.dataset.motion = preference === "off" || mq.matches ? "off" : "on";
  function syncButtons() {
    const off = root.dataset.motion === "off";
    document.querySelectorAll<HTMLElement>("[data-motion-toggle]").forEach((b) => {
      const label = off ? "Resume motion" : "Pause motion";
      if (b.getAttribute("aria-label") !== label) b.setAttribute("aria-label", label);
      if (b.getAttribute("aria-pressed") !== String(off)) b.setAttribute("aria-pressed", String(off));
      if (b.title !== label) b.title = label;
      const text = label;
      if (b.textContent !== text) b.textContent = text;
    });
  }
  function motion(value: string, save = true) {
    root.dataset.motion = value;
    if (save) {
      preference = value;
      try {
        localStorage.setItem("cashio-v40-motion", value);
      } catch {
        /* Optional browser capability; keep the fallback available. */
      }
    }
    syncButtons();
    document.dispatchEvent(new Event("cashio-motion"));
  }
  mq.addEventListener("change", (e) => motion(e.matches ? "off" : preference || "on", false));
  document.addEventListener("visibilitychange", () => (root.dataset.background = String(document.hidden)));
  const readyVideos = new WeakSet<Element>();
  const videoObserver =
    typeof IntersectionObserver === "function"
      ? new IntersectionObserver(
          (entries) => {
            for (const { target, isIntersecting } of entries) {
              if (!isIntersecting || target.closest<HTMLElement>("details:not([open])")) continue;
              readyVideos.add(target);
              videoObserver?.unobserve(target);
              bind(target);
            }
          },
          { rootMargin: "250px 0px" },
        )
      : null;
  // The export stores bindings in attributes. Wait for resolved values before
  // assigning src/poster; this also prevents requests for literal {{ expressions }}.
  const bind = (el: Node) => {
    if (!(el instanceof HTMLElement)) return;
    if (el instanceof HTMLVideoElement) {
      if (el.closest<HTMLElement>("details:not([open])")) return;
      if (videoObserver && el.id !== "cinema-video" && !readyVideos.has(el)) {
        videoObserver.observe(el);
        return;
      }
    }
    for (const attr of ["src", "poster"]) {
      const raw = el.getAttribute("data-bound-" + attr);
      let val = window.cashioAsset ? window.cashioAsset(raw) : raw;
      if (attr === "poster" && el instanceof HTMLVideoElement && el.dataset.v === "hover") {
        const image = el.parentElement?.querySelector<HTMLImageElement>("img[srcset]");
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
        if (el instanceof HTMLVideoElement) {
          el.muted = true;
          el.defaultMuted = true;
          el.playsInline = true;
        }
        el.setAttribute(attr, val);
        if (el instanceof HTMLVideoElement && attr === "src") document.dispatchEvent(new Event("cashio-media"));
      }
    }
    el.querySelectorAll<HTMLElement>("[data-bound-src],[data-bound-poster]").forEach(bind);
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
      if (!(event.target instanceof Element)) return;
      if (!(event.target instanceof HTMLDetailsElement)) return;
      if (event.target.open) bind(event.target);
      else event.target.querySelectorAll<HTMLVideoElement>("video").forEach((video) => video.pause());
      document.dispatchEvent(new Event("cashio-media"));
    },
    true,
  );

  let panel: HTMLDialogElement,
    missionDesk: ReturnType<typeof bindMissionDesk>,
    opener: HTMLElement | null,
    cinema: HTMLElement | null | undefined,
    cinemaOpener: HTMLElement | null,
    inerted: HTMLElement[] = [];
  const chapters = destinations;
  function openMission(trigger?: HTMLElement) {
    if (!panel || cinema || document.querySelector<HTMLElement>("#helios-flight, #helios-studio, .v40-scene-status")!)
      return;
    opener = trigger || (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    panel.showModal();
    missionDesk.reset();
    // Opening the phone menu should reveal destinations without summoning the keyboard.
    const initialFocus = window.matchMedia("(max-width: 700px)").matches
      ? panel.querySelector<HTMLElement>("[data-mission-close]")!
      : panel.querySelector<HTMLInputElement>("input")!;
    initialFocus.focus({ preventScroll: true });
  }
  function ready() {
    if (panel) return;
    panel = document.createElement("dialog");
    panel.className = "mission-panel";
    panel.id = "mission-dialog";
    panel.setAttribute("aria-labelledby", "mission-title");
    panel.innerHTML = missionDeskMarkup(chapters, presentation);
    document.body.append(panel);
    missionDesk = bindMissionDesk(panel);
    panel.addEventListener("close", () => {
      const app = window.cashioV40;
      if (app && app.heroVisible !== false && app.starLoop) {
        cancelAnimationFrame(app.raf);
        app.starLoop();
      }
      // The close event is queued. Preserve a newer focus destination selected
      // after close(), including a film's keyboard controls or a chapter link.
      const focused = document.activeElement;
      if (!focused || focused === document.body || panel.contains(focused)) opener?.focus({ preventScroll: true });
    });
    panel.addEventListener("click", (e) => {
      if (!(e.target instanceof Element)) return;
      if (e.target.closest<HTMLElement>("[data-mission-close]")) panel.close();
      // Guided routes live inside Mission Control: one finder, with the tour one step away.
      const route = e.target.closest<HTMLElement>("[data-mission-route]");
      const app = window.cashioV40;
      if (route && app) {
        const back =
          opener && opener !== document.body
            ? opener
            : [...document.querySelectorAll<HTMLElement>("[data-mission-open]")].find((el) => el.offsetParent) || null;
        panel.close();
        back?.focus({ preventScroll: true });
        app.discoveryOpener = back;
        setTimeout(() => app.setState({ discovery: route.dataset.missionRoute! }), 0);
        return;
      }
      const a = e.target.closest<HTMLElement>("[data-chapter]");
      if (a) {
        panel.close();
        const section = document.getElementById(a.dataset.chapter!);
        setTimeout(() => {
          section?.setAttribute("tabindex", "-1");
          section?.focus({ preventScroll: true });
          section?.scrollIntoView({
            block: "start",
            behavior: root.dataset.motion === "off" ? "instant" : "smooth",
          });
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
          await new Promise<void>((resolve) => window.addEventListener("load", () => resolve(), { once: true }));
        requestAnimationFrame(() => {
          cleanup();
          if (
            cancelled ||
            location.hash !== initialHash ||
            document.querySelector<HTMLElement>("dialog[open],#helios-flight,#helios-studio")!
          )
            return;
          let id;
          try {
            id = decodeURIComponent(location.hash.slice(1));
          } catch {
            return;
          }
          document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "instant" });
        });
      })();
    }
  }
  window.addEventListener("cashio-ready", ready);
  document.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
    const toggle = e.target.closest<HTMLElement>("[data-motion-toggle]");
    if (toggle) motion(root.dataset.motion === "off" ? "on" : "off");
    const trigger = e.target.closest<HTMLElement>("[data-mission-open]");
    if (trigger) openMission(trigger);
  });
  document.addEventListener("keydown", (e) => {
    if (!(e.target instanceof Element)) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (cinema) return;
      if (panel?.open) panel.close();
      else openMission();
    }
    const tab = e.target.closest<HTMLElement>('[role="tab"]');
    if (tab && ["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      const tabs = [...tab.closest<HTMLElement>('[role="tablist"]')!.querySelectorAll<HTMLElement>('[role="tab"]')];
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
      const targets = [
        ...cinema.querySelectorAll<HTMLElement>('button,video[controls],summary,a[href],[tabindex="0"]'),
      ].filter((el) => el.getClientRects().length);
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
    if (next?.closest<HTMLElement>("x-dc")) return;
    if (next === cinema) return;
    if (next) {
      cinema = next;
      cinemaOpener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      for (let node: HTMLElement | null = cinema; node && node !== document.body; node = node.parentElement) {
        for (const sibling of node.parentElement!.children) {
          if (sibling instanceof HTMLElement && sibling !== node && !sibling.inert) {
            sibling.inert = true;
            inerted.push(sibling);
          }
        }
      }
      cinema.querySelector<HTMLElement>("button")?.focus();
    } else {
      cinema = null;
      inerted.forEach((el) => (el.inert = false));
      inerted = [];
      cinemaOpener?.focus({ preventScroll: true });
    }
  }).observe(root, { subtree: true, childList: true });
})();
