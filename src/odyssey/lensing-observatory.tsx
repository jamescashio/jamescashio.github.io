import { useEffect, useRef, useState } from "react";
import type { LensingLight, LensingView } from "./lensing-renderer";
import { JOURNEY, useLensingJourney } from "./lensing-journey";
import "./lensing-observatory.css";
import "./lensing-resonance.css";

const LIGHTS: { id: LensingLight; label: string; note: string }[] = [
  { id: "dawn", label: "Dawn", note: "Warm light. A world coming into view." },
  { id: "ion", label: "Ion blue", note: "Cold light. Every engineered edge revealed." },
  { id: "eclipse", label: "Eclipse", note: "A dark world. An electric horizon." },
];
const VIEWS: { id: LensingView; label: string; title: string; description: string }[] = [
  {
    id: "orbit",
    label: "Orbit",
    title: "A different perspective.",
    description: "An imagined world, held inside an impossible orbit.",
  },
  {
    id: "surface",
    label: "Surface",
    title: "Closer to the extraordinary.",
    description: "Follow the light across the edge of the world.",
  },
  {
    id: "gate",
    label: "The gate",
    title: "An invitation to go further.",
    description: "Circle the architecture. Find your own horizon.",
  },
];
type Scene = ReturnType<typeof import("./lensing-renderer").createLensingScene>;

export default function LensingObservatory({
  motion,
  reduced,
  onClose,
}: {
  motion: boolean;
  reduced: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<Scene | null>(null);
  const [freeLight, setFreeLight] = useState<LensingLight>("dawn");
  const [freeView, setFreeView] = useState<LensingView>("orbit");
  const [playing, setPlaying] = useState(true);
  const [resonance, setResonance] = useState(false);
  const [ready, setReady] = useState(false);
  const [arriving, setArriving] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const journey = useLensingJourney(motion && playing && ready && !unavailable);
  const chapter = journey.step ? JOURNEY[journey.step.index] : null;
  const light = chapter?.light ?? freeLight;
  const view = chapter?.view ?? freeView;
  const settings = useRef({ motion, playing, light, view, resonance });
  const activeView = VIEWS.find((item) => item.id === view)!;
  const activeLight = LIGHTS.find((item) => item.id === light)!;

  useEffect(() => {
    settings.current = { motion, playing, light, view, resonance };
    scene.current?.setMotion(motion);
    scene.current?.setPlaying(playing && motion);
  }, [motion, playing, light, view, resonance]);

  useEffect(() => {
    scene.current?.setResonance(resonance);
  }, [resonance]);

  useEffect(() => {
    scene.current?.setLight(light);
  }, [light]);
  useEffect(() => {
    scene.current?.setView(view);
  }, [view]);

  useEffect(() => {
    const panel = dialog.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel?.showModal();
    close.current?.focus();
    return () => {
      panel?.close();
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void import("./lensing-renderer")
      .then(({ createLensingScene }) => {
        if (!active || !canvas.current) return;
        scene.current = createLensingScene(canvas.current, {
          onReady: () => {
            if (!active) return;
            setArriving(settings.current.motion && settings.current.playing);
            setReady(true);
          },
          onUnavailable: () => active && setUnavailable(true),
        });
        scene.current.setMotion(settings.current.motion);
        scene.current.setPlaying(settings.current.playing && settings.current.motion);
        scene.current.setLight(settings.current.light);
        scene.current.setView(settings.current.view);
        scene.current.setResonance(settings.current.resonance);
      })
      .catch(() => active && setUnavailable(true));
    return () => {
      active = false;
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  function chooseLight(value: LensingLight) {
    takeControl();
    setFreeLight(value);
  }
  function chooseView(value: LensingView) {
    takeControl();
    setFreeView(value);
    // Selecting the current preset also restores an independently orbited camera.
    if (value === view) scene.current?.setView(value);
  }
  function takeControl() {
    if (!journey.step) return;
    setFreeLight(light);
    setFreeView(view);
    journey.stop();
  }
  function cameraControl(action: () => void) {
    takeControl();
    action();
  }
  return (
    <dialog
      ref={dialog}
      className="lens-observatory"
      data-light={light}
      data-view={view}
      data-ready={ready && !unavailable ? "true" : "false"}
      data-motion={motion && playing ? "on" : "off"}
      data-resonance={resonance ? "on" : "off"}
      data-journey={
        !journey.step
          ? "off"
          : journey.complete
            ? "complete"
            : !motion
              ? "manual"
              : journey.running
                ? "running"
                : "paused"
      }
      data-chapter={journey.step?.index ?? -1}
      aria-labelledby="lens-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <header className="lens-header">
        <div className="lens-wordmark">
          <span aria-hidden="true">◉</span>
          <div>
            <p>HOUSE CASHIO / LENSING</p>
            <h2 id="lens-title">
              Lensing<span>Observatory</span>
            </h2>
          </div>
        </div>
        <button ref={close} className="lens-close" onClick={onClose} aria-label="Close observatory">
          Close <span aria-hidden="true">×</span>
        </button>
      </header>
      {journey.step && (
        <div className="lens-journey" aria-label="Guided journey controls">
          <div className="lens-journey-label">
            <span className="lens-eyebrow">
              {journey.complete
                ? "JOURNEY COMPLETE"
                : !motion
                  ? "AT YOUR PACE"
                  : journey.running
                    ? "THE 24-SECOND JOURNEY"
                    : "JOURNEY PAUSED"}
            </span>
            <strong>
              0{journey.step.index + 1} <span>/ 03</span> · {chapter?.note}
            </strong>
          </div>
          <div className="lens-journey-track" aria-hidden="true">
            {JOURNEY.map((item, index) => (
              <span
                key={item.note}
                data-state={
                  index < journey.step!.index || journey.complete
                    ? "done"
                    : index === journey.step!.index
                      ? "active"
                      : "next"
                }
              >
                {index === journey.step!.index && (
                  <i key={journey.step!.id} style={{ animationPlayState: journey.running ? "running" : "paused" }} />
                )}
              </span>
            ))}
          </div>
          <div className="lens-journey-steps">
            <button
              aria-label="Previous chapter"
              disabled={journey.step.index === 0}
              onClick={() => journey.jump(journey.step!.index - 1)}
            >
              ←
            </button>
            <button
              aria-label={journey.step.index === 2 ? "Finish journey" : "Next chapter"}
              onClick={() => (journey.step!.index === 2 ? takeControl() : journey.jump(journey.step!.index + 1))}
            >
              {journey.step.index === 2 ? "✓" : "→"}
            </button>
          </div>
        </div>
      )}
      <div className="lens-stage">
        <div
          className="lens-arrival"
          data-complete={!arriving}
          aria-hidden="true"
          onAnimationEnd={() => setArriving(false)}
        >
          <svg viewBox="0 0 600 600" fill="none">
            <circle cx="300" cy="300" r="224" stroke="#e4c38d" strokeWidth="1" strokeDasharray="340 24 8 24" />
            <circle cx="300" cy="300" r="208" stroke="#75e7f2" strokeWidth="2" strokeDasharray="140 118" />
            <path d="M300 54v30m216 216h30M300 516v30M54 300h30" stroke="#aeeef0" strokeWidth="1" />
          </svg>
        </div>
        <canvas
          ref={canvas}
          className="lens-canvas"
          tabIndex={ready && !unavailable ? 0 : -1}
          role="img"
          aria-label="Interactive three-dimensional planet and orbital gate. Drag to orbit. Arrow keys rotate; plus and minus zoom. The same controls are available below."
          onPointerDown={takeControl}
          onWheel={takeControl}
          onKeyDown={(event) => {
            const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-", "Home"];
            if (!keys.includes(event.key)) return;
            event.preventDefault();
            takeControl();
            if (event.key === "ArrowLeft") scene.current?.rotate(-0.16, 0);
            if (event.key === "ArrowRight") scene.current?.rotate(0.16, 0);
            if (event.key === "ArrowUp") scene.current?.rotate(0, -0.12);
            if (event.key === "ArrowDown") scene.current?.rotate(0, 0.12);
            if (event.key === "+" || event.key === "=") scene.current?.zoom(0.86);
            if (event.key === "-") scene.current?.zoom(1.14);
            if (event.key === "Home") {
              scene.current?.reset();
              setFreeView("orbit");
            }
          }}
        />
        {(!ready || unavailable) && (
          <div className="lens-fallback">
            <div className="lens-still-planet" />
            <p role="status">
              {unavailable
                ? "This browser cannot open the 3D scene. The rest of Cashio is ready to explore."
                : "Bringing a new world into focus…"}
            </p>
            {unavailable && <button onClick={onClose}>Return to Cashio ↗</button>}
          </div>
        )}
        <div className="lens-stage-top">
          <span aria-hidden="true">
            <i /> {activeLight.label.toUpperCase()} / {activeView.label.toUpperCase()}
          </span>
          <button
            type="button"
            className="lens-resonance"
            aria-pressed={resonance}
            aria-label="Ignite the gate"
            disabled={!ready || unavailable}
            onClick={() => {
              takeControl();
              setResonance(!resonance);
            }}
          >
            <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth=".8" strokeDasharray="18 4" />
              <circle cx="16" cy="16" r="8" stroke="currentColor" strokeWidth="1.5" />
              <path d="M16 1v7m0 16v7M1 16h7m16 0h7" stroke="currentColor" />
              <circle cx="16" cy="16" r="2" fill="currentColor" />
            </svg>
            <span>{resonance ? "Gate ignited" : "Ignite the gate"}</span>
            <span className="lens-resonance-state" aria-hidden="true">
              {resonance ? "ON" : "↗"}
            </span>
          </button>
        </div>
        <div className="lens-reticle lens-reticle-a" aria-hidden="true" />
        <div className="lens-reticle lens-reticle-b" aria-hidden="true" />
        <div className="lens-caption">
          <span className="lens-eyebrow">
            {chapter
              ? `0${journey.step!.index + 1} / ${chapter.note.toUpperCase()}`
              : resonance
                ? "RESONANCE / A WORLD ANSWERS"
                : "FREE EXPLORATION / THE WORLD IS YOURS"}
          </span>
          <h3>{chapter?.title ?? (resonance ? "The horizon answers." : activeView.title)}</h3>
          <p>
            {chapter?.description ??
              (resonance ? "Light finds the circuit. The horizon comes alive." : activeView.description)}
          </p>
        </div>
        <div className="lens-orbit-tools" aria-label="Camera controls">
          <button
            disabled={!ready || unavailable}
            onClick={() => cameraControl(() => scene.current?.rotate(-0.2, 0))}
            aria-label="Rotate left"
          >
            ←
          </button>
          <button
            disabled={!ready || unavailable}
            onClick={() => cameraControl(() => scene.current?.rotate(0.2, 0))}
            aria-label="Rotate right"
          >
            →
          </button>
          <button
            disabled={!ready || unavailable}
            onClick={() => cameraControl(() => scene.current?.zoom(0.86))}
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            disabled={!ready || unavailable}
            onClick={() => cameraControl(() => scene.current?.zoom(1.14))}
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            disabled={!ready || unavailable}
            onClick={() => {
              takeControl();
              scene.current?.reset();
              setFreeView("orbit");
            }}
            aria-label="Reset camera"
          >
            ↺
          </button>
        </div>
      </div>
      <div className="lens-console">
        <div className="lens-control-block">
          <span className="lens-eyebrow" id="lens-light-label">
            01 / SCULPT THE LIGHT
          </span>
          <div className="lens-light-options" role="group" aria-labelledby="lens-light-label">
            {LIGHTS.map((item) => (
              <button
                key={item.id}
                disabled={!ready || unavailable}
                aria-pressed={light === item.id}
                onClick={() => chooseLight(item.id)}
              >
                <i className={`lens-light-${item.id}`} aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="lens-control-block">
          <span className="lens-eyebrow" id="lens-view-label">
            02 / FIND YOUR PERSPECTIVE
          </span>
          <div className="lens-view-options" role="group" aria-labelledby="lens-view-label">
            {VIEWS.map((item, index) => (
              <button
                key={item.id}
                disabled={!ready || unavailable}
                aria-pressed={view === item.id}
                aria-label={item.label}
                onClick={() => chooseView(item.id)}
              >
                <span aria-hidden="true">0{index + 1}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="lens-session-controls">
          <button
            className="lens-journey-toggle"
            disabled={!ready || unavailable}
            aria-pressed={Boolean(journey.step)}
            onClick={() => {
              if (journey.step) takeControl();
              else {
                setPlaying(true);
                journey.jump(0);
              }
            }}
          >
            <span aria-hidden="true">{journey.step ? "↗" : "▷"}</span>
            {journey.step ? "Explore freely" : "Take the journey"}
          </button>
          <button
            className="lens-pause"
            disabled={!motion || !ready || unavailable}
            aria-pressed={!playing || !motion}
            aria-label={
              !motion
                ? reduced
                  ? "Observatory motion follows your reduced-motion preference"
                  : "Observatory motion is off in the site controls"
                : playing
                  ? "Pause observatory motion"
                  : "Resume observatory motion"
            }
            onClick={() => setPlaying(!playing)}
          >
            <span aria-hidden="true">{motion && playing ? "Ⅱ" : "▷"}</span>
            {motion && playing ? "Pause motion" : "Motion paused"}
          </button>
        </div>
      </div>
      <footer className="lens-footer">
        <span>
          {!motion
            ? `${reduced ? "Reduced motion" : "Motion is off"} · explore each chapter at your own pace.`
            : journey.step
              ? "You have the controls. Drag or choose any light or view to explore freely."
              : "Drag to orbit · scroll or use + / − to explore."}
        </span>
        <span>Original 3D artwork · an imagined world, not a scientific simulation.</span>
      </footer>
      <span className="lens-sr-only" role="status">
        {ready
          ? `${resonance ? "Gate ignited. Select Ignite the gate again to return to the quiet world. " : ""}${journey.complete ? "Journey complete. Explore freely whenever you like. " : ""}${activeLight.note} ${chapter?.description ?? activeView.description}`
          : ""}
      </span>
    </dialog>
  );
}
