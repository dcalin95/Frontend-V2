/*
  Export SVG to PNG using sharp.
  Usage: node scripts/export-png.js public/ads/bits-education-16x19.svg public/ads/bits-education-16x19.png 1080 1280
*/

const fs = require('fs');
const path = require('path');

async function ensureSharp() {
  try {
    return require('sharp');
  } catch (e) {
    console.error('\nERROR: sharp nu este instalat. Rulează:');
    console.error('  npm i -D sharp');
    process.exit(1);
  }
}

(async () => {
  const sharp = await ensureSharp();
  const [,, inPath, outPath, widthArg, heightArg] = process.argv;

  if (!inPath || !outPath) {
    console.error('Usage: node scripts/export-png.js <input.svg> <output.png> [width] [height]');
    process.exit(1);
  }

  const width = widthArg ? parseInt(widthArg, 10) : undefined;
  const height = heightArg ? parseInt(heightArg, 10) : undefined;

  const absIn = path.resolve(inPath);
  const absOut = path.resolve(outPath);

  if (!fs.existsSync(absIn)) {
    console.error(`Input inexistent: ${absIn}`);
    process.exit(1);
  }

  const svg = fs.readFileSync(absIn);

  try {
    const image = sharp(svg, { density: 300 });
    if (width || height) {
      image.resize(width, height, { fit: 'contain', withoutEnlargement: false });
    }
    await image.png({ compressionLevel: 9 }).toFile(absOut);
    console.log(`PNG generat: ${absOut}`);
  } catch (err) {
    console.error('Eroare la export:', err);
    process.exit(1);
  }
})();
















