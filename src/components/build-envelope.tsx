import { useEffect, useRef } from "react";
import { deckAnimationState, frameDeltaSeconds } from "@/lib/animation-timing";

/**
 * The proof-flight range scope for deck 06.
 *
 * Seven test articles on a radar scope: the Hermes gateway at the hub, the six
 * other articles on the outer range ring at 60 degree intervals, a sweep that
 * pings each article as it passes, and a patrol craft flying the ring. Selecting
 * an article commits the target vector from the hub and locks the reticle on it.
 */

const SHORT = ["HERMES", "ESCALATION", "EXPOSURE", "SOVEREIGN", "ZEUSAPOLLO", "SHOP FLOOR", "GRAPHIFY"];
/** Orbit order for the patrol craft around the outer ring, hub excluded. */
const TEST_ROUTE = [1, 2, 3, 4, 5, 6] as const;
const CYAN = "0,249,255";
const AMBER = "255,149,0";
const INK = "#e8f6ff";

type Point = { x: number; y: number };
type Frame = { w: number; h: number; hub: Point; radius: number; compact: boolean };
type Node = Point & { angle: number };

const TAU = Math.PI * 2;

/** Angle of an outer article on the ring; the hub (index 0) has none. */
function ringAngle(index: number) {
  return -Math.PI / 2 + ((index - 1) / TEST_ROUTE.length) * TAU;
}

function layout(frame: Frame): Node[] {
  return SHORT.map((_, i) => {
    if (i === 0) return { ...frame.hub, angle: 0 };
    const angle = ringAngle(i);
    return { x: frame.hub.x + Math.cos(angle) * frame.radius, y: frame.hub.y + Math.sin(angle) * frame.radius, angle };
  });
}

function quadraticPoint(a: Point, c: Point, b: Point, t: number): Point {
  const inv = 1 - t;
  return {
    x: inv * inv * a.x + 2 * inv * t * c.x + t * t * b.x,
    y: inv * inv * a.y + 2 * inv * t * c.y + t * t * b.y,
  };
}

function drawRangeSweep(ctx: CanvasRenderingContext2D, frame: Frame, now: number, reduce: boolean) {
  const { hub, radius } = frame;

  // range rings and bearing ticks
  for (const fraction of [0.34, 0.67, 1]) {
    ctx.beginPath();
    ctx.arc(hub.x, hub.y, radius * fraction, 0, TAU);
    ctx.strokeStyle = `rgba(${CYAN}, ${fraction === 1 ? 0.3 : 0.11})`;
    ctx.lineWidth = fraction === 1 ? 1.2 : 1;
    ctx.setLineDash(fraction === 1 ? [] : [2, 6]);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * TAU;
    const major = i % 6 === 0;
    const inner = radius - (major ? 10 : 5);
    ctx.beginPath();
    ctx.moveTo(hub.x + Math.cos(a) * inner, hub.y + Math.sin(a) * inner);
    ctx.lineTo(hub.x + Math.cos(a) * radius, hub.y + Math.sin(a) * radius);
    ctx.strokeStyle = `rgba(${CYAN}, ${major ? 0.5 : 0.22})`;
    ctx.lineWidth = major ? 1.2 : 1;
    ctx.stroke();
  }
  // crosshair
  ctx.beginPath();
  ctx.moveTo(hub.x - radius, hub.y);
  ctx.lineTo(hub.x + radius, hub.y);
  ctx.moveTo(hub.x, hub.y - radius);
  ctx.lineTo(hub.x, hub.y + radius);
  ctx.strokeStyle = `rgba(${CYAN}, 0.07)`;
  ctx.lineWidth = 1;
  ctx.stroke();

  if (reduce) return -Math.PI / 2;

  // the sweep beam
  const angle = (now / 4200) * TAU;
  ctx.save();
  ctx.beginPath();
  ctx.arc(hub.x, hub.y, radius, 0, TAU);
  ctx.clip();
  const beam = 0.55;
  const gradient =
    typeof ctx.createConicGradient === "function" ? ctx.createConicGradient(angle - beam, hub.x, hub.y) : null;
  if (gradient) {
    gradient.addColorStop(0, `rgba(${CYAN}, 0)`);
    gradient.addColorStop(beam / TAU, `rgba(${CYAN}, 0.22)`);
    gradient.addColorStop(beam / TAU + 0.002, `rgba(${CYAN}, 0)`);
    gradient.addColorStop(1, `rgba(${CYAN}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(hub.x - radius, hub.y - radius, radius * 2, radius * 2);
  } else {
    // older canvases (and the test double) get a flat wedge instead of the fade
    ctx.beginPath();
    ctx.moveTo(hub.x, hub.y);
    ctx.arc(hub.x, hub.y, radius, angle - beam, angle);
    ctx.closePath();
    ctx.fillStyle = `rgba(${CYAN}, 0.1)`;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(hub.x, hub.y);
  ctx.lineTo(hub.x + Math.cos(angle) * radius, hub.y + Math.sin(angle) * radius);
  ctx.strokeStyle = `rgba(${CYAN}, 0.7)`;
  ctx.lineWidth = 1.2;
  ctx.shadowColor = `rgb(${CYAN})`;
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();
  return angle;
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
    const ring = reduce ? 44 : 41 + Math.sin(now / 360) * 4;
    ctx.beginPath();
    ctx.arc(target.x, target.y, ring, 0, TAU);
    ctx.strokeStyle = `rgba(${AMBER}, 0.62)`;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([3, 7]);
    ctx.lineDashOffset = reduce ? 0 : -now / 24;
    ctx.stroke();
    ctx.setLineDash([]);
    return;
  }

  const bend = Math.min(30, distance * 0.14) * (selected % 2 === 0 ? 1 : -1);
  const control = {
    x: (origin.x + target.x) / 2 - (dy / distance) * bend,
    y: (origin.y + target.y) / 2 + (dx / distance) * bend,
  };

  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.quadraticCurveTo(control.x, control.y, target.x, target.y);
  ctx.strokeStyle = "rgba(2, 5, 8, 0.9)";
  ctx.lineWidth = 8;
  ctx.stroke();

  const vectorGradient = ctx.createLinearGradient(origin.x, origin.y, target.x, target.y);
  vectorGradient.addColorStop(0, `rgba(${CYAN}, 0.3)`);
  vectorGradient.addColorStop(0.6, `rgba(${AMBER}, 0.75)`);
  vectorGradient.addColorStop(1, `rgba(${AMBER}, 1)`);
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  ctx.quadraticCurveTo(control.x, control.y, target.x, target.y);
  ctx.strokeStyle = vectorGradient;
  ctx.lineWidth = 1.8;
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
      ctx.arc(point.x, point.y, 2.2 + i * 0.35, 0, TAU);
      ctx.fillStyle = `rgba(${AMBER}, ${0.45 + i * 0.18})`;
      ctx.shadowColor = `rgb(${AMBER})`;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}

/** The patrol craft flies the outer ring; returns the leg it is on (0-5). */
function drawPatrol(ctx: CanvasRenderingContext2D, frame: Frame, now: number, reduce: boolean) {
  const { hub, radius } = frame;
  if (reduce) return { leg: 0 };
  const period = 14000;
  const progress = (now % period) / period;
  const angle = -Math.PI / 2 + progress * TAU;
  const leg = Math.floor(progress * TEST_ROUTE.length) % TEST_ROUTE.length;

  // trail along the ring
  const tail = 0.085;
  const steps = 26;
  for (let i = steps; i > 0; i--) {
    const a0 = angle - (i / steps) * tail * TAU;
    const a1 = angle - ((i - 1) / steps) * tail * TAU;
    const strength = 1 - i / steps;
    ctx.beginPath();
    ctx.arc(hub.x, hub.y, radius, a0, a1);
    ctx.strokeStyle = `rgba(${CYAN}, ${strength * strength * 0.8})`;
    ctx.lineWidth = 0.8 + strength * 3.6;
    ctx.stroke();
  }

  const craft = { x: hub.x + Math.cos(angle) * radius, y: hub.y + Math.sin(angle) * radius };
  ctx.save();
  ctx.translate(craft.x, craft.y);
  ctx.rotate(angle + Math.PI / 2);
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(-8, -5.5);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-8, 5.5);
  ctx.closePath();
  ctx.fillStyle = INK;
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

  return { leg };
}

function angularDistance(a: number, b: number) {
  const d = Math.abs(((a - b) % TAU) + TAU) % TAU;
  return Math.min(d, TAU - d);
}

export function BuildEnvelope({ sel, onLock }: { sel: number; onLock: (i: number) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const redraw = useRef<() => void>(() => undefined);
  const selRef = useRef(sel);
  selRef.current = sel;
  const hoverRef = useRef(-1);
  // reticle position in unit scope space (hub = 0,0; ring = radius 1)
  const aim = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const flash = useRef(0);

  useEffect(() => {
    target.current = sel === 0 ? { x: 0, y: 0 } : { x: Math.cos(ringAngle(sel)), y: Math.sin(ringAngle(sel)) };
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
      const labelRoom = compact ? 78 : 118;
      const radius = Math.max(60, Math.min(w / 2 - labelRoom, h / 2 - (compact ? 58 : 66)));
      return { w, h, hub: { x: w / 2, y: h / 2 + 4 }, radius, compact };
    };
    const scope = (unit: Point, f: Frame): Point => ({
      x: f.hub.x + unit.x * f.radius,
      y: f.hub.y + unit.y * f.radius,
    });

    const draw = (now: number) => {
      const dt = frameDeltaSeconds(now, last);
      last = now;
      const f = frame();
      const nodes = layout(f);
      const locked = selRef.current;
      const lockedPoint = nodes[locked];

      if (reduce) {
        aim.current = { ...target.current };
        velocity.current = { x: 0, y: 0 };
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
      const aimPoint = scope(aim.current, f);

      ctx.clearRect(0, 0, f.w, f.h);
      const field = ctx.createRadialGradient(f.hub.x, f.hub.y, 10, f.hub.x, f.hub.y, f.radius * 1.15);
      field.addColorStop(0, "rgba(0, 49, 58, 0.36)");
      field.addColorStop(0.7, "rgba(0, 20, 30, 0.16)");
      field.addColorStop(1, "rgba(5, 6, 10, 0)");
      ctx.fillStyle = field;
      ctx.fillRect(0, 0, f.w, f.h);

      const sweepAngle = drawRangeSweep(ctx, f, now, reduce);

      // spokes to every article; the locked one is drawn as the vector below
      nodes.forEach((node, i) => {
        if (i === 0 || i === locked) return;
        ctx.beginPath();
        ctx.moveTo(f.hub.x, f.hub.y);
        ctx.lineTo(node.x, node.y);
        ctx.strokeStyle = `rgba(${CYAN}, ${i === hoverRef.current ? 0.34 : 0.1})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      drawTargetVector(ctx, f.hub, lockedPoint, locked, now, reduce);
      const patrol = drawPatrol(ctx, f, now, reduce);

      nodes.forEach((node, i) => {
        const selected = i === locked;
        const hovered = i === hoverRef.current;
        const pulse = reduce ? 0 : (Math.sin(now / 430 + i * 0.9) + 1) / 2;
        // sweep ping: brightens as the beam passes, then decays
        const ping = i === 0 || reduce ? 0 : Math.max(0, 1 - angularDistance(sweepAngle, node.angle) / 0.9);

        if (i === 0) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 31 + pulse * 2.5, 0, TAU);
          ctx.strokeStyle = `rgba(${AMBER}, ${selected ? 0.52 : 0.26})`;
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 6]);
          ctx.lineDashOffset = reduce ? 0 : now / 34;
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.save();
          ctx.translate(node.x, node.y);
          ctx.rotate(reduce ? Math.PI / 4 : -now / 2400);
          ctx.strokeStyle = `rgba(${AMBER}, ${selected ? 0.85 : 0.5})`;
          ctx.lineWidth = 1.3;
          ctx.strokeRect(-17, -17, 34, 34);
          ctx.restore();
        } else if (ping > 0.02) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 12 + (1 - ping) * 26, 0, TAU);
          ctx.strokeStyle = `rgba(${CYAN}, ${ping * 0.55})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, selected ? 15 : 10, 0, TAU);
        ctx.strokeStyle = selected
          ? `rgba(${AMBER}, 0.9)`
          : `rgba(${CYAN}, ${hovered ? 0.85 : 0.34 + pulse * 0.18 + ping * 0.4})`;
        ctx.lineWidth = selected ? 1.8 : 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(node.x, node.y, selected ? 4.8 : 3.4, 0, TAU);
        ctx.fillStyle = selected ? `rgb(${AMBER})` : hovered ? INK : `rgba(${CYAN}, ${0.85 + ping * 0.15})`;
        ctx.shadowColor = selected ? `rgb(${AMBER})` : `rgb(${CYAN})`;
        ctx.shadowBlur = selected ? 18 : hovered ? 14 : 8 + ping * 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // label, placed radially outside the ring (hub label sits below the hub)
        const label = `${String(i + 1).padStart(2, "0")}  ${SHORT[i]}`;
        ctx.font = `600 ${f.compact ? 8 : 9.5}px 'JetBrains Mono', ui-monospace, monospace`;
        ctx.textBaseline = "middle";
        let tx: number;
        let ty: number;
        if (i === 0) {
          ctx.textAlign = "center";
          tx = node.x;
          ty = node.y + 44;
        } else {
          const cos = Math.cos(node.angle);
          const sin = Math.sin(node.angle);
          const gap = selected ? 24 : 19;
          tx = node.x + cos * gap;
          ty = node.y + sin * gap;
          ctx.textAlign = Math.abs(cos) < 0.2 ? "center" : cos > 0 ? "left" : "right";
          if (Math.abs(cos) < 0.2) ty += sin * 6;
        }
        const width = ctx.measureText(label).width;
        const left = ctx.textAlign === "center" ? tx - width / 2 : ctx.textAlign === "left" ? tx : tx - width;
        ctx.fillStyle = "rgba(4, 7, 12, 0.84)";
        ctx.fillRect(left - 4, ty - 8, width + 8, 16);
        ctx.fillStyle = selected ? `rgb(${AMBER})` : hovered ? INK : "rgba(170, 201, 214, 0.8)";
        ctx.fillText(label, tx, ty);
      });

      if (flash.current > 0.02) {
        const bloom = 1 - flash.current;
        for (let i = 0; i < 2; i++) {
          ctx.beginPath();
          ctx.arc(lockedPoint.x, lockedPoint.y, 16 + bloom * (48 + i * 34), 0, TAU);
          ctx.strokeStyle =
            i === 0 ? `rgba(${AMBER}, ${flash.current * 0.9})` : `rgba(${CYAN}, ${flash.current * 0.38})`;
          ctx.lineWidth = i === 0 ? 2 : 1;
          ctx.stroke();
        }
      }

      // the reticle chases the locked article
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

      // scope readouts
      ctx.font = `600 ${f.compact ? 8 : 9}px 'JetBrains Mono', ui-monospace, monospace`;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      ctx.fillStyle = `rgba(${CYAN}, 0.68)`;
      ctx.fillText(f.compact ? "PROOF FLIGHT" : "PROOF FLIGHT  //  RANGE SCOPE", 16, 25);
      ctx.textAlign = "right";
      ctx.fillStyle = reduce ? "rgba(170,201,214,0.72)" : `rgba(${CYAN}, 0.88)`;
      ctx.fillText(
        reduce ? "STATIC ROUTE" : `ORBIT LEG ${String(patrol.leg + 1).padStart(2, "0")} / 06  ·  ACTIVE`,
        f.w - 16,
        25,
      );
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(170,201,214,0.52)";
      ctx.fillText(f.compact ? "RANGE SWEEP" : "RANGE SWEEP  ·  LOCAL DISPLAY", 16, f.h - 16);
      ctx.textAlign = "right";
      ctx.fillStyle = reticleDistance > 7 ? `rgba(${CYAN}, 0.9)` : `rgba(${AMBER}, 0.92)`;
      ctx.fillText(
        `${String(locked + 1).padStart(2, "0")} / 07  ·  ${reticleDistance > 7 ? "ACQUIRING" : "LOCKED"}`,
        f.w - 16,
        f.h - 16,
      );
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
      let bestDistance = 34;
      layout(frame()).forEach((node, i) => {
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
      aria-label={`Seven-article proof-flight scope. Article ${sel + 1} of 7, ${SHORT[sel]}, is selected.`}
    >
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      <span className="za-range-corners pointer-events-none absolute inset-3" aria-hidden="true" />
    </div>
  );
}
