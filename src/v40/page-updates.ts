import type { PageHost } from "./page-model.ts";

export function componentDidUpdate(this: PageHost) {
  if (this.lastDiscovery !== this.state.discovery) {
    this.lastDiscovery = this.state.discovery;
    this.syncMotion?.();
  }
  if (
    this.lastScene !== this.state.scene ||
    this.lastSceneTurn !== this.state.sceneTurn ||
    this.lastCameraClose !== this.state.cameraClose
  ) {
    this.lastScene = this.state.scene;
    this.lastSceneTurn = this.state.sceneTurn;
    this.lastCameraClose = this.state.cameraClose;
    this.starDraw?.();
  }
  if (!this.starsStarted && !this.starsStartupRaf) this.waitForCanvas(0);
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
    if (v instanceof HTMLVideoElement) {
      v.load();
      document.dispatchEvent(new Event("cashio-media"));
    }
  }
  if (this.lastCinema !== this.state.cinema) {
    this.lastCinema = this.state.cinema;
    if (this.syncMotion) this.syncMotion();
    document.documentElement.style.overflow = this.state.cinema ? "hidden" : "";
    const v = document.getElementById("cinema-video");
    if (v instanceof HTMLVideoElement) {
      v.muted = true;
      v.load();
      document.dispatchEvent(new Event("cashio-media"));
    }
  }
}

export function applyScan(this: PageHost) {
  this.lastScan = this.props.scanlines;
  document.body.classList.toggle("za-scanlines", this.props.scanlines ?? true);
}

export async function copyValue(this: PageHost, text: string, key: "copied" | "emailCopied") {
  const update = (value: boolean | "failed") => {
    if (key === "copied") this.setState({ copied: value });
    else this.setState({ emailCopied: value });
  };
  try {
    await navigator.clipboard.writeText(text);
    update(true);
  } catch {
    update("failed");
  }
  setTimeout(() => update(false), 2400);
}
