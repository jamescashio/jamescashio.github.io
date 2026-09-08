import { DECKS, type DeckId } from "../lib/deck-metadata";
import { runCommonEve, type EveReply } from "../lib/eve-common";
import { evidenceCommand } from "./fleet-evidence";

export interface EveDestination {
  href: string;
  label: string;
}

interface PublicEveResult extends EveReply {
  destination?: EveDestination;
}

// The current homepage has sections and studies, not the historical deck order.
const DESTINATIONS = {
  snapshot: { href: "#evidence", label: "Read the dated evidence" },
  grid: { href: "#universe", label: "Explore the ZeusApollo universe" },
  routing: { href: "#build=hermes", label: "Try the HERMES routing study" },
  iron: { href: "#universe", label: "Explore the ZeusApollo universe" },
  lineage: { href: "#lineage", label: "Explore Flight heritage" },
  builds: { href: "#work", label: "Explore Selected work" },
  operator: { href: "#operator", label: "Meet the operator" },
  eve: { href: "#evidence", label: "Read the dated evidence" },
  contact: { href: "#contact", label: "Open the contact section" },
} satisfies Record<DeckId, EveDestination>;

/** Pure local replies: the latest observation is never filled from the historical deck. */
export function runPublicEve(raw: string, history: string[] = []): PublicEveResult {
  const command = raw.trim().toLowerCase().replace(/\s+/g, " ");
  const observation = evidenceCommand(command);
  if (observation) return { out: observation };
  if (command === "bit") {
    return {
      out: ["YES. A HUMAN IS STILL IN COMMAND.", "I’m the faceted core in the orbital artwork. Try engage."],
    };
  }
  if (command === "rutan") {
    return {
      out: ["IF IT LOOKS WRONG AND IT FLIES RIGHT, IT IS RIGHT.", "PROTEUS IS IN FLIGHT HERITAGE."],
      destination: DESTINATIONS.lineage,
    };
  }
  const common = runCommonEve(command, history);
  if (common) {
    const { contact, ...reply } = common;
    return contact ? { ...reply, destination: DESTINATIONS.contact } : reply;
  }
  const deck = DECKS.find(
    (item) => command === item.id || command === item.name.toLowerCase() || command === `deck ${item.num}`,
  );
  if (deck) {
    const destination = DESTINATIONS[deck.id];
    return {
      out: [
        destination.label,
        ...(deck.id === "routing" ? ["BROWSER-ONLY ILLUSTRATION · NO LIVE ROUTING OR AI REQUEST"] : []),
      ],
      destination,
    };
  }
  return { out: [`UNKNOWN COMMAND · ${command.toUpperCase()}`, "TYPE HELP FOR THE LOCAL COMMAND LIST"], bad: true };
}
