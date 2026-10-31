// Authored atmosphere for the existing bounded hero canvas. These paths are decorative.
export function drawOrbitalField(ctx, { width, height, dpr, time, motion, pointer }) {
  const narrow = width / dpr < 760;
  const cx = width * (narrow ? 0.76 : 0.7) + pointer.x * 16 * dpr;
  const cy = height * 0.48 + pointer.y * 12 * dpr;
  const radius = Math.min(width * (narrow ? 0.8 : 0.39), height * 0.77);
  const phase = motion ? time * 0.026 : 0;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.36);
  for (let ring = 0; ring < 3; ring++) {
    const rx = radius * (1 + ring * 0.16);
    const ry = radius * (0.31 + ring * 0.055);
    ctx.lineWidth = dpr * (ring === 1 ? 0.8 : 0.5);
    ctx.strokeStyle = ring === 1 ? "rgba(255,197,107,.26)" : "rgba(118,232,244,.24)";
    ctx.setLineDash(ring === 2 ? [2 * dpr, 10 * dpr] : []);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // A short illuminated arc carries the eye through the quiet orbital path.
    const leadingAngle = phase * (ring % 2 ? -1 : 1) + ring * 1.8;
    for (let trail = 0; trail < 6; trail++) {
      const alpha = (6 - trail) * 0.055;
      ctx.strokeStyle = ring === 1 ? `rgba(255,211,143,${alpha})` : `rgba(174,244,255,${alpha})`;
      ctx.lineWidth = 1.2 * dpr;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, leadingAngle - trail * 0.045, leadingAngle - trail * 0.045 + 0.045);
      ctx.stroke();
    }

    const count = narrow ? 20 : 36;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + phase * (ring % 2 ? -1 : 1) + ring * 0.8;
      const depth = (Math.sin(angle) + 1) / 2;
      const x = Math.cos(angle) * rx;
      const y = Math.sin(angle) * ry;
      const alpha = 0.16 + depth * 0.58;
      ctx.fillStyle = ring === 1 ? `rgba(255,205,128,${alpha})` : `rgba(160,244,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, (0.55 + depth * 1.15) * dpr, 0, Math.PI * 2);
      ctx.fill();
      if (i % 12 === 0) {
        ctx.strokeStyle = `rgba(139,237,251,${alpha * 0.35})`;
        ctx.lineWidth = 0.6 * dpr;
        ctx.beginPath();
        ctx.arc(x, y, 4.5 * dpr, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  ctx.restore();

  if (!narrow) {
    ctx.strokeStyle = "rgba(130,215,232,.12)";
    ctx.lineWidth = 0.6 * dpr;
    const x = width * 0.91;
    const y = height * 0.18;
    ctx.beginPath();
    ctx.moveTo(x - 30 * dpr, y);
    ctx.lineTo(x + 30 * dpr, y);
    ctx.moveTo(x, y - 30 * dpr);
    ctx.lineTo(x, y + 30 * dpr);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 18 * dpr, 0, Math.PI * 2);
    ctx.stroke();
  }
}
