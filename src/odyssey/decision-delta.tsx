import { flightRecap, type FlightDecision } from "./flight-recap-model";

/** Uses the same routing model as the ship and its saved mission record. */
export function DecisionDelta({ decision }: { decision: FlightDecision }) {
  const recap = flightRecap(decision);
  return (
    <div className="ff-delta" aria-label="What your decision changed">
      <span className="ff-eyebrow">YOUR DECISION / BEFORE → AFTER</span>
      <dl>
        {(
          [
            ["local", "Onboard"],
            ["cloud", "Cloud"],
            ["held", "Held"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} data-route={key}>
            <dt>{label}</dt>
            <dd>
              <span>{recap.before[key]}</span>
              <span aria-hidden="true"> → </span>
              <span className="o-sr-only"> to </span>
              <strong>{recap.after[key]}</strong>
            </dd>
            <div className="ff-delta-meter" aria-hidden="true">
              <span style={{ transform: `scaleX(${recap.before[key] / 12})` }} />
              <strong style={{ transform: `scaleX(${recap.after[key] / 12})` }} />
            </div>
          </div>
        ))}
      </dl>
      <p className="ff-delta-caption">Same 12 requests. Your choice changes where they go.</p>
    </div>
  );
}
