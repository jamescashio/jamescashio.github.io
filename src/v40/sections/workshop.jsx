import React from "react";
const h = React.createElement;

const glossary = [
  ["Bit", "The gold copilot. It marks where a person holds authority."],
  ["E.V.E.", "The Evaluation Verification Engine: dated observations, with lore clearly labeled."],
  ["HERMES", "My job scheduler. The routing experiment illustrates a policy, not its live behavior."],
  ["DSH", "My operator console, where I watch and approve the work."],
  ["Zeus and Apollo", "The two servers I own."],
  ["Atlas", "A local model. No fresh model configuration was measured in this observation."],
  ["cAshIo", "Cashio, with the AI in capitals. My personal AI workspace and the name on this site."],
  ["Mostly Harmless", "This site’s visual edition. Each evidence record keeps its own date."],
  ["Workhorse, Research, Synthesis", "Routes for everyday drafting, sourced research and combining information."],
];

export function WorkshopSection({ v }) {
  return h(
    "section",
    { id: "workshop", "data-screen-label": "Workshop", className: "v41-666dcca5e4 workshop-overview" },
    h(
      "div",
      { className: "workshop-heading" },
      h("span", { className: "v41-c904563b29" }, h("span", { className: "v41-3bdbfd324b" }, "02"), "From the workshop"),
      h("h2", { className: "v41-ebe245028e" }, "Built at home. Open to inspect."),
      h("p", null, "Two things to take a closer look at: a dated result, and a tool to make your own."),
    ),
    h(
      "div",
      { className: "workshop-highlights" },
      h(
        "article",
        { className: "workshop-highlight workshop-proof" },
        h("span", { className: "visitor-kicker" }, "A backup with a receipt"),
        h("h3", null, "A backup needs evidence."),
        h(
          "p",
          { className: "workshop-result" },
          h("strong", null, String(v.snapshot.backup.latestVerified)),
          h("span", null, "latest reported snapshots passed their integrity check"),
        ),
        h("p", { className: "workshop-date" }, "Observed " + v.observedDate),
        h(
          "p",
          null,
          "Integrity is one check. A recovery rehearsal is a separate test; no new rehearsal was performed.",
        ),
        h("a", { className: "visitor-link", href: "#evidence" }, "Read the repair and receipt →"),
      ),
      h(
        "article",
        { className: "workshop-highlight workshop-tool" },
        h("span", { className: "visitor-kicker" }, "A tool to take with you"),
        h("h3", null, "A brief worth keeping."),
        h(
          "p",
          null,
          "Choose what matters. Keep the sources and the unknowns attached. Take the decision brief with you.",
        ),
        h(
          "ul",
          { className: "brief-outline" },
          h("li", null, "What we observed", h("span", null, "A source and a date.")),
          h("li", null, "What we don’t know", h("span", null, "The unknown stays visible.")),
          h("li", null, "Who decides", h("span", null, "A person keeps the final say.")),
        ),
        h(
          "div",
          { className: "visitor-links" },
          h("a", { className: "visitor-link", href: "#experiment=briefing" }, "Make your brief →"),
          h(
            "a",
            {
              className: "visitor-link",
              href: "/artifacts/decision-brief.txt",
              download: "cashio-decision-brief-example.txt",
            },
            "Download an example ↓",
          ),
        ),
      ),
    ),
    h(
      "div",
      { className: "workshop-boundary" },
      h(
        "p",
        null,
        "The experiments run in your browser. Nothing reaches my servers. Lab figures come from a dated observation.",
      ),
      h(
        "a",
        { className: "visitor-link", href: "https://github.com/jamescashio/jamescashio.github.io" },
        "Read the source ↗",
      ),
    ),
    h(
      "details",
      { className: "workshop-glossary", id: "lab-glossary" },
      h(
        "summary",
        null,
        h("span", null, "Inside the lab", h("small", null, "The names, in plain English")),
        h("span", { "aria-hidden": "true" }, "+"),
      ),
      h(
        "dl",
        null,
        glossary.map(([term, definition]) => h("div", { key: term }, h("dt", null, term), h("dd", null, definition))),
      ),
    ),
  );
}
