(function () {
  "use strict";
  var location = window.location;
  if (location.hash.startsWith("#deck=")) {
    location.replace("/command-deck.html" + location.search + location.hash);
  }
})();
