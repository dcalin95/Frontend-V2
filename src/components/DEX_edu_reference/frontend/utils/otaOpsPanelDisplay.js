/**
 * Helpers purely for Long/Short ops table display (no hardcoded tokens beyond normalization).
 */

/** Base token pentru UI + mapări Binance când DB/venue dublează accidental sufixul (ex. ETHETH → ETH). */
export function normalizeOpsPanelSymbol(raw) {
  const s = String(raw ?? '').trim().toUpperCase();
  if (!s) return '';
  const dup = /^([A-Z]{2,12})\1$/.exec(s);
  if (dup) return dup[1];
  return s;
}

/** Procent cu un zecimal și semn matematic (evită "(+-15.0%)"). */
export function fmtSignedPct1(n) {
  if (n == null || !Number.isFinite(n)) return null;
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

/**
 * Elimină repetări ale aceluiași fragment tip „· Cost: $X · N tok” din textul reasoning
 * (sau variante fără · inițial) — uneori agregat în DB / răspuns API umple cardul de zeci de linii identice.
 */
export function dedupeReasoningOpenAiCostFragments(text) {
  if (text == null || typeof text !== 'string') return '';
  let s = String(text).replace(/\r\n/g, '\n');
  const fragmentRe = /(?:^|\s)(?:·\s*)?Cost:\s*\$[\d.]+(?:\s*·\s*[\d,]+\s*tok)?/gi;
  const seen = new Set();
  s = s.replace(fragmentRe, (m) => {
    const key = m.replace(/\s+/g, ' ').trim().toLowerCase();
    if (seen.has(key)) return ' ';
    seen.add(key);
    return m;
  });
  return s.replace(/[ \t]{2,}/g, ' ').replace(/\n\s*\n\s*\n/g, '\n\n').trim();
}

/**
 * Elimină din reasoning metadata UI / agregată accidental (aceeași informație e pe rândul „Trimis de / Cost” în panou).
 * Fără asta, copy-paste și legacy DB pot arăta un singur paragraf: „Hold… Trimis de: OpenAI … Cost: …”.
 */
export function stripEmbeddedOpenAiAttributionFromReasoning(text) {
  if (text == null || typeof text !== 'string') return '';
  let s = String(text).replace(/\r\n/g, '\n').trim();
  const tailPatterns = [
    /\s*Trimis de:\s*.+$/isu,
    /\s*Sent by:\s*.+$/isu,
  ];
  for (const re of tailPatterns) {
    s = s.replace(re, '').trim();
  }
  return s;
}

/** Text reasoning pentru carduri Long/Short ops (prefix token dacă lipsește din corp). */
export function formatSignalCardReasoningText(rawReasoning, rowTokenUpper) {
  const stripped = stripEmbeddedOpenAiAttributionFromReasoning(
    rawReasoning != null ? String(rawReasoning).trim() : ''
  );
  const raw = dedupeReasoningOpenAiCostFragments(stripped);
  const t = String(rowTokenUpper || '').trim().toUpperCase();
  if (!raw) return '';
  if (!t || t === '—') return raw;
  if (raw.toUpperCase().includes(t)) return raw;
  return `${t}: ${raw}`;
}
