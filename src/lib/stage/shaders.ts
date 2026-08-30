// ZeusApollo viewscreen stage.
// GLSL sources for the nebula backdrop, the fold flash and the warp field.

export const NEBULA_VERT = `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }`;

export const NEBULA_FRAG = `
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

export const FOLD_VERT = `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

export const FOLD_FRAG = `
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
export const WARP_FIELD_VERT = `
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

export const WARP_FIELD_FRAG = `
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
