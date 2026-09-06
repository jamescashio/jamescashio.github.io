import { useEffect, useRef, type RefObject } from "react";
import "./celestial-field.css";

type FieldLight = "balanced" | "gold" | "ion";
type FieldPointer = { x: number; y: number; active: boolean };
type Settings = { motion: boolean; light: FieldLight; signal: number; focusLetter: number; strength: number };
type Point = { x: number; y: number };
type Photon = {
  phase: number;
  orbit: number;
  radius: number;
  speed: number;
  offset: Point;
  velocity: Point;
  trail: Point[];
};
type Projection = Point & { z: number; scale: number };
type LightPoint = Projection & { photon: Photon; alpha: number; size: number; ion: boolean; excitation: number };
type FieldEngine = { update: (settings: Settings) => void; dispose: () => void };

const LETTER_X = [0.165, 0.335, 0.486, 0.611, 0.73, 0.841];
const PULSE_SECONDS = 3.3;
const FRAME_SECONDS = 1 / 30;
const INK_GOLD = "#edc68e";
const INK_ION = "#8be4f5";
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const finite = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback);

function makePhoton(index: number): Photon {
  return {
    phase: index * 2.3999632297,
    orbit: index % 4,
    radius: 0.83 + ((index * 17) % 23) / 100,
    speed: (0.2 + ((index * 11) % 19) / 100) * (index % 4 === 3 ? -1 : 1),
    offset: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    trail: [],
  };
}

function glowSprite(color: string) {
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = 64;
  const context = sprite.getContext("2d");
  if (!context) return sprite;
  const glow = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  glow.addColorStop(0, "#ffffff");
  glow.addColorStop(0.08, color);
  glow.addColorStop(0.28, `${color}68`);
  glow.addColorStop(0.64, `${color}12`);
  glow.addColorStop(1, `${color}00`);
  context.fillStyle = glow;
  context.fillRect(0, 0, 64, 64);
  return sprite;
}

function createField(canvas: HTMLCanvasElement, pointer: RefObject<FieldPointer>): FieldEngine {
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) {
    canvas.dataset.running = "false";
    canvas.dataset.points = "0";
    return { update: () => {}, dispose: () => {} };
  }
  const photons = Array.from({ length: 130 }, (_, index) => makePhoton(index));
  const sprites = { gold: glowSprite(INK_GOLD), ion: glowSprite(INK_ION) };
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  let settings: Settings = { motion: false, light: "balanced", signal: 0, focusLetter: 1, strength: 50 };
  let width = 0;
  let height = 0;
  let span = 1;
  let dpr = 1;
  let count = 0;
  let frame = 0;
  let clock = 0;
  let lastTime = 0;
  let accumulated = 0;
  let raf = 0;
  let visible = false;
  let disposed = false;
  let dirty = true;
  let pulse: { elapsed: number; x: number; signal: number } | null = null;

  function project(angle: number, radius: number, orbit: number): Projection {
    const tilt = [-0.2, 0.21, -0.43, 0.42][orbit];
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * (0.4 + orbit * 0.045);
    const z = Math.sin(angle) * radius * (0.59 - orbit * 0.035);
    const perspective = 3.4 / (3.4 - z);
    return {
      x: width * 0.5 + (x * Math.cos(tilt) - y * Math.sin(tilt)) * width * 0.43 * perspective,
      y: height * 0.51 + (x * Math.sin(tilt) + y * Math.cos(tilt)) * height * 0.65 * perspective,
      z,
      scale: perspective,
    };
  }

  function allowed() {
    return !disposed && visible && !document.hidden && !media.matches && settings.motion && width > 0 && height > 0;
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    lastTime = 0;
    accumulated = 0;
    canvas.dataset.running = "false";
  }

  function draw(dt = 0) {
    if (disposed || width <= 0 || height <= 0) return;
    const ctx = context!;
    const strength = settings.strength / 100;
    const pointerValue = pointer.current;
    const interact = dt > 0 && pointerValue.active;
    const pointerX = clamp(finite(pointerValue.x, 0.5), 0, 1) * width;
    const pointerY = clamp(finite(pointerValue.y, 0.5), 0, 1) * height;
    if (dt > 0) {
      clock += dt;
      if (pulse) pulse.elapsed = Math.min(PULSE_SECONDS, pulse.elapsed + dt);
    }
    const progress = pulse ? pulse.elapsed / PULSE_SECONDS : 1;
    const waveRadius = 0.07 + progress * 0.9;
    const points: LightPoint[] = [];
    let response = 0;
    for (let index = 0; index < count; index++) {
      const photon = photons[index];
      const position = project(photon.phase + clock * photon.speed, photon.radius, photon.orbit);
      const x = position.x + photon.offset.x * span;
      const y = position.y + photon.offset.y * span;
      const waveX = pulse ? (x - pulse.x * width) / span : 0;
      const waveY = pulse ? (y - height * 0.54) / span : 0;
      const waveDistance = Math.hypot(waveX / 1.65, waveY);
      const excitation =
        pulse && progress < 1 ? Math.max(0, 1 - Math.abs(waveDistance - waveRadius) / 0.07) * (1 - progress) : 0;
      if (dt > 0) {
        let forceX = -photon.offset.x * 3.4;
        let forceY = -photon.offset.y * 3.4;
        if (interact) {
          const dx = (pointerX - x) / span;
          const dy = (pointerY - y) / span;
          const distance = Math.hypot(dx, dy);
          const reach = 0.32 + strength * 0.13;
          if (distance < reach && distance > 0.001) {
            const influence = Math.pow(1 - distance / reach, 2) * (0.25 + strength * 1.2);
            // A soft attraction gathers the field; the core parts it into a wake.
            const direction = distance < 0.065 ? -1.8 : 1;
            forceX += ((dx * direction - dy * 0.25) / distance) * influence;
            forceY += ((dy * direction + dx * 0.25) / distance) * influence;
          }
        }
        if (excitation && waveDistance > 0.001) {
          forceX += (waveX / waveDistance) * excitation * (0.12 + strength * 0.2);
          forceY += (waveY / waveDistance) * excitation * (0.12 + strength * 0.2);
        }
        const damping = Math.exp(-4.1 * dt);
        photon.velocity.x = (photon.velocity.x + forceX * dt) * damping;
        photon.velocity.y = (photon.velocity.y + forceY * dt) * damping;
        photon.offset.x = clamp(photon.offset.x + photon.velocity.x * dt, -0.16, 0.16);
        photon.offset.y = clamp(photon.offset.y + photon.velocity.y * dt, -0.16, 0.16);
      }
      position.x += photon.offset.x * span;
      position.y += photon.offset.y * span;
      if (dt > 0) {
        photon.trail.push({ x: position.x, y: position.y });
        if (photon.trail.length > 7) photon.trail.shift();
      }
      response += Math.hypot(photon.offset.x, photon.offset.y);
      const depth = clamp((position.z + 0.65) / 1.3, 0, 1);
      // Keep the central reading band quiet; the raster remains the foreground.
      const quiet = 1 - 0.66 * Math.exp(-Math.pow((position.y / height - 0.52) / 0.18, 4));
      points.push({
        ...position,
        photon,
        alpha: (0.2 + depth * 0.55) * quiet * (0.6 + strength * 0.4),
        size: (0.65 + depth * 1.1) * (0.85 + strength * 0.25),
        ion: settings.light === "ion" || (settings.light === "balanced" && index % 3 !== 0),
        excitation,
      });
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    const wash = ctx.createRadialGradient(
      width * 0.5,
      height * 0.52,
      span * 0.15,
      width * 0.5,
      height * 0.52,
      width * 0.6,
    );
    wash.addColorStop(0, "#00000000");
    wash.addColorStop(0.52, settings.light === "gold" ? "#e8b87008" : "#68c9ee08");
    wash.addColorStop(1, "#00000000");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, width, height);

    for (let orbit = 0; orbit < 4; orbit++) {
      ctx.beginPath();
      for (let sample = 0; sample <= 72; sample++) {
        const p = project((sample / 72) * Math.PI * 2, 0.94, orbit);
        if (sample === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = settings.light === "ion" || (settings.light === "balanced" && orbit % 2) ? INK_ION : INK_GOLD;
      ctx.globalAlpha = 0.035 + strength * 0.025;
      ctx.lineWidth = 0.65;
      ctx.stroke();
    }

    let bridges = 0;
    const reach = span * (0.085 + strength * 0.025);
    for (let index = 0; index < points.length && bridges < count * 0.7; index++) {
      const a = points[index];
      let connections = 0;
      for (let next = index + 1; next < points.length && connections < 2 && bridges < count * 0.7; next++) {
        const b = points[next];
        if (Math.abs(a.z - b.z) > 0.28) continue;
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance < 5 || distance > reach) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = a.ion ? INK_ION : INK_GOLD;
        ctx.lineWidth = 0.6;
        ctx.globalAlpha = (1 - distance / reach) * Math.min(a.alpha, b.alpha) * (0.12 + strength * 0.2);
        ctx.stroke();
        connections++;
        bridges++;
      }
    }

    points.sort((a, b) => a.z - b.z);
    ctx.lineCap = "round";
    ctx.globalCompositeOperation = "lighter";
    for (const point of points) {
      const color = point.ion ? INK_ION : INK_GOLD;
      const trail = point.photon.trail;
      ctx.strokeStyle = color;
      for (let index = 1; index < trail.length; index++) {
        ctx.beginPath();
        ctx.moveTo(trail[index - 1].x, trail[index - 1].y);
        ctx.lineTo(trail[index].x, trail[index].y);
        ctx.lineWidth = point.size * 0.7;
        ctx.globalAlpha = point.alpha * (index / trail.length) * 0.4;
        ctx.stroke();
      }
      const glow = point.size * (13 + point.excitation * 5);
      ctx.globalAlpha = point.alpha * (0.6 + point.excitation * 0.6);
      ctx.drawImage(point.ion ? sprites.ion : sprites.gold, point.x - glow / 2, point.y - glow / 2, glow, glow);
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.size * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = point.scale > 1 ? "#eaf8ff" : color;
      ctx.globalAlpha = Math.min(0.9, point.alpha + point.excitation * 0.22);
      ctx.fill();
    }

    if (pulse && progress < 1) {
      ctx.save();
      ctx.translate(pulse.x * width, height * 0.54);
      ctx.rotate(-0.16);
      ctx.beginPath();
      ctx.ellipse(0, 0, waveRadius * span * 1.65, waveRadius * span, 0, 0, Math.PI * 2);
      ctx.strokeStyle = settings.light === "ion" ? INK_ION : INK_GOLD;
      ctx.lineWidth = 0.85;
      ctx.globalAlpha = Math.pow(1 - progress, 1.5) * (0.16 + strength * 0.16);
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    canvas.dataset.frame = String(++frame);
    canvas.dataset.points = String(count);
    canvas.dataset.bridges = String(bridges);
    canvas.dataset.time = clock.toFixed(3);
    canvas.dataset.response = (response / Math.max(1, count)).toFixed(5);
    canvas.dataset.pointerActive = String(interact);
    canvas.dataset.pulseProgress = pulse ? progress.toFixed(3) : "0";
    canvas.dataset.pulseSignal = String(pulse?.signal ?? 0);
    canvas.dataset.pulseActive = String(Boolean(pulse && progress < 1));
    dirty = false;
  }

  function tick(now: number) {
    raf = 0;
    if (!allowed()) return stop();
    if (lastTime) accumulated += Math.max(0, (now - lastTime) / 1000);
    lastTime = now;
    if (accumulated >= FRAME_SECONDS) {
      const dt = Math.min(0.05, accumulated - (accumulated % FRAME_SECONDS));
      accumulated %= FRAME_SECONDS;
      draw(dt);
    }
    raf = requestAnimationFrame(tick);
  }

  function sync() {
    if (disposed) return;
    if (!allowed()) stop();
    if (dirty && visible && !document.hidden) draw();
    if (allowed() && !raf) {
      canvas.dataset.running = "true";
      lastTime = 0;
      raf = requestAnimationFrame(tick);
    }
  }

  function density() {
    const mobile = width < 700;
    const next = (mobile ? 28 : 54) + Math.round((settings.strength / 100) * (mobile ? 36 : 76));
    if (next !== count) photons.forEach((photon) => (photon.trail.length = 0));
    count = next;
  }

  function resize() {
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    if (!width || !height) return sync();
    span = Math.min(width, height);
    dpr = Math.min(1.5, window.devicePixelRatio || 1, Math.sqrt(2_000_000 / (width * height)));
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.dataset.dpr = dpr.toFixed(3);
    photons.forEach((photon) => (photon.trail.length = 0));
    density();
    dirty = true;
    sync();
  }

  const visibility = () => sync();
  const preference = () => {
    dirty = true;
    sync();
  };
  const intersection = new IntersectionObserver(
    (entries) => {
      const entry = entries.at(-1);
      if (entry) visible = entry.isIntersecting;
      sync();
    },
    { threshold: 0.01 },
  );
  const observer = new ResizeObserver(resize);
  intersection.observe(canvas);
  observer.observe(canvas);
  document.addEventListener("visibilitychange", visibility);
  media.addEventListener("change", preference);
  resize();

  return {
    update(next) {
      const safe: Settings = {
        ...next,
        focusLetter: Math.round(clamp(finite(next.focusLetter, 1), 0, 5)),
        strength: clamp(finite(next.strength, 50), 0, 100),
        signal: Math.max(0, Math.floor(finite(next.signal, 0))),
      };
      if (safe.signal !== settings.signal) {
        pulse = safe.signal > 0 ? { elapsed: 0, x: LETTER_X[safe.focusLetter], signal: safe.signal } : null;
      }
      const changed =
        safe.light !== settings.light ||
        safe.strength !== settings.strength ||
        safe.signal !== settings.signal ||
        safe.focusLetter !== settings.focusLetter;
      settings = safe;
      density();
      canvas.dataset.light = settings.light;
      canvas.dataset.strength = String(settings.strength);
      dirty ||= changed;
      sync();
    },
    dispose() {
      disposed = true;
      stop();
      observer.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      media.removeEventListener("change", preference);
    },
  };
}

/** An abstract projected light field; all identity artwork stays in BrandMark. */
export default function CelestialField({
  motion,
  light,
  signal,
  focusLetter,
  strength,
  pointer,
}: Settings & {
  pointer: RefObject<FieldPointer>;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<FieldEngine | null>(null);
  useEffect(() => {
    if (!canvas.current) return;
    const field = createField(canvas.current, pointer);
    engine.current = field;
    return () => {
      field.dispose();
      engine.current = null;
    };
  }, [pointer]);
  useEffect(() => {
    engine.current?.update({ motion, light, signal, focusLetter, strength });
  }, [motion, light, signal, focusLetter, strength, pointer]);
  return (
    <canvas
      ref={canvas}
      className="celestial-field"
      aria-hidden="true"
      data-frame="0"
      data-points="0"
      data-running="false"
    />
  );
}
