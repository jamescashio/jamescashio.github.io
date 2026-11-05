/**
 * One owner for motion. The key is shared with the rooms and the preserved V43 edition, so a Pause anywhere
 * holds everywhere. As on those pages, a saved Pause or the system's reduced motion setting stills the page on
 * arrival, and the visitor's own Resume or Pause applies at once.
 */
const KEY = "cashio-v40-motion";
const listeners = new Set<() => void>();
const reduce = matchMedia("(prefers-reduced-motion: reduce)");

function stored(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

// The visitor's own choice this visit wins over what storage says, so a refused write cannot undo it.
// A new value written by another page of the site (a storage event) becomes the choice.
let chosen: string | null = null;
// What this page last read from or wrote to storage; a different value later means another page changed it.
let seen = stored();
const initial = () => (chosen ?? stored()) !== "off" && !reduce.matches;
let enabled = initial();

export function motionEnabled(): boolean {
  return enabled;
}

export function setMotion(on: boolean) {
  enabled = on;
  chosen = on ? "on" : "off";
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
    seen = on ? "on" : "off";
  } catch {
    /* Private windows can refuse storage; the choice still holds for this visit. */
  }
  document.documentElement.dataset.motion = on ? "on" : "off";
  listeners.forEach((fn) => fn());
}

export function onMotionChange(fn: () => void) {
  listeners.add(fn);
}

// Another open page of the site (a room, the preserved edition) can change the shared setting,
// and a page restored from the back forward cache may have missed a change.
const resync = () => {
  const next = initial();
  if (next === enabled) return;
  enabled = next;
  document.documentElement.dataset.motion = enabled ? "on" : "off";
  listeners.forEach((fn) => fn());
};
addEventListener("storage", (e) => {
  if (e.key !== KEY) return;
  chosen = seen = e.newValue;
  resync();
});
// Back from another page: what that page stored is the latest choice, if storage could keep it.
addEventListener("pageshow", (e) => {
  if (!e.persisted) return;
  const saved = stored();
  if (saved !== seen) chosen = seen = saved;
  resync();
});
reduce.addEventListener("change", () => {
  enabled = initial();
  document.documentElement.dataset.motion = enabled ? "on" : "off";
  listeners.forEach((fn) => fn());
});

document.documentElement.dataset.motion = enabled ? "on" : "off";
