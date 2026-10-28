import React from "react";
import designSystem from "../design-system.js";
const h = React.createElement;

export function ContactSection({ v }) {
  return h(
    "section",
    {
      key: 1835,
      id: "contact",
      "data-screen-label": "Open a channel",
      className: "v41-13b5e7a9a4",
    },
    " ",
    h("video", {
      key: 1837,
      "data-v": "auto",
      src: "/assets/zenith/workshop-after-hours.mp4",
      poster: "/v40/assets/zenith-workshop-after-hours-poster.webp",
      preload: "none",
      "aria-hidden": "true",
      className: "v41-3017a60a26",
    }),
    " ",
    h("div", {
      key: 1839,
      "aria-hidden": "true",
      className: "v41-44e8807dd3",
    }),
    " ",
    h("div", {
      key: 1841,
      "aria-hidden": "true",
      className: "v41-6d3cacfe3a",
    }),
    " ",
    h(
      "div",
      {
        key: 1843,
        className: "v41-31ee932428",
      },
      " ",
      h(
        "div",
        { key: 1845, "data-reveal": "", className: "v41-022625b12b" },
        " ",
        h(
          "span",
          {
            key: 1847,
            className: "v41-c904563b29",
          },
          h("span", { key: 1848, className: "v41-3bdbfd324b" }, h(React.Fragment, { key: 1849 }, "10")),
          h("span", { key: 1850, "data-scramble": "" }, h(React.Fragment, { key: 1851 }, "Open a channel")),
        ),
        " ",
        h(
          "h2",
          {
            key: 1853,
            className: "v41-881dfa21e5",
          },
          h(React.Fragment, { key: 1854 }, "Don't panic. "),
          h("br", { key: 1855 }),
          h(
            "span",
            {
              key: 1856,
              className: "v41-2793278dee",
            },
            h(React.Fragment, { key: 1857 }, "Say hello."),
          ),
        ),
        " ",
      ),
      " ",
      h(
        "div",
        {
          key: 1860,
          "data-reveal": "",
          className: "v41-6274b871a0",
        },
        " ",
        h(
          "p",
          {
            key: 1862,
            className: "v41-d694e61e67",
          },
          h(
            React.Fragment,
            { key: 1863 },
            "Bring me your trickiest question about local AI, private data or keeping a human in the loop. I am open to speaking, mentoring and comparing notes. The answer is probably not 42.",
          ),
        ),
        " ",
        h(
          "div",
          { key: 1865, className: "v41-8d8b1f9214" },
          " ",
          h(
            designSystem.Button,
            {
              key: 1867,
              as: "a",
              href: "mailto:doug@cashio.us?subject=Comparing%20notes%20from%20cashio.us&body=What%20I%20am%20working%20on%3A%0A%0AThe%20hardest%20constraint%3A%0A%0AThe%20study%20that%20caught%20my%20attention%3A%0A",
              size: "lg",
            },
            h(React.Fragment, { key: 1868 }, "doug@cashio.us"),
          ),
          " ",
          h(
            designSystem.Button,
            { key: 1870, onClick: v.copyEmail, variant: "secondary", size: "lg" },
            h(React.Fragment, { key: 1871 }, "", h("span", { className: "sc-interp", key: 1 }, v.copyEmailLabel), ""),
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
