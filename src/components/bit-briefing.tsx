import { useState } from "react";
import { useDeck } from "@/lib/store";

const BRIEFINGS: Record<number, [string, string]> = {
  0: ["WELCOME ABOARD", "I’m Bit. Take the flight; I’ll point out what matters."],
  2: ["THE ROUTING LAW", "Start with the job. Check the boundary. Then choose the lane."],
  5: ["THE PROOF", "Try HERMES below. Change the request and watch the decision change."],
  7: ["ASK THE EVIDENCE", "Type sitrep to read the dated snapshot. Every answer has a boundary."],
  8: ["FLIGHT COMPLETE", "You’ve seen the system. Take a proof card with you, or talk to Doug."],
};

export function BitBriefing({ index }: { index: number }) {
  const [dismissed, setDismissed] = useState(false);
  const tour = useDeck((state) => state.tour);
  const completed = useDeck((state) => state.flightCompleted);
  const copy = BRIEFINGS[index];
  if (!copy || dismissed || (index === 8 && !completed)) return null;
  return (
    <aside className={`za-bit-briefing ${tour ? "is-guiding" : ""}`} aria-label="Bit’s briefing" data-hud-clear>
      <svg viewBox="0 0 48 48" aria-hidden>
        <path d="M24 2 44 14 40 37 24 46 5 35 3 14Z M24 2 14 18 3 14 M24 2 35 19 44 14 M5 35 14 18 35 19 40 37 M14 18 24 46 35 19 M3 14 5 35 M14 18 24 29 35 19 M5 35 24 29 40 37 M24 29 24 46" />
      </svg>
      <div>
        <span className="za-mono">BIT / {copy[0]}</span>
        <p>{copy[1]}</p>
      </div>
      <button type="button" aria-label="Dismiss Bit’s briefing" onClick={() => setDismissed(true)}>
        ×
      </button>
    </aside>
  );
}
