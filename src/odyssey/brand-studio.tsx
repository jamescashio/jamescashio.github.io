import { useEffect, useRef, useState, type CSSProperties } from "react";
import { BrandMark } from "./brand-mark";
import type { CircuitMode } from "./brand-circuit";
import "./brand-studio.css";

const MODES: { id: CircuitMode; label: string; detail: string }[] = [
  { id: "all", label: "All systems", detail: "Cyan light. Gold intent. A little controlled chaos." },
  { id: "runners", label: "Light runners", detail: "Follow the light as it races through each letter's circuits." },
  { id: "code", label: "Code stream", detail: "Symbols flow inside the letters. The human core stays in command." },
];
const LETTERS = [
  { letter: "c", position: 18.5, name: "Cyan gateway" },
  { letter: "A", position: 32.75, name: "The human core" },
  { letter: "s", position: 48, name: "Signal switchback" },
  { letter: "h", position: 60.3, name: "Circuit bridge" },
  { letter: "i", position: 71.3, name: "The processor" },
  { letter: "o", position: 81.4, name: "The endless loop" },
];

export default function BrandStudio({ motion, onClose }: { motion: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<CircuitMode>("all");
  const [paused, setPaused] = useState(false);
  const [charged, setCharged] = useState(false);
  const [detail, setDetail] = useState(false);
  const [position, setPosition] = useState(32.75);
  const [dragging, setDragging] = useState(false);
  const [signal, setSignal] = useState(0);
  const [pageVisible, setPageVisible] = useState(true);
  const [stageVisible, setStageVisible] = useState(false);
  const pulseRemaining = useRef(3400);
  const pulseGeneration = useRef(0);
  const drag = useRef<{ id: number; x: number; position: number; width: number } | null>(null);
  const selected = LETTERS.reduce((nearest, item) =>
    Math.abs(item.position - position) < Math.abs(nearest.position - position) ? item : nearest,
  );
  const pan = (value: number) => setPosition(Math.max(15, Math.min(86, value)));
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const animated = motion && !paused && pageVisible && stageVisible;
  const selectedIndex = LETTERS.indexOf(selected);
  useEffect(() => {
    const visibility = () => setPageVisible(!document.hidden);
    visibility();
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1);
        if (entry) setStageVisible(entry.isIntersecting);
      },
      { threshold: 0.05 },
    );
    if (stage.current) observer.observe(stage.current);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    if (!charged || !animated) return;
    const started = performance.now();
    const generation = pulseGeneration.current;
    timer.current = setTimeout(() => setCharged(false), pulseRemaining.current);
    return () => {
      clearTimeout(timer.current);
      if (generation === pulseGeneration.current)
        pulseRemaining.current = Math.max(0, pulseRemaining.current - (performance.now() - started));
    };
  }, [charged, animated, signal]);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const panel = dialog.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel?.showModal();
    close.current?.focus();
    return () => {
      clearTimeout(timer.current);
      panel?.close();
      document.body.style.overflow = overflow;
      opener?.focus({ preventScroll: true });
    };
  }, []);
  function pulse(reveal = true) {
    clearTimeout(timer.current);
    pulseGeneration.current += 1;
    pulseRemaining.current = 3400;
    setCharged(true);
    setSignal((previous) => previous + 1);
    if (reveal) stage.current?.scrollIntoView({ block: "nearest", behavior: motion && !paused ? "smooth" : "instant" });
  }
  return (
    <dialog
      ref={dialog}
      className="brand-studio"
      data-motion={motion && !paused && pageVisible ? "on" : "off"}
      aria-labelledby="brand-studio-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const buttons = [
          ...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]'),
        ];
        if (event.shiftKey && document.activeElement === buttons[0]) {
          event.preventDefault();
          buttons.at(-1)?.focus();
        } else if (!event.shiftKey && document.activeElement === buttons.at(-1)) {
          event.preventDefault();
          buttons[0]?.focus();
        }
      }}
    >
      <header className="bs-header">
        <div>
          <span className="bs-eyebrow">HOUSE CASHIO / SIGNATURE 037</span>
          <h2 id="brand-studio-title">The living circuit.</h2>
        </div>
        <button ref={close} type="button" onClick={onClose} aria-label="Close living circuit">
          Close <span aria-hidden="true">×</span>
        </button>
      </header>
      <div
        ref={stage}
        className="bs-stage"
        data-detail={detail ? "true" : "false"}
        data-dragging={dragging ? "true" : "false"}
        data-charged={charged && animated ? "true" : "false"}
        style={{ "--focus-shift": `${50 - position}%`, "--origin-position": `${selected.position}%` } as CSSProperties}
        onPointerMove={(event) => {
          if (!animated || event.pointerType !== "mouse") return;
          const rect = event.currentTarget.getBoundingClientRect();
          event.currentTarget.style.setProperty("--light-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
          event.currentTarget.style.setProperty("--light-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
        }}
      >
        <div className="bs-stage-label">
          <span>IMAGINATION, WITH INTENTION.</span>
          <span>cA / 037</span>
        </div>
        <div
          className="bs-art-window"
          tabIndex={detail ? 0 : undefined}
          role={detail ? "group" : undefined}
          aria-label={
            detail
              ? "Logo close-up. Drag horizontally or use left and right arrow keys to explore the letters."
              : undefined
          }
          onKeyDown={(event) => {
            if (!detail || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
            event.preventDefault();
            pan(
              event.key === "Home"
                ? 18.5
                : event.key === "End"
                  ? 81.4
                  : position + (event.key === "ArrowLeft" ? -5 : 5),
            );
          }}
          onPointerDown={(event) => {
            if (!detail || event.button !== 0) return;
            const mark = event.currentTarget.querySelector(".cashio-brand-mark");
            if (!mark) return;
            drag.current = {
              id: event.pointerId,
              x: event.clientX,
              position,
              width: mark.getBoundingClientRect().width,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
          }}
          onPointerMove={(event) => {
            const start = drag.current;
            if (start && event.pointerId === start.id)
              pan(start.position - ((event.clientX - start.x) / start.width) * 100);
          }}
          onPointerUp={() => {
            drag.current = null;
            setDragging(false);
          }}
          onPointerCancel={() => {
            drag.current = null;
            setDragging(false);
          }}
          onLostPointerCapture={() => {
            drag.current = null;
            setDragging(false);
          }}
        >
          <BrandMark
            motion={animated}
            studio
            magnified={detail}
            mode={mode}
            charged={charged && animated}
            signal={signal}
            focusLetter={detail ? selectedIndex : undefined}
          />
        </div>
        <div
          className="bs-signal-instrument"
          aria-hidden="true"
          data-charged={charged ? "true" : "false"}
          data-animated={animated ? "true" : "false"}
        >
          <span className="bs-signal-origin">{selected.letter}</span>
          <span className="bs-signal-rail">
            <i />
          </span>
          <span className="bs-signal-core">AI</span>
          <span className="bs-signal-caption">{charged ? "SIGNAL IN MOTION" : "HUMAN CORE / READY"}</span>
        </div>
        <div className="bs-stage-baseline">
          <span>CYAN / SIGNAL</span>
          <span>GOLD / HUMAN</span>
          <span>VIOLET / POSSIBILITY</span>
        </div>
      </div>
      {detail && (
        <div className="bs-explorer">
          <div className="bs-focus-copy">
            <span className="bs-eyebrow">EXPLORE THE SIGNATURE</span>
            <p aria-live="polite">{selected.name}</p>
            <span>Drag the artwork or choose a letter.</span>
          </div>
          <div className="bs-letters" role="group" aria-label="Inspect a logo letter">
            {LETTERS.map((item) => (
              <button
                key={item.letter}
                type="button"
                aria-label={`Inspect ${item.letter}: ${item.name}`}
                aria-pressed={selected === item}
                onClick={() => {
                  pan(item.position);
                  if (motion && !paused) pulse(false);
                }}
              >
                {item.letter}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="bs-controls">
        <div role="group" aria-label="Logo animation style" className="bs-modes">
          {MODES.map((item) => (
            <button key={item.id} type="button" aria-pressed={mode === item.id} onClick={() => setMode(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="bs-playback">
          <button
            type="button"
            onClick={() => {
              setDetail(!detail);
              drag.current = null;
              setDragging(false);
            }}
          >
            {detail ? "Whole mark" : "Inspect detail"}
          </button>
          <button type="button" onClick={() => pulse()} disabled={!motion || paused} className="bs-pulse">
            Send a pulse <span aria-hidden="true">↗</span>
          </button>
          <button type="button" disabled={!motion} onClick={() => setPaused(!paused)}>
            {!motion ? "Motion paused" : paused ? "Resume motion" : "Pause motion"}
          </button>
        </div>
      </div>
      <p className="bs-description" aria-live="polite">
        {!motion
          ? "A quiet signature. Motion is paused by your page or device preference."
          : charged
            ? `Your signal starts at ${selected.letter}, reaches the human core, and travels through the signature.`
            : MODES.find((item) => item.id === mode)?.detail}
      </p>
    </dialog>
  );
}
