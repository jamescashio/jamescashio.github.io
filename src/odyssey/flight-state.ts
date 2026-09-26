import { FIRST_FLIGHT } from "./flight-plan";
import type { FlightDecision } from "./flight-recap-model";
import type { WorldInput } from "./sovereign-model";

export type FlightChoices = { connected?: boolean; permitted?: boolean };

/** The first three views share a relay choice. Chapter four explicitly starts a permission scenario. */
export function flightChapterInput(step: number, choices: FlightChoices): WorldInput {
  const scene = FIRST_FLIGHT[step];
  return {
    ...scene.input,
    connected: step < 3 ? (choices.connected ?? scene.input.connected) : scene.input.connected,
    allowPrivateEgress: step === 3 ? (choices.permitted ?? scene.input.allowPrivateEgress) : false,
  };
}

/** Finish always describes the visible chapter, even if the last click was in an earlier one. */
export function chapterRecap(
  step: number,
  input: WorldInput,
  decision: (FlightDecision & { step: number }) | null,
): FlightDecision {
  if (decision?.step === step) return { before: decision.before, after: input };
  return {
    before:
      step === 3
        ? { ...input, allowPrivateEgress: !input.allowPrivateEgress }
        : { ...input, connected: !input.connected },
    after: input,
  };
}
