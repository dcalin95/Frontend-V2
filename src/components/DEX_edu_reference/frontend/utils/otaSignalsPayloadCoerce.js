/**
 * SSOT: normalizare răspuns GET/SSE pentru lista de semnale (chei alternative `items`/`rows`/…).
 */

export function coerceSignalsArrayFromApiPayload(data) {
  if (!data || typeof data !== 'object') return [];
  if (Array.isArray(data.signals)) return data.signals;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.rows)) return data.rows;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.analyses)) return data.analyses;
  return [];
}

/**
 * Obiect branch (ca la GET) cu `signals` array — pentru merge LONG/SHORT din HTTP sau SSE.
 * @param {unknown} data
 * @returns {{ signals: unknown[] } & Record<string, unknown>}
 */
export function normalizeSignalsListBranchPayload(data) {
  if (!data || typeof data !== 'object') {
    return { signals: [] };
  }
  const signals = coerceSignalsArrayFromApiPayload(data);
  return { ...data, signals };
}
