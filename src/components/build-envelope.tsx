import { useEffect, useRef } from "react";
import { deckAnimationState, frameDeltaSeconds } from "@/lib/animation-timing";
import { POS } from "@/lib/content";

const SHORT = ["HERMES", "ESCALATION", "EXPOSURE", "SOVEREIGN", "ZEUSAPOLLO", "SHOP FLOOR", "GRAPHIFY"];
const TEST_ROUTE = [0, 2, 1, 3, 5, 4, 6, 0] as const;
const OUTER_ROUTE = [2, 1, 3, 5, 4, 6] as const;
const CYAN = "0,249,255";
const AMBER = "255,149,0";

type Point = { x: number; y: number };
type Frame = { w: number; h: number; l: number; r: number; t: number; b: number };
type RoutePoint = Point & { angle: number; leg: number; local: number };

function routePoint(points: Point[], progress: number): RoutePoint {
  const span = points.length - 1;
  const wrapped = ((progress % 1) + 1) % 1;
  const scaled = wrapped * span;
  const leg = Math.min(span - 1, Math.floor(scaled));
  const raw = scaled - leg;
  const local = raw * raw * (3 - 2 * raw);
  const a = points[leg];
  const b = points[leg + 1];
  return {
    x: a.x + (b.x - a.x) * local,
    y: a.y + (b.y - a.y) * local,
    angle: Math.atan2(b.y - a.y, b.x - a.x),
    leg,
    local: raw,
  };
}

function quadraticPoint(a: Point, c: Point, b: Point, t: number): Point {
  const inv = 1 - t;
  return {
    x: inv * inv * a.x + 2 * inv * t * c.x + t * t * b.x,
    y: inv * inv * a.y + 2 * inv * t * c.y + t * t * b.y,
  };
}

function drawRangeSweep(ctx: CanvasRenderingContext2D, frame: Frame, hub: Point, now: number, reduce: boolean) {
  const radius = Math.hypot(frame.w, frame.h) * 0.68;
  ctx.save();
  ctx.beginPath();
  ctx.rect(frame.l, frame.t, frame.w - frame.l - frame.r, frame.h - frame.t - frame.b);
  ctx.clip();

  for (let i = 1; i <= 4; i++) {
    ctx.beginPath();
    ctx.arc(hub.x, hub.y, (radius * i) / 5, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${CYAN}, ${i === 3 ? 0.09 : 0.045})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  if (!reduce) {
    const angle = now / 1750;
    const beam = 0.12;
    const gradient = ctx.createRadialGradient(hub.x, hub.y, 0, hub.x, hub.y, radius);
    gradient.addColorStop(0, `rgba(${CYAN}, 0.16)`);
    gradient.addColorStop(0.55, `rgba(${CYAN}, 0.065)`);
    gradient.addColorStop(1, `rgba(${CYAN}, 0)`);
    ctx.beginPath();
    ctx.moveTo(hub.x, hub.y);
    ctx.arc(hub.x, hub.y, radius, angle - beam, angle + beam);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hub.x, hub.y);
    ctx.lineTo(hub.x + Math.cos(angle + beam) * radius, hub.y + Math.sin(angle + beam) * radius);
    ctx.strokeStyle = `rgba(${CYAN}, 0.28)`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

function drawTargetVector(
  ctx: CanvasRenderingContext2D,
  origin: Point,
  target: Point,
  selected: number,
  now: number,
  reduce: boolean,
) {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const distance = Math.hypot(dx, dy);

  if (distance < 4) {
    const ring = reduce ? 42 : 39 + Math.sin(now / 360) * 4;
    ctx.beginPath();
    ctx.arc(target.x, target.y, ring, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${AMBER}, 0.58)`;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([3, 7]);
    ctx.lineDashOffset = reduce ? 0 : -now / 24;
    ctx.stroke();
    ctx.setLineDash([]);
    return;
  }

  const bend = Math.min(34, Math.max(14, distance * 0.16)) * (selected % 2 === 0 ? 1 : -1);
  const control = {
    x: (origin.x + target.x) / 2 - (dy / distance) * bend,
    y: (origin.y + target.y) / 2 + (dx / distance) * bend,
  };

  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.quadraticCurveTo(control.x, control.y, target.x, target.y);
  ctx.strokeStyle = "rgba(2, 5, 8, 0.88)";
  ctx.lineWidth = 8;
  ctx.stroke();

  const vectorGradient = ctx.createLinearGradient(origin.x, origin.y, target.x, target.y);
  vectorGradient.addColorStop(0, `rgba(${CYAN}, 0.28)`);
  vectorGradient.addColorStop(0.62, `rgba(${AMBER}, 0.72)`);
  vectorGradient.addColorStop(1, `rgba(${AMBER}, 1)`);
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.quadraticCurveTo(control.x, control.y, target.x, target.y);
  ctx.strokeStyle = vectorGradient;
  ctx.lineWidth = 1.7;
  ctx.setLineDash([11, 7]);
  ctx.lineDashOffset = reduce ? 0 : -now / 22;
  ctx.shadowColor = `rgb(${AMBER})`;
  ctx.shadowBlur = 9;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.setLineDash([]);

  if (!reduce) {
    for (let i = 0; i < 3; i++) {
      const t = (now / 1650 + i / 3) % 1;
      const point = quadraticPoint(origin, control, target, t);
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2.2 + i * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${AMBER}, ${0.45 + i * 0.18})`;
      ctx.shadowColor = `rgb(${AMBER})`;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

function drawPatrol(ctx: CanvasRenderingContext2D, points: Point[], now: number, reduce: boolean) {
  ctx.beginPath();
  points.forEach((point, i) => {
    if (i === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.strokeStyle = "rgba(1, 4, 7, 0.94)";
  ctx.lineWidth = 7;
  ctx.stroke();

  ctx.beginPath();
  points.forEach((point, i) => {
    if (i === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.strokeStyle = `rgba(${CYAN}, 0.46)`;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 9]);
  ctx.lineDashOffset = reduce ? 0 : -now / 27;
  ctx.stroke();
  ctx.setLineDash([]);

  if (reduce) return { leg: 0 };

  const progress = (now % 10800) / 10800;
  const craft = routePoint(points, progress);
  const tailCount = 22;
  for (let i = tailCount; i > 0; i--) {
    const older = routePoint(points, progress - i * 0.0022);
    const newer = routePoint(points, progress - (i - 1) * 0.0022);
    const strength = 1 - i / tailCount;
    ctx.beginPath();
    ctx.moveTo(older.x, older.y);
    ctx.lineTo(newer.x, newer.y);
    ctx.strokeStyle = `rgba(${CYAN}, ${strength * strength * 0.74})`;
    ctx.lineWidth = 0.7 + strength * 4.2;
    ctx.stroke();
  }

  const departure = points[craft.leg];
  if (craft.local < 0.52) {
    const phase = craft.local / 0.52;
    ctx.beginPath();
    ctx.arc(departure.x, departure.y, 9 + phase * 38, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${CYAN}, ${(1 - phase) * 0.48})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(craft.x, craft.y);
  ctx.rotate(craft.angle);
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(-8, -5.5);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-8, 5.5);
  ctx.closePath();
  ctx.fillStyle = "#e8f6ff";
  ctx.shadowColor = `rgb(${CYAN})`;
  ctx.shadowBlur = 16;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(-5, 0);
  ctx.lineTo(-15, 0);
  ctx.strokeStyle = `rgba(${AMBER}, 0.9)`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  return { leg: craft.leg };
}

export function BuildEnvelope({ sel, onLock }: { sel: number; onLock: (i: number) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const redraw = useRef<() => void>(() => undefined);
  const selRef = useRef(sel);
  selRef.current = sel;
  const hoverRef = useRef(-1);
  const aim = useRef({ x: POS[sel][0], y: POS[sel][1] });
  const target = useRef({ x: POS[sel][0], y: POS[sel][1] });
  const velocity = useRef({ x: 0, y: 0 });
  const flash = useRef(0);

  useEffect(() => {
    target.current = { x: POS[sel][0], y: POS[sel][1] };
    flash.current = 1;
    redraw.current();
  }, [sel]);

  useEffect(() => {
    const el = wrap.current;
    const c = canvas.current;
    if (!el || !c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduce = motion.matches;
    let inViewport = false;
    let deckActive = false;
    let raf = 0;
    let last = performance.now();

    const frame = (): Frame => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const compact = w < 520;
      return { w, h, l: compact ? 46 : 64, r: compact ? 22 : 36, t: compact ? 54 : 48, b: 48 };
    };
    const xy = (px: number, py: number, f = frame()): Point => ({
      x: f.l + (px / 100) * (f.w - f.l - f.r),
      y: f.t + (py / 100) * (f.h - f.t - f.b),
    });

    const draw = (now: number) => {
      const dt = frameDeltaSeconds(now, last);
      last = now;
      const f = frame();
      const compact = f.w < 520;
      const fieldWidth = f.w - f.l - f.r;
      const fieldHeight = f.h - f.t - f.b;
      const locked = selRef.current;
      const lockedPoint = xy(POS[locked][0], POS[locked][1], f);
      const hub = xy(POS[0][0], POS[0][1], f);

      if (reduce) {
        aim.current.x = target.current.x;
        aim.current.y = target.current.y;
        velocity.current.x = 0;
        velocity.current.y = 0;
        flash.current = 0;
      } else {
        const sx = (target.current.x - aim.current.x) * 82 - velocity.current.x * 9.6;
        const sy = (target.current.y - aim.current.y) * 82 - velocity.current.y * 9.6;
        velocity.current.x += sx * dt;
        velocity.current.y += sy * dt;
        aim.current.x += velocity.current.x * dt;
        aim.current.y += velocity.current.y * dt;
        flash.current *= Math.exp(-dt * 3.1);
      }

      const aimPoint = xy(aim.current.x, aim.current.y, f);
      ctx.clearRect(0, 0, f.w, f.h);

      const field = ctx.createRadialGradient(hub.x, hub.y, 18, hub.x, hub.y, Math.max(f.w, f.h) * 0.72);
      field.addColorStop(0, "rgba(0, 49, 58, 0.34)");
      field.addColorStop(0.48, "rgba(0, 20, 30, 0.18)");
      field.addColorStop(1, "rgba(5, 6, 10, 0)");
      ctx.fillStyle = field;
      ctx.fillRect(0, 0, f.w, f.h);

      ctx.save();
      ctx.beginPath();
      ctx.rect(f.l, f.t, fieldWidth, fieldHeight);
      ctx.clip();
      const scanY = reduce ? f.t + fieldHeight * 0.52 : f.t + ((now / 3600) % 1) * fieldHeight;
      for (let i = 0; i <= 10; i++) {
        const x = f.l + (i / 10) * fieldWidth;
        ctx.beginPath();
        ctx.moveTo(x, f.t);
        ctx.lineTo(x, f.h - f.b);
        ctx.strokeStyle = `rgba(${CYAN}, ${i % 5 === 0 ? 0.115 : 0.055})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      for (let i = 0; i <= 7; i++) {
        const y = f.t + (i / 7) * fieldHeight;
        const proximity = reduce ? 0 : 1 - Math.min(1, Math.abs(y - scanY) / 52);
        ctx.beginPath();
        ctx.moveTo(f.l, y);
        ctx.lineTo(f.w - f.r, y);
        ctx.strokeStyle = `rgba(${CYAN}, ${0.055 + proximity * 0.2})`;
        ctx.lineWidth = proximity > 0.48 ? 1.4 : 1;
        ctx.stroke();
      }
      if (!reduce) {
        const scan = ctx.createLinearGradient(0, scanY - 34, 0, scanY + 34);
        scan.addColorStop(0, `rgba(${CYAN}, 0)`);
        scan.addColorStop(0.48, `rgba(${CYAN}, 0.11)`);
        scan.addColorStop(0.5, `rgba(${CYAN}, 0.24)`);
        scan.addColorStop(0.52, `rgba(${CYAN}, 0.11)`);
        scan.addColorStop(1, `rgba(${CYAN}, 0)`);
        ctx.fillStyle = scan;
        ctx.fillRect(f.l, scanY - 34, fieldWidth, 68);
      }

      drawRangeSweep(ctx, f, hub, now, reduce);

      const outer = OUTER_ROUTE.map((i) => xy(POS[i][0], POS[i][1], f));
      ctx.beginPath();
      outer.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      const envelopeFill = ctx.createLinearGradient(f.l, f.t, f.w - f.r, f.h - f.b);
      envelopeFill.addColorStop(0, `rgba(${CYAN}, 0.018)`);
      envelopeFill.addColorStop(0.55, `rgba(${CYAN}, 0.065)`);
      envelopeFill.addColorStop(1, `rgba(${AMBER}, 0.025)`);
      ctx.fillStyle = envelopeFill;
      ctx.fill();
      ctx.strokeStyle = `rgba(${CYAN}, 0.12)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      const route = TEST_ROUTE.map((i) => xy(POS[i][0], POS[i][1], f));
      drawTargetVector(ctx, hub, lockedPoint, locked, now, reduce);
      const patrol = drawPatrol(ctx, route, now, reduce);

      POS.forEach((point, i) => {
        const node = xy(point[0], point[1], f);
        const selected = i === locked;
        const hovered = i === hoverRef.current;
        const pulse = reduce ? 0 : (Math.sin(now / 430 + i * 0.9) + 1) / 2;

        if (i === 0) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 31 + pulse * 2.5, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${AMBER}, ${selected ? 0.48 : 0.24})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 6]);
          ctx.lineDashOffset = reduce ? 0 : now / 34;
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.save();
          ctx.translate(node.x, node.y);
          ctx.rotate(reduce ? Math.PI / 4 : -now / 2400);
          ctx.strokeStyle = `rgba(${AMBER}, ${selected ? 0.82 : 0.48})`;
          ctx.lineWidth = 1.3;
          ctx.strokeRect(-17, -17, 34, 34);
          ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, selected ? 15 : 10, 0, Math.PI * 2);
        ctx.strokeStyle = selected ? `rgba(${AMBER}, 0.88)` : `rgba(${CYAN}, ${hovered ? 0.82 : 0.34 + pulse * 0.2})`;
        ctx.lineWidth = selected ? 1.8 : 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(node.x, node.y, selected ? 4.8 : 3.2, 0, Math.PI * 2);
        ctx.fillStyle = selected ? `rgb(${AMBER})` : hovered ? "#e8f6ff" : `rgba(${CYAN}, 0.9)`;
        ctx.shadowColor = selected ? `rgb(${AMBER})` : `rgb(${CYAN})`;
        ctx.shadowBlur = selected ? 18 : hovered ? 14 : 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        const label = `${String(i + 1).padStart(2, "0")}  ${SHORT[i]}`;
        ctx.font = `600 ${compact ? 8 : 9}px 'JetBrains Mono', ui-monospace, monospace`;
        ctx.textBaseline = "middle";
        const placeRight = point[0] < 69;
        ctx.textAlign = placeRight ? "left" : "right";
        const tx = node.x + (placeRight ? 17 : -17);
        const ty = node.y - (selected ? 1 : 0);
        const width = ctx.measureText(label).width;
        ctx.fillStyle = "rgba(4, 7, 12, 0.82)";
        ctx.fillRect(placeRight ? tx - 4 : tx - width - 4, ty - 8, width + 8, 16);
        ctx.fillStyle = selected ? `rgb(${AMBER})` : hovered ? "#e8f6ff" : "rgba(170, 201, 214, 0.78)";
        ctx.fillText(label, tx, ty);
      });

      if (flash.current > 0.02) {
        const bloom = 1 - flash.current;
        for (let i = 0; i < 2; i++) {
          ctx.beginPath();
          ctx.arc(lockedPoint.x, lockedPoint.y, 16 + bloom * (48 + i * 34), 0, Math.PI * 2);
          ctx.strokeStyle =
            i === 0 ? `rgba(${AMBER}, ${flash.current * 0.9})` : `rgba(${CYAN}, ${flash.current * 0.38})`;
          ctx.lineWidth = i === 0 ? 2 : 1;
          ctx.stroke();
        }
      }

      const reticleDistance = Math.hypot(aimPoint.x - lockedPoint.x, aimPoint.y - lockedPoint.y);
      ctx.save();
      ctx.translate(aimPoint.x, aimPoint.y);
      ctx.rotate(reduce ? 0 : now / 2200);
      ctx.strokeStyle = `rgba(${AMBER}, 0.86)`;
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(17, 27);
        ctx.lineTo(28, 27);
        ctx.lineTo(28, 16);
        ctx.stroke();
      }
      ctx.restore();
      if (reticleDistance > 5) {
        ctx.beginPath();
        ctx.moveTo(aimPoint.x, aimPoint.y);
        ctx.lineTo(lockedPoint.x, lockedPoint.y);
        ctx.strokeStyle = `rgba(${AMBER}, 0.48)`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();

      ctx.font = `600 ${compact ? 8 : 9}px 'JetBrains Mono', ui-monospace, monospace`;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      ctx.fillStyle = `rgba(${CYAN}, 0.68)`;
      ctx.fillText(compact ? "PROOF FLIGHT" : "PROOF FLIGHT  //  TEST RANGE", compact ? 14 : f.l, 25);
      ctx.textAlign = "right";
      ctx.fillStyle = reduce ? "rgba(170,201,214,0.72)" : `rgba(${CYAN}, 0.88)`;
      ctx.fillText(
        reduce ? "STATIC ROUTE" : `RUN ${String(patrol.leg + 1).padStart(2, "0")} / 07  ·  ACTIVE`,
        f.w - 16,
        25,
      );
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(170,201,214,0.52)";
      ctx.fillText(compact ? "RANGE SWEEP" : "RANGE SWEEP  ·  LOCAL DISPLAY", compact ? 14 : f.l, f.h - 16);
      ctx.textAlign = "right";
      ctx.fillStyle = reticleDistance > 7 ? `rgba(${CYAN}, 0.9)` : `rgba(${AMBER}, 0.92)`;
      ctx.fillText(
        `${String(locked + 1).padStart(2, "0")} / 07  ·  ${reticleDistance > 7 ? "ACQUIRING" : "LOCKED"}`,
        f.w - 16,
        f.h - 16,
      );
      if (!compact) {
        ctx.save();
        ctx.translate(19, f.h - f.b);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = "left";
        ctx.fillStyle = `rgba(${CYAN}, 0.52)`;
        ctx.fillText("PROOF  →  CONSEQUENCE", 0, 0);
        ctx.restore();
      }
    };

    const animationFrame = (now: number) => {
      raf = 0;
      draw(now);
      if (inViewport && deckActive && !reduce) raf = requestAnimationFrame(animationFrame);
    };
    const requestDraw = () => {
      if (!inViewport || !deckActive || reduce) {
        draw(performance.now());
        return;
      }
      if (!raf) raf = requestAnimationFrame(animationFrame);
    };
    redraw.current = requestDraw;

    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const { w, h } = frame();
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      requestDraw();
    };
    fit();
    const resize = new ResizeObserver(fit);
    resize.observe(el);
    const visibility = new IntersectionObserver(
      ([entry]) => {
        inViewport = entry.isIntersecting;
        if (inViewport && deckActive) {
          last = performance.now();
          requestDraw();
        } else if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { rootMargin: "140px 0px" },
    );
    visibility.observe(el);

    const scrollRoot = el.closest<HTMLElement>("main.za-scroll");
    const syncDeckActivity = () => {
      const activeDeck = Number(scrollRoot?.dataset.activeDeck ?? -1);
      const next = deckAnimationState({ activeDeck, ownerDeck: 5, selection: selRef.current }).active;
      if (next === deckActive) return;
      deckActive = next;
      if (!deckActive && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      if (deckActive && inViewport) {
        last = performance.now();
        requestDraw();
      }
    };
    const ownership = scrollRoot ? new MutationObserver(syncDeckActivity) : null;
    if (scrollRoot) ownership?.observe(scrollRoot, { attributes: true, attributeFilter: ["data-active-deck"] });
    syncDeckActivity();

    const onMotion = (event: MediaQueryListEvent) => {
      reduce = event.matches;
      requestDraw();
    };
    motion.addEventListener("change", onMotion);

    const hit = (event: PointerEvent) => {
      const rect = c.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      let best = -1;
      let bestDistance = 30;
      POS.forEach((point, i) => {
        const node = xy(point[0], point[1]);
        const distance = Math.hypot(px - node.x, py - node.y);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      });
      return best;
    };
    const onMove = (event: PointerEvent) => {
      hoverRef.current = hit(event);
      c.style.cursor = hoverRef.current >= 0 ? "pointer" : "crosshair";
      if (reduce) requestDraw();
    };
    const onLeave = () => {
      hoverRef.current = -1;
      c.style.cursor = "crosshair";
      if (reduce) requestDraw();
    };
    const onDown = (event: PointerEvent) => {
      const i = hit(event);
      if (i >= 0) onLock(i);
    };
    c.addEventListener("pointermove", onMove);
    c.addEventListener("pointerleave", onLeave);
    c.addEventListener("pointerdown", onDown);

    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      visibility.disconnect();
      ownership?.disconnect();
      motion.removeEventListener("change", onMotion);
      c.removeEventListener("pointermove", onMove);
      c.removeEventListener("pointerleave", onLeave);
      c.removeEventListener("pointerdown", onDown);
      redraw.current = () => undefined;
    };
  }, [onLock]);

  return (
    <div
      ref={wrap}
      className="za-test-range relative h-[clamp(390px,56vh,560px)] overflow-hidden rounded-[var(--radius-xl)] border border-line bg-void-2/90"
      role="img"
      aria-label={`Seven-article proof-flight map. Article ${sel + 1} of 7, ${SHORT[sel]}, is selected.`}
    >
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      <span className="za-range-corners pointer-events-none absolute inset-3" aria-hidden="true" />
    </div>
  );
}
