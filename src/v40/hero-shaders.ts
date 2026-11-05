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
varying vec2 posterUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
void main() {
  vec2 uv = posterUv * fit + (1.0-fit) * vec2(.68,.5);
  float depth = texture2D(depthMap, uv).r;
  // Move the picture and SVG instruments together through the shared camera.
  // Distorting the picture here would make its rim slide beneath the overlay.
  vec3 color = texture2D(artwork, clamp(uv, .001, .999)).rgb;
  vec3 platinum = vec3(.886,.902,.933);
  vec3 blue = vec3(.208,.471,1.);
  // Only subtle atmosphere belongs in this shader. The SVG owns the entire ring.
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
  color += mix(platinum,blue,seed) * dust * .18;
  gl_FragColor = vec4(color,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
