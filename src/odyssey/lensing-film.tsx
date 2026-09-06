import { useCallback, useEffect, useRef, useState } from "react";
import "./lensing-film.css";

type Playback = "still" | "loading" | "seeking" | "playing" | "paused" | "ended" | "error";
export type LensingClip = "signature" | "awakening" | "arrival";
type SeekMedia = {
  player: HTMLVideoElement;
  source: string;
  controller: AbortController;
  kind: "native" | "blob";
  ranges: "unknown" | "supported" | "unavailable";
  url: string | null;
  loading: Promise<void> | null;
};

const CLIPS = {
  signature: {
    title: "The signature awakens",
    duration: 6,
    durationLabel: "A SIX-SECOND FILM",
    film: "/assets/celestial/signature-awakens.mp4",
    poster: "/assets/celestial/signature-awakens-poster.webp",
    description: "Gold takes form. Blue light finds its orbit. A signature comes alive.",
  },
  awakening: {
    title: "The gate awakens",
    duration: 6,
    durationLabel: "A SIX-SECOND FILM",
    film: "/assets/lensing/gate-awakens.mp4",
    poster: "/assets/lensing/gate-awakens-poster.webp",
    description: "An imagined orbital gate gathers light above a distant planet.",
  },
  arrival: {
    title: "Orbital arrival",
    duration: 5,
    durationLabel: "A FIVE-SECOND FILM",
    film: "/assets/lensing/orbital-arrival.mp4",
    poster: "/assets/lensing/orbital-arrival-poster.webp",
    description: "An imagined orbital gate, a distant planet, a quiet approach.",
  },
} as const;

function timecode(seconds: number) {
  return `0:${seconds.toFixed(1).padStart(4, "0")}`;
}

function canSeekTo(player: HTMLVideoElement, seconds: number) {
  const ranges = player.seekable;
  return Array.from({ length: ranges.length }, (_, index) => index).some(
    (index) => ranges.start(index) <= seconds && ranges.end(index) >= seconds,
  );
}

export default function LensingFilm({
  motion,
  onClose,
  initialClip = "awakening",
  onExplore,
  onSignature,
}: {
  motion: boolean;
  onClose: () => void;
  initialClip?: LensingClip;
  onExplore: () => void;
  onSignature?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const request = useRef(0);
  const playbackIntent = useRef<HTMLVideoElement | null>(null);
  const mounted = useRef(false);
  const pendingSeek = useRef<number | null>(null);
  const seekMedia = useRef<SeekMedia | null>(null);
  const [clipId, setClipId] = useState<LensingClip>(initialClip);
  const [playback, setPlayback] = useState<Playback>("still");
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState<number>(CLIPS[initialClip].duration);
  const clip = CLIPS[clipId];
  const active = playback === "playing" || playback === "loading";

  const releaseSeekMedia = useCallback(() => {
    const previous = seekMedia.current;
    seekMedia.current = null;
    previous?.controller.abort();
    if (previous?.url) URL.revokeObjectURL(previous.url);
  }, []);

  const attachPlayer = useCallback(
    (player: HTMLVideoElement | null) => {
      if (video.current !== player) {
        request.current += 1;
        playbackIntent.current = null;
        video.current?.pause();
        releaseSeekMedia();
        video.current = player;
        pendingSeek.current = null;
      }
    },
    [releaseSeekMedia],
  );

  const pauseFilm = useCallback(() => {
    request.current += 1;
    playbackIntent.current = null;
    video.current?.pause();
    setPlayback((current) => (current === "playing" || current === "loading" ? "paused" : current));
  }, []);

  const isCurrentPlayer = useCallback((player: HTMLVideoElement) => {
    return mounted.current && player === video.current && dialog.current?.open;
  }, []);

  const failMedia = useCallback(
    (player: HTMLVideoElement) => {
      if (!isCurrentPlayer(player)) return;
      request.current += 1;
      pendingSeek.current = null;
      playbackIntent.current = null;
      seekMedia.current?.controller.abort();
      player.pause();
      setPlayback("error");
    },
    [isCurrentPlayer],
  );

  const playRequested = useCallback(
    async (player: HTMLVideoElement, generation: number) => {
      try {
        await player.play();
        if (!isCurrentPlayer(player) || document.hidden || playbackIntent.current !== player) player.pause();
      } catch {
        if (isCurrentPlayer(player) && generation === request.current) {
          playbackIntent.current = null;
          setPlayback("error");
        }
      }
    },
    [isCurrentPlayer],
  );

  const prepareSeekFallback = useCallback(
    (player: HTMLVideoElement, prepared: SeekMedia): Promise<void> => {
      if (prepared.loading) return prepared.loading;
      prepared.loading = (async () => {
        try {
          // Probe only after an explicit seek has loaded native metadata. A
          // byte-range host must keep its native URL, including under a CSP
          // that permits same-origin media but intentionally excludes Blobs.
          const response = await fetch(prepared.source, {
            signal: prepared.controller.signal,
            credentials: "same-origin",
            // A cached full response can synthesize206 locally even when the
            // server ignores ranges. Probe the host, not that browser cache.
            cache: "no-store",
            headers: { Range: "bytes=0-0" },
          });
          if (!response.ok) throw new Error("Film download failed");
          if (response.status === 206) {
            prepared.ranges = "supported";
            await response.body?.cancel();
            return;
          }
          if (response.status !== 200) throw new Error("Unknown film range response");
          prepared.ranges = "unavailable";
          const maximum = 8 * 1024 * 1024;
          if (Number(response.headers.get("content-length")) > maximum) throw new Error("Film exceeds seek budget");
          const blob = await response.blob();
          if (!blob.size || blob.size > maximum) throw new Error("Invalid film size");
          if (
            seekMedia.current !== prepared ||
            prepared.controller.signal.aborted ||
            !isCurrentPlayer(player) ||
            pendingSeek.current === null
          )
            return;
          // Native ranges can become available while the probe is in flight.
          // Keep that functioning timeline instead of replacing its source.
          if (canSeekTo(player, pendingSeek.current)) {
            prepared.ranges = "supported";
            return;
          }
          prepared.url = URL.createObjectURL(new Blob([blob], { type: "video/mp4" }));
          prepared.kind = "blob";
          player.src = prepared.url;
          player.preload = "auto";
          player.load();
        } catch {
          if (
            seekMedia.current === prepared &&
            !prepared.controller.signal.aborted &&
            isCurrentPlayer(player) &&
            pendingSeek.current !== null
          )
            failMedia(player);
        } finally {
          prepared.loading = null;
        }
      })();
      return prepared.loading;
    },
    [isCurrentPlayer, failMedia],
  );

  // Stable ref-reading callbacks let visibility resume a manual frame request
  // without restarting the modal or reviving a cancelled playback request.
  const finishPendingSeek = useCallback(
    function finish(player: HTMLVideoElement) {
      const target = pendingSeek.current;
      const prepared = seekMedia.current;
      if (target === null || !isCurrentPlayer(player) || !prepared || prepared.player !== player) return;
      // A successful range probe does not repair a native decoding/network
      // failure. Surface it even if the player has no metadata to finish with.
      if (player.error) {
        failMedia(player);
        return;
      }
      if (
        document.hidden ||
        player.currentSrc !== (prepared.url ?? prepared.source) ||
        player.readyState < 1 ||
        !Number.isFinite(player.duration) ||
        player.seeking
      )
        return;
      const seconds = Math.max(0, Math.min(target, player.duration - 0.04));
      if (Math.abs(player.currentTime - seconds) > 0.06) {
        if (canSeekTo(player, seconds)) {
          if (prepared.kind === "native") prepared.ranges = "supported";
          player.currentTime = seconds;
        } else if (prepared.kind === "native" && prepared.ranges !== "supported" && !prepared.loading) {
          void prepareSeekFallback(player, prepared).then(() => finish(player));
        }
        return;
      }
      if (player.readyState < 2) return;
      pendingSeek.current = null;
      setElapsed(player.currentTime);
      if (playbackIntent.current === player) {
        setPlayback("loading");
        void playRequested(player, request.current);
      } else setPlayback("paused");
    },
    [isCurrentPlayer, playRequested, prepareSeekFallback, failMedia],
  );

  useEffect(() => {
    mounted.current = true;
    const panel = dialog.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (panel && !panel.open) panel.showModal();
    close.current?.focus({ preventScroll: true });
    const visibility = () => {
      if (document.hidden) pauseFilm();
      else if (video.current) finishPendingSeek(video.current);
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      mounted.current = false;
      request.current += 1;
      playbackIntent.current = null;
      video.current?.pause();
      pendingSeek.current = null;
      releaseSeekMedia();
      panel?.close();
      document.body.style.overflow = overflow;
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [pauseFilm, releaseSeekMedia, finishPendingSeek]);

  useEffect(() => {
    // A later explicit Play is allowed; ambient motion never starts the film.
    if (!motion) pauseFilm();
  }, [motion, pauseFilm]);

  function dismiss() {
    pauseFilm();
    onClose();
  }

  function selectClip(next: LensingClip) {
    if (next === clipId) return;
    pauseFilm();
    setClipId(next);
    setPlayback("still");
    setElapsed(0);
    setDuration(CLIPS[next].duration);
  }

  function prepareSeekMedia(player: HTMLVideoElement) {
    const previous = seekMedia.current;
    if (previous?.player === player && !player.error && !previous.controller.signal.aborted) return;
    const restoreSource = Boolean(player.error || previous?.url);
    releaseSeekMedia();
    const source = new URL(clip.film, location.href);
    if (source.origin !== location.origin) return;
    seekMedia.current = {
      player,
      source: source.href,
      controller: new AbortController(),
      kind: "native",
      ranges: "unknown",
      url: null,
      loading: null,
    };
    // Explicit seeking opts into native loading once. Subsequent chapter or
    // scrub requests reuse a healthy load; a failed preparation starts fresh.
    if (restoreSource) player.src = source.href;
    player.preload = "auto";
    if (restoreSource || player.readyState === 0) player.load();
  }

  function seekFilm(seconds: number) {
    const player = video.current;
    if (!player || document.hidden || !dialog.current?.open) return;
    pauseFilm();
    const target = Math.max(0, Math.min(duration - 0.04, seconds));
    pendingSeek.current = target;
    setElapsed(target);
    setPlayback("seeking");
    prepareSeekMedia(player);
    finishPendingSeek(player);
  }

  async function togglePlayback() {
    const player = video.current;
    if (!player || document.hidden || !dialog.current?.open) return;
    if (active) {
      pauseFilm();
      return;
    }
    const generation = ++request.current;
    playbackIntent.current = player;
    setPlayback("loading");
    if (pendingSeek.current !== null) {
      prepareSeekMedia(player);
      finishPendingSeek(player);
      return;
    }
    if (player.error) player.load();
    if (player.ended) player.currentTime = 0;
    await playRequested(player, generation);
  }

  const label = active
    ? "Pause film"
    : playback === "ended"
      ? "Replay film"
      : playback === "error"
        ? "Try again"
        : "Play film";
  const status =
    playback === "error"
      ? "The film could not load. Please try again."
      : playback === "seeking"
        ? "Finding your frame…"
        : playback === "loading"
          ? "Loading the film…"
          : playback === "playing"
            ? "Playing. No sound."
            : playback === "paused"
              ? "Paused. Continue when you choose."
              : playback === "ended"
                ? "End of film. Replay when you choose."
                : "A still frame until you press Play. No sound.";

  return (
    <dialog
      ref={dialog}
      className="lensing-film"
      data-clip={clipId}
      data-playback={playback}
      aria-labelledby="lensing-film-title"
      aria-describedby="lensing-film-description"
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = [
          ...event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), a[href], [tabindex="0"]',
          ),
        ].filter((element) => element.getClientRects().length > 0);
        if (event.shiftKey && document.activeElement === controls[0]) {
          event.preventDefault();
          controls.at(-1)?.focus();
        } else if (!event.shiftKey && document.activeElement === controls.at(-1)) {
          event.preventDefault();
          controls[0]?.focus();
        }
      }}
    >
      <header className="lensing-film-header">
        <div>
          <span className="lensing-film-eyebrow">
            {clipId === "signature" ? "CELESTIAL FORGE" : "LENSING"} / {clip.durationLabel}
          </span>
          <h2 id="lensing-film-title">{clip.title}</h2>
        </div>
        <button
          ref={close}
          type="button"
          className="lensing-film-close"
          onClick={dismiss}
          aria-label={`Close ${clip.title}`}
        >
          <span>Close</span>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="m5 5 10 10M15 5 5 15" />
          </svg>
        </button>
      </header>
      <div className="lensing-film-choices" role="group" aria-label="Choose a film">
        {(["signature", "awakening", "arrival"] as const).map((id) => (
          <button
            key={id}
            type="button"
            className="lensing-film-choice"
            aria-pressed={clipId === id}
            aria-label={`${CLIPS[id].title}, ${CLIPS[id].duration}-second film`}
            onClick={() => selectClip(id)}
          >
            <span>{CLIPS[id].title}</span>
            <small aria-hidden="true">0{CLIPS[id].duration}S</small>
          </button>
        ))}
      </div>
      <figure className="lensing-film-frame">
        <video
          key={clipId}
          ref={attachPlayer}
          src={clip.film}
          poster={clip.poster}
          preload="none"
          muted
          playsInline
          aria-label={`${clip.title}, a silent cinematic artwork`}
          aria-describedby="lensing-film-description"
          onPlaying={(event) => {
            const player = event.currentTarget;
            if (
              !isCurrentPlayer(player) ||
              playbackIntent.current !== player ||
              pendingSeek.current !== null ||
              document.hidden
            )
              player.pause();
            else if (!player.paused) setPlayback("playing");
          }}
          onPause={(event) => {
            if (isCurrentPlayer(event.currentTarget) && event.currentTarget.paused && pendingSeek.current === null)
              setPlayback((current) => (current === "playing" || current === "loading" ? "paused" : current));
          }}
          onWaiting={(event) => {
            if (isCurrentPlayer(event.currentTarget) && !event.currentTarget.paused) setPlayback("loading");
          }}
          onEnded={(event) => {
            if (isCurrentPlayer(event.currentTarget) && event.currentTarget.ended && pendingSeek.current === null) {
              playbackIntent.current = null;
              setPlayback("ended");
            }
          }}
          onError={(event) => {
            // load() clears the previous MediaError when changing sources;
            // a current error is real even while a range probe is pending.
            if (event.currentTarget.error) failMedia(event.currentTarget);
          }}
          onTimeUpdate={(event) => {
            if (isCurrentPlayer(event.currentTarget)) {
              if (pendingSeek.current !== null) finishPendingSeek(event.currentTarget);
              else setElapsed(event.currentTarget.currentTime);
            }
          }}
          onSeeked={(event) => {
            const player = event.currentTarget;
            if (isCurrentPlayer(player)) {
              if (pendingSeek.current !== null) finishPendingSeek(player);
              else if (player.paused && playbackIntent.current !== player) {
                setElapsed(player.currentTime);
                setPlayback("paused");
              }
            }
          }}
          onLoadedData={(event) => finishPendingSeek(event.currentTarget)}
          onCanPlay={(event) => finishPendingSeek(event.currentTarget)}
          onProgress={(event) => finishPendingSeek(event.currentTarget)}
          onSuspend={(event) => finishPendingSeek(event.currentTarget)}
          onLoadedMetadata={(event) => {
            const player = event.currentTarget;
            const seconds = player.duration;
            if (isCurrentPlayer(player) && Number.isFinite(seconds) && seconds > 0) {
              setDuration(seconds);
              finishPendingSeek(player);
            }
          }}
        >
          Your browser cannot play this film.
        </video>
        <figcaption id="lensing-film-description">
          {clip.description}
          <span>Original cinematic artwork created with Higgsfield.</span>
        </figcaption>
      </figure>
      {clipId === "signature" && (
        <div className="lensing-film-chapters" role="group" aria-label="Explore the awakening">
          {[
            { name: "Spark", time: 0 },
            { name: "Orbit", time: 2 },
            { name: "Radiance", time: 4.8 },
          ].map((chapter, index) => (
            <button
              key={chapter.name}
              type="button"
              onClick={() => seekFilm(chapter.time)}
              aria-label={`Seek to ${chapter.name}`}
            >
              <span>0{index + 1}</span> {chapter.name}
            </button>
          ))}
        </div>
      )}
      <div className="lensing-film-controls">
        <button className="lensing-film-play" type="button" onClick={() => void togglePlayback()}>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            {active ? (
              <path d="M6 4v12M14 4v12" />
            ) : playback === "ended" ? (
              <path d="M5 5a7 7 0 1 1-1.7 7M5 1v5H1" />
            ) : (
              <path d="m6 3 10 7-10 7Z" />
            )}
          </svg>
          {label}
        </button>
        <div className="lensing-film-timeline">
          <div className="lensing-film-status">
            <span role="status">{status}</span>
            <span className="lensing-film-time" aria-hidden="true">
              {timecode(elapsed)} / {timecode(duration)}
            </span>
          </div>
          <input
            type="range"
            className="lensing-film-scrubber"
            min={0}
            step={0.01}
            value={Math.min(elapsed, duration)}
            max={duration}
            onChange={(event) => seekFilm(Number(event.currentTarget.value))}
            aria-label="Seek film"
            aria-valuetext={`${elapsed.toFixed(1)} of ${duration.toFixed(1)} seconds`}
          />
        </div>
      </div>
      {clipId === "awakening" && (
        <div className="lensing-film-handoff">
          <p>The next perspective is yours.</p>
          <button
            type="button"
            className="lensing-film-explore"
            onClick={() => {
              pauseFilm();
              onExplore();
            }}
          >
            Enter this world
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M3 10h14m-5-5 5 5-5 5" />
            </svg>
          </button>
        </div>
      )}
      {clipId === "signature" && onSignature && (
        <div className="lensing-film-handoff">
          <p>Now put the light in your hands.</p>
          <button
            type="button"
            className="lensing-film-explore"
            onClick={() => {
              pauseFilm();
              onSignature();
            }}
          >
            Sculpt this light
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M3 10h14m-5-5 5 5-5 5" />
            </svg>
          </button>
        </div>
      )}
    </dialog>
  );
}
