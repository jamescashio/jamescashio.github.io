import { gsap } from "gsap";

/** One mascot canvas, docked in the phone menu and parked in the desktop gutter. */
export function setupBit({ isMotionEnabled, openMissionControl }) {
  const $ = (selector) => document.querySelector(selector);

  const PHI = (1 + Math.sqrt(5)) / 2;
  const norm = (v) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
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
  ].map(norm);
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
  const YES = {
    vertices: [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ],
    faces: [
      [0, 2, 4],
      [2, 1, 4],
      [1, 3, 4],
      [3, 0, 4],
      [2, 0, 5],
      [1, 2, 5],
      [3, 1, 5],
      [0, 3, 5],
    ],
  };
  function stell(spike) {
    const vertices = V.map((v) => v.slice()),
      faces = [];
    F.forEach((f) => {
      const a = V[f[0]],
        b = V[f[1]],
        c = V[f[2]];
      const apex = norm([(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3]);
      const ai = vertices.length;
      vertices.push([apex[0] * spike, apex[1] * spike, apex[2] * spike]);
      faces.push([f[0], f[1], ai], [f[1], f[2], ai], [f[2], f[0], ai]);
    });
    return { vertices, faces };
  }
  const NO = stell(1.78);
  const pal = (m) =>
    m === "yes"
      ? { base: [255, 204, 24], edge: [255, 248, 176], glow: "rgba(255,204,0,0.5)" }
      : m === "no" || m === "alert"
        ? { base: [255, 24, 58], edge: [255, 154, 170], glow: "rgba(255,0,51,0.52)" }
        : m === "think"
          ? { base: [255, 149, 0], edge: [255, 214, 150], glow: "rgba(255,149,0,0.46)" }
          : { base: [38, 205, 236], edge: [200, 252, 255], glow: "rgba(0,249,255,0.46)" };
  const rot = (v, rx, ry) => {
    const cy = Math.cos(ry),
      sy = Math.sin(ry),
      cx = Math.cos(rx),
      sx = Math.sin(rx);
    const x = v[0] * cy + v[2] * sy,
      z1 = v[2] * cy - v[0] * sy;
    return [x, v[1] * cx - z1 * sx, v[1] * sx + z1 * cx];
  };
  const cv = $("#bitcv");
  const ctx = cv.getContext("2d");
  let mood = "idle",
    angle = 0,
    last = 0,
    raf = 0,
    moodTimer = 0,
    look = 0,
    lookT = 0,
    blink = 1,
    nextBlink = performance.now() + 3000;
  window.addEventListener(
    "pointermove",
    (e) => {
      const r = cv.getBoundingClientRect();
      lookT = Math.max(-0.6, Math.min(0.6, ((e.clientX - (r.left + r.width / 2)) / window.innerWidth) * 2));
    },
    { passive: true },
  );
  function draw(now) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const css = cv.clientWidth || 96;
    const want = Math.round(css * dpr);
    if (cv.width !== want) {
      cv.width = want;
      cv.height = want;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const center = css / 2,
      baseR = css * 0.24;
    const el = last ? Math.min(80, Math.max(0, now - last)) : 42;
    last = now;
    if (isMotionEnabled())
      angle += el * (mood === "no" || mood === "alert" ? 0.0027 : mood === "yes" ? 0.0014 : 0.00105);
    look += (lookT - look) * 0.06;
    if (now > nextBlink) {
      blink = 0.72;
      nextBlink = now + 2600 + Math.random() * 4000;
    }
    blink += (1 - blink) * 0.18;
    const pulse = 0.5 + 0.5 * Math.sin(now * 0.0022);
    const P = pal(mood);
    const geo = mood === "yes" ? YES : mood === "no" || mood === "alert" ? NO : stell(1.08 + pulse * 0.24);
    let rx = -0.52 + Math.sin(angle * 0.72) * 0.13;
    if (mood === "no" || mood === "alert") rx += Math.sin(angle * 9) * 0.1;
    const radius = baseR * (mood === "yes" ? 1.3 : mood === "no" || mood === "alert" ? 0.96 : 1);
    const focal = 5.2;
    const pts = geo.vertices.map((v) => rot(v, rx, angle + look));
    const proj = (p) => {
      const sc = focal / (focal + p[2]);
      return [center + p[0] * radius * sc, center + p[1] * radius * sc * blink];
    };
    ctx.clearRect(0, 0, css, css);
    const halo = ctx.createRadialGradient(center, center, 1, center, center, css * 0.5);
    halo.addColorStop(0, P.glow);
    halo.addColorStop(0.3, `rgba(${P.edge[0]},${P.edge[1]},${P.edge[2]},${(0.1 + pulse * 0.07).toFixed(3)})`);
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, css, css);
    const L = [0.42, -0.5, 0.76];
    geo.faces
      .map((f, i) => [i, (pts[f[0]][2] + pts[f[1]][2] + pts[f[2]][2]) / 3])
      .sort((a, b) => a[1] - b[1])
      .forEach(([i]) => {
        const f = geo.faces[i];
        const a = pts[f[0]],
          b = pts[f[1]],
          c = pts[f[2]];
        const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
          v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
        const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
        const nl = Math.hypot(n[0], n[1], n[2]) || 1;
        const light = (n[0] / nl) * L[0] + (n[1] / nl) * L[1] + (n[2] / nl) * L[2];
        const sh = 0.2 + 0.8 * Math.max(0, light);
        const A = proj(a),
          B = proj(b),
          C = proj(c);
        ctx.beginPath();
        ctx.moveTo(A[0], A[1]);
        ctx.lineTo(B[0], B[1]);
        ctx.lineTo(C[0], C[1]);
        ctx.closePath();
        ctx.fillStyle = `rgba(${Math.round(P.base[0] * sh)},${Math.round(P.base[1] * sh)},${Math.round(P.base[2] * sh)},0.94)`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${P.edge[0]},${P.edge[1]},${P.edge[2]},${mood === "yes" ? "0.82" : "0.54"})`;
        ctx.lineWidth = mood === "yes" ? 0.9 : 0.62;
        ctx.stroke();
      });
  }
  function loop(now) {
    raf = 0;
    if (!canAnimate()) return;
    if (now - last >= 32) draw(now);
    raf = requestAnimationFrame(loop);
  }
  let engaged = false;
  const canAnimate = () =>
    engaged && isMotionEnabled() && !document.hidden && !document.querySelector("dialog[open],#helios-flight");
  function syncAnimation() {
    if (canAnimate()) {
      if (!raf) raf = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(raf);
      raf = 0;
      draw(last);
    }
  }
  const compact = window.matchMedia("(max-width: 900px)");
  function dock() {
    const target = $(compact.matches ? "#mc-btn" : "#bit-btn");
    target.prepend(cv);
    $("#bitdock").dataset.docked = String(compact.matches);
    if (compact.matches) $("#bitsay").classList.add("hide");
    draw(0);
  }
  compact.addEventListener("change", dock);
  dock();
  syncAnimation();
  const engage = () => {
    engaged = true;
    syncAnimation();
  };
  window.addEventListener("pointerdown", engage, { once: true, passive: true });
  window.addEventListener("keydown", engage, { once: true });
  document.addEventListener("visibilitychange", syncAnimation);
  window.addEventListener("helios-motion", syncAnimation);
  window.addEventListener("helios-overlay", syncAnimation);
  let say = function (tag, line, m, hold) {
    $("#bit-tag").textContent = "BIT / " + tag;
    $("#bit-line").textContent = line;
    const box = $("#bitsay");
    box.classList.remove("hide");
    if (isMotionEnabled())
      gsap.fromTo(
        box,
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.6)", overwrite: true },
      );
    if (m) setMood(m, hold);
  };
  function setMood(m, hold) {
    if (m !== mood) {
      const b = $("#bit-btn");
      b.classList.remove("pop");
      void b.offsetWidth;
      b.classList.add("pop");
    }
    mood = m;
    clearTimeout(moodTimer);
    if (m !== "idle")
      moodTimer = setTimeout(() => {
        mood = "idle";
      }, hold || 2600);
  }
  $("#bit-x").addEventListener("click", () => $("#bitsay").classList.add("hide"));
  // bubble clears itself; Bit shrinks while the page scrolls; Bit can be dragged to any corner
  let sayTimer = 0;
  let saidAt = 0;
  const origSay = say;
  say = function (tag, line, m, hold) {
    origSay(tag, line, m, hold);
    saidAt = Date.now();
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => $("#bitsay").classList.add("hide"), 6500);
  };
  let scrollT = 0;
  window.addEventListener(
    "scroll",
    () => {
      $("#bitdock").classList.add("scrolling");
      // Once read, the bubble steps aside for the reader instead of riding over the page.
      if (Date.now() - saidAt > 2200) $("#bitsay").classList.add("hide");
      clearTimeout(scrollT);
      scrollT = setTimeout(() => $("#bitdock").classList.remove("scrolling"), 700);
    },
    { passive: true },
  );
  (function () {
    const dock = $("#bitdock"),
      btn = $("#bit-btn");
    let d = null;
    function place(x, y) {
      const W = window.innerWidth,
        H = window.innerHeight;
      const right = x > W / 2,
        top = y < H / 2;
      dock.classList.toggle("right", right);
      dock.classList.toggle("top", top);
      dock.style.left = right ? "auto" : "6px";
      dock.style.right = right ? "6px" : "auto";
      dock.style.top = top ? "calc(88px + env(safe-area-inset-top,0px))" : "auto";
      dock.style.bottom = top ? "auto" : "calc(18px + env(safe-area-inset-bottom,0px))";
      try {
        localStorage.setItem("v38bit", (right ? "r" : "l") + (top ? "t" : "b"));
      } catch {
        /* Position persistence is optional. */
      }
    }
    try {
      const sv = localStorage.getItem("v38bit");
      if (sv) {
        place(sv[0] === "r" ? window.innerWidth : 0, sv[1] === "t" ? 0 : window.innerHeight);
      }
    } catch {
      /* Position persistence is optional. */
    }
    btn.addEventListener("pointerdown", (e) => {
      d = { x: e.clientX, y: e.clientY, moved: false };
      btn.setPointerCapture(e.pointerId);
    });
    btn.addEventListener("pointermove", (e) => {
      if (!d) return;
      const dx = e.clientX - d.x,
        dy = e.clientY - d.y;
      if (!d.moved && Math.hypot(dx, dy) > 6) {
        d.moved = true;
        btn.classList.add("dragging");
        dock.style.transition = "none";
      }
      if (d.moved) {
        dock.style.transform = `translate(${dx}px,${dy}px)`;
      }
    });
    const end = (e) => {
      if (!d) return;
      if (d.moved) {
        btn.classList.remove("dragging");
        dock.style.transform = "";
        dock.style.transition = "";
        place(e.clientX, e.clientY);
        origSay("PARKED", "I will stay in this corner. Drag me again any time.", "yes", 1500);
        d = null;
        e.preventDefault();
        btn.dataset.skip = "1";
        setTimeout(() => delete btn.dataset.skip, 50);
      }
      d = null;
    };
    btn.addEventListener("pointerup", end);
    btn.addEventListener("pointercancel", () => {
      d = null;
    });
    btn.addEventListener(
      "click",
      (e) => {
        if (btn.dataset.skip) {
          e.stopImmediatePropagation();
        }
      },
      true,
    );
  })();
  $("#bit-btn").addEventListener("click", () => {
    say(
      "MISSION CONTROL",
      "Choose a starting point, or search the universe. Press Esc when you are done.",
      "yes",
      2000,
    );
    openMissionControl();
  });
  return { say: (...a) => say(...a), setMood };
}
