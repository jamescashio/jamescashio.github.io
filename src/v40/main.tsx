import "./chapters/opening.css";

// The complete reading edition is already present. Give its high priority
// poster a paint before downloading and hydrating the interactive component tree.
let requested = false;
let fallback = 0;
const activate = () => {
  if (requested) return;
  requested = true;
  clearTimeout(fallback);
  window.removeEventListener("pointerdown", activate);
  window.removeEventListener("keydown", activate);
  void import("./page-client").then(({ startPage }) => startPage());
};
const afterPaint = () => requestAnimationFrame(() => requestAnimationFrame(activate));
const container = document.getElementById("v40-root");
const poster = container?.querySelector<HTMLImageElement>(".hero-live-poster");
if (!container?.hasChildNodes() || !poster) activate();
else {
  window.addEventListener("pointerdown", activate, { once: true, passive: true });
  window.addEventListener("keydown", activate, { once: true });
  if (poster.complete) afterPaint();
  else {
    poster.addEventListener("load", afterPaint, { once: true });
    poster.addEventListener("error", afterPaint, { once: true });
  }
  // A slow or failed image must never hold up the page's controls.
  fallback = window.setTimeout(activate, 1500);
}
