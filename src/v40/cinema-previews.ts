import { conservesData } from "./media-policy";

// Hover previews in the screening room: silent three second loops cut from each film
// (scripts/build-cinema-previews.mjs). They load only on desktop with motion allowed and
// without Save Data, once the film library is near view. Playback keeps exactly one owner:
// the existing muted media coordinator, which starts a loop on hover and stops it on leave.
export function installCinemaPreviews() {
  const room = document.getElementById("films");
  if (!room) return () => {};
  const desktop = matchMedia("(min-width: 1000px) and (hover: hover) and (pointer: fine)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const allowed = () =>
    desktop.matches &&
    !reduced.matches &&
    !conservesData() &&
    !document.hidden &&
    document.documentElement.dataset.motion !== "off";
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || !allowed() || !(entry.target instanceof HTMLVideoElement)) continue;
        const video = entry.target;
        const source = video.dataset.previewSrc;
        if (!source?.startsWith("/v42/previews/") || video.dataset.previewReady) continue;
        video.muted = video.defaultMuted = true;
        video.playsInline = true;
        video.preload = "auto";
        // Decode a paused first frame before hover, so the loop starts without a blank frame.
        video.addEventListener(
          "loadeddata",
          () => {
            if (video.paused && video.dataset.requested !== "true") video.currentTime = 1 / 24;
          },
          { once: true },
        );
        video.src = source;
        video.dataset.previewReady = "true";
        video.load();
        observer.unobserve(video);
        document.dispatchEvent(new Event("cashio-media"));
      }
    },
    { rootMargin: "400px 0px" },
  );
  const refresh = () => {
    observer.disconnect();
    if (allowed())
      room
        .querySelectorAll<HTMLVideoElement>("video[data-preview-src]:not([data-preview-ready])")
        .forEach((video) => observer.observe(video));
  };
  const changed = new MutationObserver((records) => {
    if (
      records.some((record) =>
        [...record.addedNodes].some(
          (node) => node instanceof Element && (node.matches("video") || node.querySelector("video")),
        ),
      )
    )
      refresh();
  });
  changed.observe(room, { childList: true, subtree: true });
  desktop.addEventListener("change", refresh);
  reduced.addEventListener("change", refresh);
  navigator.connection?.addEventListener("change", refresh);
  document.addEventListener("cashio-motion", refresh);
  document.addEventListener("visibilitychange", refresh);
  refresh();
  return () => {
    observer.disconnect();
    changed.disconnect();
    desktop.removeEventListener("change", refresh);
    reduced.removeEventListener("change", refresh);
    navigator.connection?.removeEventListener("change", refresh);
    document.removeEventListener("cashio-motion", refresh);
    document.removeEventListener("visibilitychange", refresh);
  };
}
