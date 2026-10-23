import React from "react";
import { classFor } from "../style-variants.js";
import designSystem from "../design-system.js";
import { HeroPlanet } from "../hero-reel.jsx";
const h = React.createElement;

export function HeroSection({ v }) {
  return h(
    "section",
    {
      key: 110,
      id: "top",
      "data-screen-label": "Orbit",
      "aria-label": "Introduction",
      onMouseMove: v.heroMove,
      className: "v41-eec0bc3def",
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
              h(React.Fragment, { key: 140 }, "V41 · EAGLE"),
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
      h(
        "div",
        { key: 155, className: "v41-e2b130896a" },
        " ",
        h(
          "div",
          {
            key: 157,
            className: "v41-6099e1a2c7",
          },
          " ",
          h(
            "span",
            { key: 159, className: "v41-21691e3b04" },
            h("span", {
              key: 160,
              className: "v41-7b76702f4d",
            }),
            h(React.Fragment, { key: 161 }, "My lab, observed " + v.observedDate),
          ),
          " ",
          h("span", { key: 163 }, h(React.Fragment, { key: 164 }, v.fleetLine)),
          " ",
        ),
        " ",
        h(
          "div",
          {
            key: 167,
            className: "v41-2fd38c137d",
          },
          " ",
          h("span", {
            key: 169,
            className: "v41-05bc798ee2",
          }),
          h(
            "span",
            { key: 170, "data-scramble": "" },
            h(React.Fragment, { key: 171 }, "A hobby lab for local AI · A human in command"),
          ),
          " ",
        ),
        " ",
        h(
          "h1",
          {
            key: 174,
            className: "v41-b569e82321",
          },
          " ",
          h(
            "span",
            { key: 176, className: "v41-752c45d857" },
            h(
              "span",
              {
                key: 177,
                className: "v41-81c98d0460",
              },
              h(React.Fragment, { key: 178 }, "The machines"),
            ),
          ),
          " ",
          h(
            "span",
            { key: 180, className: "v41-752c45d857" },
            h(
              "span",
              {
                key: 181,
                className: "v41-e7ed4373fa",
              },
              h(React.Fragment, { key: 182 }, "can think."),
            ),
          ),
          " ",
          h(
            "span",
            { key: 184, className: "v41-eff7bcfb70" },
            h(
              "span",
              {
                key: 185,
                className: "v41-32dd3337d5",
              },
              h(React.Fragment, { key: 186 }, "You still decide."),
            ),
          ),
          " ",
        ),
        " ",
        h(
          "p",
          {
            key: 189,
            className: "v41-5359105f2e",
          },
          h(
            React.Fragment,
            { key: 190 },
            "I’m Doug Cashio. I started in IT in 1996, the year Quake went truly 3D after the brilliant 2.5D worlds of Wolfenstein and Doom. This is my workshop after hours: local AI, original worlds and a few things that fly.",
          ),
        ),
        " ",
        h(
          "div",
          {
            key: 192,
            className: "v41-523178e37a",
          },
          " ",
          h(
            designSystem.Button,
            { key: 194, as: "a", href: "#flight=board", onClick: v.boardShip, size: "lg" },
            h(React.Fragment, { key: 195 }, "Board the starship →"),
          ),
          " ",
          h(
            designSystem.Button,
            { key: 197, as: "a", href: "#studies", variant: "secondary", size: "lg" },
            h(React.Fragment, { key: 198 }, "Try an experiment →"),
          ),
          " ",
        ),
        " ",
        h(
          "div",
          {
            key: 201,
            className: "v41-870557c7e4",
          },
          " ",
          h(
            "span",
            { key: 203 },
            h(React.Fragment, { key: 204 }, "A 30 second starship tour · 12 illustrated requests · sound off"),
          ),
        ),
        " ",
        v.tech
          ? h(
              React.Fragment,
              { key: 212 },
              " ",
              h(
                "p",
                {
                  key: 214,
                  className: "v41-b5c3781897",
                },
                h(
                  "span",
                  {
                    key: 215,
                    className: "v41-c5c887fb10",
                  },
                  h(React.Fragment, { key: 216 }, "FOR ENGINEERS"),
                ),
                h(
                  React.Fragment,
                  { key: 217 },
                  "A static site on GitHub Pages behind Cloudflare. Every experiment runs in your browser; nothing you try is sent to my servers.",
                ),
              ),
              " ",
            )
          : null,
        " ",
      ),
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
                  h(React.Fragment, { key: 232 }, "OCT 23"),
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
      h("span", { key: 272 }, h(React.Fragment, { key: 273 }, "Next: watch Eagle")),
      h("span", {
        key: 274,
        className: "v41-1148ccc5c5",
      }),
    ),
    " ",
  );
}
