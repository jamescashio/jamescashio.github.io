import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export type RoadsterView = "body" | "wheels" | "thrusters";
export type RoadsterController = {
  view: (name: RoadsterView) => void;
  orbit: (direction: number) => void;
  zoom: (direction: number) => void;
  dispose: () => void;
};
const shots = {
  body: { position: [-4.3, 2.25, 5.1], target: [0, 0.55, 0] },
  wheels: { position: [-2.7, 1.05, 2.6], target: [-1.4125, 0.45, 0.9] },
  thrusters: { position: [4.7, 1.65, 3.3], target: [1.6, 0.65, 0] },
};

function materials() {
  const metal = (color: number, roughness = 0.4, metalness = 0.7) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  return {
    paint: new THREE.MeshPhysicalMaterial({
      color: 0xe3e6de,
      metalness: 0.16,
      roughness: 0.26,
      clearcoat: 1,
      clearcoatRoughness: 0.18,
    }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x64564b, metalness: 0.35, roughness: 0.12, clearcoat: 1 }),
    rubber: metal(0x141a1f, 0.92, 0),
    carbon: metal(0x19242c, 0.48, 0.34),
    cavity: metal(0x06090c, 0.95, 0),
    wheelFace: metal(0xc3c9ca, 0.4, 0.72),
    wheelDark: metal(0x27323b, 0.3, 0.8),
    wheelBevel: metal(0x737d83, 0.34, 0.8),
    titanium: metal(0x8d9290, 0.38, 0.83),
    metal: metal(0x8d999e),
    black: metal(0x171e26, 0.5, 0.24),
    leather: metal(0xd5d5c9, 0.8, 0),
    micro: metal(0x58616a, 0.95, 0),
    copper: metal(0xbf743f, 0.36, 0.86),
    brake: metal(0x8c2331, 0.36, 0.3),
    ceramic: metal(0x5c6667, 0.75, 0.25),
    orange: metal(0xea6517, 0.6, 0),
    coolant: metal(0x277f8d, 0.5, 0.6),
    gold: metal(0xc59836, 0.35, 0.8),
    frontLED: new THREE.MeshStandardMaterial({ color: 0xe1f4ff, emissive: 0x91d8df, emissiveIntensity: 0.7 }),
    tailLED: new THREE.MeshStandardMaterial({ color: 0xcf263e, emissive: 0x8b1828, emissiveIntensity: 0.7 }),
    marker: metal(0xcc651f, 0.4, 0.3),
  };
}

/** Material families follow the original Studio's named CAD parts; geometry is unchanged. */
function materialFor(name: string): keyof ReturnType<typeof materials> {
  if (/seal|gasket|recess|liner|well|throat/.test(name)) return "cavity";
  if (/^rim_aero_/.test(name)) return "wheelFace";
  if (/^rim_spoke_bevel_|^rim_edge_/.test(name)) return "wheelBevel";
  if (/^rim_spoke_|^rim_lip_|^rim_barrel_|^hub_cap_|^wheel_bolt_/.test(name)) return "wheelDark";
  if (
    /body_shell|hood_panel|headlamp_cover|door[LR]_paint|A_pillar|_belt$|roof_rail|rear_buttress|rear_fascia|wing_carbon|wing_endplate|hood_vent/.test(
      name,
    )
  )
    return "paint";
  if (/glass|windshield/.test(name)) return "glass";
  if (/tire_/.test(name)) return "rubber";
  if (
    /carbon|cabin_tub|sill_|skirt_|splitter|diffuser|front_aero|dashboard|rear_fan|rear_nozzle_shelf|front_intake/.test(
      name,
    )
  )
    return "carbon";
  if (/nozzle|_lip$|gas_line|COPV_valve/.test(name)) return "titanium";
  if (/seat_bolster|microsuede/.test(name)) return "micro";
  if (/seat_/.test(name)) return "leather";
  if (/brake_caliper/.test(name)) return "brake";
  if (/rotor_/.test(name)) return "ceramic";
  if (/motor_copper/.test(name)) return "copper";
  if (/HV_cable/.test(name)) return "orange";
  if (/coolant_/.test(name)) return "coolant";
  if (/spring_/.test(name)) return "gold";
  if (name === "front_LED") return "frontLED";
  if (name === "tail_LED") return "tailLED";
  if (/side_marker/.test(name)) return "marker";
  if (/fan_|hub_|roof_spine|cockpit_|arch_vent|camera_|headlamp_/.test(name)) return "black";
  return "metal";
}

function disposeTree(root: THREE.Object3D) {
  const disposedMaterials = new Set<THREE.Material>();
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    node.geometry.dispose();
    for (const mat of Array.isArray(node.material) ? node.material : [node.material]) disposedMaterials.add(mat);
  });
  disposedMaterials.forEach((mat) => mat.dispose());
}

export async function createRoadsterInspection(
  canvas: HTMLCanvasElement,
  signal: AbortSignal,
  unavailable: () => void,
): Promise<RoadsterController> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080d13);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 60);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.enableZoom = false; // The wheel scrolls the page; explicit controls handle zoom.
  controls.minPolarAngle = 0.2;
  controls.maxPolarAngle = Math.PI / 2.03;
  controls.rotateSpeed = 0.55;
  canvas.style.touchAction = "pan-y";
  const query = matchMedia("(prefers-reduced-motion: reduce)");
  const allowsMotion = () => document.documentElement.dataset.motion !== "off" && !query.matches;
  let disposed = false,
    visible = true,
    frame = 0,
    previous = 0;
  let selected: RoadsterView = "body";
  let transition: {
    from: THREE.Spherical;
    to: THREE.Spherical;
    fromTarget: THREE.Vector3;
    toTarget: THREE.Vector3;
    elapsed: number;
  } | null = null;
  let environment: THREE.WebGLRenderTarget | undefined;
  let contactTexture: THREE.CanvasTexture | undefined;
  let resize: ResizeObserver | undefined;
  let observer: IntersectionObserver | undefined;
  const paint = materials();

  function request() {
    if (!disposed && !frame && visible && !document.hidden) frame = requestAnimationFrame(draw);
  }
  function draw(now: number) {
    frame = 0;
    if (disposed || !visible || document.hidden) {
      previous = 0;
      return;
    }
    if (transition) {
      if (!allowsMotion()) transition = null;
      else {
        transition.elapsed += previous ? Math.min(50, now - previous) : 0;
        const progress = Math.min(1, transition.elapsed / 1100);
        const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
        const orbit = new THREE.Spherical(
          THREE.MathUtils.lerp(transition.from.radius, transition.to.radius, eased),
          THREE.MathUtils.lerp(transition.from.phi, transition.to.phi, eased),
          THREE.MathUtils.lerp(transition.from.theta, transition.to.theta, eased),
        );
        controls.target.lerpVectors(transition.fromTarget, transition.toTarget, eased);
        camera.position.setFromSpherical(orbit).add(controls.target);
        controls.update();
        if (progress === 1) transition = null;
      }
    }
    previous = now;
    renderer.render(scene, camera);
    if (transition) request();
  }
  function move(position: THREE.Vector3, target: THREE.Vector3, instant = false) {
    const from = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    const to = new THREE.Spherical().setFromVector3(position.clone().sub(target));
    to.theta = from.theta + Math.atan2(Math.sin(to.theta - from.theta), Math.cos(to.theta - from.theta));
    if (instant || !allowsMotion()) {
      transition = null;
      controls.target.copy(target);
      camera.position.copy(position);
      controls.update();
    } else {
      transition = { from, to, fromTarget: controls.target.clone(), toTarget: target, elapsed: 0 };
      previous = 0;
    }
    request();
  }
  function view(name: RoadsterView, instant = false) {
    selected = name;
    const shot = shots[name],
      target = new THREE.Vector3(...shot.target);
    const position = new THREE.Vector3(...shot.position)
      .sub(target)
      .multiplyScalar(Math.max(1, (name === "body" ? 1.7 : name === "thrusters" ? 1.25 : 0.95) / camera.aspect))
      .add(target);
    move(position, target, instant);
  }
  function orbit(direction: number) {
    const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    spherical.theta += direction * 0.25;
    move(new THREE.Vector3().setFromSpherical(spherical).add(controls.target), controls.target.clone());
  }
  function zoom(direction: number) {
    const offset = camera.position.clone().sub(controls.target);
    offset.setLength(THREE.MathUtils.clamp(offset.length() * (direction < 0 ? 0.84 : 1.19), 0.75, 16));
    move(offset.add(controls.target), controls.target.clone());
  }
  function key(event: KeyboardEvent) {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-"].includes(event.key)) {
      event.preventDefault();
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") orbit(event.key === "ArrowLeft" ? -1 : 1);
      else zoom(["ArrowUp", "+", "="].includes(event.key) ? -1 : 1);
    }
  }
  function cancelMove() {
    transition = null;
  }
  function motionChange() {
    if (!allowsMotion()) cancelMove();
    request();
  }
  function visibility() {
    previous = 0;
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else request();
  }
  function lost(event: Event) {
    event.preventDefault();
    dispose();
    if (!signal.aborted) unavailable();
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    transition = null;
    resize?.disconnect();
    observer?.disconnect();
    controls.dispose();
    canvas.removeEventListener("keydown", key);
    canvas.removeEventListener("webglcontextlost", lost);
    document.removeEventListener("cashio-motion", motionChange);
    document.removeEventListener("visibilitychange", visibility);
    query.removeEventListener("change", motionChange);
    signal.removeEventListener("abort", dispose);
    disposeTree(scene);
    Object.values(paint).forEach((material) => material.dispose());
    environment?.dispose();
    contactTexture?.dispose();
    renderer.dispose();
  }
  signal.addEventListener("abort", dispose, { once: true });
  canvas.addEventListener("webglcontextlost", lost);
  try {
    const response = await fetch("/models/roadster-inspection.glb.gz", { signal });
    if (!response.ok) throw new Error("The design could not load.");
    let data = await response.arrayBuffer();
    const bytes = new Uint8Array(data);
    // Native gzip preserves every CAD vertex and avoids a WASM decoder or CSP relaxation.
    // Some hosts transparently decompress; accept the GLB in that case too.
    if (bytes[0] === 0x1f && bytes[1] === 0x8b)
      data = await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
    signal.throwIfAborted();
    const gltf = await new GLTFLoader().parseAsync(data, "");
    if (disposed) {
      disposeTree(gltf.scene);
      throw new DOMException("Inspection closed", "AbortError");
    }
    gltf.scene.updateMatrixWorld(true);
    const groups = new Map<keyof typeof paint, THREE.BufferGeometry[]>();
    gltf.scene.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      const type = materialFor(node.name);
      const geometry = node.geometry.clone().applyMatrix4(node.matrixWorld);
      // These untextured materials need only positions and normals. Some original parts also carry UVs.
      for (const attribute of Object.keys(geometry.attributes)) {
        if (attribute !== "position" && attribute !== "normal") geometry.deleteAttribute(attribute);
      }
      const group = groups.get(type) || [];
      group.push(geometry);
      groups.set(type, group);
    });
    // Static inspection keeps the original parts but draws a material group in one call.
    for (const [type, geometries] of groups) {
      const merged = mergeGeometries(geometries);
      geometries.forEach((geometry) => geometry.dispose());
      if (merged) scene.add(new THREE.Mesh(merged, paint[type]));
    }
    disposeTree(gltf.scene);
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.7;
    room.dispose();
    pmrem.dispose();
    scene.add(new THREE.HemisphereLight(0xc7e3ef, 0x393021, 1));
    const keyLight = new THREE.DirectionalLight(0xffead1, 2);
    keyLight.position.set(-3, 6, 5);
    scene.add(keyLight);
    const fill = new THREE.DirectionalLight(0x9dc9df, 1.2);
    fill.position.set(2, 3, -5);
    scene.add(fill);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 96), new THREE.MeshBasicMaterial({ color: 0x0b141c }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.012;
    scene.add(floor);
    const contact = document.createElement("canvas");
    contact.width = contact.height = 128;
    const ctx = contact.getContext("2d")!;
    const gradient = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
    gradient.addColorStop(0, "#000d");
    gradient.addColorStop(0.6, "#0009");
    gradient.addColorStop(1, "#0000");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    contactTexture = new THREE.CanvasTexture(contact);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(6.2, 3.1),
      new THREE.MeshBasicMaterial({ map: contactTexture, transparent: true, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.009;
    scene.add(shadow);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.9, 2.905, 120),
      new THREE.MeshBasicMaterial({ color: 0x6c624b, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.008;
    scene.add(ring);
    resize = new ResizeObserver(() => {
      const width = canvas.clientWidth,
        height = canvas.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      view(selected, true);
    });
    resize.observe(canvas);
    observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      previous = 0;
      if (visible) request();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    observer.observe(canvas);
    controls.addEventListener("start", cancelMove);
    controls.addEventListener("change", request);
    canvas.addEventListener("keydown", key);
    document.addEventListener("cashio-motion", motionChange);
    document.addEventListener("visibilitychange", visibility);
    query.addEventListener("change", motionChange);
    view("body", true);
    return { view, orbit, zoom, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
