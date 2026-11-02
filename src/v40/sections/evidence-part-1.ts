import type { GeneratedView, GeneratedValue } from "../generated-view.ts";
import { snapshot, observedMonth, fleetSummary, backupSummary } from "../evidence.ts";
import React from "react";
import { classFor } from "../style-variants.ts";
import designSystem from "../design-system.ts";
import { h } from "../generated-view.ts";
export function renderEvidencePart1(v: GeneratedView) {
  return h(
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
              .filter(([key]: GeneratedValue) =>
                [
                  "scheduler.enabled",
                  "modelConfiguration.contextWindow",
                  "lanes.public",
                  "backup.restoredFiles",
                ].includes(key),
              )
              .map(([key, reason]: GeneratedValue) =>
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
                    }[
                      key as
                        | "scheduler.enabled"
                        | "modelConfiguration.contextWindow"
                        | "lanes.public"
                        | "backup.restoredFiles"
                    ],
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
                h(React.Fragment, { key: 1700 }, "Earlier records (9) ▾"),
              ),
              " ",
              h(
                "div",
                { key: 1702, className: "v41-613ce876c7" },
                h(
                  "a",
                  { key: 1703, href: "/evidence/status-2026-11-01.json" },
                  h(React.Fragment, { key: 1704 }, "Sun Nov 1, 2026 · V41 Eagle"),
                ),
                h(
                  "a",
                  { key: 1705, href: "/evidence/status-2026-10-31.json" },
                  h(React.Fragment, { key: 1706 }, "Sat Oct 31, 2026 · V41 Eagle"),
                ),
                h(
                  "a",
                  { key: 1707, href: "/evidence/status-2026-10-28.json" },
                  h(React.Fragment, { key: 1708 }, "Wed Oct 28, 2026 · V41 Eagle"),
                ),
                h(
                  "a",
                  { key: 1709, href: "/evidence/status-2026-10-27.json" },
                  h(React.Fragment, { key: 1710 }, "Tue Oct 27, 2026 · V41 Eagle"),
                ),
                h(
                  "a",
                  { key: 1711, href: "/evidence/status-2026-10-23.json" },
                  h(React.Fragment, { key: 1712 }, "Fri Oct 23, 2026 · V41 Eagle"),
                ),
                h(
                  "a",
                  { key: 1713, href: "/evidence/status-2026-09-26.json" },
                  h(React.Fragment, { key: 1714 }, "Sat Sep 26, 2026 · V39.2 Zenith"),
                ),
                h(
                  "a",
                  { key: 1715, href: "/evidence/status-2026-09-24.json" },
                  h(React.Fragment, { key: 1716 }, "Thu Sep 24, 2026 · V39.2 Zenith"),
                ),
                h(
                  "a",
                  { key: 1717, href: "/evidence/status-2026-09-07.json" },
                  h(React.Fragment, { key: 1718 }, "Mon Sep 7, 2026 · V37.11"),
                ),
                h(
                  "a",
                  { key: 1719, href: "/evidence/status-2026-08-28.json" },
                  h(React.Fragment, { key: 1720 }, "Fri Aug 28, 2026 · V35 ALL TENS"),
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
  );
}
