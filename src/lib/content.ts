export const VERIFIED = "08-21-2026";
export const VERIFIED_LONG = "21 August 2026";
export const EXPIRES = "2026-09-20";
export const EXPIRES_SHORT = "09-20-2026";
export const REVISED = "08-21-2026";
export const RELEASE = 'V47 "AWE"';
export const PVE = "9.2.11";

export const BOOT = [
  "E.V.E. EVALUATION VERIFICATION ENGINE — ONLINE",
  "PROXMOX QUORUM ZEUS · APOLLO — QUORATE",
  "19 OF 19 PUBLISHED CONTAINERS — RUNNING AT PROBE",
  "ATLAS GATEWAY — 10 PUBLIC LANES · 36 PRIVATE CATALOG",
  `EXPORT CURRENT · PUBLIC SNAPSHOT VERIFIED ${VERIFIED_LONG}`,
];

export const DECKS = [
  { id: "snapshot", num: "01", name: "SNAPSHOT", tag: "Dated figures only. No fresh measurement, no number on the page." },
  { id: "grid", num: "02", name: "THE GRID", tag: "Nineteen roles. Seven named. Twelve withheld on purpose." },
  { id: "routing", num: "03", name: "ROUTING", tag: "Quality picks the model. Cost only breaks a tie." },
  { id: "iron", num: "04", name: "THE IRON", tag: "Hardware in a room I can walk into." },
  { id: "lineage", num: "05", name: "LINEAGE", tag: "Four pilots. Four rules. One program." },
  { id: "builds", num: "06", name: "BUILDS", tag: "Seven systems that shipped on one fabric." },
  { id: "operator", num: "07", name: "OPERATOR", tag: "One human, accountable for every automation." },
  { id: "eve", num: "08", name: "E.V.E.", tag: "Read-only. Browser-local. Zero network calls." },
  { id: "contact", num: "09", name: "CONTACT", tag: "Hail: doug@cashio.us" },
] as const;

export const TELEMETRY = [
  "ZEUS · 13 RUNNING WORKLOADS · QUORATE",
  "APOLLO · 6 RUNNING WORKLOADS · QUORATE",
  "ATLAS · GATEWAY · LOCAL INFERENCE",
  "ATHENA · QUORUM SUPPORT",
  "GENESIS · PRIVATE STORAGE · RECOVERY",
  "19/19 CONTAINERS RUNNING AT PROBE",
  "10 PUBLIC LANES · 36 PRIVATE CATALOG",
  "LAW · QUALITY PICKS THE MODEL",
  "EXPORT CURRENT · PUBLIC-SAFE SNAPSHOT",
  `VERIFIED ${VERIFIED_LONG} · VALID THRU ${EXPIRES_SHORT}`,
];

export const DECK_CRAFT = [0, 1, 2, 3, 4, 4, 5, 5, 6];
export const CRAFT_DECK = [0, 1, 2, 3, 4, 6, 8];
export const PILOT_CRAFT = [0, 1, 2, 3];

export const CRAFT = [
  ["BELL X-1", "1947", "Yeager takes it past Mach 1 and writes down exactly where the edge was."],
  ["SR-71 BLACKBIRD", "1964", "Kelly Johnson's answer: few parts, small team, absurd speed."],
  ["FALCON 9", "2010", "The booster comes home. Reuse rewrites the economics of orbit."],
  ["STARSHIP", "2023", "Fully reusable, or it does not count. Scale as a design goal."],
  ["EPSTEIN DRIVE", "THE EXPANSE", "A fusion torch that never quits — and the whole system opens up."],
  ["PHOENIX", "2063 · COCHRANE", "A missile that learned to bend space. Two nacelles, one field — distance stops being the limit."],
  ["HEIGHLINER", "DUNE", "Fold space. Arrive without travelling. The destination comes to you."],
] as const;

export const LANES = [
  { id: "00", name: "FREE CLASSIFY", model: "Kimi K3", tid: "", use: "Sort the mail. Tag the ticket. Cheap, fast, good enough." },
  { id: "01", name: "WORKHORSE", model: "DeepSeek V4 Flash", tid: "deepseek-v4-flash", use: "The daily grind. Drafts, refactors, first-pass analysis." },
  { id: "02", name: "EXCEPTION", model: "DeepSeek V4 Pro", tid: "deepseek-v4-pro", use: "When the workhorse hesitates. Harder reasoning, still owned-cost." },
  { id: "03A", name: "MULTIMODAL", model: "Gemini 3.7 Flash", tid: "", use: "Images, screenshots, diagrams. Eyes on the problem." },
  { id: "03B", name: "ADVERSARIAL", model: "Grok 4.6", tid: "", use: "Stress-test the answer. Argue with it until it holds." },
  { id: "04A", name: "SYNTHESIS", model: "Sol 5.6 Luna", tid: "", use: "Pull threads into one brief a human can actually use." },
  { id: "04B", name: "RESEARCH", model: "Sonar Pro", tid: "", use: "Ground it. Cite it. Do not invent a source." },
  { id: "05", name: "ADJUDICATION", model: "GPT-5.6 Sol", tid: "", use: "Highest-consequence calls. Frontier only when the cost of being wrong is higher than the token bill." },
  { id: "LOC", name: "LOCAL FALLBACK", model: "Gemma 4 26B", tid: "", use: "The lights stay on when the cloud does not. Atlas, in the room." },
  { id: "FAB", name: "GATEWAY FABRIC", model: "Atlas LiteLLM · OpenRouter · ZenMux", tid: "", use: "One door. No lock-in. No bridge tax." },
] as const;

export const ROUTING_STAGES = [
  ["01", "INTENT", "What the work is actually asking for."],
  ["02", "POLICY", "Quality picks the model. Cost only breaks a tie."],
  ["03", "QUALIFY", "Does this lane earn the call, or does it stay cheap?"],
  ["04", "OBSERVE", "Watch the result. Escalate only when uncertainty justifies it."],
  ["05", "TRANSLATE", "Hand a human a brief they can act on."],
] as const;

export const NAMED_ROLES = [
  { name: "TECHNITIUM DNS", role: "PRIMARY · RESOLUTION", hub: "zeus" as const },
  { name: "TECHNITIUM DNS", role: "SECONDARY · FAILOVER", hub: "zeus" as const },
  { name: "WAZUH", role: "SECURITY MONITORING", hub: "zeus" as const },
  { name: "PROMETHEUS", role: "METRICS · ZEUS AND APOLLO", hub: "zeus" as const },
  { name: "N8N", role: "AUTOMATION", hub: "apollo" as const },
  { name: "PBS", role: "BACKUP SERVICE", hub: "zeus" as const },
  { name: "MEDIA SERVICES", role: "SABNZBD · RADARR · SONARR", hub: "apollo" as const },
];

export const SERVICE_FAMILIES =
  "Current service families verified 21 August 2026: Atlas gateway, Technitium DNS primary and secondary, Wazuh security monitoring, Prometheus monitoring, n8n automation, PostgreSQL state services, PBS backups, SABnzbd, Radarr, and Sonarr. All nineteen published container workloads were running during the verification probe.";

export const WITHHELD = [
  "AI operating cost per day and month",
  "Automation job counts",
  "DNS query sample figures",
  "Backup recovery telemetry",
  "Security update counts",
];

export const HOSTS = [
  {
    name: "ZEUS",
    tag: "QUORATE",
    blurb:
      "Primary compute host running thirteen containers. Ryzen 7 5800H platform, sixteen logical CPU threads, 28 GiB RAM.",
  },
  {
    name: "APOLLO",
    tag: "QUORATE",
    blurb:
      "Storage and services host running six containers. Intel i7-7700T platform, eight logical CPU threads, 15 GiB RAM.",
  },
  {
    name: "ATLAS",
    tag: "OUTSIDE COUNT",
    blurb:
      "Atlas is the external gateway and local inference host that exposes the private model catalog to the rest of the system. Not a Proxmox host.",
  },
  {
    name: "ATHENA",
    tag: "EDGE",
    blurb: "Quorum support. Physical edge node that keeps the two Proxmox hosts quorate. Outside the container count.",
  },
  {
    name: "GENESIS",
    tag: "PRIVATE",
    blurb: "Private storage and recovery. Outside the container count. Implementation detail withheld.",
  },
] as const;

export const LINEAGE = [
  {
    craft: "X-1 · 1947",
    name: "YEAGER",
    rule: "Fly it to the edge, then write down exactly where the edge was.",
    note: "Every figure on this site is that written-down edge, with a date on it. No telemetry theater. No live-looking numbers that went stale last Tuesday.",
  },
  {
    craft: "SKUNK WORKS · U-2 · SR-71",
    name: "K. JOHNSON",
    rule: "Small team, few parts, short runway.",
    note: "Complexity is a schedule risk — which is why ten public lanes do the work of a private catalog of thirty-six.",
  },
  {
    craft: "VOYAGER · SPACESHIPONE",
    name: "RUTAN",
    rule: "Build it yourself, then fly it yourself.",
    note: "Sovereign means the hardware, the routing, and the accountability are all mine. No vendor holds the keys to the house.",
  },
  {
    craft: "ENERGY MANAGEMENT",
    name: "HOOVER",
    rule: "Precision is a habit, not a stunt.",
    note: "The unglamorous parts — backups, DNS, monitoring — get flown as carefully as the demo. That is the whole trick.",
  },
];

export const ARTICLES = [
  {
    name: "HERMES ORCHESTRATOR",
    tag: "GATEWAY",
    note: "A policy driven orchestration layer in front of the model lanes, with health checks, routing rules, verification, and human escalation boundaries.",
  },
  {
    name: "ESCALATION CASCADE",
    tag: "AUTONOMOUS",
    note: "A staged exception workflow that begins with inexpensive checks and escalates only when severity or uncertainty justifies it.",
  },
  {
    name: "EXPOSURE ASSESSMENT",
    tag: "SECURITY",
    note: "OSINT and cloud exposure folded into a single remediation picture instead of five disconnected reports.",
  },
  {
    name: "SOVEREIGN INTELLIGENCE BRIEFING",
    tag: "ANALYSIS",
    note: "Executive-facing analysis of AI, security and infrastructure, produced on the same fabric it describes.",
  },
  {
    name: "ZEUSAPOLLO DASHBOARD SUITE",
    tag: "OPERATIONS",
    note: "Operations dashboards for fleet health, routing and service status across the estate.",
  },
  {
    name: "THE SHOP FLOOR SIGNAL",
    tag: "INDUSTRIAL",
    note: "Operations intelligence for industrial teams — the same routing discipline pointed at a plant floor.",
  },
  {
    name: "GRAPHIFY",
    tag: "TOOLING",
    note: "A navigable code graph with community-driven documentation.",
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
  const d = Math.ceil((new Date(EXPIRES + "T00:00:00Z").getTime() - now) / 86400000);
  return d;
}

export function exportState(now = Date.now()) {
  return daysLeft(now) > 0 ? "CURRENT" : "EXPIRED";
}

export function validityShort(now = Date.now()) {
  const d = daysLeft(now);
  return d > 0 ? `CURRENT · ${d}D LEFT` : "EXPIRED";
}

export function stardate(now = new Date()) {
  const y = now.getUTCFullYear();
  const start = Date.UTC(y, 0, 1);
  const day = (now.getTime() - start) / 86400000;
  const frac = (now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds()) / 86400;
  return `${y}${String(Math.floor(day + 1)).padStart(3, "0")}.${String(Math.floor(frac * 10))}`;
}
