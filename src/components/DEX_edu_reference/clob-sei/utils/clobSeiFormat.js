/**
 * Formatare adresă / balanțe pentru UI CLOB SEI.
 */

export function shortAddr(addr) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function fmtBalance(val) {
  const n = parseFloat(val);
  if (Number.isNaN(n) || n === 0) return '0';
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return n.toPrecision(4);
}

/** Formatare preț mid pentru afișare (evită zecimale inutile). */
export function fmtMidPrice(mid) {
  if (mid == null || Number.isNaN(mid)) return '';
  return mid >= 100 ? mid.toLocaleString(undefined, { maximumFractionDigits: 2 }) : mid.toFixed(6);
}
