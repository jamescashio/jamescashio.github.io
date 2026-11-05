import { fleetSummary, snapshot } from "./evidence.ts";
import { houseDate } from "../shared/dates.ts";

// The preview, editable starting point and download share one dated example.
export const exampleBrief = {
  observed: fleetSummary + ".",
  source: "Published observation · " + houseDate(snapshot.verified) + " · https://cashio.us/status.json",
  unknown: "Full system recovery and current AI routing were not tested.",
  owner: "The human operator. Verify the missing evidence before approving a change.",
};

export const exampleBriefText = `DECISION BRIEF / cAshIo
Example from the published record. Not a new check or permission to act.

WHAT WAS OBSERVED
${exampleBrief.observed}

SOURCE AND DATE
${exampleBrief.source}

WHAT REMAINS UNKNOWN
${exampleBrief.unknown}

WHO DECIDES
${exampleBrief.owner}

Make your own in the previous edition: https://cashio.us/v43/#experiment=briefing
`;
