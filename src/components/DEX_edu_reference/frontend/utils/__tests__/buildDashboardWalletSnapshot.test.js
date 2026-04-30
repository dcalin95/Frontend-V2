import { buildDashboardWalletSnapshot } from '../buildDashboardWalletSnapshot';

describe('buildDashboardWalletSnapshot', () => {
  it('returns loading placeholder when loading', () => {
    const r = buildDashboardWalletSnapshot({ loading: true });
    expect(r.headline).toMatch(/Loading account/i);
    expect(r.rows.length).toBeGreaterThan(0);
  });

  it('lists wallet, API user, and marks unavailable when vault missing', () => {
    const r = buildDashboardWalletSnapshot({
      loading: false,
      dashboardUserId: '0xabc0000000000000000000000000000000000001',
      walletAddress: '0xabc0000000000000000000000000000000000001',
      isWalletConnected: true,
      network: 'Binance Smart Chain',
      chainId: 56,
      walletType: 'EVM',
      nativeBalanceFormatted: '0.0123',
      nativeSymbol: 'BNB',
      bundle: {
        otaTrackedPositions: { summary: { totalPositions: 2, totalCostBasisUsd: 100.5 } },
        vaultBalanceComparison: null,
        tradesTotal: 30,
        signalsToday: 1,
        metrics: { netProfit: 12.34 },
        futuresOpenShorts: { positions: [{ id: 1 }], count: 1 },
        leverageDemoStatus: { hasAccount: false },
        leverageDemoAccount: null,
      },
    });
    expect(r.rows.some((x) => x.id === 'wallet')).toBe(true);
    expect(r.rows.some((x) => x.id === 'api-user')).toBe(true);
    expect(r.rows.find((x) => x.id === 'vault')?.value).toMatch(/unavailable/i);
    expect(r.rows.find((x) => x.id === 'ota-tracked')?.value).toBe('2');
  });

  it('compact diagnostics omits duplicate system/platform rows', () => {
    const r = buildDashboardWalletSnapshot({
      loading: false,
      diagnosticsMode: 'compact',
      omitIdentityRows: true,
      omitVaultPnlHeroDuplicates: true,
      dashboardUserId: '0xabc0000000000000000000000000000000000001',
      walletAddress: '0xabc0000000000000000000000000000000000001',
      isWalletConnected: true,
      network: 'BSC',
      chainId: 56,
      walletType: 'EVM',
      nativeBalanceFormatted: '1',
      nativeSymbol: 'BNB',
      bundle: {
        otaTrackedPositions: { summary: { totalPositions: 3 } },
        tradesTotal: 5,
        signalsToday: 2,
        leverageDemoStatus: { hasAccount: false },
        leverageDemoAccount: null,
        futuresOpenShorts: null,
      },
    });
    expect(r.rows.some((x) => x.id === 'ota-tracked')).toBe(false);
    expect(r.rows.some((x) => x.id === 'signals-today')).toBe(false);
    expect(r.rows.find((x) => x.id === 'trades')?.value).toBe('5');
    expect(r.rows.find((x) => x.id === 'id-match')?.value).toBe('Match');
  });
});
