import { sceneKind } from "./navigation.ts";

type Scene = { dispose: () => void };

/**
 * The cinema, the lensing observatory, the signature forge and the first flight are islands any page
 * can open. A room opens them over itself, so a film chosen here plays here and closing it returns to
 * the same spot in the same room. Without script the same links lead to the preserved edition's player.
 */
export function setupRoomScenes(motion: () => boolean) {
  let scene: Scene | null = null;
  let opener: HTMLElement | null = null;
  let title = document.title;
  let generation = 0;
  const inerted: HTMLElement[] = [];
  const room = () => location.pathname + location.search;
  // The page's own cinema reel belongs to the preserved edition; every other scene can open here.
  const opensHere = (hash: string) => ["studio", "flight"].includes(sceneKind(hash) || "");

  function dispose() {
    generation++;
    scene?.dispose();
    scene = null;
    document.querySelector(".room-scene-status")?.remove();
    for (const node of inerted.splice(0)) node.inert = false;
    document.title = title;
  }

  /** Close the scene. A destination is a place the scene itself sent the visitor on to. */
  function close(destination?: string) {
    dispose();
    if (opensHere(location.hash)) history.replaceState(history.state, "", room());
    if (destination && destination !== "smart-routing") {
      // Experiments and the other sections a flight can end at live in the preserved edition.
      location.assign(
        "/v43/#" + (destination.startsWith("build=") ? "experiment=" + destination.slice(6) : destination),
      );
      return;
    }
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  }

  /** A scene asks for another scene (a film's observatory, the forge's film) or for a place on the site. */
  function navigate(hash: string) {
    if (opensHere(hash)) {
      history.replaceState(history.state, "", room() + hash);
      void open(hash);
      return;
    }
    dispose();
    location.assign(hash === "#work" ? "/#workshop" : "/v43/" + hash);
  }

  async function open(hash: string) {
    dispose();
    title = document.title;
    const token = generation;
    const kind = sceneKind(hash);
    const status = document.createElement("p");
    status.className = "room-scene-status";
    status.setAttribute("role", "status");
    status.textContent = "Opening…";
    document.body.append(status);
    try {
      if (kind === "flight") {
        const { openFlight } = await import("../helios/flight-island");
        if (token !== generation) return;
        scene = openFlight({
          motion: motion(),
          step: hash === "#flight=tour" ? "board" : hash.slice(8),
          startTour: hash === "#flight=tour",
          showcase: true,
          onClose: close,
        });
        document.title = "First flight · cAshIo";
      } else {
        const { openStudio } = await import("../helios/studio-island");
        if (token !== generation) return;
        scene = openStudio({ motion: motion(), hash, onClose: () => close(), onNavigate: navigate });
        document.title = `${hash === "#signature" ? "Celestial Forge" : hash.startsWith("#lensing") ? "Lensing Observatory" : "Cinema"} · cAshIo`;
      }
      status.remove();
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
      // The preserved edition can still play it.
      if (token === generation) location.assign("/v43/" + hash);
    }
  }

  document.addEventListener(
    "click",
    (event) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
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
      if (url.origin !== location.origin || url.pathname !== "/v43/" || !opensHere(url.hash)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!scene) {
        opener = link;
        // One history entry per scene, so the browser's Back closes it and stays in the room.
        history.pushState(history.state, "", room() + url.hash);
      } else history.replaceState(history.state, "", room() + url.hash);
      void open(url.hash);
    },
    true,
  );
  window.addEventListener("popstate", () => {
    if (opensHere(location.hash)) void open(location.hash);
    else if (scene) {
      dispose();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
      opener = null;
    }
  });
  // A reload, or a shared link, with a scene in the address opens that scene over the room.
  if (opensHere(location.hash)) void open(location.hash);
}
