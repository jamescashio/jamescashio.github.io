/**
 * The jump. A world card is a destination. Chosen, with a pointer or by focus, it lights the far gate in
 * that world's color. Opened, the page falls away, the camera flies to the far gate and through it, the
 * view folds into the world's own light, and the room opens out of that light on the other side
 * (public/passage.js and src/v40/room-passage.css hold the room's half).
 *
 * The live sky flies it. Where the sky is a painting (no GPU to speak of, or a visit that began mid page)
 * the page draws a plainer version of the same move. With motion paused or reduced, a card is a link.
 */
import { motionEnabled } from "./motion.ts";
import type { Rgb } from "./nebula.ts";
import { $$ } from "./dom.ts";

/** Each world's light. The rooms' stylesheet carries the same four, and a test holds them together. */
export const WORLD_LIGHT: Record<string, Rgb> = {
  starship: [0.3, 0.64, 1],
  principles: [1, 0.66, 0.28],
  studios: [0.68, 0.5, 1],
  heritage: [1, 0.36, 0.32],
};
/** Long enough to read as travel, short enough to take every time. */
export const JUMP_MS = 1050;
/** How long a jump that never arrived is left standing before the page comes back. */
const STRANDED_MS = 7000;
const ARRIVING = "cashio-jump";

type Flight = {
  /** Whether the visitor has passed the first gate, so the far one is the next thing ahead. */
  deep(): boolean;
  lock(light: Rgb | null): void;
  /** Start the flight; false when the live sky is not flying and the page must draw the jump itself. */
  fly(light: Rgb, ms: number): boolean;
  land(): void;
};

export function mountJump(flight: Flight) {
  const root = document.documentElement;
  let leaving = 0;
  let stranded = 0;
  const land = () => {
    clearTimeout(leaving);
    clearTimeout(stranded);
    delete root.dataset.jump;
    delete root.dataset.jumpSky;
    flight.land();
  };
  for (const card of $$<HTMLElement>(".world[data-world]")) {
    const world = card.dataset.world!;
    const light = WORLD_LIGHT[world];
    const link = card.querySelector<HTMLAnchorElement>('a[href$="/interactive/"]');
    if (!light || !link) continue;
    card.addEventListener("pointerenter", () => flight.lock(light));
    card.addEventListener("pointerleave", () => flight.lock(null));
    card.addEventListener("focusin", () => flight.lock(light));
    card.addEventListener("focusout", () => flight.lock(null));
    link.addEventListener("click", (event) => {
      // A new tab, a new window, a download: those are the browser's to do.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!motionEnabled() || !flight.deep() || root.dataset.jump) return;
      event.preventDefault();
      root.style.setProperty("--jump-rgb", light.map((v) => Math.round(v * 255)).join(" "));
      root.style.setProperty("--jump-ms", `${JUMP_MS}ms`);
      // The page falls away from the middle of the screen, wherever on the page that is.
      const worlds = card.closest<HTMLElement>("section") || card;
      const box = worlds.getBoundingClientRect();
      worlds.style.transformOrigin = `${(innerWidth / 2 - box.left).toFixed(0)}px ${(innerHeight / 2 - box.top).toFixed(0)}px`;
      root.dataset.jumpSky = flight.fly(light, JUMP_MS) ? "live" : "painted";
      root.dataset.jump = world;
      // The room is fetched while the camera flies, so it is there on the far side.
      const ahead = document.createElement("link");
      ahead.rel = "prefetch";
      ahead.href = link.href;
      document.head.append(ahead);
      leaving = window.setTimeout(() => {
        try {
          sessionStorage.setItem(ARRIVING, world);
        } catch {
          /* Without storage the room simply opens. */
        }
        location.assign(link.href);
      }, JUMP_MS);
      stranded = window.setTimeout(land, JUMP_MS + STRANDED_MS);
    });
  }
  // Back from the room to a page the browser kept: it was left mid jump, so it lands first.
  addEventListener("pageshow", (event) => {
    if (event.persisted) land();
  });
}
