import { isZenithFilm } from "../helios/zenith-routes.js";

const rooms = new Set(["starship", "principles", "studios", "heritage"]);
const experiments = new Set(["hermes", "cascade", "exposure", "briefing", "dashboards", "signal", "graphify"]);

export function revealHashTarget(doc, hash) {
  let id;
  try {
    id = decodeURIComponent(hash.slice(1));
  } catch {
    return null;
  }
  const target = doc.getElementById(id);
  for (let node = target; node; node = node.parentElement) {
    if (node.tagName === "DETAILS") node.open = true;
  }
  return target;
}
export const sceneKind = (hash) =>
  hash === "#film=intro" || hash === "#film=trailer"
    ? "reel"
    : /^#flight=(board|hull|blackout|permission)$/.test(hash)
      ? "flight"
      : isZenithFilm(hash) ||
          /^#(?:signature|lensing(?:&.*)?|film(?:=(?:intro|sanctuary|lightwake|signature|awakening|arrival))?)$/.test(
            hash,
          )
        ? "studio"
        : null;

/** The current edition owns shared experiences; the version archive stays an explicit destination. */
export function setupV40Navigation() {
  let scene,
    activeHash,
    originalTitle,
    statusPanel,
    requestedHash,
    opener,
    returnHash = "#top",
    generation = 0;
  const inerted = [];
  const motion = () =>
    document.documentElement.dataset.motion !== "off" && !matchMedia("(prefers-reduced-motion: reduce)").matches;

  function dispose() {
    generation++;
    scene?.dispose();
    statusPanel?.remove();
    statusPanel = null;
    scene = null;
    activeHash = null;
    for (const node of inerted.splice(0)) node.inert = false;
    if (originalTitle !== undefined) document.title = originalTitle;
    originalTitle = undefined;
  }
  function navigate(hash, replaceEntry = false) {
    requestedHash = activeHash && !sceneKind(hash) ? hash : null;
    if (hash !== location.hash) history[activeHash || replaceEntry ? "replaceState" : "pushState"](null, "", hash);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }
  function focusReturn(hash, destination = false) {
    requestAnimationFrame(() => {
      if (activeHash || location.hash !== hash) return;
      const target =
        !destination && opener?.isConnected
          ? opener
          : document.getElementById(hash.startsWith("#experiment=") ? "studies" : hash.slice(1) || "top");
      if (!target) return;
      if (!target.matches("a,button,input,select,textarea,[tabindex]")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      if (destination) target.scrollIntoView({ block: "start", behavior: "instant" });
    });
  }
  function close(destination) {
    dispose();
    const next = destination
      ? destination.startsWith("build=")
        ? "#experiment=" + destination.slice(6)
        : destination === "smart-routing"
          ? "#starship"
          : "#" + destination
      : returnHash;
    history.replaceState(null, "", next);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    focusReturn(next, !!destination);
  }
  async function route() {
    const hash = location.hash;
    const id = hash.slice(1);
    if (rooms.has(id)) {
      location.assign(`/rooms/${id}/interactive/`);
      return;
    }
    if (["#zenith-heading", "#studio-worlds"].includes(hash)) {
      location.assign("/rooms/studios/interactive/" + hash);
      return;
    }
    if (hash.startsWith("#build=") && experiments.has(hash.slice(7).split("&")[0])) {
      navigate("#experiment=" + hash.slice(7), true);
      return;
    }
    const kind = sceneKind(hash);
    if (!kind) {
      const target = revealHashTarget(document, hash);
      if (target?.closest("details")) {
        requestAnimationFrame(() => {
          if (location.hash === hash && !activeHash) target.scrollIntoView({ block: "start", behavior: "instant" });
        });
      }
      const requested = requestedHash === hash;
      requestedHash = null;
      if (activeHash) {
        dispose();
        focusReturn(hash, requested);
      }
      return;
    }
    if (hash === activeHash) return;
    const title = originalTitle ?? document.title;
    dispose();
    originalTitle = title;
    activeHash = hash;
    if (kind === "reel") {
      scene = { dispose: () => window.cashioV40?.setState({ cinema: null }) };
      const trailer = hash === "#film=trailer";
      window.cashioV40?.setState({ cinema: trailer ? "trailer" : "intro" });
      document.title = trailer ? "House Cashio: The Trailer · cAshIo V41" : "Eagle · cAshIo V41";
      return;
    }
    const token = generation;
    const status = document.createElement("div");
    statusPanel = status;
    status.className = "v40-scene-status";
    status.setAttribute("role", "status");
    const message = document.createElement("p");
    message.textContent = "Opening your experience…";
    const cancel = document.createElement("button");
    cancel.textContent = "Return to the homepage";
    cancel.addEventListener("click", () => close());
    status.append(message, cancel);
    document.body.append(status);
    try {
      const module =
        kind === "flight" ? await import("../helios/flight-island") : await import("../helios/studio-island");
      if (token !== generation) return;
      status.remove();
      scene =
        kind === "flight"
          ? module.openFlight({ motion: motion(), step: hash.slice(8), onClose: close })
          : module.openStudio({ motion: motion(), hash, onClose: () => close(), onNavigate: navigate });
      document.title = `${kind === "flight" ? "First flight" : hash === "#signature" ? "Celestial Forge" : hash.startsWith("#lensing") ? "Lensing Observatory" : "Cinema"} · cAshIo V41`;
      for (const node of document.body.children) {
        if (
          !(node instanceof HTMLElement) ||
          node.inert ||
          ["helios-flight", "helios-studio"].includes(node.id) ||
          node.tagName === "SCRIPT"
        )
          continue;
        node.inert = true;
        inerted.push(node);
      }
    } catch {
      if (token === generation)
        message.textContent = "This experience could not load. Return to the homepage and try again.";
    } finally {
      if (token !== generation) status.remove();
    }
  }
  document.addEventListener(
    "click",
    (event) => {
      const link = event.target.closest?.("a[href]");
      if (
        !link ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        link.target ||
        link.hasAttribute("download")
      )
        return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !sceneKind(url.hash)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!activeHash) {
        returnHash =
          location.hash ||
          (sceneKind(url.hash) === "flight"
            ? "#top"
            : url.hash === "#film=trailer"
              ? "#" + (link.closest("section[id]")?.id || "universe")
              : "#films");
        opener = link;
      }
      navigate(url.hash);
    },
    true,
  );
  window.addEventListener("hashchange", route);
  window.addEventListener("popstate", route);
  window.addEventListener("cashio-ready", route);
  window.addEventListener("cashio-cinema-close", () => {
    if (activeHash === "#film=intro" || activeHash === "#film=trailer") close();
  });
  document.addEventListener("cashio-motion", () =>
    window.dispatchEvent(new CustomEvent("helios-motion", { detail: motion() })),
  );
}
