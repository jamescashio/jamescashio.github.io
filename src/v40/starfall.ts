/*
 * V43 Starfall. A deep sky that lives behind every chapter, plus flight instruments
 * on the Sections rail. The page reads as a descent: you begin in orbit at the hero
 * and touch down at Contact.
 *
 * Every element here is decorative, sits outside the React tree, ignores the pointer
 * and honours Pause motion, reduced motion and hidden tabs. Nothing makes a sound and
 * nothing leaves the browser.
 */

type Star = { x: number; y: number; z: number; r: number; tw: number; ph: number; c: number };
type Meteor = { x: number; y: number; vx: number; vy: number; life: number; max: number; c: number };
type Palette = [string, string];

const COLORS = ["233,241,255", "244,189,94", "114,229,244"];
const SOLID = COLORS.map((c) => `rgb(${c})`);
// Each chapter tints the nebula behind it. Gold and cyan stay the house colours.
const PALETTES: Record<string, Palette> = {
  top: ["#f4bd5e", "#72e5f4"],
  "eagle-film": ["#e89a3c", "#3b5bdb"],
  rooms: ["#2cd2ee", "#1b3a8a"],
  showcase: ["#f4bd5e", "#7a4b12"],
  films: ["#d98a2b", "#4c2a7a"],
  workshop: ["#ecb55e", "#0f6371"],
  work: ["#72e5f4", "#6d28d9"],
  studies: ["#53d6f0", "#f4bd5e"],
  universe: ["#2cd2ee", "#0b3d91"],
  evidence: ["#9fe3f4", "#14532d"],
  operator: ["#f4bd5e", "#9a3412"],
  contact: ["#ffd98f", "#72e5f4"],
};
const CARD = "a, button, article, .za-panel, [data-tilt]";
const EGGS = ["starfall", "engage", "zoom"];

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const rand = (a: number, b: number) => a + Math.random() * (b - a);

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, parent: HTMLElement = document.body) {
  const node = document.createElement(tag);
  node.className = cls;
  node.setAttribute("aria-hidden", "true");
  parent.appendChild(node);
  return node;
}

export function installStarfall(): () => void {
  const html = document.documentElement;
  const root = document.getElementById("v40-root");
  if (!root || html.classList.contains("sf-on")) return () => {};
  const reduceQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const lite = !fine || (navigator.hardwareConcurrency || 8) <= 4;
  const moving = () => html.dataset.motion !== "off" && !reduceQuery.matches && !document.hidden;
  html.classList.add("sf-on");

  // Layers: two nebula washes that crossfade, the star canvas, and body level overlays.
  const nebulaA = el("div", "sf-nebula");
  const nebulaB = el("div", "sf-nebula");
  const canvas = el("canvas", "sf-sky");
  const overlay = el("div", "sf-overlay");
  const sky = el("canvas", "sf-meteors", overlay);
  const jump = el("div", "sf-jump", overlay);
  const glint = el("div", "sf-glint", overlay);
  const locks = el("div", "sf-locks");
  const flight = el("div", "sf-flight");
  const track = el("div", "sf-track", flight);
  el("div", "sf-craft", track);
  const readout = el("div", "sf-readout", flight);
  const alt = el("strong", "", readout);
  const mach = el("span", "", readout);
  const toast = el("div", "sf-toast");
  toast.setAttribute("role", "status");
  toast.removeAttribute("aria-hidden");
  const ctx = canvas.getContext("2d", { alpha: true });
  const mctx = sky.getContext("2d", { alpha: true });

  let W = 0,
    H = 0,
    dpr = 1,
    stars: Star[] = [];
  const meteors: Meteor[] = [];
  let raf = 0,
    last = 0,
    lastY = window.scrollY,
    vel = 0,
    boost = 0,
    px = -999,
    py = -999,
    nextMeteor = performance.now() + rand(4000, 9000),
    machAt = 0,
    nebulaFlip = false,
    chapter = "",
    keyBuf = "",
    lastMove = 0,
    lastJump = 0,
    frameAt = 0,
    stepNow = 1,
    idleT = 0,
    toastT = 0;

  const seed = () => {
    dpr = Math.min(window.devicePixelRatio || 1, lite ? 1.25 : 1.5);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    sky.width = canvas.width;
    sky.height = canvas.height;
    const n = Math.round(clamp((W * H) / (lite ? 7600 : 4600), 90, lite ? 200 : 440));
    stars = Array.from({ length: n }, () => {
      const z = [0.22, 0.5, 1][Math.floor(Math.random() * 3)];
      const roll = Math.random();
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        z,
        r: z * rand(0.55, 1.35),
        tw: rand(0.6, 2.4),
        ph: Math.random() * 6.28,
        c: roll < 0.74 ? 0 : roll < 0.88 ? 1 : 2,
      };
    });
  };

  const spawnMeteor = (burst = false) => {
    const fromLeft = Math.random() < 0.5;
    const speed = rand(9, 15) * (burst ? 1.25 : 1);
    const angle = rand(0.32, 0.62);
    meteors.push({
      x: fromLeft ? rand(-60, W * 0.55) : rand(W * 0.45, W + 60),
      y: rand(-40, H * 0.35),
      vx: (fromLeft ? 1 : -1) * Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      max: rand(48, 80),
      c: Math.random() < 0.6 ? 1 : 2,
    });
  };

  const draw = (t: number, animate: boolean) => {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // Without motion the sky holds still: no parallax, no twinkle, no streaks.
    const scroll = animate ? window.scrollY : 0;
    const cx = W / 2,
      cy = H * 0.45;
    const streak = animate ? clamp(Math.abs(vel) * 1.6, 0, 240) : 0;
    const warp = animate ? boost : 0;
    const dir = vel >= 0 ? -1 : 1;
    for (const s of stars) {
      let x = s.x;
      let y = (((s.y - scroll * s.z * 0.32) % H) + H) % H;
      // A gentle gravity lens around the pointer.
      if (fine && animate && px > -999) {
        const dx = x - px,
          dy = y - py,
          d = Math.hypot(dx, dy);
        if (d < 150 && d > 0.1) {
          const push = (1 - d / 150) * 14 * s.z;
          x += (dx / d) * push;
          y += (dy / d) * push;
        }
      }
      const a = (0.28 + 0.62 * s.z) * (animate ? 0.72 + 0.28 * Math.sin(t * 0.001 * s.tw + s.ph) : 0.85);
      const len = streak * s.z + warp * 110 * s.z;
      if (len > 1.5) {
        // Hyperspace: stars stretch against the scroll, and outward from the vanishing point during a jump.
        let ex = x,
          ey = y + dir * streak * s.z;
        if (warp > 0.02) {
          const ox = x - cx,
            oy = y - cy,
            od = Math.hypot(ox, oy) || 1;
          ex = x - (ox / od) * warp * 110 * s.z;
          ey = y - (oy / od) * warp * 110 * s.z + dir * streak * s.z * (1 - warp);
        }
        ctx.globalAlpha = a * 0.8;
        ctx.strokeStyle = SOLID[s.c];
        ctx.lineWidth = Math.max(0.6, s.r * 1.1);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      } else {
        ctx.globalAlpha = a;
        ctx.fillStyle = SOLID[s.c];
        const r = s.r;
        if (r < 0.9) ctx.fillRect(x, y, r * 1.6, r * 1.6);
        else {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, 6.283);
          ctx.fill();
          if (s.z === 1 && s.c !== 0) {
            ctx.globalAlpha = a * 0.16;
            ctx.beginPath();
            ctx.arc(x, y, r * 4, 0, 6.283);
            ctx.fill();
          }
        }
      }
    }
    ctx.globalAlpha = 1;
    // Constellation lines from the pointer to its three nearest bright stars.
    if (fine && px > -999 && animate && streak < 4) {
      const near: Array<{ x: number; y: number; d: number }> = [];
      for (const st of stars) {
        if (st.z !== 1) continue;
        const sy = (((st.y - scroll * 0.32) % H) + H) % H;
        const d = Math.hypot(st.x - px, sy - py);
        if (d >= 190) continue;
        near.push({ x: st.x, y: sy, d });
        if (near.length > 3) {
          near.sort((m, n) => m.d - n.d);
          near.length = 3;
        }
      }
      ctx.lineWidth = 0.8;
      for (const s of near) {
        ctx.strokeStyle = `rgba(114,229,244,${0.34 * (1 - s.d / 190)})`;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
      }
    }
    // Shooting stars fly above the chapters, so the opening shower crosses the planet itself.
    if (!mctx) return;
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mctx.clearRect(0, 0, W, H);
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      if (animate) {
        m.x += m.vx * stepNow;
        m.y += m.vy * stepNow;
        m.life += stepNow;
      }
      const k = 1 - m.life / m.max;
      if (k <= 0) {
        meteors.splice(i, 1);
        continue;
      }
      const tail = 16;
      const g = mctx.createLinearGradient(m.x, m.y, m.x - m.vx * tail, m.y - m.vy * tail);
      g.addColorStop(0, `rgba(255,250,235,${0.95 * k})`);
      g.addColorStop(0.25, `rgba(${COLORS[m.c]},${0.6 * k})`);
      g.addColorStop(1, `rgba(${COLORS[m.c]},0)`);
      mctx.strokeStyle = g;
      mctx.lineWidth = 1.8;
      mctx.beginPath();
      mctx.moveTo(m.x, m.y);
      mctx.lineTo(m.x - m.vx * tail, m.y - m.vy * tail);
      mctx.stroke();
      const head = mctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 7);
      head.addColorStop(0, `rgba(255,248,226,${0.9 * k})`);
      head.addColorStop(1, "rgba(255,248,226,0)");
      mctx.fillStyle = head;
      mctx.beginPath();
      mctx.arc(m.x, m.y, 7, 0, 6.283);
      mctx.fill();
    }
  };

  // Flight instruments: progress is a descent from orbit to touchdown.
  const rail = () => document.querySelector<HTMLElement>('nav[aria-label="Sections"]');
  let railBox = { top: 0, height: 0, start: 0, end: 0, ok: false, readout: false };
  const measureRail = () => {
    const nav = rail();
    const r = nav?.getBoundingClientRect();
    const links = nav ? [...nav.querySelectorAll<HTMLElement>("a")].filter((a) => a.offsetParent) : [];
    if (!nav || !r || r.width < 40 || links.length < 3 || getComputedStyle(nav).visibility === "hidden") {
      railBox.ok = false;
      flight.dataset.on = "false";
      return;
    }
    // The first link is the rail's cAshIo mark; the track starts at the first chapter.
    const first = links[1] ?? links[0];
    const lastLink = links[links.length - 1];
    const a = first.getBoundingClientRect(),
      b = lastLink.getBoundingClientRect();
    railBox = {
      top: r.top,
      height: r.height,
      start: a.top + a.height / 2 - r.top,
      end: b.top + b.height / 2 - r.top,
      ok: true,
      readout: r.bottom - b.bottom > 78,
    };
    flight.style.setProperty("--sf-left", `${Math.round(r.right - 9)}px`);
    flight.style.setProperty("--sf-top", `${Math.round(r.top + railBox.start)}px`);
    flight.style.setProperty("--sf-h", `${Math.max(0, Math.round(railBox.end - railBox.start))}px`);
    flight.style.setProperty("--sf-rail-w", `${Math.round(r.width)}px`);
    flight.style.setProperty("--sf-rail-bottom", `${Math.round(window.innerHeight - r.bottom)}px`);
    flight.dataset.on = "true";
    flight.dataset.readout = String(railBox.readout);
  };

  const instruments = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const p = clamp(window.scrollY / max, 0, 1);
    flight.style.setProperty("--sf-p", p.toFixed(4));
    const kmLeft = 400 * Math.pow(1 - p, 2.1);
    const landed = p > 0.992;
    flight.dataset.landed = String(landed);
    const altText = landed
      ? "TOUCHDOWN"
      : kmLeft >= 1
        ? `ALT ${Math.round(kmLeft)} km`
        : `ALT ${Math.round(kmLeft * 1000)} m`;
    const m = Math.abs(vel) / 26;
    const machText = landed ? "Mostly harmless" : `MACH ${m.toFixed(1)}`;
    if (alt.textContent !== altText) alt.textContent = altText;
    if (mach.textContent !== machText) mach.textContent = machText;
    const now = performance.now();
    if (m >= 1 && now - machAt > 20000 && railBox.ok && moving()) {
      machAt = now;
      flight.classList.remove("sf-boom");
      void flight.offsetWidth;
      flight.classList.add("sf-boom");
    }
  };

  const tintFor = (id: string) => {
    if (id === chapter || !PALETTES[id]) return;
    chapter = id;
    const [a, b] = PALETTES[id];
    const next = nebulaFlip ? nebulaA : nebulaB;
    const prev = nebulaFlip ? nebulaB : nebulaA;
    nebulaFlip = !nebulaFlip;
    next.style.setProperty("--sf-a", a);
    next.style.setProperty("--sf-b", b);
    next.dataset.show = "true";
    prev.dataset.show = "false";
  };

  const frame = (t: number) => {
    raf = 0;
    const animate = moving();
    // Frame rate independence: 120 Hz screens fall at the same speed as 60 Hz ones.
    const step = clamp((t - (frameAt || t - 16.7)) / 16.7, 0.25, 3);
    frameAt = t;
    stepNow = step;
    const y = window.scrollY;
    const dy = y - lastY;
    lastY = y;
    // A long jump (anchor, keyboard End, scrollbar drag) reads as hyperspace, not as rain.
    if (Math.abs(dy) > 260 && animate) boost = Math.max(boost, Math.min(1.2, Math.abs(dy) / 900));
    vel = vel * 0.82 + clamp(dy, -70, 70) * 0.18;
    if (Math.abs(vel) < 0.05) vel = 0;
    // Pausing motion clears anything mid flight rather than freezing it on screen.
    if (!animate) meteors.length = 0;
    boost *= Math.pow(0.93, step);
    if (boost < 0.01) boost = 0;
    if (animate && t > nextMeteor) {
      spawnMeteor();
      nextMeteor = t + rand(7000, 15000);
    }
    const pointerBusy = t - lastMove < 450;
    const busy = Math.abs(vel) > 0.4 || boost > 0 || meteors.length > 0 || pointerBusy;
    const covered = !!document.querySelector("dialog[open], [data-cinema-open], .cinema-open");
    const interval = busy ? 15 : lite ? 100 : 50;
    if (t - last >= interval || !animate) {
      last = t;
      draw(t, animate);
      instruments();
    }
    // Busy moments run on animation frames; an idle sky only wakes on a timer for its twinkle.
    if (!animate) return;
    if (covered) idleT = window.setTimeout(kick, 600);
    else if (busy) raf = requestAnimationFrame(frame);
    else idleT = window.setTimeout(kick, interval);
  };
  const kick = () => {
    if (raf) return;
    clearTimeout(idleT);
    raf = requestAnimationFrame(frame);
  };

  const say = (text: string) => {
    toast.textContent = text;
    toast.dataset.show = "true";
    clearTimeout(toastT);
    toastT = window.setTimeout(() => {
      toast.dataset.show = "false";
      window.setTimeout(() => (toast.textContent = ""), 300);
    }, 3200);
  };

  const hyperspace = (strength = 1) => {
    if (!moving()) return;
    boost = Math.max(boost, strength);
    jump.classList.remove("sf-go");
    void jump.offsetWidth;
    jump.classList.add("sf-go");
    kick();
  };

  // Chapter headings get a target lock and a scan beam the first time they arrive.
  const seen = new WeakSet<Element>();
  const lockOn = (h: Element) => {
    if (!moving()) return;
    const r = h.getBoundingClientRect();
    if (r.width < 20) return;
    const lock = el("div", "sf-lock", locks);
    lock.style.setProperty("--x", `${Math.round(r.left + window.scrollX - 10)}px`);
    lock.style.setProperty("--y", `${Math.round(r.top + window.scrollY - 8)}px`);
    lock.style.setProperty("--w", `${Math.round(Math.min(r.width, 980) + 20)}px`);
    lock.style.setProperty("--h", `${Math.round(r.height + 16)}px`);
    for (let i = 0; i < 4; i++) el("i", "", lock);
    el("b", "", lock);
    window.setTimeout(() => lock.remove(), 1500);
  };
  const headingIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting || seen.has(e.target)) continue;
        seen.add(e.target);
        lockOn(e.target);
      }
    },
    { threshold: 0.75 },
  );
  const sectionIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) tintFor(e.target.id);
    },
    { rootMargin: "-45% 0px -45% 0px" },
  );
  const observe = () => {
    document.querySelectorAll("main section[id] h2").forEach((h) => headingIO.observe(h));
    document.querySelectorAll("main section[id]").forEach((s) => sectionIO.observe(s));
  };

  // Holographic glint on cards and panels: a pointer lit sheen clipped to the card.
  let glintFor: Element | null = null;
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    px = e.clientX;
    py = e.clientY;
    if (!moving()) return;
    lastMove = performance.now();
    kick();
    const inside = e.target instanceof Element && !e.target.closest("footer, header, nav, dialog") ? e.target : null;
    let target = inside ? inside.closest(CARD) : null;
    while (target) {
      const r = target.getBoundingClientRect();
      if (r.width >= 150 && r.height >= 64 && r.width * r.height < W * H * 0.6) break;
      target = target.parentElement?.closest(CARD) ?? null;
    }
    if (!target) {
      if (glintFor) glint.dataset.show = "false";
      glintFor = null;
      return;
    }
    const r = target.getBoundingClientRect();
    if (target !== glintFor) {
      glintFor = target;
      glint.style.setProperty("border-radius", getComputedStyle(target).borderRadius || "0px");
    }
    glint.style.setProperty("--l", `${r.left}px`);
    glint.style.setProperty("--t", `${r.top}px`);
    glint.style.setProperty("--w", `${r.width}px`);
    glint.style.setProperty("--h", `${r.height}px`);
    glint.style.setProperty("--gx", `${((e.clientX - r.left) / r.width) * 100}%`);
    glint.style.setProperty("--gy", `${((e.clientY - r.top) / r.height) * 100}%`);
    glint.dataset.show = "true";
  };
  const onLeave = () => {
    px = py = -999;
    glint.dataset.show = "false";
    glintFor = null;
  };

  const onDown = (e: PointerEvent) => {
    if (!moving() || !(e.target instanceof Element) || !e.target.closest("a, button, summary")) return;
    const ring = el("span", "sf-ripple", overlay);
    ring.style.setProperty("--x", `${e.clientX}px`);
    ring.style.setProperty("--y", `${e.clientY}px`);
    window.setTimeout(() => ring.remove(), 700);
  };

  const onClick = (e: MouseEvent) => {
    const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
    const hash = a?.getAttribute("href") ?? "";
    if (hash.length < 2 || hash === "#main-content" || a?.closest(".skip-link")) return;
    const now = performance.now();
    if (now - lastJump < 700) return;
    lastJump = now;
    const dest = /^#[\w-]+$/.test(hash) ? document.getElementById(hash.slice(1)) : null;
    hyperspace(dest ? 1 : 0.55);
    if (dest) {
      const h = dest.querySelector("h2");
      if (h) window.setTimeout(() => lockOn(h), 760);
    }
  };

  const fire = (egg: string) => {
    if (!moving()) {
      say("Motion is paused. The stars are waiting for you.");
      return;
    }
    if (egg === "starfall") {
      for (let i = 0; i < 26; i++) window.setTimeout(() => spawnMeteor(true), i * 110);
      say("Starfall. Make a wish. Then make it testable.");
      kick();
    } else if (egg === "engage") {
      hyperspace(1.4);
      say("Engaging. Warp factor sensible.");
    } else {
      hyperspace(1.7);
      say("Zoom. Somewhere, a test pilot nods.");
    }
  };
  const onEgg = (e: Event) => {
    const egg = (e as CustomEvent<string>).detail;
    if (EGGS.includes(egg)) fire(egg);
  };

  const onKey = (e: KeyboardEvent) => {
    const t = e.target;
    if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    keyBuf = (keyBuf + e.key.toLowerCase()).slice(-8);
    const egg = EGGS.find((w) => keyBuf.endsWith(w));
    if (!egg) return;
    keyBuf = "";
    fire(egg);
  };

  let resizeT = 0;
  const onResize = () => {
    clearTimeout(resizeT);
    resizeT = window.setTimeout(() => {
      // Phones fire resize as the address bar slides; keep the same stars unless the width changed.
      if (window.innerWidth !== W) seed();
      else {
        H = window.innerHeight;
        canvas.height = sky.height = Math.round(H * dpr);
      }
      measureRail();
      kick();
    }, 140);
  };
  const onScroll = () => {
    if (glintFor) {
      glint.dataset.show = "false";
      glintFor = null;
    }
    kick();
  };
  const syncFlag = () => {
    html.dataset.sfMotion = html.dataset.motion !== "off" && !reduceQuery.matches ? "on" : "off";
  };
  const onVisibility = () => {
    syncFlag();
    kick();
  };
  const motionObserver = new MutationObserver(onVisibility);

  seed();
  measureRail();
  observe();
  tintFor("top");
  syncFlag();
  motionObserver.observe(html, { attributes: true, attributeFilter: ["data-motion"] });
  reduceQuery.addEventListener("change", onVisibility);
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pointermove", onMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onLeave);
  window.addEventListener("pointerdown", onDown, { passive: true });
  document.addEventListener("click", onClick, true);
  window.addEventListener("keydown", onKey);
  window.addEventListener("cashio-starfall", onEgg);
  document.addEventListener("visibilitychange", onVisibility);
  // Late chapters and the rail can settle after hydration; look again once things are calm.
  void document.fonts?.ready.then(measureRail);
  const settle = window.setTimeout(() => {
    observe();
    measureRail();
  }, 2400);
  // Arrival: a short starfall across the opening frame, once per browser session.
  let arrived = false;
  try {
    arrived = sessionStorage.getItem("cashio-starfall-arrival") === "1";
    sessionStorage.setItem("cashio-starfall-arrival", "1");
  } catch {
    /* Optional browser capability; the shower simply plays. */
  }
  const arrivalTimers: number[] = [];
  if (!arrived && moving() && window.scrollY < H * 0.5) {
    [300, 900, 1350, 2100, 2600, 3400].forEach((ms) =>
      arrivalTimers.push(window.setTimeout(() => (spawnMeteor(), kick()), ms)),
    );
  }
  kick();

  return () => {
    arrivalTimers.forEach(clearTimeout);
    cancelAnimationFrame(raf);
    clearTimeout(idleT);
    clearTimeout(settle);
    clearTimeout(resizeT);
    clearTimeout(toastT);
    headingIO.disconnect();
    sectionIO.disconnect();
    motionObserver.disconnect();
    reduceQuery.removeEventListener("change", onVisibility);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("pointerdown", onDown);
    document.removeEventListener("click", onClick, true);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("cashio-starfall", onEgg);
    document.removeEventListener("visibilitychange", onVisibility);
    [nebulaA, nebulaB, canvas, overlay, locks, flight, toast].forEach((n) => n.remove());
    html.classList.remove("sf-on");
    delete html.dataset.sfMotion;
  };
}
