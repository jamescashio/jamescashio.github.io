import React, { useEffect, useRef, useState } from "react";
import edit from "../../public/assets/sovereign/quick-sand.json";
import { conservesData } from "./media-policy.js";

const h = React.createElement;
const videoUrl = edit.originalUrl;

export function AiWormFilm() {
  const [playing, setPlaying] = useState(false);
  const card = useRef(null);
  const player = useRef(null);
  const playButton = useRef(null);

  useEffect(() => {
    const stopWhenHidden = () => {
      if (document.hidden) setPlaying(false);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio < 0.5) setPlaying(false);
      },
      { threshold: [0, 0.5, 1] },
    );
    observer.observe(card.current.querySelector(".ai-worm-media"));
    const stop = () => setPlaying(false);
    document.addEventListener("cashio-motion", stop);
    document.addEventListener("visibilitychange", stopWhenHidden);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", stopWhenHidden);
      document.removeEventListener("cashio-motion", stop);
    };
  }, []);

  useEffect(() => {
    if (playing) player.current?.focus({ preventScroll: true });
    document.dispatchEvent(new Event("cashio-media"));
  }, [playing]);

  function closePlayer() {
    setPlaying(false);
    requestAnimationFrame(() => playButton.current?.focus({ preventScroll: true }));
  }

  return h(
    "article",
    {
      id: "ai-worm",
      className: "ai-worm-film" + (playing ? " is-playing" : ""),
      "aria-labelledby": "ai-worm-title",
      ref: card,
    },
    h(
      "div",
      { className: "ai-worm-media" },
      playing
        ? h(
            "video",
            {
              ref: player,
              id: "ai-worm-video",
              "aria-label": "The Sovereign: Quick Sand Cut",
              src: (conservesData() ? edit.compact : edit.standard).src,
              controls: true,
              autoPlay: true,
              muted: true,
              playsInline: true,
              preload: "none",
              "data-noloop": "1",
              tabIndex: 0,
              onKeyDown: (event) => {
                if (event.key === "Escape" && !document.fullscreenElement) {
                  event.preventDefault();
                  closePlayer();
                }
              },
            },
            h("track", { kind: "captions", src: edit.captions.src, srcLang: "en", label: "English comedy captions" }),
          )
        : h(
            "button",
            {
              type: "button",
              className: "ai-worm-play",
              ref: playButton,
              onClick: () => setPlaying(true),
              "aria-label": "Play The Sovereign quick cut",
              "aria-describedby": "ai-worm-playback-note",
            },
            h("img", {
              src: "/assets/sovereign-v9-poster.webp",
              srcSet:
                "/v40/thumbs/sovereign-v9-poster-320.webp 320w, /v40/thumbs/sovereign-v9-poster-640.webp 640w, /v40/thumbs/sovereign-v9-poster-1280.webp 1280w",
              sizes: "(max-width: 600px) 96px, (max-width: 900px) 90vw, (max-width: 1179px) 65vw, 760px",
              alt: "Doug with blue eyes and a desert stillsuit in The Sovereign",
              width: 1280,
              height: 720,
              loading: "lazy",
              decoding: "async",
            }),
            h("span", { className: "ai-worm-play-icon", "aria-hidden": "true" }, "▷"),
            h("span", { className: "ai-worm-play-label" }, "PLAY THE SOVEREIGN QUICK CUT"),
          ),
    ),
    h(
      "div",
      { className: "ai-worm-copy" },
      h("p", { className: "ai-worm-kicker" }, "FEATURED PARODY · " + edit.durationLabel + " · QUICK SAND CUT"),
      h("h3", { id: "ai-worm-title" }, "The Sovereign"),
      h("p", { className: "ai-worm-tagline" }, "One man. Several providers. No remaining hobbies."),
      h(
        "div",
        { className: "ai-worm-actions" },
        h("a", { href: edit.youtubeUrl, target: "_blank", rel: "noopener noreferrer" }, "YouTube quick cut ↗"),
        playing
          ? h("button", { type: "button", onClick: closePlayer, className: "ai-worm-stop" }, "Close player ×")
          : null,
      ),
      h(
        "p",
        { id: "ai-worm-playback-note", className: "ai-worm-note" },
        "Starts muted. Stops when you leave this film.",
      ),
      h(
        "details",
        { className: "ai-worm-about" },
        h("summary", null, "About this film and credits"),
        h(
          "p",
          { className: "ai-worm-description" },
          "My AI journey since 2022, condensed into one very optimistic free trial. The worm is AI. The sand is apparently a dependency.",
        ),
        h("p", { className: "ai-worm-credit" }, edit.credit),
        h(
          "div",
          { className: "ai-worm-actions" },
          h("a", { href: videoUrl, target: "_blank", rel: "noopener noreferrer" }, "Full film on YouTube ↗"),
        ),
      ),
    ),
  );
}
