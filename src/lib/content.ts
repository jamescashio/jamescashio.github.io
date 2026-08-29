export const VERIFIED = "08-28-2026";
export const VERIFIED_LONG = "28 August 2026";
export const ROUTING_VERIFIED_LONG = "21 August 2026";
export const EXPIRES = "2026-09-27";
export const EXPIRES_SHORT = "09-27-2026";
export const EXPIRES_AT = "2026-09-28T05:00:00Z";
export const REVISED = "08-28-2026";
export const RELEASE = 'V34 "MACH ONE"';
export const PVE = "9.2.11";

export const BOOT = [
  "E.V.E. EVALUATION VERIFICATION ENGINE — ONLINE",
  "PROXMOX QUORUM ZEUS · APOLLO — QUORATE",
  "18/19 AT 28 AUG PROBE · ZEUS 12/13 · APOLLO 6/6",
  "ROUTING INVENTORY 21 AUGUST 2026 — 10 PUBLIC LANES · 36 PRIVATE CATALOG",
  `DATED EXPORT · PUBLIC-SAFE · VERIFIED ${VERIFIED_LONG}`,
];

export const DECKS = [
  {
    id: "snapshot",
    num: "01",
    name: "SNAPSHOT",
    tag: "Dated figures only. No fresh measurement, no number on the page.",
  },
  { id: "grid", num: "02", name: "THE GRID", tag: "Nineteen roles. Seven named. Twelve withheld on purpose." },
  { id: "routing", num: "03", name: "ROUTING", tag: "Quality picks the model. Cost only breaks a tie." },
  { id: "iron", num: "04", name: "THE IRON", tag: "Hardware in a room I can walk into." },
  { id: "lineage", num: "05", name: "LINEAGE", tag: "Four flight-test minds. Four rules. One program." },
  { id: "builds", num: "06", name: "BUILDS", tag: "Seven systems that shipped on one fabric." },
  { id: "operator", num: "07", name: "OPERATOR", tag: "One human, accountable for every automation." },
  { id: "eve", num: "08", name: "E.V.E.", tag: "Read-only. Browser-local. Zero network calls." },
  { id: "contact", num: "09", name: "CONTACT", tag: "Hail: doug@cashio.us" },
] as const;

export const TELEMETRY = [
  "ZEUS · 12/13 RUNNING AT 28 AUG PROBE · QUORATE",
  "APOLLO · 6/6 AT 28 AUG PROBE · QUORATE",
  "ATLAS · GATEWAY · LOCAL INFERENCE",
  "ATHENA · QUORUM SUPPORT",
  "GENESIS · PRIVATE STORAGE · RECOVERY",
  "18/19 AT 28 AUG PROBE",
  "ROUTING INVENTORY 21 AUGUST 2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG",
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
  ["EPSTEIN DRIVE", "THE EXPANSE", "A fusion torch that never quits — and the whole system opens up."],
  [
    "PHOENIX",
    "2063 · COCHRANE",
    "A missile that learned to bend space. Two nacelles, one field — distance stops being the limit.",
  ],
  ["HEIGHLINER", "DUNE", "Fold space. Arrive without travelling. The destination comes to you."],
  ["P-51D MUSTANG", "1944 · HOOVER", "Energy is never free. Spend it deliberately, and always leave yourself an out."],
] as const;

export const LANES = [
  {
    id: "00",
    name: "FREE CLASSIFY",
    model: "Kimi K3",
    tid: "",
    use: "Sort the mail. Tag the ticket. Cheap, fast, good enough.",
  },
  {
    id: "01",
    name: "WORKHORSE",
    model: "DeepSeek V4 Flash",
    tid: "deepseek-v4-flash",
    use: "The daily grind. Drafts, refactors, first-pass analysis.",
  },
  {
    id: "02",
    name: "EXCEPTION",
    model: "DeepSeek V4 Pro",
    tid: "deepseek-v4-pro",
    use: "When the workhorse hesitates. Harder reasoning, still owned-cost.",
  },
  {
    id: "03A",
    name: "MULTIMODAL",
    model: "Gemini 3.7 Flash",
    tid: "",
    use: "Images, screenshots, diagrams. Eyes on the problem.",
  },
  {
    id: "03B",
    name: "ADVERSARIAL",
    model: "Grok 4.6",
    tid: "",
    use: "Stress-test the answer. Argue with it until it holds.",
  },
  {
    id: "04A",
    name: "SYNTHESIS",
    model: "Sol 5.6 Luna",
    tid: "",
    use: "Pull threads into one brief a human can actually use.",
  },
  { id: "04B", name: "RESEARCH", model: "Sonar Pro", tid: "", use: "Ground it. Cite it. Do not invent a source." },
  {
    id: "05",
    name: "ADJUDICATION",
    model: "GPT-5.6 Sol",
    tid: "",
    use: "Highest-consequence calls. Frontier only when the cost of being wrong is higher than the token bill.",
  },
  {
    id: "LOC",
    name: "LOCAL FALLBACK",
    model: "Gemma 4 26B",
    tid: "",
    use: "The lights stay on when the cloud does not. Atlas, in the room.",
  },
  {
    id: "FAB",
    name: "GATEWAY FABRIC",
    model: "Atlas LiteLLM · OpenRouter · ZenMux",
    tid: "",
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
  { name: "TECHNITIUM DNS", role: "PRIMARY · RESOLUTION", hub: "zeus" as const },
  { name: "TECHNITIUM DNS", role: "SECONDARY · FAILOVER", hub: "zeus" as const },
  { name: "WAZUH", role: "SECURITY MONITORING", hub: "zeus" as const },
  { name: "MONITORING STACK", role: "OBSERVED ROLE FAMILY", hub: "zeus" as const },
  { name: "N8N", role: "AUTOMATION", hub: "apollo" as const },
  { name: "PBS", role: "BACKUP SERVICE", hub: "zeus" as const },
  { name: "MEDIA SERVICES", role: "OBSERVED ROLE FAMILY", hub: "apollo" as const },
];

export const SERVICE_FAMILIES =
  "Observed public-safe role families at the 28 August 2026 probe: Technitium DNS primary, Technitium DNS secondary, Wazuh, monitoring stack, n8n, PBS, and media services. The stopped guest remains unnamed.";

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
    blurb: "Primary compute host. 12 of 13 documented guests were running at the dated probe.",
  },
  {
    name: "APOLLO",
    tag: "QUORATE",
    blurb: "Services host. All 6 documented guests were running at the dated probe.",
  },
  {
    name: "ATLAS",
    tag: "ROUTING",
    blurb: "Gateway and local inference are separate from the Proxmox host count.",
  },
  {
    name: "ATHENA",
    tag: "QUORUM",
    blurb: "Quorum support remains outside the documented guest count.",
  },
  {
    name: "GENESIS",
    tag: "WITHHELD",
    blurb: "Recovery infrastructure is deliberately withheld from the dated export.",
  },
] as const;

export const LINEAGE = [
  {
    craft: "X-1 · 1947",
    name: "YEAGER",
    rule: "Fly it to the edge, then write down exactly where the edge was.",
    note: "The X-1 turned an invisible barrier into measured flight data. Yeager's rule is controlled expansion of the envelope, followed by an exact record of where the edge moved. Every public figure here carries that same obligation: evidence, boundary, date.",
  },
  {
    craft: "SKUNK WORKS · SR-71 · 1964",
    name: "K. JOHNSON",
    rule: "Small team, few parts, short runway.",
    note: "Kelly Johnson's team made sustained Mach 3 flight practical through small teams, direct authority, and ruthless control of complexity. Doug Cashio applies the same discipline: shorten the path between the person who sees the problem and the person who can change the machine.",
  },
  {
    craft: "PROTEUS · 1998",
    name: "RUTAN",
    rule: "Question the shape. Prove the answer in flight.",
    note: "Proteus made unconventional geometry practical by keeping structure, payload, and flight test in the same learning loop. Doug Cashio follows that discipline: own the hardware, instrument the route, and let evidence — not familiarity — choose the design.",
  },
  {
    craft: "P-51D · ENERGY MANAGEMENT",
    name: "HOOVER",
    rule: "Precision is a habit, not a stunt.",
    note: "Hoover made energy management visible in the P-51D: every input deliberate, every knot accounted for. Doug Cashio follows the same rule in systems work. Backups, DNS, monitoring, and recovery are practiced with the same precision as the demonstration.",
  },
];

export const LINEAGE_EVIDENCE = [
  {
    src: "/plates/x1-nasa.webp?v=32",
    alt: "Bell X-1 Glamorous Glennis in flight, its bright orange fuselage and shock pattern visible against the dark sky",
    label: "FLIGHT-TEST EVIDENCE · X-1 #46-062",
    credit: "NASA / USAF · LT. ROBERT A. HOOVER",
    sourceUrl: "https://www.nasa.gov/image-article/x-1-shock-wave-pattern-visible-exhaust-plume/",
    dataUrl: "https://www.nasa.gov/aeronautics/first-generation-x-1/",
    facts: [
      ["BARRIER FLIGHT", "10-14-1947"],
      ["SPEED", "MACH 1.06"],
      ["ALTITUDE", "43,000 FT"],
      ["POWER", "4-CHAMBER XLR11"],
    ],
  },
  {
    src: "/plates/sr71-nasa.webp?v=32",
    alt: "NASA Lockheed SR-71A Blackbird climbing after takeoff with landing gear still extended",
    label: "FLIGHT-TEST EVIDENCE · SR-71A #844",
    credit: "NASA · JIM ROSS",
    sourceUrl: "https://www.nasa.gov/image-article/sr-71-blackbird-24/",
    dataUrl: "https://www.nasa.gov/image-article/sr-71-3/",
    facts: [
      ["FIRST FLIGHT", "12-22-1964"],
      ["CRUISE", "MACH 3.2"],
      ["ALTITUDE", "85,000 FT"],
      ["POWER", "2 × J58"],
    ],
  },
  {
    src: "/plates/proteus-nasa.webp?v=32",
    alt: "Scaled Composites Proteus in flight, showing its forward canard, gull main wing, twin booms, and two rear-mounted turbofans",
    label: "FLIGHT-TEST EVIDENCE · MODEL 281",
    credit: "NASA / ESPO",
    sourceUrl: "https://espo.nasa.gov/aircraft/Proteus",
    dataUrl: "https://espo.nasa.gov/aircraft/Proteus",
    facts: [
      ["FIRST FLIGHT", "07-26-1998"],
      ["MAIN SPAN", "77.6 FT"],
      ["POWER", "2 × FJ44-2E"],
      ["CONFIGURATIONS", "35+"],
    ],
  },
  {
    src: "/plates/p51d-usaf.webp?v=32",
    alt: "A polished P-51D Mustang banking in flight, showing its laminar-flow wing and red tail",
    label: "FLIGHT DISCIPLINE · P-51D MUSTANG",
    credit: "USAF / AIR NATIONAL GUARD · TSGT HAMPTON STRAMLER",
    sourceUrl: "https://www.dvidshub.net/image/9595085/p-51-mustang-over-luke-air-force-base",
    dataUrl:
      "https://www.nationalmuseum.af.mil/Visit/Museum-Exhibits/Fact-Sheets/Display/Article/196263/north-american-p-51d-mustang/",
    facts: [
      ["MAX SPEED", "437 MPH"],
      ["RANGE", "1,000 MI"],
      ["CEILING", "41,900 FT"],
      ["POWER", "1,695 HP MERLIN"],
    ],
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
    note: "OSINT and cloud exposure folded into a single remediation picture instead of five disconnected reports. Findings resolve into reachability, evidence, ownership, and the next action — the shape of an attack path, not a pile of alerts.",
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
    note: "Operations intelligence for industrial teams — the same routing discipline pointed at a plant floor. Signals are qualified, exceptions escalate, and the person accountable for the line keeps command of the response.",
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

export function stardate(now = new Date()) {
  const y = now.getUTCFullYear();
  const start = Date.UTC(y, 0, 1);
  const day = (now.getTime() - start) / 86400000;
  const frac = (now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds()) / 86400;
  return `${y}${String(Math.floor(day + 1)).padStart(3, "0")}.${String(Math.floor(frac * 10))}`;
}
