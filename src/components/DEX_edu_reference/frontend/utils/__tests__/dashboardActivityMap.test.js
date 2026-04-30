import { mapOtaHistoryToActivityRows } from '../dashboardActivityMap';

describe('mapOtaHistoryToActivityRows', () => {
  it('maps history array', () => {
    const res = {
      history: [
        {
          token: 'BTC',
          signal: 'buy',
          confidence: 0.5,
          timestamp: Date.now(),
        },
      ],
    };
    const rows = mapOtaHistoryToActivityRows(res);
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe('analysis');
    expect(rows[0].activitySource).toBe('analysis');
    expect(rows[0].token).toBe('BTC');
    expect(rows[0].signal).toBe('buy');
  });

  it('returns empty for empty payload', () => {
    expect(mapOtaHistoryToActivityRows(null)).toEqual([]);
    expect(mapOtaHistoryToActivityRows({})).toEqual([]);
  });
});
