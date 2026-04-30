import { mapOtaPagePairToGridPair } from '../utils/seiGridPagePairSync';

describe('mapOtaPagePairToGridPair', () => {
  it('maps SEI/USDC exactly', () => {
    const o = mapOtaPagePairToGridPair('SEI/USDC');
    expect(o.gridPair).toBe('SEI/USDC');
    expect(o.isExact).toBe(true);
    expect(o.hint).toBeNull();
  });

  it('falls back to SEI/USDC for unknown', () => {
    const o = mapOtaPagePairToGridPair('UNKNOWN/PAIR');
    expect(o.gridPair).toBe('SEI/USDC');
    expect(o.isExact).toBe(false);
    expect(o.hint).toContain('SEI/USDC');
  });
});
