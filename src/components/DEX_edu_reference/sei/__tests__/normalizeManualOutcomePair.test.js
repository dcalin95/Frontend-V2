import { normalizeManualOutcomePair, parsePairString } from '../utils/normalizeManualOutcomePair';

describe('parsePairString', () => {
  it('normalizes separators and case', () => {
    expect(parsePairString('sei-usdc')).toBe('SEI/USDC');
    expect(parsePairString('SEI_USDT')).toBe('SEI/USDT');
    expect(parsePairString('  weth / usdc  ')).toBe('WETH/USDC');
  });
  it('returns null for garbage', () => {
    expect(parsePairString('')).toBeNull();
    expect(parsePairString('onlyone')).toBeNull();
  });
});

describe('normalizeManualOutcomePair', () => {
  it('accepts known pair string', () => {
    const n = normalizeManualOutcomePair({ pair: 'SEI/USDC' });
    expect(n.valid).toBe(true);
    expect(n.pair).toBe('SEI/USDC');
    expect(n.outcomeBase).toBe('SEI');
    expect(n.outcomeQuote).toBe('USDC');
  });

  it('builds from base/quote when in allowlist', () => {
    const n = normalizeManualOutcomePair({ base: 'SEI', quote: 'USDT' });
    expect(n.valid).toBe(true);
    expect(n.pair).toBe('SEI/USDT');
  });

  it('invalid pair string not in allowlist', () => {
    const n = normalizeManualOutcomePair({ pair: 'FOO/BAR' });
    expect(n.valid).toBe(false);
    expect(n.pair).toBeNull();
  });
});
