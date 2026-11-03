export const vertexShader = `
varying vec2 posterUv;
void main() {
  posterUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;
export const fragmentShader = `
uniform sampler2D artwork;
uniform sampler2D depthMap;
uniform vec2 fit;
uniform vec2 pointer;
uniform float time;
uniform float orbitDuration;
varying vec2 posterUv;
const float TAU = 6.28318530718;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float stroke(float distance, float width) {
  float aa = max(fwidth(distance), .45);
  return 1.0 - smoothstep(width-aa, width+aa, abs(distance));
}
void main() {
  vec2 uv = posterUv * fit + (1.0-fit) * vec2(.68,.5);
  float depth = texture2D(depthMap, uv).r;
  uv += vec2(pointer.x,-pointer.y) * .007 * depth;
  vec3 color = texture2D(artwork, clamp(uv, .001, .999)).rgb;
  vec2 p = uv * vec2(1920.,1080.);
  vec2 center = vec2(1508.,572.);
  vec2 delta = p-center;
  float radius = length(delta);
  float angle = atan(delta.y,delta.x);
  vec3 cyan = vec3(.447,.898,.957);
  vec3 gold = vec3(.929,.741,.424);
  float fineTicks = step(.92, fract(angle/TAU*100.));
  float majorTicks = step(.97, fract(angle/TAU*10.));
  color += cyan * stroke(radius-360., .75) * .38;
  color += gold * stroke(radius-372., 4.) * fineTicks * .55;
  color += vec3(1.,.851,.561) * stroke(radius-381., 9.) * majorTicks * .82;
  color += cyan * stroke(radius-402., 1.) * step(.25, fract(angle/TAU*16.)) * .2;
  vec2 bracket = abs(p-vec2(1297.,688.));
  float corners = step(12., min(bracket.x,bracket.y));
  color += vec3(1.,.878,.631) * stroke(max(bracket.x,bracket.y)-24.,1.25) * corners;
  float phase = time * TAU / orbitDuration;
  vec2 orbiter = center + vec2(cos(phase),sin(phase))*402.;
  float glow = exp(-dot(p-orbiter,p-orbiter)/55.);
  color += cyan * glow * .8;
  // The same authored depth displaces the picture and its instruments. No reading is implied.
  vec2 sun = vec2(.973,.655);
  vec2 ray = uv-sun;
  float rayAngle = atan(ray.y,ray.x);
  float shaft = pow(max(0.,sin(rayAngle*18.+pointer.x*.8)),18.);
  float space = 1.-smoothstep(.15,.32,depth);
  color += vec3(1.,.7,.3) * shaft * exp(-length(ray)*3.) * space * .045;
  vec2 field = (uv + vec2(time*.0008, -time*.0002) + pointer*.001) * vec2(30.,18.);
  vec2 cell = floor(field);
  float seed = hash(cell);
  vec2 mote = fract(field)-vec2(.2+.6*seed,.25+.5*hash(cell+7.));
  float dust = exp(-dot(mote,mote)*1700.) * step(.84,seed);
  color += mix(cyan,gold,seed) * dust * (.35+.25*sin(time+seed*TAU));
  gl_FragColor = vec4(color,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
