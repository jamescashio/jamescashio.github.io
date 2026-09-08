import { escalationExample } from "../data";
import { CascadeInstrument } from "../secondary-study-visuals";
import { Range, Result } from "./controls";
import type { ExperimentProps } from "../study-experiment";

export function CascadeLab({ input, onChange }: ExperimentProps<"cascade">) {
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
      <Result title={result.title}>{result.body}</Result>
      <p className="o-lab-note">
        Illustrative thresholds: human review at consequence ≥70% or confidence &lt;40%. These are demonstration rules,
        not production policy.
      </p>
    </>
  );
}
