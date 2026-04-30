/**
 * Vault money + PnL for the dashboard, using only fields from APIs already in use.
 * Vault USD total does not exist as a single field; show human token sums plus optional stablecoin estimate with a clear label.
 */

const STABLE_SYMBOLS = new Set(['USDT', 'USDC', 'BUSD', 'DAI', 'FDUSD', 'TUSD', 'USDP', 'EURC', 'EURS']);

function parseHumanAmount(h) {
  if (h == null || h === '') return null;
  const n = parseFloat(String(h).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

/**
 * Unrealized sum from OTA positions (analytics open-positions), when numeric fields exist.
 */
export function sumUnrealizedPnlFromOpenPositions(otaTrackedPositions) {
  const positions = otaTrackedPositions?.positions;
  if (!Array.isArray(positions) || positions.length === 0) return { sum: null, count: 0 };
  let sum = 0;
  let n = 0;
  for (const p of positions) {
    const v = p?.unrealizedPnlNetUsd ?? p?.unrealizedPnlGrossUsd;
    if (typeof v === 'number' && Number.isFinite(v)) {
      sum += v;
      n += 1;
    }
  }
  return { sum: n > 0 ? sum : null, count: positions.length };
}

/**
 * Vault lines from GET vault/balance-comparison (token_symbol, onChainBalance_human, dbDerivedBalance_human).
 */
export function parseVaultComparisonTokens(vaultBalanceComparison) {
  if (!vaultBalanceComparison || typeof vaultBalanceComparison !== 'object') {
    return {
      tokenCount: 0,
      lines: [],
      stableUsdEstimate: null,
      onChainAvailable: false,
      anomalyCount: null,
      note: null,
    };
  }
  const tokens = Array.isArray(vaultBalanceComparison.tokens) ? vaultBalanceComparison.tokens : [];
  const onChainAvailable = vaultBalanceComparison.onChainAvailable === true;
  const anomalyCount =
    typeof vaultBalanceComparison.anomalyCount === 'number' ? vaultBalanceComparison.anomalyCount : null;
  const note = vaultBalanceComparison.note != null ? String(vaultBalanceComparison.note) : null;

  const lines = [];
  let stableUsdEstimate = 0;
  let stableCount = 0;

  for (const t of tokens.slice(0, 12)) {
    const sym = (t.token_symbol || t.symbol || '—').toString().toUpperCase();
    let amountStr = null;
    let sourceLabel = '—';
    if (t.onChainBalance_human != null && String(t.onChainBalance_human).trim() !== '') {
      amountStr = String(t.onChainBalance_human);
      sourceLabel = onChainAvailable ? 'on-chain (reconcile)' : 'on-chain human';
    } else if (t.dbDerivedBalance_human != null && String(t.dbDerivedBalance_human).trim() !== '') {
      amountStr = String(t.dbDerivedBalance_human);
      sourceLabel = 'DB-derived (comparison)';
    }
    if (amountStr) {
      lines.push({ symbol: sym, amount: amountStr, sourceLabel, provenance: t.provenanceStatus || null });
      const num = parseHumanAmount(amountStr);
      if (num != null && STABLE_SYMBOLS.has(sym)) {
        stableUsdEstimate += num;
        stableCount += 1;
      }
    }
  }

  return {
    tokenCount: tokens.length,
    lines: lines.slice(0, 6),
    stableUsdEstimate: stableCount > 0 ? stableUsdEstimate : null,
    stableFootnote:
      stableCount > 0
        ? `Estimated: only stablecoins (${stableCount} lines) treated as 1:1 USD; BNB/unpriced altcoins are not included here.`
        : null,
    onChainAvailable,
    anomalyCount,
    note,
  };
}

/**
 * @param {object} bundle - from useDashboardAggregate (+ portfolioAnalytics)
 */
export function buildDashboardWalletMoneyHero(bundle) {
  const loading = bundle?.loading === true;
  if (loading) {
    return { loading: true, vault: null, pnl: null };
  }

  const {
    vaultBalanceComparison,
    metrics,
    profitSummary,
    portfolioAnalytics,
    otaTrackedPositions,
  } = bundle || {};

  const vault = parseVaultComparisonTokens(vaultBalanceComparison);

  const pnlRows = [];

  if (metrics && typeof metrics === 'object' && metrics.netProfit != null) {
    const v = Number(metrics.netProfit);
    pnlRows.push({
      id: 'net-30d-metrics',
      label: 'Net profit (30d)',
      value: Number.isFinite(v) ? `$${v.toFixed(2)}` : '—',
      source: 'GET performance/metrics · period=30d',
      kind: 'summary',
      detail: 'Backend performance aggregate for userId; may differ from raw execution_history.',
    });
  }

  if (profitSummary && typeof profitSummary === 'object' && profitSummary.totalProfitUsd != null) {
    const v = Number(profitSummary.totalProfitUsd);
    pnlRows.push({
      id: 'profit-summary-api',
      label: 'Total profit (profit API)',
      value: Number.isFinite(v) ? `$${v.toFixed(2)}` : '—',
      source: 'GET performance/profit (closed / server aggregate)',
      kind: 'exact',
      detail:
        typeof profitSummary.fromExecutions === 'number' || typeof profitSummary.fromDirectEntry === 'number'
          ? `Exec: ${profitSummary.fromExecutions ?? '—'} · Direct: ${profitSummary.fromDirectEntry ?? '—'}`
          : null,
    });
  }

  if (portfolioAnalytics && typeof portfolioAnalytics === 'object') {
    const net =
      portfolioAnalytics.totalRealizedPnlNetUsd != null
        ? Number(portfolioAnalytics.totalRealizedPnlNetUsd)
        : portfolioAnalytics.totalRealizedPnlUsd != null
          ? Number(portfolioAnalytics.totalRealizedPnlUsd)
          : null;
    if (net != null && Number.isFinite(net)) {
      pnlRows.push({
        id: 'portfolio-realized',
        label: 'Realized PnL (execution_history DB)',
        value: `$${net.toFixed(2)}`,
        source: 'GET analytics/portfolio-summary',
        kind: 'exact',
        detail:
          portfolioAnalytics.transactionCount != null
            ? `Aggregated transactions: ${portfolioAnalytics.transactionCount}`
            : 'From ota.execution_history table (profit_usd).',
      });
    }
    if (portfolioAnalytics.totalGasSpentUsd != null && Number.isFinite(Number(portfolioAnalytics.totalGasSpentUsd))) {
      const g = Number(portfolioAnalytics.totalGasSpentUsd);
      pnlRows.push({
        id: 'gas-spent',
        label: 'Gas (sum, analytics)',
        value: `$${g.toFixed(4)}`,
        source: 'GET analytics/portfolio-summary',
        kind: 'exact',
        detail: 'Gas costs reported in the same aggregate.',
      });
    }
  }

  const { sum: unrealizedSum, count: posCount } = sumUnrealizedPnlFromOpenPositions(otaTrackedPositions);
  if (unrealizedSum != null && Number.isFinite(unrealizedSum)) {
    pnlRows.push({
      id: 'unrealized-open',
      label: 'Unrealized PnL (open OTA positions)',
      value: `$${unrealizedSum.toFixed(2)}`,
      source: 'GET analytics/open-positions (sum of unrealizedPnlNetUsd by position)',
      kind: 'partial',
      detail: `${posCount} positions in response; server-reported subset.`,
    });
  }

  const tp = otaTrackedPositions?.summary?.totalCostBasisUsd;
  if (typeof tp === 'number' && Number.isFinite(tp)) {
    pnlRows.push({
      id: 'cost-basis-exposure',
      label: 'Cost basis tracked (USD)',
      value: `$${tp.toFixed(2)}`,
      source: 'open-positions summary.totalCostBasisUsd',
      kind: 'exposure',
      detail: 'Not PnL; exposure / cost basis for tracked positions.',
    });
  }

  return {
    loading: false,
    vault,
    pnl: { rows: pnlRows },
  };
}
