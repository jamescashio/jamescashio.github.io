import { useCallback, useEffect, useRef, useState } from "react";
import "./lensing-film.css";

type Playback = "still" | "loading" | "playing" | "paused" | "ended" | "error";
export type LensingClip = "awakening" | "arrival";

const CLIPS = {
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
  return `0:${String(Math.floor(seconds)).padStart(2, "0")}`;
}

export default function LensingFilm({
  motion,
  onClose,
  initialClip = "awakening",
  onExplore,
}: {
  motion: boolean;
  onClose: () => void;
  initialClip?: LensingClip;
  onExplore: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const request = useRef(0);
  const playbackIntent = useRef<HTMLVideoElement | null>(null);
  const mounted = useRef(false);
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

  async function togglePlayback() {
    const player = video.current;
    if (!player || document.hidden || !dialog.current?.open) return;
    if (active) {
      pauseFilm();
      return;
    }
    const generation = ++request.current;
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
    >
      <header className="lensing-film-header">
        <div>
          <span className="lensing-film-eyebrow">LENSING / {clip.durationLabel}</span>
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
        {(["awakening", "arrival"] as const).map((id) => (
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
            if (isCurrentPlayer(event.currentTarget)) setElapsed(event.currentTarget.currentTime);
          }}
          onLoadedMetadata={(event) => {
            const seconds = event.currentTarget.duration;
            if (isCurrentPlayer(event.currentTarget) && Number.isFinite(seconds) && seconds > 0) setDuration(seconds);
          }}
        >
          Your browser cannot play this film.
        </video>
        <figcaption id="lensing-film-description">
          {clip.description}
          <span>Original cinematic artwork created with Higgsfield.</span>
        </figcaption>
      </figure>
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
          <progress
            value={Math.min(elapsed, duration)}
            max={duration}
            aria-label="Film progress"
            aria-valuetext={`${Math.floor(elapsed)} of ${Math.round(duration)} seconds`}
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
    </dialog>
  );
}
