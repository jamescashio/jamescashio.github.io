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
})();
