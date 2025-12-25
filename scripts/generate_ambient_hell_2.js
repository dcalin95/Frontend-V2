/**
 * Generate a long ambient "hell" drone WAV (16-bit PCM, 44.1kHz mono) for looping.
 * Writes to public/sounds/ambient-hell-2.wav
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

  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);

  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(blockAlign, 32);
  buf.writeUInt16LE(16, 34);

  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);

  let o = 44;
  for (let i = 0; i < numSamples; i++) {
    const v = clamp(samplesFloat[i], -1, 1);
    buf.writeInt16LE(Math.round(v * 32767), o);
    o += 2;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buf);
}

function smoothstep(x) {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
}

function main() {
  const durSec = 70; // long enough to feel non-repeating; loop enabled in app
  const n = Math.floor(durSec * SR);
  const out = new Float32Array(n);

  let phA = 0, phB = 0, phC = 0;
  let lp = 0;

  for (let i = 0; i < n; i++) {
    const t = i / SR;

    // Slow evolving base frequencies
    const fA = 33 + Math.sin(t * 0.07) * 2.2;
    const fB = 55 + Math.sin(t * 0.05 + 1.7) * 3.0;
    const fC = 89 + Math.sin(t * 0.03 + 3.2) * 4.0;

    phA += (2 * Math.PI * fA) / SR;
    phB += (2 * Math.PI * fB) / SR;
    phC += (2 * Math.PI * fC) / SR;

    const a = Math.sin(phA) * 0.35;
    const b = Math.sin(phB + Math.sin(phA) * 0.8) * 0.25;
    const c = Math.sin(phC + Math.sin(phB) * 0.6) * 0.18;

    // air/noise layer (very low)
    const noise = (Math.random() * 2 - 1) * 0.08;
    lp = lp * 0.985 + noise * 0.015; // very slow low-pass noise

    // "breathing" amplitude
    const breath = 0.55 + 0.45 * Math.sin(t * 0.11 + Math.sin(t * 0.017) * 1.2);

    // Fade in/out to avoid clicks when looping start/end
    const fadeIn = smoothstep(t / 3.5);
    const fadeOut = smoothstep((durSec - t) / 4.0);
    const env = fadeIn * fadeOut;

    const x = (a + b + c + lp) * breath * env;
    out[i] = x * 0.9;
  }

  const outDir = path.join(process.cwd(), 'public', 'sounds');
  const fp = path.join(outDir, 'ambient-hell-2.wav');
  writeWav16Mono(fp, out);

  // eslint-disable-next-line no-console
  console.log(`Generated ambient track: ${fp}`);
}

main();


