import { SignalInstrument } from "../secondary-study-visuals";
import { Range, Toggle, Result } from "./controls";
import type { ExperimentProps } from "../study-experiment";

export function SignalLab({ input, onChange }: ExperimentProps<"signal">) {
  const { deviation, corroborated } = input;
  const title = deviation < 30 ? "Continue observation" : corroborated ? "Operator review" : "Corroborate the signal";
  return (
    <>
      <SignalInstrument deviation={deviation} corroborated={corroborated} />
      <Range
        label="Deviation from the example baseline"
        value={deviation}
        onChange={(deviation) => onChange({ ...input, deviation })}
      />
      <Toggle
        label="A second observation supports it"
        checked={corroborated}
        onChange={(corroborated) => onChange({ ...input, corroborated })}
      />
      <Result title={title}>
        {deviation < 30
          ? "The selected deviation stays below this example’s review threshold. Keep observing and preserve context."
          : corroborated
            ? "An exception has supporting context. Give the accountable line owner the evidence and a decision to make."
            : "One signal is not enough to establish the cause. Gather a second observation before recommending a consequential response."}
      </Result>
      <p className="o-lab-note">
        Fictional signal and threshold, created for this demonstration. No plant, customer, or live operational data is
        used.
      </p>
    </>
  );
}
