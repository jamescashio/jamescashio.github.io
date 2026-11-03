import type { GeneratedView, GeneratedValue } from "../generated-view.ts";
import React from "react";
import { classFor } from "../style-variants.ts";
import designSystem from "../design-system.ts";
import { h } from "../generated-view.ts";
export function renderMachinesPart2(v: GeneratedView) {
  return h(
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
        h(React.Fragment, { key: 1295 }, "Fleet · " + v.fleetLine),
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
        (function (parent: GeneratedView) {
          return (v.traceLog || []).map((item: GeneratedValue, index: number) => {
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
  );
}
