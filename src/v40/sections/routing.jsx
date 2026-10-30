import React from "react";
const h = React.createElement;

export function RoutingSection() {
  return h(
    "aside",
    { id: "law", className: "routing-note", "aria-label": "My routing law", "data-screen-label": "Routing law" },
    h("span", { className: "visitor-kicker" }, "The principle behind the decision"),
    h("blockquote", null, h("p", null, "Quality picks the model."), h("p", null, "Cost only breaks a tie.")),
    h("p", { className: "routing-provenance" }, "My routing law · dated export"),
    h(
      "div",
      { className: "visitor-links" },
      h("a", { className: "visitor-link", href: "#studies" }, "Try the routing demo →"),
      h("a", { className: "visitor-link", href: "#evidence" }, "Read the evidence boundary →"),
    ),
  );
}
