
export function tilt(e) {
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

export function magnet(e) {
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

export function hoverIn(e) {
  const video = e.currentTarget.querySelector("video");
  if (video) {
    video.dataset.requested = "true";
    video.style.opacity = "1";
    document.dispatchEvent(new Event("cashio-media"));
  }
}

export function hoverOut(e) {
  const video = e.currentTarget.querySelector("video");
  if (video) {
    video.dataset.requested = "false";
    video.style.opacity = "0";
    document.dispatchEvent(new Event("cashio-media"));
  }
}

export function warpFlash() {
  if (this.reduce || document.hidden) return;
  this.warpUntil = Date.now() + 1400;
  clearTimeout(this.warpT);
  this.setState({ warp: true });
  this.warpT = setTimeout(() => this.setState({ warp: false }), 950);
}

export function defiant() {
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
