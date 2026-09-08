import { useEffect, useRef, useState } from "react";
import { routeExample, type RouteInput } from "../data";
import { Arrow } from "../effects";
import { RouteInstrument } from "../lab-visuals";
import { Toggle, Result } from "./controls";
import type { ExperimentProps } from "../study-experiment";

export function HermesLab({ motion, input, onChange }: ExperimentProps<"hermes"> & { motion: boolean }) {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const output = routeExample(input);
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    setStep(0);
    setRunning(false);
  }, [input]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (!motion && running) {
      timers.current.forEach(clearTimeout);
      setStep(5);
      setRunning(false);
    }
  }, [motion, running]);
  function update(next: RouteInput) {
    timers.current.forEach(clearTimeout);
    onChange({ ...input, ...next });
    setStep(0);
    setRunning(false);
  }
  function run() {
    timers.current.forEach(clearTimeout);
    setStep(motion ? 1 : 5);
    setRunning(motion);
    if (motion)
      timers.current = [2, 3, 4, 5].map((n) =>
        setTimeout(
          () => {
            setStep(n);
            if (n === 5) setRunning(false);
          },
          (n - 1) * 260,
        ),
      );
  }
  return (
    <>
      <RouteInstrument step={step} code={output.code} />
      <fieldset className="o-segment">
        <legend>Choose the work</legend>
        {(
          [
            ["draft", "Draft"],
            ["research", "Research"],
            ["analyze", "Analyze"],
          ] as const
        ).map(([id, name]) => (
          <button
            key={id}
            type="button"
            aria-pressed={input.intent === id}
            onClick={() => update({ ...input, intent: id })}
          >
            {name}
          </button>
        ))}
      </fieldset>
      <Toggle
        label="Contains private information"
        checked={input.privateData}
        onChange={(privateData) => update({ ...input, privateData })}
      />
      <Toggle
        label="Requires attributable sources"
        checked={input.sources}
        onChange={(sources) => update({ ...input, sources })}
      />
      <button className="o-button o-button-gold o-run" onClick={run} disabled={running}>
        {running ? "Qualifying the route…" : step === 5 ? "Run the route again" : "Route this request"}
        <Arrow />
      </button>
      <ol className="o-steps" aria-label="Routing decisions">
        {output.steps.map((text, i) => (
          <li className={step > i ? "complete" : ""} key={text}>
            <span>{step > i ? "✓" : `0${i + 1}`}</span>
            {text}
          </li>
        ))}
      </ol>
      <Result title={step === 5 ? output.lane : running ? "Decision in progress" : "Your intent. A reasoned route."}>
        {step === 5
          ? output.detail
          : "Choose a task and its boundaries, then run the five-step demonstration. No request leaves this page."}
      </Result>
    </>
  );
}
