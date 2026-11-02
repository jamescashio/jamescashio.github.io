import React from "react";
import { classFor } from "../style-variants.ts";
import designSystem from "../design-system.ts";
const h = React.createElement;
export function renderExperimentsPart1(v) {
  return h(
    "div",
    {
      key: 1052,
      className: "v41-0700af2f43",
    },
    " ",
    h(
      "div",
      { key: 1054, className: "v41-022625b12b" },
      " ",
      h("strong", { key: 1056, className: "v41-226444d366" }, h(React.Fragment, { key: 1057 }, "Choose the work")),
      " ",
      h(
        "div",
        { key: 1059, className: "v41-c9dc9b5648" },
        " ",
        (function (parent) {
          return (v.intents || []).map((item, index) => {
            const v = { ...parent, it: item, $index: index };
            return h(
              React.Fragment,
              { key: index },
              h(
                "button",
                { key: 1062, type: "button", onClick: v.it.pick, className: classFor(v.it.style) },
                h(React.Fragment, { key: 1063 }, "", h("span", { className: "sc-interp", key: 1 }, v.it.label), ""),
              ),
            );
          });
        })(v),
        " ",
      ),
      " ",
      h(
        "button",
        {
          key: 1066,
          type: "button",
          "aria-pressed": v.privatePressed,
          onClick: v.togglePrivate,
          className: classFor(v.privStyle),
        },
        h("span", { key: 1067 }, h(React.Fragment, { key: 1068 }, "Contains private information")),
        h(
          "span",
          { key: 1069, className: classFor(v.privKnob) },
          h("span", { key: 1070, className: classFor(v.privDot) }),
        ),
      ),
      " ",
      h(
        "button",
        {
          key: 1072,
          type: "button",
          "aria-pressed": v.sourcesPressed,
          onClick: v.toggleSources,
          className: classFor(v.srcStyle),
        },
        h("span", { key: 1073 }, h(React.Fragment, { key: 1074 }, "Requires attributable sources")),
        h(
          "span",
          { key: 1075, className: classFor(v.srcKnob) },
          h("span", { key: 1076, className: classFor(v.srcDot) }),
        ),
      ),
      " ",
      h(designSystem.Button, { key: 1078, onClick: v.route }, h(React.Fragment, { key: 1079 }, "Route this request")),
      " ",
    ),
    " ",
    h(
      "div",
      {
        key: 1082,
        className: "v41-86541ca156",
      },
      " ",
      h(
        "div",
        {
          key: 1084,
          className: "v41-9bff311f69",
        },
        h("span", { key: 1085, className: "v41-c471889143" }, h(React.Fragment, { key: 1086 }, "WHERE IT GOES")),
        h(
          "span",
          { key: 1087, className: classFor(["color:", v.laneColor ?? "", ""].join("")) },
          h(React.Fragment, { key: 1088 }, "", h("span", { className: "sc-interp", key: 1 }, v.laneCode), ""),
        ),
      ),
      " ",
      h(
        "div",
        { key: 1090, className: "v41-ad865dc6c6" },
        " ",
        h(
          "h4",
          {
            key: 1092,
            className: classFor(
              [
                "margin:0;font-family:var(--font-display);font-weight:800;font-size:clamp(20px,2.4vw,28px);color:",
                v.laneColor ?? "",
                ";text-shadow:0 0 20px ",
                v.laneColor ?? "",
                "",
              ].join(""),
            ),
          },
          h(React.Fragment, { key: 1093 }, "", h("span", { className: "sc-interp", key: 1 }, v.laneName), ""),
        ),
        " ",
        h(
          "span",
          {
            key: 1095,
            className: "v41-0ff86a6e0f",
          },
          h(React.Fragment, { key: 1096 }, "", h("span", { className: "sc-interp", key: 1 }, v.laneLabel), ""),
        ),
        " ",
      ),
      " ",
      h(
        "ol",
        {
          key: 1099,
          className: "v41-093e865861",
        },
        " ",
        (function (parent) {
          return (v.routeSteps || []).map((item, index) => {
            const v = { ...parent, s: item, $index: index };
            return h(
              React.Fragment,
              { key: index },
              " ",
              h(
                "li",
                { key: 1103, className: classFor(v.s.style) },
                h(
                  "span",
                  {
                    key: 1104,
                    className: classFor(
                      [
                        "font-family:var(--font-mono);font-size:10px;letter-spacing:.12em;color:",
                        v.s.color ?? "",
                        ";width:22px;flex:0 0 auto",
                      ].join(""),
                    ),
                  },
                  h(React.Fragment, { key: 1105 }, "", h("span", { className: "sc-interp", key: 1 }, v.s.n), ""),
                ),
                h(
                  "span",
                  { key: 1106, className: "v41-047d0f2421" },
                  h(React.Fragment, { key: 1107 }, "", h("span", { className: "sc-interp", key: 1 }, v.s.text), ""),
                ),
              ),
              " ",
            );
          });
        })(v),
        " ",
      ),
      " ",
      h(
        "p",
        {
          key: 1111,
          className: "v41-a34c8ac04c",
        },
        h(React.Fragment, { key: 1112 }, "", h("span", { className: "sc-interp", key: 1 }, v.routeDetail), ""),
      ),
      " ",
    ),
    " ",
  );
}
