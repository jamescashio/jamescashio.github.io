import React from "react";

import { classFor } from "./style-variants.js";
const h = React.createElement;

export function renderRail(v) {
  return h(
    "nav",
    {
      key: 7,
      "aria-label": "Sections",
      className: "v41-694c044682",
    },
    " ",
    h(
      "a",
      {
        key: 9,
        href: "#top",
        className: "v41-72a932cfed",
      },
      h(React.Fragment, { key: 10 }, "c"),
      h("span", { key: 11, className: "v41-097ae647c2" }, h(React.Fragment, { key: 12 }, "A")),
      h("span", { key: 13, className: "v41-aab9b2719f" }, h(React.Fragment, { key: 14 }, "I")),
    ),
    " ",
    h(
      "div",
      {
        key: 16,
        className: "v41-a0e1b1fc48",
      },
      " ",
      (function (parent) {
        return (v.railItems || []).map((item, index) => {
          const v = { ...parent, r: item, $index: index };
          return h(
            React.Fragment,
            { key: index },
            " ",
            h(
              "a",
              { key: 20, href: v.r.href, title: v.r.label, className: classFor(v.r.style) },
              " ",
              h("span", {
                key: 22,
                className: "v41-b5d5368cf2",
              }),
              " ",
              h(
                "span",
                {
                  key: 24,
                  className: "v41-cbba20e481",
                },
                h(React.Fragment, { key: 25 }, "", h("span", { className: "sc-interp", key: 1 }, v.r.label), ""),
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
  );
}
