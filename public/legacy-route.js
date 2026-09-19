(function () {
  "use strict";
  var location = window.location;
  if (location.hash.startsWith("#deck=")) {
    location.replace("/command-deck.html" + location.search + location.hash);
    return;
  }
  // V38 Helios is the front door: a plain visit to the root moves to it.
  // Fragments (#flight=, #lensing, #film=, #build=, #mission=, #signature)
  // and any query (for example ?v=37.17) keep the V37.17 experience here.
  var frontDoor = ["", "v38", ""].join("/");
  if (location.pathname === "/" && !location.hash && !location.search) {
    location.replace(frontDoor);
  }
})();