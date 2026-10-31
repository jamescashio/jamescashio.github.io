import React from "react";
import { ReelText } from "../hero-reel.jsx";
import { posterSources } from "../poster-sources.js";
const h = React.createElement;

export function EagleFilmSection({ v }) {
  // Keep the established section anchor compatible with existing bookmarks.
  return h(
    "section",
    { id: "eagle-film", className: "eagle-film", "aria-labelledby": "eagle-film-title" },
    h(
      "div",
      { className: "eagle-film-inner" },
      h(
        "div",
        { className: "eagle-film-copy" },
        h("p", { className: "eagle-film-label" }, "The crew · A trailer parody"),
        h("h2", { id: "eagle-film-title" }, v.trailer.title),
        h(
          "p",
          null,
          "Zeus, Apollo, Hermes, Atlas, DSH, E.V.E. and Bit face a subscription villain, with braams, a dramatic line up and one cat who was not consulted.",
        ),
        h("p", { className: "eagle-film-note" }, "Starts muted · Captions available"),
        h(ReelText, { text: v.trailer.text }),
      ),
      h(
        "a",
        {
          href: "#film=trailer",
          className: "eagle-film-play",
          "aria-labelledby": "eagle-film-watch eagle-film-duration",
          "aria-haspopup": "dialog",
        },
        h(
          "span",
          { className: "eagle-film-visual" },
          h("img", {
            src: v.trailer.poster,
            srcSet: posterSources(v.trailer.poster),
            sizes: "(max-width: 760px) calc(100vw - 48px), (max-width: 1280px) 52vw, 640px",
            width: 1280,
            height: 720,
            loading: "lazy",
            decoding: "async",
            alt: "The House Cashio title card over a ringed planet, a rating card reading Mostly Harmless, and a cat silhouette on the planet's edge.",
          }),
          h("span", { className: "eagle-film-playmark", "aria-hidden": "true" }, "▶"),
        ),
        h(
          "span",
          { className: "eagle-film-caption" },
          h("span", { id: "eagle-film-watch" }, "Watch House Cashio"),
          " ",
          h("span", { id: "eagle-film-duration", className: "eagle-film-duration" }, "61 seconds"),
        ),
      ),
    ),
  );
}
