import { useEffect, useState } from "react";
import { BOOT } from "@/lib/content";
import { BitMascot } from "./bit-mascot";

const FILM_MS = 6400;
const FADE_MS = 420;

export function PowerOn({ reducedMotion, onDone }: { reducedMotion: boolean; onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    // Reduced motion has no sequence to play, so it must still be released.
    // Returning early here left the overlay up permanently for exactly the
    // visitors who asked for less movement, with no way past it but a key
    // press, which is the one group that should never have to find a trick.
    if (reducedMotion) {
      onDone();
      return;
    }
    const arm = window.setTimeout(() => setArmed(true), 80);
    const end = window.setTimeout(() => {
      setLeaving(true);
      window.setTimeout(onDone, FADE_MS);
    }, FILM_MS);
    return () => {
      window.clearTimeout(arm);
      window.clearTimeout(end);
    };
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

  if (reducedMotion) {
    return (
      <div
        className="za-power-on za-static-lock"
        role="dialog"
        aria-modal="true"
        aria-label="ZeusApollo systems lock"
        onClick={onDone}
      >
        <span className="za-power-on-grid" aria-hidden />
        <span className="za-power-on-scan" aria-hidden />
        <span className="za-power-on-bloom" aria-hidden />
        <span className="za-lcars-cap warm za-power-on-cap-tl">ZA</span>
        <span className="za-lcars-cap cool za-power-on-cap-br">LOCK</span>
        <span className="za-power-on-bar top" aria-hidden />
        <span className="za-power-on-bar bottom" aria-hidden />

        <div className="za-power-on-core">
          <p className="za-kicker za-power-on-kicker on">SYSTEMS LOCKED · HUMAN COMMAND RETAINED</p>
          <div className="za-power-on-log" aria-live="polite">
            {BOOT.map((line) => (
              <p key={line} className="za-bootline za-mono text-cyan">
                {line}
              </p>
            ))}
          </div>
          <div className="za-power-on-bit on">
            <span className="za-power-on-ring" aria-hidden />
            <span className="za-power-on-ring delay" aria-hidden />
            <BitMascot active mood="yes" size={72} />
            <p className="za-mono text-dim">E.V.E. STANDING BY</p>
          </div>
          <h1 className="za-display za-power-on-thesis on">
            OWN THE IRON
            <span>
              AND THE <span className="za-shimmer-text">ROUTE</span>.
            </span>
          </h1>
          <div className="za-power-on-meter" aria-hidden>
            <span style={{ width: "100%" }} />
          </div>
          <p className="za-power-on-pct za-mono text-cyan">LOCKED</p>
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
          ENTER DECK
        </button>
      </div>
    );
  }

  return (
    <div
      className={`za-power-on has-film ${leaving ? "is-done" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="ZeusApollo power-on sequence"
      onClick={onDone}
    >
      <video
        className="za-power-on-film"
        autoPlay
        muted
        playsInline
        poster="/assets/celestial/helios-arrival-poster.jpg"
        onEnded={onDone}
      >
        <source src="/assets/celestial/helios-arrival.mp4" type="video/mp4" />
      </video>
      <span className="za-power-on-film-veil" aria-hidden />
      <span className="za-lcars-cap warm za-power-on-cap-tl">ZA</span>
      <span className="za-lcars-cap cool za-power-on-cap-br">LIVE DECK</span>
      <span className="za-power-on-bar top" aria-hidden />
      <span className="za-power-on-bar bottom" aria-hidden />

      <div className={`za-power-on-core za-power-on-arrival ${armed ? "on" : ""}`}>
        <p className="za-kicker za-power-on-kicker on">V38 · HELIOS · THE HUMAN RECKONING</p>
        <h1 className="za-display za-power-on-thesis on">
          cAshIo
          <span>A human in command.</span>
        </h1>
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
        ENTER THE ORBIT
      </button>
    </div>
  );
}
