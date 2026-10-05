// Preserve explicit archive and immersive-world bookmarks before the current page draws.
function routeVersionedBookmark() {
  const url = new URL(location.href);
  if (url.hash.startsWith("#deck=")) {
    location.replace("/command-deck.html" + url.search + url.hash);
    return;
  }
  if (url.searchParams.get("v") === "37.17") {
    url.searchParams.delete("v");
    location.replace("/odyssey.html" + url.search + url.hash);
    return;
  }
  url.searchParams.delete("release");
  const legacy =
    /^#(?:lensing|build=|flight=|mission=|film=|signature$|starship$|principles$|observatory$|studios$|heritage$|build-story$|sovereign-world$|studio-worlds$|zenith-heading$)/;
  if (legacy.test(url.hash)) {
    location.replace("/v39/" + url.search + url.hash);
    return;
  }
  if (/^\/v40(?:\/|\/index.html)?$/.test(url.pathname)) {
    location.replace("/" + url.search + url.hash);
    return;
  }
  if (url.pathname === "/index.html" || location.search !== url.search) {
    history.replaceState(history.state, "", "/" + url.search + url.hash);
  }
}
routeVersionedBookmark();
window.addEventListener("hashchange", routeVersionedBookmark);
