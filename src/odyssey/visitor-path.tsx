import type { MouseEvent } from "react";
import { Arrow } from "./effects";

/** A short route through the existing experiences; deep links remain unchanged. */
export function VisitorPath({ onFlight }: { onFlight: (event: MouseEvent<HTMLButtonElement>) => void }) {
  return (
    <nav className="visitor-path" aria-label="Your first minute">
      <div className="visitor-path-intro">
        <span className="o-kicker">YOUR FIRST MINUTE</span>
        <p>See it. Change it. Understand it.</p>
      </div>
      <button type="button" onClick={onFlight}>
        <span className="visitor-step">01</span>
        <span>
          <strong>Take the flight</strong>
          <small>Open the hull. See inside.</small>
        </span>
        <Arrow />
      </button>
      <a href="#boundary-comparison">
        <span className="visitor-step">02</span>
        <span>
          <strong>Change one decision</strong>
          <small>Watch the boundary respond.</small>
        </span>
        <Arrow />
      </a>
      <a href="#smart-routing">
        <span className="visitor-step">03</span>
        <span>
          <strong>Inspect the work</strong>
          <small>A real build. Its dated evidence.</small>
        </span>
        <Arrow />
      </a>
    </nav>
  );
}
