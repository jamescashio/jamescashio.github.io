import React from "react";
import { classFor } from "../style-variants.js";
import designSystem from "../design-system.js";
const h = React.createElement;

export function ExperimentsSection({ v }) {
  return h(
    "section",
    {
      key: 981,
      id: "studies",
      "data-screen-label": "Seven experiments",
      className: "v41-43f26deb62",
    },
    " ",
    h(
      "div",
      {
        key: 983,
        "data-reveal": "",
        className: "v41-260a3097b1",
      },
      " ",
      h(
        "div",
        { key: 985, className: "v41-022625b12b" },
        " ",
        h(
          "span",
          {
            key: 987,
            className: "v41-c904563b29",
          },
          h("span", { key: 988, className: "v41-3bdbfd324b" }, h(React.Fragment, { key: 989 }, "07")),
          h(
            "span",
            { key: 990, "data-scramble": "" },
            h(React.Fragment, { key: 991 }, "Go deeper / Seven experiments"),
          ),
        ),
        " ",
        h(
          "h2",
          {
            key: 993,
            className: "v41-0cf0266feb",
          },
          h(React.Fragment, { key: 994 }, "Seven questions."),
          h("br", { key: 995 }),
          h(React.Fragment, { key: 996 }, "Take the controls."),
        ),
        " ",
      ),
      " ",
      h(
        "div",
        { key: 999, className: "v41-a03e9ddd09" },
        " ",
        h(
          "span",
          {
            key: 1001,
            className: "v41-f959088bbe",
          },
          h(React.Fragment, { key: 1002 }, "Simulations · In your browser"),
        ),
        " ",
        h(
          "p",
          { key: 1004, className: "v41-ae4d8addf2" },
          h(React.Fragment, { key: 1005 }, "Choose a question. Change the inputs. See the rule at work."),
        ),
        " ",
      ),
      " ",
    ),
    " ",
    h(
      "div",
      {
        key: 1009,
        className: "v41-c28b1a1d63",
      },
      " ",
      h(
        "div",
        {
          key: 1011,
          role: "tablist",
          "aria-label": "Experiments",
          "aria-orientation": "vertical",
          className: classFor(
            ["display:flex;flex-direction:column;gap:8px;grid-column:", v.tabsCol ?? "", ""].join(""),
          ),
        },
        " ",
        (function (parent) {
          return (v.experiments || []).map((item, index) => {
            const v = { ...parent, e: item, $index: index };
            return h(
              React.Fragment,
              { key: index },
              " ",
              h(
                "button",
                {
                  key: 1015,
                  role: "tab",
                  id: v.e.id,
                  "aria-selected": v.e.selected,
                  "aria-controls": "experiment-panel",
                  tabIndex: v.e.tabindex,
                  type: "button",
                  onClick: v.e.pick,
                  className: classFor(v.e.style),
                },
                " ",
                h(
                  "span",
                  {
                    key: 1017,
                    className: classFor(
                      [
                        "font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;color:",
                        v.e.numColor ?? "",
                        ";width:28px;flex:0 0 auto",
                      ].join(""),
                    ),
                  },
                  h(React.Fragment, { key: 1018 }, "", h("span", { className: "sc-interp", key: 1 }, v.e.num), ""),
                ),
                " ",
                h(
                  "span",
                  {
                    key: 1020,
                    className: "v41-c5e90a6a35",
                  },
                  " ",
                  h(
                    "span",
                    {
                      key: 1022,
                      className: "v41-e4c2b8da63",
                    },
                    h(React.Fragment, { key: 1023 }, "", h("span", { className: "sc-interp", key: 1 }, v.e.name), ""),
                  ),
                  " ",
                  h(
                    "span",
                    {
                      key: 1025,
                      className: "v41-9ef1e27321",
                    },
                    h(React.Fragment, { key: 1026 }, "", h("span", { className: "sc-interp", key: 1 }, v.e.code), ""),
                  ),
                  " ",
                ),
                " ",
                h(
                  "span",
                  {
                    key: 1029,
                    className: classFor(
                      [
                        "margin-left:auto;font-family:var(--font-mono);font-size:11px;color:",
                        v.e.numColor ?? "",
                        "",
                      ].join(""),
                    ),
                  },
                  h(React.Fragment, { key: 1030 }, "▸"),
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
        "div",
        {
          key: 1035,
          role: "tabpanel",
          id: "experiment-panel",
          "aria-labelledby": v.selectedExperiment,
          tabIndex: "0",
          className: classFor(["grid-column:", v.panelCol ?? "", ";min-width:0"].join("")),
        },
        " ",
        h(
          designSystem.Panel,
          { key: 1037, color: v.expColor, title: v.expTitle, icon: "▸" },
          " ",
          h(
            "div",
            { key: 1039, className: "v41-84e5cd0cb2" },
            " ",
            h(
              "span",
              {
                key: 1041,
                className: "v41-f959088bbe",
              },
              h(
                React.Fragment,
                { key: 1042 },
                "Experiment ",
                h("span", { className: "sc-interp", key: 1 }, v.expNum),
                " of 07 · ",
                h("span", { className: "sc-interp", key: 3 }, v.expCode),
                "",
              ),
            ),
            " ",
            h(
              "h3",
              {
                key: 1044,
                className: "v41-eeec3df7ff",
              },
              h(React.Fragment, { key: 1045 }, "", h("span", { className: "sc-interp", key: 1 }, v.expName), ""),
            ),
            " ",
            v.isHermes
              ? h(
                  React.Fragment,
                  { key: 1047 },
                  " ",
                  h(
                    "p",
                    { key: 1049, className: "v41-a6256af1e9" },
                    h(React.Fragment, { key: 1050 }, "Choose the work. Add a boundary. See the route."),
                  ),
                  " ",
                  h(
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
                      h(
                        "strong",
                        { key: 1056, className: "v41-226444d366" },
                        h(React.Fragment, { key: 1057 }, "Choose the work"),
                      ),
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
                                h(
                                  React.Fragment,
                                  { key: 1063 },
                                  "",
                                  h("span", { className: "sc-interp", key: 1 }, v.it.label),
                                  "",
                                ),
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
                      h(
                        designSystem.Button,
                        { key: 1078, onClick: v.route },
                        h(React.Fragment, { key: 1079 }, "Route this request"),
                      ),
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
                        h(
                          "span",
                          { key: 1085, className: "v41-c471889143" },
                          h(React.Fragment, { key: 1086 }, "WHERE IT GOES"),
                        ),
                        h(
                          "span",
                          { key: 1087, className: classFor(["color:", v.laneColor ?? "", ""].join("")) },
                          h(
                            React.Fragment,
                            { key: 1088 },
                            "",
                            h("span", { className: "sc-interp", key: 1 }, v.laneCode),
                            "",
                          ),
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
                          h(
                            React.Fragment,
                            { key: 1093 },
                            "",
                            h("span", { className: "sc-interp", key: 1 }, v.laneName),
                            "",
                          ),
                        ),
                        " ",
                        h(
                          "span",
                          {
                            key: 1095,
                            className: "v41-0ff86a6e0f",
                          },
                          h(
                            React.Fragment,
                            { key: 1096 },
                            "",
                            h("span", { className: "sc-interp", key: 1 }, v.laneLabel),
                            "",
                          ),
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
                                  h(
                                    React.Fragment,
                                    { key: 1105 },
                                    "",
                                    h("span", { className: "sc-interp", key: 1 }, v.s.n),
                                    "",
                                  ),
                                ),
                                h(
                                  "span",
                                  { key: 1106, className: "v41-047d0f2421" },
                                  h(
                                    React.Fragment,
                                    { key: 1107 },
                                    "",
                                    h("span", { className: "sc-interp", key: 1 }, v.s.text),
                                    "",
                                  ),
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
                        h(
                          React.Fragment,
                          { key: 1112 },
                          "",
                          h("span", { className: "sc-interp", key: 1 }, v.routeDetail),
                          "",
                        ),
                      ),
                      " ",
                    ),
                    " ",
                  ),
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
                          h(
                            React.Fragment,
                            { key: 1135 },
                            "",
                            h("span", { className: "sc-interp", key: 1 }, v.copyLabel),
                            "",
                          ),
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
                              h(
                                React.Fragment,
                                { key: 1153 },
                                "Intent and sources choose the route. Privacy can overrule both.",
                              ),
                            ),
                          ),
                          " ",
                          h(
                            "span",
                            { key: 1155, className: "v41-7f509bf0a3" },
                            h(
                              React.Fragment,
                              { key: 1156 },
                              "What wins when intent, evidence requirements, and privacy disagree?",
                            ),
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
                )
              : null,
            " ",
            v.notHermes
              ? h(
                  React.Fragment,
                  { key: 1190 },
                  " ",
                  h(
                    "p",
                    {
                      key: 1192,
                      className: "v41-b9fe4c7d83",
                    },
                    h(React.Fragment, { key: 1193 }, "", h("span", { className: "sc-interp", key: 1 }, v.expLede), ""),
                  ),
                  " ",
                  h("div", { key: 1195, id: "local-experiment", "data-lab": v.expId }),
                  " ",
                  h(
                    "div",
                    {
                      key: 1197,
                      className: "v41-db29056985",
                    },
                    " ",
                    h(
                      "span",
                      {
                        key: 1199,
                        className: "v41-e6ad5d483a",
                      },
                      h(React.Fragment, { key: 1200 }, "EXPLORE THE ORIGINAL EDITION"),
                    ),
                    " ",
                    h(
                      "span",
                      {
                        key: 1202,
                        className: "v41-c465eaa9ce",
                      },
                      h(React.Fragment, { key: 1203 }, "Continue exploring the original experience on cashio.us."),
                    ),
                    " ",
                    h(
                      "div",
                      { key: 1205, className: "v41-161d174efb" },
                      " ",
                      h(
                        designSystem.Button,
                        { key: 1207, as: "a", href: v.expHref, size: "sm" },
                        h(React.Fragment, { key: 1208 }, "Open original experiment ↗"),
                      ),
                      " ",
                      h(
                        designSystem.Button,
                        { key: 1210, onClick: v.nextExp, variant: "ghost", size: "sm" },
                        h(React.Fragment, { key: 1211 }, "Next experiment ▸"),
                      ),
                      " ",
                    ),
                    " ",
                  ),
                  " ",
                )
              : null,
            " ",
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
