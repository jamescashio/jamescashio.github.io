import React, { useEffect, useRef, useState } from "react";
import { conservesData, reelSources } from "./media-policy.js";
const h = React.createElement;
const arrivalSeenStorage = "cashio-v41-arrival-seen";
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
export function HeroReel() {
  const player = useRef(null);
  const [sources, setSources] = useState([]);
  const [phase, setPhase] = useState("poster");
  const finish = () => {
    if (player.current) {
      player.current.dataset.finished = "true";
      player.current.pause();
    }
    setPhase("complete");
    try {
      sessionStorage.setItem(arrivalSeenStorage, "1");
    } catch {
      /* Optional storage. */
    }
    document.dispatchEvent(new Event("cashio-media"));
  };
  useEffect(() => {
    let seen;
    try {
      seen = sessionStorage.getItem(arrivalSeenStorage) === "1";
    } catch {
      seen = true;
    }
    if (seen || conservesData() || document.documentElement.dataset.motion === "off" || location.hash) return;
    const timer = setTimeout(() => {
      if (conservesData() || document.documentElement.dataset.motion === "off" || document.hidden) return;
      setSources(reelSources());
    }, 2200);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!sources.length) return;
    player.current.dataset.ready = "true";
    player.current.load();
    document.dispatchEvent(new Event("cashio-media"));
  }, [sources]);
  return h(
    React.Fragment,
    null,
    h(
      "div",
      { className: "hero-reel", "data-phase": phase, "aria-hidden": "true" },
      h("img", {
        className: "hero-live-poster",
        src: reelPoster,
        alt: "",
        width: 1280,
        height: 720,
        fetchPriority: "high",
      }),
      h(
        "video",
        {
          ref: player,
          id: "hero-video",
          muted: true,
          playsInline: true,
          preload: "none",
          poster: reelPoster,
          "data-noloop": "1",
          onEnded: finish,
          onError: finish,
          onPlaying: () => {
            setPhase("playing");
            try {
              sessionStorage.setItem(arrivalSeenStorage, "1");
            } catch {
              /* Optional storage. */
            }
          },
        },
        sources.map((source) => h("source", { key: source.src, ...source })),
      ),
    ),
    phase === "playing"
      ? h("button", { type: "button", className: "arrival-skip", onClick: finish }, "Skip intro")
      : null,
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
