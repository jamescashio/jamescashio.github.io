// Original projected geometry for V42. The scene is artwork, never fleet telemetry.
const TAU = Math.PI * 2;
const points = Array.from({ length: 1800 }, (_, i) => {
  const t = i / 1800;
  const phi = Math.acos(1 - (2 * (i + 0.5)) / 1800);
  const theta = i * Math.PI * (3 - Math.sqrt(5));
  return { t, phi, theta, seed: ((i * 16807) % 2147483647) / 2147483647 };
});

export function drawContinuumField(ctx, { width, height, dpr, time, motion, pointer, mode = "orbit", turn = 0 }) {
  const compact = width / dpr < 460;
  const radius = Math.min(width * 0.28, height * 0.29);
  const cx = width * 0.5;
  const cy = height * 0.48;
  const angle = turn + (motion ? time * 0.055 : 0) + pointer.x * 0.34;
  const tilt = -0.2 + pointer.y * 0.2;
  const ca = Math.cos(angle),
    sa = Math.sin(angle),
    ct = Math.cos(tilt),
    st = Math.sin(tilt);
  const project = (x, y, z) => {
    const x1 = x * ca + z * sa;
    const z1 = z * ca - x * sa;
    const y1 = y * ct - z1 * st;
    const z2 = y * st + z1 * ct;
    const perspective = 4.8 / (4.8 - z2);
    return [cx + x1 * radius * perspective, cy + y1 * radius * perspective, perspective, z2];
  };
  ctx.save();
  const haze = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.8);
  haze.addColorStop(0, "rgba(33,132,160,.15)");
  haze.addColorStop(0.55, "rgba(16,71,98,.10)");
  haze.addColorStop(1, "rgba(3,9,18,0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, width, height);

  // A calibrated plate keeps the illustration readable even with motion paused.
  ctx.lineWidth = 0.7 * dpr;
  for (let r = 0; r < 3; r++) {
    ctx.strokeStyle = r === 1 ? "rgba(232,191,112,.28)" : "rgba(102,205,224,.13)";
    ctx.setLineDash(r === 2 ? [1 * dpr, 6 * dpr] : []);
    ctx.beginPath();
    ctx.arc(cx, cy, radius * (1.53 + r * 0.13), 0, TAU);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  for (let i = 0; i < 80; i++) {
    const a = (i / 80) * TAU;
    const r1 = radius * 1.64,
      r2 = r1 + (i % 5 === 0 ? 9 : 3) * dpr;
    ctx.strokeStyle = i % 5 === 0 ? "rgba(157,220,231,.5)" : "rgba(126,199,218,.19)";
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    ctx.stroke();
  }

  // Perspective paths are sampled in 3D; the far side is deliberately quieter.
  const ring = (r, lean, phase, gold = false) => {
    for (let i = 0; i < 160; i++) {
      const a = (i / 160) * TAU + phase;
      const b = a + TAU / 160;
      const p = project(Math.cos(a) * r, Math.sin(a) * r * Math.sin(lean), Math.sin(a) * r * Math.cos(lean));
      const q = project(Math.cos(b) * r, Math.sin(b) * r * Math.sin(lean), Math.sin(b) * r * Math.cos(lean));
      ctx.strokeStyle = gold
        ? "rgba(244,203,130," + (p[3] > 0 ? 0.65 : 0.17) + ")"
        : "rgba(109,221,238," + (p[3] > 0 ? 0.34 : 0.09) + ")";
      ctx.lineWidth = (gold ? 1.1 : 0.7) * dpr;
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(q[0], q[1]);
      ctx.stroke();
    }
  };
  ring(1.43, -0.35, 0, true);
  ring(1.3, 0.9, 0.6);
  ring(1.47, 1.75, 1.2);

  const stride = compact ? 2 : 1;
  const projected = [];
  for (let i = 0; i < points.length; i += stride) {
    const p = points[i];
    let x, y, z;
    if (mode === "signal") {
      const a = p.t * TAU * 4 + (Math.floor(i / stride) % 2) * Math.PI;
      const r = 0.63 + 0.11 * Math.sin(p.theta);
      x = Math.cos(a) * r;
      y = (p.t - 0.5) * 2.25;
      z = Math.sin(a) * r;
    } else if (mode === "constellation") {
      const a = p.t * TAU * 7;
      const r = 0.2 + Math.sqrt(p.t) * 1.15;
      x = Math.cos(a + (i % 3) * 2.094) * r;
      y = Math.sin(p.theta) * 0.22 + Math.cos(a) * 0.2;
      z = Math.sin(a + (i % 3) * 2.094) * r;
    } else {
      const r = 0.96 + 0.04 * Math.sin(p.theta * 3);
      x = Math.sin(p.phi) * Math.cos(p.theta) * r;
      y = Math.cos(p.phi) * r;
      z = Math.sin(p.phi) * Math.sin(p.theta) * r;
    }
    projected.push({ p: project(x, y, z), gold: i % 11 < 2, i });
  }
  projected.sort((a, b) => a.p[3] - b.p[3]);
  for (const { p, gold, i } of projected) {
    const light = Math.max(0.13, Math.min(0.92, 0.33 + (p[3] + 1.2) * 0.23));
    const size = (i % 17 === 0 ? 1.65 : 0.8) * dpr * p[2];
    ctx.fillStyle = gold ? "rgba(255,218,155," + light + ")" : "rgba(129,229,246," + light + ")";
    ctx.fillRect(p[0], p[1], size, size);
    if (i % 121 === 0 && p[3] > 0) {
      ctx.strokeStyle = "rgba(198,246,255,.3)";
      ctx.beginPath();
      ctx.moveTo(p[0] - 4 * dpr, p[1]);
      ctx.lineTo(p[0] + 4 * dpr, p[1]);
      ctx.moveTo(p[0], p[1] - 4 * dpr);
      ctx.lineTo(p[0], p[1] + 4 * dpr);
      ctx.stroke();
    }
  }
  // Four beacons evoke the four public worlds without implying real host locations.
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + 0.32 + (motion ? time * 0.045 : 0);
    const p = project(Math.cos(a) * 1.43, Math.sin(a) * -0.49, Math.sin(a) * 1.34);
    const glow = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 15 * dpr);
    glow.addColorStop(0, "rgba(255,228,172,.8)");
    glow.addColorStop(0.15, "rgba(255,204,116,.4)");
    glow.addColorStop(1, "rgba(255,193,101,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(p[0] - 15 * dpr, p[1] - 15 * dpr, 30 * dpr, 30 * dpr);
    ctx.fillStyle = "#ffe3ab";
    ctx.beginPath();
    ctx.arc(p[0], p[1], 2 * dpr, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
