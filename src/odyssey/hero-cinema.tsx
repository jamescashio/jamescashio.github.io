import { useCallback, useEffect, useRef, useState } from "react";

type ScenePlayback = "still" | "loading" | "playing" | "paused" | "ended" | "error";

/** An explicitly played, finite artwork. The original hero stays the loading fallback. */
export function HeroCinema({ blocked }: { blocked: boolean }) {
  const controls = useRef<HTMLDivElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const player = useRef<HTMLVideoElement | null>(null);
  const hero = useRef<HTMLElement | null>(null);
  const blockedNow = useRef(blocked);
  const visible = useRef(true);
  const mounted = useRef(false);
  const intent = useRef(false);
  const generation = useRef(0);
  const frame = useRef<number | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [playback, setPlayback] = useState<ScenePlayback>("still");
  blockedNow.current = blocked;

  const markFrame = useCallback((active: boolean) => {
    if (!hero.current) return;
    if (active) hero.current.dataset.vectorScene = "active";
    else delete hero.current.dataset.vectorScene;
  }, []);
  const prohibited = useCallback(
    () =>
      blockedNow.current ||
      !visible.current ||
      document.hidden ||
      !!document.querySelector('dialog:modal, dialog[open][aria-modal="true"]'),
    [],
  );
  const cancelFrame = useCallback(() => {
    if (frame.current !== null) player.current?.cancelVideoFrameCallback?.(frame.current);
    frame.current = null;
  }, []);
  const pause = useCallback(() => {
    intent.current = false;
    generation.current += 1;
    player.current?.pause();
    if (mounted.current)
      setPlayback((current) => (current === "playing" || current === "loading" ? "paused" : current));
  }, []);
  const fail = useCallback(
    (video: HTMLVideoElement) => {
      if (!mounted.current || player.current !== video) return;
      pause();
      cancelFrame();
      markFrame(false);
      setPlayback("error");
    },
    [pause, cancelFrame, markFrame],
  );
  const requestPlay = useCallback(
    async (video: HTMLVideoElement) => {
      if (!intent.current || prohibited()) {
        pause();
        return;
      }
      const request = generation.current;
      try {
        await video.play();
        if (player.current !== video || !intent.current || prohibited()) video.pause();
      } catch {
        if (player.current === video && intent.current && request === generation.current) fail(video);
      }
    },
    [prohibited, pause, fail],
  );
  const attach = useCallback(
    (video: HTMLVideoElement | null) => {
      if (player.current === video) return;
      generation.current += 1;
      cancelFrame();
      const previous = player.current;
      player.current = video;
      previous?.pause();
      if (video && intent.current) void requestPlay(video);
    },
    [cancelFrame, requestPlay],
  );
  const decoded = useCallback(
    (video: HTMLVideoElement) => {
      if (player.current !== video || video.readyState < 2 || video.error) return;
      cancelFrame();
      if (video.requestVideoFrameCallback) {
        frame.current = video.requestVideoFrameCallback(() => {
          frame.current = null;
          if (mounted.current && player.current === video && !video.error) markFrame(true);
        });
      } else markFrame(true);
    },
    [cancelFrame, markFrame],
  );

  useEffect(() => {
    mounted.current = true;
    hero.current = controls.current?.closest<HTMLElement>(".o-hero") ?? null;
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    const artwork = hero.current?.querySelector<HTMLElement>(".o-hero-art:not(video)") ?? hero.current;
    const headerHeight = Math.ceil(document.querySelector(".o-header")?.getBoundingClientRect().height ?? 0);
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.filter((candidate) => candidate.target === artwork).at(-1);
        if (!entry) return;
        visible.current = entry.isIntersecting && entry.intersectionRatio > 0.05;
        if (!visible.current) pause();
      },
      { rootMargin: `-${headerHeight}px 0px 0px 0px`, threshold: 0.05 },
    );
    if (artwork) observer.observe(artwork);
    const dialogs = new MutationObserver(() => {
      if (document.querySelector('dialog:modal, dialog[open][aria-modal="true"]')) pause();
    });
    dialogs.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["open", "aria-modal"],
    });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      mounted.current = false;
      intent.current = false;
      generation.current += 1;
      cancelFrame();
      player.current?.pause();
      player.current?.removeAttribute("src");
      player.current?.load();
      markFrame(false);
      observer.disconnect();
      dialogs.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pause, cancelFrame, markFrame]);
  useEffect(() => {
    if (blocked) pause();
  }, [blocked, pause]);

  function toggle() {
    if (playback === "playing" || playback === "loading") {
      pause();
      return;
    }
    if (prohibited()) return;
    generation.current += 1;
    intent.current = true;
    setPlayback("loading");
    const video = player.current;
    if (!video) setEnabled(true);
    else {
      if (video.error || playback === "error") {
        markFrame(false);
        video.load();
      } else if (video.ended) video.currentTime = 0;
      void requestPlay(video);
    }
  }
  function restore() {
    pause();
    cancelFrame();
    markFrame(false);
    const previous = player.current;
    player.current = null;
    previous?.removeAttribute("src");
    previous?.load();
    setEnabled(false);
    setPlayback("still");
    primary.current?.focus({ preventScroll: true });
  }

  const label =
    playback === "playing" || playback === "loading"
      ? "Pause scene"
      : playback === "paused"
        ? "Resume scene"
        : playback === "ended"
          ? "Replay scene"
          : playback === "error"
            ? "Retry scene"
            : "Awaken the scene";
  return (
    <>
      {enabled && (
        <video
          ref={attach}
          className="o-hero-art vc-film"
          src="/assets/lightwake/lightwake-awakens.mp4"
          preload="none"
          muted
          playsInline
          aria-hidden="true"
          tabIndex={-1}
          onLoadedData={(event) => decoded(event.currentTarget)}
          onPlaying={(event) => {
            if (player.current !== event.currentTarget) return;
            if (!intent.current || prohibited()) pause();
            else {
              setPlayback("playing");
              decoded(event.currentTarget);
            }
          }}
          onPause={(event) => {
            if (mounted.current && player.current === event.currentTarget && event.currentTarget.paused)
              setPlayback((current) => (current === "playing" ? "paused" : current));
          }}
          onEnded={(event) => {
            if (!mounted.current || player.current !== event.currentTarget || !event.currentTarget.ended) return;
            intent.current = false;
            setPlayback("ended");
          }}
          onError={(event) => fail(event.currentTarget)}
        />
      )}
      <div ref={controls} className="vc-controls" data-playback={playback}>
        <button ref={primary} type="button" onClick={toggle} disabled={blocked}>
          {label}
        </button>
        {enabled && (
          <button type="button" onClick={restore}>
            Restore still artwork
          </button>
        )}
        <span role="status" className="o-sr-only">
          {blocked
            ? "Scene playback is paused. Resume global motion to play."
            : playback === "error"
              ? "The scene could not load. Retry or restore the original artwork."
              : playback === "loading"
                ? "Preparing the eight-second silent scene."
                : playback === "ended"
                  ? "Scene complete. Replay or restore the original artwork."
                  : "An eight-second silent scene. Plays only when you choose."}
        </span>
      </div>
    </>
  );
}
