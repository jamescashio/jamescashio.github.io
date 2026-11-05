import type { GeneratedView } from "./generated-view.ts";
import { destinationLabel } from "./destinations.ts";

import React from "react";
import designSystem from "./design-system.ts";

import { h } from "./generated-view.ts";

export function renderHeader(v: GeneratedView) {
  return h(
    "header",
    {
      key: 45,
      className: "v41-16a0aa070f",
    },
    " ",
    h(
      "div",
      {
        key: 47,
        className: "v41-d28b3b93ee",
      },
      " ",
      h(
        "a",
        {
          key: 49,
          href: "#top",
          "aria-label": "C cAshIo home",
          className: "v41-076bc5e3cc",
        },
        " ",
        h("img", {
          key: 51,
          src: "/brand/platinum/icon.svg?v=c-red-top-20261105",
          alt: "",
          width: 34,
          height: 34,
          className: "cashio-brand-icon",
        }),
        " ",
        h("img", {
          key: 54,
          src: "/brand/platinum/wordmark.svg",
          alt: "",
          width: 348,
          height: 80,
          className: "cashio-brand-wordmark",
        }),
        " ",
      ),
      " ",
      // The section rail already lists every chapter on wide screens; the header links cover the narrower band.
      v.navOn && !v.wide
        ? h(
            React.Fragment,
            { key: 64 },
            h(
              "nav",
              { key: 65, "aria-label": "Primary", className: "v41-bc4448d493" },
              " ",
              h(
                "a",
                {
                  key: 67,
                  className: ["za-navlink", "v41-f959088bbe"].filter(Boolean).join(" "),
                  href: "#studies",
                },
                h(React.Fragment, { key: 68 }, destinationLabel("studies")),
              ),
              " ",
              h(
                "a",
                {
                  key: 70,
                  className: ["za-navlink", "v41-f959088bbe"].filter(Boolean).join(" "),
                  href: "#workshop",
                },
                h(React.Fragment, { key: 71 }, destinationLabel("workshop")),
              ),
              " ",
              h(
                "a",
                {
                  key: 73,
                  className: ["za-navlink", "v41-f959088bbe"].filter(Boolean).join(" "),
                  href: "#rooms",
                },
                h(React.Fragment, { key: 74 }, destinationLabel("rooms")),
              ),
              " ",
            ),
          )
        : null,
      " ",
      h(
        "div",
        { key: 77, className: "v41-21f61ee01b" },
        " ",
        h(
          "button",
          {
            key: 79,
            type: "button",
            className: "hud-control mission-control",
            "data-mission-open": "",
            "aria-haspopup": "dialog",
          },
          h("span", { key: 80, className: "mission-desktop" }, h(React.Fragment, { key: 81 }, "Mission Control")),
          h("span", { key: 82, className: "mission-mobile" }, h(React.Fragment, { key: 83 }, "Menu")),
          h(
            "kbd",
            { key: 84, className: "mission-desktop", "data-platform-shortcut": "" },
            h(React.Fragment, { key: 85 }, "Ctrl K"),
          ),
        ),
        " ",
        h(
          "button",
          {
            key: 87,
            type: "button",
            className: "bit-header",
            "data-bit-open": "",
            "aria-label": "Talk to Bit, your copilot",
            "aria-haspopup": "dialog",
          },
          h(
            "span",
            { key: 88, className: "bit-portrait", "data-bit-portrait": "" },
            h("canvas", { key: 89, "aria-hidden": "true" }),
            h(
              "span",
              { key: 90, className: "bit-fallback", "aria-hidden": "true" },
              h(React.Fragment, { key: 91 }, "◇"),
            ),
          ),
          h("span", { key: 92, className: "bit-header-label" }, h(React.Fragment, { key: 93 }, "BIT")),
        ),
        " ",
        h(
          "button",
          {
            key: 95,
            type: "button",
            className: "hud-control motion-control",
            "data-motion-toggle": "",
            "aria-label": "Pause motion",
            title: "Pause motion",
            "aria-pressed": "false",
          },
          h(React.Fragment, { key: 96 }, "Pause motion"),
        ),
        " ",
        h(
          designSystem.Button,
          { key: 98, as: "a", href: "#contact", size: "sm" },
          h(React.Fragment, { key: 99 }, "Let’s talk →"),
        ),
        " ",
      ),
      " ",
    ),
    " ",
    h(
      "div",
      {
        key: 103,
        "aria-hidden": "true",
        className: "v41-78c018d829",
      },
      h("div", {
        key: 104,
        id: "scroll-prog",
        className: "v41-514cfd682d",
      }),
    ),
    " ",
  );
}
