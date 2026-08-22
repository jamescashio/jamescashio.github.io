import { useEffect, useRef } from "react";
import { POS } from "@/lib/content";

const SHORT = ["HERMES", "ESCALATION", "EXPOSURE", "SOVEREIGN", "ZEUSAPOLLO", "SHOP FLOOR", "GRAPHIFY"];
const CYAN = "0,249,255";
const AMBER = "255,149,0";

type Pt = { x: number; y: number; i: number };

function hull(pts: readonly [number, number][]): Pt[] {
  const p: Pt[] = pts.map((xy, i) => ({ x: xy[0], y: xy[1], i })).sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: Pt, a: Pt, b: Pt) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: Pt[] = [];
  for (const pt of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pt) <= 0) lower.pop();
    lower.push(pt);
  }
  const upper: Pt[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const pt = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pt) <= 0) upper.pop();
    upper.push(pt);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

const HULL = hull(POS);

export function BuildEnvelope({ sel, onLock }: { sel: number; onLock: (i: number) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const selRef = useRef(sel);
  selRef.current = sel;
  const hoverRef = useRef(-1);
  const aim = useRef({ x: POS[sel][0], y: POS[sel][1] });
  const tgt = useRef({ x: POS[sel][0], y: POS[sel][1] });
  const vel = useRef({ x: 0, y: 0 });
  const flash = useRef(0);
  const trail = useRef<{ x: number; y: number }[]>([]);

  useEffect(() => {
    tgt.current = { x: POS[sel][0], y: POS[sel][1] };
    flash.current = 1;
  }, [sel]);

  useEffect(() => {
    const el = wrap.current;
    const c = canvas.current;
    if (!el || !c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();

    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = el.clientWidth;
      const h = el.clientHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);

    const pad = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      return { w, h, l: 64, r: 36, t: 40, b: 40 };
    };
    const xy = (px: number, py: number) => {
      const p = pad();
      return [p.l + (px / 100) * (p.w - p.l - p.r), p.t + (py / 100) * (p.h - p.t - p.b)] as const;
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const p = pad();
      const { w, h } = p;
      if (reduce) {
        aim.current.x = tgt.current.x;
        aim.current.y = tgt.current.y;
        vel.current.x = 0;
        vel.current.y = 0;
        flash.current = 0;
      } else {
        const sx = (tgt.current.x - aim.current.x) * 78 - vel.current.x * 9.2;
        const sy = (tgt.current.y - aim.current.y) * 78 - vel.current.y * 9.2;
        vel.current.x += sx * dt;
        vel.current.y += sy * dt;
        aim.current.x += vel.current.x * dt;
        aim.current.y += vel.current.y * dt;
        flash.current *= Math.exp(-dt * 3.4);
      }

      ctx.clearRect(0, 0, w, h);

      // field
      const g = ctx.createRadialGradient(w * 0.55, h * 0.42, 20, w * 0.55, h * 0.42, Math.max(w, h) * 0.7);
      g.addColorStop(0, "rgba(0, 30, 40, 0.35)");
      g.addColorStop(1, "rgba(5, 6, 10, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // grid
      ctx.save();
      ctx.beginPath();
      ctx.rect(p.l, p.t, w - p.l - p.r, h - p.t - p.b);
      ctx.clip();
      const scanY = p.t + ((now / 4200) % 1) * (h - p.t - p.b);
      for (let i = 0; i <= 8; i++) {
        const x = p.l + (i / 8) * (w - p.l - p.r);
        ctx.strokeStyle = `rgba(${CYAN}, 0.08)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, p.t);
        ctx.lineTo(x, h - p.b);
        ctx.stroke();
      }
      for (let i = 0; i <= 6; i++) {
        const y = p.t + (i / 6) * (h - p.t - p.b);
        const glow = 1 - Math.min(1, Math.abs(y - scanY) / 48);
        ctx.strokeStyle = `rgba(${CYAN}, ${0.07 + glow * 0.22})`;
        ctx.lineWidth = glow > 0.4 ? 1.4 : 1;
        ctx.beginPath();
        ctx.moveTo(p.l, y);
        ctx.lineTo(w - p.r, y);
        ctx.stroke();
      }
      if (!reduce) {
        const sg = ctx.createLinearGradient(0, scanY - 28, 0, scanY + 28);
        sg.addColorStop(0, "rgba(0,249,255,0)");
        sg.addColorStop(0.5, "rgba(0,249,255,0.10)");
        sg.addColorStop(1, "rgba(0,249,255,0)");
        ctx.fillStyle = sg;
        ctx.fillRect(p.l, scanY - 28, w - p.l - p.r, 56);
      }

      // envelope hull
      ctx.beginPath();
      HULL.forEach((pt, i) => {
        const [x, y] = xy(pt.x, pt.y);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = "rgba(0,249,255,0.045)";
      ctx.fill();
      ctx.strokeStyle = `rgba(${CYAN}, 0.55)`;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 7]);
      ctx.lineDashOffset = reduce ? 0 : -(now / 28);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = `rgba(${CYAN}, 0.18)`;
      ctx.lineWidth = 4;
      ctx.stroke();

      const locked = selRef.current;
      const [lx, ly] = xy(POS[locked][0], POS[locked][1]);
      const [ax, ay] = xy(aim.current.x, aim.current.y);

      if (!reduce) {
        trail.current.push({ x: ax, y: ay });
        if (trail.current.length > 16) trail.current.shift();
        trail.current.forEach((pt, i) => {
          const a = (i / trail.current.length) * 0.35;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${AMBER}, ${a})`;
          ctx.fill();
        });
      }

      if (flash.current > 0.03) {
        ctx.beginPath();
        ctx.arc(lx, ly, 14 + (1 - flash.current) * 56, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${AMBER}, ${flash.current * 0.85})`;
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(lx, ly, 8 + (1 - flash.current) * 28, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${CYAN}, ${flash.current * 0.45})`;
        ctx.stroke();
      }

      // spokes from lock
      POS.forEach((pt, i) => {
        if (i === locked) return;
        const [x, y] = xy(pt[0], pt[1]);
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(x, y);
        ctx.strokeStyle = `rgba(${AMBER}, ${i === hoverRef.current ? 0.28 : 0.08})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // nodes
      POS.forEach((pt, i) => {
        const [x, y] = xy(pt[0], pt[1]);
        const on = i === locked;
        const hot = i === hoverRef.current;
        const pulse = reduce ? 1 : 0.65 + Math.sin(now / 420 + i) * 0.35;
        ctx.beginPath();
        ctx.arc(x, y, on ? 16 : 11, 0, Math.PI * 2);
        ctx.strokeStyle = on ? `rgba(${AMBER}, 0.7)` : `rgba(${CYAN}, ${0.28 + pulse * 0.25})`;
        ctx.lineWidth = on ? 1.6 : 1;
        ctx.stroke();
        if (on) {
          ctx.beginPath();
          ctx.arc(x, y, 22 + pulse * 3, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${AMBER}, 0.22)`;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(x, y, on ? 4.5 : 3.2, 0, Math.PI * 2);
        ctx.fillStyle = on ? `rgb(${AMBER})` : `rgba(${CYAN}, ${hot ? 1 : 0.85})`;
        ctx.shadowColor = on ? `rgb(${AMBER})` : `rgb(${CYAN})`;
        ctx.shadowBlur = on ? 16 : 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        const label = SHORT[i];
        ctx.font = "600 10px 'JetBrains Mono', ui-monospace, monospace";
        ctx.textBaseline = "middle";
        const right = pt[0] < 72;
        ctx.textAlign = right ? "left" : "right";
        const tx = x + (right ? 18 : -18);
        const ty = y - (on ? 2 : 0);
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = "rgba(5,6,10,0.72)";
        ctx.fillRect(right ? tx - 4 : tx - tw - 4, ty - 8, tw + 8, 16);
        ctx.fillStyle = on ? `rgb(${AMBER})` : hot ? "#e8f6ff" : "rgba(180,210,220,0.82)";
        ctx.fillText(label, tx, ty);
      });

      // slewing reticle
      const rot = reduce ? 0 : now / 1800;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.strokeStyle = `rgba(${AMBER}, 0.9)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.rotate(rot);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(28, 10);
        ctx.lineTo(28, 28);
        ctx.lineTo(10, 28);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -34);
        ctx.lineTo(0, -28);
        ctx.stroke();
      }
      ctx.restore();

      // lead line from reticle to lock if still slewing
      const dist = Math.hypot(ax - lx, ay - ly);
      if (dist > 6) {
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(lx, ly);
        ctx.strokeStyle = `rgba(${AMBER}, 0.45)`;
        ctx.setLineDash([3, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();

      // chrome labels
      ctx.font = "500 10px 'JetBrains Mono', ui-monospace, monospace";
      ctx.fillStyle = "rgba(0,249,255,0.55)";
      ctx.textAlign = "left";
      ctx.fillText("AUTONOMY →", p.l, 22);
      ctx.save();
      ctx.translate(18, h - p.b);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("↑ CONSEQUENCE", 0, 0);
      ctx.restore();
      ctx.textAlign = "right";
      const slewing = Math.hypot(ax - lx, ay - ly) > 10;
      ctx.fillStyle = slewing ? `rgba(${CYAN}, 0.9)` : `rgba(${AMBER}, 0.9)`;
      ctx.fillText(
        `${slewing ? "SLEWING" : "LOCKED"}  ·  ${String(locked + 1).padStart(2, "0")}  ${SHORT[locked]}  ·  ${POS[locked][0].toFixed(0)}/${POS[locked][1].toFixed(0)}`,
        w - 16,
        22,
      );
    };
    raf = requestAnimationFrame(loop);

    const hit = (ev: PointerEvent) => {
      const r = c.getBoundingClientRect();
      const px = ev.clientX - r.left;
      const py = ev.clientY - r.top;
      let best = -1;
      let bestD = 28;
      POS.forEach((pt, i) => {
        const [x, y] = xy(pt[0], pt[1]);
        const d = Math.hypot(px - x, py - y);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    };
    const onMove = (ev: PointerEvent) => {
      hoverRef.current = hit(ev);
      c.style.cursor = hoverRef.current >= 0 ? "pointer" : "crosshair";
    };
    const onDown = (ev: PointerEvent) => {
      const i = hit(ev);
      if (i >= 0) onLock(i);
    };
    c.addEventListener("pointermove", onMove);
    c.addEventListener("pointerdown", onDown);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      c.removeEventListener("pointermove", onMove);
      c.removeEventListener("pointerdown", onDown);
    };
  }, [onLock]);

  return (
    <div ref={wrap} className="relative min-h-[440px] h-[min(56vh,560px)] overflow-hidden rounded-[var(--radius-xl)] border border-line bg-void-2/90">
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-label="Test article envelope" />
    </div>
  );
}
