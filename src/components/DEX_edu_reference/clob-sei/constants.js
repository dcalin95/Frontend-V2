/**
 * clob-sei/constants.js – Constante pentru CLOB SEI (Oxium/Mangrove).
 * Fee-uri, labels, tickSpacing default.
 */

// Oxium: Stable pairs 1bps, Volatile 2bps (taker fee)
export const CLOB_FEE_BPS = {
  stable: 1,
  volatile: 2,
};

export const CLOB_ORDER_TYPES = {
  LIMIT: 'limit',
  MARKET: 'market',
};

export const DEFAULT_TICK_SPACING = 1;

/** Slippage protecție market order (UI + `clobTradeService` trebuie să folosească aceeași valoare). */
export const CLOB_MARKET_SLIPPAGE_FRACTION = 0.05;

export default {
  CLOB_FEE_BPS,
  CLOB_ORDER_TYPES,
  DEFAULT_TICK_SPACING,
  CLOB_MARKET_SLIPPAGE_FRACTION,
};
