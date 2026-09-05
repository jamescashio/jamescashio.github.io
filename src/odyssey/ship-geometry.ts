import * as THREE from "three";

export type ShipZone = "local" | "cloud" | "human";

/** Original procedural carrier. Every surface is local geometry, with no model or image downloads. */
export function createExplorationCarrier() {
  const group = new THREE.Group();
  const armor = new THREE.Group();
  group.add(armor);
  const inspected: THREE.Object3D[] = [];
  const standard = (color: number, metalness = 0.7, roughness = 0.3) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const ivory = standard(0xb5ad9d, 0.78, 0.28);
  const pearl = standard(0xd7cfc0, 0.7, 0.24);
  const titanium = standard(0x596572, 0.84, 0.3);
  const graphite = standard(0x101b26, 0.65, 0.37);
  const gold = standard(0xc2934f, 0.8, 0.25);
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x071723,
    metalness: 0.6,
    roughness: 0.13,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
  });
  const cyan = new THREE.MeshBasicMaterial({ color: 0x77e7e7, toneMapped: false });
  const warm = new THREE.MeshBasicMaterial({ color: 0xffd59a, toneMapped: false });
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const detailBatches = new Map<THREE.Group, Map<THREE.Material, THREE.BufferGeometry[]>>();
  const transform = new THREE.Object3D();
  const add = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: [number, number, number] = [0, 0, 0],
    parent = group,
    zone?: ShipZone,
  ) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    parent.add(mesh);
    if (zone) {
      mesh.userData.zone = zone;
      inspected.push(mesh);
    }
    return mesh;
  };
  const detail = (
    size: [number, number, number],
    position: [number, number, number],
    material: THREE.Material,
    parent = group,
    rotation: [number, number, number] = [0, 0, 0],
  ) => {
    transform.position.set(...position);
    transform.rotation.set(...rotation);
    transform.scale.set(...size);
    transform.updateMatrix();
    const geometry = unit.clone().applyMatrix4(transform.matrix);
    if (!detailBatches.has(parent)) detailBatches.set(parent, new Map());
    const batch = detailBatches.get(parent)!;
    if (!batch.has(material)) batch.set(material, []);
    batch.get(material)!.push(geometry);
  };
  type Section = [z: number, width: number, height: number, center?: number];
  const loft = (sections: Section[], faces: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8]) => {
    const contour = [
      [1, 0],
      [0.72, 0.72],
      [0.38, 1],
      [-0.38, 1],
      [-0.72, 0.72],
      [-1, 0],
      [-0.65, -0.62],
      [0, -1],
      [0.65, -0.62],
    ];
    const vertices: number[] = [];
    const point = (section: Section, side: number) => {
      const [x, y] = contour[side % contour.length];
      return [x * section[1], y * section[2] + (section[3] || 0), section[0]];
    };
    const triangle = (a: number[], b: number[], c: number[]) => vertices.push(...a, ...b, ...c);
    for (let row = 0; row < sections.length - 1; row++) {
      for (const side of faces) {
        const a = point(sections[row], side);
        const b = point(sections[row], side + 1);
        const c = point(sections[row + 1], side);
        const d = point(sections[row + 1], side + 1);
        triangle(a, c, b);
        triangle(b, c, d);
      }
    }
    for (const side of faces) {
      const first = sections[0],
        end = sections[sections.length - 1];
      triangle([0, first[3] || 0, first[0]], point(first, side), point(first, side + 1));
      triangle([0, end[3] || 0, end[0]], point(end, side + 1), point(end, side));
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.computeVertexNormals();
    return geometry;
  };
  const plate = (
    points: number[][],
    y: number,
    thickness: number,
    material: THREE.Material,
    parent = armor,
    zone?: ShipZone,
  ) => {
    const shape = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, -z)));
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
    geometry.rotateX(-Math.PI / 2);
    return add(geometry, material, [0, y, 0], parent, zone);
  };
  const ring = (
    radius: number,
    tube: number,
    material: THREE.Material,
    position: [number, number, number],
    parent = group,
  ) => add(new THREE.TorusGeometry(radius, tube, 8, 64), material, position, parent);
  const seam = (points: number[][], material: THREE.Material, parent = armor, radius = 0.023) => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...(p as [number, number, number]))));
    return add(new THREE.TubeGeometry(curve, points.length * 8, radius, 4, false), material, [0, 0, 0], parent);
  };

  // A nine-facet continuous keel, with genuinely removable dorsal armor.
  const hull: Section[] = [
    [8.9, 0.035, 0.045],
    [7.4, 0.66, 0.22],
    [5.5, 1.46, 0.44],
    [2.8, 2.2, 0.62],
    [-0.7, 2.5, 0.66],
    [-3.6, 2.15, 0.48],
    [-6.9, 1.65, 0.36],
    [-7.3, 1.38, 0.3],
  ];
  hull.forEach((section) => {
    section[2] *= 1.5;
  });
  add(loft(hull, [5, 6, 7, 8]), titanium);
  add(loft(hull, [0, 1, 2, 3, 4]), ivory, [0, 0, 0], armor, "local");
  add(loft(hull.map(([z, w, h]) => [z, w * 0.62, h * 0.6, -0.32])), graphite);
  plate(
    [
      [-0.48, 7.65],
      [0, 8.7],
      [0.48, 7.65],
      [0.88, 5.3],
      [0.45, 5.8],
      [-0.45, 5.8],
      [-0.88, 5.3],
    ],
    0.23,
    0.075,
    pearl,
  );

  const dorsal: Section[] = [
    [6.3, 0.06, 0.08, 0.35],
    [4.7, 1.04, 0.22, 0.85],
    [2.6, 1.52, 0.45, 1.0],
    [-0.8, 1.64, 0.57, 0.95],
    [-3.3, 1.34, 0.45, 0.9],
    [-5.7, 0.67, 0.24, 0.65],
  ];
  add(loft(dorsal), pearl, [0, 0, 0], armor, "local");
  for (const side of [-1, 1]) {
    seam(
      dorsal.slice(1).map(([z, w, h, y]) => [side * w * 0.74, (y || 0) + h * 0.74 + 0.018, z]),
      gold,
      armor,
      0.025,
    );
    // Stepped cheek panels carry dark joints, raised armor and inset light channels.
    for (let row = 0; row < 5; row++) {
      const z = 2.0 - row * 1.25,
        w = 1.62 - row * 0.08,
        y = 0.91 - row * 0.038;
      plate(
        [
          [side * (w - 0.06), z + 0.38],
          [side * (w + 0.38), z + 0.13],
          [side * (w + 0.26), z - 0.48],
          [side * (w - 0.19), z - 0.31],
        ],
        y,
        0.1,
        titanium,
      );
      seam(
        [
          [side * (w + 0.32), y + 0.125, z + 0.09],
          [side * (w + 0.23), y + 0.125, z - 0.34],
        ],
        cyan,
        armor,
        0.017,
      );
      for (let rivet = 0; rivet < 3; rivet++)
        detail([0.025, 0.025, 0.025], [side * (w + 0.015), y + 0.15, z + 0.15 - rivet * 0.17], gold, armor);
    }
  }
  for (const side of [-1, 1]) {
    const mirror = (points: number[][]) => points.map(([x, z]) => [x * side, z]);
    // The two swept prongs have a structural slot that reads through the silhouette.
    plate(
      mirror([
        [1.8, 3.4],
        [4.9, 0.65],
        [7.45, -4.9],
        [6.55, -6.45],
        [3.9, -4.45],
        [1.85, -5.8],
      ]),
      -0.24,
      0.25,
      titanium,
      group,
    );
    plate(
      mirror([
        [2.15, 2.8],
        [4.55, 0.52],
        [6.98, -4.6],
        [6.48, -5.35],
        [4.08, -3.79],
        [2.09, -4.66],
      ]),
      0.015,
      0.13,
      ivory,
    );
    plate(
      mirror([
        [3.05, 1.08],
        [4.5, -0.23],
        [5.93, -3.28],
        [5.28, -3.7],
        [3.85, -1.84],
      ]),
      0.15,
      0.045,
      gold,
    );
    plate(
      mirror([
        [2.22, -0.1],
        [3.66, -1.66],
        [4.45, -3.77],
        [3.47, -3.48],
        [2.11, -2.6],
      ]),
      0.17,
      0.075,
      graphite,
    );
    plate(
      mirror([
        [5.12, -0.4],
        [5.61, -0.76],
        [7.21, -4.85],
        [6.65, -5.7],
        [6.19, -4.63],
      ]),
      -0.005,
      0.26,
      pearl,
    );
    seam(
      [
        [side * 2.34, 0.21, 2.45],
        [side * 4.56, 0.23, 0.18],
        [side * 6.45, 0.25, -4.17],
      ],
      warm,
    );
    seam(
      [
        [side * 2.03, 0.25, -1.12],
        [side * 3.75, 0.28, -2.52],
        [side * 5.13, 0.27, -4.2],
      ],
      cyan,
      group,
      0.017,
    );
    const pod = loft([
      [1.1, 0.055, 0.06],
      [-0.6, 0.47, 0.25],
      [-4.85, 0.65, 0.48],
      [-7.05, 0.54, 0.37],
      [-7.42, 0.42, 0.3],
    ]);
    add(pod, ivory, [side * 5.8, -0.12, 0]);
    const podSpine = loft([
      [-0.6, 0.13, 0.04],
      [-2.8, 0.22, 0.13],
      [-6.7, 0.21, 0.1],
    ]);
    add(podSpine, gold, [side * 5.8, 0.32, 0]);
    seam(
      [
        [side * 5.46, 0.15, -1.8],
        [side * 5.28, 0.15, -4.7],
        [side * 5.35, 0.11, -6.78],
      ],
      cyan,
      group,
      0.019,
    );
    for (let i = 0; i < 10; i++) {
      detail([0.42, 0.065, 0.072], [side * 5.8, 0.33, -3.0 - i * 0.27], graphite);
      detail([0.075, 0.042, 0.065], [side * 5.38, 0.28, -3.0 - i * 0.27], warm);
    }
    // Gold chine follows the taper, with a dark seam beneath the upper shell.
    seam(
      hull.slice(1, -1).map(([z, w, h]) => [side * w * 0.73, h * 0.74 + 0.018, z]),
      gold,
      armor,
      0.028,
    );
    seam(
      hull.slice(2, -1).map(([z, w]) => [side * w * 0.99, 0.018, z]),
      cyan,
      group,
      0.018,
    );
    for (let row = 0; row < 23; row++) {
      const z = 4.5 - row * 0.4;
      const width = z > 2.8 ? 1.72 : z > -0.7 ? 2.18 : 1.98;
      detail([0.065, 0.06, 0.18], [side * width, 0.25, z], row % 5 === 0 ? warm : cyan);
      if (row % 2 === 0) detail([0.14, 0.1, 0.035], [side * (width + 0.06), 0.06, z], titanium);
    }
    // Topside armor panel gaps and ventilation ribs are deliberately batched.
    for (let row = 0; row < 8; row++) {
      detail([0.65, 0.024, 0.045], [side * 1.46, 0.57 - row * 0.018, -2.0 - row * 0.4], graphite, armor, [
        0,
        side * 0.18,
        0,
      ]);
      detail([0.042, 0.09, 0.75], [side * (0.68 + row * 0.125), -0.01, -2.95], titanium);
    }
    // Physical inner AI drawers stay present when the armor lifts away.
    for (let row = 0; row < 9; row++) {
      detail([0.49, 0.24, 0.3], [side * 0.97, 0.02, 1.45 - row * 0.47], graphite);
      detail([0.46, 0.035, 0.025], [side * 0.97, 0.16, 1.59 - row * 0.47], cyan);
      detail([0.07, 0.17, 0.29], [side * 1.21, 0.07, 1.45 - row * 0.47], gold);
    }
  }

  // Recessed, sloping command canopy, a separate forward authority zone.
  const bridge = new THREE.Group();
  bridge.position.y = 0.8;
  group.add(bridge);
  const bridgeHull: Section[] = [
    [5.7, 0.06, 0.055, 0.45],
    [4.6, 0.6, 0.31, 0.56],
    [2.7, 0.82, 0.32, 0.67],
    [1.95, 0.62, 0.17, 0.65],
  ];
  add(loft(bridgeHull), graphite, [0, 0, 0], bridge, "human");
  add(
    loft(
      bridgeHull.map(([z, w, h, y]) => [z - 0.05, w * 0.83, h * 0.87, (y || 0) + 0.042]),
      [0, 1, 2, 3, 4],
    ),
    glass,
    [0, 0, 0],
    bridge,
    "human",
  );
  for (const side of [-1, 1]) {
    seam(
      [
        [side * 0.04, 0.53, 5.63],
        [side * 0.43, 0.84, 4.6],
        [side * 0.6, 0.98, 2.7],
        [side * 0.44, 0.83, 1.99],
      ],
      gold,
      bridge,
      0.042,
    );
    for (let i = 0; i < 3; i++)
      detail([0.075, 0.052, 0.53], [side * 0.32, 0.87 + i * 0.034, 4.08 - i * 0.48], titanium, bridge, [0.055, 0, 0]);
  }
  seam(
    [
      [0, 0.59, 5.48],
      [0, 0.93, 4.35],
      [0, 1.045, 2.7],
      [0, 0.86, 2.04],
    ],
    pearl,
    bridge,
    0.049,
  );
  detail([0.86, 0.046, 0.04], [0, 0.92, 3.98], warm, bridge);

  // Bit reactor: a visible faceted heart surrounded by real intersecting rings.
  const reactor = new THREE.Group();
  reactor.position.set(0, 1.6, -1.15);
  group.add(reactor);
  const base = add(new THREE.CylinderGeometry(0.83, 1.05, 0.23, 12), graphite, [0, -0.34, 0], reactor, "local");
  base.rotation.y = Math.PI / 12;
  const core = add(new THREE.IcosahedronGeometry(0.61, 0), gold, [0, 0.46, 0], reactor, "local");
  core.rotation.set(0.19, 0.32, 0.05);
  core.add(
    new THREE.LineSegments(
      new THREE.EdgesGeometry(core.geometry),
      new THREE.LineBasicMaterial({ color: 0xffdda4, transparent: true, opacity: 0.8 }),
    ),
  );
  const coreRings = [
    ring(1.06, 0.044, gold, [0, 0.4, 0], reactor),
    ring(1.26, 0.025, titanium, [0, 0.4, 0], reactor),
    ring(1.24, 0.014, cyan, [0, 0.4, 0], reactor),
  ];
  coreRings[0].rotation.set(1.09, 0.3, 0.12);
  coreRings[1].rotation.set(0.26, 0.77, 0.6);
  coreRings[2].rotation.copy(coreRings[1].rotation);
  ring(0.82, 0.026, warm, [0, -0.2, 0], reactor).rotation.x = Math.PI / 2;
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    detail([0.11, 0.29, 0.19], [Math.sin(angle) * 0.82, 1.19, -1.15 + Math.cos(angle) * 0.82], titanium, group, [
      0,
      angle,
      0,
    ]);
  }
  seam(
    [
      [0, -0.02, 2.2],
      [0, 0.08, 0.6],
      [0, 0.08, -1.1],
      [0, -0.03, -4.9],
    ],
    cyan,
    group,
    0.048,
  );
  // Aft spine and radiator assemblies give the carrier a purposeful machine scale.
  add(
    loft([
      [-3.3, 0.35, 0.09, 0.44],
      [-4.8, 0.53, 0.25, 0.48],
      [-6.8, 0.4, 0.16, 0.37],
    ]),
    gold,
  );
  for (const side of [-1, 1]) {
    detail([0.66, 0.08, 2.58], [side * 1.13, 0.34, -5.24], graphite);
    for (let i = 0; i < 13; i++) detail([0.54, 0.075, 0.055], [side * 1.13, 0.405, -4.12 - i * 0.19], titanium);
    for (const edge of [-1, 1]) detail([0.06, 0.15, 2.67], [side * 1.13 + edge * 0.35, 0.41, -5.24], gold);
    plate(
      [
        [side * 1.2, -5.15],
        [side * 1.75, -5.86],
        [side * 1.43, -7.0],
        [side * 0.93, -6.58],
      ],
      0.37,
      0.13,
      pearl,
      group,
    );
  }

  const plumes: THREE.Mesh[] = [];
  for (const [x, scale] of [
    [-5.8, 0.82],
    [-0.82, 1.05],
    [0.82, 1.05],
    [5.8, 0.82],
  ]) {
    const nozzle = new THREE.Group();
    nozzle.position.set(x, -0.14, -7.17);
    group.add(nozzle);
    const casing = add(
      new THREE.CylinderGeometry(0.51 * scale, 0.62 * scale, 0.54, 12, 1, true),
      titanium,
      [0, 0, 0],
      nozzle,
    );
    casing.rotation.x = Math.PI / 2;
    ring(0.51 * scale, 0.085 * scale, gold, [0, 0, -0.31], nozzle);
    ring(0.36 * scale, 0.052 * scale, cyan, [0, 0, -0.325], nozzle);
    add(new THREE.CircleGeometry(0.365 * scale, 32), graphite, [0, 0, -0.28], nozzle).rotation.y = Math.PI;
    const throat = add(new THREE.CircleGeometry(0.265 * scale, 32), cyan, [0, 0, -0.34], nozzle);
    throat.rotation.y = Math.PI;
    for (let rib = 0; rib < 8; rib++) {
      const angle = (rib * Math.PI) / 4;
      detail(
        [0.07, 0.08, 0.49],
        [x + Math.sin(angle) * 0.51 * scale, -0.14 + Math.cos(angle) * 0.51 * scale, -7.12],
        ivory,
        group,
        [0, 0, -angle],
      );
    }
    const plumeMaterial = new THREE.MeshBasicMaterial({
      color: 0x60dff4,
      transparent: true,
      opacity: 0.29,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const plume = add(
      new THREE.ConeGeometry(0.33 * scale, 2.8 * scale, 24, 1, true),
      plumeMaterial,
      [0, 0, -1.66 * scale],
      nozzle,
    );
    plume.rotation.x = -Math.PI / 2;
    plumes.push(plume);
    const inner = add(
      new THREE.ConeGeometry(0.18 * scale, 1.85 * scale, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xb9f9ff,
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
      [0, 0, -1.17 * scale],
      nozzle,
    );
    inner.rotation.x = -Math.PI / 2;
  }

  // A physically separate gold relay, deliberately outside the ship's owned boundary.
  const relay = new THREE.Group();
  relay.position.set(10.1, 2.1, -5.6);
  relay.rotation.set(0.13, -0.27, -0.18);
  group.add(relay);
  add(new THREE.OctahedronGeometry(0.59, 0), gold, [0, 0, 0], relay, "cloud");
  ring(0.79, 0.055, gold, [0, 0, 0], relay).rotation.x = Math.PI / 2;
  ring(0.81, 0.019, warm, [0, 0.025, 0], relay).rotation.x = Math.PI / 2;
  for (const side of [-1, 1]) {
    detail([1.7, 0.055, 1.1], [side * 1.65, 0, 0], graphite, relay);
    detail([2.15, 0.07, 0.06], [side * 1.4, 0.06, -0.58], gold, relay);
    detail([2.15, 0.07, 0.06], [side * 1.4, 0.06, 0.58], gold, relay);
    for (let i = 0; i < 6; i++) detail([0.018, 0.018, 1.07], [side * (0.84 + i * 0.32), 0.04, 0], warm, relay);
    detail([1.6, 0.1, 0.08], [side * 1.02, -0.04, 0], titanium, relay);
  }
  const dishPoints = Array.from({ length: 12 }, (_, i) => {
    const radius = 0.07 + i * 0.061;
    return new THREE.Vector2(radius, radius * radius * 0.75);
  });
  const dish = add(
    new THREE.LatheGeometry(dishPoints, 32),
    new THREE.MeshStandardMaterial({ color: 0xc9a76e, metalness: 0.85, roughness: 0.31, side: THREE.DoubleSide }),
    [0, 0.42, 0],
    relay,
    "cloud",
  );
  dish.rotation.z = -0.3;
  detail([0.055, 0.67, 0.055], [0.1, 1, 0], titanium, relay);
  add(new THREE.IcosahedronGeometry(0.08, 0), warm, [0.1, 1.36, 0], relay);

  const selections: Record<ShipZone, THREE.Mesh> = {
    local: ring(1.5, 0.025, cyan, [0, 1.94, -1.15]),
    human: ring(1.09, 0.026, warm, [0, 2.03, 3.45]),
    cloud: ring(1.15, 0.024, warm, [0, 0.14, 0], relay),
  };
  Object.values(selections).forEach((mesh) => {
    mesh.rotation.x = Math.PI / 2;
    mesh.visible = false;
  });

  // Merge hundreds of tiny panel details by material, retaining proper normals.
  for (const [parent, batches] of detailBatches) {
    for (const [material, geometries] of batches) {
      const positions: number[] = [],
        normals: number[] = [];
      for (const indexed of geometries) {
        const geometry = indexed.index ? indexed.toNonIndexed() : indexed;
        positions.push(...geometry.getAttribute("position").array);
        normals.push(...geometry.getAttribute("normal").array);
        geometry.dispose();
        if (geometry !== indexed) indexed.dispose();
      }
      const merged = new THREE.BufferGeometry();
      merged.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      merged.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
      add(merged, material, [0, 0, 0], parent);
    }
  }
  unit.dispose();
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const material = object.material;
    if (material instanceof THREE.MeshStandardMaterial) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  core.castShadow = false;
  coreRings.forEach((mesh) => {
    mesh.castShadow = false;
  });
  // Every material is attached to a scene object, allowing one traversal to own disposal.
  return {
    group,
    inspected,
    setCutaway(enabled: boolean) {
      armor.visible = !enabled;
    },
    select(zone: ShipZone) {
      Object.entries(selections).forEach(([name, mesh]) => {
        mesh.visible = name === zone;
      });
    },
    animate(phase: number) {
      core.rotation.y = 0.32 + phase * 0.12;
      coreRings[0].rotation.z = 0.12 + phase * 0.06;
      plumes.forEach((plume, index) => {
        plume.scale.y = 1 + Math.sin(phase * 1.5 + index) * 0.065;
      });
    },
  };
}
