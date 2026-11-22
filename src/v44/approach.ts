/**
 * The approach: a pilot's marks on the transit gate. Four corners hold the gate in a lock and a tag reads
 * its range and closing speed. Scrolling toward the gate grows the marks with it until they fall away as
 * the camera passes through. A first visit watches the marks find the gate while the painting drifts
 * closer. Clicking or tapping the gate itself knocks on it: a light front races round the ring.
 *
 * Purely visual. The whole layer sits inside the sky, which is hidden from assistive technology, and every
 * control on the page works without it. Paused or reduced motion keeps the marks still and the gate quiet.
 */
import { motionEnabled, onMotionChange } from "./motion.ts";
import type { SkyLayout } from "./layout.ts";
import { $ } from "./dom.ts";

type Options = {
  /** The gate's place on this screen, the same layout the poster and the live scene use. */
  layout: () => SkyLayout;
  /** The live scene is on screen, so the gate flies by its curve and leans after the pointer. */
  live: () => boolean;
  /** The live scene is drawing frames now. */
  drawing: () => boolean;
  /** How far the live gate leans after the pointer, in CSS pixels. */
  lean: () => [number, number];
  /** Knock on the live gate; answers whether it showed the light front. */
  knock: () => boolean;
  /** The painted gate's own answer to a knock. */
  flare: () => void;
};

/** How far out the gate hangs when the arrival begins, for the range readout only. */
const RANGE_KM = 6.4;
/** Interactive things and words keep their own clicks; a knock is a click on open sky over the gate. */
const OWN_CLICKS =
  "a, button, input, select, textarea, label, summary, details, dialog, [role='button'], .hud, .bit, .arrival-copy, .gate-readout";

const smooth = (from: number, to: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - from) / (to - from)));
  return t * t * (3 - 2 * t);
};

export function mountApproach(o: Options) {
  const root = document.documentElement;
  const layer = $<HTMLElement>("[data-approach]");
  const arrival = $<HTMLElement>("#arrival");
  if (!layer || !arrival) return { update() {}, measure() {} };
  const corners = [...layer.querySelectorAll<HTMLElement>("[data-corner]")];
  const aim = layer.querySelector<HTMLElement>(".approach-aim")!;
  const tag = layer.querySelector<HTMLElement>(".approach-tag")!;
  const stateText = layer.querySelector<HTMLElement>("[data-approach-state]")!;
  const rangeText = layer.querySelector<HTMLElement>("[data-approach-range]")!;
  const closingText = layer.querySelector<HTMLElement>("[data-approach-closing]")!;
  const header = $<HTMLElement>("[data-hud]");

  let transit = 0;
  let width = innerWidth;
  let height = innerHeight;
  let headerBottom = 72;
  let narrow = false;
  // The first visit's lock: the marks start wide and close on the gate.
  let acquireFrom = 0;
  let acquiring = root.hasAttribute("data-arrive") && motionEnabled();
  let knocks = 0;
  let saying = 0;
  let lastRange = RANGE_KM;
  let lastAt = performance.now();
  let closing = 0;
  let lastText = 0;
  let leaning = 0;
  let raf = 0;
  // The tag keeps one size whatever it reads (a fixed measure in the stylesheet), so it is measured on resize only.
  let tagW = 220;
  let tagH = 34;
  // The arrival's words, in page coordinates: a corner that would cross them steps back to a faint line.
  let words: DOMRect[] = [];

  const say = (text: string, ms = 0) => {
    stateText.textContent = text;
    clearTimeout(saying);
    if (ms) saying = window.setTimeout(() => (stateText.textContent = resting()), ms);
  };
  const resting = () => (root.dataset.gate !== "open" ? "Acquiring" : transit > 0.02 ? "Closing" : "Locked");

  /** The gate's centre, size and turn on screen, and how much it has grown on the way in. */
  const gate = () => {
    const L = o.layout();
    const [x, y, R, tilt] = L.ring;
    const live = o.live();
    const motion = motionEnabled();
    const grow = !motion ? 1 : live ? 1 + 9 * Math.pow(transit, 2.4) : 1 + transit * 0.85;
    const [dx, dy] = live ? o.lean() : [0, 0];
    return {
      cx: width / 2 + x * height + dx,
      cy: height / 2 - y * height + dy,
      r: R * height,
      tilt,
      rot: L.rot,
      grow,
    };
  };

  const place = (now = performance.now()) => {
    const g = gate();
    const cr = Math.cos(g.rot);
    const sr = Math.sin(g.rot);
    // The box that holds the turned ellipse, its deck and the hull that hangs below it.
    let k = g.grow;
    if (acquiring) {
      const a = Math.min(1, (now - acquireFrom) / 1100);
      const back = 1 + 2.2 * Math.pow(a - 1, 3) + 1.2 * Math.pow(a - 1, 2);
      k *= 1 + 0.5 * (1 - back);
      if (a >= 1) acquiring = false;
    }
    const box = (scale: number) => {
      const r = g.r * scale;
      const hx = r * Math.hypot(cr, g.tilt * sr) + r * 0.09;
      const hy = r * Math.hypot(sr, g.tilt * cr);
      return { left: g.cx - hx, right: g.cx + hx, top: g.cy - hy - r * 0.09, bottom: g.cy + hy + r * 0.2 };
    };
    const { left, right, top, bottom } = box(k);
    const arm = Math.round(Math.min(width >= 2400 ? 48 : 34, Math.max(14, g.r * 0.09)));
    // At rest the lock stays on screen even where the gate reaches the edge of a phone.
    const still = k === 1 && transit < 0.01;
    const inX = (x: number) => (still ? Math.min(width - arm - 6, Math.max(6, x)) : x);
    layer.style.setProperty("--arm", `${arm}px`);
    const at: Record<string, [number, number]> = {
      tl: [inX(left), top],
      tr: [inX(right - arm), top],
      bl: [inX(left), bottom - arm],
      br: [inX(right - arm), bottom - arm],
    };
    const y0 = scrollY;
    for (const c of corners) {
      const [cx, cy] = at[c.dataset.corner!];
      c.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
      const crosses = words.some(
        (w) => cx < w.right && cx + arm > w.left && cy < w.bottom - y0 && cy + arm > w.top - y0,
      );
      c.toggleAttribute("data-under", crosses);
    }
    aim.style.transform = `translate3d(${g.cx.toFixed(1)}px, ${g.cy.toFixed(1)}px, 0)`;
    // The tag keeps the place it has at rest, above the top left corner (under the gate on a narrow screen),
    // never under the header; only the corners fly out with the gate.
    const rest = box(1);
    const tx = Math.max(12, Math.min(rest.left, width - tagW - 12));
    const ty = narrow
      ? Math.min(rest.bottom + 10, height - tagH - 12)
      : Math.max(headerBottom + 10, rest.top - tagH - 12);
    tag.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`;
    // On a phone the tag sits where the words scroll through, so it leaves as soon as the flight begins.
    tag.style.opacity = narrow ? (1 - smooth(0, 0.04, transit)).toFixed(3) : "";
    // The marks fall away as the gate fills the screen; past it they are gone.
    const fade = 1 - smooth(0.1, 0.45, transit);
    layer.style.opacity = fade.toFixed(3);
    layer.toggleAttribute("data-gone", fade <= 0.001);

    // Range closes as the visitor flies in; the closing speed is how fast it closes, in metres a second.
    const range = RANGE_KM * Math.pow(1 - Math.min(1, transit), 1.4);
    const dt = Math.max(1, now - lastAt);
    const rate = (Math.max(0, lastRange - range) * 1000) / (dt / 1000);
    closing = closing * 0.82 + rate * 0.18;
    if (rate === 0 && closing < 1) closing = 0;
    lastRange = range;
    lastAt = now;
    if (now - lastText > 90) {
      lastText = now;
      rangeText.textContent = `Range ${range.toFixed(1)} km`;
      const speed = Math.round(closing / 10) * 10;
      closingText.textContent = `Closing ${speed.toLocaleString("en-US")} m/s`;
    }
  };

  const loop = () => {
    raf = 0;
    const now = performance.now();
    place(now);
    // Follow the live gate while it still leans or the lock is still closing, then stand still.
    if (acquiring || (o.drawing() && now < leaning) || closing > 1) raf = requestAnimationFrame(loop);
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(loop);
  };

  const measure = () => {
    width = innerWidth;
    height = innerHeight;
    narrow = width < 760 || width / height < 0.9;
    headerBottom = header ? header.getBoundingClientRect().bottom : 72;
    layer.toggleAttribute("data-narrow", narrow);
    tagW = tag.offsetWidth || tagW;
    tagH = tag.offsetHeight || tagH;
    const y0 = scrollY;
    words = [
      ...arrival.querySelectorAll<HTMLElement>(
        ".kicker, .headline .line, .lede, .creds li, .arrival-actions > *, .gate-readout",
      ),
    ].map((el) => {
      const r = el.getBoundingClientRect();
      return new DOMRect(r.left - 6, r.top + y0 - 6, r.width + 12, r.height + 12);
    });
    place();
  };

  /** Whether a point on screen falls on the gate: its opening, its deck and a little of the sky around it. */
  const onGate = (px: number, py: number) => {
    if (transit > 0.25) return false;
    const g = gate();
    const ux = (px - g.cx) / (height * g.grow);
    const uy = -(py - g.cy) / (height * g.grow);
    const cr = Math.cos(g.rot);
    const sr = Math.sin(g.rot);
    const ex = cr * ux + sr * uy;
    const ey = -sr * ux + cr * uy;
    const R = g.r / height;
    return (ex / R) ** 2 + (ey / (R * g.tilt)) ** 2 <= 1.2 * 1.2;
  };
  const opensItself = (target: EventTarget | null) => !!(target as Element | null)?.closest?.(OWN_CLICKS);

  document.addEventListener("click", (e) => {
    if (!motionEnabled() || opensItself(e.target) || !onGate(e.clientX, e.clientY)) return;
    knocks += 1;
    if (!o.knock()) o.flare();
    layer.removeAttribute("data-knock");
    void layer.offsetWidth;
    layer.setAttribute("data-knock", "");
    // The forty second knock gets the answer the question deserved.
    if (knocks === 42) say("Don't panic", 4200);
    else say(`Pulse ${String(knocks).padStart(2, "0")}`, 1400);
  });

  // A fine pointer over the gate turns the marks bright and shows that the gate answers a click.
  if (matchMedia("(pointer: fine)").matches) {
    document.addEventListener(
      "pointermove",
      (e) => {
        const over = motionEnabled() && !opensItself(e.target) && onGate(e.clientX, e.clientY);
        layer.toggleAttribute("data-aim", over);
        arrival.classList.toggle("gate-under-pointer", over);
        if (o.live()) {
          leaning = performance.now() + 2600;
          kick();
        }
      },
      { passive: true },
    );
  }

  // The tag says Acquiring until the gate opens, then Locked.
  new MutationObserver(() => say(resting())).observe(root, { attributes: true, attributeFilter: ["data-gate"] });
  onMotionChange(() => {
    acquiring = false;
    measure();
  });

  if (acquiring) {
    acquireFrom = performance.now();
    layer.setAttribute("data-acquire", "");
    window.setTimeout(() => layer.removeAttribute("data-acquire"), 1400);
  }
  say(resting());
  measure();
  layer.setAttribute("data-ready", "");
  kick();

  return {
    /** Called on every scroll frame with the flight's progress, 0 at the arrival and 1 through the gate. */
    update(next: number) {
      transit = next;
      if (stateText.textContent === "Locked" || stateText.textContent === "Closing") say(resting());
      place();
      if (closing > 1) kick();
    },
    measure,
  };
}
