import { parseExperiment } from "../odyssey/study-experiment";
import { parseMissionHash } from "../odyssey/flight-plan";

/** A single route handler owns native links, search, bookmarks and browser history. */
export function setupNavigation({ studies, select, mission, motion, toast }) {
  const dialog = document.querySelector("#mc");
  const search = document.querySelector("#mc-search");
  const list = document.querySelector("#mc-list");
  const shortcut = document.querySelector("#mc-btn .mono");
  shortcut.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K";
  let previousFocus = null;
  let navigating = false;
  let flight = null;
  let launchPending = false;
  let flightGeneration = 0;
  const destinations = [
    ["The 30-second flight", "Open the hull. Cut the cloud. Keep command.", "#flight=board"],
    ["The orbital world", "Return to the beginning.", "#top"],
    ["Try one decision", "Predict the route. Test the privacy boundary.", "#work"],
    ["The system atlas", "Owned compute, orchestration, human authority.", "#universe"],
    ["Compare architectures", "Change a mission. Inspect all twelve requests.", "#starship"],
    ["Principles Engine", "Turn the rings. Explore the operating philosophy.", "#principles"],
    ["Inspect the evidence", "A source, a date, and a clear boundary.", "#evidence"],
    ["Flight heritage", "The discipline behind the design.", "#heritage"],
    ["Meet Doug", "Builder. Operator. Accountable human.", "#operator"],
    ["Start a conversation", "An ambitious idea and its hardest constraint.", "#contact"],
    ...studies.map((s) => [s.name, s.cue, `#build=${s.id}`]),
  ];
  function render(query = "") {
    list.replaceChildren();
    const matches = destinations.filter(([name, body]) => `${name} ${body}`.toLowerCase().includes(query));
    for (const [name, body, href] of matches) {
      const a = document.createElement("a");
      a.className = "tile mc-destination";
      a.href = href;
      const title = document.createElement("strong");
      title.textContent = name;
      const description = document.createElement("span");
      description.textContent = body;
      a.append(title, description);
      list.append(a);
    }
    if (!matches.length) {
      const empty = document.createElement("p");
      empty.setAttribute("role", "status");
      empty.textContent = "No destination found. Try ‘flight’, ‘privacy’ or ‘Graphify’.";
      list.append(empty);
    }
  }
  function open() {
    if (dialog.open) return;
    previousFocus = document.activeElement;
    navigating = false;
    render();
    search.value = "";
    dialog.showModal();
    window.dispatchEvent(new Event("helios-overlay"));
    search.focus();
    window.__heroPause?.(true);
  }
  function close() {
    dialog.close();
  }
  dialog.addEventListener("close", () => {
    window.dispatchEvent(new Event("helios-overlay"));
    window.__heroPause?.(!motion());
    if (!navigating && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  });
  document.querySelector("#mc-btn").addEventListener("click", open);
  document.querySelector("#mc-close").addEventListener("click", close);
  search.addEventListener("input", () => render(search.value.trim().toLowerCase()));
  dialog.addEventListener("keydown", (event) => {
    const links = [...list.querySelectorAll("a")];
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
      if (!flight && !launchPending) dialog.open ? close() : open();
    }
  });
  function focusSection(id, shouldScroll = true) {
    const target = document.getElementById(id);
    if (!target) return;
    if (shouldScroll) target.scrollIntoView({ behavior: motion() ? "smooth" : "instant", block: "start" });
    const heading = target.querySelector("h2,h3") || target;
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
  }
  async function launch(step = "board") {
    if (flight || launchPending) return;
    launchPending = true;
    const generation = ++flightGeneration;
    const returnFocus = dialog.contains(document.activeElement) ? previousFocus : document.activeElement;
    const restoreHash = "#top";
    document.documentElement.classList.add("flight-loading");
    toast("Preparing your ship…");
    try {
      const { openFlight } = await import("./flight-island");
      if (generation !== flightGeneration) return;
      flight = openFlight({
        motion: motion(),
        step,
        onClose(destination) {
          flight?.dispose();
          flight = null;
          window.__heroPause?.(!motion());
          const hash = destination?.startsWith("build=")
            ? `#${destination}`
            : destination === "smart-routing"
              ? "#work"
              : restoreHash;
          history.replaceState(null, "", hash);
          if (destination) route(hash);
          else returnFocus?.focus({ preventScroll: true });
        },
      });
      window.__heroPause?.(true);
      toast("");
    } catch {
      toast("The flight could not load. Try again, or explore the comparison below.");
      focusSection("starship");
    } finally {
      launchPending = false;
      document.documentElement.classList.remove("flight-loading");
    }
  }
  function route(hash, initial = false) {
    const experiment = parseExperiment(hash);
    if (experiment) {
      select(experiment);
      focusSection("studies");
      return;
    }
    if (/^#flight=(board|hull|blackout|permission)$/.test(hash)) {
      void launch(hash.slice(8));
      return;
    }
    // Accept the original V38 URL token while sharing the canonical, bounded model contract.
    const scenario = parseMissionHash(hash.replace(/\.online\./, ".connected."));
    if (scenario) {
      mission({
        arch: scenario.architecture,
        sens: scenario.sensitivity,
        net: scenario.connected,
        permit: scenario.allowPrivateEgress,
      });
      focusSection("starship");
      return;
    }
    if (/^#[a-z-]+$/.test(hash)) focusSection(hash.slice(1), !initial);
  }
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href^='#']");
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button) return;
    const hash = link.getAttribute("href");
    event.preventDefault();
    if (dialog.open) {
      navigating = true;
      close();
    }
    if (location.hash !== hash) history.pushState(null, "", hash);
    route(hash);
  });
  window.addEventListener("hashchange", () => {
    if (flight && !location.hash.startsWith("#flight=")) {
      flight.dispose();
      flight = null;
    }
    if (launchPending && !location.hash.startsWith("#flight=")) flightGeneration++;
    route(location.hash);
  });
  queueMicrotask(() => route(location.hash, true));
  return { open, route };
}
