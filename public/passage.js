// The passage between a world card and its room, held steady. Loaded in the head after the stylesheets, on
// the front door and the interactive rooms.
//
// The browser decides whether a page takes part in a passage as it starts the body, from the styles it has
// by then. A script in the head makes it finish the stylesheets first, so the answer is always the one the
// stylesheet gives. Without that the passage is dropped now and then, and the page simply opens.
//
// Pause is one setting across the site: a paused visitor arrives without the passage. This runs before the
// page is first shown, which the page's own script, arriving later, cannot promise.
(function () {
  "use strict";
  addEventListener("pagereveal", function (event) {
    if (!event.viewTransition) return;
    var paused = false;
    try {
      paused = localStorage.getItem("cashio-v40-motion") === "off";
    } catch {
      /* Storage is optional. */
    }
    if (paused) event.viewTransition.skipTransition();
  });
})();
