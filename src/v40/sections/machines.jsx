import React from "react";
import { classFor } from "../style-variants.js";
import designSystem from "../design-system.js";
const h = React.createElement;

export function MachinesSection({ v }) {
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
          h("span", { key: 1229, className: "v41-3bdbfd324b" }, h(React.Fragment, { key: 1230 }, "08")),
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
      h(
        "div",
        { key: 1255, className: "v41-84e5cd0cb2" },
        " ",
        h(
          designSystem.Panel,
          { key: 1257, color: v.nodeColor, title: v.nodeTitle, icon: "▸", tag: v.selectedTag },
          " ",
          h(
            "div",
            { key: 1259, className: "v41-89086d4ee3" },
            " ",
            h(
              "span",
              {
                key: 1261,
                className: "v41-f959088bbe",
              },
              h(React.Fragment, { key: 1262 }, "", h("span", { className: "sc-interp", key: 1 }, v.nodeRole), ""),
            ),
            " ",
            h(
              "div",
              { key: 1264, className: "v41-382ebf0ed3" },
              " ",
              h(
                "span",
                {
                  key: 1266,
                  className: "v41-dd6d2d84f6",
                },
                h(React.Fragment, { key: 1267 }, "", h("span", { className: "sc-interp", key: 1 }, v.nodeValue), ""),
              ),
              " ",
              h(
                "span",
                {
                  key: 1269,
                  className: "v41-cba1cb3df7",
                },
                h(React.Fragment, { key: 1270 }, "", h("span", { className: "sc-interp", key: 1 }, v.nodeUnit), ""),
              ),
              " ",
            ),
            " ",
            h(
              "strong",
              { key: 1273, className: "v41-a3970b9f8a" },
              h(React.Fragment, { key: 1274 }, "", h("span", { className: "sc-interp", key: 1 }, v.nodeSummary), ""),
            ),
            " ",
            h(
              "p",
              { key: 1276, className: "v41-d43f728d70" },
              h(React.Fragment, { key: 1277 }, "", h("span", { className: "sc-interp", key: 1 }, v.nodeBody), ""),
            ),
            " ",
            h(
              "span",
              {
                key: 1279,
                className: "v41-7019b89907",
              },
              h(React.Fragment, { key: 1280 }, "", h("span", { className: "sc-interp", key: 1 }, v.nodeEvidence), ""),
            ),
            " ",
          ),
          " ",
        ),
        " ",
        h(
          "div",
          { key: 1284, className: "v41-c478458c61" },
          " ",
          h(designSystem.StatCell, { key: 1286, value: String(v.snapshot.cluster.hostsOnline), label: "hosts" }),
          " ",
          h(designSystem.StatCell, { key: 1288, value: String(v.snapshot.containers.running), label: "containers" }),
          " ",
          h(designSystem.StatCell, {
            key: 1290,
            value: String(v.snapshot.virtualMachines.running),
            label: "virtual machine",
          }),
          " ",
        ),
        " ",
        h(
          "div",
          { key: 1293, className: "v41-f94fad0e44" },
          h(
            "span",
            {
              key: 1294,
              className: "v41-f959088bbe",
            },
            h(React.Fragment, { key: 1295 }, "Fleet · " + v.observedDate),
          ),
          h(
            "a",
            { key: 1296, href: "#evidence", className: "v41-6e8bcfac8d" },
            h(React.Fragment, { key: 1297 }, "Inspect the dated evidence ↓"),
          ),
        ),
        " ",
        h(
          designSystem.Terminal,
          { key: 1299, title: "hermes://trace", hint: "NO REQUEST SENT", bodyHeight: v.traceLogHeight },
          " ",
          h(
            "div",
            {
              key: 1301,
              id: "trace-out",
              role: "log",
              "aria-label": "Request trace",
              "aria-live": "polite",
              className: "v41-fb97ac650b",
            },
            " ",
            (function (parent) {
              return (v.traceLog || []).map((item, index) => {
                const v = { ...parent, l: item, $index: index };
                return h(
                  React.Fragment,
                  { key: index },
                  h(
                    "div",
                    { key: 1304, className: classFor(v.l.style) },
                    h(
                      "span",
                      { key: 1305, className: "v41-c471889143" },
                      h(React.Fragment, { key: 1306 }, "", h("span", { className: "sc-interp", key: 1 }, v.l.ts), ""),
                    ),
                    " ",
                    h(
                      "span",
                      { key: 1308, className: classFor(["color:", v.l.color ?? "", ""].join("")) },
                      h(React.Fragment, { key: 1309 }, "", h("span", { className: "sc-interp", key: 1 }, v.l.tag), ""),
                    ),
                    h(React.Fragment, { key: 1310 }, " ", h("span", { className: "sc-interp", key: 1 }, v.l.text), ""),
                  ),
                );
              });
            })(v),
            " ",
          ),
          " ",
        ),
        " ",
      ),
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
              (function (parent) {
                return (v.traceChoices || []).map((item, index) => {
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
            (function (parent) {
              return (v.stages || []).map((item, index) => {
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
          h(
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
            h(
              "svg",
              {
                key: 1380,
                viewBox: "0 0 400 300",
                preserveAspectRatio: "xMidYMid meet",
                "aria-hidden": "true",
                className: "v41-3479efb15b",
              },
              " ",
              h(
                "g",
                { key: 1382 },
                " ",
                h("path", {
                  key: 1384,
                  d: "M200 40 Q110 50 64 108",
                  fill: "none",
                  stroke: "rgba(255,255,255,.09)",
                  strokeWidth: "1.5",
                  vectorEffect: "non-scaling-stroke",
                }),
                " ",
                h("path", {
                  key: 1386,
                  d: "M200 40 Q110 50 64 108",
                  fill: "none",
                  strokeLinecap: "round",
                  vectorEffect: "non-scaling-stroke",
                  className: classFor(v.eOpDsh.glow),
                }),
                " ",
                h("path", {
                  key: 1388,
                  d: "M200 40 Q110 50 64 108",
                  fill: "none",
                  strokeLinecap: "round",
                  vectorEffect: "non-scaling-stroke",
                  className: classFor(v.eOpDsh.flow),
                }),
                " ",
                h("path", {
                  key: 1390,
                  d: "M64 108 Q120 150 200 150",
                  fill: "none",
                  stroke: "rgba(255,255,255,.09)",
                  strokeWidth: "1.5",
                  vectorEffect: "non-scaling-stroke",
                }),
                " ",
                h("path", {
                  key: 1392,
                  d: "M64 108 Q120 150 200 150",
                  fill: "none",
                  strokeLinecap: "round",
                  vectorEffect: "non-scaling-stroke",
                  className: classFor(v.eDshHe.glow),
                }),
                " ",
                h("path", {
                  key: 1394,
                  d: "M64 108 Q120 150 200 150",
                  fill: "none",
                  strokeLinecap: "round",
                  vectorEffect: "non-scaling-stroke",
                  className: classFor(v.eDshHe.flow),
                }),
                " ",
                h("path", {
                  key: 1396,
                  d: "M200 40 L200 150",
                  fill: "none",
                  stroke: "rgba(255,255,255,.09)",
                  strokeWidth: "1.5",
                  vectorEffect: "non-scaling-stroke",
                }),
                " ",
                h("path", {
                  key: 1398,
                  d: "M200 40 L200 150",
                  fill: "none",
                  strokeLinecap: "round",
                  vectorEffect: "non-scaling-stroke",
                  className: classFor(v.eOpHe.glow),
                }),
                " ",
                h("path", {
                  key: 1400,
                  d: "M200 40 L200 150",
                  fill: "none",
                  strokeLinecap: "round",
                  vectorEffect: "non-scaling-stroke",
                  className: classFor(v.eOpHe.flow),
                }),
                " ",
                h("path", {
                  key: 1402,
                  d: "M200 150 Q130 180 100 252",
                  fill: "none",
                  stroke: "rgba(255,255,255,.09)",
                  strokeWidth: "1.5",
                  vectorEffect: "non-scaling-stroke",
                }),
                " ",
                h("path", {
                  key: 1404,
                  d: "M200 150 Q130 180 100 252",
                  fill: "none",
                  strokeLinecap: "round",
                  vectorEffect: "non-scaling-stroke",
                  className: classFor(v.eHeZe.glow),
                }),
                " ",
                h("path", {
                  key: 1406,
                  d: "M200 150 Q130 180 100 252",
                  fill: "none",
                  strokeLinecap: "round",
                  vectorEffect: "non-scaling-stroke",
                  className: classFor(v.eHeZe.flow),
                }),
                " ",
                h("path", {
                  key: 1408,
                  d: "M200 150 Q270 180 300 252",
                  fill: "none",
                  stroke: "rgba(255,255,255,.09)",
                  strokeWidth: "1.5",
                  vectorEffect: "non-scaling-stroke",
                }),
                " ",
                h("path", {
                  key: 1410,
                  d: "M200 150 Q270 180 300 252",
                  fill: "none",
                  strokeLinecap: "round",
                  vectorEffect: "non-scaling-stroke",
                  className: classFor(v.eHeAp.glow),
                }),
                " ",
                h("path", {
                  key: 1412,
                  d: "M200 150 Q270 180 300 252",
                  fill: "none",
                  strokeLinecap: "round",
                  vectorEffect: "non-scaling-stroke",
                  className: classFor(v.eHeAp.flow),
                }),
                " ",
              ),
              " ",
              h(
                "g",
                { key: 1415, id: "map-pk-a", opacity: "0" },
                h("circle", { key: 1416, r: "11", fill: "#ff9500", opacity: ".22" }),
                h("circle", { key: 1417, r: "6", fill: "#ff9500", opacity: ".5" }),
                h("circle", { key: 1418, r: "2.6", fill: "#fff" }),
              ),
              " ",
              h(
                "g",
                { key: 1420, id: "map-pk-b", opacity: "0" },
                h("circle", { key: 1421, r: "11", fill: "#cc00ff", opacity: ".22" }),
                h("circle", { key: 1422, r: "6", fill: "#cc00ff", opacity: ".5" }),
                h("circle", { key: 1423, r: "2.6", fill: "#fff" }),
              ),
              " ",
            ),
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
                      h(
                        React.Fragment,
                        { key: 1433 },
                        "",
                        h("span", { className: "sc-interp", key: 1 }, v.n.glyph),
                        "",
                      ),
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
                      h(
                        React.Fragment,
                        { key: 1439 },
                        "",
                        h("span", { className: "sc-interp", key: 1 }, v.n.detail),
                        "",
                      ),
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
          ),
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
