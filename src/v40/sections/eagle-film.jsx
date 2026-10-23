import React from "react";
import { ReelText } from "../hero-reel.jsx";
const h = React.createElement;

export function EagleFilmSection({ v }) {
  return h(
    "section",
    { id: "eagle-film", className: "eagle-film", "aria-labelledby": "eagle-film-title" },
    h(
      "div",
      { className: "eagle-film-inner" },
      h(
        "div",
        { className: "eagle-film-copy" },
        h("p", { className: "eagle-film-label" }, "Eagle · A short film"),
        h("h2", { id: "eagle-film-title" }, "A moment in orbit."),
        h("p", null, "From the ringed horizon to the workshop below. A 36 second film from House Cashio."),
        h("p", { className: "eagle-film-note" }, "Sound off to start · Captions available"),
        h(ReelText),
      ),
      h(
        "a",
        {
          href: "#film=intro",
          onClick: v.openIntro,
          className: "eagle-film-play",
          "aria-labelledby": "eagle-film-watch eagle-film-duration",
          "aria-haspopup": "dialog",
        },
        h(
          "span",
          { className: "eagle-film-visual" },
          h("img", {
            src: "/v40/thumbs/zenith-starship-dockside-poster-640.webp",
            srcSet: [320, 640, 1280]
              .map((width) => `/v40/thumbs/zenith-starship-dockside-poster-${width}.webp ${width}w`)
              .join(", "),
            sizes: "(max-width: 760px) calc(100vw - 44px), (max-width: 1600px) 50vw, 760px",
            width: 1280,
            height: 720,
            loading: "lazy",
            decoding: "async",
            alt: "A starship beside a lamplit workshop under a deep blue evening sky.",
          }),
          h("span", { className: "eagle-film-playmark", "aria-hidden": "true" }, "▶"),
        ),
        h(
          "span",
          { className: "eagle-film-caption" },
          h("span", { id: "eagle-film-watch" }, "Watch Eagle"),
          " ",
          h("span", { id: "eagle-film-duration", className: "eagle-film-duration" }, "36 seconds"),
        ),
      ),
    ),
  );
}
