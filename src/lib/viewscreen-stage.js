// @ts-nocheck
// ZeusApollo viewscreen — WebGL stage. Eight craft morph through each other as
// the visitor descends the decks: X-1 → SR-71 → Proteus → Starship →
// Epstein-drive ship → first warp ship → Dune highliner → P-51D Mustang.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { motionDurationMs, shouldRenderFrame } from './animation-timing.ts';

const MINIMUM_FRAME_INTERVAL_MS = 1000 / 30;

const NEBULA_VERT = `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }`;

const NEBULA_FRAG = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uProg;
uniform vec3 uA;
uniform vec3 uB;
uniform float uAspect;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), u.x),
             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}
void main(){
  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  float t = uTime * 0.014;
  float n = fbm(p * 2.6 + vec2(t, -t * 0.6));
  float m = fbm(p * 5.1 - vec2(t * 0.8, t * 0.3));
  float clouds = smoothstep(0.28, 0.92, n * 0.75 + m * 0.35);
  float vign = smoothstep(1.25, 0.15, length(vUv - 0.5) * 1.6);
  vec3 col = mix(uA, uB, clamp(n * 1.25 + uProg * 0.25, 0.0, 1.0));
  col *= clouds * 0.5;
  col += uB * pow(clouds, 3.0) * 0.25;
  gl_FragColor = vec4(col * vign + vec3(0.017, 0.017, 0.026), 1.0);
}`;

const FOLD_VERT = `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const FOLD_FRAG = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uAmt;
void main(){
  vec2 p = vUv * 2.0 - 1.0;
  float r = max(length(p), 0.035);
  float a = atan(p.y, p.x);
  float inv = 1.0 / r;
  float rings = sin(inv * 7.0 - uTime * 3.4) * 0.5 + 0.5;
  float spiral = sin(a * 9.0 + inv * 3.6 - uTime * 2.1) * 0.5 + 0.5;
  float shear = sin(a * 3.0 - uTime * 0.9) * 0.5 + 0.5;
  float edge = smoothstep(1.0, 0.5, r);
  float core = smoothstep(0.42, 0.0, r);
  float v = (rings * 0.5 + spiral * 0.32 + shear * 0.18) * edge;
  vec3 gold = vec3(1.0, 0.76, 0.22);
  vec3 amber = vec3(1.0, 0.52, 0.05);
  vec3 hot = vec3(1.0, 0.97, 0.88);
  vec3 col = mix(mix(amber, gold, rings), hot, core * 0.9);
  float lum = (v + core * 1.6) * uAmt;
  gl_FragColor = vec4(col * lum, min(1.0, lum * 0.9));
}`;

// A soft Fresnel boundary for the first warp ship. The field should read as a
// volume catching starlight at its edge, not a latitude/longitude wire cage.
const WARP_FIELD_VERT = `
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vLocal;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  vLocal = position;
  gl_Position = projectionMatrix * mv;
}`;

const WARP_FIELD_FRAG = `
precision highp float;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vLocal;
uniform float uTime;
uniform float uOpacity;
uniform vec3 uColor;
void main(){
  float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 3.4);
  float contour = 0.72 + 0.28 * sin(vLocal.x * 3.6 - uTime * 1.6);
  float wake = smoothstep(2.7, -2.8, vLocal.x);
  float alpha = rim * contour * (0.58 + wake * 0.42) * uOpacity;
  vec3 color = uColor * (0.34 + rim * 1.1);
  gl_FragColor = vec4(color, alpha);
}`;

// Final grade: radial chromatic aberration, anamorphic streak off the
// highlights, vignette and film grain — the lens the viewscreen is shot through.
const GRADE = {
  uniforms: {
    tDiffuse: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uAmt: { value: 1 },
    uStreak: { value: 0.6 },
    uTear: { value: 0 }
  },
  vertexShader: `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
precision highp float;
varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform vec2 uRes;
uniform float uTime;
uniform float uAmt;
uniform float uStreak;
uniform float uTear;
float h11(float x){ return fract(sin(x * 91.7) * 47453.7); }
void main(){
  vec2 uv = vUv;
  if (uTear > 0.001) {
    float band = floor(uv.y * 46.0);
    float on = step(1.0 - uTear * 0.55, h11(band + floor(uTime * 22.0)));
    uv.x += (h11(band * 3.1 + floor(uTime * 22.0)) - 0.5) * 0.09 * uTear * on;
    uv.y += (h11(band * 7.7) - 0.5) * 0.006 * uTear * on;
  }
  vec2 c = uv - 0.5;
  float ca = 0.0026 * uAmt;
  vec3 col;
  col.r = texture2D(tDiffuse, uv + c * ca).r;
  col.g = texture2D(tDiffuse, uv).g;
  col.b = texture2D(tDiffuse, uv - c * ca).b;
  vec3 st = vec3(0.0);
  float ws = 0.0;
  for (int i = 1; i <= 8; i++) {
    float fi = float(i);
    float o = fi * 3.4 / uRes.x;
    float wt = 1.0 / fi;
    vec3 a = texture2D(tDiffuse, uv + vec2(o, 0.0)).rgb;
    vec3 b = texture2D(tDiffuse, uv - vec2(o, 0.0)).rgb;
    st += (max(a - 0.5, 0.0) + max(b - 0.5, 0.0)) * wt;
    ws += wt;
  }
  col += st / ws * uStreak * vec3(0.5, 0.78, 1.0);
  col *= smoothstep(1.4, 0.2, dot(c, c) * 2.6);
  float g = fract(sin(dot(uv * uRes + uTime, vec2(12.9898, 78.233))) * 43758.5453);
  col += (g - 0.5) * 0.024 * uAmt;
  gl_FragColor = vec4(col, 1.0);
}`
};

const DECK_TINT = [
  [0x0a1424, 0x0d3a4a], [0x08182a, 0x0b4a55], [0x1a1206, 0x4a2a05],
  [0x0c1020, 0x1e3a52], [0x1a1404, 0x4a3a08], [0x120820, 0x35104a],
  [0x0c0c1a, 0x2a2a52], [0x061a18, 0x08453e], [0x1a0c06, 0x4a1e05]
];

// ---------- procedural craft, built nose-toward +X ----------
// Hulls are revolved from real fuselage profiles and extruded from real
// planform outlines, at published length/span/diameter ratios — not stacked
// primitives. Each craft works in its own units; the stage normalizes scale.
const RX = -Math.PI / 2;

// body of revolution from a [x, radius] profile — fuselages, nacelles, nose cones
const revolve = (profile, seg, twist) => {
  const pts = profile.slice().sort((a, b) => a[0] - b[0])
    .map((p) => new THREE.Vector2(Math.max(0.004, p[1]), p[0]));
  const g = new THREE.LatheGeometry(pts, seg || 22);
  g.rotateZ(RX);
  if (twist) g.rotateX(twist);
  return g;
};
// horizontal flying surface from a real planform outline [x, span]
const plan = (pts, thick, y, x) => {
  const g = new THREE.ExtrudeGeometry(
    new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1]))),
    { depth: thick, bevelEnabled: false });
  g.rotateX(RX);
  g.translate(x || 0, (y || 0) - thick / 2, 0);
  return g;
};
// mirrored pair of surfaces from one right-side outline (flaps, stabilizers)
const plan2 = (pts, thick, y, x) => {
  const right = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1])));
  const left = new THREE.Shape(pts.slice().reverse().map((p) => new THREE.Vector2(p[0], -p[1])));
  const g = new THREE.ExtrudeGeometry([right, left], { depth: thick, bevelEnabled: false });
  g.rotateX(RX);
  g.translate(x || 0, (y || 0) - thick / 2, 0);
  return g;
};
// vertical surface (fin, rudder) from a side outline [x, height], optional cant
const fin = (pts, thick, z, cant) => {
  const g = new THREE.ExtrudeGeometry(
    new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1]))),
    { depth: thick, bevelEnabled: false });
  g.translate(0, 0, -thick / 2);
  if (cant) g.rotateX(cant);
  g.translate(0, 0, z || 0);
  return g;
};
const tube = (len, r1, r2, seg, x, y, z, ry) => {
  const g = new THREE.CylinderGeometry(r1, r2, len, seg, 1, false);
  g.rotateZ(RX); if (ry) g.rotateY(ry);
  g.translate(x || 0, y || 0, z || 0); return g;
};
const cap = (r, seg, x, y, z) => {
  const g = new THREE.SphereGeometry(r, seg, Math.max(6, seg >> 1));
  g.translate(x || 0, y || 0, z || 0); return g;
};
const slab = (w, h, d, x, y, z, ry, rx, rz) => {
  const g = new THREE.BoxGeometry(w, h, d);
  if (rz) g.rotateZ(rz); if (ry) g.rotateY(ry); if (rx) g.rotateX(rx);
  g.translate(x || 0, y || 0, z || 0); return g;
};
const ring = (r, t, x, seg, y, z) => {
  const g = new THREE.TorusGeometry(r, t, 8, seg || 24);
  g.rotateY(Math.PI / 2); g.translate(x || 0, y || 0, z || 0); return g;
};
const bell = (len, rIn, rOut, x, y, z) => {
  const g = new THREE.CylinderGeometry(rOut, rIn, len, 12, 1, true);
  g.rotateZ(RX); g.translate(x || 0, y || 0, z || 0); return g;
};
const cluster = (n, R, fn) => {
  const out = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; out.push(fn(Math.cos(a) * R, Math.sin(a) * R, a, i)); }
  return out;
};

const CRAFT = [
  { // 0 — Bell X-1 "Glamorous Glennis". 31ft long, 28ft span, 4.7ft dia:
    // a .50-cal bullet with straight thin wings and a high-mounted tailplane.
    name: 'BELL X-1', era: '1947', tint: 0xf2721c,
    mat: { metal: 0.4, rough: 0.48 }, glowColor: 0xffb066, exhaust: [1.0, 0.3, 0xffb066],
    // international orange airframe, smoked canopy, steel nozzles, silver boom
    livery: (x, y, z, pi) => pi === 5 ? [0.2, 0.24, 0.3]
      : (pi >= 6 && pi <= 9) ? [0.42, 0.42, 0.46]
      : pi === 1 ? [0.75, 0.76, 0.8]
      : pi === 10 ? [0.5, 0.5, 0.54] : [1, 1, 1],
    build: () => [
      revolve([[3.55, 0.02], [3.38, 0.10], [3.10, 0.20], [2.70, 0.30], [2.20, 0.385],
               [1.55, 0.44], [0.80, 0.468], [0.10, 0.47], [-0.75, 0.455], [-1.60, 0.41],
               [-2.35, 0.34], [-2.95, 0.27], [-3.30, 0.22], [-3.42, 0.21]], 26),
      revolve([[4.15, 0.007], [3.62, 0.014], [3.55, 0.02]], 8),
      plan([[0.72, 0], [0.55, 1.1], [0.42, 2.6], [0.30, 3.02], [0.02, 3.06], [-0.18, 2.62],
            [-0.34, 1.1], [-0.55, 0], [-0.34, -1.1], [-0.18, -2.62], [0.02, -3.06],
            [0.30, -3.02], [0.42, -2.6], [0.55, -1.1]], 0.075, -0.04),
      fin([[-1.70, 0.28], [-2.10, 0.90], [-2.72, 1.52], [-3.18, 1.55], [-3.30, 0.24]], 0.08, 0),
      plan([[-2.42, 0], [-2.55, 1.22], [-2.90, 1.26], [-3.02, 0], [-2.90, -1.26], [-2.55, -1.22]], 0.07, 0.95),
      (() => { const c = cap(0.3, 12, 1.35, 0.40, 0); c.scale(1.9, 0.35, 0.75); return c; })(),
      ...cluster(4, 0.145, (y, z) => bell(0.3, 0.06, 0.095, -3.52, y, z)),
      ring(0.225, 0.018, -3.42, 18)
    ],
    mag: 0.82
  },
  { // 1 — Lockheed SR-71. 107ft long, 56ft span: one continuous ogee chine
    // from nose into a modified delta, dorsal spine, two mid-span nacelles
    // with inlet spikes and ejector nozzles, inward-canted all-moving fins.
    name: 'SR-71 BLACKBIRD', era: '1964', tint: 0x2e323c,
    mat: { metal: 0.88, rough: 0.28, env: 3.2, emis: 0.24 },
    // black titanium; bare-metal spikes, warm inlet lips, scorched ejectors
    livery: (x, y, z, pi) => (pi === 6 || pi === 12) ? [1.5, 1.42, 1.28]
      : (pi === 7 || pi === 13) ? [1.34, 1.22, 1.06]
      : (pi === 9 || pi === 15) ? [1.5, 1.12, 0.82]
      : (pi === 8 || pi === 14) ? [0.66, 0.64, 0.62]
      : pi === 3 ? [0.52, 0.6, 0.74] : [1, 1, 1],
    glowColor: 0x8fd8ff, exhaust: [1.9, 0.34, 0xffb27a],
    build: () => {
      const parts = [
        plan([[5.50, 0.00], [4.70, 0.16], [3.70, 0.32], [2.70, 0.44], [1.80, 0.56],
              [1.05, 0.72], [0.30, 1.04], [-0.60, 1.52], [-1.55, 2.06], [-2.45, 2.52],
              [-2.95, 2.70], [-3.38, 2.74], [-3.30, 2.12], [-3.52, 1.88], [-3.74, 1.62],
              [-3.74, 1.30], [-3.44, 1.06], [-3.32, 0.62], [-4.35, 0.44], [-5.22, 0.15],
              [-5.35, 0.00],
              [-5.22, -0.15], [-4.35, -0.44], [-3.32, -0.62], [-3.44, -1.06], [-3.74, -1.30],
              [-3.74, -1.62], [-3.52, -1.88], [-3.30, -2.12], [-3.38, -2.74], [-2.95, -2.70],
              [-2.45, -2.52], [-1.55, -2.06], [-0.60, -1.52], [0.30, -1.04], [1.05, -0.72],
              [1.80, -0.56], [2.70, -0.44], [3.70, -0.32], [4.70, -0.16]], 0.11, 0),
        (() => { const f = revolve([[5.48, 0.02], [5.00, 0.10], [4.20, 0.20], [3.20, 0.30],
                 [2.30, 0.36], [1.20, 0.40], [-0.40, 0.40], [-2.00, 0.37], [-3.40, 0.30],
                 [-4.60, 0.20], [-5.30, 0.12]], 22); f.scale(1, 0.6, 1); f.translate(0, 0.06, 0); return f; })(),
        revolve([[6.30, 0.006], [5.62, 0.014], [5.48, 0.02]], 8),
        (() => { const c = cap(0.26, 14, 2.95, 0.22, 0); c.scale(2.1, 0.6, 0.72); return c; })(),
        (() => { const s2 = revolve([[2.30, 0.16], [0.50, 0.185], [-2.00, 0.17],
                 [-4.20, 0.12], [-5.05, 0.07]], 12); s2.scale(1, 0.5, 0.8); s2.translate(0, 0.18, 0); return s2; })()
      ];
      for (const z of [1.58, -1.58]) {
        parts.push(revolve([[1.55, 0.30], [1.30, 0.42], [0.60, 0.48], [-0.80, 0.48],
                            [-2.20, 0.44], [-3.10, 0.38], [-3.45, 0.33]], 18).translate(0, -0.02, z));
        parts.push(revolve([[2.45, 0.02], [2.05, 0.13], [1.70, 0.24], [1.45, 0.30]], 14)
          .translate(0, -0.02, z));
        parts.push(ring(0.435, 0.02, 1.42, 20, -0.02, z));
        parts.push(bell(0.55, 0.37, 0.30, -3.6, -0.02, z));
        parts.push(ring(0.37, 0.018, -3.86, 18, -0.02, z));
        parts.push(fin([[-1.45, 0.30], [-2.05, 1.24], [-2.85, 1.34], [-3.10, 0.28]],
          0.09, z, z > 0 ? -0.28 : 0.28));
      }
      return parts;
    },
    mag: 1.02
  },
  { // 2 — Scaled Composites Model 281 Proteus. 56ft 4in long, 77.6ft main
    // span, 54.7ft canard span: tandem gull wings, twin booms, two FJ44s.
    name: 'PROTEUS', era: '1998 · RUTAN', tint: 0xb8c7d2,
    mat: { metal: 0.18, rough: 0.64, env: 0.82, emis: 0.015 }, glowColor: 0x7ed9ee,
    wire: 0x45a8c2,
    // A settled, restrained three-quarter pose makes the tandem planform legible.
    pose: { yaw: -0.62, pitch: 0.42, roll: -0.035, motion: 0.2, bloom: 0.2, exposure: 0.64 },
    solidOpacity: 0.64,
    wireOpacity: 0.58,
    lineageSolidOpacity: 0.08,
    lineageWireOpacity: 0.95,
    // No theatrical exhaust: a high-altitude turbofan does not leave a rocket plume.
    exhaust: [0, 0.18, 0xa9dfff],
    livery: (x, y, z, pi) => pi === 1 ? [0.055, 0.10, 0.15]
      : (pi === 12 || pi === 15) ? [0.16, 0.18, 0.2]
      : (pi === 11 || pi === 14) ? [0.52, 0.58, 0.62]
      : (pi === 10 || pi === 13) ? [0.66, 0.72, 0.76]
      : (pi === 8 || pi === 9) ? [0.54, 0.60, 0.64]
      : (pi === 6 || pi === 7) ? [0.64, 0.70, 0.74]
      : pi === 16 ? [0.48, 0.55, 0.62]
      : (pi >= 2 && pi <= 5 && Math.abs(z) > 4.45) ? [0.12, 0.17, 0.2]
      : (pi >= 2 && pi <= 5) ? [0.84, 0.89, 0.92]
      : [0.9, 0.93, 0.95],
    build: () => {
      const gull = (side) => {
        const root = 1.52 * side;
        const tip = 5.42 * side;
        const panel = plan([
          [0.04, root], [-0.24, 3.25 * side], [-0.72, tip], [-1.28, tip],
          [-1.38, 3.20 * side], [-1.52, root]
        ], 0.09, 0.08);
        panel.translate(0, 0, -root);
        panel.rotateX(side * -0.075);
        panel.translate(0, 0, root);
        return panel;
      };
      const parts = [
        revolve([[4.22, 0.025], [4.00, 0.13], [3.62, 0.28], [3.05, 0.44],
                 [2.15, 0.56], [0.85, 0.58], [-0.45, 0.54], [-1.65, 0.43],
                 [-2.52, 0.29], [-3.02, 0.14]], 26),                    // pressure cabin
        (() => { const c = cap(0.34, 14, 0, 0, 0); c.scale(2.25, 0.48, 0.92); c.translate(2.30, 0.43, 0); return c; })(),
        plan([[2.72, 0], [2.48, 1.34], [2.12, 3.72], [1.68, 3.84], [1.30, 1.34], [1.02, 0],
              [1.30, -1.34], [1.68, -3.84], [2.12, -3.72], [2.48, -1.34]], 0.075, 0.02),
        plan([[0.20, 0], [0.04, 1.52], [-1.52, 1.52], [-1.72, 0],
              [-1.52, -1.52], [0.04, -1.52]], 0.11, 0.06),             // main wing centre
        gull(1), gull(-1),
        revolve([[0.40, 0.13], [-0.40, 0.16], [-2.10, 0.17], [-3.62, 0.14], [-4.12, 0.08]], 14)
          .translate(0, 0.10, 1.38),
        revolve([[0.40, 0.13], [-0.40, 0.16], [-2.10, 0.17], [-3.62, 0.14], [-4.12, 0.08]], 14)
          .translate(0, 0.10, -1.38),
        fin([[-2.72, 0.12], [-3.08, 0.92], [-3.70, 1.38], [-4.08, 0.14]], 0.075, 1.38, -0.05),
        fin([[-2.72, 0.12], [-3.08, 0.92], [-3.70, 1.38], [-4.08, 0.14]], 0.075, -1.38, 0.05)
      ];
      for (const z of [0.58, -0.58]) {
        parts.push(revolve([[0.58, 0.09], [0.38, 0.23], [0.05, 0.30], [-0.82, 0.31],
                            [-1.70, 0.27], [-2.18, 0.16]], 18).translate(0, 0.32, z));
        parts.push(ring(0.235, 0.026, 0.38, 20, 0.32, z));
        parts.push(bell(0.28, 0.145, 0.20, -2.30, 0.32, z));
      }
      const pod = revolve([[1.55, 0.04], [1.32, 0.20], [0.82, 0.30], [-0.62, 0.31],
                           [-1.18, 0.22], [-1.42, 0.05]], 16);
      pod.scale(1, 0.72, 0.78); pod.translate(0, -0.48, 0); parts.push(pod);
      return parts;
    },
    mag: 0.88
  },
  { // 3 — Starship full stack. 121m, 9m dia: Ship with two fore and two aft
    // flaps, hot-stage ring, Super Heavy with 33 Raptors and four grid fins.
    name: 'STARSHIP', era: '2023', tint: 0xbcc6d6,
    mat: { metal: 0.96, rough: 0.18, env: 2.2 }, glowColor: 0x9fd0ff, exhaust: [3.2, 0.4, 0x9fd0ff],
    // stainless with the black tile belly on Ship and both flap sets
    livery: (x, y, z, pi) => ((pi === 0 || pi === 5 || pi === 6) && z > 0.05) ? [0.09, 0.09, 0.11]
      : (pi === 1 && x < -5.2) ? [0.5, 0.46, 0.44]
      : pi === 2 ? [0.4, 0.4, 0.44]
      : (pi >= 7 && pi <= 10) ? [0.4, 0.41, 0.45]
      : pi >= 11 ? [0.4, 0.31, 0.26] : [1, 1, 1],
    build: () => {
      const parts = [
        revolve([[6.70, 0.03], [6.46, 0.14], [6.10, 0.27], [5.64, 0.38], [5.10, 0.46],
                 [4.60, 0.494], [4.20, 0.50], [1.95, 0.50]], 28),         // Ship
        revolve([[1.70, 0.50], [-5.90, 0.50], [-6.36, 0.485]], 28),       // Super Heavy
        ring(0.525, 0.055, 1.82, 30),                                     // hot-stage ring
        ring(0.505, 0.014, 3.10, 30), ring(0.505, 0.014, -3.4, 30),
        plan2([[4.30, 0.44], [4.14, 0.80], [3.62, 0.80], [3.48, 0.46]], 0.1, 0.3),
        plan2([[2.66, 0.46], [2.48, 0.94], [1.72, 0.94], [1.56, 0.48]], 0.12, -0.28)
      ];
      parts.push(...cluster(4, 0.72, (y, z, a) => slab(0.5, 0.44, 0.06, 1.18, y, z, 0, a)));
      parts.push(...cluster(20, 0.42, (y, z) => bell(0.4, 0.055, 0.095, -6.6, y, z)));
      parts.push(...cluster(10, 0.27, (y, z) => bell(0.44, 0.06, 0.1, -6.62, y, z)));
      parts.push(...cluster(3, 0.11, (y, z) => bell(0.5, 0.07, 0.115, -6.66, y, z)));
      return parts;
    }
  },
  { // 4 — Rocinante, the first Epstein-drive corvette: a hexagonal-section
    // spearhead hull that flares into the drive cone. Torch, not thrust.
    name: 'EPSTEIN DRIVE', era: 'THE EXPANSE', tint: 0x7f8b9c,
    mat: { metal: 0.8, rough: 0.38 }, glowColor: 0x9fe8ff, exhaust: [8.0, 0.28, 0x9fe8ff],
    // MCRN grey-on-grey: lighter prow armor, black keel rail, scorched drive
    livery: (x, y, z, pi) => pi === 1 ? [0.34, 0.31, 0.29]
      : pi === 5 ? [0.22, 0.22, 0.26]
      : (pi >= 2 && pi <= 4) ? [0.62, 0.64, 0.7]
      : (pi === 0 && x > 2.8) ? [1.22, 1.18, 1.12] : [1, 1, 1],
    build: () => {
      const parts = [
        revolve([[4.60, 0.04], [4.34, 0.22], [3.88, 0.42], [3.18, 0.60], [2.20, 0.74],
                 [0.80, 0.82], [-0.80, 0.84], [-2.00, 0.80], [-2.74, 0.72],
                 [-2.96, 0.55], [-3.16, 0.50], [-3.36, 0.48]], 6, Math.PI / 6),
        bell(1.05, 0.44, 0.88, -3.9, 0, 0),
        ring(0.5, 0.05, -3.36, 6), ring(0.86, 0.05, -2.05, 6), ring(0.8, 0.04, 0.6, 6),
        slab(3.6, 0.07, 0.16, 1.0, -0.86, 0),                             // keel railgun rail
        fin([[0.4, 0.82], [-0.6, 1.16], [-2.3, 1.16], [-2.6, 0.78]], 0.08, 0),
        fin([[0.4, -0.82], [-0.6, -1.16], [-2.3, -1.16], [-2.6, -0.78]], 0.08, 0)
      ];
      for (const z of [0.66, -0.66]) {
        for (const x of [1.5, -0.5]) {
          const t = cap(0.17, 10, x, 0.5, z); t.scale(1.3, 0.8, 1); parts.push(t);
        }
      }
      return parts;
    }
  },
  { // 5 — Cochrane's Phoenix. Converted launch core with a compact command
    // module and twin warp nacelles on swept industrial pylons.
    name: 'PHOENIX', era: '2063 · COCHRANE', tint: 0xc8d0da,
    mat: { metal: 0.78, rough: 0.42, env: 1.28, emis: 0.025 },
    pose: { yaw: -0.38, pitch: 0.12, roll: -0.06, motion: 0.22, bloom: 0.44, exposure: 0.78 },
    solidOpacity: 0.9,
    wireOpacity: 0.14,
    glowColor: 0x58e8f4, exhaust: [0, 0.14, 0x66fff8],
    // Missile silver, scorched bell, a dark cockpit, gunmetal nacelles,
    // amber collectors, and cyan coils. The light stays on the machinery.
    livery: (x, y, z, pi) => pi === 2 ? [0.34, 0.30, 0.26]
      : pi === 6 ? [0.08, 0.14, 0.20]
      : pi === 7 ? [0.38, 0.43, 0.51]
      : (pi === 9 || pi === 14) ? [1.34, 0.58, 0.18]
      : (pi === 10 || pi === 15) ? [0.18, 1.12, 1.36]
      : (pi === 8 || pi === 13) ? [0.42, 0.48, 0.57]
      : (pi === 11 || pi === 16) ? [0.56, 0.60, 0.68]
      : (pi === 12 || pi === 17) ? [1.18, 0.68, 0.28]
      : (pi >= 3 && pi <= 5) ? [0.58, 0.62, 0.68]
      : (pi === 0 && x > 3.7) ? [1.12, 1.09, 1.04] : [0.92, 0.95, 1.0],
    build: () => {
      const parts = [
        revolve([[4.95, 0.012], [4.80, 0.08], [4.58, 0.20], [4.28, 0.34],
                 [3.92, 0.44], [3.60, 0.47], [3.36, 0.43]], 26),          // command module
        revolve([[3.36, 0.36], [3.18, 0.39], [2.70, 0.41], [1.40, 0.42],
                 [-2.10, 0.42], [-2.55, 0.38], [-2.90, 0.28], [-3.08, 0.20]], 26),
        bell(0.72, 0.18, 0.50, -3.48, 0, 0),
        ring(0.16, 0.03, 4.92, 14),
        ring(0.425, 0.02, 1.40, 24),
        ring(0.425, 0.02, -0.90, 24),
        slab(0.32, 0.11, 0.36, 4.15, 0.40, 0)                            // cockpit window
      ];
      parts.push(plan2([
        [1.42, 0.36], [0.76, 1.92], [-0.92, 1.92], [-1.48, 0.38]
      ], 0.075, 0.08));                                                   // swept pylon pair
      for (const z of [2.04, -2.04]) {
        const y = 0.18;
        parts.push(revolve(
          [[2.84, 0.025], [2.64, 0.12], [2.38, 0.24], [2.10, 0.22],
           [1.76, 0.29], [0.45, 0.32], [-1.24, 0.32], [-2.16, 0.27],
           [-2.68, 0.15], [-2.98, 0.045]], 22
        ).translate(-0.08, y, z));                                       // nacelle
        const bus = new THREE.SphereGeometry(0.235, 18, 12);
        bus.scale(1.28, 1, 1);
        bus.translate(2.48, y, z);
        parts.push(bus);                                                 // bussard
        parts.push(slab(2.44, 0.12, 0.045, -0.14, y + 0.02, z + (z > 0 ? -0.32 : 0.32))); // coil
        parts.push(ring(0.282, 0.018, -2.10, 18, y, z));
        parts.push(ring(0.228, 0.038, 2.12, 18, y, z));                  // collector collar
      }
      return parts;
    },
    mag: 1.34
  },
  { // 6 — Guild heighliner: a colossal ribbed cylinder, blunt at both ends.
    // It does not fly to you. It folds the space between.
    name: 'HEIGHLINER', era: 'DUNE · FOLD SPACE', tint: 0xb59357,
    mat: { metal: 0.52, rough: 0.6, env: 1.4, emis: 0.05 }, glowColor: 0xffcc00,
    // Guild bronze: darker structural ribs, shadowed hangar bays, hot fold array
    livery: (x, y, z, pi) => (pi >= 1 && pi <= 11) ? [0.66, 0.6, 0.5]
      : (pi >= 20 && pi < 40 && (pi - 20) % 2 === 0) ? [0.15, 0.14, 0.12]
      : pi >= 51 ? [1.12, 0.92, 0.64]
      : (pi >= 12 && pi <= 19) ? [0.8, 0.74, 0.62] : [1, 1, 1],
    wire: 0xffcc00, exhaust: [0, 0, 0xffcc00],
    build: () => {
      const parts = [
        revolve([[5.60, 0.50], [5.50, 1.00], [5.30, 1.30], [4.90, 1.45], [4.20, 1.52],
                 [2.50, 1.55], [0.00, 1.55], [-2.50, 1.55], [-4.20, 1.52], [-4.90, 1.45],
                 [-5.30, 1.28], [-5.55, 0.90], [-5.62, 0.55]], 40)
      ];
      for (let i = 0; i < 11; i++) {
        const x = -4.6 + i * 0.92;
        parts.push(ring(1.57 + (i > 7 ? 0.03 : 0), 0.05 + (i > 7 ? 0.025 : 0), x, 40));
      }
      parts.push(...cluster(8, 1.555, (y, z, a) => slab(9.4, 0.1, 0.36, 0, y, z, 0, a)));
      for (const z of [1, -1]) {
        for (let i = 0; i < 5; i++) {
          const x = -3.2 + i * 1.6;
          parts.push(slab(0.98, 0.5, 0.26, x, 0.1, z * 1.49, 0, 0));
          parts.push(slab(1.06, 0.06, 0.28, x, 0.42, z * 1.5, 0, 0));
        }
      }
      parts.push(...cluster(4, 1.66, (y, z, a) => slab(1.9, 0.42, 1.05, 2.2, y, z, 0, a)));
      parts.push(...cluster(4, 1.62, (y, z, a) => slab(1.2, 0.32, 0.75, -3.4, y, z, 0, a + 0.4)));
      parts.push(ring(0.72, 0.09, 5.62, 26));
      parts.push(ring(1.02, 0.1, -5.58, 30), ring(0.66, 0.07, -5.66, 22));
      parts.push(...cluster(6, 0.85, (y, z) => bell(0.75, 0.17, 0.32, -6.05, y, z)));
      parts.push(tube(0.1, 0.52, 0.52, 22, -5.72, 0, 0));
      return parts;
    },
    mag: 1.42
  },
  { // 7 — North American P-51D Mustang. The laminar-flow wing, bubble canopy,
    // ventral radiator scoop, four-blade propeller and tall fin must read first.
    name: 'P-51D MUSTANG', era: '1944 · HOOVER', tint: 0xbfc7ce,
    mat: { metal: 0.84, rough: 0.32, env: 1.7, emis: 0.015 }, glowColor: 0x9fdfff,
    wire: 0x67bed0,
    pose: { yaw: -0.58, pitch: 0.28, roll: -0.08, motion: 0.22, bloom: 0.24, exposure: 0.72 },
    solidOpacity: 0.72,
    wireOpacity: 0.56,
    lineageSolidOpacity: 0.07,
    lineageWireOpacity: 0.96,
    exhaust: [0, 0.12, 0xb9e8ff],
    // Polished aluminum, a red fin and spinner, dark canopy and propeller.
    livery: (x, y, z, pi) => (pi === 1 || pi === 4) ? [1.18, 0.16, 0.12]
      : pi === 5 ? [0.06, 0.12, 0.17]
      : (pi === 6 || pi === 7 || pi === 8) ? [0.14, 0.16, 0.18]
      : [0.9, 0.94, 0.98],
    build: () => [
      revolve([[4.05, 0.035], [3.70, 0.18], [3.08, 0.34], [2.10, 0.42],
               [0.78, 0.46], [-0.54, 0.44], [-1.72, 0.38], [-2.78, 0.29],
               [-3.42, 0.20], [-3.72, 0.12]], 26),
      revolve([[4.42, 0.025], [4.25, 0.20], [4.02, 0.30]], 18),
      plan([[1.35, 0], [1.02, 1.18], [0.42, 3.84], [-0.32, 3.78], [-0.92, 1.06], [-1.22, 0],
            [-0.92, -1.06], [-0.32, -3.78], [0.42, -3.84], [1.02, -1.18]], 0.10, -0.02),
      plan([[-2.48, 0], [-2.58, 1.08], [-3.12, 1.68], [-3.46, 1.64], [-3.55, 0],
            [-3.46, -1.64], [-3.12, -1.68], [-2.58, -1.08]], 0.075, 0.22),
      fin([[-2.05, 0.20], [-2.42, 1.12], [-3.05, 1.66], [-3.58, 1.56], [-3.67, 0.16]], 0.08, 0),
      (() => { const c = cap(0.34, 16, 0.74, 0.43, 0); c.scale(2.25, 0.72, 0.88); return c; })(),
      (() => { const s = revolve([[0.20, 0.06], [-0.20, 0.18], [-0.68, 0.22], [-1.02, 0.10]], 14); s.scale(1, 0.72, 0.78); s.translate(-0.12, -0.46, 0); return s; })(),
      slab(0.055, 2.24, 0.12, 4.38, 0, 0, 0, 0, 0.18),
      slab(0.055, 0.12, 2.24, 4.38, 0, 0, 0, 0.18, 0),
      ring(0.30, 0.018, 4.04, 20)
    ],
    mag: 0.9
  }
];

// A void-and-neon environment: what these hulls reflect. PMREM-filtered so
// metalness has something real to mirror — a horizon, a hot key, cool pools.
function envTexture(renderer) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const g = c.getContext('2d');
  g.save(); g.scale(2, 2);
  const sky = g.createLinearGradient(0, 0, 0, 256);
  sky.addColorStop(0, '#222c4c');
  sky.addColorStop(0.45, '#12172c');
  sky.addColorStop(0.62, '#0a0d1a');
  sky.addColorStop(1, '#06070d');
  g.fillStyle = sky; g.fillRect(0, 0, 512, 256);
  const pool = (x, y, r, col) => {
    const p = g.createRadialGradient(x, y, 0, x, y, r);
    p.addColorStop(0, col); p.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = p; g.fillRect(x - r, y - r, r * 2, r * 2);
  };
  pool(90, 60, 90, 'rgba(0,120,150,.5)');
  pool(470, 70, 80, 'rgba(120,0,160,.42)');
  pool(250, 210, 120, 'rgba(255,120,20,.34)');
  g.globalAlpha = 1;
  const horizon = g.createLinearGradient(0, 150, 0, 168);
  horizon.addColorStop(0, 'rgba(255,214,170,0)');
  horizon.addColorStop(0.5, 'rgba(255,226,196,.9)');
  horizon.addColorStop(1, 'rgba(255,170,60,0)');
  g.fillStyle = horizon; g.fillRect(0, 150, 512, 18);
  const spec = g.createRadialGradient(360, 58, 0, 360, 58, 46);
  spec.addColorStop(0, 'rgba(255,255,255,1)'); spec.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = spec; g.fillRect(280, 0, 170, 130);
  g.globalAlpha = 0.55;
  for (let i = 0; i < 320; i++) {
    g.fillStyle = '#fff';
    g.fillRect(Math.random() * 512, Math.random() * 148, 1.1, 1.1);
  }
  g.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  const pg = new THREE.PMREMGenerator(renderer);
  const rt = pg.fromEquirectangular(tex);
  tex.dispose(); pg.dispose();
  return rt.texture;
}

// Panel lines, plate seams and grime — drives roughness so the metal has skin.
function panelTexture() {
  const S = 256;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#969696'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 46; i++) {
    g.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '255,255,255' : '0,0,0') + ',' + (0.03 + Math.random() * 0.07).toFixed(2) + ')';
    g.fillRect(Math.random() * S, Math.random() * S, 14 + Math.random() * 46, 10 + Math.random() * 30);
  }
  g.strokeStyle = 'rgba(58,58,58,.9)'; g.lineWidth = 1.4;
  for (let x = 0; x <= S; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, S); g.stroke(); }
  for (let y = 0; y <= S; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); }
  for (let i = 0; i < 900; i++) {
    g.fillStyle = 'rgba(0,0,0,' + (0.04 + Math.random() * 0.08).toFixed(2) + ')';
    g.fillRect(Math.random() * S, Math.random() * S, 1, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}

// Tangent-space normal map: plate seams cut in, rivet rows stand out, access
// hatches outlined. Built as a height field, then Sobel-differentiated.
function normalTexture() {
  const S = 256;
  const hc = document.createElement('canvas'); hc.width = hc.height = S;
  const h = hc.getContext('2d');
  h.fillStyle = '#808080'; h.fillRect(0, 0, S, S);
  h.strokeStyle = '#343434'; h.lineWidth = 2;
  for (let x = 0; x <= S; x += 32) { h.beginPath(); h.moveTo(x, 0); h.lineTo(x, S); h.stroke(); }
  for (let y = 0; y <= S; y += 48) { h.beginPath(); h.moveTo(0, y); h.lineTo(S, y); h.stroke(); }
  h.fillStyle = '#d2d2d2';
  for (let y = 9; y < S; y += 48) {
    for (let x = 6; x < S; x += 11) { h.beginPath(); h.arc(x, y, 1.4, 0, 6.283); h.fill(); }
  }
  h.strokeStyle = 'rgba(70,70,70,.95)'; h.lineWidth = 1.5;
  for (let i = 0; i < 30; i++) {
    h.strokeRect(Math.random() * S, Math.random() * S, 10 + Math.random() * 28, 8 + Math.random() * 20);
  }
  const src = h.getImageData(0, 0, S, S).data;
  const out = document.createElement('canvas'); out.width = out.height = S;
  const o = out.getContext('2d');
  const img = o.createImageData(S, S);
  const at = (x, y) => src[((((y % S) + S) % S) * S + (((x % S) + S) % S)) * 4];
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const nx = -(at(x + 1, y) - at(x - 1, y)) / 255 * 2.4;
      const ny = -(at(x, y + 1) - at(x, y - 1)) / 255 * 2.4;
      const len = Math.sqrt(nx * nx + ny * ny + 1);
      const i = (y * S + x) * 4;
      img.data[i] = (nx / len * 0.5 + 0.5) * 255;
      img.data[i + 1] = (ny / len * 0.5 + 0.5) * 255;
      img.data[i + 2] = (1 / len * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  o.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(out);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}

// Soft radial glint so points render as stars, not squares.
function glintTexture() {
  const S = 64;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  const rg = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  rg.addColorStop(0, 'rgba(255,255,255,1)');
  rg.addColorStop(0.28, 'rgba(255,255,255,.62)');
  rg.addColorStop(0.62, 'rgba(255,255,255,.14)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg; g.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Banded gas-giant surface in the deck palette — indigo body, cyan/purple
// weather bands, one warm storm eye.
function gasTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  const base = g.createLinearGradient(0, 0, 0, 256);
  base.addColorStop(0, '#161e38'); base.addColorStop(0.5, '#2a3760'); base.addColorStop(1, '#10152a');
  g.fillStyle = base; g.fillRect(0, 0, 512, 256);
  const bands = ['rgba(0,170,200,.20)', 'rgba(120,80,200,.15)', 'rgba(255,149,0,.09)', 'rgba(185,212,255,.13)', 'rgba(8,12,24,.32)'];
  let y = 6;
  while (y < 250) {
    const h = 5 + Math.random() * 20;
    g.fillStyle = bands[(Math.random() * bands.length) | 0];
    g.fillRect(0, y, 512, h);
    for (let x = 0; x < 512; x += 14) g.fillRect(x, y + Math.sin(x * 0.04 + y) * 2.4, 14, 1.6);
    y += h * (0.6 + Math.random() * 0.8);
  }
  const s = g.createRadialGradient(150, 170, 2, 150, 170, 30);
  s.addColorStop(0, 'rgba(255,170,60,.5)'); s.addColorStop(1, 'rgba(255,170,60,0)');
  g.fillStyle = s; g.beginPath(); g.ellipse(150, 170, 32, 13, 0, 0, 6.283); g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Concentric ring bands, planar-mapped onto a RingGeometry.
function ringsTexture() {
  const S = 512;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  for (let r = S * 0.31; r < S * 0.5; r += 1) {
    const t = (r - S * 0.31) / (S * 0.19);
    const a = (Math.sin(t * 42) * 0.5 + 0.5) * (Math.sin(t * 9.7) * 0.5 + 0.5);
    g.strokeStyle = 'rgba(' + ((180 + t * 40) | 0) + ',' + ((205 - t * 55) | 0) + ',' + ((232 - t * 40) | 0) + ',' + ((0.05 + a * 0.3) * (t > 0.93 ? 0.3 : 1)).toFixed(3) + ')';
    g.beginPath(); g.arc(S / 2, S / 2, r, 0, 6.283); g.stroke();
  }
  return new THREE.CanvasTexture(c);
}

// Horizontal anamorphic streak for the engine flare.
function anaTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 32;
  const g = c.getContext('2d');
  g.save(); g.translate(128, 16); g.scale(8, 1);
  const rg = g.createRadialGradient(0, 0, 0, 0, 0, 16);
  rg.addColorStop(0, 'rgba(255,255,255,.95)');
  rg.addColorStop(0.4, 'rgba(255,255,255,.32)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg; g.beginPath(); g.arc(0, 0, 16, 0, 6.283); g.fill();
  g.restore();
  return new THREE.CanvasTexture(c);
}

const NP = 5400; // morph cloud size

class ViewscreenStage extends HTMLElement {
  connectedCallback() {
    if (this._built) return;
    this._built = true;
    this.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:block;overflow:hidden;z-index:0;pointer-events:none';
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>:host{display:block}canvas{display:block;width:100%;height:100%}</style>`;
    this.canvas = document.createElement('canvas');
    root.appendChild(this.canvas);

    this.prog = 0; this.deck = 0; this.warpT = 0; this.mx = 0; this.my = 0; this.stage = 0;
    this.craftTarget = 0; this.craftF = 0; this.clearX = 0.5; this.clearY = 0.85; this.dim = 1;
    this.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.paused = document.hidden;

    const start = () => {
      if (this._started) return;
      this._started = true;
      try { this._initGL(); } catch (e) { console.warn('viewscreen: WebGL unavailable', e); this._fallback(); return; }

      this._onResize = () => this._resize();
      addEventListener('resize', this._onResize);
      this._onMove = (e) => {
        this.mx = (e.clientX / innerWidth - 0.5) * 2;
        this.my = (e.clientY / innerHeight - 0.5) * 2;
      };
      addEventListener('pointermove', this._onMove, { passive: true });
      addEventListener('pagehide', () => this.dispose(), { once: true });

      this._resize();
      if (this.reduce) { this._frame(0); return; }
      const loop = (t) => {
        this._raf = requestAnimationFrame(loop);
        if (!this.paused && shouldRenderFrame(t, this._previousRender ?? null, MINIMUM_FRAME_INTERVAL_MS)) {
          this._previousRender = t;
          this._frame(t);
        }
      };
      this._raf = requestAnimationFrame(loop);
    };
    this._onVis = () => {
      this.paused = document.hidden;
      if (!this.paused) start();
    };
    document.addEventListener('visibilitychange', this._onVis);
    if (!this.paused) start();
  }

  disconnectedCallback() { this.dispose(); }

  _initGL() {
    const r = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    r.setClearColor(0x05060a, 1);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.25;
    this.renderer = r;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x05060a, 0.026);
    this.envMap = envTexture(r);
    this.scene.environment = this.envMap;
    this.panelTex = panelTexture();
    this.normalTex = normalTexture();
    this.glintTex = glintTexture();
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 260);
    this.camera.position.set(0, 1.1, 7.2);
    this.camera.layers.enable(1);

    // nebula backdrop
    this.bgScene = new THREE.Scene();
    this.bgCam = new THREE.Camera();
    this.nebulaU = {
      uTime: { value: 0 }, uProg: { value: 0 }, uAspect: { value: 1 },
      uA: { value: new THREE.Color(DECK_TINT[0][0]) },
      uB: { value: new THREE.Color(DECK_TINT[0][1]) }
    };
    this.bgScene.add(new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ vertexShader: NEBULA_VERT, fragmentShader: NEBULA_FRAG, uniforms: this.nebulaU, depthTest: false, depthWrite: false })
    ));

    // starfield
    const N = 4200;
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    const cW = new THREE.Color(0xffffff), cC = new THREE.Color(0x00f9ff), cO = new THREE.Color(0xff9500);
    for (let i = 0; i < N; i++) {
      const u = Math.random(), v = Math.random();
      const th = 2 * Math.PI * u, ph = Math.acos(2 * v - 1);
      const rad = 26 + Math.random() * 52;
      pos[i * 3] = rad * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = rad * Math.cos(ph) * 0.55;
      pos[i * 3 + 2] = rad * Math.sin(ph) * Math.sin(th);
      const pick = Math.random();
      const c = pick < 0.16 ? cC : pick < 0.2 ? cO : cW;
      const b = 0.45 + Math.random() * 0.55;
      col[i * 3] = c.r * b; col[i * 3 + 1] = c.g * b; col[i * 3 + 2] = c.b * b;
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    sg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({
      size: 0.3, sizeAttenuation: true, vertexColors: true, transparent: true,
      map: this.glintTex, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false
    }));
    this.scene.add(this.stars);

    // warp streaks
    const S = 1100;
    this.stkBase = new Float32Array(S * 3);
    this.stkLen = new Float32Array(S);
    const sp = new Float32Array(S * 2 * 3);
    for (let i = 0; i < S; i++) {
      const j = (Math.random() * N) | 0;
      this.stkBase[i * 3] = pos[j * 3]; this.stkBase[i * 3 + 1] = pos[j * 3 + 1]; this.stkBase[i * 3 + 2] = pos[j * 3 + 2];
      this.stkLen[i] = 0.35 + Math.random() * 0.85;
      for (let k = 0; k < 2; k++) {
        const o = (i * 2 + k) * 3;
        sp[o] = pos[j * 3]; sp[o + 1] = pos[j * 3 + 1]; sp[o + 2] = pos[j * 3 + 2];
      }
    }
    const stg = new THREE.BufferGeometry();
    stg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.streaks = new THREE.LineSegments(stg, new THREE.LineBasicMaterial({
      color: 0xa8f4ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false
    }));
    this.scene.add(this.streaks);

    // ringed gas giant — a distant anchor owning the deep background
    this.planet = new THREE.Group();
    this.planetBody = new THREE.Mesh(new THREE.SphereGeometry(7.4, 48, 32),
      new THREE.MeshLambertMaterial({ map: gasTexture(), emissive: 0x121a2e, emissiveIntensity: 0.75, transparent: true, opacity: 0, fog: false }));
    this.planetBody.rotation.z = 0.35;
    this.planetHalo = new THREE.Mesh(new THREE.SphereGeometry(7.9, 32, 24),
      new THREE.MeshBasicMaterial({ color: 0x2b9dbb, transparent: true, opacity: 0, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    this.planetRings = new THREE.Mesh(new THREE.RingGeometry(9.6, 15.4, 96, 1),
      new THREE.MeshBasicMaterial({ map: ringsTexture(), transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, fog: false }));
    this.planetRings.rotation.x = Math.PI / 2 - 0.24;
    this.planet.add(this.planetBody, this.planetHalo, this.planetRings);
    this.planet.position.set(19, 8.5, -64);
    this.planet.rotation.z = -0.12;
    this.planet.visible = false;
    this.planetOp = 0;
    this.scene.add(this.planet);

    // near-camera dust motes — parallax depth between lens and subject
    const MO = 240, mp = new Float32Array(MO * 3);
    for (let i = 0; i < MO; i++) {
      mp[i * 3] = (Math.random() - 0.5) * 16;
      mp[i * 3 + 1] = (Math.random() - 0.5) * 9;
      mp[i * 3 + 2] = Math.random() * 8 - 2;
    }
    const mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
    this.motes = new THREE.Points(mg, new THREE.PointsMaterial({
      color: 0x9fd8e8, size: 0.034, sizeAttenuation: true, map: this.glintTex,
      transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    this.scene.add(this.motes);

    // occasional shooting stars in the far field
    this.meteors = [];
    const mtg = new THREE.BufferGeometry();
    mtg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(4 * 2 * 3), 3));
    this.meteorLines = new THREE.LineSegments(mtg, new THREE.LineBasicMaterial({
      color: 0xdff6ff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false
    }));
    this.scene.add(this.meteorLines);
    for (let i = 0; i < 4; i++) this.meteors.push({ t: -(3 + Math.random() * 16), p: new THREE.Vector3(), d: new THREE.Vector3(), dur: 1 });

    // anamorphic lens streak riding the engine flare (parented to the fleet
    // rig below, once it exists)
    this.ana = new THREE.Mesh(new THREE.PlaneGeometry(7, 0.7),
      new THREE.MeshBasicMaterial({ map: anaTexture(), color: 0x00f9ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, fog: false }));

    // Tron floor
    this.gridA = new THREE.GridHelper(120, 60, 0x00f9ff, 0x00f9ff);
    this.gridA.material.transparent = true; this.gridA.material.opacity = 0.13;
    this.gridA.position.y = -2.4;
    this.gridB = new THREE.GridHelper(120, 12, 0xff9500, 0xff9500);
    this.gridB.material.transparent = true; this.gridB.material.opacity = 0.16;
    this.gridB.position.y = -2.38;
    this.scene.add(this.gridA, this.gridB);

    // ---- the craft rig ----
    this.fleet = new THREE.Group();
    this.fleet.position.set(5.4, -0.4, 0);
    this.scene.add(this.fleet);
    this.fleet.add(this.ana);

    const key = new THREE.DirectionalLight(0xffe6c4, 4.4); key.position.set(5, 7, 6);
    const rim = new THREE.DirectionalLight(0x00f9ff, 3.6); rim.position.set(-7, -1, -5);
    const rim2 = new THREE.DirectionalLight(0xff9500, 1.9); rim2.position.set(-4, 5, 7);
    const fill = new THREE.DirectionalLight(0xcc00ff, 1.2); fill.position.set(-2, 4, -7);
    this.fillLight = fill;
    this.scene.add(key, rim, rim2, fill, new THREE.AmbientLight(0x35415e, 1.6));
    // travelling highlight — sells the metal even against a black void
    this.tracer = new THREE.PointLight(0xffffff, 26, 34, 1.8);
    this.scene.add(this.tracer);

    this.craftRig = new THREE.Group();
    this.craftRig.rotation.y = -0.42;
    this.fleet.add(this.craftRig);

    this.clouds = [];
    this.wires = [];
    this.solids = [];
    this.lights = [];
    this.mags = [];
    const sampler = new THREE.Vector3();
    for (const spec of CRAFT) {
      const parts = spec.build().map(g => (g.index ? g.toNonIndexed() : g));
      parts.forEach((g, pi) => {
        const pos = g.attributes.position, n = pos.count;
        const col = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          const c = spec.livery ? spec.livery(pos.getX(i), pos.getY(i), pos.getZ(i), pi) : null;
          col[i * 3] = c ? c[0] : 1; col[i * 3 + 1] = c ? c[1] : 1; col[i * 3 + 2] = c ? c[2] : 1;
        }
        g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      });
      const geo = mergeGeometries(parts, false);
      geo.computeVertexNormals();
      geo.computeBoundingSphere();
      const s = (3.15 / geo.boundingSphere.radius) * (spec.mag || 1);
      geo.scale(s, s, s);
      geo.center();

      const mp = spec.mat || {};
      const solid = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color: spec.tint,
        vertexColors: true,
        metalness: mp.metal === undefined ? 0.85 : mp.metal,
        roughness: mp.rough === undefined ? 0.34 : mp.rough,
        roughnessMap: this.panelTex,
        metalnessMap: this.panelTex,
        normalMap: this.normalTex,
        normalScale: new THREE.Vector2(0.85, 0.85),
        envMap: this.envMap,
        envMapIntensity: (mp.env === undefined ? 1.35 : mp.env) * 1.15,
        transparent: true, opacity: 0,
        emissive: new THREE.Color(spec.glowColor || spec.tint).multiplyScalar(mp.emis === undefined ? 0.1 : mp.emis + 0.04),
        fog: false
      }));
      this.craftRig.add(solid);
      this.solids.push(solid);

      const smp = new MeshSurfaceSampler(new THREE.Mesh(geo)).build();
      const arr = new Float32Array(NP * 3);
      for (let i = 0; i < NP; i++) {
        smp.sample(sampler);
        arr[i * 3] = sampler.x; arr[i * 3 + 1] = sampler.y; arr[i * 3 + 2] = sampler.z;
      }
      this.clouds.push(arr);
      this.mags.push(spec.mag || 1);

      // Regulation nav lights, read off the real hull: red to port, green to
      // starboard, white strobe at the tail, beacon on the nose.
      let pz = 0, sz = 0, nx = -1e9, tx = 1e9, pi = 0, si = 0, ni = 0, ti = 0;
      for (let i = 0; i < NP; i++) {
        const x = arr[i * 3], z = arr[i * 3 + 2];
        if (z < pz) { pz = z; pi = i; }
        if (z > sz) { sz = z; si = i; }
        if (x > nx) { nx = x; ni = i; }
        if (x < tx) { tx = x; ti = i; }
      }
      const pick = (i) => [arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2]];
      this.lights.push({ port: pick(pi), star: pick(si), nose: pick(ni), tail: pick(ti) });

      const w = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo, 18),
        new THREE.LineBasicMaterial({ color: spec.wire || spec.glowColor || spec.tint, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
      );
      this.craftRig.add(w);
      this.wires.push(w);
    }

    // SR-71 nacelle exits, read off the sampled hull, for the twin plumes
    const bbC = this.clouds[1];
    let abL = [1e9, 0, 0], abR = [1e9, 0, 0];
    for (let i = 0; i < NP; i++) {
      const x = bbC[i * 3], y = bbC[i * 3 + 1], z = bbC[i * 3 + 2];
      if (z > 0.45 && x < abL[0]) abL = [x, y, z];
      if (z < -0.45 && x < abR[0]) abR = [x, y, z];
    }
    this.abAnchors = [abL, abR];

    const live = new Float32Array(this.clouds[0]);
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.BufferAttribute(live, 3));
    this.hull = new THREE.Points(cg, new THREE.PointsMaterial({
      size: 0.055, sizeAttenuation: true, color: 0xffd9a8, map: this.glintTex, transparent: true,
      opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false
    }));
    this.craftRig.add(this.hull);

    // nav lights: three steady, one strobing
    const navPos = new Float32Array(9);
    const navCol = new Float32Array([1, 0.06, 0.06, 0.1, 1, 0.3, 0.55, 0.9, 1]);
    const navGeo = new THREE.BufferGeometry();
    navGeo.setAttribute('position', new THREE.BufferAttribute(navPos, 3));
    navGeo.setAttribute('color', new THREE.BufferAttribute(navCol, 3));
    this.navLights = new THREE.Points(navGeo, new THREE.PointsMaterial({
      size: 0.17, sizeAttenuation: true, vertexColors: true, map: this.glintTex, transparent: true,
      opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false
    }));
    this.craftRig.add(this.navLights);

    const stGeo2 = new THREE.BufferGeometry();
    stGeo2.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
    this.strobe = new THREE.Points(stGeo2, new THREE.PointsMaterial({
      size: 0.32, sizeAttenuation: true, color: 0xffffff, map: this.glintTex, transparent: true,
      opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false
    }));
    this.craftRig.add(this.strobe);

    // ion trail: particles shed from the plume mouth and left behind
    this.TN = 280;
    this.trailPos = new Float32Array(this.TN * 3);
    this.trailAge = new Float32Array(this.TN);
    for (let i = 0; i < this.TN; i++) this.trailAge[i] = Math.random();
    const trGeo = new THREE.BufferGeometry();
    trGeo.setAttribute('position', new THREE.BufferAttribute(this.trailPos, 3));
    this.ionTrail = new THREE.Points(trGeo, new THREE.PointsMaterial({
      size: 0.1, sizeAttenuation: true, color: 0xffc27a, map: this.glintTex, transparent: true,
      opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false
    }));
    this.craftRig.add(this.ionTrail);

    // exhaust / torch
    const eg = new THREE.ConeGeometry(1, 1, 14, 1, true);
    eg.rotateZ(Math.PI / 2);
    eg.translate(-0.5, 0, 0);
    this.exhaust = new THREE.Mesh(eg, new THREE.MeshBasicMaterial({
      color: 0xffb066, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false
    }));
    this.craftRig.add(this.exhaust);

    const coreGeo = eg.clone();
    this.exhaustCore = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.DoubleSide, fog: false
    }));
    this.craftRig.add(this.exhaustCore);

    // twin afterburner plumes (Blackbird only)
    this.abPlumes = [];
    for (let k = 0; k < 2; k++) {
      const m = new THREE.Mesh(eg.clone(), new THREE.MeshBasicMaterial({
        color: 0xffb27a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false
      }));
      this.craftRig.add(m);
      this.abPlumes.push(m);
    }

    this.flare = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 12, 10),
      new THREE.MeshBasicMaterial({ color: 0xffb066, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
    );
    this.craftRig.add(this.flare);

    // shockwave (X-1 breaking Mach 1)
    this.shock = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.02, 5, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
    );
    this.shock.rotation.y = Math.PI / 2;
    this.craftRig.add(this.shock);

    // Phoenix field boundary: soft edge volume, travelling field contours, and
    // localised nacelle hardware. None of these elements should wash the deck.
    this.warpFieldU = {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color(0x42e7ef) }
    };
    this.bubble = new THREE.Mesh(
      new THREE.SphereGeometry(3.0, 36, 22),
      new THREE.ShaderMaterial({
        uniforms: this.warpFieldU,
        vertexShader: WARP_FIELD_VERT,
        fragmentShader: WARP_FIELD_FRAG,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false
      })
    );
    this.craftRig.add(this.bubble);
    this.bubbleInner = null;
    this.warpRings = [0, 1, 2].map((k) => {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(1.7, 0.022, 6, 72),
        new THREE.MeshBasicMaterial({
          color: k === 2 ? 0xffa22c : 0x3deaf2, transparent: true, opacity: 0,
          blending: THREE.AdditiveBlending, depthWrite: false, fog: false
        })
      );
      m.rotation.y = Math.PI / 2;
      this.craftRig.add(m);
      return m;
    });
    this.warpCoils = [1, -1].map((side) => {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(2.18, 0.035, 0.045),
        new THREE.MeshBasicMaterial({
          color: 0x55eff7, transparent: true, opacity: 0,
          blending: THREE.AdditiveBlending, depthWrite: false, fog: false
        })
      );
      m.position.set(-0.08, 0.16, side * 1.54);
      this.craftRig.add(m);
      return m;
    });
    this.warpCollectors = [1, -1].map((side) => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 14, 10),
        new THREE.MeshBasicMaterial({
          color: 0xffa534, transparent: true, opacity: 0,
          blending: THREE.AdditiveBlending, depthWrite: false, fog: false
        })
      );
      m.scale.set(1.34, 1, 1);
      m.position.set(1.84, 0.16, side * 1.54);
      this.craftRig.add(m);
      return m;
    });

    // the fold itself: a lens of bent light, billboarded to camera
    this.foldU = { uTime: { value: 0 }, uAmt: { value: 0 } };
    this.foldLens = new THREE.Mesh(
      new THREE.PlaneGeometry(9.5, 9.5),
      new THREE.ShaderMaterial({
        vertexShader: FOLD_VERT, fragmentShader: FOLD_FRAG, uniforms: this.foldU,
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false
      })
    );
    this.foldLens.visible = false;
    this.fleet.add(this.foldLens);

    // starlight collapsing into the fold
    const FS = 520;
    this.fsBase = new Float32Array(FS * 3);
    const fsp = new Float32Array(FS * 2 * 3);
    for (let i = 0; i < FS; i++) {
      const j = (Math.random() * N) | 0;
      this.fsBase[i * 3] = pos[j * 3]; this.fsBase[i * 3 + 1] = pos[j * 3 + 1]; this.fsBase[i * 3 + 2] = pos[j * 3 + 2];
    }
    const fsg = new THREE.BufferGeometry();
    fsg.setAttribute('position', new THREE.BufferAttribute(fsp, 3));
    this.foldStreaks = new THREE.LineSegments(fsg, new THREE.LineBasicMaterial({
      color: 0xffd27a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false
    }));
    this.foldStreaks.visible = false;
    this.scene.add(this.foldStreaks);

    // fold ring (heighliner folding space)
    this.fold = new THREE.Mesh(
      new THREE.TorusGeometry(3.4, 0.06, 8, 64),
      new THREE.MeshBasicMaterial({ color: 0xffcc00, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
    );
    this.craftRig.add(this.fold);
    this.foldInner = new THREE.Mesh(
      new THREE.TorusGeometry(2.2, 0.03, 8, 64),
      new THREE.MeshBasicMaterial({ color: 0xff9500, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
    );
    this.craftRig.add(this.foldInner);

    // the 19-node fleet, now escorting the craft
    this.R = 3.2;
    this.nodeGeo = new THREE.IcosahedronGeometry(0.055, 1);
    this.nodeMat = new THREE.MeshBasicMaterial({ color: 0x00f9ff });
    this.nodes = new THREE.InstancedMesh(this.nodeGeo, this.nodeMat, 19);
    this.nodes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const green = new THREE.Color(0x00ff9f), cyan = new THREE.Color(0x00f9ff);
    for (let i = 0; i < 19; i++) this.nodes.setColorAt(i, i % 6 === 0 ? green : cyan);
    this.nodes.instanceColor.needsUpdate = true;
    this.fleet.add(this.nodes);

    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(this.R, 0.005, 6, 128),
      new THREE.MeshBasicMaterial({ color: 0xcc00ff, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
    );
    this.ring.rotation.x = Math.PI / 2;
    this.fleet.add(this.ring);
    this.ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(this.R * 0.7, 0.004, 6, 96),
      new THREE.MeshBasicMaterial({ color: 0x00f9ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
    );
    this.ring2.rotation.x = Math.PI / 2;
    this.ring2.visible = false;
    this.fleet.add(this.ring2);

    // routing beams (deck 03)
    const bp = new Float32Array(10 * 2 * 3);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      bp[i * 6 + 3] = Math.cos(a) * this.R * 1.5;
      bp[i * 6 + 4] = Math.sin(a) * 0.5;
      bp[i * 6 + 5] = Math.sin(a) * this.R * 1.5;
    }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.BufferAttribute(bp, 3));
    this.beams = new THREE.LineSegments(bg, new THREE.LineBasicMaterial({
      color: 0xff9500, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false
    }));
    this.fleet.add(this.beams);

    this.composer = new EffectComposer(r);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.62, 0.58, 0.42);
    this.composer.addPass(this.bloom);
    this.grade = new ShaderPass(GRADE);
    this.composer.addPass(this.grade);
    r.autoClear = false;

    this._tmpC = new THREE.Color();
    this._matrix = new THREE.Matrix4();
    this._quat = new THREE.Quaternion();
    this._vec = new THREE.Vector3();
  }

  _fallback() {
    const g = this.canvas.getContext('2d');
    if (!g) return;
    const w = this.canvas.width = this.clientWidth || 1200;
    const h = this.canvas.height = this.clientHeight || 800;
    const grad = g.createRadialGradient(w * 0.8, h * 0.5, 0, w * 0.8, h * 0.5, Math.max(w, h) * 0.7);
    grad.addColorStop(0, '#101a2a'); grad.addColorStop(1, '#05060a');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 600; i++) {
      g.globalAlpha = 0.2 + Math.random() * 0.7;
      g.fillStyle = Math.random() < 0.2 ? '#00f9ff' : '#e4e4f0';
      g.beginPath(); g.arc(Math.random() * w, Math.random() * h, Math.random() * 1.3, 0, 6.284); g.fill();
    }
  }

  _resize() {
    if (!this.renderer) return;
    const w = this.clientWidth || innerWidth, h = this.clientHeight || innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.bloom.setSize(w * 0.5, h * 0.5);
    if (this.grade) this.grade.uniforms.uRes.value.set(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.nebulaU.uAspect.value = w / h;
  }

  _frame(t) {
    const dt = Math.min(0.05, (t - (this._last || t)) / 1000);
    this._last = t;
    const p = this.prog, deck = this.deck;
    // V33 decayed with `this.warpT = Math.max(0, this.warpT - dt * 1.05)`;
    // V34 keeps the same semantic warp while completing inside its 700ms bound.
    this.warpT = Math.max(0, this.warpT - dt * (1000 / motionDurationMs('stage-warp')));
    const warp = this.warpT * this.warpT;

    const tint = DECK_TINT[deck] || DECK_TINT[0];
    this.nebulaU.uA.value.lerp(this._tmpC.setHex(tint[0]), 0.035);
    this.nebulaU.uB.value.lerp(this._tmpC.setHex(tint[1]), 0.035);
    this.nebulaU.uTime.value = t * 0.001;
    this.nebulaU.uProg.value = p;

    const camZ = 7.2 - p * 3.1 - warp * 1.5;
    const camY = 1.1 + p * 1.5;
    this.camera.position.x += ((this.mx * 0.55) - this.camera.position.x) * 0.045;
    this.camera.position.y += ((camY - this.my * 0.35) - this.camera.position.y) * 0.05;
    this.camera.position.z += (camZ - this.camera.position.z) * 0.06;
    this.camera.fov += ((55 + warp * 34) - this.camera.fov) * 0.16;
    this.camera.updateProjectionMatrix();
    const hx = Math.sin(t * 0.00043) * 0.055 + Math.sin(t * 0.00117) * 0.022;
    const hy = Math.cos(t * 0.00037) * 0.045 + Math.sin(t * 0.00131) * 0.018;
    this.camera.position.x += hx * 0.6;
    this.camera.position.y += hy * 0.6;
    this.camera.lookAt(0.1 + hx * 0.5, 0.4 + hy * 0.5, 0);

    const halfW = Math.tan((this.camera.fov * Math.PI) / 360) * Math.max(2.2, this.camera.position.z) * this.camera.aspect;
    const halfH = halfW / this.camera.aspect;
    // The DOM reports where the live deck's glyphs actually end (right edge and
    // bottom). Fit the hull into whichever free region — beside the copy, or
    // below it — allows the larger ship, honouring the measurement either way.
    const R0 = 3.2;                                   // hull bounding radius
    const leftNdc = this.clearX * 2 - 1;
    const halfA = (1 - leftNdc) * 0.5;                // free band to the right
    const scaleA = (halfA * halfW * 0.92) / R0;
    const topNdc = 1 - this.clearY * 2;
    const halfB = (topNdc + 1) * 0.5;                 // free band below the copy
    const scaleB = (halfB * halfH * 0.92) / R0;

    let cxNdc, cyNdc, fit;
    if (scaleB > scaleA) { fit = scaleB; cxNdc = 0.28; cyNdc = topNdc - halfB; }
    else { fit = scaleA; cxNdc = leftNdc + halfA; cyNdc = -(0.04 + p * 0.12); }
    const lineageRecognition = deck === 4 && (this.craftTarget === 2 || this.craftTarget === 7) && this.camera.aspect >= 1.3;
    const phoenixDeck = this.craftTarget === 5 && (deck === 6 || deck === 7);
    const narrowPhoenix = phoenixDeck && this.camera.aspect < 1;
    const cramped = !lineageRecognition && !phoenixDeck && fit < 0.44;
    if (lineageRecognition) { fit = 0.34; cxNdc = 0.66; cyNdc = 0.04; }
    else if (phoenixDeck) {
      fit = narrowPhoenix ? 0.27 : deck === 6 ? 0.22 : 0.28;
      cxNdc = narrowPhoenix ? 0.42 : deck === 6 ? -0.42 : 0.7;
      cyNdc = narrowPhoenix ? -0.42 : deck === 6 ? 0.66 : 0.42;
    }
    else if (cramped) { fit = 0.76; cxNdc = 0.74; cyNdc = -(0.1 + p * 0.14); }
    fit = Math.min(fit, 1.0 / (this.mags[this.craftTarget] || 1));
    fit = Math.max(0.26, Math.min(0.98, fit)) * (1 - p * 0.06);
    const targetDim = lineageRecognition ? 0.62 : phoenixDeck ? (narrowPhoenix ? 0.4 : deck === 6 ? 0.6 : 0.76) : cramped ? 0.66 : 1;
    this.dim += (targetDim - this.dim) * 0.06;

    const halfNdcX = (R0 * fit) / halfW;
    if (cxNdc + halfNdcX > 0.99) cxNdc = 0.99 - halfNdcX;
    this.fleet.scale.setScalar(fit);
    this.fleet.position.set(0.1 + cxNdc * halfW, 0.4 + cyNdc * halfH, 0);

    if (this.planet) {
      const PLANET_OP = [0, 0.9, 0.25, 0.18, 0.85, 0.3, 0.22, 0.28, 1];
      this.planetOp += ((PLANET_OP[deck] != null ? PLANET_OP[deck] : 0.3) - this.planetOp) * 0.022;
      this.planetBody.rotation.y = t * 0.00002;
      this.planetBody.material.opacity = this.planetOp;
      this.planetHalo.material.opacity = this.planetOp * 0.16;
      this.planetRings.material.opacity = this.planetOp * 0.62;
      this.planet.position.x = 19 + this.mx * 1.6;
      this.planet.position.y = 8.5 + this.my * 0.9 - p * 2.2;
      this.planet.visible = this.planetOp > 0.012;
    }

    if (this.motes) {
      this.motes.rotation.y = t * 0.000021 + this.mx * 0.012;
      this.motes.position.y = Math.sin(t * 0.00012) * 0.3;
      this.motes.material.opacity = 0.3 * this.dim;
    }

    if (this.meteorLines) {
      const ma = this.meteorLines.geometry.attributes.position.array;
      for (let i = 0; i < this.meteors.length; i++) {
        const mt = this.meteors[i];
        mt.t += dt;
        if (mt.t > mt.dur) {
          mt.t = -(5 + Math.random() * 20);
          const th = Math.random() * Math.PI * 2;
          mt.p.set(Math.cos(th) * 38, 8 + Math.random() * 16, -30 - Math.random() * 26);
          mt.d.set(-(6 + Math.random() * 14) * Math.sign(mt.p.x || 1), -(5 + Math.random() * 9), 0);
          mt.dur = 0.8 + Math.random() * 0.7;
        }
        const o = i * 6, tt = Math.max(0, mt.t);
        const k = mt.t > 0 ? Math.sin(Math.min(1, mt.t / mt.dur) * Math.PI) : 0;
        const x = mt.p.x + mt.d.x * tt, y = mt.p.y + mt.d.y * tt;
        ma[o] = x; ma[o + 1] = y; ma[o + 2] = mt.p.z;
        ma[o + 3] = x - mt.d.x * 0.09 * k; ma[o + 4] = y - mt.d.y * 0.09 * k; ma[o + 5] = mt.p.z;
      }
      this.meteorLines.geometry.attributes.position.needsUpdate = true;
    }

    if (this.tracer) {
      const ta = t * 0.00038;
      this.tracer.position.set(
        this.fleet.position.x + Math.cos(ta) * 5.4,
        this.fleet.position.y + 2.6 + Math.sin(ta * 1.3) * 1.8,
        Math.sin(ta) * 5.4 + 3.2
      );
      this.tracer.intensity = 26 * this.dim;
    }

    this.stars.rotation.y = t * 0.000018 + this.mx * 0.035;
    this.stars.rotation.x = this.my * 0.022;
    if (!this._twk || t - this._twk > 90) {
      this._twk = t;
      const c = this.stars.geometry.attributes.color, a = c.array;
      for (let k = 0; k < 26; k++) {
        const i = ((Math.random() * (a.length / 3)) | 0) * 3;
        const f = 0.6 + Math.random() * 0.7;
        a[i] = Math.min(1, a[i] * f); a[i + 1] = Math.min(1, a[i + 1] * f); a[i + 2] = Math.min(1, a[i + 2] * f);
      }
      c.needsUpdate = true;
    }
    this.stars.material.opacity = (0.95 - warp * 0.8) * (0.3 + this.dim * 0.7);

    const sm = this.streaks.material;
    if (warp > 0.002) {
      const arr = this.streaks.geometry.attributes.position.array;
      for (let i = 0; i < this.stkLen.length; i++) {
        const b = i * 3, e = (i * 2 + 1) * 3;
        const k = 1 + this.stkLen[i] * warp * 0.85;
        arr[e] = this.stkBase[b] * k; arr[e + 1] = this.stkBase[b + 1] * k; arr[e + 2] = this.stkBase[b + 2] * k;
      }
      this.streaks.geometry.attributes.position.needsUpdate = true;
      sm.opacity = Math.min(0.9, warp * 1.1) * this.dim;
      this.streaks.visible = true;
    } else if (this.streaks.visible) {
      sm.opacity = 0; this.streaks.visible = false;
    }

    const gz = ((t * 0.0006) % 2) - 1;
    this.gridA.position.z = gz * 2; this.gridB.position.z = gz * 2;
    this.gridA.material.opacity = 0.13 * (1 - p * 0.55);
    this.gridB.material.opacity = 0.16 * (1 - p * 0.55);

    // ---- craft morph: driven by the deck you are on ----
    const gap = this.craftTarget - this.craftF;
    this.craftF += gap * 0.035;
    if (Math.abs(gap) < 0.002) this.craftF = this.craftTarget;
    const f = this.craftF;
    let i0 = Math.floor(f);
    if (i0 > CRAFT.length - 2) i0 = CRAFT.length - 2;
    if (i0 < 0) i0 = 0;
    const raw = Math.min(1, Math.max(0, f - i0));
    const mix = raw * raw * (3 - 2 * raw);
    this.stage = mix > 0.5 ? i0 + 1 : i0;

    const A = this.clouds[i0], B = this.clouds[i0 + 1];
    const live = this.hull.geometry.attributes.position.array;
    const swirl = Math.min(1, Math.abs(gap) * 1.6) * (1 - Math.abs(mix - 0.5) * 1.2) * 0.6; // fly apart mid-morph
    for (let i = 0; i < NP; i++) {
      const k = i * 3;
      const ax = A[k], ay = A[k + 1], az = A[k + 2];
      const bx = B[k], by = B[k + 1], bz = B[k + 2];
      const s = Math.sin(i * 12.9898 + t * 0.0016);
      const c = Math.cos(i * 78.233 + t * 0.0013);
      live[k] = ax + (bx - ax) * mix + s * swirl;
      live[k + 1] = ay + (by - ay) * mix + c * swirl * 0.7;
      live[k + 2] = az + (bz - az) * mix + s * c * swirl;
    }
    this.hull.geometry.attributes.position.needsUpdate = true;
    this.hull.material.color.lerpColors(
      this._tmpC.setHex(CRAFT[i0].tint).clone(),
      new THREE.Color(CRAFT[i0 + 1].tint), mix
    );
    this.hull.material.size = 0.052 + swirl * 0.02;

    const settled = 1 - Math.min(1, Math.abs(gap) * 2.4);
    const pose = CRAFT[this.craftTarget].pose;
    const poseLock = pose ? settled * Math.max(0, 1 - Math.abs(f - this.craftTarget) * 1.8) : 0;
    const poseMotion = 1 + (((pose && pose.motion) || 1) - 1) * poseLock;
    for (let i = 0; i < this.wires.length; i++) {
      const w = i === i0 ? (1 - mix) : i === i0 + 1 ? mix : 0;
      const wm = this.wires[i].material;
      const wireOpacity = lineageRecognition && i === this.craftTarget
        ? CRAFT[i].lineageWireOpacity
        : CRAFT[i].wireOpacity === undefined ? 0.34 : CRAFT[i].wireOpacity;
      wm.opacity += (w * (wireOpacity + (1 - settled) * 0.44) * this.dim - wm.opacity) * 0.25;
      this.wires[i].visible = wm.opacity > 0.004;
      const sm2 = this.solids[i].material;
      const solidOpacity = lineageRecognition && i === this.craftTarget
        ? CRAFT[i].lineageSolidOpacity
        : CRAFT[i].solidOpacity === undefined ? 0.98 : CRAFT[i].solidOpacity;
      sm2.opacity += (w * settled * solidOpacity * this.dim - sm2.opacity) * 0.16;
      this.solids[i].visible = sm2.opacity > 0.01;
    }
    const cloudOpacity = lineageRecognition ? 0.07 : phoenixDeck ? 0.1 + (1 - settled) * 0.25 : 0.35 + (1 - settled) * 0.6;
    this.hull.material.opacity = cloudOpacity * this.dim;

    // flight: gentle bank and pitch, plus a roll through each transition.
    // Once settled, ease the accumulated roll home to the nearest full turn
    // so no craft is ever left flying inverted.
    this._roll = (this._roll || 0) + Math.abs(gap) * 0.055;
    if (Math.abs(gap) < 0.3) {
      const home = Math.round(this._roll / (Math.PI * 2)) * (Math.PI * 2);
      this._roll += (home - this._roll) * Math.min(1, dt * 2.4);
    }
    this.bankT = Math.max(0, (this.bankT || 0) - dt * 0.8);
    const bank = this.bankT * this.bankT * (this.bankDir || 1);
    const poseYaw = -0.5 + ((((pose && pose.yaw) ?? -0.5) + 0.5) * poseLock);
    const posePitch = ((pose && pose.pitch) || 0) * poseLock;
    const poseRoll = ((pose && pose.roll) || 0) * poseLock;
    this.craftRig.rotation.y = poseYaw + Math.sin(t * 0.00021) * 0.26 * poseMotion + bank * 0.44;
    this.craftRig.rotation.x = this._roll + posePitch + Math.sin(t * 0.00031) * 0.09 * poseMotion + bank * 0.14;
    this.craftRig.rotation.z = poseRoll + Math.sin(t * 0.00017) * 0.07 * poseMotion - Math.min(0.5, Math.abs(gap) * 0.5) - bank * 0.55;
    this.craftRig.position.y = Math.sin(t * 0.0004) * 0.14 * poseMotion;

    // exhaust interpolates length/width/colour between craft; the Blackbird
    // burns through its own twin ejectors instead of the shared centre plume
    const eA = CRAFT[i0].exhaust, eB = CRAFT[i0 + 1].exhaust;
    const nearBB = Math.max(0, 1 - Math.abs(f - 1) * 1.6);
    const len = (eA[0] + (eB[0] - eA[0]) * mix) * (1 - nearBB);
    const rad = eA[1] + (eB[1] - eA[1]) * mix;
    const flick = 0.86 + Math.sin(t * 0.02) * 0.14;
    this.exhaust.scale.set(Math.max(0.001, len * flick), Math.max(0.001, rad), Math.max(0.001, rad));
    this.exhaust.position.x = -2.5;
    this.exhaust.material.color.lerpColors(this._tmpC.setHex(eA[2]).clone(), new THREE.Color(eB[2]), mix);
    this.exhaust.material.opacity = 0.42 * (len > 0.05 ? 1 : 0) * (1 - swirl * 0.5) * this.dim;
    if (this.exhaustCore) {
      this.exhaustCore.scale.set(Math.max(0.001, len * flick * 0.52), Math.max(0.001, rad * 0.44), Math.max(0.001, rad * 0.44));
      this.exhaustCore.position.x = -2.5;
      this.exhaustCore.material.opacity = 0.5 * (len > 0.05 ? 1 : 0) * (1 - swirl * 0.6) * this.dim;
    }

    // nav lights track whichever hull is settled
    const lg = this.lights[this.craftShown === undefined ? i0 : this.craftShown] || this.lights[i0];
    if (lg && this.navLights) {
      const np = this.navLights.geometry.attributes.position.array;
      np[0] = lg.port[0]; np[1] = lg.port[1]; np[2] = lg.port[2];
      np[3] = lg.star[0]; np[4] = lg.star[1]; np[5] = lg.star[2];
      np[6] = lg.nose[0]; np[7] = lg.nose[1]; np[8] = lg.nose[2];
      this.navLights.geometry.attributes.position.needsUpdate = true;
      this.navLights.material.opacity = settled * 0.95 * this.dim;
      this.navLights.material.size = 0.15 + Math.sin(t * 0.004) * 0.02;
      const sp = this.strobe.geometry.attributes.position.array;
      sp[0] = lg.tail[0]; sp[1] = lg.tail[1]; sp[2] = lg.tail[2];
      this.strobe.geometry.attributes.position.needsUpdate = true;
      const beat = (t * 0.0011) % 1;
      this.strobe.material.opacity = settled * this.dim * (beat < 0.06 ? 1 : beat < 0.12 ? 0.5 : 0);
    }

    // ion trail
    if (this.ionTrail && len > 0.05) {
      const tp = this.trailPos;
      for (let i = 0; i < this.TN; i++) {
        this.trailAge[i] += dt * 0.55;
        if (this.trailAge[i] > 1) {
          this.trailAge[i] = 0;
          tp[i * 3] = -2.4 - Math.random() * 0.3;
          tp[i * 3 + 1] = (Math.random() - 0.5) * rad * 0.7;
          tp[i * 3 + 2] = (Math.random() - 0.5) * rad * 0.7;
        } else {
          const a = this.trailAge[i];
          tp[i * 3] -= dt * (2.4 + len * 1.4);
          tp[i * 3 + 1] += (Math.random() - 0.5) * 0.012 + a * 0.002;
          tp[i * 3 + 2] += (Math.random() - 0.5) * 0.012;
        }
      }
      this.ionTrail.geometry.attributes.position.needsUpdate = true;
      this.ionTrail.material.color.copy(this.exhaust.material.color);
      this.ionTrail.material.opacity = 0.4 * settled * this.dim;
      this.ionTrail.visible = true;
    } else if (this.ionTrail) {
      this.ionTrail.visible = false;
    }

    if (this.flare) {
      this.flare.position.x = -2.5;
      this.flare.scale.setScalar((0.5 + rad * 1.6) * flick);
      this.flare.material.color.copy(this.exhaust.material.color);
      this.flare.material.opacity = 0.3 * (len > 0.05 ? 1 : 0) * this.dim;
    }

    if (this.ana) {
      this.flare.getWorldPosition(this._vec);
      this.fleet.worldToLocal(this._vec);
      this.ana.position.copy(this._vec);
      this.ana.quaternion.copy(this.camera.quaternion);
      this.ana.scale.set(0.6 + rad * 2.4, 1, 1);
      this.ana.material.color.copy(this.exhaust.material.color);
      this.ana.material.opacity = 0.36 * (len > 0.05 ? 1 : 0) * flick * this.dim;
      this.ana.visible = this.ana.material.opacity > 0.01;
    }

    // stage set pieces
    const nearX1 = Math.max(0, 1 - Math.abs(f - 0.15) * 1.6);
    const sc = 1 + ((t * 0.0009) % 1) * 2.6;
    this.shock.scale.setScalar(sc);
    this.shock.position.x = -0.6 - sc * 0.3;
    this.shock.material.opacity = nearX1 * (1 - ((t * 0.0009) % 1)) * 0.42 * this.dim;

    if (this.abPlumes && this.abAnchors) {
      const bf = 0.8 + Math.sin(t * 0.024) * 0.2 + Math.sin(t * 0.087) * 0.06;
      for (let k = 0; k < 2; k++) {
        const m2 = this.abPlumes[k], a2 = this.abAnchors[k];
        m2.position.set(a2[0] + 0.05, a2[1], a2[2]);
        m2.scale.set(Math.max(0.001, 1.8 * bf * nearBB), 0.3, 0.3);
        m2.material.opacity = nearBB * 0.5 * (1 - swirl * 0.5) * this.dim;
        m2.visible = nearBB > 0.02;
      }
    }

    const nearWarp = Math.max(0, 1 - Math.abs(f - 5) * 1.3);
    if (this.fillLight) this.fillLight.intensity = 1.2 - nearWarp * 1.16;
    const pulse = Math.sin(t * 0.0018) * 0.04;
    this.warpFieldU.uTime.value = t * 0.001;
    const fieldDeckFactor = deck === 6 ? 0.64 : 1;
    this.warpFieldU.uOpacity.value = nearWarp * 0.32 * fieldDeckFactor * this.dim;
    this.bubble.scale.set(1.14 + pulse, 0.46 + pulse * 0.18, 0.64 + pulse * 0.2);
    this.bubble.visible = nearWarp > 0.01;
    if (this.warpRings) {
      for (let k = 0; k < this.warpRings.length; k++) {
        const r = this.warpRings[k];
        const phase = (t * 0.00018 + k / this.warpRings.length) % 1;
        r.position.x = 2.35 - phase * 4.9;
        r.scale.set(1, 0.72 + phase * 0.08, 0.96 + phase * 0.12);
        r.material.opacity = nearWarp * (0.12 + phase * 0.1) * this.dim;
        r.visible = nearWarp > 0.02;
      }
    }
    if (this.warpCoils) {
      const coilPulse = 0.82 + Math.sin(t * 0.0042) * 0.18;
      for (const coil of this.warpCoils) {
        coil.material.opacity = nearWarp * 0.34 * coilPulse * this.dim;
        coil.visible = nearWarp > 0.02;
      }
    }
    if (this.warpCollectors) {
      const collectorPulse = 0.78 + Math.sin(t * 0.0034 + 0.8) * 0.22;
      for (const collector of this.warpCollectors) {
        collector.material.opacity = nearWarp * 0.26 * collectorPulse * this.dim;
        collector.visible = nearWarp > 0.02;
      }
    }
    const phx = this.solids[5];
    if (phx && phx.material && phx.material.emissive) {
      const em = 0.012 + nearWarp * (0.026 + Math.sin(t * 0.004) * 0.008);
      phx.material.emissive.setHex(0x00f9ff).multiplyScalar(em);
    }

    const nearFold = Math.max(0, 1 - Math.abs(f - 6) * 1.25);
    this.fold.material.opacity = nearFold * 0.85 * this.dim;
    this.foldInner.material.opacity = nearFold * 0.6 * this.dim;
    this.fold.rotation.z = t * 0.0004;
    this.foldInner.rotation.z = -t * 0.0007;
    this.fold.scale.setScalar(1 + Math.sin(t * 0.001) * 0.03);
    this.foldInner.scale.setScalar(1.0 + nearFold * 0.5 + Math.sin(t * 0.0016) * 0.05);
    this.fold.visible = this.foldInner.visible = nearFold > 0.01;

    if (this.foldLens) {
      const amt = Math.pow(nearFold, 1.25);
      this.foldU.uTime.value = t * 0.001;
      this.foldU.uAmt.value = amt * 0.4 * (0.45 + this.dim * 0.55);
      this.foldLens.visible = amt > 0.008;
      this.foldLens.position.set(3.4, 0.1, 0);
      this.foldLens.scale.setScalar(0.45 + amt * 0.6);
      this.foldLens.quaternion.copy(this.camera.quaternion);

      if (amt > 0.02) {
        const c = this.foldLens.getWorldPosition(this._vec2 || (this._vec2 = new THREE.Vector3()));
        const arr = this.foldStreaks.geometry.attributes.position.array;
        const pull = amt * 0.55;
        for (let i = 0; i < this.fsBase.length / 3; i++) {
          const b = i * 3, s = i * 6;
          const bx = this.fsBase[b], by = this.fsBase[b + 1], bz = this.fsBase[b + 2];
          arr[s] = bx; arr[s + 1] = by; arr[s + 2] = bz;
          arr[s + 3] = bx + (c.x - bx) * pull;
          arr[s + 4] = by + (c.y - by) * pull;
          arr[s + 5] = bz + (c.z - bz) * pull;
        }
        this.foldStreaks.geometry.attributes.position.needsUpdate = true;
        this.foldStreaks.material.opacity = amt * 0.32 * this.dim;
        this.foldStreaks.visible = true;
      } else if (this.foldStreaks.visible) {
        this.foldStreaks.visible = false;
      }
    }

    // escort fleet — on THE GRID it splits into two counter-tiered shells
    this.gridF = (this.gridF || 0) + ((deck === 1 ? 1 : 0) - this.gridF) * 0.03;
    const rot = t * 0.00013, tilt = 0.3 + p * 0.4;
    const m = this._matrix, q = this._quat, v = this._vec;
    const sv = this._sv || (this._sv = new THREE.Vector3(1, 1, 1));
    for (let i = 0; i < 19; i++) {
      const a = (i / 19) * Math.PI * 2 + rot;
      const rr = this.R * (1 + this.gridF * (i < 7 ? -0.3 : 0.14));
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      const y = Math.sin(a * 2 + t * 0.0004) * this.R * tilt * 0.2 + this.gridF * (i < 7 ? 0.5 : -0.32);
      const pop = 1 + Math.sin(t * 0.003 + i) * 0.2 + (deck === 1 ? 0.6 : 0);
      m.compose(v.set(x, y, z), q, sv.setScalar(pop));
      this.nodes.setMatrixAt(i, m);
    }
    this.nodes.instanceMatrix.needsUpdate = true;
    this.ring.rotation.z = rot * 2;
    this.ring.position.y = -this.gridF * 0.32;
    this.ring.material.opacity = 0.4 * (1 - nearWarp) * this.dim;
    if (this.ring2) {
      this.ring2.rotation.z = -rot * 2.4;
      this.ring2.position.y = this.gridF * 0.5;
      this.ring2.material.opacity = 0.34 * this.gridF * this.dim;
      this.ring2.visible = this.gridF > 0.02;
    }

    this.beams.material.opacity += ((deck === 2 ? 0.45 : 0) * this.dim - this.beams.material.opacity) * 0.06;
    this.beams.rotation.y = rot * 3;

    const poseBloom = 1 + ((((pose && pose.bloom) || 1) - 1) * poseLock);
    const poseExposure = 1 + ((((pose && pose.exposure) || 1) - 1) * poseLock);
    this.bloom.strength = Math.min(2.05, (0.68 + warp * 1.15 + nearFold * 0.34 + nearWarp * 0.3) * (0.22 + this.dim * 0.82) * poseBloom);

    if (this.grade) {
      this.grade.uniforms.uTime.value = t * 0.001;
      this.grade.uniforms.uAmt.value = 0.35 + this.dim * 0.65 + warp * 0.9;
      this.grade.uniforms.uTear.value = Math.max(0, warp * 1.25 - 0.15);
      this.grade.uniforms.uStreak.value = (0.35 + warp * 1.1 + nearFold * 0.35) * this.dim;
    }
    this.renderer.toneMappingExposure = (0.72 + this.dim * 0.62 + warp * 0.55) * poseExposure;
    this.renderer.clear();
    this.renderer.render(this.bgScene, this.bgCam);
    this.composer.render();
  }

  _renderReduced() { if (this.reduce && this.renderer) this._frame(performance.now()); }
  setProgress(v) { this.prog = Math.max(0, Math.min(1, v || 0)); this._renderReduced(); }
  setDeck(i) { this.deck = i | 0; this._renderReduced(); }
  setCraft(i) {
    const next = Math.max(0, Math.min(CRAFT.length - 1, i | 0));
    if (next !== this.craftTarget) {
      this.bankT = 1;
      this.bankDir = next > this.craftTarget ? 1 : -1;
      this.warpT = 1;
    }
    this.craftTarget = next;
    if (this.reduce) { this.craftF = next; this.stage = next; this.warpT = 0; this._renderReduced(); }
  }
  setClearX(f) { this.clearX = Math.max(0.12, Math.min(0.9, f || 0.5)); }
  setClearRect(rx, by) {
    this.setClearX(rx);
    this.clearY = Math.max(0.3, Math.min(0.95, by || 0.85));
    this._renderReduced();
  }
  warp() { if (!this.reduce) this.warpT = 1; }
  craftIndex() { return this.stage; }

  dispose() {
    cancelAnimationFrame(this._raf);
    if (this.envMap) this.envMap.dispose();
    if (this.panelTex) this.panelTex.dispose();
    if (this.normalTex) this.normalTex.dispose();
    if (this.glintTex) this.glintTex.dispose();
    removeEventListener('resize', this._onResize);
    removeEventListener('pointermove', this._onMove);
    document.removeEventListener('visibilitychange', this._onVis);
    const kill = (root) => root && root.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
      for (const mm of mats) {
        for (const k of Object.keys(mm)) { const val = mm[k]; if (val && val.isTexture) val.dispose(); }
        mm.dispose();
      }
    });
    kill(this.scene); kill(this.bgScene);
    if (this.composer && this.composer.dispose) this.composer.dispose();
    if (this.renderer) this.renderer.dispose();
  }
}

export { CRAFT as CRAFT_SPECS, ViewscreenStage };

if (typeof customElements !== "undefined" && !customElements.get("viewscreen-stage")) {
  customElements.define("viewscreen-stage", ViewscreenStage);
}
