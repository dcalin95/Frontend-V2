import { ethers } from "ethers";

export function aprPercentNumberFrom1e18(value) {
  try {
    const pctStr = ethers.utils.formatUnits(value ?? 0, 16); // percent = apr_1e18 / 1e16
    const n = parseFloat(pctStr);
    return Number.isFinite(n) ? n : 0;
  } catch (_) {
    return 0;
  }
}

export function aprPercentDisplayFrom1e18(value, digits = 2) {
  const n = aprPercentNumberFrom1e18(value);
  // If integer percent, don't show decimals: 100.00% -> 100%
  const rounded = Number.isFinite(n) ? Number(n.toFixed(digits)) : 0;
  const isInt = Number.isInteger(rounded);
  return isInt ? `${rounded}%` : `${rounded.toFixed(digits)}%`;
}










































