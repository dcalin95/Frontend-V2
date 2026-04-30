import {
  buildDashboardWalletMoneyHero,
  sumUnrealizedPnlFromOpenPositions,
} from '../buildDashboardWalletMoneyHero';

describe('sumUnrealizedPnlFromOpenPositions', () => {
  it('sums unrealizedPnlNetUsd', () => {
    const r = sumUnrealizedPnlFromOpenPositions({
      positions: [{ unrealizedPnlNetUsd: 1 }, { unrealizedPnlNetUsd: 2.5 }],
    });
    expect(r.sum).toBe(3.5);
    expect(r.count).toBe(2);
  });

  it('returns null sum when no numeric fields', () => {
    const r = sumUnrealizedPnlFromOpenPositions({ positions: [{}] });
    expect(r.sum).toBe(null);
  });
});

describe('buildDashboardWalletMoneyHero', () => {
  it('returns loading state', () => {
    expect(buildDashboardWalletMoneyHero({ loading: true }).loading).toBe(true);
  });

  it('parses vault tokens and stable estimate', () => {
    const h = buildDashboardWalletMoneyHero({
      loading: false,
      vaultBalanceComparison: {
        onChainAvailable: true,
        anomalyCount: 0,
        tokens: [
          { token_symbol: 'USDT', onChainBalance_human: '100.00', provenanceStatus: 'EXACT' },
          { token_symbol: 'BNB', onChainBalance_human: '0.5', provenanceStatus: 'EXACT' },
        ],
      },
      metrics: { netProfit: 10 },
      profitSummary: { totalProfitUsd: 5, fromExecutions: 3, fromDirectEntry: 2 },
      portfolioAnalytics: {
        totalRealizedPnlNetUsd: 4.2,
        totalGasSpentUsd: 0.01,
        transactionCount: 12,
      },
      otaTrackedPositions: {
        summary: { totalCostBasisUsd: 200 },
        positions: [{ unrealizedPnlNetUsd: 1 }],
      },
    });
    expect(h.vault.tokenCount).toBe(2);
    expect(h.vault.stableUsdEstimate).toBe(100);
    expect(h.pnl.rows.some((r) => r.id === 'net-30d-metrics')).toBe(true);
    expect(h.pnl.rows.some((r) => r.id === 'portfolio-realized')).toBe(true);
    expect(h.pnl.rows.some((r) => r.id === 'unrealized-open')).toBe(true);
  });
});
