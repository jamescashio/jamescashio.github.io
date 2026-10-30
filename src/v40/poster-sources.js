import variants from "../../public/v40/poster-variants.json";
import { conservesData } from "./media-policy.js";

export function posterSources(path) {
  return variants[path]?.map(({ url, width }) => `${url} ${width}w`).join(", ");
}

export function posterForViewport(path, width) {
  const choices = variants[path];
  if (!choices) return path;
  const scale = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const desired = Math.min(width * scale, conservesData() ? 640 : 1280);
  return (choices.find((item) => item.width >= desired) || choices.at(-1)).url;
}
