import React, { useEffect, useRef, useState } from "react";

const h = React.createElement;
const media = "/assets/hero/cashio-hero-v8";

export function HeroReel() {
  const video = useRef(null);
  const failedSources = useRef(new Set());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const player = video.current;
    const connection = navigator.connection;
    const conserveData = connection?.saveData || /(^|slow-)2g|3g/.test(connection?.effectiveType || "");
    let visible = false;
    let started = false;
    const markStarted = () => {
      started = true;
    };
    const sync = () => {
      if (!visible || document.hidden || document.documentElement.dataset.motion === "off") {
        player.pause();
      } else if (!started && !conserveData && !document.querySelector("#cinema-dialog")) {
        started = true;
        player.muted = true;
        player.play().catch(() => {});
      }
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio >= 0.2;
        sync();
      },
      { threshold: [0, 0.2] },
    );
    observer.observe(player);
    player.addEventListener("play", markStarted);
    document.addEventListener("cashio-motion", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      player.pause();
      player.removeEventListener("play", markStarted);
      document.removeEventListener("cashio-motion", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return h(
    "figure",
    { id: "hero-reel", className: "hero-reel", "aria-label": "cAshIo hero film, 36 seconds" },
    h(
      "video",
      {
        ref: video,
        id: "hero-reel-video",
        controls: true,
        muted: true,
        playsInline: true,
        preload: "none",
        poster: `${media}-poster.webp`,
        width: 1920,
        height: 1080,
        "aria-label": "cAshIo hero film, 36 seconds",
        "aria-describedby": "hero-reel-note",
        onCanPlay: () => setFailed(false),
        onError: (event) => {
          const player = event.currentTarget;
          if (event.target.tagName === "SOURCE") failedSources.current.add(event.target.src);
          const sources = [...player.querySelectorAll("source")].filter(
            (source) => !source.media || matchMedia(source.media).matches,
          );
          if (player.error || sources.every((source) => failedSources.current.has(source.src))) setFailed(true);
        },
      },
      h("source", { src: `${media}-720p.mp4`, type: "video/mp4", media: "(max-width: 720px)" }),
      h("source", { src: `${media}-1080p.mp4`, type: "video/mp4" }),
      h("track", { src: `${media}-text.vtt`, kind: "captions", srcLang: "en", label: "On screen text" }),
      h("a", { href: `${media}-1080p.mp4` }, "Watch the 36 second cAshIo film"),
    ),
    h(
      "figcaption",
      null,
      h("p", { className: "hero-reel-title" }, "cAshIo ", h("span", null, "36 seconds")),
      h("p", { id: "hero-reel-note" }, "Starts muted. Use the player for sound or full screen."),
      h(
        "details",
        { className: "hero-reel-text" },
        h("summary", null, "Text version"),
        h(
          "p",
          null,
          "Out past the noise. A hobby lab for local AI. A human in command. The machines can think. You still decide. Built at home. Open to inspect. Pick a world. Stay a while. Board the starship. Don’t panic. Say hello.",
        ),
        h(
          "p",
          null,
          "A ringed planet and the Zeus and Apollo ships introduce the workshop, its four worlds and the Starship lab. ",
          h("a", { href: "#evidence" }, "Lab figures reflect the October 3, 2026 record."),
        ),
      ),
      failed
        ? h(
            "p",
            { role: "status" },
            "The film could not play here. ",
            h("a", { href: `${media}-1080p.mp4` }, "Open the video directly"),
            " or read the text version.",
          )
        : null,
    ),
  );
}
