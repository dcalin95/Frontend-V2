/**
 * Carduri hero Native / UserVault / PnL / Exposure — DTO pentru UI (fără texte lungi în mapper).
 */

import { parseVaultComparisonTokens, sumUnrealizedPnlFromOpenPositions } from './buildDashboardWalletMoneyHero.js';
import { logDashboardPipeline } from './dashboardPipelineDebug.js';

/** @typedef {'value'|'zero'|'partial'|'unavailable'} VisualState */

function parseNativeNum(formatted) {
  if (formatted == null || String(formatted).trim() === '') return null;
  const n = parseFloat(String(formatted).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

/**
 * Culoare discretă doar pe cifra principală P&amp;L.
 * @param {number|null|undefined} primaryNum
 * @param {string} pnlState
 * @returns {'positive'|'negative'|'neutral'|'muted'}
 */
function accentForNumericPnl(primaryNum, pnlState) {
  if (pnlState === 'unavailable' && (primaryNum == null || !Number.isFinite(Number(primaryNum)))) {
    return 'muted';
  }
  const n = Number(primaryNum);
  if (!Number.isFinite(n)) return 'neutral';
  if (n > 0) return 'positive';
  if (n < 0) return 'negative';
  return 'neutral';
}

/**
 * @param {object} input
 * @param {object} [input.bundle] - useDashboardAggregate
 * @param {boolean} [input.loading]
 * @param {string|null} [input.walletAddress]
 * @param {boolean} [input.isWalletConnected]
 * @param {string|null} [input.network]
 * @param {number|null} [input.chainId]
 * @param {string|null} [input.walletType]
 * @param {string|null} [input.nativeBalanceFormatted]
 * @param {string|null} [input.nativeSymbol]
 * @param {string|null} [input.dashboardUserId]
 * @param {{ applicable?: boolean, loading?: boolean, totalUsd?: number|null, error?: string|null }} [input.vaultAccountAligned]
 *        Total vault USD aceeași logică ca /dex-edu/account (on-chain + tokenPriceService). Dacă lipsește sau nu e aplicabil, nu afișăm sume parțiale API ca „total”.
 */
export function buildDashboardHeroFinancialCards(input) {
  const {
    bundle = {},
    loading,
    isWalletConnected,
    network,
    chainId,
    walletType,
    nativeBalanceFormatted,
    nativeSymbol,
    walletAddress,
    dashboardUserId,
    vaultAccountAligned,
  } = input || {};

  if (loading) {
    return {
      loading: true,
      native: null,
      userVault: null,
      profitLoss: null,
      exposure: null,
    };
  }

  const am = bundle.aggregateMeta;
  const noWalletApiKey = Boolean(am && (am.keySource === 'none' || am.reason === 'no_wallet_backed_key'));

  const sym = nativeSymbol ? String(nativeSymbol) : '';
  const balStr =
    nativeBalanceFormatted != null && String(nativeBalanceFormatted).trim() !== ''
      ? String(nativeBalanceFormatted).trim()
      : null;
  const balNum = parseNativeNum(balStr);

  /** @type {{ state: VisualState, badge: string|null, title: string, value: string, sub: string, sub2: string|null, footer: string|null, footerProvenance?: string|null, valueAccent: string }} */
  let native;
  if (!isWalletConnected || !walletAddress) {
    native = {
      state: 'unavailable',
      badge: null,
      title: 'Wallet balance',
      value: 'Not connected',
      sub: 'Connect a wallet to see balance',
      sub2: null,
      footer: null,
      footerProvenance: 'Native balance comes from the connected wallet via RPC / wagmi after you connect.',
      valueAccent: 'muted',
    };
  } else if (balStr == null) {
    native = {
      state: 'unavailable',
      badge: null,
      title: 'Wallet balance',
      value: 'Balance unavailable',
      sub: 'Could not read native balance',
      sub2: null,
      footer: null,
      footerProvenance: 'Read failed at the wallet/RPC layer — not a missing user preference.',
      valueAccent: 'muted',
    };
  } else if (balNum === 0) {
    native = {
      state: 'zero',
      badge: null,
      title: 'Wallet balance',
      value: `0 ${sym}`.trim(),
      sub: [network, walletType === 'EVM' && chainId != null ? `Chain ${chainId}` : walletType]
        .filter(Boolean)
        .join(' · '),
      sub2: 'Zero balance (valid)',
      footer: null,
      footerProvenance: 'Native token balance for the connected address (on-chain, via your wallet provider).',
      valueAccent: 'neutral',
    };
  } else {
    native = {
      state: 'value',
      badge: null,
      title: 'Wallet balance',
      value: `${balStr} ${sym}`.trim(),
      sub: [network, walletType === 'EVM' && chainId != null ? `Chain ${chainId}` : walletType]
        .filter(Boolean)
        .join(' · '),
      sub2: null,
      footer: null,
      footerProvenance: 'Native token balance for the connected address (on-chain, via your wallet provider).',
      valueAccent: 'money',
    };
  }

  const vcmp = bundle.vaultBalanceComparison;
  const vaultParsed = parseVaultComparisonTokens(vcmp);

  /** @type {{ state: VisualState, badge: string|null, title: string, value: string, sub: string, sub2: string|null, footer: string|null, footerProvenance?: string|null, preview: Array<{ sym: string, amt: string }>, valueAccent: string }} */
  let userVault;

  const aligned = vaultAccountAligned && typeof vaultAccountAligned === 'object' ? vaultAccountAligned : null;
  const useAligned =
    aligned &&
    aligned.applicable === true &&
    isWalletConnected &&
    walletType === 'EVM';

  if (noWalletApiKey) {
    userVault = {
      state: 'unavailable',
      badge: null,
      title: 'Vault',
      value: 'Connect wallet',
      sub: 'Vault snapshot needs your wallet address',
      sub2: null,
      footer: null,
      footerProvenance:
        'Vault snapshot uses the balance-comparison API with a wallet-backed user key (same family of calls as other OTA aggregates).',
      preview: [],
      valueAccent: 'muted',
    };
  } else if (useAligned && aligned.loading) {
    userVault = {
      state: 'partial',
      badge: null,
      title: 'Vault',
      value: 'Loading…',
      sub: 'Reading vault (same path as Account)',
      sub2: null,
      footer: null,
      footerProvenance:
        'Total is computed with the same pipeline as Personal Account: on-chain UserVault token balances × market prices.',
      preview: [],
      valueAccent: 'neutral',
    };
  } else if (useAligned && aligned.error && String(aligned.error).trim() !== '') {
    userVault = {
      state: 'unavailable',
      badge: null,
      title: 'Vault',
      value: 'Vault total unavailable',
      sub: 'Open Account for full vault value',
      sub2: String(aligned.error).slice(0, 120),
      footer: null,
      footerProvenance: 'vaultAccountAligned failed during on-chain or pricing steps; see subline for the short error.',
      preview: [],
      valueAccent: 'muted',
    };
  } else if (useAligned && aligned.totalUsd != null && Number.isFinite(Number(aligned.totalUsd))) {
    const n = Number(aligned.totalUsd);
    userVault = {
      state: n === 0 ? 'zero' : 'value',
      badge: null,
      title: 'Vault total',
      value: `$${n.toFixed(2)}`,
      sub: 'Same as Account',
      sub2: null,
      footer: null,
      footerProvenance:
        'USD total matches Personal Account: on-chain UserVault balances priced via the same market pipeline (vaultAccountAligned).',
      preview: [],
      valueAccent: 'money',
    };
  } else if (walletType === 'SOLANA') {
    userVault = {
      state: 'unavailable',
      badge: null,
      title: 'Vault',
      value: 'EVM vault (BSC) not shown here',
      sub: 'Personal Account shows BSC UserVault totals when you use an EVM wallet',
      sub2: null,
      footer: null,
      footerProvenance: 'This dashboard block targets EVM UserVault; Solana session does not load BSC vault totals in this card.',
      preview: [],
      valueAccent: 'muted',
    };
  } else if (vcmp == null) {
    userVault = {
      state: 'unavailable',
      badge: null,
      title: 'Vault',
      value: 'Vault data unavailable',
      sub: 'No response from vault API',
      sub2: null,
      footer: null,
      footerProvenance: 'No balance-comparison payload — cannot derive vault snapshot lines.',
      preview: [],
      valueAccent: 'muted',
    };
  } else if (vaultParsed.tokenCount === 0 && vaultParsed.lines.length === 0) {
    userVault = {
      state: 'zero',
      badge: null,
      title: 'Vault',
      value: 'Vault snapshot empty',
      sub: 'No token balances returned',
      sub2:
        vaultParsed.anomalyCount != null
          ? `Anomalies: ${vaultParsed.anomalyCount}`
          : null,
      footer: null,
      footerProvenance: 'balance-comparison returned no token lines (empty or filtered).',
      preview: [],
      valueAccent: 'neutral',
    };
  } else {
    const partial = !vaultParsed.onChainAvailable;
    const hasStableEst = vaultParsed.stableUsdEstimate != null && vaultParsed.stableUsdEstimate > 0;
    const preview = vaultParsed.lines.slice(0, 3).map((ln) => ({ sym: ln.symbol, amt: ln.amount }));

    let value = '';
    let badge = null;
    let state = /** @type {VisualState} */ ('value');
    let sub1 = '';
    let sub2 = '';

    if (hasStableEst) {
      value = 'Stable subset only';
      state = 'partial';
      badge = 'partial';
      sub1 = `~$${vaultParsed.stableUsdEstimate.toFixed(2)} from stables (1:1) — not full vault`;
      sub2 = 'Full vault total (USD) is on /dex-edu/account — dashboard does not show a partial sum as total';
    } else if (preview.length > 0) {
      value = 'No single vault USD total from API';
      state = partial ? 'partial' : 'value';
      badge = partial ? 'partial' : null;
      sub1 = vaultParsed.anomalyCount != null ? `Anomalies: ${vaultParsed.anomalyCount}` : 'Anomalies: none';
      sub2 = vaultParsed.onChainAvailable ? 'On-chain reconcile' : 'Partial · DB or off-chain';
    } else {
      value = vaultParsed.tokenCount === 1 ? '1 token type' : `${vaultParsed.tokenCount} token types`;
      state = vaultParsed.tokenCount === 0 ? 'zero' : 'partial';
      sub1 =
        vaultParsed.anomalyCount != null ? `Anomalies: ${vaultParsed.anomalyCount}` : 'Anomalies: none';
      sub2 = vaultParsed.onChainAvailable ? 'On-chain reconcile' : 'Partial · DB or off-chain';
    }

    userVault = {
      state,
      badge,
      title: 'Vault',
      value,
      sub: sub1,
      sub2,
      footer: null,
      footerProvenance:
        'Derived from balance-comparison API lines; full USD total when on-chain reconcile exists is on Personal Account — dashboard avoids showing a misleading partial as “total”.',
      preview: preview.slice(0, 3),
      valueAccent: badge === 'partial' ? 'warning' : 'neutral',
    };
  }

  const { metrics, profitSummary, portfolioAnalytics, otaTrackedPositions } = bundle;

  if (noWalletApiKey) {
    const out = {
      loading: false,
      native,
      userVault,
      profitLoss: {
        state: 'unavailable',
        badge: null,
        title: 'Profit & loss',
        primaryLabel: 'Unavailable',
        value: 'Connect wallet',
        metrics: [
          { k: 'Realized', v: '—' },
          { k: 'Unrealized', v: '—' },
          { k: 'Gas', v: '—' },
        ],
        stateNote: null,
        footer: null,
        footerProvenance:
          'Profit and portfolio calls require the same wallet-backed API identity as other OTA aggregates.',
        valueAccent: 'muted',
      },
      exposure: {
        state: 'unavailable',
        title: 'Exposure',
        value: '—',
        sub: 'Needs wallet for position count',
        footer: null,
        footerProvenance:
          'Open-position count comes from OTA open-positions analytics once your API key is available.',
        valueAccent: 'muted',
      },
    };
    logDashboardPipeline('mapper.hero', { noWalletApiKey: true, keys: Object.keys(out) });
    return out;
  }

  const net30 =
    metrics && typeof metrics === 'object' && metrics.netProfit != null
      ? Number(metrics.netProfit)
      : null;
  const profitApi =
    profitSummary && typeof profitSummary === 'object' && profitSummary.totalProfitUsd != null
      ? Number(profitSummary.totalProfitUsd)
      : null;
  let realizedPort = null;
  if (portfolioAnalytics && typeof portfolioAnalytics === 'object') {
    const a = portfolioAnalytics.totalRealizedPnlNetUsd ?? portfolioAnalytics.totalRealizedPnlUsd;
    if (a != null && Number.isFinite(Number(a))) realizedPort = Number(a);
  }
  const gas =
    portfolioAnalytics && portfolioAnalytics.totalGasSpentUsd != null
      ? Number(portfolioAnalytics.totalGasSpentUsd)
      : null;
  const { sum: unrealizedSum } = sumUnrealizedPnlFromOpenPositions(otaTrackedPositions);

  /** @type {'net30'|'realized'|'profitApi'|'unrealized'|'none'} */
  let primaryKind = 'none';
  let primaryNum = null;
  let primarySource = '';

  if (net30 != null && Number.isFinite(net30)) {
    primaryKind = 'net30';
    primaryNum = net30;
    primarySource = 'performance/metrics';
  } else if (realizedPort != null && Number.isFinite(realizedPort)) {
    primaryKind = 'realized';
    primaryNum = realizedPort;
    primarySource = 'analytics/portfolio-summary';
  } else if (profitApi != null && Number.isFinite(profitApi)) {
    primaryKind = 'profitApi';
    primaryNum = profitApi;
    primarySource = 'performance/profit';
  } else if (unrealizedSum != null && Number.isFinite(unrealizedSum)) {
    primaryKind = 'unrealized';
    primaryNum = unrealizedSum;
    primarySource = 'open-positions (sum)';
  }

  const primaryLabel =
    primaryKind === 'net30'
      ? '30-day net'
      : primaryKind === 'realized'
        ? 'Realized P&L'
        : primaryKind === 'profitApi'
          ? 'Summary line'
          : primaryKind === 'unrealized'
            ? 'Unrealized P&L'
            : '—';

  const fmt = (x) => (x != null && Number.isFinite(x) ? `$${Number(x).toFixed(2)}` : '—');

  const hasNumeric =
    (net30 != null && Number.isFinite(net30)) ||
    (profitApi != null && Number.isFinite(profitApi)) ||
    (realizedPort != null && Number.isFinite(realizedPort)) ||
    (unrealizedSum != null && Number.isFinite(unrealizedSum)) ||
    (gas != null && Number.isFinite(gas));

  /** @type {VisualState} */
  let pnlState = 'unavailable';
  if (primaryNum == null && !hasNumeric) {
    pnlState = 'unavailable';
  } else if (primaryNum == null) {
    pnlState = 'unavailable';
  } else if (primaryKind === 'unrealized' && primaryNum !== 0) {
    pnlState = 'partial';
  } else if (primaryNum === 0) {
    pnlState = 'zero';
  } else {
    pnlState = 'value';
  }

  const primaryCaption =
    pnlState === 'unavailable' && primaryKind === 'none' ? 'Nothing to show yet' : primaryLabel;

  const pnlValueAccent = accentForNumericPnl(primaryNum, pnlState);

  const profitLoss = {
    state: pnlState,
    badge:
      primaryKind === 'unrealized' && primaryNum !== 0
        ? 'partial'
        : primaryKind === 'net30' && net30 != null
          ? 'summary'
          : null,
    title: 'Profit & loss',
    primaryLabel: primaryCaption,
    value:
      primaryNum != null && Number.isFinite(primaryNum)
        ? fmt(primaryNum)
        : pnlState === 'unavailable'
          ? 'No data'
          : '$0.00',
    metrics: [
      { k: 'Realized', v: realizedPort != null ? fmt(realizedPort) : '—' },
      { k: 'Unrealized', v: unrealizedSum != null ? fmt(unrealizedSum) : '—' },
      { k: 'Gas', v: gas != null ? `$${Number(gas).toFixed(4)}` : '—' },
    ],
    stateNote: null,
    footer: null,
    footerProvenance: primarySource
      ? `Primary line: ${primaryCaption}. Source: ${primarySource}. Sub-rows: portfolio and open positions when available.`
      : 'No backend path produced a primary P&L line; sub-rows may still be empty.',
    valueAccent: pnlValueAccent,
  };

  const tp = otaTrackedPositions?.summary?.totalPositions;
  const tcb = otaTrackedPositions?.summary?.totalCostBasisUsd;
  const costBasisUsd =
    typeof tcb === 'number' && Number.isFinite(tcb) ? tcb : null;
  const posN = typeof tp === 'number' ? tp : null;

  /** @type {{ state: VisualState, title: string, value: string, sub: string, footer: string|null, footerProvenance?: string|null }} */
  const exposure =
    posN != null
      ? {
          state: posN > 0 ? 'value' : 'zero',
          title: 'Exposure',
          value: String(posN),
          sub:
            posN === 0
              ? 'No open tracked positions'
              : costBasisUsd != null
                ? `Cost basis about ${fmt(costBasisUsd)}`
                : 'Open positions',
          footer: null,
          footerProvenance:
            'Count and cost basis from OTA open-positions analytics (server-side subset for this user, not necessarily all venues).',
          valueAccent: 'neutral',
        }
      : {
          state: 'unavailable',
          title: 'Exposure',
          value: '—',
          sub: 'Position count not loaded',
          footer: null,
          footerProvenance:
            'Open-position summary was missing — analytics did not return totalPositions.',
          valueAccent: 'muted',
        };

  const heroOut = {
    loading: false,
    native,
    userVault,
    profitLoss,
    exposure,
  };
  logDashboardPipeline('mapper.hero', {
    nativeState: native.state,
    vaultState: userVault.state,
    pnlState: profitLoss.state,
    exposureState: exposure.state,
  });
  return heroOut;
}
