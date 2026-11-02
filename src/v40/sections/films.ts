import type { GeneratedProps } from "../generated-view.ts";
import { renderFilmsPart1 } from "./films-part-1.ts";
import React from "react";

import { AiWormFilm } from "../ai-worm.tsx";
import { h } from "../generated-view.ts";

export function FilmsSection({ v }: GeneratedProps) {
  return h(
    "section",
    {
      key: 661,
      id: "films",
      "data-screen-label": "Screening room",
      className: "v41-2c74ae3790",
    },
    " ",
    h("div", {
      key: 663,
      "aria-hidden": "true",
      className: "v41-d604164ad2",
    }),
    " ",
    h(
      "div",
      {
        key: 665,
        className: "v41-0a831b5de0",
      },
      " ",
      h(
        "div",
        {
          key: 667,
          "data-reveal": "",
          className: "v41-260a3097b1",
        },
        " ",
        h(
          "div",
          { key: 669, className: "v41-022625b12b" },
          " ",
          h(
            "span",
            {
              key: 671,
              className: "v41-c904563b29",
            },
            h("span", { key: 672, className: "v41-3bdbfd324b" }, h(React.Fragment, { key: 673 }, "03")),
            h(
              "span",
              { key: 674, "data-scramble": "" },
              h(React.Fragment, { key: 675 }, "The Studios · Short film collection"),
            ),
          ),
          " ",
          h(
            "h2",
            {
              key: 677,
              className: "v41-0cf0266feb",
            },
            h(React.Fragment, { key: 678 }, "A world worth"),
            h("br", { key: 679 }),
            h("span", { key: 680, className: "v41-ec3b8f4b69" }, h(React.Fragment, { key: 681 }, "getting lost in.")),
          ),
          " ",
        ),
        " ",
        h(
          "p",
          {
            key: 684,
            className: "v41-17b9cd1b27",
          },
          h(React.Fragment, { key: 685 }, "Shape the light, explore the signature, or watch a short film."),
        ),
        " ",
      ),
      " ",
      h(AiWormFilm, { key: "ai-worm" }),
      h(
        "article",
        {
          key: "roadster-studio",
          id: "roadster-studio",
          className: "studio-project",
          "aria-labelledby": "roadster-studio-title",
        },
        h(
          "figure",
          { className: "studio-project-preview" },
          h("img", {
            src: "/images/roadster-studio-960.webp",
            srcSet:
              "/images/roadster-studio-640.webp 640w, /images/roadster-studio-960.webp 960w, /images/roadster-studio-1600.webp 1600w",
            sizes: "(max-width: 600px) 96px, (max-width: 760px) calc(100vw - 48px), (max-width: 1200px) 52vw, 650px",
            width: 1600,
            height: 900,
            loading: "lazy",
            decoding: "async",
            alt: "Pearl white Roadster CAD model with bronze glass and sculpted wheels, lit in a dark cinematic studio.",
          }),
          h("figcaption", null, "Rendered from the interactive model"),
        ),
        h(
          "div",
          { className: "studio-project-copy" },
          h("p", { className: "studio-project-kicker" }, "FROM MY WORKSHOP · INTERACTIVE 3D"),
          h("h3", { id: "roadster-studio-title" }, "Roadster Studio"),
          h(
            "p",
            null,
            "An independent automotive CAD study, with ten thrusters and a cinematic studio. Explore the model or compose your own photograph.",
          ),
          h(
            "a",
            {
              href: "https://roadster-studio.hotsaucecashio.chatgpt.site/",
              target: "_blank",
              rel: "noopener noreferrer",
              "aria-label": "Explore Roadster Studio, opens in a new tab",
            },
            "Explore Roadster Studio ↗",
          ),
        ),
      ),
      h(
        "details",
        {
          key: "studio-collection",
          id: "studio-collection",
          className: "studio-collection",
          onToggle: () => document.dispatchEvent(new Event("cashio-media")),
        },
        h(
          "summary",
          null,
          h(
            "span",
            null,
            "Explore the short film collection",
            h("small", null, "Quiet films from the workshop · starts muted"),
          ),
          h("span", { "aria-hidden": "true" }, "+"),
        ),
        renderFilmsPart1(v),
      ),
      " ",
    ),
    " ",
  );
}
