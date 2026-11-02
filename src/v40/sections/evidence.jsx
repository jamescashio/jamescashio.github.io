import { renderEvidencePart1 } from "./evidence-part-1.jsx";
import { observedDate } from "../evidence.ts";
import React from "react";
import { classFor } from "../style-variants.js";
import designSystem from "../design-system.js";
const h = React.createElement;

export function EvidenceSection({ v }) {
  return h(
    "section",
    {
      key: 1465,
      id: "evidence",
      "data-screen-label": "Dated evidence",
      className: "v41-43f26deb62",
    },
    " ",
    h(
      "div",
      {
        key: 1467,
        "data-reveal": "",
        className: "v41-9c7621c882",
      },
      " ",
      h(
        "div",
        { key: 1469, className: "v41-022625b12b" },
        " ",
        h(
          "span",
          {
            key: 1471,
            className: "v41-c904563b29",
          },
          h("span", { key: 1472, className: "v41-3bdbfd324b" }, h(React.Fragment, { key: 1473 }, "08")),
          h("span", { key: 1474, "data-scramble": "" }, h(React.Fragment, { key: 1475 }, "The evidence")),
        ),
        " ",
        h(
          "h2",
          {
            key: 1477,
            className: "v41-0cf0266feb",
          },
          h(React.Fragment, { key: 1478 }, "Trust has "),
          h("br", { key: 1479 }),
          h(React.Fragment, { key: 1480 }, "a "),
          h("span", { key: 1481, className: "v41-a05a8e3573" }, h(React.Fragment, { key: 1482 }, "timestamp.")),
        ),
        " ",
      ),
      " ",
      h(
        "div",
        { key: 1485, className: "v41-89086d4ee3" },
        " ",
        h(
          "strong",
          { key: 1487, className: "v41-f613f806e4" },
          h(React.Fragment, { key: 1488 }, "A dated look inside the lab."),
        ),
        " ",
        h(
          "p",
          { key: 1490, className: "v41-a6256af1e9" },
          h(React.Fragment, { key: 1491 }, "Ask the evidence console what was observed, or inspect the raw record."),
        ),
        " ",
        h(
          "div",
          {
            key: 1493,
            className: "v41-fc22463955",
          },
          " ",
          h(designSystem.StatCell, { key: 1495, value: observedDate, label: "Last observed" }),
          " ",
          h(designSystem.StatCell, { key: 1497, value: "Read only", label: "Read only probe", color: "green" }),
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
        key: 1502,
        className: "v41-197b0f6418",
      },
      " ",
      renderEvidencePart1(v),
      " ",
      h(
        "details",
        {
          key: 1718,
          className:
            "evidence-console " +
            classFor(
              ["grid-column:", v.evRightCol ?? "", ";min-width:0;display:flex;flex-direction:column;gap:10px"].join(""),
            ),
        },
        " ",
        h(
          "summary",
          null,
          h(
            "span",
            null,
            "Ask the evidence console",
            h("small", null, "E.V.E. explains the dated record and its limits."),
          ),
          h("span", { "aria-hidden": "true" }, "+"),
        ),
        h(
          designSystem.Terminal,
          { key: 1720, title: "E.V.E. · evaluation verification engine", hint: "DATED", bodyHeight: v.eveHeight },
          " ",
          h(
            "div",
            {
              key: 1722,
              id: "eve-out",
              role: "log",
              "aria-label": "E.V.E. replies",
              "aria-live": "polite",
              className: "v41-08a40a3c03",
            },
            " ",
            (function (parent) {
              return (v.eveLog || []).map((item, index) => {
                const v = { ...parent, l: item, $index: index };
                return h(
                  React.Fragment,
                  { key: index },
                  " ",
                  h(
                    "div",
                    { key: 1726, className: classFor(v.l.style) },
                    h(React.Fragment, { key: 1727 }, "", h("span", { className: "sc-interp", key: 1 }, v.l.text), ""),
                  ),
                  " ",
                );
              });
            })(v),
            " ",
          ),
          " ",
        ),
        " ",
        h(
          "div",
          {
            key: 1732,
            role: "group",
            "aria-label": "Suggested E.V.E. commands",
            className: "v41-f26d0e34f5",
          },
          " ",
          (function (parent) {
            return (v.eveChips || []).map((item, index) => {
              const v = { ...parent, ch: item, $index: index };
              return h(
                React.Fragment,
                { key: index },
                " ",
                h(
                  designSystem.Chip,
                  { key: 1736, onClick: v.ch.run },
                  h(React.Fragment, { key: 1737 }, "", h("span", { className: "sc-interp", key: 1 }, v.ch.label), ""),
                ),
                " ",
              );
            });
          })(v),
          " ",
        ),
        " ",
        h(
          "form",
          {
            key: 1741,
            onSubmit: v.eveSubmit,
            className: "v41-7a48e38780",
          },
          " ",
          h(
            "label",
            {
              key: 1743,
              htmlFor: "eve-in",
              className: "v41-6381c414e8",
            },
            h(React.Fragment, { key: 1744 }, "E.V.E. ▸"),
          ),
          " ",
          h("input", {
            key: 1746,
            id: "eve-in",
            type: "text",
            autoComplete: "off",
            placeholder: "help, or 42",
            "aria-label": "E.V.E. command, for example help or fleet",
            value: v.eveInput,
            onChange: v.eveChange,
            className: "v41-14e6e585b2",
          }),
          " ",
          h(
            "button",
            {
              key: 1748,
              type: "submit",
              "aria-label": "Run command",
              className: "v41-ab574595a8",
            },
            h(React.Fragment, { key: 1749 }, "↵"),
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
