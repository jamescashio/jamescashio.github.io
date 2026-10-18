// Preserve explicit archives while keeping ordinary experiences in the current edition.
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
  const rooms = new Map([
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
  const room = url.hash.startsWith("#mission=") ? "starship" : rooms.get(url.hash);
  if (room) {
    location.replace(`/rooms/${room}/interactive/` + url.search + url.hash);
    return;
  }
  const aliases = new Map([
    ["#glossary", "#workshop"],
    ["#atlas-inspection", "#universe"],
    ["#request-journey", "#universe"],
  ]);
  if (aliases.has(url.hash)) {
    url.hash = aliases.get(url.hash);
    history.replaceState(history.state, "", "/" + url.search + url.hash);
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
