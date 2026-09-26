export { DECKS, DECK_SHORT } from "./deck-metadata";
export { LINEAGE, LINEAGE_EVIDENCE } from "./flight-lineage";
export { WITHHELD } from "./eve-common";

export const VERIFIED = "08-28-2026";
export const VERIFIED_LONG = "28 August 2026";
export const ROUTING_VERIFIED_LONG = "21 August 2026";
export const EXPIRES = "2026-09-27";
export const EXPIRES_SHORT = "09-27-2026";
export const EXPIRES_AT = "2026-09-28T05:00:00Z";
export const REVISED = "08-28-2026";
export const RELEASE = 'V35 "ALL TENS"';

export const BOOT = [
  "E.V.E. EVALUATION VERIFICATION ENGINE · ONLINE",
  "HYPERVISOR WITHHELD · 2 HOSTS · CLUSTER QUORATE",
  "18/19 AT 28 AUG PROBE · PER HOST COUNTS WITHHELD",
  "ROUTING INVENTORY 21 AUGUST 2026 · 10 PUBLIC LANES · PRIVATE CATALOG COUNT WITHHELD",
  `DATED EXPORT · PUBLIC-SAFE · VERIFIED ${VERIFIED_LONG}`,
];

export const TELEMETRY = [
  "ZEUS · PER HOST COUNT WITHHELD",
  "APOLLO · PER HOST COUNT WITHHELD",
  "FLEET · 18/19 AT 28 AUG PROBE",
  "HYPERVISOR WITHHELD · 2 HOSTS · CLUSTER QUORATE",
  "18/19 AT 28 AUG PROBE",
  "ROUTING INVENTORY 21 AUGUST 2026 · 10 PUBLIC LANES · PRIVATE CATALOG COUNT WITHHELD",
  "LAW · QUALITY PICKS THE MODEL",
  "DATED EXPORT · READ-ONLY · PUBLIC-SAFE SNAPSHOT",
  `VERIFIED ${VERIFIED_LONG} · VALID THRU ${EXPIRES_SHORT}`,
];

export const DECK_CRAFT = [0, 1, 2, 3, 2, 4, 5, 5, 6];
export const CRAFT_DECK = [0, 1, 2, 3, 5, 6, 8, 4];
export const PILOT_CRAFT = [0, 1, 2, 7];

export function resolveCraftIndex(deck: number, craftLock: number | null | undefined) {
  const safeDeck = Math.max(0, Math.min(DECK_CRAFT.length - 1, Math.trunc(deck)));
  if (safeDeck === 4 && craftLock != null && PILOT_CRAFT.includes(craftLock)) return craftLock;
  return DECK_CRAFT[safeDeck] ?? DECK_CRAFT[0];
}

export function craftRoute(craftIndex: number) {
  const safeCraft = Math.max(0, Math.min(CRAFT_DECK.length - 1, Math.trunc(craftIndex)));
  const deck = CRAFT_DECK[safeCraft];
  return {
    deck,
    craftLock: deck === 4 && PILOT_CRAFT.includes(safeCraft) ? safeCraft : null,
  };
}

export function craftLockAfterDeckChange(currentLock: number | null, nextDeck: number, programmaticJump: boolean) {
  return nextDeck === 4 || programmaticJump ? currentLock : null;
}

export const CRAFT = [
  ["BELL X-1", "1947", "Yeager takes it past Mach 1 and writes down exactly where the edge was."],
  ["SR-71 BLACKBIRD", "1964", "Kelly Johnson's answer: few parts, small team, absurd speed."],
  ["PROTEUS", "1998 · RUTAN", "Tandem wings, twin booms, two rear turbofans, and one reconfigurable test platform."],
  ["STARSHIP", "2023", "Fully reusable, or it does not count. Scale as a design goal."],
  ["EPSTEIN DRIVE", "THE EXPANSE", "A fusion torch that never quits, and the whole system opens up."],
  [
    "PHOENIX",
    "2063 · COCHRANE",
    "A missile that learned to bend space. Two nacelles, one field, and distance stops being the limit.",
  ],
  ["HEIGHLINER", "DUNE", "Fold space. Arrive without travelling. The destination comes to you."],
  ["P-51D MUSTANG", "1944 · HOOVER", "Energy is never free. Spend it deliberately, and always leave yourself an out."],
] as const;

export const LANES = [
  {
    id: "00",
    name: "FREE CLASSIFY",
    model: "Model withheld",
    use: "Sort the mail. Tag the ticket. Cheap, fast, good enough.",
  },
  {
    id: "01",
    name: "WORKHORSE",
    model: "Model withheld",
    use: "The daily grind. Drafts, refactors, first-pass analysis.",
  },
  {
    id: "02",
    name: "EXCEPTION",
    model: "Model withheld",
    use: "When the workhorse hesitates. Harder reasoning, still owned-cost.",
  },
  {
    id: "03A",
    name: "MULTIMODAL",
    model: "Model withheld",
    use: "Images, screenshots, diagrams. Eyes on the problem.",
  },
  {
    id: "03B",
    name: "ADVERSARIAL",
    model: "Model withheld",
    use: "Stress-test the answer. Argue with it until it holds.",
  },
  {
    id: "04A",
    name: "SYNTHESIS",
    model: "Model withheld",
    use: "Pull threads into one brief a human can actually use.",
  },
  { id: "04B", name: "RESEARCH", model: "Model withheld", use: "Ground it. Cite it. Do not invent a source." },
  {
    id: "05",
    name: "ADJUDICATION",
    model: "Model withheld",
    use: "Highest-consequence calls. Frontier only when the cost of being wrong is higher than the token bill.",
  },
  {
    id: "LOC",
    name: "LOCAL FALLBACK",
    model: "Model withheld",
    use: "The lights stay on when the cloud does not. Owned local fallback keeps the route available.",
  },
  {
    id: "FAB",
    name: "GATEWAY FABRIC",
    model: "Model withheld",
    use: "One door. No lock-in. No bridge tax.",
  },
] as const;

export const ROUTING_STAGES = [
  ["01", "INTENT", "What the work is actually asking for."],
  ["02", "POLICY", "Quality picks the model. Cost only breaks a tie."],
  ["03", "QUALIFY", "Does this lane earn the call, or does it stay cheap?"],
  ["04", "OBSERVE", "Watch the result. Escalate only when uncertainty justifies it."],
  ["05", "TRANSLATE", "Hand a human a brief they can act on."],
] as const;

export const NAMED_ROLES = [
  { name: "DNS SERVICE", role: "PRIMARY · RESOLUTION" },
  { name: "DNS SERVICE", role: "SECONDARY · FAILOVER" },
  { name: "SECURITY MONITOR", role: "SECURITY MONITORING" },
  { name: "MONITORING STACK", role: "OBSERVED ROLE FAMILY" },
  { name: "AUTOMATION SERVICE", role: "AUTOMATION" },
  { name: "BACKUP SERVICE", role: "BACKUP SERVICE" },
  { name: "MEDIA SERVICES", role: "OBSERVED ROLE FAMILY" },
];

export const SERVICE_FAMILIES =
  "Observed role families at the 28 August 2026 probe: name resolution, security monitoring, automation, backup and media. Private service names and locations are withheld.";

export const HOSTS = [
  {
    name: "ZEUS",
    tag: "DATED HOST",
    blurb: "Present at the 28 August probe. Per host count withheld.",
  },
  {
    name: "APOLLO",
    tag: "DATED HOST",
    blurb: "Present at the 28 August probe. Per host count withheld.",
  },
] as const;

export const ARTICLES = [
  {
    name: "HERMES ORCHESTRATOR",
    tag: "GATEWAY",
    note: "A policy-driven orchestration layer in front of the model lanes, with health checks, routing rules, verification, and human escalation boundaries. Intent, qualification, execution, observation, and translation stay separate so an expensive model is a decision, not a default.",
  },
  {
    name: "ESCALATION CASCADE",
    tag: "BOUNDED AUTONOMY",
    note: "A staged exception workflow that begins with inexpensive checks and escalates only when severity or uncertainty justifies it. Every handoff leaves evidence for review; autonomy can proceed while authority stays bounded.",
  },
  {
    name: "EXPOSURE ASSESSMENT",
    tag: "SECURITY",
    note: "OSINT and cloud exposure folded into a single remediation picture instead of five disconnected reports. Findings resolve into reachability, evidence, ownership, and the next action: the shape of an attack path, not a pile of alerts.",
  },
  {
    name: "SOVEREIGN INTELLIGENCE BRIEFING",
    tag: "ANALYSIS",
    note: "Executive-facing analysis of AI, security, and infrastructure, produced on the same fabric it describes. Claims stay tied to sources, uncertainty stays visible, and technical consequence becomes a decision a leader can act on.",
  },
  {
    name: "ZEUSAPOLLO DASHBOARD SUITE",
    tag: "OPERATIONS",
    note: "Operations dashboards for fleet health, routing, and service status across the estate. Provenance, timestamps, refresh behavior, and visible stale states matter more than a green tile that only looks current.",
  },
  {
    name: "THE SHOP FLOOR SIGNAL",
    tag: "INDUSTRIAL",
    note: "Operations intelligence for industrial teams, the same routing discipline pointed at a plant floor. Signals are qualified, exceptions escalate, and the person accountable for the line keeps command of the response.",
  },
  {
    name: "GRAPHIFY",
    tag: "TOOLING",
    note: "A navigable code graph with community-driven documentation. Ownership, coupling, and change paths become visible before a refactor turns into an outage.",
  },
];

export const POS: [number, number][] = [
  [52, 42],
  [80, 20],
  [41, 24],
  [66, 60],
  [28, 64],
  [50, 80],
  [19, 45],
];

export const LAWS = [
  "Sovereign by default: owned hardware, owned data, no bridge tax.",
  "Quality picks the model. Cost only breaks a tie.",
  "A figure with no fresh measurement is omitted, never published stale.",
  "Autonomy runs on a leash held by a human who is accountable for it.",
];

export function daysLeft(now = Date.now()) {
  const d = Math.ceil((new Date(EXPIRES_AT).getTime() - now) / 86400000);
  return d;
}

export function exportState(now = Date.now()) {
  return daysLeft(now) > 0 ? "VALID" : "EXPIRED";
}

export function validityShort(now = Date.now()) {
  const d = daysLeft(now);
  return d > 0 ? `EXPORT VALID · ${d}D LEFT` : "EXPORT EXPIRED";
}

export function nextValidityRefreshAt(now = Date.now()) {
  const expiry = new Date(EXPIRES_AT).getTime();
  if (now >= expiry) return null;
  return expiry - Math.max(0, daysLeft(now) - 1) * 86400000;
}

export const INITIAL_VALIDITY_LABEL = "EXPORT STATUS · DATED";

export function stardate(now = new Date()) {
  const y = now.getUTCFullYear();
  const start = Date.UTC(y, 0, 1);
  const day = (now.getTime() - start) / 86400000;
  const frac = (now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds()) / 86400;
  return `${y}${String(Math.floor(day + 1)).padStart(3, "0")}.${String(Math.floor(frac * 10))}`;
}
