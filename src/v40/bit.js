/* Bit geometry and lighting adapted from the site's original Helios copilot. */
(() => {
  "use strict";
  const root = document.documentElement,
    portraits = [];
  const isMotionEnabled = () => root.dataset.motion !== "off" && !document.hidden;
  let mood = "idle",
    dialog,
    opener,
    raf = 0,
    lastFrame = 0;
  function portrait(cv) {
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
    let ctx;
    try {
      ctx = cv.getContext("2d");
    } catch (_) {
      /* Optional browser capability; keep the fallback available. */
    }
    if (!ctx) return null;
    cv.parentElement.classList.add("bit-rendered");
    let mood = "idle",
      angle = 0,
      last = 0,
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
      if (!ctx) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const css = cv.clientWidth || 96;
      const want = Math.round(css * dpr);
      if (cv.width !== want) {
        cv.width = want;
        cv.height = want;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      const center = css / 2,
        baseR = css * 0.255;
      const el = last ? Math.min(80, Math.max(0, now - last)) : 42;
      last = now;
      if (isMotionEnabled())
        angle += el * (mood === "no" || mood === "alert" ? 0.0027 : mood === "yes" ? 0.0014 : 0.00105);
      look += (lookT - look) * 0.06;
      if (!isMotionEnabled()) look = 0;
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

    return {
      canvas: cv,
      visible: true,
      draw,
      paint(value) {
        mood = value;
        draw(isMotionEnabled() ? performance.now() : 0);
      },
    };
  }
  function loop(now) {
    raf = 0;
    if (!isMotionEnabled()) return;
    if (now - lastFrame >= 33) {
      for (const p of portraits) if (p.visible) p.draw(now);
      lastFrame = now;
    }
    if (portraits.some((p) => p.visible)) raf = requestAnimationFrame(loop);
  }
  function sync() {
    cancelAnimationFrame(raf);
    raf = 0;
    for (const p of portraits) p.paint(mood);
    if (isMotionEnabled() && portraits.some((p) => p.visible)) raf = requestAnimationFrame(loop);
  }
  const observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const p = portraits.find((x) => x.canvas === e.target);
      if (p) p.visible = e.isIntersecting;
    }
    sync();
  });
  function discover() {
    document.querySelectorAll("[data-bit-portrait] canvas:not([data-bit-ready])").forEach((cv) => {
      cv.dataset.bitReady = "true";
      const p = portrait(cv);
      if (p) {
        portraits.push(p);
        observer.observe(cv);
      }
    });
    for (let i = portraits.length - 1; i >= 0; i--)
      if (!portraits[i].canvas.isConnected) {
        observer.unobserve(portraits[i].canvas);
        portraits.splice(i, 1);
      }
    sync();
  }
  function answer(tag, line, state = "idle") {
    mood = state;
    dialog.querySelector(".bit-answer-tag").textContent = tag;
    dialog.querySelector(".bit-answer-line").textContent = line;
    dialog.dataset.mood = state;
    sync();
  }
  function open(button) {
    opener = button;
    dialog.showModal();
    answer(
      "BIT / BACK ON THE BRIDGE",
      "I turn, I glow, I have opinions. You still make the decisions. What shall we explore?",
    );
    dialog.querySelector("[data-bit-close]").focus();
  }
  function destination(id) {
    opener = null;
    dialog.close();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: isMotionEnabled() ? "smooth" : "instant" });
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
  }
  function ready() {
    if (dialog) return;
    dialog = document.createElement("dialog");
    dialog.id = "bit-dialog";
    dialog.className = "bit-dialog";
    dialog.setAttribute("aria-labelledby", "bit-title");
    dialog.innerHTML = `<div class="bit-dialog-head"><div><span class="bit-eyebrow">CREW MEMBER 01</span><h2 id="bit-title">Bit. Back on the bridge.</h2></div><button type="button" data-bit-close aria-label="Close Bit">×</button></div><div class="bit-intro"><div class="bit-portrait bit-large" data-bit-portrait><canvas aria-hidden="true"></canvas><span class="bit-fallback" aria-hidden="true">◇</span></div><div><p>A little geometry.<br>A lot of personality.</p><span>The original faceted copilot.</span></div></div><div class="bit-answer" role="status" aria-live="polite"><span class="bit-answer-tag"></span><p class="bit-answer-line"></p></div><div class="bit-questions"><button type="button" data-bit-command="authority">Who is in command?</button><button type="button" data-bit-command="42">Is the answer 42?</button><button type="button" data-bit-command="privacy">May private data leave?</button><button type="button" data-bit-command="defiant">Admiral Cashio?</button></div><div class="bit-destinations"><button type="button" data-bit-go="studies">Take the controls →</button><button type="button" data-bit-go="evidence">Show me the evidence →</button><button type="button" data-bit-mission>Open Mission Control →</button></div><p class="bit-footnote">A local character with scripted replies. No AI service, microphone or uploads. The towel is optional.</p>`;
    document.body.append(dialog);
    dialog.addEventListener("close", () => {
      opener?.focus({ preventScroll: true });
      mood = "idle";
      sync();
    });
    dialog.addEventListener("click", (e) => {
      if (e.target.closest("[data-bit-close]")) dialog.close();
      const command = e.target.closest("[data-bit-command]")?.dataset.bitCommand;
      if (command === "authority")
        answer(
          "BIT / HUMAN IN COMMAND",
          "You are. I am a very enthusiastic polyhedron. That is not a governance model.",
          "yes",
        );
      if (command === "42")
        answer(
          "BIT / LORE",
          "Forty-two is a fine answer. We are still reviewing the question. Please keep your towel within reach.",
          "think",
        );
      if (command === "privacy")
        answer(
          "BIT / THE DEMO RULE",
          "No automatic departure. In this demonstration, private input holds the external route for human review.",
          "no",
        );
      if (command === "defiant") {
        answer(
          "BIT / LORE",
          "Admiral Cashio has the bridge. Defiant by name. Mostly harmless by legal description.",
          "yes",
        );
        window.cashioV40?.defiant();
      }
      const go = e.target.closest("[data-bit-go]")?.dataset.bitGo;
      if (go) destination(go);
      if (e.target.closest("[data-bit-mission]")) {
        opener = null;
        dialog.close();
        document.querySelector("header [data-mission-open]")?.click();
      }
      if (e.target === dialog) {
        const r = dialog.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
      }
    });
    document.addEventListener("click", (e) => {
      const button = e.target.closest("[data-bit-open]");
      if (button) open(button);
    });
    const originalSetState = window.cashioV40.setState.bind(window.cashioV40);
    window.cashioV40.setState = (next, ...rest) => {
      originalSetState(next, ...rest);
      if (next && typeof next === "object" && next.routed) {
        mood = next.routed.name === "Human review" ? "no" : "think";
        sync();
      }
    };
    document
      .querySelectorAll("[data-platform-shortcut]")
      .forEach((k) => (k.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K"));
    new MutationObserver((records) => {
      if (records.some((r) => r.addedNodes.length || r.removedNodes.length)) discover();
    }).observe(document.getElementById("main-content").parentElement, { childList: true, subtree: true });
    discover();
  }
  document.addEventListener("cashio-motion", sync);
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("cashio-ready", ready);
})();
