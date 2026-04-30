/**
 * Afișare USD pentru ledger (trial / spent / available): evită $0.00 fals la consum foarte mic.
 * SSOT pentru strip billing și mesaje 402 în `otaAnalyzeFacade`.
 */
export function formatLedgerUsdDisplay(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n === 0) return '$0.00';
  const abs = Math.abs(n);
  if (abs > 0 && abs < 0.01) {
    return n < 0 ? '> -$0.01' : '< $0.01';
  }
  return `$${n.toFixed(2)}`;
}
