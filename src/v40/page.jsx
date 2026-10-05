import React from "react";
import designSystem from "./design-system.js";
const h = React.createElement;
const styleCache = new Map();
function style(value) {
  if (typeof value !== "string") return value;
  if (styleCache.has(value)) return styleCache.get(value);
  const result = {};
  for (const item of value.split(";")) {
    const index = item.indexOf(":");
    if (index < 0) continue;
    const prop = item.slice(0, index).trim();
    result[prop.startsWith("--") ? prop : prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = item
      .slice(index + 1)
      .trim();
  }
  if (styleCache.size < 2000) styleCache.set(value, result);
  return result;
}
const resources = {
  r_public_assets_zenith_celestial_signature_poster_webp: "/v40/assets/8c3bf29b-903b-44c9-a462-74f54293a7de.webp",
  r_public_assets_zenith_armillary_nocturne_poster_webp: "/v40/assets/bbd13e89-003e-4a1d-9abc-abb63cf3fe0c.webp",
  r_public_assets_zenith_armillary_detail_poster_webp: "/v40/assets/7d5cfa48-0af5-4615-9915-2077fd92a636.webp",
  r_public_assets_zenith_starship_blue_hour_poster_webp: "/v40/assets/89ad4cf0-e853-446d-be0d-791520759ebb.webp",
  r_public_v38_assets_room_heritage_webp: "/v40/assets/cbbffb9e-1815-49a0-a076-13498335b071.webp",
  r_public_assets_zenith_orbital_dust_poster_webp: "/v40/assets/8f1d9b07-6a95-4e48-bd39-47a1ac959099.webp",
  r_public_assets_zenith_quiet_intelligence_poster_webp: "/v40/assets/712cc780-c521-4a59-8944-7404e746eeb4.webp",
  r_public_assets_zenith_the_long_view_poster_webp: "/v40/assets/aa50f00a-6b40-4a6f-862a-88225656e189.webp",
  r_public_assets_zenith_lamplight_prototype_poster_webp: "/v40/assets/47d7eb5b-c627-4243-a8d5-3bca3cbb8ad4.webp",
  r_public_assets_zenith_portal_arrival_poster_webp: "/v40/assets/f884829d-e3b2-4f6b-915f-3e7bb1d0bc64.webp",
  r_public_v38_assets_room_starship_webp: "/v40/assets/eca826b5-0914-4171-aaf7-dfa365de155d.webp",
  r_public_assets_zenith_starship_flyby_poster_webp: "/v40/assets/4c7b8796-9e7b-4d67-b9f7-011728c09b29.webp",
  r_public_v38_assets_room_studios_threshold_webp: "/v40/assets/982ab837-0359-4ade-ac13-1d70245b3a1c.webp",
  r_public_assets_zenith_starship_dockside_poster_webp: "/v40/assets/8648b394-ea0e-47f3-83cf-27e95a2971e8.webp",
  r_public_assets_zenith_threshold_poster_webp: "/v40/assets/c6a4e496-a568-41c5-9be9-85f85041954e.webp",
  r_public_assets_zenith_ringed_horizon_poster_webp: "/v40/assets/3bc5c037-21d7-499d-93c2-0736b4712867.webp",
  r_public_v38_assets_room_principles_webp: "/v40/assets/43d1defe-0ddd-4c72-bab2-67985bf57fc1.webp",
  r_public_assets_zenith_workshop_after_hours_poster_webp: "/v40/assets/a3955f7d-05c0-46d2-8ea0-3abe602982d4.webp",
  r_public_assets_zenith_orbital_instrument_poster_webp: "/v40/assets/97576ef5-b697-4775-8a8a-64422163db70.webp",
  r_public_assets_celestial_helios_arrival_poster_jpg: "/v40/assets/f1893ce2-f71a-4b0e-b24b-c6aa394ec12a.jpg",
};

export class V40Page extends React.Component {
  res(p) {
    const id = "r_" + p.replace(/[^a-z0-9]/gi, "_");
    return resources[id] || p;
  }
  state = {
    wide: typeof window !== "undefined" ? window.innerWidth >= 1180 : true,
    active: "top",
    pv: null,
    pvShown: false,
    intent: "draft",
    priv: false,
    sources: false,
    routed: null,
    copied: false,
    exp: 0,
    node: "hermes",
    tracePrivate: false,
    traceStep: -1,
    tracing: false,
    eveLog: [
      ["d", "Page updated · October 5, 2026 · V40 Mostly Harmless"],
      [
        "d",
        "Fleet, scheduler, Atlas configuration and backup integrity: October 3. Earlier console and routing audits stay in the archive.",
      ],
      ["d", "Each reply carries its own date. Easter egg replies are marked lore."],
      ["d", "Tap a command below or type your own. Try help."],
    ],
    eveInput: "",
    sig: "dormant",
    emailCopied: false,
    film: "starship-flyby",
    coll: 0,
    cinema: null,
    alert: false,
    warp: false,
    traceLog: [["[ 0.00]", "READY", "Standing by. Press Trace a request, or let it run when the map comes into view."]],
  };

  films = [
    [
      0,
      "starship-blue-hour",
      "Starship Blue Hour",
      "A quiet ship above a lamplit workshop. The evening is just getting started.",
    ],
    [
      0,
      "starship-dockside",
      "Starship Dockside",
      "Home for the evening. Warm windows, a waiting ship, and nowhere urgent to be.",
    ],
    [0, "starship-flyby", "Starship Flyby", "A slow departure over the workshop, into the deep blue evening."],
    [
      0,
      "workshop-after-hours",
      "Workshop After Hours",
      "The lamp stays on a little longer. There is always one more idea.",
    ],
    [
      0,
      "lamplight-prototype",
      "Lamplight Prototype",
      "A small brass mechanism catches the last light on a wooden workbench.",
    ],
    [
      0,
      "quiet-intelligence",
      "Quiet Intelligence",
      "Brass, graphite and a trace of cyan. A close look at an imagined machine.",
    ],
    [
      1,
      "armillary-nocturne",
      "Armillary Nocturne",
      "Brass rings turn against the dark. A small universe, keeping its own time.",
    ],
    [
      1,
      "orbital-instrument",
      "Orbital Instrument",
      "An armillary sphere traces its quiet orbit through a drift of gold.",
    ],
    [
      1,
      "armillary-detail",
      "Armillary Detail",
      "Up close with the instrument: engraved brass, crossing rings and moving light.",
    ],
    [1, "orbital-dust", "Orbital Dust", "A fine gold orbit gathers dust and light at the edge of the dark."],
    [
      1,
      "celestial-signature",
      "Celestial Signature",
      "The cAshIo signature holds steady while a thin orbit and gold motes drift around it.",
    ],
    [2, "threshold", "Threshold", "Through a gold portal, toward the rings of a distant world.", true],
    [2, "portal-arrival", "Portal Arrival", "A doorway in space. A ringed planet on the other side.", true],
    [2, "ringed-horizon", "Ringed Horizon", "An unhurried view across the rings of an imagined planet."],
    [2, "the-long-view", "The Long View", "From a dark observatory, a telescope looks out toward a blue world."],
  ];
  collections = ["The workshop", "Gold in orbit", "Beyond the doorway"];

  filmById(slug) {
    if (slug === "intro")
      return {
        slug,
        title: "Orbital arrival",
        desc: "Watch the intro · 6 seconds",
        coll: "Helios",
        src: "/assets/celestial/helios-arrival-960.mp4",
        poster: this.res("public/assets/celestial/helios-arrival-poster.jpg"),
      };
    const f = this.films.find((x) => x[1] === slug) || this.films[2];
    return {
      slug: f[1],
      title: f[2],
      desc: f[3],
      coll: "Zenith · " + this.collections[f[0]],
      src: `/assets/zenith/${f[1]}.mp4`,
      poster: this.res(`public/assets/zenith/${f[1]}-poster.webp`),
      noloop: !!f[4],
    };
  }

  componentDidMount() {
    this.reduce = document.documentElement.dataset.motion === "off";
    window.cashioV40 = this;
    this.onResize = () => this.setState({ wide: window.innerWidth >= 1180, navOn: window.innerWidth >= 1100 });
    this.setState({ navOn: window.innerWidth >= 1100 });
    this.sio = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            this.scramble(e.target);
            this.sio.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -10% 0px" },
    );
    this.setupFx();
    const hv = document.getElementById("hero-video");
    if (hv) {
      hv.addEventListener("ended", () => {
        if (hv.dataset.noloop === "1") this.heroHandoff();
      });
      hv.addEventListener("error", () => this.heroHandoff());
    }
    this.uio = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting && !this.autoTraced && !this.reduce) {
            this.autoTraced = true;
            this.uio.disconnect();
            setTimeout(() => this.startTrace(), 600);
          }
        }),
      { threshold: 0.45 },
    );
    const rm = document.getElementById("request-map");
    if (rm) this.uio.observe(rm);
    window.addEventListener("resize", this.onResize);
    const ids = [
      "top",
      "workshop",
      "rooms",
      "films",
      "law",
      "work",
      "studies",
      "universe",
      "evidence",
      "operator",
      "contact",
    ];
    this.io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) this.setState({ active: e.target.id });
        });
      },
      { rootMargin: `-${Math.round(innerHeight * 0.3)}px 0px -${Math.round(innerHeight * 0.45)}px 0px` },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) this.io.observe(el);
    });
    this.vio = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          const v = e.target;
          if (
            e.isIntersecting &&
            !this.reduce &&
            !document.hidden &&
            (v.id !== "hero-loop" || this.handedOff) &&
            !(v.id === "hero-video" && this.handedOff)
          ) {
            v.muted = true;
            v.play().catch(() => {});
          } else v.pause();
        }),
      { threshold: 0.12 },
    );
    this.rio = new IntersectionObserver(
      (es) => {
        this.ioAlive = true;
        es.forEach((e) => {
          if (e.isIntersecting) {
            this.reveal(e.target);
            this.rio.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    this.onScroll = () => this.scrollFx();
    window.addEventListener("scroll", this.onScroll, { passive: true });
    this.keyBuf = "";
    this.onKey = (e) => {
      if (e.key === "Escape" && this.state.cinema) {
        this.setState({ cinema: null });
        return;
      }
      if (this.state.cinema && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        this.stepCinema(e.key === "ArrowRight" ? 1 : -1);
        return;
      }
      const t = e.target && e.target.tagName;
      if (t === "INPUT" || t === "TEXTAREA" || !e.key || e.key.length !== 1) return;
      this.keyBuf = (this.keyBuf + e.key.toLowerCase()).slice(-7);
      if (this.keyBuf === "defiant") {
        this.keyBuf = "";
        this.defiant();
      }
    };
    window.addEventListener("keydown", this.onKey);
    this.applyScan();
    this.waitForCanvas();
    this.setupVideos();
    this.setupReveal();
    this.scrollFx();
    this.lastFilm = this.state.film;
    this.installPolish();
    setTimeout(() => {
      if (!this.ioAlive) document.querySelectorAll('[data-rv="1"]').forEach((el) => this.reveal(el));
    }, 1600);
  }
  componentDidUpdate() {
    if (!this.starsStarted) this.waitForCanvas(0);
    if (this.lastScan !== this.props.scanlines) this.applyScan();
    this.setupVideos();
    this.setupReveal();
    if (this.lastLog !== this.state.eveLog) {
      this.lastLog = this.state.eveLog;
      const el = document.getElementById("eve-out");
      const b = el && el.parentElement;
      if (b) b.scrollTop = b.scrollHeight;
    }
    if (this.lastTrace !== this.state.traceLog) {
      this.lastTrace = this.state.traceLog;
      const el = document.getElementById("trace-out");
      const b = el && el.parentElement;
      if (b) b.scrollTop = b.scrollHeight;
    }
    if (this.lastFilm !== this.state.film) {
      this.lastFilm = this.state.film;
      const v = document.getElementById("feature-video");
      if (v) {
        v.load();
        if (!this.reduce && !document.hidden) v.play().catch(() => {});
      }
    }
    if (this.lastCinema !== this.state.cinema) {
      this.lastCinema = this.state.cinema;
      if (this.syncMotion) this.syncMotion();
      document.documentElement.style.overflow = this.state.cinema ? "hidden" : "";
      const v = document.getElementById("cinema-video");
      if (v) {
        v.muted = true;
        v.load();
        v.play().catch(() => {});
      }
    }
  }
  installPolish() {
    this.heroVisible = true;
    this.syncMotion = () => {
      this.reduce = document.documentElement.dataset.motion === "off";
      cancelAnimationFrame(this.raf);
      cancelAnimationFrame(this.fxRaf);
      const active = !this.reduce && !document.hidden;
      document.querySelectorAll("video").forEach((v) => {
        const r = v.getBoundingClientRect();
        const visible = r.bottom > 0 && r.top < innerHeight;
        const permitted =
          v.dataset.v === "auto" &&
          visible &&
          active &&
          !this.state.cinema &&
          !(v.id === "hero-loop" && !this.handedOff) &&
          !(v.id === "hero-video" && this.handedOff);
        if (permitted) v.play().catch(() => {});
        else if (v.id !== "cinema-video" || document.hidden) v.pause();
      });
      if (this.reduce) {
        document.querySelectorAll("[data-reveal]").forEach((el) => this.reveal(el));
        document.querySelectorAll("[data-tilt], [data-mag], #hero-content, #hero-video").forEach((el) => {
          el.style.transform = "";
          el.style.opacity = "";
        });
        document.querySelectorAll("[data-glare]").forEach((el) => (el.style.opacity = "0"));
      }
      (this.fxEls || []).forEach((el) => (el.style.display = active ? "" : "none"));
      if (active) {
        if (!this.fxEls) this.setupFx();
        else if (this.followFx) this.followFx();
      }
      if (this.heroVisible && this.starLoop) this.starLoop();
      this.scrollFx();
    };
    document.addEventListener("cashio-motion", this.syncMotion);
    document.addEventListener("visibilitychange", this.syncMotion);
    this.heroObserver = new IntersectionObserver((es) => {
      this.heroVisible = es[0].isIntersecting;
      cancelAnimationFrame(this.raf);
      if (this.heroVisible && this.starLoop) this.starLoop();
    });
    this.heroObserver.observe(document.getElementById("top"));
    window.dispatchEvent(new Event("cashio-ready"));
    this.syncMotion();
  }
  async copyValue(text, key) {
    try {
      await navigator.clipboard.writeText(text);
      this.setState({ [key]: true });
    } catch (e) {
      this.setState({ [key]: "failed" });
    }
    setTimeout(() => this.setState({ [key]: false }), 2400);
  }
  componentWillUnmount() {
    document.removeEventListener("cashio-motion", this.syncMotion);
    document.removeEventListener("visibilitychange", this.syncMotion);
    if (this.heroObserver) this.heroObserver.disconnect();
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("keydown", this.onKey);
    if (this.onStarResize) window.removeEventListener("resize", this.onStarResize);
    [this.io, this.vio, this.rio, this.cio, this.sio, this.uio, this.pauseIO].forEach((o) => o && o.disconnect());
    Object.values(this.pkT || {}).forEach((t) => clearTimeout(t));
    if (this.onMove) document.removeEventListener("mousemove", this.onMove);
    if (this.onOut) document.removeEventListener("mouseleave", this.onOut);
    cancelAnimationFrame(this.fxRaf);
    (this.fxEls || []).forEach((el) => el.remove());
    cancelAnimationFrame(this.raf);
    clearTimeout(this.starsTimer);
    clearInterval(this.traceTimer);
    document.documentElement.style.overflow = "";
  }
  applyScan() {
    this.lastScan = this.props.scanlines;
    document.body.classList.toggle("za-scanlines", this.props.scanlines ?? true);
  }

  setupVideos() {
    if (!this.pauseIO)
      this.pauseIO = new IntersectionObserver((es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) e.target.pause();
        }),
      );
    document.querySelectorAll("video[data-v]").forEach((v) => {
      if (!v.dataset.pauseObserved) {
        v.dataset.pauseObserved = "1";
        this.pauseIO.observe(v);
      }
      v.muted = true;
      v.playsInline = true;
      v.setAttribute("playsinline", "");
      v.loop = v.dataset.noloop !== "1";
      if (v.dataset.v === "auto" && v.dataset.obs !== "1") {
        v.dataset.obs = "1";
        this.vio.observe(v);
      }
    });
  }
  setupFx() {
    if (this.reduce || !matchMedia("(pointer: fine)").matches) return;
    const ring = document.createElement("div"),
      dot = document.createElement("div");
    [ring, dot].forEach((el) => el.setAttribute("aria-hidden", "true"));
    ring.style.cssText =
      "position:fixed;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:1px solid rgba(0,249,255,.7);box-shadow:0 0 18px rgba(0,249,255,.3);pointer-events:none;z-index:120;opacity:0;transition:width .35s cubic-bezier(.23,1,.32,1),height .35s cubic-bezier(.23,1,.32,1),margin .35s cubic-bezier(.23,1,.32,1),border-color .3s,background .3s,opacity .3s";
    dot.style.cssText =
      "position:fixed;left:0;top:0;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:#ff9500;box-shadow:0 0 10px rgba(255,149,0,.8);pointer-events:none;z-index:121;opacity:0;transition:opacity .3s";
    document.body.append(ring, dot);
    this.fxEls = [ring, dot];
    let mx = -100,
      my = -100,
      rx = -100,
      ry = -100;
    this.onMove = (e) => {
      if (this.reduce || document.hidden) return;
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px,${my}px)`;
      ring.style.opacity = "1";
      dot.style.opacity = "1";
      const big = !!(e.target.closest && e.target.closest("a,button,summary,input,[data-tilt]"));
      if (big !== this.ringBig) {
        this.ringBig = big;
        ring.style.width = ring.style.height = big ? "58px" : "34px";
        ring.style.margin = big ? "-29px 0 0 -29px" : "-17px 0 0 -17px";
        ring.style.borderColor = big ? "rgba(255,149,0,.85)" : "rgba(0,249,255,.7)";
        ring.style.background = big ? "rgba(255,149,0,.06)" : "transparent";
      }
      this.tilt(e);
      this.magnet(e);
    };
    this.onOut = () => {
      ring.style.opacity = "0";
      dot.style.opacity = "0";
    };
    document.addEventListener("mousemove", this.onMove, { passive: true });
    document.addEventListener("mouseleave", this.onOut);
    const follow = () => {
      rx += (mx - rx) * 0.2;
      ry += (my - ry) * 0.2;
      ring.style.transform = `translate(${rx}px,${ry}px)`;
      if (!this.reduce && !document.hidden) this.fxRaf = requestAnimationFrame(follow);
    };
    this.followFx = follow;
    follow();
  }
  tilt(e) {
    const el = e.target.closest && e.target.closest("[data-tilt]");
    if (this.tiltEl && this.tiltEl !== el) {
      this.tiltEl.style.transform = "";
      const og = this.tiltEl.querySelector(":scope > [data-glare]");
      if (og) og.style.opacity = "0";
    }
    this.tiltEl = el;
    if (!el) return;
    const b = el.getBoundingClientRect(),
      nx = (e.clientX - b.left) / b.width,
      ny = (e.clientY - b.top) / b.height;
    const amt = parseFloat(el.dataset.tilt) || 6;
    el.style.transition = "transform .25s cubic-bezier(.23,1,.32,1), box-shadow .45s, border-color .45s";
    el.style.transform = `perspective(1000px) rotateX(${(0.5 - ny) * amt}deg) rotateY(${(nx - 0.5) * amt}deg) translateY(-4px)`;
    let g = el.querySelector(":scope > [data-glare]");
    if (!g) {
      g = document.createElement("span");
      g.setAttribute("data-glare", "");
      g.setAttribute("aria-hidden", "true");
      g.style.cssText =
        "position:absolute;inset:0;pointer-events:none;border-radius:inherit;opacity:0;transition:opacity .35s;mix-blend-mode:screen;z-index:4";
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      el.appendChild(g);
    }
    g.style.opacity = "1";
    g.style.background = `radial-gradient(circle at ${nx * 100}% ${ny * 100}%, rgba(255,255,255,.16), rgba(0,249,255,.05) 30%, transparent 60%)`;
  }
  magnet(e) {
    if (!this.mags || Date.now() - this.magT > 1500) {
      this.mags = Array.from(document.querySelectorAll(".za-btn--primary"));
      this.magT = Date.now();
    }
    for (const m of this.mags) {
      const b = m.getBoundingClientRect();
      const dx = e.clientX - (b.left + b.width / 2),
        dy = e.clientY - (b.top + b.height / 2);
      const R = Math.max(b.width, b.height) * 0.85;
      if (Math.hypot(dx, dy) < R) {
        m.style.transform = `translate(${dx * 0.2}px,${dy * 0.28}px)`;
        m.dataset.mag = "1";
      } else if (m.dataset.mag) {
        m.style.transform = "";
        delete m.dataset.mag;
      }
    }
  }
  scramble(el) {
    if (this.reduce) return;
    if (el.dataset.scrambled) return;
    el.dataset.scrambled = "1";
    const final = el.textContent,
      chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789▸◆/·";
    let f = 0;
    const step = () => {
      if (this.reduce || document.hidden) {
        el.textContent = final;
        return;
      }
      f++;
      const reveal = Math.floor(f * 1.5);
      let out = "";
      for (let i = 0; i < final.length; i++) {
        const ch = final[i];
        out += i < reveal || ch === " " ? ch : chars[Math.floor(Math.random() * chars.length)];
      }
      el.textContent = reveal >= final.length ? final : out;
      if (reveal < final.length) setTimeout(step, 30);
    };
    step();
  }
  setupReveal() {
    if (this.sio && !this.reduce)
      document.querySelectorAll("[data-scramble]:not([data-sobs])").forEach((el) => {
        el.dataset.sobs = "1";
        this.sio.observe(el);
      });
    document.querySelectorAll("[data-reveal]:not([data-rv])").forEach((el) => {
      el.dataset.rv = "1";
      if (this.reduce || el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
      const sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.opacity = "0";
      el.style.transform = "translateY(40px)";
      el.style.transition = `opacity 1s cubic-bezier(.23,1,.32,1) ${Math.min(sib, 6) * 0.08}s, transform 1s cubic-bezier(.23,1,.32,1) ${Math.min(sib, 6) * 0.08}s`;
      this.rio.observe(el);
    });
  }
  reveal(el) {
    el.style.opacity = "1";
    el.style.transform = "none";
    el.querySelectorAll("[data-count]").forEach((n) => this.countUp(n));
  }
  countUp(n) {
    if (n.dataset.counted) return;
    n.dataset.counted = "1";
    if (this.reduce) {
      n.textContent = Number(n.dataset.count).toLocaleString("en-US");
      return;
    }
    const to = parseFloat(n.dataset.count),
      t0 = Date.now(),
      dur = 1400;
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / dur),
        e = 1 - Math.pow(1 - p, 4);
      n.textContent = Math.round(to * e).toLocaleString("en-US");
      if (p < 1) setTimeout(tick, 30);
    };
    tick();
  }
  scrollFx() {
    const y = window.scrollY,
      H = document.documentElement.scrollHeight - window.innerHeight;
    const pb = document.getElementById("scroll-prog");
    if (pb) pb.style.transform = `scaleX(${H > 0 ? Math.min(1, y / H) : 0})`;
    const hc = document.getElementById("hero-content");
    if (hc && !this.reduce) {
      const k = Math.min(1, y / 760);
      hc.style.transform = `translateY(${y * 0.2}px)`;
      hc.style.opacity = String(1 - k * 0.85);
    }
    const law = document.getElementById("law");
    if (law) {
      const r = law.getBoundingClientRect(),
        span = r.height - window.innerHeight;
      const p = Math.max(0, Math.min(1, -r.top / (span || 1)));
      const ws = law.querySelectorAll("[data-mword]"),
        n = ws.length;
      ws.forEach((w, i) => {
        const a = this.reduce ? 1 : Math.max(0, Math.min(1, p * (n + 1.5) * 1.1 - i));
        w.style.opacity = String(0.12 + a * 0.88);
        w.style.textShadow =
          a > 0.95
            ? w.dataset.mword === "b"
              ? "0 0 40px rgba(255,149,0,.55)"
              : "0 0 40px rgba(0,249,255,.35)"
            : "none";
      });
      const bar = document.getElementById("law-bar");
      if (bar) bar.style.transform = `scaleX(${p})`;
    }
  }

  waitForCanvas(tries = 0) {
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
  startStars(c) {
    if (!c) return;
    const ctx = c.getContext("2d");

    const density = this.props.starDensity ?? 220;
    let w, h, stars;
    const reset = () => {
      w = c.width = c.offsetWidth * Math.min(devicePixelRatio, 2);
      h = c.height = c.offsetHeight * Math.min(devicePixelRatio, 2);
      stars = Array.from({ length: density }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.3 + Math.random() * 0.7,
        t: Math.random() * 6.28,
      }));
    };
    reset();
    this.onStarResize = reset;
    window.addEventListener("resize", reset);
    let t = 0;
    const dpr = Math.min(devicePixelRatio, 2);
    const draw = () => {
      if (!c.isConnected) return;
      const reduce = this.reduce;
      if (c.offsetWidth * dpr !== w) reset();
      t += 0.016;
      const warp = Date.now() < (this.warpUntil || 0);
      ctx.clearRect(0, 0, w, h);
      const hz = h * 0.64,
        cols = 28,
        rows = 16;
      ctx.lineWidth = dpr;
      for (let i = 0; i <= cols; i++) {
        const x = (i / cols) * w,
          a = 0.04 + 0.08 * (1 - Math.abs(i / cols - 0.5) * 2);
        ctx.strokeStyle = `rgba(0,249,255,${a})`;
        ctx.beginPath();
        ctx.moveTo(w / 2 + (x - w / 2) * 0.1, hz);
        ctx.lineTo(w / 2 + (x - w / 2) * 2.8, h);
        ctx.stroke();
      }
      const off = reduce ? 0 : (t * (warp ? 3 : 0.25)) % 1;
      for (let j = 0; j < rows; j++) {
        const p = Math.pow((j + off) / rows, 2.2),
          y = hz + p * (h - hz);
        ctx.strokeStyle = `rgba(255,149,0,${0.02 + p * 0.2})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      const g = ctx.createLinearGradient(0, hz - 2, 0, hz + 70);
      g.addColorStop(0, "rgba(255,149,0,.3)");
      g.addColorStop(1, "rgba(255,149,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, hz - 1, w, 70);
      for (const s of stars) {
        if (s.y > hz) continue;
        if (warp) {
          const len = 90 * s.z * dpr;
          ctx.strokeStyle = `rgba(160,250,255,${0.4 + 0.5 * s.z})`;
          ctx.lineWidth = 1.4 * s.z * dpr;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x + len, s.y);
          ctx.stroke();
          s.x -= 40 * s.z * dpr;
          if (s.x < -len) s.x = w;
          continue;
        }
        const tw = reduce ? 1 : 0.55 + 0.45 * Math.sin(t * 1.6 + s.t);
        ctx.fillStyle = `rgba(228,228,240,${0.25 + 0.6 * tw * s.z})`;
        ctx.fillRect(s.x, s.y, 1.2 * s.z * dpr + 0.4, 1.2 * s.z * dpr + 0.4);
        if (!reduce) {
          s.x -= 0.04 * s.z * dpr;
          if (s.x < 0) s.x = w;
        }
      }
      ctx.lineWidth = dpr;
    };
    const loop = () => {
      draw();
      if (!this.reduce && !document.hidden && this.heroVisible !== false && c.isConnected)
        this.raf = requestAnimationFrame(loop);
    };
    this.starLoop = loop;
    draw();
    loop();
  }

  warpFlash() {
    if (this.reduce || document.hidden) return;
    this.warpUntil = Date.now() + 1400;
    clearTimeout(this.warpT);
    this.setState({ warp: true });
    this.warpT = setTimeout(() => this.setState({ warp: false }), 950);
  }
  defiant() {
    this.warpFlash();
    this.warpUntil = Date.now() + 2600;
    clearTimeout(this.alertT);
    this.setState((s) => ({
      alert: true,
      eveLog: [
        ...s.eveLog,
        ["alert", "RED ALERT · AUTHORIZATION ACCEPTED · ADMIRAL CASHIO"],
        ["lore", "LORE · Gloves off. The word is defiant. All hands to stations."],
        ["d", "Standing down in four seconds. Nothing left the lab."],
      ],
    }));
    this.alertT = setTimeout(() => this.setState({ alert: false }), 4200);
  }
  stepCinema(d) {
    const list = this.films.map((f) => f[1]);
    const i = list.indexOf(this.state.cinema);
    this.setState({ cinema: list[(i + d + list.length) % list.length] });
  }

  lane(intent, priv, sources) {
    if (priv)
      return {
        name: "Human review",
        code: "HELD",
        label: "EXTERNAL ROUTE HELD",
        color: "var(--accent)",
        detail:
          "Private input holds the external route for human review. A person decides before anything leaves the lab.",
      };
    if (intent === "research" || sources)
      return {
        name: "Sourced research",
        code: "QUALIFIED",
        label: "RESEARCH LANE",
        color: "var(--cyan)",
        detail: "Research intent or a source requirement selects Research, the route for checking claims.",
      };
    if (intent === "analyze")
      return {
        name: "Combining information",
        code: "QUALIFIED",
        label: "SYNTHESIS LANE",
        color: "var(--purple)",
        detail: "Analyze selects Synthesis, the route for combining information.",
      };
    return {
      name: "Everyday drafting",
      code: "QUALIFIED",
      label: "WORKHORSE LANE",
      color: "var(--green)",
      detail: "Draft selects Workhorse, the route for everyday work.",
    };
  }

  eve(raw) {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    if (cmd === "defiant") {
      this.setState((s) => ({ eveLog: [...s.eveLog, ["cmd", raw.trim()]], eveInput: "" }));
      this.defiant();
      return;
    }
    const R = {
      help: [["r", "Commands: fleet · hosts · backups · atlas · routes · cost · about · contact · surprise me"]],
      fleet: [
        ["ok", "20 containers and 1 virtual machine on 2 hosts"],
        ["d", "Observed October 3, 2026 · counts describe running guests, not application health"],
      ],
      hosts: [
        ["ok", "2 of 2 hosts at probe · quorate"],
        ["d", "Per host guest counts and the hypervisor identity are withheld"],
      ],
      backups: [
        ["ok", "Every snapshot on record passed its integrity check"],
        ["d", "990 files verified on a second host · October 3, 2026 · a live system restore was not performed"],
      ],
      atlas: [
        ["ok", "Atlas · local model · primary configuration: a 16,384 token window"],
        ["d", "Read October 3, 2026"],
      ],
      routes: [
        ["warn", "Public lanes: not verified"],
        ["d", "The August 28 archive recorded 10. No current public lane inventory or execution record exists."],
      ],
      cost: [
        ["warn", "Spending is withheld"],
        ["d", "The routing law stands: Quality picks the model. Cost only breaks a tie."],
      ],
      about: [
        ["r", "Doug Cashio · Principal Solutions Consultant · a hobby lab for local AI, a human in command"],
        ["d", "A technology career since 1996, with more than twenty years in cybersecurity"],
      ],
      contact: [
        ["r", "doug@cashio.us"],
        ["d", "Open to speaking, mentoring and comparing notes"],
      ],
      42: [["lore", "LORE · The answer is probably not 42. Keep a towel handy and don’t panic."]],
      towel: [["lore", "LORE · Towel located. Kept handy, as advised."]],
      "don't panic": [["lore", "LORE · Large, friendly letters engaged. Nothing on this page requires panic."]],
      "dont panic": [["lore", "LORE · Large, friendly letters engaged. Nothing on this page requires panic."]],
      "mostly harmless": [["lore", "LORE · V40, Mostly Harmless. Two releases short of the answer, and holding."]],
      spice: [["lore", "LORE · Spice flows on Arrakis. Private data stays home."]],
    };
    const lore = [
      "LORE · Mostly Harmless: V40 ships two releases short of the answer.",
      "LORE · A human in command is not a bottleneck. It is the point.",
      "LORE · Zeus and Apollo keep the lights on. Hermes carries the messages. Nobody gets a throne.",
      "LORE · Fly it like a test pilot: know the envelope, then write down what the instruments actually said.",
    ];
    let out = R[cmd];
    if (cmd === "surprise me" || cmd === "surprise") out = [["lore", lore[Math.floor(Math.random() * lore.length)]]];
    if (cmd === "clear") {
      this.setState({ eveLog: [], eveInput: "" });
      return;
    }
    if (!out) {
      const near = Object.keys(R).find((k) => k.startsWith(cmd[0]));
      out = [
        ["er", `command not found: ${raw.trim()}`],
        ["d", near ? `did you mean ${near}? try help` : "try help"],
      ];
    }
    this.setState((s) => ({ eveLog: [...s.eveLog, ["cmd", raw.trim()], ...out], eveInput: "" }));
  }

  startTrace() {
    if (this.state.tracing) return;
    clearInterval(this.traceTimer);
    const tp = this.state.tracePrivate,
      caps = this.traceCaps(tp),
      t0 = Date.now();
    const tags = ["INTENT", "QUALIFY", tp ? "HOLD" : "COMPUTE", "REVIEW"];
    const stamp = () => `[${((Date.now() - t0) / 1000).toFixed(2).padStart(5, " ")}]`;
    this.setState({ tracing: true, traceStep: 0, traceLog: [[stamp(), tags[0], caps[0]]] });
    this.runPacket(0, tp);
    let i = 0;
    this.traceTimer = setInterval(() => {
      i += 1;
      if (i > 3) {
        clearInterval(this.traceTimer);
        this.setState((s) => ({
          tracing: false,
          traceLog: [
            ...s.traceLog,
            [
              stamp(),
              "DONE",
              tp
                ? "A person holds the decision. Nothing left the lab."
                : "Route complete · Workhorse · no request was sent.",
            ],
          ],
        }));
        return;
      }
      this.setState((s) => ({ traceStep: i, traceLog: [...s.traceLog, [stamp(), tags[i], caps[i]]] }));
      this.runPacket(i, tp);
    }, 1800);
  }
  traceCaps(tp) {
    return [
      "Intent · the operator asks for a draft.",
      "Qualify · HERMES reads the request and checks the boundary.",
      tp
        ? "Hold · private input. The route stops at the console for a person."
        : "Compute · the job runs on Zeus or Apollo.",
      "Review · the result returns to the operator console.",
    ];
  }
  edgeDefs = {
    opHe: [
      [200, 40],
      [200, 95],
      [200, 150],
    ],
    opDsh: [
      [200, 40],
      [110, 50],
      [64, 108],
    ],
    dshHe: [
      [64, 108],
      [120, 150],
      [200, 150],
    ],
    heZe: [
      [200, 150],
      [130, 180],
      [100, 252],
    ],
    heAp: [
      [200, 150],
      [270, 180],
      [300, 252],
    ],
  };
  runPacket(step, tp) {
    const seq = tp
      ? [[["opHe", 1]], [], [["dshHe", -1]], [["opDsh", -1]]]
      : [
          [["opHe", 1]],
          [],
          [
            ["heZe", 1],
            ["heAp", 1],
          ],
          [["dshHe", -1]],
        ];
    seq[step].forEach(([edge, dir], j) => this.animPk(j ? "map-pk-b" : "map-pk-a", edge, dir));
  }
  animPk(id, edge, dir, dur = 1400) {
    if (this.reduce || document.hidden) return;
    const el = document.getElementById(id);
    if (!el) return;
    this.pkT = this.pkT || {};
    clearTimeout(this.pkT[id]);
    const [p0, c, p1] = this.edgeDefs[edge],
      A = dir > 0 ? p0 : p1,
      B = dir > 0 ? p1 : p0,
      t0 = Date.now();
    el.setAttribute("opacity", "1");
    const tick = () => {
      if (this.reduce || document.hidden) {
        el.setAttribute("opacity", "0");
        return;
      }
      const p = Math.min(1, (Date.now() - t0) / dur),
        e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2,
        u = 1 - e;
      el.setAttribute(
        "transform",
        `translate(${u * u * A[0] + 2 * u * e * c[0] + e * e * B[0]} ${u * u * A[1] + 2 * u * e * c[1] + e * e * B[1]})`,
      );
      this.pkT[id] = p < 1 ? setTimeout(tick, 16) : setTimeout(() => el.setAttribute("opacity", "0"), 300);
    };
    tick();
  }
  heroHandoff() {
    const hv = document.getElementById("hero-video"),
      lp = document.getElementById("hero-loop");
    if (!lp || this.handedOff) return;
    this.handedOff = true;
    lp.muted = true;
    lp.loop = true;
    if (!this.reduce && !document.hidden) lp.play().catch(() => {});
    lp.style.opacity = "1";
    if (hv) {
      this.vio.unobserve(hv);
      hv.style.opacity = "0";
      setTimeout(() => hv.pause(), 2600);
    }
  }

  hoverIn(e) {
    const v = e.currentTarget.querySelector("video");
    if (v && !this.reduce) {
      v.muted = true;
      v.loop = true;
      v.style.opacity = "1";
      v.play().catch(() => {});
    }
  }
  hoverOut(e) {
    const v = e.currentTarget.querySelector("video");
    if (v) {
      v.pause();
      v.style.opacity = "0";
    }
  }

  renderVals() {
    const s = this.state,
      tech = this.props.techDetail ?? false;
    const pad = s.wide ? 72 : 0;

    const railDefs = [
      ["top", "Orbit"],
      ["rooms", "Worlds"],
      ["films", "Films"],
      ["work", "Decide"],
      ["studies", "Experiments"],
      ["universe", "Map"],
      ["evidence", "Evidence"],
      ["operator", "Doug"],
      ["contact", "Contact"],
    ];
    const activeRail = s.active === "law" ? "work" : s.active === "workshop" ? "top" : s.active;
    const railItems = railDefs.map(([id, label]) => ({
      href: "#" + id,
      label,
      style: `display:flex;flex-direction:column;align-items:center;gap:8px;padding:10px 6px;border-radius:10px;color:${activeRail === id ? "var(--accent)" : "var(--text-dim)"};background:${activeRail === id ? "rgba(255,149,0,.08)" : "transparent"};transition:all .45s cubic-bezier(.23,1,.32,1)`,
    }));

    const heroFilms = {
      "Orbital arrival": [
        "/assets/celestial/helios-arrival-960.mp4",
        this.res("public/assets/celestial/helios-arrival-poster.jpg"),
        "1",
      ],
      "Ringed horizon": [
        "/assets/zenith/ringed-horizon.mp4",
        this.res("public/assets/zenith/ringed-horizon-poster.webp"),
        "0",
      ],
      "Starship flyby": [
        "/assets/zenith/starship-flyby.mp4",
        this.res("public/assets/zenith/starship-flyby-poster.webp"),
        "0",
      ],
      Threshold: ["/assets/zenith/threshold.mp4", this.res("public/assets/zenith/threshold-poster.webp"), "1"],
    };
    const hf = heroFilms[this.props.heroFilm] || heroFilms["Orbital arrival"];

    const telemetry = [
      ["2", 2, "Hosts at probe", "var(--cyan)"],
      ["20", 20, "Containers running", "var(--cyan)"],
      ["1", 1, "Virtual machine", "var(--cyan)"],
      ["49", 49, "of 56 scheduled jobs enabled", "var(--accent)"],
      ["990", 990, "Files verified on a second host", "var(--green)"],
    ].map(([value, count, label, color]) => ({ value, count, label, color }));
    const tick = [
      ["2", "hosts"],
      ["20", "containers"],
      ["1", "virtual machine"],
      ["49 of 56", "scheduled jobs enabled"],
      ["990", "files verified"],
      ["16,384", "token window · Atlas"],
      ["Oct 3, 2026", "last observed"],
      ["Read only", "run by me"],
      ["Quality", "picks the model"],
      ["Cost", "only breaks a tie"],
    ];
    const tc = ["var(--cyan)", "var(--accent)", "var(--green)", "var(--purple)", "var(--amber)"];
    const tickerItems = [...tick, ...tick].map(([value, label], i) => ({ value, label, color: tc[i % tc.length] }));

    const enter = (e) => this.hoverIn(e),
      leave = (e) => this.hoverOut(e);
    const worlds = [
      {
        index: "01",
        name: "Starship lab",
        line: "Your ship. Your intelligence.",
        desc: "Pick a mission, cut the cloud link and compare three designs on the same twelve requests.",
        color: "var(--cyan)",
        href: "https://cashio.us/rooms/starship/",
        img: this.res("public/v38/assets/room-starship.webp"),
        video: "/assets/zenith/starship-flyby.mp4",
        hasVideo: true,
      },
      {
        index: "02",
        name: "Principles engine",
        line: "Put the principles in motion.",
        desc: "Turn a small instrument and see the design decision behind each rule.",
        color: "var(--accent)",
        href: "https://cashio.us/rooms/principles/",
        img: this.res("public/v38/assets/room-principles.webp"),
        video: "/assets/zenith/orbital-instrument.mp4",
        hasVideo: true,
      },
      {
        index: "03",
        name: "The Studios",
        line: "A world worth getting lost in.",
        desc: "Shape the light, ignite a 3D signature, or explore the short film collection.",
        color: "var(--purple)",
        href: "https://cashio.us/rooms/studios/",
        img: this.res("public/v38/assets/room-studios-threshold.webp"),
        video: "/assets/zenith/threshold.mp4",
        hasVideo: true,
      },
      {
        index: "04",
        name: "Flight heritage",
        line: "Built with a test pilot’s mind.",
        desc: "Four aviation pioneers and the working lesson I take from each.",
        color: "var(--amber)",
        href: "https://cashio.us/rooms/heritage/",
        img: this.res("public/v38/assets/room-heritage.webp"),
        video: "",
        hasVideo: false,
      },
    ].map((w) => ({ ...w, enter, leave }));

    const F = this.filmById(s.film);
    const collections = this.collections.map((label, i) => ({
      label,
      pick: () => this.setState({ coll: i }),
      style: `padding:8px 14px;border-radius:999px;cursor:pointer;font-family:var(--font-mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;transition:all .3s;border:1px solid ${s.coll === i ? "var(--purple)" : "var(--glass-border)"};background:${s.coll === i ? "rgba(204,0,255,.12)" : "var(--glass)"};color:${s.coll === i ? "var(--text)" : "var(--text-dim)"};box-shadow:${s.coll === i ? "0 0 18px var(--purple-glow)" : "none"}`,
    }));
    const filmList = this.films
      .filter((f) => f[0] === s.coll)
      .map((f) => {
        const on = f[1] === s.film;
        return {
          title: f[2],
          poster: this.res(`public/assets/zenith/${f[1]}-poster.webp`),
          src: `/assets/zenith/${f[1]}.mp4`,
          active: on,
          pressed: String(on),
          enter,
          leave,
          pick: () => this.setState({ film: f[1] }),
          style: `position:relative;display:block;aspect-ratio:16/9;border-radius:12px;overflow:hidden;padding:0;cursor:pointer;background:#000;transition:all .4s cubic-bezier(.23,1,.32,1);border:1px solid ${on ? "var(--accent)" : "var(--glass-border)"};box-shadow:${on ? "0 0 24px var(--accent-glow)" : "var(--shadow-card)"}`,
        };
      });
    const C = s.cinema ? this.filmById(s.cinema) : null;

    const lawA = "Quality picks the model.".split(" ").map((t) => ({ t }));
    const lawB = "Cost only breaks a tie.".split(" ").map((t) => ({ t }));

    const pill = (on, gold) =>
      `padding:9px 16px;border-radius:999px;cursor:pointer;font-family:var(--font-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;transition:all .3s;border:1px solid ${on ? (gold ? "var(--accent)" : "var(--cyan)") : "var(--glass-border)"};background:${on ? (gold ? "rgba(255,149,0,.14)" : "rgba(0,249,255,.1)") : "var(--glass)"};color:${on ? (gold ? "var(--accent)" : "var(--cyan)") : "var(--text)"};box-shadow:${on ? (gold ? "0 0 18px var(--accent-glow)" : "0 0 18px var(--cyan-glow)") : "none"}`;
    const pvChoices = [
      {
        label: "Research tool",
        style: pill(s.pv === "keep", false),
        pick: () => this.setState({ pv: "keep", pvShown: true }),
      },
      {
        label: "A person",
        style: pill(s.pv === "human", true),
        pick: () => this.setState({ pv: "human", pvShown: true }),
      },
    ];
    const pvText =
      s.pv === "keep"
        ? "Not this time. The research tool still fits the task, but private input holds the external route. A person reviews it first."
        : s.pv === "human"
          ? "Yes. Private information always brings in a person. Same task, same sources, a different boundary."
          : "A person. Private input holds the external route for human review, whatever the task asks for.";

    const intents = [
      ["draft", "Draft"],
      ["research", "Research"],
      ["analyze", "Analyze"],
    ].map(([k, label]) => ({
      label,
      style: pill(s.intent === k, false),
      pick: () => this.setState({ intent: k, routed: null }),
    }));
    const tog = (on, gold) =>
      `display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px 10px 14px;border-radius:12px;cursor:pointer;font-family:var(--font-body);font-size:14px;color:var(--text);text-align:left;border:1px solid ${on ? (gold ? "var(--accent)" : "var(--cyan)") : "var(--glass-border)"};background:${on ? (gold ? "rgba(255,149,0,.08)" : "rgba(0,249,255,.06)") : "var(--glass)"};transition:all .3s`;
    const knob = (on, gold) =>
      `width:40px;height:22px;border-radius:11px;flex:0 0 auto;position:relative;background:${on ? (gold ? "var(--accent)" : "var(--cyan)") : "rgba(255,255,255,.12)"};transition:background .3s;box-shadow:${on ? (gold ? "0 0 14px var(--accent-glow)" : "0 0 14px var(--cyan-glow)") : "none"}`;
    const dot = (on) =>
      `position:absolute;top:3px;left:${on ? 21 : 3}px;width:16px;height:16px;border-radius:50%;background:${on ? "var(--void)" : "var(--text)"};transition:left .3s cubic-bezier(.23,1,.32,1)`;
    const r = s.routed;
    const L = r || {
      name: "Choose a task",
      code: "READY",
      label: "ROUTE NOT RUN",
      color: "var(--text-dim)",
      detail: "Choose a task, then follow its five step route.",
    };
    const stepDefs = r
      ? [
          [
            "Read the intent",
            `${s.intent[0].toUpperCase() + s.intent.slice(1)} · sources ${s.sources ? "required" : "optional"}`,
          ],
          [
            "Check the privacy boundary",
            s.priv ? "Private input · external route held" : "Public input · route stays open",
          ],
          ["Check the evidence requirement", s.sources ? "Attributable sources required" : "No source requirement"],
          ["Select the lane", L.label],
          ["Review", s.priv ? "A person decides" : "Result returns to the operator console"],
        ]
      : [];
    const routeSteps = stepDefs.map(([a, b], i) => ({
      n: "0" + (i + 1),
      text: `${a} · ${b}`,
      color: i === 3 ? L.color : "var(--text-dim)",
      style: `display:flex;gap:10px;align-items:baseline;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05);animation:v40-rise .5s cubic-bezier(.23,1,.32,1) ${i * 0.12}s both`,
    }));

    const expDefs = [
      [
        "hermes",
        "Choose a route",
        "HERMES, my scheduler",
        "What wins when intent, evidence requirements, and privacy disagree?",
      ],
      ["cascade", "Know when to pause", "CASCADE", "When should automation stop and ask a person?"],
      ["exposure", "Triage an exposure", "EXPOSURE", "Which finding deserves attention first, and who is told?"],
      ["briefing", "Compose a brief", "BRIEFING", "Choose what matters. Keep the sources and the unknowns attached."],
      ["dashboards", "Age the evidence", "DASHBOARDS", "How old can an observation be before it stops counting?"],
      ["signal", "Corroborate a signal", "SIGNAL", "One signal is a rumor. When does it become evidence?"],
      ["graphify", "Trace a dependency", "GRAPHIFY", "What else moves when one piece of the system changes?"],
    ];
    const experiments = expDefs.map(([_k, name, code], i) => ({
      id: "experiment-" + i,
      selected: String(s.exp === i),
      tabindex: s.exp === i ? 0 : -1,
      num: "0" + (i + 1),
      name,
      code,
      numColor: s.exp === i ? "var(--accent)" : "var(--text-dim)",
      pick: () => this.setState({ exp: i }),
      style: `display:flex;align-items:center;gap:12px;width:100%;padding:12px 14px;border-radius:12px;cursor:pointer;text-align:left;color:var(--text);transition:all .3s;border:1px solid ${s.exp === i ? "var(--accent)" : "var(--glass-border)"};background:${s.exp === i ? "rgba(255,149,0,.08)" : "var(--surface-2)"};box-shadow:${s.exp === i ? "0 0 22px var(--accent-glow)" : "none"}`,
    }));
    const E = expDefs[s.exp];

    const nodeInfo = {
      hermes: {
        title: "HERMES",
        role: "Job scheduler",
        value: "49",
        unit: "enabled scheduled jobs",
        summary: "The scheduler turns a task into a job.",
        body: "49 of 56 retained definitions were enabled at the October 3, 2026 observation. The HERMES experiment explores the routing rule in your browser.",
        evidence: "Scheduler observation · October 3, 2026 · routing not verified",
        color: "accent",
      },
      operator: {
        title: "THE OPERATOR",
        role: "Authority",
        value: "1",
        unit: "human in command",
        summary: "A person keeps the final say.",
        body: "Private information always brings in a person. The operator approves anything that would leave the lab.",
        evidence: "Design rule · published in the dated export",
        color: "amber",
      },
      dsh: {
        title: "DSH",
        role: "Operator console",
        value: "DSH",
        unit: "where I watch and approve",
        summary: "My operator console, where I run everything from.",
        body: "Requests are watched and approved here. Held routes wait at this console for a person.",
        evidence: "Console described October 3, 2026",
        color: "cyan",
      },
      zeus: {
        title: "ZEUS",
        role: "My server",
        value: "2",
        unit: "hosts at probe · 2 of 2",
        summary: "One of the two servers that do the computing.",
        body: "Per host guest counts are withheld. Together the two hosts ran 20 containers and 1 virtual machine on October 3, 2026.",
        evidence: "Fleet observation · October 3, 2026",
        color: "cyan",
      },
      apollo: {
        title: "APOLLO",
        role: "My server",
        value: "20",
        unit: "containers across both hosts",
        summary: "One of the two servers that do the computing.",
        body: "Per host guest counts are withheld. Together the two hosts ran 20 containers and 1 virtual machine on October 3, 2026.",
        evidence: "Fleet observation · October 3, 2026",
        color: "purple",
      },
    };
    const N = nodeInfo[s.node];
    const ts = s.traceStep,
      tp = s.tracePrivate;
    const litNow = (k) =>
      s.node === k ||
      (ts === 0 && k === "operator") ||
      (ts === 1 && k === "hermes") ||
      (ts === 2 && (tp ? k === "dsh" : k === "zeus" || k === "apollo")) ||
      (ts === 3 && (k === "operator" || k === "dsh"));
    const pos = { operator: [50, 13.33], dsh: [16, 36], hermes: [50, 50], zeus: [25, 84], apollo: [75, 84] };
    const nodes = [
      ["operator", "The operator", "Authority", "◆", "var(--amber)"],
      ["dsh", "DSH", "Console", "▣", "var(--cyan)"],
      ["hermes", "HERMES", "Orchestration", "✦", "var(--accent)"],
      ["zeus", "Zeus", "My server", "▤", "var(--cyan)"],
      ["apollo", "Apollo", "My server", "▤", "var(--purple)"],
    ].map(([k, name, detail, glyph, color]) => {
      const on = litNow(k),
        big = k === "hermes",
        sz = big ? 64 : 48;
      const ring = `position:absolute;inset:-1px;border-radius:inherit;border:1px solid ${color};pointer-events:none;`;
      return {
        name,
        detail,
        glyph,
        pressed: String(s.node === k),
        pick: () => this.setState({ node: k }),
        style: `position:absolute;left:${pos[k][0]}%;top:${pos[k][1]}%;transform:translate(-50%,-${sz / 2 + 6}px);display:flex;flex-direction:column;align-items:center;gap:4px;background:none;border:none;cursor:pointer;color:var(--text);padding:6px;z-index:2`,
        core: `position:relative;width:${sz}px;height:${sz}px;border-radius:${big ? 18 : 14}px;display:grid;place-items:center;font-size:${big ? 26 : 20}px;color:${color};background:radial-gradient(circle at 50% 25%, rgba(255,255,255,.09), transparent 70%),var(--surface);border:1px solid ${on ? color : "var(--glass-border)"};box-shadow:${on ? `0 0 32px ${color}, inset 0 0 16px rgba(255,255,255,.08)` : "var(--shadow-card)"};transform:scale(${on ? 1.08 : 1});transition:all .5s cubic-bezier(.23,1,.32,1)`,
        pulse: on ? ring + "animation:v40-ping 1.8s cubic-bezier(.23,1,.32,1) infinite" : "display:none",
        pulse2: on ? ring + "animation:v40-ping 1.8s cubic-bezier(.23,1,.32,1) .9s infinite" : "display:none",
      };
    });
    const edgeLit = tp ? [["opHe"], ["opHe"], ["dshHe"], ["opDsh"]] : [["opHe"], ["opHe"], ["heZe", "heAp"], ["dshHe"]];
    const edgeColor = {
      opHe: "var(--amber)",
      opDsh: "var(--amber)",
      dshHe: "var(--accent)",
      heZe: "var(--cyan)",
      heAp: "var(--purple)",
    };
    const edgeState = (k) => {
      if (ts < 0) return "idle";
      if (edgeLit[ts].includes(k)) return "on";
      for (let i = 0; i < ts; i++) if (edgeLit[i].includes(k)) return "past";
      return "off";
    };
    const edgeVals = (k) => {
      const st = edgeState(k),
        c = edgeColor[k];
      return {
        flow: `stroke:${c};stroke-width:${st === "on" ? 2.4 : 1.5};stroke-dasharray:3 9;animation:v40-dash ${st === "on" ? 0.6 : 1.8}s linear infinite;opacity:${st === "on" ? 1 : st === "past" ? 0.45 : st === "idle" ? 0.3 : 0.06};transition:opacity .5s`,
        glow: `stroke:${c};stroke-width:9;opacity:${st === "on" ? 0.2 : 0};transition:opacity .5s`,
      };
    };
    const tagColor = {
      READY: "var(--text-dim)",
      INTENT: "var(--amber)",
      QUALIFY: "var(--accent)",
      COMPUTE: "var(--cyan)",
      HOLD: "var(--accent)",
      REVIEW: "var(--green)",
      DONE: "var(--green)",
    };
    const traceLog = s.traceLog.map(([stamp, tag, text]) => ({
      ts: stamp,
      tag,
      text,
      color: tagColor[tag] || "var(--cyan)",
      style:
        "white-space:pre-wrap;word-break:break-word;color:var(--text);animation:v40-rise .4s cubic-bezier(.23,1,.32,1) both",
    }));
    const wire = (active, color) => (active ? color : "rgba(255,255,255,.14)");
    const traceOutcomeL = this.lane("draft", tp, false);
    const stageLabels = ["Intent", "Qualify", tp ? "Hold" : "Compute", "Review"];
    const stages = stageLabels.map((label, i) => ({
      n: "0" + (i + 1),
      label,
      style: `display:flex;flex-direction:column;gap:2px;padding:8px 10px;border-radius:8px;border:1px solid ${ts === i ? "var(--cyan)" : "var(--glass-border)"};background:${ts >= i && ts >= 0 ? "rgba(0,249,255,.08)" : "var(--glass)"};color:${ts >= i && ts >= 0 ? "var(--cyan)" : "var(--text-dim)"};transition:all .4s`,
    }));
    const captions = [
      "Intent · the operator asks for a draft.",
      "Qualify · HERMES reads the request and checks the boundary.",
      tp
        ? "Hold · private input. The route stops at the console for a person."
        : "Compute · the job runs on Zeus or Apollo.",
      "Review · the result returns to the operator console.",
    ];
    const traceChoices = [
      ["Public input", false],
      ["Private input", true],
    ].map(([label, v]) => ({
      label,
      pressed: String(tp === v),
      style: pill(tp === v, v),
      pick: () => {
        clearInterval(this.traceTimer);
        Object.values(this.pkT || {}).forEach((t) => clearTimeout(t));
        document.querySelectorAll("[id^=map-pk-]").forEach((el) => el.setAttribute("opacity", "0"));
        this.setState({ tracePrivate: v, traceStep: -1, tracing: false });
      },
    }));

    const eveColors = {
      d: "var(--text-dim)",
      ok: "var(--green)",
      r: "var(--cyan)",
      warn: "var(--amber)",
      er: "var(--red)",
      lore: "var(--purple)",
      cmd: "var(--text)",
      alert: "var(--red)",
    };
    const eveLog = s.eveLog.map(([k, t]) => ({
      text: k === "cmd" ? `doug@zeus:~$ ${t}` : k === "d" ? `· ${t}` : t,
      style: `white-space:pre-wrap;word-break:break-word;color:${eveColors[k]};${k === "cmd" ? "margin-top:8px;color:var(--green)" : ""}${k === "lore" ? "text-shadow:0 0 10px var(--purple-glow)" : ""}${k === "alert" ? "font-weight:700;text-shadow:0 0 12px var(--red-glow)" : ""}`,
    }));
    const eveChips = ["fleet", "hosts", "backups", "atlas", "routes", "cost", "surprise me ✦"].map((label) => ({
      label,
      run: () => this.eve(label.replace(" ✦", "")),
    }));

    const Tag = designSystem.Tag;
    const selectedTag = Tag ? React.createElement(Tag, { color: "cyan" }, "SELECTED") : null;

    const energized = s.sig === "energized";
    return {
      padL: pad,
      wide: s.wide,
      navOn: s.navOn ?? true,
      tech,
      railItems,
      heroSrc: hf[0],
      heroPoster: hf[1],
      heroNoLoop: hf[2],
      heroCols: s.wide ? "minmax(0,1fr) 260px" : "minmax(0,1fr)",
      heroMove: (e) => {
        if (this.reduce) return;
        const v = document.getElementById("hero-video");
        if (!v) return;
        const b = e.currentTarget.getBoundingClientRect();
        const nx = (e.clientX - b.left) / b.width - 0.5,
          ny = (e.clientY - b.top) / b.height - 0.5;
        v.style.transform = `translate(${-nx * 22}px, ${-ny * 14}px)`;
        const sp = document.getElementById("hero-spot");
        if (sp)
          sp.style.background = `radial-gradient(520px circle at ${(nx + 0.5) * 100}% ${(ny + 0.5) * 100}%, rgba(0,249,255,.11), transparent 60%)`;
      },
      boardShip: (e) => {
        e.preventDefault();
        this.warpFlash();
        window.location.assign("/v39/#flight=board");
      },
      openIntro: (e) => {
        e.preventDefault();
        this.setState({ cinema: "intro" });
      },
      telemetry,
      tickerItems,
      worlds,
      collections,
      filmList,
      featSrc: F.src,
      featPoster: F.poster,
      featTitle: F.title,
      featDesc: F.desc,
      featColl: F.coll,
      filmCols: s.wide ? "minmax(0,1.7fr) minmax(0,1fr)" : "minmax(0,1fr)",
      openFeature: () => this.setState({ cinema: s.film }),
      nextFilm: () => {
        const list = this.films.map((f) => f[1]);
        const i = (list.indexOf(s.film) + 1) % list.length;
        this.setState({ film: list[i], coll: this.films[i][0] });
      },
      cinemaOpen: !!C,
      cinemaSrc: C ? C.src : "",
      cinemaPoster: C ? C.poster : "",
      cinemaTitle: C ? C.title : "",
      cinemaDesc: C ? C.desc : "",
      cinemaColl: C ? C.coll : "",
      closeCinema: () => this.setState({ cinema: null }),
      cinemaPrev: () => this.stepCinema(-1),
      cinemaNext: () => this.stepCinema(1),
      lawA,
      lawB,
      alert: s.alert,
      warp: s.warp,
      pvChoices,
      pvShown: s.pvShown,
      pvText,
      pvReveal: () => this.setState({ pvShown: true, pv: s.pv || "reveal" }),
      pvAnswer: s.pvShown ? "A person." : "Your call.",
      pvEnd: s.pvShown ? "A PERSON" : "?",
      pvBorder: s.pvShown ? "var(--accent)" : "var(--glass-border)",
      pvBoundary: s.pvShown
        ? "Private input holds the external route for human review."
        : "Same task. Same sources. A different boundary.",
      loadPublic: () => this.setState({ exp: 0, intent: "analyze", sources: true, priv: false, routed: null }),
      loadPrivate: () => this.setState({ exp: 0, intent: "analyze", sources: true, priv: true, routed: null }),
      tabsCol: s.wide ? "1" : "1 / -1",
      panelCol: s.wide ? "2" : "1 / -1",
      expId: E[0],
      selectedExperiment: "experiment-" + s.exp,
      experiments,
      expNum: "0" + (s.exp + 1),
      expCode: E[2],
      expName: E[1],
      expTitle: "EXPERIMENT " + "0" + (s.exp + 1),
      expColor: s.exp === 0 ? "accent" : "cyan",
      expLede: E[3],
      expHref: "/v39/#build=" + E[0],
      isHermes: s.exp === 0,
      notHermes: s.exp !== 0,
      nextExp: () => this.setState({ exp: (s.exp + 1) % 7 }),
      privatePressed: String(s.priv),
      sourcesPressed: String(s.sources),
      intents,
      privStyle: tog(s.priv, true),
      privKnob: knob(s.priv, true),
      privDot: dot(s.priv),
      srcStyle: tog(s.sources, false),
      srcKnob: knob(s.sources, false),
      srcDot: dot(s.sources),
      togglePrivate: () => this.setState({ priv: !s.priv, routed: null }),
      toggleSources: () => this.setState({ sources: !s.sources, routed: null }),
      route: () => this.setState({ routed: this.lane(s.intent, s.priv, s.sources) }),
      laneName: L.name,
      laneCode: L.code,
      laneLabel: L.label,
      laneColor: L.color,
      routeSteps,
      routeDetail: L.detail,
      copyLabel: s.copied === "failed" ? "Copy unavailable · try again" : s.copied ? "Copied ✔" : "Copy these settings",
      copySettings: () => {
        const u = `${location.href.split("#")[0]}#experiment=hermes&intent=${s.intent}&private=${s.priv}&sources=${s.sources}`;
        this.copyValue(u, "copied");
      },
      nodeTitle: N.title,
      nodeRole: N.role,
      nodeValue: N.value,
      nodeUnit: N.unit,
      nodeSummary: N.summary,
      nodeBody: N.body,
      nodeEvidence: N.evidence,
      nodeColor: N.color,
      selectedTag,
      nodes,
      stages,
      traceChoices,
      traceProgress: ts < 0 ? 0 : ((ts + 1) / 4) * 100,
      traceCaption: ts < 0 ? "Follow one example from human intent to human review. No request is sent." : captions[ts],
      traceLabel: s.tracing ? "▮▮ Tracing…" : "▷ Trace a request · about 8 seconds",
      trace: () => this.startTrace(),
      requestSource: tp ? "Draft · private input" : "Draft · sources optional",
      traceOutcome: traceOutcomeL.name === "Human review" ? "Human review" : "Workhorse",
      traceOutcomeColor: traceOutcomeL.color,
      wireIntent: wire(ts >= 0, "var(--amber)"),
      wireHold: wire(ts >= 2 && tp, "var(--accent)"),
      wireZeus: wire(ts >= 2 && !tp, "var(--cyan)"),
      wireApollo: wire(ts >= 2 && !tp, "var(--purple)"),
      eOpHe: edgeVals("opHe"),
      eOpDsh: edgeVals("opDsh"),
      eDshHe: edgeVals("dshHe"),
      eHeZe: edgeVals("heZe"),
      eHeAp: edgeVals("heAp"),
      traceLog,
      traceLogHeight: 176,
      mapReadout: `REQUEST · ${tp ? "PRIVATE" : "PUBLIC"} · ${ts < 0 ? "IDLE" : "STAGE 0" + (ts + 1) + " / 04"}`,
      mapState: s.tracing ? "TRACING" : ts >= 3 ? "COMPLETE" : "STANDING BY",
      mapStateColor: s.tracing ? "var(--cyan)" : ts >= 3 ? "var(--green)" : "var(--text-dim)",
      continueHermes: () => this.setState({ exp: 0, intent: "draft", sources: false, priv: tp, routed: null }),
      evLeftCol: s.wide ? "1" : "1 / -1",
      evRightCol: s.wide ? "2" : "1 / -1",
      eveHeight: 300,
      eveLog,
      eveChips,
      eveInput: s.eveInput,
      eveChange: (e) => this.setState({ eveInput: e.target.value }),
      eveSubmit: (e) => {
        e.preventDefault();
        this.eve(s.eveInput);
      },
      sigState: energized ? "ENERGIZED · ORBIT LIVE" : "DORMANT · GOLD INTENT",
      sigStateColor: energized ? "var(--green)" : "var(--text-dim)",
      sigImg: `position:relative;width:100%;height:auto;display:block;transition:filter 1.2s cubic-bezier(.23,1,.32,1);filter:${energized ? "brightness(1.2) saturate(1.15)" : "brightness(.85)"}`,
      sigVid: `position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity 1.2s cubic-bezier(.23,1,.32,1);opacity:${energized ? 1 : 0}`,
      sigRing: `position:absolute;left:50%;top:50%;width:40%;aspect-ratio:1;border-radius:50%;border:1px solid var(--accent);margin:-20% 0 0 -20%;pointer-events:none;opacity:0;z-index:2;${energized ? "animation:v40-ring 1.6s cubic-bezier(.23,1,.32,1) infinite" : ""}`,
      energize: () => {
        const on = !energized;
        const v = document.getElementById("sig-video");
        if (v) {
          v.muted = true;
          v.loop = true;
          if (on && !this.reduce && !document.hidden) v.play().catch(() => {});
          else v.pause();
        }
        if (on) this.warpFlash();
        this.setState({ sig: on ? "energized" : "dormant" });
      },
      copyEmailLabel:
        s.emailCopied === "failed"
          ? "Copy unavailable · use email link"
          : s.emailCopied
            ? "Copied ✔"
            : "Copy email address",
      copyEmail: () => this.copyValue("doug@cashio.us", "emailCopied"),
    };
  }
  render() {
    const values = { ...this.props, ...this.renderVals() };
    return renderPage(values);
  }
}

function renderPage(v) {
  return h(
    React.Fragment,
    null,
    " ",
    h(
      "div",
      {
        key: 2,
        style: style(
          [
            "position:relative;min-height:100vh;padding-left:",
            v.padL ?? "",
            "px;transition:padding-left .45s cubic-bezier(.23,1,.32,1)",
          ].join(""),
        ),
      },
      " ",
      " ",
      v.wide
        ? h(
            React.Fragment,
            { key: 5 },
            " ",
            h(
              "nav",
              {
                key: 7,
                "aria-label": "Sections",
                style: style(
                  "position:fixed;left:0;top:0;bottom:0;width:72px;z-index:40;display:flex;flex-direction:column;align-items:stretch;background:rgba(8,8,14,.82);backdrop-filter:blur(14px);border-right:1px solid var(--glass-border)",
                ),
              },
              " ",
              h(
                "a",
                {
                  key: 9,
                  href: "#top",
                  style: style(
                    "display:flex;align-items:center;justify-content:center;height:68px;border-bottom:1px solid var(--glass-border);font-family:var(--font-display);font-weight:900;font-size:13px;letter-spacing:.08em;color:var(--text)",
                  ),
                },
                h(React.Fragment, { key: 10 }, "c"),
                h("span", { key: 11, style: style("color:var(--accent)") }, h(React.Fragment, { key: 12 }, "A")),
                h("span", { key: 13, style: style("color:var(--cyan)") }, h(React.Fragment, { key: 14 }, "I")),
              ),
              " ",
              h(
                "div",
                {
                  key: 16,
                  style: style(
                    "flex:1;display:flex;flex-direction:column;gap:6px;padding:14px 10px;overflow-y:auto;scrollbar-width:none",
                  ),
                },
                " ",
                (function (parent) {
                  return (v.railItems || []).map((item, index) => {
                    const v = { ...parent, r: item, $index: index };
                    return h(
                      React.Fragment,
                      { key: index },
                      " ",
                      h(
                        "a",
                        { key: 20, href: v.r.href, title: v.r.label, style: style(v.r.style) },
                        " ",
                        h("span", {
                          key: 22,
                          style: style(
                            "width:8px;height:8px;border-radius:50%;background:currentColor;box-shadow:0 0 10px currentColor;flex:0 0 auto",
                          ),
                        }),
                        " ",
                        h(
                          "span",
                          {
                            key: 24,
                            style: style(
                              "font-family:var(--font-mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;writing-mode:vertical-rl;transform:rotate(180deg);line-height:1",
                            ),
                          },
                          h(
                            React.Fragment,
                            { key: 25 },
                            "",
                            h("span", { className: "sc-interp", key: 1 }, v.r.label),
                            "",
                          ),
                        ),
                        " ",
                      ),
                      " ",
                    );
                  });
                })(v),
                " ",
              ),
              " ",
              h(
                "div",
                {
                  key: 30,
                  style: style(
                    "padding:12px 10px;border-top:1px solid var(--glass-border);display:flex;flex-direction:column;gap:6px;align-items:center",
                  ),
                },
                " ",
                h("span", {
                  key: 32,
                  style: style("width:52px;height:18px;border-radius:9px 9px 2px 2px;background:var(--accent)"),
                }),
                " ",
                h("span", { key: 34, style: style("width:52px;height:10px;border-radius:2px;background:var(--cyan)") }),
                " ",
                h("span", {
                  key: 36,
                  style: style("width:52px;height:10px;border-radius:2px 2px 9px 9px;background:var(--purple)"),
                }),
                " ",
              ),
              " ",
            ),
            " ",
          )
        : null,
      " ",
      h(
        "a",
        { key: 41, className: "skip-link", href: "#main-content" },
        h(React.Fragment, { key: 42 }, "Skip to content"),
      ),
      " ",
      " ",
      h(
        "header",
        {
          key: 45,
          style: style(
            "position:sticky;top:0;z-index:30;background:rgba(10,10,15,.72);backdrop-filter:blur(14px);border-bottom:1px solid var(--glass-border)",
          ),
        },
        " ",
        h(
          "div",
          {
            key: 47,
            style: style(
              "max-width:1240px;margin:0 auto;padding:0 28px;height:68px;display:flex;align-items:center;gap:28px",
            ),
          },
          " ",
          h(
            "a",
            {
              key: 49,
              href: "#top",
              "aria-label": "cAshIo home",
              style: style("display:flex;align-items:center;gap:12px;color:var(--text)"),
            },
            " ",
            h(
              "span",
              {
                key: 51,
                style: style(
                  "width:34px;height:34px;border-radius:10px;border:1px solid var(--glass-border);background:var(--glass);display:grid;place-items:center;font-family:var(--font-display);font-weight:900;font-size:14px;color:var(--accent);box-shadow:0 0 16px -4px var(--accent)",
                ),
              },
              h(React.Fragment, { key: 52 }, "C"),
            ),
            " ",
            h(
              "span",
              {
                key: 54,
                style: style("font-family:var(--font-display);font-weight:700;font-size:18px;letter-spacing:.06em"),
              },
              h(React.Fragment, { key: 55 }, "c"),
              h("span", { key: 56, style: style("color:var(--accent)") }, h(React.Fragment, { key: 57 }, "A")),
              h(React.Fragment, { key: 58 }, "sh"),
              h("span", { key: 59, style: style("color:var(--cyan)") }, h(React.Fragment, { key: 60 }, "I")),
              h(React.Fragment, { key: 61 }, "o"),
            ),
            " ",
          ),
          " ",
          v.navOn
            ? h(
                React.Fragment,
                { key: 64 },
                h(
                  "nav",
                  { key: 65, "aria-label": "Primary", style: style("display:flex;gap:22px;flex:1;flex-wrap:wrap") },
                  " ",
                  h(
                    "a",
                    {
                      key: 67,
                      className: "za-navlink",
                      href: "#studies",
                      style: style(
                        "font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim)",
                      ),
                    },
                    h(React.Fragment, { key: 68 }, "Try an experiment"),
                  ),
                  " ",
                  h(
                    "a",
                    {
                      key: 70,
                      className: "za-navlink",
                      href: "#workshop",
                      style: style(
                        "font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim)",
                      ),
                    },
                    h(React.Fragment, { key: 71 }, "See real work"),
                  ),
                  " ",
                  h(
                    "a",
                    {
                      key: 73,
                      className: "za-navlink",
                      href: "#rooms",
                      style: style(
                        "font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim)",
                      ),
                    },
                    h(React.Fragment, { key: 74 }, "Explore the worlds"),
                  ),
                  " ",
                ),
              )
            : null,
          " ",
          h(
            "div",
            { key: 77, style: style("display:flex;align-items:center;gap:10px;margin-left:auto") },
            " ",
            h(
              "button",
              {
                key: 79,
                type: "button",
                className: "hud-control mission-control",
                "data-mission-open": "",
                "aria-haspopup": "dialog",
              },
              h("span", { key: 80, className: "mission-desktop" }, h(React.Fragment, { key: 81 }, "Mission Control")),
              h("span", { key: 82, className: "mission-mobile" }, h(React.Fragment, { key: 83 }, "Menu")),
              h(
                "kbd",
                { key: 84, className: "mission-desktop", "data-platform-shortcut": "" },
                h(React.Fragment, { key: 85 }, "Ctrl K"),
              ),
            ),
            " ",
            h(
              "button",
              {
                key: 87,
                type: "button",
                className: "bit-header",
                "data-bit-open": "",
                "aria-label": "Talk to Bit, your copilot",
                "aria-haspopup": "dialog",
              },
              h(
                "span",
                { key: 88, className: "bit-portrait", "data-bit-portrait": "" },
                h("canvas", { key: 89, "aria-hidden": "true" }),
                h(
                  "span",
                  { key: 90, className: "bit-fallback", "aria-hidden": "true" },
                  h(React.Fragment, { key: 91 }, "◇"),
                ),
              ),
              h("span", { key: 92, className: "bit-header-label" }, h(React.Fragment, { key: 93 }, "BIT")),
            ),
            " ",
            h(
              "button",
              {
                key: 95,
                type: "button",
                className: "hud-control motion-control",
                "data-motion-toggle": "",
                "aria-label": "Pause motion",
                title: "Pause motion",
                "aria-pressed": "false",
              },
              h(React.Fragment, { key: 96 }, "Ⅱ"),
            ),
            " ",
            h(
              designSystem.Button,
              { key: 98, as: "a", href: "#contact", size: "sm" },
              h(React.Fragment, { key: 99 }, "Let’s talk →"),
            ),
            " ",
          ),
          " ",
        ),
        " ",
        h(
          "div",
          {
            key: 103,
            "aria-hidden": "true",
            style: style("position:absolute;left:0;right:0;bottom:-1px;height:2px;overflow:hidden"),
          },
          h("div", {
            key: 104,
            id: "scroll-prog",
            style: style(
              "height:100%;width:100%;transform:scaleX(0);transform-origin:left center;background:linear-gradient(90deg,var(--cyan),var(--accent),var(--purple));box-shadow:0 0 12px var(--cyan-glow)",
            ),
          }),
        ),
        " ",
      ),
      " ",
      h(
        "main",
        { key: 107, id: "main-content", tabIndex: "-1" },
        " ",
        " ",
        h(
          "section",
          {
            key: 110,
            id: "top",
            "data-screen-label": "Orbit",
            "aria-label": "Introduction",
            onMouseMove: v.heroMove,
            style: style(
              "position:relative;min-height:calc(100vh - 68px);display:flex;flex-direction:column;justify-content:center;overflow:hidden;background:#05060a",
            ),
          },
          " ",
          h(
            "div",
            {
              key: 112,
              "aria-hidden": "true",
              style: style(
                "position:absolute;inset:-3%;overflow:hidden;animation:v40-zoom 10s cubic-bezier(.23,1,.32,1) both",
              ),
            },
            " ",
            h("video", {
              key: 114,
              id: "hero-video",
              "data-v": "auto",
              "data-noloop": v.heroNoLoop,
              "data-bound-src": v.heroSrc,
              "data-bound-poster": v.heroPoster,
              preload: "auto",
              style: style(
                "width:100%;height:100%;object-fit:cover;display:block;transition:transform 1.4s cubic-bezier(.23,1,.32,1),opacity 2.4s cubic-bezier(.23,1,.32,1)",
              ),
            }),
            " ",
            h("video", {
              key: 116,
              id: "hero-loop",
              "data-v": "auto",
              src: "/assets/zenith/ringed-horizon.mp4",
              poster: "/v40/assets/3bc5c037-21d7-499d-93c2-0736b4712867.webp",
              preload: "auto",
              style: style(
                "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 2.6s cubic-bezier(.23,1,.32,1);animation:v40-drift 26s ease-in-out infinite alternate",
              ),
            }),
            " ",
          ),
          " ",
          h("canvas", {
            key: 119,
            id: "hero-stars",
            "aria-hidden": "true",
            style: style("position:absolute;inset:0;width:100%;height:100%;display:block;mix-blend-mode:screen"),
          }),
          " ",
          h("div", {
            key: 121,
            id: "hero-spot",
            "aria-hidden": "true",
            style: style(
              "position:absolute;inset:0;pointer-events:none;mix-blend-mode:screen;background:radial-gradient(520px circle at 72% 38%, rgba(0,249,255,.10), transparent 60%)",
            ),
          }),
          " ",
          h("div", {
            key: 123,
            "aria-hidden": "true",
            style: style(
              "position:absolute;inset:0;background:linear-gradient(90deg, rgba(5,6,10,.94) 0%, rgba(5,6,10,.62) 42%, rgba(5,6,10,.08) 78%), linear-gradient(180deg, rgba(5,6,10,.55) 0%, rgba(5,6,10,0) 28%, rgba(5,6,10,0) 62%, rgba(10,10,15,1) 100%)",
            ),
          }),
          " ",
          h("div", {
            key: 125,
            "aria-hidden": "true",
            style: style(
              "position:absolute;left:0;right:0;top:0;height:140px;background:linear-gradient(180deg,transparent,rgba(0,249,255,.05),transparent);animation:v40-scan 8s linear infinite;pointer-events:none",
            ),
          }),
          " ",
          v.wide
            ? h(
                React.Fragment,
                { key: 127 },
                " ",
                h(
                  "div",
                  {
                    key: 129,
                    "aria-hidden": "true",
                    style: style(
                      "position:absolute;left:28px;top:24px;right:28px;display:flex;align-items:flex-start;gap:8px;pointer-events:none;animation:v40-fade 1.4s .2s both",
                    ),
                  },
                  " ",
                  h("div", {
                    key: 131,
                    style: style(
                      "width:160px;height:66px;border-top:14px solid var(--accent);border-left:36px solid var(--accent);border-top-left-radius:46px;flex:0 0 auto;filter:drop-shadow(0 0 14px rgba(255,149,0,.35))",
                    ),
                  }),
                  " ",
                  h("div", {
                    key: 133,
                    style: style("height:14px;width:132px;background:var(--accent);border-radius:2px"),
                  }),
                  " ",
                  h("div", {
                    key: 135,
                    style: style("height:14px;width:52px;background:var(--cyan);border-radius:2px"),
                  }),
                  " ",
                  h("div", {
                    key: 137,
                    style: style(
                      "height:14px;flex:1;background:linear-gradient(90deg,rgba(255,149,0,.5),rgba(255,149,0,.04));border-radius:2px",
                    ),
                  }),
                  " ",
                  h(
                    "div",
                    {
                      key: 139,
                      style: style(
                        "height:14px;padding:0 12px;display:flex;align-items:center;background:var(--purple);border-radius:2px 9px 9px 2px;font-family:var(--font-mono);font-size:9px;letter-spacing:.22em;color:var(--void);font-weight:600",
                      ),
                    },
                    h(React.Fragment, { key: 140 }, "V40 · MOSTLY HARMLESS"),
                  ),
                  " ",
                ),
                " ",
                h(
                  "div",
                  {
                    key: 143,
                    "aria-hidden": "true",
                    style: style(
                      "position:absolute;right:28px;bottom:24px;left:46%;display:flex;align-items:flex-end;gap:8px;pointer-events:none;animation:v40-fade 1.4s .4s both",
                    ),
                  },
                  " ",
                  h("div", {
                    key: 145,
                    style: style(
                      "height:10px;flex:1;background:linear-gradient(90deg,rgba(0,249,255,.04),rgba(0,249,255,.5));border-radius:2px",
                    ),
                  }),
                  " ",
                  h("div", {
                    key: 147,
                    style: style("height:10px;width:68px;background:var(--amber);border-radius:2px"),
                  }),
                  " ",
                  h("div", {
                    key: 149,
                    style: style(
                      "width:128px;height:54px;border-bottom:10px solid var(--cyan);border-right:30px solid var(--cyan);border-bottom-right-radius:40px;flex:0 0 auto;filter:drop-shadow(0 0 14px rgba(0,249,255,.35))",
                    ),
                  }),
                  " ",
                ),
                " ",
              )
            : null,
          " ",
          h(
            "div",
            {
              key: 153,
              id: "hero-content",
              style: style(
                [
                  "position:relative;max-width:1240px;width:100%;margin:0 auto;padding:110px 28px 130px;display:grid;grid-template-columns:",
                  v.heroCols ?? "",
                  ";gap:40px;align-items:end",
                ].join(""),
              ),
            },
            " ",
            h(
              "div",
              { key: 155, style: style("display:flex;flex-direction:column;gap:26px;min-width:0") },
              " ",
              h(
                "div",
                {
                  key: 157,
                  style: style(
                    "display:flex;flex-wrap:wrap;gap:10px 22px;align-items:center;font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim);animation:v40-fade 1s .1s both",
                  ),
                },
                " ",
                h(
                  "span",
                  { key: 159, style: style("display:inline-flex;align-items:center;gap:8px") },
                  h("span", {
                    key: 160,
                    style: style(
                      "width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 10px var(--green-glow);animation:za-pulse 2.4s ease-in-out infinite",
                    ),
                  }),
                  h(React.Fragment, { key: 161 }, "My lab, observed October 3, 2026"),
                ),
                " ",
                h("span", { key: 163 }, h(React.Fragment, { key: 164 }, "2 hosts · 20 containers · 1 VM")),
                " ",
              ),
              " ",
              h(
                "div",
                {
                  key: 167,
                  style: style(
                    "display:flex;align-items:center;gap:12px;font-family:var(--font-mono);font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--accent);animation:v40-fade 1s .2s both",
                  ),
                },
                " ",
                h("span", {
                  key: 169,
                  style: style("width:46px;height:3px;background:linear-gradient(90deg,var(--accent),transparent)"),
                }),
                h(
                  "span",
                  { key: 170, "data-scramble": "" },
                  h(React.Fragment, { key: 171 }, "A hobby lab for local AI · A human in command"),
                ),
                " ",
              ),
              " ",
              h(
                "h1",
                {
                  key: 174,
                  style: style(
                    "font-family:var(--font-display);font-weight:900;font-size:clamp(46px,8.2vw,124px);line-height:.96;letter-spacing:.005em;color:var(--text);margin:0;text-wrap:balance",
                  ),
                },
                " ",
                h(
                  "span",
                  { key: 176, style: style("display:block;overflow:hidden;padding-bottom:.04em") },
                  h(
                    "span",
                    {
                      key: 177,
                      style: style("display:block;animation:v40-up 1.2s cubic-bezier(.23,1,.32,1) .15s both"),
                    },
                    h(React.Fragment, { key: 178 }, "The machines"),
                  ),
                ),
                " ",
                h(
                  "span",
                  { key: 180, style: style("display:block;overflow:hidden;padding-bottom:.04em") },
                  h(
                    "span",
                    {
                      key: 181,
                      style: style("display:block;animation:v40-up 1.2s cubic-bezier(.23,1,.32,1) .28s both"),
                    },
                    h(React.Fragment, { key: 182 }, "can think."),
                  ),
                ),
                " ",
                h(
                  "span",
                  { key: 184, style: style("display:block;overflow:hidden;padding-bottom:.08em") },
                  h(
                    "span",
                    {
                      key: 185,
                      style: style(
                        "display:block;animation:v40-up 1.2s cubic-bezier(.23,1,.32,1) .41s both;background:linear-gradient(92deg,var(--accent) 0%,#ffcc00 42%,var(--cyan) 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 26px rgba(255,149,0,.3))",
                      ),
                    },
                    h(React.Fragment, { key: 186 }, "You still decide."),
                  ),
                ),
                " ",
              ),
              " ",
              h(
                "p",
                {
                  key: 189,
                  style: style(
                    "max-width:60ch;font-size:clamp(17px,1.9vw,21px);line-height:1.55;color:var(--text);text-wrap:pretty;margin:0;animation:v40-rise 1.1s cubic-bezier(.23,1,.32,1) .6s both",
                  ),
                },
                h(
                  React.Fragment,
                  { key: 190 },
                  "I’m Doug Cashio. I started in IT in 1996, the year Quake went truly 3D after Wolfenstein and Doom spent years faking it brilliantly. This is my workshop after hours: local AI, original worlds and a few things that fly.",
                ),
              ),
              " ",
              h(
                "div",
                {
                  key: 192,
                  style: style(
                    "display:flex;flex-wrap:wrap;gap:14px;align-items:center;animation:v40-rise 1.1s cubic-bezier(.23,1,.32,1) .75s both",
                  ),
                },
                " ",
                h(
                  designSystem.Button,
                  { key: 194, as: "a", href: "/v39/#flight=board", onClick: v.boardShip, size: "lg" },
                  h(React.Fragment, { key: 195 }, "Board the starship →"),
                ),
                " ",
                h(
                  designSystem.Button,
                  { key: 197, as: "a", href: "#studies", variant: "secondary", size: "lg" },
                  h(React.Fragment, { key: 198 }, "Try an experiment →"),
                ),
                " ",
              ),
              " ",
              h(
                "div",
                {
                  key: 201,
                  style: style(
                    "display:flex;flex-wrap:wrap;gap:10px 26px;align-items:center;font-family:var(--font-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);animation:v40-fade 1s .9s both",
                  ),
                },
                " ",
                h(
                  "span",
                  { key: 203 },
                  h(React.Fragment, { key: 204 }, "A 30 second starship tour · 12 illustrated requests · sound off"),
                ),
                " ",
                h(
                  "a",
                  {
                    key: 206,
                    href: "/v39/#film=intro",
                    onClick: v.openIntro,
                    style: style("display:inline-flex;align-items:center;gap:10px"),
                  },
                  h(
                    "span",
                    {
                      key: 207,
                      style: style(
                        "width:28px;height:28px;border-radius:50%;border:1px solid var(--cyan);display:grid;place-items:center;box-shadow:0 0 14px var(--cyan-glow)",
                      ),
                    },
                    h(React.Fragment, { key: 208 }, "▷"),
                  ),
                  h(React.Fragment, { key: 209 }, "Watch the intro · 6 seconds"),
                ),
                " ",
              ),
              " ",
              v.tech
                ? h(
                    React.Fragment,
                    { key: 212 },
                    " ",
                    h(
                      "p",
                      {
                        key: 214,
                        style: style(
                          "max-width:70ch;font-size:14px;line-height:1.6;color:var(--text-dim);margin:0;padding:12px 14px;border:1px solid var(--glass-border);border-radius:12px;background:rgba(10,10,18,.6);backdrop-filter:blur(10px)",
                        ),
                      },
                      h(
                        "span",
                        {
                          key: 215,
                          style: style(
                            "font-family:var(--font-mono);font-size:10px;letter-spacing:.14em;color:var(--cyan);margin-right:10px",
                          ),
                        },
                        h(React.Fragment, { key: 216 }, "FOR ENGINEERS"),
                      ),
                      h(
                        React.Fragment,
                        { key: 217 },
                        "A static site on GitHub Pages behind Cloudflare. Every experiment runs in your browser; nothing you try is sent to my servers.",
                      ),
                    ),
                    " ",
                  )
                : null,
              " ",
            ),
            " ",
            v.wide
              ? h(
                  React.Fragment,
                  { key: 221 },
                  " ",
                  h(
                    "aside",
                    {
                      key: 223,
                      "aria-label": "Lab telemetry",
                      style: style(
                        "display:flex;flex-direction:column;gap:0;padding:18px 18px 8px;border-radius:20px;background:rgba(8,8,16,.55);backdrop-filter:blur(16px);border:1px solid var(--glass-border);box-shadow:var(--shadow-panel);animation:v40-rise 1.2s cubic-bezier(.23,1,.32,1) 1s both;position:relative;overflow:hidden",
                      ),
                    },
                    " ",
                    h("span", {
                      key: 225,
                      "aria-hidden": "true",
                      style: style(
                        "position:absolute;left:0;top:0;bottom:0;width:4px;background:linear-gradient(180deg,var(--cyan),var(--accent))",
                      ),
                    }),
                    " ",
                    h(
                      "div",
                      {
                        key: 227,
                        style: style(
                          "display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid var(--glass-border);font-family:var(--font-mono);font-size:10px;letter-spacing:.18em;color:var(--text-dim)",
                        ),
                      },
                      h("span", { key: 228 }, h(React.Fragment, { key: 229 }, "LAB TELEMETRY")),
                      h(
                        "span",
                        { key: 230, style: style("display:inline-flex;align-items:center;gap:6px;color:var(--green)") },
                        h("span", {
                          key: 231,
                          style: style(
                            "width:6px;height:6px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green-glow)",
                          ),
                        }),
                        h(React.Fragment, { key: 232 }, "OCT 3"),
                      ),
                    ),
                    " ",
                    h(
                      "button",
                      {
                        key: 234,
                        className: "bit-hero",
                        type: "button",
                        "data-bit-open": "",
                        "aria-haspopup": "dialog",
                        "aria-label": "Meet Bit, your copilot",
                      },
                      " ",
                      h(
                        "span",
                        { key: 236, className: "bit-portrait", "data-bit-portrait": "" },
                        h("canvas", { key: 237, "aria-hidden": "true" }),
                        h(
                          "span",
                          { key: 238, className: "bit-fallback", "aria-hidden": "true" },
                          h(React.Fragment, { key: 239 }, "◇"),
                        ),
                      ),
                      " ",
                      h(
                        "span",
                        { key: 241 },
                        h("strong", { key: 242 }, h(React.Fragment, { key: 243 }, "BIT")),
                        h("small", { key: 244 }, h(React.Fragment, { key: 245 }, "YOUR COPILOT")),
                        h("span", { key: 246 }, h(React.Fragment, { key: 247 }, "Mostly helpful. Always here. ↗")),
                      ),
                      " ",
                    ),
                    " ",
                    (function (parent) {
                      return (v.telemetry || []).map((item, index) => {
                        const v = { ...parent, m: item, $index: index };
                        return h(
                          React.Fragment,
                          { key: index },
                          " ",
                          h(
                            "div",
                            {
                              key: 252,
                              style: style(
                                "display:flex;align-items:baseline;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.05)",
                              ),
                            },
                            " ",
                            h(
                              "span",
                              {
                                key: 254,
                                "data-count": v.m.count,
                                style: style(
                                  [
                                    "font-family:var(--font-display);font-weight:900;font-size:28px;line-height:1;color:",
                                    v.m.color ?? "",
                                    ";text-shadow:0 0 18px ",
                                    v.m.color ?? "",
                                    ";min-width:62px",
                                  ].join(""),
                                ),
                              },
                              h(
                                React.Fragment,
                                { key: 255 },
                                "",
                                h("span", { className: "sc-interp", key: 1 }, v.m.value),
                                "",
                              ),
                            ),
                            " ",
                            h(
                              "span",
                              {
                                key: 257,
                                style: style(
                                  "font-family:var(--font-mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);line-height:1.4",
                                ),
                              },
                              h(
                                React.Fragment,
                                { key: 258 },
                                "",
                                h("span", { className: "sc-interp", key: 1 }, v.m.label),
                                "",
                              ),
                            ),
                            " ",
                          ),
                          " ",
                        );
                      });
                    })(v),
                    " ",
                    h(
                      "div",
                      {
                        key: 262,
                        style: style(
                          "display:flex;justify-content:space-between;gap:10px;padding:12px 0 8px;font-family:var(--font-mono);font-size:10px;letter-spacing:.16em;color:var(--text-dim)",
                        ),
                      },
                      h("span", { key: 263 }, h(React.Fragment, { key: 264 }, "THREAT ASSESSMENT")),
                      h(
                        "span",
                        { key: 265, style: style("color:var(--amber);text-shadow:0 0 10px var(--amber-glow)") },
                        h(React.Fragment, { key: 266 }, "MOSTLY HARMLESS"),
                      ),
                    ),
                    " ",
                  ),
                  " ",
                )
              : null,
            " ",
          ),
          " ",
          h(
            "a",
            {
              key: 271,
              href: "#workshop",
              style: style(
                "position:absolute;left:50%;bottom:26px;transform:translateX(-50%);font-family:var(--font-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--text-dim);display:flex;flex-direction:column;align-items:center;gap:8px;z-index:2",
              ),
            },
            h("span", { key: 272 }, h(React.Fragment, { key: 273 }, "Next: inside the workshop")),
            h("span", {
              key: 274,
              style: style("width:1px;height:34px;background:linear-gradient(180deg,var(--cyan),transparent)"),
            }),
          ),
          " ",
        ),
        " ",
        " ",
        h(
          "div",
          {
            key: 278,
            "aria-label": "Lab telemetry ticker",
            style: style(
              "position:relative;overflow:hidden;border-top:1px solid var(--glass-border);border-bottom:1px solid var(--glass-border);background:rgba(5,6,10,.9);padding:14px 0",
            ),
          },
          " ",
          h(
            "div",
            { key: 280, style: style("display:flex;width:max-content;animation:v40-marquee 56s linear infinite") },
            " ",
            (function (parent) {
              return (v.tickerItems || []).map((item, index) => {
                const v = { ...parent, t: item, $index: index };
                return h(
                  React.Fragment,
                  { key: index },
                  " ",
                  h(
                    "span",
                    {
                      key: 284,
                      style: style(
                        "display:inline-flex;align-items:center;gap:12px;padding:0 26px;font-family:var(--font-mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--text-dim);white-space:nowrap",
                      ),
                    },
                    h(
                      "span",
                      {
                        key: 285,
                        style: style(
                          [
                            "color:",
                            v.t.color ?? "",
                            ";font-family:var(--font-display);font-weight:700;font-size:15px;letter-spacing:.06em;text-shadow:0 0 14px ",
                            v.t.color ?? "",
                            "",
                          ].join(""),
                        ),
                      },
                      h(React.Fragment, { key: 286 }, "", h("span", { className: "sc-interp", key: 1 }, v.t.value), ""),
                    ),
                    h(React.Fragment, { key: 287 }, "", h("span", { className: "sc-interp", key: 1 }, v.t.label), ""),
                    h(
                      "span",
                      { key: 288, style: style("color:var(--accent);margin-left:14px;opacity:.7") },
                      h(React.Fragment, { key: 289 }, "◆"),
                    ),
                  ),
                  " ",
                );
              });
            })(v),
            " ",
          ),
          " ",
        ),
        " ",
        " ",
        h(
          "section",
          {
            key: 295,
            id: "workshop",
            "data-screen-label": "Workshop",
            style: style(
              "position:relative;max-width:1240px;margin:0 auto;padding:104px 28px 72px;display:flex;flex-direction:column;gap:40px",
            ),
          },
          " ",
          h(
            "div",
            { key: 297, style: style("display:flex;flex-direction:column;gap:14px") },
            " ",
            h(
              "span",
              {
                key: 299,
                style: style(
                  "font-family:var(--font-mono);font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--accent)",
                ),
              },
              h(
                "span",
                { key: 300, style: style("color:var(--text-dim);margin-right:14px") },
                h(React.Fragment, { key: 301 }, "02"),
              ),
              h("span", { key: 302, "data-scramble": "" }, h(React.Fragment, { key: 303 }, "From the workshop")),
            ),
            " ",
            h(
              "h2",
              {
                key: 305,
                style: style(
                  "font-family:var(--font-display);font-weight:900;font-size:clamp(30px,4.6vw,54px);line-height:1.05;letter-spacing:.02em;margin:0;text-wrap:balance",
                ),
              },
              h(React.Fragment, { key: 306 }, "Built at home. Open to inspect."),
            ),
            " ",
          ),
          " ",
          h(
            "div",
            {
              key: 309,
              "data-reveal": "",
              style: style(
                "display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:22px;align-items:stretch",
              ),
            },
            " ",
            h(
              designSystem.Panel,
              { key: 311, color: "cyan", title: "A BACKUP THAT KEEPS UP", icon: "▸" },
              " ",
              h(
                "div",
                { key: 313, style: style("display:flex;flex-direction:column;gap:18px") },
                " ",
                h(
                  "span",
                  {
                    key: 315,
                    style: style(
                      "font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent)",
                    ),
                  },
                  h(React.Fragment, { key: 316 }, "From the workshop · October 3, 2026"),
                ),
                " ",
                h(
                  "h3",
                  {
                    key: 318,
                    style: style(
                      "font-family:var(--font-display);font-weight:700;font-size:clamp(18px,2.2vw,24px);line-height:1.2;margin:0",
                    ),
                  },
                  h(React.Fragment, { key: 319 }, "A backup that keeps up with the work."),
                ),
                " ",
                h(
                  "p",
                  {
                    key: 321,
                    style: style("color:var(--text-dim);font-size:16px;line-height:1.6;margin:0;text-wrap:pretty"),
                  },
                  h(
                    React.Fragment,
                    { key: 322 },
                    "A backup only counts if you can get your files back. I restored this one on a second machine and checked every file against the original. The receipt shows exactly what was tested, and what was not.",
                  ),
                ),
                " ",
                h(
                  "div",
                  {
                    key: 324,
                    style: style(
                      "display:flex;align-items:flex-end;gap:18px;flex-wrap:wrap;padding:18px 20px;border-radius:12px;background:var(--void-deep);border:1px solid var(--glass-border)",
                    ),
                  },
                  " ",
                  h(
                    "span",
                    {
                      key: 326,
                      style: style(
                        "font-family:var(--font-display);font-weight:900;font-size:clamp(56px,7vw,88px);line-height:.9;color:var(--cyan);text-shadow:0 0 28px var(--cyan-glow)",
                      ),
                    },
                    h(React.Fragment, { key: 327 }, "990"),
                  ),
                  " ",
                  h(
                    "span",
                    {
                      key: 329,
                      style: style(
                        "font-family:var(--font-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);line-height:1.6;max-width:26ch",
                      ),
                    },
                    h(React.Fragment, { key: 330 }, "files restored on a second machine and matched to the originals"),
                  ),
                  " ",
                ),
                " ",
                h(
                  "ol",
                  {
                    key: 333,
                    "aria-label": "The verification sequence",
                    style: style("display:flex;gap:10px;flex-wrap:wrap;list-style:none;margin:0;padding:0"),
                  },
                  " ",
                  h(
                    "li",
                    {
                      key: 335,
                      style: style(
                        "display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;border:1px solid var(--glass-border);background:var(--glass);font-family:var(--font-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase",
                      ),
                    },
                    h("span", { key: 336, style: style("color:var(--cyan)") }, h(React.Fragment, { key: 337 }, "01")),
                    h(React.Fragment, { key: 338 }, "Capture"),
                  ),
                  " ",
                  h(
                    "li",
                    {
                      key: 340,
                      style: style(
                        "display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;border:1px solid var(--glass-border);background:var(--glass);font-family:var(--font-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase",
                      ),
                    },
                    h("span", { key: 341, style: style("color:var(--cyan)") }, h(React.Fragment, { key: 342 }, "02")),
                    h(React.Fragment, { key: 343 }, "Decrypt"),
                  ),
                  " ",
                  h(
                    "li",
                    {
                      key: 345,
                      style: style(
                        "display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;border:1px solid var(--glass-border);background:var(--glass);font-family:var(--font-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase",
                      ),
                    },
                    h("span", { key: 346, style: style("color:var(--green)") }, h(React.Fragment, { key: 347 }, "03")),
                    h(React.Fragment, { key: 348 }, "Verify"),
                  ),
                  " ",
                ),
                " ",
                h(
                  "p",
                  {
                    key: 351,
                    style: style(
                      "font-family:var(--font-mono);font-size:12px;color:var(--text-dim);margin:0;line-height:1.6",
                    ),
                  },
                  h(
                    React.Fragment,
                    { key: 352 },
                    "Files verified October 3, 2026. A live system restore was not performed.",
                  ),
                ),
                " ",
                v.tech
                  ? h(
                      React.Fragment,
                      { key: 354 },
                      " ",
                      h(
                        "p",
                        {
                          key: 356,
                          style: style(
                            "font-size:14px;line-height:1.6;color:var(--text-dim);margin:0;padding:12px 14px;border:1px solid var(--glass-border);border-radius:12px;background:var(--glass)",
                          ),
                        },
                        h(
                          "span",
                          {
                            key: 357,
                            style: style(
                              "font-family:var(--font-mono);font-size:10px;letter-spacing:.14em;color:var(--cyan);margin-right:10px",
                            ),
                          },
                          h(React.Fragment, { key: 358 }, "FOR ENGINEERS"),
                        ),
                        h(
                          React.Fragment,
                          { key: 359 },
                          "The encrypted archive was decrypted on a second host, 990 files were compared with the originals and the archive hash matched. This is file level verification, not a full system restore.",
                        ),
                      ),
                      " ",
                    )
                  : null,
                " ",
                h(
                  "a",
                  { key: 362, href: "#evidence", style: style("font-weight:600;font-size:14px") },
                  h(React.Fragment, { key: 363 }, "Read the repair and receipt →"),
                ),
                " ",
              ),
              " ",
            ),
            " ",
            h(
              designSystem.Panel,
              { key: 367, color: "accent", title: "A TOOL TO TAKE WITH YOU", icon: "▸" },
              " ",
              h(
                "div",
                { key: 369, style: style("display:flex;flex-direction:column;gap:18px") },
                " ",
                h(
                  "span",
                  {
                    key: 371,
                    style: style(
                      "font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent)",
                    ),
                  },
                  h(React.Fragment, { key: 372 }, "A tool to take with you · October 3, 2026"),
                ),
                " ",
                h(
                  "h3",
                  {
                    key: 374,
                    style: style(
                      "font-family:var(--font-display);font-weight:700;font-size:clamp(18px,2.2vw,24px);line-height:1.2;margin:0",
                    ),
                  },
                  h(React.Fragment, { key: 375 }, "A brief worth keeping."),
                ),
                " ",
                h(
                  "p",
                  {
                    key: 377,
                    style: style("color:var(--text-dim);font-size:16px;line-height:1.6;margin:0;text-wrap:pretty"),
                  },
                  h(
                    React.Fragment,
                    { key: 378 },
                    "Choose what matters. Keep the sources and the unknowns attached. Take the decision brief with you.",
                  ),
                ),
                " ",
                h(
                  "div",
                  {
                    key: 380,
                    role: "group",
                    "aria-label": "The three parts of the example decision brief",
                    style: style(
                      "display:flex;flex-direction:column;gap:12px;padding:18px 20px;border-radius:12px;background:var(--void-deep);border:1px solid var(--glass-border)",
                    ),
                  },
                  " ",
                  h(
                    "span",
                    {
                      key: 382,
                      style: style(
                        "font-family:var(--font-mono);font-size:10px;letter-spacing:.18em;color:var(--cyan)",
                      ),
                    },
                    h(React.Fragment, { key: 383 }, "A DECISION BRIEF"),
                  ),
                  " ",
                  h(
                    "ol",
                    {
                      key: 385,
                      style: style("list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px"),
                    },
                    " ",
                    h(
                      "li",
                      {
                        key: 387,
                        style: style("display:grid;grid-template-columns:32px 1fr;gap:8px;align-items:baseline"),
                      },
                      h(
                        "span",
                        { key: 388, style: style("font-family:var(--font-mono);font-size:11px;color:var(--accent)") },
                        h(React.Fragment, { key: 389 }, "01"),
                      ),
                      h(
                        "span",
                        { key: 390 },
                        h(
                          "strong",
                          {
                            key: 391,
                            style: style("font-family:var(--font-display);font-size:13px;letter-spacing:.04em"),
                          },
                          h(React.Fragment, { key: 392 }, "What we observed"),
                        ),
                        h("br", { key: 393 }),
                        h(
                          "small",
                          { key: 394, style: style("color:var(--text-dim);font-size:13px") },
                          h(React.Fragment, { key: 395 }, "A source and a date."),
                        ),
                      ),
                    ),
                    " ",
                    h(
                      "li",
                      {
                        key: 397,
                        style: style("display:grid;grid-template-columns:32px 1fr;gap:8px;align-items:baseline"),
                      },
                      h(
                        "span",
                        { key: 398, style: style("font-family:var(--font-mono);font-size:11px;color:var(--accent)") },
                        h(React.Fragment, { key: 399 }, "02"),
                      ),
                      h(
                        "span",
                        { key: 400 },
                        h(
                          "strong",
                          {
                            key: 401,
                            style: style("font-family:var(--font-display);font-size:13px;letter-spacing:.04em"),
                          },
                          h(React.Fragment, { key: 402 }, "What we don’t know"),
                        ),
                        h("br", { key: 403 }),
                        h(
                          "small",
                          { key: 404, style: style("color:var(--text-dim);font-size:13px") },
                          h(React.Fragment, { key: 405 }, "The unknown stays visible."),
                        ),
                      ),
                    ),
                    " ",
                    h(
                      "li",
                      {
                        key: 407,
                        style: style("display:grid;grid-template-columns:32px 1fr;gap:8px;align-items:baseline"),
                      },
                      h(
                        "span",
                        { key: 408, style: style("font-family:var(--font-mono);font-size:11px;color:var(--accent)") },
                        h(React.Fragment, { key: 409 }, "03"),
                      ),
                      h(
                        "span",
                        { key: 410 },
                        h(
                          "strong",
                          {
                            key: 411,
                            style: style("font-family:var(--font-display);font-size:13px;letter-spacing:.04em"),
                          },
                          h(React.Fragment, { key: 412 }, "Who decides"),
                        ),
                        h("br", { key: 413 }),
                        h(
                          "small",
                          { key: 414, style: style("color:var(--text-dim);font-size:13px") },
                          h(React.Fragment, { key: 415 }, "A person keeps the final say."),
                        ),
                      ),
                    ),
                    " ",
                  ),
                  " ",
                  h(
                    "span",
                    {
                      key: 418,
                      style: style(
                        "font-family:var(--font-mono);font-size:10px;letter-spacing:.14em;color:var(--text-dim)",
                      ),
                    },
                    h(React.Fragment, { key: 419 }, "EXAMPLE · YOURS TO ASSEMBLE"),
                  ),
                  " ",
                ),
                " ",
                v.tech
                  ? h(
                      React.Fragment,
                      { key: 422 },
                      " ",
                      h(
                        "p",
                        {
                          key: 424,
                          style: style(
                            "font-size:14px;line-height:1.6;color:var(--text-dim);margin:0;padding:12px 14px;border:1px solid var(--glass-border);border-radius:12px;background:var(--glass)",
                          ),
                        },
                        h(
                          "span",
                          {
                            key: 425,
                            style: style(
                              "font-family:var(--font-mono);font-size:10px;letter-spacing:.14em;color:var(--cyan);margin-right:10px",
                            ),
                          },
                          h(React.Fragment, { key: 426 }, "FOR ENGINEERS"),
                        ),
                        h(
                          React.Fragment,
                          { key: 427 },
                          "The brief is assembled in your browser from the choices you make. Each claim keeps its source and date, and open questions stay listed instead of being smoothed over.",
                        ),
                      ),
                      " ",
                    )
                  : null,
                " ",
                h(
                  "div",
                  { key: 430, style: style("display:flex;gap:22px;flex-wrap:wrap;font-weight:600;font-size:14px") },
                  " ",
                  h(
                    "a",
                    { key: 432, href: "/v39/#build=briefing" },
                    h(React.Fragment, { key: 433 }, "Make your brief →"),
                  ),
                  " ",
                  h(
                    "a",
                    { key: 435, href: "https://cashio.us/artifacts/decision-brief.txt" },
                    h(React.Fragment, { key: 436 }, "Download an example ↓"),
                  ),
                  " ",
                ),
                " ",
              ),
              " ",
            ),
            " ",
          ),
          " ",
          h(
            "div",
            {
              key: 442,
              "data-reveal": "",
              style: style("display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:16px"),
            },
            " ",
            h(
              "div",
              {
                key: 444,
                style: style("grid-column:1/-1;display:flex;flex-wrap:wrap;gap:10px 18px;align-items:baseline"),
              },
              " ",
              h(
                "span",
                {
                  key: 446,
                  style: style(
                    "font-family:var(--font-mono);font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--accent)",
                  ),
                },
                h(React.Fragment, { key: 447 }, "At a glance"),
              ),
              " ",
              h(
                "span",
                { key: 449, style: style("font-size:17px;color:var(--text);text-wrap:pretty") },
                h(
                  React.Fragment,
                  { key: 450 },
                  "A hobby lab and proof of work. A technology career since 1996, with more than twenty years in cybersecurity.",
                ),
              ),
              " ",
            ),
            " ",
            h(
              "div",
              {
                key: 453,
                className: "za-card-hover",
                "data-tilt": "6",
                style: style(
                  "position:relative;background:var(--surface-2);border:1px solid var(--glass-border);border-radius:12px;padding:22px;display:flex;flex-direction:column;gap:8px",
                ),
              },
              " ",
              h(
                "span",
                {
                  key: 455,
                  style: style(
                    "font-family:var(--font-mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent)",
                  ),
                },
                h(React.Fragment, { key: 456 }, "By day"),
              ),
              " ",
              h(
                "strong",
                { key: 458, style: style("font-family:var(--font-display);font-size:14px;letter-spacing:.04em") },
                h(React.Fragment, { key: 459 }, "Security for the MSP channel"),
              ),
              " ",
              h(
                "span",
                { key: 461, style: style("color:var(--text-dim);font-size:15px;line-height:1.55") },
                h(
                  React.Fragment,
                  { key: 462 },
                  "Principal Solutions Consultant, helping managed service providers deliver security and cloud services.",
                ),
              ),
              " ",
              h(
                "a",
                {
                  key: 464,
                  href: "https://www.linkedin.com/in/dougcashio/",
                  style: style("font-size:14px;font-weight:600;margin-top:auto"),
                },
                h(React.Fragment, { key: 465 }, "Career history on LinkedIn ↗"),
              ),
              " ",
            ),
            " ",
            h(
              "div",
              {
                key: 468,
                className: "za-card-hover",
                "data-tilt": "6",
                style: style(
                  "position:relative;background:var(--surface-2);border:1px solid var(--glass-border);border-radius:12px;padding:22px;display:flex;flex-direction:column;gap:8px",
                ),
              },
              " ",
              h(
                "span",
                {
                  key: 470,
                  style: style(
                    "font-family:var(--font-mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent)",
                  ),
                },
                h(React.Fragment, { key: 471 }, "By night"),
              ),
              " ",
              h(
                "strong",
                { key: 473, style: style("font-family:var(--font-display);font-size:14px;letter-spacing:.04em") },
                h(React.Fragment, { key: 474 }, "My lab after hours"),
              ),
              " ",
              h(
                "span",
                { key: 476, style: style("color:var(--text-dim);font-size:15px;line-height:1.55") },
                h(
                  React.Fragment,
                  { key: 477 },
                  "Two servers I own, a job scheduler, and the experiments you can try here.",
                ),
              ),
              " ",
              h(
                "a",
                { key: 479, href: "#evidence", style: style("font-size:14px;font-weight:600;margin-top:auto") },
                h(React.Fragment, { key: 480 }, "See the dated record ↓"),
              ),
              " ",
            ),
            " ",
            h(
              "div",
              {
                key: 483,
                className: "za-card-hover",
                "data-tilt": "6",
                style: style(
                  "position:relative;background:var(--surface-2);border:1px solid var(--glass-border);border-radius:12px;padding:22px;display:flex;flex-direction:column;gap:8px",
                ),
              },
              " ",
              h(
                "span",
                {
                  key: 485,
                  style: style(
                    "font-family:var(--font-mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent)",
                  ),
                },
                h(React.Fragment, { key: 486 }, "In the open"),
              ),
              " ",
              h(
                "strong",
                { key: 488, style: style("font-family:var(--font-display);font-size:14px;letter-spacing:.04em") },
                h(React.Fragment, { key: 489 }, "Work you can inspect"),
              ),
              " ",
              h(
                "span",
                { key: 491, style: style("color:var(--text-dim);font-size:15px;line-height:1.55") },
                h(React.Fragment, { key: 492 }, "Change the inputs, explore the worlds, and see what happens."),
              ),
              " ",
              h(
                "div",
                {
                  key: 494,
                  style: style("display:flex;gap:16px;flex-wrap:wrap;font-size:14px;font-weight:600;margin-top:auto"),
                },
                h(
                  "a",
                  { key: 495, href: "https://github.com/jamescashio/jamescashio.github.io" },
                  h(React.Fragment, { key: 496 }, "Read the source ↗"),
                ),
                h("a", { key: 497, href: "#rooms" }, h(React.Fragment, { key: 498 }, "Explore the Studios →")),
              ),
              " ",
            ),
            " ",
            h(
              "div",
              {
                key: 501,
                style: style(
                  "grid-column:1/-1;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:16px 40px;padding:22px 24px;border-radius:20px;background:var(--surface);border:1px solid var(--glass-border)",
                ),
              },
              " ",
              h(
                "div",
                { key: 503, style: style("display:flex;flex-direction:column;gap:8px") },
                " ",
                h(
                  "span",
                  {
                    key: 505,
                    style: style(
                      "font-family:var(--font-mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent)",
                    ),
                  },
                  h(React.Fragment, { key: 506 }, "What runs here"),
                ),
                " ",
                h(
                  "p",
                  {
                    key: 508,
                    style: style("color:var(--text-dim);font-size:15px;line-height:1.6;margin:0;text-wrap:pretty"),
                  },
                  h(
                    React.Fragment,
                    { key: 509 },
                    "Zeus and Apollo are my two servers. Hermes schedules jobs; Atlas is a local model. The experiments below illustrate the routing rules. The dated evidence shows what was actually observed.",
                  ),
                ),
                " ",
                h(
                  "p",
                  {
                    key: 511,
                    style: style("color:var(--text-dim);font-size:15px;line-height:1.6;margin:0;text-wrap:pretty"),
                  },
                  h(
                    React.Fragment,
                    { key: 512 },
                    "Everything you try here runs in your browser; nothing reaches my servers. The evidence section answers from a dated record, and a small copilot marks where a person holds authority.",
                  ),
                ),
                " ",
              ),
              " ",
              h(
                "details",
                { key: 515, style: style("display:flex;flex-direction:column;gap:10px") },
                " ",
                h(
                  "summary",
                  {
                    key: 517,
                    style: style(
                      "display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;border-radius:12px;border:1px solid var(--glass-border);background:var(--glass);font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--cyan)",
                    ),
                  },
                  h(React.Fragment, { key: 518 }, "Every name on this page, in plain English "),
                  h("span", { key: 519 }, h(React.Fragment, { key: 520 }, "▾")),
                ),
                " ",
                h(
                  "dl",
                  {
                    key: 522,
                    style: style(
                      "display:grid;grid-template-columns:auto 1fr;gap:8px 16px;margin:14px 0 0;font-size:14px;line-height:1.5",
                    ),
                  },
                  " ",
                  h(
                    "dt",
                    {
                      key: 524,
                      style: style(
                        "font-family:var(--font-display);font-size:12px;letter-spacing:.06em;color:var(--text)",
                      ),
                    },
                    h(React.Fragment, { key: 525 }, "Bit"),
                  ),
                  h(
                    "dd",
                    { key: 526, style: style("margin:0;color:var(--text-dim)") },
                    h(React.Fragment, { key: 527 }, "The gold copilot. It marks where a person holds authority."),
                  ),
                  " ",
                  h(
                    "dt",
                    {
                      key: 529,
                      style: style(
                        "font-family:var(--font-display);font-size:12px;letter-spacing:.06em;color:var(--text)",
                      ),
                    },
                    h(React.Fragment, { key: 530 }, "E.V.E."),
                  ),
                  h(
                    "dd",
                    { key: 531, style: style("margin:0;color:var(--text-dim)") },
                    h(
                      React.Fragment,
                      { key: 532 },
                      "The Evaluation Verification Engine. A console for dated observations and clearly labeled lore.",
                    ),
                  ),
                  " ",
                  h(
                    "dt",
                    {
                      key: 534,
                      style: style(
                        "font-family:var(--font-display);font-size:12px;letter-spacing:.06em;color:var(--text)",
                      ),
                    },
                    h(React.Fragment, { key: 535 }, "HERMES"),
                  ),
                  h(
                    "dd",
                    { key: 536, style: style("margin:0;color:var(--text-dim)") },
                    h(
                      React.Fragment,
                      { key: 537 },
                      "My job scheduler. The first experiment below shows how a routing policy chooses where work goes.",
                    ),
                  ),
                  " ",
                  h(
                    "dt",
                    {
                      key: 539,
                      style: style(
                        "font-family:var(--font-display);font-size:12px;letter-spacing:.06em;color:var(--text)",
                      ),
                    },
                    h(React.Fragment, { key: 540 }, "DSH"),
                  ),
                  h(
                    "dd",
                    { key: 541, style: style("margin:0;color:var(--text-dim)") },
                    h(React.Fragment, { key: 542 }, "My operator console, where I run everything from."),
                  ),
                  " ",
                  h(
                    "dt",
                    {
                      key: 544,
                      style: style(
                        "font-family:var(--font-display);font-size:12px;letter-spacing:.06em;color:var(--text)",
                      ),
                    },
                    h(React.Fragment, { key: 545 }, "Zeus and Apollo"),
                  ),
                  h(
                    "dd",
                    { key: 546, style: style("margin:0;color:var(--text-dim)") },
                    h(React.Fragment, { key: 547 }, "My two servers."),
                  ),
                  " ",
                  h(
                    "dt",
                    {
                      key: 549,
                      style: style(
                        "font-family:var(--font-display);font-size:12px;letter-spacing:.06em;color:var(--text)",
                      ),
                    },
                    h(React.Fragment, { key: 550 }, "Atlas"),
                  ),
                  h(
                    "dd",
                    { key: 551, style: style("margin:0;color:var(--text-dim)") },
                    h(React.Fragment, { key: 552 }, "The local model that handles recurring work."),
                  ),
                  " ",
                  h(
                    "dt",
                    {
                      key: 554,
                      style: style(
                        "font-family:var(--font-display);font-size:12px;letter-spacing:.06em;color:var(--text)",
                      ),
                    },
                    h(React.Fragment, { key: 555 }, "cAshIo"),
                  ),
                  h(
                    "dd",
                    { key: 556, style: style("margin:0;color:var(--text-dim)") },
                    h(
                      React.Fragment,
                      { key: 557 },
                      "Cashio, with the AI in capitals. My personal AI workspace, and the name on this site. Its page is linked in the footer.",
                    ),
                  ),
                  " ",
                  h(
                    "dt",
                    {
                      key: 559,
                      style: style(
                        "font-family:var(--font-display);font-size:12px;letter-spacing:.06em;color:var(--text)",
                      ),
                    },
                    h(React.Fragment, { key: 560 }, "Mostly Harmless"),
                  ),
                  h(
                    "dd",
                    { key: 561, style: style("margin:0;color:var(--text-dim)") },
                    h(
                      React.Fragment,
                      { key: 562 },
                      "The name of this site’s visual edition. Each evidence record keeps its own date.",
                    ),
                  ),
                  " ",
                  h(
                    "dt",
                    {
                      key: 564,
                      style: style(
                        "font-family:var(--font-display);font-size:12px;letter-spacing:.06em;color:var(--text)",
                      ),
                    },
                    h(React.Fragment, { key: 565 }, "Workhorse, Research, Synthesis"),
                  ),
                  h(
                    "dd",
                    { key: 566, style: style("margin:0;color:var(--text-dim)") },
                    h(
                      React.Fragment,
                      { key: 567 },
                      "Routes for everyday drafting, sourced research and combining information.",
                    ),
                  ),
                  " ",
                ),
                " ",
              ),
              " ",
            ),
            " ",
            h(
              "p",
              {
                key: 572,
                style: style(
                  "grid-column:1/-1;display:flex;flex-wrap:wrap;gap:8px 22px;margin:0;font-size:15px;color:var(--text-dim)",
                ),
              },
              h(
                "span",
                { key: 573 },
                h(React.Fragment, { key: 574 }, "Open to speaking, mentoring and comparing notes."),
              ),
              h(
                "a",
                { key: 575, href: "#contact", style: style("font-weight:600") },
                h(React.Fragment, { key: 576 }, "Say hello →"),
              ),
              h(
                "a",
                {
                  key: 577,
                  href: "https://www.credly.com/users/james-cashio/badges/credly",
                  style: style("font-weight:600"),
                },
                h(React.Fragment, { key: 578 }, "Certifications on Credly ↗"),
              ),
            ),
            " ",
          ),
          " ",
        ),
        " ",
        " ",
        h(
          "section",
          {
            key: 583,
            id: "rooms",
            "data-screen-label": "Four worlds",
            style: style(
              "position:relative;max-width:1240px;margin:0 auto;padding:72px 28px;display:flex;flex-direction:column;gap:36px",
            ),
          },
          " ",
          h(
            "div",
            {
              key: 585,
              "data-reveal": "",
              style: style("display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:20px"),
            },
            " ",
            h(
              "div",
              { key: 587, style: style("display:flex;flex-direction:column;gap:14px") },
              " ",
              h(
                "span",
                {
                  key: 589,
                  style: style(
                    "font-family:var(--font-mono);font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--accent)",
                  ),
                },
                h(
                  "span",
                  { key: 590, style: style("color:var(--text-dim);margin-right:14px") },
                  h(React.Fragment, { key: 591 }, "03"),
                ),
                h("span", { key: 592, "data-scramble": "" }, h(React.Fragment, { key: 593 }, "Four worlds")),
              ),
              " ",
              h(
                "h2",
                {
                  key: 595,
                  style: style(
                    "font-family:var(--font-display);font-weight:900;font-size:clamp(30px,4.6vw,54px);line-height:1.05;letter-spacing:.02em;margin:0",
                  ),
                },
                h(React.Fragment, { key: 596 }, "Pick a world."),
                h("br", { key: 597 }),
                h(
                  "span",
                  { key: 598, style: style("color:var(--cyan);text-shadow:0 0 24px var(--cyan-glow)") },
                  h(React.Fragment, { key: 599 }, "Stay a while."),
                ),
              ),
              " ",
            ),
            " ",
            h(
              "p",
              {
                key: 602,
                style: style(
                  "max-width:44ch;color:var(--text-dim);font-size:16px;line-height:1.6;margin:0;text-wrap:pretty",
                ),
              },
              h(
                React.Fragment,
                { key: 603 },
                "Fly, tinker, watch or read. Each world opens as its own page and brings you right back.",
              ),
            ),
            " ",
          ),
          " ",
          h(
            "div",
            {
              key: 606,
              style: style("display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:18px"),
            },
            " ",
            (function (parent) {
              return (v.worlds || []).map((item, index) => {
                const v = { ...parent, w: item, $index: index };
                return h(
                  React.Fragment,
                  { key: index },
                  " ",
                  h(
                    "a",
                    {
                      key: 610,
                      className: "za-card-hover",
                      "data-reveal": "",
                      "data-tilt": "8",
                      href: v.w.href,
                      onMouseEnter: v.w.enter,
                      onMouseLeave: v.w.leave,
                      style: style(
                        "display:flex;flex-direction:column;background:var(--surface-2);border:1px solid var(--glass-border);border-radius:20px;overflow:hidden;color:var(--text)",
                      ),
                    },
                    " ",
                    h(
                      "div",
                      {
                        key: 612,
                        style: style(
                          "position:relative;aspect-ratio:16/10;overflow:hidden;background:var(--void-deep);border-bottom:1px solid var(--glass-border)",
                        ),
                      },
                      " ",
                      h("img", {
                        key: 614,
                        "data-bound-src": v.w.img,
                        alt: "",
                        loading: "lazy",
                        decoding: "async",
                        style: style("position:absolute;inset:0;width:100%;height:100%;object-fit:cover"),
                      }),
                      " ",
                      v.w.hasVideo
                        ? h(
                            React.Fragment,
                            { key: 616 },
                            " ",
                            h("video", {
                              key: 618,
                              "data-v": "hover",
                              "data-bound-src": v.w.video,
                              preload: "none",
                              "aria-hidden": "true",
                              style: style(
                                "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .6s cubic-bezier(.23,1,.32,1)",
                              ),
                            }),
                            " ",
                          )
                        : null,
                      " ",
                      h("span", {
                        key: 621,
                        style: style(
                          "position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,10,15,.2) 0%,transparent 40%,rgba(18,18,32,.9) 100%)",
                        ),
                      }),
                      " ",
                      h(
                        "span",
                        {
                          key: 623,
                          style: style(
                            "position:absolute;left:14px;top:12px;font-family:var(--font-mono);font-size:10px;letter-spacing:.18em;color:var(--text)",
                          ),
                        },
                        h(
                          React.Fragment,
                          { key: 624 },
                          "",
                          h("span", { className: "sc-interp", key: 1 }, v.w.index),
                          "",
                        ),
                      ),
                      " ",
                      h("span", {
                        key: 626,
                        style: style(
                          [
                            "position:absolute;right:14px;top:14px;width:8px;height:8px;border-radius:50%;background:",
                            v.w.color ?? "",
                            ";box-shadow:0 0 12px ",
                            v.w.color ?? "",
                            "",
                          ].join(""),
                        ),
                      }),
                      " ",
                    ),
                    " ",
                    h(
                      "div",
                      {
                        key: 629,
                        style: style("display:flex;flex-direction:column;gap:8px;padding:18px 20px 22px;flex:1"),
                      },
                      " ",
                      h(
                        "span",
                        {
                          key: 631,
                          style: style(
                            [
                              "font-family:var(--font-mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:",
                              v.w.color ?? "",
                              "",
                            ].join(""),
                          ),
                        },
                        h(
                          React.Fragment,
                          { key: 632 },
                          "",
                          h("span", { className: "sc-interp", key: 1 }, v.w.name),
                          "",
                        ),
                      ),
                      " ",
                      h(
                        "strong",
                        {
                          key: 634,
                          style: style(
                            "font-family:var(--font-display);font-size:15px;line-height:1.3;letter-spacing:.03em",
                          ),
                        },
                        h(
                          React.Fragment,
                          { key: 635 },
                          "",
                          h("span", { className: "sc-interp", key: 1 }, v.w.line),
                          "",
                        ),
                      ),
                      " ",
                      h(
                        "span",
                        { key: 637, style: style("color:var(--text-dim);font-size:14px;line-height:1.55") },
                        h(
                          React.Fragment,
                          { key: 638 },
                          "",
                          h("span", { className: "sc-interp", key: 1 }, v.w.desc),
                          "",
                        ),
                      ),
                      " ",
                      h(
                        "span",
                        {
                          key: 640,
                          style: style(
                            "margin-top:auto;padding-top:10px;font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--cyan)",
                          ),
                        },
                        h(React.Fragment, { key: 641 }, "Open the page →"),
                      ),
                      " ",
                    ),
                    " ",
                  ),
                  " ",
                );
              });
            })(v),
            " ",
          ),
          " ",
          h(
            "nav",
            {
              key: 647,
              "aria-label": "Room reading editions",
              style: style("display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;font-size:14px"),
            },
            h(
              "span",
              { key: 648, style: style("color:var(--text-dim)") },
              h(React.Fragment, { key: 649 }, "Reading editions:"),
            ),
            h(
              "a",
              { key: 650, href: "https://cashio.us/rooms/starship/" },
              h(React.Fragment, { key: 651 }, "Starship lab"),
            ),
            h(
              "a",
              { key: 652, href: "https://cashio.us/rooms/principles/" },
              h(React.Fragment, { key: 653 }, "Principles"),
            ),
            h("a", { key: 654, href: "https://cashio.us/rooms/studios/" }, h(React.Fragment, { key: 655 }, "Studios")),
            h(
              "a",
              { key: 656, href: "https://cashio.us/rooms/heritage/" },
              h(React.Fragment, { key: 657 }, "Flight heritage"),
            ),
          ),
          " ",
        ),
        " ",
        " ",
        h(
          "section",
          {
            key: 661,
            id: "films",
            "data-screen-label": "Screening room",
            style: style(
              "position:relative;padding:96px 0 88px;overflow:hidden;border-top:1px solid var(--glass-border);border-bottom:1px solid var(--glass-border);background:linear-gradient(180deg,rgba(5,6,10,.6),rgba(5,6,10,.95))",
            ),
          },
          " ",
          h("div", {
            key: 663,
            "aria-hidden": "true",
            style: style(
              "position:absolute;inset:0;background:radial-gradient(ellipse at 25% 20%, rgba(204,0,255,.10), transparent 50%), radial-gradient(ellipse at 85% 90%, rgba(0,249,255,.07), transparent 50%)",
            ),
          }),
          " ",
          h(
            "div",
            {
              key: 665,
              style: style(
                "position:relative;max-width:1240px;margin:0 auto;padding:0 28px;display:flex;flex-direction:column;gap:32px",
              ),
            },
            " ",
            h(
              "div",
              {
                key: 667,
                "data-reveal": "",
                style: style("display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:20px"),
              },
              " ",
              h(
                "div",
                { key: 669, style: style("display:flex;flex-direction:column;gap:14px") },
                " ",
                h(
                  "span",
                  {
                    key: 671,
                    style: style(
                      "font-family:var(--font-mono);font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--accent)",
                    ),
                  },
                  h(
                    "span",
                    { key: 672, style: style("color:var(--text-dim);margin-right:14px") },
                    h(React.Fragment, { key: 673 }, "04"),
                  ),
                  h(
                    "span",
                    { key: 674, "data-scramble": "" },
                    h(React.Fragment, { key: 675 }, "The Studios · Short film collection"),
                  ),
                ),
                " ",
                h(
                  "h2",
                  {
                    key: 677,
                    style: style(
                      "font-family:var(--font-display);font-weight:900;font-size:clamp(30px,4.6vw,54px);line-height:1.05;letter-spacing:.02em;margin:0",
                    ),
                  },
                  h(React.Fragment, { key: 678 }, "A world worth"),
                  h("br", { key: 679 }),
                  h(
                    "span",
                    { key: 680, style: style("color:var(--purple);text-shadow:0 0 26px var(--purple-glow)") },
                    h(React.Fragment, { key: 681 }, "getting lost in."),
                  ),
                ),
                " ",
              ),
              " ",
              h(
                "p",
                {
                  key: 684,
                  style: style(
                    "max-width:44ch;color:var(--text-dim);font-size:16px;line-height:1.6;margin:0;text-wrap:pretty",
                  ),
                },
                h(
                  React.Fragment,
                  { key: 685 },
                  "Shape the light, explore the signature or settle into the short film collection.",
                ),
              ),
              " ",
            ),
            " ",
            h(
              "div",
              {
                key: 688,
                style: style(
                  ["display:grid;grid-template-columns:", v.filmCols ?? "", ";gap:22px;align-items:start"].join(""),
                ),
              },
              " ",
              h(
                "div",
                {
                  key: 690,
                  className: "film-feature",
                  "data-reveal": "",
                  "data-tilt": "3",
                  style: style(
                    "position:relative;border-radius:28px;overflow:hidden;border:1px solid var(--glass-border);box-shadow:var(--shadow-panel),0 0 90px -30px rgba(204,0,255,.45);background:#000;aspect-ratio:16/9;min-width:0",
                  ),
                },
                " ",
                h("video", {
                  key: 692,
                  id: "feature-video",
                  "data-v": "auto",
                  "data-bound-src": v.featSrc,
                  "data-bound-poster": v.featPoster,
                  preload: "metadata",
                  "aria-label": v.featTitle,
                  style: style("position:absolute;inset:0;width:100%;height:100%;object-fit:cover"),
                }),
                " ",
                h("span", {
                  key: 694,
                  "aria-hidden": "true",
                  style: style(
                    "position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,6,10,.35) 0%,transparent 30%,transparent 50%,rgba(5,6,10,.92) 100%)",
                  ),
                }),
                " ",
                h("span", {
                  key: 696,
                  "aria-hidden": "true",
                  style: style(
                    "position:absolute;left:16px;top:16px;width:26px;height:26px;border-left:2px solid var(--accent);border-top:2px solid var(--accent)",
                  ),
                }),
                " ",
                h("span", {
                  key: 698,
                  "aria-hidden": "true",
                  style: style(
                    "position:absolute;right:16px;top:16px;width:26px;height:26px;border-right:2px solid var(--accent);border-top:2px solid var(--accent)",
                  ),
                }),
                " ",
                h("span", {
                  key: 700,
                  "aria-hidden": "true",
                  style: style(
                    "position:absolute;left:16px;bottom:16px;width:26px;height:26px;border-left:2px solid var(--cyan);border-bottom:2px solid var(--cyan)",
                  ),
                }),
                " ",
                h("span", {
                  key: 702,
                  "aria-hidden": "true",
                  style: style(
                    "position:absolute;right:16px;bottom:16px;width:26px;height:26px;border-right:2px solid var(--cyan);border-bottom:2px solid var(--cyan)",
                  ),
                }),
                " ",
                h(
                  "div",
                  {
                    key: 704,
                    style: style(
                      "position:absolute;left:30px;top:28px;display:flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:10px;letter-spacing:.2em;color:var(--text)",
                    ),
                  },
                  h("span", {
                    key: 705,
                    style: style(
                      "width:8px;height:8px;border-radius:50%;background:var(--red);box-shadow:0 0 10px var(--red-glow);animation:za-pulse 1.6s ease-in-out infinite",
                    ),
                  }),
                  h(React.Fragment, { key: 706 }, "NOW SCREENING"),
                ),
                " ",
                h(
                  "div",
                  {
                    key: 708,
                    style: style(
                      "position:absolute;left:30px;right:30px;bottom:28px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:16px",
                    ),
                  },
                  " ",
                  h(
                    "div",
                    { key: 710, style: style("display:flex;flex-direction:column;gap:8px;max-width:52ch") },
                    " ",
                    h(
                      "span",
                      {
                        key: 712,
                        style: style(
                          "font-family:var(--font-mono);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--accent)",
                        ),
                      },
                      h(
                        React.Fragment,
                        { key: 713 },
                        "",
                        h("span", { className: "sc-interp", key: 1 }, v.featColl),
                        " · A five-second film",
                      ),
                    ),
                    " ",
                    h(
                      "h3",
                      {
                        key: 715,
                        style: style(
                          "font-family:var(--font-display);font-weight:900;font-size:clamp(22px,3vw,38px);line-height:1.05;margin:0;color:var(--text)",
                        ),
                      },
                      h(
                        React.Fragment,
                        { key: 716 },
                        "",
                        h("span", { className: "sc-interp", key: 1 }, v.featTitle),
                        "",
                      ),
                    ),
                    " ",
                    h(
                      "p",
                      { key: 718, style: style("margin:0;font-size:15px;line-height:1.5;color:var(--text)") },
                      h(
                        React.Fragment,
                        { key: 719 },
                        "",
                        h("span", { className: "sc-interp", key: 1 }, v.featDesc),
                        "",
                      ),
                    ),
                    " ",
                  ),
                  " ",
                  h(
                    "div",
                    { key: 722, style: style("display:flex;gap:10px;flex-wrap:wrap") },
                    " ",
                    h(
                      designSystem.Button,
                      { key: 724, onClick: v.openFeature, size: "sm" },
                      h(React.Fragment, { key: 725 }, "▶ Full screen"),
                    ),
                    " ",
                    h(
                      designSystem.Button,
                      { key: 727, onClick: v.nextFilm, variant: "secondary", size: "sm" },
                      h(React.Fragment, { key: 728 }, "Next film ▸"),
                    ),
                    " ",
                  ),
                  " ",
                ),
                " ",
              ),
              " ",
              h(
                "div",
                {
                  key: 733,
                  "data-reveal": "",
                  style: style("display:flex;flex-direction:column;gap:14px;min-width:0"),
                },
                " ",
                h(
                  "div",
                  {
                    key: 735,
                    role: "group",
                    "aria-label": "Film collections",
                    style: style("display:flex;gap:8px;flex-wrap:wrap"),
                  },
                  " ",
                  (function (parent) {
                    return (v.collections || []).map((item, index) => {
                      const v = { ...parent, c: item, $index: index };
                      return h(
                        React.Fragment,
                        { key: index },
                        h(
                          "button",
                          { key: 738, type: "button", onClick: v.c.pick, style: style(v.c.style) },
                          h(
                            React.Fragment,
                            { key: 739 },
                            "",
                            h("span", { className: "sc-interp", key: 1 }, v.c.label),
                            "",
                          ),
                        ),
                      );
                    });
                  })(v),
                  " ",
                ),
                " ",
                h(
                  "div",
                  { key: 742, style: style("display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px") },
                  " ",
                  (function (parent) {
                    return (v.filmList || []).map((item, index) => {
                      const v = { ...parent, f: item, $index: index };
                      return h(
                        React.Fragment,
                        { key: index },
                        " ",
                        h(
                          "button",
                          {
                            key: 746,
                            type: "button",
                            onClick: v.f.pick,
                            onMouseEnter: v.f.enter,
                            onMouseLeave: v.f.leave,
                            "aria-pressed": v.f.pressed,
                            "aria-label": v.f.title,
                            "data-tilt": "10",
                            style: style(v.f.style),
                          },
                          " ",
                          h("img", {
                            key: 748,
                            "data-bound-src": v.f.poster,
                            alt: "",
                            loading: "lazy",
                            decoding: "async",
                            style: style("position:absolute;inset:0;width:100%;height:100%;object-fit:cover"),
                          }),
                          " ",
                          h("video", {
                            key: 750,
                            "data-v": "hover",
                            "data-bound-src": v.f.src,
                            preload: "none",
                            "aria-hidden": "true",
                            style: style(
                              "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .5s",
                            ),
                          }),
                          " ",
                          h("span", {
                            key: 752,
                            style: style(
                              "position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(5,6,10,.92))",
                            ),
                          }),
                          " ",
                          v.f.active
                            ? h(
                                React.Fragment,
                                { key: 754 },
                                h(
                                  "span",
                                  {
                                    key: 755,
                                    style: style(
                                      "position:absolute;top:8px;left:8px;padding:2px 7px;border-radius:999px;background:var(--accent);color:var(--on-accent);font-family:var(--font-mono);font-size:9px;letter-spacing:.14em;font-weight:600",
                                    ),
                                  },
                                  h(React.Fragment, { key: 756 }, "▶ NOW"),
                                ),
                              )
                            : null,
                          " ",
                          h(
                            "span",
                            {
                              key: 758,
                              style: style(
                                "position:absolute;left:10px;right:10px;bottom:8px;text-align:left;font-family:var(--font-display);font-weight:700;font-size:11px;letter-spacing:.05em;color:var(--text);line-height:1.25",
                              ),
                            },
                            h(
                              React.Fragment,
                              { key: 759 },
                              "",
                              h("span", { className: "sc-interp", key: 1 }, v.f.title),
                              "",
                            ),
                          ),
                          " ",
                        ),
                        " ",
                      );
                    });
                  })(v),
                  " ",
                ),
                " ",
                h(
                  "a",
                  {
                    key: 764,
                    href: "https://cashio.us/rooms/studios/",
                    style: style("font-size:14px;font-weight:600"),
                  },
                  h(React.Fragment, { key: 765 }, "Open the Studios →"),
                ),
                " ",
              ),
              " ",
            ),
            " ",
          ),
          " ",
        ),
        " ",
        " ",
        h(
          "section",
          {
            key: 772,
            id: "law",
            "data-screen-label": "Routing law",
            "aria-label": "My routing law",
            style: style("position:relative;height:230vh"),
          },
          " ",
          h(
            "div",
            {
              key: 774,
              style: style("position:sticky;top:0;height:100vh;display:flex;align-items:center;overflow:hidden"),
            },
            " ",
            h("video", {
              key: 776,
              "data-v": "auto",
              src: "/assets/zenith/orbital-dust.mp4",
              poster: "/v40/assets/8f1d9b07-6a95-4e48-bd39-47a1ac959099.webp",
              preload: "none",
              "aria-hidden": "true",
              style: style("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.4"),
            }),
            " ",
            h("div", {
              key: 778,
              "aria-hidden": "true",
              style: style(
                "position:absolute;inset:0;background:radial-gradient(ellipse at 70% 50%, rgba(10,10,15,.2), rgba(10,10,15,.96) 72%)",
              ),
            }),
            " ",
            h(
              "div",
              {
                key: 780,
                style: style(
                  "position:relative;max-width:1240px;width:100%;margin:0 auto;padding:0 28px;display:flex;flex-direction:column;gap:26px",
                ),
              },
              " ",
              h(
                "span",
                {
                  key: 782,
                  style: style(
                    "font-family:var(--font-mono);font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--accent)",
                  ),
                },
                h(
                  "span",
                  { key: 783, style: style("color:var(--text-dim);margin-right:14px") },
                  h(React.Fragment, { key: 784 }, "05"),
                ),
                h(
                  "span",
                  { key: 785, "data-scramble": "" },
                  h(React.Fragment, { key: 786 }, "From my workshop / Smart routing"),
                ),
              ),
              " ",
              h(
                "p",
                {
                  key: 788,
                  style: style(
                    "font-family:var(--font-display);font-weight:900;font-size:clamp(40px,7.6vw,118px);line-height:1;letter-spacing:.005em;margin:0;display:flex;flex-wrap:wrap;gap:0 .26em;color:var(--text)",
                  ),
                },
                " ",
                (function (parent) {
                  return (v.lawA || []).map((item, index) => {
                    const v = { ...parent, w: item, $index: index };
                    return h(
                      React.Fragment,
                      { key: index },
                      h(
                        "span",
                        { key: 791, "data-mword": "a", style: style("transition:opacity .3s,text-shadow .3s") },
                        h(React.Fragment, { key: 792 }, "", h("span", { className: "sc-interp", key: 1 }, v.w.t), ""),
                      ),
                    );
                  });
                })(v),
                " ",
              ),
              " ",
              h(
                "p",
                {
                  key: 795,
                  style: style(
                    "font-family:var(--font-display);font-weight:700;font-size:clamp(28px,5vw,76px);line-height:1.05;margin:0;display:flex;flex-wrap:wrap;gap:0 .26em;color:var(--accent)",
                  ),
                },
                " ",
                (function (parent) {
                  return (v.lawB || []).map((item, index) => {
                    const v = { ...parent, w: item, $index: index };
                    return h(
                      React.Fragment,
                      { key: index },
                      h(
                        "span",
                        { key: 798, "data-mword": "b", style: style("transition:opacity .3s,text-shadow .3s") },
                        h(React.Fragment, { key: 799 }, "", h("span", { className: "sc-interp", key: 1 }, v.w.t), ""),
                      ),
                    );
                  });
                })(v),
                " ",
              ),
              " ",
              h(
                "div",
                { key: 802, style: style("display:flex;align-items:center;gap:18px;flex-wrap:wrap") },
                " ",
                h(
                  "div",
                  {
                    key: 804,
                    "aria-hidden": "true",
                    style: style(
                      "width:min(320px,60vw);height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden",
                    ),
                  },
                  h("div", {
                    key: 805,
                    id: "law-bar",
                    style: style(
                      "height:100%;width:100%;transform:scaleX(0);transform-origin:left;background:linear-gradient(90deg,var(--cyan),var(--accent));box-shadow:0 0 10px var(--accent-glow)",
                    ),
                  }),
                ),
                " ",
                h(
                  "span",
                  {
                    key: 807,
                    style: style(
                      "font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim)",
                    ),
                  },
                  h(React.Fragment, { key: 808 }, "My routing law · published in the dated export"),
                ),
                " ",
              ),
              " ",
            ),
            " ",
          ),
          " ",
        ),
        " ",
        " ",
        h(
          "section",
          {
            key: 815,
            id: "work",
            "data-screen-label": "One decision",
            style: style(
              "position:relative;max-width:1240px;margin:0 auto;padding:72px 28px;display:flex;flex-direction:column;gap:36px",
            ),
          },
          " ",
          h(
            "div",
            {
              key: 817,
              "data-reveal": "",
              style: style("display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:20px"),
            },
            " ",
            h(
              "div",
              { key: 819, style: style("display:flex;flex-direction:column;gap:14px") },
              " ",
              h(
                "span",
                {
                  key: 821,
                  style: style(
                    "font-family:var(--font-mono);font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--accent)",
                  ),
                },
                h(
                  "span",
                  { key: 822, style: style("color:var(--text-dim);margin-right:14px") },
                  h(React.Fragment, { key: 823 }, "06"),
                ),
                h("span", { key: 824, "data-scramble": "" }, h(React.Fragment, { key: 825 }, "One decision")),
              ),
              " ",
              h(
                "h2",
                {
                  key: 827,
                  style: style(
                    "font-family:var(--font-display);font-weight:900;font-size:clamp(30px,4.6vw,54px);line-height:1.05;letter-spacing:.02em;margin:0",
                  ),
                },
                h(React.Fragment, { key: 828 }, "Try a decision."),
                h("br", { key: 829 }),
                h(React.Fragment, { key: 830 }, "See what changes."),
              ),
              " ",
            ),
            " ",
            h(
              "p",
              { key: 833, style: style("color:var(--text-dim);font-size:17px;margin:0") },
              h(React.Fragment, { key: 834 }, "One choice, one result, about twenty seconds."),
            ),
            " ",
          ),
          " ",
          h(
            "div",
            {
              key: 837,
              style: style(
                "display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:22px;align-items:stretch",
              ),
            },
            " ",
            h(
              "div",
              { key: 839, style: style("grid-column:span 1;min-width:0") },
              " ",
              h(
                designSystem.Panel,
                { key: 841, color: "cyan", title: "THE PRIVACY TEST", icon: "▸" },
                " ",
                h(
                  "div",
                  { key: 843, id: "privacy-test", style: style("display:flex;flex-direction:column;gap:18px") },
                  " ",
                  h(
                    "span",
                    {
                      key: 845,
                      style: style(
                        "font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim)",
                      ),
                    },
                    h(React.Fragment, { key: 846 }, "In your browser · No uploads"),
                  ),
                  " ",
                  h(
                    "h3",
                    {
                      key: 848,
                      style: style(
                        "font-family:var(--font-display);font-weight:700;font-size:clamp(18px,2.2vw,24px);line-height:1.2;margin:0",
                      ),
                    },
                    h(React.Fragment, { key: 849 }, "One change. Who decides?"),
                  ),
                  " ",
                  h(
                    "p",
                    { key: 851, style: style("color:var(--text-dim);font-size:16px;line-height:1.6;margin:0") },
                    h(
                      React.Fragment,
                      { key: 852 },
                      "Analyze a document and require sources. Now make that document private.",
                    ),
                  ),
                  " ",
                  h(
                    "div",
                    {
                      key: 854,
                      style: style(
                        "display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:12px",
                      ),
                    },
                    " ",
                    h(
                      "div",
                      {
                        key: 856,
                        style: style(
                          "display:flex;flex-direction:column;gap:8px;padding:16px;border-radius:12px;background:var(--void-deep);border:1px solid var(--glass-border)",
                        ),
                      },
                      " ",
                      h(
                        "span",
                        {
                          key: 858,
                          style: style(
                            "font-family:var(--font-mono);font-size:10px;letter-spacing:.18em;color:var(--cyan)",
                          ),
                        },
                        h(React.Fragment, { key: 859 }, "01 / PUBLIC DOCUMENT"),
                      ),
                      " ",
                      h(
                        "div",
                        {
                          key: 861,
                          style: style(
                            "display:flex;align-items:center;gap:10px;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);padding:10px 0",
                          ),
                        },
                        h(
                          "span",
                          {
                            key: 862,
                            style: style("padding:4px 8px;border:1px solid var(--glass-border);border-radius:6px"),
                          },
                          h(React.Fragment, { key: 863 }, "DOC"),
                        ),
                        h("span", {
                          key: 864,
                          style: style(
                            "flex:1;height:1px;background:repeating-linear-gradient(90deg,var(--cyan) 0 6px,transparent 6px 12px)",
                          ),
                        }),
                        h(
                          "span",
                          {
                            key: 865,
                            style: style(
                              "padding:4px 8px;border:1px solid var(--cyan);border-radius:6px;color:var(--cyan)",
                            ),
                          },
                          h(React.Fragment, { key: 866 }, "SOURCES"),
                        ),
                      ),
                      " ",
                      h(
                        "span",
                        {
                          key: 868,
                          style: style(
                            "font-family:var(--font-display);font-weight:700;font-size:20px;color:var(--cyan)",
                          ),
                        },
                        h(React.Fragment, { key: 869 }, "Research"),
                      ),
                      " ",
                      h(
                        "span",
                        { key: 871, style: style("color:var(--text-dim);font-size:14px;line-height:1.5") },
                        h(
                          React.Fragment,
                          { key: 872 },
                          "A request for sources selects Research, the route for checking claims.",
                        ),
                      ),
                      " ",
                    ),
                    " ",
                    h(
                      "div",
                      {
                        key: 875,
                        style: style(
                          [
                            "display:flex;flex-direction:column;gap:8px;padding:16px;border-radius:12px;background:var(--void-deep);border:1px solid ",
                            v.pvBorder ?? "",
                            "",
                          ].join(""),
                        ),
                      },
                      " ",
                      h(
                        "span",
                        {
                          key: 877,
                          style: style(
                            "font-family:var(--font-mono);font-size:10px;letter-spacing:.18em;color:var(--accent)",
                          ),
                        },
                        h(React.Fragment, { key: 878 }, "02 / PRIVATE DOCUMENT"),
                      ),
                      " ",
                      h(
                        "div",
                        {
                          key: 880,
                          style: style(
                            "display:flex;align-items:center;gap:10px;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);padding:10px 0",
                          ),
                        },
                        h(
                          "span",
                          {
                            key: 881,
                            style: style("padding:4px 8px;border:1px solid var(--glass-border);border-radius:6px"),
                          },
                          h(React.Fragment, { key: 882 }, "DOC"),
                        ),
                        h("span", {
                          key: 883,
                          style: style(
                            "flex:1;height:1px;background:repeating-linear-gradient(90deg,var(--accent) 0 6px,transparent 6px 12px)",
                          ),
                        }),
                        h(
                          "span",
                          {
                            key: 884,
                            style: style(
                              "padding:4px 8px;border:1px solid var(--accent);border-radius:6px;color:var(--accent)",
                            ),
                          },
                          h(
                            React.Fragment,
                            { key: 885 },
                            "",
                            h("span", { className: "sc-interp", key: 1 }, v.pvEnd),
                            "",
                          ),
                        ),
                      ),
                      " ",
                      h(
                        "span",
                        {
                          key: 887,
                          style: style(
                            "font-family:var(--font-display);font-weight:700;font-size:20px;color:var(--accent)",
                          ),
                        },
                        h(
                          React.Fragment,
                          { key: 888 },
                          "",
                          h("span", { className: "sc-interp", key: 1 }, v.pvAnswer),
                          "",
                        ),
                      ),
                      " ",
                      h(
                        "span",
                        { key: 890, style: style("color:var(--text-dim);font-size:14px;line-height:1.5") },
                        h(
                          React.Fragment,
                          { key: 891 },
                          "",
                          h("span", { className: "sc-interp", key: 1 }, v.pvBoundary),
                          "",
                        ),
                      ),
                      " ",
                    ),
                    " ",
                  ),
                  " ",
                  h(
                    "div",
                    { key: 895, style: style("display:flex;flex-direction:column;gap:12px") },
                    " ",
                    h(
                      "strong",
                      { key: 897, id: "pv-prompt", style: style("font-size:15px") },
                      h(React.Fragment, { key: 898 }, "Where should the private document go?"),
                    ),
                    " ",
                    h(
                      "div",
                      {
                        key: 900,
                        role: "group",
                        "aria-labelledby": "pv-prompt",
                        style: style("display:flex;gap:10px;flex-wrap:wrap;align-items:center"),
                      },
                      " ",
                      (function (parent) {
                        return (v.pvChoices || []).map((item, index) => {
                          const v = { ...parent, c: item, $index: index };
                          return h(
                            React.Fragment,
                            { key: index },
                            " ",
                            h(
                              "button",
                              { key: 904, type: "button", onClick: v.c.pick, style: style(v.c.style) },
                              h(
                                React.Fragment,
                                { key: 905 },
                                "",
                                h("span", { className: "sc-interp", key: 1 }, v.c.label),
                                "",
                              ),
                            ),
                            " ",
                          );
                        });
                      })(v),
                      " ",
                      h(
                        "button",
                        {
                          key: 908,
                          type: "button",
                          onClick: v.pvReveal,
                          style: style(
                            "background:none;border:none;cursor:pointer;color:var(--cyan);font-family:var(--font-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase",
                          ),
                        },
                        h(React.Fragment, { key: 909 }, "Show the answer"),
                      ),
                      " ",
                    ),
                    " ",
                    v.pvShown
                      ? h(
                          React.Fragment,
                          { key: 912 },
                          " ",
                          h(
                            "div",
                            {
                              key: 914,
                              role: "status",
                              style: style(
                                "display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border-radius:12px;border:1px solid rgba(255,149,0,.4);background:rgba(255,149,0,.06)",
                              ),
                            },
                            h("span", {
                              key: 915,
                              style: style(
                                "width:10px;height:10px;margin-top:5px;border-radius:50%;background:var(--accent);box-shadow:0 0 10px var(--accent-glow);flex:0 0 auto",
                              ),
                            }),
                            h(
                              "span",
                              { key: 916, style: style("font-size:15px;line-height:1.55") },
                              h(
                                React.Fragment,
                                { key: 917 },
                                "",
                                h("span", { className: "sc-interp", key: 1 }, v.pvText),
                                "",
                              ),
                            ),
                          ),
                          " ",
                        )
                      : null,
                    " ",
                  ),
                  " ",
                  h(
                    "div",
                    {
                      key: 921,
                      style: style(
                        "display:flex;gap:22px;flex-wrap:wrap;font-size:14px;font-weight:600;margin-top:auto",
                      ),
                    },
                    " ",
                    v.pvShown
                      ? h(
                          React.Fragment,
                          { key: 923 },
                          h(
                            "a",
                            { key: 924, href: "#universe" },
                            h(React.Fragment, { key: 925 }, "Follow this decision on the system map ↓"),
                          ),
                        )
                      : null,
                    " ",
                    h(
                      "a",
                      { key: 927, href: "#studies", onClick: v.loadPublic },
                      h(React.Fragment, { key: 928 }, "Take the controls: public request ↓"),
                    ),
                    " ",
                    h(
                      "a",
                      { key: 930, href: "#studies", onClick: v.loadPrivate },
                      h(React.Fragment, { key: 931 }, "Private version ↓"),
                    ),
                    " ",
                  ),
                  " ",
                ),
                " ",
              ),
              " ",
            ),
            " ",
            h(
              designSystem.Panel,
              { key: 937, color: "accent", title: "SMART ROUTING", icon: "▸" },
              " ",
              h(
                "div",
                { key: 939, style: style("display:flex;flex-direction:column;gap:18px") },
                " ",
                h(
                  "span",
                  {
                    key: 941,
                    style: style(
                      "font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent)",
                    ),
                  },
                  h(React.Fragment, { key: 942 }, "From my workshop / smart routing"),
                ),
                " ",
                h(
                  "h3",
                  {
                    key: 944,
                    style: style(
                      "font-family:var(--font-display);font-weight:700;font-size:clamp(18px,2.2vw,24px);line-height:1.2;margin:0",
                    ),
                  },
                  h(React.Fragment, { key: 945 }, "Spend the AI budget where it matters."),
                ),
                " ",
                h(
                  "figure",
                  {
                    key: 947,
                    style: style(
                      "margin:0;padding:26px 22px;border-radius:12px;background:var(--void-deep);border:1px solid var(--glass-border);display:flex;flex-direction:column;gap:10px;position:relative;overflow:hidden",
                    ),
                  },
                  " ",
                  h("span", {
                    key: 949,
                    "aria-hidden": "true",
                    style: style(
                      "position:absolute;top:0;left:0;width:40%;height:3px;background:linear-gradient(90deg,transparent,var(--accent),transparent);animation:v40-sweep 4s linear infinite",
                    ),
                  }),
                  " ",
                  h(
                    "blockquote",
                    { key: 951, style: style("margin:0;display:flex;flex-direction:column;gap:6px") },
                    " ",
                    h(
                      "p",
                      {
                        key: 953,
                        style: style(
                          "font-family:var(--font-display);font-weight:900;font-size:clamp(24px,3vw,36px);line-height:1.1;margin:0;color:var(--text)",
                        ),
                      },
                      h(React.Fragment, { key: 954 }, "Quality picks the model."),
                    ),
                    " ",
                    h(
                      "p",
                      {
                        key: 956,
                        style: style(
                          "font-family:var(--font-display);font-weight:700;font-size:clamp(16px,2vw,22px);line-height:1.2;margin:0;color:var(--accent)",
                        ),
                      },
                      h(React.Fragment, { key: 957 }, "Cost only breaks a tie."),
                    ),
                    " ",
                  ),
                  " ",
                  h(
                    "figcaption",
                    {
                      key: 960,
                      style: style(
                        "font-family:var(--font-mono);font-size:11px;letter-spacing:.12em;color:var(--text-dim)",
                      ),
                    },
                    h(React.Fragment, { key: 961 }, "My routing law · published in the dated export"),
                  ),
                  " ",
                ),
                " ",
                h(
                  "p",
                  {
                    key: 964,
                    style: style("color:var(--text-dim);font-size:16px;line-height:1.6;margin:0;text-wrap:pretty"),
                  },
                  h(
                    React.Fragment,
                    { key: 965 },
                    "Try the rule: change the task, require sources, then make the input private. Watch which constraint wins.",
                  ),
                ),
                " ",
                h(
                  "div",
                  { key: 967, style: style("display:flex;gap:12px;flex-wrap:wrap;margin-top:auto") },
                  " ",
                  h(
                    designSystem.Button,
                    { key: 969, as: "a", href: "#studies", size: "sm" },
                    h(React.Fragment, { key: 970 }, "Try the routing demo"),
                  ),
                  " ",
                  h(
                    designSystem.Button,
                    { key: 972, as: "a", href: "#evidence", variant: "secondary", size: "sm" },
                    h(React.Fragment, { key: 973 }, "Read the evidence boundary"),
                  ),
                  " ",
                ),
                " ",
              ),
              " ",
            ),
            " ",
          ),
          " ",
        ),
        " ",
        " ",
        h(
          "section",
          {
            key: 981,
            id: "studies",
            "data-screen-label": "Seven experiments",
            style: style(
              "position:relative;max-width:1240px;margin:0 auto;padding:72px 28px;display:flex;flex-direction:column;gap:36px",
            ),
          },
          " ",
          h(
            "div",
            {
              key: 983,
              "data-reveal": "",
              style: style("display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:20px"),
            },
            " ",
            h(
              "div",
              { key: 985, style: style("display:flex;flex-direction:column;gap:14px") },
              " ",
              h(
                "span",
                {
                  key: 987,
                  style: style(
                    "font-family:var(--font-mono);font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--accent)",
                  ),
                },
                h(
                  "span",
                  { key: 988, style: style("color:var(--text-dim);margin-right:14px") },
                  h(React.Fragment, { key: 989 }, "07"),
                ),
                h(
                  "span",
                  { key: 990, "data-scramble": "" },
                  h(React.Fragment, { key: 991 }, "Go deeper / Seven experiments"),
                ),
              ),
              " ",
              h(
                "h2",
                {
                  key: 993,
                  style: style(
                    "font-family:var(--font-display);font-weight:900;font-size:clamp(30px,4.6vw,54px);line-height:1.05;letter-spacing:.02em;margin:0",
                  ),
                },
                h(React.Fragment, { key: 994 }, "Seven questions."),
                h("br", { key: 995 }),
                h(React.Fragment, { key: 996 }, "Take the controls."),
              ),
              " ",
            ),
            " ",
            h(
              "div",
              { key: 999, style: style("display:flex;flex-direction:column;gap:6px;max-width:40ch") },
              " ",
              h(
                "span",
                {
                  key: 1001,
                  style: style(
                    "font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim)",
                  ),
                },
                h(React.Fragment, { key: 1002 }, "Simulations · In your browser"),
              ),
              " ",
              h(
                "p",
                { key: 1004, style: style("color:var(--text);font-size:16px;margin:0") },
                h(React.Fragment, { key: 1005 }, "Choose a question. Change the inputs. See the rule at work."),
              ),
              " ",
            ),
            " ",
          ),
          " ",
          h(
            "div",
            {
              key: 1009,
              style: style("display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:22px;align-items:start"),
            },
            " ",
            h(
              "div",
              {
                key: 1011,
                role: "tablist",
                "aria-label": "Experiments",
                "aria-orientation": "vertical",
                style: style(["display:flex;flex-direction:column;gap:8px;grid-column:", v.tabsCol ?? "", ""].join("")),
              },
              " ",
              (function (parent) {
                return (v.experiments || []).map((item, index) => {
                  const v = { ...parent, e: item, $index: index };
                  return h(
                    React.Fragment,
                    { key: index },
                    " ",
                    h(
                      "button",
                      {
                        key: 1015,
                        role: "tab",
                        id: v.e.id,
                        "aria-selected": v.e.selected,
                        "aria-controls": "experiment-panel",
                        tabIndex: v.e.tabindex,
                        type: "button",
                        onClick: v.e.pick,
                        style: style(v.e.style),
                      },
                      " ",
                      h(
                        "span",
                        {
                          key: 1017,
                          style: style(
                            [
                              "font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;color:",
                              v.e.numColor ?? "",
                              ";width:28px;flex:0 0 auto",
                            ].join(""),
                          ),
                        },
                        h(
                          React.Fragment,
                          { key: 1018 },
                          "",
                          h("span", { className: "sc-interp", key: 1 }, v.e.num),
                          "",
                        ),
                      ),
                      " ",
                      h(
                        "span",
                        {
                          key: 1020,
                          style: style("display:flex;flex-direction:column;gap:2px;text-align:left;min-width:0"),
                        },
                        " ",
                        h(
                          "span",
                          {
                            key: 1022,
                            style: style(
                              "font-family:var(--font-display);font-weight:700;font-size:13px;letter-spacing:.04em",
                            ),
                          },
                          h(
                            React.Fragment,
                            { key: 1023 },
                            "",
                            h("span", { className: "sc-interp", key: 1 }, v.e.name),
                            "",
                          ),
                        ),
                        " ",
                        h(
                          "span",
                          {
                            key: 1025,
                            style: style(
                              "font-family:var(--font-mono);font-size:10px;letter-spacing:.1em;color:var(--text-dim)",
                            ),
                          },
                          h(
                            React.Fragment,
                            { key: 1026 },
                            "",
                            h("span", { className: "sc-interp", key: 1 }, v.e.code),
                            "",
                          ),
                        ),
                        " ",
                      ),
                      " ",
                      h(
                        "span",
                        {
                          key: 1029,
                          style: style(
                            [
                              "margin-left:auto;font-family:var(--font-mono);font-size:11px;color:",
                              v.e.numColor ?? "",
                              "",
                            ].join(""),
                          ),
                        },
                        h(React.Fragment, { key: 1030 }, "▸"),
                      ),
                      " ",
                    ),
                    " ",
                  );
                });
              })(v),
              " ",
            ),
            " ",
            h(
              "div",
              {
                key: 1035,
                role: "tabpanel",
                id: "experiment-panel",
                "aria-labelledby": v.selectedExperiment,
                tabIndex: "0",
                style: style(["grid-column:", v.panelCol ?? "", ";min-width:0"].join("")),
              },
              " ",
              h(
                designSystem.Panel,
                { key: 1037, color: v.expColor, title: v.expTitle, icon: "▸" },
                " ",
                h(
                  "div",
                  { key: 1039, style: style("display:flex;flex-direction:column;gap:18px") },
                  " ",
                  h(
                    "span",
                    {
                      key: 1041,
                      style: style(
                        "font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim)",
                      ),
                    },
                    h(
                      React.Fragment,
                      { key: 1042 },
                      "Experiment ",
                      h("span", { className: "sc-interp", key: 1 }, v.expNum),
                      " of 07 · ",
                      h("span", { className: "sc-interp", key: 3 }, v.expCode),
                      "",
                    ),
                  ),
                  " ",
                  h(
                    "h3",
                    {
                      key: 1044,
                      style: style(
                        "font-family:var(--font-display);font-weight:800;font-size:clamp(22px,3vw,34px);line-height:1.1;margin:0",
                      ),
                    },
                    h(React.Fragment, { key: 1045 }, "", h("span", { className: "sc-interp", key: 1 }, v.expName), ""),
                  ),
                  " ",
                  v.isHermes
                    ? h(
                        React.Fragment,
                        { key: 1047 },
                        " ",
                        h(
                          "p",
                          { key: 1049, style: style("color:var(--text-dim);font-size:15px;margin:0") },
                          h(React.Fragment, { key: 1050 }, "Choose the work. Add a boundary. See the route."),
                        ),
                        " ",
                        h(
                          "div",
                          {
                            key: 1052,
                            style: style(
                              "display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:22px",
                            ),
                          },
                          " ",
                          h(
                            "div",
                            { key: 1054, style: style("display:flex;flex-direction:column;gap:14px") },
                            " ",
                            h(
                              "strong",
                              { key: 1056, style: style("font-size:14px") },
                              h(React.Fragment, { key: 1057 }, "Choose the work"),
                            ),
                            " ",
                            h(
                              "div",
                              { key: 1059, style: style("display:flex;gap:8px;flex-wrap:wrap") },
                              " ",
                              (function (parent) {
                                return (v.intents || []).map((item, index) => {
                                  const v = { ...parent, it: item, $index: index };
                                  return h(
                                    React.Fragment,
                                    { key: index },
                                    h(
                                      "button",
                                      { key: 1062, type: "button", onClick: v.it.pick, style: style(v.it.style) },
                                      h(
                                        React.Fragment,
                                        { key: 1063 },
                                        "",
                                        h("span", { className: "sc-interp", key: 1 }, v.it.label),
                                        "",
                                      ),
                                    ),
                                  );
                                });
                              })(v),
                              " ",
                            ),
                            " ",
                            h(
                              "button",
                              {
                                key: 1066,
                                type: "button",
                                "aria-pressed": v.privatePressed,
                                onClick: v.togglePrivate,
                                style: style(v.privStyle),
                              },
                              h(
                                "span",
                                { key: 1067 },
                                h(React.Fragment, { key: 1068 }, "Contains private information"),
                              ),
                              h(
                                "span",
                                { key: 1069, style: style(v.privKnob) },
                                h("span", { key: 1070, style: style(v.privDot) }),
                              ),
                            ),
                            " ",
                            h(
                              "button",
                              {
                                key: 1072,
                                type: "button",
                                "aria-pressed": v.sourcesPressed,
                                onClick: v.toggleSources,
                                style: style(v.srcStyle),
                              },
                              h(
                                "span",
                                { key: 1073 },
                                h(React.Fragment, { key: 1074 }, "Requires attributable sources"),
                              ),
                              h(
                                "span",
                                { key: 1075, style: style(v.srcKnob) },
                                h("span", { key: 1076, style: style(v.srcDot) }),
                              ),
                            ),
                            " ",
                            h(
                              designSystem.Button,
                              { key: 1078, onClick: v.route },
                              h(React.Fragment, { key: 1079 }, "Route this request"),
                            ),
                            " ",
                          ),
                          " ",
                          h(
                            "div",
                            {
                              key: 1082,
                              style: style(
                                "display:flex;flex-direction:column;gap:10px;min-width:0;padding:18px;border-radius:12px;background:var(--void-deep);border:1px solid var(--glass-border)",
                              ),
                            },
                            " ",
                            h(
                              "div",
                              {
                                key: 1084,
                                style: style(
                                  "display:flex;justify-content:space-between;gap:10px;font-family:var(--font-mono);font-size:10px;letter-spacing:.16em",
                                ),
                              },
                              h(
                                "span",
                                { key: 1085, style: style("color:var(--text-dim)") },
                                h(React.Fragment, { key: 1086 }, "WHERE IT GOES"),
                              ),
                              h(
                                "span",
                                { key: 1087, style: style(["color:", v.laneColor ?? "", ""].join("")) },
                                h(
                                  React.Fragment,
                                  { key: 1088 },
                                  "",
                                  h("span", { className: "sc-interp", key: 1 }, v.laneCode),
                                  "",
                                ),
                              ),
                            ),
                            " ",
                            h(
                              "div",
                              { key: 1090, style: style("display:flex;align-items:baseline;gap:12px;flex-wrap:wrap") },
                              " ",
                              h(
                                "h4",
                                {
                                  key: 1092,
                                  style: style(
                                    [
                                      "margin:0;font-family:var(--font-display);font-weight:800;font-size:clamp(20px,2.4vw,28px);color:",
                                      v.laneColor ?? "",
                                      ";text-shadow:0 0 20px ",
                                      v.laneColor ?? "",
                                      "",
                                    ].join(""),
                                  ),
                                },
                                h(
                                  React.Fragment,
                                  { key: 1093 },
                                  "",
                                  h("span", { className: "sc-interp", key: 1 }, v.laneName),
                                  "",
                                ),
                              ),
                              " ",
                              h(
                                "span",
                                {
                                  key: 1095,
                                  style: style(
                                    "font-family:var(--font-mono);font-size:10px;letter-spacing:.14em;color:var(--text-dim)",
                                  ),
                                },
                                h(
                                  React.Fragment,
                                  { key: 1096 },
                                  "",
                                  h("span", { className: "sc-interp", key: 1 }, v.laneLabel),
                                  "",
                                ),
                              ),
                              " ",
                            ),
                            " ",
                            h(
                              "ol",
                              {
                                key: 1099,
                                style: style(
                                  "list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px",
                                ),
                              },
                              " ",
                              (function (parent) {
                                return (v.routeSteps || []).map((item, index) => {
                                  const v = { ...parent, s: item, $index: index };
                                  return h(
                                    React.Fragment,
                                    { key: index },
                                    " ",
                                    h(
                                      "li",
                                      { key: 1103, style: style(v.s.style) },
                                      h(
                                        "span",
                                        {
                                          key: 1104,
                                          style: style(
                                            [
                                              "font-family:var(--font-mono);font-size:10px;letter-spacing:.12em;color:",
                                              v.s.color ?? "",
                                              ";width:22px;flex:0 0 auto",
                                            ].join(""),
                                          ),
                                        },
                                        h(
                                          React.Fragment,
                                          { key: 1105 },
                                          "",
                                          h("span", { className: "sc-interp", key: 1 }, v.s.n),
                                          "",
                                        ),
                                      ),
                                      h(
                                        "span",
                                        { key: 1106, style: style("font-size:13px;color:var(--text)") },
                                        h(
                                          React.Fragment,
                                          { key: 1107 },
                                          "",
                                          h("span", { className: "sc-interp", key: 1 }, v.s.text),
                                          "",
                                        ),
                                      ),
                                    ),
                                    " ",
                                  );
                                });
                              })(v),
                              " ",
                            ),
                            " ",
                            h(
                              "p",
                              {
                                key: 1111,
                                style: style("color:var(--text-dim);font-size:13px;line-height:1.55;margin:0"),
                              },
                              h(
                                React.Fragment,
                                { key: 1112 },
                                "",
                                h("span", { className: "sc-interp", key: 1 }, v.routeDetail),
                                "",
                              ),
                            ),
                            " ",
                          ),
                          " ",
                        ),
                        " ",
                        h(
                          "div",
                          {
                            key: 1116,
                            style: style(
                              "display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:20px;padding-top:16px;border-top:1px solid var(--glass-border)",
                            ),
                          },
                          " ",
                          h(
                            "div",
                            { key: 1118, style: style("display:flex;flex-direction:column;gap:8px") },
                            " ",
                            h(
                              "span",
                              {
                                key: 1120,
                                style: style(
                                  "font-family:var(--font-mono);font-size:10px;letter-spacing:.16em;color:var(--text-dim)",
                                ),
                              },
                              h(React.Fragment, { key: 1121 }, "WHY IT MATTERS"),
                            ),
                            " ",
                            h(
                              "span",
                              { key: 1123, style: style("color:var(--text-dim);font-size:14px;line-height:1.6") },
                              h(
                                React.Fragment,
                                { key: 1124 },
                                "Everyday work goes to a general model. Asking for sources sends it to a research model. Private information always brings in a person. That one rule keeps AI costs down without cutting corners.",
                              ),
                            ),
                            " ",
                            h(
                              "a",
                              {
                                key: 1126,
                                href: "https://github.com/jamescashio/jamescashio.github.io/blob/82425d30fb0e6d2c7891281ded0423b854d6f23d/src/odyssey/data.ts",
                                style: style("font-size:13px;font-weight:600"),
                              },
                              h(React.Fragment, { key: 1127 }, "Inspect the routing rule in the released code ↗"),
                            ),
                            " ",
                            h(
                              "div",
                              { key: 1129, style: style("display:flex;gap:8px;flex-wrap:wrap") },
                              " ",
                              h(
                                designSystem.Button,
                                { key: 1131, as: "a", href: "#universe", variant: "ghost", size: "sm" },
                                h(React.Fragment, { key: 1132 }, "Trace this decision ↓"),
                              ),
                              " ",
                              h(
                                designSystem.Button,
                                { key: 1134, onClick: v.copySettings, variant: "secondary", size: "sm" },
                                h(
                                  React.Fragment,
                                  { key: 1135 },
                                  "",
                                  h("span", { className: "sc-interp", key: 1 }, v.copyLabel),
                                  "",
                                ),
                              ),
                              " ",
                            ),
                            " ",
                          ),
                          " ",
                          h(
                            "div",
                            {
                              key: 1139,
                              style: style(
                                "display:flex;flex-direction:column;gap:10px;padding:16px;border-radius:12px;background:var(--surface-2);border:1px solid var(--glass-border)",
                              ),
                            },
                            " ",
                            h(
                              "details",
                              { key: 1141 },
                              " ",
                              h(
                                "summary",
                                {
                                  key: 1143,
                                  style: style(
                                    "font-family:var(--font-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--cyan)",
                                  ),
                                },
                                h(React.Fragment, { key: 1144 }, "Rule, limits and a test to try ▾"),
                              ),
                              " ",
                              h(
                                "div",
                                {
                                  key: 1146,
                                  style: style(
                                    "display:flex;flex-direction:column;gap:10px;margin-top:12px;font-size:14px;line-height:1.55",
                                  ),
                                },
                                " ",
                                h(
                                  "p",
                                  { key: 1148, style: style("margin:0;color:var(--text-dim)") },
                                  h(React.Fragment, { key: 1149 }, "Change the inputs. See the rule choose a route."),
                                ),
                                " ",
                                h(
                                  "p",
                                  { key: 1151, style: style("margin:0") },
                                  h(
                                    "strong",
                                    { key: 1152 },
                                    h(
                                      React.Fragment,
                                      { key: 1153 },
                                      "Intent and sources choose the route. Privacy can overrule both.",
                                    ),
                                  ),
                                ),
                                " ",
                                h(
                                  "span",
                                  { key: 1155, style: style("color:var(--text-dim);font-style:italic") },
                                  h(
                                    React.Fragment,
                                    { key: 1156 },
                                    "What wins when intent, evidence requirements, and privacy disagree?",
                                  ),
                                ),
                                " ",
                                h(
                                  "div",
                                  {
                                    key: 1158,
                                    style: style(
                                      "display:grid;grid-template-columns:auto 1fr;gap:8px 14px;align-items:baseline",
                                    ),
                                  },
                                  " ",
                                  h(
                                    "span",
                                    {
                                      key: 1160,
                                      style: style(
                                        "font-family:var(--font-mono);font-size:10px;letter-spacing:.14em;color:var(--cyan)",
                                      ),
                                    },
                                    h(React.Fragment, { key: 1161 }, "RULE"),
                                  ),
                                  h(
                                    "span",
                                    { key: 1162, style: style("color:var(--text-dim)") },
                                    h(
                                      React.Fragment,
                                      { key: 1163 },
                                      "Private input always holds the external route for human review. Otherwise, Research intent or a source requirement selects Research. Analyze selects Synthesis; Draft selects Workhorse.",
                                    ),
                                  ),
                                  " ",
                                  h(
                                    "span",
                                    {
                                      key: 1165,
                                      style: style(
                                        "font-family:var(--font-mono);font-size:10px;letter-spacing:.14em;color:var(--cyan)",
                                      ),
                                    },
                                    h(React.Fragment, { key: 1166 }, "TRY THIS"),
                                  ),
                                  h(
                                    "span",
                                    { key: 1167, style: style("color:var(--text-dim)") },
                                    h(
                                      React.Fragment,
                                      { key: 1168 },
                                      "Choose Analyze and require sources: Research wins. Now turn on private information: Human review wins. Change the intent again; the privacy boundary holds.",
                                    ),
                                  ),
                                  " ",
                                  h(
                                    "span",
                                    {
                                      key: 1170,
                                      style: style(
                                        "font-family:var(--font-mono);font-size:10px;letter-spacing:.14em;color:var(--cyan)",
                                      ),
                                    },
                                    h(React.Fragment, { key: 1171 }, "BOUNDARY"),
                                  ),
                                  h(
                                    "span",
                                    { key: 1172, style: style("color:var(--text-dim)") },
                                    h(
                                      React.Fragment,
                                      { key: 1173 },
                                      "A deterministic routing model with four outcomes. It calls no model, measures no provider, and does not establish the current HERMES deployment’s behavior.",
                                    ),
                                  ),
                                  " ",
                                ),
                                " ",
                              ),
                              " ",
                            ),
                            " ",
                            h(
                              "div",
                              {
                                key: 1178,
                                style: style(
                                  "display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;padding-top:8px;border-top:1px solid var(--glass-border)",
                                ),
                              },
                              " ",
                              h(
                                "span",
                                {
                                  key: 1180,
                                  style: style(
                                    "font-family:var(--font-mono);font-size:10px;letter-spacing:.14em;color:var(--accent)",
                                  ),
                                },
                                h(React.Fragment, { key: 1181 }, "NEXT / Know when to pause"),
                              ),
                              " ",
                              h(
                                "button",
                                {
                                  key: 1183,
                                  type: "button",
                                  onClick: v.nextExp,
                                  style: style(
                                    "background:none;border:none;cursor:pointer;color:var(--text);font-size:13px;font-weight:600;text-align:left",
                                  ),
                                },
                                h(React.Fragment, { key: 1184 }, "When should automation stop and ask a person? →"),
                              ),
                              " ",
                            ),
                            " ",
                          ),
                          " ",
                        ),
                        " ",
                      )
                    : null,
                  " ",
                  v.notHermes
                    ? h(
                        React.Fragment,
                        { key: 1190 },
                        " ",
                        h(
                          "p",
                          {
                            key: 1192,
                            style: style(
                              "color:var(--text-dim);font-size:16px;line-height:1.6;margin:0;max-width:60ch;text-wrap:pretty",
                            ),
                          },
                          h(
                            React.Fragment,
                            { key: 1193 },
                            "",
                            h("span", { className: "sc-interp", key: 1 }, v.expLede),
                            "",
                          ),
                        ),
                        " ",
                        h("div", { key: 1195, id: "local-experiment", "data-lab": v.expId }),
                        " ",
                        h(
                          "div",
                          {
                            key: 1197,
                            style: style(
                              "display:flex;flex-direction:column;gap:12px;padding:22px;border-radius:12px;background:var(--void-deep);border:1px solid var(--glass-border)",
                            ),
                          },
                          " ",
                          h(
                            "span",
                            {
                              key: 1199,
                              style: style(
                                "font-family:var(--font-mono);font-size:10px;letter-spacing:.16em;color:var(--text-dim)",
                              ),
                            },
                            h(React.Fragment, { key: 1200 }, "EXPLORE THE ORIGINAL EDITION"),
                          ),
                          " ",
                          h(
                            "span",
                            {
                              key: 1202,
                              style: style(
                                "font-family:var(--font-display);font-weight:700;font-size:15px;letter-spacing:.03em",
                              ),
                            },
                            h(
                              React.Fragment,
                              { key: 1203 },
                              "Continue exploring the original experience on cashio.us.",
                            ),
                          ),
                          " ",
                          h(
                            "div",
                            { key: 1205, style: style("display:flex;gap:10px;flex-wrap:wrap") },
                            " ",
                            h(
                              designSystem.Button,
                              { key: 1207, as: "a", href: v.expHref, size: "sm" },
                              h(React.Fragment, { key: 1208 }, "Open original experiment ↗"),
                            ),
                            " ",
                            h(
                              designSystem.Button,
                              { key: 1210, onClick: v.nextExp, variant: "ghost", size: "sm" },
                              h(React.Fragment, { key: 1211 }, "Next experiment ▸"),
                            ),
                            " ",
                          ),
                          " ",
                        ),
                        " ",
                      )
                    : null,
                  " ",
                ),
                " ",
              ),
              " ",
            ),
            " ",
          ),
          " ",
        ),
        " ",
        " ",
        h(
          "section",
          {
            key: 1222,
            id: "universe",
            "data-screen-label": "System map",
            style: style(
              "position:relative;max-width:1240px;margin:0 auto;padding:72px 28px;display:flex;flex-direction:column;gap:36px",
            ),
          },
          " ",
          h(
            "div",
            {
              key: 1224,
              "data-reveal": "",
              style: style(
                "display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:24px;align-items:end",
              ),
            },
            " ",
            h(
              "div",
              { key: 1226, style: style("display:flex;flex-direction:column;gap:14px") },
              " ",
              h(
                "span",
                {
                  key: 1228,
                  style: style(
                    "font-family:var(--font-mono);font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--accent)",
                  ),
                },
                h(
                  "span",
                  { key: 1229, style: style("color:var(--text-dim);margin-right:14px") },
                  h(React.Fragment, { key: 1230 }, "08"),
                ),
                h("span", { key: 1231, "data-scramble": "" }, h(React.Fragment, { key: 1232 }, "The system map")),
              ),
              " ",
              h(
                "h2",
                {
                  key: 1234,
                  style: style(
                    "font-family:var(--font-display);font-weight:900;font-size:clamp(30px,4.6vw,54px);line-height:1.05;letter-spacing:.02em;margin:0",
                  ),
                },
                h(React.Fragment, { key: 1235 }, "Meet the machines."),
              ),
              " ",
            ),
            " ",
            h(
              "div",
              { key: 1238, style: style("display:flex;flex-direction:column;gap:12px") },
              " ",
              h(
                "p",
                {
                  key: 1240,
                  style: style("color:var(--text);font-size:17px;line-height:1.6;margin:0;text-wrap:pretty"),
                },
                h(
                  React.Fragment,
                  { key: 1241 },
                  "Two servers I own, Zeus and Apollo, do the computing. Hermes, my job scheduler, decides where each task goes, and my operator console (DSH) is where I watch and approve. Follow one request across them.",
                ),
              ),
              " ",
              v.tech
                ? h(
                    React.Fragment,
                    { key: 1243 },
                    " ",
                    h(
                      "p",
                      {
                        key: 1245,
                        style: style(
                          "font-size:14px;line-height:1.6;color:var(--text-dim);margin:0;padding:12px 14px;border:1px solid var(--glass-border);border-radius:12px;background:var(--glass)",
                        ),
                      },
                      h(
                        "span",
                        {
                          key: 1246,
                          style: style(
                            "font-family:var(--font-mono);font-size:10px;letter-spacing:.14em;color:var(--cyan);margin-right:10px",
                          ),
                        },
                        h(React.Fragment, { key: 1247 }, "FOR ENGINEERS"),
                      ),
                      h(
                        React.Fragment,
                        { key: 1248 },
                        "2 hosts, 20 containers and 1 virtual machine at the October 3, 2026 observation, with 49 of 56 scheduled jobs enabled. The routing shown here is a deterministic model of the policy, not a live trace of production traffic.",
                      ),
                    ),
                    " ",
                  )
                : null,
              " ",
            ),
            " ",
          ),
          " ",
          h(
            "div",
            {
              key: 1253,
              style: style(
                "display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:22px;align-items:start",
              ),
            },
            " ",
            h(
              "div",
              { key: 1255, style: style("display:flex;flex-direction:column;gap:18px") },
              " ",
              h(
                designSystem.Panel,
                { key: 1257, color: v.nodeColor, title: v.nodeTitle, icon: "▸", tag: v.selectedTag },
                " ",
                h(
                  "div",
                  { key: 1259, style: style("display:flex;flex-direction:column;gap:10px") },
                  " ",
                  h(
                    "span",
                    {
                      key: 1261,
                      style: style(
                        "font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim)",
                      ),
                    },
                    h(React.Fragment, { key: 1262 }, "", h("span", { className: "sc-interp", key: 1 }, v.nodeRole), ""),
                  ),
                  " ",
                  h(
                    "div",
                    { key: 1264, style: style("display:flex;align-items:baseline;gap:14px;flex-wrap:wrap") },
                    " ",
                    h(
                      "span",
                      {
                        key: 1266,
                        style: style(
                          "font-family:var(--font-display);font-weight:900;font-size:clamp(28px,3vw,40px);line-height:1;color:var(--accent);text-shadow:0 0 22px var(--accent-glow)",
                        ),
                      },
                      h(
                        React.Fragment,
                        { key: 1267 },
                        "",
                        h("span", { className: "sc-interp", key: 1 }, v.nodeValue),
                        "",
                      ),
                    ),
                    " ",
                    h(
                      "span",
                      {
                        key: 1269,
                        style: style(
                          "font-family:var(--font-mono);font-size:11px;letter-spacing:.12em;color:var(--text-dim)",
                        ),
                      },
                      h(
                        React.Fragment,
                        { key: 1270 },
                        "",
                        h("span", { className: "sc-interp", key: 1 }, v.nodeUnit),
                        "",
                      ),
                    ),
                    " ",
                  ),
                  " ",
                  h(
                    "strong",
                    { key: 1273, style: style("font-size:15px") },
                    h(
                      React.Fragment,
                      { key: 1274 },
                      "",
                      h("span", { className: "sc-interp", key: 1 }, v.nodeSummary),
                      "",
                    ),
                  ),
                  " ",
                  h(
                    "p",
                    { key: 1276, style: style("color:var(--text-dim);font-size:14px;line-height:1.6;margin:0") },
                    h(React.Fragment, { key: 1277 }, "", h("span", { className: "sc-interp", key: 1 }, v.nodeBody), ""),
                  ),
                  " ",
                  h(
                    "span",
                    {
                      key: 1279,
                      style: style(
                        "font-family:var(--font-mono);font-size:11px;letter-spacing:.1em;color:var(--accent)",
                      ),
                    },
                    h(
                      React.Fragment,
                      { key: 1280 },
                      "",
                      h("span", { className: "sc-interp", key: 1 }, v.nodeEvidence),
                      "",
                    ),
                  ),
                  " ",
                ),
                " ",
              ),
              " ",
              h(
                "div",
                { key: 1284, style: style("display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px") },
                " ",
                h(designSystem.StatCell, { key: 1286, value: "2", label: "hosts" }),
                " ",
                h(designSystem.StatCell, { key: 1288, value: "20", label: "containers" }),
                " ",
                h(designSystem.StatCell, { key: 1290, value: "1", label: "virtual machine" }),
                " ",
              ),
              " ",
              h(
                "div",
                { key: 1293, style: style("display:flex;gap:20px;align-items:center;flex-wrap:wrap;font-size:14px") },
                h(
                  "span",
                  {
                    key: 1294,
                    style: style(
                      "font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim)",
                    ),
                  },
                  h(React.Fragment, { key: 1295 }, "Fleet · October 3, 2026"),
                ),
                h(
                  "a",
                  { key: 1296, href: "#evidence", style: style("font-weight:600") },
                  h(React.Fragment, { key: 1297 }, "Inspect the dated evidence ↓"),
                ),
              ),
              " ",
              h(
                designSystem.Terminal,
                { key: 1299, title: "hermes://trace", hint: "NO REQUEST SENT", bodyHeight: v.traceLogHeight },
                " ",
                h(
                  "div",
                  {
                    key: 1301,
                    id: "trace-out",
                    role: "log",
                    "aria-label": "Request trace",
                    "aria-live": "polite",
                    style: style("display:flex;flex-direction:column;gap:5px;font-size:12px"),
                  },
                  " ",
                  (function (parent) {
                    return (v.traceLog || []).map((item, index) => {
                      const v = { ...parent, l: item, $index: index };
                      return h(
                        React.Fragment,
                        { key: index },
                        h(
                          "div",
                          { key: 1304, style: style(v.l.style) },
                          h(
                            "span",
                            { key: 1305, style: style("color:var(--text-dim)") },
                            h(
                              React.Fragment,
                              { key: 1306 },
                              "",
                              h("span", { className: "sc-interp", key: 1 }, v.l.ts),
                              "",
                            ),
                          ),
                          " ",
                          h(
                            "span",
                            { key: 1308, style: style(["color:", v.l.color ?? "", ""].join("")) },
                            h(
                              React.Fragment,
                              { key: 1309 },
                              "",
                              h("span", { className: "sc-interp", key: 1 }, v.l.tag),
                              "",
                            ),
                          ),
                          h(
                            React.Fragment,
                            { key: 1310 },
                            " ",
                            h("span", { className: "sc-interp", key: 1 }, v.l.text),
                            "",
                          ),
                        ),
                      );
                    });
                  })(v),
                  " ",
                ),
                " ",
              ),
              " ",
            ),
            " ",
            h(
              "div",
              { key: 1315, style: style("display:flex;flex-direction:column;gap:14px;min-width:0") },
              " ",
              h(
                "div",
                {
                  key: 1317,
                  style: style("display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"),
                },
                " ",
                h(
                  "span",
                  {
                    key: 1319,
                    style: style(
                      "display:inline-flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim)",
                    ),
                  },
                  h("span", {
                    key: 1320,
                    style: style(
                      "width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green-glow);animation:za-pulse 2s ease-in-out infinite",
                    ),
                  }),
                  h(React.Fragment, { key: 1321 }, "System map · Conceptual view"),
                ),
                " ",
                h(
                  designSystem.Button,
                  { key: 1323, onClick: v.trace, variant: "engage", size: "sm" },
                  h(React.Fragment, { key: 1324 }, "", h("span", { className: "sc-interp", key: 1 }, v.traceLabel), ""),
                ),
                " ",
              ),
              " ",
              h(
                "div",
                {
                  key: 1327,
                  style: style(
                    "border-radius:20px;background:var(--surface);border:1px solid var(--glass-border);box-shadow:var(--shadow-panel);overflow:hidden",
                  ),
                },
                " ",
                h(
                  "div",
                  {
                    key: 1329,
                    style: style(
                      "display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--glass-border)",
                    ),
                  },
                  " ",
                  h(
                    "div",
                    { key: 1331, style: style("display:flex;flex-direction:column;gap:2px") },
                    h(
                      "span",
                      {
                        key: 1332,
                        style: style(
                          "font-family:var(--font-mono);font-size:10px;letter-spacing:.16em;color:var(--cyan)",
                        ),
                      },
                      h(React.Fragment, { key: 1333 }, "YOUR SAMPLE REQUEST"),
                    ),
                    h(
                      "span",
                      { key: 1334, style: style("font-size:14px") },
                      h(
                        React.Fragment,
                        { key: 1335 },
                        "",
                        h("span", { className: "sc-interp", key: 1 }, v.requestSource),
                        "",
                      ),
                    ),
                  ),
                  " ",
                  h(
                    "div",
                    { key: 1337, role: "group", "aria-label": "Request privacy", style: style("display:flex;gap:6px") },
                    " ",
                    (function (parent) {
                      return (v.traceChoices || []).map((item, index) => {
                        const v = { ...parent, t: item, $index: index };
                        return h(
                          React.Fragment,
                          { key: index },
                          h(
                            "button",
                            { key: 1340, type: "button", onClick: v.t.pick, style: style(v.t.style) },
                            h(
                              React.Fragment,
                              { key: 1341 },
                              "",
                              h("span", { className: "sc-interp", key: 1 }, v.t.label),
                              "",
                            ),
                          ),
                        );
                      });
                    })(v),
                    " ",
                  ),
                  " ",
                  h(
                    "div",
                    { key: 1344, style: style("display:flex;flex-direction:column;gap:2px;text-align:right") },
                    h(
                      "span",
                      {
                        key: 1345,
                        style: style(
                          "font-family:var(--font-mono);font-size:10px;letter-spacing:.16em;color:var(--text-dim)",
                        ),
                      },
                      h(React.Fragment, { key: 1346 }, "ROUTE CHOSEN"),
                    ),
                    h(
                      "strong",
                      {
                        key: 1347,
                        style: style(
                          ["font-family:var(--font-display);font-size:15px;color:", v.traceOutcomeColor ?? "", ""].join(
                            "",
                          ),
                        ),
                      },
                      h(
                        React.Fragment,
                        { key: 1348 },
                        "",
                        h("span", { className: "sc-interp", key: 1 }, v.traceOutcome),
                        "",
                      ),
                    ),
                  ),
                  " ",
                ),
                " ",
                h(
                  "div",
                  {
                    key: 1351,
                    style: style(
                      "padding:10px 20px;font-family:var(--font-mono);font-size:11px;letter-spacing:.06em;color:var(--text-dim);border-bottom:1px solid var(--glass-border)",
                    ),
                    role: "status",
                  },
                  h(
                    React.Fragment,
                    { key: 1352 },
                    "",
                    h("span", { className: "sc-interp", key: 1 }, v.traceCaption),
                    "",
                  ),
                ),
                " ",
                h(
                  "div",
                  { key: 1354, style: style("height:3px;background:rgba(255,255,255,.05)") },
                  h("div", {
                    key: 1355,
                    style: style(
                      [
                        "height:100%;width:",
                        v.traceProgress ?? "",
                        "%;background:linear-gradient(90deg,var(--cyan),var(--accent));box-shadow:0 0 10px var(--cyan-glow);transition:width .6s cubic-bezier(.23,1,.32,1)",
                      ].join(""),
                    ),
                  }),
                ),
                " ",
                h(
                  "ol",
                  {
                    key: 1357,
                    "aria-label": "Request trace stages",
                    style: style(
                      "list-style:none;margin:0;padding:12px 20px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px",
                    ),
                  },
                  " ",
                  (function (parent) {
                    return (v.stages || []).map((item, index) => {
                      const v = { ...parent, st: item, $index: index };
                      return h(
                        React.Fragment,
                        { key: index },
                        h(
                          "li",
                          { key: 1360, style: style(v.st.style) },
                          h(
                            "span",
                            {
                              key: 1361,
                              style: style(
                                "font-family:var(--font-mono);font-size:10px;letter-spacing:.12em;opacity:.8",
                              ),
                            },
                            h(
                              React.Fragment,
                              { key: 1362 },
                              "",
                              h("span", { className: "sc-interp", key: 1 }, v.st.n),
                              "",
                            ),
                          ),
                          h(
                            "span",
                            {
                              key: 1363,
                              style: style("font-family:var(--font-display);font-size:12px;letter-spacing:.06em"),
                            },
                            h(
                              React.Fragment,
                              { key: 1364 },
                              "",
                              h("span", { className: "sc-interp", key: 1 }, v.st.label),
                              "",
                            ),
                          ),
                        ),
                      );
                    });
                  })(v),
                  " ",
                ),
                " ",
                h(
                  "div",
                  {
                    key: 1367,
                    id: "request-map",
                    style: style(
                      "position:relative;aspect-ratio:4/3;margin:0 12px 12px;border-radius:14px;background:radial-gradient(ellipse at 50% 50%, rgba(0,249,255,.08), transparent 62%),radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px),var(--void-deep);background-size:auto,18px 18px,auto;border:1px solid var(--glass-border);overflow:hidden",
                    ),
                  },
                  " ",
                  h("div", {
                    key: 1369,
                    "aria-hidden": "true",
                    style: style(
                      "position:absolute;left:50%;top:50%;width:150%;aspect-ratio:1;margin:-75% 0 0 -75%;border-radius:50%;background:conic-gradient(from 0deg, rgba(255,149,0,.16), rgba(255,149,0,0) 14%, transparent 100%);animation:v40-spin 7s linear infinite;-webkit-mask:radial-gradient(circle, #000 0 44%, transparent 62%);mask:radial-gradient(circle, #000 0 44%, transparent 62%);pointer-events:none",
                    ),
                  }),
                  " ",
                  h(
                    "div",
                    {
                      key: 1371,
                      "aria-hidden": "true",
                      style: style(
                        "position:absolute;left:50%;top:50%;width:30%;aspect-ratio:1;transform:translate(-50%,-50%);pointer-events:none",
                      ),
                    },
                    h("div", {
                      key: 1372,
                      style: style(
                        "width:100%;height:100%;border-radius:50%;border:1px dashed rgba(255,149,0,.28);animation:v40-spin 18s linear infinite",
                      ),
                    }),
                  ),
                  " ",
                  h(
                    "div",
                    {
                      key: 1374,
                      "aria-hidden": "true",
                      style: style(
                        "position:absolute;left:50%;top:50%;width:58%;aspect-ratio:1;transform:translate(-50%,-50%);pointer-events:none",
                      ),
                    },
                    h("div", {
                      key: 1375,
                      style: style(
                        "width:100%;height:100%;border-radius:50%;border:1px dashed rgba(0,249,255,.16);animation:v40-spin 32s linear infinite reverse",
                      ),
                    }),
                  ),
                  " ",
                  h(
                    "div",
                    {
                      key: 1377,
                      "aria-hidden": "true",
                      style: style(
                        "position:absolute;left:50%;top:50%;width:88%;aspect-ratio:1;transform:translate(-50%,-50%);pointer-events:none",
                      ),
                    },
                    h("div", {
                      key: 1378,
                      style: style("width:100%;height:100%;border-radius:50%;border:1px solid rgba(255,255,255,.05)"),
                    }),
                  ),
                  " ",
                  h(
                    "svg",
                    {
                      key: 1380,
                      viewBox: "0 0 400 300",
                      preserveAspectRatio: "xMidYMid meet",
                      "aria-hidden": "true",
                      style: style("position:absolute;inset:0;width:100%;height:100%;overflow:visible"),
                    },
                    " ",
                    h(
                      "g",
                      { key: 1382 },
                      " ",
                      h("path", {
                        key: 1384,
                        d: "M200 40 Q110 50 64 108",
                        fill: "none",
                        stroke: "rgba(255,255,255,.09)",
                        strokeWidth: "1.5",
                        vectorEffect: "non-scaling-stroke",
                      }),
                      " ",
                      h("path", {
                        key: 1386,
                        d: "M200 40 Q110 50 64 108",
                        fill: "none",
                        strokeLinecap: "round",
                        vectorEffect: "non-scaling-stroke",
                        style: style(v.eOpDsh.glow),
                      }),
                      " ",
                      h("path", {
                        key: 1388,
                        d: "M200 40 Q110 50 64 108",
                        fill: "none",
                        strokeLinecap: "round",
                        vectorEffect: "non-scaling-stroke",
                        style: style(v.eOpDsh.flow),
                      }),
                      " ",
                      h("path", {
                        key: 1390,
                        d: "M64 108 Q120 150 200 150",
                        fill: "none",
                        stroke: "rgba(255,255,255,.09)",
                        strokeWidth: "1.5",
                        vectorEffect: "non-scaling-stroke",
                      }),
                      " ",
                      h("path", {
                        key: 1392,
                        d: "M64 108 Q120 150 200 150",
                        fill: "none",
                        strokeLinecap: "round",
                        vectorEffect: "non-scaling-stroke",
                        style: style(v.eDshHe.glow),
                      }),
                      " ",
                      h("path", {
                        key: 1394,
                        d: "M64 108 Q120 150 200 150",
                        fill: "none",
                        strokeLinecap: "round",
                        vectorEffect: "non-scaling-stroke",
                        style: style(v.eDshHe.flow),
                      }),
                      " ",
                      h("path", {
                        key: 1396,
                        d: "M200 40 L200 150",
                        fill: "none",
                        stroke: "rgba(255,255,255,.09)",
                        strokeWidth: "1.5",
                        vectorEffect: "non-scaling-stroke",
                      }),
                      " ",
                      h("path", {
                        key: 1398,
                        d: "M200 40 L200 150",
                        fill: "none",
                        strokeLinecap: "round",
                        vectorEffect: "non-scaling-stroke",
                        style: style(v.eOpHe.glow),
                      }),
                      " ",
                      h("path", {
                        key: 1400,
                        d: "M200 40 L200 150",
                        fill: "none",
                        strokeLinecap: "round",
                        vectorEffect: "non-scaling-stroke",
                        style: style(v.eOpHe.flow),
                      }),
                      " ",
                      h("path", {
                        key: 1402,
                        d: "M200 150 Q130 180 100 252",
                        fill: "none",
                        stroke: "rgba(255,255,255,.09)",
                        strokeWidth: "1.5",
                        vectorEffect: "non-scaling-stroke",
                      }),
                      " ",
                      h("path", {
                        key: 1404,
                        d: "M200 150 Q130 180 100 252",
                        fill: "none",
                        strokeLinecap: "round",
                        vectorEffect: "non-scaling-stroke",
                        style: style(v.eHeZe.glow),
                      }),
                      " ",
                      h("path", {
                        key: 1406,
                        d: "M200 150 Q130 180 100 252",
                        fill: "none",
                        strokeLinecap: "round",
                        vectorEffect: "non-scaling-stroke",
                        style: style(v.eHeZe.flow),
                      }),
                      " ",
                      h("path", {
                        key: 1408,
                        d: "M200 150 Q270 180 300 252",
                        fill: "none",
                        stroke: "rgba(255,255,255,.09)",
                        strokeWidth: "1.5",
                        vectorEffect: "non-scaling-stroke",
                      }),
                      " ",
                      h("path", {
                        key: 1410,
                        d: "M200 150 Q270 180 300 252",
                        fill: "none",
                        strokeLinecap: "round",
                        vectorEffect: "non-scaling-stroke",
                        style: style(v.eHeAp.glow),
                      }),
                      " ",
                      h("path", {
                        key: 1412,
                        d: "M200 150 Q270 180 300 252",
                        fill: "none",
                        strokeLinecap: "round",
                        vectorEffect: "non-scaling-stroke",
                        style: style(v.eHeAp.flow),
                      }),
                      " ",
                    ),
                    " ",
                    h(
                      "g",
                      { key: 1415, id: "map-pk-a", opacity: "0" },
                      h("circle", { key: 1416, r: "11", fill: "#ff9500", opacity: ".22" }),
                      h("circle", { key: 1417, r: "6", fill: "#ff9500", opacity: ".5" }),
                      h("circle", { key: 1418, r: "2.6", fill: "#fff" }),
                    ),
                    " ",
                    h(
                      "g",
                      { key: 1420, id: "map-pk-b", opacity: "0" },
                      h("circle", { key: 1421, r: "11", fill: "#cc00ff", opacity: ".22" }),
                      h("circle", { key: 1422, r: "6", fill: "#cc00ff", opacity: ".5" }),
                      h("circle", { key: 1423, r: "2.6", fill: "#fff" }),
                    ),
                    " ",
                  ),
                  " ",
                  (function (parent) {
                    return (v.nodes || []).map((item, index) => {
                      const v = { ...parent, n: item, $index: index };
                      return h(
                        React.Fragment,
                        { key: index },
                        " ",
                        h(
                          "button",
                          {
                            key: 1428,
                            type: "button",
                            onClick: v.n.pick,
                            "aria-pressed": v.n.pressed,
                            "aria-label": v.n.name,
                            style: style(v.n.style),
                          },
                          " ",
                          h(
                            "span",
                            { key: 1430, style: style(v.n.core) },
                            h("span", { key: 1431, "aria-hidden": "true", style: style(v.n.pulse) }),
                            h("span", { key: 1432, "aria-hidden": "true", style: style(v.n.pulse2) }),
                            h(
                              React.Fragment,
                              { key: 1433 },
                              "",
                              h("span", { className: "sc-interp", key: 1 }, v.n.glyph),
                              "",
                            ),
                          ),
                          " ",
                          h(
                            "span",
                            {
                              key: 1435,
                              style: style(
                                "font-family:var(--font-display);font-weight:700;font-size:12px;letter-spacing:.06em;text-shadow:0 2px 10px #000",
                              ),
                            },
                            h(
                              React.Fragment,
                              { key: 1436 },
                              "",
                              h("span", { className: "sc-interp", key: 1 }, v.n.name),
                              "",
                            ),
                          ),
                          " ",
                          h(
                            "span",
                            {
                              key: 1438,
                              style: style(
                                "font-family:var(--font-mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim)",
                              ),
                            },
                            h(
                              React.Fragment,
                              { key: 1439 },
                              "",
                              h("span", { className: "sc-interp", key: 1 }, v.n.detail),
                              "",
                            ),
                          ),
                          " ",
                        ),
                        " ",
                      );
                    });
                  })(v),
                  " ",
                  h(
                    "div",
                    {
                      key: 1443,
                      "aria-hidden": "true",
                      style: style(
                        "position:absolute;left:12px;bottom:10px;font-family:var(--font-mono);font-size:9px;letter-spacing:.18em;color:var(--text-dim)",
                      ),
                    },
                    h(
                      React.Fragment,
                      { key: 1444 },
                      "",
                      h("span", { className: "sc-interp", key: 1 }, v.mapReadout),
                      "",
                    ),
                  ),
                  " ",
                  h(
                    "div",
                    {
                      key: 1446,
                      "aria-hidden": "true",
                      style: style(
                        [
                          "position:absolute;right:12px;bottom:10px;display:flex;align-items:center;gap:6px;font-family:var(--font-mono);font-size:9px;letter-spacing:.18em;color:",
                          v.mapStateColor ?? "",
                          "",
                        ].join(""),
                      ),
                    },
                    h("span", {
                      key: 1447,
                      style: style(
                        "width:6px;height:6px;border-radius:50%;background:currentColor;box-shadow:0 0 8px currentColor;animation:za-pulse 1.4s ease-in-out infinite",
                      ),
                    }),
                    h(React.Fragment, { key: 1448 }, "", h("span", { className: "sc-interp", key: 1 }, v.mapState), ""),
                  ),
                  " ",
                ),
                " ",
                h(
                  "div",
                  {
                    key: 1451,
                    style: style("display:flex;flex-direction:column;gap:6px;padding:0 20px 18px;font-size:14px"),
                  },
                  " ",
                  h(
                    "p",
                    { key: 1453, style: style("margin:0;color:var(--text-dim)") },
                    h(React.Fragment, { key: 1454 }, "The same request and routing rule as the HERMES experiment."),
                  ),
                  " ",
                  h(
                    "a",
                    { key: 1456, href: "#studies", onClick: v.continueHermes, style: style("font-weight:600") },
                    h(React.Fragment, { key: 1457 }, "Continue with these settings in HERMES ↑"),
                  ),
                  " ",
                ),
                " ",
              ),
              " ",
            ),
            " ",
          ),
          " ",
        ),
        " ",
        " ",
        h(
          "section",
          {
            key: 1465,
            id: "evidence",
            "data-screen-label": "Dated evidence",
            style: style(
              "position:relative;max-width:1240px;margin:0 auto;padding:72px 28px;display:flex;flex-direction:column;gap:36px",
            ),
          },
          " ",
          h(
            "div",
            {
              key: 1467,
              "data-reveal": "",
              style: style(
                "display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:24px;align-items:end",
              ),
            },
            " ",
            h(
              "div",
              { key: 1469, style: style("display:flex;flex-direction:column;gap:14px") },
              " ",
              h(
                "span",
                {
                  key: 1471,
                  style: style(
                    "font-family:var(--font-mono);font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--accent)",
                  ),
                },
                h(
                  "span",
                  { key: 1472, style: style("color:var(--text-dim);margin-right:14px") },
                  h(React.Fragment, { key: 1473 }, "09"),
                ),
                h("span", { key: 1474, "data-scramble": "" }, h(React.Fragment, { key: 1475 }, "The evidence")),
              ),
              " ",
              h(
                "h2",
                {
                  key: 1477,
                  style: style(
                    "font-family:var(--font-display);font-weight:900;font-size:clamp(30px,4.6vw,54px);line-height:1.05;letter-spacing:.02em;margin:0",
                  ),
                },
                h(React.Fragment, { key: 1478 }, "Trust has"),
                h("br", { key: 1479 }),
                h(React.Fragment, { key: 1480 }, "a "),
                h(
                  "span",
                  { key: 1481, style: style("color:var(--cyan);text-shadow:0 0 24px var(--cyan-glow)") },
                  h(React.Fragment, { key: 1482 }, "timestamp."),
                ),
              ),
              " ",
            ),
            " ",
            h(
              "div",
              { key: 1485, style: style("display:flex;flex-direction:column;gap:10px") },
              " ",
              h(
                "strong",
                { key: 1487, style: style("font-size:18px") },
                h(React.Fragment, { key: 1488 }, "A dated look inside the lab."),
              ),
              " ",
              h(
                "p",
                { key: 1490, style: style("color:var(--text-dim);font-size:15px;margin:0") },
                h(
                  React.Fragment,
                  { key: 1491 },
                  "Ask the evidence console what was observed, or inspect the raw record.",
                ),
              ),
              " ",
              h(
                "div",
                {
                  key: 1493,
                  style: style("display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px"),
                },
                " ",
                h(designSystem.StatCell, { key: 1495, value: "Oct 3, 2026", label: "Last observed" }),
                " ",
                h(designSystem.StatCell, { key: 1497, value: "Read only", label: "How · Run by me", color: "green" }),
                " ",
              ),
              " ",
            ),
            " ",
          ),
          " ",
          h(
            "div",
            {
              key: 1502,
              style: style("display:grid;grid-template-columns:minmax(0,7fr) minmax(0,5fr);gap:22px;align-items:start"),
            },
            " ",
            h(
              "div",
              { key: 1504, style: style(["grid-column:", v.evLeftCol ?? "", ";min-width:0"].join("")) },
              " ",
              h(
                designSystem.Panel,
                { key: 1506, color: "accent", title: "THE RECORD", icon: "▸" },
                " ",
                h(
                  "div",
                  { key: 1508, style: style("display:flex;flex-direction:column;gap:18px") },
                  " ",
                  h(
                    "h3",
                    {
                      key: 1510,
                      style: style(
                        "font-family:var(--font-display);font-weight:700;font-size:clamp(18px,2.2vw,24px);line-height:1.2;margin:0",
                      ),
                    },
                    h(React.Fragment, { key: 1511 }, "What the record shows."),
                  ),
                  " ",
                  h(
                    "div",
                    {
                      key: 1513,
                      style: style(
                        "display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:10px",
                      ),
                    },
                    " ",
                    h(
                      "div",
                      {
                        key: 1515,
                        style: style(
                          "display:flex;flex-direction:column;gap:6px;padding:14px 16px;border-radius:12px;background:var(--surface-2);border:1px solid var(--glass-border)",
                        ),
                      },
                      h(
                        "span",
                        {
                          key: 1516,
                          style: style(
                            "font-family:var(--font-mono);font-size:10px;letter-spacing:.16em;color:var(--text-dim)",
                          ),
                        },
                        h(React.Fragment, { key: 1517 }, "RUNNING"),
                      ),
                      h(
                        "span",
                        { key: 1518, style: style("font-size:15px;line-height:1.5") },
                        h(React.Fragment, { key: 1519 }, "20 containers and 1 virtual machine on 2 hosts"),
                      ),
                    ),
                    " ",
                    h(
                      "div",
                      {
                        key: 1521,
                        style: style(
                          "display:flex;flex-direction:column;gap:6px;padding:14px 16px;border-radius:12px;background:var(--surface-2);border:1px solid var(--glass-border)",
                        ),
                      },
                      h(
                        "span",
                        {
                          key: 1522,
                          style: style(
                            "font-family:var(--font-mono);font-size:10px;letter-spacing:.16em;color:var(--text-dim)",
                          ),
                        },
                        h(React.Fragment, { key: 1523 }, "BACKUPS"),
                      ),
                      h(
                        "span",
                        { key: 1524, style: style("font-size:15px;line-height:1.5") },
                        h(React.Fragment, { key: 1525 }, "Every snapshot on record passed its integrity check."),
                      ),
                    ),
                    " ",
                    h(
                      "div",
                      {
                        key: 1527,
                        style: style(
                          "display:flex;flex-direction:column;gap:6px;padding:14px 16px;border-radius:12px;background:var(--surface-2);border:1px solid var(--glass-border)",
                        ),
                      },
                      h(
                        "span",
                        {
                          key: 1528,
                          style: style(
                            "font-family:var(--font-mono);font-size:10px;letter-spacing:.16em;color:var(--text-dim)",
                          ),
                        },
                        h(React.Fragment, { key: 1529 }, "LOCAL MODEL · ATLAS"),
                      ),
                      h(
                        "span",
                        { key: 1530, style: style("font-size:15px;line-height:1.5") },
                        h(
                          React.Fragment,
                          { key: 1531 },
                          "Primary configuration: a 16,384 token window, read October 3, 2026",
                        ),
                      ),
                    ),
                    " ",
                  ),
                  " ",
                  h(
                    "details",
                    { key: 1534 },
                    " ",
                    h(
                      "summary",
                      {
                        key: 1536,
                        style: style(
                          "display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-radius:12px;border:1px solid var(--glass-border);background:var(--glass);font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--cyan)",
                        ),
                      },
                      h(React.Fragment, { key: 1537 }, "See how the record grew "),
                      h("span", { key: 1538 }, h(React.Fragment, { key: 1539 }, "▾")),
                    ),
                    " ",
                    h(
                      "div",
                      { key: 1541, style: style("display:flex;flex-direction:column;gap:16px;padding-top:16px") },
                      " ",
                      h(
                        "p",
                        { key: 1543, style: style("color:var(--text-dim);font-size:14px;line-height:1.6;margin:0") },
                        h(
                          React.Fragment,
                          { key: 1544 },
                          "The latest observation comes first and counts running guests on the two servers. Older columns keep their original dates and unknowns.",
                        ),
                      ),
                      " ",
                      h(
                        "div",
                        {
                          key: 1546,
                          role: "region",
                          "aria-label": "Compare the three dated evidence records",
                          style: style("overflow-x:auto"),
                        },
                        " ",
                        h(
                          "div",
                          {
                            key: 1548,
                            style: style(
                              "display:grid;grid-template-columns:minmax(130px,1.2fr) repeat(3,minmax(110px,1fr));gap:10px 14px;align-items:center;min-width:520px;font-size:14px",
                            ),
                          },
                          " ",
                          h(
                            "span",
                            {
                              key: 1550,
                              style: style(
                                "font-family:var(--font-mono);font-size:10px;letter-spacing:.14em;color:var(--text-dim)",
                              ),
                            },
                            h(React.Fragment, { key: 1551 }, "RECORD"),
                          ),
                          h(
                            "span",
                            {
                              key: 1552,
                              style: style(
                                "font-family:var(--font-mono);font-size:10px;letter-spacing:.14em;color:var(--cyan)",
                              ),
                            },
                            h(React.Fragment, { key: 1553 }, "LATEST · OCT 3"),
                          ),
                          h(
                            "span",
                            {
                              key: 1554,
                              style: style(
                                "font-family:var(--font-mono);font-size:10px;letter-spacing:.14em;color:var(--text-dim)",
                              ),
                            },
                            h(React.Fragment, { key: 1555 }, "SEP 7"),
                          ),
                          h(
                            "span",
                            {
                              key: 1556,
                              style: style(
                                "font-family:var(--font-mono);font-size:10px;letter-spacing:.14em;color:var(--text-dim)",
                              ),
                            },
                            h(React.Fragment, { key: 1557 }, "AUG 28"),
                          ),
                          " ",
                          h("strong", { key: 1559 }, h(React.Fragment, { key: 1560 }, "Containers running")),
                          " ",
                          h(
                            "div",
                            { key: 1562, style: style("display:flex;align-items:center;gap:8px") },
                            h(
                              "div",
                              {
                                key: 1563,
                                style: style("flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.06)"),
                              },
                              h("div", {
                                key: 1564,
                                style: style(
                                  "width:100%;height:100%;border-radius:3px;background:var(--cyan);box-shadow:0 0 10px var(--cyan-glow)",
                                ),
                              }),
                            ),
                            h(
                              "span",
                              {
                                key: 1565,
                                style: style(
                                  "font-family:var(--font-display);font-weight:700;color:var(--cyan);width:30px",
                                ),
                              },
                              h(React.Fragment, { key: 1566 }, "20"),
                            ),
                          ),
                          " ",
                          h(
                            "div",
                            { key: 1568, style: style("display:flex;align-items:center;gap:8px") },
                            h(
                              "div",
                              {
                                key: 1569,
                                style: style("flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.06)"),
                              },
                              h("div", {
                                key: 1570,
                                style: style("width:95%;height:100%;border-radius:3px;background:var(--text-dim)"),
                              }),
                            ),
                            h(
                              "span",
                              { key: 1571, style: style("font-family:var(--font-display);font-weight:700;width:30px") },
                              h(React.Fragment, { key: 1572 }, "19"),
                            ),
                          ),
                          " ",
                          h(
                            "div",
                            { key: 1574, style: style("display:flex;align-items:center;gap:8px") },
                            h(
                              "div",
                              {
                                key: 1575,
                                style: style("flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.06)"),
                              },
                              h("div", {
                                key: 1576,
                                style: style("width:90%;height:100%;border-radius:3px;background:rgba(198,198,224,.5)"),
                              }),
                            ),
                            h(
                              "span",
                              { key: 1577, style: style("font-family:var(--font-display);font-weight:700;width:30px") },
                              h(React.Fragment, { key: 1578 }, "18"),
                            ),
                          ),
                          " ",
                          h("strong", { key: 1580 }, h(React.Fragment, { key: 1581 }, "Virtual machines")),
                          " ",
                          h(
                            "div",
                            { key: 1583, style: style("display:flex;align-items:center;gap:8px") },
                            h(
                              "div",
                              {
                                key: 1584,
                                style: style("flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.06)"),
                              },
                              h("div", {
                                key: 1585,
                                style: style("width:12%;height:100%;border-radius:3px;background:var(--cyan)"),
                              }),
                            ),
                            h(
                              "span",
                              {
                                key: 1586,
                                style: style(
                                  "font-family:var(--font-display);font-weight:700;color:var(--cyan);width:30px",
                                ),
                              },
                              h(React.Fragment, { key: 1587 }, "1"),
                            ),
                          ),
                          " ",
                          h(
                            "div",
                            { key: 1589, style: style("display:flex;align-items:center;gap:8px") },
                            h(
                              "div",
                              {
                                key: 1590,
                                style: style("flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.06)"),
                              },
                              h("div", {
                                key: 1591,
                                style: style("width:12%;height:100%;border-radius:3px;background:var(--text-dim)"),
                              }),
                            ),
                            h(
                              "span",
                              { key: 1592, style: style("font-family:var(--font-display);font-weight:700;width:30px") },
                              h(React.Fragment, { key: 1593 }, "1"),
                            ),
                          ),
                          " ",
                          h(
                            "span",
                            {
                              key: 1595,
                              style: style("font-family:var(--font-mono);font-size:11px;color:var(--text-dim)"),
                            },
                            h(React.Fragment, { key: 1596 }, "Not recorded"),
                          ),
                          " ",
                          h("strong", { key: 1598 }, h(React.Fragment, { key: 1599 }, "Hosts at probe")),
                          h(
                            "span",
                            { key: 1600, style: style("font-family:var(--font-mono);color:var(--cyan)") },
                            h(React.Fragment, { key: 1601 }, "2 of 2"),
                          ),
                          h(
                            "span",
                            { key: 1602, style: style("font-family:var(--font-mono)") },
                            h(React.Fragment, { key: 1603 }, "2 of 2"),
                          ),
                          h(
                            "span",
                            { key: 1604, style: style("font-family:var(--font-mono);color:var(--text-dim)") },
                            h(React.Fragment, { key: 1605 }, "2 of 2"),
                          ),
                          " ",
                          h("strong", { key: 1607 }, h(React.Fragment, { key: 1608 }, "Public lanes")),
                          h(
                            "span",
                            {
                              key: 1609,
                              style: style("font-family:var(--font-mono);font-size:11px;color:var(--amber)"),
                            },
                            h(React.Fragment, { key: 1610 }, "Not verified"),
                          ),
                          h(
                            "span",
                            {
                              key: 1611,
                              style: style("font-family:var(--font-mono);font-size:11px;color:var(--amber)"),
                            },
                            h(React.Fragment, { key: 1612 }, "Not verified"),
                          ),
                          " ",
                          h(
                            "div",
                            { key: 1614, style: style("display:flex;align-items:center;gap:8px") },
                            h(
                              "div",
                              {
                                key: 1615,
                                style: style("flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.06)"),
                              },
                              h("div", {
                                key: 1616,
                                style: style("width:55%;height:100%;border-radius:3px;background:rgba(198,198,224,.5)"),
                              }),
                            ),
                            h(
                              "span",
                              { key: 1617, style: style("font-family:var(--font-display);font-weight:700;width:30px") },
                              h(React.Fragment, { key: 1618 }, "10"),
                            ),
                          ),
                          " ",
                        ),
                        " ",
                      ),
                      " ",
                      h(
                        "div",
                        {
                          key: 1622,
                          style: style(
                            "display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:12px;font-size:14px;line-height:1.55",
                          ),
                        },
                        " ",
                        h(
                          "div",
                          {
                            key: 1624,
                            style: style(
                              "display:flex;flex-direction:column;gap:6px;padding:16px;border-radius:12px;background:var(--surface-2);border:1px solid var(--glass-border)",
                            ),
                          },
                          h("strong", { key: 1625 }, h(React.Fragment, { key: 1626 }, "Count the same thing.")),
                          h(
                            "span",
                            { key: 1627, style: style("color:var(--text-dim)") },
                            h(
                              React.Fragment,
                              { key: 1628 },
                              "Containers and virtual machines are separate counts. The extra guest is a new container. “Not recorded” is an unknown, not a zero.",
                            ),
                          ),
                        ),
                        " ",
                        h(
                          "div",
                          {
                            key: 1630,
                            style: style(
                              "display:flex;flex-direction:column;gap:6px;padding:16px;border-radius:12px;background:var(--surface-2);border:1px solid var(--glass-border)",
                            ),
                          },
                          h("strong", { key: 1631 }, h(React.Fragment, { key: 1632 }, "Let unknown stay unknown.")),
                          h(
                            "span",
                            { key: 1633, style: style("color:var(--text-dim)") },
                            h(
                              React.Fragment,
                              { key: 1634 },
                              "The older route count has no current verification. It stays in its archive.",
                            ),
                          ),
                        ),
                        " ",
                        h(
                          "div",
                          {
                            key: 1636,
                            style: style(
                              "display:flex;flex-direction:column;gap:6px;padding:16px;border-radius:12px;background:var(--surface-2);border:1px solid var(--glass-border)",
                            ),
                          },
                          h(
                            "strong",
                            { key: 1637 },
                            h(React.Fragment, { key: 1638 }, "Keep the claim inside the evidence."),
                          ),
                          h(
                            "span",
                            { key: 1639, style: style("color:var(--text-dim)") },
                            h(
                              React.Fragment,
                              { key: 1640 },
                              "A running guest is a count, not an application health check.",
                            ),
                          ),
                        ),
                        " ",
                      ),
                      " ",
                    ),
                    " ",
                  ),
                  " ",
                  h(
                    "details",
                    { key: 1645, id: "snapshot-story" },
                    " ",
                    h(
                      "summary",
                      {
                        key: 1647,
                        style: style(
                          "display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-radius:12px;border:1px solid var(--glass-border);background:var(--glass);font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--cyan)",
                        ),
                      },
                      h(React.Fragment, { key: 1648 }, "A real run: the backup tool that refused to run "),
                      h("span", { key: 1649 }, h(React.Fragment, { key: 1650 }, "▾")),
                    ),
                    " ",
                    h(
                      "div",
                      { key: 1652, style: style("display:flex;flex-direction:column;gap:14px;padding-top:16px") },
                      " ",
                      h(
                        "span",
                        {
                          key: 1654,
                          style: style(
                            "font-family:var(--font-mono);font-size:10px;letter-spacing:.16em;color:var(--cyan)",
                          ),
                        },
                        h(React.Fragment, { key: 1655 }, "DEEPSEEK HARNESS · EXECUTION RECEIPT"),
                      ),
                      " ",
                      h(
                        "h3",
                        {
                          key: 1657,
                          style: style(
                            "font-family:var(--font-display);font-weight:700;font-size:20px;line-height:1.2;margin:0",
                          ),
                        },
                        h(React.Fragment, { key: 1658 }, "Keep the snapshot moving with the work."),
                      ),
                      " ",
                      h(
                        "p",
                        { key: 1660, style: style("color:var(--text-dim);font-size:14px;line-height:1.6;margin:0") },
                        h(
                          React.Fragment,
                          { key: 1661 },
                          "The tool's notes describe a fixed revision check that blocked snapshots as the project advanced. The repair archives the current revision, checks that it stays stable, and includes the installed skills, agent presets and operations scripts.",
                        ),
                      ),
                      " ",
                      h(
                        "p",
                        { key: 1663, style: style("color:var(--text-dim);font-size:14px;line-height:1.6;margin:0") },
                        h(
                          React.Fragment,
                          { key: 1664 },
                          "The October 3, 2026 receipt records 990 verified files and a matching archive hash from decryption on a second host. This was DeepSeek Harness operations tooling. The trigger was a daily schedule configured for 3:45 AM Central; the work was a backup script, with no AI routing claim.",
                        ),
                      ),
                      " ",
                      h(
                        "div",
                        {
                          key: 1666,
                          style: style(
                            "display:flex;flex-direction:column;gap:8px;padding:16px;border-radius:12px;background:var(--void-deep);border:1px solid var(--glass-border)",
                          ),
                        },
                        h(
                          "strong",
                          { key: 1667, style: style("font-size:14px") },
                          h(React.Fragment, { key: 1668 }, "Three fields from the execution receipt"),
                        ),
                        h(
                          "code",
                          {
                            key: 1669,
                            style: style(
                              "font-family:var(--font-mono);font-size:13px;line-height:1.7;color:var(--green)",
                            ),
                          },
                          h(React.Fragment, { key: 1670 }, '"status": "verified",'),
                          h("br", { key: 1671 }),
                          h(React.Fragment, { key: 1672 }, '"restored_files_verified": 990,'),
                          h("br", { key: 1673 }),
                          h(React.Fragment, { key: 1674 }, '"live_restore_performed": false,'),
                        ),
                      ),
                      " ",
                      h(
                        "p",
                        { key: 1676, style: style("color:var(--text-dim);font-size:14px;line-height:1.6;margin:0") },
                        h(
                          React.Fragment,
                          { key: 1677 },
                          "Receipt: October 3, 2026 at 3:45 AM Central Daylight Time. This checks readable console files, not recovery of a running system or the fleet. One missing snapshot date means uninterrupted daily success is not claimed. Storage paths and host identifiers remain private.",
                        ),
                      ),
                      " ",
                      h(
                        "a",
                        {
                          key: 1679,
                          href: "https://cashio.us/evidence/console-snapshot-2026-10-03.json",
                          style: style("font-size:14px;font-weight:600"),
                        },
                        h(React.Fragment, { key: 1680 }, "Inspect the redacted job receipt →"),
                      ),
                      " ",
                    ),
                    " ",
                  ),
                  " ",
                  h(
                    "div",
                    {
                      key: 1684,
                      style: style(
                        "display:flex;flex-direction:column;gap:10px;padding:16px 18px;border-radius:12px;border:1px solid rgba(255,149,0,.35);background:rgba(255,149,0,.05)",
                      ),
                    },
                    " ",
                    h(
                      "strong",
                      { key: 1686, style: style("font-size:14px") },
                      h(React.Fragment, { key: 1687 }, "The evidence boundary, in one place"),
                    ),
                    " ",
                    h(
                      "span",
                      { key: 1689, style: style("color:var(--text-dim);font-size:14px;line-height:1.6") },
                      h(
                        React.Fragment,
                        { key: 1690 },
                        "These fleet counts and integrity checks do not establish application health, full system recovery or current AI routing. Private addresses, service names, spending and the model catalog stay private. The browser experiments are simulations.",
                      ),
                    ),
                    " ",
                    h(
                      "div",
                      {
                        key: 1692,
                        style: style(
                          "display:flex;flex-wrap:wrap;gap:8px 18px;font-size:14px;font-weight:600;align-items:baseline",
                        ),
                      },
                      " ",
                      h(
                        "a",
                        { key: 1694, href: "https://cashio.us/evidence/status.json" },
                        h(React.Fragment, { key: 1695 }, "Read the latest export"),
                      ),
                      " ",
                      h(
                        "details",
                        { key: 1697, style: style("display:inline-block") },
                        " ",
                        h(
                          "summary",
                          { key: 1699, style: style("color:var(--text-dim);font-weight:600") },
                          h(React.Fragment, { key: 1700 }, "Earlier records (4) ▾"),
                        ),
                        " ",
                        h(
                          "div",
                          { key: 1702, style: style("display:flex;flex-wrap:wrap;gap:8px 18px;padding-top:8px") },
                          h(
                            "a",
                            { key: 1703, href: "https://cashio.us/evidence/status-2026-09-26.json" },
                            h(React.Fragment, { key: 1704 }, "Archived record, September 26"),
                          ),
                          h(
                            "a",
                            { key: 1705, href: "https://cashio.us/evidence/status-2026-09-24.json" },
                            h(React.Fragment, { key: 1706 }, "Archived record, September 24"),
                          ),
                          h(
                            "a",
                            { key: 1707, href: "https://cashio.us/evidence/status-2026-09-07.json" },
                            h(React.Fragment, { key: 1708 }, "Archived record, September 7"),
                          ),
                          h(
                            "a",
                            { key: 1709, href: "https://cashio.us/evidence/status-2026-08-28.json" },
                            h(React.Fragment, { key: 1710 }, "Archived record, August 28"),
                          ),
                        ),
                        " ",
                      ),
                      " ",
                    ),
                    " ",
                  ),
                  " ",
                ),
                " ",
              ),
              " ",
            ),
            " ",
            h(
              "div",
              {
                key: 1718,
                style: style(
                  ["grid-column:", v.evRightCol ?? "", ";min-width:0;display:flex;flex-direction:column;gap:10px"].join(
                    "",
                  ),
                ),
              },
              " ",
              h(
                designSystem.Terminal,
                { key: 1720, title: "E.V.E. · evaluation verification engine", hint: "DATED", bodyHeight: v.eveHeight },
                " ",
                h(
                  "div",
                  {
                    key: 1722,
                    id: "eve-out",
                    role: "log",
                    "aria-label": "E.V.E. replies",
                    "aria-live": "polite",
                    style: style("display:flex;flex-direction:column;gap:4px"),
                  },
                  " ",
                  (function (parent) {
                    return (v.eveLog || []).map((item, index) => {
                      const v = { ...parent, l: item, $index: index };
                      return h(
                        React.Fragment,
                        { key: index },
                        " ",
                        h(
                          "div",
                          { key: 1726, style: style(v.l.style) },
                          h(
                            React.Fragment,
                            { key: 1727 },
                            "",
                            h("span", { className: "sc-interp", key: 1 }, v.l.text),
                            "",
                          ),
                        ),
                        " ",
                      );
                    });
                  })(v),
                  " ",
                ),
                " ",
              ),
              " ",
              h(
                "div",
                {
                  key: 1732,
                  role: "group",
                  "aria-label": "Suggested E.V.E. commands",
                  style: style("display:flex;flex-wrap:wrap;gap:6px"),
                },
                " ",
                (function (parent) {
                  return (v.eveChips || []).map((item, index) => {
                    const v = { ...parent, ch: item, $index: index };
                    return h(
                      React.Fragment,
                      { key: index },
                      " ",
                      h(
                        designSystem.Chip,
                        { key: 1736, onClick: v.ch.run },
                        h(
                          React.Fragment,
                          { key: 1737 },
                          "",
                          h("span", { className: "sc-interp", key: 1 }, v.ch.label),
                          "",
                        ),
                      ),
                      " ",
                    );
                  });
                })(v),
                " ",
              ),
              " ",
              h(
                "form",
                {
                  key: 1741,
                  onSubmit: v.eveSubmit,
                  style: style(
                    "display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:12px;background:var(--void-deep);border:1px solid var(--glass-border)",
                  ),
                },
                " ",
                h(
                  "label",
                  {
                    key: 1743,
                    htmlFor: "eve-in",
                    style: style(
                      "font-family:var(--font-mono);font-size:11px;letter-spacing:.12em;color:var(--cyan);white-space:nowrap",
                    ),
                  },
                  h(React.Fragment, { key: 1744 }, "E.V.E. ▸"),
                ),
                " ",
                h("input", {
                  key: 1746,
                  id: "eve-in",
                  type: "text",
                  autoComplete: "off",
                  placeholder: "help, or 42",
                  "aria-label": "E.V.E. command, for example help or fleet",
                  value: v.eveInput,
                  onChange: v.eveChange,
                  style: style(
                    "flex:1;min-width:0;background:none;border:none;outline:none;color:var(--text);font-family:var(--font-mono);font-size:13px;caret-color:var(--cyan)",
                  ),
                }),
                " ",
                h(
                  "button",
                  {
                    key: 1748,
                    type: "submit",
                    "aria-label": "Run command",
                    style: style(
                      "background:none;border:1px solid var(--glass-border);border-radius:8px;color:var(--cyan);font-family:var(--font-mono);padding:4px 10px;cursor:pointer",
                    ),
                  },
                  h(React.Fragment, { key: 1749 }, "↵"),
                ),
                " ",
              ),
              " ",
            ),
            " ",
          ),
          " ",
        ),
        " ",
        " ",
        h(
          "section",
          {
            key: 1756,
            id: "operator",
            "data-screen-label": "Meet Doug",
            style: style(
              "position:relative;max-width:1240px;margin:0 auto;padding:88px 28px;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:40px;align-items:center",
            ),
          },
          " ",
          h(
            "div",
            { key: 1758, "data-reveal": "", style: style("display:flex;flex-direction:column;gap:16px") },
            " ",
            h(
              "span",
              {
                key: 1760,
                style: style(
                  "font-family:var(--font-mono);font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--accent)",
                ),
              },
              h(
                "span",
                { key: 1761, style: style("color:var(--text-dim);margin-right:14px") },
                h(React.Fragment, { key: 1762 }, "10"),
              ),
              h("span", { key: 1763, "data-scramble": "" }, h(React.Fragment, { key: 1764 }, "Meet Doug")),
            ),
            " ",
            h(
              "h2",
              {
                key: 1766,
                style: style(
                  "font-family:var(--font-display);font-weight:900;font-size:clamp(34px,5.2vw,64px);line-height:1.02;letter-spacing:.02em;margin:0",
                ),
              },
              h(React.Fragment, { key: 1767 }, "Doug Cashio"),
            ),
            " ",
            h(
              "p",
              {
                key: 1769,
                style: style(
                  "font-family:var(--font-display);font-weight:700;font-size:clamp(17px,1.8vw,21px);line-height:1.35;margin:0;color:var(--cyan);text-wrap:pretty",
                ),
              },
              h(React.Fragment, { key: 1770 }, "A workbench for the things I keep wondering about."),
            ),
            " ",
            h(
              "p",
              {
                key: 1772,
                style: style(
                  "color:var(--text);font-size:16px;line-height:1.6;margin:0;text-wrap:pretty;max-width:56ch",
                ),
              },
              h(
                React.Fragment,
                { key: 1773 },
                "I like systems I can take apart, explain and put back together. This site is where that curiosity meets aviation, science fiction and the pleasure of making something work.",
              ),
            ),
            " ",
            h(
              "div",
              { key: 1775, style: style("display:flex;gap:10px;flex-wrap:wrap") },
              " ",
              h(
                designSystem.Button,
                {
                  key: 1777,
                  as: "a",
                  href: "https://www.linkedin.com/in/dougcashio/",
                  variant: "secondary",
                  size: "sm",
                },
                h(React.Fragment, { key: 1778 }, "LinkedIn"),
              ),
              " ",
              h(
                designSystem.Button,
                { key: 1780, as: "a", href: "https://github.com/jamescashio", variant: "secondary", size: "sm" },
                h(React.Fragment, { key: 1781 }, "My GitHub · @jamescashio"),
              ),
              " ",
              h(
                designSystem.Button,
                {
                  key: 1783,
                  as: "a",
                  href: "https://www.credly.com/users/james-cashio/badges/credly",
                  variant: "secondary",
                  size: "sm",
                },
                h(React.Fragment, { key: 1784 }, "My Credly badges · @james-cashio"),
              ),
              " ",
            ),
            " ",
            h(
              "p",
              { key: 1787, style: style("color:var(--text-dim);font-size:14px;margin:0") },
              h(
                React.Fragment,
                { key: 1788 },
                "The GitHub and Credly handles use my first name, James. Everyone calls me Doug.",
              ),
            ),
            " ",
          ),
          " ",
          h(
            "div",
            {
              key: 1791,
              "data-reveal": "",
              "data-tilt": "4",
              style: style(
                "position:relative;border-radius:28px;overflow:hidden;background:var(--void-deep);border:1px solid var(--glass-border);box-shadow:var(--shadow-panel),0 0 90px -40px rgba(255,149,0,.5);display:flex;flex-direction:column",
              ),
            },
            " ",
            h(
              "div",
              {
                key: 1793,
                style: style(
                  "display:flex;justify-content:space-between;gap:12px;padding:18px 22px;font-family:var(--font-mono);font-size:10px;letter-spacing:.16em",
                ),
              },
              h(
                "span",
                { key: 1794, style: style("color:var(--accent)") },
                h(React.Fragment, { key: 1795 }, "THE cAshIo SIGNATURE"),
              ),
              h(
                "span",
                { key: 1796, role: "status", style: style(["color:", v.sigStateColor ?? "", ""].join("")) },
                h(React.Fragment, { key: 1797 }, "", h("span", { className: "sc-interp", key: 1 }, v.sigState), ""),
              ),
            ),
            " ",
            h(
              "div",
              { key: 1799, style: style("position:relative;padding:4px 20px 20px") },
              " ",
              h("div", { key: 1801, "aria-hidden": "true", style: style(v.sigRing) }),
              " ",
              h(
                "div",
                { key: 1803, style: style("position:relative;border-radius:14px;overflow:hidden") },
                " ",
                h("img", {
                  key: 1805,
                  src: "/v40/assets/958b0ebd-ae9b-458e-8a48-3c4ee4f6a3ea.webp",
                  width: "1680",
                  height: "625",
                  loading: "lazy",
                  decoding: "async",
                  alt: "The cAshIo celestial signature: a gold and titanium wordmark inside an orbital ring",
                  style: style(v.sigImg),
                }),
                " ",
                h("video", {
                  key: 1807,
                  id: "sig-video",
                  "data-v": "manual",
                  src: "/assets/zenith/celestial-signature.mp4",
                  poster: "/v40/assets/8c3bf29b-903b-44c9-a462-74f54293a7de.webp",
                  preload: "none",
                  "aria-hidden": "true",
                  style: style(v.sigVid),
                }),
                " ",
              ),
              " ",
            ),
            " ",
            h(
              "svg",
              {
                key: 1811,
                "aria-hidden": "true",
                viewBox: "0 0 400 300",
                preserveAspectRatio: "none",
                style: style("position:absolute;inset:0;width:100%;height:100%;pointer-events:none"),
              },
              h("path", {
                key: 1812,
                d: "M14 40 V14 H40 M360 14 H386 V40 M14 260 V286 H40 M360 286 H386 V260",
                fill: "none",
                stroke: "rgba(255,149,0,.55)",
                strokeWidth: "1.5",
              }),
            ),
            " ",
            h(
              "div",
              {
                key: 1814,
                style: style(
                  "display:flex;justify-content:space-between;align-items:flex-end;gap:14px;flex-wrap:wrap;padding:0 22px 22px",
                ),
              },
              " ",
              h(
                "div",
                { key: 1816, style: style("display:flex;flex-direction:column;gap:8px;align-items:flex-start") },
                " ",
                h(
                  designSystem.Button,
                  { key: 1818, onClick: v.energize, size: "sm" },
                  h(React.Fragment, { key: 1819 }, "◇ Energize the signature"),
                ),
                " ",
                h(
                  "a",
                  {
                    key: 1821,
                    href: "/v39/#signature",
                    style: style("font-size:14px;font-weight:600;color:var(--text)"),
                  },
                  h(React.Fragment, { key: 1822 }, "Explore the celestial signature in 3D →"),
                ),
                " ",
                h(
                  "a",
                  {
                    key: 1824,
                    href: "/v39/#film=zenith-celestial-signature",
                    style: style("font-size:14px;font-weight:600;color:var(--text)"),
                  },
                  h(React.Fragment, { key: 1825 }, "Watch its quiet orbit · 5 seconds →"),
                ),
                " ",
              ),
              " ",
              h(
                "span",
                {
                  key: 1828,
                  style: style(
                    "font-family:var(--font-mono);font-size:10px;letter-spacing:.16em;color:var(--text-dim)",
                  ),
                },
                h(React.Fragment, { key: 1829 }, "IMAGINATION, WITH INTENTION."),
              ),
              " ",
            ),
            " ",
          ),
          " ",
        ),
        " ",
        " ",
        h(
          "section",
          {
            key: 1835,
            id: "contact",
            "data-screen-label": "Open a channel",
            style: style(
              "position:relative;overflow:hidden;border-top:1px solid var(--glass-border);min-height:78vh;display:flex;align-items:center",
            ),
          },
          " ",
          h("video", {
            key: 1837,
            "data-v": "auto",
            src: "/assets/zenith/workshop-after-hours.mp4",
            poster: "/v40/assets/a3955f7d-05c0-46d2-8ea0-3abe602982d4.webp",
            preload: "none",
            "aria-hidden": "true",
            style: style("position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.5"),
          }),
          " ",
          h("div", {
            key: 1839,
            "aria-hidden": "true",
            style: style(
              "position:absolute;inset:0;background:linear-gradient(90deg,rgba(10,10,15,.96) 0%,rgba(10,10,15,.75) 50%,rgba(10,10,15,.35) 100%),linear-gradient(180deg,rgba(10,10,15,1) 0%,transparent 25%,transparent 70%,rgba(5,6,10,1) 100%)",
            ),
          }),
          " ",
          h("div", {
            key: 1841,
            "aria-hidden": "true",
            style: style(
              "position:absolute;inset:0;background:radial-gradient(ellipse at 50% 120%, rgba(255,149,0,.2), transparent 55%)",
            ),
          }),
          " ",
          h(
            "div",
            {
              key: 1843,
              style: style(
                "position:relative;max-width:1240px;width:100%;margin:0 auto;padding:110px 28px;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:40px;align-items:center",
              ),
            },
            " ",
            h(
              "div",
              { key: 1845, "data-reveal": "", style: style("display:flex;flex-direction:column;gap:14px") },
              " ",
              h(
                "span",
                {
                  key: 1847,
                  style: style(
                    "font-family:var(--font-mono);font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--accent)",
                  ),
                },
                h(
                  "span",
                  { key: 1848, style: style("color:var(--text-dim);margin-right:14px") },
                  h(React.Fragment, { key: 1849 }, "11"),
                ),
                h("span", { key: 1850, "data-scramble": "" }, h(React.Fragment, { key: 1851 }, "Open a channel")),
              ),
              " ",
              h(
                "h2",
                {
                  key: 1853,
                  style: style(
                    "font-family:var(--font-display);font-weight:900;font-size:clamp(40px,6.4vw,92px);line-height:.98;letter-spacing:.01em;margin:0",
                  ),
                },
                h(React.Fragment, { key: 1854 }, "Don’t panic."),
                h("br", { key: 1855 }),
                h(
                  "span",
                  {
                    key: 1856,
                    style: style(
                      "background:linear-gradient(92deg,var(--accent),#ffcc00 45%,var(--cyan));-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 24px rgba(255,149,0,.3))",
                    ),
                  },
                  h(React.Fragment, { key: 1857 }, "Say hello."),
                ),
              ),
              " ",
            ),
            " ",
            h(
              "div",
              {
                key: 1860,
                "data-reveal": "",
                style: style(
                  "display:flex;flex-direction:column;gap:20px;padding:28px;border-radius:20px;background:rgba(10,10,18,.6);backdrop-filter:blur(14px);border:1px solid var(--glass-border)",
                ),
              },
              " ",
              h(
                "p",
                {
                  key: 1862,
                  style: style("color:var(--text);font-size:17px;line-height:1.6;margin:0;text-wrap:pretty"),
                },
                h(
                  React.Fragment,
                  { key: 1863 },
                  "Bring me your trickiest question about local AI, private data or keeping a human in the loop. I am open to speaking, mentoring and comparing notes. The answer is probably not 42.",
                ),
              ),
              " ",
              h(
                "div",
                { key: 1865, style: style("display:flex;gap:12px;align-items:center;flex-wrap:wrap") },
                " ",
                h(
                  designSystem.Button,
                  {
                    key: 1867,
                    as: "a",
                    href: "mailto:doug@cashio.us?subject=Comparing%20notes%20from%20cashio.us&body=What%20I%20am%20working%20on%3A%0A%0AThe%20hardest%20constraint%3A%0A%0AThe%20study%20that%20caught%20my%20attention%3A%0A",
                    size: "lg",
                  },
                  h(React.Fragment, { key: 1868 }, "doug@cashio.us"),
                ),
                " ",
                h(
                  designSystem.Button,
                  { key: 1870, onClick: v.copyEmail, variant: "secondary", size: "lg" },
                  h(
                    React.Fragment,
                    { key: 1871 },
                    "",
                    h("span", { className: "sc-interp", key: 1 }, v.copyEmailLabel),
                    "",
                  ),
                ),
                " ",
              ),
              " ",
            ),
            " ",
          ),
          " ",
        ),
        " ",
      ),
      " ",
      " ",
      h(
        "footer",
        { key: 1879, style: style("border-top:1px solid var(--glass-border);background:rgba(5,6,10,.7)") },
        " ",
        h(
          "div",
          {
            key: 1881,
            style: style(
              "max-width:1240px;margin:0 auto;padding:40px 28px 56px;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:28px;align-items:start",
            ),
          },
          " ",
          h(
            "div",
            {
              key: 1883,
              style: style(
                "display:flex;flex-direction:column;gap:8px;max-width:720px;font-size:14px;line-height:1.6;color:var(--text-dim)",
              ),
            },
            " ",
            h(
              "span",
              { key: 1885 },
              h(React.Fragment, { key: 1886 }, "The Human Reckoning. Frank Herbert’s "),
              h("em", { key: 1887 }, h(React.Fragment, { key: 1888 }, "Dune")),
              h(React.Fragment, { key: 1889 }, " taught caution about thinking machines; Douglas Adams’s "),
              h("em", { key: 1890 }, h(React.Fragment, { key: 1891 }, "Hitchhiker’s Guide")),
              h(
                React.Fragment,
                { key: 1892 },
                " taught the rest: keep a towel handy and don’t panic. Capable tools. Human judgment in command.",
              ),
            ),
            " ",
            h(
              "span",
              {
                key: 1894,
                style: style(
                  "font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent)",
                ),
              },
              h(
                React.Fragment,
                { key: 1895 },
                "V40 · Preview 05 · Mostly Harmless · Directed by Doug Cashio · October 4, 2026",
              ),
            ),
            " ",
            h(
              "span",
              { key: 1897 },
              h(
                React.Fragment,
                { key: 1898 },
                "A personal site. The builds and views here are my own and do not speak for my employer.",
              ),
            ),
            " ",
          ),
          " ",
          h(
            "nav",
            {
              key: 1901,
              "aria-label": "Footer",
              style: style("display:flex;flex-direction:column;gap:10px;font-size:14px;align-items:flex-start"),
            },
            " ",
            h(
              "details",
              { key: 1903 },
              " ",
              h(
                "summary",
                {
                  key: 1905,
                  style: style(
                    "font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--cyan)",
                  ),
                },
                h(React.Fragment, { key: 1906 }, "Version history ▾"),
              ),
              " ",
              h(
                "div",
                {
                  key: 1908,
                  style: style(
                    "display:flex;flex-direction:column;gap:6px;padding:10px 0 4px 12px;border-left:2px solid var(--accent);margin-top:8px",
                  ),
                },
                " ",
                h(
                  "a",
                  { key: 1910, href: "/v39/" },
                  h(React.Fragment, { key: 1911 }, "V39.8 First Light · current public site"),
                ),
                " ",
                h(
                  "a",
                  { key: 1913, href: "https://cashio.us/odyssey.html" },
                  h(React.Fragment, { key: 1914 }, "V37.17 Continuum"),
                ),
                " ",
                h(
                  "a",
                  { key: 1916, href: "https://cashio.us/command-deck.html" },
                  h(React.Fragment, { key: 1917 }, "V35 · command deck, August 2026"),
                ),
                " ",
                h(
                  "a",
                  { key: 1919, href: "https://cashio.us/command.html" },
                  h(React.Fragment, { key: 1920 }, "May 2026 · command center archive"),
                ),
                " ",
                h(
                  "a",
                  { key: 1922, href: "https://github.com/jamescashio/jamescashio.github.io/blob/main/CHANGELOG.md" },
                  h(React.Fragment, { key: 1923 }, "Version history · changelog"),
                ),
                " ",
                h(
                  "a",
                  { key: 1925, href: "https://github.com/jamescashio/jamescashio.github.io/releases" },
                  h(React.Fragment, { key: 1926 }, "Tagged releases on GitHub"),
                ),
                " ",
              ),
              " ",
            ),
            " ",
            h(
              "a",
              { key: 1930, href: "https://github.com/jamescashio/jamescashio.github.io" },
              h(React.Fragment, { key: 1931 }, "View source"),
            ),
            " ",
            h(
              "a",
              { key: 1933, href: "https://cashio.us/cashio.html" },
              h(React.Fragment, { key: 1934 }, "My AI workspace · c"),
              h("span", { key: 1935, style: style("color:var(--accent)") }, h(React.Fragment, { key: 1936 }, "A")),
              h(React.Fragment, { key: 1937 }, "sh"),
              h("span", { key: 1938, style: style("color:var(--cyan)") }, h(React.Fragment, { key: 1939 }, "I")),
              h(React.Fragment, { key: 1940 }, "o →"),
            ),
            " ",
            h(
              "a",
              { key: 1942, href: "https://github.com/jamescashio/jamescashio.github.io/blob/main/PRIVACY.md" },
              h(React.Fragment, { key: 1943 }, "Privacy"),
            ),
            " ",
            h(
              "a",
              { key: 1945, href: "#top", style: style("color:var(--text)") },
              h(React.Fragment, { key: 1946 }, "Back to orbit ↑"),
            ),
            " ",
          ),
          " ",
        ),
        " ",
        h(
          "div",
          {
            key: 1950,
            "aria-hidden": "true",
            style: style("position:relative;overflow:hidden;border-top:1px solid var(--glass-border);padding:26px 0 0"),
          },
          " ",
          h(
            "div",
            {
              key: 1952,
              style: style(
                "font-family:var(--font-display);font-weight:900;font-size:clamp(84px,21vw,320px);line-height:.78;letter-spacing:-.01em;text-align:center;white-space:nowrap;color:transparent;-webkit-text-stroke:1px rgba(228,228,240,.14);user-select:none",
              ),
            },
            h(React.Fragment, { key: 1953 }, "c"),
            h(
              "span",
              {
                key: 1954,
                style: style("-webkit-text-stroke:1px rgba(255,149,0,.75);text-shadow:0 0 60px rgba(255,149,0,.25)"),
              },
              h(React.Fragment, { key: 1955 }, "A"),
            ),
            h(React.Fragment, { key: 1956 }, "sh"),
            h(
              "span",
              {
                key: 1957,
                style: style("-webkit-text-stroke:1px rgba(0,249,255,.75);text-shadow:0 0 60px rgba(0,249,255,.25)"),
              },
              h(React.Fragment, { key: 1958 }, "I"),
            ),
            h(React.Fragment, { key: 1959 }, "o"),
          ),
          " ",
          h("div", {
            key: 1961,
            style: style(
              "position:absolute;left:0;right:0;bottom:0;height:45%;background:linear-gradient(180deg,transparent,rgba(5,6,10,.95))",
            ),
          }),
          " ",
        ),
        " ",
        h(
          "div",
          {
            key: 1964,
            style: style(
              "max-width:1240px;margin:0 auto;padding:0 28px 34px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;font-family:var(--font-mono);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--text-dim)",
            ),
          },
          h("span", { key: 1965 }, h(React.Fragment, { key: 1966 }, "V40 · Two releases short of the answer")),
          h("span", { key: 1967 }, h(React.Fragment, { key: 1968 }, "Mostly harmless · Human in command")),
        ),
        " ",
      ),
      " ",
      " ",
      v.cinemaOpen
        ? h(
            React.Fragment,
            { key: 1972 },
            " ",
            h(
              "div",
              {
                key: 1974,
                id: "cinema-dialog",
                role: "dialog",
                "aria-modal": "true",
                tabIndex: "-1",
                "aria-label": v.cinemaTitle,
                style: style(
                  "position:fixed;inset:0;z-index:100;background:rgba(3,4,8,.95);backdrop-filter:blur(16px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;gap:18px;animation:v40-fade .45s cubic-bezier(.23,1,.32,1) both",
                ),
              },
              " ",
              h(
                "div",
                {
                  key: 1976,
                  style: style(
                    "width:min(100%,calc((100vh - 230px) * 16 / 9));display:flex;justify-content:space-between;align-items:center;gap:14px;font-family:var(--font-mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase",
                  ),
                },
                " ",
                h(
                  "span",
                  { key: 1978, style: style("display:flex;align-items:center;gap:10px;color:var(--accent)") },
                  h("span", {
                    key: 1979,
                    style: style("width:44px;height:10px;border-radius:9px 2px 2px 9px;background:var(--accent)"),
                  }),
                  h(
                    React.Fragment,
                    { key: 1980 },
                    "cAshIo screening room · ",
                    h("span", { className: "sc-interp", key: 1 }, v.cinemaColl),
                    "",
                  ),
                ),
                " ",
                h(
                  "button",
                  {
                    key: 1982,
                    type: "button",
                    onClick: v.closeCinema,
                    "aria-label": "Close",
                    style: style(
                      "background:var(--glass);border:1px solid var(--glass-border);border-radius:12px;color:var(--text);font-family:var(--font-mono);font-size:11px;letter-spacing:.14em;padding:8px 14px;cursor:pointer",
                    ),
                  },
                  h(React.Fragment, { key: 1983 }, "CLOSE × "),
                  h(
                    "span",
                    { key: 1984, style: style("color:var(--text-dim)") },
                    h(React.Fragment, { key: 1985 }, "ESC"),
                  ),
                ),
                " ",
              ),
              " ",
              h(
                "div",
                {
                  key: 1988,
                  style: style(
                    "position:relative;width:min(100%,calc((100vh - 230px) * 16 / 9));aspect-ratio:16/9;border-radius:20px;overflow:hidden;border:1px solid var(--glass-border);box-shadow:0 0 120px -20px rgba(0,249,255,.25),0 40px 120px rgba(0,0,0,.8);background:#000;animation:v40-rise .6s cubic-bezier(.23,1,.32,1) both",
                  ),
                },
                " ",
                h("video", {
                  key: 1990,
                  id: "cinema-video",
                  "data-bound-src": v.cinemaSrc,
                  "data-bound-poster": v.cinemaPoster,
                  controls: "",
                  playsInline: "",
                  style: style("position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000"),
                }),
                " ",
              ),
              " ",
              h(
                "div",
                {
                  key: 1993,
                  style: style(
                    "width:min(100%,calc((100vh - 230px) * 16 / 9));display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:16px",
                  ),
                },
                " ",
                h(
                  "div",
                  { key: 1995, style: style("display:flex;flex-direction:column;gap:6px;max-width:60ch") },
                  " ",
                  h(
                    "h3",
                    {
                      key: 1997,
                      style: style(
                        "font-family:var(--font-display);font-weight:900;font-size:clamp(20px,2.6vw,32px);margin:0;color:var(--text)",
                      ),
                    },
                    h(
                      React.Fragment,
                      { key: 1998 },
                      "",
                      h("span", { className: "sc-interp", key: 1 }, v.cinemaTitle),
                      "",
                    ),
                  ),
                  " ",
                  h(
                    "p",
                    { key: 2000, style: style("margin:0;color:var(--text-dim);font-size:15px;line-height:1.5") },
                    h(
                      React.Fragment,
                      { key: 2001 },
                      "",
                      h("span", { className: "sc-interp", key: 1 }, v.cinemaDesc),
                      "",
                    ),
                  ),
                  " ",
                ),
                " ",
                h(
                  "div",
                  { key: 2004, style: style("display:flex;gap:10px;align-items:center") },
                  " ",
                  h(
                    designSystem.Button,
                    { key: 2006, onClick: v.cinemaPrev, variant: "secondary", size: "sm" },
                    h(React.Fragment, { key: 2007 }, "◂ Previous"),
                  ),
                  " ",
                  h(
                    designSystem.Button,
                    { key: 2009, onClick: v.cinemaNext, size: "sm" },
                    h(React.Fragment, { key: 2010 }, "Next ▸"),
                  ),
                  " ",
                ),
                " ",
              ),
              " ",
            ),
            " ",
          )
        : null,
      " ",
      " ",
      v.alert
        ? h(
            React.Fragment,
            { key: 2017 },
            " ",
            h("div", {
              key: 2019,
              "aria-hidden": "true",
              style: style(
                "position:fixed;inset:0;z-index:90;pointer-events:none;box-shadow:inset 0 0 0 6px var(--red), inset 0 0 160px rgba(255,0,51,.5);animation:v40-alert .8s ease-in-out infinite",
              ),
            }),
            " ",
            h(
              "div",
              {
                key: 2021,
                role: "status",
                style: style(
                  "position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:91;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:12px;padding:30px 44px;border-radius:20px;background:rgba(14,0,5,.88);backdrop-filter:blur(10px);border:1px solid var(--red);box-shadow:0 0 80px var(--red-glow);text-align:center;animation:v40-rise .4s cubic-bezier(.23,1,.32,1) both",
                ),
              },
              " ",
              h(
                "span",
                {
                  key: 2023,
                  style: style("font-family:var(--font-mono);font-size:11px;letter-spacing:.3em;color:var(--red)"),
                },
                h(React.Fragment, { key: 2024 }, "RED ALERT · AUTHORIZATION ACCEPTED"),
              ),
              " ",
              h(
                "span",
                {
                  key: 2026,
                  style: style(
                    "font-family:var(--font-display);font-weight:900;font-size:clamp(36px,6vw,72px);letter-spacing:.14em;line-height:1;color:var(--text);text-shadow:0 0 30px var(--red-glow)",
                  ),
                },
                h(React.Fragment, { key: 2027 }, "DEFIANT"),
              ),
              " ",
              h(
                "span",
                {
                  key: 2029,
                  style: style(
                    "font-family:var(--font-mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--text-dim)",
                  ),
                },
                h(React.Fragment, { key: 2030 }, "Admiral Cashio · gloves off · all hands to stations"),
              ),
              " ",
            ),
            " ",
          )
        : null,
      " ",
      v.warp
        ? h(
            React.Fragment,
            { key: 2034 },
            " ",
            h("div", {
              key: 2036,
              "aria-hidden": "true",
              style: style(
                "position:fixed;inset:0;z-index:95;pointer-events:none;background:radial-gradient(circle at 50% 50%, rgba(255,255,255,.9), rgba(0,249,255,.5) 28%, rgba(10,10,15,0) 70%);animation:v40-flash .9s cubic-bezier(.23,1,.32,1) both",
              ),
            }),
            " ",
          )
        : null,
      " ",
    ),
    " ",
  );
}
