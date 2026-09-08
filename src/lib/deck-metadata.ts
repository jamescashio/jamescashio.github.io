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

export const DECK_SHORT: Record<(typeof DECKS)[number]["id"], string> = {
  snapshot: "SNAP",
  grid: "GRID",
  routing: "ROUTE",
  iron: "IRON",
  lineage: "LINE",
  builds: "BUILD",
  operator: "OPS",
  eve: "EVE",
  contact: "HAIL",
};

export type DeckId = (typeof DECKS)[number]["id"];
