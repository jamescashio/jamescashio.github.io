import React from "react";
import { classFor } from "../style-variants.js";

const h = React.createElement;

export function WorldsSection({ v }) {
  return h(
    "section",
    {
      key: 583,
      id: "rooms",
      "data-screen-label": "Four worlds",
      className: "v41-43f26deb62",
    },
    " ",
    h(
      "div",
      {
        key: 585,
        "data-reveal": "",
        className: "v41-260a3097b1",
      },
      " ",
      h(
        "div",
        { key: 587, className: "v41-022625b12b" },
        " ",
        h(
          "span",
          {
            key: 589,
            className: "v41-c904563b29",
          },
          h("span", { key: 590, className: "v41-3bdbfd324b" }, h(React.Fragment, { key: 591 }, "03")),
          h("span", { key: 592, "data-scramble": "" }, h(React.Fragment, { key: 593 }, "Four worlds")),
        ),
        " ",
        h(
          "h2",
          {
            key: 595,
            className: "v41-0cf0266feb",
          },
          h(React.Fragment, { key: 596 }, "Pick a world. "),
          h("br", { key: 597 }),
          h("span", { key: 598, className: "v41-a05a8e3573" }, h(React.Fragment, { key: 599 }, "Stay a while.")),
        ),
        " ",
      ),
      " ",
      h(
        "p",
        {
          key: 602,
          className: "v41-17b9cd1b27",
        },
        h(
          React.Fragment,
          { key: 603 },
          "Fly, tinker, watch or read. Each world opens as its own page and brings you right back.",
        ),
      ),
      " ",
    ),
    " ",
    h(
      "div",
      {
        key: 606,
        className: "v41-8c6a0aa0ef",
      },
      " ",
      (function (parent) {
        return (v.worlds || []).map((item, index) => {
          const v = { ...parent, w: item, $index: index };
          return h(
            React.Fragment,
            { key: index },
            " ",
            h(
              "a",
              {
                key: 610,
                className: ["za-card-hover", "v41-cb6566847c"].filter(Boolean).join(" "),
                "data-reveal": "",
                "data-tilt": "8",
                href: v.w.href,
                onMouseEnter: v.w.enter,
                onMouseLeave: v.w.leave,
              },
              " ",
              h(
                "div",
                {
                  key: 612,
                  className: "v41-275d0e3b1c",
                },
                " ",
                h("img", {
                  key: 614,
                  "data-bound-src": v.w.img,
                  alt: v.w.alt,
                  srcSet: v.w.srcSet,
                  sizes: "(max-width: 600px) 90vw, (max-width: 1179px) 45vw, 320px",
                  width: 1280,
                  height: 720,
                  loading: "lazy",
                  decoding: "async",
                  className: "v41-886a8b070f",
                }),
                " ",
                v.w.hasVideo
                  ? h(
                      React.Fragment,
                      { key: 616 },
                      " ",
                      h("video", {
                        key: 618,
                        "data-v": "hover",
                        "data-bound-src": v.w.video,
                        "data-bound-poster": v.w.img,
                        preload: "none",
                        "aria-hidden": "true",
                        className: "v41-178f0ff19b",
                      }),
                      " ",
                    )
                  : null,
                " ",
                h("span", {
                  key: 621,
                  className: "v41-e50737f911",
                }),
                " ",
                h(
                  "span",
                  {
                    key: 623,
                    className: "v41-3c2654952f",
                  },
                  h(React.Fragment, { key: 624 }, "", h("span", { className: "sc-interp", key: 1 }, v.w.index), ""),
                ),
                " ",
                h("span", {
                  key: 626,
                  className: classFor(
                    [
                      "position:absolute;right:14px;top:14px;width:8px;height:8px;border-radius:50%;background:",
                      v.w.color ?? "",
                      ";box-shadow:0 0 12px ",
                      v.w.color ?? "",
                      "",
                    ].join(""),
                  ),
                }),
                " ",
              ),
              " ",
              h(
                "div",
                {
                  key: 629,
                  className: "v41-8db6431db6",
                },
                " ",
                h(
                  "span",
                  {
                    key: 631,
                    className: classFor(
                      [
                        "font-family:var(--font-mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:",
                        v.w.color ?? "",
                        "",
                      ].join(""),
                    ),
                  },
                  h(React.Fragment, { key: 632 }, "", h("span", { className: "sc-interp", key: 1 }, v.w.name), ""),
                ),
                " ",
                h(
                  "strong",
                  {
                    key: 634,
                    className: "v41-aee5c1c0e5",
                  },
                  h(React.Fragment, { key: 635 }, "", h("span", { className: "sc-interp", key: 1 }, v.w.line), ""),
                ),
                " ",
                h(
                  "span",
                  { key: 637, className: "v41-3fd1c5734b" },
                  h(React.Fragment, { key: 638 }, "", h("span", { className: "sc-interp", key: 1 }, v.w.desc), ""),
                ),
                " ",
                h(
                  "span",
                  {
                    key: 640,
                    className: "v41-fe7aa4b37b",
                  },
                  h(React.Fragment, { key: 641 }, "Open the page →"),
                ),
                " ",
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
      "nav",
      {
        key: 647,
        "aria-label": "Room reading editions",
        className: "v41-e74ee9b003",
      },
      h("span", { key: 648, className: "v41-c471889143" }, h(React.Fragment, { key: 649 }, "Reading editions:")),
      h("a", { key: 650, href: "/rooms/starship/" }, h(React.Fragment, { key: 651 }, "Starship lab")),
      h("a", { key: 652, href: "/rooms/principles/" }, h(React.Fragment, { key: 653 }, "Principles")),
      h("a", { key: 654, href: "/rooms/studios/" }, h(React.Fragment, { key: 655 }, "Studios")),
      h("a", { key: 656, href: "/rooms/heritage/" }, h(React.Fragment, { key: 657 }, "Flight heritage")),
    ),
    " ",
  );
}
