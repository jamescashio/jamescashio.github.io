/**
 * Older bookmarks keep working. V44 owns seven station anchors; every V43 deep link
 * (tours, films, experiments, mission cards) is handed to the preserved edition at /v43/.
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

export function legacyRoute(href: string): LegacyRoute {
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
  if (hash.length > 1 && !STATIONS.has(hash.slice(1))) return { replace: "/v43/" + url.search + hash };
  return {};
}

/** Where a front door hash link from another page should point, so it lands correctly even without JavaScript. */
export function frontDoorHref(hash: string): string {
  const route = legacyRoute(new URL("/" + hash, "https://cashio.us").href);
  return route.replace ?? route.rewrite ?? "/" + hash;
}

export function applyLegacyRoute() {
  // A packaged preview runs away from cashio.us, where its host owns the hash.
  if (document.querySelector('meta[name="cashio-preview"]')) return false;
  const route = legacyRoute(location.href);
  if (route.replace) location.replace(route.replace);
  else if (route.rewrite) history.replaceState(history.state, "", route.rewrite);
  return Boolean(route.replace);
}
