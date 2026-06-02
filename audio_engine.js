// STAR TREK LCARS SOVEREIGN AUDIO ENGINE
let _audioCtx;
const _soundCache = {};
window._soundEnabled = true;
let _lastSoundPlayTime = 0;

const SOUND_ASSETS = {
  click: ['lcars_click.wav'],
  hover: ['lcars_hover.wav'],
  confirm: ['lcars_click.wav'],
  success: ['lcars_success.wav'],
  press: ['lcars_click.wav'],
  redalert: ['redalert.wav'],
  warp: ['warp.mp3', 'warp.wav'],
  alert: ['lcars_click.wav'],
  whoosh: ['lcars_hover.wav']
};

const SOUND_ALIASES = {
  click: 'click',
  hover: 'hover',
  lcars: 'hover',
  confirm: 'click',
  success: 'success',
  press: 'click',
  redalert: 'redalert',
  warp: 'warp',
  alert: 'click',
  whoosh: 'hover',
  swoosh: 'hover',
  phaser: 'click',
  transporter: 'success'
};

function initAudio() {
  if (_audioCtx) return;
  try {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    for (const [key, files] of Object.entries(SOUND_ASSETS)) {
      _soundCache[key] = files.map(file => {
        const audio = new Audio(file);
        audio.preload = 'auto';
        return audio;
      });
    }
  } catch (e) {
    console.error("Audio initialization failed:", e);
  }
}

function playLCARSSound(type, vol = 0.5, pitch = 1.0) {
  initAudio();
  if (!_audioCtx || !window._soundEnabled) return;
  if (_audioCtx.state === 'suspended') _audioCtx.resume();

  const soundType = SOUND_ALIASES[String(type).toLowerCase()] || 'click';
  const now = _audioCtx.currentTime;

  // Cooldown to prevent sounds from stepping on each other / overlapping
  if (soundType !== 'redalert' && soundType !== 'warp') {
    if (now - _lastSoundPlayTime < 0.08) {
      return; // Skip duplicate playbacks within 80ms
    }
    _lastSoundPlayTime = now;
  }

  if (_soundCache[soundType]) {
    const playNext = (index) => {
      if (index >= _soundCache[soundType].length) return;
      const audio = _soundCache[soundType][index];
      const playInstance = audio.cloneNode();
      playInstance.volume = Math.max(0, Math.min(1, vol));
      playInstance.playbackRate = Math.max(0.25, Math.min(4, pitch));
      playInstance.play().catch(() => playNext(index + 1));
    };
    playNext(0);
  }
}

// Bindings for standard layout-triggered sounds
function playHoverBeep() {
  playLCARSSound('hover', 0.22);
}

// Map standard triggers to voice-free click beep or success
function playClickChirp() {
  playLCARSSound('click', 0.4);
}

function playConfirmChirp() {
  playLCARSSound('click', 0.5);
}

function playTransporter() {
  playLCARSSound('success', 0.4);
}
