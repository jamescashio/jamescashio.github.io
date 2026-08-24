import { formatDeckHash } from "./deck-navigation.ts";

export const BLACK_BOX_RECEIPT_CLAIMS = [
  "08-21-2026 · 19/19 PUBLISHED CONTAINERS RUNNING AT PROBE",
  "08-21-2026 · 2 PROXMOX HOSTS QUORATE",
  "08-21-2026 · 10 PUBLIC LANES · 36 PRIVATE CATALOG",
] as const;

type CanonicalLocation = Pick<Location, "origin" | "pathname" | "search">;

export function canonicalReceiptUrl(location: CanonicalLocation) {
  return `${location.origin}${location.pathname}${location.search}${formatDeckHash({ deck: 8, article: 0 })}`;
}
