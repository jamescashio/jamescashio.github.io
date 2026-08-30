// ZeusApollo viewscreen stage.
// Procedural canvas textures. Nothing here is fetched over the network.
import * as THREE from "three";

/** A 2D context that is guaranteed to exist. Every canvas here is created in
 * this module, so a null context means the browser is not usable at all. */
function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = context2d(canvas);
  if (!context) throw new Error("viewscreen: 2D canvas context unavailable");
  return context;
}

// A void-and-neon environment: what these hulls reflect. PMREM-filtered so
// metalness has something real to mirror — a horizon, a hot key, cool pools.
export function envTexture(renderer: THREE.WebGLRenderer): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const g = context2d(c);
  g.save();
  g.scale(2, 2);
  const sky = g.createLinearGradient(0, 0, 0, 256);
  sky.addColorStop(0, "#222c4c");
  sky.addColorStop(0.45, "#12172c");
  sky.addColorStop(0.62, "#0a0d1a");
  sky.addColorStop(1, "#06070d");
  g.fillStyle = sky;
  g.fillRect(0, 0, 512, 256);
  const pool = (x: number, y: number, r: number, col: string) => {
    const p = g.createRadialGradient(x, y, 0, x, y, r);
    p.addColorStop(0, col);
    p.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = p;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  };
  pool(90, 60, 90, "rgba(0,120,150,.5)");
  pool(470, 70, 80, "rgba(120,0,160,.42)");
  pool(250, 210, 120, "rgba(255,120,20,.34)");
  g.globalAlpha = 1;
  const horizon = g.createLinearGradient(0, 150, 0, 168);
  horizon.addColorStop(0, "rgba(255,214,170,0)");
  horizon.addColorStop(0.5, "rgba(255,226,196,.9)");
  horizon.addColorStop(1, "rgba(255,170,60,0)");
  g.fillStyle = horizon;
  g.fillRect(0, 150, 512, 18);
  const spec = g.createRadialGradient(360, 58, 0, 360, 58, 46);
  spec.addColorStop(0, "rgba(255,255,255,1)");
  spec.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = spec;
  g.fillRect(280, 0, 170, 130);
  g.globalAlpha = 0.55;
  for (let i = 0; i < 320; i++) {
    g.fillStyle = "#fff";
    g.fillRect(Math.random() * 512, Math.random() * 148, 1.1, 1.1);
  }
  g.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  const pg = new THREE.PMREMGenerator(renderer);
  const rt = pg.fromEquirectangular(tex);
  tex.dispose();
  pg.dispose();
  return rt.texture;
}

// Panel lines, plate seams and grime — drives roughness so the metal has skin.
export function panelTexture(): THREE.CanvasTexture {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = context2d(c);
  g.fillStyle = "#969696";
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 46; i++) {
    g.fillStyle =
      "rgba(" + (Math.random() < 0.5 ? "255,255,255" : "0,0,0") + "," + (0.03 + Math.random() * 0.07).toFixed(2) + ")";
    g.fillRect(Math.random() * S, Math.random() * S, 14 + Math.random() * 46, 10 + Math.random() * 30);
  }
  g.strokeStyle = "rgba(58,58,58,.9)";
  g.lineWidth = 1.4;
  for (let x = 0; x <= S; x += 32) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, S);
    g.stroke();
  }
  for (let y = 0; y <= S; y += 48) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(S, y);
    g.stroke();
  }
  for (let i = 0; i < 900; i++) {
    g.fillStyle = "rgba(0,0,0," + (0.04 + Math.random() * 0.08).toFixed(2) + ")";
    g.fillRect(Math.random() * S, Math.random() * S, 1, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}

// Tangent-space normal map: plate seams cut in, rivet rows stand out, access
// hatches outlined. Built as a height field, then Sobel-differentiated.
export function normalTexture(): THREE.CanvasTexture {
  const S = 256;
  const hc = document.createElement("canvas");
  hc.width = hc.height = S;
  const h = context2d(hc);
  h.fillStyle = "#808080";
  h.fillRect(0, 0, S, S);
  h.strokeStyle = "#343434";
  h.lineWidth = 2;
  for (let x = 0; x <= S; x += 32) {
    h.beginPath();
    h.moveTo(x, 0);
    h.lineTo(x, S);
    h.stroke();
  }
  for (let y = 0; y <= S; y += 48) {
    h.beginPath();
    h.moveTo(0, y);
    h.lineTo(S, y);
    h.stroke();
  }
  h.fillStyle = "#d2d2d2";
  for (let y = 9; y < S; y += 48) {
    for (let x = 6; x < S; x += 11) {
      h.beginPath();
      h.arc(x, y, 1.4, 0, 6.283);
      h.fill();
    }
  }
  h.strokeStyle = "rgba(70,70,70,.95)";
  h.lineWidth = 1.5;
  for (let i = 0; i < 30; i++) {
    h.strokeRect(Math.random() * S, Math.random() * S, 10 + Math.random() * 28, 8 + Math.random() * 20);
  }
  const src = h.getImageData(0, 0, S, S).data;
  const out = document.createElement("canvas");
  out.width = out.height = S;
  const o = context2d(out);
  const img = o.createImageData(S, S);
  const at = (x: number, y: number) => src[((((y % S) + S) % S) * S + (((x % S) + S) % S)) * 4];
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const nx = (-(at(x + 1, y) - at(x - 1, y)) / 255) * 2.4;
      const ny = (-(at(x, y + 1) - at(x, y - 1)) / 255) * 2.4;
      const len = Math.sqrt(nx * nx + ny * ny + 1);
      const i = (y * S + x) * 4;
      img.data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      img.data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      img.data[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  o.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(out);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}

// Soft radial glint so points render as stars, not squares.
export function glintTexture(): THREE.CanvasTexture {
  const S = 64;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = context2d(c);
  const rg = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  rg.addColorStop(0, "rgba(255,255,255,1)");
  rg.addColorStop(0.28, "rgba(255,255,255,.62)");
  rg.addColorStop(0.62, "rgba(255,255,255,.14)");
  rg.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = rg;
  g.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Banded gas-giant surface in the deck palette — indigo body, cyan/purple
// weather bands, one warm storm eye.
export function gasTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const g = context2d(c);
  const base = g.createLinearGradient(0, 0, 0, 256);
  base.addColorStop(0, "#161e38");
  base.addColorStop(0.5, "#2a3760");
  base.addColorStop(1, "#10152a");
  g.fillStyle = base;
  g.fillRect(0, 0, 512, 256);
  const bands = [
    "rgba(0,170,200,.20)",
    "rgba(120,80,200,.15)",
    "rgba(255,149,0,.09)",
    "rgba(185,212,255,.13)",
    "rgba(8,12,24,.32)",
  ];
  let y = 6;
  while (y < 250) {
    const h = 5 + Math.random() * 20;
    g.fillStyle = bands[(Math.random() * bands.length) | 0];
    g.fillRect(0, y, 512, h);
    for (let x = 0; x < 512; x += 14) g.fillRect(x, y + Math.sin(x * 0.04 + y) * 2.4, 14, 1.6);
    y += h * (0.6 + Math.random() * 0.8);
  }
  const s = g.createRadialGradient(150, 170, 2, 150, 170, 30);
  s.addColorStop(0, "rgba(255,170,60,.5)");
  s.addColorStop(1, "rgba(255,170,60,0)");
  g.fillStyle = s;
  g.beginPath();
  g.ellipse(150, 170, 32, 13, 0, 0, 6.283);
  g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Concentric ring bands, planar-mapped onto a RingGeometry.
export function ringsTexture(): THREE.CanvasTexture {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = context2d(c);
  for (let r = S * 0.31; r < S * 0.5; r += 1) {
    const t = (r - S * 0.31) / (S * 0.19);
    const a = (Math.sin(t * 42) * 0.5 + 0.5) * (Math.sin(t * 9.7) * 0.5 + 0.5);
    g.strokeStyle =
      "rgba(" +
      ((180 + t * 40) | 0) +
      "," +
      ((205 - t * 55) | 0) +
      "," +
      ((232 - t * 40) | 0) +
      "," +
      ((0.05 + a * 0.3) * (t > 0.93 ? 0.3 : 1)).toFixed(3) +
      ")";
    g.beginPath();
    g.arc(S / 2, S / 2, r, 0, 6.283);
    g.stroke();
  }
  return new THREE.CanvasTexture(c);
}

// Horizontal anamorphic streak for the engine flare.
export function anaTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 32;
  const g = context2d(c);
  g.save();
  g.translate(128, 16);
  g.scale(8, 1);
  const rg = g.createRadialGradient(0, 0, 0, 0, 0, 16);
  rg.addColorStop(0, "rgba(255,255,255,.95)");
  rg.addColorStop(0.4, "rgba(255,255,255,.32)");
  rg.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = rg;
  g.beginPath();
  g.arc(0, 0, 16, 0, 6.283);
  g.fill();
  g.restore();
  return new THREE.CanvasTexture(c);
}
