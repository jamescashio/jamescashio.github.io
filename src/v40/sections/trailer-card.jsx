import React from "react";
const h = React.createElement;

/** House Cashio: The Trailer. The card opens the screening room through #film=trailer. */
export function TrailerCard() {
  return h(
    "article",
    {
      id: "house-trailer",
      className: "studio-project studio-project--trailer",
      "aria-labelledby": "house-trailer-title",
    },
    h(
      "a",
      {
        href: "#film=trailer",
        className: "studio-project-preview studio-trailer-play",
        "aria-label": "Watch House Cashio: The Trailer, 61 seconds",
        "aria-haspopup": "dialog",
      },
      h("img", {
        src: "/assets/hero/cashio-trailer-poster.webp",
        width: 1280,
        height: 720,
        loading: "lazy",
        decoding: "async",
        alt: "The House Cashio title card over a ringed planet, a rating card reading Mostly Harmless, and a cat silhouette on the planet's edge.",
      }),
      h("span", { className: "studio-trailer-mark", "aria-hidden": "true" }, "▶"),
    ),
    h(
      "div",
      { className: "studio-project-copy" },
      h("p", { className: "studio-project-kicker" }, "FROM MY WORKSHOP · A TRAILER PARODY"),
      h("h3", { id: "house-trailer-title" }, "House Cashio: The Trailer"),
      h(
        "p",
        null,
        "In a world where the machines can think, one homelab refused to let them decide. Braams, a subscription villain, a crew of machines and one cat who was not consulted. Rendered frame by frame in code.",
      ),
      h(
        "a",
        {
          href: "#film=trailer",
          "aria-haspopup": "dialog",
        },
        "▶ Watch the trailer · 61 seconds",
      ),
      h("p", { className: "studio-trailer-note" }, "Sound off to start · Unmute for the score · Captions available"),
    ),
  );
}
