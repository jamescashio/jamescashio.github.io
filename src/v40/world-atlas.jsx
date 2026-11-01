import React, { useRef, useState, useSyncExternalStore } from "react";
const subscribe = () => () => {};
const client = () => true;
const server = () => false;
const destinations = [
  {
    short: "Starship",
    category: "Systems you can fly",
    prompt: "Cut the cloud link.",
    detail:
      "Trace a request before and after you disconnect. See which work stays aboard and where a person must decide.",
    lesson: "A boundary you can see is easier to trust.",
    x: 270,
    y: 99,
  },
  {
    short: "Principles",
    category: "Ideas you can turn",
    prompt: "Give a principle a consequence.",
    detail:
      "Turn the instrument, choose a principle, and follow its action into a working example. The interesting part is what it changes.",
    lesson: "A rule earns its place when it changes a decision.",
    x: 303,
    y: 257,
  },
  {
    short: "Studios",
    category: "A little room for wonder",
    prompt: "Follow the light.",
    detail:
      "Explore the celestial signature, then choose a short film. A ship, a workshop, a distant world. Stay for the atmosphere.",
    lesson: "Some things are worth making simply to see them exist.",
    x: 120,
    y: 314,
  },
  {
    short: "Heritage",
    category: "Curiosity with a flight plan",
    prompt: "Borrow a test pilot’s question.",
    detail:
      "Meet four aviation pioneers and the workshop lessons drawn from their stories. Start with what you would test before you trust.",
    lesson: "Wonder gets you airborne. Judgment brings you home.",
    x: 74,
    y: 152,
  },
];
function AtlasInstrument({ selected, onChoose }) {
  const destination = destinations[selected];
  return React.createElement(
    "div",
    { className: "atlas-instrument" },
    React.createElement(
      "div",
      { className: "atlas-instrument-caption" },
      "THE cAshIo ATLAS ",
      React.createElement("span", null, "0", selected + 1, " / 04"),
    ),
    React.createElement(
      "div",
      { className: "atlas-map" },
      React.createElement(
        "svg",
        { viewBox: "0 0 400 400", fill: "none", "aria-hidden": "true" },
        React.createElement(
          "defs",
          null,
          React.createElement(
            "radialGradient",
            { id: "atlas-core" },
            React.createElement("stop", { stopColor: "#bceff3" }),
            React.createElement("stop", { offset: ".2", stopColor: "#448d9b" }),
            React.createElement("stop", { offset: "1", stopColor: "#0c1d2c" }),
          ),
          React.createElement(
            "linearGradient",
            { id: "atlas-orbit", x1: "0", y1: "0", x2: "1", y2: "1" },
            React.createElement("stop", { stopColor: "#8adbe6" }),
            React.createElement("stop", { offset: ".5", stopColor: "#8adbe6", stopOpacity: ".1" }),
            React.createElement("stop", { offset: "1", stopColor: "#ffc56b" }),
          ),
        ),
        React.createElement("circle", {
          cx: "200",
          cy: "200",
          r: "168",
          stroke: "#abcbd4",
          strokeOpacity: ".15",
          strokeDasharray: "1 7",
        }),
        React.createElement("circle", {
          cx: "200",
          cy: "200",
          r: "136",
          stroke: "url(#atlas-orbit)",
          strokeWidth: ".7",
        }),
        React.createElement("ellipse", {
          cx: "200",
          cy: "200",
          rx: "180",
          ry: "75",
          transform: "rotate(-34 200 200)",
          stroke: "url(#atlas-orbit)",
        }),
        React.createElement("ellipse", {
          cx: "200",
          cy: "200",
          rx: "167",
          ry: "88",
          transform: "rotate(54 200 200)",
          stroke: "#8adbe6",
          strokeOpacity: ".22",
        }),
        React.createElement("path", {
          d: "M200 21v24M200 355v24M21 200h24M355 200h24",
          stroke: "#91bdc7",
          strokeWidth: ".7",
        }),
        React.createElement("path", {
          key: selected,
          className: "atlas-route",
          d: `M200 200Q${destination.x} 200 ${destination.x} ${destination.y}`,
          stroke: "#ffd08a",
          strokeWidth: "1.5",
          pathLength: "1",
        }),
        React.createElement("circle", {
          cx: "200",
          cy: "200",
          r: "42",
          fill: "url(#atlas-core)",
          stroke: "#94d8df",
          strokeOpacity: ".7",
        }),
        React.createElement("ellipse", {
          cx: "200",
          cy: "200",
          rx: "60",
          ry: "17",
          transform: "rotate(-34 200 200)",
          stroke: "#ffcf8a",
          strokeWidth: "2",
        }),
        React.createElement("path", {
          d: "M185 181l26-9 15 25-14 30-30-13-8-20zM185 181l27 46m-38-33 52 3m-15-25-29 42",
          stroke: "#b9eef1",
          strokeOpacity: ".3",
        }),
        destinations.map((item, index) =>
          React.createElement(
            "g",
            { key: item.short, className: selected === index ? "atlas-waypoint is-selected" : "atlas-waypoint" },
            React.createElement("circle", { cx: item.x, cy: item.y, r: "15" }),
            React.createElement("circle", { cx: item.x, cy: item.y, r: "5" }),
            React.createElement(
              "text",
              { x: item.x + (item.x > 200 ? 23 : -23), y: item.y + 4, textAnchor: item.x > 200 ? "start" : "end" },
              "0",
              index + 1,
            ),
          ),
        ),
      ),
      destinations.map((item, index) =>
        React.createElement(
          "button",
          {
            key: item.short,
            className: `atlas-point atlas-point-${index}`,
            type: "button",
            tabIndex: -1,
            "aria-label": `Preview ${item.short} in the atlas`,
            "aria-pressed": selected === index,
            onClick: () => onChoose(index),
          },
          React.createElement("span", null, item.short),
        ),
      ),
    ),
    React.createElement(
      "p",
      null,
      "One curious mind.",
      React.createElement("br", null),
      React.createElement("strong", null, "Four ways to explore."),
    ),
    React.createElement("span", { className: "atlas-chart-note" }, "A map of the imagination"),
  );
}
export function WorldAtlas({ worlds }) {
  const [selected, select] = useState(0);
  const interactive = useSyncExternalStore(subscribe, client, server);
  const controls = useRef([]);
  function navigate(event, index) {
    let next;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % worlds.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index + worlds.length - 1) % worlds.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = worlds.length - 1;
    else return;
    event.preventDefault();
    // This atlas also handles horizontal keys; do not repeat the legacy document tab handler.
    event.stopPropagation();
    select(next);
    controls.current[next]?.focus();
  }
  return React.createElement(
    "div",
    { className: "world-atlas", "data-interactive": interactive },
    interactive &&
      React.createElement(
        "div",
        { className: "atlas-selectors", role: "tablist", "aria-label": "World atlas" },
        worlds.map((world, index) =>
          React.createElement(
            "button",
            {
              key: world.index,
              ref: (element) => {
                controls.current[index] = element;
              },
              id: `atlas-tab-${index}`,
              role: "tab",
              type: "button",
              "aria-controls": `atlas-world-${index}`,
              "aria-selected": index === selected,
              tabIndex: index === selected ? 0 : -1,
              onClick: () => select(index),
              onKeyDown: (event) => navigate(event, index),
            },
            React.createElement("span", null, world.index),
            " ",
            destinations[index].short,
            " ",
            React.createElement("span", { "aria-hidden": "true" }, "\u2197"),
          ),
        ),
      ),
    React.createElement(
      "div",
      { className: "atlas-stage" },
      interactive &&
        React.createElement(AtlasInstrument, {
          selected,
          onChoose: (index) => {
            select(index);
            controls.current[index]?.focus({ preventScroll: true });
          },
        }),
      React.createElement(
        "div",
        { className: "atlas-destinations" },
        worlds.map((world, index) =>
          React.createElement(
            "div",
            {
              key: world.index,
              id: `atlas-world-${index}`,
              className: "atlas-destination",
              role: interactive ? "tabpanel" : undefined,
              "aria-labelledby": interactive ? `atlas-tab-${index}` : undefined,
              hidden: interactive && index !== selected,
            },
            React.createElement(
              "div",
              { className: "atlas-art" },
              React.createElement("img", {
                src: world.img,
                srcSet: world.srcSet,
                sizes: "(max-width: 900px) 90vw, 680px",
                alt: world.alt,
                width: "1280",
                height: "720",
                loading: "lazy",
                decoding: "async",
              }),
              React.createElement("span", null, destinations[index].category),
            ),
            React.createElement(
              "div",
              { className: "atlas-copy" },
              React.createElement("span", { className: "atlas-world-name" }, world.name),
              React.createElement("h3", null, world.line),
              React.createElement("p", null, world.desc),
              React.createElement(
                "div",
                { className: "atlas-field-note" },
                React.createElement("span", null, "TRY THIS FIRST"),
                React.createElement("h4", null, destinations[index].prompt),
                React.createElement("p", null, destinations[index].detail),
              ),
              React.createElement(
                "a",
                { className: "world-portal atlas-enter", href: world.href },
                "Enter ",
                world.name,
                React.createElement("span", { "aria-hidden": "true" }, "\u2197"),
              ),
              React.createElement("p", { className: "atlas-lesson" }, destinations[index].lesson),
            ),
          ),
        ),
      ),
    ),
  );
}
