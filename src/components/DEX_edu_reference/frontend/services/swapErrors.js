/**
 * Swap error classification and revert reason parsing (ethers v5).
 * Aligned with GPT-5 spec: parse revert reason, map to user-friendly messages.
 * @module swapErrors
 */

/**
 * Parse revert reason from ethers/CALL_EXCEPTION error.
 * Tries: err.reason, err.error?.message, err.data/message for "execution reverted: <reason>".
 * @param {Error & { reason?: string, error?: { message?: string }, data?: string, message?: string }} err
 * @returns {string} Parsed reason or generic "execution reverted"
 */
export function parseEthersRevertReason(err) {
  if (!err) return 'execution reverted';
  const reason = err.reason || err.error?.message;
  if (reason && typeof reason === 'string') return reason.trim();
  const msg = (err.message || err.data || '').toString();
  const match = msg.match(/execution reverted(?::\s*)?(?:\s+reason string )?["']?([^"']+)["']?/i)
    || msg.match(/revert(?:ed)?(?::\s*)?["']?([^"']+)["']?/i);
  if (match && match[1]) return match[1].trim();
  return 'execution reverted';
}

/** Map common PancakeSwap / DEX revert reasons to user-friendly (EN) text */
const REVERT_MESSAGES = {
  INSUFFICIENT_OUTPUT_AMOUNT: 'Price moved; you receive less than the minimum. Increase slippage or try again.',
  INSUFFICIENT_INPUT_AMOUNT: 'Insufficient input amount. Check the amount and try again.',
  EXPIRED: 'Transaction expired (deadline). Try again.',
  INSUFFICIENT_LIQUIDITY: 'Insufficient liquidity for this pair. Try a smaller amount or another token.',
  INVALID_PATH: 'Invalid swap path. Contact support.',
  EXCESSIVE_INPUT_AMOUNT: 'Input amount exceeds limit. Try a smaller amount.'
};

/**
 * Get user-friendly message for swap revert (RO).
 * Uses parseEthersRevertReason then maps known reasons; fallback generic.
 * @param {Error} err - ethers CALL_EXCEPTION or error with receipt.status === 0
 * @returns {string} Message for UI (toast/modal)
 */
export function getSwapRevertUserMessage(err) {
  const reason = parseEthersRevertReason(err);
  const upper = reason.toUpperCase();
  for (const [key, text] of Object.entries(REVERT_MESSAGES)) {
    if (upper.includes(key)) return text;
  }
  if (/slippage|output|amount/i.test(reason)) {
    return 'Price moved (slippage). Increase slippage or try again.';
  }
  if (/expired|deadline|time/i.test(reason)) {
    return 'Transaction expired. Try again.';
  }
  return 'Transaction rejected on-chain (e.g. slippage exceeded, insufficient liquidity or deadline). Try higher slippage or smaller amount.';
}
