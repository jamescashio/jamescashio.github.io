
export function lane(intent, priv, sources) {
  if (priv)
    return {
      name: "Human review",
      code: "HELD",
      label: "EXTERNAL ROUTE HELD",
      color: "var(--accent)",
      detail:
        "Private input holds the external route for human review. A person decides before anything leaves the lab.",
    };
  if (intent === "research" || sources)
    return {
      name: "Sourced research",
      code: "QUALIFIED",
      label: "RESEARCH LANE",
      color: "var(--cyan)",
      detail: "Research intent or a source requirement selects Research, the route for checking claims.",
    };
  if (intent === "analyze")
    return {
      name: "Combining information",
      code: "QUALIFIED",
      label: "SYNTHESIS LANE",
      color: "var(--purple)",
      detail: "Analyze selects Synthesis, the route for combining information.",
    };
  return {
    name: "Everyday drafting",
    code: "QUALIFIED",
    label: "WORKHORSE LANE",
    color: "var(--green)",
    detail: "Draft selects Workhorse, the route for everyday work.",
  };
}
