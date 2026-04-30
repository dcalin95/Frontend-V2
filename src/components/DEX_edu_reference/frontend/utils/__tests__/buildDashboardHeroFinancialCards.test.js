import { buildDashboardHeroFinancialCards } from '../buildDashboardHeroFinancialCards';

describe('buildDashboardHeroFinancialCards', () => {
  it('returns loading skeleton flag when loading', () => {
    const r = buildDashboardHeroFinancialCards({ loading: true });
    expect(r.loading).toBe(true);
    expect(r.native).toBeNull();
  });

  it('native: zero state when balance is 0', () => {
    const r = buildDashboardHeroFinancialCards({
      loading: false,
      isWalletConnected: true,
      walletAddress: '0xabc0000000000000000000000000000000000001',
      network: 'BSC',
      chainId: 56,
      walletType: 'EVM',
      nativeBalanceFormatted: '0',
      nativeSymbol: 'BNB',
      bundle: {},
    });
    expect(r.native.state).toBe('zero');
    expect(r.native.value).toMatch(/^0 BNB$/);
  });

  it('UserVault: headline when no stable USD rollup but token lines exist', () => {
    const r = buildDashboardHeroFinancialCards({
      loading: false,
      isWalletConnected: true,
      walletAddress: '0xabc0000000000000000000000000000000000001',
      network: 'BSC',
      chainId: 56,
      walletType: 'EVM',
      nativeBalanceFormatted: '0.1',
      nativeSymbol: 'BNB',
      bundle: {
        vaultBalanceComparison: {
          onChainAvailable: true,
          anomalyCount: 0,
          tokens: [{ token_symbol: 'BNB', onChainBalance_human: '0.05' }],
        },
        otaTrackedPositions: { summary: { totalPositions: 0 }, positions: [] },
      },
    });
    expect(r.userVault.value).toBe('No single vault USD total from API');
    expect(r.userVault.preview.length).toBeGreaterThan(0);
  });

  it('UserVault: API stable-only rollup is not shown as headline total (honest subset label)', () => {
    const r = buildDashboardHeroFinancialCards({
      loading: false,
      isWalletConnected: true,
      walletAddress: '0xabc0000000000000000000000000000000000001',
      network: 'BSC',
      chainId: 56,
      walletType: 'EVM',
      nativeBalanceFormatted: '0.1',
      nativeSymbol: 'BNB',
      bundle: {
        vaultBalanceComparison: {
          onChainAvailable: true,
          anomalyCount: 0,
          tokens: [{ token_symbol: 'USDT', onChainBalance_human: '100' }],
        },
        otaTrackedPositions: { summary: { totalPositions: 0 }, positions: [] },
      },
    });
    expect(r.userVault.value).toBe('Stable subset only');
    expect(r.userVault.sub).toMatch(/100/);
    expect(r.userVault.sub).toMatch(/not full vault/);
    expect(r.userVault.badge).toBe('partial');
  });

  it('UserVault: Account-aligned total overrides API partial stable sum', () => {
    const r = buildDashboardHeroFinancialCards({
      loading: false,
      isWalletConnected: true,
      walletAddress: '0xabc0000000000000000000000000000000000001',
      network: 'BSC',
      chainId: 56,
      walletType: 'EVM',
      nativeBalanceFormatted: '0.1',
      nativeSymbol: 'BNB',
      vaultAccountAligned: {
        applicable: true,
        loading: false,
        error: null,
        totalUsd: 219.71,
      },
      bundle: {
        vaultBalanceComparison: {
          onChainAvailable: true,
          anomalyCount: 0,
          tokens: [{ token_symbol: 'USDT', onChainBalance_human: '4.8' }],
        },
        otaTrackedPositions: { summary: { totalPositions: 0 }, positions: [] },
      },
    });
    expect(r.userVault.value).toBe('$219.71');
    expect(r.userVault.title).toBe('Vault total');
    expect(r.userVault.sub).toBe('Same as Account');
    expect(r.userVault.footer).toBeNull();
    expect(r.userVault.footerProvenance).toMatch(/vaultAccountAligned/i);
  });

  it('exposure uses cost basis from open-positions summary when present', () => {
    const r = buildDashboardHeroFinancialCards({
      loading: false,
      isWalletConnected: true,
      walletAddress: '0xabc0000000000000000000000000000000000001',
      network: 'BSC',
      chainId: 56,
      walletType: 'EVM',
      nativeBalanceFormatted: '0.1',
      nativeSymbol: 'BNB',
      bundle: {
        otaTrackedPositions: {
          summary: { totalPositions: 2, totalCostBasisUsd: 50 },
          positions: [],
        },
      },
    });
    expect(r.exposure.value).toBe('2');
    expect(r.exposure.sub).toMatch(/Cost basis about \$50\.00/);
  });

  it('when aggregate has no wallet API key, vault and PnL show not loaded', () => {
    const r = buildDashboardHeroFinancialCards({
      loading: false,
      isWalletConnected: true,
      walletAddress: '0xabc0000000000000000000000000000000000001',
      network: 'BSC',
      chainId: 56,
      walletType: 'EVM',
      nativeBalanceFormatted: '0.1',
      nativeSymbol: 'BNB',
      bundle: {
        aggregateMeta: { keySource: 'none', reason: 'no_wallet_backed_key', apiUserId: null },
      },
    });
    expect(r.userVault.value).toBe('Connect wallet');
    expect(r.profitLoss.value).toBe('Connect wallet');
  });

  it('profitLoss: zero state includes stateNote when primary is 0', () => {
    const r = buildDashboardHeroFinancialCards({
      loading: false,
      isWalletConnected: true,
      walletAddress: '0xabc0000000000000000000000000000000000001',
      network: 'BSC',
      chainId: 56,
      walletType: 'EVM',
      nativeBalanceFormatted: '0.1',
      nativeSymbol: 'BNB',
      bundle: {
        metrics: { netProfit: 0 },
        profitSummary: {},
        portfolioAnalytics: { totalRealizedPnlNetUsd: 0, totalGasSpentUsd: 0 },
        otaTrackedPositions: { summary: { totalPositions: 0 }, positions: [] },
      },
    });
    expect(r.profitLoss.state).toBe('zero');
    expect(r.profitLoss.stateNote).toBeNull();
  });
});
