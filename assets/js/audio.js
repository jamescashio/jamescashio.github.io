/* ZeusApollo — LCARS SFX engine. Fully synthesized (WebAudio), zero assets, zero network.
   Muted until the operator turns sound on. window.ZAAudio */
(function () {
  var ctx = null, master = null, on = false;

  function ensure() {
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { ctx = new C(); } catch (e) { return null; }
      master = ctx.createGain();
      master.gain.value = 0.15;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }

  function tone(o) {
    var c = ensure(); if (!c) return;
    var t0 = c.currentTime + (o.at || 0);
    var dur = o.dur || 0.12;
    var osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.vol == null ? 0.45 : o.vol, t0 + (o.atk || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + dur + 0.03);
  }

  function noise(o) {
    var c = ensure(); if (!c) return;
    var t0 = c.currentTime + (o.at || 0);
    var dur = o.dur || 0.1;
    var len = Math.max(1, Math.floor(c.sampleRate * dur));
    var buf = c.createBuffer(1, len, c.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = c.createBufferSource(); src.buffer = buf;
    var f = c.createBiquadFilter();
    f.type = o.filter || 'bandpass';
    f.frequency.setValueAtTime(o.f || 1400, t0);
    if (o.to) f.frequency.exponentialRampToValueAtTime(Math.max(60, o.to), t0 + dur);
    f.Q.value = o.q == null ? 1.2 : o.q;
    var g = c.createGain();
    g.gain.setValueAtTime(o.vol == null ? 0.3 : o.vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0); src.stop(t0 + dur + 0.02);
  }

  var SFX = {
    blip: function () { tone({ f: 940, to: 1420, type: 'square', dur: 0.06, vol: 0.16 }); },
    hover: function () { tone({ f: 1500, type: 'sine', dur: 0.035, vol: 0.07 }); },
    key: function () { noise({ f: 2600, filter: 'highpass', dur: 0.025, vol: 0.12 }); },
    panel: function () { tone({ f: 560, to: 780, type: 'triangle', dur: 0.09, vol: 0.16 }); },
    yes: function () {
      tone({ f: 700, type: 'triangle', dur: 0.07, vol: 0.24 });
      tone({ f: 1050, type: 'triangle', dur: 0.11, vol: 0.22, at: 0.07 });
    },
    no: function () {
      tone({ f: 260, to: 120, type: 'sawtooth', dur: 0.2, vol: 0.2 });
      noise({ f: 320, filter: 'lowpass', dur: 0.16, vol: 0.14 });
    },
    plate: function () {
      tone({ f: 110, to: 52, type: 'sine', dur: 0.24, vol: 0.34 });
      noise({ f: 900, filter: 'lowpass', dur: 0.12, vol: 0.18 });
    },
    boot: function () {
      tone({ f: 130, to: 940, type: 'sine', dur: 1.1, vol: 0.16 });
      tone({ f: 1960, type: 'triangle', dur: 0.5, vol: 0.06, at: 0.9 });
    },
    granted: function () {
      tone({ f: 620, type: 'triangle', dur: 0.09, vol: 0.22 });
      tone({ f: 930, type: 'triangle', dur: 0.09, vol: 0.2, at: 0.09 });
      tone({ f: 1240, type: 'triangle', dur: 0.22, vol: 0.2, at: 0.18 });
    },
    alert: function () {
      for (var i = 0; i < 3; i++) {
        tone({ f: 660, type: 'square', dur: 0.16, vol: 0.16, at: i * 0.34 });
        tone({ f: 440, type: 'square', dur: 0.16, vol: 0.16, at: i * 0.34 + 0.17 });
      }
    },
    scan: function () { noise({ f: 280, to: 4400, filter: 'bandpass', dur: 0.5, vol: 0.08, q: 0.8 }); },
    ping: function () {
      tone({ f: 1320, to: 880, type: 'sine', dur: 0.5, vol: 0.1 });
      tone({ f: 2640, to: 1760, type: 'sine', dur: 0.34, vol: 0.03, at: 0.02 });
    },
    impact: function () {
      tone({ f: 130, to: 38, type: 'sine', dur: 0.5, vol: 0.4 });
      noise({ f: 1800, to: 220, filter: 'lowpass', dur: 0.34, vol: 0.22 });
      tone({ f: 320, to: 120, type: 'triangle', dur: 0.24, vol: 0.12 });
    },
    arp: function () {
      [523, 659, 784, 1047, 1319].forEach(function (fq, i) {
        tone({ f: fq, type: 'triangle', dur: 0.14, vol: 0.13, at: i * 0.085 });
      });
    },
    standdown: function () { tone({ f: 700, to: 300, type: 'triangle', dur: 0.32, vol: 0.2 }); },
    warp: function () {
      tone({ f: 180, to: 2400, type: 'sawtooth', dur: 0.7, vol: 0.14 });
      noise({ f: 400, to: 5200, filter: 'bandpass', dur: 0.7, vol: 0.16, q: 0.7 });
      tone({ f: 2600, to: 900, type: 'sine', dur: 0.4, vol: 0.1, at: 0.55 });
    }
  };

  var amb = null;
  function startAmbient() {
    var c = ensure(); if (!c || amb) return;
    var g = c.createGain(); g.gain.value = 0.0001; g.connect(master);
    var o1 = c.createOscillator(); o1.type = 'sine'; o1.frequency.value = 54;
    var o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = 81.5;
    var o3 = c.createOscillator(); o3.type = 'triangle'; o3.frequency.value = 163;
    var g3 = c.createGain(); g3.gain.value = 0.09; o3.connect(g3); g3.connect(g);
    var lfo = c.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.07;
    var lg = c.createGain(); lg.gain.value = 0.14; lfo.connect(lg); lg.connect(g.gain);
    o1.connect(g); o2.connect(g);
    g.gain.exponentialRampToValueAtTime(0.32, c.currentTime + 2.6);
    [o1, o2, o3, lfo].forEach(function (n) { try { n.start(); } catch (e) {} });
    amb = { g: g, nodes: [o1, o2, o3, lfo] };
  }
  function stopAmbient() {
    if (!amb || !ctx) return;
    var a = amb, t = ctx.currentTime; amb = null;
    try {
      a.g.gain.cancelScheduledValues(t);
      a.g.gain.setValueAtTime(a.g.gain.value || 0.0001, t);
      a.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    } catch (e) {}
    setTimeout(function () { a.nodes.forEach(function (n) { try { n.stop(); } catch (e) {} }); }, 950);
  }

  window.ZAAudio = {
    isOn: function () { return on; },
    setOn: function (v) { on = !!v; if (on) ensure(); else stopAmbient(); },
    prime: function () { ensure(); },
    play: function (n) { if (!on) return; var f = SFX[n]; if (f) { try { f(); } catch (e) {} } }
  };
})();
