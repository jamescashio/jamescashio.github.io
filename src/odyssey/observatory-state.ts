export type ObservatoryLight = "dawn" | "ion" | "eclipse";
export type ObservatoryView = "orbit" | "surface" | "gate";
export type ObservatoryWorld = { clouds: number; aurora: number; sun: number };
export type ObservatoryCamera = {
  yaw: number;
  pitch: number;
  distanceRatio: number;
  zoom: number;
  focus: [number, number, number];
  roll: number;
  fov: number;
  phase: number;
};
export type ObservatoryState = {
  light: ObservatoryLight;
  view: ObservatoryView;
  world: ObservatoryWorld;
  resonance: boolean;
  camera?: ObservatoryCamera;
};

export const isObservatoryRoute = (hash: string) => /^#lensing(?:&|$)/.test(hash);
const bound = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const number = (text: string | null, fallback: number, min: number, max: number) =>
  text !== null && /^-?\d+(?:\.\d+)?$/.test(text) && Number.isFinite(Number(text))
    ? bound(Number(text), min, max)
    : fallback;

/** Only bounded visual choices enter the URL. No identifiers, scripts or external URLs. */
export function readObservatoryState(hash: string): ObservatoryState | null {
  if (!isObservatoryRoute(hash) || hash.length > 768) return null;
  const params = new URLSearchParams(hash.slice(9));
  if (params.get("v") !== "1") return null;
  const light = params.get("light"),
    view = params.get("view");
  const state: ObservatoryState = {
    light: light === "ion" || light === "eclipse" ? light : "dawn",
    view: view === "surface" || view === "gate" ? view : "orbit",
    resonance: params.get("gate") === "1",
    world: {
      clouds: number(params.get("clouds"), 50, 0, 100),
      aurora: number(params.get("aurora"), 50, 0, 100),
      sun: number(params.get("sun"), 0, 0, 360),
    },
  };
  const values = params.get("camera")?.split(",");
  if (values?.length === 11 && values.every((v) => /^-?\d+(?:\.\d+)?$/.test(v) && Number.isFinite(Number(v)))) {
    const [yaw, pitch, distanceRatio, zoom, x, y, z, roll, fov, phase, revision] = values.map(Number);
    if (revision === 1)
      state.camera = {
        yaw: bound(yaw, -Math.PI, Math.PI),
        pitch: bound(pitch, -1.05, 1.05),
        distanceRatio: bound(distanceRatio, 0.5, 2),
        zoom: bound(zoom, 0.62, 1.65),
        focus: [bound(x, -5, 5), bound(y, -5, 5), bound(z, -5, 5)],
        roll: bound(roll, -Math.PI, Math.PI),
        fov: bound(fov, 30, 65),
        phase: bound(phase, 0, 86400),
      };
  }
  return state;
}

export function shareObservatoryState(state: ObservatoryState): string {
  const params = new URLSearchParams({
    v: "1",
    light: state.light,
    view: state.view,
    clouds: String(state.world.clouds),
    aurora: String(state.world.aurora),
    sun: String(state.world.sun),
    gate: state.resonance ? "1" : "0",
  });
  if (state.camera) {
    const c = state.camera;
    const turn = (n: number) => Math.atan2(Math.sin(n), Math.cos(n));
    params.set(
      "camera",
      [turn(c.yaw), c.pitch, c.distanceRatio, c.zoom, ...c.focus, turn(c.roll), c.fov, c.phase, 1]
        .map((n) => String(Number(n.toFixed(6))))
        .join(","),
    );
  }
  return `#lensing&${params}`;
}
