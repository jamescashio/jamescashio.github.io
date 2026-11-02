import { installMediaCoordinator } from "./media-policy.ts";


export function componentDidMount() {
  this.reduce = document.documentElement.dataset.motion === "off";
  window.cashioV40 = this;
  this.onResize = () => {
    this.viewportWidth = window.innerWidth;
    const wide = this.viewportWidth >= 1180;
    const navOn = this.viewportWidth >= 1100;
    if (!wide) {
      this.orbitPointer = { x: 0, y: 0 };
      const planet = document.querySelector(".hero-live-poster");
      if (planet) planet.style.transform = "";
    }
    if (this.state.wide !== wide || this.state.navOn !== navOn) this.setState({ wide, navOn });
  };
  if (this.props.initialWidth !== undefined) this.onResize();
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
    "eagle-film",
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
  // Let hydration finish before measuring and drawing the cinematic canvas.
  this.starsStartupRaf = requestAnimationFrame(() => {
    this.starsStartupRaf = 0;
    this.waitForCanvas();
  });
  this.stopMedia = installMediaCoordinator();
  this.setupReveal();
  this.lastFilm = this.state.film;
  this.installPolish();
  setTimeout(() => {
    if (!this.ioAlive) document.querySelectorAll('[data-rv="1"]').forEach((el) => this.reveal(el));
  }, 1600);
}

export function componentWillUnmount() {
  this.stopMedia?.();
  clearTimeout(this.foldT);
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
  cancelAnimationFrame(this.starsStartupRaf);
  clearTimeout(this.starsTimer);
  clearInterval(this.traceTimer);
  document.documentElement.style.overflow = "";
}

export function installPolish() {
  this.heroVisible = true;
  this.syncMotion = () => {
    this.reduce = document.documentElement.dataset.motion === "off";
    cancelAnimationFrame(this.raf);
    cancelAnimationFrame(this.fxRaf);

    document.dispatchEvent(new Event("cashio-media"));
    if (this.reduce) {
      this.orbitPointer = { x: 0, y: 0 };
      document.querySelectorAll("[data-reveal]").forEach((el) => this.reveal(el));
      document.querySelectorAll("[data-tilt], [data-mag], #hero-content, .hero-live-poster").forEach((el) => {
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
  // Initial motion and media intent are already installed. Measure the
  // progress effects once; later preference changes use syncMotion.
  this.scrollFx();
}
