import { renderHeroPart1 } from "./hero-part-1.jsx";
import React from "react";
import { classFor } from "../style-variants.js";

import { HeroPlanet } from "../hero-reel.jsx";
import { presentation } from "../evidence.js";
const h = React.createElement;

export function HeroSection({ v }) {
  return h(
    "section",
    {
      key: 110,
      id: "top",
      "data-screen-label": "Home",
      "aria-label": "Introduction",
      onMouseMove: v.heroMove,
      onMouseLeave: v.heroLeave,
      className: "v41-eec0bc3def orbital-observatory",
    },
    " ",
    h(HeroPlanet, { key: "hero-planet" }),
    " ",
    h("canvas", {
      key: 119,
      id: "hero-stars",
      "aria-hidden": "true",
      className: "v41-b445847fae",
    }),
    " ",
    h("div", {
      key: 121,
      id: "hero-spot",
      "aria-hidden": "true",
      className: "v41-163890913e",
    }),
    " ",
    h("div", {
      key: 123,
      "aria-hidden": "true",
      className: "v41-b75c4d9c44",
    }),
    " ",
    h("div", {
      key: 125,
      "aria-hidden": "true",
      className: "v41-a353758b92",
    }),
    " ",

    v.wide
      ? h(
          React.Fragment,
          { key: 127 },
          " ",
          h(
            "div",
            {
              key: 129,
              "aria-hidden": "true",
              className: "v41-31fb338fa2",
            },
            " ",
            h("div", {
              key: 131,
              className: "v41-fdc6b9292e",
            }),
            " ",
            h("div", {
              key: 133,
              className: "v41-239c863440",
            }),
            " ",
            h("div", {
              key: 135,
              className: "v41-cb189694f5",
            }),
            " ",
            h("div", {
              key: 137,
              className: "v41-7b3ab527b9",
            }),
            " ",
            h(
              "div",
              {
                key: 139,
                className: "v41-bf5360592c",
              },
              h(React.Fragment, { key: 140 }, "V41 · " + presentation.name.toUpperCase()),
            ),
            " ",
          ),
          " ",
          h(
            "div",
            {
              key: 143,
              "aria-hidden": "true",
              className: "v41-b72b79837d",
            },
            " ",
            h("div", {
              key: 145,
              className: "v41-84d6fc2938",
            }),
            " ",
            h("div", {
              key: 147,
              className: "v41-d0ceeed41b",
            }),
            " ",
            h("div", {
              key: 149,
              className: "v41-f1094867b2",
            }),
            " ",
          ),
          " ",
        )
      : null,
    " ",
    h(
      "div",
      {
        key: 153,
        id: "hero-content",
        className: classFor(
          [
            "position:relative;max-width:1240px;width:100%;margin:0 auto;padding:110px 28px 130px;display:grid;grid-template-columns:",
            v.heroCols ?? "",
            ";gap:40px;align-items:end",
          ].join(""),
        ),
      },
      " ",
      renderHeroPart1(v),
      " ",
      v.wide
        ? h(
            React.Fragment,
            { key: 221 },
            " ",
            h(
              "aside",
              {
                key: 223,
                "aria-label": "Lab telemetry",
                className: "v41-c07ca12d3d",
              },
              " ",
              h("span", {
                key: 225,
                "aria-hidden": "true",
                className: "v41-23960c13b1",
              }),
              " ",
              h(
                "div",
                {
                  key: 227,
                  className: "v41-7f5a64038e",
                },
                h("span", { key: 228 }, h(React.Fragment, { key: 229 }, "LAB TELEMETRY")),
                h(
                  "span",
                  { key: 230, className: "v41-8c2a4881d7" },
                  h("span", {
                    key: 231,
                    className: "v41-5ef7ef42ac",
                  }),
                  h(React.Fragment, { key: 232 }, v.observedShortDate),
                ),
              ),
              " ",
              h(
                "button",
                {
                  key: 234,
                  className: "bit-hero",
                  type: "button",
                  "data-bit-open": "",
                  "aria-haspopup": "dialog",
                },
                " ",
                h(
                  "span",
                  { key: 236, className: "bit-portrait", "data-bit-portrait": "" },
                  h("canvas", { key: 237, "aria-hidden": "true" }),
                  h(
                    "span",
                    { key: 238, className: "bit-fallback", "aria-hidden": "true" },
                    h(React.Fragment, { key: 239 }, "◇"),
                  ),
                ),
                " ",
                h(
                  "span",
                  { key: 241 },
                  h("strong", { key: 242 }, h(React.Fragment, { key: 243 }, "BIT")),
                  h("small", { key: 244 }, h(React.Fragment, { key: 245 }, "YOUR COPILOT")),
                  h("span", { key: 246 }, h(React.Fragment, { key: 247 }, "Mostly helpful. Always here. ↗")),
                ),
                " ",
              ),
              " ",
              (function (parent) {
                return (v.telemetry || []).map((item, index) => {
                  const v = { ...parent, m: item, $index: index };
                  return h(
                    React.Fragment,
                    { key: index },
                    " ",
                    h(
                      "div",
                      {
                        key: 252,
                        className: "v41-7f06ff0f58",
                      },
                      " ",
                      h(
                        "span",
                        {
                          key: 254,
                          "data-count": v.m.count,
                          className: classFor(
                            [
                              "font-family:var(--font-display);font-weight:900;font-size:28px;line-height:1;color:",
                              v.m.color ?? "",
                              ";text-shadow:0 0 18px ",
                              v.m.color ?? "",
                              ";min-width:62px",
                            ].join(""),
                          ),
                        },
                        h(
                          React.Fragment,
                          { key: 255 },
                          "",
                          h("span", { className: "sc-interp", key: 1 }, v.m.value),
                          "",
                        ),
                      ),
                      " ",
                      h(
                        "span",
                        {
                          key: 257,
                          className: "v41-44a8b78244",
                        },
                        h(
                          React.Fragment,
                          { key: 258 },
                          "",
                          h("span", { className: "sc-interp", key: 1 }, v.m.label),
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
                  key: 262,
                  className: "v41-a94a57b906",
                },
                h("span", { key: 263 }, h(React.Fragment, { key: 264 }, "THREAT ASSESSMENT")),
                h(
                  "span",
                  { key: 265, className: "v41-bc8e16fc1d" },
                  h(React.Fragment, { key: 266 }, "MOSTLY HARMLESS"),
                ),
              ),
              " ",
            ),
            " ",
          )
        : null,
      " ",
    ),
    " ",
    h(
      "a",
      {
        key: 271,
        href: "#eagle-film",
        className: "v41-e4105fe0e2",
      },
      h("span", { key: 272 }, h(React.Fragment, { key: 273 }, "Next: watch House Cashio")),
      h("span", {
        key: 274,
        className: "v41-1148ccc5c5",
      }),
    ),
    " ",
  );
}
