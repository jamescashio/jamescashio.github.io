import React from "react";
import { RoutingSection } from "./routing.jsx";
import { classFor } from "../style-variants.js";
import designSystem from "../design-system.js";
const h = React.createElement;

export function DecisionsSection({ v }) {
  return h(
    "section",
    {
      key: 815,
      id: "work",
      "data-screen-label": "One decision",
      className: "v41-43f26deb62",
    },
    " ",
    h(
      "div",
      {
        key: 817,
        "data-reveal": "",
        className: "v41-260a3097b1",
      },
      " ",
      h(
        "div",
        { key: 819, className: "v41-022625b12b" },
        " ",
        h(
          "span",
          {
            key: 821,
            className: "v41-c904563b29",
          },
          h("span", { key: 822, className: "v41-3bdbfd324b" }, h(React.Fragment, { key: 823 }, "05")),
          h("span", { key: 824, "data-scramble": "" }, h(React.Fragment, { key: 825 }, "One decision")),
        ),
        " ",
        h(
          "h2",
          {
            key: 827,
            className: "v41-0cf0266feb",
          },
          h(React.Fragment, { key: 828 }, "Try a decision."),
          h("br", { key: 829 }),
          h(React.Fragment, { key: 830 }, "See what changes."),
        ),
        " ",
      ),
      " ",
    ),
    " ",
    h(
      "div",
      {
        key: 837,
        className: "v41-f447e23313",
      },
      " ",
      h(
        "div",
        { key: 839, className: "v41-5e4ec90ff9" },
        " ",
        h(
          designSystem.Panel,
          { key: 841, color: "cyan", title: "THE PRIVACY TEST", icon: "▸" },
          " ",
          h(
            "details",
            { className: "privacy-exercise" },
            h(
              "summary",
              null,
              h(
                "span",
                null,
                "One document. A different boundary.",
                h("small", null, "Try the private-document decision · about 20 seconds"),
              ),
              h("span", { "aria-hidden": "true" }, "+"),
            ),
            h(
              "div",
              { key: 843, id: "privacy-test", className: "v41-84e5cd0cb2" },
              " ",
              h(
                "span",
                {
                  key: 845,
                  className: "v41-f959088bbe",
                },
                h(React.Fragment, { key: 846 }, "In your browser · No uploads"),
              ),
              " ",
              h(
                "h3",
                {
                  key: 848,
                  className: "v41-ceea826ff0",
                },
                h(React.Fragment, { key: 849 }, "One change. Who decides?"),
              ),
              " ",
              h(
                "p",
                { key: 851, className: "v41-5c81b71289" },
                h(
                  React.Fragment,
                  { key: 852 },
                  "Analyze a document and require sources. Now make that document private.",
                ),
              ),
              " ",
              h(
                "div",
                {
                  key: 854,
                  className: "v41-021f5de764",
                },
                " ",
                h(
                  "div",
                  {
                    key: 856,
                    className: "v41-1c19a05c4b",
                  },
                  " ",
                  h(
                    "span",
                    {
                      key: 858,
                      className: "v41-2f2cda502f",
                    },
                    h(React.Fragment, { key: 859 }, "01 / PUBLIC DOCUMENT"),
                  ),
                  " ",
                  h(
                    "div",
                    {
                      key: 861,
                      className: "v41-3aea30267d",
                    },
                    h(
                      "span",
                      {
                        key: 862,
                        className: "v41-57eae1b3d3",
                      },
                      h(React.Fragment, { key: 863 }, "DOC"),
                    ),
                    h("span", {
                      key: 864,
                      className: "v41-18129495be",
                    }),
                    h(
                      "span",
                      {
                        key: 865,
                        className: "v41-3f082fd5ba",
                      },
                      h(React.Fragment, { key: 866 }, "SOURCES"),
                    ),
                  ),
                  " ",
                  h(
                    "span",
                    {
                      key: 868,
                      className: "v41-c6a3fbd054",
                    },
                    h(React.Fragment, { key: 869 }, "Research"),
                  ),
                  " ",
                  h(
                    "span",
                    { key: 871, className: "v41-3ea4de54fe" },
                    h(
                      React.Fragment,
                      { key: 872 },
                      "A request for sources selects Research, the route for checking claims.",
                    ),
                  ),
                  " ",
                ),
                " ",
                h(
                  "div",
                  {
                    key: 875,
                    className: classFor(
                      [
                        "display:flex;flex-direction:column;gap:8px;padding:16px;border-radius:12px;background:var(--void-deep);border:1px solid ",
                        v.pvBorder ?? "",
                        "",
                      ].join(""),
                    ),
                  },
                  " ",
                  h(
                    "span",
                    {
                      key: 877,
                      className: "v41-a8a0f7f731",
                    },
                    h(React.Fragment, { key: 878 }, "02 / PRIVATE DOCUMENT"),
                  ),
                  " ",
                  h(
                    "div",
                    {
                      key: 880,
                      className: "v41-3aea30267d",
                    },
                    h(
                      "span",
                      {
                        key: 881,
                        className: "v41-57eae1b3d3",
                      },
                      h(React.Fragment, { key: 882 }, "DOC"),
                    ),
                    h("span", {
                      key: 883,
                      className: "v41-0d3fb08a85",
                    }),
                    h(
                      "span",
                      {
                        key: 884,
                        className: "v41-12f6473955",
                      },
                      h(React.Fragment, { key: 885 }, "", h("span", { className: "sc-interp", key: 1 }, v.pvEnd), ""),
                    ),
                  ),
                  " ",
                  h(
                    "span",
                    {
                      key: 887,
                      className: "v41-1727a1613c",
                    },
                    h(React.Fragment, { key: 888 }, "", h("span", { className: "sc-interp", key: 1 }, v.pvAnswer), ""),
                  ),
                  " ",
                  h(
                    "span",
                    { key: 890, className: "v41-3ea4de54fe" },
                    h(
                      React.Fragment,
                      { key: 891 },
                      "",
                      h("span", { className: "sc-interp", key: 1 }, v.pvBoundary),
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
                { key: 895, className: "v41-f0de252a84" },
                " ",
                h(
                  "strong",
                  { key: 897, id: "pv-prompt", className: "v41-a3970b9f8a" },
                  h(React.Fragment, { key: 898 }, "Where should the private document go?"),
                ),
                " ",
                h(
                  "div",
                  {
                    key: 900,
                    role: "group",
                    "aria-labelledby": "pv-prompt",
                    className: "v41-d5129e1520",
                  },
                  " ",
                  (function (parent) {
                    return (v.pvChoices || []).map((item, index) => {
                      const v = { ...parent, c: item, $index: index };
                      return h(
                        React.Fragment,
                        { key: index },
                        " ",
                        h(
                          "button",
                          { key: 904, type: "button", onClick: v.c.pick, className: classFor(v.c.style) },
                          h(
                            React.Fragment,
                            { key: 905 },
                            "",
                            h("span", { className: "sc-interp", key: 1 }, v.c.label),
                            "",
                          ),
                        ),
                        " ",
                      );
                    });
                  })(v),
                  " ",
                  h(
                    "button",
                    {
                      key: 908,
                      type: "button",
                      onClick: v.pvReveal,
                      className: "v41-928ede43dd",
                    },
                    h(React.Fragment, { key: 909 }, "Show the answer"),
                  ),
                  " ",
                ),
                " ",
                v.pvShown
                  ? h(
                      React.Fragment,
                      { key: 912 },
                      " ",
                      h(
                        "div",
                        {
                          key: 914,
                          role: "status",
                          className: "v41-0bc0b9426a",
                        },
                        h("span", {
                          key: 915,
                          className: "v41-41858cab1a",
                        }),
                        h(
                          "span",
                          { key: 916, className: "v41-ee728cc3f8" },
                          h(
                            React.Fragment,
                            { key: 917 },
                            "",
                            h("span", { className: "sc-interp", key: 1 }, v.pvText),
                            "",
                          ),
                        ),
                      ),
                      " ",
                    )
                  : null,
                " ",
              ),
              " ",
              h(
                "div",
                {
                  key: 921,
                  className: "v41-903c86e97d",
                },
                " ",
                v.pvShown
                  ? h(
                      React.Fragment,
                      { key: 923 },
                      h(
                        "a",
                        { key: 924, href: "#universe" },
                        h(React.Fragment, { key: 925 }, "Follow this decision on the system map ↓"),
                      ),
                    )
                  : null,
                " ",
                h(
                  "a",
                  { key: 927, href: "#studies", onClick: v.loadPublic },
                  h(React.Fragment, { key: 928 }, "Take the controls: public request ↓"),
                ),
                " ",
                h(
                  "a",
                  { key: 930, href: "#studies", onClick: v.loadPrivate },
                  h(React.Fragment, { key: 931 }, "Private version ↓"),
                ),
                " ",
              ),
              " ",
            ),
            " ",
          ),
        ),
        " ",
      ),
      " ",
      h(RoutingSection, { key: "law" }),
    ),
  );
}
