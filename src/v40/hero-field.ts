import type { PageHost } from "./page-model.ts";
import { frameDeltaSeconds, motionDurationMs, shouldRenderFrame } from "../lib/animation-timing.ts";

import { drawContinuumField } from "./continuum-field.ts";
import { drawOrbitalField } from "./orbital-field.ts";
import { heroCameraTransform } from "./hero-camera.js";

export function waitForCanvas(this: PageHost, tries = 0) {
  if (this.starsStarted) return;
  const c = document.getElementById("hero-stars");
  if (c instanceof HTMLCanvasElement && c.offsetWidth > 0) {
    this.starsStarted = true;
    try {
      this.startStars(c);
    } catch (e) {
      console.error("startStars", e instanceof Error ? e.stack : String(e));
    }
    return;
  }
  clearTimeout(this.starsTimer);
  if (tries < 150) this.starsTimer = setTimeout(() => this.waitForCanvas(tries + 1), 60);
}

export function startStars(this: PageHost, c: HTMLCanvasElement) {
  if (!c) return;
  const ctx = c.getContext("2d");
  if (!ctx) return;

  const density = this.props.starDensity ?? 220;
  let w: number, h: number, dpr: number;
  let stars: { x: number; y: number; z: number; t: number }[];
  const reset = () => {
    const width = c.offsetWidth,
      height = c.offsetHeight;
    // Preserve sharp stars without allocating a huge backing canvas on high density ultrawides.
    dpr = Math.min(devicePixelRatio, 2, Math.sqrt(6_000_000 / Math.max(1, width * height)));
    w = c.width = Math.round(width * dpr);
    h = c.height = Math.round(height * dpr);
    stars = Array.from({ length: density }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: 0.3 + Math.random() * 0.7,
      t: Math.random() * 6.28,
    }));
  };
  reset();
  let t = 0;
  let closeMix = 0;
  const camera = document.querySelector<HTMLElement>(".hero-flight-camera");
  const orbiter = document.querySelector<SVGGElement>(".hud-orbiter");
  // Keep timing numeric: the CSS minifier can turn 64000ms into 64s.
  const orbitSeconds = motionDurationMs("hero-orbit") / 1000;
  const orbitPointer = { x: 0, y: 0 };
  const draw = (delta = 0) => {
    if (!c.isConnected) return;
    const reduce = this.reduce;
    t += delta;
    // One clock and one overlay across GPU and fallback rendering. A pause keeps
    // the exact phase instead of removing a CSS animation and snapping to its start.
    if (orbiter) orbiter.style.transform = `rotate(${(((t / orbitSeconds) * 360) % 360) - 90}deg)`;
    const warp = !reduce && Date.now() < (this.warpUntil || 0);
    const targetPointer = reduce ? { x: 0, y: 0 } : this.orbitPointer || { x: 0, y: 0 };
    const follow = reduce ? 1 : Math.min(1, delta * 4);
    orbitPointer.x += (targetPointer.x - orbitPointer.x) * follow;
    orbitPointer.y += (targetPointer.y - orbitPointer.y) * follow;
    closeMix = reduce
      ? Number(this.state.cameraClose)
      : closeMix + (Number(this.state.cameraClose) - closeMix) * Math.min(1, delta * 2.2);
    if (camera)
      camera.style.transform = heroCameraTransform({
        time: t,
        close: closeMix,
        reduced: reduce,
        pointer: orbitPointer,
      });
    if (this.heroEnhancement?.active()) {
      this.heroEnhancement.render(t, orbitPointer);
      if (c.dataset.ready !== "true") c.dataset.ready = "true";
      return;
    }
    ctx.clearRect(0, 0, w, h);
    const drawField = this.state.scene === "orbit" ? drawOrbitalField : drawContinuumField;
    drawField(ctx, {
      width: w,
      height: h,
      dpr,
      time: t,
      motion: !reduce,
      pointer: orbitPointer,
      mode: this.state.scene,
      turn: this.state.sceneTurn,
    });
    const hz = h * 0.88;
    for (const s of stars) {
      if (s.y > hz) continue;
      if (warp) {
        const ox = w * (w / dpr < 760 ? 0.5 : 0.755),
          oy = h * 0.43;
        const dx = s.x - ox,
          dy = s.y - oy,
          length = Math.max(1, Math.hypot(dx, dy));
        const len = Math.min(120 * dpr, length * 0.22) * s.z;
        ctx.strokeStyle = `rgba(225,208,255,${0.2 + 0.35 * s.z})`;
        ctx.lineWidth = 1.1 * s.z * dpr;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + (dx / length) * len, s.y + (dy / length) * len);
        ctx.stroke();
        continue;
      }
      const tw = reduce ? 1 : 0.55 + 0.45 * Math.sin(t * 1.6 + s.t);
      ctx.fillStyle = `rgba(241,239,247,${0.25 + 0.6 * tw * s.z})`;
      ctx.fillRect(s.x, s.y, 1.2 * s.z * dpr + 0.4, 1.2 * s.z * dpr + 0.4);
      if (!reduce) {
        s.x -= 2.4 * delta * s.z * dpr;
        if (s.x < 0) s.x = w;
      }
    }
    ctx.lineWidth = dpr;
    if (c.dataset.ready !== "true") c.dataset.ready = "true";
  };
  this.starDraw = draw;
  let lastFrame: number | null = null;
  let lastDraw: number | null = null;
  const loop = (timestamp?: number) => {
    // Any covering dialog (cinema, a guided route or Mission Control) freezes the opening behind it.
    const covered =
      this.state.cinema || this.state.discovery || document.getElementById("mission-dialog")?.hasAttribute("open");
    if (document.hidden || this.heroVisible === false || covered || !c.isConnected) {
      lastFrame = lastDraw = null;
      return;
    }
    if (this.reduce) {
      draw();
      lastFrame = lastDraw = null;
      return;
    }
    const now = timestamp ?? performance.now();
    if (timestamp === undefined) lastFrame = lastDraw = null;
    const enhanced = this.heroEnhancement?.active();
    const interval = enhanced ? 1000 / 60 : 1000 / (Date.now() < (this.warpUntil || 0) ? 60 : 30) - 1;
    if (shouldRenderFrame(now, lastFrame, interval)) {
      draw(lastDraw === null ? 0 : frameDeltaSeconds(now, lastDraw));
      lastDraw = now;
      // Carry the cadence remainder on high refresh displays instead of rounding
      // every 60 Hz draw up to three 144 Hz screen ticks.
      lastFrame = enhanced && lastFrame !== null ? now - ((now - lastFrame) % interval) : now;
    }
    this.raf = requestAnimationFrame(loop);
  };
  this.starLoop = loop;
  this.onStarResize = () => {
    reset();
    draw();
  };
  window.addEventListener("resize", this.onStarResize);
  this.starResizeObserver = new ResizeObserver(this.onStarResize);
  this.starResizeObserver.observe(c);
  loop();
}
