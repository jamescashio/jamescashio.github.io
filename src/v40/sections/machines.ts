import type { GeneratedView, GeneratedProps, GeneratedValue } from "../generated-view.ts";
import { renderMachinesPart3 } from "./machines-part-3.ts";
import { renderMachinesPart2 } from "./machines-part-2.ts";

import React from "react";
import { classFor } from "../style-variants.ts";
import designSystem from "../design-system.ts";
import { h } from "../generated-view.ts";

export function MachinesSection({ v }: GeneratedProps) {
  return h(
    "section",
    {
      key: 1222,
      id: "universe",
      "data-screen-label": "System map",
      className: "v41-43f26deb62",
    },
    " ",
    h(
      "div",
      {
        key: 1224,
        "data-reveal": "",
        className: "v41-9c7621c882",
      },
      " ",
      h(
        "div",
        { key: 1226, className: "v41-022625b12b" },
        " ",
        h(
          "span",
          {
            key: 1228,
            className: "v41-c904563b29",
          },
          h("span", { key: 1229, className: "v41-3bdbfd324b" }, h(React.Fragment, { key: 1230 }, "07")),
          h("span", { key: 1231, "data-scramble": "" }, h(React.Fragment, { key: 1232 }, "The system map")),
        ),
        " ",
        h(
          "h2",
          {
            key: 1234,
            className: "v41-0cf0266feb",
          },
          h(React.Fragment, { key: 1235 }, "Meet the machines."),
        ),
        " ",
      ),
      " ",
      h(
        "div",
        { key: 1238, className: "v41-f0de252a84" },
        " ",
        h(
          "p",
          {
            key: 1240,
            className: "v41-d694e61e67",
          },
          h(
            React.Fragment,
            { key: 1241 },
            "Two servers I own, Zeus and Apollo, do the computing. Hermes, my job scheduler, decides where each task goes, and my operator console (DSH) is where I watch and approve. Follow one request across them.",
          ),
        ),
        " ",
        v.tech
          ? h(
              React.Fragment,
              { key: 1243 },
              " ",
              h(
                "p",
                {
                  key: 1245,
                  className: "v41-cb72f7ea66",
                },
                h(
                  "span",
                  {
                    key: 1246,
                    className: "v41-c5c887fb10",
                  },
                  h(React.Fragment, { key: 1247 }, "FOR ENGINEERS"),
                ),
                h(
                  React.Fragment,
                  { key: 1248 },
                  v.fleetSummary +
                    ". Observed " +
                    v.observedDate +
                    ". Scheduler counts are withheld. This is a deterministic model, not a trace of production traffic.",
                ),
              ),
              " ",
            )
          : null,
        " ",
      ),
      " ",
    ),
    " ",
    h(
      "div",
      {
        key: 1253,
        className: "v41-939c047562",
      },
      " ",
      renderMachinesPart2(v),
      " ",
      h(
        "div",
        { key: 1315, className: "v41-0972b80530" },
        " ",
        h(
          "div",
          {
            key: 1317,
            className: "v41-d1d9fd1b57",
          },
          " ",
          h(
            "span",
            {
              key: 1319,
              className: "v41-41c1ce4116",
            },
            h("span", {
              key: 1320,
              className: "v41-e334e2cfa9",
            }),
            h(React.Fragment, { key: 1321 }, "System map · Conceptual view"),
          ),
          " ",
          h(
            designSystem.Button,
            { key: 1323, onClick: v.trace, variant: "engage", size: "sm" },
            h(React.Fragment, { key: 1324 }, "", h("span", { className: "sc-interp", key: 1 }, v.traceLabel), ""),
          ),
          " ",
        ),
        " ",
        h(
          "div",
          {
            key: 1327,
            className: "v41-4beb36b010",
          },
          " ",
          h(
            "div",
            {
              key: 1329,
              className: "v41-14a0552eb4",
            },
            " ",
            h(
              "div",
              { key: 1331, className: "v41-75b7cae809" },
              h(
                "span",
                {
                  key: 1332,
                  className: "v41-e863ff4f12",
                },
                h(React.Fragment, { key: 1333 }, "YOUR SAMPLE REQUEST"),
              ),
              h(
                "span",
                { key: 1334, className: "v41-226444d366" },
                h(
                  React.Fragment,
                  { key: 1335 },
                  "",
                  h("span", { className: "sc-interp", key: 1 }, v.requestSource),
                  "",
                ),
              ),
            ),
            " ",
            h(
              "div",
              { key: 1337, role: "group", "aria-label": "Request privacy", className: "v41-69374f356a" },
              " ",
              (function (parent: GeneratedView) {
                return (v.traceChoices || []).map((item: GeneratedValue, index: number) => {
                  const v = { ...parent, t: item, $index: index };
                  return h(
                    React.Fragment,
                    { key: index },
                    h(
                      "button",
                      { key: 1340, type: "button", onClick: v.t.pick, className: classFor(v.t.style) },
                      h(
                        React.Fragment,
                        { key: 1341 },
                        "",
                        h("span", { className: "sc-interp", key: 1 }, v.t.label),
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
              "div",
              { key: 1344, className: "v41-f5316aec9b" },
              h(
                "span",
                {
                  key: 1345,
                  className: "v41-e6ad5d483a",
                },
                h(React.Fragment, { key: 1346 }, "ROUTE CHOSEN"),
              ),
              h(
                "strong",
                {
                  key: 1347,
                  className: classFor(
                    ["font-family:var(--font-display);font-size:15px;color:", v.traceOutcomeColor ?? "", ""].join(""),
                  ),
                },
                h(React.Fragment, { key: 1348 }, "", h("span", { className: "sc-interp", key: 1 }, v.traceOutcome), ""),
              ),
            ),
            " ",
          ),
          " ",
          h(
            "div",
            {
              key: 1351,
              className: "v41-26d82015c5",
              role: "status",
            },
            h(React.Fragment, { key: 1352 }, "", h("span", { className: "sc-interp", key: 1 }, v.traceCaption), ""),
          ),
          " ",
          h(
            "div",
            { key: 1354, className: "v41-3cc4a3e0f3" },
            h("div", {
              key: 1355,
              className: classFor(
                [
                  "height:100%;width:",
                  v.traceProgress ?? "",
                  "%;background:linear-gradient(90deg,var(--cyan),var(--accent));box-shadow:0 0 10px var(--cyan-glow);transition:width .6s cubic-bezier(.23,1,.32,1)",
                ].join(""),
              ),
            }),
          ),
          " ",
          h(
            "ol",
            {
              key: 1357,
              "aria-label": "Request trace stages",
              className: "v41-5656f4e91c",
            },
            " ",
            (function (parent: GeneratedView) {
              return (v.stages || []).map((item: GeneratedValue, index: number) => {
                const v = { ...parent, st: item, $index: index };
                return h(
                  React.Fragment,
                  { key: index },
                  h(
                    "li",
                    { key: 1360, className: classFor(v.st.style) },
                    h(
                      "span",
                      {
                        key: 1361,
                        className: "v41-938b646ad5",
                      },
                      h(React.Fragment, { key: 1362 }, "", h("span", { className: "sc-interp", key: 1 }, v.st.n), ""),
                    ),
                    h(
                      "span",
                      {
                        key: 1363,
                        className: "v41-4e9c8c6c58",
                      },
                      h(
                        React.Fragment,
                        { key: 1364 },
                        "",
                        h("span", { className: "sc-interp", key: 1 }, v.st.label),
                        "",
                      ),
                    ),
                  ),
                );
              });
            })(v),
            " ",
          ),
          " ",
          renderMachinesPart3(v),
          " ",
          h(
            "div",
            {
              key: 1451,
              className: "v41-0a82ade981",
            },
            " ",
            h(
              "p",
              { key: 1453, className: "v41-55ebc647f3" },
              h(React.Fragment, { key: 1454 }, "The same request and routing rule as the HERMES experiment."),
            ),
            " ",
            h(
              "a",
              { key: 1456, href: "#studies", onClick: v.continueHermes, className: "v41-6e8bcfac8d" },
              h(React.Fragment, { key: 1457 }, "Continue with these settings in HERMES ↑"),
            ),
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
