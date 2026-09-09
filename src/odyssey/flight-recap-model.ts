import { computeWorldOutcome, type WorldInput } from "./sovereign-model";

export type FlightDecision = { before: WorldInput; after: WorldInput };

/** Both sides use the scene's model; a recap never substitutes a different workload. */
export function flightRecap({ before, after }: FlightDecision) {
  return {
    before: computeWorldOutcome(before),
    after: computeWorldOutcome(after),
    beforeLabel:
      before.connected !== after.connected
        ? before.connected
          ? "Cloud connected"
          : "Cloud disconnected"
        : before.allowPrivateEgress
          ? "Permission on"
          : "Permission off",
    afterLabel:
      before.connected !== after.connected
        ? after.connected
          ? "Cloud connected"
          : "Cloud disconnected"
        : after.allowPrivateEgress
          ? "Permission on"
          : "Permission off",
  };
}
