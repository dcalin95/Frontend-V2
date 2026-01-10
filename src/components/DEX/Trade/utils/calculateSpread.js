/**
 * 📊 Spread Calculation Utilities
 */

/**
 * Calculate spread between bid and ask
 */
export function calculateSpread(bestBid, bestAsk) {
  if (!bestBid || !bestAsk || bestBid <= 0 || bestAsk <= 0) {
    return { spread: 0, spreadPercent: 0 };
  }

  const spread = bestAsk - bestBid;
  const midPrice = (bestBid + bestAsk) / 2;
  const spreadPercent = (spread / midPrice) * 100;

  return {
    spread,
    spreadPercent,
    midPrice
  };
}

/**
 * Format spread for display
 */
export function formatSpread(spread, spreadPercent) {
  return {
    spread: spread.toFixed(4),
    spreadPercent: `${spreadPercent >= 0 ? '+' : ''}${spreadPercent.toFixed(2)}%`
  };
}

