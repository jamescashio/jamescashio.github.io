import React from "react";

import designSystem from "../design-system.ts";

import { presentation } from "../evidence.ts";
const h = React.createElement;
export function renderHeroPart1(v) {
  return h(
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
        h(React.Fragment, { key: 171 }, presentation.name + " · " + presentation.subtitle),
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
        "I’m Doug Cashio. I build local AI experiments and original worlds after hours. Board a starship, try a decision, or explore what I’m making.",
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
      h(
        "a",
        {
          key: "logo-reveal",
          href: "/cashio.html#logo-reveal",
          className: "hero-logo-reveal",
        },
        h("span", { "aria-hidden": "true" }, "▷"),
        "Watch the logo reveal · 15 seconds",
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
  );
}
