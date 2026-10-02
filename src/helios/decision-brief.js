export const BRIEF_NEXT = "Verify the evidence needed for the proposed action before expanding automation.";

/** A portable artifact uses the same published records as the visible workbench. */
export function briefRecords(fleet, chosen) {
  const records = {
    fleet: {
      title: "The observation",
      body: `${fleet.lxc} containers and ${fleet.qemu} virtual machine were running at the ${fleet.observedLong} observation. Guest runtime alone does not establish service health or recovery.`,
      source: `Dated export · ${fleet.observedLong}`,
      href: "https://cashio.us/evidence/status.json",
    },
    routing: {
      title: "The unknown",
      body: "Current routing counts and end to end route execution remain unverified. An older inventory cannot establish the present state.",
      source: "Latest public evidence · routing withheld",
      href: "https://cashio.us/#evidence",
    },
    authority: {
      title: "The boundary",
      body: "Consequential decisions remain with an accountable person. The example does not authorize changes to a real system.",
      source: "Published operating philosophy",
      href: "https://cashio.us/#principles",
    },
  };
  return Object.keys(records)
    .filter((id) => chosen.includes(id))
    .map((id) => records[id]);
}

export function briefText(fleet, chosen) {
  const records = briefRecords(fleet, chosen);
  if (!records.length) return null;
  return (
    [
      "cAshIo / A decision brief",
      "Example assembled from published records. Not a live system check or permission to act.",
      ...records.map(
        (record) => `${record.title.toUpperCase()}\n${record.body}\nSource: ${record.source}\n${record.href}`,
      ),
      `NEXT DECISION\n${BRIEF_NEXT}`,
      "Make your own: https://cashio.us/#build=briefing",
    ].join("\n\n") + "\n"
  );
}
