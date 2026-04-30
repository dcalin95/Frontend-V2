import { buildDashboardAttentionItems } from '../buildDashboardAttentionItems';

describe('buildDashboardAttentionItems', () => {
  it('returns empty when loading', () => {
    expect(buildDashboardAttentionItems({ loading: true, otaHealth: { ok: false } })).toEqual([]);
  });

  it('flags futures API when both futures payloads null', () => {
    const items = buildDashboardAttentionItems({
      loading: false,
      futuresLiveStatus: null,
      futuresOpenShorts: null,
      leverageDemoStatus: { hasAccount: true },
    });
    expect(items.some((i) => i.id === 'futures-api')).toBe(true);
  });

  it('flags vault anomalies when count positive', () => {
    const items = buildDashboardAttentionItems({
      loading: false,
      futuresLiveStatus: { gate: { safeToExecuteLive: true } },
      futuresOpenShorts: {},
      vaultBalanceComparison: { anomalyCount: 2 },
      leverageDemoStatus: { hasAccount: true },
    });
    expect(items.some((i) => i.id === 'vault-anomaly')).toBe(true);
  });
});
