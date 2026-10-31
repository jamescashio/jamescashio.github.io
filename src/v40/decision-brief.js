import { fleetSummary, observedDate } from "./evidence.js";

// The preview, editable starting point and download share one dated example.
export const exampleBrief = {
  observed: fleetSummary + ".",
  source: "Published observation · " + observedDate + " · https://cashio.us/status.json",
  unknown: "Full system recovery and current AI routing were not tested.",
  owner: "The human operator. Verify the missing evidence before approving a change.",
};

export const exampleBriefText = `DECISION BRIEF / cAshIo V41
Example from the published record. Not a new check or permission to act.

WHAT WAS OBSERVED
${exampleBrief.observed}

SOURCE AND DATE
${exampleBrief.source}

WHAT REMAINS UNKNOWN
${exampleBrief.unknown}

WHO DECIDES
${exampleBrief.owner}

Make your own: https://cashio.us/#experiment=briefing
`;
