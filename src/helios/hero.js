import * as THREE from "three";
import { gsap } from "gsap";

/** A finite, visitor-requested light orbit. The authored artwork remains the primary scene. */
export function startHero({ getMotion, onReady }) {
  const canvas = document.getElementById("gl");
  const fallback = document.getElementById("fallback");

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "low-power" });
  } catch {
    fallback.style.opacity = 1;
    canvas.remove();
  }
  if (renderer) {
    const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.25 : 1.5);
    renderer.setPixelRatio(dpr);
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    cam.position.set(0, 0, 9);
    const N = window.innerWidth < 700 ? 3000 : 10000;
    const start = new Float32Array(N * 3),
      ring = new Float32Array(N * 3),
      col = new Float32Array(N * 3),
      size = new Float32Array(N),
      seed = new Float32Array(N);
    const gold = new THREE.Color("#F2C87A"),
      cyan = new THREE.Color("#38E1FF"),
      ice = new THREE.Color("#BFE9F5");
    for (let i = 0; i < N; i++) {
      const i3 = i * 3;
      const r = 6 + Math.random() * 10;
      const th = Math.random() * Math.PI * 2,
        ph = Math.acos(2 * Math.random() - 1);
      start[i3] = r * Math.sin(ph) * Math.cos(th);
      start[i3 + 1] = r * Math.sin(ph) * Math.sin(th);
      start[i3 + 2] = r * Math.cos(ph) - 4;
      const kind = Math.random();
      let c;
      if (kind < 0.78) {
        // main ring, slight thickness, a titanium structure
        const a = Math.random() * Math.PI * 2;
        const R = 2.9 + (Math.random() - 0.5) * 0.28;
        const z = (Math.random() - 0.5) * 0.22;
        ring[i3] = Math.cos(a) * R;
        ring[i3 + 1] = Math.sin(a) * R;
        ring[i3 + 2] = z;
        c = Math.random() < 0.85 ? ice.clone().lerp(cyan, Math.random() * 0.9) : gold;
        size[i] = 0.9 + Math.random() * 1.6;
      } else if (kind < 0.9) {
        // outer thin cyan orbit
        const a = Math.random() * Math.PI * 2;
        const R = 3.9 + (Math.random() - 0.5) * 0.06;
        ring[i3] = Math.cos(a) * R;
        ring[i3 + 1] = Math.sin(a) * R * 0.55;
        ring[i3 + 2] = Math.sin(a) * R * 0.5;
        c = cyan;
        size[i] = 0.6 + Math.random();
      } else {
        // faceted gold core
        const th2 = Math.random() * Math.PI * 2,
          ph2 = Math.acos(2 * Math.random() - 1);
        const R = 0.55 * (0.6 + 0.4 * Math.pow(Math.random(), 0.3));
        ring[i3] = R * Math.sin(ph2) * Math.cos(th2);
        ring[i3 + 1] = R * Math.sin(ph2) * Math.sin(th2);
        ring[i3 + 2] = R * Math.cos(ph2);
        c = gold.clone().lerp(new THREE.Color("#fff2cc"), Math.random() * 0.5);
        size[i] = 1.4 + Math.random() * 2.2;
      }
      col[i3] = c.r;
      col[i3 + 1] = c.g;
      col[i3 + 2] = c.b;
      seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("aStart", new THREE.BufferAttribute(start, 3));
    g.setAttribute("aRing", new THREE.BufferAttribute(ring, 3));
    g.setAttribute("position", new THREE.BufferAttribute(ring.slice(), 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uT: { value: 0 }, uMix: { value: 0 }, uPix: { value: dpr }, uGlow: { value: 0 } },
      vertexShader: `attribute vec3 aStart; attribute vec3 aRing; attribute vec3 aColor; attribute float aSize; attribute float aSeed; uniform float uT; uniform float uMix; uniform float uPix; varying vec3 vC; varying float vA;
      void main(){ float e = uMix; e = 1.0 - pow(1.0 - e, 3.0); vec3 p = mix(aStart, aRing, clamp(e + aSeed*0.15*e, 0.0, 1.0));
        p.x += sin(uT*0.8 + aSeed*6.28)*0.02; p.y += cos(uT*0.7 + aSeed*6.28)*0.02;
        vec4 mv = modelViewMatrix * vec4(p,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aSize * uPix * (14.0 / -mv.z) * (0.6 + 0.4*e);
        vC = aColor; vA = 0.35 + 0.65*e; }`,
      fragmentShader: `varying vec3 vC; varying float vA; uniform float uGlow; void main(){ vec2 q = gl_PointCoord - 0.5; float d = length(q); if(d>0.5) discard; float a = smoothstep(0.5,0.05,d); gl_FragColor = vec4(vC*(1.0+uGlow*0.6), a*vA); }`,
    });
    const pts = new THREE.Points(g, mat);
    scene.add(pts);
    // halo behind the core
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 2.6),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uA: { value: 0 } },
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
        fragmentShader: `varying vec2 vUv; uniform float uA; void main(){ float d=length(vUv-0.5); float a=smoothstep(0.5,0.0,d); gl_FragColor=vec4(0.95,0.78,0.48,a*a*uA);} `,
      }),
    );
    scene.add(halo);
    const group = new THREE.Group();
    group.add(pts);
    group.add(halo);
    scene.add(group);
    group.rotation.x = 0.9;
    group.rotation.z = -0.35;
    let w = 0,
      h = 0;
    function resize() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
      group.position.set(0, 0.1, 0);
      group.scale.setScalar(0.76);
    }
    resize();
    window.addEventListener("resize", resize);

    const state = { mix: 1, glow: 1, px: 0, py: 0, scroll: 0, spin: 0, fold: 0 };
    let manualPause = false,
      inView = true,
      raf = 0,
      last = 0,
      elapsed = 0;
    const hero = canvas.closest(".hero");
    const canRun = () =>
      getMotion() &&
      hero.classList.contains("fold-active") &&
      !manualPause &&
      inView &&
      !document.hidden &&
      !document.querySelector("dialog[open],#helios-flight");
    function frame(now) {
      raf = 0;
      if (!canRun()) return;
      elapsed += last ? Math.min(now - last, 50) / 1000 : 0;
      last = now;
      mat.uniforms.uT.value = elapsed;
      mat.uniforms.uMix.value = state.mix * (1 - state.fold);
      mat.uniforms.uGlow.value = state.glow;
      halo.material.uniforms.uA.value = 0.6 * (1 - state.fold);
      const tx = 0.9 + state.py * 0.2 + state.scroll * 0.45,
        tz = -0.35 + state.px * 0.25;
      group.rotation.x += (tx - group.rotation.x) * 0.04;
      group.rotation.z += (tz - group.rotation.z) * 0.04;
      group.rotation.y = elapsed * 0.05 + state.scroll * 0.4 + state.spin;
      halo.lookAt(cam.position);
      cam.position.z = 9 - state.fold * 2.5;
      renderer.render(scene, cam);
      raf = requestAnimationFrame(frame);
    }
    function sync() {
      if (canRun()) {
        if (!raf) {
          last = 0;
          raf = requestAnimationFrame(frame);
        }
      } else {
        cancelAnimationFrame(raf);
        raf = 0;
        last = 0;
      }
    }
    window.addEventListener(
      "pointermove",
      (e) => {
        if (!canRun()) return;
        state.px = e.clientX / window.innerWidth - 0.5;
        state.py = e.clientY / window.innerHeight - 0.5;
      },
      { passive: true },
    );
    window.addEventListener(
      "scroll",
      () => {
        state.scroll = Math.min(1, window.scrollY / Math.max(1, hero.clientHeight));
      },
      { passive: true },
    );
    window.__heroPause = (pause) => {
      manualPause = pause;
      if (pause) {
        foldTimeline?.kill();
        hero.classList.remove("fold-active");
      }
      sync();
    };
    window.addEventListener("helios-motion", sync);
    document.addEventListener("visibilitychange", sync);
    new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0.01 },
    ).observe(hero);
    let foldTimeline;
    window.__fold = () => {
      if (!getMotion() || manualPause || !inView || document.hidden) return;
      foldTimeline?.kill();
      state.fold = 0;
      hero.classList.add("fold-active");
      sync();
      foldTimeline = gsap
        .timeline({
          onComplete: () => {
            hero.classList.remove("fold-active");
            sync();
          },
        })
        .to(state, { fold: 0.35, duration: 0.65, ease: "power2.inOut" })
        .to(state, { fold: 0, spin: state.spin + Math.PI, duration: 2.1, ease: "power2.out" });
    };
    renderer.render(scene, cam);
    hero.classList.add("scene-ready");
    onReady?.();
    sync();
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      manualPause = true;
      sync();
      hero.classList.remove("scene-ready");
      fallback.style.opacity = ".6";
    });
  }
}
