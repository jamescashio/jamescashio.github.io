type OscType = OscillatorType;

/**
 * Diegetic console. No bed, no score.
 * Real airframes mix NASA public-domain launch nats (Atlas V, STS-131, SLS
 * test fire) into modeled voices. X-1 is an N-wave plus a short crack.
 * Epstein / Phoenix / Heighliner stay original — those properties are not ours to sample.
 */
export class ZASound {
  armed = false;
  private ac: AudioContext | null = null;
  private master: GainNode | null = null;
  private space: GainNode | null = null;
  private sfx: GainNode | null = null;
  private craftBus: GainNode | null = null;
  private _nb: AudioBuffer | null = null;
  private _white: AudioBuffer | null = null;
  private _visBound = false;
  private analyser: AnalyserNode | null = null;
  private _bins: Uint8Array<ArrayBuffer> | null = null;
  private samples: (AudioBuffer | null)[] = [null, null, null, null, null, null, null];
  private sampleLoad = false;

  private _ctx(): AudioContext | null {
    if (!this.ac) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ac = new AC({ latencyHint: "interactive" });
      this.master = this.ac.createGain();
      this.master.gain.value = 0;
      this.sfx = this.ac.createGain();
      this.sfx.gain.value = 1;
      this.space = this.ac.createGain();
      this.space.gain.value = 1;
      const verb = this.ac.createConvolver();
      verb.buffer = this._impulse(1.4, 2.8);
      const spaceMix = this.ac.createGain();
      spaceMix.gain.value = 0.12;
      const damp = this.ac.createBiquadFilter();
      damp.type = "lowpass";
      damp.frequency.value = 2800;
      this.space.connect(verb).connect(damp).connect(spaceMix).connect(this.master);
      this.sfx.connect(this.master);
      const comp = this.ac.createDynamicsCompressor();
      comp.threshold.value = -12;
      comp.knee.value = 8;
      comp.ratio.value = 5;
      comp.attack.value = 0.003;
      comp.release.value = 0.16;
      this.master.connect(comp).connect(this.ac.destination);
      this.analyser = this.ac.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.7;
      this.master.connect(this.analyser);
      this._bins = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
      this._bindVis();
    }
    if (this.ac.state === "suspended") void this.ac.resume();
    return this.ac;
  }

  private _bindVis() {
    if (this._visBound) return;
    this._visBound = true;
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.armed && this.ac?.state === "suspended") void this.ac.resume();
    });
  }

  private _impulse(seconds: number, curve: number) {
    const ac = this._ctx()!;
    const len = Math.floor(ac.sampleRate * seconds);
    const buf = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, curve);
      }
    }
    return buf;
  }

  private _noiseBuf() {
    if (this._nb) return this._nb;
    const ac = this._ctx()!;
    const len = ac.sampleRate * 2;
    const b = ac.createBuffer(1, len, ac.sampleRate);
    const d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
    this._nb = b;
    return b;
  }

  private _whiteBuf() {
    if (this._white) return this._white;
    const ac = this._ctx()!;
    const len = ac.sampleRate * 1.5;
    const b = ac.createBuffer(1, len, ac.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this._white = b;
    return b;
  }

  arm() {
    const ac = this._ctx();
    if (!ac || !this.master) return false;
    this.armed = true;
    this.master.gain.cancelScheduledValues(ac.currentTime);
    this.master.gain.setTargetAtTime(0.74, ac.currentTime, 0.08);
    this._loadSamples();
    return true;
  }

  private _loadSamples() {
    if (this.sampleLoad || !this.ac) return;
    this.sampleLoad = true;
    const names = ["x1", "sr71", "falcon", "starship", "epstein", "warp", "fold"];
    names.forEach((name, i) => {
      void fetch(`/sfx/${name}.wav?v=50`)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject()))
        .then((b) => this.ac!.decodeAudioData(b))
        .then((buf) => {
          this.samples[i] = buf;
        })
        .catch(() => {
          /* synth fallback remains */
        });
    });
  }

  level() {
    if (!this.armed || !this.analyser || !this._bins) return 0;
    this.analyser.getByteFrequencyData(this._bins);
    let s = 0;
    for (let i = 0; i < this._bins.length; i++) s += this._bins[i];
    return s / this._bins.length / 255;
  }

  disarm() {
    if (!this.ac || !this.master) return;
    this.armed = false;
    this._muteCraft();
    this.master.gain.setTargetAtTime(0, this.ac.currentTime, 0.12);
  }

  setVelocity(_v: number) {
    /* no wind bed */
  }
  setDepth(_p: number) {
    /* no score */
  }

  private _muteCraft() {
    if (!this.craftBus || !this.ac) return;
    const t = this.ac.currentTime;
    this.craftBus.gain.cancelScheduledValues(t);
    this.craftBus.gain.setTargetAtTime(0, t, 0.05);
    this.craftBus = null;
  }

  private _voice(): GainNode | null {
    const ac = this._ctx();
    if (!ac || !this.master || !this.space) return null;
    this._muteCraft();
    const bus = ac.createGain();
    bus.gain.value = 1;
    bus.connect(this.master);
    bus.connect(this.space);
    this.craftBus = bus;
    return bus;
  }

  private _osc(
    type: OscType,
    f0: number,
    f1: number,
    dur: number,
    gain: number,
    delay = 0,
    pan = 0,
    fm?: [number, number],
    dest?: AudioNode,
  ) {
    if (!this.armed) return;
    const ac = this._ctx();
    if (!ac || !this.master || !this.space) return;
    const t0 = ac.currentTime + delay;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(20, f0), t0);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    if (fm) {
      const m = ac.createOscillator();
      const mg = ac.createGain();
      m.type = "sine";
      m.frequency.setValueAtTime(Math.max(20, f0 * fm[0]), t0);
      mg.gain.setValueAtTime(f0 * fm[1], t0);
      mg.gain.exponentialRampToValueAtTime(Math.max(1, f0 * fm[1] * 0.04), t0 + dur);
      m.connect(mg).connect(o.frequency);
      m.start(t0);
      m.stop(t0 + dur + 0.03);
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.012, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const p = ac.createStereoPanner();
    p.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), t0);
    o.connect(g).connect(p);
    const d = dest ?? this.sfx!;
    p.connect(d);
    if (!dest) p.connect(this.space);
    o.start(t0);
    o.stop(t0 + dur + 0.04);
  }

  private _noise(
    f0: number,
    f1: number,
    dur: number,
    gain: number,
    q = 1.2,
    pan = 0,
    delay = 0,
    white = false,
    dest?: AudioNode,
  ) {
    if (!this.armed) return;
    const ac = this._ctx();
    if (!ac || !this.master || !this.space) return;
    const t0 = ac.currentTime + delay;
    const n = ac.createBufferSource();
    n.buffer = white ? this._whiteBuf() : this._noiseBuf();
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = q;
    bp.frequency.setValueAtTime(Math.max(40, f0), t0);
    bp.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t0 + dur);
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const p = ac.createStereoPanner();
    p.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), t0);
    n.connect(bp).connect(g).connect(p);
    const d = dest ?? this.sfx!;
    p.connect(d);
    if (!dest) p.connect(this.space);
    n.start(t0);
    n.stop(t0 + dur + 0.05);
  }

  private _thump(f: number, dur: number, gain: number, delay: number, dest: AudioNode) {
    this._osc("sine", f, f * 0.55, dur, gain, delay, 0, undefined, dest);
  }

  /** N-wave crack — the actual sound-barrier signature. */
  private _nwave(gain: number, delay: number, pan: number, dest: AudioNode) {
    if (!this.armed) return;
    const ac = this._ctx();
    if (!ac) return;
    const sr = ac.sampleRate;
    const len = Math.floor(sr * 0.09);
    const buf = ac.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    const up = Math.floor(sr * 0.0015);
    const dn = Math.floor(sr * 0.0032);
    for (let i = 0; i < len; i++) {
      let v = 0;
      if (i < up) v = i / up;
      else if (i < dn) v = 1 - 2 * ((i - up) / Math.max(1, dn - up));
      else v = -Math.pow(1 - (i - dn) / (len - dn), 5);
      d[i] = v + (Math.random() - 0.5) * 0.06 * Math.pow(1 - i / len, 3);
    }
    const src = ac.createBufferSource();
    src.buffer = buf;
    const hp = ac.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 70;
    const g = ac.createGain();
    const t0 = ac.currentTime + delay;
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1);
    const p = ac.createStereoPanner();
    p.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), t0);
    src.connect(hp).connect(g).connect(p).connect(dest);
    src.start(t0);
    src.stop(t0 + 0.12);
  }

  /** Bell X-1 — pass-by, then the double boom. */
  private _x1(bus: GainNode) {
    this._noise(1800, 500, 0.28, 0.1, 0.85, -0.55, 0, true, bus);
    this._noise(900, 220, 0.32, 0.08, 1, 0.45, 0.06, false, bus);
    this._osc("sawtooth", 90, 55, 0.3, 0.05, 0, -0.3, undefined, bus);
    this._nwave(0.55, 0.3, -0.12, bus);
    this._thump(46, 0.28, 0.2, 0.3, bus);
    this._noise(5000, 400, 0.05, 0.16, 0.7, -0.1, 0.3, true, bus);
    this._nwave(0.42, 0.42, 0.22, bus);
    this._thump(38, 0.32, 0.16, 0.42, bus);
    this._noise(4200, 350, 0.045, 0.12, 0.8, 0.2, 0.42, true, bus);
    this._noise(140, 50, 0.7, 0.1, 0.7, 0, 0.44, false, bus);
  }

  /** SR-71 — J58 howl and spike. */
  private _sr71(bus: GainNode) {
    this._noise(220, 2200, 1.1, 0.16, 0.65, -0.25, 0, false, bus);
    this._noise(2200, 700, 0.9, 0.1, 0.8, 0.3, 0.1, false, bus);
    this._osc("sawtooth", 42, 70, 1.15, 0.12, 0, 0, undefined, bus);
    this._osc("sawtooth", 84, 96, 1.0, 0.06, 0.04, 0.2, undefined, bus);
    this._osc("sine", 190, 520, 0.5, 0.07, 0.1, -0.2, [0.47, 1.1], bus);
    this._osc("sine", 520, 210, 0.55, 0.055, 0.55, 0.15, undefined, bus);
    this._noise(6500, 1400, 0.28, 0.07, 2.4, 0.35, 0.18, true, bus);
    this._thump(36, 0.4, 0.1, 0.05, bus);
  }

  /** Falcon 9 — igniter pops, then Merlin stack. */
  private _falcon(bus: GainNode) {
    for (let i = 0; i < 11; i++) {
      this._noise(1600 + Math.random() * 2800, 280, 0.03, 0.07, 1.5, (Math.random() - 0.5) * 1.4, i * 0.024, true, bus);
    }
    this._osc("sawtooth", 30, 44, 1.25, 0.14, 0.1, 0, undefined, bus);
    this._osc("sawtooth", 60, 48, 1.1, 0.07, 0.12, 0.18, undefined, bus);
    this._noise(180, 1600, 1.15, 0.13, 0.5, 0, 0.12, false, bus);
    this._noise(3400, 500, 0.75, 0.07, 1.05, 0.4, 0.16, true, bus);
    this._thump(36, 0.4, 0.16, 0.1, bus);
    this._nwave(0.18, 0.12, 0, bus);
  }

  /** Starship — Raptor farm. */
  private _starship(bus: GainNode) {
    for (let i = 0; i < 16; i++) {
      this._noise(1000 + Math.random() * 3200, 220, 0.036, 0.07, 1.15, (Math.random() - 0.5) * 1.5, 0.02 + i * 0.02, true, bus);
    }
    this._osc("sawtooth", 22, 38, 1.45, 0.16, 0.04, 0, undefined, bus);
    this._osc("sawtooth", 44, 36, 1.3, 0.09, 0.06, -0.25, undefined, bus);
    this._osc("sawtooth", 66, 48, 1.2, 0.05, 0.08, 0.25, undefined, bus);
    this._noise(140, 1100, 1.35, 0.15, 0.45, 0, 0.06, false, bus);
    this._noise(6200, 700, 0.5, 0.06, 1.5, 0.45, 0.18, true, bus);
    this._thump(24, 0.5, 0.18, 0.05, bus);
    this._nwave(0.22, 0.08, -0.1, bus);
  }

  /** Epstein — spool, catch, torch. The Expanse, then silence. */
  private _epstein(bus: GainNode) {
    this._noise(140, 2400, 0.85, 0.12, 1.4, -0.3, 0, false, bus);
    this._noise(360, 3200, 0.75, 0.08, 2, 0.32, 0.06, true, bus);
    this._osc("triangle", 64, 280, 0.85, 0.09, 0, 0, undefined, bus);
    this._osc("sine", 96, 360, 0.7, 0.05, 0.1, 0.22, undefined, bus);
    this._osc("sine", 720, 1440, 0.08, 0.07, 0.82, 0, undefined, bus);
    this._nwave(0.2, 0.84, 0, bus);
    this._osc("sine", 360, 180, 0.22, 0.08, 0.86, 0, undefined, bus);
    this._noise(700, 2800, 0.95, 0.11, 0.85, 0, 0.86, false, bus);
    this._osc("sine", 48, 32, 1.0, 0.13, 0.86, 0, undefined, bus);
    this._osc("sine", 1680, 520, 0.5, 0.045, 0.9, 0.18, [2.8, 0.7], bus);
  }

  /** Trek warp jump — chirp, stretch, snap. No choir. */
  private _trekWarp(bus: GainNode) {
    this._osc("sine", 784, 784, 0.05, 0.07, 0, -0.35, undefined, bus);
    this._osc("sine", 1175, 1175, 0.06, 0.065, 0.07, 0.35, undefined, bus);
    this._noise(90, 9000, 0.5, 0.13, 0.5, -0.45, 0.14, true, bus);
    this._noise(9000, 120, 0.42, 0.1, 0.5, 0.45, 0.2, true, bus);
    this._osc("sine", 70, 1240, 0.42, 0.13, 0.16, 0, undefined, bus);
    this._osc("sine", 1240, 36, 0.48, 0.12, 0.5, 0, undefined, bus);
    this._osc("triangle", 2800, 5600, 0.16, 0.04, 0.54, 0.25, undefined, bus);
    this._osc("sine", 3600, 280, 0.2, 0.035, 0.58, -0.2, undefined, bus);
    this._nwave(0.18, 0.52, 0, bus);
    this._thump(42, 0.32, 0.12, 0.52, bus);
  }

  /** Holtzman fold — pressure, blade, arrival. */
  private _heighliner(bus: GainNode) {
    this._noise(55, 32, 1.05, 0.14, 0.65, 0, 0, false, bus);
    this._noise(320, 90, 0.95, 0.08, 1.05, -0.35, 0.12, false, bus);
    this._osc("sine", 32, 20, 1.1, 0.16, 0, 0, undefined, bus);
    this._noise(3400, 55, 0.32, 0.14, 0.45, 0.12, 0.92, true, bus);
    this._noise(11000, 280, 0.22, 0.09, 1.3, -0.22, 0.94, true, bus);
    this._osc("sawtooth", 220, 32, 0.36, 0.09, 0.94, 0, [3.2, 1.6], bus);
    this._nwave(0.28, 0.96, 0.05, bus);
    this._osc("sine", 20, 16, 0.8, 0.2, 1.08, 0, undefined, bus);
    this._thump(22, 0.65, 0.18, 1.1, bus);
    this._noise(160, 40, 0.7, 0.09, 0.75, 0, 1.12, false, bus);
  }

  craft(i: number) {
    if (!this.armed) return;
    const n = Math.max(0, Math.min(6, i | 0));
    const buf = this.samples[n];
    if (buf && this.ac) {
      const bus = this._voice();
      if (!bus) return;
      const src = this.ac.createBufferSource();
      src.buffer = buf;
      const g = this.ac.createGain();
      g.gain.value = 0.95;
      src.connect(g).connect(bus);
      src.start();
      return;
    }
    const bus = this._voice();
    if (!bus) return;
    if (n === 0) this._x1(bus);
    else if (n === 1) this._sr71(bus);
    else if (n === 2) this._falcon(bus);
    else if (n === 3) this._starship(bus);
    else if (n === 4) this._epstein(bus);
    else if (n === 5) this._trekWarp(bus);
    else this._heighliner(bus);
  }

  nav(i = 0) {
    const k = i || 0;
    const base = 1380 + k * 28;
    const pan = -0.4 + (k / 8) * 0.8;
    this._osc("square", base, base, 0.028, 0.02, 0, pan);
    this._noise(3200, 1200, 0.04, 0.02, 3, pan, 0, true);
  }
  tick() {
    const f = 2100 + Math.random() * 400;
    this._osc("square", f, f, 0.022, 0.012, 0, (Math.random() - 0.5) * 0.7);
  }
  engage() {
    this._osc("sine", 880, 880, 0.06, 0.05, 0, -0.2);
    this._osc("sine", 1320, 1320, 0.07, 0.04, 0.08, 0.2);
  }
  target(pan: number) {
    this._osc("sine", 1240, 1860, 0.05, 0.045, 0, pan);
    this._osc("sine", 1860, 1240, 0.06, 0.03, 0.06, pan);
  }
  whoosh(dir = 1) {
    const d = dir === undefined ? 1 : dir;
    this._noise(400, 2400, 0.22, 0.04, 1, -0.6 * d, 0, true);
    this._noise(2400, 400, 0.2, 0.03, 1, 0.6 * d, 0.04, true);
  }
  warp() {
    this.craft(5);
  }
  klaxon() {
    for (let k = 0; k < 3; k++) {
      const pan = k % 2 ? 0.5 : -0.5;
      this._osc("square", 248, 248, 0.16, 0.05, k * 0.38, pan);
      this._osc("square", 186, 186, 0.16, 0.05, k * 0.38 + 0.17, -pan);
    }
  }
  key() {
    this._osc("square", 1680, 1680, 0.018, 0.01, 0, (Math.random() - 0.5) * 0.4);
  }
  ok() {
    this._osc("sine", 990, 990, 0.07, 0.04, 0, -0.15);
    this._osc("sine", 1480, 1480, 0.09, 0.03, 0.07, 0.15);
  }
  err() {
    this._osc("sawtooth", 220, 140, 0.16, 0.045);
  }
  prompt() {
    this._osc("square", 1760, 1760, 0.03, 0.02);
  }
  fold() {
    this.craft(6);
  }
  bitYes() {
    this._osc("square", 1400, 1900, 0.05, 0.03);
    this._osc("square", 1900, 2400, 0.04, 0.022, 0.05);
  }
  bitNo() {
    this._osc("square", 640, 380, 0.08, 0.035);
  }
  hail() {
    this._osc("sine", 520, 780, 0.14, 0.045, 0, -0.3);
    this._osc("sine", 780, 520, 0.16, 0.035, 0.12, 0.3);
  }
}

let singleton: ZASound | null = null;
export function getSound() {
  if (!singleton) singleton = new ZASound();
  return singleton;
}
