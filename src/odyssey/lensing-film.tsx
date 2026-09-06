import { useCallback, useEffect, useRef, useState } from "react";
import "./lensing-film.css";

type Playback = "still" | "loading" | "playing" | "paused" | "ended" | "error";

const FILM = "/assets/lensing/orbital-arrival.mp4";
const POSTER = "/assets/lensing/orbital-arrival-poster.webp";

function timecode(seconds: number) {
  return `0:${String(Math.floor(seconds)).padStart(2, "0")}`;
}

export default function LensingFilm({ motion, onClose }: { motion: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const request = useRef(0);
  const mounted = useRef(false);
  const [playback, setPlayback] = useState<Playback>("still");
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(5);
  const active = playback === "playing" || playback === "loading";

  const pauseFilm = useCallback(() => {
    request.current += 1;
    video.current?.pause();
    setPlayback((current) => (current === "playing" || current === "loading" ? "paused" : current));
  }, []);

  useEffect(() => {
    mounted.current = true;
    const panel = dialog.current;
    const player = video.current;
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
      player?.pause();
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
    setPlayback("loading");
    try {
      await player.play();
      if (!mounted.current || document.hidden || !dialog.current?.open) player.pause();
    } catch {
      if (mounted.current && generation === request.current) setPlayback("error");
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
      aria-labelledby="lensing-film-title"
      aria-describedby="lensing-film-description"
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
    >
      <header className="lensing-film-header">
        <div>
          <span className="lensing-film-eyebrow">LENSING / A FIVE-SECOND FILM</span>
          <h2 id="lensing-film-title">Orbital arrival</h2>
        </div>
        <button
          ref={close}
          type="button"
          className="lensing-film-close"
          onClick={dismiss}
          aria-label="Close Orbital arrival"
        >
          <span>Close</span>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="m5 5 10 10M15 5 5 15" />
          </svg>
        </button>
      </header>
      <figure className="lensing-film-frame">
        <video
          ref={video}
          src={FILM}
          poster={POSTER}
          preload="none"
          muted
          playsInline
          aria-label="Orbital arrival, a silent cinematic artwork"
          aria-describedby="lensing-film-description"
          onPlaying={() => setPlayback("playing")}
          onPause={() =>
            setPlayback((current) => (current === "playing" || current === "loading" ? "paused" : current))
          }
          onWaiting={(event) => {
            if (!event.currentTarget.paused) setPlayback("loading");
          }}
          onEnded={() => setPlayback("ended")}
          onError={() => setPlayback("error")}
          onTimeUpdate={(event) => setElapsed(event.currentTarget.currentTime)}
          onLoadedMetadata={(event) => {
            const seconds = event.currentTarget.duration;
            if (Number.isFinite(seconds) && seconds > 0) setDuration(seconds);
          }}
        >
          Your browser cannot play this film.
        </video>
        <figcaption id="lensing-film-description">
          An imagined orbital gate, a distant planet, a quiet approach.
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
    </dialog>
  );
}
