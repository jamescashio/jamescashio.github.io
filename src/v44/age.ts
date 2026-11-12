/**
 * How long ago the record was observed, in plain words beside its date. The date is printed when the
 * site is built; only a visitor's own clock knows how old it has become, so the page says so itself.
 */
import { $$ } from "./dom.ts";

/** "today", "yesterday" or "6 days ago" for a YYYY-MM-DD day; null for anything else, or a day still ahead. */
export function ageInWords(isoDay: string, now = new Date()): string | null {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDay);
  if (!parts) return null;
  const [year, month, day] = parts.slice(1).map(Number);
  const then = Date.UTC(year, month - 1, day);
  // A calendar day that does not exist (month 13, day 40) rolls over to another date; refuse it.
  if (new Date(then).toISOString().slice(0, 10) !== isoDay) return null;
  // The visitor's own calendar day, so "today" turns over at their midnight.
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today - then) / 86_400_000);
  if (days < 0) return null;
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export function mountAge() {
  for (const el of $$("[data-age]")) {
    const words = ageInWords(el.dataset.age ?? "");
    if (!words) continue;
    el.textContent = words;
    el.hidden = false;
  }
}
