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
uniform float uSweep;
uniform float uPulse;
uniform vec3 uPulseColor;
uniform float uWarp;
uniform float uDim;
uniform vec2 uPointer;
uniform vec4 uRing;
uniform float uRot;
uniform vec2 uSun;
uniform vec3 uPlanet;
uniform vec3 uNebA;
uniform vec3 uNebB;

const float TAU = 6.28318530718;
const float SEGMENTS = 44.0;

// GLSL ES 1.00 leaves smoothstep undefined when edge0 >= edge1, so falling edges are written as 1 - rising.
float fall(float from, float to, float x) {
  return 1.0 - smoothstep(to, from, x);
}
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
  float core = fall(size, 0.0, d);
  float halo = fall(size * 4.0, 0.0, d) * 0.18;
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
  float lane = fall(0.08, 0.0, abs(f.x - 0.5));
  float len = smoothstep(0.0, 0.35, f.y) * fall(1.0, 0.55, f.y);
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
  float tail = fall(0.22, 0.0, along) * step(0.0, along);
  float line = fall(0.0025, 0.0, across) * tail;
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
  // Each station lends the nebula its own two colors; the gate itself keeps the house blue.
  vec3 nebula = mix(uNebA, uNebB, smoothstep(0.45, 0.8, neb2));
  col += nebula * band * smoothstep(0.32, 0.85, neb) * 1.35;
  col += uNebA * 1.2 * pow(neb, 3.0) * 0.5;

  float dust = band * smoothstep(0.35, 0.8, neb);
  vec3 starCol = stars(uv + par * 0.2, 240.0, 3.0, 0.55 + 2.2 * dust) + stars(uv + par * 0.3, 90.0, 1.0, 0.85) + stars(uv + par * 0.7, 46.0, 17.0, 1.0) + stars(uv + par * 1.2, 22.0, 41.0, 1.25);
  if (band > 0.04) col *= 1.0 - smoothstep(0.55, 0.75, fbm(uv * 5.0 + 3.0)) * band * 0.35;
  starCol *= 1.0 - uWarp * 0.6;

  // Planet limb with a lit atmosphere.
  vec2 pc = uPlanet.xy + par * 1.4;
  float pr = uPlanet.z * (1.0 + transit * 0.35);
  vec2 pv = uv - pc;
  float pd = length(pv) - pr;
  float planetMask = fall(0.004, -0.004, pd);
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

  // The transit gate: a hoop with real depth. Its lit deck, the inner wall of the far side and the
  // outer wall of the near side are all drawn, so it reads as a built thing at any size.
  float scale = 1.0 + 9.0 * pow(transit, 2.4);
  vec2 rc = uRing.xy + par;
  vec2 p = (uv - rc) / scale;
  float cr = cos(uRot);
  float sr = sin(uRot);
  p = vec2(cr * p.x + sr * p.y, -sr * p.x + cr * p.y);
  float R = uRing.z;
  float tilt = uRing.w;
  // One pixel in the gate's own units: every edge below is this sharp, whatever the screen.
  float px = 1.25 / (uRes.y * scale);
  vec2 e = vec2(p.x, p.y / tilt);
  float r = length(e);
  float th = atan(e.y, e.x);
  float k = length(vec2(cos(th), tilt * sin(th)));
  float d = (r - R) * k;
  float nearSide = fall(0.25, -0.55, sin(th));
  float w = R * mix(0.04, 0.072, nearSide);
  float t = d / w;
  vec2 ringDir = normalize(uv - rc + 1e-4);
  vec2 sunDir = normalize(uSun - rc);
  float facing = 0.5 + 0.5 * dot(ringDir, sunDir);
  float fadeGate = 1.0 - smoothstep(0.9, 1.0, transit);
  float farDim = mix(0.5, 1.0, nearSide);

  float segPos = fract(th / TAU + 0.5);
  float segF = fract(segPos * SEGMENTS);
  float segIndex = floor(segPos * SEGMENTS);
  float order = abs(fract((segIndex + 0.5) / SEGMENTS + 0.25) - 0.5) * 2.0;
  float lit = step(order, uIgnite * 1.02);
  // Four clamps hold the hoop together, one every eleventh segment, each under a red beacon.
  float clampSeg = step(fract(segIndex / 11.0), 0.05);
  // How long one segment runs on screen, so its seams stay a pixel wide.
  float segArc = TAU / SEGMENTS * R * length(vec2(sin(th), tilt * cos(th)));

  // Interior field: almost clear, so the stars behind it stay visible; light gathers toward the rim.
  float inside = fall(0.0, -w * 1.2, d);
  float rr = r / R;
  float shimmer = inside > 0.0 ? fbm(e * 4.0 + vec2(uTime * 0.04, -uTime * 0.025)) : 0.0;
  float ripple = smoothstep(0.92, 1.0, 0.5 + 0.5 * sin(rr * 26.0 - uTime * 1.1)) * smoothstep(0.35, 0.95, rr);
  vec3 field = vec3(0.1, 0.25, 0.75) * (pow(shimmer, 3.0) * 0.16 + pow(smoothstep(0.55, 1.0, rr), 3.0) * 0.22 + ripple * 0.05);
  col += field * inside * uIgnite * fadeGate * (1.0 + transit * 2.2);

  // The underside rim hangs one hull depth below the deck. Between the two rims lie the walls.
  float depth = R * mix(0.05, 0.088, nearSide);
  vec2 eB = vec2(p.x, (p.y + depth) / tilt);
  float thB = atan(eB.y, eB.x);
  float dB = (length(eB) - R) * length(vec2(cos(thB), tilt * sin(thB)));
  float wB = R * mix(0.04, 0.072, fall(0.25, -0.55, sin(thB)));
  float outerA = d - w;
  float outerB = dB - wB;
  float innerA = -(d + w);
  float innerB = dB + wB;
  float innerWall = smoothstep(-px, px, innerA) * smoothstep(-px, px, innerB);
  float outerWall = smoothstep(-px, px, outerA) * fall(px, -px, outerB);

  if (innerWall > 0.0) {
    // The far side's inner wall faces the opening: dark metal washed by the gate's own light.
    float v = clamp(innerA / max(innerA + innerB, 1e-5), 0.0, 1.0);
    float thW = atan((p.y + depth * v) / tilt, p.x);
    float segW = fract(thW / TAU + 0.5) * SEGMENTS;
    float fW = fract(segW);
    float iW = floor(segW);
    float seam = smoothstep(0.0, 0.05, fW) * fall(1.0, 0.95, fW);
    vec2 inward = -normalize(vec2(cos(thW), tilt * sin(thW)));
    float sunlit = pow(max(dot(inward, sunDir), 0.0), 2.0);
    vec3 wall = vec3(0.035, 0.05, 0.085) + vec3(0.5, 0.54, 0.62) * sunlit * 0.55;
    wall += vec3(0.1, 0.26, 0.85) * (pow(1.0 - v, 2.0) * 0.55 + pow(v, 3.0) * 0.3) * uIgnite;
    wall *= mix(0.45, 1.0, seam);
    // A conduit runs the wall's middle; every segment carries one emitter pad on it.
    float conduit = fall(0.07, 0.0, abs(v - 0.5));
    float pad = fall(0.3, 0.24, abs(fW - 0.5)) * fall(0.17, 0.09, abs(v - 0.5));
    float litW = step(abs(fract((iW + 0.5) / SEGMENTS + 0.25) - 0.5) * 2.0, uIgnite * 1.02);
    float breath = 0.75 + 0.25 * sin(uTime * 1.6 - iW * 0.45);
    wall += vec3(0.3, 0.55, 1.0) * conduit * 0.5 * uIgnite;
    wall += vec3(0.6, 0.8, 1.0) * pad * litW * breath * 0.8;
    wall *= 1.0 - 0.45 * smoothstep(0.75, 1.0, v);
    col = mix(col, wall * mix(0.62, 1.0, nearSide), innerWall * fadeGate);
  }

  if (outerWall > 0.0) {
    // The near side's outer wall turns away from the sun: shadowed plating, lit ports and a cold edge of sky light.
    float v = clamp(outerA / max(outerA - outerB, 1e-5), 0.0, 1.0);
    float thW = atan((p.y + depth * v) / tilt, p.x);
    float segW = fract(thW / TAU + 0.5) * SEGMENTS;
    float fW = fract(segW);
    float iW = floor(segW);
    float seam = smoothstep(0.0, 0.04, fW) * fall(1.0, 0.96, fW);
    vec2 outward = normalize(vec2(cos(thW), tilt * sin(thW)));
    float sunlit = pow(max(dot(outward, sunDir), 0.0), 1.5);
    float plate = 0.8 + 0.2 * hash21(vec2(iW, floor(v * 2.0) + 7.0));
    // Lit from above by the deck's own spill, darker toward the keel: a solid wall, not a pane of sky.
    vec3 wall = (vec3(0.15, 0.158, 0.18) * (1.0 - 0.5 * v) + vec3(0.62, 0.66, 0.74) * sunlit * 0.9) * plate;
    wall *= mix(0.4, 1.0, seam) * (1.0 - 0.4 * fall(0.05, 0.0, abs(v - 0.5)));
    wall *= 1.0 - 0.35 * fall(0.16, 0.0, v);
    // Two rows of ports; most are dark, as on any ship at rest.
    float row = floor(v * 2.0);
    float rowV = fract(v * 2.0);
    float cell = floor(fW * 9.0);
    float port = step(0.72, hash21(vec2(iW * 9.0 + cell, row + 3.0)));
    port *= fall(0.34, 0.22, abs(fract(fW * 9.0) - 0.5)) * fall(0.2, 0.1, abs(rowV - 0.5)) * step(0.1, fW) * step(fW, 0.9);
    vec3 portTint = mix(vec3(0.6, 0.8, 1.0), vec3(1.0, 0.86, 0.66), step(0.5, hash21(vec2(cell, iW + 1.0))));
    wall += portTint * port * 0.85 * uIgnite;
    wall += vec3(0.16, 0.36, 1.0) * pow(v, 6.0) * 0.22;
    wall += vec3(0.5, 0.62, 0.9) * fall(2.5 * px, 0.0, abs(outerB)) * 0.3;
    col = mix(col, wall * mix(0.7, 1.0, nearSide), outerWall * fadeGate);
  }

  float face = fall(px, -px, abs(d) - w);
  if (face > 0.0) {
    float tc = clamp(t, -1.0, 1.0);
    float n = sqrt(1.0 - tc * tc);
    float seamW = max(0.03, px * 1.6 / max(segArc, 1e-5));
    float groove = smoothstep(0.0, seamW, segF) * fall(1.0, 1.0 - seamW, segF);
    float ribW = max(0.05, px * 1.6 / w);
    float rib = 1.0 - 0.55 * fall(ribW, 0.0, abs(abs(tc) - 0.5));
    float panel = 0.82 + 0.18 * hash21(vec2(segIndex, floor((tc + 1.0) * 3.0)));
    // The outer plates split once more, so the hull keeps detail when it fills the screen.
    float split = 1.0 - 0.3 * fall(seamW * 0.8, 0.0, abs(segF - 0.5)) * step(0.5, tc);
    vec3 normal3 = normalize(vec3(ringDir * tc, n * 0.9));
    vec3 light3 = normalize(vec3(sunDir, 0.55));
    float diffuse = max(dot(normal3, light3), 0.0);
    vec3 hull = vec3(0.66, 0.7, 0.78) * (0.05 + 0.95 * pow(diffuse, 1.4)) * panel * (1.0 + 0.22 * clampSeg);
    hull += vec3(0.18, 0.34, 0.9) * fall(0.1, -0.9, tc) * 0.34 * uIgnite;
    hull *= mix(0.22, 1.0, groove) * rib * split;
    // A recessed channel down the deck carries running lights that chase around the hoop.
    float channel = fall(0.16, 0.1, abs(tc));
    hull *= 1.0 - 0.3 * channel;
    float dash = fall(0.36, 0.3, abs(fract(segF * 3.0) - 0.5)) * fall(0.07, 0.03, abs(tc));
    float chase = pow(0.5 + 0.5 * sin(th * 3.0 + uTime * 0.9), 6.0);
    float spec = pow(max(dot(reflect(-light3, normal3), vec3(0.0, 0.0, 1.0)), 0.0), 22.0) * 1.2;
    float topLine = fall(0.08, 0.0, abs(tc + 0.35)) * pow(facing, 2.0) * 0.35;
    float rim = pow(1.0 - n, 2.2) * 0.7;
    vec3 gateCol = hull + vec3(1.0, 0.95, 0.88) * (spec + topLine) + vec3(0.22, 0.45, 1.0) * rim * (0.3 + 0.7 * uIgnite);
    gateCol += vec3(0.4, 0.66, 1.0) * dash * (0.18 + 1.0 * chase) * lit * uIgnite;
    float windows = step(0.86, hash21(vec2(segIndex, floor(segF * 9.0)))) * fall(0.12, 0.0, abs(tc - 0.35)) * step(0.15, segF) * step(segF, 0.85);
    gateCol += vec3(0.55, 0.75, 1.0) * windows * 0.8 * uIgnite;
    // Each clamp is braced by two dark straps across the deck.
    gateCol *= 1.0 - 0.5 * clampSeg * fall(0.05, 0.02, abs(abs(segF - 0.5) - 0.3));
    // A hard light line where the deck meets the outer wall, and a soft one where it meets the opening.
    gateCol += vec3(0.8, 0.86, 1.0) * fall(2.5 * px, 0.0, abs(d - w)) * (0.1 + 0.5 * pow(facing, 2.0));
    col = mix(col, gateCol * farDim, face * fadeGate);
  }

  // The energy lip rides the deck's inner edge all the way round: the part that ignites. A second, fainter
  // line marks the underside rim where the far wall shows it.
  float lipW = w * 0.07 + px;
  float energy = exp(-abs(d + w) / lipW) * 1.0 + exp(-abs(d + w) / (w * 1.1)) * 0.22;
  float orderE = abs(fract(th / TAU + 0.25) - 0.5) * 2.0;
  float litE = fall(uIgnite * 1.03, uIgnite * 1.03 - 0.04, orderE);
  float flicker = 0.9 + 0.1 * sin(uTime * 3.0 + th * 6.0);
  col += vec3(0.32, 0.56, 1.0) * energy * litE * mix(0.5, 1.0, nearSide) * fadeGate * flicker;
  col += vec3(0.24, 0.46, 1.0) * exp(-abs(innerB) / (wB * 0.06 + px)) * innerWall * litE * 0.55 * fadeGate;

  // Segment beacons on the outer hull.
  float segCenter = (segIndex + 0.5) / SEGMENTS;
  float dTh = (segPos - segCenter) * TAU;
  float arc = dTh * R * length(vec2(sin(th), tilt * cos(th))) * scale;
  float radial = (t - 0.78) * w * scale;
  float bd = length(vec2(arc, radial));
  vec3 beaconTint = mix(vec3(0.38, 0.6, 1.0), vec3(1.0, 0.25, 0.34), clampSeg);
  float pulse = 0.6 + 0.4 * sin(uTime * 2.2 - segIndex * 0.55);
  float bs = 0.0000035 * scale * scale;
  float beacon = bs / (bd * bd + bs * 0.9) * lit * pulse * mix(0.4, 1.0, nearSide);
  col += beaconTint * beacon * fadeGate * 0.9;
  col += vec3(0.25, 0.45, 1.0) * exp(-abs(d) / (w * 3.2)) * 0.08 * uIgnite * fadeGate * mix(0.4, 1.0, nearSide);

  // Traffic. Three small ships use the gate: two come through toward the viewer and one leaves through
  // it. Each starts as a point inside the opening and sweeps past in front of the near hull, so nothing
  // ever has to pass behind the ring. They give the gate its scale.
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float u = fract(uTime / (19.0 + fi * 7.0) + fi * 0.37 + 0.11);
    float heading = 1.0;
    if (i == 2) {
      u = 1.0 - u;
      heading = -1.0;
    }
    // Perspective: far beyond the gate a ship crawls, close to the viewer it sweeps by.
    float k = pow(u, 2.6);
    vec2 from = R * vec2(0.2 * sin(fi * 2.4 + 1.0), 0.12 * tilt * cos(fi * 1.7));
    vec2 to = R * vec2(-1.9 + fi * 1.6, -1.5 - 0.3 * fi);
    vec2 course = normalize(to - from);
    vec2 q = p - mix(from, to, k);
    float size = R * mix(0.004, 0.026, k) + px;
    float behind = -heading * dot(q, course);
    float across = dot(q, vec2(-course.y, course.x));
    float wake = exp(-abs(across) / (size * 0.4)) * fall(size * mix(4.0, 11.0, k), 0.0, behind) * step(0.0, behind);
    float body = exp(-dot(q, q) / (size * size * 0.45));
    float seen = smoothstep(0.0, 0.08, u) * fall(1.0, 0.88, u) * uIgnite * fadeGate;
    col += (vec3(1.0, 0.95, 0.86) * body * 1.1 + vec3(0.32, 0.58, 1.0) * wake * 0.55) * seen;
  }

  // Ignition front: on a first visit a bright band races once along both arcs of the lit gate.
  float front = exp(-pow((orderE - uSweep) * 40.0, 2.0)) * step(uSweep, 0.999) * step(0.001, uSweep);
  col += vec3(0.6, 0.8, 1.0) * front * (exp(-abs(d) / (w * 0.45)) * 1.6 + exp(-abs(d) / (w * 1.6)) * 0.25) * fadeGate;

  // Warp streaks and shooting stars.
  col += warpField(uv - rc * (1.0 - transit)) * uWarp * 1.4;
  col += shootingStar(uv, 0.0) + shootingStar(uv, 1.0);

  // A whisper of light as the gate surface passes the camera.
  // The next gate in the chain: far ahead and faint, so the sky behind the stations still has somewhere to go.
  float ahead = smoothstep(0.85, 1.0, transit);
  if (ahead > 0.0) {
    vec2 q = uv - (uRing.xy * 0.55 + vec2(0.06, 0.05));
    q = vec2(cr * q.x + sr * q.y, -sr * q.x + cr * q.y);
    float R2 = R * 0.17;
    vec2 e2 = vec2(q.x, q.y / tilt);
    float th2 = atan(e2.y, e2.x);
    float d2 = (length(e2) - R2) * length(vec2(cos(th2), tilt * sin(th2)));
    float glow2 = exp(-abs(d2) / (R2 * 0.05)) * 0.55 + exp(-abs(d2) / (R2 * 0.35)) * 0.12;
    float blink = step(0.985, fract(th2 / TAU * 22.0 + 0.5)) * (0.6 + 0.4 * sin(uTime * 2.0 + th2 * 3.0));
    col += vec3(0.35, 0.58, 1.0) * (glow2 + blink * exp(-abs(d2) / (R2 * 0.08)) * 0.6) * ahead * uIgnite;
    // A decision at the helm reaches the sky: the far gate flares in the lane's color and washes the field around it.
    col += uPulseColor * uPulse * ahead * (glow2 * 3.0 + exp(-length(q) / (R2 * 2.4)) * 0.55 + exp(-length(q) / (R2 * 9.0)) * 0.12);
  }
  col += vec3(0.25, 0.45, 1.0) * smoothstep(0.55, 0.85, transit) * fall(1.0, 0.86, transit) * 0.22;

  col *= mix(1.0, 0.5, uDim);
  float vig = fall(1.25, 0.25, length(uv * vec2(0.9, 1.1)));
  col *= mix(0.55, 1.0, vig);
  col = 1.0 - exp(-col * 1.35);
  col = pow(col, vec3(0.92));
  col += (hash21(frag + fract(uTime) * 91.0) - 0.5) * 0.018;
  gl_FragColor = vec4(col, 1.0);
}
`;
