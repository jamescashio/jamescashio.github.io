import React from "react";
// Authored navigation illustrations. They do not depict live systems or measurements.
export function AtlasCore() {
  return React.createElement(
    "g",
    { className: "atlas-core-grid" },
    React.createElement(
      "defs",
      null,
      React.createElement(
        "clipPath",
        { id: "atlas-sphere-clip" },
        React.createElement("circle", { cx: "200", cy: "200", r: "46" }),
      ),
      React.createElement(
        "radialGradient",
        { id: "atlas-sphere-light", cx: "35%", cy: "25%", r: "80%" },
        React.createElement("stop", { stopColor: "#efefef", stopOpacity: ".72" }),
        React.createElement("stop", { offset: ".32", stopColor: "#8466b0", stopOpacity: ".65" }),
        React.createElement("stop", { offset: "1", stopColor: "#191919" }),
      ),
    ),
    React.createElement("circle", {
      cx: "200",
      cy: "200",
      r: "57",
      fill: "none",
      stroke: "#ccadff",
      strokeOpacity: ".18",
    }),
    React.createElement("circle", {
      cx: "200",
      cy: "200",
      r: "50",
      fill: "none",
      stroke: "#dcc8ff",
      strokeOpacity: ".35",
      strokeDasharray: "40 12 4 12",
    }),
    React.createElement("circle", {
      cx: "200",
      cy: "200",
      r: "46",
      fill: "url(#atlas-sphere-light)",
      stroke: "#e7dbff",
      strokeOpacity: ".8",
    }),
    React.createElement(
      "g",
      {
        clipPath: "url(#atlas-sphere-clip)",
        transform: "rotate(-24 200 200)",
        fill: "none",
        stroke: "#e1e1e1",
        strokeWidth: ".6",
        strokeOpacity: ".5",
      },
      [12, 28, 40].map((radius) =>
        React.createElement("ellipse", { key: radius, cx: "200", cy: "200", rx: radius, ry: "46" }),
      ),
      [-32, -17, 0, 17, 32].map((offset) =>
        React.createElement("ellipse", { key: offset, cx: "200", cy: 200 + offset, rx: "48", ry: "10" }),
      ),
      React.createElement("path", { d: "M154 200h92M200 154v92" }),
    ),
    React.createElement("ellipse", {
      cx: "200",
      cy: "200",
      rx: "69",
      ry: "19",
      transform: "rotate(-34 200 200)",
      fill: "none",
      stroke: "#e0cfff",
      strokeWidth: "1.6",
    }),
    React.createElement("path", { d: "M143 225q55 1 112-56", fill: "none", stroke: "#eee6ff", strokeWidth: "2.2" }),
    React.createElement("circle", { cx: "161", cy: "220", r: "3", fill: "#eee6ff" }),
  );
}
export function AtlasTicks() {
  return React.createElement(
    "g",
    { fill: "none", stroke: "#d9c4ff", className: "atlas-calibration", "aria-hidden": "true" },
    Array.from({ length: 60 }, (_, index) => {
      const major = index % 5 === 0;
      return React.createElement("path", {
        key: index,
        d: `M200 25v${major ? 8 : 3}`,
        transform: `rotate(${index * 6} 200 200)`,
        strokeWidth: major ? 1 : 0.6,
        strokeOpacity: major ? 0.55 : 0.22,
      });
    }),
    React.createElement("path", { d: "M34 59V34h25M341 34h25v25M34 341v25h25M341 366h25v-25", strokeOpacity: ".2" }),
  );
}
export function MobileAtlasTrack({ selected }) {
  return React.createElement(
    "div",
    { className: "atlas-mobile-route", "aria-hidden": "true" },
    React.createElement(
      "svg",
      { viewBox: "0 0 360 64", width: "100%", height: "64", fill: "none" },
      React.createElement("path", {
        d: "M45 32C100 0 260 64 315 32M45 32C100 64 260 0 315 32",
        stroke: "#c8a4ff",
        strokeOpacity: ".26",
      }),
      React.createElement("path", { d: "M45 32h270", stroke: "#aa85e2", strokeDasharray: "2 5", strokeOpacity: ".55" }),
      [45, 135, 225, 315].map((x, index) =>
        React.createElement(
          "g",
          { key: x, className: selected === index ? "is-selected" : "" },
          React.createElement("circle", {
            cx: x,
            cy: "32",
            r: selected === index ? 16 : 11,
            fill: "#191919",
            stroke: selected === index ? "#e0ceff" : "#bd94fa",
          }),
          selected === index &&
            React.createElement("circle", { cx: x, cy: "32", r: "20", stroke: "#e0ceff", strokeOpacity: ".22" }),
          React.createElement(
            "text",
            { x: x, y: "36", textAnchor: "middle", fill: selected === index ? "#e7dbff" : "#cdcdcd" },
            String(index + 1).padStart(2, "0"),
          ),
        ),
      ),
    ),
  );
}
export function FilmAperture() {
  return React.createElement(
    "svg",
    {
      className: "film-aperture",
      viewBox: "0 0 100 100",
      width: "100%",
      height: "100%",
      fill: "none",
      "aria-hidden": "true",
    },
    React.createElement("circle", { cx: "50", cy: "50", r: "46", stroke: "currentColor", strokeOpacity: ".35" }),
    React.createElement("circle", {
      className: "film-aperture-ring",
      cx: "50",
      cy: "50",
      r: "39",
      stroke: "currentColor",
      strokeWidth: "1.5",
      strokeDasharray: "36 5",
    }),
    React.createElement("circle", {
      cx: "50",
      cy: "50",
      r: "30",
      fill: "#141414ec",
      stroke: "currentColor",
      strokeOpacity: ".8",
    }),
    React.createElement("path", { d: "m45 39 17 11-17 11z", fill: "currentColor" }),
    React.createElement("path", { d: "M50 0v8M50 92v8M0 50h8M92 50h8", stroke: "currentColor" }),
  );
}
