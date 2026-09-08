import { FLEET_EVIDENCE } from "./fleet-evidence";

export const PROJECTS = [
  {
    id: "hermes",
    title: "HERMES",
    subtitle: "Orchestrating intelligence.",
    category: "AI orchestration",
    cue: "Give a request a destination.",
    color: "#e8bb78",
  },
  {
    id: "cascade",
    title: "Escalation Cascade",
    subtitle: "Autonomy with a boundary.",
    category: "Bounded autonomy",
    cue: "Find the moment a human takes command.",
    color: "#b4c8e2",
  },
  {
    id: "exposure",
    title: "Exposure Assessment",
    subtitle: "From finding to next action.",
    category: "Security intelligence",
    cue: "Turn an observation into a decision.",
    color: "#efab92",
  },
  {
    id: "briefing",
    title: "Sovereign Briefing",
    subtitle: "Evidence into perspective.",
    category: "Decision intelligence",
    cue: "Build a brief around what is actually known.",
    color: "#d4c3a2",
  },
  {
    id: "dashboards",
    title: "ZeusApollo",
    subtitle: "Clarity across the estate.",
    category: "Operations",
    cue: "Advance the clock. See when evidence needs a fresh look.",
    color: "#a3d2c4",
  },
  {
    id: "signal",
    title: "The Shop Floor Signal",
    subtitle: "Context for the next decision.",
    category: "Industrial intelligence",
    cue: "Qualify a signal before acting on it.",
    color: "#e3c66f",
  },
  {
    id: "graphify",
    title: "Graphify",
    subtitle: "See what a change touches.",
    category: "Developer tooling",
    cue: "Explore a dependency before you refactor.",
    color: "#bdb9e6",
  },
] as const;

export const ATLAS = [
  {
    id: "operator",
    name: "The operator",
    role: "Authority",
    value: "Human",
    unit: "in command",
    summary: "A person owns the consequential decision.",
    body: "Policy defines what automation may do. Escalation preserves the evidence and returns decisions beyond that boundary to an accountable person.",
    evidence: "Published operating philosophy",
    x: 50,
    y: 13,
  },
  {
    id: "hermes",
    name: "HERMES",
    role: "Orchestration",
    value: "—",
    unit: "routing not verified",
    summary: "Intent becomes a qualified route.",
    body: "The latest audit did not establish a current lane inventory or execution record. This atlas illustrates the design relationships; the HERMES study lets you explore a browser-only routing model.",
    evidence: `Audit · ${FLEET_EVIDENCE.verifiedLong} · routing withheld`,
    x: 50,
    y: 42,
  },
  {
    id: "zeus",
    name: "Zeus",
    role: "Owned compute",
    value: String(FLEET_EVIDENCE.containers.zeus),
    unit: "LXC containers at observation",
    summary: "Physical ownership. Visible evidence.",
    body: `${FLEET_EVIDENCE.containers.zeus} LXC containers were running at this dated observation. Guest runtime does not establish application availability or failover readiness.`,
    evidence: `Fleet observation · ${FLEET_EVIDENCE.verifiedLong}`,
    x: 25,
    y: 73,
  },
  {
    id: "apollo",
    name: "Apollo",
    role: "Owned compute",
    value: String(FLEET_EVIDENCE.containers.apollo),
    unit: "LXC containers at observation",
    summary: "A second host in the same estate.",
    body: `${FLEET_EVIDENCE.containers.apollo} LXC containers were running at this dated observation. The two-host cluster was quorate; quorum alone does not establish workload failover. Private service locations are withheld.`,
    evidence: `Fleet observation · ${FLEET_EVIDENCE.verifiedLong}`,
    x: 75,
    y: 73,
  },
] as const;

export type RouteInput = { intent: "draft" | "research" | "analyze"; privateData: boolean; sources: boolean };

/** A deterministic teaching model, deliberately separate from production policy. */
export function routeExample(input: RouteInput) {
  if (input.privateData)
    return {
      lane: "Human review",
      code: "HOLD",
      detail: "The privacy boundary comes first. Confirm an authorized processing route before any external execution.",
      steps: [
        "Intent identified",
        "Private input detected",
        "External route held",
        "Reason preserved",
        "Operator decision required",
      ],
    };
  if (input.intent === "research" || input.sources)
    return {
      lane: "Research",
      code: "EVIDENCE",
      detail:
        "Attributable evidence is part of the request. Route to research, then review the sources and their limits.",
      steps: [
        "Evidence requirement found",
        "Public input accepted",
        "Research lane selected",
        "Sources requested",
        "Operator reviews evidence",
      ],
    };
  return {
    lane: input.intent === "analyze" ? "Synthesis" : "Workhorse",
    code: "QUALIFIED",
    detail:
      input.intent === "analyze"
        ? "A synthesis task needs connected reasoning. Preserve the assumptions and send the result for review."
        : "Routine drafting fits a general work lane. Greater expense needs a reason.",
    steps: [
      "Intent identified",
      "Public input accepted",
      input.intent === "analyze" ? "Synthesis lane selected" : "Workhorse lane selected",
      "Decision recorded",
      "Operator reviews the draft",
    ],
  };
}

export function escalationExample(severity: number, confidence: number) {
  if (severity >= 70 || confidence < 40)
    return {
      level: 2,
      title: "Human decision",
      body: "The consequence or uncertainty exceeds this example’s automation boundary. Preserve context and hand the decision to the operator.",
    };
  if (severity >= 35 || confidence < 75)
    return {
      level: 1,
      title: "Gather evidence",
      body: "The initial check is inconclusive. Collect the missing observation before deciding whether to escalate.",
    };
  return {
    level: 0,
    title: "Bounded check",
    body: "A low-consequence, well-supported signal can remain inside a predefined check. Record the result and keep the boundary visible.",
  };
}

export function exposureExample(reachable: boolean, protectedByAuth: boolean, critical: boolean) {
  if (reachable && !protectedByAuth)
    return {
      level: "Investigate first",
      body: "Confirm the observed reachability, identify the owner, and verify whether access is intended. Prioritize the review when the asset is critical.",
    };
  if (reachable && critical)
    return {
      level: "Review the boundary",
      body: "Authentication is one control. Verify its coverage, the asset’s intended audience, and the accountable owner.",
    };
  return {
    level: "Validate the observation",
    body: "The selected facts do not establish a confirmed exposure. Verify scope and evidence before drawing a conclusion.",
  };
}

export const GRAPH_NODES = [
  { id: "ui", label: "Interface", x: 12, y: 26 },
  { id: "router", label: "Router", x: 50, y: 20 },
  { id: "policy", label: "Policy", x: 85, y: 28 },
  { id: "audit", label: "Evidence", x: 26, y: 75 },
  { id: "adapter", label: "Adapter", x: 73, y: 72 },
] as const;
// A -> B means A depends on B. This is a synthetic example, not the site's own graph.
export const GRAPH_EDGES = [
  ["ui", "router"],
  ["router", "policy"],
  ["router", "audit"],
  ["router", "adapter"],
  ["adapter", "policy"],
] as const;

export function affectedModules(id: string) {
  const affected = new Set<string>([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [dependent, dependency] of GRAPH_EDGES) {
      if (affected.has(dependency) && !affected.has(dependent)) {
        affected.add(dependent);
        changed = true;
      }
    }
  }
  return [...affected].filter((node) => node !== id);
}
