import { flightRecap, type FlightDecision } from "./flight-recap-model";

export function FlightRecap({ decision, visitorChoice }: { decision: FlightDecision; visitorChoice: boolean }) {
  const recap = flightRecap(decision);
  return (
    <section className="ff-recap" aria-label="Before and after the routing decision">
      <span className="ff-eyebrow">{visitorChoice ? "YOUR LAST DECISION" : "THE FLIGHT IN REVIEW"}</span>
      <div className="ff-recap-pair">
        {(["before", "after"] as const).map((side) => (
          <div className="ff-recap-state" key={side}>
            <span>{side === "before" ? "Before" : "After"}</span>
            <strong>{recap[`${side}Label`]}</strong>
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
                  <dd>{recap[side][key]}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <p>{recap.after.summary}</p>
      <small>Same twelve requests. One boundary changed.</small>
    </section>
  );
}
