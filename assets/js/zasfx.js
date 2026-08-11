/* ZASFX — synthesized deck audio. No files, no network. Muted until the
   operator arms it; state persists in localStorage under za-sfx. */
(function () {
  const KEY = 'za-sfx';
  let ctx = null, master = null, room = null, armed = false;
  let on = false;
  try { on = localStorage.getItem(KEY) === 'on'; } catch (e) { on = false; }

  function boot() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.0001;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 6;
    master.connect(comp).connect(ctx.destination);
    room = ctx.createGain(); room.gain.value = 0.26;
    const dl = ctx.createDelay(0.5); dl.delayTime.value = 0.085;
    const fb = ctx.createGain(); fb.gain.value = 0.28;
    const damp = ctx.createBiquadFilter(); damp.type = 'lowpass'; damp.frequency.value = 2600;
    room.connect(dl); dl.connect(damp); damp.connect(fb); fb.connect(dl);
    damp.connect(master);
    return ctx;
  }

  function env(node, t0, a, d, peak) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    node.connect(g); g.connect(master); if (room) g.connect(room);
    return g;
  }

  function tone(f0, f1, t0, dur, type, peak) {
    const o = ctx.createOscillator();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t0);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    env(o, t0, Math.min(0.012, dur * 0.3), dur, peak || 0.16);
    o.start(t0); o.stop(t0 + dur + 0.06);
  }

  function noise(t0, dur, freq, q, peak) {
    const n = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    n.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q || 1.4;
    n.connect(bp);
    env(bp, t0, 0.008, dur, peak || 0.08);
    n.start(t0);
  }

  /* Effects only — no ambient bed. The continuous engine-room hum that shipped
     in the source package is removed by standing order: no sustained background
     tone of any kind. Every voice below is a discrete, short effect. */

  const VOICES = {
    tick() { tone(1320, 1180, ctx.currentTime, 0.028, 'triangle', 0.038); },
    press() { const t = ctx.currentTime; tone(880, 415, t, 0.11, 'triangle', 0.17); tone(1760, 830, t, 0.06, 'sine', 0.05); noise(t, 0.05, 2200, 2, 0.04); },
    arm() {
      const t = ctx.currentTime;
      tone(220, 1340, t, 0.30, 'sawtooth', 0.11);
      tone(440, 2680, t + 0.02, 0.26, 'sine', 0.07);
      noise(t, 0.34, 900, 0.9, 0.06);
    },
    select() { const t = ctx.currentTime; tone(660, 990, t, 0.07, 'sine', 0.14); },
    hail() {
      const t = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, f, t + i * 0.08, 0.26, 'sine', 0.095));
    },
    alert() {
      const t = ctx.currentTime;
      for (let i = 0; i < 3; i++) { tone(700, 700, t + i * 0.19, 0.11, 'square', 0.13); tone(352, 352, t + i * 0.19, 0.11, 'square', 0.1); }
    },
    warp() {
      const t = ctx.currentTime;
      tone(90, 1500, t, 0.7, 'sawtooth', 0.1); noise(t, 0.8, 420, 0.6, 0.08);
    },
    boot() {
      const t = ctx.currentTime;
      [180, 300, 480, 760].forEach((f, i) => tone(f, f * 1.5, t + i * 0.11, 0.16, 'triangle', 0.09));
      noise(t + 0.44, 0.5, 1200, 0.8, 0.05);
    }
  };

  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

  const API = {
    get enabled() { return on; },
    play(name) {
      if (!on) return;
      if (!boot()) return;
      resume();
      const v = VOICES[name] || VOICES.tick;
      try { v(); } catch (e) { /* audio graph busy */ }
    },
    enable() {
      on = true;
      try { localStorage.setItem(KEY, 'on'); } catch (e) { }
      if (!boot()) return false;
      resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.72, ctx.currentTime + 0.4);
      API.play('arm');
      return true;
    },
    disable() {
      on = false;
      try { localStorage.setItem(KEY, 'off'); } catch (e) { }
      if (ctx && master) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      }
    },
    toggle() { return on ? (API.disable(), false) : API.enable(); },
    /** arm the graph on the first real gesture so a stored "on" survives reload */
    prime() {
      if (armed) return; armed = true;
      const go = () => {
        removeEventListener('pointerdown', go); removeEventListener('keydown', go);
        if (on) { const was = on; on = false; API.enable(); on = was; }
      };
      addEventListener('pointerdown', go, { once: true });
      addEventListener('keydown', go, { once: true });
    }
  };

  window.ZASFX = API;
  API.prime();
})();
