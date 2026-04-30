import {
  buildMixedDashboardLiveActivities,
  DASHBOARD_LIVE_ACTIVITY_MAX_VISIBLE,
  mapExecutionTradeToDashboardActivity,
  mapExecutionTradesToDashboardActivities,
  mapOtaHistoryToActivityRows,
} from '../dashboardActivityMap';

describe('buildMixedDashboardLiveActivities', () => {
  it('drops junk execution rows (no parseable amount + no USD) from mapped feed', () => {
    const now = Date.now();
    const exec = mapExecutionTradesToDashboardActivities([
      {
        id: 'e1',
        tokenOut: 'USDT',
        amountOut: 'not-a-number',
        price: 1,
        status: 'completed',
        createdAt: now,
      },
    ]);
    expect(exec).toHaveLength(0);
  });

  it('fills with OTA rows when execution pool is empty after filter', () => {
    const base = Date.now();
    const exec = mapExecutionTradesToDashboardActivities([
      {
        id: 'junk',
        tokenOut: 'USDT',
        amountOut: 'not-a-number',
        price: 1,
        status: 'completed',
        createdAt: base,
      },
    ]);
    expect(exec).toHaveLength(0);
    const history = {
      history: [{ id: 's1', token: 'BTC', signal: 'buy', timestamp: base, confidence: 0.5 }],
    };
    const signals = mapOtaHistoryToActivityRows(history);
    const { rows, stats } = buildMixedDashboardLiveActivities({
      executionRows: exec,
      signalRows: signals,
      maxVisible: 8,
    });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].activitySource).toBe('analysis');
    expect(stats.executionPool).toBe(0);
    expect(stats.signalShown).toBeGreaterThan(0);
  });

  it('does not let signal spam crowd out executions — exec pool fills first', () => {
    const base = Date.now();
    const exec = [1, 2, 3].map((i) =>
      mapExecutionTradeToDashboardActivity({
        id: `ex-${i}`,
        tokenOut: 'ETH',
        amountOut: '1000000000000000000',
        price: 2000,
        status: 'completed',
        createdAt: base - i * 1000,
      })
    );
    const history = {
      history: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => ({
        id: `sig-${i}`,
        token: 'BTC',
        signal: 'buy',
        timestamp: base + i * 100,
        confidence: 0.5,
      })),
    };
    const signals = mapOtaHistoryToActivityRows(history);
    const { rows, stats } = buildMixedDashboardLiveActivities({
      executionRows: exec,
      signalRows: signals,
      maxVisible: 8,
    });
    expect(stats.executionPool).toBe(3);
    expect(stats.signalPool).toBe(10);
    expect(stats.executionShown).toBe(3);
    expect(stats.signalShown).toBe(5);
    expect(rows.slice(0, 3).every((r) => r.activitySource === 'execution')).toBe(true);
    expect(rows).toHaveLength(8);
  });

  it('sorts execution block by recency before taking from signal block', () => {
    const base = 1_700_000_000_000;
    const exec = [
      mapExecutionTradeToDashboardActivity({
        id: 'older',
        tokenOut: 'A',
        amountOut: '1000000000000000000',
        price: 1,
        status: 'completed',
        createdAt: base,
      }),
      mapExecutionTradeToDashboardActivity({
        id: 'newer',
        tokenOut: 'B',
        amountOut: '1000000000000000000',
        price: 1,
        status: 'completed',
        createdAt: base + 99_000,
      }),
    ];
    const { rows } = buildMixedDashboardLiveActivities({
      executionRows: exec,
      signalRows: [],
      maxVisible: 8,
    });
    expect(rows[0].token).toBe('B');
    expect(rows[1].token).toBe('A');
  });

  it('uses default max visible constant', () => {
    expect(DASHBOARD_LIVE_ACTIVITY_MAX_VISIBLE).toBe(12);
  });
});
