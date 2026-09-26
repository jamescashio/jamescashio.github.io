import { setupMissionControl } from "./mission-control.js";
import { parseExperiment } from "../odyssey/study-experiment";
import { parseMissionHash } from "../odyssey/flight-plan";
import { createWarp, setupFlightPrefetch } from "./flight-jump.js";
import { $, $$, closestTarget } from "./dom.js";

const sceneKind = (hash) =>
  /^#flight=(board|hull|blackout|permission)$/.test(hash)
    ? "flight"
    : /^#(?:signature|lensing(?:&.*)?|film(?:=(?:sanctuary|lightwake|signature|awakening|arrival))?)$/.test(hash)
      ? "studio"
      : null;
const aliases = {
  "#observatory": "#principles",
  "#sovereign-world": "#starship",
  "#smart-routing": "#work",
  "#boundary-comparison": "#work",
};

/** Native links, shared scenes and browser history stay in one document. */
export function setupNavigation({ studies, select, mission, motion, rooms }) {
  const loader = /** @type {HTMLDialogElement} */ ($("#scene-loader"));
  let routeGeneration = 0;
  let scene = null,
    activeKind = null,
    pending = false,
    generation = 0;
  let returnPoint = null,
    sequence = 0,
    lastURL = "";
  const returns = new Map();
  let loaderTimer = 0;
  const notify = () => window.dispatchEvent(new Event("helios-overlay"));
  const menu = setupMissionControl({ studies, canOpen: () => !loader.open && !scene && !pending, onToggle: notify });
  const dialog = menu.dialog;
  for (const link of $$("a[data-room-route]")) link.setAttribute("href", link.dataset.roomRoute);
  const warp = createWarp({
    onHalt: () => {
      clearTimeout(loaderTimer);
      if (pending && !loader.open) loader.showModal();
    },
  });
  setupFlightPrefetch(() => import("./flight-island"));
  function focusSection(id, shouldScroll = true) {
    const target = document.getElementById(id);
    if (!target) return;
    // A shared address opens the workbench before focus or the fragment can land inside hidden content.
    let revealed = false;
    const workbench = /** @type {HTMLDetailsElement | null} */ (
      target.querySelector(":scope > .wrap > details.workbench-disclosure")
    );
    if (workbench && !workbench.open) {
      workbench.open = true;
      revealed = true;
    }
    for (let parent = target; parent; parent = parent.parentElement) {
      if (parent instanceof HTMLDetailsElement && !parent.open) {
        parent.open = true;
        revealed = true;
      }
    }
    const heading = /** @type {HTMLElement} */ (
      target.querySelector("h1,h2,h3") || (target.matches("details") ? target.querySelector("summary") : target)
    );
    if (!heading.matches("summary")) heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
    // Move focus and its heading together. Smooth scrolling can drift as skipped sections lay out after resize.
    if (shouldScroll || revealed) target.scrollIntoView({ behavior: "instant", block: "start" });
    return heading;
  }
  // An open scene names the browser tab; closing it restores the page or room title it opened from.
  let titleBeforeScene = null;
  function nameScene(hash, kind) {
    const name =
      kind === "flight"
        ? "First flight"
        : hash === "#signature"
          ? "Celestial Forge"
          : hash.startsWith("#lensing")
            ? "Lensing Observatory"
            : hash === "#film=sanctuary"
              ? "The Sanctuary"
              : "The Cinema";
    titleBeforeScene ??= document.title;
    document.title = `${name} · cAshIo`;
  }
  function dispose() {
    generation++;
    pending = false;
    clearTimeout(loaderTimer);
    warp.end();
    loader.close();
    scene?.dispose();
    scene = null;
    activeKind = null;
    if (titleBeforeScene !== null) document.title = titleBeforeScene;
    titleBeforeScene = null;
    notify();
  }
  function closeScene(destination) {
    const fallback = sceneKind(location.hash) === "flight" ? "" : "#studios";
    if (destination) {
      const hash = destination.startsWith("build=")
        ? `#${destination}`
        : destination === "smart-routing"
          ? "#build-story"
          : `#${destination}`;
      navigate(hash, null, true);
      return;
    }
    dispose();
    if (history.state?.heliosReturn) {
      history.back();
    } else {
      returnPoint = null;
      history.replaceState(null, "", location.pathname + location.search + fallback);
      route(fallback || "#top");
    }
  }
  loader.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeScene();
  });
  document.querySelector("#scene-cancel").addEventListener("click", () => closeScene());
  document.querySelector("#scene-reload").addEventListener("click", () => location.reload());
  async function launch(hash, kind) {
    if (scene && activeKind === "studio" && kind === "studio") {
      scene.update(hash);
      nameScene(hash, kind);
      return;
    }
    dispose();
    nameScene(hash, kind);
    pending = true;
    const token = ++generation;
    let failed = false;
    loader.querySelector("h2").textContent = "Preparing your scene…";
    loader.querySelector("p").textContent = "You can return to the site at any time.";
    document.querySelector("#scene-cancel").textContent = "Cancel opening";
    $("#scene-reload").hidden = true;
    // Boarding the starship is a jump, not a wait: the warp covers loading and the loader appears only if it is slow.
    const jumping = kind === "flight" && motion() && warp.start();
    if (jumping) {
      loaderTimer = setTimeout(() => {
        if (pending && token === generation && !loader.open) loader.showModal();
      }, 1400);
    } else loader.showModal();
    notify();
    try {
      // Each island module is awaited on its own branch so the opener keeps that module's exports.
      const opener =
        kind === "flight" ? (await import("./flight-island")).openFlight : (await import("./studio-island")).openStudio;
      if (token !== generation) return;
      if (jumping) await warp.settle();
      if (token !== generation) return;
      clearTimeout(loaderTimer);
      loader.close();
      activeKind = kind;
      scene =
        kind === "flight"
          ? /** @type {typeof import("./flight-island").openFlight} */ (opener)({
              motion: motion(),
              step: hash.slice(8),
              onClose: closeScene,
              arrive: jumping && motion(),
            })
          : /** @type {typeof import("./studio-island").openStudio} */ (opener)({
              motion: motion(),
              hash,
              onClose: () => closeScene(),
              onNavigate: (next) => navigate(next, null, true),
            });
      if (jumping) warp.end();
    } catch {
      if (token !== generation) return;
      clearTimeout(loaderTimer);
      warp.end();
      if (!loader.open) loader.showModal();
      failed = true;
      loader.querySelector("h2").textContent = "This scene couldn’t open.";
      loader.querySelector("p").textContent =
        "Your place is saved. Return to the site, or reload this scene to try again.";
      document.querySelector("#scene-cancel").textContent = "Back to the site";
      $("#scene-reload").hidden = false;
    } finally {
      if (token === generation) {
        pending = failed;
        if (!failed) loader.close();
        notify();
      }
    }
  }
  async function route(hash, initial = false, fromHistory = false) {
    const routeToken = ++routeGeneration;
    lastURL = location.href;
    hash = aliases[hash] || hash;
    const kind = sceneKind(hash);
    if (kind) {
      const saved = history.state?.heliosReturn;
      if (saved) returnPoint = returns.get(saved.id) || saved;
      void launch(hash, kind);
      return;
    }
    dispose();
    let focusBeforeLoad = document.activeElement;
    const leftRoom = document.documentElement.dataset.room;
    const pageChanged = rooms.sync(hash);
    if (rooms.needsLoad(hash)) {
      if (pageChanged) {
        focusBeforeLoad = focusSection(document.documentElement.dataset.room);
        window.scrollTo({ top: 0, behavior: "instant" });
      }
      const ready = await rooms.ensure(hash);
      if (routeToken !== routeGeneration) return;
      // A visitor can leave or open the menu while a room loads. Never take focus from that action.
      if (dialog.open || (document.activeElement !== document.body && document.activeElement !== focusBeforeLoad))
        return;
      if (!ready) {
        focusSection(document.documentElement.dataset.room);
        return;
      }
    }
    if (returnPoint && hash === returnPoint.hash) {
      const point = returnPoint;
      returnPoint = null;
      // Native dialog and history focus restoration finish before we restore the actual launcher.
      requestAnimationFrame(() => {
        if (sceneKind(location.hash)) return;
        if (point.focus?.isConnected) point.focus.focus({ preventScroll: true });
        else focusSection(hash.slice(1) || "top", false);
        window.scrollTo({ top: point.y, behavior: "instant" });
      });
      return;
    }
    returnPoint = null;
    const savedY = history.state?.heliosY;
    if (fromHistory && !hash && typeof savedY === "number" && !document.documentElement.dataset.room) {
      // Back to the home page from a room: return to the place the reader left, not the top,
      // and to the room's card when it is on screen, so keyboard and screen reader users keep their place.
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedY, behavior: "instant" });
        const card = leftRoom && $(`.room-card[data-room-route="#${leftRoom}"]`);
        const box = card?.getBoundingClientRect();
        if (box && box.top >= 0 && box.bottom <= innerHeight) card.focus({ preventScroll: true });
      });
      return;
    }
    // History uses an empty fragment for home. Scene returns above keep their original launcher.
    if (!hash && !initial) hash = "#top";
    const experiment = parseExperiment(hash);
    if (experiment) {
      select(experiment);
      // A chosen or shared study lands on its own instrument and title, not the section introduction above.
      focusSection("instrument");
      return;
    }
    const scenario = parseMissionHash(hash.replace(/\.online\./, ".connected."));
    if (scenario) {
      mission({
        arch: scenario.architecture,
        sens: scenario.sensitivity,
        net: scenario.connected,
        permit: scenario.allowPrivateEgress,
      });
      const opened = rooms.sync("#starship");
      if (opened) window.scrollTo({ top: 0, behavior: "instant" });
      focusSection("starship", !opened);
      return;
    }
    if (/^#[a-z-]+$/.test(hash)) {
      const opensRoom = pageChanged && document.getElementById(hash.slice(1))?.matches("section.room");
      if (opensRoom) {
        window.scrollTo({ top: 0, behavior: "instant" });
        // The browser's own fragment jump lands after this; keep the page's back link in view.
        if (initial)
          addEventListener("load", () => scrollY < 200 && scrollTo({ top: 0, behavior: "instant" }), { once: true });
      }
      const heading = focusSection(hash.slice(1), !initial && !opensRoom);
      if (initial) {
        const initialAddress = location.href;
        const restoreInitialFocus = () =>
          requestAnimationFrame(() => {
            // Native fragment and reload restoration finish after the module starts. Keep the heading visible,
            // while respecting any control the visitor has focused, or any disclosure they closed, in the meantime.
            if (
              location.href === initialAddress &&
              (document.activeElement === document.body || document.activeElement === heading) &&
              !document.getElementById(hash.slice(1))?.closest("details:not([open])") &&
              !dialog.open &&
              !scene &&
              !pending
            )
              focusSection(hash.slice(1), !opensRoom);
          });
        if (document.readyState === "complete") restoreInitialFocus();
        else window.addEventListener("load", restoreInitialFocus, { once: true });
      }
    } else if (pageChanged) window.scrollTo({ top: 0, behavior: "instant" });
  }
  function navigate(hash, opener = null, replace = false) {
    hash = aliases[hash] || hash;
    if (hash === "#top") hash = "";
    let state = null;
    // A destination chosen in Mission Control takes the place of the menu's own history entry.
    const fromMenu = Boolean(history.state?.heliosMenu);
    if (fromMenu) replace = true;
    if (sceneKind(hash)) {
      if (!sceneKind(location.hash)) {
        const id = ++sequence;
        returnPoint = { id, hash: location.hash, y: window.scrollY, focus: opener || document.activeElement };
        returns.set(id, returnPoint);
        state = { heliosReturn: { id, hash: returnPoint.hash, y: returnPoint.y } };
      } else {
        state = history.state;
        replace = true;
      }
    } else {
      returnPoint = null;
      // Remember the reader's place on the home page, so Back from a room returns there.
      if (!document.documentElement.dataset.room && !sceneKind(location.hash))
        history.replaceState({ ...(history.state || {}), heliosY: window.scrollY }, "");
    }
    if (dialog.open) menu.closeForNavigation();
    if (location.hash !== hash)
      history[replace ? "replaceState" : "pushState"](state, "", location.pathname + location.search + hash);
    else if (fromMenu) history.replaceState({ ...history.state, heliosMenu: false }, "");
    route(hash || "#top");
  }
  document.addEventListener("click", (event) => {
    const link = closestTarget(event, "a[href^='#']");
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
    event.preventDefault();
    const hash = link.getAttribute("href");
    if (hash === "#main-content") {
      // Skip past shared navigation without changing the open room or browser history.
      focusSection(document.documentElement.dataset.room || "top");
      return;
    }
    navigate(hash, menu.openerFor(link));
  });
  let historyFrame = 0;
  let historyStale = false;
  function restoreHistory() {
    // Closing Mission Control steps back over its own entry; the page itself has not moved.
    if (menu.ownsPop(location.href)) {
      lastURL = location.href;
      return;
    }
    // Back then Forward inside one frame returns to the routed address, but the step away may already have
    // moved focus or scroll natively, so a traversal during a pending frame always routes.
    if (historyFrame) historyStale = true;
    else if (lastURL === location.href) return;
    cancelAnimationFrame(historyFrame);
    // Native history can restore focus and scroll after popstate. Route once it has finished.
    historyFrame = requestAnimationFrame(() => {
      historyFrame = 0;
      const stale = historyStale;
      historyStale = false;
      if (stale || lastURL !== location.href) route(location.hash, false, true);
    });
  }
  window.addEventListener("popstate", restoreHistory);
  window.addEventListener("hashchange", restoreHistory);
  queueMicrotask(() => route(location.hash, true));
  return { open: menu.open, route };
}
