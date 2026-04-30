/**
 * Jurnal local (browser) pentru tranzacții CLOB confirmate — fără backend.
 * Pentru stare completă on-chain (open offers, fills istorice) e nevoie de explorer / indexer / subgraph.
 */

const STORAGE_KEY = 'clob-sei-activity-v1';
const MAX_ENTRIES = 25;

/**
 * @typedef {{ txHash: string, marketId: string, side: string, orderType: string, baseSymbol: string, quoteSymbol: string, at: number }} ClobSeiActivityEntry
 */

/**
 * @returns {ClobSeiActivityEntry[]}
 */
export function loadClobSeiActivity() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/**
 * @param {Omit<ClobSeiActivityEntry, 'at'>} entry
 * @returns {ClobSeiActivityEntry[]}
 */
export function appendClobSeiActivity(entry) {
  if (typeof window === 'undefined') return [];
  try {
    const prev = loadClobSeiActivity();
    const next = [{ ...entry, at: Date.now() }, ...prev].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return loadClobSeiActivity();
  }
}
