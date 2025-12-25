/**
 * Generate small WAV SFX files (16-bit PCM, 44.1kHz) for TV zap / weird noises.
 * Writes into public/sounds so CRA can serve them at /sounds/...
 *
 * No external deps.
 */
const fs = require('fs');
const path = require('path');

const SR = 44100;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function writeWav16Mono(filePath, samplesFloat) {
  const numSamples = samplesFloat.length;
  const byteRate = SR * 2;
  const blockAlign = 2;
  const dataSize = numSamples * 2;
  const buf = Buffer.alloc(44 + dataSize);

  // RIFF header
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);

  // fmt chunk
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); // PCM
  buf.writeUInt16LE(1, 20);  // audio format
  buf.writeUInt16LE(1, 22);  // channels
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(blockAlign, 32);
  buf.writeUInt16LE(16, 34); // bits

  // data chunk
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);

  let o = 44;
  for (let i = 0; i < numSamples; i++) {
    const v = clamp(samplesFloat[i], -1, 1);
    const s = Math.round(v * 32767);
    buf.writeInt16LE(s, o);
    o += 2;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buf);
}

function env(t, attack, release, dur) {
  // simple AR envelope
  if (t < 0) return 0;
  if (t < attack) return t / attack;
  if (t > dur - release) return clamp((dur - t) / release, 0, 1);
  return 1;
}

function genNoiseBurst(durSec, toneHz = 1200) {
  const n = Math.floor(durSec * SR);
  const out = new Float32Array(n);
  let lp = 0;
  // crude band-ish noise by mixing noise + a tone and lowpassing a bit
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const e = env(t, 0.01, 0.06, durSec);
    const noise = (Math.random() * 2 - 1) * 0.9;
    const tone = Math.sin(2 * Math.PI * toneHz * t) * 0.35;
    const x = (noise + tone) * e;
    lp = lp * 0.65 + x * 0.35;
    out[i] = lp * 0.85;
  }
  return out;
}

function genSweepZap(durSec) {
  const n = Math.floor(durSec * SR);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const e = env(t, 0.004, 0.08, durSec);
    const f = 300 + (1 - t / durSec) * 2200; // down sweep
    phase += (2 * Math.PI * f) / SR;
    const carrier = Math.sin(phase);
    const grit = (Math.random() * 2 - 1) * 0.25;
    out[i] = (carrier * 0.55 + grit) * e;
  }
  return out;
}

function genWeirdChirp(durSec) {
  const n = Math.floor(durSec * SR);
  const out = new Float32Array(n);
  let phase = 0;
  let phase2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const e = env(t, 0.02, 0.12, durSec);
    const f1 = 420 + Math.sin(t * 20) * 380;
    const f2 = 60 + (t / durSec) * 140;
    phase += (2 * Math.PI * f1) / SR;
    phase2 += (2 * Math.PI * f2) / SR;
    const fm = Math.sin(phase2) * 0.9;
    const x = Math.sin(phase + fm) * 0.7 + (Math.random() * 2 - 1) * 0.12;
    out[i] = x * e * 0.9;
  }
  return out;
}

function main() {
  const outDir = path.join(process.cwd(), 'public', 'sounds');
  const files = [
    { name: 'tv_zap_1.wav', samples: genNoiseBurst(0.22, 1450) },
    { name: 'tv_zap_2.wav', samples: genSweepZap(0.28) },
    { name: 'tv_weird_1.wav', samples: genWeirdChirp(0.45) },
  ];

  for (const f of files) {
    writeWav16Mono(path.join(outDir, f.name), f.samples);
  }

  // eslint-disable-next-line no-console
  console.log(`Generated ${files.length} SFX into ${outDir}`);
}

main();


