// ══════════════════════════════════════════════════════════
// STAR TREK TNG AUDIO ENGINE WITH SPATIAL PANNING
// ══════════════════════════════════════════════════════════
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let isMuted = localStorage.getItem('lcars_mute') === 'true';

// Add mute button to UI if it doesn't exist
document.addEventListener('DOMContentLoaded', () => {
    const headerBar = document.querySelector('.lcars-bar-top .right-group');
    if (headerBar && !document.getElementById('mute-btn')) {
        const muteBtn = document.createElement('button');
        muteBtn.id = 'mute-btn';
        muteBtn.style.cssText = "font-family: 'Orbitron', monospace; font-size: 10px; font-weight: 800; letter-spacing: 1.5px; background: rgba(10, 10, 18, 0.85); color: var(--lcars-gold); border: 1px solid var(--lcars-gold); border-radius: 20px; padding: 4px 10px; cursor: pointer; transition: all 0.3s; text-transform: uppercase; margin-right: 10px;";
        muteBtn.innerHTML = isMuted ? '&#128263; MUTE ON' : '&#128266; AUDIO ON';
        muteBtn.onclick = toggleMute;
        headerBar.insertBefore(muteBtn, headerBar.firstChild);
    }
});

function toggleMute(e) {
    if(e) e.stopPropagation();
    isMuted = !isMuted;
    localStorage.setItem('lcars_mute', isMuted);
    const btn = document.getElementById('mute-btn');
    if (btn) btn.innerHTML = isMuted ? '&#128263; MUTE ON' : '&#128266; AUDIO ON';

    if (isMuted && audioCtx) {
        if (ambientOscL) ambientOscL.stop();
        if (ambientOscR) ambientOscR.stop();
        ambientOscL = null;
        ambientOscR = null;
    } else if (!isMuted && audioCtx && audioCtx.state === 'running') {
        // startAmbientHum();
    }
}

let ambientOscL = null;
let ambientOscR = null;

function initAudio() {
  if (isMuted) return;
  if (!audioCtx) {
      audioCtx = new AudioContext();
      // startAmbientHum();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function startAmbientHum() {
    if (!audioCtx || ambientOscL) return;

    const now = audioCtx.currentTime;

    // Left Channel (47.8Hz)
    ambientOscL = audioCtx.createOscillator();
    const gainL = audioCtx.createGain();
    const pannerL = audioCtx.createStereoPanner();

    ambientOscL.type = 'sawtooth';
    ambientOscL.frequency.setValueAtTime(47.8, now);
    pannerL.pan.value = -0.8;
    gainL.gain.value = 0.015;

    ambientOscL.connect(gainL).connect(pannerL).connect(audioCtx.destination);
    ambientOscL.start();

    // Right Channel (48.3Hz)
    ambientOscR = audioCtx.createOscillator();
    const gainR = audioCtx.createGain();
    const pannerR = audioCtx.createStereoPanner();

    ambientOscR.type = 'sawtooth';
    ambientOscR.frequency.setValueAtTime(48.3, now);
    pannerR.pan.value = 0.8;
    gainR.gain.value = 0.015;

    ambientOscR.connect(gainR).connect(pannerR).connect(audioCtx.destination);
    ambientOscR.start();
}

function playLCARSSound(type, x = 0.5, y = 0.5) {
    if (isMuted || !audioCtx) return;

    const now = audioCtx.currentTime;
    const panner = audioCtx.createStereoPanner();
    // Map x (0 to 1) to pan (-0.8 to 0.8)
    panner.pan.value = (x * 1.6) - 0.8;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain).connect(panner).connect(audioCtx.destination);

    if (type === 'hover') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(850, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);

        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1600, now + 0.05);
        gain2.gain.setValueAtTime(0.08, now + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
        osc2.connect(gain2).connect(panner).connect(audioCtx.destination);
        osc2.start(now + 0.05);
        osc2.stop(now + 0.17);
    } else if (type === 'confirm') {
        playFreqPan(880, 'sine', 0.1, 0.07, now, panner);
        playFreqPan(1108, 'sine', 0.1, 0.07, now + 0.1, panner);
        playFreqPan(1320, 'sine', 0.15, 0.07, now + 0.2, panner);
    } else if (type === 'alert') {
        osc.type = 'square';
        panner.pan.value = 0; // Alerts are centered
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    } else if (type === 'whoosh') {
        // Create noise for shooting star whoosh
        const bufferSize = audioCtx.sampleRate * 0.5; // 0.5 seconds
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.5);

        noise.connect(filter).connect(gain).connect(panner).connect(audioCtx.destination);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        noise.start(now);
    }
}

function playFreqPan(freq, type, duration, vol, startTime, panner) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain).connect(panner).connect(audioCtx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
}

// Modify global event listeners to use spatial audio
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', initAudio, { once: true });
    document.body.addEventListener('mousemove', initAudio, { once: true });

    document.body.addEventListener('mouseenter', (e) => {
        if(e.target.matches('.lcars-sidebar-seg, .tab-btn, a, button, .route-chip, .crew-card, .stat-card')) {
            const rect = e.target.getBoundingClientRect();
            const x = (rect.left + rect.width / 2) / window.innerWidth;
            const y = (rect.top + rect.height / 2) / window.innerHeight;
            playLCARSSound('hover', x, y);
        }
    }, true);

    document.body.addEventListener('click', (e) => {
        const closestBtn = e.target.closest('.lcars-sidebar-seg, .tab-btn, a, button, .route-chip');
        if(closestBtn) {
            if(closestBtn.id === 'picard-btn' || closestBtn.id === 'mute-btn') return;
            const rect = closestBtn.getBoundingClientRect();
            const x = (rect.left + rect.width / 2) / window.innerWidth;
            const y = (rect.top + rect.height / 2) / window.innerHeight;

            if(closestBtn.classList.contains('tab-btn')) {
                playLCARSSound('confirm', x, y);
            } else {
                playLCARSSound('click', x, y);
            }
        }
    }, true);
});

function playTransporter() {
    if (isMuted || !audioCtx) return;
    const now = audioCtx.currentTime;
    const panner = audioCtx.createStereoPanner();
    panner.pan.value = 0;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.6);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(gain).connect(panner).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.crew-card').forEach(el => {
        el.addEventListener('mouseenter', playTransporter);
    });
});
