/**
 * Rows for "This wallet now", using only fields with real sources (wallet context + dashboard bundle).
 * Does not invent total equity, aggregated open orders, or nonexistent PnL.
 */

function shortAddr(addr) {
  if (!addr || typeof addr !== 'string') return '—';
  const s = addr.trim();
  if (s.length <= 14) return s;
  return `${s.slice(0, 8)}…${s.slice(-6)}`;
}

function shortApiId(id) {
  if (!id || typeof id !== 'string') return '—';
  const s = id.trim();
  if (s.length <= 20) return s;
  return `${s.slice(0, 10)}…${s.slice(-8)}`;
}

function pickNet30d(metrics, profitSummary) {
  if (metrics && typeof metrics === 'object' && metrics.netProfit != null) {
    return { value: metrics.netProfit, source: 'performance metrics API' };
  }
  if (profitSummary && typeof profitSummary === 'object' && profitSummary.totalProfitUsd != null) {
    return { value: profitSummary.totalProfitUsd, source: 'profit summary API' };
  }
  return { value: null, source: null };
}

/**
 * @param {object} p
 * @param {boolean} p.loading
 * @param {string|null|undefined} p.dashboardUserId - userId used by useDashboardAggregate / API
 * @param {string|null|undefined} p.walletAddress - from WalletContext
 * @param {boolean} p.isWalletConnected
 * @param {string|null|undefined} p.network - network name (for example Binance Smart Chain)
 * @param {number|null|undefined} p.chainId - EVM only
 * @param {string|null|undefined} p.walletType - EVM | SOLANA | null
 * @param {string|null|undefined} p.nativeBalanceFormatted - ex. ethBalance
 * @param {string|null|undefined} p.nativeSymbol
 * @param {object} p.bundle - fields from useDashboardAggregate (subset)
 * @param {boolean} [p.omitVaultPnlHeroDuplicates] - when true, does not duplicate vault / PnL / cost basis shown in the Vault & PnL hero
 * @param {boolean} [p.omitIdentityRows] - when true, excludes wallet/chain/native/api/id-match rows from identity strip + financial hero
 * @param {'full'|'compact'} [p.diagnosticsMode] - compact: account checks + activity list depth only, without duplicates vs Systems / Platform
 * @returns {{ rows: Array<{ id: string, label: string, value: string, hint: string }>, headline: string, subline: string }}
 */
export function buildDashboardWalletSnapshot(p) {
  const {
    loading,
    dashboardUserId,
    walletAddress,
    isWalletConnected,
    network,
    chainId,
    walletType,
    nativeBalanceFormatted,
    nativeSymbol,
    bundle = {},
    omitVaultPnlHeroDuplicates = false,
    omitIdentityRows = false,
    diagnosticsMode = 'full',
  } = p || {};

  const {
    otaTrackedPositions,
    vaultBalanceComparison,
    tradesTotal,
    signalsToday,
    metrics,
    profitSummary,
    futuresOpenShorts,
    leverageDemoStatus,
    leverageDemoAccount,
  } = bundle;

  if (loading) {
    return {
      headline: 'Loading account...',
      subline: 'API + wallet, same refresh as the rest of the dashboard.',
      rows: [{ id: 'loading', label: 'Status', value: '...', hint: 'dashboard bundle' }],
    };
  }

  const apiId = dashboardUserId != null && dashboardUserId !== '' ? String(dashboardUserId) : null;
  const wal = walletAddress != null && walletAddress !== '' ? String(walletAddress) : null;

  if (diagnosticsMode === 'compact') {
    const compactRows = [];
    if (apiId && wal) {
      const same =
        apiId === wal ||
        (apiId.startsWith('0x') &&
          wal.startsWith('0x') &&
          apiId.toLowerCase() === wal.toLowerCase());
      compactRows.push({
        id: 'id-match',
        label: 'API vs wallet',
        value: same ? 'Match' : 'Different',
        hint: same
          ? 'Scoped API id matches this connected address.'
          : 'API user id may differ from the connected address (account key vs 0x).',
      });
    }
    const tn = typeof tradesTotal === 'number' ? tradesTotal : null;
    compactRows.push({
      id: 'trades',
      label: 'Activity list depth',
      value: tn != null ? String(tn) : '—',
      hint: 'Trades loaded for Live activity (paged — not full account history).',
    });
    const headline = wal
      ? `Account: ${shortAddr(wal)}`
      : apiId
        ? `API account: ${shortApiId(apiId)}`
        : 'No userId / wallet';
    const subline = isWalletConnected
      ? 'Native balance is on-chain; aggregates use the same API scope as Platform status and Systems.'
      : 'Connect a wallet to align on-chain reads with API scope.';
    return { headline, subline, rows: compactRows };
  }

  const rows = [];

  if (!omitIdentityRows) {
    rows.push({
      id: 'wallet',
      label: 'Wallet',
      value: wal ? shortAddr(wal) : 'Not connected',
      hint: wal ? 'WalletContext (connected address)' : 'Browser wallet - connect to provide an address',
    });

    const chainBits = [];
    if (network) chainBits.push(network);
    if (walletType === 'EVM' && chainId != null) chainBits.push(`chainId ${chainId}`);
    if (walletType === 'SOLANA') chainBits.push('Solana');
    rows.push({
      id: 'chain',
      label: 'Chain',
      value: chainBits.length ? chainBits.join(' · ') : walletType ? String(walletType) : '—',
      hint: 'WalletContext',
    });

    const bal =
      nativeBalanceFormatted != null && String(nativeBalanceFormatted).trim() !== ''
        ? String(nativeBalanceFormatted)
        : null;
    const sym = nativeSymbol ? String(nativeSymbol) : '';
    rows.push({
      id: 'native',
      label: 'Native (wallet)',
      value: bal != null ? `${bal} ${sym}`.trim() : '—',
      hint: bal != null ? 'wagmi useBalance / Solana RPC' : 'unavailable',
    });

    rows.push({
      id: 'api-user',
      label: 'API userId',
      value: apiId ? shortApiId(apiId) : '—',
      hint: 'Same id used by useDashboardAggregate (executions, signals, analytics)',
    });

    if (apiId && wal) {
      const same =
        apiId === wal ||
        (apiId.startsWith('0x') &&
          wal.startsWith('0x') &&
          apiId.toLowerCase() === wal.toLowerCase());
      rows.push({
        id: 'id-match',
        label: 'API vs wallet',
        value: same ? 'Match' : 'Different strings',
        hint: same
          ? 'Dashboard userId is aligned with the connected address'
          : 'userId may be an account id or another key; API data is scoped to that userId',
      });
    }
  }

  const tp = otaTrackedPositions?.summary?.totalPositions;
  const tcb = otaTrackedPositions?.summary?.totalCostBasisUsd;
  rows.push({
    id: 'ota-tracked',
    label: 'OTA tracked positions',
    value: typeof tp === 'number' ? String(tp) : '—',
      hint: 'GET open-positions analytics (server-reported subset)',
  });

  if (!omitVaultPnlHeroDuplicates) {
    rows.push({
      id: 'cost-basis',
      label: 'Tracked cost basis (USD)',
      value: typeof tcb === 'number' ? tcb.toFixed(2) : 'unavailable',
      hint:
        typeof tcb === 'number'
          ? 'from open-positions analytics summary'
          : 'field missing from response',
    });
  }

  let shortsN = null;
  if (futuresOpenShorts && typeof futuresOpenShorts === 'object') {
    if (Array.isArray(futuresOpenShorts.positions)) shortsN = futuresOpenShorts.positions.length;
    else if (typeof futuresOpenShorts.count === 'number') shortsN = futuresOpenShorts.count;
  }
  rows.push({
    id: 'futures-shorts',
    label: 'Futures shorts (API)',
    value: shortsN != null ? String(shortsN) : '—',
      hint: 'short-ops open-shorts filtered by userId when set',
  });

  if (!omitVaultPnlHeroDuplicates) {
    if (vaultBalanceComparison && typeof vaultBalanceComparison === 'object') {
      const nTok = Array.isArray(vaultBalanceComparison.tokens) ? vaultBalanceComparison.tokens.length : 0;
      const an = vaultBalanceComparison.anomalyCount;
      rows.push({
        id: 'vault',
        label: 'Vault snapshot',
      value: `tokens ${nTok}${an != null ? ` · anomalies ${an}` : ''}`,
        hint: 'GET vault balance-comparison',
      });
    } else {
      rows.push({
        id: 'vault',
        label: 'Vault snapshot',
        value: 'unavailable',
        hint: 'balance-comparison API',
      });
    }
  }

  const hasDemo = leverageDemoStatus?.hasAccount === true;
  const demoPos = Array.isArray(leverageDemoAccount?.positions) ? leverageDemoAccount.positions.length : null;
  rows.push({
    id: 'leverage',
    label: 'Leverage',
    value: hasDemo
      ? `Demo server · ${demoPos != null ? `${demoPos} pos.` : 'pos. —'}`
      : 'Live: on-chain / page (not aggregated here)',
    hint: 'leverage demo API + disclaimer - not total equity',
  });

  const tn = typeof tradesTotal === 'number' ? tradesTotal : null;
  rows.push({
    id: 'trades',
    label: 'Executions (loaded list)',
    value: tn != null ? String(tn) : '—',
    hint: 'GET trades limit/offset - not all global executions',
  });

  const st = typeof signalsToday === 'number' ? signalsToday : null;
  rows.push({
    id: 'signals-today',
    label: 'Signals today (list)',
    value: st != null ? String(st) : '—',
    hint: 'counted locally from the signal list since local midnight',
  });

  if (!omitVaultPnlHeroDuplicates) {
    const { value: netV, source: netSrc } = pickNet30d(metrics, profitSummary);
    rows.push({
      id: 'net-30d',
      label: 'Net profit (30d est.)',
      value: netV != null ? `$${Number(netV).toFixed(2)}` : 'unavailable',
      hint: netSrc || 'metrics / profit summary',
    });
  }

  const headline = wal
    ? `Account: ${shortAddr(wal)}`
    : apiId
      ? `API account: ${shortApiId(apiId)}`
      : 'No userId / wallet';

  const subline = isWalletConnected
    ? 'Native balance comes from the wallet; the rest uses the same userId as OTA/analytics APIs.'
    : 'Connect a wallet for address and native balance; OTA data uses userId when available.';

  return { headline, subline, rows };
}
