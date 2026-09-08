import { FLEET_EVIDENCE } from "../fleet-evidence";
import { ObservationClock } from "../secondary-study-visuals";
import { Range, Result } from "./controls";
import type { ExperimentProps } from "../study-experiment";

export function DashboardLab({ input, onChange }: ExperimentProps<"dashboards">) {
  const { age } = input;
  const stale = age >= 24;
  return (
    <>
      <div className={`o-freshness ${stale ? "stale" : ""}`}>
        <ObservationClock age={age} stale={stale} />
        <div>
          <span className="o-micro">SYNTHETIC OBSERVATION</span>
          <h4>{stale ? "Refresh required." : "Within its window."}</h4>
          <p>The observation stays the same. Its age changes how confidently it can be used.</p>
        </div>
      </div>
      <div className={`lv-freshness-timeline ${stale ? "lv-timeline-stale" : ""}`} aria-hidden="true">
        <div>
          <i style={{ left: `${(age / 48) * 100}%` }} />
          <b />
        </div>
        <span>OBSERVED</span>
        <span>24H REVIEW WINDOW</span>
        <span>48H</span>
      </div>
      <Range
        label="Time since the example observation"
        value={age}
        max={48}
        onChange={(age) => onChange({ ...input, age })}
        unit=" h"
      />
      <Result title={stale ? "The evidence is stale." : "The evidence has a date."}>
        {stale
          ? "After this example’s 24-hour window, a fresh observation is required. A green historical result cannot stand in for current health."
          : "The example is inside a 24-hour freshness window. Display the collection time, source, and scope alongside the result."}
      </Result>
      <p className="o-lab-note">
        This clock is simulated. The fleet observation is dated {FLEET_EVIDENCE.verifiedLong}; the example’s 24-hour
        window does not validate or extend that observation.
      </p>
    </>
  );
}
