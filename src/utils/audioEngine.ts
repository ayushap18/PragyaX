"use client";

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.08) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

function playNoise(duration: number, volume = 0.03) {
  try {
    const ctx = getCtx();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(2000, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  } catch {
    // Audio not available
  }
}

export const SFX = {
  // Boot sequence sounds
  bootBeep: () => playTone(1200, 0.06, "square", 0.05),
  bootChirp: () => {
    playTone(800, 0.05, "square", 0.04);
    setTimeout(() => playTone(1200, 0.05, "square", 0.04), 60);
  },
  bootSuccess: () => {
    playTone(600, 0.1, "sine", 0.06);
    setTimeout(() => playTone(800, 0.1, "sine", 0.06), 100);
    setTimeout(() => playTone(1200, 0.15, "sine", 0.06), 200);
  },
  bootScan: () => playTone(400, 0.3, "sawtooth", 0.02),
  bootStatic: () => playNoise(0.15, 0.04),
  bootReady: () => {
    playTone(440, 0.15, "sine", 0.06);
    setTimeout(() => playTone(660, 0.15, "sine", 0.06), 150);
    setTimeout(() => playTone(880, 0.25, "sine", 0.08), 300);
  },

  // UI interactions
  click: () => playTone(800, 0.03, "square", 0.04),
  hover: () => playTone(1600, 0.02, "sine", 0.02),
  toggle: () => {
    playTone(600, 0.04, "square", 0.04);
    setTimeout(() => playTone(900, 0.04, "square", 0.04), 50);
  },

  // Mode switch
  modeSwitch: () => {
    playTone(300, 0.08, "sawtooth", 0.04);
    setTimeout(() => playTone(600, 0.08, "square", 0.05), 80);
    setTimeout(() => playNoise(0.1, 0.03), 60);
  },

  // Navigation
  flyTo: () => {
    playTone(200, 0.2, "sine", 0.03);
    setTimeout(() => playTone(400, 0.3, "sine", 0.04), 100);
  },

  // Alerts
  alert: () => {
    playTone(880, 0.1, "square", 0.06);
    setTimeout(() => playTone(880, 0.1, "square", 0.06), 200);
    setTimeout(() => playTone(880, 0.1, "square", 0.06), 400);
  },

  // Command
  commandOpen: () => {
    playTone(400, 0.06, "sine", 0.04);
    setTimeout(() => playTone(600, 0.06, "sine", 0.04), 60);
  },
  commandExecute: () => {
    playTone(500, 0.05, "square", 0.04);
    setTimeout(() => playTone(800, 0.08, "square", 0.05), 80);
  },

  // Keystroke for boot text
  keystroke: () => playTone(1800 + Math.random() * 400, 0.015, "square", 0.025),

  // Radar sweep tick
  radarTick: () => playTone(2400, 0.01, "sine", 0.03),

  // Layer toggle
  layerOn: () => {
    playTone(500, 0.04, "sine", 0.04);
    setTimeout(() => playTone(700, 0.06, "sine", 0.05), 50);
  },
  layerOff: () => {
    playTone(700, 0.04, "sine", 0.04);
    setTimeout(() => playTone(500, 0.06, "sine", 0.05), 50);
  },

  // Entity select
  entitySelect: () => {
    playTone(1000, 0.04, "sine", 0.04);
    setTimeout(() => playTone(1400, 0.06, "sine", 0.04), 50);
  },

  // Biometric scan
  biometricScan: () => {
    playTone(200, 0.4, "sine", 0.03);
    setTimeout(() => playTone(300, 0.3, "sine", 0.03), 200);
    setTimeout(() => playTone(400, 0.2, "sine", 0.04), 500);
  },
  biometricSuccess: () => {
    playTone(600, 0.1, "sine", 0.06);
    setTimeout(() => playTone(900, 0.1, "sine", 0.07), 120);
    setTimeout(() => playTone(1200, 0.2, "sine", 0.08), 240);
  },
};
