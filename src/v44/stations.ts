/**
 * Stations: one owner for the current station, the header list, the phone sheet, travel and Back.
 * Travel moves focus to the station's heading, and Back returns to the place the visitor left.
 */
import { applyLegacyRoute } from "./legacy.ts";
import { motionEnabled } from "./motion.ts";
import { $, $$ } from "./dom.ts";

export type Stations = { go: (id: string, animate?: boolean) => void; current: () => string };
type Hooks = { surge: (ms: number) => void; onStation: (id: string) => void };

export function mountStations({ surge, onStation }: Hooks): Stations {
  /* The sheet for narrow screens is built from the one station list in the header. */
  const menu = $<HTMLButtonElement>("[data-menu-toggle]")!;
  const sheet = $("#station-sheet")!;
  sheet.replaceChildren($(".stations ol")!.cloneNode(true));

  const links = $$<HTMLAnchorElement>("[data-station-link]");
  let current = "arrival";
  const observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        current = (e.target as HTMLElement).dataset.station || current;
        links.forEach((a) => a.setAttribute("aria-current", String(a.dataset.stationLink === current)));
        onStation(current);
      }
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  $$("[data-station]").forEach((s) => observer.observe(s));

  const sheetOpen = () => !sheet.hidden;
  const closeSheet = (returnFocus = false) => {
    sheet.hidden = true;
    menu.setAttribute("aria-expanded", "false");
    if (returnFocus) menu.focus();
  };
  menu.addEventListener("click", () => {
    const open = !sheetOpen();
    sheet.hidden = !open;
    menu.setAttribute("aria-expanded", String(open));
    if (open)
      (sheet.querySelector<HTMLElement>('a[aria-current="true"]') || sheet.querySelector<HTMLElement>("a"))?.focus();
  });
  document.addEventListener("keydown", (e) => e.key === "Escape" && sheetOpen() && closeSheet(true));
  document.addEventListener("pointerdown", (e) => {
    const t = e.target as Node;
    if (sheetOpen() && !sheet.contains(t) && !menu.contains(t)) closeSheet();
  });
  // Tabbing out of the sheet closes it, and so does widening the window to the desktop navigation.
  sheet.addEventListener("focusout", (e) => {
    const next = e.relatedTarget as Node | null;
    if (next && !sheet.contains(next) && !menu.contains(next)) closeSheet();
  });
  // The stylesheet alone decides when the inline list replaces the sheet; once it shows, an open sheet closes.
  const inlineList = $(".stations")!;
  new ResizeObserver(() => {
    if (!sheetOpen() || getComputedStyle(inlineList).display === "none") return;
    const inside = sheet.contains(document.activeElement);
    closeSheet();
    if (inside) document.querySelector<HTMLElement>('.stations a[aria-current="true"]')?.focus();
  }).observe(document.documentElement);

  /* Travel, with a warp surge through the gate. */
  // Focus lands on the control a place names for arrivals (E.V.E. names her input), else on its heading.
  // On touch screens a place may name a quieter target, so arriving never raises the keyboard.
  const coarse = matchMedia("(pointer: coarse)");
  const headingOf = (target: HTMLElement) =>
    (coarse.matches &&
      target.dataset.arriveFocusTouch &&
      target.querySelector<HTMLElement>(target.dataset.arriveFocusTouch)) ||
    (target.dataset.arriveFocus && target.querySelector<HTMLElement>(target.dataset.arriveFocus)) ||
    (target.matches("h1, h2, h3") ? target : target.querySelector<HTMLElement>("h1, h2")) ||
    target;
  // The control each journey started from, by history entry, so Back hands focus back to it.
  const origins = new Map<number, HTMLElement>();
  let entries = (history.state as { entry?: number } | null)?.entry ?? 0;
  const go = (id: string, animate = true) => {
    const target = document.getElementById(id);
    if (!target) return;
    const fromY = scrollY;
    const from = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeSheet();
    if (animate) surge(1400);
    target.scrollIntoView({ behavior: animate && motionEnabled() ? "smooth" : "auto" });
    // The station being travelled to starts its arrival at once, rather than after the scroll settles.
    target.querySelectorAll("[data-reveal]").forEach((plate) => plate.classList.add("in"));
    const heading = headingOf(target);
    if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
    if (location.hash !== `#${id}`) {
      // Remember where the visitor was, so Back returns to that place and not the browser's guess.
      const here = (history.state as { entry?: number } | null)?.entry ?? entries;
      if (from && from !== document.body) origins.set(here, from);
      history.replaceState({ ...(history.state || {}), y: fromY, entry: here }, "");
      entries = here + 1;
      history.pushState({ station: id, entry: entries }, "", `#${id}`);
    }
  };
  addEventListener("popstate", (e) => {
    const state = e.state as { y?: number; entry?: number } | null;
    // After the browser's own restoration, so the remembered place and control win.
    requestAnimationFrame(() => {
      if (typeof state?.y === "number") scrollTo({ top: state.y, behavior: "auto" });
      else if (!location.hash) scrollTo({ top: 0, behavior: "auto" });
      const origin = typeof state?.entry === "number" ? origins.get(state.entry) : undefined;
      if (origin?.isConnected) origin.focus({ preventScroll: true });
    });
  });
  $$<HTMLAnchorElement>(
    "[data-transit-go], [data-station-link], [data-station-next], .brand, a[href='#contact']",
  ).forEach((a) =>
    a.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      go(a.hash.slice(1));
    }),
  );
  // An old alias typed into a loaded page travels to its station.
  addEventListener("hashchange", () => {
    const alias = applyLegacyRoute();
    if (alias) go(alias);
  });

  return { go, current: () => current };
}
