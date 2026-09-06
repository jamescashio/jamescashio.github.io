import type { WorldInput } from "./sovereign-model";
export type RequestRoute = "local" | "cloud" | "held";

/** Preserve individual request identities when a visitor changes the routing boundary. */
export function flightRequests(input: WorldInput) {
  const privateCount = input.sensitivity === "private" ? 12 : input.sensitivity === "mixed" ? 6 : 0;
  return Array.from({ length: 12 }, (_, id) => {
    const sensitive = id < privateCount;
    let route: RequestRoute;
    if (input.architecture === "sovereign") route = "local";
    else if (input.architecture === "hybrid") route = sensitive || !input.connected ? "local" : "cloud";
    else route = input.connected && (!sensitive || input.allowPrivateEgress) ? "cloud" : "held";
    return { id, sensitive, route };
  });
}
