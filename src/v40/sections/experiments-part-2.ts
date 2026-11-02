import type { GeneratedView } from "../generated-view.ts";
import { renderExperimentsPart1 } from "./experiments-part-1.ts";
import React from "react";

import designSystem from "../design-system.ts";
import { h } from "../generated-view.ts";
export function renderExperimentsPart2(v: GeneratedView) {
  return h(
    React.Fragment,
    { key: 1047 },
    " ",
    h(
      "p",
      { key: 1049, className: "v41-a6256af1e9" },
      h(React.Fragment, { key: 1050 }, "Choose the work. Add a boundary. See the route."),
    ),
    " ",
    renderExperimentsPart1(v),
    " ",
    h(
      "div",
      {
        key: 1116,
        className: "v41-083f94f482",
      },
      " ",
      h(
        "div",
        { key: 1118, className: "v41-0fbf9e859f" },
        " ",
        h(
          "span",
          {
            key: 1120,
            className: "v41-e6ad5d483a",
          },
          h(React.Fragment, { key: 1121 }, "WHY IT MATTERS"),
        ),
        " ",
        h(
          "span",
          { key: 1123, className: "v41-9549d2b234" },
          h(
            React.Fragment,
            { key: 1124 },
            "Everyday work goes to a general model. Asking for sources sends it to a research model. Private information always brings in a person. That one rule keeps AI costs down without cutting corners.",
          ),
        ),
        " ",
        h(
          "a",
          {
            key: 1126,
            href: "https://github.com/jamescashio/jamescashio.github.io/blob/82425d30fb0e6d2c7891281ded0423b854d6f23d/src/odyssey/data.ts",
            className: "v41-f4d14c945c",
          },
          h(React.Fragment, { key: 1127 }, "Inspect the routing rule in the released code ↗"),
        ),
        " ",
        h(
          "div",
          { key: 1129, className: "v41-c9dc9b5648" },
          " ",
          h(
            designSystem.Button,
            { key: 1131, as: "a", href: "#universe", variant: "ghost", size: "sm" },
            h(React.Fragment, { key: 1132 }, "Trace this decision ↓"),
          ),
          " ",
          h(
            designSystem.Button,
            { key: 1134, onClick: v.copySettings, variant: "secondary", size: "sm" },
            h(React.Fragment, { key: 1135 }, "", h("span", { className: "sc-interp", key: 1 }, v.copyLabel), ""),
          ),
          " ",
        ),
        " ",
      ),
      " ",
      h(
        "div",
        {
          key: 1139,
          className: "v41-1278d81cb0",
        },
        " ",
        h(
          "details",
          { key: 1141 },
          " ",
          h(
            "summary",
            {
              key: 1143,
              className: "v41-00bd1dd87d",
            },
            h(React.Fragment, { key: 1144 }, "Rule, limits and a test to try ▾"),
          ),
          " ",
          h(
            "div",
            {
              key: 1146,
              className: "v41-15e503bb74",
            },
            " ",
            h(
              "p",
              { key: 1148, className: "v41-55ebc647f3" },
              h(React.Fragment, { key: 1149 }, "Change the inputs. See the rule choose a route."),
            ),
            " ",
            h(
              "p",
              { key: 1151, className: "v41-ab79ea2b85" },
              h(
                "strong",
                { key: 1152 },
                h(React.Fragment, { key: 1153 }, "Intent and sources choose the route. Privacy can overrule both."),
              ),
            ),
            " ",
            h(
              "span",
              { key: 1155, className: "v41-7f509bf0a3" },
              h(React.Fragment, { key: 1156 }, "What wins when intent, evidence requirements, and privacy disagree?"),
            ),
            " ",
            h(
              "div",
              {
                key: 1158,
                className: "v41-78ada769f8",
              },
              " ",
              h(
                "span",
                {
                  key: 1160,
                  className: "v41-8edad05aca",
                },
                h(React.Fragment, { key: 1161 }, "RULE"),
              ),
              h(
                "span",
                { key: 1162, className: "v41-c471889143" },
                h(
                  React.Fragment,
                  { key: 1163 },
                  "Private input always holds the external route for human review. Otherwise, Research intent or a source requirement selects Research. Analyze selects Synthesis; Draft selects Workhorse.",
                ),
              ),
              " ",
              h(
                "span",
                {
                  key: 1165,
                  className: "v41-8edad05aca",
                },
                h(React.Fragment, { key: 1166 }, "TRY THIS"),
              ),
              h(
                "span",
                { key: 1167, className: "v41-c471889143" },
                h(
                  React.Fragment,
                  { key: 1168 },
                  "Choose Analyze and require sources: Research wins. Now turn on private information: Human review wins. Change the intent again; the privacy boundary holds.",
                ),
              ),
              " ",
              h(
                "span",
                {
                  key: 1170,
                  className: "v41-8edad05aca",
                },
                h(React.Fragment, { key: 1171 }, "BOUNDARY"),
              ),
              h(
                "span",
                { key: 1172, className: "v41-c471889143" },
                h(
                  React.Fragment,
                  { key: 1173 },
                  "A deterministic routing model with four outcomes. It calls no model, measures no provider, and does not establish the current HERMES deployment’s behavior.",
                ),
              ),
              " ",
            ),
            " ",
          ),
          " ",
        ),
        " ",
        h(
          "div",
          {
            key: 1178,
            className: "v41-727e8ebe60",
          },
          " ",
          h(
            "span",
            {
              key: 1180,
              className: "v41-1d10ce8d52",
            },
            h(React.Fragment, { key: 1181 }, "NEXT / Know when to pause"),
          ),
          " ",
          h(
            "button",
            {
              key: 1183,
              type: "button",
              onClick: v.nextExp,
              className: "v41-56b67b2b23",
            },
            h(React.Fragment, { key: 1184 }, "When should automation stop and ask a person? →"),
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
