// Synthesized keyboard and UI sounds. No audio assets; everything is Web Audio.
// Kept short (< 60ms) and quiet so it reads as tactile feedback, not noise.
let ctx: AudioContext | null = null;
let enabled = true;
let master: GainNode | null = null;

function ensure() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setSoundEnabled(on: boolean) { enabled = on; }
export function isSoundEnabled() { return enabled; }

function noiseBuffer(c: AudioContext, seconds: number) {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  return buf;
}

/** Mechanical key press: filtered noise burst + faint sine thock. */
export function keyClick(variant: 'key' | 'space' | 'delete' = 'key') {
  if (!enabled) return;
  const c = ensure();
  if (!c || !master) return;
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 0.04);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = variant === 'space' ? 900 : variant === 'delete' ? 1400 : 2200 + Math.random() * 900;
  bp.Q.value = 0.9;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(variant === 'space' ? 0.5 : 0.35, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  src.connect(bp).connect(g).connect(master);
  src.start(t);
  src.stop(t + 0.05);

  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(variant === 'space' ? 140 : 210 + Math.random() * 40, t);
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.05);
  const og = c.createGain();
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(0.12, t + 0.004);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  osc.connect(og).connect(master);
  osc.start(t);
  osc.stop(t + 0.07);
}

/** Soft two-note confirm for step advance. */
export function advanceTone() {
  if (!enabled) return;
  const c = ensure();
  if (!c || !master) return;
  const t = c.currentTime;
  [523.25, 783.99].forEach((f, i) => {
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t + i * 0.07);
    g.gain.exponentialRampToValueAtTime(0.09, t + i * 0.07 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.07 + 0.18);
    o.connect(g).connect(master!);
    o.start(t + i * 0.07);
    o.stop(t + i * 0.07 + 0.2);
  });
}

/** Low tick for selection / toggle. */
export function tick() {
  if (!enabled) return;
  const c = ensure();
  if (!c || !master) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(330, t);
  o.frequency.exponentialRampToValueAtTime(180, t + 0.04);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.1, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.06);
}

/** Error thud. */
export function errorTone() {
  if (!enabled) return;
  const c = ensure();
  if (!c || !master) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  o.type = 'square';
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(90, t + 0.12);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.06, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.18);
}

/** Longer success chord for contract completion. */
export function successChord() {
  if (!enabled) return;
  const c = ensure();
  if (!c || !master) return;
  const t = c.currentTime;
  [392, 493.88, 587.33, 783.99].forEach((f, i) => {
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t + i * 0.05);
    g.gain.exponentialRampToValueAtTime(0.08, t + i * 0.05 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.05 + 0.9);
    o.connect(g).connect(master!);
    o.start(t + i * 0.05);
    o.stop(t + i * 0.05 + 1);
  });
}
