// The passage between a world card and its room, held steady. Loaded in the head after the stylesheets, on
// the front door and the interactive rooms, which are the pages that take part.
//
// The browser decides whether a page takes part in a passage as it starts the body, from the styles it has
// by then. A script in the head makes it finish the stylesheets first, so the answer is always the one the
// stylesheet gives. Without that the passage is dropped now and then, and the page simply opens.
//
// A page that takes part offers a passage to every page of the site it leaves for. Most take no part: the
// archives, the reading editions, the films. The browser reports an error on such a page when a passage
// arrives, so a passage toward one is ended here, before it starts.
//
// Pause is one setting across the site: a paused visitor leaves without the passage. This is listening
// before the page is first shown, which the page's own script, arriving later, cannot promise.
(function () {
  "use strict";
  function paused() {
    try {
      return localStorage.getItem("cashio-v40-motion") === "off";
    } catch {
      return false;
    }
  }
  function end(passage) {
    // An ended passage rejects its ready promise; nothing waits on it, so say so.
    passage.ready.catch(function () {});
    passage.skipTransition();
  }
  function takesPart(address) {
    var path = address ? new URL(address).pathname : "";
    return path === "/" || /^\/rooms\/[a-z]+\/interactive\/$/.test(path);
  }
  addEventListener("pageswap", function (event) {
    if (!event.viewTransition) return;
    var entry = event.activation && event.activation.entry;
    if (paused() || !takesPart(entry && entry.url)) end(event.viewTransition);
  });
})();
