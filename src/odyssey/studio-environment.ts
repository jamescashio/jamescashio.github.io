import * as THREE from "three";

/** Shared, local HDR softboxes. Baked once; no download or extra frame pass. */
export function createStudioEnvironment(renderer: THREE.WebGLRenderer) {
  const width = 256,
    height = 128;
  const pixels = new Float32Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const sky = Math.max(0, 1 - y / 90);
      const warm = Math.exp(-(((x - 55) / 27) ** 4 + ((y - 32) / 17) ** 4));
      const cool = Math.exp(-(((x - 176) / 12) ** 4 + ((y - 44) / 28) ** 4));
      const edge = Math.exp(-(((x - 107) / 3) ** 4 + ((y - 48) / 24) ** 4));
      pixels[offset] = 0.015 + sky * 0.12 + warm * 4.8 + cool * 1.7 + edge * 2.8;
      pixels[offset + 1] = 0.025 + sky * 0.17 + warm * 3.9 + cool * 2.9 + edge * 3.0;
      pixels[offset + 2] = 0.045 + sky * 0.24 + warm * 2.8 + cool * 3.8 + edge * 3.2;
      pixels[offset + 3] = 1;
    }
  }
  const texture = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat, THREE.FloatType);
  texture.colorSpace = THREE.LinearSRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  const generator = new THREE.PMREMGenerator(renderer);
  try {
    return generator.fromEquirectangular(texture);
  } finally {
    texture.dispose();
    generator.dispose();
  }
}
