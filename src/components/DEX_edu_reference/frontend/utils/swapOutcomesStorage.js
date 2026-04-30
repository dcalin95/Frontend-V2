/**
 * Local storage for swap outcomes – fallback when backend doesn't return amount/value.
 * Keyed by txHash so Trading History can display amounts until backend persists them.
 */

const STORAGE_KEY = 'dex_swap_outcomes';
const MAX_ENTRIES = 50;

/**
 * Save swap outcome locally (called after successful swap).
 * @param {{ txHash: string, tokenIn: string, tokenOut: string, amountIn?: number, amountOut: number, price: number, value: number, slippage?: number, fee?: number }} data
 */
export function saveSwapOutcome(data) {
  if (!data?.txHash || !data?.tokenOut) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return;
    const entry = {
      txHash: String(data.txHash).toLowerCase(),
      tokenIn: data.tokenIn || null,
      tokenOut: data.tokenOut,
      amount: Number(data.amountOut ?? data.amount ?? 0),
      amountIn: data.amountIn != null ? Number(data.amountIn) : undefined,
      price: Number(data.price ?? 0),
      value: Number(data.value ?? 0),
      slippage: data.slippage != null ? Number(data.slippage) : undefined,
      fee: data.fee != null ? Number(data.fee) : undefined,
      timestamp: data.timestamp || new Date().toISOString()
    };
    const filtered = arr.filter((e) => e?.txHash?.toLowerCase() !== entry.txHash);
    const next = [entry, ...filtered].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (_) {}
}

/**
 * Get stored outcome by txHash.
 * @param {string} txHash
 * @returns {{ amount: number, amountIn?: number, price: number, value: number, tokenIn: string, tokenOut: string, slippage?: number, fee?: number }|null}
 */
export function getSwapOutcomeByTxHash(txHash) {
  if (!txHash) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const key = String(txHash).toLowerCase();
    const found = Array.isArray(arr) ? arr.find((e) => e?.txHash?.toLowerCase() === key) : null;
    return found || null;
  } catch (_) {
    return null;
  }
}
