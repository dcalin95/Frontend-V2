import { buildDashboardSystemCards, buildDashboardMicroSummary } from '../buildDashboardSystemCards';

describe('buildDashboardSystemCards', () => {
  it('returns 6 cards with stable ids', () => {
    const cards = buildDashboardSystemCards({
      loading: false,
      futuresLiveStatus: { gate: { safeToExecuteLive: true }, adapter: { present: true } },
      futuresOpenShorts: { positions: [{ id: 1 }], count: 1 },
      otaTrackedPositions: { summary: { totalPositions: 2 } },
      vaultBalanceComparison: { onChainAvailable: true, tokens: [{}, {}], anomalyCount: 0 },
      leverageDemoAccount: { positions: [] },
      leverageDemoStatus: { hasAccount: true },
      autoStatus: { enabled: true, executorFunctional: true },
      signalsToday: 3,
      tradesTotal: 10,
      lastSignal: { token: 'BTC', side: 'buy' },
    });
    expect(cards).toHaveLength(6);
    expect(cards.map((c) => c.id)).toEqual([
      'futures',
      'ota-auto',
      'leverage',
      'vault',
      'trading',
      'signals',
    ]);
    expect(cards[0].href).toBe('/dex-edu/ota/short-ops');
    expect(cards[0].headline).toBeTruthy();
    expect(Array.isArray(cards[0].secondary)).toBe(true);
  });

  it('does not repeat userId on every card secondary (deduped)', () => {
    const cards = buildDashboardSystemCards({
      loading: false,
      apiUserId: '0x1111111111111111111111111111111111111111',
      futuresLiveStatus: { gate: { safeToExecuteLive: true }, adapter: { present: true } },
      futuresOpenShorts: { positions: [{ id: 1 }], count: 1 },
      vaultBalanceComparison: { onChainAvailable: true, tokens: [{}, {}], anomalyCount: 0 },
      leverageDemoAccount: { positions: [] },
      leverageDemoStatus: { hasAccount: true },
      autoStatus: { enabled: true, executorFunctional: true },
      signalsToday: 3,
      tradesTotal: 10,
      lastSignal: { token: 'BTC', side: 'buy' },
    });
    expect(cards[0].secondary.join(' ')).not.toMatch(/0x1111/i);
    expect(cards[0].secondary[0]).toMatch(/Open:|Gate/i);
  });

  it('marks futures partial when APIs missing', () => {
    const cards = buildDashboardSystemCards({
      loading: false,
      futuresLiveStatus: null,
      futuresOpenShorts: null,
      otaTrackedPositions: null,
      vaultBalanceComparison: null,
      leverageDemoAccount: null,
      leverageDemoStatus: null,
      autoStatus: null,
      signalsToday: null,
      tradesTotal: null,
      lastSignal: null,
    });
    expect(cards[0].level).toBe('partial');
    expect(cards[0].headline).toBe('API unavailable');
    expect(cards[0].secondary.some((l) => /short-ops/i.test(l))).toBe(true);
  });
});

describe('buildDashboardMicroSummary', () => {
  it('returns 3 rows with labels', () => {
    const rows = buildDashboardMicroSummary({
      loading: true,
    });
    expect(rows).toHaveLength(3);
    expect(rows[0].label).toBe('Futures');
  });
});
