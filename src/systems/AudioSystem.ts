// ============================================================
// AudioSystem.ts — Web Audio API procedural sound effects
// ============================================================

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let _muted = false;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.value = _muted ? 0 : 0.3;
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function getGain(): GainNode {
  getCtx();
  return masterGain!;
}

export function setMuted(muted: boolean) {
  _muted = muted;
  if (masterGain) {
    masterGain.gain.value = muted ? 0 : 0.3;
  }
}

export function isMuted(): boolean {
  return _muted;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.3) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(getGain());
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, volume = 0.1) {
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
  gain.gain.value = volume;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(getGain());
  source.start(ctx.currentTime);
}

export function playClick() {
  playTone(800, 0.05, 'square', 0.15);
}

export function playHover() {
  playTone(600, 0.03, 'sine', 0.08);
}

export function playChairSelect() {
  playTone(440, 0.1, 'square', 0.2);
  setTimeout(() => playTone(550, 0.08, 'square', 0.15), 50);
}

export function playSafeChair() {
  playTone(523, 0.15, 'sine', 0.25);
  setTimeout(() => playTone(659, 0.15, 'sine', 0.25), 100);
  setTimeout(() => playTone(784, 0.2, 'sine', 0.2), 200);
}

export function playCreak() {
  playTone(120, 0.3, 'sawtooth', 0.1);
  playTone(140, 0.2, 'sawtooth', 0.08);
}

export function playWoodCrack() {
  playNoise(0.15, 0.25);
  playTone(100, 0.2, 'sawtooth', 0.15);
}

export function playMetalBend() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = 200;
  osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.3);
  gain.gain.value = 0.12;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.connect(gain);
  gain.connect(getGain());
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.4);
}

export function playGlassShatter() {
  playNoise(0.4, 0.45);
  playTone(1800, 0.12, 'sawtooth', 0.25);
  setTimeout(() => {
    playTone(1200, 0.18, 'square', 0.2);
    playNoise(0.3, 0.35);
  }, 40);
  setTimeout(() => playTone(600, 0.25, 'sawtooth', 0.15), 100);
}

export function playBridgeStep() {
  playTone(280, 0.08, 'triangle', 0.2);
  playTone(140, 0.1, 'sine', 0.25);
}

export function playCollapse() {
  playGlassShatter();
  playNoise(0.3, 0.3);
  playTone(80, 0.4, 'sawtooth', 0.2);
  setTimeout(() => playNoise(0.2, 0.15), 100);
}

export function playFall() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 400;
  osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.6);
  gain.gain.value = 0.2;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
  osc.connect(gain);
  gain.connect(getGain());
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.6);
}

export function playTimerWarning() {
  playTone(880, 0.08, 'square', 0.12);
}

export function playTimerCritical() {
  playTone(1000, 0.05, 'square', 0.15);
  setTimeout(() => playTone(1200, 0.05, 'square', 0.12), 60);
}

export function playVictory() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => {
    setTimeout(() => playTone(n, 0.3, 'sine', 0.2), i * 150);
  });
  setTimeout(() => {
    playTone(1047, 0.6, 'sine', 0.15);
    playTone(784, 0.6, 'sine', 0.1);
    playTone(523, 0.6, 'sine', 0.08);
  }, 700);
}

export function playThrone() {
  const notes = [262, 330, 392, 523, 659, 784];
  notes.forEach((n, i) => {
    setTimeout(() => playTone(n, 0.5, 'sine', 0.15), i * 200);
  });
}

export function playCountdown() {
  playTone(440, 0.15, 'square', 0.2);
}

export function playCountdownGo() {
  playTone(880, 0.2, 'square', 0.25);
  setTimeout(() => playTone(880, 0.15, 'square', 0.2), 100);
}

export function playCharacterSelect() {
  playTone(660, 0.08, 'sine', 0.15);
  setTimeout(() => playTone(880, 0.1, 'sine', 0.12), 60);
}
