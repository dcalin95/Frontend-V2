const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const docsDir = path.join(root, 'src', 'components', 'DEX_edu_reference', 'ota', 'docs');
const manifestPath = path.join(docsDir, 'dexChatContext.manifest.json');
const outputPath = path.join(docsDir, 'dexChatContextBundle.generated.js');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const maxTotalChars = Number(manifest.maxTotalChars) || 220000;
const maxFileChars = Number(manifest.maxFileChars) || 60000;
let totalChars = 0;
const sections = [];

for (const relativePath of manifest.files || []) {
  const absolutePath = path.resolve(root, relativePath);
  const relativeCheck = path.relative(root, absolutePath);
  if (relativeCheck.startsWith('..') || path.isAbsolute(relativeCheck)) {
    throw new Error(`Context path escapes repository root: ${relativePath}`);
  }
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Context file is missing: ${relativePath}`);
  }
  const raw = fs.readFileSync(absolutePath, 'utf8');
  const remaining = maxTotalChars - totalChars;
  if (remaining <= 0) break;
  sections.push(`## FILE: ${relativePath}\n\n${raw.slice(0, Math.min(maxFileChars, remaining))}`);
  totalChars += Math.min(raw.length, maxFileChars, remaining);
}

const bundle = [
  '# CURRENT DEX + OTA DOCUMENTATION CONTEXT',
  '',
  'Generated from checked-in current documentation. Newer dated audits supersede conflicting historical statements.',
  '',
  ...sections,
].join('\n\n');
const output = `/**\n * AUTO-GENERATED. Do not edit manually.\n * Source: dexChatContext.manifest.json\n * Regenerate: node scripts/sync-dex-chat-context.js\n */\nexport function getOtaDocsContextForPrompt() {\n  return ${JSON.stringify(bundle)};\n}\n`;

fs.writeFileSync(outputPath, output, 'utf8');
console.log(`Wrote ${path.relative(root, outputPath)} (${totalChars} documentation characters).`);
