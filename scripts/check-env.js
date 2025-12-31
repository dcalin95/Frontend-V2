#!/usr/bin/env node

/*
  Simple preflight check for required environment variables in Create React App.
  Fails fast with a clear message if vars are missing to prevent confusing runtime errors.
  Now also validates BSC Mainnet contract addresses for consistency.
*/

const fs = require('fs');
const path = require('path');

// Hard-required vars: without these the app cannot function correctly.
const REQUIRED_VARS = [
  'REACT_APP_BACKEND_URL',
  'REACT_APP_ADMIN_PASS'
];

// Soft-required vars: warn loudly (and still deployable), but do not block build.
// NOTE: We keep these as WARN to avoid white-screen deployments from missing env
// while still allowing emergency deploys. Production should always set these.
const WARN_VARS = [
  'REACT_APP_WALLETCONNECT_PROJECT_ID',
  'REACT_APP_SOL_RPC_HTTP',
  'REACT_APP_SOL_RPC_HTTP_FALLBACK'
];

// ✅ BSC Mainnet Contract Addresses (Source of Truth)
const EXPECTED_MAINNET_ADDRESSES = {
  REACT_APP_BITS_TOKEN: "0xCE056ee6ED7Ae0944f10BAfc5E7f5d160c8641fe",
  REACT_APP_STAKING: "0xF1fd04dB28545C5d5d2f2a7709135839B22984de",
  REACT_APP_NODE: "0xE6536756d73F0771d9a317F49453de96541C352F",
  REACT_APP_ADDITIONAL_REWARD: "0x15473d61a9c8F866eb1a3a5b24e2B520acdb0Fc6",
  REACT_APP_CELL_MANAGER: "0x957B858cc0684c8a91ec3C7f8A9E3DA2Df9F3bC6",
  REACT_APP_TELEGRAM_REWARD: "0x5b861fbB5b40a04eb943428d2bD395B4c87D837e",
};

function loadEnvFile(filename) {
  const filePath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  return content.split(/\r?\n/).reduce((acc, line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) return acc;
    const key = m[1];
    let value = m[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    acc[key] = value;
    return acc;
  }, {});
}

// Merge .env.local over .env as CRA does locally
const envLocal = loadEnvFile('.env.local');
const envBase = loadEnvFile('.env');
const env = { ...envBase, ...envLocal, ...process.env };

// ✅ Check for missing required variables
const missing = REQUIRED_VARS.filter((k) => !env[k] || String(env[k]).trim() === '');
const missingWarn = WARN_VARS.filter((k) => !env[k] || String(env[k]).trim() === '');

if (missing.length > 0) {
  console.error('\n\x1b[31m[ENV CHECK] Missing required variables:\x1b[0m');
  missing.forEach((k) => console.error(` - ${k}`));
  console.error('\nCreate .env.local with entries like:');
  console.error('  REACT_APP_BACKEND_URL=https://backend-server-f82y.onrender.com');
  console.error('  REACT_APP_ADMIN_PASS=your_strong_password');
  console.error('\nAlternatively, copy from .env.example');
  process.exit(1);
}

console.log('\x1b[32m[ENV CHECK] ✅ All required environment variables are present.\x1b[0m');

if (missingWarn.length > 0) {
  console.warn('\n\x1b[33m[ENV CHECK] ⚠️ Missing recommended variables (build will continue):\x1b[0m');
  missingWarn.forEach((k) => console.warn(` - ${k}`));
  console.warn('\x1b[33mRecommendation:\x1b[0m set these in .env.local / CI for reliable WalletConnect + Solana payments.\n');
}

// ✅ Validate BSC Mainnet Contract Addresses
console.log('\n\x1b[36m[ADDRESS CHECK] Validating BSC Mainnet contract addresses...\x1b[0m');

let hasAddressErrors = false;

Object.entries(EXPECTED_MAINNET_ADDRESSES).forEach(([key, expectedAddr]) => {
  const actualAddr = env[key];
  
  if (!actualAddr) {
    console.error(`\x1b[31m❌ Missing ${key}\x1b[0m`);
    hasAddressErrors = true;
    return;
  }
  
  if (actualAddr.toLowerCase() !== expectedAddr.toLowerCase()) {
    console.error(`\x1b[33m⚠️  ${key} MISMATCH!\x1b[0m`);
    console.error(`   Expected: \x1b[32m${expectedAddr}\x1b[0m`);
    console.error(`   Got:      \x1b[31m${actualAddr}\x1b[0m`);
    hasAddressErrors = true;
  } else {
    console.log(`\x1b[32m✓\x1b[0m ${key.replace('REACT_APP_', '')}: ${actualAddr}`);
  }
});

if (hasAddressErrors) {
  console.error('\n\x1b[31m[ADDRESS CHECK] ❌ Contract address validation FAILED!\x1b[0m');
  console.error('\x1b[33mPlease update your .env file with the correct BSC Mainnet addresses.\x1b[0m\n');
  process.exit(1);
}

console.log('\n\x1b[32m[ADDRESS CHECK] ✅ All contract addresses are correct for BSC Mainnet.\x1b[0m\n');




















