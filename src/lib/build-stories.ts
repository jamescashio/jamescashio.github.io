/** Illustrative workflows explain the published builds; they are not production runs. */
export const BUILD_STORIES = [
  {
    outcome: "The right model for the job. A person in command.",
    input: "A request arrives with a purpose and a privacy boundary.",
    action: "HERMES checks policy, qualifies a lane, and keeps the decision observable.",
    result: "An answer with a reason for the route and a clear escalation path.",
    example: "Try the interactive route below. Every example runs entirely in this page.",
  },
  {
    outcome: "Small checks first. Human attention where it matters.",
    input: "An automated check finds something it cannot confidently resolve.",
    action: "The workflow gathers evidence and escalates as severity or uncertainty increases.",
    result: "The next reviewer receives the exception, its evidence, and the decision required.",
    example:
      "Example handoff: a repeated failure remains unresolved. Preserve the failed check, record what was attempted, and ask the operator to choose the next action.",
  },
  {
    outcome: "Turn scattered security findings into a next action.",
    input: "Separate sources describe a potentially exposed service.",
    action: "Findings are connected by reachability, supporting evidence, and ownership.",
    result: "A remediation picture that tells an accountable owner what to investigate next.",
    example:
      "Example finding: confirm whether the service is reachable, attach the supporting observation, identify its owner, and prioritize the corrective action. This example contains no real target.",
  },
  {
    outcome: "A technical development becomes a decision you can make.",
    input: "A development in AI, security, or infrastructure needs a business interpretation.",
    action: "The briefing separates supported claims, uncertain details, and practical consequences.",
    result: "A source-backed brief with a decision, its rationale, and what still needs checking.",
    example:
      "Example brief: what changed; why it matters; the evidence; the open question; the next decision. A clear structure for a leader who has minutes, not hours.",
  },
  {
    outcome: "Know what was measured—and when to check again.",
    input: "An operator needs to understand fleet, routing, and service state.",
    action: "The dashboards present evidence with provenance, timestamps, and visible stale states.",
    result: "A dated observation that can be distinguished from a fresh measurement.",
    example:
      "Published example: 18 of 19 documented guests were running at the 28 August 2026 probe. This is dated evidence; it does not establish what is running now.",
  },
  {
    outcome: "Give the person running the line a useful signal.",
    input: "An industrial team needs to interpret an operational signal.",
    action: "Signals are qualified, exceptions escalate, and the response keeps an accountable owner.",
    result: "A practical next decision with the supporting context attached.",
    example:
      "Example signal: describe the observed exception, explain its possible consequence, identify the missing evidence, and give the line owner the next decision. No plant or customer data is used.",
  },
  {
    outcome: "See the connections before you change the code.",
    input: "A change touches code whose dependencies are difficult to follow.",
    action: "A navigable graph exposes coupling, ownership, and likely change paths.",
    result: "A clearer view of the affected components before a refactor begins.",
    example:
      "Example inspection: select a module, follow its incoming and outgoing connections, then review the affected owners and documentation before making the change.",
  },
] as const;

export const ROUTE_EXAMPLES = [
  {
    name: "Draft a brief",
    request: "Turn these public notes into a concise project update.",
    lane: "WORKHORSE",
    reason: "Routine drafting fits a general work lane. Greater expense needs a reason.",
    checks: [
      "Drafting intent identified",
      "Public input accepted",
      "Routine work lane selected",
      "Decision recorded",
      "Operator reviews the draft",
    ],
    response: "A short update with the objective, progress, open questions, and next action.",
  },
  {
    name: "Research a claim",
    request: "Check a public claim and return the sources behind it.",
    lane: "RESEARCH",
    reason: "This task needs attributable evidence. The research lane matches that requirement.",
    checks: [
      "Evidence request identified",
      "Public research permitted",
      "Research lane selected",
      "Source requirement recorded",
      "Operator reviews the evidence",
    ],
    response: "A supported conclusion, source references, and a clear note about uncertainty.",
  },
  {
    name: "Handle private data",
    request: "Send a confidential internal document to an external model.",
    lane: "HUMAN REVIEW",
    reason: "The privacy boundary takes priority. External execution waits for an authorized decision.",
    checks: [
      "Confidential input identified",
      "Privacy boundary stops egress",
      "External route held",
      "Reason for the hold recorded",
      "Operator chooses the next step",
    ],
    response: "Request held. Confirm an approved processing route before sharing confidential content.",
  },
] as const;
