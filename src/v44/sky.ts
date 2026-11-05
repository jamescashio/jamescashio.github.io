import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shader.ts";
import { motionEnabled, onMotionChange } from "./motion.ts";
import { layoutFor } from "./layout.ts";

type Uniforms = Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>;
type Rgb = [number, number, number];

const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/i;
const UNIFORMS = [
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
  "uNebA",
  "uNebB",
] as const;
/**
 * The nebula's two colors at each station, so travel reads as travel: the gate's blue, the
 * screening room's amber, green for the worlds, steel for the workshop, violet at the helm,
 * a cold archive light for the evidence and the house red for the human in command.
 */
const NEBULA: Record<string, [Rgb, Rgb]> = {
  arrival: [
    [0.03, 0.07, 0.2],
    [0.16, 0.05, 0.12],
  ],
  cinema: [
    [0.13, 0.07, 0.04],
    [0.2, 0.06, 0.08],
  ],
  worlds: [
    [0.02, 0.11, 0.12],
    [0.05, 0.15, 0.09],
  ],
  workshop: [
    [0.03, 0.07, 0.17],
    [0.06, 0.1, 0.2],
  ],
  helm: [
    [0.07, 0.04, 0.2],
    [0.17, 0.05, 0.19],
  ],
  evidence: [
    [0.04, 0.09, 0.15],
    [0.1, 0.12, 0.17],
  ],
  doug: [
    [0.14, 0.04, 0.06],
    [0.19, 0.09, 0.05],
  ],
};
/** Without scroll, pointer or keys, the sky settles into a still frame: soon behind the reading, later at the gate. */
const IDLE_DEEP_MS = 2500;
const IDLE_GATE_MS = 30000;

export type SkyState = {
  transit: number;
  dim: number;
  warpBoost: number;
  column?: { left: number; right: number };
  /** The station on screen, which picks the nebula's colors. */
  station?: string;
};
/** Reasons the sky may not animate. Any one of them holds it on its last frame. */
export type Hold = "motion" | "hidden" | "film" | "lost" | "idle" | "slow";

export class Sky {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private u: Uniforms | null = null;
  private raf = 0;
  private clock = 4;
  private last = 0;
  private lastInput = performance.now();
  private scale = 0.7;
  private maxScale = 1;
  private samples: number[] = [];
  private ignite = 0;
  private igniteStart = -1;
  private warp = 0;
  private pointer = [0, 0];
  private pointerTarget = [0, 0];
  private nebula: [Rgb, Rgb] = [[...NEBULA.arrival[0]], [...NEBULA.arrival[1]]];
  private nebulaShift = 0;
  private running = false;
  private holds = new Set<Hold>();
  readonly live: boolean;

  constructor(
    private canvas: HTMLCanvasElement,
    private state: () => SkyState,
    private onIgnited: () => void,
    private onLive: (live: boolean) => void,
    force = false,
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
    this.gl = gl;
    if (!this.build()) {
      this.gl = null;
      return false;
    }
    const coarse = matchMedia("(pointer: coarse)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.maxScale = dpr * (coarse ? 0.62 : 0.85);
    this.scale = this.maxScale * 0.85;

    // A lost context shows the poster at once and comes back only once the scene is rebuilt.
    this.canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.hold("lost", true);
      this.onLive(false);
    });
    this.canvas.addEventListener("webglcontextrestored", () => {
      if (!this.build()) return;
      this.hold("lost", false);
      this.redraw();
      this.onLive(true);
    });
    window.addEventListener(
      "pointermove",
      (e) => {
        this.pointerTarget = [(e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1)];
        this.wake();
      },
      { passive: true },
    );
    window.addEventListener("keydown", () => this.wake(), { passive: true });
    document.addEventListener("visibilitychange", () => this.hold("hidden", document.hidden));
    onMotionChange(() => this.hold("motion", !motionEnabled()));
    this.holds = new Set<Hold>([
      ...(motionEnabled() ? [] : ["motion" as const]),
      ...(document.hidden ? ["hidden" as const] : []),
    ]);
    return true;
  }

  /** Compile, link and upload the full screen triangle. Everything allocated is released if a step fails. */
  private build(): boolean {
    const gl = this.gl!;
    const shaders: WebGLShader[] = [];
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    try {
      const compile = (type: number, src: string) => {
        const s = gl.createShader(type);
        if (!s) throw new Error("shader");
        shaders.push(s);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
        return s;
      };
      program = gl.createProgram();
      if (!program) throw new Error("program");
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX_SHADER));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("link");
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(program, "aPos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      this.u = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(program!, n)])) as Uniforms;
      this.program = program;
      // Linked programs keep their code; the shader objects are no longer needed.
      shaders.forEach((s) => gl.deleteShader(s));
      this.canvas.width = 0;
      return true;
    } catch {
      shaders.forEach((s) => gl.deleteShader(s));
      if (program) gl.deleteProgram(program);
      if (buffer) gl.deleteBuffer(buffer);
      this.program = null;
      this.u = null;
      return false;
    }
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

  /** First frame, then motion if nothing holds the sky. */
  begin() {
    this.lastInput = performance.now();
    if (this.holds.size) this.redraw();
    else this.run();
  }

  /** Add or lift one reason to stand still. The sky runs only when nothing holds it. */
  hold(reason: Hold, on: boolean) {
    if (on) this.holds.add(reason);
    else this.holds.delete(reason);
    if (this.holds.size) this.halt();
    else this.run();
  }

  /** Scroll, pointer and keys keep the sky awake. */
  wake() {
    this.lastInput = performance.now();
    if (this.holds.has("idle")) this.hold("idle", false);
  }

  /** Draw one frame now, used for resize, scroll and every still. */
  redraw() {
    if (!this.running) this.draw(performance.now());
  }

  private run() {
    if (!this.program || this.running) return;
    this.running = true;
    this.canvas.setAttribute("data-running", "");
    this.last = 0;
    this.raf = requestAnimationFrame(this.frame);
  }

  private halt() {
    this.running = false;
    this.canvas.removeAttribute("data-running");
    cancelAnimationFrame(this.raf);
    this.redraw();
  }

  private frame = (now: number) => {
    if (!this.running) return;
    const s = this.state();
    const deep = s.transit >= 1;
    const settled = this.warp < 0.02 && this.igniteStart < 0 && this.nebulaShift < 0.002;
    if (now - this.lastInput > (deep ? IDLE_DEEP_MS : IDLE_GATE_MS) && settled) {
      this.hold("idle", true);
      return;
    }
    // Sixty frames a second at most, so a 120 or 144 Hz display costs what a 60 Hz one does; half that behind content.
    const interval = deep && this.warp < 0.02 ? 1000 / 30 : 1000 / 60 - 1.5;
    if (now - this.last >= interval) {
      const dt = this.last ? now - this.last : 16;
      this.last = now;
      this.clock += Math.min(dt, 50) / 1000;
      this.adapt(dt);
      this.draw(now);
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  private adapt(dt: number) {
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
    // Still too slow at the smallest backing store: the painted poster serves this device better.
    if (this.scale <= 0.33 && avg > 70) {
      this.hold("slow", true);
      this.onLive(false);
      return;
    }
    const target = this.state().transit >= 1 ? 34 : 18;
    if (avg > target * 1.25 && this.scale > 0.32) this.scale *= 0.82;
    else if (avg < target * 0.7 && this.scale < this.maxScale) this.scale = Math.min(this.maxScale, this.scale * 1.08);
  }

  private draw(now: number) {
    const gl = this.gl;
    const u = this.u;
    if (!gl || !u || !this.program || gl.isContextLost()) return;
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
    // The nebula eases toward the station's colors over about two seconds, or changes at once when motion is off.
    const target = NEBULA[s.station || "arrival"] || NEBULA.arrival;
    const ease = motion && this.running ? 0.05 : 1;
    this.nebulaShift = 0;
    for (let k = 0; k < 2; k++)
      for (let c = 0; c < 3; c++) {
        const d = target[k][c] - this.nebula[k][c];
        this.nebula[k][c] += d * ease;
        this.nebulaShift = Math.max(this.nebulaShift, Math.abs(d));
      }
    const L = layoutFor(innerWidth, innerHeight, s.column);
    gl.uniform2f(u.uRes, w, h);
    gl.uniform1f(u.uTime, motion ? this.clock : 12.4);
    gl.uniform1f(u.uTransit, motion ? s.transit : 0);
    gl.uniform1f(u.uIgnite, this.ignite);
    gl.uniform1f(u.uWarp, motion ? Math.min(1, this.warp) : 0);
    gl.uniform1f(u.uDim, s.dim);
    gl.uniform2f(u.uPointer, motion ? this.pointer[0] : 0, motion ? this.pointer[1] : 0);
    gl.uniform4f(u.uRing, ...L.ring);
    gl.uniform1f(u.uRot, L.rot);
    gl.uniform2f(u.uSun, ...L.sun);
    gl.uniform3f(u.uPlanet, ...L.planet);
    gl.uniform3f(u.uNebA, ...this.nebula[0]);
    gl.uniform3f(u.uNebB, ...this.nebula[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
