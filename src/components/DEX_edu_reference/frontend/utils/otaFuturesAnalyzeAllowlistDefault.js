/**
 * Ordine UI pentru simboluri Futures: nu folosi sortare alfabetică brută — altfel ADA/ATOM/AVAX
 * apar înainte de BTC/ETH. Folosit pentru dropdown probe + fallback Analyze când lipsește selecție explicită.
 */

/** Baze majore lichide întâi; ADA după tier-ul principal (nu „litera A” prima). */
const PREFERRED_BASE_ORDER = [
  'BTC',
  'ETH',
  'BNB',
  'SOL',
  'XRP',
  'DOGE',
  'LINK',
  'AVAX',
  'MATIC',
  'POL',
  'DOT',
  'ATOM',
  'LTC',
  'UNI',
  'STX',
  'ADA',
  'NEAR',
  'APT',
  'ARB',
  'OP',
  'SUI',
  'TRX',
  'SHIB',
];

/**
 * Extrage simbolul de bază din chei tip BTC, BTCUSDT, 1000SHIBUSDT.
 * @param {string} sym
 * @returns {string}
 */
export function futuresSymbolKeyToBase(sym) {
  let s = String(sym || '')
    .trim()
    .toUpperCase();
  if (!s) return '';
  s = s.replace(/(USDT|USDC|BUSD|PERP|_PERP)$/i, '');
  if (/^1000/.test(s) && s.length > 4) return s;
  return s.replace(/[^A-Z0-9]/g, '') || s;
}

function preferenceRank(base) {
  const b = String(base || '').trim().toUpperCase();
  const idx = PREFERRED_BASE_ORDER.indexOf(b);
  if (idx >= 0) return idx;
  return 900 + b.charCodeAt(0);
}

/**
 * Sortează chei simbol (bază sau *USDT) pentru probe / liste: lichiditate comună întâi, apoi alfabetic.
 * @param {string[]} keys
 * @returns {string[]}
 */
export function sortFuturesSymbolKeysForProbeUi(keys) {
  if (!Array.isArray(keys) || keys.length === 0) return [];
  return [...keys].sort((a, b) => {
    const ra = preferenceRank(futuresSymbolKeyToBase(a));
    const rb = preferenceRank(futuresSymbolKeyToBase(b));
    if (ra !== rb) return ra - rb;
    return String(a).localeCompare(String(b));
  });
}

/**
 * Primul simbol din allowlist pentru Analyze când utilizatorul nu a setat probe explicit — după aceeași ordine ca probe UI.
 * @param {string[]|null|undefined} allowlist
 * @returns {string}
 */
export function pickDefaultAnalyzeTokenFromAllowlist(allowlist) {
  const sorted = sortFuturesSymbolKeysForProbeUi(
    Array.isArray(allowlist) ? allowlist : [],
  );
  const first = sorted[0];
  return first ? String(first).trim().toUpperCase() : '';
}
