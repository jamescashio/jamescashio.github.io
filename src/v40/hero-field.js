import { frameDeltaSeconds, shouldRenderFrame } from "../lib/animation-timing.ts";

import { drawContinuumField } from "./continuum-field.ts";
import { drawOrbitalField } from "./orbital-field.ts";
import { heroCameraTransform } from "./hero-camera.js";

export function waitForCanvas(tries = 0) {
  if (this.starsStarted) return;
  const c = document.getElementById("hero-stars");
  if (c && c.offsetWidth > 0) {
    this.starsStarted = true;
    try {
      this.startStars(c);
    } catch (e) {
      console.error("startStars", e && e.stack);
    }
    return;
  }
  clearTimeout(this.starsTimer);
  if (tries < 150) this.starsTimer = setTimeout(() => this.waitForCanvas(tries + 1), 60);
}

export function startStars(c) {
  if (!c) return;
  const ctx = c.getContext("2d");

  const density = this.props.starDensity ?? 220;
  let w, h, stars, dpr;
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
  const camera = document.querySelector(".hero-flight-camera");
  const orbitPointer = { x: 0, y: 0 };
  const draw = (delta = 0) => {
    if (!c.isConnected) return;
    const reduce = this.reduce;
    t += delta;
    const warp = !reduce && Date.now() < (this.warpUntil || 0);
    ctx.clearRect(0, 0, w, h);
    const targetPointer = reduce ? { x: 0, y: 0 } : this.orbitPointer || { x: 0, y: 0 };
    const follow = reduce ? 1 : Math.min(1, delta * 4);
    orbitPointer.x += (targetPointer.x - orbitPointer.x) * follow;
    orbitPointer.y += (targetPointer.y - orbitPointer.y) * follow;
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
    c.dataset.ready = "true";
  };
  this.starDraw = draw;
  let lastFrame = null;
  const loop = (timestamp) => {
    if (document.hidden || this.heroVisible === false || this.state.cinema || this.state.discovery || !c.isConnected) {
      lastFrame = null;
      return;
    }
    if (this.reduce) {
      draw();
      lastFrame = null;
      return;
    }
    const now = timestamp ?? performance.now();
    if (timestamp === undefined) lastFrame = null;
    const interval = 1000 / (Date.now() < (this.warpUntil || 0) ? 60 : 30) - 1;
    if (shouldRenderFrame(now, lastFrame, interval)) {
      draw(lastFrame === null ? 0 : frameDeltaSeconds(now, lastFrame));
      lastFrame = now;
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
