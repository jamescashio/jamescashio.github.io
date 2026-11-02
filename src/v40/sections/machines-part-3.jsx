import { renderMachinesPart1 } from "./machines-part-1.ts";
import React from "react";
import { classFor } from "../style-variants.ts";

const h = React.createElement;
export function renderMachinesPart3(v) {
  return h(
    "div",
    {
      key: 1367,
      id: "request-map",
      className: "v41-983ff03b69",
    },
    " ",
    h("div", {
      key: 1369,
      "aria-hidden": "true",
      className: "v41-72ed6ccd25",
    }),
    " ",
    h(
      "div",
      {
        key: 1371,
        "aria-hidden": "true",
        className: "v41-867314bbee",
      },
      h("div", {
        key: 1372,
        className: "v41-d5891967a3",
      }),
    ),
    " ",
    h(
      "div",
      {
        key: 1374,
        "aria-hidden": "true",
        className: "v41-aed6e9a663",
      },
      h("div", {
        key: 1375,
        className: "v41-ead01e3206",
      }),
    ),
    " ",
    h(
      "div",
      {
        key: 1377,
        "aria-hidden": "true",
        className: "v41-f1c312a5a0",
      },
      h("div", {
        key: 1378,
        className: "v41-05d1201634",
      }),
    ),
    " ",
    renderMachinesPart1(v),
    " ",
    (function (parent) {
      return (v.nodes || []).map((item, index) => {
        const v = { ...parent, n: item, $index: index };
        return h(
          React.Fragment,
          { key: index },
          " ",
          h(
            "button",
            {
              key: 1428,
              type: "button",
              onClick: v.n.pick,
              "aria-pressed": v.n.pressed,
              className: classFor(v.n.style),
            },
            " ",
            h(
              "span",
              { key: 1430, className: classFor(v.n.core) },
              h("span", { key: 1431, "aria-hidden": "true", className: classFor(v.n.pulse) }),
              h("span", { key: 1432, "aria-hidden": "true", className: classFor(v.n.pulse2) }),
              h(React.Fragment, { key: 1433 }, "", h("span", { className: "sc-interp", key: 1 }, v.n.glyph), ""),
            ),
            " ",
            h(
              "span",
              {
                key: 1435,
                className: "v41-9eb7ef1938",
              },
              h(React.Fragment, { key: 1436 }, "", h("span", { className: "sc-interp", key: 1 }, v.n.name), ""),
            ),
            " ",
            h(
              "span",
              {
                key: 1438,
                className: "v41-be107ff401",
              },
              h(React.Fragment, { key: 1439 }, "", h("span", { className: "sc-interp", key: 1 }, v.n.detail), ""),
            ),
            " ",
          ),
          " ",
        );
      });
    })(v),
    " ",
    h(
      "div",
      {
        key: 1443,
        "aria-hidden": "true",
        className: "v41-0045e31d19",
      },
      h(React.Fragment, { key: 1444 }, "", h("span", { className: "sc-interp", key: 1 }, v.mapReadout), ""),
    ),
    " ",
    h(
      "div",
      {
        key: 1446,
        "aria-hidden": "true",
        className: classFor(
          [
            "position:absolute;right:12px;bottom:10px;display:flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:9px;letter-spacing:.18em;color:",
            v.mapStateColor ?? "",
            "",
          ].join(""),
        ),
      },
      h("span", {
        key: 1447,
        className: "v41-7bd1a2099c",
      }),
      h(React.Fragment, { key: 1448 }, "", h("span", { className: "sc-interp", key: 1 }, v.mapState), ""),
    ),
    " ",
  );
}
