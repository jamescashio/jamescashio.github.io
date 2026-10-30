export function conservesData() {
  if (typeof navigator === "undefined") return false;
  const connection = navigator.connection;
  return Boolean(connection?.saveData || /(^|slow-)2g|3g/.test(connection?.effectiveType || ""));
}
export function reelSources(kind = "replay") {
  const size = conservesData() ? "480p" : typeof window !== "undefined" && window.innerWidth <= 720 ? "720p" : "1080p";
  const base = "/assets/hero/cashio-v41-eagle-" + kind + "-" + size;
  return [
    { src: base + "-av1.mp4", type: 'video/mp4; codecs="av01.0.08M.08"' },
    { src: base + "-h264.mp4", type: "video/mp4" },
  ];
}
// All playback intent passes through one owner, including hover and dialogs.
export function installMediaCoordinator() {
  const observed = new Map();
  let disposed = false;
  const ratio = (video) => {
    const r = video.getBoundingClientRect();
    const area = r.width * r.height;
    return area
      ? (Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0)) *
          Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 68))) /
          area
      : 0;
  };
  const allowed = (video) => {
    if (!video.isConnected || document.hidden || video.dataset.finished === "true") return false;
    if (video.closest("details:not([open])")) return false;
    const cinema = document.querySelector("#cinema-video");
    if (cinema) return video === cinema;
    if (document.querySelector("#ai-worm iframe")) return false;
    if (document.querySelector("#mission-dialog[open], #bit-dialog[open], #helios-flight, #helios-studio"))
      return false;
    if (document.documentElement.dataset.motion === "off" || conservesData() || ratio(video) < 0.5) return false;
    if (video.id === "sig-video" || video.dataset.v === "hover") return video.dataset.requested === "true";
    return video.dataset.v === "auto";
  };
  const sync = () => {
    if (disposed) return;
    const candidates = [...observed.keys()].filter(allowed);
    const chosen =
      candidates.find((v) => v.id === "cinema-video") ||
      candidates.find((v) => v.dataset.requested === "true") ||
      candidates.sort((a, b) => ratio(b) - ratio(a))[0];
    for (const video of observed.keys()) if (video !== chosen && !video.paused) video.pause();
    if (chosen && chosen.id !== "cinema-video" && chosen.paused && !chosen.ended) {
      if (chosen.id !== "cinema-video") chosen.muted = true;
      chosen.play().catch(() => {});
    }
  };
  const observer = new IntersectionObserver(sync, { rootMargin: "-68px 0px 0px 0px", threshold: [0, 0.5, 1] });
  const register = () => {
    for (const [video, onPlay] of observed)
      if (!video.isConnected) {
        video.pause();
        observer.unobserve(video);
        video.removeEventListener("play", onPlay);
        observed.delete(video);
      }
    for (const video of document.querySelectorAll("#v40-root video"))
      if (!observed.has(video)) {
        video.preload = "none";
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.loop = video.dataset.noloop !== "1" && video.id !== "cinema-video";
        const onPlay = () => {
          if (!allowed(video)) {
            video.pause();
            return;
          }
          for (const other of observed.keys()) if (other !== video) other.pause();
        };
        observed.set(video, onPlay);
        video.addEventListener("play", onPlay);
        observer.observe(video);
      }
    sync();
  };
  const playbackNodes = "video, iframe, #mission-dialog, #bit-dialog, #helios-flight, #helios-studio";
  const mutation = new MutationObserver((records) => {
    const affectsPlayback = records.some((record) =>
      record.type === "attributes"
        ? record.target.matches("#mission-dialog, #bit-dialog")
        : [...record.addedNodes, ...record.removedNodes].some(
            (node) => node.nodeType === 1 && (node.matches(playbackNodes) || node.querySelector(playbackNodes)),
          ),
    );
    if (affectsPlayback) register();
  });
  // Scene dialogs are mounted beside the homepage. Their arrival must also
  // stop a background film, even if the homepage geometry does not change.
  mutation.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["open"] });
  const onMotion = () => {
    for (const video of observed.keys()) video.pause();
    sync();
  };
  document.addEventListener("cashio-motion", onMotion);
  const events = ["cashio-media", "visibilitychange"];
  events.forEach((event) => document.addEventListener(event, sync));
  navigator.connection?.addEventListener("change", sync);
  register();
  return () => {
    disposed = true;
    observer.disconnect();
    mutation.disconnect();
    events.forEach((event) => document.removeEventListener(event, sync));
    document.removeEventListener("cashio-motion", onMotion);
    navigator.connection?.removeEventListener("change", sync);
    for (const [video, listener] of observed) {
      video.pause();
      video.removeEventListener("play", listener);
    }
  };
}
