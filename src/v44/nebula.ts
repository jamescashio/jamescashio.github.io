/**
 * The nebula's two colors at each station, so travel reads as travel: the gate's blue, the
 * screening room's amber, green for the worlds, steel for the workshop, violet at the helm,
 * a cold archive light for the evidence and the house red for the human in command.
 * The arrival's pair is also the one the painted posters are rendered with.
 */
export type Rgb = [number, number, number];
export const NEBULA: Record<string, [Rgb, Rgb]> = {
  arrival: [
    [0.03, 0.07, 0.2],
    [0.16, 0.05, 0.12],
  ],
  cinema: [
    [0.13, 0.07, 0.04],
    [0.2, 0.06, 0.08],
  ],
  worlds: [
    [0.02, 0.11, 0.12],
    [0.05, 0.15, 0.09],
  ],
  workshop: [
    [0.03, 0.07, 0.17],
    [0.06, 0.1, 0.2],
  ],
  helm: [
    [0.07, 0.04, 0.2],
    [0.17, 0.05, 0.19],
  ],
  evidence: [
    [0.04, 0.09, 0.15],
    [0.1, 0.12, 0.17],
  ],
  doug: [
    [0.14, 0.04, 0.06],
    [0.19, 0.09, 0.05],
  ],
};
