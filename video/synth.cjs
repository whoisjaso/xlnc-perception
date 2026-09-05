// Deterministic sound kit + music bed. 16-bit WAV, 48kHz. No downloads.
const fs = require('fs');
const SR = 48000;
function wav(samples, path) {
  const n = samples.length; const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) { const v = Math.max(-1, Math.min(1, samples[i])); buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2); }
  fs.writeFileSync(path, buf);
}
const seedRand = (s) => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
function lowpass(x, cutoff) { const rc = 1 / (2 * Math.PI * cutoff); const dt = 1 / SR; const a = dt / (rc + dt); let y = 0; return x.map((v) => (y = y + a * (v - y))); }
function env(n, a, d, s, r, hold = 0) { const out = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / SR; out[i] = t < a ? t / a : t < a + d ? 1 - (1 - s) * ((t - a) / d) : t < a + d + hold ? s : Math.max(0, s * (1 - (t - a - d - hold) / r)); } return out; }

// whoosh: filtered noise swell
{ const n = SR * 0.5; const r = seedRand(7); const x = new Float32Array(n).map(() => r() * 2 - 1); const e = env(n, 0.18, 0.25, 0.0, 0.05); const lp = lowpass(x, 1800); wav(lp.map((v, i) => v * e[i] * 0.8), 'public/sfx/whoosh.wav'); }
// soft click / tick
{ const n = SR * 0.08; const out = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / SR; out[i] = Math.sin(2 * Math.PI * 1800 * t) * Math.exp(-t * 90) * 0.5 + Math.sin(2 * Math.PI * 600 * t) * Math.exp(-t * 60) * 0.3; } wav(out, 'public/sfx/click.wav'); }
// deep hit: sine thump with pitch drop
{ const n = SR * 1.2; const out = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR; const f = 40 + 120 * Math.exp(-t * 18); ph += (2 * Math.PI * f) / SR; out[i] = Math.sin(ph) * Math.exp(-t * 3.2) * 0.9; } wav(out, 'public/sfx/hit.wav'); }
// riser: noise + rising sine, 1.2s
{ const n = SR * 1.2; const r = seedRand(3); const out = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR; const p = t / 1.2; const f = 120 + 900 * p * p; ph += (2 * Math.PI * f) / SR; out[i] = (Math.sin(ph) * 0.25 + (r() * 2 - 1) * 0.5) * p * p; } wav(lowpass(out, 3000).map((v) => v * 0.8), 'public/sfx/riser.wav'); }
// shimmer: high detuned sines with slow decay
{ const n = SR * 1.6; const out = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / SR; out[i] = (Math.sin(2 * Math.PI * 1567.98 * t) + Math.sin(2 * Math.PI * 1572 * t) + Math.sin(2 * Math.PI * 2093 * t) * 0.6) / 3 * Math.exp(-t * 2.2) * 0.35 * Math.min(1, t * 40); } wav(out, 'public/sfx/shimmer.wav'); }

// music bed: 84 BPM, 4-bar loop over Am / F / C / G, detuned pad + sub + soft hats, 300s
{
  const bpm = 84, beat = 60 / bpm, bar = beat * 4, bars = Math.ceil(300 / bar); const n = Math.floor(bars * bar * SR);
  const chords = [[220, 261.63, 329.63], [174.61, 220, 261.63], [130.81 * 2, 164.81 * 2, 196 * 2], [196, 246.94, 293.66]];
  const out = new Float32Array(n); const r = seedRand(11);
  for (let b = 0; b < bars; b++) {
    const ch = chords[b % 4]; const start = Math.floor(b * bar * SR); const len = Math.floor(bar * SR);
    for (let i = 0; i < len && start + i < n; i++) {
      const t = i / SR; const g = Math.min(1, t / 1.2) * Math.min(1, (bar - t) / 1.4);
      let v = 0;
      for (const f of ch) { v += Math.sin(2 * Math.PI * f * t) * 0.5 + Math.sin(2 * Math.PI * (f * 1.003) * t) * 0.35 + Math.sin(2 * Math.PI * (f / 2) * t) * 0.25; }
      v = (v / ch.length) * 0.22 * g;
      // sub pulse on beats 1 and 3
      const tb = t % (beat * 2); v += Math.sin(2 * Math.PI * (ch[0] / 4) * t) * Math.exp(-tb * 4) * 0.28;
      // hats on offbeats
      const th = (t + beat / 2) % beat; if (th < 0.05) v += (r() * 2 - 1) * Math.exp(-th * 120) * 0.05;
      out[start + i] += v;
    }
  }
  const lp = lowpass(out, 2600);
  // slow overall fade in/out
  wav(lp.map((v, i) => v * Math.min(1, i / (SR * 3)) * Math.min(1, (n - i) / (SR * 4)) * 0.9), 'public/sfx/bed.wav');
}
console.log(fs.readdirSync('public/sfx'));
