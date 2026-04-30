/**
 * Reguli comune LONG/SHORT pentru update feed analize după GET /ai-trading/signals (mai multe branch-uri).
 *
 * - Dacă **toate** branch-urile reușesc (`signalBranchFailures` gol) și merge-ul e **gol**, înlocuim cu `[]`.
 *   Altfel rămân rânduri vechi la infinit când serverul nu mai întoarce semnale (UI „Generated 32h ago” fals).
 * - Dacă **există** eșecuri de branch (rețea / HTTP), păstrăm `prev` ca să nu dispară tot feed-ul la un poll ratat.
 */

/**
 * @param {unknown[]} prev - starea anterioară a listei afișate
 * @param {unknown[]} next - slice merged urmează să înlocuiască (poate fi [])
 * @param {{ forceReplace?: boolean, signalBranchFailures: unknown[] }} opts — `forceReplace` ignorat; păstrat pentru compatibilitate apeluri.
 * @returns {unknown[]}
 */
export function reduceOtaRecentSignalsFeed(prev, next, opts) {
  const failN = Array.isArray(opts.signalBranchFailures) ? opts.signalBranchFailures.length : 0;
  const safePrev = Array.isArray(prev) ? prev : [];
  const safeNext = Array.isArray(next) ? next : [];

  if (safeNext.length > 0) return safeNext;
  if (failN > 0 && safePrev.length > 0) return safePrev;
  return safeNext;
}

/**
 * SHORT bulk ~30s: fără replace forțat; buton „Refresh all”: forceSignals → forceReplace.
 * @param {boolean} [forceSignals]
 * @returns {{ forceReplace?: boolean }}
 */
export function signalsFetchOptsFromBulkRefresh(forceSignals) {
  return forceSignals === true ? { forceReplace: true } : {};
}
