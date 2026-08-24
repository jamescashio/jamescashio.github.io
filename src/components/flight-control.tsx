import { FLIGHT_BEATS, flightActionAt } from "@/lib/flight-plan";

type FlightControlProps = {
  active: boolean;
  elapsedMs: number;
  onStart: () => void;
  onStop: () => void;
  className?: string;
};

export function FlightControl({ active, elapsedMs, onStart, onStop, className = "" }: FlightControlProps) {
  const action = flightActionAt(elapsedMs);
  const currentIndex =
    action.kind === "complete" ? FLIGHT_BEATS.length - 1 : FLIGHT_BEATS.findIndex((beat) => beat.at === action.at);
  const currentBeat = FLIGHT_BEATS[Math.max(0, currentIndex)];

  if (!active) {
    return (
      <button
        type="button"
        aria-label="Run the 30-second flight"
        className={`za-btn-ghost min-h-11 px-2 py-2 text-[10px] leading-tight ${className}`}
        onClick={onStart}
      >
        RUN THE 30-SECOND FLIGHT
      </button>
    );
  }

  return (
    <section className={`za-panel p-2 text-left ${className}`} aria-label="30-second flight status">
      <p className="za-mono text-[9px] text-accent" aria-live="polite">
        FLIGHT ACTIVE · BEAT {String(currentIndex + 1).padStart(2, "0")} / 04
      </p>
      <ol className="mt-2 space-y-1" aria-label="Flight progress">
        {FLIGHT_BEATS.map((beat, index) => (
          <li
            key={beat.label}
            aria-current={index === currentIndex ? "step" : undefined}
            className={`za-mono text-[9px] ${index <= currentIndex ? "text-cyan" : "text-dim"}`}
          >
            {String(index + 1).padStart(2, "0")} · {beat.label}
          </li>
        ))}
      </ol>
      <p className="za-mono mt-2 text-[9px] text-ink">NOW · {currentBeat.label}</p>
      <button
        type="button"
        aria-label="Stop the 30-second flight"
        className="za-btn-ghost mt-2 min-h-10 w-full px-2 py-2 text-[9px]"
        onClick={onStop}
      >
        STOP FLIGHT
      </button>
    </section>
  );
}
