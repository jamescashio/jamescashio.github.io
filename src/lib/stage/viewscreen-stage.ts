// ZeusApollo viewscreen stage.
// Eight craft morph through each other as the visitor descends the decks:
// X-1 to SR-71 to Proteus to Starship to Epstein drive ship to the first warp
// ship to a Guild heighliner to the P-51D Mustang.
//
// The stage is a custom element so the React tree can mount it without owning
// any of its WebGL state. Everything it draws is procedural: no model files,
// no texture downloads, no network calls of any kind.
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";

import { motionDurationMs, shouldRenderFrame } from "../animation-timing.ts";
import { CRAFT } from "./craft-profiles.ts";
import { DECK_TINT, GRADE } from "./grade.ts";
import { FOLD_FRAG, FOLD_VERT, NEBULA_FRAG, NEBULA_VERT, WARP_FIELD_FRAG, WARP_FIELD_VERT } from "./shaders.ts";
import {
  anaTexture,
  envTexture,
  gasTexture,
  glintTexture,
  normalTexture,
  panelTexture,
  ringsTexture,
} from "./textures.ts";

const MINIMUM_FRAME_INTERVAL_MS = 1000 / 30;

type Uniform<T> = { value: T };

type NebulaUniforms = {
  uTime: Uniform<number>;
  uProg: Uniform<number>;
  uAspect: Uniform<number>;
  uA: Uniform<THREE.Color>;
  uB: Uniform<THREE.Color>;
};

type FoldUniforms = {
  uTime: Uniform<number>;
  uAmt: Uniform<number>;
};

type WarpFieldUniforms = {
  uTime: Uniform<number>;
  uColor: Uniform<THREE.Color>;
  uOpacity: Uniform<number>;
};

/** Sampled hull positions for the four navigation lights of one craft. */
type NavLightSet = {
  port: ArrayLike<number>;
  star: ArrayLike<number>;
  nose: ArrayLike<number>;
  tail: ArrayLike<number>;
};

/** One meteor streak: elapsed time, its lifetime, its origin and its velocity. */
type Meteor = {
  t: number;
  dur: number;
  p: THREE.Vector3;
  d: THREE.Vector3;
};

type BasicMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
type AnyMesh = THREE.Mesh<THREE.BufferGeometry, THREE.Material>;
type StandardMesh = THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
type PointCloud = THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
type Lines = THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial>;

const NP = 5400; // morph cloud size

export class ViewscreenStage extends HTMLElement {
  // ---- element and loop state ----
  private canvas!: HTMLCanvasElement;
  private _built = false;
  private _started = false;
  private _raf = 0;
  private _loop: ((t: number) => void) | null = null;
  private _last = 0;
  private _twk = 0;
  private _previousRender: number | null = null;
  private _onResize: (() => void) | null = null;
  private _onMove: ((event: PointerEvent) => void) | null = null;
  private _onVis: (() => void) | null = null;
  private paused = false;
  private reduce = false;

  // ---- public stage state, driven by the React tree ----
  private prog = 0;
  private deck = 0;
  private stage = 0;
  private craftTarget = 0;
  private craftF = 0;
  private craftShown = 0;
  private warpT = 0;
  private mx = 0;
  private my = 0;
  private clearX = 0.5;
  private clearY = 0.85;
  private dim = 1;

  // ---- arrival choreography ----
  private arrivalT = 0;
  private arrivalDone = false;

  // ---- scratch objects, allocated once and reused every frame ----
  private _matrix = new THREE.Matrix4();
  private _quat = new THREE.Quaternion();
  private _tmpC = new THREE.Color();
  private _vec = new THREE.Vector3();
  private _vec2 = new THREE.Vector3();
  private _sv = new THREE.Vector3(1, 1, 1);
  private _roll = 0;

  // ---- renderer, scenes and passes ----
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private bgScene!: THREE.Scene;
  private bgCam!: THREE.Camera;
  private composer!: EffectComposer;
  private bloom!: UnrealBloomPass;
  private grade!: ShaderPass;

  // ---- shared textures ----
  private envMap!: THREE.Texture;
  private panelTex!: THREE.CanvasTexture;
  private normalTex!: THREE.CanvasTexture;
  private glintTex!: THREE.CanvasTexture;

  // ---- shader uniform blocks ----
  private nebulaU!: NebulaUniforms;
  private foldU!: FoldUniforms;
  private warpFieldU!: WarpFieldUniforms;

  // ---- craft rig ----
  private craftRig!: THREE.Group;
  private hull!: PointCloud;
  private solids: StandardMesh[] = [];
  private wires: Lines[] = [];
  private lights: NavLightSet[] = [];
  private mags: number[] = [];
  private R = 3.2;
  private bankT = 0;
  private bankDir = 1;

  // ---- exhaust, trail and afterburner ----
  private exhaust!: BasicMesh;
  private exhaustCore!: BasicMesh;
  private ionTrail!: PointCloud;
  private TN = 280;
  private trailPos!: Float32Array;
  private trailAge!: Float32Array;
  private abAnchors: number[][] = [];
  private abPlumes: BasicMesh[] = [];

  // ---- field, backdrop and set dressing ----
  private stars!: PointCloud;
  private motes!: PointCloud;
  private streaks!: Lines;
  private stkBase!: Float32Array;
  private stkLen!: Float32Array;
  private meteorLines!: Lines;
  private meteors: Meteor[] = [];
  private clouds: Float32Array[] = [];
  private gridA!: THREE.GridHelper;
  private gridB!: THREE.GridHelper;
  private gridF = 0;
  private planet!: THREE.Group;
  private planetBody!: AnyMesh;
  private planetHalo!: AnyMesh;
  private planetRings!: AnyMesh;
  private planetOp = 0;
  private ana!: BasicMesh;
  private flare!: BasicMesh;
  private tracer!: THREE.PointLight;
  private fillLight!: THREE.Light;

  // ---- fold, warp and shock effects ----
  private fold!: AnyMesh;
  private foldInner!: AnyMesh;
  private foldLens!: AnyMesh;
  private foldStreaks!: Lines;
  private fsBase!: Float32Array;
  private bubble!: AnyMesh;
  private bubbleInner: AnyMesh | null = null;
  private shock!: AnyMesh;
  private ring!: AnyMesh;
  private ring2!: AnyMesh;
  private warpCoils: AnyMesh[] = [];
  private warpCollectors: AnyMesh[] = [];
  private warpRings: AnyMesh[] = [];

  // ---- fleet graph shown on the grid deck ----
  private fleet!: THREE.Group;
  private nodes!: THREE.InstancedMesh;
  private nodeGeo!: THREE.IcosahedronGeometry;
  private nodeMat!: THREE.MeshBasicMaterial;
  private beams!: Lines;
  private navLights!: PointCloud;
  private strobe!: PointCloud;

  connectedCallback() {
    if (this._built) return;
    this._built = true;
    this.style.cssText =
      "position:fixed;inset:0;width:100%;height:100%;display:block;overflow:hidden;z-index:0;pointer-events:none";
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `<style>:host{display:block}canvas{display:block;width:100%;height:100%}</style>`;
    this.canvas = document.createElement("canvas");
    root.appendChild(this.canvas);

    this.prog = 0;
    this.deck = 0;
    this.warpT = 0;
    this.mx = 0;
    this.my = 0;
    this.stage = 0;
    this.craftTarget = 0;
    this.craftF = 0;
    this.clearX = 0.5;
    this.clearY = 0.85;
    this.dim = 1;
    this.reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Reduced motion skips the arrival and opens on the settled frame.
    if (this.reduce) {
      this.arrivalT = 1;
      this.arrivalDone = true;
    }
    this.paused = document.hidden;

    const start = () => {
      if (this._started) {
        if (!this.reduce && !this.paused && !this._raf && this._loop) this._raf = requestAnimationFrame(this._loop);
        return;
      }
      this._started = true;
      try {
        this._initGL();
      } catch (e) {
        console.warn("viewscreen: WebGL unavailable", e);
        this._fallback();
        return;
      }

      this._onResize = () => this._resize();
      addEventListener("resize", this._onResize);
      this._onMove = (e) => {
        this.mx = (e.clientX / innerWidth - 0.5) * 2;
        this.my = (e.clientY / innerHeight - 0.5) * 2;
      };
      addEventListener("pointermove", this._onMove, { passive: true });
      addEventListener("pagehide", () => this.dispose(), { once: true });

      this._resize();
      const loop = (t: number) => {
        this._raf = requestAnimationFrame(loop);
        if (!this.paused && shouldRenderFrame(t, this._previousRender ?? null, MINIMUM_FRAME_INTERVAL_MS)) {
          this._previousRender = t;
          this._frame(t);
        }
      };
      this._loop = loop;
      if (this.reduce) {
        this._frame(0);
        return;
      }
      this._raf = requestAnimationFrame(loop);
    };
    this._onVis = () => {
      this.paused = document.hidden;
      if (!this.paused) start();
    };
    document.addEventListener("visibilitychange", this._onVis);
    if (!this.paused) start();
  }

  disconnectedCallback() {
    this.dispose();
  }

  _initGL() {
    const r = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    r.setClearColor(0x05060a, 1);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.25;
    this.renderer = r;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x05060a, 0.026);
    this.envMap = envTexture(r);
    this.scene.environment = this.envMap;
    this.panelTex = panelTexture();
    this.normalTex = normalTexture();
    this.glintTex = glintTexture();
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 260);
    this.camera.position.set(0, 1.1, 7.2);
    this.camera.layers.enable(1);

    // nebula backdrop
    this.bgScene = new THREE.Scene();
    this.bgCam = new THREE.Camera();
    this.nebulaU = {
      uTime: { value: 0 },
      uProg: { value: 0 },
      uAspect: { value: 1 },
      uA: { value: new THREE.Color(DECK_TINT[0][0]) },
      uB: { value: new THREE.Color(DECK_TINT[0][1]) },
    };
    this.bgScene.add(
      new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.ShaderMaterial({
          vertexShader: NEBULA_VERT,
          fragmentShader: NEBULA_FRAG,
          uniforms: this.nebulaU,
          depthTest: false,
          depthWrite: false,
        }),
      ),
    );

    // starfield
    const N = 4200;
    const pos = new Float32Array(N * 3),
      col = new Float32Array(N * 3);
    const cW = new THREE.Color(0xffffff),
      cC = new THREE.Color(0x00f9ff),
      cO = new THREE.Color(0xff9500);
    for (let i = 0; i < N; i++) {
      const u = Math.random(),
        v = Math.random();
      const th = 2 * Math.PI * u,
        ph = Math.acos(2 * v - 1);
      const rad = 26 + Math.random() * 52;
      pos[i * 3] = rad * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = rad * Math.cos(ph) * 0.55;
      pos[i * 3 + 2] = rad * Math.sin(ph) * Math.sin(th);
      const pick = Math.random();
      const c = pick < 0.16 ? cC : pick < 0.2 ? cO : cW;
      const b = 0.45 + Math.random() * 0.55;
      col[i * 3] = c.r * b;
      col[i * 3 + 1] = c.g * b;
      col[i * 3 + 2] = c.b * b;
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    sg.setAttribute("color", new THREE.BufferAttribute(col, 3));
    this.stars = new THREE.Points(
      sg,
      new THREE.PointsMaterial({
        size: 0.3,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: true,
        map: this.glintTex,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    this.scene.add(this.stars);

    // warp streaks
    const S = 1100;
    this.stkBase = new Float32Array(S * 3);
    this.stkLen = new Float32Array(S);
    const sp = new Float32Array(S * 2 * 3);
    for (let i = 0; i < S; i++) {
      const j = (Math.random() * N) | 0;
      this.stkBase[i * 3] = pos[j * 3];
      this.stkBase[i * 3 + 1] = pos[j * 3 + 1];
      this.stkBase[i * 3 + 2] = pos[j * 3 + 2];
      this.stkLen[i] = 0.35 + Math.random() * 0.85;
      for (let k = 0; k < 2; k++) {
        const o = (i * 2 + k) * 3;
        sp[o] = pos[j * 3];
        sp[o + 1] = pos[j * 3 + 1];
        sp[o + 2] = pos[j * 3 + 2];
      }
    }
    const stg = new THREE.BufferGeometry();
    stg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    this.streaks = new THREE.LineSegments(
      stg,
      new THREE.LineBasicMaterial({
        color: 0xa8f4ff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    this.scene.add(this.streaks);

    // ringed gas giant — a distant anchor owning the deep background
    this.planet = new THREE.Group();
    this.planetBody = new THREE.Mesh(
      new THREE.SphereGeometry(7.4, 48, 32),
      new THREE.MeshLambertMaterial({
        map: gasTexture(),
        emissive: 0x121a2e,
        emissiveIntensity: 0.75,
        transparent: true,
        opacity: 0,
        fog: false,
      }),
    );
    this.planetBody.rotation.z = 0.35;
    this.planetHalo = new THREE.Mesh(
      new THREE.SphereGeometry(7.9, 32, 24),
      new THREE.MeshBasicMaterial({
        color: 0x2b9dbb,
        transparent: true,
        opacity: 0,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    this.planetRings = new THREE.Mesh(
      new THREE.RingGeometry(9.6, 15.4, 96, 1),
      new THREE.MeshBasicMaterial({
        map: ringsTexture(),
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
        fog: false,
      }),
    );
    this.planetRings.rotation.x = Math.PI / 2 - 0.24;
    this.planet.add(this.planetBody, this.planetHalo, this.planetRings);
    this.planet.position.set(19, 8.5, -64);
    this.planet.rotation.z = -0.12;
    this.planet.visible = false;
    this.planetOp = 0;
    this.scene.add(this.planet);

    // near-camera dust motes — parallax depth between lens and subject
    const MO = 240,
      mp = new Float32Array(MO * 3);
    for (let i = 0; i < MO; i++) {
      mp[i * 3] = (Math.random() - 0.5) * 16;
      mp[i * 3 + 1] = (Math.random() - 0.5) * 9;
      mp[i * 3 + 2] = Math.random() * 8 - 2;
    }
    const mg = new THREE.BufferGeometry();
    mg.setAttribute("position", new THREE.BufferAttribute(mp, 3));
    this.motes = new THREE.Points(
      mg,
      new THREE.PointsMaterial({
        color: 0x9fd8e8,
        size: 0.034,
        sizeAttenuation: true,
        map: this.glintTex,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.scene.add(this.motes);

    // occasional shooting stars in the far field
    this.meteors = [];
    const mtg = new THREE.BufferGeometry();
    mtg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(4 * 2 * 3), 3));
    this.meteorLines = new THREE.LineSegments(
      mtg,
      new THREE.LineBasicMaterial({
        color: 0xdff6ff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    this.scene.add(this.meteorLines);
    for (let i = 0; i < 4; i++)
      this.meteors.push({ t: -(3 + Math.random() * 16), p: new THREE.Vector3(), d: new THREE.Vector3(), dur: 1 });

    // anamorphic lens streak riding the engine flare (parented to the fleet
    // rig below, once it exists)
    this.ana = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 0.7),
      new THREE.MeshBasicMaterial({
        map: anaTexture(),
        color: 0x00f9ff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
        fog: false,
      }),
    );

    // Tron floor
    this.gridA = new THREE.GridHelper(120, 60, 0x00f9ff, 0x00f9ff);
    this.gridA.material.transparent = true;
    this.gridA.material.opacity = 0.13;
    this.gridA.position.y = -2.4;
    this.gridB = new THREE.GridHelper(120, 12, 0xff9500, 0xff9500);
    this.gridB.material.transparent = true;
    this.gridB.material.opacity = 0.16;
    this.gridB.position.y = -2.38;
    this.scene.add(this.gridA, this.gridB);

    // ---- the craft rig ----
    this.fleet = new THREE.Group();
    this.fleet.position.set(5.4, -0.4, 0);
    this.scene.add(this.fleet);
    this.fleet.add(this.ana);

    const key = new THREE.DirectionalLight(0xffe6c4, 4.4);
    key.position.set(5, 7, 6);
    const rim = new THREE.DirectionalLight(0x00f9ff, 3.6);
    rim.position.set(-7, -1, -5);
    const rim2 = new THREE.DirectionalLight(0xff9500, 1.9);
    rim2.position.set(-4, 5, 7);
    const fill = new THREE.DirectionalLight(0xcc00ff, 1.2);
    fill.position.set(-2, 4, -7);
    this.fillLight = fill;
    this.scene.add(key, rim, rim2, fill, new THREE.AmbientLight(0x35415e, 1.6));
    // travelling highlight — sells the metal even against a black void
    this.tracer = new THREE.PointLight(0xffffff, 26, 34, 1.8);
    this.scene.add(this.tracer);

    this.craftRig = new THREE.Group();
    this.craftRig.rotation.y = -0.42;
    this.fleet.add(this.craftRig);

    this.clouds = [];
    this.wires = [];
    this.solids = [];
    this.lights = [];
    this.mags = [];
    const sampler = new THREE.Vector3();
    for (const spec of CRAFT) {
      const parts = spec.build().map((g) => (g.index ? g.toNonIndexed() : g));
      parts.forEach((g, pi) => {
        const pos = g.attributes.position,
          n = pos.count;
        const col = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          const c = spec.livery ? spec.livery(pos.getX(i), pos.getY(i), pos.getZ(i), pi) : null;
          col[i * 3] = c ? c[0] : 1;
          col[i * 3 + 1] = c ? c[1] : 1;
          col[i * 3 + 2] = c ? c[2] : 1;
        }
        g.setAttribute("color", new THREE.BufferAttribute(col, 3));
      });
      const geo = mergeGeometries(parts, false);
      geo.computeVertexNormals();
      geo.computeBoundingSphere();
      // computeBoundingSphere always populates this for a non empty geometry.
      const radius = geo.boundingSphere?.radius || 1;
      const s = (3.15 / radius) * (spec.mag || 1);
      geo.scale(s, s, s);
      geo.center();

      const mp = spec.mat || {};
      const solid = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color: spec.tint,
          vertexColors: true,
          metalness: mp.metal === undefined ? 0.85 : mp.metal,
          roughness: mp.rough === undefined ? 0.34 : mp.rough,
          roughnessMap: this.panelTex,
          metalnessMap: this.panelTex,
          normalMap: this.normalTex,
          normalScale: new THREE.Vector2(0.85, 0.85),
          envMap: this.envMap,
          envMapIntensity: (mp.env === undefined ? 1.35 : mp.env) * 1.15,
          transparent: true,
          opacity: 0,
          emissive: new THREE.Color(spec.glowColor || spec.tint).multiplyScalar(
            mp.emis === undefined ? 0.1 : mp.emis + 0.04,
          ),
          fog: false,
        }),
      );
      this.craftRig.add(solid);
      this.solids.push(solid);

      const smp = new MeshSurfaceSampler(new THREE.Mesh(geo)).build();
      const arr = new Float32Array(NP * 3);
      for (let i = 0; i < NP; i++) {
        smp.sample(sampler);
        arr[i * 3] = sampler.x;
        arr[i * 3 + 1] = sampler.y;
        arr[i * 3 + 2] = sampler.z;
      }
      this.clouds.push(arr);
      this.mags.push(spec.mag || 1);

      // Regulation nav lights, read off the real hull: red to port, green to
      // starboard, white strobe at the tail, beacon on the nose.
      let pz = 0,
        sz = 0,
        nx = -1e9,
        tx = 1e9,
        pi = 0,
        si = 0,
        ni = 0,
        ti = 0;
      for (let i = 0; i < NP; i++) {
        const x = arr[i * 3],
          z = arr[i * 3 + 2];
        if (z < pz) {
          pz = z;
          pi = i;
        }
        if (z > sz) {
          sz = z;
          si = i;
        }
        if (x > nx) {
          nx = x;
          ni = i;
        }
        if (x < tx) {
          tx = x;
          ti = i;
        }
      }
      const pick = (i: number): number[] => [arr[i * 3], arr[i * 3 + 1], arr[i * 3 + 2]];
      this.lights.push({ port: pick(pi), star: pick(si), nose: pick(ni), tail: pick(ti) });

      const w = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo, 18),
        new THREE.LineBasicMaterial({
          color: spec.wire || spec.glowColor || spec.tint,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false,
        }),
      );
      this.craftRig.add(w);
      this.wires.push(w);
    }

    // SR-71 nacelle exits, read off the sampled hull, for the twin plumes
    const bbC = this.clouds[1];
    let abL = [1e9, 0, 0],
      abR = [1e9, 0, 0];
    for (let i = 0; i < NP; i++) {
      const x = bbC[i * 3],
        y = bbC[i * 3 + 1],
        z = bbC[i * 3 + 2];
      if (z > 0.45 && x < abL[0]) abL = [x, y, z];
      if (z < -0.45 && x < abR[0]) abR = [x, y, z];
    }
    this.abAnchors = [abL, abR];

    const live = new Float32Array(this.clouds[0]);
    const cg = new THREE.BufferGeometry();
    cg.setAttribute("position", new THREE.BufferAttribute(live, 3));
    this.hull = new THREE.Points(
      cg,
      new THREE.PointsMaterial({
        size: 0.055,
        sizeAttenuation: true,
        color: 0xffd9a8,
        map: this.glintTex,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    this.craftRig.add(this.hull);

    // nav lights: three steady, one strobing
    const navPos = new Float32Array(9);
    const navCol = new Float32Array([1, 0.06, 0.06, 0.1, 1, 0.3, 0.55, 0.9, 1]);
    const navGeo = new THREE.BufferGeometry();
    navGeo.setAttribute("position", new THREE.BufferAttribute(navPos, 3));
    navGeo.setAttribute("color", new THREE.BufferAttribute(navCol, 3));
    this.navLights = new THREE.Points(
      navGeo,
      new THREE.PointsMaterial({
        size: 0.17,
        sizeAttenuation: true,
        vertexColors: true,
        map: this.glintTex,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    this.craftRig.add(this.navLights);

    const stGeo2 = new THREE.BufferGeometry();
    stGeo2.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
    this.strobe = new THREE.Points(
      stGeo2,
      new THREE.PointsMaterial({
        size: 0.32,
        sizeAttenuation: true,
        color: 0xffffff,
        map: this.glintTex,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    this.craftRig.add(this.strobe);

    // ion trail: particles shed from the plume mouth and left behind
    this.TN = 280;
    this.trailPos = new Float32Array(this.TN * 3);
    this.trailAge = new Float32Array(this.TN);
    for (let i = 0; i < this.TN; i++) this.trailAge[i] = Math.random();
    const trGeo = new THREE.BufferGeometry();
    trGeo.setAttribute("position", new THREE.BufferAttribute(this.trailPos, 3));
    this.ionTrail = new THREE.Points(
      trGeo,
      new THREE.PointsMaterial({
        size: 0.1,
        sizeAttenuation: true,
        color: 0xffc27a,
        map: this.glintTex,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    this.craftRig.add(this.ionTrail);

    // exhaust / torch
    const eg = new THREE.ConeGeometry(1, 1, 14, 1, true);
    eg.rotateZ(Math.PI / 2);
    eg.translate(-0.5, 0, 0);
    this.exhaust = new THREE.Mesh(
      eg,
      new THREE.MeshBasicMaterial({
        color: 0xffb066,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
      }),
    );
    this.craftRig.add(this.exhaust);

    const coreGeo = eg.clone();
    this.exhaustCore = new THREE.Mesh(
      coreGeo,
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
      }),
    );
    this.craftRig.add(this.exhaustCore);

    // twin afterburner plumes (Blackbird only)
    this.abPlumes = [];
    for (let k = 0; k < 2; k++) {
      const m = new THREE.Mesh(
        eg.clone(),
        new THREE.MeshBasicMaterial({
          color: 0xffb27a,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
          fog: false,
        }),
      );
      this.craftRig.add(m);
      this.abPlumes.push(m);
    }

    this.flare = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 12, 10),
      new THREE.MeshBasicMaterial({
        color: 0xffb066,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    this.craftRig.add(this.flare);

    // shockwave (X-1 breaking Mach 1)
    this.shock = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.02, 5, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    this.shock.rotation.y = Math.PI / 2;
    this.craftRig.add(this.shock);

    // Phoenix field boundary: soft edge volume, travelling field contours, and
    // localised nacelle hardware. None of these elements should wash the deck.
    this.warpFieldU = {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color(0x42e7ef) },
    };
    this.bubble = new THREE.Mesh(
      new THREE.SphereGeometry(3.0, 36, 22),
      new THREE.ShaderMaterial({
        uniforms: this.warpFieldU,
        vertexShader: WARP_FIELD_VERT,
        fragmentShader: WARP_FIELD_FRAG,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
      }),
    );
    this.craftRig.add(this.bubble);
    this.bubbleInner = null;
    this.warpRings = [0, 1, 2].map((k) => {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(1.7, 0.022, 6, 72),
        new THREE.MeshBasicMaterial({
          color: k === 2 ? 0xffa22c : 0x3deaf2,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false,
        }),
      );
      m.rotation.y = Math.PI / 2;
      this.craftRig.add(m);
      return m;
    });
    this.warpCoils = [1, -1].map((side) => {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(2.18, 0.035, 0.045),
        new THREE.MeshBasicMaterial({
          color: 0x55eff7,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false,
        }),
      );
      m.position.set(-0.08, 0.16, side * 1.54);
      this.craftRig.add(m);
      return m;
    });
    this.warpCollectors = [1, -1].map((side) => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.16, 14, 10),
        new THREE.MeshBasicMaterial({
          color: 0xffa534,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false,
        }),
      );
      m.scale.set(1.34, 1, 1);
      m.position.set(1.84, 0.16, side * 1.54);
      this.craftRig.add(m);
      return m;
    });

    // the fold itself: a lens of bent light, billboarded to camera
    this.foldU = { uTime: { value: 0 }, uAmt: { value: 0 } };
    this.foldLens = new THREE.Mesh(
      new THREE.PlaneGeometry(9.5, 9.5),
      new THREE.ShaderMaterial({
        vertexShader: FOLD_VERT,
        fragmentShader: FOLD_FRAG,
        uniforms: this.foldU,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      }),
    );
    this.foldLens.visible = false;
    this.fleet.add(this.foldLens);

    // starlight collapsing into the fold
    const FS = 520;
    this.fsBase = new Float32Array(FS * 3);
    const fsp = new Float32Array(FS * 2 * 3);
    for (let i = 0; i < FS; i++) {
      const j = (Math.random() * N) | 0;
      this.fsBase[i * 3] = pos[j * 3];
      this.fsBase[i * 3 + 1] = pos[j * 3 + 1];
      this.fsBase[i * 3 + 2] = pos[j * 3 + 2];
    }
    const fsg = new THREE.BufferGeometry();
    fsg.setAttribute("position", new THREE.BufferAttribute(fsp, 3));
    this.foldStreaks = new THREE.LineSegments(
      fsg,
      new THREE.LineBasicMaterial({
        color: 0xffd27a,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    this.foldStreaks.visible = false;
    this.scene.add(this.foldStreaks);

    // fold ring (heighliner folding space)
    this.fold = new THREE.Mesh(
      new THREE.TorusGeometry(3.4, 0.06, 8, 64),
      new THREE.MeshBasicMaterial({
        color: 0xffcc00,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    this.craftRig.add(this.fold);
    this.foldInner = new THREE.Mesh(
      new THREE.TorusGeometry(2.2, 0.03, 8, 64),
      new THREE.MeshBasicMaterial({
        color: 0xff9500,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    this.craftRig.add(this.foldInner);

    // the 19-node fleet, now escorting the craft
    this.R = 3.2;
    this.nodeGeo = new THREE.IcosahedronGeometry(0.055, 1);
    this.nodeMat = new THREE.MeshBasicMaterial({ color: 0x00f9ff });
    this.nodes = new THREE.InstancedMesh(this.nodeGeo, this.nodeMat, 19);
    this.nodes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const green = new THREE.Color(0x00ff9f),
      cyan = new THREE.Color(0x00f9ff);
    for (let i = 0; i < 19; i++) this.nodes.setColorAt(i, i % 6 === 0 ? green : cyan);
    if (this.nodes.instanceColor) this.nodes.instanceColor.needsUpdate = true;
    this.fleet.add(this.nodes);

    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(this.R, 0.005, 6, 128),
      new THREE.MeshBasicMaterial({
        color: 0xcc00ff,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    this.ring.rotation.x = Math.PI / 2;
    this.fleet.add(this.ring);
    this.ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(this.R * 0.7, 0.004, 6, 96),
      new THREE.MeshBasicMaterial({
        color: 0x00f9ff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    this.ring2.rotation.x = Math.PI / 2;
    this.ring2.visible = false;
    this.fleet.add(this.ring2);

    // routing beams (deck 03)
    const bp = new Float32Array(10 * 2 * 3);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      bp[i * 6 + 3] = Math.cos(a) * this.R * 1.5;
      bp[i * 6 + 4] = Math.sin(a) * 0.5;
      bp[i * 6 + 5] = Math.sin(a) * this.R * 1.5;
    }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute("position", new THREE.BufferAttribute(bp, 3));
    this.beams = new THREE.LineSegments(
      bg,
      new THREE.LineBasicMaterial({
        color: 0xff9500,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      }),
    );
    this.fleet.add(this.beams);

    this.composer = new EffectComposer(r);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.62, 0.58, 0.42);
    this.composer.addPass(this.bloom);
    this.grade = new ShaderPass(GRADE);
    this.composer.addPass(this.grade);
    r.autoClear = false;

    this._tmpC = new THREE.Color();
    this._matrix = new THREE.Matrix4();
    this._quat = new THREE.Quaternion();
    this._vec = new THREE.Vector3();
  }

  _fallback() {
    const g = this.canvas.getContext("2d");
    if (!g) return;
    const w = (this.canvas.width = this.clientWidth || 1200);
    const h = (this.canvas.height = this.clientHeight || 800);
    const grad = g.createRadialGradient(w * 0.8, h * 0.5, 0, w * 0.8, h * 0.5, Math.max(w, h) * 0.7);
    grad.addColorStop(0, "#101a2a");
    grad.addColorStop(1, "#05060a");
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 600; i++) {
      g.globalAlpha = 0.2 + Math.random() * 0.7;
      g.fillStyle = Math.random() < 0.2 ? "#00f9ff" : "#e4e4f0";
      g.beginPath();
      g.arc(Math.random() * w, Math.random() * h, Math.random() * 1.3, 0, 6.284);
      g.fill();
    }
  }

  _resize() {
    if (!this.renderer) return;
    const w = this.clientWidth || innerWidth,
      h = this.clientHeight || innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.bloom.setSize(w * 0.5, h * 0.5);
    if (this.grade) this.grade.uniforms.uRes.value.set(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.nebulaU.uAspect.value = w / h;
  }

  _frame(t: number) {
    const dt = Math.min(0.05, (t - (this._last || t)) / 1000);
    this._last = t;

    // Arrival. The stage does not replace the plate, it flies out of it: the
    // camera opens tight on the hull with the lens wide, then pulls back into
    // the conn as the field, the grade and the lights come up around it. It
    // runs once, on the first frames after the stage mounts.
    if (!this.arrivalDone) {
      this.arrivalT = Math.min(1, this.arrivalT + dt * (1000 / motionDurationMs("stage-arrival")));
      if (this.arrivalT >= 1) this.arrivalDone = true;
    }
    // easeOutCubic, so the last third of the move is almost still
    const arrive = 1 - Math.pow(1 - this.arrivalT, 3);
    const p = this.prog,
      deck = this.deck;
    this.warpT = Math.max(0, this.warpT - dt * (1000 / motionDurationMs("stage-warp")));
    const warp = this.warpT * this.warpT;

    const tint = DECK_TINT[deck] || DECK_TINT[0];
    this.nebulaU.uA.value.lerp(this._tmpC.setHex(tint[0]), 0.035);
    this.nebulaU.uB.value.lerp(this._tmpC.setHex(tint[1]), 0.035);
    this.nebulaU.uTime.value = t * 0.001;
    this.nebulaU.uProg.value = p;

    const camZ = (7.2 - p * 3.1 - warp * 1.5) * (0.46 + arrive * 0.54);
    const camY = 1.1 + p * 1.5 - (1 - arrive) * 0.42;
    this.camera.position.x += (this.mx * 0.55 - this.camera.position.x) * 0.045;
    this.camera.position.y += (camY - this.my * 0.35 - this.camera.position.y) * 0.05;
    this.camera.position.z += (camZ - this.camera.position.z) * 0.06;
    this.camera.fov += (55 + warp * 34 + (1 - arrive) * 26 - this.camera.fov) * 0.16;
    this.camera.updateProjectionMatrix();
    const hx = Math.sin(t * 0.00043) * 0.055 + Math.sin(t * 0.00117) * 0.022;
    const hy = Math.cos(t * 0.00037) * 0.045 + Math.sin(t * 0.00131) * 0.018;
    this.camera.position.x += hx * 0.6;
    this.camera.position.y += hy * 0.6;
    this.camera.lookAt(0.1 + hx * 0.5, 0.4 + hy * 0.5, 0);

    const halfW =
      Math.tan((this.camera.fov * Math.PI) / 360) * Math.max(2.2, this.camera.position.z) * this.camera.aspect;
    const halfH = halfW / this.camera.aspect;
    // The DOM reports where the live deck's glyphs actually end (right edge and
    // bottom). Fit the hull into whichever free region — beside the copy, or
    // below it — allows the larger ship, honouring the measurement either way.
    const R0 = 3.2; // hull bounding radius
    const leftNdc = this.clearX * 2 - 1;
    const halfA = (1 - leftNdc) * 0.5; // free band to the right
    const scaleA = (halfA * halfW * 0.92) / R0;
    const topNdc = 1 - this.clearY * 2;
    const halfB = (topNdc + 1) * 0.5; // free band below the copy
    const scaleB = (halfB * halfH * 0.92) / R0;

    let cxNdc, cyNdc, fit;
    if (scaleB > scaleA) {
      fit = scaleB;
      cxNdc = 0.28;
      cyNdc = topNdc - halfB;
    } else {
      fit = scaleA;
      cxNdc = leftNdc + halfA;
      cyNdc = -(0.04 + p * 0.12);
    }
    const lineageRecognition =
      deck === 4 && (this.craftTarget === 2 || this.craftTarget === 7) && this.camera.aspect >= 1.3;
    const phoenixDeck = this.craftTarget === 5 && (deck === 6 || deck === 7);
    const narrowPhoenix = phoenixDeck && this.camera.aspect < 1;
    const cramped = !lineageRecognition && !phoenixDeck && fit < 0.44;
    if (lineageRecognition) {
      fit = 0.34;
      cxNdc = 0.66;
      cyNdc = 0.04;
    } else if (phoenixDeck) {
      fit = narrowPhoenix ? 0.27 : deck === 6 ? 0.22 : 0.28;
      cxNdc = narrowPhoenix ? 0.42 : deck === 6 ? -0.42 : 0.7;
      cyNdc = narrowPhoenix ? -0.42 : deck === 6 ? 0.66 : 0.42;
    } else if (cramped) {
      fit = 0.76;
      cxNdc = 0.74;
      cyNdc = -(0.1 + p * 0.14);
    }
    fit = Math.min(fit, 1.0 / (this.mags[this.craftTarget] || 1));
    fit = Math.max(0.26, Math.min(0.98, fit)) * (1 - p * 0.06);
    const targetDim = lineageRecognition
      ? 0.62
      : phoenixDeck
        ? narrowPhoenix
          ? 0.4
          : deck === 6
            ? 0.6
            : 0.76
        : cramped
          ? 0.66
          : 1;
    this.dim += (targetDim * Math.min(1, arrive * 1.25) - this.dim) * (this.arrivalDone ? 0.06 : 0.14);

    const halfNdcX = (R0 * fit) / halfW;
    if (cxNdc + halfNdcX > 0.99) cxNdc = 0.99 - halfNdcX;
    this.fleet.scale.setScalar(fit);
    this.fleet.position.set(0.1 + cxNdc * halfW, 0.4 + cyNdc * halfH, 0);

    if (this.planet) {
      const PLANET_OP = [0, 0.9, 0.25, 0.18, 0.85, 0.3, 0.22, 0.28, 1];
      this.planetOp += ((PLANET_OP[deck] != null ? PLANET_OP[deck] : 0.3) - this.planetOp) * 0.022;
      this.planetBody.rotation.y = t * 0.00002;
      this.planetBody.material.opacity = this.planetOp;
      this.planetHalo.material.opacity = this.planetOp * 0.16;
      this.planetRings.material.opacity = this.planetOp * 0.62;
      this.planet.position.x = 19 + this.mx * 1.6;
      this.planet.position.y = 8.5 + this.my * 0.9 - p * 2.2;
      this.planet.visible = this.planetOp > 0.012;
    }

    if (this.motes) {
      this.motes.rotation.y = t * 0.000021 + this.mx * 0.012;
      this.motes.position.y = Math.sin(t * 0.00012) * 0.3;
      this.motes.material.opacity = 0.3 * this.dim;
    }

    if (this.meteorLines) {
      const ma = this.meteorLines.geometry.attributes.position.array;
      for (let i = 0; i < this.meteors.length; i++) {
        const mt = this.meteors[i];
        mt.t += dt;
        if (mt.t > mt.dur) {
          mt.t = -(5 + Math.random() * 20);
          const th = Math.random() * Math.PI * 2;
          mt.p.set(Math.cos(th) * 38, 8 + Math.random() * 16, -30 - Math.random() * 26);
          mt.d.set(-(6 + Math.random() * 14) * Math.sign(mt.p.x || 1), -(5 + Math.random() * 9), 0);
          mt.dur = 0.8 + Math.random() * 0.7;
        }
        const o = i * 6,
          tt = Math.max(0, mt.t);
        const k = mt.t > 0 ? Math.sin(Math.min(1, mt.t / mt.dur) * Math.PI) : 0;
        const x = mt.p.x + mt.d.x * tt,
          y = mt.p.y + mt.d.y * tt;
        ma[o] = x;
        ma[o + 1] = y;
        ma[o + 2] = mt.p.z;
        ma[o + 3] = x - mt.d.x * 0.09 * k;
        ma[o + 4] = y - mt.d.y * 0.09 * k;
        ma[o + 5] = mt.p.z;
      }
      this.meteorLines.geometry.attributes.position.needsUpdate = true;
    }

    if (this.tracer) {
      const ta = t * 0.00038;
      this.tracer.position.set(
        this.fleet.position.x + Math.cos(ta) * 5.4,
        this.fleet.position.y + 2.6 + Math.sin(ta * 1.3) * 1.8,
        Math.sin(ta) * 5.4 + 3.2,
      );
      this.tracer.intensity = 26 * this.dim;
    }

    this.stars.rotation.y = t * 0.000018 + this.mx * 0.035;
    this.stars.rotation.x = this.my * 0.022;
    if (!this._twk || t - this._twk > 90) {
      this._twk = t;
      const c = this.stars.geometry.attributes.color,
        a = c.array;
      for (let k = 0; k < 26; k++) {
        const i = ((Math.random() * (a.length / 3)) | 0) * 3;
        const f = 0.6 + Math.random() * 0.7;
        a[i] = Math.min(1, a[i] * f);
        a[i + 1] = Math.min(1, a[i + 1] * f);
        a[i + 2] = Math.min(1, a[i + 2] * f);
      }
      c.needsUpdate = true;
    }
    this.stars.material.opacity = (0.95 - warp * 0.8) * (0.3 + this.dim * 0.7);

    const sm = this.streaks.material;
    if (warp > 0.002) {
      const arr = this.streaks.geometry.attributes.position.array;
      for (let i = 0; i < this.stkLen.length; i++) {
        const b = i * 3,
          e = (i * 2 + 1) * 3;
        const k = 1 + this.stkLen[i] * warp * 0.85;
        arr[e] = this.stkBase[b] * k;
        arr[e + 1] = this.stkBase[b + 1] * k;
        arr[e + 2] = this.stkBase[b + 2] * k;
      }
      this.streaks.geometry.attributes.position.needsUpdate = true;
      sm.opacity = Math.min(0.9, warp * 1.1) * this.dim;
      this.streaks.visible = true;
    } else if (this.streaks.visible) {
      sm.opacity = 0;
      this.streaks.visible = false;
    }

    const gz = ((t * 0.0006) % 2) - 1;
    this.gridA.position.z = gz * 2;
    this.gridB.position.z = gz * 2;
    this.gridA.material.opacity = 0.13 * (1 - p * 0.55);
    this.gridB.material.opacity = 0.16 * (1 - p * 0.55);

    // ---- craft morph: driven by the deck you are on ----
    const gap = this.craftTarget - this.craftF;
    this.craftF += gap * 0.035;
    if (Math.abs(gap) < 0.002) this.craftF = this.craftTarget;
    const f = this.craftF;
    let i0 = Math.floor(f);
    if (i0 > CRAFT.length - 2) i0 = CRAFT.length - 2;
    if (i0 < 0) i0 = 0;
    const raw = Math.min(1, Math.max(0, f - i0));
    const mix = raw * raw * (3 - 2 * raw);
    this.stage = mix > 0.5 ? i0 + 1 : i0;

    const A = this.clouds[i0],
      B = this.clouds[i0 + 1];
    const live = this.hull.geometry.attributes.position.array;
    const swirl = Math.min(1, Math.abs(gap) * 1.6) * (1 - Math.abs(mix - 0.5) * 1.2) * 0.6; // fly apart mid-morph
    for (let i = 0; i < NP; i++) {
      const k = i * 3;
      const ax = A[k],
        ay = A[k + 1],
        az = A[k + 2];
      const bx = B[k],
        by = B[k + 1],
        bz = B[k + 2];
      const s = Math.sin(i * 12.9898 + t * 0.0016);
      const c = Math.cos(i * 78.233 + t * 0.0013);
      live[k] = ax + (bx - ax) * mix + s * swirl;
      live[k + 1] = ay + (by - ay) * mix + c * swirl * 0.7;
      live[k + 2] = az + (bz - az) * mix + s * c * swirl;
    }
    this.hull.geometry.attributes.position.needsUpdate = true;
    this.hull.material.color.lerpColors(
      this._tmpC.setHex(CRAFT[i0].tint).clone(),
      new THREE.Color(CRAFT[i0 + 1].tint),
      mix,
    );
    this.hull.material.size = 0.052 + swirl * 0.02;

    const settled = 1 - Math.min(1, Math.abs(gap) * 2.4);
    const pose = CRAFT[this.craftTarget].pose;
    const poseLock = pose ? settled * Math.max(0, 1 - Math.abs(f - this.craftTarget) * 1.8) : 0;
    const poseMotion = 1 + (((pose && pose.motion) || 1) - 1) * poseLock;
    for (let i = 0; i < this.wires.length; i++) {
      const w = i === i0 ? 1 - mix : i === i0 + 1 ? mix : 0;
      const wm = this.wires[i].material;
      const wireOpacity =
        lineageRecognition && i === this.craftTarget
          ? (CRAFT[i].lineageWireOpacity ?? 0.34)
          : (CRAFT[i].wireOpacity ?? 0.34);
      wm.opacity += (w * (wireOpacity + (1 - settled) * 0.44) * this.dim - wm.opacity) * 0.25;
      this.wires[i].visible = wm.opacity > 0.004;
      const sm2 = this.solids[i].material;
      const solidOpacity =
        lineageRecognition && i === this.craftTarget
          ? (CRAFT[i].lineageSolidOpacity ?? 0.98)
          : (CRAFT[i].solidOpacity ?? 0.98);
      sm2.opacity += (w * settled * solidOpacity * this.dim - sm2.opacity) * 0.16;
      this.solids[i].visible = sm2.opacity > 0.01;
    }
    const cloudOpacity = lineageRecognition
      ? 0.07
      : phoenixDeck
        ? 0.1 + (1 - settled) * 0.25
        : 0.35 + (1 - settled) * 0.6;
    this.hull.material.opacity = cloudOpacity * this.dim;

    // flight: gentle bank and pitch, plus a roll through each transition.
    // Once settled, ease the accumulated roll home to the nearest full turn
    // so no craft is ever left flying inverted.
    this._roll = (this._roll || 0) + Math.abs(gap) * 0.055;
    if (Math.abs(gap) < 0.3) {
      const home = Math.round(this._roll / (Math.PI * 2)) * (Math.PI * 2);
      this._roll += (home - this._roll) * Math.min(1, dt * 2.4);
    }
    this.bankT = Math.max(0, (this.bankT || 0) - dt * 0.8);
    const bank = this.bankT * this.bankT * (this.bankDir || 1);
    const poseYaw = -0.5 + (((pose && pose.yaw) ?? -0.5) + 0.5) * poseLock;
    const posePitch = ((pose && pose.pitch) || 0) * poseLock;
    const poseRoll = ((pose && pose.roll) || 0) * poseLock;
    this.craftRig.rotation.y = poseYaw + Math.sin(t * 0.00021) * 0.26 * poseMotion + bank * 0.44;
    this.craftRig.rotation.x = this._roll + posePitch + Math.sin(t * 0.00031) * 0.09 * poseMotion + bank * 0.14;
    this.craftRig.rotation.z =
      poseRoll + Math.sin(t * 0.00017) * 0.07 * poseMotion - Math.min(0.5, Math.abs(gap) * 0.5) - bank * 0.55;
    this.craftRig.position.y = Math.sin(t * 0.0004) * 0.14 * poseMotion;

    // exhaust interpolates length/width/colour between craft; the Blackbird
    // burns through its own twin ejectors instead of the shared centre plume
    const eA = CRAFT[i0].exhaust,
      eB = CRAFT[i0 + 1].exhaust;
    const nearBB = Math.max(0, 1 - Math.abs(f - 1) * 1.6);
    const len = (eA[0] + (eB[0] - eA[0]) * mix) * (1 - nearBB);
    const rad = eA[1] + (eB[1] - eA[1]) * mix;
    const flick = 0.86 + Math.sin(t * 0.02) * 0.14;
    this.exhaust.scale.set(Math.max(0.001, len * flick), Math.max(0.001, rad), Math.max(0.001, rad));
    this.exhaust.position.x = -2.5;
    this.exhaust.material.color.lerpColors(this._tmpC.setHex(eA[2]).clone(), new THREE.Color(eB[2]), mix);
    this.exhaust.material.opacity = 0.42 * (len > 0.05 ? 1 : 0) * (1 - swirl * 0.5) * this.dim;
    if (this.exhaustCore) {
      this.exhaustCore.scale.set(
        Math.max(0.001, len * flick * 0.52),
        Math.max(0.001, rad * 0.44),
        Math.max(0.001, rad * 0.44),
      );
      this.exhaustCore.position.x = -2.5;
      this.exhaustCore.material.opacity = 0.5 * (len > 0.05 ? 1 : 0) * (1 - swirl * 0.6) * this.dim;
    }

    // nav lights track whichever hull is settled
    const lg = this.lights[this.craftShown === undefined ? i0 : this.craftShown] || this.lights[i0];
    if (lg && this.navLights) {
      const np = this.navLights.geometry.attributes.position.array;
      np[0] = lg.port[0];
      np[1] = lg.port[1];
      np[2] = lg.port[2];
      np[3] = lg.star[0];
      np[4] = lg.star[1];
      np[5] = lg.star[2];
      np[6] = lg.nose[0];
      np[7] = lg.nose[1];
      np[8] = lg.nose[2];
      this.navLights.geometry.attributes.position.needsUpdate = true;
      this.navLights.material.opacity = settled * 0.95 * this.dim;
      this.navLights.material.size = 0.15 + Math.sin(t * 0.004) * 0.02;
      const sp = this.strobe.geometry.attributes.position.array;
      sp[0] = lg.tail[0];
      sp[1] = lg.tail[1];
      sp[2] = lg.tail[2];
      this.strobe.geometry.attributes.position.needsUpdate = true;
      const beat = (t * 0.0011) % 1;
      this.strobe.material.opacity = settled * this.dim * (beat < 0.06 ? 1 : beat < 0.12 ? 0.5 : 0);
    }

    // ion trail
    if (this.ionTrail && len > 0.05) {
      const tp = this.trailPos;
      for (let i = 0; i < this.TN; i++) {
        this.trailAge[i] += dt * 0.55;
        if (this.trailAge[i] > 1) {
          this.trailAge[i] = 0;
          tp[i * 3] = -2.4 - Math.random() * 0.3;
          tp[i * 3 + 1] = (Math.random() - 0.5) * rad * 0.7;
          tp[i * 3 + 2] = (Math.random() - 0.5) * rad * 0.7;
        } else {
          const a = this.trailAge[i];
          tp[i * 3] -= dt * (2.4 + len * 1.4);
          tp[i * 3 + 1] += (Math.random() - 0.5) * 0.012 + a * 0.002;
          tp[i * 3 + 2] += (Math.random() - 0.5) * 0.012;
        }
      }
      this.ionTrail.geometry.attributes.position.needsUpdate = true;
      this.ionTrail.material.color.copy(this.exhaust.material.color);
      this.ionTrail.material.opacity = 0.4 * settled * this.dim;
      this.ionTrail.visible = true;
    } else if (this.ionTrail) {
      this.ionTrail.visible = false;
    }

    if (this.flare) {
      this.flare.position.x = -2.5;
      this.flare.scale.setScalar((0.5 + rad * 1.6) * flick);
      this.flare.material.color.copy(this.exhaust.material.color);
      this.flare.material.opacity = 0.3 * (len > 0.05 ? 1 : 0) * this.dim;
    }

    if (this.ana) {
      this.flare.getWorldPosition(this._vec);
      this.fleet.worldToLocal(this._vec);
      this.ana.position.copy(this._vec);
      this.ana.quaternion.copy(this.camera.quaternion);
      this.ana.scale.set(0.6 + rad * 2.4, 1, 1);
      this.ana.material.color.copy(this.exhaust.material.color);
      this.ana.material.opacity = 0.36 * (len > 0.05 ? 1 : 0) * flick * this.dim;
      this.ana.visible = this.ana.material.opacity > 0.01;
    }

    // stage set pieces
    const nearX1 = Math.max(0, 1 - Math.abs(f - 0.15) * 1.6);
    const sc = 1 + ((t * 0.0009) % 1) * 2.6;
    this.shock.scale.setScalar(sc);
    this.shock.position.x = -0.6 - sc * 0.3;
    this.shock.material.opacity = nearX1 * (1 - ((t * 0.0009) % 1)) * 0.42 * this.dim;

    if (this.abPlumes && this.abAnchors) {
      const bf = 0.8 + Math.sin(t * 0.024) * 0.2 + Math.sin(t * 0.087) * 0.06;
      for (let k = 0; k < 2; k++) {
        const m2 = this.abPlumes[k],
          a2 = this.abAnchors[k];
        m2.position.set(a2[0] + 0.05, a2[1], a2[2]);
        m2.scale.set(Math.max(0.001, 1.8 * bf * nearBB), 0.3, 0.3);
        m2.material.opacity = nearBB * 0.5 * (1 - swirl * 0.5) * this.dim;
        m2.visible = nearBB > 0.02;
      }
    }

    const nearWarp = Math.max(0, 1 - Math.abs(f - 5) * 1.3);
    if (this.fillLight) this.fillLight.intensity = 1.2 - nearWarp * 1.16;
    const pulse = Math.sin(t * 0.0018) * 0.04;
    this.warpFieldU.uTime.value = t * 0.001;
    const fieldDeckFactor = deck === 6 ? 0.64 : 1;
    this.warpFieldU.uOpacity.value = nearWarp * 0.32 * fieldDeckFactor * this.dim;
    this.bubble.scale.set(1.14 + pulse, 0.46 + pulse * 0.18, 0.64 + pulse * 0.2);
    this.bubble.visible = nearWarp > 0.01;
    if (this.warpRings) {
      for (let k = 0; k < this.warpRings.length; k++) {
        const r = this.warpRings[k];
        const phase = (t * 0.00018 + k / this.warpRings.length) % 1;
        r.position.x = 2.35 - phase * 4.9;
        r.scale.set(1, 0.72 + phase * 0.08, 0.96 + phase * 0.12);
        r.material.opacity = nearWarp * (0.12 + phase * 0.1) * this.dim;
        r.visible = nearWarp > 0.02;
      }
    }
    if (this.warpCoils) {
      const coilPulse = 0.82 + Math.sin(t * 0.0042) * 0.18;
      for (const coil of this.warpCoils) {
        coil.material.opacity = nearWarp * 0.34 * coilPulse * this.dim;
        coil.visible = nearWarp > 0.02;
      }
    }
    if (this.warpCollectors) {
      const collectorPulse = 0.78 + Math.sin(t * 0.0034 + 0.8) * 0.22;
      for (const collector of this.warpCollectors) {
        collector.material.opacity = nearWarp * 0.26 * collectorPulse * this.dim;
        collector.visible = nearWarp > 0.02;
      }
    }
    const phx = this.solids[5];
    if (phx && phx.material && phx.material.emissive) {
      const em = 0.012 + nearWarp * (0.026 + Math.sin(t * 0.004) * 0.008);
      phx.material.emissive.setHex(0x00f9ff).multiplyScalar(em);
    }

    const nearFold = Math.max(0, 1 - Math.abs(f - 6) * 1.25);
    this.fold.material.opacity = nearFold * 0.85 * this.dim;
    this.foldInner.material.opacity = nearFold * 0.6 * this.dim;
    this.fold.rotation.z = t * 0.0004;
    this.foldInner.rotation.z = -t * 0.0007;
    this.fold.scale.setScalar(1 + Math.sin(t * 0.001) * 0.03);
    this.foldInner.scale.setScalar(1.0 + nearFold * 0.5 + Math.sin(t * 0.0016) * 0.05);
    this.fold.visible = this.foldInner.visible = nearFold > 0.01;

    if (this.foldLens) {
      const amt = Math.pow(nearFold, 1.25);
      this.foldU.uTime.value = t * 0.001;
      this.foldU.uAmt.value = amt * 0.4 * (0.45 + this.dim * 0.55);
      this.foldLens.visible = amt > 0.008;
      this.foldLens.position.set(3.4, 0.1, 0);
      this.foldLens.scale.setScalar(0.45 + amt * 0.6);
      this.foldLens.quaternion.copy(this.camera.quaternion);

      if (amt > 0.02) {
        const c = this.foldLens.getWorldPosition(this._vec2 || (this._vec2 = new THREE.Vector3()));
        const arr = this.foldStreaks.geometry.attributes.position.array;
        const pull = amt * 0.55;
        for (let i = 0; i < this.fsBase.length / 3; i++) {
          const b = i * 3,
            s = i * 6;
          const bx = this.fsBase[b],
            by = this.fsBase[b + 1],
            bz = this.fsBase[b + 2];
          arr[s] = bx;
          arr[s + 1] = by;
          arr[s + 2] = bz;
          arr[s + 3] = bx + (c.x - bx) * pull;
          arr[s + 4] = by + (c.y - by) * pull;
          arr[s + 5] = bz + (c.z - bz) * pull;
        }
        this.foldStreaks.geometry.attributes.position.needsUpdate = true;
        this.foldStreaks.material.opacity = amt * 0.32 * this.dim;
        this.foldStreaks.visible = true;
      } else if (this.foldStreaks.visible) {
        this.foldStreaks.visible = false;
      }
    }

    // escort fleet — on THE GRID it splits into two counter-tiered shells
    this.gridF = (this.gridF || 0) + ((deck === 1 ? 1 : 0) - this.gridF) * 0.03;
    const rot = t * 0.00013,
      tilt = 0.3 + p * 0.4;
    const m = this._matrix,
      q = this._quat,
      v = this._vec;
    const sv = this._sv || (this._sv = new THREE.Vector3(1, 1, 1));
    for (let i = 0; i < 19; i++) {
      const a = (i / 19) * Math.PI * 2 + rot;
      const rr = this.R * (1 + this.gridF * (i < 7 ? -0.3 : 0.14));
      const x = Math.cos(a) * rr,
        z = Math.sin(a) * rr;
      const y = Math.sin(a * 2 + t * 0.0004) * this.R * tilt * 0.2 + this.gridF * (i < 7 ? 0.5 : -0.32);
      const pop = 1 + Math.sin(t * 0.003 + i) * 0.2 + (deck === 1 ? 0.6 : 0);
      m.compose(v.set(x, y, z), q, sv.setScalar(pop));
      this.nodes.setMatrixAt(i, m);
    }
    this.nodes.instanceMatrix.needsUpdate = true;
    this.ring.rotation.z = rot * 2;
    this.ring.position.y = -this.gridF * 0.32;
    this.ring.material.opacity = 0.4 * (1 - nearWarp) * this.dim;
    if (this.ring2) {
      this.ring2.rotation.z = -rot * 2.4;
      this.ring2.position.y = this.gridF * 0.5;
      this.ring2.material.opacity = 0.34 * this.gridF * this.dim;
      this.ring2.visible = this.gridF > 0.02;
    }

    this.beams.material.opacity += ((deck === 2 ? 0.45 : 0) * this.dim - this.beams.material.opacity) * 0.06;
    this.beams.rotation.y = rot * 3;

    const poseBloom = 1 + (((pose && pose.bloom) || 1) - 1) * poseLock;
    const poseExposure = 1 + (((pose && pose.exposure) || 1) - 1) * poseLock;
    this.bloom.strength = Math.min(
      2.05,
      (0.68 + warp * 1.15 + nearFold * 0.34 + nearWarp * 0.3 + (1 - arrive) * 0.52) *
        (0.22 + this.dim * 0.82) *
        poseBloom,
    );

    if (this.grade) {
      this.grade.uniforms.uTime.value = t * 0.001;
      this.grade.uniforms.uAmt.value = 0.35 + this.dim * 0.65 + warp * 0.9;
      this.grade.uniforms.uTear.value = Math.max(0, warp * 1.25 - 0.15);
      this.grade.uniforms.uStreak.value = (0.35 + warp * 1.1 + nearFold * 0.35) * this.dim;
    }
    this.renderer.toneMappingExposure = (0.72 + this.dim * 0.62 + warp * 0.55) * poseExposure;
    this.renderer.clear();
    this.renderer.render(this.bgScene, this.bgCam);
    this.composer.render();
  }

  _renderReduced() {
    if (this.reduce && this.renderer) this._frame(performance.now());
  }
  setProgress(v: number) {
    this.prog = Math.max(0, Math.min(1, v || 0));
    this._renderReduced();
  }
  setDeck(i: number) {
    this.deck = i | 0;
    this._renderReduced();
  }
  setCraft(i: number) {
    const next = Math.max(0, Math.min(CRAFT.length - 1, i | 0));
    if (next !== this.craftTarget) {
      this.bankT = 1;
      this.bankDir = next > this.craftTarget ? 1 : -1;
      this.warpT = 1;
    }
    this.craftTarget = next;
    if (this.reduce) {
      this.craftF = next;
      this.stage = next;
      this.warpT = 0;
      this._renderReduced();
    }
  }
  setClearX(f: number) {
    this.clearX = Math.max(0.12, Math.min(0.9, f || 0.5));
  }
  setClearRect(rx: number, by: number) {
    this.setClearX(rx);
    this.clearY = Math.max(0.3, Math.min(0.95, by || 0.85));
    this._renderReduced();
  }
  setReducedMotion(reduce: boolean) {
    const next = Boolean(reduce);
    if (this.reduce === next) return;
    this.reduce = next;
    if (next) {
      this.arrivalT = 1;
      this.arrivalDone = true;
    }
    if (next) {
      cancelAnimationFrame(this._raf);
      this._raf = 0;
      this.warpT = 0;
      this.bankT = 0;
      this.craftF = this.craftTarget;
      this.stage = this.craftTarget;
      this._renderReduced();
      return;
    }
    if (this._started && !this.paused && !this._raf && this._loop) this._raf = requestAnimationFrame(this._loop);
  }
  warp() {
    if (!this.reduce) this.warpT = 1;
  }
  craftIndex() {
    return this.stage;
  }

  dispose() {
    cancelAnimationFrame(this._raf);
    if (this.envMap) this.envMap.dispose();
    if (this.panelTex) this.panelTex.dispose();
    if (this.normalTex) this.normalTex.dispose();
    if (this.glintTex) this.glintTex.dispose();
    if (this._onResize) removeEventListener("resize", this._onResize);
    if (this._onMove) removeEventListener("pointermove", this._onMove);
    if (this._onVis) document.removeEventListener("visibilitychange", this._onVis);
    // Walk a scene graph and release every GPU resource it still owns.
    const kill = (root: THREE.Object3D | undefined) =>
      root &&
      root.traverse((o: THREE.Object3D) => {
        const holder = o as Partial<THREE.Mesh>;
        if (holder.geometry) holder.geometry.dispose();
        const raw = holder.material;
        const mats: THREE.Material[] = raw ? (Array.isArray(raw) ? raw : [raw]) : [];
        for (const mm of mats) {
          for (const k of Object.keys(mm)) {
            const val = (mm as unknown as Record<string, unknown>)[k] as THREE.Texture | undefined;
            if (val && val.isTexture) val.dispose();
          }
          mm.dispose();
        }
      });
    kill(this.scene);
    kill(this.bgScene);
    if (this.composer && this.composer.dispose) this.composer.dispose();
    if (this.renderer) this.renderer.dispose();
  }
}

export { CRAFT as CRAFT_SPECS };

if (typeof customElements !== "undefined" && !customElements.get("viewscreen-stage")) {
  customElements.define("viewscreen-stage", ViewscreenStage);
}
