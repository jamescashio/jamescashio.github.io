import type { GeneratedView, GeneratedProps, GeneratedValue } from "../generated-view.ts";
import { renderExperimentsPart2 } from "./experiments-part-2.ts";

import React from "react";
import { classFor } from "../style-variants.ts";
import designSystem from "../design-system.ts";
import { h } from "../generated-view.ts";

export function ExperimentsSection({ v }: GeneratedProps) {
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
          h("span", { key: 988, className: "v41-3bdbfd324b" }, h(React.Fragment, { key: 989 }, "06")),
          h("span", { key: 990, "data-scramble": "" }, h(React.Fragment, { key: 991 }, "Seven experiments")),
        ),
        " ",
        h(
          "h2",
          {
            key: 993,
            className: "v41-0cf0266feb",
          },
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
          h(React.Fragment, { key: 1005 }, "Change an input. See the rule at work."),
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
        { className: "experiment-picker" },
        h("label", { htmlFor: "experiment-picker" }, "Choose an experiment"),
        h(
          "select",
          {
            id: "experiment-picker",
            value: v.experimentIndex,
            onChange: v.chooseExperiment,
            "aria-controls": "experiment-panel",
          },
          v.experiments.map((experiment: GeneratedValue, index: number) =>
            h("option", { key: experiment.id, value: index }, `${experiment.num} · ${experiment.name}`),
          ),
        ),
      ),
      h(
        "div",
        {
          key: 1011,
          role: "tablist",
          "aria-label": "Experiments",
          "aria-orientation": "vertical",
          className:
            "experiment-tabs " +
            classFor(["display:flex;flex-direction:column;gap:8px;grid-column:", v.tabsCol ?? "", ""].join("")),
        },
        " ",
        (function (parent: GeneratedView) {
          return (v.experiments || []).map((item: GeneratedValue, index: number) => {
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
          "aria-labelledby": "experiment-heading",
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
                id: "experiment-heading",
                key: 1044,
                className: "v41-eeec3df7ff",
              },
              h(React.Fragment, { key: 1045 }, "", h("span", { className: "sc-interp", key: 1 }, v.expName), ""),
            ),
            " ",
            v.isHermes ? renderExperimentsPart2(v) : null,
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
