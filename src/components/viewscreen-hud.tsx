import { useEffect, useState } from "react";
import { FLIGHT_DURATION_MS } from "@/lib/flight-plan";

const HEADING = Array.from({ length: 24 }, (_, i) => String(i * 15).padStart(3, "0"));

type ViewscreenHudProps = {
  online: boolean;
  tour: boolean;
  craftName: string;
  clock: string;
  beatLabel: string;
  elapsedMs: number;
  reducedMotion: boolean;
};

export function ViewscreenHud({
  online,
  tour,
  craftName,
  clock,
  beatLabel,
  elapsedMs,
  reducedMotion,
}: ViewscreenHudProps) {
  const [locked, setLocked] = useState(reducedMotion && online);

  useEffect(() => {
    if (!online) {
      setLocked(false);
      return;
    }
    if (reducedMotion) {
      setLocked(true);
      return;
    }
    const timer = window.setTimeout(() => setLocked(true), 760);
    return () => window.clearTimeout(timer);
  }, [online, reducedMotion]);

  const status = !online ? "STANDBY" : tour ? "AUTOPILOT" : locked ? "LOCKED" : "ACQUIRING";
  const flightPct = Math.min(100, Math.max(0, (elapsedMs / FLIGHT_DURATION_MS) * 100));
  const spoken = `${status}. Airframe ${craftName}. ${tour ? `Flight beat ${beatLabel}.` : "Dated export. No live telemetry."}`;

  return (
    <div
      className={`za-vs-hud ${online ? "is-online" : ""} ${locked ? "is-locked" : ""} ${tour ? "is-flight" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={spoken}
    >
      <span className="za-vs-elbow tl" aria-hidden />
      <span className="za-vs-elbow tr" aria-hidden />
      <span className="za-vs-elbow bl" aria-hidden />
      <span className="za-vs-elbow br" aria-hidden />
      <span className="za-vs-bracket tl" aria-hidden />
      <span className="za-vs-bracket tr" aria-hidden />
      <span className="za-vs-bracket bl" aria-hidden />
      <span className="za-vs-bracket br" aria-hidden />
      <span className="za-vs-scan" aria-hidden />
      <span className="za-vs-horizon" aria-hidden />

      {reducedMotion ? (
        <div className="za-heading-tape is-static" aria-hidden>
          <span>270</span>
          <b>HDG</b>
        </div>
      ) : (
        <div className="za-heading-tape" aria-hidden>
          <div className="za-heading-track">
            {[...HEADING, ...HEADING].map((mark, index) => (
              <span key={`${mark}-${index}`}>{mark}</span>
            ))}
          </div>
          <b>HDG</b>
        </div>
      )}

      <svg className="za-vs-scope" viewBox="0 0 160 160" aria-hidden>
        <circle cx="80" cy="80" r="62" fill="none" stroke="rgba(0,249,255,0.28)" strokeWidth="1" />
        <circle cx="80" cy="80" r="38" fill="none" stroke="rgba(0,249,255,0.45)" strokeWidth="1.2" />
        <g className="za-vs-scope-ticks" stroke="rgba(0,249,255,0.55)" strokeWidth="1.2">
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const x1 = Math.round((80 + Math.cos(a) * 54) * 1000) / 1000;
            const y1 = Math.round((80 + Math.sin(a) * 54) * 1000) / 1000;
            const x2 = Math.round((80 + Math.cos(a) * 62) * 1000) / 1000;
            const y2 = Math.round((80 + Math.sin(a) * 62) * 1000) / 1000;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </g>
        <polygon className="za-vs-diamond" points="80,68 92,80 80,92 68,80" />
        <line x1="80" y1="18" x2="80" y2="42" stroke="rgba(255,149,0,0.85)" strokeWidth="1.4" />
        <line x1="80" y1="118" x2="80" y2="142" stroke="rgba(255,149,0,0.85)" strokeWidth="1.4" />
        <line x1="18" y1="80" x2="42" y2="80" stroke="rgba(255,149,0,0.85)" strokeWidth="1.4" />
        <line x1="118" y1="80" x2="142" y2="80" stroke="rgba(255,149,0,0.85)" strokeWidth="1.4" />
      </svg>

      <span className="za-vs-core" aria-hidden>
        <span className="za-vs-core-ring" />
        <span className="za-vs-core-ring delay" />
        <span className="za-vs-core-heart" />
      </span>

      <div className="za-vs-readout" aria-hidden>
        <p className="za-kicker">{status} · VIEWSCREEN</p>
        <p className="za-mono text-cyan">AIRFRAME · {craftName}</p>
        <p className="za-mono text-dim">SD {clock || "—"}</p>
        <p className="za-mono text-accent">{tour ? `BEAT · ${beatLabel}` : "DATED EXPORT · NO LIVE TELEMETRY"}</p>
      </div>

      {tour ? (
        <div className="za-vs-flight" aria-hidden>
          <div className="za-kicker">30-SECOND FLIGHT</div>
          <div className="za-display">{beatLabel}</div>
          <div className="za-vs-meter">
            <span style={{ width: `${flightPct}%` }} />
          </div>
        </div>
      ) : null}

      {online && !tour ? (
        <p className={`za-vs-banner ${locked ? "is-locked" : ""}`} aria-hidden>
          {locked ? "SYSTEMS ONLINE · HUMAN COMMAND RETAINED" : "ACQUIRING VIEWSCREEN LOCK"}
        </p>
      ) : null}
    </div>
  );
}
