import { snapshot, observedDate, observedMonth, fleetSummary, backupSummary } from "../evidence.js";
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
      h(
        "div",
        { key: 1504, className: classFor(["grid-column:", v.evLeftCol ?? "", ";min-width:0"].join("")) },
        " ",
        h(
          designSystem.Panel,
          { key: 1506, color: "accent", title: "THE RECORD", icon: "▸" },
          " ",
          h(
            "div",
            { key: 1508, className: "v41-84e5cd0cb2" },
            " ",
            h(
              "h3",
              {
                key: 1510,
                className: "v41-ceea826ff0",
              },
              h(React.Fragment, { key: 1511 }, "What the record shows."),
            ),
            " ",
            h(
              "div",
              {
                key: 1513,
                className: "v41-2697db3075",
              },
              " ",
              h(
                "div",
                {
                  key: 1515,
                  className: "v41-90986da75a",
                },
                h(
                  "span",
                  {
                    key: 1516,
                    className: "v41-e6ad5d483a",
                  },
                  h(React.Fragment, { key: 1517 }, "RUNNING"),
                ),
                h("span", { key: 1518, className: "v41-ee9c986f14" }, h(React.Fragment, { key: 1519 }, fleetSummary)),
              ),
              " ",
              h(
                "div",
                {
                  key: 1521,
                  className: "v41-90986da75a",
                },
                h(
                  "span",
                  {
                    key: 1522,
                    className: "v41-e6ad5d483a",
                  },
                  h(React.Fragment, { key: 1523 }, "BACKUPS"),
                ),
                h("span", { key: 1524, className: "v41-ee9c986f14" }, h(React.Fragment, { key: 1525 }, backupSummary)),
              ),
              " ",
              h(
                "div",
                {
                  key: 1527,
                  className: "v41-90986da75a",
                },
                h(
                  "span",
                  {
                    key: 1528,
                    className: "v41-e6ad5d483a",
                  },
                  h(React.Fragment, { key: 1529 }, "LOCAL MODEL · ATLAS"),
                ),
                h(
                  "span",
                  { key: 1530, className: "v41-ee9c986f14" },
                  h(React.Fragment, { key: 1531 }, snapshot.withheldReasons["modelConfiguration.contextWindow"]),
                ),
              ),
              " ",
            ),
            " ",
            h(
              "details",
              { className: "evidence-limitations" },
              h("summary", null, "What is withheld, and why"),
              h(
                "dl",
                null,
                Object.entries(snapshot.withheldReasons)
                  .filter(([key]) =>
                    [
                      "scheduler.enabled",
                      "modelConfiguration.contextWindow",
                      "lanes.public",
                      "backup.restoredFiles",
                    ].includes(key),
                  )
                  .map(([key, reason]) =>
                    h(
                      React.Fragment,
                      { key },
                      h(
                        "dt",
                        null,
                        {
                          "scheduler.enabled": "Scheduled jobs",
                          "modelConfiguration.contextWindow": "Local model",
                          "lanes.public": "Public capability lanes",
                          "backup.restoredFiles": "Recovery rehearsal",
                        }[key],
                      ),
                      h("dd", null, reason),
                    ),
                  ),
              ),
            ),
            " ",
            h(
              "details",
              { id: "snapshot-story" },
              h("summary", null, "Read the backup receipt"),
              h("p", null, backupSummary),
              h("p", null, snapshot.withheldReasons["backup.fullSystemRecovery"]),
              h("a", { href: "/status.json" }, "Read the " + observedMonth + " observation"),
              h(
                "p",
                null,
                h("a", { href: "/evidence/console-snapshot-2026-10-03.json" }, "Preserved console recovery receipt"),
              ),
            ),
            " ",
            h(
              "div",
              {
                key: 1684,
                className: "v41-9edda59ed1",
              },
              " ",
              h(
                "strong",
                { key: 1686, className: "v41-226444d366" },
                h(React.Fragment, { key: 1687 }, "The evidence boundary, in one place"),
              ),
              " ",
              h(
                "span",
                { key: 1689, className: "v41-9549d2b234" },
                h(
                  React.Fragment,
                  { key: 1690 },
                  "These fleet counts and integrity checks do not establish application health, full system recovery or current AI routing. Private addresses, service names, spending and the model catalog stay private. The browser experiments are simulations.",
                ),
              ),
              " ",
              h(
                "div",
                {
                  key: 1692,
                  className: "v41-f207835f58",
                },
                " ",
                h("a", { key: 1694, href: "/status.json" }, h(React.Fragment, { key: 1695 }, "Read the latest export")),
                " ",
                h(
                  "details",
                  { key: 1697, className: "v41-8ca13a419a" },
                  " ",
                  h(
                    "summary",
                    { key: 1699, className: "v41-946d8528f3" },
                    h(React.Fragment, { key: 1700 }, "Earlier records (4) ▾"),
                  ),
                  " ",
                  h(
                    "div",
                    { key: 1702, className: "v41-613ce876c7" },
                    h(
                      "a",
                      { key: 1703, href: "https://cashio.us/evidence/status-2026-09-26.json" },
                      h(React.Fragment, { key: 1704 }, "Earlier fleet record 4"),
                    ),
                    h(
                      "a",
                      { key: 1705, href: "https://cashio.us/evidence/status-2026-09-24.json" },
                      h(React.Fragment, { key: 1706 }, "Earlier fleet record 3"),
                    ),
                    h(
                      "a",
                      { key: 1707, href: "https://cashio.us/evidence/status-2026-09-07.json" },
                      h(React.Fragment, { key: 1708 }, "Earlier fleet record 2"),
                    ),
                    h(
                      "a",
                      { key: 1709, href: "https://cashio.us/evidence/status-2026-08-28.json" },
                      h(React.Fragment, { key: 1710 }, "Original fleet record"),
                    ),
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
        ),
        " ",
      ),
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
