import type { StudyId } from "./study-experiment";

const SOURCE = "https://github.com/jamescashio/jamescashio.github.io/blob/0c509286ed9329b897741e1afe505376deb443ce/";

type StudyNote = {
  takeaway: string;
  relevance: string;
  question: string;
  rule: string;
  experiment: string;
  boundary: string;
  source: string;
  sourceLabel: string;
};

/** These notes describe the executable teaching models, not a production deployment. */
export const STUDY_NOTES: Record<StudyId, StudyNote> = {
  hermes: {
    takeaway: "Give each request the route it needs.",
    relevance:
      "Routine work gets a general lane. Evidence requirements change the route. Private information puts a person in the decision. This is the policy behind the cost-control idea.",
    question: "What wins when intent, evidence requirements, and privacy disagree?",
    rule: "Private input always holds the external route for human review. Otherwise, Research intent or a source requirement selects Research. Analyze selects Synthesis; Draft selects Workhorse.",
    experiment:
      "Choose Analyze and require sources: Research wins. Now turn on private information: Human review wins. Change the intent again; the privacy boundary holds.",
    boundary:
      "A deterministic routing model with four outcomes. It calls no model, measures no provider, and does not establish the current HERMES deployment’s behavior.",
    source: `${SOURCE}src/odyssey/data.ts`,
    sourceLabel: "Inspect routeExample in the released model",
  },
  cascade: {
    takeaway: "Uncertainty is a reason to change the next action.",
    relevance:
      "A useful automation knows when to gather evidence and when to hand control back. Moving one slider makes that boundary visible.",
    question: "When should automation stop and ask a person?",
    rule: "Consequence at 70% or higher, or confidence below 40%, selects Human decision. Otherwise, consequence at 35% or higher, or confidence below 75%, selects Gather evidence. The remaining range permits a bounded check.",
    experiment:
      "Hold consequence at 25%. Move confidence from 75% to 74%, then from 40% to 39%. The two boundaries produce different next actions.",
    boundary:
      "Illustrative thresholds, chosen to make the transitions visible. They are not calibrated risk probabilities or production policy.",
    source: `${SOURCE}src/odyssey/data.ts`,
    sourceLabel: "Inspect escalationExample in the released model",
  },
  exposure: {
    takeaway: "Reachable is the start of an investigation.",
    relevance:
      "The same service can call for different next steps when authentication or criticality changes. Establish the facts before choosing a response.",
    question: "Does a reachable service establish a security finding?",
    rule: "Reachable without observed authentication selects Investigate first. A reachable, authenticated, critical asset selects Review the boundary. Other combinations select Validate the observation.",
    experiment:
      "Observe authentication on a reachable critical asset. The next action changes, but it never becomes a declaration that the service is safe.",
    boundary:
      "A synthetic triage exercise. No target is scanned, and these three inputs do not establish an exploit, vulnerability, or complete security assessment.",
    source: `${SOURCE}src/odyssey/data.ts`,
    sourceLabel: "Inspect exposureExample in the released model",
  },
  briefing: {
    takeaway: "A short brief can still say “we don’t know.”",
    relevance:
      "Keeping an unknown visible lets the reader choose the next observation. A polished summary should preserve the limits of its sources.",
    question: "Can a short brief preserve the limits of its evidence?",
    rule: "Selected records are assembled into observation, implication, source, and next decision. Fleet and routing statements come from the dated public export; human authority comes from the operating philosophy.",
    experiment:
      "Include routing evidence, then compose the brief. An unverified routing inventory stays unverified instead of becoming a confident count.",
    boundary:
      "Structured text assembled in this browser. There is no generated answer, and a composed brief does not renew the underlying observation.",
    source: "/status.json",
    sourceLabel: "Inspect the dated evidence used by this brief",
  },
  dashboards: {
    takeaway: "The fact stays the same. Its usefulness has a clock.",
    relevance:
      "A timestamp tells an operator when to look again. In this example, the 24-hour boundary changes the review state without inventing a fresh observation.",
    question: "What changes when a valid observation gets older?",
    rule: "This example uses a 24-hour review boundary. At 24 hours, its state changes to Refresh required. The observed fact itself is unchanged.",
    experiment:
      "Move the clock from 23 to 24 hours. The same observation now needs review. Moving it back demonstrates the model; it does not refresh a real system.",
    boundary:
      "The clock and its review window are hypothetical. The actual fleet export has its own timestamp and no implied future health window.",
    source: "/status.json",
    sourceLabel: "Compare the actual fleet observation",
  },
  signal: {
    takeaway: "A second observation changes the decision.",
    relevance:
      "Corroboration turns a threshold crossing into an exception for a person to review. The signal alone does not explain its cause.",
    question: "When does a signal deserve an operator’s attention?",
    rule: "Below 30% deviation, continue observation. At 30% or above, seek corroboration. With a supporting second observation, hand the exception to the operator.",
    experiment:
      "Set deviation to 30% and leave corroboration off. Then add the second observation. The signal is the same; the evidence changes the next action.",
    boundary:
      "A fictional signal and threshold. No plant or customer data is used, and the exercise does not diagnose a physical process.",
    source: `${SOURCE}src/odyssey/labs.tsx`,
    sourceLabel: "Inspect SignalLab in the released model",
  },
  graphify: {
    takeaway: "A small edit can have a larger reach.",
    relevance:
      "Trace direct and indirect dependents before changing a shared module. The graph shows where a focused review and regression checks belong.",
    question: "Which modules depend on the thing you are about to change?",
    rule: "An arrow from A to B means A depends on B. Select B to trace its direct and indirect dependents. The selected module’s own dependencies are not counted as affected consumers.",
    experiment:
      "Select Policy: Router, Adapter, and Interface are affected. Select Adapter: only Router and Interface remain. Select Interface: no other module depends on it.",
    boundary:
      "A five-module synthetic graph with a transitive traversal. It is not a repository scan or a claim that every dependency can be inferred automatically.",
    source: `${SOURCE}src/odyssey/data.ts`,
    sourceLabel: "Inspect affectedModules and the graph edges",
  },
};
