import React, { useEffect, useRef, useState } from "react";

const h = React.createElement;
const videoUrl = "https://www.youtube.com/watch?v=382mPi4ON60";

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
        ? h("iframe", {
            ref: player,
            title: "The Sovereign: My Journey Riding the AI Worm, version 9",
            src: "https://www.youtube-nocookie.com/embed/382mPi4ON60?autoplay=1&mute=1&playsinline=1&rel=0",
            allow: "autoplay; encrypted-media; picture-in-picture; fullscreen",
            allowFullScreen: true,
            referrerPolicy: "strict-origin-when-cross-origin",
          })
        : h(
            "button",
            {
              type: "button",
              className: "ai-worm-play",
              ref: playButton,
              onClick: () => setPlaying(true),
              "aria-label": "Play The Sovereign, version 9",
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
            h("span", { className: "ai-worm-play-label" }, "PLAY THE SOVEREIGN"),
          ),
    ),
    h(
      "div",
      { className: "ai-worm-copy" },
      h("p", { className: "ai-worm-kicker" }, "FEATURED PARODY · 4:59 · VERSION 9"),
      h("h3", { id: "ai-worm-title" }, "The Sovereign"),
      h("p", { className: "ai-worm-tagline" }, "One man. Several providers. No remaining hobbies."),
      h(
        "div",
        { className: "ai-worm-actions" },
        h("a", { href: videoUrl, target: "_blank", rel: "noopener noreferrer" }, "Watch on YouTube ↗"),
        playing
          ? h("button", { type: "button", onClick: closePlayer, className: "ai-worm-stop" }, "Close player ×")
          : null,
      ),
      h(
        "p",
        { id: "ai-worm-playback-note", className: "ai-worm-note" },
        "YouTube loads after Play. Starts muted; stops when you leave this film.",
      ),
      h(
        "details",
        { className: "ai-worm-about" },
        h("summary", null, "About this film and credits"),
        h(
          "p",
          { className: "ai-worm-description" },
          "My AI journey since 2022, reimagined as an attempt to ride a very large worm. The worm is AI. The sand is apparently a dependency.",
        ),
        h(
          "p",
          { className: "ai-worm-credit" },
          "AI assisted likeness and original meme captions. Scene and soundtrack: Dune: Part Two. Unofficial fan parody.",
        ),
      ),
    ),
  );
}
