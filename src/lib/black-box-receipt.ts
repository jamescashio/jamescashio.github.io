import { formatDeckHash } from "./deck-navigation.ts";

export const BLACK_BOX_RECEIPT_CLAIMS = [
  "09-02-2026 · 19/19 DOCUMENTED GUESTS RUNNING AT PROBE",
  "09-02-2026 · 2 PROXMOX HOSTS QUORATE",
  "09-02-2026 · 10 PUBLIC LANES · 22 PRIVATE CATALOG",
] as const;

type CanonicalLocation = Pick<Location, "origin" | "pathname" | "search">;

export function canonicalReceiptUrl(location: CanonicalLocation) {
  return `${location.origin}${location.pathname}${location.search}${formatDeckHash({ deck: 8, article: 0 })}`;
}
