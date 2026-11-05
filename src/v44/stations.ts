/**
 * Stations: one owner for the current station, the header list, the phone sheet, travel and Back.
 * Travel moves focus to the station's heading, and Back returns to the place the visitor left.
 */
import { applyLegacyRoute } from "./legacy.ts";
import { motionEnabled } from "./motion.ts";

export type Stations = { go: (id: string, animate?: boolean) => void; current: () => string };
type Hooks = { surge: (ms: number) => void; onStation: (id: string) => void };

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string) => [...document.querySelectorAll<T>(sel)];
/** The width where the inline header list replaces the sheet; it matches the stylesheet. */
const DESKTOP_NAV = "(min-width: 1240px)";

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
  matchMedia(DESKTOP_NAV).addEventListener("change", (e) => {
    if (!e.matches || !sheetOpen()) return;
    const inside = sheet.contains(document.activeElement);
    closeSheet();
    if (inside) document.querySelector<HTMLElement>('.stations a[aria-current="true"]')?.focus();
  });

  /* Travel, with a warp surge through the gate. */
  const headingOf = (target: HTMLElement) =>
    (target.matches("h1, h2, h3") ? target : target.querySelector<HTMLElement>("h1, h2")) || target;
  const go = (id: string, animate = true) => {
    const target = document.getElementById(id);
    if (!target) return;
    const fromY = scrollY;
    closeSheet();
    if (animate) surge(1400);
    target.scrollIntoView({ behavior: animate && motionEnabled() ? "smooth" : "auto" });
    const heading = headingOf(target);
    if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: true });
    if (location.hash !== `#${id}`) {
      // Remember where the visitor was, so Back returns to that place and not the browser's guess.
      history.replaceState({ ...(history.state || {}), y: fromY }, "");
      history.pushState({ station: id }, "", `#${id}`);
    }
  };
  addEventListener("popstate", (e) => {
    const y = (e.state as { y?: number } | null)?.y;
    // After the browser's own restoration, so the remembered place wins.
    requestAnimationFrame(() => {
      if (typeof y === "number") scrollTo({ top: y, behavior: "auto" });
      else if (!location.hash) scrollTo({ top: 0, behavior: "auto" });
    });
  });
  $$<HTMLAnchorElement>("[data-transit-go], [data-station-link], [data-station-next], .brand").forEach((a) =>
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
