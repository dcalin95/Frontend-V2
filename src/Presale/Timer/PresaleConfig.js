// src/Presale/Timer/PresaleConfig.js

export const TEST_MODE = false;

const now = Math.floor(Date.now() / 1000);

export const saleStartTimestamp = TEST_MODE
  ? now - 60 // Start cu 1 minut în urmă
  : 1718505600; // 16 iunie 2024, 00:00 UTC

export const ROUND_DURATION_SECONDS = TEST_MODE
  ? 2 * 60 // 2 minute în test
  : 14 * 24 * 60 * 60; // 14 zile în producție

export const roundPrices = [
  0.001, 0.002, 0.004, 0.006, 0.008,
  0.01, 0.02, 0.04, 0.06, 0.08,
  0.09, 0.10
];

export const totalSupply = 50000;
