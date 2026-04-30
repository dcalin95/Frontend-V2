/**
 * Read-model helper: pair for SEI execution history row (when backend returns outcome_pair / pair).
 */
export function displaySeiTradePair(t) {
  if (!t || typeof t !== 'object') return null;
  const p = t.outcomePair ?? t.outcome_pair ?? t.pair;
  if (p != null && String(p).trim()) return String(p).trim();
  const ti = t.tokenInSymbol ?? t.token_in_symbol;
  const to = t.tokenOutSymbol ?? t.token_out_symbol;
  if (ti && to) return `${String(ti).toUpperCase()}/${String(to).toUpperCase()}`;
  return null;
}
