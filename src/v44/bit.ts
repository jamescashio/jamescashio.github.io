import { bitJokes } from "../v40/ship-humor.ts";
import { motionEnabled, onMotionChange } from "./motion.ts";

/** Bit, the copilot: an icosahedron in platinum with a blue core, and a line for every station. */
const LINES: Record<string, string> = {
  arrival: "Welcome aboard. The gate is open and the coffee is mostly harmless.",
  cinema: "The trailer runs sixty one seconds. The cat’s review is still pending.",
  worlds: "Four worlds. I recommend the starship. I am biased; I live there.",
  workshop: "Everything here can be taken apart. Please put it back the way you found it.",
  helm: "Flip the private toggle and watch me refuse to phone the cloud.",
  evidence: "Numbers come with dates. Dates come with limits. Limits come with me.",
  doug: "He reads every message. Probably fewer than forty two a day.",
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

function drawFace(ctx: CanvasRenderingContext2D, size: number, t: number, glow: number) {
  ctx.clearRect(0, 0, size, size);
  const c = size / 2;
  const r = size * 0.36;
  const ay = t * 0.7;
  const ax = 0.5 + Math.sin(t * 0.4) * 0.2;
  const rot = (v: number[]) => {
    const x1 = v[0] * Math.cos(ay) + v[2] * Math.sin(ay);
    const z1 = -v[0] * Math.sin(ay) + v[2] * Math.cos(ay);
    const y2 = v[1] * Math.cos(ax) - z1 * Math.sin(ax);
    const z2 = v[1] * Math.sin(ax) + z1 * Math.cos(ax);
    return [x1, y2, z2];
  };
  const P = V.map(rot);
  const g = ctx.createRadialGradient(c, c, 0, c, c, r * 1.3);
  g.addColorStop(0, `rgba(53,120,255,${0.35 + glow * 0.3})`);
  g.addColorStop(1, "rgba(53,120,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const faces = F.map((f) => {
    const a = P[f[0]],
      b = P[f[1]],
      d = P[f[2]];
    const nz = (b[0] - a[0]) * (d[1] - a[1]) - (b[1] - a[1]) * (d[0] - a[0]);
    return { f, z: (a[2] + b[2] + d[2]) / 3, nz };
  }).sort((x, y) => x.z - y.z);
  for (const { f, nz } of faces) {
    if (nz < 0) continue;
    const shade = Math.min(1, 0.35 + nz * 0.55);
    ctx.beginPath();
    f.forEach((i, k) => {
      const p = P[i];
      const x = c + p[0] * r;
      const y = c - p[1] * r;
      if (k) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = `rgba(${Math.round(180 + 60 * shade)},${Math.round(188 + 58 * shade)},${Math.round(205 + 45 * shade)},${0.55 + shade * 0.35})`;
    ctx.fill();
    ctx.strokeStyle = "rgba(154,190,255,0.85)";
    ctx.lineWidth = size / 96;
    ctx.stroke();
  }
}

export function mountBit(
  button: HTMLButtonElement,
  dialog: HTMLDialogElement,
  go: (id: string) => void,
  current: () => string,
) {
  const canvas = button.querySelector("canvas")!;
  const ctx = canvas.getContext("2d");
  const line = dialog.querySelector<HTMLElement>("[data-bit-line]")!;
  let joke = 0;
  let raf = 0;
  let glow = 0;
  const loop = (now: number) => {
    if (!ctx) return;
    glow *= 0.96;
    drawFace(ctx, canvas.width, now / 1000, glow);
    if (motionEnabled() && !document.hidden) raf = requestAnimationFrame(loop);
  };
  const start = () => {
    cancelAnimationFrame(raf);
    if (motionEnabled()) raf = requestAnimationFrame(loop);
    else if (ctx) drawFace(ctx, canvas.width, 1.2, 0);
  };
  start();
  onMotionChange(start);
  document.addEventListener("visibilitychange", start);
  button.addEventListener("click", () => {
    line.textContent = LINES[current()] || LINES.arrival;
    glow = 1;
    dialog.show();
    dialog.querySelector<HTMLButtonElement>("[data-bit-close]")?.focus();
  });
  dialog.querySelector("[data-bit-close]")?.addEventListener("click", () => {
    dialog.close();
    button.focus();
  });
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      dialog.close();
      button.focus();
    }
  });
  dialog.querySelector("[data-bit-joke]")?.addEventListener("click", () => {
    line.textContent = bitJokes[joke++ % bitJokes.length];
    glow = 1;
  });
  dialog.querySelectorAll<HTMLButtonElement>("[data-bit-go]").forEach((b) =>
    b.addEventListener("click", () => {
      dialog.close();
      go(b.dataset.bitGo || "arrival");
    }),
  );
}
