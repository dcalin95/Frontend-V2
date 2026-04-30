import { addOutcome, getRecentOutcomes } from '../otaOutcomesHelper';

describe('otaOutcomesHelper', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('stores recent outcomes separately per wallet', () => {
    addOutcome({
      userId: '0xAAA',
      token: 'BNB',
      side: 'buy',
      entryPrice: 600,
      timestamp: '2026-04-28T00:00:00.000Z',
    });
    addOutcome({
      userId: '0xBBB',
      token: 'ETH',
      side: 'sell',
      entryPrice: 3000,
      timestamp: '2026-04-28T00:01:00.000Z',
    });

    expect(getRecentOutcomes(10, '0xaaa')).toHaveLength(1);
    expect(getRecentOutcomes(10, '0xaaa')[0].token).toBe('BNB');
    expect(getRecentOutcomes(10, '0xbbb')).toHaveLength(1);
    expect(getRecentOutcomes(10, '0xbbb')[0].token).toBe('ETH');
    expect(getRecentOutcomes(10, '0xccc')).toEqual([]);
  });
});
