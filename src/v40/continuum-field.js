// Original perspective light sculpture. This is artwork, never operational telemetry.
const TAU = Math.PI * 2;
const COUNT = 3200;
const particles = Array.from({ length: COUNT }, (_, i) => ({
  t: i / COUNT,
  a: i * Math.PI * (3 - Math.sqrt(5)),
  band: i % 4,
  noise: Math.sin(i * 12.9898) * Math.cos(i * 4.1414),
}));
const scenes = new WeakMap();
function position(p, mode, phase) {
  if (mode === "signal") {
    const a = p.t * TAU * 3.5 + (p.band % 2) * Math.PI + phase * 0.4;
    const radius = 0.6 + p.noise * 0.055;
    return [Math.cos(a) * radius, (p.t - 0.5) * 2.7, Math.sin(a) * radius];
  }
  if (mode === "constellation") {
    const radius = 0.1 + Math.pow(p.t, 0.55) * 1.3;
    const a = p.t * TAU * 2.3 + (p.band * Math.PI) / 2 + phase * 0.22;
    return [Math.cos(a) * radius, p.noise * 0.12 + Math.sin(p.a) * p.t * 0.12, Math.sin(a) * radius];
  }
  const a = p.t * TAU * 2 + phase * 0.15;
  const tube = p.a + phase * 0.07;
  const radius = 1.1 + 0.09 * Math.cos(tube);
  return [
    Math.cos(a) * radius,
    Math.sin(a) * 0.52 + Math.sin(tube) * 0.08,
    Math.sin(a) * radius * 0.55 + Math.cos(tube) * 0.08,
  ];
}
export function drawContinuumField(ctx, { width, height, dpr, time, motion, pointer, mode = "orbit", turn = 0 }) {
  const compact = width / dpr < 760;
  const cx = width * (compact ? 0.5 : 0.755),
    cy = height * (compact ? 0.48 : 0.43);
  const radius = Math.min(width * (compact ? 0.29 : 0.19), height * (compact ? 0.33 : 0.37));
  const phase = motion ? time : 0;
  let scene = scenes.get(ctx);
  if (!scene) {
    scene = { mode, previous: mode, since: time };
    scenes.set(ctx, scene);
  }
  if (scene.mode !== mode) {
    scene.previous = scene.mode;
    scene.mode = mode;
    scene.since = time;
  }
  const morph = motion ? Math.min(1, Math.max(0, (time - scene.since) / 0.7)) : 1;
  const blend = morph * morph * (3 - 2 * morph);
  const angle = turn + phase * 0.045 + pointer.x * 0.45;
  const tilt = (mode === "constellation" ? -0.64 : -0.16) + pointer.y * 0.25;
  const ca = Math.cos(angle),
    sa = Math.sin(angle),
    ct = Math.cos(tilt),
    st = Math.sin(tilt);
  const project = (x, y, z) => {
    const x1 = x * ca + z * sa,
      z1 = z * ca - x * sa;
    const y1 = y * ct - z1 * st,
      z2 = y * st + z1 * ct;
    const perspective = 4.4 / (4.4 - z2);
    return [cx + x1 * radius * perspective, cy + y1 * radius * perspective, z2, perspective];
  };
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  if (mode !== "orbit") {
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.8);
    glow.addColorStop(0, "rgba(184, 144, 50,.19)");
    glow.addColorStop(0.45, "rgba(145, 106, 15,.12)");
    glow.addColorStop(1, "rgba(0, 0, 0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }
  // Thin calibrated rings remain quieter than the sculptural particle form.
  ctx.lineWidth = 0.65 * dpr;
  for (let k = 0; k < 2; k++) {
    ctx.strokeStyle = k ? "rgba(233, 217, 178,.24)" : "rgba(227, 193, 113,.11)";
    ctx.setLineDash(k ? [1 * dpr, 9 * dpr] : []);
    ctx.beginPath();
    ctx.arc(cx, cy, radius * (1.45 + k * 0.13), 0, TAU);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * TAU,
      r = radius * 1.58;
    ctx.strokeStyle = i % 6 ? "rgba(230, 202, 137,.15)" : "rgba(229, 207, 161,.5)";
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.lineTo(cx + Math.cos(a) * (r + (i % 6 ? 3 : 10) * dpr), cy + Math.sin(a) * (r + (i % 6 ? 3 : 10) * dpr));
    ctx.stroke();
  }
  const lines = mode === "signal" ? 46 : 3;
  for (let l = 0; l < lines; l++) {
    const rib = mode === "signal";
    const segments = rib ? 16 : 150;
    for (let i = 0; i < segments; i++) {
      const coords = (j) => {
        if (rib) {
          const t = l / (lines - 1),
            a = t * TAU * 3.5 + phase * 0.4;
          const f = (j / segments) * 2 - 1;
          return project(Math.cos(a) * 0.6 * f, (t - 0.5) * 2.7, Math.sin(a) * 0.6 * f);
        }
        const a = (j / segments) * TAU + l * 0.2;
        return project(
          Math.cos(a) * (1.22 + l * 0.15),
          Math.sin(a) * (l === 1 ? -0.72 : 0.32 + l * 0.15),
          Math.sin(a) * (1 + l * 0.15),
        );
      };
      const p = coords(i),
        q = coords(i + 1),
        alpha = (p[2] > 0 ? 0.85 : 0.24) * (rib ? 0.8 : 1);
      ctx.strokeStyle = l % 2 ? "rgba(255, 212, 144," + alpha + ")" : "rgba(255, 199, 68," + alpha + ")";
      ctx.lineWidth = (l === 1 && !rib ? 1.4 : 0.9) * dpr;
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(q[0], q[1]);
      ctx.stroke();
    }
  }
  const projected = [];
  const stride = compact ? 3 : 1;
  for (let i = 0; i < COUNT; i += stride) {
    const p = particles[i],
      to = position(p, mode, phase),
      from = blend < 1 ? position(p, scene.previous, phase) : to;
    const q = project(...to.map((v, k) => from[k] + (v - from[k]) * blend));
    projected.push({ q, i, gold: i % 9 < 3 });
  }
  projected.sort((a, b) => a.q[2] - b.q[2]);
  for (const { q, i, gold } of projected) {
    const alpha = Math.max(0.24, Math.min(0.98, 0.58 + q[2] * 0.3));
    const size = (i % 37 === 0 ? 1.6 : 0.8) * dpr * q[3];
    ctx.fillStyle = gold ? "rgba(255, 218, 157," + alpha + ")" : "rgba(255, 206, 92," + alpha + ")";
    ctx.fillRect(q[0], q[1], size, size);
    if (i % 97 === 0 && q[2] > 0) {
      ctx.strokeStyle = "rgba(242, 237, 227,.45)";
      ctx.lineWidth = 0.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(q[0] - 5 * dpr, q[1]);
      ctx.lineTo(q[0] + 5 * dpr, q[1]);
      ctx.moveTo(q[0], q[1] - 5 * dpr);
      ctx.lineTo(q[0], q[1] + 5 * dpr);
      ctx.stroke();
    }
  }
  // Four luminous waypoints echo the four fictional worlds.
  for (let i = 0; i < 4; i++) {
    const a = (i * TAU) / 4 + phase * 0.045;
    const p = project(Math.cos(a) * 1.5, Math.sin(a) * 0.5, Math.sin(a) * 1.3);
    const glow = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 20 * dpr);
    glow.addColorStop(0, "rgba(255, 238, 194,.9)");
    glow.addColorStop(0.12, "rgba(255, 207, 123,.55)");
    glow.addColorStop(1, "rgba(255, 190, 95,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(p[0] - 20 * dpr, p[1] - 20 * dpr, 40 * dpr, 40 * dpr);
    ctx.fillStyle = "#fff0ce";
    ctx.beginPath();
    ctx.arc(p[0], p[1], 1.8 * dpr, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
