import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import "./lensing-film.css";
import { CLIPS, nextFilm, type FilmDefinition, type FilmCollection } from "./film-catalog";
import { useFilmPlayback } from "./use-film-playback";
export type { FilmDefinition, FilmCollection, LensingClip } from "./film-catalog";
const SanctuaryWorld = lazy(() => import("./sanctuary-world"));

class ChamberBoundary extends Component<{ children: ReactNode; onReturn: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="lensing-film-world-loading" role="status">
        The chamber could not open. Your film is still available.
        <button type="button" onClick={this.props.onReturn}>
          Return to film
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}

const NO_COLLECTIONS: FilmCollection[] = [];
const SANCTUARY_CHAPTERS = [
  { name: "Threshold", time: 0, thumbnail: "/assets/sanctuary/threshold.webp" },
  { name: "Awakening", time: 5, thumbnail: "/assets/sanctuary/awakening.webp" },
  { name: "Revelation", time: 10.125, thumbnail: "/assets/sanctuary/revelation.webp" },
] as const;

function timecode(seconds: number) {
  return `0:${seconds.toFixed(1).padStart(4, "0")}`;
}

export default function LensingFilm({
  motion,
  onClose,
  initialClip = "awakening",
  onExplore,
  onSignature,
  onWork,
  additionalCollections = NO_COLLECTIONS,
  onClipChange,
}: {
  motion: boolean;
  onClose: () => void;
  initialClip?: string;
  onExplore: () => void;
  onSignature?: () => void;
  onWork?: () => void;
  additionalCollections?: FilmCollection[];
  onClipChange?: (id: string) => void;
}) {
  const collections = useMemo(
    () => [{ label: "The original films", clips: CLIPS }, ...additionalCollections],
    [additionalCollections],
  );
  const clips = useMemo<Record<string, FilmDefinition>>(
    () => Object.assign({}, ...collections.map((collection) => collection.clips)),
    [collections],
  );
  const firstClip = Object.hasOwn(clips, initialClip) ? initialClip : "awakening";
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const [clipId, setClipId] = useState(firstClip);
  const [repeat, setRepeat] = useState(false);
  const [inside, setInside] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const clip = clips[clipId];
  const collectionIndex = collections.findIndex((collection) => Object.hasOwn(collection.clips, clipId));
  const currentCollection = collections[collectionIndex];
  const {
    attachPlayer,
    mediaEvents,
    active,
    playback,
    elapsed,
    duration,
    pauseFilm,
    resetPlayback,
    seekFilm,
    togglePlayback,
    label,
    status,
  } = useFilmPlayback(dialog, clip, motion);
  const next = nextFilm(clipId, collections);
  const playControl = useRef<HTMLButtonElement>(null);
  const choices = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const strip = choices.current;
    const selected = strip?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (strip && selected)
      strip.scrollLeft = selected.offsetLeft - strip.offsetLeft - (strip.clientWidth - selected.clientWidth) / 2;
  }, [clipId]);

  useEffect(() => {
    const panel = dialog.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (panel && !panel.open) panel.showModal();
    close.current?.focus({ preventScroll: true });
    return () => {
      panel?.close();
      document.body.style.overflow = overflow;
    };
  }, []);

  function dismiss() {
    pauseFilm();
    onClose();
  }

  function enterChamber() {
    pauseFilm();
    resetPlayback(clip.duration);
    setInside(true);
    close.current?.focus({ preventScroll: true });
    if (dialog.current) dialog.current.scrollTop = 0;
  }

  function returnToFilm() {
    setInside(false);
    resetPlayback(clip.duration);
    requestAnimationFrame(() => {
      if (dialog.current) dialog.current.scrollTop = 0;
      close.current?.focus({ preventScroll: true });
    });
  }

  function selectClip(next: string) {
    if (next === clipId || !Object.hasOwn(clips, next)) return;
    pauseFilm();
    setClipId(next);
    setRepeat(false);
    resetPlayback(clips[next].duration);
    onClipChange?.(next);
  }

  return (
    <dialog
      ref={dialog}
      className="lensing-film"
      data-clip={clipId}
      data-playback={playback}
      data-view={inside ? "world" : "film"}
      data-expanded={expanded && !inside}
      aria-labelledby="lensing-film-title"
      aria-describedby={inside ? undefined : "lensing-film-description"}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = [
          ...event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex="0"]',
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
            {clip.eyebrow ||
              (clipId === "intro"
                ? "ARRIVAL"
                : clipId === "sanctuary"
                  ? "SANCTUARY"
                  : clipId === "signature"
                    ? "CELESTIAL FORGE"
                    : clipId === "lightwake"
                      ? "LIGHTWAKE"
                      : "LENSING")}{" "}
            / {inside ? "THE SCENE IS YOURS" : clip.durationLabel}
          </span>
          <h2 id="lensing-film-title">{inside ? "The living Sanctuary" : clip.title}</h2>
        </div>
        <div className="lensing-film-actions">
          {!inside && (
            <button
              type="button"
              className="lensing-film-size"
              onClick={() => {
                setExpanded((current) => !current);
                if (dialog.current) dialog.current.scrollTop = 0;
              }}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d={expanded ? "M3 7h4V3m6 0v4h4M3 13h4v4m6 0v-4h4" : "M7 3H3v4m10-4h4v4M3 13v4h4m6 0h4v-4"} />
              </svg>
              {expanded ? "Restore view" : "Expand view"}
            </button>
          )}
          <button
            ref={close}
            type="button"
            className="lensing-film-close"
            onClick={dismiss}
            aria-label={inside ? "Close Sanctuary" : `Close ${clip.title}`}
          >
            <span>Close</span>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="m5 5 10 10M15 5 5 15" />
            </svg>
          </button>
        </div>
      </header>
      {inside ? (
        <ChamberBoundary onReturn={returnToFilm}>
          <Suspense
            fallback={
              <div className="lensing-film-world-loading" role="status">
                Opening the chamber…{" "}
                <button type="button" onClick={returnToFilm}>
                  Return to film
                </button>
              </div>
            }
          >
            <SanctuaryWorld motion={motion} onReturn={returnToFilm} onWork={onWork} />
          </Suspense>
        </ChamberBoundary>
      ) : (
        <>
          <div className="lensing-film-collection">
            {additionalCollections.length ? (
              <label className="lensing-film-library">
                <span>FILM COLLECTION</span>
                <select
                  value={collectionIndex}
                  onChange={(event) => selectClip(Object.keys(collections[Number(event.currentTarget.value)].clips)[0])}
                >
                  {collections.map((collection, index) => (
                    <option key={collection.label} value={index}>
                      {collection.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <span>CHOOSE YOUR PERSPECTIVE</span>
            )}
            <span>{String(Object.keys(currentCollection.clips).length).padStart(2, "0")} FILMS</span>
          </div>
          <div ref={choices} className="lensing-film-choices" role="group" aria-label="Choose a film">
            {Object.keys(currentCollection.clips).map((id) => (
              <button
                key={id}
                type="button"
                className="lensing-film-choice"
                aria-pressed={clipId === id}
                aria-label={`${clips[id].title}, ${clips[id].duration}-second film`}
                onClick={() => selectClip(id)}
              >
                <img
                  className="lensing-film-thumbnail"
                  src={clips[id].poster}
                  alt=""
                  width="64"
                  height="40"
                  loading="lazy"
                  decoding="async"
                />
                <span>{clips[id].title}</span>
                <small aria-hidden="true">0:{String(clips[id].duration).padStart(2, "0")}</small>
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
              loop={Boolean(clip.loopable && repeat)}
              playsInline
              aria-label={`${clip.title}, a silent cinematic artwork`}
              aria-describedby="lensing-film-description"
              {...mediaEvents}
            >
              Your browser cannot play this film.
            </video>
            <figcaption id="lensing-film-description">
              {clip.description}
              <span>Original cinematic artwork. An imagined world.</span>
            </figcaption>
          </figure>
          {clipId === "sanctuary" && (
            <div className="lensing-film-scenes" role="group" aria-label="Explore the sanctuary">
              {SANCTUARY_CHAPTERS.map((chapter, index) => {
                const current = elapsed >= chapter.time && elapsed < (SANCTUARY_CHAPTERS[index + 1]?.time ?? Infinity);
                return (
                  <button
                    key={chapter.name}
                    type="button"
                    onClick={() => seekFilm(chapter.time)}
                    aria-label={`Seek to ${chapter.name}`}
                    aria-current={current ? "step" : undefined}
                  >
                    <img src={chapter.thumbnail} alt="" width="112" height="64" loading="lazy" decoding="async" />
                    <span>
                      <strong>{chapter.name}</strong>
                      <small>
                        0{index + 1} <span aria-hidden="true">/</span> 0:
                        {String(Math.floor(chapter.time)).padStart(2, "0")}
                      </small>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {(clipId === "signature" || clipId === "lightwake") && (
            <div
              className="lensing-film-chapters"
              role="group"
              aria-label={clipId === "lightwake" ? "Explore Lightwake" : "Explore the awakening"}
            >
              {(clipId === "lightwake"
                ? [
                    { name: "First light", time: 0 },
                    { name: "Signal", time: 3 },
                    { name: "Awakening", time: 6.4 },
                  ]
                : [
                    { name: "Spark", time: 0 },
                    { name: "Orbit", time: 2 },
                    { name: "Radiance", time: 4.8 },
                  ]
              ).map((chapter, index) => (
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
            <button ref={playControl} className="lensing-film-play" type="button" onClick={() => void togglePlayback()}>
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
            {clip.loopable && (
              <button
                type="button"
                className="lensing-film-repeat"
                aria-pressed={repeat}
                onClick={() => setRepeat((value) => !value)}
              >
                Repeat film
              </button>
            )}
            {next && additionalCollections.length > 0 && (
              <button
                className="lensing-film-next"
                type="button"
                aria-label={`Next film: ${clips[next].title}`}
                onClick={() => {
                  selectClip(next);
                  requestAnimationFrame(() => playControl.current?.focus({ preventScroll: true }));
                }}
              >
                Next film <span aria-hidden="true">→</span>
              </button>
            )}
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
          {(clipId === "awakening" || clipId === "lightwake") && (
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
          {clipId === "sanctuary" && (
            <div className="lensing-film-handoff">
              <p>The film ends. Your exploration begins.</p>
              <button type="button" className="lensing-film-explore lensing-film-enter-world" onClick={enterChamber}>
                Step inside the scene{" "}
                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M3 10h14m-5-5 5 5-5 5" />
                </svg>
              </button>
              {onWork && (
                <button
                  type="button"
                  className="lensing-film-explore"
                  onClick={() => {
                    pauseFilm();
                    onWork();
                  }}
                >
                  Explore the working studies
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M3 10h14m-5-5 5 5-5 5" />
                  </svg>
                </button>
              )}
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
        </>
      )}
    </dialog>
  );
}
