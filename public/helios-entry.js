(function () {
  "use strict";
  var url = new URL(window.location.href);
  if (url.hash.startsWith("#deck=")) {
    window.location.replace("/command-deck.html" + url.search + url.hash);
    return;
  }
  if (url.searchParams.get("v") === "37.17") {
    url.searchParams.delete("v");
    window.location.replace("/odyssey.html" + url.search + url.hash);
    return;
  }
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
    "sovereign-world": "starship",
    studios: 1,
    heritage: 1,
  };
  var hash = /^#mission=/.test(url.hash) ? "starship" : url.hash.slice(1);
  if (rooms[hash]) document.documentElement.dataset.room = rooms[hash] === 1 ? hash : rooms[hash];
})();
