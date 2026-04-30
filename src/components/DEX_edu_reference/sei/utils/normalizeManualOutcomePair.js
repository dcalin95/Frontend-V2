/**
 * Normalize pair strings for POST /ai-trading/record-outcome (SEI manual outcomes).
 * Backend may persist outcome_pair / pair; client sends consistent BASE/QUOTE.
 */

import { SEI_PAIRS, SEI_AUTO_PAIR_IDS } from '../seiTokenConfig';

const ALLOWED = [...new Set([...SEI_AUTO_PAIR_IDS, ...SEI_PAIRS.map((p) => p.id)])];

/**
 * @param {string} raw
 * @returns {string|null} e.g. SEI/USDC
 */
export function parsePairString(raw) {
  if (raw == null || typeof raw !== 'string') return null;
  let s = raw.trim().toUpperCase();
  if (!s) return null;
  s = s.replace(/[-_]/g, '/');
  const parts = s.split('/').map((x) => x.trim()).filter(Boolean);
  if (parts.length !== 2) return null;
  return `${parts[0]}/${parts[1]}`;
}

/**
 * @param {{ pair?: string, base?: string, quote?: string }} o
 * @returns {{ valid: boolean, pair: string|null, outcomeBase: string|null, outcomeQuote: string|null }}
 */
export function normalizeManualOutcomePair({ pair, base, quote } = {}) {
  const b = base != null ? String(base).trim().toUpperCase() : '';
  const q = quote != null ? String(quote).trim().toUpperCase() : '';
  const fromExplicit = parsePairString(pair);
  if (fromExplicit && ALLOWED.includes(fromExplicit)) {
    const [ob, oq] = fromExplicit.split('/');
    return { valid: true, pair: fromExplicit, outcomeBase: ob, outcomeQuote: oq };
  }
  if (b && q) {
    const built = `${b}/${q}`;
    if (ALLOWED.includes(built)) {
      return { valid: true, pair: built, outcomeBase: b, outcomeQuote: q };
    }
  }
  if (fromExplicit) {
    return { valid: false, pair: null, outcomeBase: b || null, outcomeQuote: q || null };
  }
  if (b && q) return { valid: false, pair: null, outcomeBase: b, outcomeQuote: q };
  return { valid: false, pair: null, outcomeBase: null, outcomeQuote: null };
}

export { ALLOWED as MANUAL_OUTCOME_ALLOWED_PAIRS };
