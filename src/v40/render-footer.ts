import type { GeneratedView } from "./generated-view.ts";
import { updatedDate, presentation, versionLabel } from "./evidence.ts";

import React from "react";

import { h } from "./generated-view.ts";

export function renderFooter(_v: GeneratedView) {
  return h(
    "footer",
    { key: 1879, className: "v41-cf9133e23d" },
    " ",
    h(
      "div",
      {
        key: 1881,
        className: "v41-cbfac2beab",
      },
      " ",
      h(
        "div",
        {
          key: 1883,
          className: "v41-efdd1fcb3d",
        },
        " ",
        h(
          "span",
          { key: 1885 },
          h(React.Fragment, { key: 1886 }, "The Human Reckoning. Frank Herbert’s "),
          h("em", { key: 1887 }, h(React.Fragment, { key: 1888 }, "Dune")),
          h(React.Fragment, { key: 1889 }, " taught caution about thinking machines; Douglas Adams’s "),
          h("em", { key: 1890 }, h(React.Fragment, { key: 1891 }, "Hitchhiker’s Guide")),
          h(
            React.Fragment,
            { key: 1892 },
            " taught the rest: keep a towel handy and don’t panic. Capable tools. Human judgment in command.",
          ),
        ),
        " ",
        h(
          "span",
          {
            key: 1894,
            className: "v41-8f81cfc173",
          },
          h(
            React.Fragment,
            { key: 1895 },
            versionLabel + " · " + presentation.name + " · Directed by Doug Cashio · Updated " + updatedDate,
          ),
        ),
        " ",
        h(
          "span",
          { key: 1897 },
          h(
            React.Fragment,
            { key: 1898 },
            "A personal site. The builds and views here are my own and do not speak for my employer.",
          ),
        ),
        " ",
      ),
      " ",
      h(
        "nav",
        {
          key: 1901,
          "aria-label": "Footer",
          className: "v41-71671bf373",
        },
        " ",
        h(
          "details",
          { key: 1903 },
          " ",
          h(
            "summary",
            {
              key: 1905,
              className: "v41-f06fd064ed",
            },
            h(React.Fragment, { key: 1906 }, "Version history ▾"),
          ),
          " ",
          h(
            "div",
            {
              key: 1908,
              className: "v41-f504f7344d",
            },
            " ",
            h(
              "a",
              { key: 1910, href: "/v39/" },
              h(React.Fragment, { key: 1911 }, "V39.8 First Light · preserved edition"),
            ),
            " ",
            h(
              "a",
              { key: 1913, href: "https://cashio.us/odyssey.html" },
              h(React.Fragment, { key: 1914 }, "V37.17 Continuum"),
            ),
            " ",
            h(
              "a",
              { key: 1916, href: "https://cashio.us/command-deck.html" },
              h(React.Fragment, { key: 1917 }, "V35 · preserved command deck"),
            ),
            " ",
            h(
              "a",
              { key: 1919, href: "https://cashio.us/command.html" },
              h(React.Fragment, { key: 1920 }, "May 2026 · command center archive"),
            ),
            " ",
            h(
              "a",
              { key: 1922, href: "https://github.com/jamescashio/jamescashio.github.io/blob/main/CHANGELOG.md" },
              h(React.Fragment, { key: 1923 }, "Version history · changelog"),
            ),
            " ",
            h(
              "a",
              { key: 1925, href: "https://github.com/jamescashio/jamescashio.github.io/releases" },
              h(React.Fragment, { key: 1926 }, "Tagged releases on GitHub"),
            ),
            " ",
          ),
          " ",
        ),
        " ",
        h(
          "a",
          { key: 1930, href: "https://github.com/jamescashio/jamescashio.github.io" },
          h(React.Fragment, { key: 1931 }, "View source"),
        ),
        " ",
        h(
          "a",
          { key: 1933, href: "https://cashio.us/cashio.html" },
          h(React.Fragment, { key: 1934 }, "My AI workspace · c"),
          h("span", { key: 1935, className: "v41-097ae647c2" }, h(React.Fragment, { key: 1936 }, "A")),
          h(React.Fragment, { key: 1937 }, "sh"),
          h("span", { key: 1938, className: "v41-aab9b2719f" }, h(React.Fragment, { key: 1939 }, "I")),
          h(React.Fragment, { key: 1940 }, "o →"),
        ),
        " ",
        h(
          "a",
          { key: 1942, href: "https://github.com/jamescashio/jamescashio.github.io/blob/main/PRIVACY.md" },
          h(React.Fragment, { key: 1943 }, "Privacy"),
        ),
        " ",
        h(
          "a",
          { key: 1945, href: "#top", className: "v41-6c41898cb4" },
          h(React.Fragment, { key: 1946 }, "Back to home ↑"),
        ),
        " ",
      ),
      " ",
    ),
    " ",
    h(
      "div",
      {
        key: 1950,
        "aria-hidden": "true",
        className: "v41-b34bc5cf1f",
      },
      " ",
      h(
        "div",
        {
          key: 1952,
          className: "v41-3f2cedb09e",
        },
        h(React.Fragment, { key: 1953 }, "c"),
        h(
          "span",
          {
            key: 1954,
            className: "v41-9a8ee10d86",
          },
          h(React.Fragment, { key: 1955 }, "A"),
        ),
        h(React.Fragment, { key: 1956 }, "sh"),
        h(
          "span",
          {
            key: 1957,
            className: "v41-a5a4adb222",
          },
          h(React.Fragment, { key: 1958 }, "I"),
        ),
        h(React.Fragment, { key: 1959 }, "o"),
      ),
      " ",
      h("div", {
        key: 1961,
        className: "v41-147bbdb8eb",
      }),
      " ",
    ),
    " ",
    h(
      "div",
      {
        key: 1964,
        className: "v41-b9be7637a3",
      },
      h("span", { key: 1965 }, h(React.Fragment, { key: 1966 }, versionLabel + " · The answer is here. Keep asking.")),
      h("span", { key: 1967 }, h(React.Fragment, { key: 1968 }, "Mostly harmless · Human in command")),
    ),
    " ",
  );
}
