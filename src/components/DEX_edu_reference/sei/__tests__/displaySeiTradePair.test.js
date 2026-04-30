import { displaySeiTradePair } from '../utils/displaySeiTradePair';

describe('displaySeiTradePair', () => {
  it('prefers outcomePair', () => {
    expect(displaySeiTradePair({ outcomePair: 'SEI/USDC' })).toBe('SEI/USDC');
    expect(displaySeiTradePair({ outcome_pair: 'SEI/USDT' })).toBe('SEI/USDT');
    expect(displaySeiTradePair({ pair: 'WETH/USDC' })).toBe('WETH/USDC');
  });
  it('falls back to symbols', () => {
    expect(displaySeiTradePair({ tokenInSymbol: 'SEI', tokenOutSymbol: 'USDC' })).toBe('SEI/USDC');
  });
  it('null when missing', () => {
    expect(displaySeiTradePair({})).toBeNull();
  });
});
