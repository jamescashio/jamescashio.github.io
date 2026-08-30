// ZeusApollo viewscreen stage.
// The final grade pass and the per deck backdrop tints.
import * as THREE from "three";

// Final grade: radial chromatic aberration, anamorphic streak off the
// highlights, vignette and film grain — the lens the viewscreen is shot through.
export const GRADE = {
  uniforms: {
    tDiffuse: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uAmt: { value: 1 },
    uStreak: { value: 0.6 },
    uTear: { value: 0 },
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
}`,
};

export const DECK_TINT: ReadonlyArray<readonly [number, number]> = [
  [0x0a1424, 0x0d3a4a],
  [0x08182a, 0x0b4a55],
  [0x1a1206, 0x4a2a05],
  [0x0c1020, 0x1e3a52],
  [0x1a1404, 0x4a3a08],
  [0x120820, 0x35104a],
  [0x0c0c1a, 0x2a2a52],
  [0x061a18, 0x08453e],
  [0x1a0c06, 0x4a1e05],
];
