/**
 * USD enrichment for OTA Auto open positions from execution history.
 * Stable quotes (USDT…): price × amount ≈ USD.
 * BNB/ETH quotes: cost basis is in quote token → multiply by BNB/USD or ETH/USD; current value from token/USDT.
 * @module openPositionExecutionUsd
 */

export const STABLE_QUOTES = new Set(['USDT', 'USDC', 'BUSD', 'DAI', 'TUSD']);

/**
 * @param {object} opts
 * @param {string} opts.quoteToken
 * @param {number|null} opts.amountHuman - token amount (e.g. XRP)
 * @param {number|null} opts.costQuoteHuman - total quote spent (BNB or USDT)
 * @param {number|null} opts.entryPerTokenQuote - price per 1 token in quote (fallback if no cost)
 * @param {number|null} opts.currentPriceStablePerToken - price in USDT per token (stable pair)
 * @param {number|null} opts.tokenUsdPerToken - price in USD per token (e.g. from XRP/USDT)
 * @param {number|null} opts.bnbUsd
 * @param {number|null} opts.ethUsd
 * @returns {{ entryValueUsd: number|null, currentValueUsd: number|null, pnlUsd: number|null }}
 */
export function computeExecutionPositionUsd({
  quoteToken,
  amountHuman,
  costQuoteHuman,
  entryPerTokenQuote,
  currentPriceStablePerToken,
  tokenUsdPerToken,
  bnbUsd,
  ethUsd,
}) {
  const amount = amountHuman;
  if (!Number.isFinite(amount) || amount <= 0) {
    return { entryValueUsd: null, currentValueUsd: null, pnlUsd: null };
  }

  const q = (quoteToken || 'USDT').toUpperCase();

  if (STABLE_QUOTES.has(q)) {
    const entry =
      Number.isFinite(entryPerTokenQuote) && entryPerTokenQuote > 0 ? entryPerTokenQuote : null;
    const cur = Number.isFinite(currentPriceStablePerToken) ? currentPriceStablePerToken : null;
    const ev =
      Number.isFinite(costQuoteHuman) && costQuoteHuman > 0
        ? costQuoteHuman
        : entry != null
          ? entry * amount
          : null;
    const cv = cur != null ? cur * amount : null;
    let pnl = null;
    if (entry != null && cur != null) {
      pnl = (cur - entry) * amount;
    } else if (ev != null && cv != null) {
      pnl = cv - ev;
    }
    return { entryValueUsd: ev, currentValueUsd: cv, pnlUsd: pnl };
  }

  const isBnb = q === 'BNB' || q === 'WBNB';
  const isEth = q === 'ETH' || q === 'WETH';
  const quoteUsd = isBnb ? bnbUsd : isEth ? ethUsd : null;

  const entryValQuote =
    Number.isFinite(costQuoteHuman) && costQuoteHuman > 0
      ? costQuoteHuman
      : Number.isFinite(entryPerTokenQuote) && entryPerTokenQuote > 0
        ? entryPerTokenQuote * amount
        : null;

  const entryUsd =
    quoteUsd != null && Number.isFinite(quoteUsd) && quoteUsd > 0 && entryValQuote != null
      ? entryValQuote * quoteUsd
      : null;

  const curUsd =
    Number.isFinite(tokenUsdPerToken) && tokenUsdPerToken > 0 ? tokenUsdPerToken * amount : null;

  const pnlUsd =
    entryUsd != null && curUsd != null ? curUsd - entryUsd : null;

  return { entryValueUsd: entryUsd, currentValueUsd: curUsd, pnlUsd };
}
