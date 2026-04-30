/**
 * Bus simplu pentru jurnal activitate leverage (live + demo) — fără backend.
 * Un singur subscriber (tab); evită dependențe circulare hook ↔ pagină.
 */

/** @type {((entry: import('./leverageActivityTypes').LeverageActivityEntry) => void) | null} */
let subscriber = null;

/**
 * @param {(entry: import('./leverageActivityTypes').LeverageActivityEntry) => void} fn
 * @returns {() => void}
 */
export function subscribeLeverageActivity(fn) {
  subscriber = fn;
  return () => {
    if (subscriber === fn) subscriber = null;
  };
}

/**
 * @param {import('./leverageActivityTypes').LeverageActivityEntry} entry
 */
export function emitLeverageActivity(entry) {
  if (typeof subscriber === 'function') {
    try {
      subscriber(entry);
    } catch (_) {
      /* ignore */
    }
  }
}
