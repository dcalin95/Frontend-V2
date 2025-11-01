#!/usr/bin/env node

/*
  Simple preflight check for required environment variables in Create React App.
  Fails fast with a clear message if vars are missing to prevent confusing runtime errors.
*/

const fs = require('fs');
const path = require('path');

const REQUIRED_VARS = [
  'REACT_APP_BACKEND_URL',
  'REACT_APP_ADMIN_PASS'
];

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

const missing = REQUIRED_VARS.filter((k) => !env[k] || String(env[k]).trim() === '');

if (missing.length > 0) {
  console.error('\n\x1b[31m[ENV CHECK] Missing required variables:\x1b[0m');
  missing.forEach((k) => console.error(` - ${k}`));
  console.error('\nCreate .env.local with entries like:');
  console.error('  REACT_APP_BACKEND_URL=https://backend-server-f82y.onrender.com');
  console.error('  REACT_APP_ADMIN_PASS=your_strong_password');
  console.error('\nAlternatively, copy from .env.example');
  process.exit(1);
}

console.log('\x1b[32m[ENV CHECK] All required environment variables are present.\x1b[0m');




















