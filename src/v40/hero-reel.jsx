import React from "react";
import { reelSources } from "./media-policy.js";
const h = React.createElement;
export const reelPoster = "/assets/hero/cashio-v41-eagle-poster.webp";
export function ReelText() {
  return h(
    "details",
    { className: "hero-reel-text" },
    h("summary", null, "Film text version"),
    h(
      "p",
      null,
      "A ringed planet fills the horizon. A ship rests above a lamplit workshop, turns toward the sky and departs into the blue evening. A brass instrument catches the light. We return to the planet and the workshop. The machines can think. You still decide.",
    ),
  );
}
export function HeroPlanet() {
  return h(
    "div",
    { className: "hero-planet", "aria-hidden": "true" },
    h("img", {
      className: "hero-live-poster",
      src: reelPoster,
      alt: "",
      width: 1280,
      height: 720,
      fetchPriority: "high",
    }),
  );
}
export function CinemaReel({ title }) {
  return h(
    "video",
    {
      id: "cinema-video",
      className: "cinema-reel",
      controls: true,
      playsInline: true,
      muted: true,
      preload: "none",
      poster: reelPoster,
      "aria-label": title,
    },
    reelSources("replay").map((source) => h("source", { key: source.src, ...source })),
    h("track", {
      src: "/assets/hero/cashio-v41-eagle-text.vtt",
      kind: "captions",
      srcLang: "en",
      label: "Film description",
    }),
  );
}
