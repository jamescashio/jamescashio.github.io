/* <dyson-stage> — ZeusApollo viewscreen.
   A star under a partially-built Dyson swarm: collector rings, an unfinished
   shell lattice, a shipyard node throwing construction beams, a Tron grid
   horizon and a starfield. One rAF loop, scroll-driven camera, damped pointer
   parallax, reduced-motion still frame, poster fallback with no WebGL. */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const ORANGE = new THREE.Color('#ff9500');
const HOT = new THREE.Color('#ff6a00');
const CYAN = new THREE.Color('#00f9ff');
const GREEN = new THREE.Color('#00ff9f');

const WAYPOINTS = [
  { pos: [0.9, 0.55, 8.4], look: [0, -0.1, 0], fov: 46 },  // 00 viewscreen
  { pos: [3.9, 1.15, 6.4], look: [0.1, 0.05, 0] },       // 01 grid
  { pos: [-4.4, -0.9, 6.0], look: [-0.1, 0.15, 0] },     // 02 routing
  { pos: [1.2, 3.5, 5.2], look: [0, -0.35, 0] },         // 03 iron
  { pos: [-2.2, 0.2, 3.15], look: [0.2, 0, 0] },         // 04 lineage / builds
  { pos: [5.6, -1.9, 7.6], look: [-0.2, 0.2, 0] },       // 05 operator
  { pos: [0.4, 0.9, 12.6], look: [0, 0, 0] },            // 06 console
  { pos: [0.0, 0.25, 8.0], look: [0, 0, 0] }             // 07 hail
];

const STAR_VERT = `
  varying vec3 vN; varying vec3 vP;
  void main(){ vN = normalize(normalMatrix * normal); vP = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;

const STAR_FRAG = `
  uniform float uT; uniform vec3 uA; uniform vec3 uB;
  varying vec3 vN; varying vec3 vP;
  float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
  float n3(vec3 p){
    vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    float a = mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                  mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);
    return a;
  }
  void main(){
    vec3 q = vP * 2.1;
    float g = n3(q + vec3(0.0, uT*0.11, 0.0))*0.55
            + n3(q*2.7 - vec3(uT*0.16))*0.28
            + n3(q*6.1 + vec3(uT*0.24))*0.17;
    float rim = pow(1.0 - abs(dot(vN, vec3(0.0,0.0,1.0))), 1.7);
    vec3 c = mix(uB, uA, smoothstep(0.28, 0.86, g));
    c += uA * rim * 1.55;
    c += vec3(1.0, 0.92, 0.78) * pow(g, 5.0) * 0.6;
    gl_FragColor = vec4(c, 1.0);
  }`;

const GRID_VERT = `varying vec2 vUv; void main(){ vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;

const GRID_FRAG = `
  uniform float uT; uniform vec3 uC; uniform vec3 uC2;
  varying vec2 vUv;
  void main(){
    vec2 g = vUv * 46.0;
    vec2 f = abs(fract(g) - 0.5) / fwidth(g);
    float line = 1.0 - min(min(f.x, f.y), 1.0);
    float sweep = smoothstep(0.0, 0.35, 0.35 - abs(fract(vUv.y*1.0 - uT*0.055) - 0.5) * 2.0);
    float d = 1.0 - smoothstep(0.06, 0.5, distance(vUv, vec2(0.5)));
    vec3 c = mix(uC, uC2, smoothstep(0.2, 0.9, sweep));
    gl_FragColor = vec4(c, line * d * (0.30 + sweep * 0.55));
  }`;

function panelTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = '#0d1120'; x.fillRect(0, 0, 128, 64);
  for (let i = 0; i < 128; i += 4) {
    x.fillStyle = i % 8 ? 'rgba(255,149,0,.16)' : 'rgba(0,249,255,.13)';
    x.fillRect(i, 2, 2, 60);
  }
  x.strokeStyle = 'rgba(255,255,255,.20)'; x.lineWidth = 1;
  x.strokeRect(1.5, 1.5, 125, 61);
  x.fillStyle = 'rgba(255,196,110,.30)'; x.fillRect(0, 30, 128, 2);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d').createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,236,200,1)');
  g.addColorStop(0.18, 'rgba(255,164,54,0.72)');
  g.addColorStop(0.48, 'rgba(255,106,0,0.20)');
  g.addColorStop(1, 'rgba(255,106,0,0)');
  const ctx = c.getContext('2d'); ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

class DysonStage extends HTMLElement {
  connectedCallback() {
    if (this._up) return; this._up = true;
    this.style.display = 'block';
    this.style.background =
      'radial-gradient(circle at 50% 46%, rgba(255,149,0,.20), transparent 38%),' +
      'radial-gradient(circle at 12% 8%, rgba(0,249,255,.07), transparent 46%),' +
      'radial-gradient(circle at 86% 96%, rgba(204,0,255,.06), transparent 52%)';
    this.canvas = document.createElement('canvas');
    Object.assign(this.canvas.style, { width: '100%', height: '100%', display: 'block' });
    this.appendChild(this.canvas);
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    try { this.boot(); } catch (e) { this.canvas.remove(); console.warn('[dyson-stage] no webgl', e); }
  }

  disconnectedCallback() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    removeEventListener('resize', this._onResize);
    removeEventListener('pointermove', this._onPointer);
    if (this._scrollEl) this._scrollEl.removeEventListener('scroll', this._onScroll);
    removeEventListener('scroll', this._onScroll);
    this.renderer?.dispose();
  }

  boot() {
    const w = this.clientWidth || 1200, h = this.clientHeight || 800;
    const renderer = this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas, antialias: true, alpha: true, powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.setSize(w, h, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;

    const scene = this.scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05060a, 0.031);
    const camera = this.camera = new THREE.PerspectiveCamera(46, w / h, 0.1, 240);
    camera.position.set(0, 0.35, 9.2);

    const root = this.root = new THREE.Group();
    root.rotation.z = 0.14;
    root.position.set(1.55, -0.75, 0);
    scene.add(root);

    /* ── the star ───────────────────────────────────────────────────── */
    this.starU = { uT: { value: 0 }, uA: { value: ORANGE.clone() }, uB: { value: HOT.clone().multiplyScalar(0.32) } };
    const star = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.16, 24),
      new THREE.ShaderMaterial({ vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, uniforms: this.starU })
    );
    root.add(star); this.star = star;

    const glow = this.glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.78
    }));
    glow.scale.set(6.0, 6.0, 1); root.add(glow);

    const corona = this.corona = new THREE.Mesh(
      new THREE.RingGeometry(1.28, 1.62, 128),
      new THREE.MeshBasicMaterial({ color: 0xffb43c, transparent: true, opacity: 0.10, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    corona.rotation.x = Math.PI * 0.5; root.add(corona);

    const light = new THREE.PointLight(0xffb057, 340, 60, 2);
    root.add(light);
    root.add(new THREE.HemisphereLight(0x0a1a2a, 0x00121a, 0.55));
    const rim = new THREE.DirectionalLight(0x00f9ff, 1.5);
    rim.position.set(-6, 4, -5); root.add(rim);
    const fill = new THREE.DirectionalLight(0xff9500, 0.7);
    fill.position.set(5, -3, 6); root.add(fill);

    /* ── the swarm: three inclined rings of collector panels ───────── */
    const panelTex = panelTexture();
    const RINGS = [
      { r: 2.32, n: 96, inc: 0.00, tilt: 0.0, c: ORANGE, sp: 0.062 },
      { r: 3.05, n: 84, inc: 0.62, tilt: 0.5, c: CYAN, sp: -0.045 },
      { r: 3.86, n: 72, inc: -0.42, tilt: 1.9, c: ORANGE, sp: 0.031 }
    ];
    this.rings = RINGS.map(cfg => {
      const g = new THREE.Group();
      g.rotation.x = cfg.inc; g.rotation.z = cfg.tilt;
      const mesh = new THREE.InstancedMesh(
        new THREE.BoxGeometry(0.40, 0.015, 0.24),
        new THREE.MeshStandardMaterial({
          map: panelTex, emissiveMap: panelTex,
          color: 0x2a3348, metalness: 0.88, roughness: 0.24,
          emissive: cfg.c.clone().multiplyScalar(0.42), side: THREE.DoubleSide
        }),
        cfg.n
      );
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      const p = new THREE.Vector3(), s = new THREE.Vector3(1, 1, 1);
      for (let i = 0; i < cfg.n; i++) {
        const a = (i / cfg.n) * Math.PI * 2;
        const rr = cfg.r + (i % 3) * 0.055;
        p.set(Math.cos(a) * rr, (i % 5 - 2) * 0.018, Math.sin(a) * rr);
        e.set(Math.sin(a * 3) * 0.35, -a, 0.42 + Math.cos(a * 2) * 0.2);
        q.setFromEuler(e);
        s.setScalar(0.8 + (i % 4) * 0.16);
        mesh.setMatrixAt(i, m.compose(p, q, s));
      }
      mesh.instanceMatrix.needsUpdate = true;
      const trail = new THREE.Mesh(
        new THREE.RingGeometry(cfg.r - 0.035, cfg.r + 0.035, 220),
        new THREE.MeshBasicMaterial({ color: cfg.c, transparent: true, opacity: 0.16, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      trail.rotation.x = Math.PI * 0.5;
      g.add(mesh, trail); root.add(g);
      return { g, sp: cfg.sp };
    });

    /* ── the unfinished shell ───────────────────────────────────────── */
    const shellGeo = new THREE.IcosahedronGeometry(4.55, 3);
    const shell = this.shell = new THREE.LineSegments(
      new THREE.WireframeGeometry(shellGeo),
      new THREE.LineBasicMaterial({ color: 0x00f9ff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    root.add(shell);

    const built = shellGeo.clone();
    const pos = built.attributes.position;
    const keep = [];
    for (let f = 0; f < pos.count; f += 3) {
      const y = pos.getY(f), x = pos.getX(f);
      if (y > 0.4 && x < 2.6) keep.push(f, f + 1, f + 2);
    }
    built.setIndex(keep);
    const plates = this.plates = new THREE.Mesh(built, new THREE.MeshStandardMaterial({
      color: 0x2a1b06, metalness: 0.9, roughness: 0.36, side: THREE.DoubleSide,
      emissive: ORANGE.clone().multiplyScalar(0.10), transparent: true, opacity: 0.62
    }));
    root.add(plates);

    /* ── shipyard + construction beams ─────────────────────────────── */
    const yard = this.yard = new THREE.Group();
    yard.add(new THREE.Mesh(
      new THREE.TorusGeometry(0.30, 0.045, 10, 40),
      new THREE.MeshStandardMaterial({ color: 0x111626, metalness: 0.95, roughness: 0.22, emissive: GREEN.clone().multiplyScalar(0.35) })
    ));
    yard.position.set(2.0, 3.35, 1.2);
    root.add(yard);

    this.beams = [0, 1, 2].map(i => {
      const b = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.028, 2.6, 6, 1, true),
        new THREE.MeshBasicMaterial({ color: i === 1 ? 0x00ff9f : 0xff9500, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      b.position.copy(yard.position);
      b.rotation.z = -0.5 - i * 0.35; b.rotation.x = i * 0.4;
      root.add(b); return b;
    });

    /* ── starfield ─────────────────────────────────────────────────── */
    const N = 2600, sp = new Float32Array(N * 3), sc = new Float32Array(N * 3), ss = new Float32Array(N);
    const tint = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const r = 42 + Math.random() * 92, t = Math.random() * Math.PI * 2, u = Math.random() * 2 - 1;
      sp[i * 3] = r * Math.sqrt(1 - u * u) * Math.cos(t);
      sp[i * 3 + 1] = r * u * 0.72;
      sp[i * 3 + 2] = r * Math.sqrt(1 - u * u) * Math.sin(t);
      tint.setHSL(Math.random() < 0.24 ? 0.52 : 0.09, 0.55, 0.62 + Math.random() * 0.3);
      sc[i * 3] = tint.r; sc[i * 3 + 1] = tint.g; sc[i * 3 + 2] = tint.b;
      ss[i] = 0.06 + Math.random() * 0.2;
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    sg.setAttribute('color', new THREE.BufferAttribute(sc, 3));
    sg.setAttribute('size', new THREE.BufferAttribute(ss, 1));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({
      size: 0.34, vertexColors: true, transparent: true, opacity: 0.8,
      sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    scene.add(this.stars);

    /* ── Tron grid horizon ─────────────────────────────────────────── */
    this.gridU = { uT: { value: 0 }, uC: { value: new THREE.Color('#0a4d63') }, uC2: { value: CYAN.clone() } };
    const grid = this.grid = new THREE.Mesh(
      new THREE.PlaneGeometry(180, 180),
      new THREE.ShaderMaterial({
        vertexShader: GRID_VERT, fragmentShader: GRID_FRAG, uniforms: this.gridU,
        transparent: true, depthWrite: false, side: THREE.DoubleSide
      })
    );
    grid.rotation.x = -Math.PI / 2; grid.position.y = -8.4;
    scene.add(grid);

    /* ── bloom ─────────────────────────────────────────────────────── */
    try {
      const composer = this.composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.66, 0.70, 0.24);
      composer.addPass(bloom);
      composer.setSize(w, h);
    } catch (e) { this.composer = null; }

    /* ── input + clock ─────────────────────────────────────────────── */
    this.state = { progress: 0, ptr: { x: 0, y: 0 }, damp: { x: 0, y: 0 } };
    this._pos = new THREE.Vector3(); this._look = new THREE.Vector3();
    this._a = new THREE.Vector3(); this._b = new THREE.Vector3();
    this.clock = new THREE.Clock();

    this._onResize = () => {
      const W = this.clientWidth || 1200, H = this.clientHeight || 800;
      camera.aspect = W / H; camera.updateProjectionMatrix();
      renderer.setSize(W, H, false); this.composer?.setSize(W, H);
      if (this.reduced) this.frame(0);
    };
    this._onPointer = e => {
      this.state.ptr.x = (e.clientX / innerWidth) * 2 - 1;
      this.state.ptr.y = (e.clientY / innerHeight) * 2 - 1;
    };
    this._scrollEl = this.findScroller();
    this._onScroll = () => {
      const el = this._scrollEl;
      const max = el === document.documentElement
        ? (el.scrollHeight - innerHeight) : (el.scrollHeight - el.clientHeight);
      const top = el === document.documentElement ? (scrollY || el.scrollTop) : el.scrollTop;
      this.state.progress = max > 8 ? Math.min(Math.max(top / max, 0), 1) : 0;
    };
    addEventListener('resize', this._onResize, { passive: true });
    addEventListener('scroll', this._onScroll, { passive: true });
    if (this._scrollEl !== document.documentElement) this._scrollEl.addEventListener('scroll', this._onScroll, { passive: true });
    this._onScroll();

    if (matchMedia('(pointer: fine)').matches) addEventListener('pointermove', this._onPointer, { passive: true });

    if (this.reduced) { this.frame(0); return; }
    this.running = true;
    document.addEventListener('visibilitychange', () => { this.paused = document.hidden; });
    const tick = () => {
      this._raf = requestAnimationFrame(tick);
      if (this.paused) return;
      this.frame(Math.min(this.clock.getDelta(), 0.05));
    };
    this._raf = requestAnimationFrame(tick);
  }

  findScroller() {
    let el = this.parentElement;
    while (el && el !== document.body) {
      const o = getComputedStyle(el).overflowY;
      if ((o === 'auto' || o === 'scroll') && el.scrollHeight > el.clientHeight + 40) return el;
      el = el.parentElement;
    }
    return document.documentElement;
  }

  applyCamera(p) {
    const segs = WAYPOINTS.length - 1;
    const t = Math.min(Math.max(p, 0), 0.9999) * segs;
    const i = Math.floor(t), f = t - i, e = f * f * (3 - 2 * f);
    const A = WAYPOINTS[i], B = WAYPOINTS[Math.min(i + 1, segs)];
    this._a.fromArray(A.pos); this._b.fromArray(B.pos);
    this._pos.copy(this._a).lerp(this._b, e);
    this._a.fromArray(A.look); this._b.fromArray(B.look);
    this._look.copy(this._a).lerp(this._b, e);
    const d = this.state.damp;
    this.camera.position.set(this._pos.x + d.x * 0.5, this._pos.y - d.y * 0.34, this._pos.z);
    this.camera.lookAt(this._look);
  }

  frame(dt) {
    const s = this.state, T = this.clock.getElapsedTime();
    const k = 1 - Math.exp(-6.2 * (dt || 0.016));
    s.damp.x += (s.ptr.x - s.damp.x) * k;
    s.damp.y += (s.ptr.y - s.damp.y) * k;
    this.starU.uT.value = T; this.gridU.uT.value = T;
    this.star.rotation.y += dt * 0.028;
    this.corona.rotation.z += dt * 0.09;
    this.corona.material.opacity = 0.08 + Math.sin(T * 0.9) * 0.03;
    this.shell.rotation.y += dt * 0.022;
    this.plates.rotation.y = this.shell.rotation.y;
    this.rings.forEach(r => { r.g.rotation.y += dt * r.sp * 4.4; });
    this.yard.rotation.x += dt * 0.6; this.yard.rotation.y += dt * 0.4;
    this.beams.forEach((b, i) => { b.material.opacity = 0.22 + Math.abs(Math.sin(T * (1.1 + i * 0.4))) * 0.5; });
    this.stars.rotation.y += dt * 0.004;
    this.glow.material.opacity = 0.70 + Math.sin(T * 0.55) * 0.06;
    this.applyCamera(s.progress);
    if (this.composer) this.composer.render(dt); else this.renderer.render(this.scene, this.camera);
  }
}

if (!customElements.get('dyson-stage')) customElements.define('dyson-stage', DysonStage);
