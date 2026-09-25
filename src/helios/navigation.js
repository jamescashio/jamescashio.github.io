import { parseExperiment } from "../odyssey/study-experiment";
import { parseMissionHash } from "../odyssey/flight-plan";
import { createWarp, setupFlightPrefetch } from "./zenith.js";
import { setupRooms } from "./rooms.js";

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
export function setupNavigation({ studies, select, mission, motion }) {
  const dialog = document.querySelector("#mc");
  const search = document.querySelector("#mc-search");
  const list = document.querySelector("#mc-list");
  const content = document.querySelector(".mc-content");
  const start = document.querySelector("#mc-start");
  const results = document.querySelector("#mc-results");
  const clear = document.querySelector("#mc-clear");
  const loader = document.querySelector("#scene-loader");
  const rooms = setupRooms();
  document.querySelector("#mc-btn .mono").textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K";
  let previousFocus = null,
    navigating = false,
    scene = null,
    activeKind = null,
    pending = false,
    generation = 0;
  let returnPoint = null,
    sequence = 0,
    lastURL = "";
  const returns = new Map();
  let loaderTimer = 0;
  // If motion is switched off mid jump, the warp stops and the loader takes over at once.
  const warp = createWarp({
    onHalt: () => {
      clearTimeout(loaderTimer);
      if (pending && !loader.open) loader.showModal();
    },
  });
  setupFlightPrefetch(() => import("./flight-island"));
  const destinations = [
    ["Explore the starship", "Your pace. A 30 second tour when you choose.", "#flight=board"],
    ["The orbital world", "Return to the beginning.", "#top"],
    ["Try one decision", "Predict the route. Test the privacy boundary.", "#work", "privacy private data test"],
    ["The system atlas", "Owned compute, orchestration, human authority.", "#universe"],
    [
      "Compare architectures",
      "Its own page. Change a mission and inspect all twelve requests.",
      "#starship",
      "privacy cloud local boundary",
    ],
    ["Starship build story", "The question, the design, and the shared rule behind the ship.", "#build-story"],
    ["Principles Engine", "Its own page. Turn the rings and see the design decision behind each rule.", "#principles"],
    ["The Studios", "Its own page. Original worlds, the 3D signature and five short films.", "#studios"],
    ["Lensing Observatory", "Sculpt the light. Find your own perspective.", "#lensing"],
    ["Celestial Forge", "Explore the signature in three dimensions.", "#signature"],
    ["The Cinema", "Five original short films. Play at your own pace.", "#film=lightwake"],
    ["The Sanctuary", "A quiet film and an explorable inner world.", "#film=sanctuary"],
    [
      "Inspect the evidence",
      "A source, a date, and a clear boundary. Fleet facts and the E.V.E. console.",
      "#evidence",
      "eve fleet status proof privacy boundary withheld",
    ],
    ["Flight heritage", "Its own page. Four aviation pioneers and the discipline behind the design.", "#heritage"],
    ["Meet Doug", "Builder. Operator. Accountable human.", "#operator", "about career resume linkedin"],
    [
      "Privacy",
      "How this site handles data. Read the policy on GitHub.",
      "https://github.com/jamescashio/jamescashio.github.io/blob/main/PRIVACY.md",
      "privacy policy cookies",
    ],
    [
      "Compare notes",
      "Speaking, advising or comparing notes. Email Doug.",
      "#contact",
      "contact email talk hire hello speaking advising recruiter",
    ],
    ...studies.map((s) => [s.name, s.cue, `#build=${s.id}`]),
  ];
  function render(query = "") {
    list.replaceChildren();
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matches = destinations.filter(([name, body, , keywords = ""]) =>
      terms.every((term) => `${name} ${body} ${keywords}`.toLowerCase().includes(term)),
    );
    clear.hidden = search.value.length === 0;
    results.textContent = `${matches.length} ${matches.length === 1 ? "destination" : "destinations"}${terms.length ? " found" : " to explore"}`;
    start.hidden = terms.length > 0;
    content.scrollTop = 0;
    for (const [name, body, href] of matches) {
      const a = document.createElement("a");
      a.className = "tile mc-destination";
      a.href = href;
      const title = document.createElement("strong"),
        description = document.createElement("span");
      title.textContent = name;
      description.textContent = body;
      a.append(title, description);
      list.append(a);
    }
    if (!matches.length) {
      const empty = document.createElement("p");
      empty.className = "mc-empty";
      empty.textContent =
        "No match yet. Try ‘flight’, ‘signature’ or ‘Graphify’, or clear the search to see every destination.";
      list.append(empty);
    }
  }
  const notify = () => window.dispatchEvent(new Event("helios-overlay"));
  function open() {
    if (dialog.open || loader.open || scene || pending) return;
    const active = document.activeElement;
    previousFocus = active && active !== document.body ? active : document.getElementById("mc-btn");
    navigating = false;
    search.value = "";
    render();
    dialog.showModal();
    notify();
    search.focus();
  }
  dialog.addEventListener("close", () => {
    notify();
    if (!navigating && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  });
  document.querySelector("#mc-btn").addEventListener("click", open);
  document.querySelector("#mc-close").addEventListener("click", () => dialog.close());
  search.addEventListener("input", () => render(search.value.trim().toLowerCase()));
  clear.addEventListener("click", () => {
    search.value = "";
    render();
    search.focus();
  });
  dialog.addEventListener("keydown", (event) => {
    const links = [...(start.hidden ? [] : start.querySelectorAll("a")), ...list.querySelectorAll("a")];
    if (!links.length) return;
    const index = links.indexOf(document.activeElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const offset = event.key === "ArrowDown" ? 1 : -1;
      links[index < 0 ? (offset === 1 ? 0 : links.length - 1) : (index + offset + links.length) % links.length].focus();
    } else if (event.key === "Enter" && document.activeElement === search) {
      event.preventDefault();
      links[0].click();
    }
  });
  window.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (!scene && !pending) dialog.open ? dialog.close() : open();
    }
  });
  function focusSection(id, shouldScroll = true, jump = false) {
    const target = document.getElementById(id);
    if (!target) return;
    const heading = target.querySelector("h1,h2,h3") || target;
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
    // A page change jumps; smooth scrolling across a swapped page would travel through the wrong content.
    if (shouldScroll) target.scrollIntoView({ behavior: motion() && !jump ? "smooth" : "instant", block: "start" });
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
      return;
    }
    dispose();
    pending = true;
    const token = ++generation;
    let failed = false;
    loader.querySelector("h2").textContent = "Preparing your scene…";
    loader.querySelector("p").textContent = "You can return to the site at any time.";
    document.querySelector("#scene-cancel").textContent = "Cancel opening";
    document.querySelector("#scene-reload").hidden = true;
    // Boarding the starship is a jump, not a wait: the warp covers loading and the loader appears only if it is slow.
    const jumping = kind === "flight" && motion() && warp.start();
    if (jumping) {
      loaderTimer = setTimeout(() => {
        if (pending && token === generation && !loader.open) loader.showModal();
      }, 1400);
    } else loader.showModal();
    notify();
    try {
      const module = kind === "flight" ? await import("./flight-island") : await import("./studio-island");
      if (token !== generation) return;
      if (jumping) await warp.settle();
      if (token !== generation) return;
      clearTimeout(loaderTimer);
      loader.close();
      activeKind = kind;
      scene =
        kind === "flight"
          ? module.openFlight({
              motion: motion(),
              step: hash.slice(8),
              onClose: closeScene,
              arrive: jumping && motion(),
            })
          : module.openStudio({
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
      document.querySelector("#scene-reload").hidden = false;
    } finally {
      if (token === generation) {
        pending = failed;
        if (!failed) loader.close();
        notify();
      }
    }
  }
  function route(hash, initial = false) {
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
    const pageChanged = rooms.sync(hash);
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
    const experiment = parseExperiment(hash);
    if (experiment) {
      select(experiment);
      focusSection("studies", true, pageChanged);
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
      focusSection("starship", !opened, true);
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
      focusSection(hash.slice(1), !initial && !opensRoom, pageChanged);
    } else if (pageChanged) window.scrollTo({ top: 0, behavior: "instant" });
  }
  function navigate(hash, opener = null, replace = false) {
    hash = aliases[hash] || hash;
    if (hash === "#top") hash = "";
    let state = null;
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
    }
    if (dialog.open) {
      navigating = true;
      dialog.close();
    }
    if (location.hash !== hash)
      history[replace ? "replaceState" : "pushState"](state, "", location.pathname + location.search + hash);
    route(hash || "#top");
  }
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href^='#']");
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
    event.preventDefault();
    navigate(link.getAttribute("href"), dialog.contains(link) ? previousFocus : link);
  });
  function restoreHistory() {
    if (lastURL !== location.href) route(location.hash);
  }
  window.addEventListener("popstate", restoreHistory);
  window.addEventListener("hashchange", restoreHistory);
  queueMicrotask(() => route(location.hash, true));
  return { open, route };
}
