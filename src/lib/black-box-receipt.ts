import { formatDeckHash } from "./deck-navigation.ts";

export const BLACK_BOX_RECEIPT_CLAIMS = [
  "08-31-2026 · 18/19 DOCUMENTED GUESTS RUNNING AT PROBE",
  "08-31-2026 · 2 PROXMOX HOSTS QUORATE",
  "08-21-2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG",
] as const;

/** Superseded decks stay reachable. Archive markers carry their own context, so
 * a log entry names the release and where it is preserved — never a figure. */
export const SHIPS_LOG = [
  { name: "V36 · GREEN BOARD", note: "THIS DECK", href: null },
  { name: "V31 · THE GRID", note: "ARCHIVE MARKER", href: "/grid.html" },
  { name: "V44 · AURORA", note: "PROTOTYPE MARKER", href: "/index-v44.html" },
  { name: "V21.2A · COMMAND", note: "MAY 2026 ARCHIVE", href: "/command.html" },
] as const;

type CanonicalLocation = Pick<Location, "origin" | "pathname" | "search">;

export function canonicalReceiptUrl(location: CanonicalLocation) {
  return `${location.origin}${location.pathname}${location.search}${formatDeckHash({ deck: 8, article: 0 })}`;
}
