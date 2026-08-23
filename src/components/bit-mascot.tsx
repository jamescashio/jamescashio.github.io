import { useEffect, useRef } from "react";
import type { BitMood } from "@/lib/store";

const PHI = (1 + Math.sqrt(5)) / 2;

function norm(v: number[]) {
  const l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

const bitBaseVertices = [
  [-1, PHI, 0],
  [1, PHI, 0],
  [-1, -PHI, 0],
  [1, -PHI, 0],
  [0, -1, PHI],
  [0, 1, PHI],
  [0, -1, -PHI],
  [0, 1, -PHI],
  [PHI, 0, -1],
  [PHI, 0, 1],
  [-PHI, 0, -1],
  [-PHI, 0, 1],
].map(norm);

const bitBaseFaces = [
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

const bitYesGeometry = {
  vertices: [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ],
  faces: [
    [0, 2, 4],
    [2, 1, 4],
    [1, 3, 4],
    [3, 0, 4],
    [2, 0, 5],
    [1, 2, 5],
    [3, 1, 5],
    [0, 3, 5],
  ],
};

function buildBitStellation(spike: number) {
  const vertices = bitBaseVertices.map((v) => v.slice());
  const faces: number[][] = [];
  bitBaseFaces.forEach((face) => {
    const a = bitBaseVertices[face[0]];
    const b = bitBaseVertices[face[1]];
    const c = bitBaseVertices[face[2]];
    const apex = norm([
      (a[0] + b[0] + c[0]) / 3,
      (a[1] + b[1] + c[1]) / 3,
      (a[2] + b[2] + c[2]) / 3,
    ]);
    const apexIndex = vertices.length;
    vertices.push([apex[0] * spike, apex[1] * spike, apex[2] * spike]);
    faces.push([face[0], face[1], apexIndex], [face[1], face[2], apexIndex], [face[2], face[0], apexIndex]);
  });
  return { vertices, faces };
}

const bitNoGeometry = buildBitStellation(1.78);

function palette(state: BitMood) {
  if (state === "yes") return { base: [255, 204, 24], edge: [255, 248, 176], glow: "rgba(255,204,0,0.5)" };
  if (state === "no" || state === "alert")
    return { base: [255, 24, 58], edge: [255, 154, 170], glow: "rgba(255,0,51,0.52)" };
  if (state === "think") return { base: [255, 149, 0], edge: [255, 214, 150], glow: "rgba(255,149,0,0.46)" };
  return { base: [38, 205, 236], edge: [200, 252, 255], glow: "rgba(0,249,255,0.46)" };
}

function rotateBitVertex(vertex: number[], rotateX: number, rotateY: number) {
  const cosY = Math.cos(rotateY),
    sinY = Math.sin(rotateY);
  const cosX = Math.cos(rotateX),
    sinX = Math.sin(rotateX);
  const x = vertex[0] * cosY + vertex[2] * sinY;
  const z1 = vertex[2] * cosY - vertex[0] * sinY;
  const y = vertex[1] * cosX - z1 * sinX;
  const z = vertex[1] * sinX + z1 * cosX;
  return [x, y, z];
}

export function BitMascot({
  mood,
  size = 96,
  className,
}: {
  mood: BitMood;
  size?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const moodRef = useRef(mood);
  moodRef.current = mood;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let bitAngle = 0;
    let lastTs = 0;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = (now: number) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const css = canvas.clientWidth || size;
      const want = Math.round(css * dpr);
      if (canvas.width !== want) {
        canvas.width = want;
        canvas.height = want;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      const center = css / 2;
      const baseRadius = css * 0.24;
      const state = moodRef.current;
      const elapsed = lastTs ? Math.min(80, Math.max(0, now - lastTs)) : 42;
      lastTs = now;
      if (!reduce) bitAngle += elapsed * (state === "no" || state === "alert" ? 0.0027 : state === "yes" ? 0.0014 : 0.00105);
      const pulse = 0.5 + 0.5 * Math.sin(now * 0.0022);
      const pal = palette(state);
      const geometry =
        state === "yes"
          ? bitYesGeometry
          : state === "no" || state === "alert"
            ? bitNoGeometry
            : buildBitStellation(1.08 + pulse * 0.24);
      let rotateX = -0.52 + Math.sin(bitAngle * 0.72) * 0.13;
      if (state === "no" || state === "alert") rotateX += Math.sin(bitAngle * 9) * 0.1;
      const radius = baseRadius * (state === "yes" ? 1.3 : state === "no" || state === "alert" ? 0.96 : 1);
      const focal = 5.2;
      const points3d = geometry.vertices.map((v) => rotateBitVertex(v, rotateX, bitAngle));
      const project = (point: number[]) => {
        const scale = focal / (focal + point[2]);
        return [center + point[0] * radius * scale, center + point[1] * radius * scale];
      };
      ctx.clearRect(0, 0, css, css);
      const halo = ctx.createRadialGradient(center, center, 1, center, center, css * 0.5);
      halo.addColorStop(0, pal.glow);
      halo.addColorStop(0.3, `rgba(${pal.edge[0]},${pal.edge[1]},${pal.edge[2]},${(0.1 + pulse * 0.07).toFixed(3)})`);
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, css, css);
      const lightX = 0.42,
        lightY = -0.5,
        lightZ = 0.76;
      const ordered = geometry.faces
        .map((face, index) => [index, (points3d[face[0]][2] + points3d[face[1]][2] + points3d[face[2]][2]) / 3] as const)
        .sort((a, b) => a[1] - b[1]);
      ordered.forEach((entry) => {
        const face = geometry.faces[entry[0]];
        const a = points3d[face[0]],
          b = points3d[face[1]],
          c = points3d[face[2]];
        const ux = b[0] - a[0],
          uy = b[1] - a[1],
          uz = b[2] - a[2];
        const vx = c[0] - a[0],
          vy = c[1] - a[1],
          vz = c[2] - a[2];
        const nx = uy * vz - uz * vy;
        const ny = uz * vx - ux * vz;
        const nz = ux * vy - uy * vx;
        const nlen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        const light = (nx / nlen) * lightX + (ny / nlen) * lightY + (nz / nlen) * lightZ;
        const shade = 0.2 + 0.8 * Math.max(0, light);
        const a2 = project(a),
          b2 = project(b),
          c2 = project(c);
        ctx.beginPath();
        ctx.moveTo(a2[0], a2[1]);
        ctx.lineTo(b2[0], b2[1]);
        ctx.lineTo(c2[0], c2[1]);
        ctx.closePath();
        ctx.fillStyle = `rgba(${Math.round(pal.base[0] * shade)},${Math.round(pal.base[1] * shade)},${Math.round(pal.base[2] * shade)},0.94)`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${pal.edge[0]},${pal.edge[1]},${pal.edge[2]},${state === "yes" ? "0.82" : "0.54"})`;
        ctx.lineWidth = state === "yes" ? 0.9 : 0.62;
        ctx.stroke();
      });
    };

    const loop = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
