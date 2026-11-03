import type { GeneratedProps, GeneratedValue } from "../generated-view.ts";

import { exampleBrief } from "../decision-brief.ts";
import { BuildStory } from "../build-stories";
import { h } from "../generated-view.ts";

const glossary = [
  ["Bit", "The gold copilot. It marks where a person holds authority."],
  ["E.V.E.", "The Evaluation Verification Engine: dated observations, with lore clearly labeled."],
  ["HERMES", "My job scheduler. The routing experiment illustrates a policy, not its live behavior."],
  ["DSH", "My operator console, where I watch and approve the work."],
  ["Zeus and Apollo", "The two servers I own."],
  ["Atlas", "A local model. No fresh model configuration was measured in this observation."],
  ["cAshIo", "Cashio, with the AI in capitals. My personal AI workspace and the name on this site."],
  ["Mostly Harmless", "The site’s original visual edition and enduring sense of humor. Evidence keeps its own date."],
  ["Workhorse, Research, Synthesis", "Routes for everyday drafting, sourced research and combining information."],
];

export function WorkshopSection({ v }: GeneratedProps) {
  return h(
    "section",
    { id: "workshop", "data-screen-label": "Workshop", className: "v41-666dcca5e4 workshop-overview" },
    h(
      "div",
      { className: "workshop-heading" },
      h("span", { className: "v41-c904563b29" }, h("span", { className: "v41-3bdbfd324b" }, "04"), "From the workshop"),
      h("h2", { className: "v41-ebe245028e" }, "Built at home. Open to inspect."),
      h(
        "p",
        null,
        "Two builds from my workbench after hours. I’m a Principal Solutions Consultant; here you can inspect the choices and limits behind the work.",
      ),
      h("a", { className: "visitor-link workshop-intro-link", href: "#operator" }, "Meet Doug →"),
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
          "dl",
          { className: "workshop-case" },
          h(
            "div",
            null,
            h("dt", null, "The question"),
            h("dd", null, "Can the latest backup snapshots pass an integrity check?"),
          ),
          h(
            "div",
            null,
            h("dt", null, "My approach"),
            h("dd", null, "Check the latest snapshot per guest. Publish the date and the limits with the result."),
          ),
        ),
        h(
          "p",
          { className: "workshop-result" },
          h("strong", null, String(v.snapshot.backup.latestVerified)),
          h("span", null, "latest reported snapshots passed their integrity check"),
        ),
        h("p", { className: "workshop-date" }, "Observed " + v.observedDate),
        h("p", null, "No new restore rehearsal was performed; full recovery remains unproven."),
        h("a", { className: "visitor-link", href: "#evidence" }, "Read the dated receipt →"),
        h(BuildStory, { kind: "evidence" }),
      ),
      h(
        "article",
        { className: "workshop-highlight workshop-tool" },
        h("span", { className: "visitor-kicker" }, "A tool to take with you"),
        h("h3", null, "A brief worth keeping."),
        h(
          "p",
          null,
          "Create a brief with sources, dates, visible unknowns and a human decision. Keep it here or take a copy.",
        ),
        h(
          "figure",
          { className: "brief-preview", "aria-label": "Example decision brief" },
          h("figcaption", null, h("span", null, "Decision brief"), h("span", null, "Example")),
          h(
            "dl",
            null,
            h("div", null, h("dt", null, "Observed"), h("dd", null, exampleBrief.observed)),
            h(
              "div",
              null,
              h("dt", null, "Source"),
              h("dd", null, h("a", { href: "/status.json" }, "Published record"), " · ", v.observedDate),
            ),
            h("div", null, h("dt", null, "Unknown"), h("dd", null, exampleBrief.unknown)),
            h("div", null, h("dt", null, "Decision"), h("dd", null, exampleBrief.owner)),
          ),
          h("p", null, "An example from the published record, not a new check."),
        ),
        h(
          "div",
          { className: "visitor-links" },
          h("a", { className: "visitor-link", href: "#experiment=briefing" }, "Make your brief →"),
          h(
            "a",
            {
              className: "visitor-link",
              href: "/artifacts/decision-brief-example.txt",
              download: "cashio-decision-brief-example.txt",
            },
            "Download an example ↓",
          ),
        ),
        h(BuildStory, { kind: "brief" }),
      ),
    ),
    h(
      "div",
      { className: "workshop-boundary" },
      h("p", null, "Experiment inputs stay in your browser. Lab figures come from a dated observation."),
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
        glossary.map(([term, definition]: GeneratedValue) =>
          h("div", { key: term }, h("dt", null, term), h("dd", null, definition)),
        ),
      ),
    ),
  );
}
