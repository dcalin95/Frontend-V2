/**
 * SSOT defaults for /dex-edu/ota/sei page pair context.
 * Canonical stable for execution messaging: prefer USDC on SEI.
 */
export const DEFAULT_OTA_SEI_PAGE_PAIR = 'SEI/USDC';

/** Recommended quote for new SEI spot execution (native USDC on chain). */
export const SEI_CANONICAL_STABLE_SYMBOL = 'USDC';

/** Max age (ms) for CEX/pool micro-profit bundle; beyond this → hard block (stale_quote), not bps penalty. Same env used for exec-quote “stale” in UI health. */
export const SEI_MARKET_DATA_STALE_MS = parseInt(process.env.REACT_APP_SEI_MARKET_STALE_MS || '60000', 10) || 60000;

/** Minimum net edge (bps) after fees/slippage/gas (fresh path only; stale blocks before edge calc). */
export const SEI_MIN_EDGE_NET_BPS = parseInt(process.env.REACT_APP_SEI_MIN_EDGE_NET_BPS || '25', 10) || 25;
