import { useEffect, useRef, useState } from "react";
import type { SanctuaryController, SanctuarySelection, SanctuaryState } from "./sanctuary-renderer";
import "./sanctuary-world.css";

const ELEMENTS = {
  core: {
    name: "Amber core",
    title: "Human direction",
    text: "One point of intention. The core represents the person who sets the goal, weighs the evidence, and decides what happens next.",
  },
  left: {
    name: "West monolith",
    title: "Owned intelligence",
    text: "Capability with an owner. This monolith represents intelligence you can inspect, operate, and keep within a boundary you understand.",
  },
  right: {
    name: "East monolith",
    title: "Deliberate connection",
    text: "Connection by choice. Its twin represents the permission to reach beyond that boundary, with a clear purpose and a person accountable.",
  },
} as const;

export default function SanctuaryWorld({
  motion,
  onReturn,
  onWork,
}: {
  motion: boolean;
  onReturn: () => void;
  onWork?: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const controller = useRef<SanctuaryController | null>(null);
  const returnButton = useRef<HTMLButtonElement>(null);
  const motionNow = useRef(motion);
  motionNow.current = motion;
  const [selection, setSelection] = useState<SanctuarySelection>("core");
  const [light, setLight] = useState(65);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const [state, setState] = useState<SanctuaryState>({ ready: false, lost: false, paused: true, awake: false });
  useEffect(() => {
    let active = true;
    let instance: SanctuaryController | null = null;
    setFailed(false);
    setState({ ready: false, lost: false, paused: true, awake: false });
    setSelection("core");
    setLight(65);
    returnButton.current?.focus({ preventScroll: true });
    void import("./sanctuary-renderer")
      .then(({ createSanctuaryRenderer }) => {
        if (!active || !canvas.current) return;
        instance = createSanctuaryRenderer(canvas.current, {
          motion: motionNow.current,
          onSelect: (id) => {
            if (active) setSelection(id);
          },
          onState: (next) => {
            if (active) {
              setState(next);
              if (next.lost) setFailed(true);
            }
          },
        });
        controller.current = instance;
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
      instance?.dispose();
      if (controller.current === instance) controller.current = null;
    };
  }, [attempt]);
  useEffect(() => {
    controller.current?.setMotion(motion);
  }, [motion]);
  const available = state.ready && !failed;
  const detail = ELEMENTS[selection];
  function choose(id: SanctuarySelection) {
    setSelection(id);
    if (available) controller.current?.select(id);
  }
  const actions = [
    { label: "Orbit left", glyph: "←", action: () => controller.current?.rotate(-0.12) },
    { label: "Orbit right", glyph: "→", action: () => controller.current?.rotate(0.12) },
    { label: "View from above", glyph: "↑", action: () => controller.current?.rotate(0, 0.08) },
    { label: "Lower the view", glyph: "↓", action: () => controller.current?.rotate(0, -0.08) },
    { label: "Zoom in", glyph: "+", action: () => controller.current?.zoom(1) },
    { label: "Zoom out", glyph: "−", action: () => controller.current?.zoom(-1) },
  ];
  return (
    <section
      className="sanctuary-world"
      data-ready={available}
      data-selection={selection}
      data-motion={motion}
      aria-label="Interactive Sanctuary"
    >
      <div className="sanctuary-world-toolbar">
        <button ref={returnButton} type="button" className="sanctuary-world-return" onClick={onReturn}>
          <span aria-hidden="true">←</span> Return to film
        </button>
        <span>INSIDE THE SANCTUARY</span>
      </div>
      <div className="sanctuary-world-stage" aria-busy={!state.ready && !failed}>
        <img
          className="sanctuary-world-poster"
          src="/assets/sanctuary/inner-light-poster.webp"
          alt="Twin graphite monoliths and a floating amber core in a sunlit stone chamber."
          width="1280"
          height="720"
          decoding="async"
        />
        <canvas
          key={attempt}
          ref={canvas}
          tabIndex={available ? 0 : -1}
          aria-label="Interactive Sanctuary chamber"
          aria-describedby="sanctuary-world-instructions"
          onKeyDown={(event) => {
            if (!available || event.altKey || event.ctrlKey || event.metaKey) return;
            const keys: Record<string, () => void> = {
              ArrowLeft: () => controller.current?.rotate(-0.12),
              ArrowRight: () => controller.current?.rotate(0.12),
              ArrowUp: () => controller.current?.rotate(0, 0.08),
              ArrowDown: () => controller.current?.rotate(0, -0.08),
              "+": () => controller.current?.zoom(1),
              "=": () => controller.current?.zoom(1),
              "-": () => controller.current?.zoom(-1),
              Home: () => controller.current?.reset(),
            };
            if (keys[event.key]) {
              event.preventDefault();
              keys[event.key]();
            }
          }}
        />
        <div className="sanctuary-world-caption" aria-hidden="true">
          <span>{available ? "AN ORIGINAL 3D INTERPRETATION" : failed ? "STILL ARTWORK" : "OPENING THE CHAMBER"}</span>
          <span>{available ? "DRAG TO ORBIT" : "THE SANCTUARY"}</span>
        </div>
        {failed && (
          <div className="sanctuary-world-fallback" role="status">
            <p>The interactive chamber is unavailable here. Explore its ideas below, or return to the film.</p>
            <button type="button" onClick={() => setAttempt((value) => value + 1)}>
              Try 3D again
            </button>
          </div>
        )}
      </div>
      <div className="sanctuary-world-command">
        <div className="sanctuary-world-awakening">
          <button
            className="sanctuary-world-awaken"
            type="button"
            disabled={!available || !motion || !state.paused}
            onClick={() => controller.current?.awaken()}
          >
            <span aria-hidden="true">◇</span> {state.awake ? "Awaken again" : "Awaken chamber"}
          </button>
          <button type="button" disabled={!available || state.paused} onClick={() => controller.current?.pause()}>
            Pause
          </button>
          <span role="status">
            {!motion
              ? "Motion is paused. Camera and light controls still work."
              : !state.paused
                ? "A six-second awakening. Silent by design."
                : state.awake
                  ? "The chamber is awake. Explore at your own pace."
                  : "Choose a perspective. Bring the chamber to life."}
          </span>
        </div>
        <label className="sanctuary-world-light">
          <span>
            Chamber light <output>{light}%</output>
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={light}
            disabled={!available}
            onChange={(event) => {
              const next = Number(event.currentTarget.value);
              setLight(next);
              controller.current?.setLight(next);
            }}
          />
        </label>
      </div>
      <div className="sanctuary-world-inspection">
        <div className="sanctuary-world-elements" role="group" aria-label="Explore the chamber's ideas">
          {(["core", "left", "right"] as const).map((id, index) => (
            <button key={id} type="button" aria-pressed={selection === id} onClick={() => choose(id)}>
              <small>0{index + 1}</small>
              {ELEMENTS[id].name}
            </button>
          ))}
        </div>
        <div className="sanctuary-world-detail" aria-live="polite" aria-atomic="true">
          <h3>{detail.title}</h3>
          <p>{detail.text}</p>
        </div>
      </div>
      <details className="sanctuary-world-camera">
        <summary>
          Camera controls <span aria-hidden="true">+</span>
        </summary>
        <p id="sanctuary-world-instructions">
          Drag or use the arrow keys to orbit. Use + and − to zoom, or Home to reset. Select a structure to explore its
          meaning.
        </p>
        <div role="group" aria-label="Sanctuary camera">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              aria-label={action.label}
              disabled={!available}
              onClick={action.action}
            >
              <span aria-hidden="true">{action.glyph}</span>
            </button>
          ))}
          <button type="button" disabled={!available} onClick={() => controller.current?.reset()}>
            Reset view
          </button>
        </div>
      </details>
      <footer className="sanctuary-world-footer">
        <p>An interactive interpretation of the film. Illustrative, with no live systems connected.</p>
        {onWork && (
          <button type="button" onClick={onWork}>
            Explore the working studies <span aria-hidden="true">↗</span>
          </button>
        )}
      </footer>
    </section>
  );
}
