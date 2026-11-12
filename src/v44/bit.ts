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
 */
function drawBit(ctx: CanvasRenderingContext2D, size: number, t: number, look: Look) {
  ctx.clearRect(0, 0, size, size);
  const c = size / 2;
  const breathe = 1 + Math.sin(t * 1.7) * 0.022;
  const r = size * 0.335 * breathe;
  const ay = look.angle;
  const ax = 0.46 + Math.sin(t * 0.5) * 0.16;
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
  const tilt = -0.42;
  const rx = size * 0.47;
  const ry = size * 0.135;
  const ring = (from: number, to: number, alpha: number) => {
    ctx.beginPath();
    ctx.ellipse(c, c, rx, ry, tilt, from, to);
    ctx.strokeStyle = `rgba(${edge},${alpha})`;
    ctx.lineWidth = Math.max(1, size / 80);
    ctx.stroke();
  };
  const moonAt = t * 1.25 + look.angle * 0.35;
  const moon = (front: boolean) => {
    if (Math.sin(moonAt) > 0 !== front) return;
    const mx = Math.cos(moonAt) * rx;
    const my = Math.sin(moonAt) * ry;
    const x = c + mx * Math.cos(tilt) - my * Math.sin(tilt);
    const y = c + mx * Math.sin(tilt) + my * Math.cos(tilt);
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
  const heart = r * (0.5 + pulse * 0.07 + look.glow * 0.12 + look.open * 0.1);
  const lit = ctx.createRadialGradient(c, c, 0, c, c, heart);
  lit.addColorStop(0, "rgba(255,255,255,0.98)");
  lit.addColorStop(0.3, `rgba(${core},0.9)`);
  lit.addColorStop(1, `rgba(${core},0)`);
  ctx.fillStyle = lit;
  ctx.beginPath();
  ctx.arc(c, c, heart, 0, Math.PI * 2);
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
  ring(0, Math.PI, 0.82);
  moon(true);
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
  const look: Look = { angle: 0.9, glow: 0, open: 0, held: 0 };
  // The last thing the visitor did, said once the next time Bit is opened.
  let remark = "";
  // A small light on the badge says Bit has something to say about what the visitor just did.
  const setRemark = (text: string) => {
    remark = text;
    button.toggleAttribute("data-remark", Boolean(text));
  };

  const paint = (seconds: number) => {
    if (ctx) drawBit(ctx, canvas.width, seconds, look);
    if (portraitCtx && portrait && dialog.open) drawBit(portraitCtx, portrait.width, seconds, look);
  };
  // Bit moves while someone is there: hover, focus, an open card, or a little while after the visitor last did anything.
  const active = () => motionEnabled() && !document.hidden && (hovered || dialog.open || performance.now() < spinUntil);
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    const cheering = now < cheerUntil;
    // Turning speed: a slow idle, quicker when watched, a burst when it cheers, nearly still while it holds.
    const speed = now < heldUntil ? 0.15 : cheering ? 5.2 : hovered ? 1.7 : dialog.open ? 1.1 : 0.7;
    look.angle += speed * dt;
    look.glow *= 0.955;
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
    wake(ms + 900);
  };
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

  document.addEventListener("v44:route", (e) => {
    setRemark(ROUTE_LINES[e.detail.id] || remark);
    // A held request turns Bit red and nearly still; any lane gets a quick turn of approval.
    if (e.detail.id === "hold") {
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
    look.glow = 1;
    dialog.show();
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
    cheer(480);
  });
  goButtons.forEach((b) =>
    b.addEventListener("click", () => {
      dialog.close();
      go(b.dataset.bitGo || "arrival");
    }),
  );
}
