import React from "react";
import { classFor } from "../style-variants.js";
import designSystem from "../design-system.js";
import { AiWormFilm } from "../ai-worm.jsx";
const h = React.createElement;

export function FilmsSection({ v }) {
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
            h("span", { key: 672, className: "v41-3bdbfd324b" }, h(React.Fragment, { key: 673 }, "04")),
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
          h(
            React.Fragment,
            { key: 685 },
            "Shape the light, explore the signature or settle into the short film collection.",
          ),
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
            sizes: "(max-width: 760px) calc(100vw - 48px), (max-width: 1200px) 52vw, 650px",
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
            "Explore the motors, pressure tanks and all ten thrusters in my independent automotive CAD study. Play the cinematic tour or compose your own studio photograph.",
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
        "div",
        {
          key: 688,
          className: classFor(
            ["display:grid;grid-template-columns:", v.filmCols ?? "", ";gap:22px;align-items:start"].join(""),
          ),
        },
        " ",
        h(
          "div",
          {
            key: 690,
            className: ["film-feature", "v41-3f0a1a6627"].filter(Boolean).join(" "),
            "data-reveal": "",
            "data-tilt": "3",
          },
          " ",
          h("video", {
            key: 692,
            id: "feature-video",
            "data-v": "auto",
            "data-bound-src": v.featSrc,
            "data-bound-poster": v.featPoster,
            preload: "none",
            "aria-label": v.featTitle,
            className: "v41-886a8b070f",
          }),
          " ",
          h("span", {
            key: 694,
            "aria-hidden": "true",
            className: "v41-457fd0347d",
          }),
          " ",
          h("span", {
            key: 696,
            "aria-hidden": "true",
            className: "v41-800ec7dd55",
          }),
          " ",
          h("span", {
            key: 698,
            "aria-hidden": "true",
            className: "v41-4d6cdec398",
          }),
          " ",
          h("span", {
            key: 700,
            "aria-hidden": "true",
            className: "v41-94714277ae",
          }),
          " ",
          h("span", {
            key: 702,
            "aria-hidden": "true",
            className: "v41-362fd0478b",
          }),
          " ",
          h(
            "div",
            {
              key: 704,
              className: "v41-7f5cfc22bd",
            },
            h("span", {
              key: 705,
              className: "v41-034ebdcf70",
            }),
            h(React.Fragment, { key: 706 }, "NOW SCREENING"),
          ),
          " ",
          h(
            "div",
            {
              key: 708,
              className: "v41-f0313ffa2a",
            },
            " ",
            h(
              "div",
              { key: 710, className: "v41-6370bb69dc" },
              " ",
              h(
                "span",
                {
                  key: 712,
                  className: "v41-bb5e28c269",
                },
                h(
                  React.Fragment,
                  { key: 713 },
                  "",
                  h("span", { className: "sc-interp", key: 1 }, v.featColl),
                  " · A five second film",
                ),
              ),
              " ",
              h(
                "h3",
                {
                  key: 715,
                  className: "v41-12abe76be1",
                },
                h(React.Fragment, { key: 716 }, "", h("span", { className: "sc-interp", key: 1 }, v.featTitle), ""),
              ),
              " ",
              h(
                "p",
                { key: 718, className: "v41-29d7128295" },
                h(React.Fragment, { key: 719 }, "", h("span", { className: "sc-interp", key: 1 }, v.featDesc), ""),
              ),
              " ",
            ),
            " ",
            h(
              "div",
              { key: 722, className: "v41-161d174efb" },
              " ",
              h(
                designSystem.Button,
                { key: 724, onClick: v.openFeature, size: "sm" },
                h(React.Fragment, { key: 725 }, "▶ Full screen"),
              ),
              " ",
              h(
                designSystem.Button,
                { key: 727, onClick: v.nextFilm, variant: "secondary", size: "sm" },
                h(React.Fragment, { key: 728 }, "Next film ▸"),
              ),
              " ",
            ),
            " ",
          ),
          " ",
        ),
        " ",
        h(
          "details",
          {
            key: 733,
            open: v.wide,
            className: "v41-0972b80530 film-library",
          },
          h("summary", null, "Browse the short films", h("span", { "aria-hidden": "true" }, "＋")),
          " ",
          h(
            "div",
            {
              key: 735,
              role: "group",
              "aria-label": "Film collections",
              className: "v41-c9dc9b5648",
            },
            " ",
            (function (parent) {
              return (v.collections || []).map((item, index) => {
                const v = { ...parent, c: item, $index: index };
                return h(
                  React.Fragment,
                  { key: index },
                  h(
                    "button",
                    { key: 738, type: "button", onClick: v.c.pick, className: classFor(v.c.style) },
                    h(React.Fragment, { key: 739 }, "", h("span", { className: "sc-interp", key: 1 }, v.c.label), ""),
                  ),
                );
              });
            })(v),
            " ",
          ),
          " ",
          h(
            "div",
            { key: 742, className: "v41-5e522fd9b2" },
            " ",
            (function (parent) {
              return (v.filmList || []).map((item, index) => {
                const v = { ...parent, f: item, $index: index };
                return h(
                  React.Fragment,
                  { key: index },
                  " ",
                  h(
                    "button",
                    {
                      key: 746,
                      type: "button",
                      onClick: v.f.pick,
                      onMouseEnter: v.f.enter,
                      onMouseLeave: v.f.leave,
                      "aria-pressed": v.f.pressed,
                      "aria-label": v.f.active ? `▶ NOW ${v.f.title}` : v.f.title,
                      "data-tilt": "10",
                      className: classFor(v.f.style),
                    },
                    " ",
                    h("img", {
                      key: 748,
                      "data-bound-src": v.f.poster,
                      alt: v.f.alt,
                      srcSet: v.f.srcSet,
                      sizes: "(max-width: 600px) 90vw, (max-width: 1179px) 45vw, 320px",
                      width: 1280,
                      height: 720,
                      loading: "lazy",
                      decoding: "async",
                      className: "v41-886a8b070f",
                    }),
                    " ",
                    h("video", {
                      key: 750,
                      "data-v": "hover",
                      "data-bound-src": v.f.src,
                      "data-bound-poster": v.f.poster,
                      preload: "none",
                      "aria-hidden": "true",
                      className: "v41-6b9a16d6dd",
                    }),
                    " ",
                    h("span", {
                      key: 752,
                      className: "v41-dd973cb810",
                    }),
                    " ",
                    v.f.active
                      ? h(
                          React.Fragment,
                          { key: 754 },
                          h(
                            "span",
                            {
                              key: 755,
                              className: "v41-175ed04e14",
                            },
                            h(React.Fragment, { key: 756 }, "▶ NOW"),
                          ),
                        )
                      : null,
                    " ",
                    h(
                      "span",
                      {
                        key: 758,
                        className: "v41-7eba9d7a87",
                      },
                      h(React.Fragment, { key: 759 }, "", h("span", { className: "sc-interp", key: 1 }, v.f.title), ""),
                    ),
                    " ",
                  ),
                  " ",
                );
              });
            })(v),
            " ",
          ),
          " ",
          h(
            "a",
            {
              key: 764,
              href: "/rooms/studios/interactive/",
              className: "v41-03b2c6df4d",
            },
            h(React.Fragment, { key: 765 }, "Open the Studios →"),
          ),
          " ",
        ),
        " ",
      ),
      " ",
    ),
    " ",
  );
}
