import * as THREE from "three";

export type SanctuarySelection = "core" | "left" | "right";
export type SanctuaryState = { awake: boolean; paused: boolean; ready: boolean; lost: boolean };
export type SanctuaryController = {
  setMotion: (enabled: boolean) => void;
  rotate: (horizontal: number, vertical?: number) => void;
  zoom: (amount: number) => void;
  reset: () => void;
  select: (id: SanctuarySelection) => void;
  setLight: (percent: number) => void;
  awaken: () => void;
  pause: () => void;
  dispose: () => void;
};

/** A modeled interpretation of the film, with no live systems or network inputs. */
export function createSanctuaryRenderer(
  canvas: HTMLCanvasElement,
  options: {
    motion: boolean;
    onSelect: (id: SanctuarySelection) => void;
    onState?: (state: SanctuaryState) => void;
  },
): SanctuaryController {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "low-power" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x090e16);
  // A small, local reflection field gives the fluting and facets depth without
  // loading an HDR image. Its broad warm window echoes the modeled chamber.
  const reflectionCanvas = document.createElement("canvas");
  reflectionCanvas.width = 512;
  reflectionCanvas.height = 256;
  const reflectionContext = reflectionCanvas.getContext("2d");
  let reflectionTarget: THREE.WebGLRenderTarget | undefined;
  if (reflectionContext) {
    const field = reflectionContext.createLinearGradient(0, 0, 0, 256);
    field.addColorStop(0, "#bea784");
    field.addColorStop(0.3, "#75634a");
    field.addColorStop(0.55, "#242930");
    field.addColorStop(1, "#37362f");
    reflectionContext.fillStyle = field;
    reflectionContext.fillRect(0, 0, 512, 256);
    reflectionContext.fillStyle = "#ffe2b0";
    reflectionContext.fillRect(48, 74, 210, 27);
    reflectionContext.fillStyle = "#b9a481";
    reflectionContext.fillRect(285, 84, 148, 36);
    reflectionContext.fillStyle = "#9bc2cf";
    reflectionContext.fillRect(320, 40, 16, 144);
    reflectionContext.fillStyle = "#edd9b7";
    reflectionContext.fillRect(412, 56, 10, 106);
    const reflection = new THREE.CanvasTexture(reflectionCanvas);
    reflection.colorSpace = THREE.SRGBColorSpace;
    reflection.mapping = THREE.EquirectangularReflectionMapping;
    const generator = new THREE.PMREMGenerator(renderer);
    reflectionTarget = generator.fromEquirectangular(reflection);
    scene.environment = reflectionTarget.texture;
    scene.environmentIntensity = 0.88;
    reflection.dispose();
    generator.dispose();
  }
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 160);
  const target = new THREE.Vector3(0, 2.55, 0);
  const view = { yaw: 0.17, pitch: 0.28, radius: 15.4 };
  const initial = { ...view };
  let disposed = false,
    lost = false,
    ready = false,
    visible = true,
    motion = options.motion,
    running = false,
    awake = false,
    phase = 0,
    elapsed = 0,
    lastTick = 0,
    lastPaint = -100,
    frames = 0,
    frame = 0,
    timer = 0,
    light = 65;
  let selection: SanctuarySelection = "core";
  const notify = () => options.onState?.({ awake, paused: !running, ready, lost });
  const stone = new THREE.MeshStandardMaterial({ color: 0xb8a387, roughness: 0.93 });
  const pores = new Uint8Array(128 * 128);
  for (let i = 0; i < pores.length; i++)
    pores[i] = 112 + Math.floor((Math.sin(i * 7.13) * Math.cos(i * 1.97) + 1) * 15);
  const stoneGrain = new THREE.DataTexture(pores, 128, 128, THREE.RedFormat);
  stoneGrain.wrapS = stoneGrain.wrapT = THREE.RepeatWrapping;
  stoneGrain.repeat.set(7, 7);
  stoneGrain.needsUpdate = true;
  stone.bumpMap = stoneGrain;
  stone.bumpScale = 0.05;
  const darkStone = new THREE.MeshStandardMaterial({ color: 0x86755c, roughness: 0.96 });
  const graphite = new THREE.MeshStandardMaterial({ color: 0x41443d, metalness: 0.77, roughness: 0.3 });
  const fluted = new THREE.MeshStandardMaterial({ color: 0x615b4b, metalness: 0.82, roughness: 0.34 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xb89a5d, metalness: 0.82, roughness: 0.23 });
  const black = new THREE.MeshStandardMaterial({ color: 0x101b1c, metalness: 0.66, roughness: 0.46 });
  const cyan = new THREE.MeshStandardMaterial({
    color: 0x3aaeb2,
    emissive: 0x35d2d8,
    emissiveIntensity: 0.7,
    roughness: 0.34,
  });
  const amber = new THREE.MeshStandardMaterial({
    color: 0xffc866,
    emissive: 0xffb230,
    emissiveIntensity: 0.65,
    metalness: 0.3,
    roughness: 0.22,
  });
  const coreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffbd4c,
    emissive: 0xffaa28,
    emissiveIntensity: 0.65,
    metalness: 0.5,
    roughness: 0.2,
    clearcoat: 1,
    flatShading: true,
  });
  const pickable: THREE.Object3D[] = [];
  const baseBox = new THREE.BoxGeometry(1, 1, 1);
  function box(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material,
    shadow = true,
  ) {
    const mesh = new THREE.Mesh(baseBox, material);
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }
  function ring(radius: number, tube: number, y: number, material: THREE.Material) {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 6, 96), material);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.y = y;
    scene.add(mesh);
    return mesh;
  }
  function cylinder(radius: number, depth: number, y: number, material: THREE.Material) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 96), material);
    mesh.position.y = y;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  const hemisphere = new THREE.HemisphereLight(0xffe3ba, 0x283b4b, 0.85);
  scene.add(hemisphere);
  const sun = new THREE.DirectionalLight(0xffe4bd, 3.2);
  sun.position.set(-10, 6, -14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 50 });
  sun.shadow.bias = -0.0007;
  sun.shadow.normalBias = 0.03;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xbbdeeb, 0.62);
  fill.position.set(5, 6, 12);
  scene.add(fill);
  const coreLight = new THREE.PointLight(0xffc260, 4, 9, 2);
  coreLight.position.set(0, 1.2, 0.15);
  scene.add(coreLight);

  // Limestone slabs and deeply recessed channels catch the low, warm light.
  box(26, 0.2, 30, 0, -0.23, 0, darkStone, false);
  const slabs = new THREE.InstancedMesh(baseBox, stone, 11 * 13);
  const dummy = new THREE.Object3D();
  const tint = new THREE.Color();
  let n = 0;
  for (let x = 0; x < 11; x++)
    for (let z = 0; z < 13; z++) {
      dummy.position.set((x - 5) * 2.35, -0.08, (z - 6) * 2.25);
      dummy.scale.set(2.32, 0.12, 2.22);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      slabs.setMatrixAt(n, dummy.matrix);
      const shade = 0.91 + Math.sin(x * 17.7 + z * 6.2) * 0.045;
      slabs.setColorAt(n++, tint.setRGB(shade, shade * 0.98, shade * 0.94));
    }
  slabs.receiveShadow = true;
  scene.add(slabs);
  box(22, 1.3, 0.6, 0, 0.58, -6.8, stone);
  box(22, 5.2, 0.6, 0, 8.8, -6.8, stone);
  box(22, 0.12, 1.0, 0, 1.29, -6.68, darkStone);
  box(22, 0.13, 0.5, 0, 6.13, -6.5, gold);
  box(0.55, 12, 15, -10.6, 5.9, 0, stone);
  box(0.55, 12, 15, 10.6, 5.9, 0, stone);
  for (const x of [-10.22, 10.22])
    for (const z of [-5.6, -1.8, 2, 5.8]) {
      box(0.22, 10, 0.4, x, 5, z, darkStone);
      box(0.07, 10, 0.1, x - Math.sign(x) * 0.15, 5, z + 0.19, gold);
    }
  for (const x of [-4.9, 4.9]) {
    box(0.16, 0.025, 21, x, 0.015, 1.5, black, false);
    box(0.027, 0.031, 21, x + 0.15, 0.02, 1.5, gold, false);
  }

  // A modeled desert world beyond the window; no image or remote texture load.
  const planetGeometry = new THREE.SphereGeometry(5.4, 96, 64);
  const positions = planetGeometry.getAttribute("position");
  const colors = new Float32Array(positions.count * 3);
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      y = positions.getY(i),
      z = positions.getZ(i);
    const terrain =
      Math.sin(x * 0.9 + Math.sin(z * 0.7) * 2) * Math.cos(y * 1.2 + Math.sin(x * 1.7)) +
      0.45 * Math.sin((x + y) * 2.1 + z * 0.9) +
      0.2 * Math.cos((y - z) * 4.1);
    const band = terrain / 3.3 + 0.5;
    tint.setRGB(0.28 + band * 0.36, 0.13 + band * 0.2, 0.05 + band * 0.13);
    tint.toArray(colors, i * 3);
  }
  planetGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const planetMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1,
    emissive: 0x6d351a,
    emissiveIntensity: 0.08,
  });
  const planet = new THREE.Mesh(planetGeometry, planetMaterial);
  planet.position.set(-8, -1.2, -45);
  planet.rotation.z = 0.15;
  scene.add(planet);
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(5.47, 64, 40),
    new THREE.MeshBasicMaterial({
      color: 0x91d2dc,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  );
  atmosphere.position.copy(planet.position);
  scene.add(atmosphere);

  // Machined annular platform, concentric inlays, and a central command core.
  cylinder(3.7, 0.22, 0.12, black);
  cylinder(3.57, 0.13, 0.285, graphite);
  cylinder(1.0, 0.14, 0.415, gold);
  cylinder(0.86, 0.055, 0.51, black);
  for (const radius of [1.12, 1.4, 2.72, 3.38]) ring(radius, 0.016, 0.369, gold);
  for (const radius of [0.72, 0.94, 1.78, 2.34]) ring(radius, 0.014, 0.382, amber);
  const radial = new THREE.InstancedMesh(baseBox, gold, 48);
  for (let i = 0; i < 48; i++) {
    const angle = (i * Math.PI) / 24;
    dummy.position.set(Math.sin(angle) * 3.07, 0.363, Math.cos(angle) * 3.07);
    dummy.rotation.set(0, angle, 0);
    dummy.scale.set(i % 4 === 0 ? 0.04 : 0.018, 0.018, i % 4 === 0 ? 0.29 : 0.12);
    dummy.updateMatrix();
    radial.setMatrixAt(i, dummy.matrix);
  }
  scene.add(radial);
  const waveMaterial = new THREE.MeshBasicMaterial({
    color: 0xffdc8b,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const wave = ring(1, 0.025, 0.39, waveMaterial);
  const core = new THREE.Group();
  core.position.set(0, 1.29, 0.05);
  const crystal = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), coreMaterial);
  crystal.scale.set(0.72, 1.35, 0.72);
  crystal.castShadow = true;
  crystal.userData.selection = "core";
  core.add(crystal);
  pickable.push(crystal);
  const inner = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.14, 0),
    new THREE.MeshBasicMaterial({ color: 0xffebbe }),
  );
  inner.position.y = -0.025;
  core.add(inner);
  const coreEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(crystal.geometry),
    new THREE.LineBasicMaterial({ color: 0xffe3a1, transparent: true, opacity: 0.8 }),
  );
  coreEdges.scale.copy(crystal.scale);
  core.add(coreEdges);
  scene.add(core);

  const flutes = new THREE.InstancedMesh(baseBox, fluted, 128);
  let fluteIndex = 0;
  const circuitSegments: [THREE.Vector3, THREE.Vector3][] = [];
  const outlines: Record<"left" | "right", THREE.LineSegments> = {} as Record<"left" | "right", THREE.LineSegments>;
  for (const [id, x] of [
    ["left", -2.22],
    ["right", 2.22],
  ] as const) {
    const shape = new THREE.Shape();
    shape.moveTo(-0.7, 0.12);
    shape.lineTo(-0.7, 6.08);
    shape.lineTo(-0.55, 6.24);
    shape.lineTo(0.55, 6.24);
    shape.lineTo(0.7, 6.08);
    shape.lineTo(0.7, 0.12);
    shape.closePath();
    const body = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth: 1.14,
        bevelEnabled: true,
        bevelSize: 0.045,
        bevelThickness: 0.045,
        bevelSegments: 1,
        steps: 1,
      }),
      graphite,
    );
    body.position.set(x, 0.22, -0.5);
    body.castShadow = true;
    body.receiveShadow = true;
    body.userData.selection = id;
    scene.add(body);
    pickable.push(body);
    box(1.56, 0.14, 1.27, x, 0.31, 0.09, black);
    box(1.43, 0.09, 1.21, x, 6.5, 0.09, gold);
    for (let i = 0; i < 22; i++)
      for (const z of [-0.556, 0.702]) {
        dummy.position.set(x - 0.659 + i * 0.0628, 3.43, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(0.023, 5.94, 0.052);
        dummy.updateMatrix();
        flutes.setMatrixAt(fluteIndex++, dummy.matrix);
      }
    for (let i = 0; i < 10; i++)
      for (const sign of [-1, 1]) {
        dummy.position.set(x + sign * 0.757, 3.43, -0.45 + i * 0.119);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(0.05, 5.94, 0.025);
        dummy.updateMatrix();
        flutes.setMatrixAt(fluteIndex++, dummy.matrix);
      }
    box(0.025, 6.0, 0.036, x - 0.21, 3.42, 0.745, amber, false);
    for (const offset of [0, 0.095]) {
      const points = [
        [-0.31, 0.4],
        [-0.31, 1.05],
        [0.2, 1.52],
        [0.2, 2.19],
        [-0.14, 2.55],
        [-0.14, 4.08],
        [0.13, 4.35],
        [0.13, 5.74],
      ];
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1],
          b = points[i];
        circuitSegments.push([
          new THREE.Vector3(x + a[0] + offset, a[1], 0.772),
          new THREE.Vector3(x + b[0] + offset, b[1], 0.772),
        ]);
      }
    }
    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.62, 6.3, 1.36)),
      new THREE.LineBasicMaterial({ color: 0x83e4e8, transparent: true, opacity: 0.45, depthWrite: false }),
    );
    outline.position.set(x, 3.36, 0.1);
    outline.visible = false;
    scene.add(outline);
    outlines[id] = outline;
  }
  flutes.castShadow = true;
  flutes.receiveShadow = true;
  scene.add(flutes);
  const conduit = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 6), cyan, circuitSegments.length);
  const up = new THREE.Vector3(0, 1, 0),
    direction = new THREE.Vector3();
  circuitSegments.forEach(([a, b], index) => {
    direction.subVectors(b, a);
    dummy.position.copy(a).add(b).multiplyScalar(0.5);
    dummy.quaternion.setFromUnitVectors(up, direction.clone().normalize());
    dummy.scale.set(1, direction.length(), 1);
    dummy.updateMatrix();
    conduit.setMatrixAt(index, dummy.matrix);
  });
  scene.add(conduit);
  const markerMaterial = new THREE.MeshBasicMaterial({
    color: 0xffdf91,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const marker = ring(0.58, 0.009, 0.59, markerMaterial);

  function applyPhase() {
    const t = phase * phase * (3 - 2 * phase);
    cyan.emissiveIntensity = 0.5 + t * 2.0;
    amber.emissiveIntensity = 0.4 + t * 1.3;
    coreMaterial.emissiveIntensity = 0.5 + t * 1.2;
    coreLight.intensity = 2.5 + t * 6;
    core.rotation.y = t * Math.PI * 2;
    wave.scale.setScalar(0.7 + t * 2.8);
    waveMaterial.opacity = running ? Math.sin(phase * Math.PI) * 0.55 : 0;
    canvas.dataset.progress = phase.toFixed(3);
  }
  function paint() {
    timer = 0;
    if (disposed || lost || document.hidden || !visible) return;
    const now = performance.now();
    if (now - lastPaint < 34) {
      if (!timer) timer = window.setTimeout(paint, 35 - (now - lastPaint));
      return;
    }
    lastPaint = now;
    const horizontal = Math.cos(view.pitch) * view.radius;
    camera.position.set(
      Math.sin(view.yaw) * horizontal,
      target.y + Math.sin(view.pitch) * view.radius,
      Math.cos(view.yaw) * horizontal,
    );
    camera.lookAt(target);
    renderer.render(scene, camera);
    canvas.dataset.frame = String(++frames);
    canvas.dataset.drawCalls = String(renderer.info.render.calls);
    canvas.dataset.triangles = String(renderer.info.render.triangles);
    canvas.dataset.yaw = view.yaw.toFixed(3);
    canvas.dataset.pitch = view.pitch.toFixed(3);
    canvas.dataset.distance = view.radius.toFixed(3);
    if (!ready) {
      ready = true;
      canvas.dataset.ready = "true";
      notify();
    }
  }
  function invalidate() {
    if (timer) window.clearTimeout(timer);
    timer = 0;
    paint();
  }
  function pause() {
    running = false;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    if (timer) window.clearTimeout(timer);
    timer = 0;
    canvas.dataset.running = "false";
    waveMaterial.opacity = 0;
    notify();
  }
  function tick(now: number) {
    frame = 0;
    if (disposed || lost || !running || !motion || document.hidden || !visible) {
      pause();
      return;
    }
    elapsed += Math.min(100, now - lastTick);
    lastTick = now;
    phase = Math.min(1, elapsed / 6000);
    applyPhase();
    if (phase === 1) {
      running = false;
      awake = true;
      canvas.dataset.running = "false";
      canvas.dataset.awake = "true";
      waveMaterial.opacity = 0;
      notify();
    }
    invalidate();
    if (running) frame = requestAnimationFrame(tick);
  }
  function resize() {
    if (disposed || lost) return;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width)),
      height = Math.max(1, Math.round(rect.height));
    const ratio = Math.min(devicePixelRatio || 1, 2, Math.sqrt(1_990_000 / (width * height)));
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = camera.aspect < 1 ? 44 : 40;
    camera.updateProjectionMatrix();
    canvas.dataset.pixels = String(canvas.width * canvas.height);
    renderer.shadowMap.needsUpdate = true;
    invalidate();
  }
  function select(id: SanctuarySelection) {
    selection = id;
    outlines.left.visible = id === "left";
    outlines.right.visible = id === "right";
    marker.visible = id === "core";
    canvas.dataset.selection = selection;
    options.onSelect(id);
    invalidate();
  }
  function setLight(percent: number) {
    light = THREE.MathUtils.clamp(percent, 0, 100);
    const t = light / 100;
    sun.color.set(0xb2d6f5).lerp(new THREE.Color(0xffdfab), t);
    sun.intensity = 0.28 + t * 3.1;
    hemisphere.intensity = 0.42 + t * 0.46;
    fill.intensity = 0.48 + t * 0.2;
    renderer.toneMappingExposure = 0.92 + t * 0.18;
    planetMaterial.emissiveIntensity = 0.02 + t * 0.1;
    canvas.dataset.light = String(light);
    renderer.shadowMap.needsUpdate = true;
    invalidate();
  }
  let pointer: { id: number; x: number; y: number; yaw: number; pitch: number; moved: boolean } | null = null;
  const raycaster = new THREE.Raycaster();
  function pointerDown(event: PointerEvent) {
    if (event.button !== 0 || pointer || lost) return;
    pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      yaw: view.yaw,
      pitch: view.pitch,
      moved: false,
    };
    canvas.setPointerCapture(event.pointerId);
  }
  function pointerMove(event: PointerEvent) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x,
      dy = event.clientY - pointer.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) pointer.moved = true;
    if (!pointer.moved) return;
    view.yaw = THREE.MathUtils.clamp(pointer.yaw - dx * 0.004, -0.66, 0.66);
    view.pitch = THREE.MathUtils.clamp(pointer.pitch + dy * 0.003, 0.12, 0.62);
    invalidate();
  }
  function pointerUp(event: PointerEvent) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const moved = pointer.moved;
    pointer = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (moved || event.type === "pointercancel" || lost) return;
    const rect = canvas.getBoundingClientRect();
    raycaster.setFromCamera(
      new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        1 - ((event.clientY - rect.top) / rect.height) * 2,
      ),
      camera,
    );
    const hit = raycaster.intersectObjects(pickable, false)[0];
    if (hit) select(hit.object.userData.selection as SanctuarySelection);
  }
  function visibility() {
    canvas.dataset.visible = String(!document.hidden && visible);
    if (document.hidden) pause();
    else invalidate();
  }
  function contextLost(event: Event) {
    event.preventDefault();
    lost = true;
    ready = false;
    pause();
    canvas.dataset.ready = "false";
    notify();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  const intersection = new IntersectionObserver(
    (entries) => {
      const entry = entries.filter((item) => item.target === canvas).at(-1);
      if (!entry) return;
      visible = entry.isIntersecting;
      canvas.dataset.visible = String(!document.hidden && visible);
      if (!visible) pause();
      else invalidate();
    },
    { threshold: 0.01 },
  );
  intersection.observe(canvas);
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerUp);
  canvas.addEventListener("webglcontextlost", contextLost);
  document.addEventListener("visibilitychange", visibility);
  canvas.dataset.ready = "false";
  canvas.dataset.selection = selection;
  canvas.dataset.running = "false";
  canvas.dataset.awake = "false";
  canvas.dataset.motion = String(motion);
  canvas.dataset.visible = String(!document.hidden && visible);
  applyPhase();
  setLight(light);
  resize();

  return {
    setMotion(enabled) {
      motion = enabled;
      canvas.dataset.motion = String(enabled);
      if (!enabled) {
        pause();
        invalidate();
      }
    },
    rotate(horizontal, vertical = 0) {
      view.yaw = THREE.MathUtils.clamp(view.yaw + horizontal, -0.66, 0.66);
      view.pitch = THREE.MathUtils.clamp(view.pitch + vertical, 0.12, 0.62);
      invalidate();
    },
    zoom(amount) {
      view.radius = THREE.MathUtils.clamp(view.radius - amount, 11.2, 24);
      invalidate();
    },
    reset() {
      Object.assign(view, initial);
      invalidate();
    },
    select,
    setLight,
    awaken() {
      if (disposed || lost || !motion || document.hidden || !visible) return;
      pause();
      elapsed = 0;
      phase = 0;
      awake = false;
      running = true;
      lastTick = performance.now();
      canvas.dataset.running = "true";
      canvas.dataset.awake = "false";
      notify();
      applyPhase();
      invalidate();
      frame = requestAnimationFrame(tick);
    },
    pause() {
      pause();
      invalidate();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      pause();
      pointer = null;
      observer.disconnect();
      intersection.disconnect();
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointercancel", pointerUp);
      canvas.removeEventListener("webglcontextlost", contextLost);
      document.removeEventListener("visibilitychange", visibility);
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        const drawable = object as THREE.Mesh;
        if (drawable.geometry) geometries.add(drawable.geometry);
        if (drawable.material)
          for (const material of Array.isArray(drawable.material) ? drawable.material : [drawable.material])
            materials.add(material);
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      stoneGrain.dispose();
      reflectionTarget?.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
