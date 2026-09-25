import { flightRecap, type FlightDecision } from "./flight-recap-model";

type RecapWording = { eyebrow: string; captions: [string, string]; before: string; after: string; note: string };

export function FlightRecap({
  decision,
  visitorChoice,
  wording,
}: {
  decision: FlightDecision;
  visitorChoice: boolean;
  wording?: RecapWording;
}) {
  const recap = flightRecap(decision);
  return (
    <section className="ff-recap" aria-label="Before and after the routing decision">
      <span className="ff-eyebrow">
        {wording?.eyebrow ?? (visitorChoice ? "YOUR LAST DECISION" : "THE FLIGHT IN REVIEW")}
      </span>
      <div className="ff-recap-pair">
        {(["before", "after"] as const).map((side) => (
          <div className="ff-recap-state" key={side}>
            <span>{wording?.captions[side === "before" ? 0 : 1] ?? (side === "before" ? "Before" : "After")}</span>
            <strong>{wording?.[side] ?? recap[`${side}Label`]}</strong>
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
      <small>{wording?.note ?? "Same twelve requests. One boundary changed."}</small>
    </section>
  );
}
