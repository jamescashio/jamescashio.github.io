import React, { useState } from "react";
import { ReelText } from "../hero-reel.jsx";
import { posterSources } from "../poster-sources.js";
import { FilmAperture } from "../signal-graphics.jsx";
const h = React.createElement;

export function EagleFilmSection({ v }) {
  const [selected, select] = useState(0);
  const feature = v.featureFilms[selected];
  const watchTitle = selected === 0 ? "Watch House Cashio" : "Watch " + feature.title;
  const duration = ["61 seconds", "36 seconds", "Short film", "Short film"][selected];
  // Keep the established section anchor compatible with existing bookmarks.
  return h(
    "section",
    { id: "eagle-film", className: "eagle-film afterglow-feature", "aria-labelledby": "eagle-film-title" },
    h(
      "div",
      { className: "eagle-film-inner" },
      h(
        "div",
        { className: "eagle-film-copy" },
        h(
          "p",
          { className: "eagle-film-label" },
          selected === 0 ? "Opening feature · Trailer parody" : "Selected feature · " + feature.coll,
        ),
        h("h2", { id: "eagle-film-title" }, feature.title),
        h(
          "p",
          null,
          selected === 0 ? "A subscription villain, an unlikely crew, and a cat who was not consulted." : feature.desc,
        ),
        h(
          "p",
          { className: "eagle-film-note" },
          selected < 2 ? "Starts muted · Captions available" : "Starts muted · Visual description below",
        ),
        h(
          "div",
          { className: "eagle-film-links" },
          h(ReelText, { text: feature.text || (selected === 1 ? undefined : feature.desc) }),
          h("a", { href: "#workshop", className: "visitor-link" }, "Explore the workshop →"),
        ),
      ),
      h(
        "a",
        {
          href: "#film=" + feature.slug,
          className: "eagle-film-play",
          "aria-labelledby": "eagle-film-watch eagle-film-duration",
          "aria-haspopup": "dialog",
        },
        h(
          "span",
          { className: "eagle-film-visual" },
          h("img", {
            src: feature.poster,
            srcSet: posterSources(feature.poster),
            sizes: "(max-width: 760px) calc(100vw - 48px), (max-width: 1280px) 52vw, 640px",
            width: 1280,
            height: 720,
            loading: "lazy",
            decoding: "async",
            alt:
              selected === 0
                ? "The House Cashio title card over a ringed planet, a rating card reading Mostly Harmless, and a cat silhouette on the planet's edge."
                : feature.title + ", original film artwork.",
          }),
          h("span", { className: "eagle-film-playmark", "aria-hidden": "true" }, h(FilmAperture)),
          h("span", { className: "film-frame-corner film-frame-corner-a", "aria-hidden": "true" }),
          h("span", { className: "film-frame-corner film-frame-corner-b", "aria-hidden": "true" }),
        ),
        h(
          "span",
          { className: "eagle-film-caption" },
          h("span", { id: "eagle-film-watch" }, watchTitle),
          " ",
          h("span", { id: "eagle-film-duration", className: "eagle-film-duration" }, duration),
        ),
      ),
      h(
        "div",
        { className: "cinema-selection", role: "group", "aria-label": "Featured cinema" },
        v.featureFilms.map((film, index) =>
          h(
            "button",
            { key: film.slug, type: "button", "aria-pressed": selected === index, onClick: () => select(index) },
            h("img", {
              src: film.poster,
              srcSet: posterSources(film.poster),
              sizes: "160px",
              alt: "",
              width: 160,
              height: 90,
              loading: "lazy",
            }),
            h(
              "span",
              null,
              h("small", null, "0" + (index + 1)),
              h("strong", null, index === 0 ? "House Cashio" : film.title),
            ),
            h("span", { className: "cinema-selected-mark", "aria-hidden": true }, selected === index ? "●" : "↗"),
          ),
        ),
      ),
    ),
  );
}
