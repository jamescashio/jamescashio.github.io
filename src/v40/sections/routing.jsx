import React from "react";

const h = React.createElement;

export function RoutingSection({ v }) {
  return h(
    "section",
    {
      key: 772,
      id: "law",
      "data-screen-label": "Routing law",
      "aria-label": "My routing law",
      className: "v41-8edc41569d",
    },
    " ",
    h(
      "div",
      {
        key: 774,
        className: "v41-a9dc66ad91",
      },
      " ",
      h("video", {
        key: 776,
        "data-v": "auto",
        src: "/assets/zenith/orbital-dust.mp4",
        poster: "/v40/assets/zenith-orbital-dust-poster.webp",
        preload: "none",
        "aria-hidden": "true",
        className: "v41-e7c7770202",
      }),
      " ",
      h("div", {
        key: 778,
        "aria-hidden": "true",
        className: "v41-7c26858f2c",
      }),
      " ",
      h(
        "div",
        {
          key: 780,
          className: "v41-e8c998b831",
        },
        " ",
        h(
          "span",
          {
            key: 782,
            className: "v41-c904563b29",
          },
          h("span", { key: 783, className: "v41-3bdbfd324b" }, h(React.Fragment, { key: 784 }, "05")),
          h("span", { key: 785, "data-scramble": "" }, h(React.Fragment, { key: 786 }, "How I route AI work")),
        ),
        " ",
        h(
          "p",
          {
            key: 788,
            className: "v41-2916c53d46",
          },
          " ",
          (function (parent) {
            return (v.lawA || []).map((item, index) => {
              const v = { ...parent, w: item, $index: index };
              return h(
                React.Fragment,
                { key: index },
                h(
                  "span",
                  { key: 791, "data-mword": "a", className: "v41-0b576c2d3e" },
                  h(React.Fragment, { key: 792 }, "", h("span", { className: "sc-interp", key: 1 }, v.w.t), ""),
                ),
              );
            });
          })(v),
          " ",
        ),
        " ",
        h(
          "p",
          {
            key: 795,
            className: "v41-f216498d54",
          },
          " ",
          (function (parent) {
            return (v.lawB || []).map((item, index) => {
              const v = { ...parent, w: item, $index: index };
              return h(
                React.Fragment,
                { key: index },
                h(
                  "span",
                  { key: 798, "data-mword": "b", className: "v41-0b576c2d3e" },
                  h(React.Fragment, { key: 799 }, "", h("span", { className: "sc-interp", key: 1 }, v.w.t), ""),
                ),
              );
            });
          })(v),
          " ",
        ),
        " ",
        h(
          "div",
          { key: 802, className: "v41-4ded416ea6" },
          " ",
          h(
            "div",
            {
              key: 804,
              "aria-hidden": "true",
              className: "v41-685e3c40a7",
            },
            h("div", {
              key: 805,
              id: "law-bar",
              className: "v41-38ecb1dcfc",
            }),
          ),
          " ",
          h(
            "span",
            {
              key: 807,
              className: "v41-f959088bbe",
            },
            h(React.Fragment, { key: 808 }, "My routing law · published in the dated export"),
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
