// ZeusApollo viewscreen stage.
// Procedural geometry builders. Every hull is built nose toward positive x.
import * as THREE from "three";

export type Point = readonly [number, number];
export type Profile = ReadonlyArray<Point>;

// ---------- procedural craft, built nose-toward +X ----------
// Hulls are revolved from real fuselage profiles and extruded from real
// planform outlines, at published length/span/diameter ratios — not stacked
// primitives. Each craft works in its own units; the stage normalizes scale.
export const RX = -Math.PI / 2;

// body of revolution from a [x, radius] profile — fuselages, nacelles, nose cones
export const revolve = (profile: Profile, seg?: number, twist?: number): THREE.BufferGeometry => {
  const pts = profile
    .slice()
    .sort((a, b) => a[0] - b[0])
    .map((p) => new THREE.Vector2(Math.max(0.004, p[1]), p[0]));
  const g = new THREE.LatheGeometry(pts, seg || 22);
  g.rotateZ(RX);
  if (twist) g.rotateX(twist);
  return g;
};
// horizontal flying surface from a real planform outline [x, span]
export const plan = (pts: Profile, thick: number, y?: number, x?: number): THREE.BufferGeometry => {
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1]))), {
    depth: thick,
    bevelEnabled: false,
  });
  g.rotateX(RX);
  g.translate(x || 0, (y || 0) - thick / 2, 0);
  return g;
};
// mirrored pair of surfaces from one right-side outline (flaps, stabilizers)
export const plan2 = (pts: Profile, thick: number, y?: number, x?: number): THREE.BufferGeometry => {
  const right = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1])));
  const left = new THREE.Shape(
    pts
      .slice()
      .reverse()
      .map((p) => new THREE.Vector2(p[0], -p[1])),
  );
  const g = new THREE.ExtrudeGeometry([right, left], { depth: thick, bevelEnabled: false });
  g.rotateX(RX);
  g.translate(x || 0, (y || 0) - thick / 2, 0);
  return g;
};
// vertical surface (fin, rudder) from a side outline [x, height], optional cant
export const fin = (pts: Profile, thick: number, z?: number, cant?: number): THREE.BufferGeometry => {
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1]))), {
    depth: thick,
    bevelEnabled: false,
  });
  g.translate(0, 0, -thick / 2);
  if (cant) g.rotateX(cant);
  g.translate(0, 0, z || 0);
  return g;
};
export const tube = (
  len: number,
  r1: number,
  r2: number,
  seg: number,
  x?: number,
  y?: number,
  z?: number,
  ry?: number,
): THREE.BufferGeometry => {
  const g = new THREE.CylinderGeometry(r1, r2, len, seg, 1, false);
  g.rotateZ(RX);
  if (ry) g.rotateY(ry);
  g.translate(x || 0, y || 0, z || 0);
  return g;
};
export const cap = (r: number, seg: number, x?: number, y?: number, z?: number): THREE.BufferGeometry => {
  const g = new THREE.SphereGeometry(r, seg, Math.max(6, seg >> 1));
  g.translate(x || 0, y || 0, z || 0);
  return g;
};
export const slab = (
  w: number,
  h: number,
  d: number,
  x?: number,
  y?: number,
  z?: number,
  ry?: number,
  rx?: number,
  rz?: number,
): THREE.BufferGeometry => {
  const g = new THREE.BoxGeometry(w, h, d);
  if (rz) g.rotateZ(rz);
  if (ry) g.rotateY(ry);
  if (rx) g.rotateX(rx);
  g.translate(x || 0, y || 0, z || 0);
  return g;
};
export const ring = (r: number, t: number, x?: number, seg?: number, y?: number, z?: number): THREE.BufferGeometry => {
  const g = new THREE.TorusGeometry(r, t, 8, seg || 24);
  g.rotateY(Math.PI / 2);
  g.translate(x || 0, y || 0, z || 0);
  return g;
};
export const bell = (
  len: number,
  rIn: number,
  rOut: number,
  x?: number,
  y?: number,
  z?: number,
): THREE.BufferGeometry => {
  const g = new THREE.CylinderGeometry(rOut, rIn, len, 12, 1, true);
  g.rotateZ(RX);
  g.translate(x || 0, y || 0, z || 0);
  return g;
};
export const cluster = (
  n: number,
  R: number,
  fn: (x: number, y: number, angle: number, index: number) => THREE.BufferGeometry,
): THREE.BufferGeometry[] => {
  const out: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push(fn(Math.cos(a) * R, Math.sin(a) * R, a, i));
  }
  return out;
};
