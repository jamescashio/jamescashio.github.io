export const FLIGHT_DURATION_MS = 30_000;

export const FLIGHT_BEATS = [
  { label: "THESIS", at: 0, deck: 0 },
  { label: "ROUTING LAW", at: 7_500, deck: 2 },
  { label: "STRONGEST BUILD", at: 15_000, deck: 5, article: 0 },
  { label: "E.V.E. / CONTACT", at: 22_500, deck: 7 },
] as const;

export type FlightState = {
  active: boolean;
  startedAt: number | null;
};

export function startFlight(now: number): FlightState {
  return { active: true, startedAt: now };
}

export function stopFlight(_state: FlightState): FlightState {
  return { active: false, startedAt: null };
}

export function restartFlight(now: number): FlightState {
  return startFlight(now);
}

export function prepareFlightStart(now: number) {
  return { mode: "technical" as const, flight: restartFlight(now) };
}

const FLIGHT_STOP_KEYS = new Set(["arrowup", "arrowdown", "pageup", "pagedown", "home", "end", " "]);

export function isFlightStopKey(key: string) {
  return FLIGHT_STOP_KEYS.has(key.toLowerCase());
}

export function flightActionAt(elapsedMs: number) {
  if (elapsedMs >= FLIGHT_DURATION_MS) return { kind: "complete" as const, deck: 8, at: FLIGHT_DURATION_MS };

  const elapsed = Math.max(0, elapsedMs);
  let beat: (typeof FLIGHT_BEATS)[number] = FLIGHT_BEATS[0];
  for (const candidate of FLIGHT_BEATS) {
    if (candidate.at > elapsed) break;
    beat = candidate;
  }
  return { kind: "beat" as const, ...beat };
}

export function nextFlightHandoffAt(elapsedMs: number) {
  const elapsed = Math.max(0, elapsedMs);
  for (const beat of FLIGHT_BEATS) {
    if (beat.at > elapsed) return beat.at;
  }
  return elapsed < FLIGHT_DURATION_MS ? FLIGHT_DURATION_MS : null;
}
