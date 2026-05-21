// STAR TREK LCARS SOVEREIGN AUDIO ENGINE
let _audioCtx;
const _soundCache = {};
window._soundEnabled = true;
let _lastSoundPlayTime = 0;

function initAudio() {
  if (_audioCtx) return;
  try {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Strict whitelist-only sound files (voice-free only)
    const assets = {
      'click': ['lcars_click.wav'],
      'hover': ['lcars_hover.wav'],
      'confirm': ['lcars_click.wav'],
      'success': ['lcars_success.wav'],
      'press': ['lcars_click.wav'],
      'redalert': ['redalert.wav'],
      'warp': ['warp.mp3', 'warp.wav'],
      'alert': ['lcars_click.wav'],
      'whoosh': ['lcars_hover.wav']
    };
    
    for (const [key, files] of Object.entries(assets)) {
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
  if (!_audioCtx) return;
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  
  const now = _audioCtx.currentTime;
  
  // Cooldown to prevent sounds from stepping on each other / overlapping
  if (type !== 'redalert' && type !== 'warp') {
    if (now - _lastSoundPlayTime < 0.08) {
      return; // Skip duplicate playbacks within 80ms
    }
    _lastSoundPlayTime = now;
  }
  
  const whitelistMap = {
    'click': 'click',
    'hover': 'hover',
    'confirm': 'click',     // Remapped to voice-free click
    'success': 'success',
    'press': 'click',       // Remapped to voice-free click
    'redalert': 'redalert',
    'warp': 'warp',
    'alert': 'click',       // Remapped to voice-free click
    'whoosh': 'hover'
  };
  
  type = whitelistMap[type] || 'click';
  
  if (_soundCache[type]) {
    const playNext = (index) => {
      if (index >= _soundCache[type].length) return;
      const audio = _soundCache[type][index];
      const playInstance = audio.cloneNode();
      playInstance.volume = vol;
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
