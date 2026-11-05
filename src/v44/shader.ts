/**
 * The V44 Drummer sky: one full screen fragment shader.
 * A tilted transit gate of lit hull segments, a sun, a planet limb, a nebula band and three star layers.
 * Scroll drives the approach through the gate; a short radial streak field carries the warp.
 * Written in GLSL ES 1.00 so it runs on WebGL 1 and 2.
 */
export const VERTEX_SHADER = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;
uniform float uTime;
uniform float uTransit;
uniform float uIgnite;
uniform float uWarp;
uniform float uDim;
uniform vec2 uPointer;
uniform vec4 uRing;
uniform float uRot;
uniform vec2 uSun;
uniform vec3 uPlanet;

const float TAU = 6.28318530718;
const float SEGMENTS = 44.0;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

vec3 stars(vec2 uv, float scale, float seed, float bright) {
  vec2 g = uv * scale;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  float h = hash21(id + seed);
  vec2 o = vec2(hash21(id + seed + 1.7), hash21(id + seed + 3.1)) - 0.5;
  float d = length(f - o * 0.78);
  float b = pow(h, 14.0) * bright;
  float size = mix(0.018, 0.055, hash21(id + seed + 5.0));
  float core = smoothstep(size, 0.0, d);
  float halo = smoothstep(size * 4.0, 0.0, d) * 0.18;
  float twinkle = 0.72 + 0.28 * sin(uTime * (0.8 + h * 2.6) + h * 61.0);
  vec3 tint = mix(vec3(0.72, 0.82, 1.0), vec3(1.0, 0.9, 0.82), hash21(id + seed + 9.0));
  return tint * (core + halo) * b * twinkle;
}

vec3 warpField(vec2 p) {
  float r = length(p);
  float a = atan(p.y, p.x);
  vec2 q = vec2(a / TAU * 90.0, log(r + 0.02) * 5.0 - uTime * 6.0);
  vec2 id = floor(q);
  vec2 f = fract(q);
  float h = hash21(id);
  float lane = smoothstep(0.08, 0.0, abs(f.x - 0.5));
  float len = smoothstep(0.0, 0.35, f.y) * smoothstep(1.0, 0.55, f.y);
  return mix(vec3(0.62, 0.78, 1.0), vec3(1.0, 0.62, 0.7), step(0.97, h)) * lane * len * step(0.82, h) * smoothstep(0.05, 0.6, r);
}

vec3 shootingStar(vec2 uv, float slot) {
  float period = 9.0 + slot * 4.0;
  float cycle = floor((uTime + slot * 3.1) / period);
  float local = fract((uTime + slot * 3.1) / period) * period;
  float life = 0.9;
  if (local > life) return vec3(0.0);
  float h1 = hash21(vec2(cycle, slot));
  float h2 = hash21(vec2(slot, cycle + 7.0));
  vec2 start = vec2(mix(-0.9, 0.9, h1), mix(0.1, 0.45, h2));
  vec2 dir = normalize(vec2(mix(0.6, 1.0, h2), -mix(0.25, 0.55, h1)));
  float t = local / life;
  vec2 head = start + dir * t * 0.75;
  vec2 rel = uv - head;
  float along = dot(rel, -dir);
  float across = length(rel + dir * along);
  float tail = smoothstep(0.22, 0.0, along) * step(0.0, along);
  float line = smoothstep(0.0025, 0.0, across) * tail;
  float fade = sin(t * 3.14159);
  return vec3(0.75, 0.86, 1.0) * line * fade * 1.4;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag - 0.5 * uRes) / uRes.y;
  vec2 par = uPointer * 0.012;
  float transit = clamp(uTransit, 0.0, 1.0);

  // Deep field.
  vec3 col = vec3(0.006, 0.009, 0.018);
  vec2 drift = vec2(uTime * 0.0035, 0.0);
  float band = exp(-pow((uv.y + uv.x * 0.42 - 0.05) / 0.42, 2.0));
  float neb = fbm(uv * 1.7 + drift + par * 2.0);
  float neb2 = fbm(uv * 3.3 - drift * 1.6 + 11.0);
  vec3 nebula = mix(vec3(0.03, 0.07, 0.2), vec3(0.16, 0.05, 0.12), smoothstep(0.45, 0.8, neb2));
  col += nebula * band * smoothstep(0.32, 0.85, neb) * 1.35;
  col += vec3(0.04, 0.08, 0.2) * pow(neb, 3.0) * 0.5;

  float dust = band * smoothstep(0.35, 0.8, neb);
  vec3 starCol = stars(uv + par * 0.2, 240.0, 3.0, 0.55 + 2.2 * dust) + stars(uv + par * 0.3, 90.0, 1.0, 0.85) + stars(uv + par * 0.7, 46.0, 17.0, 1.0) + stars(uv + par * 1.2, 22.0, 41.0, 1.25);
  if (band > 0.04) col *= 1.0 - smoothstep(0.55, 0.75, fbm(uv * 5.0 + 3.0)) * band * 0.35;
  starCol *= 1.0 - uWarp * 0.6;

  // Planet limb with a lit atmosphere.
  vec2 pc = uPlanet.xy + par * 1.4;
  float pr = uPlanet.z * (1.0 + transit * 0.35);
  vec2 pv = uv - pc;
  float pd = length(pv) - pr;
  float planetMask = smoothstep(0.004, -0.004, pd);
  vec2 pn = pv / pr;
  vec2 toSunP = normalize(uSun - pc);
  float plit = clamp(dot(normalize(pn + 1e-4), toSunP) * 0.9 + 0.12, 0.0, 1.0);
  // Surface detail only where the planet is.
  float bands = pd < 0.01 ? fbm(vec2(pn.x * 3.0, pn.y * 11.0) + vec2(uTime * 0.002, 0.0)) : 0.0;
  vec3 surface = mix(vec3(0.02, 0.03, 0.05), vec3(0.2, 0.26, 0.36), bands) * pow(plit, 1.6);
  float atmo = exp(-abs(pd) * 70.0) * (0.25 + 1.4 * pow(plit, 2.0));
  col = mix(col + starCol, surface, planetMask);
  col += vec3(0.3, 0.55, 1.0) * atmo * 0.55;

  // Sun, halo and an anamorphic streak.
  vec2 sp = uv - uSun - par * 0.6;
  float sd = length(sp);
  vec3 sun = vec3(1.0, 0.94, 0.86) * (0.00055 / (sd * sd + 0.00045));
  sun += vec3(0.5, 0.66, 1.0) * (0.035 / (sd + 0.05));
  sun += vec3(0.55, 0.72, 1.0) * exp(-abs(sp.y) * 120.0) * exp(-abs(sp.x) * 2.6) * 0.45;
  col += sun * (1.0 - planetMask * 0.92) * (1.0 - transit * 0.85);

  // The transit gate.
  float scale = 1.0 + 9.0 * pow(transit, 2.4);
  vec2 rc = uRing.xy + par;
  vec2 p = (uv - rc) / scale;
  float cr = cos(uRot);
  float sr = sin(uRot);
  p = vec2(cr * p.x + sr * p.y, -sr * p.x + cr * p.y);
  float R = uRing.z;
  float tilt = uRing.w;
  vec2 e = vec2(p.x, p.y / tilt);
  float r = length(e);
  float th = atan(e.y, e.x);
  float k = length(vec2(cos(th), tilt * sin(th)));
  float d = (r - R) * k;
  float nearSide = smoothstep(0.25, -0.55, sin(th));
  float w = R * mix(0.04, 0.072, nearSide);
  float t = d / w;
  vec2 ringDir = normalize(uv - rc + 1e-4);
  vec2 sunDir = normalize(uSun - rc);
  float facing = 0.5 + 0.5 * dot(ringDir, sunDir);
  float fadeGate = 1.0 - smoothstep(0.9, 1.0, transit);

  float segPos = fract(th / TAU + 0.5);
  float segF = fract(segPos * SEGMENTS);
  float segIndex = floor(segPos * SEGMENTS);
  float order = abs(fract((segIndex + 0.5) / SEGMENTS + 0.25) - 0.5) * 2.0;
  float lit = step(order, uIgnite * 1.02);

  // Interior field: almost clear, so the stars behind it stay visible; light gathers toward the rim.
  float inside = smoothstep(0.0, -w * 1.2, d);
  float rr = r / R;
  float shimmer = inside > 0.0 ? fbm(e * 4.0 + vec2(uTime * 0.04, -uTime * 0.025)) : 0.0;
  float ripple = smoothstep(0.92, 1.0, 0.5 + 0.5 * sin(rr * 26.0 - uTime * 1.1)) * smoothstep(0.35, 0.95, rr);
  vec3 field = vec3(0.1, 0.25, 0.75) * (pow(shimmer, 3.0) * 0.16 + pow(smoothstep(0.55, 1.0, rr), 3.0) * 0.22 + ripple * 0.05);
  col += field * inside * uIgnite * fadeGate * (1.0 + transit * 2.2);

  // Energy ring, set just inside the hull: the part that ignites.
  float er = (r - R * 0.93) * k;
  float ew = w * 0.16;
  float energy = exp(-abs(er) / ew) * 0.9 + exp(-abs(er) / (ew * 7.0)) * 0.22;
  float orderE = abs(fract(th / TAU + 0.25) - 0.5) * 2.0;
  float litE = smoothstep(uIgnite * 1.03, uIgnite * 1.03 - 0.04, orderE);
  col += vec3(0.32, 0.56, 1.0) * energy * litE * mix(0.5, 1.0, nearSide) * fadeGate * (0.9 + 0.1 * sin(uTime * 3.0 + th * 6.0));

  if (abs(t) < 1.0) {
    float n = sqrt(1.0 - t * t);
    float groove = smoothstep(0.0, 0.03, segF) * smoothstep(1.0, 0.97, segF);
    float rib = 1.0 - 0.5 * smoothstep(0.06, 0.0, abs(abs(t) - 0.5));
    float panel = 0.85 + 0.15 * hash21(vec2(segIndex, floor((t + 1.0) * 3.0)));
    vec3 normal3 = normalize(vec3(ringDir * t, n * 0.9));
    vec3 light3 = normalize(vec3(sunDir, 0.55));
    float diffuse = max(dot(normal3, light3), 0.0);
    vec3 hull = vec3(0.66, 0.7, 0.78) * (0.04 + 0.96 * pow(diffuse, 1.4)) * panel;
    hull += vec3(0.18, 0.34, 0.9) * smoothstep(0.1, -0.9, t) * 0.32 * uIgnite;
    hull *= mix(0.25, 1.0, groove) * rib;
    float spec = pow(max(dot(reflect(-light3, normal3), vec3(0.0, 0.0, 1.0)), 0.0), 22.0) * 1.2;
    float topLine = smoothstep(0.08, 0.0, abs(t + 0.35)) * pow(facing, 2.0) * 0.35;
    float rim = pow(1.0 - n, 2.2) * 0.7;
    vec3 gateCol = hull + vec3(1.0, 0.95, 0.88) * (spec + topLine) + vec3(0.22, 0.45, 1.0) * rim * (0.3 + 0.7 * uIgnite);
    float windows = step(0.86, hash21(vec2(segIndex, floor(segF * 9.0)))) * smoothstep(0.12, 0.0, abs(t - 0.35)) * step(0.15, segF) * step(segF, 0.85);
    gateCol += vec3(0.55, 0.75, 1.0) * windows * 0.8 * uIgnite;
    float edge = smoothstep(1.0, 0.86, abs(t));
    float farDim = mix(0.5, 1.0, nearSide);
    col = mix(col, gateCol * farDim, edge * fadeGate);
  }

  // Segment beacons on the outer hull.
  float segCenter = (segIndex + 0.5) / SEGMENTS;
  float dTh = (segPos - segCenter) * TAU;
  float arc = dTh * R * length(vec2(sin(th), tilt * cos(th))) * scale;
  float radial = (t - 0.78) * w * scale;
  float bd = length(vec2(arc, radial));
  float red = step(fract(segIndex / 11.0), 0.05);
  vec3 beaconTint = mix(vec3(0.38, 0.6, 1.0), vec3(1.0, 0.25, 0.34), red);
  float pulse = 0.6 + 0.4 * sin(uTime * 2.2 - segIndex * 0.55);
  float bs = 0.0000035 * scale * scale;
  float beacon = bs / (bd * bd + bs * 0.9) * lit * pulse * mix(0.4, 1.0, nearSide);
  col += beaconTint * beacon * fadeGate * 0.9;
  col += vec3(0.25, 0.45, 1.0) * exp(-abs(d) / (w * 3.2)) * 0.08 * uIgnite * fadeGate * mix(0.4, 1.0, nearSide);

  // Ignition front: a bright band racing along both arcs while the gate wakes.
  float front = exp(-pow((orderE - uIgnite) * 40.0, 2.0)) * step(uIgnite, 0.999) * step(0.001, uIgnite);
  col += vec3(0.6, 0.8, 1.0) * front * (exp(-abs(d) / (w * 0.45)) * 1.6 + exp(-abs(d) / (w * 1.6)) * 0.25) * fadeGate;

  // Warp streaks and shooting stars.
  col += warpField(uv - rc * (1.0 - transit)) * uWarp * 1.4;
  col += shootingStar(uv, 0.0) + shootingStar(uv, 1.0);

  // A whisper of light as the gate surface passes the camera.
  col += vec3(0.25, 0.45, 1.0) * smoothstep(0.55, 0.85, transit) * smoothstep(1.0, 0.86, transit) * 0.22;

  col *= mix(1.0, 0.5, uDim);
  float vig = smoothstep(1.25, 0.25, length(uv * vec2(0.9, 1.1)));
  col *= mix(0.55, 1.0, vig);
  col = 1.0 - exp(-col * 1.35);
  col = pow(col, vec3(0.92));
  col += (hash21(frag + fract(uTime) * 91.0) - 0.5) * 0.018;
  gl_FragColor = vec4(col, 1.0);
}
`;
