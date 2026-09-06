export type FlightShot = "arrival" | "inside" | "isolation" | "command";

export type FlightComposition = {
  yaw: number;
  pitch: number;
  focus: readonly [number, number, number];
  radius: number;
  frame: "carrier" | "focus";
};

/** Authored around the carrier's physical AI bay, bridge and separate relay. */
export const FLIGHT_SHOTS: Record<FlightShot, FlightComposition> = {
  arrival: { yaw: 0.82, pitch: 0.4, focus: [2.1, 0.6, -0.8], radius: 10.6, frame: "carrier" },
  inside: { yaw: 0.32, pitch: 1.03, focus: [0, 0.9, -1.15], radius: 4.25, frame: "focus" },
  isolation: { yaw: 0.25, pitch: 0.72, focus: [3.8, 1, -0.8], radius: 11.4, frame: "carrier" },
  command: { yaw: -0.6, pitch: 0.51, focus: [0, 1.45, 3.65], radius: 2.7, frame: "focus" },
};

export const FLIGHT_SHOT_MS = 1450;

/** A phone's short, landscape-shaped stage needs a broadside arrival, not a portrait roll. */
export function flightComposition(shot: FlightShot, canvasWidth: number, viewportWidth: number) {
  const compactCanvas = canvasWidth < 600;
  const phoneArrival = shot === "arrival" && compactCanvas && viewportWidth <= 600;
  return {
    ...FLIGHT_SHOTS[shot],
    ...(phoneArrival ? { yaw: 1.4, pitch: canvasWidth < 340 ? 0.65 : 0.4, focus: [3, 0.6, -0.8] as const } : {}),
    roll: phoneArrival ? 0 : compactCanvas ? -0.62 : 0,
    // Raise the scene into the clear image area above the fixed routing count band.
    screenShift: phoneArrival ? 0.1 : 0,
  };
}

/** Zero acceleration at both ends prevents a visible kick when a chapter settles. */
export function easeFlightShot(progress: number) {
  const t = Math.min(1, Math.max(0, progress));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Fit a focus sphere inside the shorter image dimension, with room for the stage captions. */
export function flightShotDistance(radius: number, aspect: number, verticalFovDegrees = 40) {
  if (!(radius > 0) || !(aspect > 0) || !(verticalFovDegrees > 0 && verticalFovDegrees < 180))
    throw new RangeError("A flight composition needs positive dimensions and a valid field of view.");
  if (![radius, aspect, verticalFovDegrees].every(Number.isFinite))
    throw new RangeError("Flight composition dimensions must be finite.");
  const vertical = (verticalFovDegrees * Math.PI) / 360;
  const limiting = Math.atan(Math.tan(vertical) * Math.min(1, aspect) * 0.78);
  return radius / Math.sin(limiting);
}

export function shortestFlightTurn(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

type FlightVector = { x: number; y: number; z: number };
const dotFlightVector = (a: FlightVector, b: FlightVector) => a.x * b.x + a.y * b.y + a.z * b.z;

/** Fit the actual carrier silhouette about the authored target, including its relay. */
export function flightCarrierDistance(
  points: readonly FlightVector[],
  focus: FlightVector,
  right: FlightVector,
  up: FlightVector,
  back: FlightVector,
  aspect: number,
  verticalFovDegrees = 40,
) {
  const cx = dotFlightVector(focus, right),
    cy = dotFlightVector(focus, up),
    cz = dotFlightVector(focus, back);
  const tangent = Math.tan((verticalFovDegrees * Math.PI) / 360);
  let distance = 1;
  for (const point of points) {
    const z = dotFlightVector(point, back) - cz;
    distance = Math.max(
      distance,
      Math.abs(dotFlightVector(point, right) - cx) / (tangent * aspect * 0.84) + z,
      Math.abs(dotFlightVector(point, up) - cy) / (tangent * 0.69) + z,
    );
  }
  return distance;
}
