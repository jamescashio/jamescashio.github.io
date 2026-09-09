import { Core } from "./effects";

/** One finite response when a human-review result appears, with a complete still state. */
export function HumanReviewSignal({ motion = false }: { motion?: boolean }) {
  return (
    <div className="o-human-review" data-motion={motion ? "on" : "off"}>
      <span className="o-human-review-core" aria-hidden="true">
        <Core />
      </span>
      <span>
        <strong>Bit · Human review</strong>
        <span>The next move belongs to a person.</span>
      </span>
    </div>
  );
}
