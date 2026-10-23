import React from "react";
import { classFor } from "../style-variants.js";
import designSystem from "../design-system.js";
const h = React.createElement;

export function OperatorSection({ v }) {
  return h(
    "section",
    {
      key: 1756,
      id: "operator",
      "data-screen-label": "Meet Doug",
      className: "v41-3e1e145206",
    },
    " ",
    h(
      "div",
      { key: 1758, "data-reveal": "", className: "v41-8b0ebad996" },
      " ",
      h(
        "span",
        {
          key: 1760,
          className: "v41-c904563b29",
        },
        h("span", { key: 1761, className: "v41-3bdbfd324b" }, h(React.Fragment, { key: 1762 }, "10")),
        h("span", { key: 1763, "data-scramble": "" }, h(React.Fragment, { key: 1764 }, "Meet Doug")),
      ),
      " ",
      h(
        "h2",
        {
          key: 1766,
          className: "v41-366e84d50c",
        },
        h(React.Fragment, { key: 1767 }, "Doug Cashio"),
      ),
      " ",
      h(
        "p",
        {
          key: 1769,
          className: "v41-2690b53f5f",
        },
        h(React.Fragment, { key: 1770 }, "A workbench for the things I keep wondering about."),
      ),
      " ",
      h(
        "p",
        {
          key: 1772,
          className: "v41-fe097b123a",
        },
        h(
          React.Fragment,
          { key: 1773 },
          "I like systems I can take apart, explain and put back together. This site is where that curiosity meets aviation, science fiction and the pleasure of making something work.",
        ),
      ),
      " ",
      h(
        "div",
        { key: 1775, className: "v41-161d174efb" },
        " ",
        h(
          designSystem.Button,
          {
            key: 1777,
            as: "a",
            href: "https://www.linkedin.com/in/dougcashio/",
            variant: "secondary",
            size: "sm",
          },
          h(React.Fragment, { key: 1778 }, "LinkedIn"),
        ),
        " ",
        h(
          designSystem.Button,
          { key: 1780, as: "a", href: "https://github.com/jamescashio", variant: "secondary", size: "sm" },
          h(React.Fragment, { key: 1781 }, "My GitHub · @jamescashio"),
        ),
        " ",
        h(
          designSystem.Button,
          {
            key: 1783,
            as: "a",
            href: "https://www.credly.com/users/james-cashio/badges/credly",
            variant: "secondary",
            size: "sm",
          },
          h(React.Fragment, { key: 1784 }, "My Credly badges · @james-cashio"),
        ),
        " ",
      ),
      " ",
      h(
        "p",
        { key: 1787, className: "v41-df452b3fda" },
        h(
          React.Fragment,
          { key: 1788 },
          "The GitHub and Credly handles use my first name, James. Everyone calls me Doug.",
        ),
      ),
      " ",
    ),
    " ",
    h(
      "div",
      {
        key: 1791,
        "data-reveal": "",
        "data-tilt": "4",
        className: "v41-78ecc86791",
      },
      " ",
      h(
        "div",
        {
          key: 1793,
          className: "v41-dffe22ca2c",
        },
        h("span", { key: 1794, className: "v41-097ae647c2" }, h(React.Fragment, { key: 1795 }, "THE cAshIo SIGNATURE")),
        h(
          "span",
          { key: 1796, role: "status", className: classFor(["color:", v.sigStateColor ?? "", ""].join("")) },
          h(React.Fragment, { key: 1797 }, "", h("span", { className: "sc-interp", key: 1 }, v.sigState), ""),
        ),
      ),
      " ",
      h(
        "div",
        { key: 1799, className: "v41-418cbec664" },
        " ",
        h("div", { key: 1801, "aria-hidden": "true", className: classFor(v.sigRing) }),
        " ",
        h(
          "div",
          { key: 1803, className: "v41-c49a3c12c5" },
          " ",
          h("img", {
            key: 1805,
            src: "/v40/assets/cashio-celestial-signature.webp",
            width: "1680",
            height: "625",
            loading: "lazy",
            decoding: "async",
            alt: "The cAshIo celestial signature: a gold and titanium wordmark inside an orbital ring",
            className: classFor(v.sigImg),
          }),
          " ",
          h("video", {
            key: 1807,
            id: "sig-video",
            "data-v": "manual",
            src: "/assets/zenith/celestial-signature.mp4",
            poster: "/v40/assets/zenith-celestial-signature-poster.webp",
            preload: "none",
            "aria-hidden": "true",
            className: classFor(v.sigVid),
          }),
          " ",
        ),
        " ",
      ),
      " ",
      h(
        "svg",
        {
          key: 1811,
          "aria-hidden": "true",
          viewBox: "0 0 400 300",
          preserveAspectRatio: "none",
          className: "v41-61d3111620",
        },
        h("path", {
          key: 1812,
          d: "M14 40 V14 H40 M360 14 H386 V40 M14 260 V286 H40 M360 286 H386 V260",
          fill: "none",
          stroke: "rgba(255,149,0,.55)",
          strokeWidth: "1.5",
        }),
      ),
      " ",
      h(
        "div",
        {
          key: 1814,
          className: "v41-745211855e",
        },
        " ",
        h(
          "div",
          { key: 1816, className: "v41-56e137241d" },
          " ",
          h(
            designSystem.Button,
            { key: 1818, onClick: v.energize, size: "sm" },
            h(React.Fragment, { key: 1819 }, "◇ Energize the signature"),
          ),
          " ",
          h(
            "a",
            {
              key: 1821,
              href: "#signature",
              className: "v41-ce2face4fb",
            },
            h(React.Fragment, { key: 1822 }, "Explore the celestial signature in 3D →"),
          ),
          " ",
          h(
            "a",
            {
              key: 1824,
              href: "#film=zenith-celestial-signature",
              className: "v41-ce2face4fb",
            },
            h(React.Fragment, { key: 1825 }, "Watch its quiet orbit · 5 seconds →"),
          ),
          " ",
        ),
        " ",
        h(
          "span",
          {
            key: 1828,
            className: "v41-e6ad5d483a",
          },
          h(React.Fragment, { key: 1829 }, "IMAGINATION, WITH INTENTION."),
        ),
        " ",
      ),
      " ",
    ),
    " ",
  );
}
