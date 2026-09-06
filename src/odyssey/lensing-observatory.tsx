import { useEffect, useRef, useState } from "react";
import type { LensingLight, LensingView } from "./lensing-renderer";
import "./lensing-observatory.css";

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

export default function LensingObservatory({ motion, onClose }: { motion: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<Scene | null>(null);
  const settings = useRef({ motion, playing: true });
  const [light, setLight] = useState<LensingLight>("dawn");
  const [view, setView] = useState<LensingView>("orbit");
  const [playing, setPlaying] = useState(true);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const activeView = VIEWS.find((item) => item.id === view)!;
  const activeLight = LIGHTS.find((item) => item.id === light)!;

  useEffect(() => {
    settings.current = { motion, playing };
    scene.current?.setMotion(motion);
    scene.current?.setPlaying(playing && motion);
  }, [motion, playing]);

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
          onReady: () => active && setReady(true),
          onUnavailable: () => active && setUnavailable(true),
        });
        scene.current.setMotion(settings.current.motion);
        scene.current.setPlaying(settings.current.playing && settings.current.motion);
      })
      .catch(() => active && setUnavailable(true));
    return () => {
      active = false;
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  function chooseLight(value: LensingLight) {
    setLight(value);
    scene.current?.setLight(value);
  }
  function chooseView(value: LensingView) {
    setView(value);
    scene.current?.setView(value);
  }
  return (
    <dialog
      ref={dialog}
      className="lens-observatory"
      data-light={light}
      data-view={view}
      data-ready={ready && !unavailable ? "true" : "false"}
      data-motion={motion && playing ? "on" : "off"}
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
            <p>HOUSE CASHIO / EXPERIMENT 01</p>
            <h2 id="lens-title">
              Lensing<span>Observatory</span>
            </h2>
          </div>
        </div>
        <button ref={close} className="lens-close" onClick={onClose} aria-label="Close observatory">
          Close <span aria-hidden="true">×</span>
        </button>
      </header>
      <div className="lens-stage">
        <canvas
          ref={canvas}
          className="lens-canvas"
          tabIndex={ready && !unavailable ? 0 : -1}
          role="img"
          aria-label="Interactive three-dimensional planet and orbital gate. Drag to orbit. Arrow keys rotate; plus and minus zoom. The same controls are available below."
          onKeyDown={(event) => {
            const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-", "Home"];
            if (!keys.includes(event.key)) return;
            event.preventDefault();
            if (event.key === "ArrowLeft") scene.current?.rotate(-0.16, 0);
            if (event.key === "ArrowRight") scene.current?.rotate(0.16, 0);
            if (event.key === "ArrowUp") scene.current?.rotate(0, -0.12);
            if (event.key === "ArrowDown") scene.current?.rotate(0, 0.12);
            if (event.key === "+" || event.key === "=") scene.current?.zoom(0.86);
            if (event.key === "-") scene.current?.zoom(1.14);
            if (event.key === "Home") {
              scene.current?.reset();
              setView("orbit");
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
        <div className="lens-stage-top" aria-hidden="true">
          <span>
            <i /> {activeLight.label.toUpperCase()} / {activeView.label.toUpperCase()}
          </span>
          <span>IMAGINATION, WITH INTENTION.</span>
        </div>
        <div className="lens-reticle lens-reticle-a" aria-hidden="true" />
        <div className="lens-reticle lens-reticle-b" aria-hidden="true" />
        <div className="lens-caption">
          <span className="lens-eyebrow">
            0{VIEWS.findIndex((item) => item.id === view) + 1} / CHANGE YOUR POINT OF VIEW
          </span>
          <h3>{activeView.title}</h3>
          <p>{activeView.description}</p>
        </div>
        <div className="lens-orbit-tools" aria-label="Camera controls">
          <button
            disabled={!ready || unavailable}
            onClick={() => scene.current?.rotate(-0.2, 0)}
            aria-label="Rotate left"
          >
            ←
          </button>
          <button
            disabled={!ready || unavailable}
            onClick={() => scene.current?.rotate(0.2, 0)}
            aria-label="Rotate right"
          >
            →
          </button>
          <button disabled={!ready || unavailable} onClick={() => scene.current?.zoom(0.86)} aria-label="Zoom in">
            +
          </button>
          <button disabled={!ready || unavailable} onClick={() => scene.current?.zoom(1.14)} aria-label="Zoom out">
            −
          </button>
          <button
            disabled={!ready || unavailable}
            onClick={() => {
              scene.current?.reset();
              setView("orbit");
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
        <button
          className="lens-pause"
          disabled={!motion || !ready || unavailable}
          aria-pressed={!playing || !motion}
          aria-label={
            !motion
              ? "Observatory motion follows your reduced-motion preference"
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
      <footer className="lens-footer">
        <span>
          {!motion
            ? "Reduced motion · change light and viewpoint at your own pace."
            : "Drag to orbit · scroll or use + / − to explore."}
        </span>
        <span>Original 3D artwork · an imagined world, not a scientific simulation.</span>
      </footer>
      <span className="lens-sr-only" role="status">
        {ready ? `${activeLight.note} ${activeView.description}` : ""}
      </span>
    </dialog>
  );
}
