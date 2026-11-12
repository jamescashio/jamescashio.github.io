import { bitJokes } from "../shared/ship-humor.ts";
import { motionEnabled, onMotionChange } from "./motion.ts";
import type { LaneId } from "./route.ts";
import "./events.ts";

/** Bit, the copilot: a glass icosahedron in platinum around a lit core, a line for every station, and a memory for what you just did. */
const LINES: Record<string, string> = {
  arrival: "Welcome aboard. The gate is open and the coffee is mostly harmless.",
  cinema: "The trailer runs sixty one seconds. The cat’s review is still pending.",
  worlds: "Four worlds. I recommend the starship. I am biased; I live there.",
  workshop: "Everything here can be taken apart. Please put it back the way you found it.",
  helm: "Flip the private toggle and watch me refuse to phone the cloud.",
  evidence: "Numbers come with dates. Dates come with limits. Limits come with me.",
  doug: "The address is real. So is the human behind it.",
};

const PHI = (1 + Math.sqrt(5)) / 2;
const V = [
  [-1, PHI, 0],
  [1, PHI, 0],
  [-1, -PHI, 0],
  [1, -PHI, 0],
  [0, -1, PHI],
  [0, 1, PHI],
  [0, -1, -PHI],
  [0, 1, -PHI],
  [PHI, 0, -1],
  [PHI, 0, 1],
  [-PHI, 0, -1],
  [-PHI, 0, 1],
].map((v) => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
});
const F = [
  [0, 11, 5],
  [0, 5, 1],
  [0, 1, 7],
  [0, 7, 10],
  [0, 10, 11],
  [1, 5, 9],
  [5, 11, 4],
  [11, 10, 2],
  [10, 7, 6],
  [7, 1, 8],
  [3, 9, 4],
  [3, 4, 2],
  [3, 2, 6],
  [3, 6, 8],
  [3, 8, 9],
  [4, 9, 5],
  [2, 4, 11],
  [6, 2, 10],
  [8, 6, 7],
  [9, 8, 1],
];

/** How Bit looks this frame. Every value eases, so a change of mood never snaps. */
interface Look {
  /** Radians turned so far; speed changes bend the turn without a jump. */
  angle: number;
  /** A flash of attention: 1 the moment something happens, fading out. */
  glow: number;
  /** How far the facets stand off the core, 0 to 1: Bit opens up when it speaks or cheers. */
  open: number;
  /** 1 while a request is held for a person: the core and its light turn red. */
  held: number;
  /** Where the visitor's pointer is from Bit, each from minus one to one: Bit leans and looks that way. */
  gazeX: number;
  gazeY: number;
  /** 1 while E.V.E. is working out an answer: the ring wobbles, a second ring crosses it and the moon hurries. */
  think: number;
  /** A tap makes Bit swell and settle: 1 at the tap, easing back to 0. */
  pop: number;
  /** A blink: the core dims for an instant, 0 to 1 and back. */
  blink: number;
  /** How far round its ring the moon has travelled, in radians. */
  moon: number;
}

/** A spark thrown off when Bit cheers: a position and speed in units of the canvas, and the life it has left. */
interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

const LIGHT = (() => {
  const v = [-0.45, 0.7, 0.55];
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
})();
const mix = (a: number, b: number, k: number) => a + (b - a) * k;

/**
 * Bit: a glass icosahedron in platinum around a lit core, with one ring and one small red moon.
 * Back facets, core, front facets, then the near half of the ring, so the body has real depth.
 * The core sits a little toward wherever the visitor's pointer is, which reads as Bit looking at it.
 */
function drawBit(ctx: CanvasRenderingContext2D, size: number, t: number, look: Look, sparks: Spark[] = []) {
  ctx.clearRect(0, 0, size, size);
  const c = size / 2;
  const breathe = 1 + Math.sin(t * 1.7) * 0.022;
  const r = size * 0.335 * breathe * (1 + look.pop * 0.13);
  const ay = look.angle + look.gazeX * 0.45;
  const ax = 0.46 + Math.sin(t * 0.5) * 0.16 - look.gazeY * 0.38;
  const [cy, sy, cx, sx] = [Math.cos(ay), Math.sin(ay), Math.cos(ax), Math.sin(ax)];
  const rot = (v: number[]) => {
    const x1 = v[0] * cy + v[2] * sy;
    const z1 = -v[0] * sy + v[2] * cy;
    return [x1, v[1] * cx - z1 * sx, v[1] * sx + z1 * cx];
  };
  const P = V.map(rot);
  const held = look.held;
  // The core's color: blue in command, red while a request waits for a person.
  const core = [mix(53, 255, held), mix(120, 61, held), mix(255, 85, held)].map(Math.round);
  const edge = [mix(170, 255, held), mix(205, 138, held), mix(255, 157, held)].map(Math.round);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.6);

  // Halo.
  const halo = ctx.createRadialGradient(c, c, 0, c, c, size * 0.5);
  halo.addColorStop(0, `rgba(${core},${0.3 + look.glow * 0.35 + pulse * 0.06})`);
  halo.addColorStop(0.55, `rgba(${core},${0.08 + look.glow * 0.1})`);
  halo.addColorStop(1, `rgba(${core},0)`);
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);

  // The ring: an ellipse tipped across the body. Its far half is drawn now, its near half last.
  const tilt = -0.42 + look.gazeX * 0.22 + look.think * Math.sin(t * 3.1) * 0.4;
  const rx = size * 0.47;
  const ry = size * 0.135;
  const ring = (from: number, to: number, alpha: number) => {
    ctx.beginPath();
    ctx.ellipse(c, c, rx, ry, tilt, from, to);
    ctx.strokeStyle = `rgba(${edge},${alpha})`;
    ctx.lineWidth = Math.max(1, size / 80);
    ctx.stroke();
  };
  const moonAt = look.moon;
  const onRing = (at: number) => {
    const mx = Math.cos(at) * rx;
    const my = Math.sin(at) * ry;
    return [c + mx * Math.cos(tilt) - my * Math.sin(tilt), c + mx * Math.sin(tilt) + my * Math.cos(tilt)];
  };
  const moon = (front: boolean) => {
    // The moon draws a short fading wake behind it along the ring.
    for (let i = 7; i >= 1; i--) {
      const at = moonAt - i * 0.085;
      if (Math.sin(at) > 0 !== front) continue;
      const [wx, wy] = onRing(at);
      ctx.beginPath();
      ctx.arc(wx, wy, size * 0.017 * (1 - i / 9), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,138,157,${(front ? 0.55 : 0.25) * (1 - i / 8)})`;
      ctx.fill();
    }
    if (Math.sin(moonAt) > 0 !== front) return;
    const [x, y] = onRing(moonAt);
    const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 0.075);
    glow.addColorStop(0, `rgba(255,120,140,${front ? 0.95 : 0.45})`);
    glow.addColorStop(1, "rgba(255,61,85,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - size * 0.08, y - size * 0.08, size * 0.16, size * 0.16);
    ctx.beginPath();
    ctx.arc(x, y, size * (front ? 0.026 : 0.02), 0, Math.PI * 2);
    ctx.fillStyle = front ? "#fff" : "rgba(255,200,208,0.7)";
    ctx.fill();
  };
  // While Bit thinks, a second ring crosses the first.
  const second = (from: number, to: number, alpha: number) => {
    if (look.think < 0.02) return;
    ctx.beginPath();
    ctx.ellipse(c, c, rx * 0.92, ry * 1.15, tilt + 1.25, from, to);
    ctx.strokeStyle = `rgba(${edge},${alpha * look.think})`;
    ctx.lineWidth = Math.max(0.75, size / 110);
    ctx.stroke();
  };
  second(Math.PI, Math.PI * 2, 0.22);
  ring(Math.PI, Math.PI * 2, 0.28);
  moon(false);

  // Facets, far to near. Each stands off the core by `open`, along its own centre.
  const open = look.open * 0.2;
  const faces = F.map((f) => {
    const [a, b, d] = [P[f[0]], P[f[1]], P[f[2]]];
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const w = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    const nl = Math.hypot(n[0], n[1], n[2]) || 1;
    const m = [(a[0] + b[0] + d[0]) / 3, (a[1] + b[1] + d[1]) / 3, (a[2] + b[2] + d[2]) / 3];
    return { pts: [a, b, d], n: [n[0] / nl, n[1] / nl, n[2] / nl], m };
  }).sort((p, q) => p.m[2] - q.m[2]);
  const trace = (face: (typeof faces)[number]) => {
    ctx.beginPath();
    face.pts.forEach((p, k) => {
      const x = c + (p[0] + face.m[0] * open) * r;
      const y = c - (p[1] + face.m[1] * open) * r;
      if (k) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.closePath();
  };
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(0.75, size / 120);
  for (const face of faces) {
    if (face.n[2] >= 0) continue;
    trace(face);
    ctx.fillStyle = `rgba(${Math.round(core[0] * 0.35)},${Math.round(core[1] * 0.45)},${Math.round(core[2] * 0.5)},0.42)`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${edge},0.22)`;
    ctx.stroke();
  }

  // The core, seen through the glass.
  const heart = r * (0.5 + pulse * 0.07 + look.glow * 0.12 + look.open * 0.1 + look.think * 0.06);
  // It leans toward the pointer, and dims for an instant when Bit blinks.
  const hx = c + look.gazeX * r * 0.16;
  const hy = c + look.gazeY * r * 0.16;
  const awake = 1 - look.blink * 0.8;
  const lit = ctx.createRadialGradient(hx, hy, 0, hx, hy, heart);
  lit.addColorStop(0, `rgba(255,255,255,${0.98 * awake})`);
  lit.addColorStop(0.3, `rgba(${core},${0.9 * awake})`);
  lit.addColorStop(1, `rgba(${core},0)`);
  ctx.fillStyle = lit;
  ctx.beginPath();
  ctx.arc(hx, hy, heart, 0, Math.PI * 2);
  ctx.fill();

  for (const face of faces) {
    if (face.n[2] < 0) continue;
    const diffuse = Math.max(0, face.n[0] * LIGHT[0] + face.n[1] * LIGHT[1] + face.n[2] * LIGHT[2]);
    // The glint: the facet that throws the light straight back at the viewer.
    const half = [LIGHT[0], LIGHT[1], LIGHT[2] + 1];
    const hl = Math.hypot(half[0], half[1], half[2]);
    const shine = Math.max(0, (face.n[0] * half[0] + face.n[1] * half[1] + face.n[2] * half[2]) / hl) ** 26;
    const k = Math.min(1, 0.12 + diffuse * 0.88);
    trace(face);
    ctx.fillStyle = `rgba(${Math.round(mix(64, 240, k))},${Math.round(mix(78, 244, k))},${Math.round(mix(112, 252, k))},${0.5 + k * 0.34})`;
    ctx.fill();
    if (shine > 0.02) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.85, shine)})`;
      ctx.fill();
    }
    ctx.strokeStyle = `rgba(${edge},${0.55 + face.n[2] * 0.4})`;
    ctx.stroke();
  }
  // Near corners catch the light.
  for (const p of P) {
    if (p[2] < 0.25) continue;
    ctx.beginPath();
    ctx.arc(c + p[0] * (1 + open) * r, c - p[1] * (1 + open) * r, Math.max(0.8, size / 105), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.35 + p[2] * 0.55})`;
    ctx.fill();
  }
  second(0, Math.PI, 0.6);
  ring(0, Math.PI, 0.82);
  moon(true);
  // Sparks from a cheer: short bright streaks flying out and fading.
  for (const spark of sparks) {
    const x = c + spark.x * size;
    const y = c + spark.y * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - spark.vx * size * 0.05, y - spark.vy * size * 0.05);
    ctx.strokeStyle = `rgba(${spark.life > 0.5 ? "255,255,255" : edge},${Math.min(1, spark.life * 1.4)})`;
    ctx.lineWidth = Math.max(1, size / 70) * spark.life;
    ctx.lineCap = "round";
    ctx.stroke();
  }
}

const ROUTE_LINES: Record<LaneId, string> = {
  hold: "You held it for a person. Correct. I would have done the same and then taken the credit.",
  research: "Research lane. Sources first, opinions second. E.V.E. approves.",
  workhorse: "Workhorse lane. Unglamorous, reliable, my favorite kind of hero.",
  synthesis: "Synthesis lane. Connected reasoning, with the assumptions kept for your review.",
};

export function mountBit(
  button: HTMLButtonElement,
  dialog: HTMLDialogElement,
  go: (id: string) => void,
  current: () => string,
) {
  const canvas = button.querySelector("canvas")!;
  const ctx = canvas.getContext("2d");
  // A larger Bit sits in the card's head, where there is room to see it turn.
  const portrait = dialog.querySelector<HTMLCanvasElement>("[data-bit-portrait]");
  const portraitCtx = portrait?.getContext("2d") ?? null;
  const line = dialog.querySelector<HTMLElement>("[data-bit-line]")!;
  const goButtons = [...dialog.querySelectorAll<HTMLButtonElement>("[data-bit-go]")];
  let joke = 0;
  let raf = 0;
  let last = 0;
  let spinUntil = 0;
  let cheerUntil = 0;
  let heldUntil = 0;
  let hovered = false;
  const look: Look = {
    angle: 0.9,
    glow: 0,
    open: 0,
    held: 0,
    gazeX: 0,
    gazeY: 0,
    think: 0,
    pop: 0,
    blink: 0,
    moon: 1.1,
  };
  const sparks: Spark[] = [];
  // Where the pointer last was, and where Bit sits; Bit is fixed in its corner, so its place is read on resize only.
  let pointer: [number, number] | null = null;
  let home: [number, number] = [innerWidth, innerHeight];
  const place = () => {
    const box = button.getBoundingClientRect();
    home = [box.left + box.width / 2, box.top + box.height / 2];
  };
  let thinking = false;
  let blinkAt = performance.now() + 4000;
  let blinkUntil = 0;
  // The last thing the visitor did, said once the next time Bit is opened.
  let remark = "";
  // A small light on the badge says Bit has something to say about what the visitor just did.
  const setRemark = (text: string) => {
    remark = text;
    button.toggleAttribute("data-remark", Boolean(text));
  };

  const paint = (seconds: number) => {
    if (ctx) drawBit(ctx, canvas.width, seconds, look, sparks);
    if (portraitCtx && portrait && dialog.open) drawBit(portraitCtx, portrait.width, seconds, look, sparks);
  };
  const throwSparks = (count: number) => {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const v = 0.5 + Math.random() * 0.45;
      sparks.push({ x: Math.cos(a) * 0.18, y: Math.sin(a) * 0.18, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1 });
    }
  };
  // Bit moves while someone is there: hover, focus, an open card, or a little while after the visitor last did anything.
  const active = () =>
    motionEnabled() && !document.hidden && (hovered || dialog.open || thinking || performance.now() < spinUntil);
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    const cheering = now < cheerUntil;
    // Turning speed: a slow idle, quicker when watched, a burst when it cheers, nearly still while it holds.
    const speed = now < heldUntil ? 0.15 : cheering ? 5.2 : hovered ? 1.7 : thinking ? 1.5 : dialog.open ? 1.1 : 0.7;
    look.angle += speed * dt;
    look.glow *= 0.955;
    // Bit looks toward the pointer: the nearer the pointer, the more it turns to face it.
    const ease = Math.min(1, dt * 5);
    const reach = Math.max(innerWidth, innerHeight) * 0.6;
    const want = pointer
      ? [
          Math.max(-1, Math.min(1, (pointer[0] - home[0]) / reach)),
          Math.max(-1, Math.min(1, (pointer[1] - home[1]) / reach)),
        ]
      : [0, 0];
    look.gazeX += (want[0] - look.gazeX) * ease;
    look.gazeY += (want[1] - look.gazeY) * ease;
    look.think += ((thinking ? 1 : 0) - look.think) * Math.min(1, dt * 4);
    look.moon += dt * (1.25 + look.think * 3.2 + (cheering ? 4 : 0));
    look.pop *= Math.max(0, 1 - dt * 7);
    // Now and then Bit blinks.
    if (now > blinkAt) {
      blinkUntil = now + 150;
      blinkAt = now + 3600 + Math.random() * 5200;
    }
    look.blink += ((now < blinkUntil ? 1 : 0) - look.blink) * Math.min(1, dt * 26);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const spark = sparks[i];
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      spark.vx *= 1 - dt * 2.4;
      spark.vy *= 1 - dt * 2.4;
      spark.life -= dt * 1.9;
      if (spark.life <= 0) sparks.splice(i, 1);
    }
    look.held += ((now < heldUntil ? 1 : 0) - look.held) * Math.min(1, dt * 6);
    // Speaking opens the facets in a small rhythm; a cheer throws them wide once.
    const talking = dialog.open ? 0.3 + 0.2 * Math.sin(now / 130) : 0;
    look.open += ((cheering ? 0.9 : talking) - look.open) * Math.min(1, dt * 7);
    paint(now / 1000);
    raf = active() ? requestAnimationFrame(loop) : 0;
    if (!raf) last = 0;
    button.toggleAttribute("data-spinning", raf !== 0);
  };
  const wake = (ms = 0) => {
    spinUntil = Math.max(spinUntil, performance.now() + ms);
    if (!raf && active()) {
      raf = requestAnimationFrame(loop);
      button.setAttribute("data-spinning", "");
    }
  };
  const cheer = (ms = 700) => {
    cheerUntil = performance.now() + ms;
    look.glow = 1;
    if (motionEnabled()) throwSparks(14);
    wake(ms + 900);
  };
  place();
  addEventListener("resize", place);
  paint(1.2);
  // The arrival turn waits until the page has loaded, so it never competes with the first paint.
  const intro = () => setTimeout(() => wake(2600), 600);
  if (document.readyState === "complete") intro();
  else addEventListener("load", intro, { once: true });
  onMotionChange(() => wake());
  document.addEventListener("visibilitychange", () => wake());
  button.addEventListener("pointerenter", () => ((hovered = true), wake()));
  button.addEventListener("pointerleave", () => (hovered = false));
  button.addEventListener("focus", () => ((hovered = true), wake()));
  button.addEventListener("blur", () => (hovered = false));
  // Bit keeps the visitor company: it turns for a few seconds after any scroll, pointer or key, then rests.
  let stirred = 0;
  const stir = () => {
    const now = performance.now();
    if (now - stirred < 900) return;
    stirred = now;
    wake(3600);
  };
  for (const type of ["scroll", "pointermove", "keydown", "touchstart"] as const)
    addEventListener(type, stir, { passive: true });
  // Only a mouse or pen gives Bit something to look at; a finger lifts away, so touch leaves it facing forward.
  addEventListener(
    "pointermove",
    (e) => {
      pointer = e.pointerType === "touch" ? null : [e.clientX, e.clientY];
    },
    { passive: true },
  );
  document.documentElement.addEventListener("pointerleave", () => (pointer = null));
  // While E.V.E. is typing an answer, Bit thinks along with her.
  const eveLog = document.querySelector("[data-eve-log]");
  if (eveLog)
    new MutationObserver(() => {
      const was = thinking;
      thinking = eveLog.hasAttribute("data-typing");
      if (thinking) wake(600);
      else if (was) {
        look.glow = 1;
        wake(1500);
      }
    }).observe(eveLog, { attributes: true, attributeFilter: ["data-typing"] });

  document.addEventListener("v44:route", (e) => {
    setRemark(ROUTE_LINES[e.detail.id] || remark);
    // A held request turns Bit red and nearly still; any lane gets a quick turn of approval.
    const held = e.detail.id === "hold";
    if (!motionEnabled()) {
      // Without motion Bit still shows the decision: one still frame, red while the request is held.
      look.held = held ? 1 : 0;
      paint(performance.now() / 1000);
      return;
    }
    if (held) {
      heldUntil = performance.now() + 2400;
      look.glow = 1;
      wake(3200);
    } else {
      heldUntil = 0;
      cheer(520);
    }
  });
  document.addEventListener("v44:film", (e) => {
    const f = e.detail;
    setRemark(
      f.id === "trailer"
        ? "You put the trailer on. The cat has notes. The cat always has notes."
        : `You put on the ${f.title.toLowerCase()}. Fifteen quiet seconds, beautifully lit. I counted.`,
    );
    cheer(420);
  });
  document.addEventListener("v44:eve", (e) => {
    const { cmd } = e.detail;
    if (cmd === "clear") return;
    setRemark(`You asked E.V.E. about ${cmd}. She keeps the receipts. I keep the jokes.`);
    look.glow = 1;
    wake(1200);
  });

  const close = () => {
    dialog.close();
    button.focus();
  };
  button.addEventListener("click", () => {
    line.textContent = remark || LINES[current()] || LINES.arrival;
    setRemark("");
    // Offer only the places the visitor is not already at: each button names the station it belongs to.
    goButtons.forEach((b) => (b.hidden = (b.dataset.bitStation || b.dataset.bitGo) === current()));
    look.glow = motionEnabled() ? 1 : 0.35;
    // A tap makes Bit swell and throw a few sparks before it speaks.
    if (motionEnabled()) {
      look.pop = 1;
      throwSparks(7);
    }
    place();
    dialog.show();
    line.classList.remove("say");
    void line.offsetWidth;
    line.classList.add("say");
    // The card's portrait is painted as the card opens, so it is there with motion paused too; the loop then turns it.
    paint(performance.now() / 1000);
    wake();
    dialog.querySelector<HTMLButtonElement>("[data-bit-close]")?.focus();
  });
  dialog.querySelector("[data-bit-close]")?.addEventListener("click", close);
  // The card is not modal, so it closes the way the station sheet does: Escape from anywhere returns
  // to Bit, and a tap or a Tab that leaves the card and its button simply closes it.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.open) close();
  });
  document.addEventListener("pointerdown", (e) => {
    const t = e.target as Node;
    if (dialog.open && !dialog.contains(t) && !button.contains(t)) dialog.close();
  });
  dialog.addEventListener("focusout", (e) => {
    const next = e.relatedTarget as Node | null;
    if (dialog.open && next && !dialog.contains(next) && !button.contains(next)) dialog.close();
  });
  dialog.querySelector("[data-bit-joke]")?.addEventListener("click", () => {
    line.textContent = bitJokes[joke++ % bitJokes.length];
    line.classList.remove("say");
    void line.offsetWidth;
    line.classList.add("say");
    cheer(480);
  });
  goButtons.forEach((b) =>
    b.addEventListener("click", () => {
      dialog.close();
      go(b.dataset.bitGo || "arrival");
    }),
  );
}
