import type { Experiment, ExperimentProps } from "./study-experiment";
import { CascadeLab } from "./studies/cascade";
import { ExposureLab } from "./studies/exposure";
import { BriefingLab } from "./studies/briefing";
import { DashboardLab } from "./studies/dashboards";
import { SignalLab } from "./studies/signal";
import { GraphLab } from "./studies/graphify";

type SecondaryExperiment = Exclude<Experiment, { study: "hermes" }>;

/** This boundary keeps optional instruments and their artwork out of the entry bundle. */
export function SecondaryStudy({ input, onChange }: ExperimentProps<SecondaryExperiment["study"]>) {
  switch (input.study) {
    case "cascade":
      return <CascadeLab input={input} onChange={onChange} />;
    case "exposure":
      return <ExposureLab input={input} onChange={onChange} />;
    case "briefing":
      return <BriefingLab input={input} onChange={onChange} />;
    case "dashboards":
      return <DashboardLab input={input} onChange={onChange} />;
    case "signal":
      return <SignalLab input={input} onChange={onChange} />;
    case "graphify":
      return <GraphLab input={input} onChange={onChange} />;
  }
}
