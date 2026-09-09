import { escalationExample } from "../data";
import { CascadeInstrument } from "../secondary-study-visuals";
import { Range, Result } from "./controls";
import type { ExperimentProps } from "../study-experiment";
import { HumanReviewSignal } from "../human-review-signal";

export function CascadeLab({ input, onChange, motion = false }: ExperimentProps<"cascade"> & { motion?: boolean }) {
  const { severity, confidence } = input;
  const result = escalationExample(severity, confidence);
  return (
    <>
      <CascadeInstrument level={result.level} severity={severity} confidence={confidence} />
      <Range
        label="Consequence of being wrong"
        value={severity}
        onChange={(severity) => onChange({ ...input, severity })}
      />
      <Range
        label="Confidence in the evidence"
        value={confidence}
        onChange={(confidence) => onChange({ ...input, confidence })}
      />
      {result.level === 2 && <HumanReviewSignal motion={motion} />}
      <Result title={result.title}>{result.body}</Result>
      <p className="o-lab-note">
        Illustrative thresholds: human review at consequence ≥70% or confidence &lt;40%. These are demonstration rules,
        not production policy.
      </p>
    </>
  );
}
