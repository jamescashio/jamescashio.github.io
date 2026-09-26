// Runs before first paint, inlined into the home page with a CSP hash by scripts/prerender-helios.mts.
// GitHub Pages serves static files and cannot send HTTP redirects, so old shared addresses are
// normalized here, in the browser, before the page draws.
(function () {
  "use strict";
  var url = new URL(window.location.href);
  // V35 command deck bookmarks (/#deck=…) keep their query and deck on the preserved archive page.
  if (url.hash.startsWith("#deck=")) {
    window.location.replace("/command-deck.html" + url.search + url.hash);
    return;
  }
  // ?v=37.17 explicitly asks for the preserved V37.17 front door.
  if (url.searchParams.get("v") === "37.17") {
    url.searchParams.delete("v");
    window.location.replace("/odyssey.html" + url.search + url.hash);
    return;
  }
  // Old ?release= preview markers and the /v38/ and /index.html paths all mean the current home page.
  url.searchParams.delete("release");
  if (url.pathname === "/v38/" || url.pathname === "/v38/index.html") {
    window.location.replace("/" + url.search + url.hash);
  } else if (url.search !== window.location.search || url.pathname === "/index.html") {
    window.history.replaceState(window.history.state, "", "/" + url.search + url.hash);
  }
  // A room opened as the first address paints as its own page, not the home page.
  var rooms = {
    principles: 1,
    observatory: "principles",
    starship: 1,
    "build-story": "starship",
    "sovereign-world": "starship",
    studios: 1,
    heritage: 1,
  };
  var hash = /^#mission=/.test(url.hash) ? "starship" : url.hash.slice(1);
  if (rooms[hash]) document.documentElement.dataset.room = rooms[hash] === 1 ? hash : rooms[hash];
})();
