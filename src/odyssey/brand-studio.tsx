import { useEffect, useRef, useState, type CSSProperties } from "react";
import { BrandMark } from "./brand-mark";
import CelestialField from "./celestial-field";
import "./brand-studio.css";

const LIGHTS = [
  { id: "balanced", label: "Balanced", note: "Gold intent. Blue possibility." },
  { id: "gold", label: "Gold", note: "Warm light. A human at the center." },
  { id: "ion", label: "Ion", note: "Electric blue. A new perspective." },
] as const;
const LETTERS = [
  { letter: "c", position: 16.5, name: "Curiosity", meaning: "Every possibility begins with a question." },
  { letter: "A", position: 33.5, name: "Agency", meaning: "Powerful tools. A human in command." },
  { letter: "s", position: 48.6, name: "Signal", meaning: "Find the meaning inside the complexity." },
  { letter: "h", position: 61.1, name: "Humanity", meaning: "Build something that matters to people." },
  { letter: "I", position: 73, name: "Imagination", meaning: "See beyond what already exists." },
  { letter: "o", position: 84.1, name: "Orbit", meaning: "Keep exploring. There is always more." },
] as const;
const PULSE_MS = 3400;
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

export default function BrandStudio({
  motion,
  onClose,
  onWatch,
}: {
  motion: boolean;
  onClose: () => void;
  onWatch?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const fieldPointer = useRef({ x: 0.5, y: 0.5, active: false });
  const pose = useRef({ x: 0, y: 0 });
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    tiltX: number;
    tiltY: number;
    letter: number;
    distance: number;
  } | null>(null);
  const [light, setLight] = useState<(typeof LIGHTS)[number]["id"]>("balanced");
  const [fieldStrength, setFieldStrength] = useState(45);
  const [detail, setDetail] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [paused, setPaused] = useState(false);
  const [charged, setCharged] = useState(false);
  const [signal, setSignal] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [stageVisible, setStageVisible] = useState(false);
  const [reduced, setReduced] = useState(true);
  const pulseRemaining = useRef(PULSE_MS);
  const pulseGeneration = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const selected = LETTERS[selectedIndex];
  const canMove = motion && !reduced;
  const animated = canMove && !paused && pageVisible && stageVisible;

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => setReduced(media.matches);
    const visibility = () => setPageVisible(!document.hidden);
    preference();
    visibility();
    media.addEventListener("change", preference);
    document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1);
        if (entry) setStageVisible(entry.isIntersecting);
      },
      { threshold: 0.08 },
    );
    if (stage.current) observer.observe(stage.current);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", preference);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  useEffect(() => {
    const panel = dialog.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (panel && !panel.open) panel.showModal();
    close.current?.focus({ preventScroll: true });
    return () => {
      clearTimeout(timer.current);
      panel?.close();
      document.body.style.overflow = overflow;
      // The parent restores the actual launcher, including direct #signature entry.
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

  function tilt(x: number, y: number) {
    pose.current = { x: clamp(x, -9, 9), y: clamp(y, -12, 12) };
    stage.current?.style.setProperty("--tilt-x", `${pose.current.x}deg`);
    stage.current?.style.setProperty("--tilt-y", `${pose.current.y}deg`);
  }
  function finishDrag() {
    drag.current = null;
    fieldPointer.current.active = false;
    setDragging(false);
  }
  function updatePointer(element: HTMLDivElement, clientX: number, clientY: number) {
    const rect = element.getBoundingClientRect();
    const x = (clientX - rect.left) / Math.max(1, rect.width);
    const y = (clientY - rect.top) / Math.max(1, rect.height);
    fieldPointer.current.x = clamp(x, 0, 1);
    fieldPointer.current.y = clamp(y, 0, 1);
    fieldPointer.current.active = x >= 0 && x <= 1 && y >= 0 && y <= 1;
  }
  function chooseCamera(inspect: boolean) {
    finishDrag();
    tilt(0, 0);
    setDetail(inspect);
  }
  function ignite() {
    clearTimeout(timer.current);
    pulseGeneration.current += 1;
    pulseRemaining.current = PULSE_MS;
    setCharged(true);
    setSignal((previous) => previous + 1);
  }
  function reset() {
    clearTimeout(timer.current);
    pulseGeneration.current += 1;
    pulseRemaining.current = PULSE_MS;
    setCharged(false);
    setSignal(0);
    setLight("balanced");
    setFieldStrength(45);
    fieldPointer.current = { x: 0.5, y: 0.5, active: false };
    setSelectedIndex(1);
    chooseCamera(false);
  }
  const status = charged
    ? animated
      ? `Light begins at ${selected.name.toLowerCase()} and travels through the signature.`
      : `The signature is illuminated at ${selected.name.toLowerCase()}. Motion is still.`
    : !canMove
      ? "A quiet signature. Light and letter controls remain yours to explore."
      : paused
        ? "Motion is paused. Change the light or find another perspective."
        : LIGHTS.find((item) => item.id === light)!.note;

  return (
    <dialog
      ref={dialog}
      className="brand-studio"
      data-motion={animated ? "on" : "off"}
      data-light={light}
      data-camera={detail ? "inspect" : "orbit"}
      data-charged={charged ? "true" : "false"}
      data-reduced={canMove ? "false" : "true"}
      aria-labelledby="brand-studio-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const focusable = [
          ...event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ].filter((element) => {
          const style = getComputedStyle(element);
          return element.getClientRects().length > 0 && style.visibility !== "hidden" && !element.closest("[inert]");
        });
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <header className="bs-header">
        <div className="bs-title-group">
          <span className="bs-header-orbit" aria-hidden="true">
            <i />
          </span>
          <div>
            <span className="bs-eyebrow">HOUSE CASHIO / LIGHT, UNDER YOUR COMMAND</span>
            <h2 id="brand-studio-title">Celestial Forge</h2>
          </div>
        </div>
        <button ref={close} type="button" onClick={onClose} aria-label="Close celestial signature" className="bs-close">
          Close <span aria-hidden="true">×</span>
        </button>
      </header>
      <div
        ref={stage}
        className="bs-stage"
        data-detail={detail ? "true" : "false"}
        data-dragging={dragging ? "true" : "false"}
        style={
          {
            "--focus-shift": `${50 - selected.position}%`,
            "--origin-position": `${selected.position}%`,
          } as CSSProperties
        }
      >
        <div className="bs-stage-label" aria-hidden="true">
          <span>{detail ? "02 / INSIDE THE SIGNATURE" : "01 / A LITTLE UNIVERSE"}</span>
          <span>{light === "ion" ? "ION BLUE" : light === "gold" ? "CHAMPAGNE GOLD" : "GOLD × ION"}</span>
        </div>
        <div
          className="bs-art-window"
          tabIndex={0}
          role="group"
          aria-label={
            detail
              ? "Signature detail. Use left and right arrows to explore its six letters. Press Enter to send light."
              : "Signature perspective. Use arrow keys or drag to turn the artwork. Press Enter to send light."
          }
          aria-describedby="bs-view-help"
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              if (!event.repeat) ignite();
              return;
            }
            if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(event.key)) return;
            event.preventDefault();
            if (event.key === "Home") {
              tilt(0, 0);
              if (detail) setSelectedIndex(1);
            } else if (detail)
              setSelectedIndex((current) =>
                clamp(current + (["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1), 0, LETTERS.length - 1),
              );
            else
              tilt(
                pose.current.x + (event.key === "ArrowUp" ? 2 : event.key === "ArrowDown" ? -2 : 0),
                pose.current.y + (event.key === "ArrowLeft" ? -3 : event.key === "ArrowRight" ? 3 : 0),
              );
          }}
          onPointerDown={(event) => {
            if (event.button !== 0 || !event.isPrimary) return;
            updatePointer(event.currentTarget, event.clientX, event.clientY);
            drag.current = {
              id: event.pointerId,
              x: event.clientX,
              y: event.clientY,
              tiltX: pose.current.x,
              tiltY: pose.current.y,
              letter: selectedIndex,
              distance: 0,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
          }}
          onPointerMove={(event) => {
            const start = drag.current;
            if (event.isPrimary && (event.pointerType !== "touch" || start?.id === event.pointerId))
              updatePointer(event.currentTarget, event.clientX, event.clientY);
            if (!start || start.id !== event.pointerId) return;
            start.distance = Math.max(start.distance, Math.hypot(event.clientX - start.x, event.clientY - start.y));
            if (detail)
              setSelectedIndex(clamp(start.letter - Math.round((event.clientX - start.x) / 60), 0, LETTERS.length - 1));
            else
              tilt(
                start.tiltX - (event.pointerType === "touch" ? 0 : (event.clientY - start.y) / 18),
                start.tiltY + (event.clientX - start.x) / 20,
              );
          }}
          onPointerUp={(event) => {
            const start = drag.current;
            if (!start || start.id !== event.pointerId) return;
            const distance = Math.max(start.distance, Math.hypot(event.clientX - start.x, event.clientY - start.y));
            finishDrag();
            if (distance < 8) ignite();
          }}
          onPointerLeave={() => {
            fieldPointer.current.active = false;
          }}
          onPointerCancel={finishDrag}
          onLostPointerCapture={finishDrag}
        >
          <div className="bs-field-layer" aria-hidden="true">
            <CelestialField
              motion={animated}
              light={light}
              signal={signal}
              focusLetter={selectedIndex}
              strength={fieldStrength}
              pointer={fieldPointer}
            />
          </div>
          <div className="bs-parallax">
            <div className="bs-orbit-plane" aria-hidden="true">
              <div className="bs-orbit-track">
                <i />
              </div>
              <div className="bs-orbit-track bs-orbit-track-two">
                <i />
              </div>
              <div className="bs-orbit-track bs-orbit-track-three">
                <i />
              </div>
              <span className="bs-pole bs-pole-one" />
              <span className="bs-pole bs-pole-two" />
            </div>
            <div className="bs-mark-plane">
              <BrandMark
                motion={animated}
                studio
                magnified={detail}
                mode="all"
                light={light}
                charged={charged}
                signal={signal}
                focusLetter={selectedIndex}
              />
              {charged && canMove && <span key={signal} className="bs-pulse-wave" aria-hidden="true" />}
            </div>
          </div>
        </div>
        <div className="bs-stage-baseline">
          <p id="bs-view-help">{detail ? "Drag to explore. Tap to send light." : "Drag to turn. Tap to send light."}</p>
          <span aria-hidden="true">IMAGINATION, WITH INTENTION.</span>
        </div>
      </div>
      <div className="bs-explorer">
        <div className="bs-focus-copy" aria-live="polite" aria-atomic="true">
          <span className="bs-eyebrow">
            {String(selectedIndex + 1).padStart(2, "0")} / {selected.name}
          </span>
          <p>{selected.meaning}</p>
        </div>
        <div className="bs-letters" role="group" aria-label="Choose a signature letter">
          {LETTERS.map((item, index) => (
            <button
              key={item.name}
              type="button"
              aria-label={`Inspect ${item.letter}: ${item.name}`}
              aria-pressed={selectedIndex === index}
              onClick={() => setSelectedIndex(index)}
            >
              {item.letter}
            </button>
          ))}
        </div>
      </div>
      <div className="bs-controls">
        <div className="bs-control-group">
          <span className="bs-eyebrow">SCULPT THE LIGHT</span>
          <div role="group" aria-label="Signature light" className="bs-lights">
            {LIGHTS.map((item) => (
              <button key={item.id} type="button" aria-pressed={light === item.id} onClick={() => setLight(item.id)}>
                <i data-light={item.id} aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </div>
          <div className="bs-field-control">
            <label htmlFor="bs-field-strength">Field strength</label>
            <input
              id="bs-field-strength"
              className="bs-field-strength"
              type="range"
              min={0}
              max={100}
              step={1}
              value={fieldStrength}
              aria-valuetext={`${fieldStrength} percent`}
              onChange={(event) => setFieldStrength(Number(event.currentTarget.value))}
            />
            <output htmlFor="bs-field-strength" aria-hidden="true">
              {fieldStrength}
              <span>%</span>
            </output>
          </div>
        </div>
        <div className="bs-control-group">
          <span className="bs-eyebrow">FIND YOUR PERSPECTIVE</span>
          <div role="group" aria-label="Signature camera" className="bs-cameras">
            <button type="button" aria-label="Orbit view" aria-pressed={!detail} onClick={() => chooseCamera(false)}>
              Orbit
            </button>
            <button type="button" aria-label="Inspect detail" aria-pressed={detail} onClick={() => chooseCamera(true)}>
              Inspect
            </button>
          </div>
        </div>
        <div className="bs-playback">
          <button type="button" onClick={ignite} className="bs-pulse">
            Ignite signature <span aria-hidden="true">↗</span>
          </button>
          <div className="bs-transport">
            <button
              type="button"
              disabled={!canMove}
              onClick={() => setPaused(!paused)}
              aria-label={
                !canMove
                  ? "Signature motion follows your page or device preference"
                  : paused
                    ? "Resume signature motion"
                    : "Pause signature motion"
              }
            >
              {!canMove ? "Motion off" : paused ? "Resume" : "Pause"}
            </button>
            <button type="button" onClick={reset} aria-label="Reset signature">
              Reset <span aria-hidden="true">↺</span>
            </button>
          </div>
        </div>
      </div>
      <footer className="bs-footer">
        <p className="bs-description" role="status">
          {status}
        </p>
        {onWatch && (
          <button type="button" className="bs-watch" onClick={onWatch}>
            <span className="bs-watch-icon" aria-hidden="true">
              ▷
            </span>
            Watch the signature awaken
            <span aria-hidden="true">↗</span>
          </button>
        )}
      </footer>
    </dialog>
  );
}
