import React from "react";
import { WorldAtlas } from "../world-atlas.jsx";
export function WorldsSection({ v }) {
  return React.createElement(
    "section",
    { id: "rooms", "data-screen-label": "Four worlds", className: "v41-43f26deb62" },
    React.createElement(
      "div",
      { "data-reveal": "", className: "v41-260a3097b1" },
      React.createElement(
        "div",
        { className: "v41-022625b12b" },
        React.createElement(
          "span",
          { className: "v41-c904563b29" },
          React.createElement("span", { className: "v41-3bdbfd324b" }, "03"),
          React.createElement("span", { "data-scramble": "" }, "Four worlds"),
        ),
        React.createElement(
          "h2",
          { className: "v41-0cf0266feb" },
          "Pick a world. ",
          React.createElement("br", null),
          React.createElement("span", { className: "v41-a05a8e3573" }, "Stay a while."),
        ),
      ),
      React.createElement(
        "p",
        { className: "v41-17b9cd1b27" },
        "Fly, tinker, watch or read. Choose a destination in the atlas, then take the controls.",
      ),
    ),
    React.createElement(WorldAtlas, { worlds: v.worlds }),
    React.createElement(
      "nav",
      { "aria-label": "Room reading editions", className: "v41-e74ee9b003" },
      React.createElement("span", { className: "v41-c471889143" }, "Reading editions:"),
      React.createElement("a", { href: "/rooms/starship/" }, "Starship lab"),
      React.createElement("a", { href: "/rooms/principles/" }, "Principles"),
      React.createElement("a", { href: "/rooms/studios/" }, "Studios"),
      React.createElement("a", { href: "/rooms/heritage/" }, "Flight heritage"),
    ),
  );
}
