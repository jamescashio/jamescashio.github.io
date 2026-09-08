import { exposureExample } from "../data";
import { ExposureInstrument } from "../secondary-study-visuals";
import { Toggle, Result } from "./controls";
import type { ExperimentProps } from "../study-experiment";

export function ExposureLab({ input, onChange }: ExperimentProps<"exposure">) {
  const { reachable, auth, critical } = input;
  const result = exposureExample(reachable, auth, critical);
  return (
    <>
      <ExposureInstrument reachable={reachable} auth={auth} critical={critical} />
      <Toggle
        label="Observed from the public internet"
        checked={reachable}
        onChange={(reachable) => onChange({ ...input, reachable })}
      />
      <Toggle
        label="Authentication boundary observed"
        checked={auth}
        onChange={(auth) => onChange({ ...input, auth })}
      />
      <Toggle
        label="Business-critical asset"
        checked={critical}
        onChange={(critical) => onChange({ ...input, critical })}
      />
      <Result title={result.level}>{result.body}</Result>
      <p className="o-lab-note">
        Synthetic scenario. This demonstrates triage logic; it does not scan a target or establish a real finding.
      </p>
    </>
  );
}
