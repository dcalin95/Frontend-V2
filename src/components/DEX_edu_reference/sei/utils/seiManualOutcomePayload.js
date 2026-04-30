/**
 * Build recordManualOutcome body for SEI round-trip — SSOT for pair field tests.
 * Sends pair + outcomeBase/outcomeQuote when valid; omits pair if invalid (backward-safe for strict backends).
 */
import { normalizeManualOutcomePair } from './normalizeManualOutcomePair';

export function buildSeiRoundTripManualOutcomePayload({
  userId,
  effectivePair,
  base,
  quote,
  amountSei,
  txHash,
}) {
  const n = normalizeManualOutcomePair({ pair: effectivePair, base, quote });
  const out = {
    userId,
    chain: 'sei',
    token: base,
    tokenIn: base,
    tokenOut: quote,
    amountIn: parseFloat(String(amountSei || '1'), 10) || undefined,
    side: 'buy',
    source: 'manual',
    txHash,
  };
  if (n.valid && n.pair) {
    out.pair = n.pair;
    out.outcomeBase = n.outcomeBase;
    out.outcomeQuote = n.outcomeQuote;
  } else if (n.outcomeBase && n.outcomeQuote) {
    out.outcomeBase = n.outcomeBase;
    out.outcomeQuote = n.outcomeQuote;
  }
  return out;
}
