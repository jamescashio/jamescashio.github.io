import * as THREE from "three";
const TAU = Math.PI * 2;

/** A seamless spherical atlas replaces repeated per-pixel noise with two texture
 * reads. Its channels hold coast elevation, mineral relief, clouds and night light.
 * Everything is authored locally; no imagery, downloads or render passes. */
export function createSurfaceAtlas() {
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
