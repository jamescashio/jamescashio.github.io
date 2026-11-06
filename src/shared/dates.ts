/** The house date style, "Wed Nov 4, 2026", for an ISO calendar date. Shared by the build, the page and the brief. */
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function houseDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
  if (!match) throw new Error(`not an ISO calendar date: ${iso}`);
  const [y, m, d] = match.slice(1).map(Number);
  const day = new Date(Date.UTC(y, m - 1, d));
  if (day.getUTCFullYear() !== y || day.getUTCMonth() !== m - 1 || day.getUTCDate() !== d)
    throw new Error(`not a calendar date: ${iso}`);
  return `${DAYS[day.getUTCDay()]} ${MONTHS[m - 1]} ${d}, ${y}`;
}
