import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shader.ts";
import { motionEnabled, onMotionChange } from "./motion.ts";
import type { SkyLayout } from "./layout.ts";
import { NEBULA, type Rgb } from "./nebula.ts";
import { affordsStep, beatFor, ceilingScale, startScale, stepped } from "./sharpness.ts";

type Uniforms = Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>;

const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/i;
const UNIFORMS = [
  "uRes",
  "uTime",
  "uTransit",
  "uIgnite",
  "uSweep",
  "uPulse",
  "uPulseColor",
  "uWarp",
  "uDim",
  "uPointer",
  "uRing",
  "uRot",
  "uSun",
  "uPlanet",
  "uNebA",
  "uNebB",
  "uJump",
  "uFar",
] as const;
/** Without scroll, pointer or keys, the sky settles into a still frame: soon behind the reading, later at the gate. */
const IDLE_DEEP_MS = 2500;
const IDLE_GATE_MS = 30000;

export type SkyState = {
  transit: number;
  dim: number;
  warpBoost: number;
  /** Where the gate, sun and planet sit: the painted poster's layout as it lands on this screen. */
  layout: SkyLayout;
  /** The station on screen, which picks the nebula's colors. */
  station?: string;
  /** The far gate, the next in the chain: where it hangs and how large, in the gate's own units. */
  far: [number, number, number];
};
/** Reasons the sky may not animate. Any one of them holds it on its last frame. */
export type Hold = "motion" | "hidden" | "film" | "lost" | "idle" | "slow";

export class Sky {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private u: Uniforms | null = null;
  private raf = 0;
  // The posters are painted at this moment of the drift, so the first live frame matches them.
  private clock = 12.4;
  private last = 0;
  private lastInput = performance.now();
  private scale = 0.7;
  private coarse = false;
  /** The sharpest backing store this device has shown it can carry, once a step up proved one too many. */
  private limit = Infinity;
  private raised = false;
  /** The next frame is timed on the GPU, to learn whether a sharper one would still be cheap. */
  private probe = false;
  private readonly pixel = new Uint8Array(4);
  private refining = 0;
  private tick = 0;
  /** The display's own rhythm in milliseconds, learned again every window so a move between screens is noticed. */
  private refresh = 1000 / 60;
  private shortest = Infinity;
  private learned = false;
  private samples: number[] = [];
  /** The gate's power: lit from the first frame, as the painted poster shows it. */
  private readonly ignite = 1;
  /** The ignition front's place around the ring, 0 when no front is running. */
  private sweep = 0;
  private sweepStart = -1;
  /** A short flare of the far gate, in a lane's color, when the visitor routes a request at the helm. */
  private pulseStart = -1;
  private pulseLevel = 0;
  private pulseColor: [number, number, number] = [0.45, 0.65, 1];
  /** A world chosen as a destination holds the far gate lit in its color for as long as it is chosen. */
  private lockTarget = 0;
  private lockLevel = 0;
  /** A jump to the far gate and through it: when it began, how long it takes, and how far along it is. */
  private jumpStart = -1;
  private jumpMs = 1;
  private jumpLevel = 0;
  /** Where the far gate is drawn; it glides to a new place when the screen changes shape. */
  private far: [number, number, number] | null = null;
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
    this.coarse = matchMedia("(pointer: coarse)").matches;
    // Phones start close to their poster's sharpness; a slow frame still steps the backing store down at once.
    this.scale = startScale(window.devicePixelRatio, this.coarse, innerWidth * innerHeight);

    // A lost context shows the poster at once and comes back only once the scene is rebuilt.
    this.canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.hold("lost", true);
      this.finishEntrance();
      this.onLive(false);
    });
    this.canvas.addEventListener("webglcontextrestored", () => {
      if (!this.build()) return;
      this.hold("lost", false);
      // A device already judged too slow keeps its poster; otherwise the scene returns once it has drawn.
      if (this.holds.has("slow")) return;
      this.redraw();
      if (this.canvas.width > 0) this.onLive(true);
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

  /**
   * Open the gate. The live scene fades in over the poster already lit, so the two never disagree;
   * once per session, with motion on, a light front then races around the ring before it reads Open.
   */
  light(animate: boolean) {
    if (!animate) {
      this.onIgnited();
      return;
    }
    this.sweepStart = performance.now() + 1100;
  }

  /** Flare the far gate once; red for a request held for a person, blue for every lane. */
  pulse(held: boolean) {
    if (!motionEnabled()) return;
    this.pulseColor = held ? [1, 0.32, 0.42] : [0.45, 0.65, 1];
    this.pulseStart = performance.now();
    this.wake();
  }

  /** Light the far gate in a world's color while that world is chosen, and let it go when none is. */
  lock(light: Rgb | null) {
    if (light && motionEnabled()) {
      this.pulseColor = [...light];
      this.lockTarget = 0.5;
    } else this.lockTarget = 0;
    this.wake();
  }

  /**
   * Fly to the far gate and through it, in a world's color. Answers whether the live scene is flying:
   * a sky that is standing still for any reason leaves the jump to the page.
   */
  jump(light: Rgb, ms: number): boolean {
    if (!this.program || !motionEnabled()) return false;
    this.wake();
    if (!this.running) return false;
    this.pulseColor = [...light];
    this.jumpMs = Math.max(1, ms);
    this.jumpStart = performance.now();
    return true;
  }

  /** Back from a jump, or one that never left: the far gate returns to its place. */
  land() {
    this.jumpStart = -1;
    this.jumpLevel = 0;
    this.lockTarget = 0;
    this.lockLevel = 0;
    this.redraw();
  }

  /** When the live scene steps aside for the poster mid entrance, the gate still opens. */
  private finishEntrance() {
    if (this.sweepStart < 0) return;
    this.sweepStart = -1;
    this.sweep = 0;
    this.onIgnited();
  }

  /** First frame, then motion if nothing holds the sky. */
  begin() {
    this.lastInput = performance.now();
    if (this.holds.size) {
      this.redraw();
      this.refine();
    } else this.run();
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

  /** Draw one frame now, used for resize, scroll and every still; not while the poster stands in for the scene. */
  redraw() {
    if (this.running || this.holds.has("slow") || this.holds.has("lost") || this.holds.has("hidden")) return;
    this.draw(performance.now());
  }

  private run() {
    if (!this.program || this.running) return;
    this.running = true;
    this.canvas.setAttribute("data-running", "");
    this.last = 0;
    this.tick = 0;
    this.shortest = Infinity;
    cancelAnimationFrame(this.refining);
    this.raf = requestAnimationFrame(this.frame);
  }

  private halt() {
    this.running = false;
    this.canvas.removeAttribute("data-running");
    cancelAnimationFrame(this.raf);
    this.redraw();
    this.refine();
  }

  /**
   * The sharpest backing store worth asking for: the screen's own pixels (a little under on phones),
   * within the pixel ceiling and whatever this device has shown to be its limit.
   */
  private ceiling(): number {
    return ceilingScale(window.devicePixelRatio, this.coarse, innerWidth * innerHeight, this.limit);
  }

  /**
   * A still costs nothing to keep, so it sharpens a step at a time for as long as one frame stays cheap.
   * A paused or idle gate therefore ends at the screen's own resolution on any GPU that can draw it.
   */
  private refine() {
    cancelAnimationFrame(this.refining);
    const step = () => {
      if (this.running || this.holds.has("slow") || this.holds.has("lost") || this.holds.has("hidden")) return;
      if (this.scale >= this.ceiling() - 0.001) return;
      if (!affordsStep(this.draw(performance.now(), true))) return;
      this.scale = stepped(this.scale, this.ceiling(), 0);
      this.draw(performance.now());
      this.refining = requestAnimationFrame(step);
    };
    this.refining = requestAnimationFrame(step);
  }

  private frame = (now: number) => {
    if (!this.running) return;
    if (this.tick && now - this.tick > 3) this.shortest = Math.min(this.shortest, now - this.tick);
    this.tick = now;
    const s = this.state();
    const deep = s.transit >= 1;
    const settled =
      this.warp < 0.02 &&
      this.sweepStart < 0 &&
      this.nebulaShift < 0.002 &&
      this.pulseLevel < 0.01 &&
      this.jumpStart < 0 &&
      Math.abs(this.lockTarget - this.lockLevel) < 0.01;
    if (now - this.lastInput > (deep ? IDLE_DEEP_MS : IDLE_GATE_MS) && settled) {
      this.hold("idle", true);
      return;
    }
    // Sixty frames a second at most, half that behind content, counted in the display's own beats: a 75 Hz
    // screen is drawn on every beat and a 144 Hz one on every third, so none of them ever looks slow to itself.
    const want = deep && this.warp < 0.02 && this.jumpStart < 0 ? 1000 / 30 : 1000 / 60;
    const beat = beatFor(want, this.refresh);
    if (now - this.last >= beat - 2) {
      const dt = this.last ? now - this.last : 16;
      this.last = now;
      this.clock += Math.min(dt, 50) / 1000;
      this.adapt(dt, beat);
      const cost = this.draw(now, this.probe);
      if (this.probe) {
        this.probe = false;
        // Cheap enough that a sharper frame would be too: take the step. The next windows judge it.
        if (affordsStep(cost)) {
          this.scale = stepped(this.scale, this.ceiling(), cost);
          this.raised = true;
        }
      }
    }
    this.raf = requestAnimationFrame(this.frame);
  };

  private adapt(dt: number, beat: number) {
    // A very slow frame means the device cannot carry this resolution: step down at once.
    if (dt > 120 && this.scale > 0.32) {
      this.scale = Math.max(0.32, this.scale * 0.7);
      this.samples = [];
      this.raised = false;
      return;
    }
    this.samples.push(dt);
    if (this.samples.length < 30) return;
    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    this.samples = [];
    // The shortest gap between two callbacks in this window is the display's beat for the next one.
    if (Number.isFinite(this.shortest)) this.refresh = this.shortest;
    this.shortest = Infinity;
    // The first window was paced by a guess at the display, so it only teaches the beat and judges nothing.
    if (!this.learned) {
      this.learned = true;
      return;
    }
    // Still too slow at the smallest backing store: the painted poster serves this device better.
    if (this.scale <= 0.33 && avg > 70) {
      this.hold("slow", true);
      this.finishEntrance();
      this.onLive(false);
      return;
    }
    const target = Math.max(this.state().transit >= 1 ? 34 : 18, beat);
    if (avg > target * 1.25 && this.scale > 0.32) {
      this.scale *= 0.82;
      // A step up the device could not carry is not tried again.
      if (this.raised) this.limit = this.scale;
      this.raised = false;
      return;
    }
    this.raised = false;
    // Frames that arrive on the display's own beat say nothing of the room left, so the GPU is asked:
    // the next frame is timed, and a sharper backing store follows only if that frame was cheap.
    if (avg <= beat * 1.12 && this.scale < this.ceiling() - 0.001) this.probe = true;
  }

  /** Draw one frame. When timed, wait for the GPU to finish it and return what it cost in milliseconds. */
  private draw(now: number, timed = false): number {
    const gl = this.gl;
    const u = this.u;
    if (!gl || !u || !this.program || gl.isContextLost()) return Infinity;
    const s = this.state();
    const motion = motionEnabled();
    // A resize or a zoom can leave the scale above what the new screen allows.
    this.scale = Math.min(this.scale, this.ceiling());
    const w = Math.max(1, Math.round(innerWidth * this.scale));
    const h = Math.max(1, Math.round(innerHeight * this.scale));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    if (this.sweepStart > 0 && motion) {
      const k = Math.min(1, Math.max(0, (now - this.sweepStart) / 2600));
      this.sweep = k > 0 && k < 1 ? 1 - Math.pow(1 - k, 2.2) : 0;
      if (k >= 1) {
        this.sweepStart = -1;
        this.onIgnited();
      }
    } else if (this.sweepStart > 0) {
      this.sweep = 0;
      this.sweepStart = -1;
      this.onIgnited();
    }
    this.warp = Math.max(s.warpBoost, this.warp * 0.94);
    // The pulse rises in a tenth of a second and fades over about a second and a half.
    const since = this.pulseStart < 0 ? Infinity : now - this.pulseStart;
    this.pulseLevel = motion && since < 1600 ? Math.min(1, since / 100) * Math.exp(-since / 520) : 0;
    this.lockLevel = motion ? this.lockLevel + (this.lockTarget - this.lockLevel) * 0.12 : 0;
    // A jump holds at its far end until the page leaves or lands.
    this.jumpLevel = motion && this.jumpStart >= 0 ? Math.min(1, Math.max(0, (now - this.jumpStart) / this.jumpMs)) : 0;
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
    const L = s.layout;
    gl.uniform2f(u.uRes, w, h);
    gl.uniform1f(u.uTime, motion ? this.clock : 12.4);
    gl.uniform1f(u.uTransit, motion ? s.transit : 0);
    gl.uniform1f(u.uIgnite, this.ignite);
    gl.uniform1f(u.uSweep, this.sweep);
    gl.uniform1f(
      u.uPulse,
      Math.max(this.pulseLevel, this.lockLevel, this.jumpLevel > 0 ? 0.6 + 0.4 * this.jumpLevel : 0),
    );
    gl.uniform3f(u.uPulseColor, ...this.pulseColor);
    gl.uniform1f(u.uWarp, motion ? Math.min(1, Math.max(this.warp, this.jumpLevel > 0 ? 1 : 0)) : 0);
    gl.uniform1f(u.uDim, s.dim);
    gl.uniform2f(u.uPointer, motion ? this.pointer[0] : 0, motion ? this.pointer[1] : 0);
    gl.uniform4f(u.uRing, ...L.ring);
    gl.uniform1f(u.uRot, L.rot);
    gl.uniform2f(u.uSun, ...L.sun);
    gl.uniform3f(u.uPlanet, ...L.planet);
    gl.uniform3f(u.uNebA, ...this.nebula[0]);
    gl.uniform3f(u.uNebB, ...this.nebula[1]);
    gl.uniform1f(u.uJump, this.jumpLevel);
    if (!this.far || !motion || !this.running) this.far = [...s.far];
    else for (let c = 0; c < 3; c++) this.far[c] += (s.far[c] - this.far[c]) * 0.08;
    gl.uniform3f(u.uFar, ...this.far);
    if (!timed) {
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return 0;
    }
    // Reading one pixel back makes the browser wait for the GPU, which is the only honest clock WebGL 1 offers.
    const started = performance.now();
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, this.pixel);
    return performance.now() - started;
  }
}
