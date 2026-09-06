import { useCallback, useEffect, useRef, useState } from "react";
import "./lensing-film.css";

type Playback = "still" | "loading" | "seeking" | "playing" | "paused" | "ended" | "error";
export type LensingClip = "signature" | "awakening" | "arrival";

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
  const mediaRequested = useRef(false);
  const [clipId, setClipId] = useState<LensingClip>(initialClip);
  const [playback, setPlayback] = useState<Playback>("still");
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState<number>(CLIPS[initialClip].duration);
  const clip = CLIPS[clipId];
  const active = playback === "playing" || playback === "loading";

  const attachPlayer = useCallback((player: HTMLVideoElement | null) => {
    if (video.current !== player) {
      request.current += 1;
      playbackIntent.current = null;
      video.current?.pause();
      video.current = player;
      pendingSeek.current = null;
      mediaRequested.current = false;
    }
  }, []);

  const pauseFilm = useCallback(() => {
    request.current += 1;
    playbackIntent.current = null;
    video.current?.pause();
    setPlayback((current) => (current === "playing" || current === "loading" ? "paused" : current));
  }, []);

  useEffect(() => {
    mounted.current = true;
    const panel = dialog.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (panel && !panel.open) panel.showModal();
    close.current?.focus({ preventScroll: true });
    const visibility = () => {
      if (document.hidden) pauseFilm();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      mounted.current = false;
      request.current += 1;
      playbackIntent.current = null;
      video.current?.pause();
      panel?.close();
      document.body.style.overflow = overflow;
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [pauseFilm]);

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

  function isCurrentPlayer(player: HTMLVideoElement) {
    return mounted.current && player === video.current && dialog.current?.open;
  }

  function seekFilm(seconds: number) {
    const player = video.current;
    if (!player || document.hidden || !dialog.current?.open) return;
    pauseFilm();
    const target = Math.max(0, Math.min(duration - 0.04, seconds));
    setElapsed(target);
    setPlayback("seeking");
    if (player.readyState >= 1 && Number.isFinite(player.duration)) {
      pendingSeek.current = null;
      player.currentTime = Math.min(target, player.duration - 0.04);
      if (!player.seeking) setPlayback("paused");
    } else {
      pendingSeek.current = target;
      if (!mediaRequested.current) {
        mediaRequested.current = true;
        player.preload = "auto";
        player.load();
      }
    }
  }

  async function togglePlayback() {
    const player = video.current;
    if (!player || document.hidden || !dialog.current?.open) return;
    if (active) {
      pauseFilm();
      return;
    }
    const generation = ++request.current;
    mediaRequested.current = true;
    if (player.error) player.load();
    if (player.ended) player.currentTime = 0;
    playbackIntent.current = player;
    setPlayback("loading");
    try {
      await player.play();
      if (!isCurrentPlayer(player) || document.hidden || playbackIntent.current !== player) player.pause();
    } catch {
      if (isCurrentPlayer(player) && generation === request.current) {
        playbackIntent.current = null;
        setPlayback("error");
      }
    }
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
            if (!isCurrentPlayer(player) || playbackIntent.current !== player || document.hidden) player.pause();
            else if (!player.paused) setPlayback("playing");
          }}
          onPause={(event) => {
            if (isCurrentPlayer(event.currentTarget) && event.currentTarget.paused)
              setPlayback((current) => (current === "playing" || current === "loading" ? "paused" : current));
          }}
          onWaiting={(event) => {
            if (isCurrentPlayer(event.currentTarget) && !event.currentTarget.paused) setPlayback("loading");
          }}
          onEnded={(event) => {
            if (isCurrentPlayer(event.currentTarget) && event.currentTarget.ended) {
              playbackIntent.current = null;
              setPlayback("ended");
            }
          }}
          onError={(event) => {
            if (isCurrentPlayer(event.currentTarget) && event.currentTarget.error) {
              playbackIntent.current = null;
              setPlayback("error");
            }
          }}
          onTimeUpdate={(event) => {
            if (isCurrentPlayer(event.currentTarget) && pendingSeek.current === null)
              setElapsed(event.currentTarget.currentTime);
          }}
          onSeeked={(event) => {
            if (isCurrentPlayer(event.currentTarget) && event.currentTarget.paused) {
              setElapsed(event.currentTarget.currentTime);
              setPlayback("paused");
            }
          }}
          onLoadedMetadata={(event) => {
            const player = event.currentTarget;
            const seconds = player.duration;
            if (isCurrentPlayer(player) && Number.isFinite(seconds) && seconds > 0) {
              setDuration(seconds);
              if (pendingSeek.current !== null) {
                const target = pendingSeek.current;
                pendingSeek.current = null;
                player.currentTime = Math.min(target, seconds - 0.04);
                if (!player.seeking && playbackIntent.current !== player) setPlayback("paused");
              }
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
