import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

/** Optional armillary enhancement. Loads only when the instrument is in view. */
export function createEngineScene(element, initial) {
  const mount = element.querySelector(".engine-viewport");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute("aria-hidden", "true");
  mount.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
  camera.position.set(0, 1.2, 8.4);
  camera.lookAt(0, -0.1, 0);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.025);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xc9e9ff, 0x182133, 0.65));
  /**
   * @param {number} color
   * @param {number} intensity
   * @param {[number, number, number]} position
   */
  function light(color, intensity, position) {
    const source = new THREE.DirectionalLight(color, intensity);
    source.position.set(...position);
    scene.add(source);
  }
  light(0xffedc6, 2.4, [3, 5, 4]);
  light(0x38e1ff, 1.8, [-4, 1, -2]);
  light(0xffffff, 0.8, [-1, -2, 4]);
  const root = new THREE.Group();
  scene.add(root);
  const gold = new THREE.MeshStandardMaterial({
    color: 0xc99b48,
    metalness: 0.87,
    roughness: 0.24,
    envMapIntensity: 1.4,
  });
  const titanium = new THREE.MeshStandardMaterial({
    color: 0x6a909f,
    metalness: 0.9,
    roughness: 0.29,
    envMapIntensity: 1.35,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x102536, metalness: 0.75, roughness: 0.35 });
  const cyan = new THREE.MeshBasicMaterial({ color: 0x38e1ff });
  const amber = new THREE.MeshBasicMaterial({ color: 0xf2c87a });

  function torus(radius, tube, material, group, segments = 96) {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, segments), material);
    group.add(mesh);
    return mesh;
  }
  function ring(radius, material, edge, count) {
    const group = new THREE.Group();
    root.add(group);
    torus(radius, 0.045, material, group);
    torus(radius + 0.055, 0.006, edge, group);
    torus(radius - 0.072, 0.008, dark, group);
    const ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.075, 0.022), material, count);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      dummy.position.set(Math.sin(a) * (radius - 0.13), Math.cos(a) * (radius - 0.13), 0);
      dummy.rotation.z = -a;
      dummy.scale.y = i % 6 === 0 ? 1.8 : 1;
      dummy.updateMatrix();
      ticks.setMatrixAt(i, dummy.matrix);
    }
    group.add(ticks);
    const pinGeometry = new THREE.SphereGeometry(0.054, 12, 8);
    [0, Math.PI].forEach((a) => {
      const pin = new THREE.Mesh(pinGeometry, edge);
      pin.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0);
      group.add(pin);
      const socket = new THREE.Mesh(new THREE.SphereGeometry(0.083, 12, 8), material);
      socket.position.copy(pin.position);
      socket.position.z = -0.048;
      group.add(socket);
    });
    return group;
  }
  const observeMetal = titanium.clone();
  observeMetal.emissive.set(0x38e1ff);
  const routeMetal = gold.clone();
  routeMetal.emissive.set(0xd6a75b);
  const outer = ring(2.05, observeMetal, cyan, 84);
  const middle = ring(1.64, routeMetal, amber, 60);
  const inner = ring(1.26, titanium, cyan, 48);
  const crystal = new THREE.Group();
  root.add(crystal);
  const coreMaterial = gold.clone();
  coreMaterial.roughness = 0.17;
  coreMaterial.emissive.set(0xc48b2e);
  coreMaterial.emissiveIntensity = 0.08;
  const coreGeometry = new THREE.OctahedronGeometry(0.63, 0);
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  core.scale.set(1, 1.8, 1);
  crystal.add(core);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(coreGeometry),
    new THREE.LineBasicMaterial({ color: 0xffe8b1, transparent: true, opacity: 0.28 }),
  );
  edges.scale.copy(core.scale);
  crystal.add(edges);

  // Soft light is one small procedural sprite, not a postprocessing pass or image download.
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = glowCanvas.height = 64;
  const context = glowCanvas.getContext("2d");
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,.6)");
  gradient.addColorStop(0.25, "rgba(255,255,255,.16)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xe5b467,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  glow.scale.set(3.6, 3.6, 1);
  root.add(glow);

  const base = new THREE.Group();
  base.position.y = -2.17;
  scene.add(base);
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.14, 0.07, 64),
    new THREE.MeshStandardMaterial({ color: 0x02060c, metalness: 0.1, roughness: 0.9, envMapIntensity: 0.05 }),
  );
  base.add(plinth);
  const baseRing = torus(1.03, 0.012, titanium, base);
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.057;
  const baseAccent = torus(0.84, 0.006, cyan, base);
  baseAccent.rotation.x = Math.PI / 2;
  baseAccent.position.y = 0.06;

  let active = false,
    lost = false,
    frame = 0,
    previous = 0,
    time = 0;
  let angle = initial.angle,
    principle = initial.principle;
  function draw() {
    if (lost) return;
    const rotation = (angle * Math.PI) / 180;
    root.rotation.y = rotation;
    outer.rotation.set(0.72 + Math.sin(time * 0.12) * 0.12, -0.27, -0.35 + time * 0.026);
    middle.rotation.set(-0.78, 0.62 + Math.sin(time * 0.1) * 0.15, 0.36 - time * 0.035);
    inner.rotation.set(1.28, -0.18, -0.18 + time * 0.06);
    crystal.rotation.y = time * 0.18 + 0.4;
    crystal.position.y = Math.sin(time * 0.6) * 0.035;
    coreMaterial.emissiveIntensity = principle === 2 ? 0.22 : 0.08;
    observeMetal.emissiveIntensity = principle === 0 ? 0.14 : 0.02;
    routeMetal.emissiveIntensity = principle === 1 ? 0.14 : 0.02;
    glow.material.opacity = principle === 2 ? 0.48 : 0.25;
    outer.scale.setScalar(principle === 0 ? 1.025 : 1);
    middle.scale.setScalar(principle === 1 ? 1.04 : 1);
    renderer.render(scene, camera);
  }
  function loop(now) {
    frame = 0;
    if (!active || lost) return;
    const delta = previous ? (now - previous) / 1000 : 0;
    if (!previous || delta >= 1 / 30) {
      previous = now;
      time += Math.min(delta, 0.1);
      draw();
    }
    frame = requestAnimationFrame(loop);
  }
  const observer = new ResizeObserver(() => {
    const width = Math.max(1, element.clientWidth);
    renderer.setSize(width, width, false);
    draw();
  });
  observer.observe(element);
  renderer.setSize(element.clientWidth, element.clientWidth, false);
  draw();
  element.dataset.renderer = "webgl";
  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    lost = true;
    active = false;
    cancelAnimationFrame(frame);
    observer.disconnect();
    delete element.dataset.renderer;
    element.dataset.animating = "false";
  });
  window.addEventListener("pagehide", () => {
    active = false;
    cancelAnimationFrame(frame);
  });
  return {
    setActive(next) {
      if (lost || active === next) return;
      active = next;
      element.dataset.animating = String(next);
      if (active) {
        previous = 0;
        frame = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    setAngle(next) {
      angle = next;
      draw();
    },
    setPrinciple(next) {
      principle = next;
      draw();
    },
  };
}
