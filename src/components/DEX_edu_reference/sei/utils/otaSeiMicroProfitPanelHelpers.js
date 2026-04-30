/**
 * Pure helpers for OtaSeiMicroProfitPanel (no React).
 * @module otaSeiMicroProfitPanelHelpers
 */

import { getTokenDecimals, SEI_PAIRS } from '../seiTokenConfig';
import { DEFAULT_OTA_SEI_PAGE_PAIR } from '../constants/otaSeiPageDefaults';

/** Normalize contract config from chain (may be nested under .data). */
export function parseConfig(raw) {
  const d = raw?.data ?? raw;
  if (!d || typeof d !== 'object') return null;
  const dexAddresses = Array.isArray(d.dex_addresses)
    ? d.dex_addresses
    : Array.isArray(d.pair_addresses)
      ? d.pair_addresses
      : Array.isArray(d.pairs)
        ? d.pairs
        : [];
  return {
    admin: d.admin ?? null,
    fee_percentage: d.fee_percentage,
    ota_only_mode: !!d.ota_only_mode,
    dex_addresses: dexAddresses,
  };
}

export function toMinimalUnits(amount, symbol) {
  const n = parseFloat(String(amount).replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return '0';
  const decimals = getTokenDecimals(symbol);
  return String(Math.floor(n * 10 ** decimals));
}

/** Return full string for OTA AI signal (tooltip); avoids "[object Object]". */
export function formatOtaAiSignal(signal) {
  if (signal == null) return '—';
  if (typeof signal === 'string') return signal.trim() || '—';
  if (typeof signal !== 'object') return String(signal);
  const s = signal;
  const side = s.side ?? s.signal ?? s.recommendation;
  const reason = s.reason ?? s.reasoning ?? '';
  if (side && typeof side === 'string') return reason ? `${side} – ${reason}` : side;
  if (reason && typeof reason === 'string') return reason;
  return '—';
}

/** Short signal label for UI only. E.g. "HOLD" or "BUY" / "SELL". */
export function formatOtaAiSignalShort(signal) {
  const full = formatOtaAiSignal(signal);
  if (!full || full === '—') return '—';
  const beforeDash = full.split('–')[0].trim();
  if (beforeDash.length <= 12) return beforeDash;
  return full.length > 20 ? `${full.slice(0, 18)}…` : full;
}

export function parsePairId(pairId) {
  const p = SEI_PAIRS.find((x) => x.id === pairId);
  if (p) return { base: p.base, quote: p.quote };
  const parts = String(pairId || DEFAULT_OTA_SEI_PAGE_PAIR).split('/').map((s) => s.trim());
  return { base: parts[0] || 'SEI', quote: parts[1] || 'USDC' };
}
