import * as THREE from "three";

type EnergyFlow = { local: number; cloud: number; held: number };
const TAU = Math.PI * 2;

/** Local, bounded engine and circuit geometry. The world owns its clock and disposal. */
export function createShipEnergy() {
  const group = new THREE.Group();
  group.name = "Sovereign energy systems";
  const light = (color: number, opacity: number) =>
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
  const ion = light(0x7edfff, 0.52);
  const wakeMaterial = light(0x6fd5f2, 0.46);
  const circuitMaterial = light(0xc0fbff, 0.9);
  const bayMaterial = light(0x75f9e2, 0.84);
  const coreMaterial = light(0x75e6ef, 0.42);
  const commandMaterial = light(0xffcf81, 0.56);
  const relayMaterial = light(0xffcf81, 0.16);
  const add = <T extends THREE.Object3D>(object: T, name: string) => {
    object.name = name;
    group.add(object);
    return object;
  };
  const matrix = new THREE.Object3D();
  const point = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const forward = new THREE.Vector3(0, 0, 1);
  const color = new THREE.Color();
  const engineX = [-5.8, -0.82, 0.82, 5.8];
  const engineScale = [0.82, 1.05, 1.05, 0.82];

  // The luminous compression diamonds sit inside the existing transparent exhaust cones.
  const diamonds = add(
    new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 0), ion, 16),
    "Engine compression diamonds",
  );
  const wake = add(new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), wakeMaterial, 64), "Four ion wakes");
  const wakeColor = new THREE.Color(0x78dfff);
  const brightWake = new THREE.Color(0xd5ffff);
  for (let index = 0; index < 64; index++) {
    wake.setColorAt(index, color.copy(wakeColor).lerp(brightWake, (index % 7) / 10));
  }

  // Runners travel along actual inset light channels instead of floating over the hull.
  const paths: THREE.CatmullRomCurve3[] = [];
  for (const side of [-1, 1]) {
    paths.push(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 2.34, 0.24, 2.45),
        new THREE.Vector3(side * 4.56, 0.26, 0.18),
        new THREE.Vector3(side * 6.45, 0.28, -4.17),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 1.42, 0.035, 5.5),
        new THREE.Vector3(side * 2.18, 0.04, 2.8),
        new THREE.Vector3(side * 2.48, 0.04, -0.7),
        new THREE.Vector3(side * 2.12, 0.04, -3.6),
        new THREE.Vector3(side * 1.63, 0.035, -6.9),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 5.46, 0.175, -1.8),
        new THREE.Vector3(side * 5.28, 0.175, -4.7),
        new THREE.Vector3(side * 5.35, 0.135, -6.78),
      ]),
    );
  }
  const runners = add(
    new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 0.032, 0.28), circuitMaterial, paths.length * 3),
    "Hull circuit runners",
  );
  const bayRunners = add(
    new THREE.InstancedMesh(new THREE.BoxGeometry(0.024, 0.024, 0.2), bayMaterial, 24),
    "Onboard hardware light buses",
  );

  // A precise holographic instrument around Bit: three incomplete arcs and calibrated ticks.
  const coreField = new THREE.Group();
  coreField.position.set(0, 1.39, -1.15);
  add(coreField, "Bit energy aperture");
  for (let index = 0; index < 3; index++) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(1.45 + index * 0.15, 0.012, 4, 44, TAU * 0.72), coreMaterial);
    arc.rotation.set(Math.PI / 2, 0, index * 2.15);
    arc.position.y = index * 0.12;
    coreField.add(arc);
  }
  const coreTicks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.015, 0.045, 0.095), coreMaterial, 36);
  coreField.add(coreTicks);
  for (let index = 0; index < 36; index++) {
    const angle = (index / 36) * TAU;
    matrix.position.set(Math.sin(angle) * 1.88, 0.05, Math.cos(angle) * 1.88);
    matrix.rotation.set(0, angle, 0);
    matrix.scale.set(1, 1, index % 3 === 0 ? 1.65 : 0.7);
    matrix.updateMatrix();
    coreTicks.setMatrixAt(index, matrix.matrix);
  }
  const commandField = new THREE.Group();
  commandField.position.set(0, 2.03, 3.45);
  add(commandField, "Human command aperture");
  for (let index = 0; index < 3; index++) {
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(0.8 + index * 0.16, 0.012, 4, 32, Math.PI * 0.78),
      commandMaterial,
    );
    arc.rotation.set(Math.PI / 2, 0, index * (TAU / 3));
    arc.position.y = index * 0.018;
    commandField.add(arc);
  }
  const commandTicks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.025, 0.12, 0.065), commandMaterial, 12);
  commandField.add(commandTicks);

  // The separate relay emits a quiet wave only while cloud requests have a permitted route.
  const relayField = new THREE.Group();
  relayField.position.set(10.1, 2.55, -5.6);
  add(relayField, "External relay waves");
  for (let index = 0; index < 3; index++) {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(0.94 + index * 0.24, 0.013, 4, 42, TAU * 0.64), relayMaterial);
    arc.rotation.set(Math.PI / 2, 0, index * 2.1);
    arc.position.y = index * 0.07;
    relayField.add(arc);
  }

  // Decorative energy never changes a camera's framing, shadows, pointer targets or route totals.
  group.traverse((object) => {
    object.userData.excludeFromFraming = true;
    if (object instanceof THREE.InstancedMesh) {
      object.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      object.frustumCulled = false;
    }
  });
  let phase = 0;
  let sectionZ = 9.2;
  let sectionProgress = 0;
  let flow: EnergyFlow = { local: 12, cloud: 0, held: 0 };
  const paint = () => {
    // A single restrained aperture response follows the inspection edge, then settles.
    // Endpoint-only updates under reduced motion show the same quiet finished state.
    const inspection = Math.sin(Math.PI * THREE.MathUtils.clamp((sectionProgress - 0.55) / 0.45, 0, 1));
    coreField.scale.setScalar(1 + inspection * 0.035);
    coreMaterial.opacity = 0.14 + (flow.local / 12) * (0.29 + inspection * 0.12);
    for (let index = 0; index < diamonds.count; index++) {
      const engine = Math.floor(index / 4);
      const order = index % 4;
      const size = engineScale[engine];
      const breathing = 1 + Math.sin(phase * 2.2 - order * 0.9 + engine) * 0.08;
      const radius = (0.19 - order * 0.032) * size * breathing;
      matrix.position.set(engineX[engine], -0.14, -7.8 - order * 0.49 * size);
      matrix.rotation.set(0, 0, phase * 0.16 + order * 0.4);
      matrix.scale.set(radius, radius, (0.29 - order * 0.03) * size);
      matrix.updateMatrix();
      diamonds.setMatrixAt(index, matrix.matrix);
    }
    diamonds.instanceMatrix.needsUpdate = true;
    for (let index = 0; index < wake.count; index++) {
      const engine = Math.floor(index / 16);
      const order = index % 16;
      const travel = (((order / 16 + phase * 0.32) % 1) + 1) % 1;
      const angle = order * 2.39996 + engine;
      const radius = (0.055 + travel * 0.19) * engineScale[engine];
      const fade = Math.sin(travel * Math.PI);
      matrix.position.set(
        engineX[engine] + Math.sin(angle) * radius,
        -0.14 + Math.cos(angle) * radius,
        -7.7 - travel * 3.15 * engineScale[engine],
      );
      matrix.rotation.set(0, 0, 0);
      matrix.scale.set(0.014 * fade, 0.014 * fade, (0.09 + travel * 0.26) * fade);
      matrix.updateMatrix();
      wake.setMatrixAt(index, matrix.matrix);
    }
    wake.instanceMatrix.needsUpdate = true;
    for (let index = 0; index < runners.count; index++) {
      const pathIndex = Math.floor(index / 3);
      const progress = (phase * 0.13 + (index % 3) / 3) % 1;
      paths[pathIndex].getPoint(progress, point);
      paths[pathIndex].getTangent(progress, tangent);
      matrix.position.copy(point);
      matrix.quaternion.setFromUnitVectors(forward, tangent);
      // The swept-wing armor runners disappear with the physical panel under inspection.
      const hidden = pathIndex % 3 === 0 && sectionProgress > 0 && point.z > sectionZ;
      matrix.scale.setScalar(hidden ? 0 : 1);
      matrix.updateMatrix();
      runners.setMatrixAt(index, matrix.matrix);
    }
    runners.instanceMatrix.needsUpdate = true;
    bayRunners.visible = sectionProgress > 0;
    for (let index = 0; index < bayRunners.count; index++) {
      const side = index < 12 ? -1 : 1;
      const progress = (phase * 0.18 + (index % 12) / 12) % 1;
      const z = 1.8 - progress * 4.4;
      matrix.position.set(side * 0.37, 0.135, z);
      matrix.rotation.set(0, 0, 0);
      matrix.scale.setScalar(z > sectionZ && flow.local > 0 ? 1 : 0);
      matrix.updateMatrix();
      bayRunners.setMatrixAt(index, matrix.matrix);
    }
    bayRunners.instanceMatrix.needsUpdate = true;
    coreField.rotation.y = phase * 0.07;
    commandField.rotation.y = -phase * 0.055;
    relayField.rotation.y = phase * 0.09;
    relayField.visible = flow.cloud > 0;
    for (let index = 0; index < commandTicks.count; index++) {
      const angle = (index / 12) * TAU;
      matrix.position.set(Math.sin(angle) * 1.23, 0, Math.cos(angle) * 1.23);
      matrix.rotation.set(0, angle, 0);
      // Twelve ticks echo the twelve requests. Coral indicates held requests, never successful egress.
      matrix.scale.set(1, index < flow.held ? 1.45 : 0.55, 1);
      matrix.updateMatrix();
      commandTicks.setMatrixAt(index, matrix.matrix);
      commandTicks.setColorAt(index, color.set(index < flow.held ? 0xff967f : 0xffe1a7));
    }
    commandTicks.instanceMatrix.needsUpdate = true;
    if (commandTicks.instanceColor) commandTicks.instanceColor.needsUpdate = true;
  };
  paint();
  return {
    group,
    animate(nextPhase: number) {
      phase = nextPhase;
      paint();
    },
    setSection(z: number, progress: number) {
      sectionZ = z;
      sectionProgress = progress;
      paint();
    },
    setFlow(next: EnergyFlow) {
      flow = next;
      bayMaterial.opacity = 0.28 + (flow.local / 12) * 0.56;
      relayMaterial.opacity = 0.16 + (flow.cloud / 12) * 0.24;
      paint();
    },
  };
}
