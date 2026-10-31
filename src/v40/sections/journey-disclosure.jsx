import React from "react";
const h = React.createElement;

export function JourneyDisclosure({ id, title, description, image, children }) {
  return h(
    "details",
    { id, className: "journey-disclosure" },
    h(
      "summary",
      null,
      image ? h("img", { src: image, alt: "", width: 160, height: 100, loading: "lazy", decoding: "async" }) : null,
      h("span", { className: "journey-disclosure-copy" }, h("strong", null, title), h("small", null, description)),
      h("span", { className: "journey-disclosure-icon", "aria-hidden": "true" }, "+"),
    ),
    h("div", { className: "journey-disclosure-content" }, children),
  );
}
