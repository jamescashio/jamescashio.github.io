import { snapshot, observedDate, fleetSummary, backupSummary, fleetLine } from "./evidence.js";
import { installMediaCoordinator } from "./media-policy.js";
import { frameDeltaSeconds, shouldRenderFrame } from "../lib/animation-timing.ts";
import { CinemaReel, ReelText, reelPoster } from "./hero-reel.jsx";
import { HeroSection } from "./sections/hero.jsx";
import { EagleFilmSection } from "./sections/eagle-film.jsx";
import { WorkshopSection } from "./sections/workshop.jsx";
import { WorldsSection } from "./sections/worlds.jsx";
import { FilmsSection } from "./sections/films.jsx";
import { RoutingSection } from "./sections/routing.jsx";
import { DecisionsSection } from "./sections/decisions.jsx";
import { ExperimentsSection } from "./sections/experiments.jsx";
import { MachinesSection } from "./sections/machines.jsx";
import { EvidenceSection } from "./sections/evidence.jsx";
import { OperatorSection } from "./sections/operator.jsx";
import { ContactSection } from "./sections/contact.jsx";
import React from "react";
import designSystem from "./design-system.js";
const h = React.createElement;
import { classFor } from "./style-variants.js";
const resources = {
  r_public_assets_zenith_celestial_signature_poster_webp: "/v40/assets/zenith-celestial-signature-poster.webp",
  r_public_assets_zenith_armillary_nocturne_poster_webp: "/v40/assets/zenith-armillary-nocturne-poster.webp",
  r_public_assets_zenith_armillary_detail_poster_webp: "/v40/assets/zenith-armillary-detail-poster.webp",
  r_public_assets_zenith_starship_blue_hour_poster_webp: "/v40/assets/zenith-starship-blue-hour-poster.webp",
  r_public_v38_assets_room_heritage_webp: "/v40/assets/room-heritage.webp",
  r_public_assets_zenith_orbital_dust_poster_webp: "/v40/assets/zenith-orbital-dust-poster.webp",
  r_public_assets_zenith_quiet_intelligence_poster_webp: "/v40/assets/zenith-quiet-intelligence-poster.webp",
  r_public_assets_zenith_the_long_view_poster_webp: "/v40/assets/zenith-the-long-view-poster.webp",
  r_public_assets_zenith_lamplight_prototype_poster_webp: "/v40/assets/zenith-lamplight-prototype-poster.webp",
  r_public_assets_zenith_portal_arrival_poster_webp: "/v40/assets/zenith-portal-arrival-poster.webp",
  r_public_v38_assets_room_starship_webp: "/v40/assets/room-starship.webp",
  r_public_assets_zenith_starship_flyby_poster_webp: "/v40/assets/zenith-starship-flyby-poster.webp",
  r_public_v38_assets_room_studios_threshold_webp: "/v40/assets/room-studios-threshold.webp",
  r_public_assets_zenith_starship_dockside_poster_webp: "/v40/assets/zenith-starship-dockside-poster.webp",
  r_public_assets_zenith_threshold_poster_webp: "/v40/assets/zenith-threshold-poster.webp",
  r_public_assets_zenith_ringed_horizon_poster_webp: "/v40/assets/zenith-ringed-horizon-poster.webp",
  r_public_v38_assets_room_principles_webp: "/v40/assets/room-principles.webp",
  r_public_assets_zenith_workshop_after_hours_poster_webp: "/v40/assets/zenith-workshop-after-hours-poster.webp",
  r_public_assets_zenith_orbital_instrument_poster_webp: "/v40/assets/zenith-orbital-instrument-poster.webp",
  r_public_assets_celestial_helios_arrival_poster_jpg: "/v40/assets/celestial-arrival-poster.webp",
};

const thumbnailSources = (path) =>
  [320, 640, 1280]
    .map(
      (width) =>
        `/v40/thumbs/${path
          .split("/")
          .pop()
          .replace(/\.webp$/, "")}-${width}.webp ${width}w`,
    )
    .join(", ");
export class V40Page extends React.Component {
  res(p) {
    const id = "r_" + p.replace(/[^a-z0-9]/gi, "_");
    return resources[id] || p;
  }
  state = {
    wide: typeof window !== "undefined" ? window.innerWidth >= 1180 : true,
    navOn: typeof window !== "undefined" ? window.innerWidth >= 1100 : true,
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
      ["d", "Page updated · October 23, 2026 · V41 Eagle"],
      [
        "d",
        "Fleet and latest backup integrity results were observed October 23, 2026. Unmeasured figures are withheld.",
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
    if (slug === "trailer") {
      const small =
        typeof window !== "undefined" && (window.innerWidth <= 720 || Boolean(navigator.connection?.saveData));
      return {
        slug,
        title: "House Cashio: The Trailer",
        desc: "A trailer parody · 61 seconds · Unmute for the score",
        coll: "House Cashio",
        src: "/assets/hero/cashio-trailer-" + (small ? "720p" : "1080p") + ".mp4",
        poster: "/assets/hero/cashio-trailer-poster.webp",
        captions: "/assets/hero/cashio-trailer-text.vtt",
        text: "A cold open: in a world where the machines can think. A star rush toward a ringed planet at a classified location. It is a house. He built a lab. At home. The garage was busy. The fleet is counted: two hosts, nineteen containers, one virtual machine, and the scheduled jobs, whose counts are blacked out and withheld. A record scratch freezes the frame: the scheduled jobs are on a break, and the counts stay withheld until they get back. In the dark, a subscription monolith rises with scrolling prices. Renewal in three days. The cancel button is not found. Only one crew could stand against it. Meet the machines: Zeus and Apollo, Hermes, Atlas, DSH, E.V.E. and Bit. Uptime. Backups. Snapshots. One very tired admin. A heighliner folds space to keep the lights on. House Cashio, rated MH, mostly harmless, while a cat on the planet's edge turns to the camera. The cat was not consulted. No clouds were harmed in the making of this film. One was slightly inconvenienced.",
        noloop: true,
      };
    }
    if (slug === "intro")
      return {
        slug,
        title: "Eagle",
        desc: "The workshop in orbit · 36 seconds · Sound effects available",
        coll: "cAshIo",
        src: "",
        poster: reelPoster,
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
          if (e.isIntersecting && this.state.active !== e.target.id) this.setState({ active: e.target.id });
        });
      },
      { rootMargin: `-${Math.round(innerHeight * 0.3)}px 0px -${Math.round(innerHeight * 0.45)}px 0px` },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) this.io.observe(el);
    });
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
        e.preventDefault();
        this.closeCinema();
        return;
      }
      if (this.state.cinema && e.target.tagName !== "VIDEO" && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
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
    this.stopMedia = installMediaCoordinator();
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
        document.dispatchEvent(new Event("cashio-media"));
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
        document.dispatchEvent(new Event("cashio-media"));
      }
    }
  }
  installPolish() {
    this.heroVisible = true;
    this.syncMotion = () => {
      this.reduce = document.documentElement.dataset.motion === "off";
      cancelAnimationFrame(this.raf);
      cancelAnimationFrame(this.fxRaf);

      document.dispatchEvent(new Event("cashio-media"));
      if (this.reduce) {
        document.querySelectorAll("[data-reveal]").forEach((el) => this.reveal(el));
        document.querySelectorAll("[data-tilt], [data-mag], #hero-content").forEach((el) => {
          el.style.transform = "";
          el.style.opacity = "";
        });
        document.querySelectorAll("[data-glare]").forEach((el) => (el.style.opacity = "0"));
      }

      if (this.heroVisible && this.starLoop) this.starLoop();
      this.scrollFx();
    };
    document.addEventListener("cashio-motion", this.syncMotion);
    document.addEventListener("visibilitychange", this.syncMotion);
    const headerHeight = Math.ceil(document.querySelector("header")?.getBoundingClientRect().height || 0);
    this.heroObserver = new IntersectionObserver(
      (es) => {
        this.heroVisible = es[0].isIntersecting;
        cancelAnimationFrame(this.raf);
        if (this.heroVisible && this.starLoop) this.starLoop();
      },
      { rootMargin: `-${headerHeight}px 0px 0px 0px` },
    );
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
    this.stopMedia?.();
    document.removeEventListener("cashio-motion", this.syncMotion);
    document.removeEventListener("visibilitychange", this.syncMotion);
    if (this.heroObserver) this.heroObserver.disconnect();
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("keydown", this.onKey);
    if (this.onStarResize) window.removeEventListener("resize", this.onStarResize);
    this.starResizeObserver?.disconnect();
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
      const heroScroll = Math.max(0, y - hc.offsetTop);
      const k = Math.min(1, heroScroll / 760);
      hc.style.transform = `translateY(${heroScroll * 0.2}px)`;
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
    const draw = (delta = 0) => {
      if (!c.isConnected) return;
      const reduce = this.reduce;
      t += delta;
      const warp = !reduce && Date.now() < (this.warpUntil || 0);
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
          s.x -= 2400 * delta * s.z * dpr;
          if (s.x < -len) s.x = w;
          continue;
        }
        const tw = reduce ? 1 : 0.55 + 0.45 * Math.sin(t * 1.6 + s.t);
        ctx.fillStyle = `rgba(228,228,240,${0.25 + 0.6 * tw * s.z})`;
        ctx.fillRect(s.x, s.y, 1.2 * s.z * dpr + 0.4, 1.2 * s.z * dpr + 0.4);
        if (!reduce) {
          s.x -= 2.4 * delta * s.z * dpr;
          if (s.x < 0) s.x = w;
        }
      }
      ctx.lineWidth = dpr;
    };
    let lastFrame = null;
    const loop = (timestamp) => {
      if (document.hidden || this.heroVisible === false || this.state.cinema || !c.isConnected) {
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
    const list = ["intro", "trailer", ...this.films.map((f) => f[1])];
    const i = list.indexOf(this.state.cinema);
    this.setState({ cinema: list[(i + d + list.length) % list.length] });
  }
  closeCinema() {
    this.setState({ cinema: null });
    window.dispatchEvent(new Event("cashio-cinema-close"));
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
        ["ok", fleetSummary],
        ["d", "Observed " + observedDate + " · counts describe running guests, not application health"],
      ],
      hosts: [
        ["ok", snapshot.cluster.hostsOnline + " hosts reporting running guests · quorum not measured"],
        ["d", "Per host guest counts and the hypervisor identity are withheld"],
      ],
      backups: [
        ["ok", backupSummary],
        ["d", snapshot.withheldReasons["backup.restoredFiles"]],
      ],
      atlas: [
        ["ok", "Model configuration withheld"],
        ["d", snapshot.withheldReasons["modelConfiguration.contextWindow"]],
      ],
      routes: [
        ["warn", "Public lanes: not verified"],
        ["d", snapshot.withheldReasons["lanes.public"]],
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
      "mostly harmless": [["lore", "LORE · V41, Eagle. One release short of the answer, and holding."]],
      spice: [["lore", "LORE · Spice flows on Arrakis. Private data stays home."]],
    };
    const lore = [
      "LORE · Eagle: V41 ships one release short of the answer.",
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

  hoverIn(e) {
    const video = e.currentTarget.querySelector("video");
    if (video) {
      video.dataset.requested = "true";
      video.style.opacity = "1";
      document.dispatchEvent(new Event("cashio-media"));
    }
  }
  hoverOut(e) {
    const video = e.currentTarget.querySelector("video");
    if (video) {
      video.dataset.requested = "false";
      video.style.opacity = "0";
      document.dispatchEvent(new Event("cashio-media"));
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

    const telemetry = [
      [String(snapshot.cluster.hostsOnline), snapshot.cluster.hostsOnline, "Hosts at probe", "var(--cyan)"],
      [String(snapshot.containers.running), snapshot.containers.running, "Containers running", "var(--cyan)"],
      [String(snapshot.virtualMachines.running), snapshot.virtualMachines.running, "Virtual machine", "var(--cyan)"],
      [
        String(snapshot.backup.latestVerified),
        snapshot.backup.latestVerified,
        "Latest backup checks passed",
        "var(--green)",
      ],
    ].map(([value, count, label, color]) => ({ value, count, label, color }));
    const tick = [
      [String(snapshot.cluster.hostsOnline), "hosts"],
      [String(snapshot.containers.running), "containers"],
      [String(snapshot.virtualMachines.running), "virtual machine"],
      [String(snapshot.backup.latestVerified), "latest backup checks passed"],
      ["October 2026", "dated observation"],
      ["Read only", "inventory probe"],
      ["Quality", "picks the model"],
      ["Cost", "only breaks a tie"],
    ];
    const tc = ["var(--cyan)", "var(--accent)", "var(--green)", "var(--purple)", "var(--amber)"];
    const tickerItems = [...tick, ...tick].map(([value, label], i) => ({
      value,
      label,
      color: tc[i % tc.length],
      duplicate: i >= tick.length,
    }));

    const enter = (e) => this.hoverIn(e),
      leave = (e) => this.hoverOut(e);
    const worlds = [
      {
        index: "01",
        name: "Starship lab",
        line: "Your ship. Your intelligence.",
        desc: "Pick a mission, cut the cloud link and compare three designs on the same twelve requests.",
        color: "var(--cyan)",
        href: "/rooms/starship/interactive/",
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
        href: "/rooms/principles/interactive/",
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
        href: "/rooms/studios/interactive/",
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
        href: "/rooms/heritage/interactive/",
        img: this.res("public/v38/assets/room-heritage.webp"),
        video: "",
        hasVideo: false,
      },
    ].map((w) => ({
      ...w,
      enter,
      leave,
      srcSet: thumbnailSources(w.img),
      alt: {
        "01": "A starship at rest above the blue evening workshop",
        "02": "A brass instrument with glowing orbital rings",
        "03": "A golden doorway opening toward a distant ringed world",
        "04": "Aviation drawings and instruments arranged on a workbench",
      }[w.index],
    }));

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
          alt: f[3],
          srcSet: thumbnailSources(this.res(`public/assets/zenith/${f[1]}-poster.webp`)),
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
        value: "Withheld",
        unit: "scheduler counts await a fresh probe",
        summary: "The scheduler turns a task into a job.",
        body: snapshot.withheldReasons["scheduler.enabled"],
        evidence: "October 2026 · Scheduler and routing not measured",
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
        evidence: "Conceptual operator console · October 2026",
        color: "cyan",
      },
      zeus: {
        title: "ZEUS",
        role: "My server",
        value: String(snapshot.cluster.hostsOnline),
        unit: "hosts reporting running guests",
        summary: "One of the two servers that do the computing.",
        body: fleetSummary + ". Observed " + observedDate + ". Per host guest counts are withheld.",
        evidence: "Fleet observation · " + observedDate,
        color: "cyan",
      },
      apollo: {
        title: "APOLLO",
        role: "My server",
        value: String(snapshot.containers.running),
        unit: "containers across both hosts",
        summary: "One of the two servers that do the computing.",
        body: fleetSummary + ". Observed " + observedDate + ". Per host guest counts are withheld.",
        evidence: "Fleet observation · " + observedDate,
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
      heroCols: s.wide ? "minmax(0,1fr) 260px" : "minmax(0,1fr)",
      heroMove: (e) => {
        if (this.reduce) return;
        const b = e.currentTarget.getBoundingClientRect();
        const nx = (e.clientX - b.left) / b.width - 0.5,
          ny = (e.clientY - b.top) / b.height - 0.5;
        const sp = document.getElementById("hero-spot");
        if (sp)
          sp.style.background = `radial-gradient(520px circle at ${(nx + 0.5) * 100}% ${(ny + 0.5) * 100}%, rgba(0,249,255,.11), transparent 60%)`;
      },
      boardShip: (e) => {
        e.preventDefault();
        this.warpFlash();
        window.location.hash = "flight=board";
      },
      openIntro: (e) => {
        e.preventDefault();
        this.setState({ cinema: "intro" });
      },
      telemetry,
      observedDate,
      fleetSummary,
      fleetLine,
      snapshot,
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
      cinemaIntro: s.cinema === "intro",
      cinemaSrc: C ? C.src : "",
      cinemaPoster: C ? C.poster : "",
      cinemaCaptions: C ? C.captions || "" : "",
      cinemaText: C ? C.text || "" : "",
      cinemaTitle: C ? C.title : "",
      cinemaDesc: C ? C.desc : "",
      cinemaColl: C ? C.coll : "",
      closeCinema: () => this.closeCinema(),
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
      expHref: "#experiment=" + E[0],
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
          v.dataset.requested = String(on);
          document.dispatchEvent(new Event("cashio-media"));
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
        className: classFor(
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
                className: "v41-694c044682",
              },
              " ",
              h(
                "a",
                {
                  key: 9,
                  href: "#top",
                  className: "v41-72a932cfed",
                },
                h(React.Fragment, { key: 10 }, "c"),
                h("span", { key: 11, className: "v41-097ae647c2" }, h(React.Fragment, { key: 12 }, "A")),
                h("span", { key: 13, className: "v41-aab9b2719f" }, h(React.Fragment, { key: 14 }, "I")),
              ),
              " ",
              h(
                "div",
                {
                  key: 16,
                  className: "v41-a0e1b1fc48",
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
                        { key: 20, href: v.r.href, title: v.r.label, className: classFor(v.r.style) },
                        " ",
                        h("span", {
                          key: 22,
                          className: "v41-b5d5368cf2",
                        }),
                        " ",
                        h(
                          "span",
                          {
                            key: 24,
                            className: "v41-cbba20e481",
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
                  className: "v41-2bad502360",
                },
                " ",
                h("span", {
                  key: 32,
                  className: "v41-44bf1c8cdd",
                }),
                " ",
                h("span", { key: 34, className: "v41-70386b085d" }),
                " ",
                h("span", {
                  key: 36,
                  className: "v41-538177e3b9",
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
          className: "v41-16a0aa070f",
        },
        " ",
        h(
          "div",
          {
            key: 47,
            className: "v41-d28b3b93ee",
          },
          " ",
          h(
            "a",
            {
              key: 49,
              href: "#top",
              "aria-label": "C cAshIo home",
              className: "v41-076bc5e3cc",
            },
            " ",
            h(
              "span",
              {
                key: 51,
                "aria-hidden": "true",
                className: "v41-0413664e13",
              },
              h(React.Fragment, { key: 52 }, "C"),
            ),
            " ",
            h(
              "span",
              {
                key: 54,
                className: "v41-9fb65157a3",
              },
              h(React.Fragment, { key: 55 }, "c"),
              h("span", { key: 56, className: "v41-097ae647c2" }, h(React.Fragment, { key: 57 }, "A")),
              h(React.Fragment, { key: 58 }, "sh"),
              h("span", { key: 59, className: "v41-aab9b2719f" }, h(React.Fragment, { key: 60 }, "I")),
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
                  { key: 65, "aria-label": "Primary", className: "v41-bc4448d493" },
                  " ",
                  h(
                    "a",
                    {
                      key: 67,
                      className: ["za-navlink", "v41-f959088bbe"].filter(Boolean).join(" "),
                      href: "#studies",
                    },
                    h(React.Fragment, { key: 68 }, "Try an experiment"),
                  ),
                  " ",
                  h(
                    "a",
                    {
                      key: 70,
                      className: ["za-navlink", "v41-f959088bbe"].filter(Boolean).join(" "),
                      href: "#workshop",
                    },
                    h(React.Fragment, { key: 71 }, "See real work"),
                  ),
                  " ",
                  h(
                    "a",
                    {
                      key: 73,
                      className: ["za-navlink", "v41-f959088bbe"].filter(Boolean).join(" "),
                      href: "#rooms",
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
            { key: 77, className: "v41-21f61ee01b" },
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
            className: "v41-78c018d829",
          },
          h("div", {
            key: 104,
            id: "scroll-prog",
            className: "v41-514cfd682d",
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
        h(HeroSection, { v, key: "top" }),
        " ",
        " ",
        h(
          "div",
          {
            key: 278,
            "aria-label": "Lab telemetry ticker",
            className: "v41-981bd39a63",
          },
          " ",
          h(
            "div",
            { key: 280, className: "v41-85ec42eba3" },
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
                      "aria-hidden": v.t.duplicate || undefined,
                      className: "v41-301f26150c",
                    },
                    h(
                      "span",
                      {
                        key: 285,
                        className: classFor(
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
                    h("span", { key: 288, className: "v41-d4e594e791" }, h(React.Fragment, { key: 289 }, "◆")),
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
        h(EagleFilmSection, { v, key: "eagle-film" }),
        h(WorkshopSection, { v, key: "workshop" }),
        " ",
        " ",
        h(WorldsSection, { v, key: "rooms" }),
        " ",
        " ",
        h(FilmsSection, { v, key: "films" }),
        " ",
        " ",
        h(RoutingSection, { v, key: "law" }),
        " ",
        " ",
        h(DecisionsSection, { v, key: "work" }),
        " ",
        " ",
        h(ExperimentsSection, { v, key: "studies" }),
        " ",
        " ",
        h(MachinesSection, { v, key: "universe" }),
        " ",
        " ",
        h(EvidenceSection, { v, key: "evidence" }),
        " ",
        " ",
        h(OperatorSection, { v, key: "operator" }),
        " ",
        " ",
        h(ContactSection, { v, key: "contact" }),
        " ",
      ),
      " ",
      " ",
      h(
        "footer",
        { key: 1879, className: "v41-cf9133e23d" },
        " ",
        h(
          "div",
          {
            key: 1881,
            className: "v41-cbfac2beab",
          },
          " ",
          h(
            "div",
            {
              key: 1883,
              className: "v41-efdd1fcb3d",
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
                className: "v41-8f81cfc173",
              },
              h(React.Fragment, { key: 1895 }, "V41 · Eagle · Directed by Doug Cashio · October 23, 2026"),
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
              className: "v41-71671bf373",
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
                  className: "v41-f06fd064ed",
                },
                h(React.Fragment, { key: 1906 }, "Version history ▾"),
              ),
              " ",
              h(
                "div",
                {
                  key: 1908,
                  className: "v41-f504f7344d",
                },
                " ",
                h(
                  "a",
                  { key: 1910, href: "/v39/" },
                  h(React.Fragment, { key: 1911 }, "V39.8 First Light · preserved edition"),
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
                  h(React.Fragment, { key: 1917 }, "V35 · preserved command deck"),
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
              h("span", { key: 1935, className: "v41-097ae647c2" }, h(React.Fragment, { key: 1936 }, "A")),
              h(React.Fragment, { key: 1937 }, "sh"),
              h("span", { key: 1938, className: "v41-aab9b2719f" }, h(React.Fragment, { key: 1939 }, "I")),
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
              { key: 1945, href: "#top", className: "v41-6c41898cb4" },
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
            className: "v41-b34bc5cf1f",
          },
          " ",
          h(
            "div",
            {
              key: 1952,
              className: "v41-3f2cedb09e",
            },
            h(React.Fragment, { key: 1953 }, "c"),
            h(
              "span",
              {
                key: 1954,
                className: "v41-9a8ee10d86",
              },
              h(React.Fragment, { key: 1955 }, "A"),
            ),
            h(React.Fragment, { key: 1956 }, "sh"),
            h(
              "span",
              {
                key: 1957,
                className: "v41-a5a4adb222",
              },
              h(React.Fragment, { key: 1958 }, "I"),
            ),
            h(React.Fragment, { key: 1959 }, "o"),
          ),
          " ",
          h("div", {
            key: 1961,
            className: "v41-147bbdb8eb",
          }),
          " ",
        ),
        " ",
        h(
          "div",
          {
            key: 1964,
            className: "v41-b9be7637a3",
          },
          h("span", { key: 1965 }, h(React.Fragment, { key: 1966 }, "V41 · One release short of the answer")),
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
                className: "v41-ebed93abae",
              },
              " ",
              h(
                "div",
                {
                  key: 1976,
                  className: "v41-1c5f6b86c5",
                },
                " ",
                h(
                  "span",
                  { key: 1978, className: "v41-8e316bb9ff" },
                  h("span", {
                    key: 1979,
                    className: "v41-988e550a7d",
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
                    className: "v41-caf7b8450f",
                  },
                  h(React.Fragment, { key: 1983 }, "CLOSE × "),
                  h("span", { key: 1984, className: "v41-c471889143" }, h(React.Fragment, { key: 1985 }, "ESC")),
                ),
                " ",
              ),
              " ",
              h(
                "div",
                {
                  key: 1988,
                  className: "v41-cce017b3ed",
                },
                " ",
                v.cinemaIntro
                  ? h(CinemaReel, { key: "intro-replay", title: v.cinemaTitle })
                  : h(
                      "video",
                      {
                        key: 1990,
                        id: "cinema-video",
                        "data-bound-src": v.cinemaSrc,
                        "data-bound-poster": v.cinemaPoster,
                        controls: true,
                        preload: "none",
                        playsInline: "",
                        className: "v41-f28b60f056",
                      },
                      v.cinemaCaptions
                        ? h("track", {
                            key: "captions",
                            kind: "captions",
                            src: v.cinemaCaptions,
                            srcLang: "en",
                            label: "English",
                          })
                        : null,
                    ),
                " ",
              ),
              " ",
              h(
                "div",
                {
                  key: 1993,
                  className: "v41-8ae1437585",
                },
                " ",
                h(
                  "div",
                  { key: 1995, className: "v41-5caaecb449" },
                  " ",
                  h(
                    "h3",
                    {
                      key: 1997,
                      className: "v41-8a9b37c22b",
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
                    { key: 2000, className: "v41-20ce106e78" },
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
                  { key: 2004, className: "v41-f44596820e" },
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
                h(ReelText, v.cinemaText ? { text: v.cinemaText } : undefined),
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
              className: "v41-ab7029070b",
            }),
            " ",
            h(
              "div",
              {
                key: 2021,
                role: "status",
                className: "v41-efe344152b",
              },
              " ",
              h(
                "span",
                {
                  key: 2023,
                  className: "v41-f78856783d",
                },
                h(React.Fragment, { key: 2024 }, "RED ALERT · AUTHORIZATION ACCEPTED"),
              ),
              " ",
              h(
                "span",
                {
                  key: 2026,
                  className: "v41-48ce9adfac",
                },
                h(React.Fragment, { key: 2027 }, "DEFIANT"),
              ),
              " ",
              h(
                "span",
                {
                  key: 2029,
                  className: "v41-fbe7d8490f",
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
              className: "v41-c11f17ab63",
            }),
            " ",
          )
        : null,
      " ",
    ),
    " ",
  );
}
