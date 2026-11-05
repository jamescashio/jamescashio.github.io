import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shader.ts";
import { motionEnabled, onMotionChange } from "./motion.ts";
import { layoutFor } from "./layout.ts";

type Uniforms = Record<
  "uRes" | "uTime" | "uTransit" | "uIgnite" | "uWarp" | "uDim" | "uPointer" | "uRing" | "uRot" | "uSun" | "uPlanet",
  WebGLUniformLocation | null
>;

const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/i;

export type SkyState = { transit: number; dim: number; warpBoost: number; column?: { left: number; right: number } };

export class Sky {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private u: Uniforms | null = null;
  private raf = 0;
  private started = 0;
  private last = 0;
  private frozenAt = 12.4;
  private scale = 0.7;
  private maxScale = 1;
  private samples: number[] = [];
  private ignite = 0;
  private igniteStart = -1;
  private warp = 0;
  private pointer = [0, 0];
  private pointerTarget = [0, 0];
  private running = false;
  private visible = true;
  readonly live: boolean;

  constructor(
    private canvas: HTMLCanvasElement,
    private state: () => SkyState,
    private onIgnited: () => void,
    force = false,
    private fixedScale = 0,
  ) {
    this.live = this.init(force);
  }

  private init(force: boolean): boolean {
    const gl = (this.canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      depth: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
    }) || null) as WebGLRenderingContext | null;
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    // Software rasterizers turn a GPU scene into main thread work. The painted poster is the better experience there.
    if (!force && SOFTWARE.test(renderer)) return false;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
      return s;
    };
    try {
      const program = gl.createProgram()!;
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX_SHADER));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false;
      gl.useProgram(program);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(program, "aPos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const names = [
        "uRes",
        "uTime",
        "uTransit",
        "uIgnite",
        "uWarp",
        "uDim",
        "uPointer",
        "uRing",
        "uRot",
        "uSun",
        "uPlanet",
      ] as const;
      this.u = Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(program, n)])) as Uniforms;
      this.gl = gl;
      this.program = program;
    } catch {
      return false;
    }
    const coarse = matchMedia("(pointer: coarse)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.maxScale = this.fixedScale || dpr * (coarse ? 0.62 : 0.85);
    this.scale = this.fixedScale || this.maxScale * 0.85;
    this.canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.stop();
    });
    window.addEventListener(
      "pointermove",
      (e) => {
        this.pointerTarget = [(e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1)];
      },
      { passive: true },
    );
    document.addEventListener("visibilitychange", () => (document.hidden ? this.stop() : this.start()));
    onMotionChange(() => (motionEnabled() ? this.start() : (this.stop(), this.draw(performance.now()))));
    return true;
  }

  /** Light the gate. Animated once per session; instantly lit when motion is off or it already ran. */
  light(animate: boolean) {
    if (!animate) {
      this.ignite = 1;
      this.onIgnited();
      return;
    }
    this.igniteStart = performance.now() + 450;
  }

  surge(amount = 1) {
    this.warp = Math.max(this.warp, amount);
  }

  setVisible(v: boolean) {
    this.visible = v;
    if (v) this.start();
  }

  start() {
    if (!this.gl || this.running || document.hidden || !motionEnabled()) return;
    this.running = true;
    if (!this.started) this.started = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Draw one frame now, used for resize, scroll and the reduced motion still. */
  redraw() {
    if (!this.running) this.draw(performance.now());
  }

  private frame = (now: number) => {
    if (!this.running) return;
    const s = this.state();
    const deep = s.transit >= 1 && this.warp < 0.02;
    // Behind the content the sky only needs half the frame rate.
    const interval = deep ? 1000 / 30 : 0;
    if (now - this.last >= interval) {
      const dt = this.last ? now - this.last : 16;
      this.last = now;
      this.adapt(dt);
      this.draw(now);
    }
    if (this.visible) this.raf = requestAnimationFrame(this.frame);
    else this.running = false;
  };

  private adapt(dt: number) {
    if (this.fixedScale) return;
    // A very slow frame means the device cannot carry this resolution: step down at once.
    if (dt > 120 && this.scale > 0.32) {
      this.scale = Math.max(0.32, this.scale * 0.7);
      this.samples = [];
      return;
    }
    this.samples.push(dt);
    if (this.samples.length < 30) return;
    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    this.samples = [];
    const target = this.state().transit >= 1 ? 34 : 18;
    if (avg > target * 1.25 && this.scale > 0.32) this.scale *= 0.82;
    else if (avg < target * 0.7 && this.scale < this.maxScale) this.scale = Math.min(this.maxScale, this.scale * 1.08);
  }

  private draw(now: number) {
    const gl = this.gl;
    const u = this.u;
    if (!gl || !u) return;
    const s = this.state();
    const motion = motionEnabled();
    // Cap the backing store near 2.1 million pixels so ultrawide screens cost what a laptop does.
    const cap = Math.min(1, Math.sqrt(2.1e6 / Math.max(1, innerWidth * innerHeight * this.scale * this.scale)));
    const w = Math.max(1, Math.round(innerWidth * this.scale * cap));
    const h = Math.max(1, Math.round(innerHeight * this.scale * cap));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    if (this.igniteStart > 0 && motion) {
      const k = Math.min(1, Math.max(0, (now - this.igniteStart) / 2600));
      this.ignite = 1 - Math.pow(1 - k, 2.2);
      if (k >= 1) {
        this.igniteStart = -1;
        this.onIgnited();
      }
    } else if (this.igniteStart > 0) {
      this.ignite = 1;
      this.igniteStart = -1;
      this.onIgnited();
    }
    this.warp = Math.max(s.warpBoost, this.warp * 0.94);
    this.pointer[0] += (this.pointerTarget[0] - this.pointer[0]) * 0.04;
    this.pointer[1] += (this.pointerTarget[1] - this.pointer[1]) * 0.04;
    const time = motion ? (now - this.started) / 1000 + 4 : this.frozenAt;
    const L = layoutFor(innerWidth, innerHeight, s.column);
    gl.uniform2f(u.uRes, w, h);
    gl.uniform1f(u.uTime, time);
    gl.uniform1f(u.uTransit, motion ? s.transit : 0);
    gl.uniform1f(u.uIgnite, this.ignite);
    gl.uniform1f(u.uWarp, motion ? Math.min(1, this.warp) : 0);
    gl.uniform1f(u.uDim, s.dim);
    gl.uniform2f(u.uPointer, motion ? this.pointer[0] : 0, motion ? this.pointer[1] : 0);
    gl.uniform4f(u.uRing, ...L.ring);
    gl.uniform1f(u.uRot, L.rot);
    gl.uniform2f(u.uSun, ...L.sun);
    gl.uniform3f(u.uPlanet, ...L.planet);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
