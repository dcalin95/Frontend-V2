/**
 * Map OTA SEI page pair to GridTradingPanel pair (must exist in panel SEI_PAIRS).
 */

const PAGE_TO_GRID = {
  'SEI/USDC': 'SEI/USDC',
  'SEI/USDT': 'SEI/USDT',
  'SEI/ATOM': 'SEI/ATOM',
  'WETH/USDC': 'WETH/USDC',
  'WETH/SEI': 'WETH/SEI',
  'ATOM/SEI': 'ATOM/SEI',
  'ATOM/USDC': 'ATOM/USDC',
  'SOL/SEI': 'SOL/SEI',
  'SOL/USDC': 'SOL/USDC',
};

export function mapOtaPagePairToGridPair(pagePair) {
  const p = String(pagePair || '').trim();
  const gridPair = PAGE_TO_GRID[p] || 'SEI/USDC';
  const isExact = gridPair === p;
  return {
    gridPair,
    isExact,
    pagePair: p || 'SEI/USDC',
    hint: isExact ? null : `Grid uses ${gridPair} (reference price); page context: ${p || '—'}.`,
  };
}
