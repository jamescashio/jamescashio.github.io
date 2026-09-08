import snapshot from "../../public/status.json";

/** The rendered page and downloadable export share the same dated observation. */
export const FLEET_EVIDENCE = snapshot;

export const BRIEF_FACTS = [
  {
    id: "fleet",
    label: "Fleet evidence",
    fact: `${snapshot.containers.running} LXC containers and ${snapshot.virtualMachines.running} QEMU virtual machine were running at the ${snapshot.verifiedLong} observation.`,
    consequence: "The inventory is dated; running guests alone do not establish service health or recovery readiness.",
    source: `Fleet observation · ${snapshot.verifiedLong} · /status.json`,
  },
  {
    id: "routing",
    label: "Routing evidence",
    fact: "The latest audit did not establish a current routing inventory or an end-to-end execution record.",
    consequence: "Current lane counts remain unverified. A past inventory cannot fill that gap.",
    source: `Audit scope · ${snapshot.verifiedLong} · /status.json`,
  },
  {
    id: "authority",
    label: "Human authority",
    fact: "The published operating model keeps consequential decisions with an accountable human.",
    consequence: "Any expansion of automation should preserve that decision boundary.",
    source: "Published operating philosophy",
  },
] as const;

export function evidenceCount(value: unknown): string {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? String(value) : "Not verified";
}

export function fleetEvidenceLines() {
  const evidence = FLEET_EVIDENCE;
  return [
    `FLEET OBSERVATION · ${evidence.verifiedLong.toUpperCase()}`,
    `${evidence.containers.running} LXC CONTAINERS · ${evidence.virtualMachines.running} QEMU VIRTUAL MACHINE`,
    `ZEUS · ${evidence.containers.zeus} CONTAINERS · APOLLO · ${evidence.containers.apollo} CONTAINERS`,
    `${evidence.proxmox.hostsOnline} PROXMOX HOSTS · ${evidence.proxmox.version} · QUORUM OBSERVED`,
    "Guest runtime does not establish application health or failover readiness.",
    `Observed: ${evidence.provenance.observedAtUtc}`,
    "DATED EXPORT · NO LIVE SYSTEM ACCESS",
  ];
}

/** Null means unverified, never zero and never an older inventory carried forward. */
export function evidenceCommand(raw: string): string[] | null {
  const command = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (["fleet", "status", "sitrep", "current"].includes(command)) return fleetEvidenceLines();
  if (["routes", "lanes"].includes(command)) {
    return [
      "ROUTING · NOT VERIFIED BY THE LATEST AUDIT",
      `Public lanes: ${evidenceCount(FLEET_EVIDENCE.lanes.public)}`,
      `Private catalog: ${evidenceCount(FLEET_EVIDENCE.lanes.privateCatalog)}`,
      "No current routing inventory or execution record was established.",
      "The HERMES study is a browser-only illustration. No AI request is sent.",
    ];
  }
  if (["verify", "evidence"].includes(command)) {
    return [
      ...fleetEvidenceLines(),
      "SOURCE · OWNER-RUN READ-ONLY HERMES AUDIT",
      "Cluster resource counts were cross-checked with direct guest lists.",
      "Download the observation at /status.json. Routing remains unverified.",
      "The website version identifies the experience; the observation has its own timestamp.",
    ];
  }
  if (command === "archive") {
    return [
      "V35 HISTORICAL ARCHIVE",
      "Fleet: 28 August 2026 · Routing: 21 August 2026",
      "Preserved for comparison; it does not establish the latest inventory.",
      "Read /evidence/status-2026-08-28.json or visit the original command deck.",
    ];
  }
  if (command === "42") {
    return [
      "42. THE QUESTION STILL MATTERS.",
      `THE EVIDENCE IS DATED ${FLEET_EVIDENCE.verifiedLong.toUpperCase()}. TRY VERIFY.`,
    ];
  }
  if (["help", "?"].includes(command)) {
    return [
      "AVAILABLE COMMANDS",
      "fleet · status · routes · verify · archive",
      "builds · lineage · operator · grid · routing",
      "cost · withheld",
      "whoami · talk · photo · history · clear",
      "LOCAL ONLY · NO NETWORK CALLS",
    ];
  }
  return null;
}
