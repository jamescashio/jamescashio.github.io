import { AIRFRAME_SAMPLE_NAMES, canPlayAirframe, type AirframeAudioTrigger } from "./audio-policy";

type OscType = OscillatorType;

/**
 * Quiet by default. No bed, no score, no first-gesture blast.
 * Airframe cues are bounded one-shots and only follow an explicit craft pick.
 * Real vehicles never fall back to a fabricated engine; asset provenance lives
 * beside the WAV files in /public/sfx/provenance.json.
 */
export class ZASound {
  armed = false;
  private ac: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  private space: GainNode | null = null;
  private craftBus: GainNode | null = null;
  private craftSource: AudioBufferSourceNode | null = null;
  private craftToken = 0;
  private analyser: AnalyserNode | null = null;
  private bins: Uint8Array<ArrayBuffer> | null = null;
  private white: AudioBuffer | null = null;
  private visBound = false;
  private samples: (AudioBuffer | null)[] = [null, null, null, null, null, null, null];
  private sampleLoads: (Promise<AudioBuffer | null> | null)[] = [null, null, null, null, null, null, null];

  private context(): AudioContext | null {
    if (!this.ac) {
      const AC =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ac = new AC({ latencyHint: "interactive" });

      this.master = this.ac.createGain();
      this.master.gain.value = 0;
      this.sfx = this.ac.createGain();
      this.sfx.gain.value = 0.72;
      this.space = this.ac.createGain();
      this.space.gain.value = 1;

      const verb = this.ac.createConvolver();
      verb.buffer = this.impulse(0.72, 3.8);
      const damp = this.ac.createBiquadFilter();
      damp.type = "lowpass";
      damp.frequency.value = 2400;
      const spaceMix = this.ac.createGain();
      spaceMix.gain.value = 0.055;
      this.space.connect(verb).connect(damp).connect(spaceMix).connect(this.master);
      this.sfx.connect(this.master);

      const comp = this.ac.createDynamicsCompressor();
      comp.threshold.value = -9;
      comp.knee.value = 4;
      comp.ratio.value = 2;
      comp.attack.value = 0.006;
      comp.release.value = 0.14;
      this.master.connect(comp).connect(this.ac.destination);

      this.analyser = this.ac.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.68;
      this.master.connect(this.analyser);
      this.bins = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
      this.bindVisibility();
    }
    if (this.ac.state === "suspended") void this.ac.resume();
    return this.ac;
  }

  private bindVisibility() {
    if (this.visBound) return;
    this.visBound = true;
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.armed && this.ac?.state === "suspended") void this.ac.resume();
    });
  }

  private impulse(seconds: number, curve: number) {
    const ac = this.ac!;
    const len = Math.floor(ac.sampleRate * seconds);
    const buffer = ac.createBuffer(2, len, ac.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, curve);
      }
    }
    return buffer;
  }

  private whiteBuffer() {
    if (this.white) return this.white;
    const ac = this.context()!;
    const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.5), ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.white = buffer;
    return buffer;
  }

  arm() {
    const ac = this.context();
    if (!ac || !this.master) return false;
    this.armed = true;
    this.master.gain.cancelScheduledValues(ac.currentTime);
    this.master.gain.setTargetAtTime(0.42, ac.currentTime, 0.06);
    this.loadSamples();
    return true;
  }

  disarm() {
    this.armed = false;
    this.craftToken++;
    this.muteCraft();
    if (!this.ac || !this.master) return;
    this.master.gain.setTargetAtTime(0, this.ac.currentTime, 0.08);
  }

  private loadSamples() {
    if (!this.ac) return;
    AIRFRAME_SAMPLE_NAMES.forEach((name, i) => {
      if (this.sampleLoads[i]) return;
      // Opus in WebM first, at roughly one twentieth of the bytes. The PCM
      // originals stay in place and are fetched only where a browser cannot
      // decode Opus, so provenance and the release audio gates are unchanged.
      // Both targets are written as literals here so the same origin egress
      // gates can read them straight out of the source.
      this.sampleLoads[i] = fetch(`/sfx/${name}.webm?v=52`)
        .then((response) => this.decodeSample(response))
        .catch(() => fetch(`/sfx/${name}.wav?v=52`).then((response) => this.decodeSample(response)))
        .then((buffer) => {
          this.samples[i] = buffer;
          return buffer;
        })
        .catch(() => null);
    });
  }

  private decodeSample(response: Response): Promise<AudioBuffer> {
    if (!response.ok) return Promise.reject(new Error(`sfx ${response.status}`));
    return response.arrayBuffer().then((bytes) => this.ac!.decodeAudioData(bytes));
  }

  level() {
    if (!this.armed || !this.analyser || !this.bins) return 0;
    this.analyser.getByteFrequencyData(this.bins);
    let total = 0;
    for (let i = 0; i < this.bins.length; i++) total += this.bins[i];
    return total / this.bins.length / 255;
  }

  setVelocity(_velocity: number) {
    /* no wind bed */
  }

  setDepth(_progress: number) {
    /* no score */
  }

  private muteCraft() {
    if (!this.ac) return;
    const t = this.ac.currentTime;
    if (this.craftBus) {
      this.craftBus.gain.cancelScheduledValues(t);
      this.craftBus.gain.setTargetAtTime(0, t, 0.018);
    }
    if (this.craftSource) {
      try {
        this.craftSource.stop(t + 0.06);
      } catch {
        /* source already ended */
      }
    }
    this.craftBus = null;
    this.craftSource = null;
  }

  private playSample(buffer: AudioBuffer) {
    const ac = this.context();
    if (!ac || !this.master || !this.space) return;
    this.muteCraft();
    const bus = ac.createGain();
    bus.gain.value = 0.9;
    bus.connect(this.master);
    bus.connect(this.space);
    const source = ac.createBufferSource();
    source.buffer = buffer;
    source.connect(bus);
    source.start();
    this.craftBus = bus;
    this.craftSource = source;
    source.addEventListener("ended", () => {
      if (this.craftSource === source) {
        this.craftSource = null;
        this.craftBus = null;
      }
    });
  }

  craft(i: number, trigger: AirframeAudioTrigger) {
    if (!canPlayAirframe({ enabled: this.armed, armed: this.armed, trigger })) return;
    const index = Math.max(0, Math.min(AIRFRAME_SAMPLE_NAMES.length - 1, i | 0));
    const token = ++this.craftToken;
    const sample = this.samples[index];
    if (sample) {
      this.playSample(sample);
      return;
    }
    this.loadSamples();
    void this.sampleLoads[index]?.then((buffer) => {
      if (buffer && token === this.craftToken && this.armed) this.playSample(buffer);
    });
  }

  private osc(type: OscType, from: number, to: number, duration: number, gain: number, delay = 0, pan = 0) {
    if (!this.armed) return;
    const ac = this.context();
    if (!ac || !this.sfx) return;
    const start = ac.currentTime + delay;
    const oscillator = ac.createOscillator();
    const envelope = ac.createGain();
    const stereo = ac.createStereoPanner();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, from), start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + duration);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + Math.min(0.008, duration * 0.2));
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    stereo.pan.value = Math.max(-1, Math.min(1, pan));
    oscillator.connect(envelope).connect(stereo).connect(this.sfx);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  private noise(from: number, to: number, duration: number, gain: number, delay = 0, pan = 0) {
    if (!this.armed) return;
    const ac = this.context();
    if (!ac || !this.sfx) return;
    const start = ac.currentTime + delay;
    const source = ac.createBufferSource();
    const filter = ac.createBiquadFilter();
    const envelope = ac.createGain();
    const stereo = ac.createStereoPanner();
    source.buffer = this.whiteBuffer();
    filter.type = "bandpass";
    filter.Q.value = 2.4;
    filter.frequency.setValueAtTime(from, start);
    filter.frequency.exponentialRampToValueAtTime(to, start + duration);
    envelope.gain.setValueAtTime(gain, start);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    stereo.pan.value = Math.max(-1, Math.min(1, pan));
    source.connect(filter).connect(envelope).connect(stereo).connect(this.sfx);
    source.start(start);
    source.stop(start + duration + 0.02);
  }

  nav(i = 0) {
    const pan = -0.32 + (Math.max(0, Math.min(8, i)) / 8) * 0.64;
    this.osc("sine", 720, 920, 0.035, 0.016, 0, pan);
    this.osc("sine", 480, 420, 0.05, 0.009, 0.018, pan);
  }

  tick() {
    this.osc("sine", 1160, 980, 0.018, 0.006, 0, (Math.random() - 0.5) * 0.4);
  }

  engage() {
    this.osc("sine", 540, 760, 0.055, 0.018, 0, -0.15);
    this.osc("sine", 760, 980, 0.065, 0.014, 0.055, 0.15);
  }

  target(pan: number) {
    this.osc("sine", 740, 1080, 0.04, 0.012, 0, pan);
  }

  whoosh(direction = 1) {
    this.noise(520, 1900, 0.12, 0.012, 0, -0.35 * direction);
  }

  klaxon() {
    for (let i = 0; i < 2; i++) {
      this.osc("triangle", 260, 220, 0.15, 0.022, i * 0.32, i ? 0.25 : -0.25);
      this.osc("sine", 390, 330, 0.15, 0.012, i * 0.32, i ? -0.25 : 0.25);
    }
  }

  key() {
    this.osc("sine", 1020, 900, 0.014, 0.0045, 0, (Math.random() - 0.5) * 0.3);
  }

  ok() {
    this.osc("sine", 620, 820, 0.052, 0.013, 0, -0.1);
    this.osc("sine", 820, 1040, 0.06, 0.01, 0.05, 0.1);
  }

  err() {
    this.osc("triangle", 320, 190, 0.12, 0.016);
  }

  prompt() {
    this.osc("sine", 660, 990, 0.055, 0.014);
  }

  bitYes() {
    this.osc("sine", 760, 980, 0.045, 0.011);
    this.osc("sine", 980, 1240, 0.04, 0.008, 0.04);
  }

  bitNo() {
    this.osc("triangle", 440, 300, 0.07, 0.012);
  }

  hail() {
    this.osc("sine", 520, 720, 0.09, 0.014, 0, -0.2);
    this.osc("sine", 720, 560, 0.1, 0.01, 0.08, 0.2);
  }
}

let singleton: ZASound | null = null;

export function getSound() {
  if (!singleton) singleton = new ZASound();
  return singleton;
}
