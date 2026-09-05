import { useId, useState } from "react";

const STOPS = [
  { label: "THE SYSTEM", detail: "Owned hardware. Dated evidence.", deck: 1, x: 62, y: 139 },
  { label: "THE DECISION", detail: "Quality chooses the route.", deck: 2, x: 258, y: 51 },
  { label: "THE PROOF", detail: "Explore what the builds do.", deck: 5, x: 460, y: 123 },
] as const;

export function FlightMap({ onNavigate }: { onNavigate: (deck: number) => void }) {
  const gradient = useId().replace(/:/g, "");
  const [selected, setSelected] = useState(0);
  return (
    <div className="za-flight-map" data-hud-clear>
      <div className="za-flight-map-head">
        <span className="za-mono">YOUR FLIGHT PLAN</span>
        <span className="za-mono">03 WAYPOINTS / HUMAN COMMAND</span>
      </div>
      <svg viewBox="0 0 520 195" aria-hidden>
        <defs>
          <linearGradient id={gradient}>
            <stop stopColor="#ff9500" />
            <stop offset="1" stopColor="#00f9ff" />
          </linearGradient>
        </defs>
        <path
          className="za-flight-grid"
          d="M20 47H500M20 96H500M20 145H500M62 25V171M160 25V171M258 25V171M356 25V171M454 25V171"
        />
        <path
          className="za-flight-orbit"
          d="M62 139C120 139 141 51 258 51S372 123 460 123"
          stroke={`url(#${gradient})`}
        />
        <path
          className="za-flight-tracer"
          d="M62 139C120 139 141 51 258 51S372 123 460 123"
          stroke={`url(#${gradient})`}
          pathLength="100"
        />
        {STOPS.map((stop, index) => (
          <g key={stop.label} className={selected === index ? "is-selected" : ""}>
            <circle className="za-waypoint-ring" cx={stop.x} cy={stop.y} r="22" />
            <circle className="za-waypoint-dot" cx={stop.x} cy={stop.y} r="5" />
            <text x={stop.x} y={stop.y + 43} textAnchor="middle">
              0{index + 1}
            </text>
          </g>
        ))}
        <path className="za-flight-craft" d="m249 47 19 4-19 5 4-5Z" />
      </svg>
      <div className="za-flight-stops" role="group" aria-label="Explore the flight plan">
        {STOPS.map((stop, index) => (
          <button
            key={stop.label}
            type="button"
            onMouseEnter={() => setSelected(index)}
            onFocus={() => setSelected(index)}
            onClick={() => onNavigate(stop.deck)}
          >
            <span className="za-mono">
              0{index + 1} / {stop.label}
            </span>
            <b>{stop.detail}</b>
            <span className="za-flight-stop-arrow" aria-hidden>
              ↗
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
