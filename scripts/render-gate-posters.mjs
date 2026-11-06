// Paints the gate posters from the live shader, one per composition in src/v44/layout.ts (POSTERS),
// so software renderers see the same scene a GPU draws, and the live gate's first frame lands on it.
// Each poster is the still frame the page draws with motion off: lit, at the arrival, drift at 12.4 s.
// Run with `node --import tsx scripts/render-gate-posters.mjs`; CHROME_PATH selects the browser.
import { writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import { FRAGMENT_SHADER, VERTEX_SHADER } from "../src/v44/shader.ts";
import { POSTERS } from "../src/v44/layout.ts";
import { NEBULA } from "../src/v44/nebula.ts";

const QUALITY = 0.72;
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }),
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
try {
  const page = await browser.newPage();
  await page.setContent("<!doctype html><canvas></canvas>");
  for (const poster of POSTERS)
    for (const [width, height] of poster.sizes) {
      const url = await page.evaluate(
        ({ vs, fs, width, height, layout, nebula, quality }) => {
          const canvas = document.querySelector("canvas");
          canvas.width = width;
          canvas.height = height;
          const gl = canvas.getContext("webgl", { antialias: false, alpha: false, preserveDrawingBuffer: true });
          const compile = (type, src) => {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
            return s;
          };
          const program = gl.createProgram();
          gl.attachShader(program, compile(gl.VERTEX_SHADER, vs));
          gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fs));
          gl.linkProgram(program);
          gl.useProgram(program);
          gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
          const at = gl.getAttribLocation(program, "aPos");
          gl.enableVertexAttribArray(at);
          gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0);
          const u = (name) => gl.getUniformLocation(program, name);
          gl.viewport(0, 0, width, height);
          gl.uniform2f(u("uRes"), width, height);
          gl.uniform1f(u("uTime"), 12.4);
          gl.uniform1f(u("uTransit"), 0);
          gl.uniform1f(u("uIgnite"), 1);
          gl.uniform1f(u("uSweep"), 0);
          gl.uniform1f(u("uWarp"), 0);
          gl.uniform1f(u("uDim"), 0);
          gl.uniform2f(u("uPointer"), 0, 0);
          gl.uniform4f(u("uRing"), ...layout.ring);
          gl.uniform1f(u("uRot"), layout.rot);
          gl.uniform2f(u("uSun"), ...layout.sun);
          gl.uniform3f(u("uPlanet"), ...layout.planet);
          gl.uniform3f(u("uNebA"), ...nebula[0]);
          gl.uniform3f(u("uNebB"), ...nebula[1]);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
          return canvas.toDataURL("image/webp", quality);
        },
        {
          vs: VERTEX_SHADER,
          fs: FRAGMENT_SHADER,
          width,
          height,
          layout: poster.layout,
          nebula: NEBULA.arrival,
          quality: QUALITY,
        },
      );
      const file = `public/v44/${poster.id}-${width}.webp`;
      const bytes = Buffer.from(url.split(",")[1], "base64");
      await writeFile(file, bytes);
      console.log(`${file} ${width}x${height} ${(bytes.length / 1024).toFixed(1)} KB`);
    }
} finally {
  await browser.close();
}
