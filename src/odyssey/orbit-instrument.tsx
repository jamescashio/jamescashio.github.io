import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

type Vector = [number, number, number];
type Material = "titanium" | "carbon" | "copper" | "core" | "light" | "solar" | "ember" | "gold" | "glass";
type Face = { points: Vector[]; material: Material; edge?: boolean; alpha?: number; group?: number };
type InstrumentState = {
  yaw: number;
  pitch: number;
  roll: number;
  phase: number;
  preset: number;
  flow: boolean;
  emphasis: Vector;
};
type Controls = {
  render: () => void;
  setOrbit: (playing: boolean) => void;
  setMotion: (enabled: boolean) => void;
  moveTo: (state: InstrumentState, animate: boolean) => void;
  available: () => boolean;
};

const TAU = Math.PI * 2;
const HOME = { yaw: -0.44, pitch: 0.42, roll: -0.25 };
const MISSIONS = [
  {
    id: "observe",
    title: "Observe",
    number: "01",
    heading: "Begin with a clear signal.",
    copy: "Separate what is known from what is assumed. A useful system makes its evidence visible before it asks for trust.",
    principle: "Evidence before inference",
    detail: "The outer ring represents the boundary of what can be observed.",
    angles: HOME,
  },
  {
    id: "route",
    title: "Route",
    number: "02",
    heading: "Give every decision a path.",
    copy: "Match the work to the right capability. Privacy, task fit, and uncertainty shape the route; quality comes first.",
    principle: "Intent → qualification → choice",
    detail: "The intersecting orbital planes represent distinct paths to a shared outcome.",
    angles: { yaw: 0.64, pitch: -0.18, roll: 0.22 },
  },
  {
    id: "verify",
    title: "Verify",
    number: "03",
    heading: "Keep a human at the center.",
    copy: "An answer is the beginning of a review. Check the source, expose uncertainty, and make the consequential decision deliberately.",
    principle: "Source → review → accountable action",
    detail: "The faceted core represents the human decision that the system supports.",
    angles: { yaw: -0.14, pitch: -0.62, roll: -0.5 },
  },
] as const;

function rotate(point: Vector, x: number, y: number, z: number): Vector {
  const a = point[1] * Math.cos(x) - point[2] * Math.sin(x);
  const b = point[1] * Math.sin(x) + point[2] * Math.cos(x);
  const c = point[0] * Math.cos(y) + b * Math.sin(y);
  const d = -point[0] * Math.sin(y) + b * Math.cos(y);
  return [c * Math.cos(z) - a * Math.sin(z), c * Math.sin(z) + a * Math.cos(z), d];
}

function normal(points: Vector[]): Vector {
  const a = points[0],
    b = points[1],
    c = points[2];
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n: Vector = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const length = Math.hypot(...n) || 1;
  return n.map((value) => value / length) as Vector;
}

function annulus(
  outer: number,
  inner: number,
  depth: number,
  turns: Vector,
  material: Material,
  gap: number,
  phase = 0,
): Face[] {
  const faces: Face[] = [];
  const count = 72;
  const point = (r: number, a: number, z: number) => rotate([Math.cos(a) * r, Math.sin(a) * r, z], ...turns);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU + phase;
    if (i > count * (1 - gap)) continue;
    const b = ((i + 1) / count) * TAU + phase - 0.0012;
    const front = [point(outer, a, depth), point(outer, b, depth), point(inner, b, depth), point(inner, a, depth)];
    const back = [point(outer, a, -depth), point(inner, a, -depth), point(inner, b, -depth), point(outer, b, -depth)];
    faces.push({ points: front, material, edge: i % 6 === 0 });
    faces.push({ points: back, material: "carbon" });
    faces.push({ points: [front[0], back[0], back[3], front[1]], material: "carbon", edge: true });
    faces.push({
      points: [front[3], front[2], back[2], back[1]],
      material: material === "copper" ? "copper" : "titanium",
    });
    if (i === 0) {
      faces.push({ points: [front[0], front[3], back[1], back[0]], material: "titanium", edge: true });
    }
    if (i === Math.floor(count * (1 - gap))) {
      faces.push({ points: [front[1], back[3], back[2], front[2]], material: "titanium", edge: true });
    }
    if (outer > 1.6) {
      // A bevel catches a different light angle; the cyan channel sits inside its lip.
      const lip = outer - 0.025;
      faces.push({
        points: [
          point(outer, a, depth - 0.035),
          point(outer, b, depth - 0.035),
          point(lip, b, depth + 0.007),
          point(lip, a, depth + 0.007),
        ],
        material: "gold",
      });
      faces.push({
        points: [
          point(inner + 0.026, a, depth + 0.008),
          point(inner + 0.026, b, depth + 0.008),
          point(inner, b, depth - 0.02),
          point(inner, a, depth - 0.02),
        ],
        material: "titanium",
      });
      faces.push({
        points: [
          point(inner + 0.057, a, depth + 0.009),
          point(inner + 0.057, b, depth + 0.009),
          point(inner + 0.045, b, depth + 0.009),
          point(inner + 0.045, a, depth + 0.009),
        ],
        material: "glass",
      });
    }
    if (outer > 1.6 && i % 6 === 0) {
      const ra = a + 0.006,
        rb = a + 0.019;
      faces.push({
        points: [
          point(outer - 0.025, ra, depth + 0.007),
          point(outer - 0.025, rb, depth + 0.007),
          point(inner + 0.025, rb, depth + 0.007),
          point(inner + 0.025, ra, depth + 0.007),
        ],
        material: "gold",
      });
    }
  }
  return faces;
}

// Raised, beveled collars interrupt the silhouette without adding another renderer.
function dockingCollars(): Face[] {
  const faces: Face[] = [];
  for (let index = 0; index < 12; index++) {
    const angle = -0.7 + (index * TAU * 0.915) / 12 + 0.055;
    const point = (radius: number, offset: number, depth: number): Vector => [
      Math.cos(angle + offset) * radius,
      Math.sin(angle + offset) * radius,
      depth,
    ];
    const base = [
      point(1.94, -0.022, 0.088),
      point(1.94, 0.022, 0.088),
      point(1.72, 0.027, 0.088),
      point(1.72, -0.027, 0.088),
    ];
    const cap = [
      point(1.921, -0.014, 0.15),
      point(1.921, 0.014, 0.15),
      point(1.74, 0.016, 0.15),
      point(1.74, -0.016, 0.15),
    ];
    faces.push({ points: cap, material: "carbon", group: 0 });
    for (let edge = 0; edge < 4; edge++) {
      const next = (edge + 1) % 4;
      faces.push({
        points: [base[edge], base[next], cap[next], cap[edge]],
        material: edge % 2 ? "gold" : "titanium",
        group: 0,
      });
    }
    faces.push({
      points: [
        point(1.902, -0.005, 0.153),
        point(1.902, 0.005, 0.153),
        point(1.835, 0.005, 0.153),
        point(1.835, -0.005, 0.153),
      ],
      material: "light",
      group: 0,
    });
  }
  return faces;
}

function coreGeometry(phase: number): Face[] {
  const phi = (1 + Math.sqrt(5)) / 2;
  const vertices: Vector[] = [
    [-1, phi, 0],
    [1, phi, 0],
    [-1, -phi, 0],
    [1, -phi, 0],
    [0, -1, phi],
    [0, 1, phi],
    [0, -1, -phi],
    [0, 1, -phi],
    [phi, 0, -1],
    [phi, 0, 1],
    [-phi, 0, -1],
    [-phi, 0, 1],
  ];
  const indices = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1],
  ];
  const faces: Face[] = [];
  for (const triangle of indices) {
    const points = triangle.map((index) =>
      rotate(vertices[index].map((value) => value * 0.32) as Vector, 0.3, phase * 0.35 + 0.24, 0.14),
    );
    const center = points.reduce<Vector>(
      (sum, point) => [sum[0] + point[0] / 3, sum[1] + point[1] / 3, sum[2] + point[2] / 3],
      [0, 0, 0],
    );
    const inset = points.map(
      (point) => point.map((value, axis) => center[axis] * 1.055 + (value - center[axis]) * 0.81) as Vector,
    );
    faces.push({ points: inset, material: "core", group: 2 });
    for (let edge = 0; edge < 3; edge++) {
      const next = (edge + 1) % 3;
      faces.push({
        points: [points[edge], points[next], inset[next], inset[edge]],
        material: "gold",
        edge: true,
        group: 2,
      });
    }
    const jewel = inset.map(
      (point) => point.map((value, axis) => center[axis] * 1.065 + (value - center[axis] * 1.055) * 0.25) as Vector,
    );
    faces.push({ points: jewel, material: "glass", group: 2 });
  }
  return faces;
}

function materialColor(material: Material, n: Vector, emphasis: number, position: Vector): string {
  const key: Vector = [-3.4 - position[0] * 0.3, -4.6 - position[1] * 0.3, 5.2 - position[2] * 0.3];
  const length = Math.hypot(...key);
  const light = Math.max(
    0,
    n.reduce((sum, value, index) => sum + (value * key[index]) / length, 0),
  );
  const cool = Math.max(0, n[0] * 0.68 + n[1] * -0.2 + n[2] * 0.7);
  const rim = Math.pow(Math.max(0, n[0] * -0.28 + n[1] * -0.35 + n[2] * 0.88), 22);
  const viewLength = Math.hypot(position[0], position[1], 7.5 - position[2]);
  const half: Vector = [
    key[0] / length - position[0] / viewLength,
    key[1] / length - position[1] / viewLength,
    key[2] / length + (7.5 - position[2]) / viewLength,
  ];
  const halfLength = Math.hypot(...half);
  const reflection = Math.pow(
    Math.max(
      0,
      n.reduce((sum, value, index) => sum + (value * half[index]) / halfLength, 0),
    ),
    42,
  );
  const colors: Record<Material, Vector> = {
    titanium: [87, 114, 127],
    carbon: [15, 31, 43],
    copper: [176, 132, 75],
    core: [192, 135, 61],
    light: [119, 231, 231],
    solar: [255, 199, 127],
    ember: [250, 146, 122],
    gold: [225, 179, 106],
    glass: [26, 88, 102],
  };
  const base = colors[material];
  if (material === "light")
    return `rgb(${Math.round(65 + emphasis * 65)},${Math.round(156 + emphasis * 75)},${Math.round(177 + emphasis * 60)})`;
  if (material === "solar") return "#ffd7a0";
  if (material === "ember") return "#fa927a";
  const brightness = 0.22 + light * 0.78 + emphasis * 0.18;
  const specular = material === "carbon" ? 24 : material === "glass" ? 155 : 135;
  return `rgb(${base.map((value, index) => Math.min(255, Math.round(value * brightness + reflection * specular + rim * 45 + cool * [4, 17, 24][index]))).join(",")})`;
}

const OUTER_SHELL = [
  ...annulus(1.89, 1.62, 0.095, [0, 0, 0], "titanium", 0.085, -0.7).map((face) => ({ ...face, group: 0 })),
  ...dockingCollars(),
];

function energyTrail(radius: number, turns: Vector, phase: number, material: Material, depth = 0.043): Face[] {
  return Array.from({ length: 20 }, (_, index) => {
    const a = phase + index * 0.025,
      b = a + 0.026;
    const point = (r: number, angle: number) => rotate([Math.cos(angle) * r, Math.sin(angle) * r, depth], ...turns);
    return {
      points: [point(radius, a), point(radius, b), point(radius - 0.026, b), point(radius - 0.026, a)],
      material,
      alpha: Math.pow((index + 1) / 20, 1.7),
    };
  });
}

function paint(canvas: HTMLCanvasElement, state: InstrumentState, width: number, height: number) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx || width < 1 || height < 1) return;
  const dpr = canvas.width / width;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#050e17";
  ctx.fillRect(0, 0, width, height);
  const centerX = width * 0.5,
    centerY = height * 0.46;
  const scale = Math.min(width * 0.218, height * 0.25);
  const project = (point: Vector): [number, number] => {
    const perspective = 7.5 / (7.5 - point[2]);
    return [centerX + point[0] * scale * perspective, centerY + point[1] * scale * perspective];
  };
  const ambient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, scale * 2.4);
  ambient.addColorStop(0, "#162a30");
  ambient.addColorStop(0.28, "#0e222c");
  ambient.addColorStop(0.68, "#071723");
  ambient.addColorStop(1, "#050e17");
  ctx.fillStyle = ambient;
  ctx.fillRect(0, 0, width, height);
  // Fixed stars never reroll or shimmer when the instrument moves.
  for (let i = 0; i < 65; i++) {
    const x = (((i * 127.37 + 41.8) % 997) / 997) * width;
    const y = (((i * 79.71 + 93.2) % 701) / 701) * height;
    ctx.fillStyle = i % 7 === 0 ? "#a9ccd7" : "#385a71";
    ctx.fillRect(x, y, i % 7 === 0 ? 1.3 : 0.7, i % 7 === 0 ? 1.3 : 0.7);
  }
  ctx.strokeStyle = "rgba(119,231,231,.11)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(centerX, centerY, scale * 2.25, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([2, 7]);
  ctx.beginPath();
  ctx.arc(centerX, centerY, scale * 2.12, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * TAU;
    const inner = scale * (i % 5 === 0 ? 2.21 : 2.235),
      outer = scale * 2.25;
    ctx.strokeStyle = i % 5 === 0 ? "rgba(119,231,231,.4)" : "rgba(144,196,215,.17)";
    ctx.beginPath();
    ctx.moveTo(centerX + Math.cos(angle) * inner, centerY + Math.sin(angle) * inner);
    ctx.lineTo(centerX + Math.cos(angle) * outer, centerY + Math.sin(angle) * outer);
    ctx.stroke();
  }
  // A small orbital escort shares the instrument clock and its Energy control.
  // Draw it behind the physical rings so the core stays sharply resolved.
  if (state.flow) {
    for (let lane = 0; lane < 3; lane++) {
      const angle = state.phase * (lane === 1 ? -0.34 : 0.27) + (lane * TAU) / 3;
      const point = (a: number) =>
        project(rotate([Math.cos(a) * 2.035, Math.sin(a) * 2.035, 0], state.pitch, state.yaw, state.roll));
      const color = lane === 1 ? "255,211,150" : "125,235,238";
      for (let segment = 0; segment < 14; segment++) {
        const from = point(angle - segment * 0.017);
        const to = point(angle - (segment + 1) * 0.017);
        ctx.strokeStyle = `rgba(${color},${0.58 * (1 - segment / 14)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(...from);
        ctx.lineTo(...to);
        ctx.stroke();
      }
      const head = point(angle);
      const glow = ctx.createRadialGradient(...head, 0, ...head, 9);
      glow.addColorStop(0, `rgba(${color},.6)`);
      glow.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = glow;
      ctx.fillRect(head[0] - 9, head[1] - 9, 18, 18);
      ctx.fillStyle = `rgb(${color})`;
      ctx.beginPath();
      ctx.arc(...head, 1.6, 0, TAU);
      ctx.fill();
    }
  }
  const geometry = [
    ...OUTER_SHELL,
    ...annulus(1.51, 1.463, 0.023, [0.85, 0.33, state.phase * 0.12], "gold", 0.15, 0.42).map((face) => ({
      ...face,
      group: 1,
    })),
    ...annulus(1.17, 1.126, 0.019, [-0.6, 0.76, 0.3], "titanium", 0.12, state.phase * 0.16).map((face) => ({
      ...face,
      group: 1,
    })),
    ...coreGeometry(state.phase),
    ...energyTrail(1.674, [0, 0, 0], -1.05 + state.phase * 0.4, "light", 0.11).map((face) => ({
      ...face,
      group: 0,
      alpha: (face.alpha ?? 1) * (0.3 + state.emphasis[0] * 0.7),
    })),
    ...energyTrail(1.182, [-0.6, 0.76, 0.3], -0.1 - state.phase * 0.5, "light").map((face) => ({
      ...face,
      group: 1,
      alpha: (face.alpha ?? 1) * (0.35 + state.emphasis[1] * 0.65),
    })),
    ...(state.flow
      ? [
          ...energyTrail(1.517, [0.85, 0.33, state.phase * 0.12], state.phase * 1.5, "light"),
          ...energyTrail(1.18, [-0.6, 0.76, 0.3], -state.phase * 1.1 + 2, "solar"),
        ]
      : []),
  ];
  const transformed = geometry.map((face) => ({
    ...face,
    points: face.points.map((point) => rotate(point, state.pitch, state.yaw, state.roll)),
  }));
  transformed.sort(
    (a, b) =>
      a.points.reduce((sum, p) => sum + p[2], 0) / a.points.length -
      b.points.reduce((sum, p) => sum + p[2], 0) / b.points.length,
  );
  for (const face of transformed) {
    const n = normal(face.points);
    // All closed surfaces are depth-sorted; back-facing triangles do not bleed through the core.
    if (face.group === 2 && n[2] < 0) continue;
    const points = face.points.map(project);
    ctx.beginPath();
    ctx.moveTo(...points[0]);
    for (const point of points.slice(1)) ctx.lineTo(...point);
    ctx.closePath();
    const position = face.points.reduce<Vector>(
      (sum, point) => [
        sum[0] + point[0] / face.points.length,
        sum[1] + point[1] / face.points.length,
        sum[2] + point[2] / face.points.length,
      ],
      [0, 0, 0],
    );
    const emphasis = state.emphasis[face.group ?? 1];
    ctx.fillStyle = materialColor(face.material, n, emphasis, position);
    if (face.material === "core") {
      const highlight = ctx.createLinearGradient(points[0][0], points[0][1], points[1][0], points[1][1]);
      highlight.addColorStop(0, materialColor("core", n, emphasis, position));
      highlight.addColorStop(0.45, materialColor("gold", n, emphasis * 0.6, position));
      highlight.addColorStop(1, materialColor("core", n, emphasis * 0.25, position));
      ctx.fillStyle = highlight;
    }
    ctx.globalAlpha = face.alpha ?? 1;
    if (face.material === "light" || face.material === "ember") {
      ctx.shadowColor = face.material === "light" ? "#57e1ef" : "#fa927a";
      ctx.shadowBlur = 3 + emphasis * 3;
    }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    if (face.edge || face.material === "core") {
      ctx.strokeStyle = face.group === 2 ? "rgba(255,224,174,.4)" : "rgba(152,206,225,.16)";
      ctx.lineWidth = face.material === "core" ? 0.65 : 0.45;
      ctx.stroke();
    }
  }
  // Unobtrusive reference marks anchor the object without presenting invented telemetry.
  ctx.strokeStyle = "#648c9e";
  ctx.lineWidth = 0.8;
  const mark = (x: number, y: number) => {
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x + 4, y);
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x, y + 4);
    ctx.stroke();
  };
  mark(24, 24);
  mark(width - 24, 24);
  mark(24, height - 24);
  mark(width - 24, height - 24);
}

function InstrumentFallback() {
  return (
    <svg className="eh-orbit-fallback" viewBox="0 0 700 500" aria-hidden="true">
      <defs>
        <linearGradient id="eh-static-ring" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#a0c7d9" />
          <stop offset=".5" stopColor="#243e56" />
          <stop offset="1" stopColor="#6892a7" />
        </linearGradient>
      </defs>
      <g transform="translate(350 230) rotate(-22)">
        <ellipse rx="194" ry="176" fill="none" stroke="#142c41" strokeWidth="39" />
        <ellipse
          rx="194"
          ry="176"
          fill="none"
          stroke="url(#eh-static-ring)"
          strokeWidth="22"
          strokeDasharray="1080 90"
        />
        <ellipse rx="182" ry="164" fill="none" stroke="#77e7e7" strokeWidth="2" strokeDasharray="1010 90" />
        <ellipse rx="154" ry="84" fill="none" stroke="#83b4c6" strokeWidth="3" transform="rotate(30)" />
        <ellipse rx="120" ry="92" fill="none" stroke="#fa927a" strokeWidth="2" transform="rotate(-25)" />
        <path d="M0-52 48-10 31 44-31 44-48-10Z" fill="#ba8549" stroke="#f1d099" />
        <path d="M0-52 18-10 48-10 31 44 18-10-20 10-31 44-48-10-20 10Z" fill="#f0c784" stroke="#f6d89f" />
        <path d="M18-10-20 10 0-52Z" fill="#8a653c" />
      </g>
    </svg>
  );
}

export function OrbitInstrument({ motion, onSelect }: { motion: boolean; onSelect?: (id: string) => void }) {
  const id = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cinemaButtonRef = useRef<HTMLButtonElement>(null);
  const cinemaLock = useRef<{ bodyOverflow: string; rootOverflow: string; opener: HTMLElement | null } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scene = useRef<InstrumentState>({ ...HOME, phase: 0, preset: 0, flow: false, emphasis: [1, 0, 0] });
  const controls = useRef<Controls | null>(null);
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number; pointer: number } | null>(null);
  const [selected, setSelected] = useState(0);
  const [orbiting, setOrbiting] = useState(false);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("");
  const [cinema, setCinema] = useState(false);
  const [anchorHeight, setAnchorHeight] = useState(0);
  const mission = MISSIONS[selected];

  useEffect(
    () => () => {
      const lock = cinemaLock.current;
      if (lock) {
        document.body.style.overflow = lock.bodyOverflow;
        document.documentElement.style.overflow = lock.rootOverflow;
        cinemaLock.current = null;
      }
    },
    [],
  );

  const openCinema = () => {
    const dialog = dialogRef.current;
    if (!dialog || cinemaLock.current) return;
    setAnchorHeight(dialog.getBoundingClientRect().height);
    const lock = {
      bodyOverflow: document.body.style.overflow,
      rootOverflow: document.documentElement.style.overflow,
      opener: document.activeElement instanceof HTMLElement ? document.activeElement : null,
    };
    try {
      // The same open, non-modal dialog becomes modal without remounting any child.
      // Toggling the open property avoids queuing an unrelated close event.
      dialog.open = false;
      dialog.showModal();
      cinemaLock.current = lock;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      setCinema(true);
      cinemaButtonRef.current?.focus({ preventScroll: true });
      dialog.scrollTop = 0;
    } catch {
      dialog.open = true;
      setStatus("Cinema view is unavailable in this browser. The instrument still works here.");
    }
  };

  const finishCinema = () => {
    const dialog = dialogRef.current;
    const lock = cinemaLock.current;
    if (!dialog || !lock) return;
    cinemaLock.current = null;
    document.body.style.overflow = lock.bodyOverflow;
    document.documentElement.style.overflow = lock.rootOverflow;
    setCinema(false);
    dialog.show();
    dialog.scrollTop = 0;
    if (lock.opener?.isConnected) lock.opener.focus({ preventScroll: true });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext("2d")) return;
    let width = 0,
      height = 0,
      frame = 0,
      last = 0,
      lastPaint = 0,
      visible = false,
      playing = false,
      motionEnabled = true,
      disposed = false;
    let transition: { from: InstrumentState; to: InstrumentState; elapsed: number } | null = null;
    const canAnimate = () => (playing || transition !== null) && motionEnabled && visible && !document.hidden;
    const draw = (now: number) => {
      frame = 0;
      if (disposed || document.hidden || !visible) return;
      if (now - lastPaint < 1000 / 30) {
        frame = requestAnimationFrame(draw);
        return;
      }
      paint(canvas, scene.current, width, height);
      lastPaint = now;
    };
    const tick = (now: number) => {
      frame = 0;
      if (disposed || !canAnimate()) return;
      if (now - lastPaint >= 1000 / 30) {
        const elapsed = last ? Math.min(66, now - last) : 33;
        if (transition) {
          transition.elapsed += elapsed;
          const progress = Math.min(1, transition.elapsed / 860);
          const eased = progress * progress * (3 - 2 * progress);
          const { from, to } = transition;
          scene.current = {
            ...to,
            yaw: from.yaw + (to.yaw - from.yaw) * eased,
            pitch: from.pitch + (to.pitch - from.pitch) * eased,
            roll: from.roll + (to.roll - from.roll) * eased,
            phase: from.phase + (to.phase - from.phase) * eased,
            emphasis: from.emphasis.map((value, index) => value + (to.emphasis[index] - value) * eased) as Vector,
          };
          if (progress === 1) transition = null;
        } else if (playing) {
          scene.current.yaw += elapsed * 0.0001;
          scene.current.phase += elapsed * 0.0006;
        }
        paint(canvas, scene.current, width, height);
        last = now;
        lastPaint = now;
      }
      if (canAnimate()) frame = requestAnimationFrame(tick);
    };
    const schedule = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      if (!visible || document.hidden || disposed) return;
      frame = requestAnimationFrame(canAnimate() ? tick : draw);
    };
    const resize = new ResizeObserver(([entry]) => {
      width = Math.round(entry.contentRect.width);
      height = Math.round(entry.contentRect.height);
      const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(1_800_000 / Math.max(1, width * height)));
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      schedule();
    });
    const intersection = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        visible = entry.isIntersecting;
        if (visible) setReady(true);
        schedule();
      },
      { threshold: 0.01 },
    );
    controls.current = {
      render: () => {
        transition = null;
        schedule();
      },
      setOrbit: (next) => {
        if (next) transition = null;
        playing = next;
        scene.current.flow = next && motionEnabled;
        schedule();
      },
      setMotion: (enabled) => {
        motionEnabled = enabled;
        if (!enabled) {
          if (transition) scene.current = { ...transition.to };
          transition = null;
          playing = false;
          scene.current.flow = false;
        }
        schedule();
      },
      moveTo: (next, animate) => {
        playing = false;
        const nearestYaw =
          scene.current.yaw + ((((next.yaw - scene.current.yaw + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
        const target = { ...next, yaw: nearestYaw };
        if (animate && motionEnabled) {
          transition = { from: { ...scene.current }, to: target, elapsed: 0 };
          scene.current.preset = next.preset;
          scene.current.flow = false;
        } else {
          scene.current = target;
          transition = null;
        }
        schedule();
      },
      available: () => width > 0 && height > 0,
    };
    resize.observe(canvas);
    intersection.observe(canvas);
    document.addEventListener("visibilitychange", schedule);
    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", schedule);
      controls.current = null;
    };
  }, []);

  useEffect(() => {
    controls.current?.setMotion(motion);
    controls.current?.setOrbit(orbiting && motion);
  }, [orbiting, motion]);

  const stopOrbit = () => {
    controls.current?.setOrbit(false);
    setOrbiting(false);
  };
  const move = (yaw: number, pitch: number) => {
    stopOrbit();
    scene.current.yaw += yaw;
    scene.current.pitch = Math.max(-1.3, Math.min(1.3, scene.current.pitch + pitch));
    controls.current?.render();
    setStatus("View adjusted.");
  };
  const select = (index: number) => {
    stopOrbit();
    setSelected(index);
    setStatus("");
    controls.current?.moveTo(
      {
        ...MISSIONS[index].angles,
        phase: 0,
        preset: index,
        flow: false,
        emphasis: [Number(index === 0), Number(index === 1), Number(index === 2)],
      },
      motion,
    );
    onSelect?.(MISSIONS[index].id);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-0.15, 0],
      ArrowRight: [0.15, 0],
      ArrowUp: [0, -0.15],
      ArrowDown: [0, 0.15],
    };
    const direction = directions[event.key];
    if (direction) {
      event.preventDefault();
      move(...direction);
    } else if (event.key === "Home") {
      event.preventDefault();
      select(selected);
    }
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    stopOrbit();
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      yaw: scene.current.yaw,
      pitch: scene.current.pitch,
      pointer: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start || event.pointerId !== start.pointer) return;
    scene.current.yaw = start.yaw + (event.clientX - start.x) * 0.008;
    scene.current.pitch = Math.max(-1.3, Math.min(1.3, start.pitch + (event.clientY - start.y) * 0.006));
    controls.current?.render();
  };
  const endDrag = () => {
    drag.current = null;
  };
  const capture = () => {
    const canvas = canvasRef.current;
    if (!canvas || !controls.current?.available()) {
      setStatus("The instrument is still preparing. Please try again.");
      return;
    }
    setStatus("Preparing your instrument image…");
    try {
      const card = document.createElement("canvas");
      card.width = 1600;
      card.height = 1000;
      const ctx = card.getContext("2d");
      if (!ctx) throw new Error("Image canvas is unavailable");
      paint(card, { ...scene.current }, 1600, 1000);
      ctx.fillStyle = "#edf7fa";
      ctx.font = "500 24px Arial, sans-serif";
      ctx.fillText("CASHIO / THE HUMAN RECKONING · LIGHTFOLD", 52, 70);
      ctx.font = "18px Arial, sans-serif";
      ctx.fillStyle = "#77e7e7";
      ctx.fillText(`V37 · ${mission.title.toUpperCase()} · ${mission.principle}`, 52, 920);
      ctx.fillStyle = "#adc6d5";
      ctx.font = "16px Arial, sans-serif";
      ctx.fillText("A conceptual orbital instrument. Created at cashio.us.", 52, 955);
      card.toBlob((blob) => {
        if (!blob) {
          setStatus("Image export was unavailable. Please try again.");
          return;
        }
        const url = URL.createObjectURL(blob),
          link = document.createElement("a");
        link.href = url;
        link.download = `cashio-v37-lightfold-${mission.id}-orbit.png`;
        (dialogRef.current ?? document.body).appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setStatus(`${mission.title} image prepared. Your browser may ask where to save it.`);
      }, "image/png");
    } catch {
      setStatus("Your browser could not export the image. You can still explore every view.");
    }
  };

  return (
    <div className="eh-orbit-cinema-anchor" style={cinema ? { minHeight: anchorHeight } : undefined}>
      <dialog
        ref={dialogRef}
        open
        className="eh-orbit-dialog"
        aria-labelledby={`${id}-cinema-title`}
        aria-modal={cinema}
        onClose={finishCinema}
        onCancel={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Escape") event.stopPropagation();
          if (!cinema || event.key !== "Tab") return;
          const dialog = event.currentTarget;
          const focusable = [
            ...dialog.querySelectorAll<HTMLElement>(
              "button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])",
            ),
          ].filter((element) => element.getClientRects().length > 0);
          const first = focusable[0],
            last = focusable.at(-1);
          if (event.shiftKey && document.activeElement === first && last) {
            event.preventDefault();
            last.focus({ preventScroll: true });
          } else if (!event.shiftKey && document.activeElement === last && first) {
            event.preventDefault();
            first.focus({ preventScroll: true });
          }
        }}
      >
        <div className="eh-orbit-cinema-bar">
          <div className="eh-orbit-cinema-title">
            <span className="eh-orbit-cinema-mark" aria-hidden="true">
              ◈
            </span>
            <div>
              <span id={`${id}-cinema-title`}>Principles Engine</span>
              <p>{cinema ? "LIGHTFOLD / YOUR VIEW OF THE UNIVERSE" : "One instrument. A world to explore."}</p>
            </div>
          </div>
          <button
            ref={cinemaButtonRef}
            type="button"
            className="eh-orbit-cinema-button"
            disabled={!ready}
            onClick={() => (cinema ? dialogRef.current?.close() : openCinema())}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d={cinema ? "M6 6l12 12M18 6 6 18" : "M9 4H4v5M15 4h5v5M4 15v5h5M20 15v5h-5"} />
            </svg>
            {cinema ? "Close cinema" : "Cinema view"}
          </button>
        </div>
        <div className="eh-orbit-instrument" data-mission={mission.id} data-orbit-motion={motion ? "on" : "off"}>
          <div className="eh-orbit-stage">
            <div className="eh-orbit-stage-label" aria-hidden="true">
              <span>LIGHTFOLD / ORBITAL INSTRUMENT</span>
              <span>CONCEPT STUDY</span>
            </div>
            <div
              className="eh-orbit-viewport"
              tabIndex={0}
              role="group"
              aria-label="Orbital instrument orientation"
              aria-describedby={`${id}-help`}
              onKeyDown={onKeyDown}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onLostPointerCapture={endDrag}
            >
              {!ready && <InstrumentFallback />}
              <canvas
                ref={canvasRef}
                className={ready ? "eh-orbit-canvas eh-orbit-ready" : "eh-orbit-canvas"}
                aria-hidden="true"
              />
            </div>
            <div className="eh-orbit-stage-footer">
              <span className="eh-orbit-mode">
                <i aria-hidden="true" />
                {orbiting && motion ? "ORBIT IN MOTION" : "MANUAL OBSERVATION"}
              </span>
              <span>DRAG TO EXPLORE ↗</span>
            </div>
            <div className="eh-orbit-orientation" aria-label="Adjust instrument orientation">
              <button type="button" onClick={() => move(-0.2, 0)} aria-label="Rotate instrument left">
                ←
              </button>
              <button type="button" onClick={() => move(0.2, 0)} aria-label="Rotate instrument right">
                →
              </button>
              <button type="button" onClick={() => move(0, -0.16)} aria-label="Tilt instrument up">
                ↑
              </button>
              <button type="button" onClick={() => move(0, 0.16)} aria-label="Tilt instrument down">
                ↓
              </button>
              <button type="button" className="eh-orbit-reset" onClick={() => select(selected)}>
                Reset view
              </button>
            </div>
          </div>
          <div className="eh-orbit-console">
            <div className="eh-orbit-presets" aria-label="Choose an orbital mission">
              {MISSIONS.map((item, index) => (
                <button type="button" key={item.id} onClick={() => select(index)} aria-pressed={selected === index}>
                  <span>{item.number}</span>
                  {item.title}
                </button>
              ))}
            </div>
            <div className="eh-orbit-mission" aria-live="polite" aria-atomic="true">
              <p className="eh-orbit-eyebrow">MISSION {mission.number} / DESIGN PRINCIPLE</p>
              <h3>{mission.heading}</h3>
              <p className="eh-orbit-copy">{mission.copy}</p>
              <div className="eh-orbit-principle">
                <span aria-hidden="true">◇</span>
                <strong>{mission.principle}</strong>
              </div>
              <p className="eh-orbit-detail">{mission.detail}</p>
            </div>
            <div className="eh-orbit-actions">
              <button
                type="button"
                disabled={!motion || !ready}
                aria-pressed={orbiting && motion}
                onClick={() => setOrbiting((value) => !value)}
              >
                <span aria-hidden="true">{orbiting && motion ? "Ⅱ" : "▷"}</span>
                {orbiting && motion ? "Pause orbit" : "Start orbit"}
              </button>
              <button type="button" disabled={!ready} onClick={capture}>
                <span aria-hidden="true">↓</span>Save this view
              </button>
            </div>
            <p id={`${id}-help`} className="eh-orbit-help">
              Drag the instrument or use the arrow controls. With the instrument focused, arrow keys turn the view; Home
              resets it.{!motion && " Motion is off. You can still explore with the controls."}
            </p>
            <p className="eh-orbit-boundary">
              A hands-on concept study. These orbital relationships illustrate a design philosophy; they are not live
              infrastructure telemetry.
            </p>
            <output className="eh-orbit-status" aria-live="polite">
              {status}
            </output>
          </div>
        </div>
      </dialog>
    </div>
  );
}
