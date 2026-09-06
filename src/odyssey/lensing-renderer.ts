import * as THREE from "three";

export type LensingLight = "dawn" | "ion" | "eclipse";
export type LensingView = "orbit" | "surface" | "gate";
export type LensingController = {
  setLight: (light: LensingLight) => void;
  setView: (view: LensingView) => void;
  setMotion: (enabled: boolean) => void;
  setPlaying: (enabled: boolean) => void;
  /** Four-second gate ignition, latched until disabled. Static when motion is off. */
  setResonance: (enabled: boolean) => void;
  rotate: (dx: number, dy: number) => void;
  /** Distance multiplier: 0.85 moves closer; 1.15 moves farther away. */
  zoom: (amount: number) => void;
  reset: () => void;
  dispose: () => void;
};

const TAU = Math.PI * 2;
const PIXEL_BUDGET = 2_000_000;
const FRAME_MS = 1000 / 30;

/** A seamless spherical atlas replaces repeated per-pixel noise with two texture
 * reads. Its channels hold coast elevation, mineral relief, clouds and night light.
 * Everything is authored locally; no imagery, downloads or render passes. */
function createSurfaceAtlas() {
  const size = 1024,
    height = 512;
  const permutation = new Uint8Array(512);
  const shuffled = Array.from({ length: 256 }, (_, index) => index);
  let seed = 38193;
  for (let index = 255; index > 0; index--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const other = seed % (index + 1);
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }
  for (let index = 0; index < 512; index++) permutation[index] = shuffled[index & 255];
  const fade = (value: number) => value * value * value * (value * (value * 6 - 15) + 10);
  const lerp = (a: number, b: number, amount: number) => a + (b - a) * amount;
  const smooth = (a: number, b: number, value: number) => {
    const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const noise = (x: number, y: number, z: number) => {
    const ix = Math.floor(x),
      iy = Math.floor(y),
      iz = Math.floor(z);
    const fx = fade(x - ix),
      fy = fade(y - iy),
      fz = fade(z - iz);
    const x0 = ix & 255,
      y0 = iy & 255,
      z0 = iz & 255;
    const a = permutation[x0] + y0,
      b = permutation[x0 + 1] + y0;
    const aa = permutation[a] + z0,
      ab = permutation[a + 1] + z0;
    const ba = permutation[b] + z0,
      bb = permutation[b + 1] + z0;
    return (
      lerp(
        lerp(lerp(permutation[aa], permutation[ba], fx), lerp(permutation[ab], permutation[bb], fx), fy),
        lerp(
          lerp(permutation[aa + 1], permutation[ba + 1], fx),
          lerp(permutation[ab + 1], permutation[bb + 1], fx),
          fy,
        ),
        fz,
      ) / 255
    );
  };
  const data = new Uint8Array(size * height * 4);
  for (let row = 0; row < height; row++) {
    // DataTexture starts at v=0; Three's sphere UV has its south pole there.
    const latitude = ((row + 0.5) / height - 0.5) * Math.PI;
    const py = Math.sin(latitude),
      radius = Math.cos(latitude);
    for (let column = 0; column < size; column++) {
      const longitude = ((column + 0.5) / size) * TAU;
      const px = -Math.cos(longitude) * radius,
        pz = Math.sin(longitude) * radius;
      const warp = noise(px * 3.1 + 7, py * 3.1 - 4, pz * 3.1 + 11) - 0.5;
      const x = px * 2.45 + warp * 0.62 + 2.9;
      const y = py * 2.45 + warp * 0.38 - 5.2;
      const z = pz * 2.45 - warp * 0.51 + 8.3;
      const elevation =
        noise(x, y, z) * 0.52 +
        noise(x * 2.03 + 5, y * 2.03, z * 2.03) * 0.25 +
        noise(x * 4.17, y * 4.17 - 7, z * 4.17) * 0.12 +
        noise(x * 8.37, y * 8.37, z * 8.37 + 13) * 0.064 +
        noise(x * 17.1, y * 17.1, z * 17.1) * 0.031 +
        noise(x * 35.3, y * 35.3, z * 35.3) * 0.015;
      const ridge = 1 - Math.abs(noise(px * 68 + 3, py * 68, pz * 68) * 2 - 1);
      const grain = noise(px * 173, py * 173, pz * 173);
      const relief = ridge * 0.7 + grain * 0.3;
      // Latitude-sheared, broken streams: high-frequency filaments survive in
      // the close view without filling the entire globe with opaque cloud cover.
      const wind = noise(px * 4.7 + 19, py * 4.7, pz * 4.7) - 0.5;
      const cx = px * 8.3 + wind * 1.8,
        cy = py * 15.6 + wind * 0.9,
        cz = pz * 8.3 - wind * 1.4;
      const vapor =
        noise(cx, cy, cz) * 0.43 +
        noise(cx * 2.1 + 11, cy * 2.1, cz * 2.1) * 0.28 +
        noise(cx * 4.3, cy * 4.3 - 3, cz * 4.3) * 0.17 +
        noise(cx * 8.7, cy * 8.7, cz * 8.7) * 0.08 +
        noise(cx * 17.5, cy * 17.5, cz * 17.5) * 0.04;
      const humidity = smooth(0.26, 0.68, noise(px * 3.4 - 8, py * 3.4, pz * 3.4));
      const clouds = smooth(0.49, 0.7, vapor) * humidity;
      const coast = smooth(0.509, 0.524, elevation) * (1 - smooth(0.54, 0.61, elevation));
      const cities = smooth(0.76, 0.92, grain) * coast;
      const offset = (row * size + column) * 4;
      data[offset] = Math.round(elevation * 255);
      data[offset + 1] = Math.round(relief * 255);
      data[offset + 2] = Math.round(clouds * 255);
      data[offset + 3] = Math.round(cities * 255);
    }
  }
  const texture = new THREE.DataTexture(data, size, height);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
const planetVertex = `
  varying vec3 vSurface; varying vec3 vWorld; varying vec3 vNormal; varying vec2 vUv;
  void main() {
    vUv = uv;
    vSurface = normalize(position);
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const planetFragment = `
  uniform vec3 sunDirection; uniform vec3 atmosphereColor;
  uniform float eclipse; uniform float ion; uniform float phase;
  uniform sampler2D surfaceAtlas;
  varying vec3 vSurface; varying vec3 vWorld; varying vec3 vNormal; varying vec2 vUv;
  void main() {
    vec3 p = normalize(vSurface), normal = normalize(vNormal);
    vec3 view = normalize(cameraPosition - vWorld);
    vec4 surface = texture2D(surfaceAtlas, vUv);
    float altitude = surface.r;
    float land = smoothstep(0.509, 0.517, altitude);
    float coast = smoothstep(0.488, 0.514, altitude);
    float latitude = abs(p.y);
    vec3 ocean = mix(vec3(0.003,0.011,0.027), vec3(0.009,0.078,0.095), coast);
    vec3 ground = mix(vec3(0.088,0.108,0.071), vec3(0.36,0.23,0.105), smoothstep(0.514,0.67,altitude));
    ground = mix(ground, vec3(0.42,0.31,0.17), smoothstep(0.65,0.78,altitude));
    ground *= 0.69 + surface.g * 0.49;
    float ice = smoothstep(0.88,0.985,latitude + (altitude - 0.5) * 0.08);
    ground = mix(ground, vec3(0.46,0.53,0.55), ice * 0.82);
    vec3 albedo = mix(ocean, ground, land);
    float clouds = texture2D(surfaceAtlas, vUv + vec2(phase * 0.00065,0.0)).b;
    // Derivative relief responds to the actual light and camera. The ocean stays
    // smooth while mountain ranges break the terminator into minute lit ridges.
    float relief = (max(altitude - 0.512,0.0) * 0.10 + surface.g * 0.004) * land;
    vec3 dx = dFdx(vWorld), dy = dFdy(vWorld);
    vec3 rx = cross(dy,normal), ry = cross(normal,dx);
    float determinant = dot(dx,rx);
    vec3 gradient = sign(determinant) * (dFdx(relief) * rx + dFdy(relief) * ry);
    vec3 terrainNormal = normalize(abs(determinant) * normal - gradient);
    vec3 light = normalize(sunDirection);
    float incidence = dot(normal,light);
    float day = smoothstep(-0.085,0.14,incidence);
    float diffuse = max(dot(terrainNormal,light),0.0);
    vec3 sunlight = mix(vec3(1.15,0.97,0.78),vec3(0.70,1.03,1.22),ion);
    vec3 color = albedo * (vec3(0.018,0.032,0.052) + sunlight * diffuse * 1.35);
    float cloudShadow = texture2D(surfaceAtlas,vUv + vec2(phase * 0.00065 - 0.0018,0.0012)).b;
    color *= 1.0 - cloudShadow * day * 0.23;
    vec3 cloudColor = mix(vec3(0.47,0.59,0.67),vec3(0.87,0.88,0.79),day);
    color = mix(color,cloudColor * (0.018 + max(incidence,0.0) * 1.3),clouds * 0.78);
    float specular = pow(max(dot(reflect(-light,normal),view),0.0),64.0);
    color += vec3(0.65,0.85,1.0) * specular * (1.0-land) * (1.0-clouds) * day * 0.34;
    float rim = pow(1.0-max(dot(normal,view),0.0),5.4);
    float airMass = pow(1.0-max(dot(normal,view),0.0),2.4) * day;
    color = mix(color,atmosphereColor * (0.12 + max(incidence,0.0) * 0.24),airMass * 0.19);
    color += atmosphereColor * rim * (0.035 + day * 0.4 + eclipse * 0.09);
    float dusk = exp(-abs(incidence) * 14.0) * (1.0-eclipse);
    color += vec3(0.56,0.18,0.055) * dusk * rim * 0.2;
    color += mix(vec3(0.9,0.43,0.11),vec3(0.1,0.74,1.0),ion) * surface.a * land * (1.0-day) * (1.0-clouds) * 0.7;
    gl_FragColor = vec4(color,1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const atmosphereFragment = `
  uniform vec3 sunDirection; uniform vec3 atmosphereColor; uniform float eclipse; uniform float resonance;
  varying vec3 vWorld; varying vec3 vNormal;
  void main() {
    vec3 normal=normalize(vNormal), view=normalize(cameraPosition-vWorld);
    float incidence=dot(normal,normalize(sunDirection));
    float grazing=1.0-abs(dot(normal,view));
    float rim=pow(grazing,5.8);
    float day=smoothstep(-0.12,0.55,incidence);
    float twilight=exp(-abs(incidence)*9.0);
    vec3 color=mix(atmosphereColor,vec3(1.0,0.44,0.13),twilight*(0.4+eclipse*0.25));
    float highAir=pow(grazing,12.0)*(0.055+day*0.17);
    float energized=smoothstep(0.4,0.95,resonance)*smoothstep(0.54,0.9,abs(normal.y));
    color=mix(color,vec3(0.20,1.0,0.79),energized*0.42);
    gl_FragColor=vec4(color,rim*(0.035+day*0.34+eclipse*0.12+energized*0.24)+highAir);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// Two tracks share one instanced draw. Their charged arc stays lit, while a
// narrow champagne leader makes the finite circumferential ignition legible.
const resonanceTrackFragment = `
  uniform float resonance; uniform float phase; uniform float ion;
  varying vec2 vUv;
  void main() {
    float charge=smoothstep(0.0,0.46,resonance);
    float angle=fract(vUv.x+0.25);
    float filled=1.0-smoothstep(charge-0.012,charge+0.005,angle);
    filled*=smoothstep(0.0,0.035,charge);
    float leader=exp(-abs(angle-charge)*160.0)*(1.0-smoothstep(0.93,1.0,charge));
    float inlay=0.68+0.32*pow(0.5+0.5*cos(angle*301.5929),3.0);
    float current=0.94+0.06*sin(angle*31.4159-phase*0.7);
    vec3 color=mix(vec3(0.16,0.78,1.0),vec3(0.31,1.0,0.83),ion);
    color=mix(color,vec3(1.0,0.84,0.53),leader*0.9);
    gl_FragColor=vec4(color*(1.0+leader*0.65),filled*inlay*current*0.93+leader*0.7);
    #include <colorspace_fragment>
  }
`;
const auroraVertex = `
  uniform float phase;
  varying vec2 vUv; varying vec3 vWorld; varying vec3 vNormal;
  void main() {
    vUv=uv;
    vec3 normal=normalize(position);
    float drift=sin(uv.x*37.6991+phase*0.24)*0.028+sin(uv.x*81.6814-phase*0.17)*0.013;
    vec3 displaced=position+normal*drift*uv.y;
    vec4 world=modelMatrix*vec4(displaced,1.0);
    vWorld=world.xyz;
    vNormal=normalize(mat3(modelMatrix)*normal);
    gl_Position=projectionMatrix*viewMatrix*world;
  }
`;
const auroraFragment = `
  uniform float resonance; uniform float phase; uniform float ion; uniform float eclipse;
  uniform vec3 sunDirection;
  varying vec2 vUv; varying vec3 vWorld; varying vec3 vNormal;
  void main() {
    float reveal=smoothstep(0.34,0.98,resonance);
    float longitude=vUv.x*6.283185;
    float fold=longitude+sin(longitude*5.0+phase*0.14)*0.06+vUv.y*0.06;
    float broad=0.5+0.5*sin(fold*13.0+sin(fold*7.0)*1.4-phase*0.16);
    float fine=0.5+0.5*sin(fold*137.0+sin(fold*31.0)*2.0+vUv.y*1.6);
    float filaments=0.26+pow(broad,1.7)*0.42+pow(fine,4.0)*0.32;
    float edge=pow(1.0-vUv.y,1.45)*smoothstep(0.0,0.035,vUv.y);
    float crown=exp(-abs(vUv.y-0.075)*34.0);
    float light=dot(normalize(vNormal),normalize(sunDirection));
    float night=1.0-smoothstep(-0.35,0.7,light);
    vec3 base=mix(vec3(0.09,0.92,0.76),vec3(0.12,0.71,1.0),ion);
    vec3 color=mix(base,vec3(0.51,0.42,0.94),smoothstep(0.2,1.0,vUv.y)*0.6);
    color+=vec3(0.72,0.52,0.20)*crown*0.55;
    float alpha=(filaments*edge*(0.48+night*0.28+eclipse*0.08)+crown*0.20)*reveal;
    gl_FragColor=vec4(color,alpha);
    #include <colorspace_fragment>
  }
`;

/** Two continuous polar curtains: true radial height above the globe, with a
 * broken authored crest. The shader adds slow folds without per-frame geometry. */
function createPolarCurtains() {
  const azimuths = 144,
    levels = 10;
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  for (const hemisphere of [-1, 1]) {
    const offset = positions.length / 3;
    for (let level = 0; level <= levels; level++) {
      const height = level / levels;
      for (let index = 0; index <= azimuths; index++) {
        const longitude = (index / azimuths) * TAU;
        const latitude = (1.015 + Math.sin(longitude * 3) * 0.045 + Math.sin(longitude * 7) * 0.018) * hemisphere;
        const crest = 0.5 + Math.sin(longitude * 5) * 0.075 + Math.sin(longitude * 13) * 0.024;
        const radius = 3.032 + height * crest;
        positions.push(
          Math.cos(longitude) * Math.cos(latitude) * radius,
          Math.sin(latitude) * radius,
          Math.sin(longitude) * Math.cos(latitude) * radius,
        );
        uvs.push(index / azimuths, height);
        if (level < levels && index < azimuths) {
          const a = offset + level * (azimuths + 1) + index,
            b = a + azimuths + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

const propulsionVertex = `
  varying vec2 vUv;
  void main() {
    vUv=uv;
    gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0);
  }
`;
const propulsionFragment = `
  uniform float phase; uniform float ion; varying vec2 vUv;
  void main() {
    float throat=pow(vUv.y,1.6);
    float compression=0.84+0.16*cos(vUv.y*24.0-phase*2.8);
    vec3 color=mix(vec3(0.04,0.42,1.0),vec3(0.13,0.97,1.0),vUv.y+ion*0.14);
    color=mix(color,vec3(0.87,0.98,1.0),pow(vUv.y,7.0));
    gl_FragColor=vec4(color,throat*compression*0.72);
    #include <colorspace_fragment>
  }
`;

/** Facets are deliberately sparse and readable at the phone composition's scale. */
function createCourierHull() {
  const points = [
    [0, 0.025, 0.42],
    [-0.1, 0.08, 0.11],
    [0.1, 0.08, 0.11],
    [-0.15, 0.025, -0.27],
    [0.15, 0.025, -0.27],
    [0, -0.075, -0.09],
    [-0.34, -0.015, -0.2],
    [0.34, -0.015, -0.2],
    [0, 0.12, -0.13],
  ];
  const faces = [
    [0, 1, 2, 0],
    [1, 8, 2, 1],
    [1, 3, 8, 0],
    [2, 8, 4, 0],
    [3, 4, 8, 2],
    [0, 6, 1, 3],
    [0, 2, 7, 3],
    [1, 6, 3, 2],
    [2, 4, 7, 2],
    [0, 5, 6, 1],
    [0, 7, 5, 1],
    [6, 5, 3, 1],
    [7, 4, 5, 1],
    [3, 5, 4, 1],
  ];
  const palette = [0xa9b8bd, 0x283a4d, 0xb99458, 0x506c82].map((color) => new THREE.Color(color));
  const position: number[] = [],
    colors: number[] = [];
  for (const [a, b, c, color] of faces)
    for (const index of [a, c, b]) {
      position.push(...points[index]);
      const tint = palette[color];
      colors.push(tint.r, tint.g, tint.b);
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

type Pose = { yaw: number; pitch: number; distance: number; focus: THREE.Vector3; roll: number; fov: number };
const ease = (value: number) => value * value * (3 - 2 * value);
const shortest = (from: number, to: number) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

/** Original procedural orbital instrument. No asset requests or external services. */
export function createLensingScene(
  canvas: HTMLCanvasElement,
  callbacks: { onReady?: () => void; onUnavailable?: () => void } = {},
): LensingController {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "low-power" });
  } catch {
    callbacks.onUnavailable?.();
    const noop = () => {};
    return {
      setLight: noop,
      setView: noop,
      setMotion: noop,
      setPlaying: noop,
      setResonance: noop,
      rotate: noop,
      zoom: noop,
      reset: noop,
      dispose: noop,
    };
  }
  renderer.setClearColor(0x02060d);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.07;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 240);
  const sun = new THREE.DirectionalLight(0xffdfb1, 3.2);
  const rimLight = new THREE.DirectionalLight(0x68dfff, 2.6);
  const fill = new THREE.HemisphereLight(0x9fc7df, 0x050811, 0.7);
  sun.position.set(-7, 5, 8);
  rimLight.position.set(5, 1, -7);
  scene.add(sun, rimLight, fill);

  // A tiny procedural reflection field provides metal highlights; it is generated
  // locally once and never downloads an environment map or requests a second pass.
  const environmentData = new Uint8Array(256 * 128 * 4);
  for (let y = 0; y < 128; y++)
    for (let x = 0; x < 256; x++) {
      const offset = (y * 256 + x) * 4;
      const sky = Math.max(0, 1 - y / 85);
      const panel = y > 16 && y < 54 && ((x > 24 && x < 78) || (x > 162 && x < 181));
      environmentData[offset] = panel ? 225 : 12 + sky * 72;
      environmentData[offset + 1] = panel ? 222 : 22 + sky * 91;
      environmentData[offset + 2] = panel ? 215 : 34 + sky * 108;
      environmentData[offset + 3] = 255;
    }
  const environment = new THREE.DataTexture(environmentData, 256, 128);
  environment.colorSpace = THREE.SRGBColorSpace;
  environment.mapping = THREE.EquirectangularReflectionMapping;
  environment.needsUpdate = true;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const reflection = pmrem.fromEquirectangular(environment);
  scene.environment = reflection.texture;
  scene.environmentIntensity = 0.65;
  environment.dispose();
  pmrem.dispose();

  const atlasStarted = performance.now();
  const surfaceAtlas = createSurfaceAtlas();
  canvas.dataset.lensingAtlasMs = String(Math.round(performance.now() - atlasStarted));
  const uniforms = {
    sunDirection: { value: sun.position.clone().normalize() },
    atmosphereColor: { value: new THREE.Color(0x48bbec) },
    eclipse: { value: 0 },
    ion: { value: 0 },
    phase: { value: 0 },
    resonance: { value: 0 },
    surfaceAtlas: { value: surfaceAtlas },
  };
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(3, 72, 48),
    new THREE.ShaderMaterial({ uniforms, vertexShader: planetVertex, fragmentShader: planetFragment }),
  );
  planet.rotation.z = 0.16;
  planet.name = "Procedural ocean world";
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(3.055, 64, 40),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: planetVertex,
      fragmentShader: atmosphereFragment,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    }),
  );
  atmosphere.name = "Atmospheric limb";
  scene.add(planet, atmosphere);
  const aurora = new THREE.Mesh(
    createPolarCurtains(),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: auroraVertex,
      fragmentShader: auroraFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      forceSinglePass: true,
    }),
  );
  aurora.name = "Resonant polar curtains";
  aurora.visible = false;
  scene.add(aurora);

  const titanium = new THREE.MeshStandardMaterial({ color: 0x455e72, metalness: 0.82, roughness: 0.26 });
  const gateSkin = titanium.clone();
  gateSkin.vertexColors = true;
  gateSkin.roughness = 0.31;
  gateSkin.emissive.set(0x0d6580);
  const midnight = new THREE.MeshStandardMaterial({ color: 0x0c1724, metalness: 0.7, roughness: 0.36 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xb3c0c5, metalness: 0.86, roughness: 0.22 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd7ac6e, metalness: 0.83, roughness: 0.25 });
  const cyan = new THREE.MeshBasicMaterial({ color: 0x65e9ff, toneMapped: false });
  const champagne = new THREE.MeshBasicMaterial({ color: 0xffd69a, toneMapped: false });
  const gate = new THREE.Group();
  gate.name = "Machined orbital gate";
  gate.rotation.set(-0.67, 0.27, -0.18);
  scene.add(gate);
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D = gate) => {
    const mesh = new THREE.Mesh(geometry, material);
    parent.add(mesh);
    return mesh;
  };
  const annulus = (inner: number, outer: number, depth: number, material: THREE.Material) => {
    const bevel = Math.min(depth * 0.2, 0.045);
    const profile = [
      [inner + bevel, depth / 2],
      [outer - bevel, depth / 2],
      [outer, depth / 2 - bevel],
      [outer, -depth / 2 + bevel],
      [outer - bevel, -depth / 2],
      [inner + bevel, -depth / 2],
      [inner, -depth / 2 + bevel],
      [inner, depth / 2 - bevel],
      [inner + bevel, depth / 2],
    ]
      .reverse()
      .map(([radius, axial]) => new THREE.Vector2(radius, axial));
    const geometry = new THREE.LatheGeometry(profile, 144);
    geometry.rotateX(Math.PI / 2);
    if (material === gateSkin) {
      const positions = geometry.getAttribute("position");
      const colors = new Float32Array(positions.count * 3);
      for (let index = 0; index < positions.count; index++) {
        const x = positions.getX(index),
          y = positions.getY(index),
          z = positions.getZ(index);
        const angle = (Math.atan2(y, x) + TAU) % TAU;
        const sector = Math.floor((angle / TAU) * 48);
        const radial = Math.hypot(x, y);
        const plate = (sector % 3 === 0 ? 0.78 : sector % 3 === 1 ? 1.0 : 0.9) * (z < 0 ? 0.75 : 1);
        const channel = radial > 4.85 ? 1.04 : 0.87;
        colors.set([plate * channel, plate * channel * 0.98, plate * channel * 0.95], index * 3);
      }
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    }
    return add(geometry, material);
  };
  annulus(4.52, 4.96, 0.48, gateSkin);
  annulus(4.98, 5.13, 0.32, midnight);
  annulus(5.19, 5.31, 0.18, gold);
  annulus(4.25, 4.34, 0.12, silver);
  const lip = add(new THREE.TorusGeometry(4.55, 0.031, 6, 144), gold);
  lip.position.z = 0.275;
  const outerLip = add(new THREE.TorusGeometry(4.93, 0.018, 5, 144), silver);
  outerLip.position.z = 0.267;
  const innerTrack = add(new THREE.TorusGeometry(4.37, 0.012, 4, 128), cyan);
  innerTrack.position.z = 0.025;

  const matrix = new THREE.Object3D();
  const instanceRing = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    count: number,
    radius: number,
    axial: number,
    rotation = 0,
  ) => {
    const instances = new THREE.InstancedMesh(geometry, material, count);
    for (let index = 0; index < count; index++) {
      const angle = (index / count) * TAU + rotation;
      matrix.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, axial);
      matrix.rotation.set(0, 0, angle);
      matrix.scale.set(1, 1, 1);
      matrix.updateMatrix();
      instances.setMatrixAt(index, matrix.matrix);
    }
    gate.add(instances);
    return instances;
  };
  instanceRing(new THREE.BoxGeometry(0.36, 0.055, 0.035), midnight, 96, 4.74, 0.268);
  instanceRing(new THREE.BoxGeometry(0.13, 0.032, 0.022), champagne, 24, 4.77, 0.295);
  instanceRing(new THREE.BoxGeometry(0.042, 0.16, 0.035), silver, 48, 5.05, 0.183);
  instanceRing(new THREE.BoxGeometry(0.045, 0.032, 0.019), cyan, 96, 4.6, 0.297);
  instanceRing(new THREE.BoxGeometry(0.74, 0.12, 0.23), titanium, 8, 4.64, -0.32, Math.PI / 8);
  // Broad transverse ribs bridge the recessed channels. Their thick side walls
  // are readable in the approach view without another layer of particle effects.
  const ribs = instanceRing(new THREE.BoxGeometry(0.78, 0.105, 0.55), silver, 12, 4.85, -0.026, Math.PI / 12);
  ribs.name = "Transverse gate pressure ribs";
  const resonanceTracks = new THREE.InstancedMesh(
    new THREE.TorusGeometry(1, 0.0065, 4, 192),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: propulsionVertex,
      fragmentShader: resonanceTrackFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
    2,
  );
  resonanceTracks.name = "Circumferential gate ignition";
  for (const [index, radius] of [4.48, 5.155].entries()) {
    matrix.position.set(0, 0, 0.31);
    matrix.rotation.set(0, 0, 0);
    matrix.scale.set(radius, radius, 1);
    matrix.updateMatrix();
    resonanceTracks.setMatrixAt(index, matrix.matrix);
  }
  resonanceTracks.visible = false;
  gate.add(resonanceTracks);
  const segments = new THREE.InstancedMesh(new THREE.TorusGeometry(4.425, 0.024, 5, 12, 0.18), cyan, 20);
  matrix.scale.set(1, 1, 1);
  for (let index = 0; index < 20; index++) {
    matrix.position.set(0, 0, 0.2);
    matrix.rotation.set(0, 0, (index * TAU) / 20);
    matrix.updateMatrix();
    segments.setMatrixAt(index, matrix.matrix);
  }
  gate.add(segments);
  const carriers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.18, 0.044, 0.028), champagne, 8);
  carriers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  carriers.frustumCulled = false;
  gate.add(carriers);

  const satelliteOrbit = new THREE.Group();
  satelliteOrbit.rotation.copy(gate.rotation);
  scene.add(satelliteOrbit);
  const satellite = new THREE.Group();
  satellite.position.set(3.7, 2.8, 1.45);
  satellite.rotation.set(0.2, -0.4, 0.3);
  satellite.name = "Bit orbital surveyor";
  satelliteOrbit.add(satellite);
  const bit = add(new THREE.OctahedronGeometry(0.38, 0), gold, satellite);
  const bitEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(bit.geometry),
    new THREE.LineBasicMaterial({ color: 0xffe1ad, transparent: true, opacity: 0.62 }),
  );
  satellite.add(bitEdges);
  const satelliteBand = add(new THREE.TorusGeometry(0.56, 0.018, 5, 48), cyan, satellite);
  satelliteBand.rotation.x = Math.PI / 2;
  for (const side of [-1, 1]) {
    const panel = add(new THREE.BoxGeometry(0.77, 0.035, 0.38), midnight, satellite);
    panel.position.x = side * 0.92;
    const rail = add(new THREE.BoxGeometry(1.35, 0.035, 0.025), gold, satellite);
    rail.position.set(side * 0.53, 0.005, 0.2);
    const circuit = add(new THREE.BoxGeometry(0.65, 0.006, 0.014), cyan, satellite);
    circuit.position.set(side * 0.92, 0.023, 0);
  }

  // A single inclined orbital lane gives the couriers a visible destination and
  // scale reference. Its rear half is naturally occluded by the real planet.
  const traffic = new THREE.Group();
  traffic.name = "Orbital courier lane";
  traffic.rotation.copy(gate.rotation);
  traffic.rotateX(0.5);
  traffic.rotateY(-0.4);
  scene.add(traffic);
  const laneRadius = 3.58;
  const routePoints = Array.from({ length: 160 }, (_, index) => {
    const angle = (index / 160) * TAU;
    return new THREE.Vector3(Math.cos(angle) * laneRadius, Math.sin(angle) * laneRadius, 0);
  });
  const route = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(routePoints),
    new THREE.LineBasicMaterial({ color: 0x477d95, transparent: true, opacity: 0.46, depthWrite: false }),
  );
  traffic.add(route);
  const courierMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    metalness: 0.74,
    roughness: 0.28,
    emissive: 0x041018,
    emissiveIntensity: 0.45,
  });
  const couriers = new THREE.InstancedMesh(createCourierHull(), courierMaterial, 3);
  couriers.name = "Three faceted orbital couriers";
  const canopies = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(1, 0).scale(0.055, 0.025, 0.11).translate(0, 0.106, 0.04),
    new THREE.MeshStandardMaterial({
      color: 0x0c5264,
      metalness: 0.6,
      roughness: 0.13,
      emissive: 0x136479,
      emissiveIntensity: 0.45,
    }),
    3,
  );
  const nozzles = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.063, 0.08, 0.15, 8, 1, true).rotateX(Math.PI / 2),
    silver,
    6,
  );
  const throats = new THREE.InstancedMesh(new THREE.SphereGeometry(0.039, 8, 4), cyan, 6);
  const exhaustMaterial = new THREE.ShaderMaterial({
    uniforms: { phase: uniforms.phase, ion: uniforms.ion },
    vertexShader: propulsionVertex,
    fragmentShader: propulsionFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const exhaust = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.041, 0, 0.66, 8, 4, true).rotateX(Math.PI / 2).translate(0, 0, -0.33),
    exhaustMaterial,
    6,
  );
  exhaust.name = "Tapered ion propulsion";
  const routeLights = new THREE.InstancedMesh(
    new THREE.TorusGeometry(laneRadius, 0.012, 4, 20, 0.23),
    new THREE.MeshBasicMaterial({
      color: 0x8be7ed,
      transparent: true,
      opacity: 0.69,
      toneMapped: false,
      depthWrite: false,
    }),
    3,
  );
  const trafficMeshes = [couriers, canopies, nozzles, throats, exhaust, routeLights];
  for (const mesh of trafficMeshes) {
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    traffic.add(mesh);
  }
  const courierPose = new THREE.Object3D(),
    partPose = new THREE.Object3D();
  const basis = new THREE.Matrix4(),
    forward = new THREE.Vector3(),
    right = new THREE.Vector3();
  const laneUp = new THREE.Vector3(0, 0, 1);
  // The leading courier starts against the night-side globe, clearly separate
  // from Bit and the gate. Their complete hull/exhaust sweep stays within 3.9.
  const courierAngles = [5.65, 0.95, 3.95];
  const courierScales = [0.9, 0.8, 0.86];
  const paintTraffic = (elapsed: number) => {
    for (let index = 0; index < 3; index++) {
      const angle = courierAngles[index] + elapsed * (0.078 + index * 0.004);
      const scale = courierScales[index];
      const cosine = Math.cos(angle),
        sine = Math.sin(angle);
      courierPose.position.set(cosine * laneRadius, sine * laneRadius, 0);
      forward.set(-sine, cosine, 0);
      right.set(-cosine, -sine, 0);
      basis.makeBasis(right, laneUp, forward);
      courierPose.quaternion.setFromRotationMatrix(basis);
      courierPose.scale.setScalar(scale);
      courierPose.updateMatrix();
      couriers.setMatrixAt(index, courierPose.matrix);
      canopies.setMatrixAt(index, courierPose.matrix);
      for (let engine = 0; engine < 2; engine++) {
        const number = index * 2 + engine;
        partPose.quaternion.copy(courierPose.quaternion);
        partPose.scale.setScalar(scale);
        partPose.position
          .set((engine ? 1 : -1) * 0.095, -0.009, -0.29)
          .applyQuaternion(courierPose.quaternion)
          .multiplyScalar(scale)
          .add(courierPose.position);
        partPose.updateMatrix();
        nozzles.setMatrixAt(number, partPose.matrix);
        partPose.position
          .set((engine ? 1 : -1) * 0.095, -0.009, -0.367)
          .applyQuaternion(courierPose.quaternion)
          .multiplyScalar(scale)
          .add(courierPose.position);
        partPose.updateMatrix();
        throats.setMatrixAt(number, partPose.matrix);
        exhaust.setMatrixAt(number, partPose.matrix);
      }
      partPose.position.set(0, 0, 0.006);
      partPose.rotation.set(0, 0, angle - 0.3);
      partPose.scale.set(1, 1, 1);
      partPose.updateMatrix();
      routeLights.setMatrixAt(index, partPose.matrix);
    }
    for (const mesh of trafficMeshes) mesh.instanceMatrix.needsUpdate = true;
  };

  let seed = 38173;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let layer = 0; layer < 2; layer++) {
    const positions: number[] = [],
      colors: number[] = [];
    for (let index = 0; index < (layer ? 100 : 540); index++) {
      const longitude = random() * TAU,
        height = random() * 2 - 1,
        radius = 65 + random() * 80;
      const horizontal = Math.sqrt(1 - height * height);
      positions.push(
        Math.cos(longitude) * horizontal * radius,
        height * radius,
        Math.sin(longitude) * horizontal * radius,
      );
      const color = new THREE.Color(index % 9 === 0 ? 0xffd8a4 : 0xa6cce5).multiplyScalar(0.27 + random() * 0.52);
      colors.push(color.r, color.g, color.b);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    scene.add(
      new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
          size: layer ? 0.16 : 0.09,
          vertexColors: true,
          transparent: true,
          opacity: layer ? 0.85 : 0.56,
          depthWrite: false,
          toneMapped: false,
        }),
      ),
    );
  }

  // Framing uses the real gate plane and planet rather than a giant starfield box.
  gate.updateMatrixWorld(true);
  traffic.updateMatrixWorld(true);
  const framing: THREE.Vector3[] = [];
  for (let index = 0; index < 96; index++) {
    const angle = (index / 96) * TAU;
    framing.push(new THREE.Vector3(Math.cos(angle) * 5.4, Math.sin(angle) * 5.4, 0).applyMatrix4(gate.matrixWorld));
    framing.push(new THREE.Vector3(Math.cos(angle) * 3.9, Math.sin(angle) * 3.9, 0).applyMatrix4(traffic.matrixWorld));
  }
  for (let latitude = -4; latitude <= 4; latitude++)
    for (let index = 0; index < 16; index++) {
      const angle = (index / 16) * TAU,
        phi = (latitude * Math.PI) / 8;
      framing.push(
        new THREE.Vector3(
          Math.cos(angle) * Math.cos(phi),
          Math.sin(phi),
          Math.sin(angle) * Math.cos(phi),
        ).multiplyScalar(3.1),
      );
    }
  // Include the moving surveyor's whole swept envelope, not just the gate rim.
  // This also keeps its panel tips inside the narrowest authored phone view.
  satelliteOrbit.updateMatrixWorld(true);
  const satelliteCenter = satellite.getWorldPosition(new THREE.Vector3());
  for (let latitude = -2; latitude <= 2; latitude++)
    for (let index = 0; index < 12; index++) {
      const angle = (index / 12) * TAU,
        phi = (latitude * Math.PI) / 4;
      framing.push(
        new THREE.Vector3(Math.cos(angle) * Math.cos(phi), Math.sin(phi), Math.sin(angle) * Math.cos(phi))
          .multiplyScalar(1.42)
          .add(satelliteCenter),
      );
    }
  let width = 1,
    height = 1,
    visible = false,
    disposed = false,
    lost = false,
    ready = false;
  let motion = true,
    playing = true,
    dirty = true,
    frame = 0,
    lastTime = 0,
    lastPaint = 0,
    phase = 0;
  let selectedView: LensingView = "orbit",
    selectedLight: LensingLight = "dawn",
    authored = true;
  let zoomScale = 1;
  let resonanceEnabled = false;
  let resonanceTravel: { from: number; to: number; elapsed: number; duration: number } | null = null;
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pose: Pose = { yaw: 0.73, pitch: -0.25, distance: 20, focus: new THREE.Vector3(), roll: 0, fov: 39 };
  let travel: { from: Pose; to: Pose; elapsed: number } | null = null;
  let lightTravel: {
    sun: THREE.Vector3;
    atmosphere: THREE.Color;
    eclipse: number;
    ion: number;
    elapsed: number;
  } | null = null;
  const lightTargets = {
    dawn: {
      sun: new THREE.Vector3(-0.35, 0.46, 1.0).normalize(),
      atmosphere: new THREE.Color(0x48bbec),
      eclipse: 0,
      ion: 0,
    },
    ion: {
      sun: new THREE.Vector3(0.55, 0.36, 0.83).normalize(),
      atmosphere: new THREE.Color(0x3fffe5),
      eclipse: 0,
      ion: 1,
    },
    eclipse: {
      sun: new THREE.Vector3(-0.32, 0.12, -1).normalize(),
      atmosphere: new THREE.Color(0x75a8ef),
      eclipse: 1,
      ion: 0,
    },
  };
  const canAnimate = () => motion && playing && !media.matches;
  const clonePose = (value: Pose): Pose => ({ ...value, focus: value.focus.clone() });
  const applyPose = () => {
    if (camera.fov !== pose.fov) {
      camera.fov = pose.fov;
      camera.updateProjectionMatrix();
    }
    camera.position
      .set(Math.sin(pose.yaw) * Math.cos(pose.pitch), Math.sin(pose.pitch), Math.cos(pose.yaw) * Math.cos(pose.pitch))
      .multiplyScalar(pose.distance * zoomScale)
      .add(pose.focus);
    camera.lookAt(pose.focus);
    camera.rotateZ(pose.roll);
    camera.updateMatrixWorld();
  };
  const targetPose = (view: LensingView): Pose => {
    const portrait = width / height < 0.82;
    const phone = width <= 600;
    const yaw = view === "orbit" ? (phone || portrait ? 0.88 : 0.73) : view === "surface" ? -0.36 : 1.05;
    const pitch = view === "orbit" ? (phone || portrait ? -0.32 : -0.25) : 0.16;
    const focus =
      view === "orbit"
        ? new THREE.Vector3()
        : view === "surface"
          ? new THREE.Vector3(-0.35, 0.25, 0.35)
          : new THREE.Vector3(0.6, 0.25, 0.0);
    const roll =
      view === "orbit" ? (phone || portrait ? -0.2 : -0.12) : view === "gate" ? -0.16 : portrait ? -0.14 : -0.025;
    // A wider approach lens moves the gate's near edge into the foreground,
    // keeping the distant world smaller. Orbit and Surface retain their lenses.
    const fov = view === "gate" ? 54 : 39;
    const probe = new THREE.PerspectiveCamera(fov, width / height, 0.1, 240);
    probe.position.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    probe.lookAt(0, 0, 0);
    probe.rotateZ(roll);
    probe.updateMatrixWorld();
    const right = new THREE.Vector3().setFromMatrixColumn(probe.matrixWorld, 0),
      up = new THREE.Vector3().setFromMatrixColumn(probe.matrixWorld, 1),
      back = new THREE.Vector3().setFromMatrixColumn(probe.matrixWorld, 2);
    const tangent = Math.tan(THREE.MathUtils.degToRad(fov / 2));
    let distance = 7;
    if (view !== "surface")
      for (const point of framing) {
        const relative = point.clone().sub(focus),
          depth = relative.dot(back);
        distance = Math.max(
          distance,
          Math.abs(relative.dot(right)) / (tangent * probe.aspect * 0.88) + depth,
          Math.abs(relative.dot(up)) / (tangent * 0.86) + depth,
        );
      }
    else distance = 3.48 / Math.sin(Math.atan(tangent * Math.min(1, probe.aspect)));
    if (view === "gate" && width > 600) {
      distance *= 0.86;
      focus.addScaledVector(right, -(probe.aspect > 2.2 ? 1.65 : 0.75));
    }
    return { yaw, pitch, distance, focus, roll, fov };
  };
  const copyPose = (target: Pose) => {
    pose.yaw = target.yaw;
    pose.pitch = target.pitch;
    pose.distance = target.distance;
    pose.focus.copy(target.focus);
    pose.roll = target.roll;
    pose.fov = target.fov;
  };
  const finishResonance = () => {
    uniforms.resonance.value = resonanceEnabled ? 1 : 0;
    resonanceTravel = null;
  };
  const paintLight = () => {
    sun.position.copy(uniforms.sunDirection.value).multiplyScalar(12);
    sun.color.set(0xffdfb1).lerp(new THREE.Color(0xa5eaff), uniforms.ion.value);
    sun.intensity = 3.2 - uniforms.eclipse.value * 0.6;
    rimLight.intensity = 2.6 + uniforms.eclipse.value * 0.65;
  };
  const finishLight = () => {
    const target = lightTargets[selectedLight];
    uniforms.sunDirection.value.copy(target.sun);
    uniforms.atmosphereColor.value.copy(target.atmosphere);
    uniforms.eclipse.value = target.eclipse;
    uniforms.ion.value = target.ion;
    paintLight();
    lightTravel = null;
  };
  const stop = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  };
  const queue = () => {
    if (!disposed && !lost && visible && !document.hidden && !frame) frame = requestAnimationFrame(tick);
  };
  function tick(time: number) {
    frame = 0;
    if (disposed || lost || !visible || document.hidden) {
      lastTime = 0;
      return;
    }
    const animate = canAnimate();
    const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.08) : 0;
    lastTime = time;
    if (animate) {
      phase += delta;
      if (travel) {
        travel.elapsed += delta;
        const amount = ease(Math.min(1, travel.elapsed / 1.15));
        pose.yaw = travel.from.yaw + shortest(travel.from.yaw, travel.to.yaw) * amount;
        pose.pitch = THREE.MathUtils.lerp(travel.from.pitch, travel.to.pitch, amount);
        pose.distance = THREE.MathUtils.lerp(travel.from.distance, travel.to.distance, amount);
        pose.roll = THREE.MathUtils.lerp(travel.from.roll, travel.to.roll, amount);
        pose.fov = THREE.MathUtils.lerp(travel.from.fov, travel.to.fov, amount);
        pose.focus.lerpVectors(travel.from.focus, travel.to.focus, amount);
        if (amount === 1) travel = null;
      }
      if (lightTravel) {
        lightTravel.elapsed += delta;
        const amount = ease(Math.min(1, lightTravel.elapsed / 0.9)),
          target = lightTargets[selectedLight];
        uniforms.sunDirection.value.lerpVectors(lightTravel.sun, target.sun, amount).normalize();
        uniforms.atmosphereColor.value.copy(lightTravel.atmosphere).lerp(target.atmosphere, amount);
        uniforms.eclipse.value = THREE.MathUtils.lerp(lightTravel.eclipse, target.eclipse, amount);
        uniforms.ion.value = THREE.MathUtils.lerp(lightTravel.ion, target.ion, amount);
        paintLight();
        if (amount === 1) lightTravel = null;
      }
      if (resonanceTravel) {
        resonanceTravel.elapsed += delta;
        const amount = Math.min(1, resonanceTravel.elapsed / resonanceTravel.duration);
        uniforms.resonance.value = THREE.MathUtils.lerp(resonanceTravel.from, resonanceTravel.to, amount);
        if (amount === 1) resonanceTravel = null;
      }
    }
    if (dirty || time - lastPaint >= FRAME_MS - 0.5) {
      uniforms.phase.value = phase;
      planet.rotation.y = -0.4 + phase * 0.018;
      aurora.rotation.copy(planet.rotation);
      aurora.visible = uniforms.resonance.value > 0.34;
      resonanceTracks.visible = uniforms.resonance.value > 0;
      gateSkin.emissiveIntensity = uniforms.resonance.value * (0.14 + uniforms.ion.value * 0.045);
      satellite.rotation.y = -0.4 + phase * 0.035;
      for (let index = 0; index < 8; index++) {
        const angle = (index * TAU) / 8 + phase * 0.12;
        matrix.position.set(Math.cos(angle) * 4.37, Math.sin(angle) * 4.37, 0.2);
        matrix.rotation.set(0, 0, angle);
        matrix.scale.set(1, 1, 1);
        matrix.updateMatrix();
        carriers.setMatrixAt(index, matrix.matrix);
      }
      carriers.instanceMatrix.needsUpdate = true;
      paintTraffic(phase);
      applyPose();
      renderer.render(scene, camera);
      canvas.dataset.lensingResonance = resonanceEnabled ? "on" : "off";
      canvas.dataset.lensingResonanceProgress = uniforms.resonance.value.toFixed(3);
      canvas.dataset.lensingDrawCalls = String(renderer.info.render.calls);
      canvas.dataset.lensingTriangles = String(renderer.info.render.triangles);
      lastPaint = time;
      dirty = false;
      if (!ready) {
        ready = true;
        callbacks.onReady?.();
      }
    }
    if (animate) queue();
    else lastTime = 0;
  }
  const resize = () => {
    if (disposed || lost) return;
    const bounds = canvas.getBoundingClientRect();
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    const maxRatio = width <= 600 ? 1.25 : 1.5;
    const ratio = Math.min(window.devicePixelRatio || 1, maxRatio, Math.sqrt(PIXEL_BUDGET / (width * height)));
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    canvas.dataset.lensingPixels = String(canvas.width * canvas.height);
    if (authored) {
      copyPose(targetPose(selectedView));
      travel = null;
    }
    dirty = true;
    queue();
  };
  const setView = (view: LensingView) => {
    selectedView = view;
    authored = true;
    zoomScale = 1;
    const target = targetPose(view);
    if (canAnimate()) travel = { from: clonePose(pose), to: target, elapsed: 0 };
    else {
      copyPose(target);
      travel = null;
    }
    canvas.dataset.lensingView = view;
    dirty = true;
    queue();
  };
  const setLight = (light: LensingLight) => {
    selectedLight = light;
    if (canAnimate())
      lightTravel = {
        sun: uniforms.sunDirection.value.clone(),
        atmosphere: uniforms.atmosphereColor.value.clone(),
        eclipse: uniforms.eclipse.value,
        ion: uniforms.ion.value,
        elapsed: 0,
      };
    else finishLight();
    canvas.dataset.lensingLight = light;
    dirty = true;
    queue();
  };
  const setResonance = (enabled: boolean) => {
    if (enabled === resonanceEnabled) return;
    resonanceEnabled = enabled;
    if (canAnimate()) {
      resonanceTravel = {
        from: uniforms.resonance.value,
        to: enabled ? 1 : 0,
        elapsed: 0,
        duration: enabled ? 4 : 1.2,
      };
    } else finishResonance();
    dirty = true;
    queue();
  };
  const rotate = (dx: number, dy: number) => {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
    authored = false;
    travel = null;
    pose.yaw += dx;
    pose.pitch = THREE.MathUtils.clamp(pose.pitch + dy, -1.05, 1.05);
    dirty = true;
    queue();
  };
  const zoom = (amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;
    travel = null;
    zoomScale = THREE.MathUtils.clamp(zoomScale * amount, 0.62, 1.65);
    dirty = true;
    queue();
  };
  const mediaChanged = () => {
    if (media.matches) {
      if (travel) copyPose(travel.to);
      travel = null;
      finishLight();
      finishResonance();
    }
    dirty = true;
    queue();
  };
  const visibilityChanged = () => {
    if (document.hidden) stop();
    else {
      dirty = true;
      queue();
    }
  };
  const observer = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.target === canvas && entry.isIntersecting);
      if (!visible) stop();
      else {
        dirty = true;
        queue();
      }
    },
    { threshold: 0.01 },
  );
  const resizing = new ResizeObserver(resize);
  let pointer: { id: number; x: number; y: number } | null = null;
  const previousTouchAction = canvas.style.touchAction;
  canvas.style.touchAction = "none";
  const pointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || pointer) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: PointerEvent) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    rotate(-(event.clientX - pointer.x) * 0.0055, (event.clientY - pointer.y) * 0.0055);
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  };
  const pointerEnd = (event: PointerEvent) => {
    if (pointer?.id !== event.pointerId) return;
    pointer = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };
  const wheel = (event: WheelEvent) => {
    event.preventDefault();
    zoom(Math.exp(THREE.MathUtils.clamp(event.deltaY, -200, 200) * 0.0018));
  };
  const contextLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    stop();
    callbacks.onUnavailable?.();
  };
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerEnd);
  canvas.addEventListener("pointercancel", pointerEnd);
  canvas.addEventListener("lostpointercapture", pointerEnd);
  canvas.addEventListener("wheel", wheel, { passive: false });
  canvas.addEventListener("webglcontextlost", contextLost);
  document.addEventListener("visibilitychange", visibilityChanged);
  media.addEventListener("change", mediaChanged);
  observer.observe(canvas);
  resizing.observe(canvas);
  resize();
  finishLight();
  canvas.dataset.lensingView = selectedView;
  canvas.dataset.lensingLight = selectedLight;
  return {
    setLight,
    setView,
    setResonance,
    rotate,
    zoom,
    setMotion(enabled) {
      motion = enabled;
      if (!enabled || media.matches) {
        if (travel) copyPose(travel.to);
        travel = null;
        finishLight();
        finishResonance();
      }
      dirty = true;
      queue();
    },
    setPlaying(enabled) {
      playing = enabled;
      if (!enabled) stop();
      dirty = true;
      queue();
    },
    reset() {
      setView("orbit");
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stop();
      observer.disconnect();
      resizing.disconnect();
      document.removeEventListener("visibilitychange", visibilityChanged);
      media.removeEventListener("change", mediaChanged);
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerEnd);
      canvas.removeEventListener("pointercancel", pointerEnd);
      canvas.removeEventListener("lostpointercapture", pointerEnd);
      canvas.removeEventListener("wheel", wheel);
      canvas.removeEventListener("webglcontextlost", contextLost);
      canvas.style.touchAction = previousTouchAction;
      if (pointer && canvas.hasPointerCapture(pointer.id)) canvas.releasePointerCapture(pointer.id);
      pointer = null;
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) geometries.add(mesh.geometry);
        if (mesh.material)
          (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((material) =>
            materials.add(material),
          );
        if (object instanceof THREE.InstancedMesh) object.dispose();
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      surfaceAtlas.dispose();
      reflection.dispose();
      scene.clear();
      renderer.dispose();
    },
  };
}
