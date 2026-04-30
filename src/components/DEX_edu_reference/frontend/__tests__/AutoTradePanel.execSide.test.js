/**
 * Test logică badge Buy/Sell pentru rândurile din "What OTA AI does – Executions".
 * Același criteriu ca în AutoTradePanel: side === 'sell' sau tokenOut e quote (USDT, BNB, ETH, WBNB, WETH).
 */

const QUOTE_SYMBOLS = ['USDT', 'BNB', 'ETH', 'WBNB', 'WETH'];

function getExecSideLabel(t) {
  const isSell = t.side === 'sell' || (t.tokenOut && QUOTE_SYMBOLS.includes(String(t.tokenOut).toUpperCase()));
  return isSell ? 'Sell' : 'Buy';
}

describe('AutoTradePanel – execution row side label (Buy/Sell)', () => {
  test('side === "sell" → Sell', () => {
    expect(getExecSideLabel({ side: 'sell', tokenIn: 'BTC', tokenOut: 'BTC' })).toBe('Sell');
  });

  test('tokenOut quote (USDT, BNB, etc.) → Sell', () => {
    expect(getExecSideLabel({ tokenIn: 'BTC', tokenOut: 'USDT' })).toBe('Sell');
    expect(getExecSideLabel({ tokenIn: 'ETH', tokenOut: 'BNB' })).toBe('Sell');
    expect(getExecSideLabel({ tokenIn: 'X', tokenOut: 'WETH' })).toBe('Sell');
    expect(getExecSideLabel({ tokenIn: 'Y', tokenOut: 'wbnb' })).toBe('Sell');
  });

  test('tokenOut base (nu quote) → Buy', () => {
    expect(getExecSideLabel({ tokenIn: 'USDT', tokenOut: 'BTC' })).toBe('Buy');
    expect(getExecSideLabel({ tokenIn: 'USDT', tokenOut: 'DOGE' })).toBe('Buy');
    expect(getExecSideLabel({ tokenOut: 'DOGE' })).toBe('Buy');
  });

  test('fără side și tokenOut → Buy', () => {
    expect(getExecSideLabel({ tokenIn: 'USDT' })).toBe('Buy');
    expect(getExecSideLabel({})).toBe('Buy');
  });
});
