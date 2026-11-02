import variants from "../../public/v40/poster-variants.json";
import { conservesData } from "./media-policy.ts";

// These original film derivatives already ship with the preserved media library.
const libraryVariants = Object.fromEntries(
  ["zenith-orbital-instrument-poster", "zenith-threshold-poster"].map((name) => [
    `/v40/assets/${name}.webp`,
    [320, 640, 1280].map((width) => ({ url: `/v40/thumbs/${name}-${width}.webp`, width })),
  ]),
);

export function posterSources(path) {
  return (variants[path] || libraryVariants[path])?.map(({ url, width }) => `${url} ${width}w`).join(", ");
}

export function posterForViewport(path, width) {
  const choices = variants[path] || libraryVariants[path];
  if (!choices) return path;
  const scale = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const desired = Math.min(width * scale, conservesData() ? 640 : 1280);
  return (choices.find((item) => item.width >= desired) || choices.at(-1)).url;
}
