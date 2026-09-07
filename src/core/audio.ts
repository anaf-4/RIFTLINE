// 외부 오디오 파일 없이 WebAudio 오실레이터로 만드는 최소 SFX.
// 실제 BGM/SE 제작 전까지의 임시 피드백 용도.

let ctx: AudioContext | null = null;
let enabled = true;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

export function setAudioEnabled(v: boolean) {
  enabled = v;
}

function blip(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.06) {
  if (!enabled) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

export const sfx = {
  cardPlay: () => blip(520, 0.12, 'triangle'),
  hit: () => blip(140, 0.15, 'square', 0.08),
  block: () => blip(300, 0.1, 'sine', 0.05),
  click: () => blip(700, 0.06, 'sine', 0.04),
  victory: () => {
    blip(523, 0.15, 'triangle');
    setTimeout(() => blip(659, 0.15, 'triangle'), 120);
    setTimeout(() => blip(784, 0.25, 'triangle'), 240);
  },
  defeat: () => {
    blip(220, 0.3, 'sawtooth', 0.05);
    setTimeout(() => blip(160, 0.4, 'sawtooth', 0.05), 200);
  },
  gold: () => blip(900, 0.08, 'square', 0.03),
};
