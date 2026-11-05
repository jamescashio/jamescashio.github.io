/**
 * Older bookmarks keep working. V44 owns its station anchors and every id on the page; any other
 * V43 deep link (tours, films, experiments, mission cards) is handed to the preserved edition at /v43/.
 */
const STATIONS = new Set(["arrival", "cinema", "worlds", "workshop", "helm", "evidence", "doug", "contact", "main"]);
const ALIASES = new Map([
  ["#top", "#arrival"],
  ["#rooms", "#worlds"],
  ["#eagle-film", "#cinema"],
  ["#film=trailer", "#cinema"],
  ["#operator", "#doug"],
]);
const ROOMS = new Map([
  ["#starship", "starship"],
  ["#build-story", "starship"],
  ["#sovereign-world", "starship"],
  ["#principles", "principles"],
  ["#observatory", "principles"],
  ["#studios", "studios"],
  ["#studio-worlds", "studios"],
  ["#zenith-heading", "studios"],
  ["#heritage", "heritage"],
]);

export type LegacyRoute = { replace?: string; rewrite?: string };

/**
 * `onPage` answers whether the front door itself has an element with that id, so a link to a heading
 * or a field on this page stays here. Without it, only the station anchors count as local.
 */
export function legacyRoute(href: string, onPage: (id: string) => boolean = () => false): LegacyRoute {
  const url = new URL(href);
  const hash = url.hash;
  if (hash.startsWith("#deck=")) return { replace: "/command-deck.html" + url.search + hash };
  if (url.searchParams.get("v") === "37.17") {
    url.searchParams.delete("v");
    return { replace: "/odyssey.html" + url.search + hash };
  }
  const room = hash.startsWith("#mission=") ? "starship" : ROOMS.get(hash);
  if (room) return { replace: `/rooms/${room}/interactive/` + url.search + hash };
  const alias = ALIASES.get(hash);
  if (alias) return { rewrite: url.pathname + url.search + alias };
  const id = safeDecode(hash.slice(1));
  if (id && !STATIONS.has(id) && !onPage(id)) return { replace: "/v43/" + url.search + hash };
  return {};
}

function safeDecode(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

/** Where a front door hash link from another page should point, so it lands correctly even without JavaScript. */
export function frontDoorHref(hash: string): string {
  const route = legacyRoute(new URL("/" + hash, "https://cashio.us").href);
  return route.replace ?? route.rewrite ?? "/" + hash;
}

/** Apply the route for the current address. Returns the station an alias now points at, so the page can go there. */
export function applyLegacyRoute(): string | null {
  // A packaged preview runs away from cashio.us, where its host owns the hash.
  if (document.querySelector('meta[name="cashio-preview"]')) return null;
  const route = legacyRoute(location.href, (id) => document.getElementById(id) !== null);
  if (route.replace) location.replace(route.replace);
  else if (route.rewrite) {
    history.replaceState(history.state, "", route.rewrite);
    return new URL(route.rewrite, location.href).hash.slice(1);
  }
  return null;
}
