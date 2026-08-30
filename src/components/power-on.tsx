import { useEffect, useState } from "react";
import { BOOT } from "@/lib/content";
import { BitMascot } from "./bit-mascot";

const DURATION_MS = 3400;

export function PowerOn({ reducedMotion, onDone }: { reducedMotion: boolean; onDone: () => void }) {
  const [tick, setTick] = useState(reducedMotion ? DURATION_MS : 0);

  useEffect(() => {
    if (reducedMotion) return;
    const started = performance.now();
    let frame = 0;
    const loop = (now: number) => {
      setTick(now - started);
      if (now - started < DURATION_MS) frame = requestAnimationFrame(loop);
      else onDone();
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [onDone, reducedMotion]);

  useEffect(() => {
    const skip = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onDone();
      }
    };
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, [onDone]);

  const linesVisible = reducedMotion ? BOOT.length : Math.min(BOOT.length, 1 + Math.floor(tick / 380));
  const showWord = reducedMotion || tick > 220;
  const showBit = reducedMotion || tick > 980;
  const showThesis = reducedMotion || tick > 2100;
  const dissolving = !reducedMotion && tick > 3000;
  const pct = reducedMotion ? 100 : Math.min(100, Math.round((tick / DURATION_MS) * 100));

  return (
    <div
      className={`za-power-on ${reducedMotion ? "za-static-lock" : ""} ${dissolving ? "is-done" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={reducedMotion ? "ZeusApollo systems lock" : "ZeusApollo power-on sequence"}
      onClick={onDone}
    >
      <span className="za-power-on-grid" aria-hidden />
      <span className="za-power-on-scan" aria-hidden />
      <span className="za-power-on-bloom" aria-hidden />
      <span className="za-lcars-cap warm za-power-on-cap-tl">ZA</span>
      <span className="za-lcars-cap cool za-power-on-cap-br">{reducedMotion ? "LOCK" : "LIVE DECK"}</span>
      <span className="za-power-on-bar top" aria-hidden />
      <span className="za-power-on-bar bottom" aria-hidden />

      <div className="za-power-on-core">
        <p className={`za-kicker za-power-on-kicker ${showWord ? "on" : ""}`}>
          {reducedMotion ? "SYSTEMS LOCKED · HUMAN COMMAND RETAINED" : "ZEUSAPOLLO · SOVEREIGN COMMAND CONSOLE"}
        </p>
        <div className="za-power-on-log" aria-live="polite">
          {BOOT.slice(0, linesVisible).map((line) => (
            <p key={line} className="za-bootline za-mono text-cyan">
              {line}
            </p>
          ))}
        </div>
        <div className={`za-power-on-bit ${showBit ? "on" : ""}`}>
          <span className="za-power-on-ring" aria-hidden />
          <span className="za-power-on-ring delay" aria-hidden />
          <BitMascot active mood={reducedMotion ? "yes" : "think"} size={72} />
          <p className="za-mono text-dim">{reducedMotion ? "E.V.E. STANDING BY" : "E.V.E. ACQUIRING THE ROOM"}</p>
        </div>
        <h1 className={`za-display za-power-on-thesis ${showThesis ? "on" : ""}`}>
          OWN THE IRON
          <span>
            AND THE <span className="za-shimmer-text">ROUTE</span>.
          </span>
        </h1>
        <div className="za-power-on-meter" aria-hidden>
          <span style={{ width: `${pct}%` }} />
        </div>
        <p className="za-power-on-pct za-mono text-cyan">
          {reducedMotion ? "LOCKED" : `${String(pct).padStart(2, "0")}%`}
        </p>
      </div>

      <button
        type="button"
        className="za-btn-ghost za-power-on-skip"
        autoFocus
        onClick={(event) => {
          event.stopPropagation();
          onDone();
        }}
      >
        {reducedMotion ? "ENTER DECK" : "SKIP"}
      </button>
    </div>
  );
}
