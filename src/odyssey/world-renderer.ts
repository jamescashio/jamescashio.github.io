import * as THREE from "three";
import { createExplorationCarrier, type ShipZone } from "./ship-geometry";
import type { WorldInput, computeWorldOutcome } from "./sovereign-model";

type Outcome = ReturnType<typeof computeWorldOutcome>;
export type ShipView = "hero" | "top" | "aft";
export type WorldController = {
  update: (input: WorldInput, outcome: Outcome) => void;
  setMotion: (enabled: boolean) => void;
  setPlaying: (playing: boolean) => void;
  rotate: (horizontal: number, vertical?: number) => void;
  zoom: (amount: number) => void;
  resetView: () => void;
  setView: (view: ShipView) => void;
  setCutaway: (enabled: boolean) => void;
  select: (zone: ShipZone) => void;
  dispose: () => void;
};

const VIEWS = {
  hero: { yaw: 0.72, pitch: 0.58, zoom: 1 },
  top: { yaw: 0.0, pitch: 1.48, zoom: 1 },
  aft: { yaw: 2.82, pitch: 0.38, zoom: 0.95 },
};
const COLORS = { navy: 0x030912, cyan: 0x77e7e7, gold: 0xffc77f, coral: 0xfa927a };

/** An original starship illustrating routing choices, without calling any AI or infrastructure. */
export function createSovereignWorld(
  canvas: HTMLCanvasElement,
  _initial: WorldInput,
  initialOutcome: Outcome,
  callbacks: {
    inspect: (zone: ShipZone) => void;
    unavailable: () => void;
    viewChanged?: () => void;
  },
): WorldController {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(COLORS.navy);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 260);
  const view = { ...VIEWS.hero };
  let transition: {
    from: typeof view;
    to: typeof view;
    yawDelta: number;
    elapsed: number;
  } | null = null;
  let width = 1,
    height = 1,
    disposed = false,
    visible = false,
    playing = false,
    motion = true;
  let frame = 0,
    last = 0,
    lastPaint = 0,
    phase = 0,
    outcome = initialOutcome;
  let pointer: { x: number; y: number; yaw: number; pitch: number; id: number; moved: boolean } | null = null;
  const raycaster = new THREE.Raycaster();

  scene.add(new THREE.HemisphereLight(0xe2d8c6, 0x15202f, 1.2));
  const sun = new THREE.DirectionalLight(0xffdfab, 3.4);
  sun.position.set(-9, 11, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -15;
  sun.shadow.camera.right = 15;
  sun.shadow.camera.top = 13;
  sun.shadow.camera.bottom = -13;
  sun.shadow.normalBias = 0.035;
  sun.shadow.bias = -0.0002;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0x7bbddd, 2.6);
  rim.position.set(3, 7, -12);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xb8d4e6, 0.65);
  fill.position.set(12, 1, 5);
  scene.add(fill);

  // Local studio reflections make the metal read as metal without an external HDR asset.
  const environmentCanvas = document.createElement("canvas");
  environmentCanvas.width = 512;
  environmentCanvas.height = 256;
  const context = environmentCanvas.getContext("2d");
  let environmentTarget: THREE.WebGLRenderTarget | undefined;
  if (context) {
    context.fillStyle = "#263141";
    context.fillRect(0, 0, 512, 256);
    const upper = context.createLinearGradient(0, 0, 0, 256);
    upper.addColorStop(0, "#7c817d");
    upper.addColorStop(0.27, "#d5c6a7");
    upper.addColorStop(0.49, "#2a3644");
    upper.addColorStop(0.72, "#101a28");
    upper.addColorStop(1, "#111720");
    context.fillStyle = upper;
    context.fillRect(0, 0, 512, 256);
    context.fillStyle = "#f2e8cf";
    context.fillRect(72, 32, 112, 68);
    context.fillStyle = "#88b8cf";
    context.fillRect(350, 43, 40, 92);
    const texture = new THREE.CanvasTexture(environmentCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.mapping = THREE.EquirectangularReflectionMapping;
    const generator = new THREE.PMREMGenerator(renderer);
    environmentTarget = generator.fromEquirectangular(texture);
    scene.environment = environmentTarget.texture;
    scene.environmentIntensity = 0.74;
    texture.dispose();
    generator.dispose();
  }

  // Deterministic far stars and a quiet planetary limb provide scale, not motion.
  let seed = 7391;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const starPositions: number[] = [],
    starColors: number[] = [];
  for (let i = 0; i < 740; i++) {
    const theta = random() * Math.PI * 2;
    const y = random() * 2 - 1;
    const radius = 95 + random() * 55;
    const horizontal = Math.sqrt(1 - y * y);
    starPositions.push(Math.cos(theta) * horizontal * radius, y * radius, Math.sin(theta) * horizontal * radius);
    const color = new THREE.Color(i % 7 === 0 ? 0xeccca1 : 0xa7c6d8).multiplyScalar(0.32 + random() * 0.58);
    starColors.push(color.r, color.g, color.b);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
  starGeometry.setAttribute("color", new THREE.Float32BufferAttribute(starColors, 3));
  scene.add(
    new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        size: 0.13,
        vertexColors: true,
        transparent: true,
        opacity: 0.76,
        depthWrite: false,
        toneMapped: false,
      }),
    ),
  );
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(12.5, 48, 32),
    new THREE.ShaderMaterial({
      vertexShader:
        "varying vec3 vNormal;void main(){vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader:
        "varying vec3 vNormal;void main(){float light=pow(max(0.0,dot(normalize(vNormal),normalize(vec3(-0.94,0.24,0.12)))),3.0);gl_FragColor=vec4(vec3(0.004,0.009,0.016)+vec3(0.025,0.085,0.13)*light,1.0);}",
    }),
  );
  planet.position.set(-25, -8, -60);
  scene.add(planet);
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(12.59, 48, 32),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      vertexShader:
        "varying vec3 vNormal; varying vec3 vView; void main(){vec4 p=modelViewMatrix*vec4(position,1.0);vNormal=normalize(normalMatrix*normal);vView=normalize(-p.xyz);gl_Position=projectionMatrix*p;}",
      fragmentShader:
        "varying vec3 vNormal; varying vec3 vView; void main(){float rim=pow(1.0-abs(dot(normalize(vNormal),normalize(vView))),7.0);float lit=0.15+0.85*max(0.0,dot(normalize(vNormal),normalize(vec3(-0.94,0.24,0.12))));gl_FragColor=vec4(0.23,0.53,0.72,rim*lit*0.52);}",
    }),
  );
  atmosphere.position.copy(planet.position);
  scene.add(atmosphere);

  const ship = createExplorationCarrier();
  scene.add(ship.group);
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = glowCanvas.height = 64;
  const glowContext = glowCanvas.getContext("2d");
  let engineGlow: THREE.CanvasTexture | undefined;
  if (glowContext) {
    const gradient = glowContext.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(200,250,255,.9)");
    gradient.addColorStop(0.18, "rgba(107,233,255,.65)");
    gradient.addColorStop(0.45, "rgba(68,194,235,.17)");
    gradient.addColorStop(1, "rgba(68,194,235,0)");
    glowContext.fillStyle = gradient;
    glowContext.fillRect(0, 0, 64, 64);
    engineGlow = new THREE.CanvasTexture(glowCanvas);
    engineGlow.colorSpace = THREE.SRGBColorSpace;
    const glowMaterial = new THREE.SpriteMaterial({
      map: engineGlow,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      opacity: 0.75,
    });
    for (const x of [-5.8, -0.82, 0.82, 5.8]) {
      const sprite = new THREE.Sprite(glowMaterial);
      sprite.position.set(x, -0.14, -7.64);
      sprite.scale.set(2.1, 2.1, 1);
      scene.add(sprite);
    }
  }
  const cyan = new THREE.MeshBasicMaterial({ color: COLORS.cyan, toneMapped: false });
  const gold = new THREE.MeshBasicMaterial({ color: COLORS.gold, toneMapped: false });
  const coral = new THREE.MeshBasicMaterial({ color: COLORS.coral, toneMapped: false });
  const paths = {
    local: new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.55, 5.7),
      new THREE.Vector3(-1.65, 1.8, 3.5),
      new THREE.Vector3(-1.8, 1.85, 0.4),
      new THREE.Vector3(0, 2.05, -1.15),
    ]),
    cloud: new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.55, 5.7),
      new THREE.Vector3(3.2, 1.85, 4.3),
      new THREE.Vector3(8.4, 2.3, -0.3),
      new THREE.Vector3(10.1, 2.5, -5.6),
    ]),
    held: new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.55, 5.7),
      new THREE.Vector3(0.9, 1.8, 5.4),
      new THREE.Vector3(1.1, 2.2, 4.3),
      new THREE.Vector3(0, 2.25, 3.45),
    ]),
  };
  const channelMaterials = { local: cyan.clone(), cloud: gold.clone(), held: coral.clone() };
  const glowMaterials: THREE.MeshBasicMaterial[] = [];
  Object.entries(paths).forEach(([key, curve]) => {
    const mat = channelMaterials[key as keyof typeof paths];
    mat.transparent = true;
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 0.017, 5, false), mat));
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: mat.color,
      transparent: true,
      opacity: 0.065,
      depthWrite: false,
      toneMapped: false,
    });
    glowMaterials.push(glowMaterial);
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 60, 0.062, 5, false), glowMaterial));
  });
  const packetGeometry = new THREE.IcosahedronGeometry(0.105, 0);
  const packets = Array.from({ length: 12 }, () => {
    const mesh = new THREE.Mesh(packetGeometry, cyan);
    scene.add(mesh);
    return mesh;
  });
  const packetRoutes: (keyof typeof paths)[] = [];
  const updatePackets = () => {
    packets.forEach((packet, index) => {
      const route = packetRoutes[index];
      packet.position.copy(paths[route].getPoint((phase * 0.17 + index / 12) % 1));
      packet.rotation.set(phase + index, phase * 0.4, index * 0.7);
    });
  };
  const applyOutcome = () => {
    packetRoutes.length = 0;
    for (let i = 0; i < 12; i++)
      packetRoutes.push(i < outcome.local ? "local" : i < outcome.local + outcome.cloud ? "cloud" : "held");
    packets.forEach((packet, index) => {
      packet.material = packetRoutes[index] === "local" ? cyan : packetRoutes[index] === "cloud" ? gold : coral;
    });
    channelMaterials.local.opacity = outcome.local ? 0.86 : 0.1;
    channelMaterials.cloud.opacity = outcome.cloud ? 0.86 : 0.1;
    channelMaterials.held.opacity = outcome.held ? 0.86 : 0.025;
    glowMaterials.forEach((material, index) => {
      material.opacity = [outcome.local, outcome.cloud, outcome.held][index] ? 0.055 : 0.008;
    });
    updatePackets();
  };
  applyOutcome();
  // Cache bounds of each physical part, excluding the far scenery and all HTML labels.
  ship.group.updateMatrixWorld(true);
  const framingPoints: THREE.Vector3[] = [];
  ship.group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.geometry) return;
    mesh.geometry.computeBoundingBox();
    const bounds = mesh.geometry.boundingBox!;
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z])
          framingPoints.push(new THREE.Vector3(x, y, z).applyMatrix4(mesh.matrixWorld));
  });
  const right = new THREE.Vector3(),
    upAxis = new THREE.Vector3(),
    back = new THREE.Vector3();
  const center = new THREE.Vector3();
  const cameraPosition = () => {
    camera.position.set(
      Math.sin(view.yaw) * Math.cos(view.pitch),
      Math.sin(view.pitch),
      Math.cos(view.yaw) * Math.cos(view.pitch),
    );
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    // Roll the long silhouette into portrait space instead of shrinking it to a horizontal thumbnail.
    if (width < 600) camera.rotateZ(-0.62);
    camera.updateMatrixWorld();
    right.setFromMatrixColumn(camera.matrixWorld, 0);
    upAxis.setFromMatrixColumn(camera.matrixWorld, 1);
    back.setFromMatrixColumn(camera.matrixWorld, 2);
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity,
      minZ = Infinity,
      maxZ = -Infinity;
    for (const p of framingPoints) {
      const x = p.dot(right),
        y = p.dot(upAxis),
        z = p.dot(back);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }
    const cx = (minX + maxX) / 2,
      cy = (minY + maxY) / 2,
      cz = (minZ + maxZ) / 2;
    center.copy(right).multiplyScalar(cx).addScaledVector(upAxis, cy).addScaledVector(back, cz);
    const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    let radius = 1;
    for (const p of framingPoints) {
      const z = p.dot(back) - cz;
      radius = Math.max(
        radius,
        Math.abs(p.dot(right) - cx) / (tangent * camera.aspect * 0.87) + z,
        Math.abs(p.dot(upAxis) - cy) / (tangent * 0.76) + z,
      );
    }
    camera.position.copy(center).addScaledVector(back, radius * view.zoom);
    camera.updateMatrixWorld();
  };
  const tick = (now: number) => {
    frame = 0;
    if (disposed || !visible || document.hidden) return;
    if (now - lastPaint < 1000 / 30) {
      frame = requestAnimationFrame(tick);
      return;
    }
    const dt = last ? Math.min(0.07, (now - last) / 1000) : 0;
    if (transition && motion) {
      transition.elapsed = Math.min(550, transition.elapsed + dt * 1000);
      const progress = transition.elapsed / 550;
      const eased = progress * progress * (3 - 2 * progress);
      view.yaw = transition.from.yaw + transition.yawDelta * eased;
      view.pitch = THREE.MathUtils.lerp(transition.from.pitch, transition.to.pitch, eased);
      view.zoom = THREE.MathUtils.lerp(transition.from.zoom, transition.to.zoom, eased);
      if (progress === 1) {
        Object.assign(view, transition.to);
        transition = null;
      }
    }
    if (playing && motion) {
      phase += dt;
      ship.animate(phase);
      updatePackets();
    }
    cameraPosition();
    renderer.render(scene, camera);
    last = now;
    lastPaint = now;
    if (motion && (playing || transition)) frame = requestAnimationFrame(tick);
  };
  const render = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    if (!disposed && visible && !document.hidden) frame = requestAnimationFrame(tick);
  };
  const changeView = (name: ShipView) => {
    const to = VIEWS[name];
    const yawDelta = Math.atan2(Math.sin(to.yaw - view.yaw), Math.cos(to.yaw - view.yaw));
    if (!motion || Math.abs(yawDelta) + Math.abs(to.pitch - view.pitch) + Math.abs(to.zoom - view.zoom) < 0.000001) {
      Object.assign(view, to);
      transition = null;
    } else {
      transition = { from: { ...view }, to: { ...to }, yawDelta, elapsed: 0 };
    }
    render();
  };
  const select = (zone: ShipZone) => {
    ship.select(zone);
    callbacks.inspect(zone);
    render();
  };
  const resize = new ResizeObserver(([entry]) => {
    width = Math.max(1, entry.contentRect.width);
    height = Math.max(1, entry.contentRect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  });
  const intersection = new IntersectionObserver(
    (entries) => {
      // Smooth scrolling can queue both exit and re-entry in one delivery.
      // The final entry represents the canvas's current visibility.
      const entry = entries[entries.length - 1];
      if (!entry) return;
      visible = entry.isIntersecting;
      render();
    },
    { threshold: 0.01 },
  );
  resize.observe(canvas);
  intersection.observe(canvas);
  const down = (event: PointerEvent) => {
    if (event.button !== 0) return;
    if (transition) {
      transition = null;
      callbacks.viewChanged?.();
      render();
    }
    pointer = {
      x: event.clientX,
      y: event.clientY,
      yaw: view.yaw,
      pitch: view.pitch,
      id: event.pointerId,
      moved: false,
    };
    canvas.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    const dx = event.clientX - pointer.x,
      dy = event.clientY - pointer.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) {
      if (!pointer.moved) callbacks.viewChanged?.();
      pointer.moved = true;
    }
    if (!pointer.moved) return;
    view.yaw = pointer.yaw - dx * 0.006;
    view.pitch = THREE.MathUtils.clamp(pointer.pitch + dy * 0.004, 0.15, 1.48);
    render();
  };
  const up = (event: PointerEvent) => {
    if (pointer && !pointer.moved) {
      const bounds = canvas.getBoundingClientRect();
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
          (-(event.clientY - bounds.top) / bounds.height) * 2 + 1,
        ),
        camera,
      );
      const hit = raycaster.intersectObjects(ship.inspected, false).find((intersection) => {
        let object: THREE.Object3D | null = intersection.object;
        while (object) {
          if (!object.visible) return false;
          object = object.parent;
        }
        return true;
      });
      if (hit) select(hit.object.userData.zone as ShipZone);
    }
    pointer = null;
  };
  const cancel = () => {
    pointer = null;
  };
  const lost = (event: Event) => {
    event.preventDefault();
    playing = false;
    transition = null;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    callbacks.unavailable();
  };
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", cancel);
  canvas.addEventListener("lostpointercapture", cancel);
  canvas.addEventListener("webglcontextlost", lost);
  document.addEventListener("visibilitychange", render);
  renderer.shadowMap.needsUpdate = true;
  return {
    update(_next, nextOutcome) {
      outcome = nextOutcome;
      applyOutcome();
      render();
    },
    setMotion(enabled) {
      motion = enabled;
      if (!motion && transition) {
        Object.assign(view, transition.to);
        transition = null;
      }
      render();
    },
    setPlaying(value) {
      playing = value;
      render();
    },
    rotate(horizontal, vertical = 0) {
      transition = null;
      view.yaw += horizontal;
      view.pitch = THREE.MathUtils.clamp(view.pitch + vertical, 0.15, 1.48);
      callbacks.viewChanged?.();
      render();
    },
    zoom(amount) {
      transition = null;
      view.zoom = THREE.MathUtils.clamp(view.zoom + amount, 0.7, 1.4);
      callbacks.viewChanged?.();
      render();
    },
    resetView() {
      changeView("hero");
    },
    setView(name) {
      changeView(name);
    },
    setCutaway(enabled) {
      ship.setCutaway(enabled);
      renderer.shadowMap.needsUpdate = true;
      render();
    },
    select,
    dispose() {
      disposed = true;
      transition = null;
      if (frame) cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", render);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", cancel);
      canvas.removeEventListener("lostpointercapture", cancel);
      canvas.removeEventListener("webglcontextlost", lost);
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (object instanceof THREE.InstancedMesh) object.dispose();
        if (mesh.geometry) geometries.add(mesh.geometry);
        if (mesh.material)
          (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((mat) => materials.add(mat));
      });
      // A route material can be unused by all twelve packets in the current state.
      materials.add(cyan);
      materials.add(gold);
      materials.add(coral);
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((mat) => mat.dispose());
      engineGlow?.dispose();
      environmentTarget?.dispose();
      sun.dispose();
      renderer.dispose();
    },
  };
}
