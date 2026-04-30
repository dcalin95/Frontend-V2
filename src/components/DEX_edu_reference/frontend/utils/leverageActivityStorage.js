export const LEVERAGE_ACTIVITY_STORAGE_KEY = 'leverage_activity_v1';
const MAX = 100;

export function loadLeverageActivitySession() {
  if (typeof sessionStorage === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(LEVERAGE_ACTIVITY_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function persistLeverageActivityList(list) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(LEVERAGE_ACTIVITY_STORAGE_KEY, JSON.stringify(list.slice(0, MAX)));
  } catch (_) {
    /* quota / private mode */
  }
}

/**
 * @param {import('./leverageActivityTypes').LeverageActivityEntry} entry
 * @param {import('./leverageActivityTypes').LeverageActivityEntry[]} prev
 */
export function prependLeverageActivity(entry, prev) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const row = { ...entry, id, at: entry.at || new Date().toISOString() };
  const next = [row, ...(prev || [])].slice(0, MAX);
  persistLeverageActivityList(next);
  return next;
}
