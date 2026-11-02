import { CinemaReel, ReelText } from "./hero-reel.jsx";

import React from "react";
import designSystem from "./design-system.js";

const h = React.createElement;

export function renderCinema(v) {
  return h(
    "div",
    {
      key: 1974,
      id: "cinema-dialog",
      role: "dialog",
      "aria-modal": "true",
      tabIndex: "-1",
      "aria-label": v.cinemaTitle,
      className: "v41-ebed93abae",
    },
    " ",
    h(
      "div",
      {
        key: 1976,
        className: "v41-1c5f6b86c5",
      },
      " ",
      h(
        "span",
        { key: 1978, className: "v41-8e316bb9ff" },
        h("span", {
          key: 1979,
          className: "v41-988e550a7d",
        }),
        h(
          React.Fragment,
          { key: 1980 },
          "cAshIo screening room · ",
          h("span", { className: "sc-interp", key: 1 }, v.cinemaColl),
          "",
        ),
      ),
      " ",
      h(
        "button",
        {
          key: 1982,
          type: "button",
          onClick: v.closeCinema,
          "aria-label": "Close",
          className: "v41-caf7b8450f",
        },
        h(React.Fragment, { key: 1983 }, "CLOSE × "),
        h("span", { key: 1984, className: "v41-c471889143" }, h(React.Fragment, { key: 1985 }, "ESC")),
      ),
      " ",
    ),
    " ",
    h(
      "div",
      {
        key: 1988,
        className: "v41-cce017b3ed",
      },
      " ",
      v.cinemaIntro
        ? h(CinemaReel, { key: "intro-replay", title: v.cinemaTitle })
        : h(
            "video",
            {
              key: 1990,
              id: "cinema-video",
              "data-bound-src": v.cinemaSrc,
              "data-bound-poster": v.cinemaPoster,
              controls: true,
              preload: "none",
              playsInline: "",
              className: "v41-f28b60f056",
            },
            v.cinemaCaptions
              ? h("track", {
                  key: "captions",
                  kind: "captions",
                  src: v.cinemaCaptions,
                  srcLang: "en",
                  label: "English",
                })
              : null,
          ),
      " ",
    ),
    " ",
    h(
      "div",
      {
        key: 1993,
        className: "v41-8ae1437585",
      },
      " ",
      h(
        "div",
        { key: 1995, className: "v41-5caaecb449" },
        " ",
        h(
          "h3",
          {
            key: 1997,
            className: "v41-8a9b37c22b",
          },
          h(React.Fragment, { key: 1998 }, "", h("span", { className: "sc-interp", key: 1 }, v.cinemaTitle), ""),
        ),
        " ",
        h(
          "p",
          { key: 2000, className: "v41-20ce106e78" },
          h(React.Fragment, { key: 2001 }, "", h("span", { className: "sc-interp", key: 1 }, v.cinemaDesc), ""),
        ),
        " ",
      ),
      " ",
      h(
        "div",
        { key: 2004, className: "v41-f44596820e" },
        " ",
        h(
          designSystem.Button,
          { key: 2006, onClick: v.cinemaPrev, variant: "secondary", size: "sm" },
          h(React.Fragment, { key: 2007 }, "◂ Previous"),
        ),
        " ",
        h(
          designSystem.Button,
          { key: 2009, onClick: v.cinemaNext, size: "sm" },
          h(React.Fragment, { key: 2010 }, "Next ▸"),
        ),
        " ",
      ),
      " ",
      h(ReelText, v.cinemaText ? { text: v.cinemaText } : undefined),
    ),
    " ",
  );
}
