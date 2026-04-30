/**
 * Dashboard - useDashboardAggregate (executions, signals, OTA, quota, health).
 * Structure: 4 regions: command | product | ops | split (activity | insights).
 *
 * @module Dashboard
 */

import React, { lazy, Suspense, memo, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDexAuth } from '../context/DexAuthContext';
import { useWallet } from '../../context/WalletContext.jsx';
import { toast } from 'react-toastify';
import Skeleton from '../components/common/Skeleton';
import ErrorBoundary from '../components/common/ErrorBoundary';
import DashboardCommandStrip from '../components/dashboard/DashboardCommandStrip';
import DashboardPlatformStatusRow from '../components/dashboard/DashboardPlatformStatusRow';
import DashboardWalletSnapshot from '../components/dashboard/DashboardWalletSnapshot';
import DashboardAttentionBar from '../components/dashboard/DashboardAttentionBar';
import DashboardSystemStatusGrid from '../components/dashboard/DashboardSystemStatusGrid';
import DashboardBentoNav from '../components/dashboard/DashboardBentoNav';
import DashboardInsights from '../components/dashboard/DashboardInsights';
import DashboardIntelMicroBand from '../components/dashboard/DashboardIntelMicroBand';
import { useDashboardAggregate } from '../hooks/useDashboardAggregate';
import { useVaultDeposit } from '../hooks/useVaultDeposit';
import tokenPriceService from '../services/tokenPriceService';
import { computeVaultTotalUsdPersonalAccount } from '../utils/computeVaultTotalUsdPersonalAccount';
import '../styles/pages.css';
import '../styles/components/dashboard-page.css';
import '../styles/components/dashboard-structure.css';

const RecentActivity = lazy(() =>
  import('../components/dashboard/RecentActivity').catch(() => ({ default: () => null }))
);

const Dashboard = memo(({ userId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { checkAuthStatus } = useDexAuth();
  const {
    walletType,
    walletAddress,
    isConnected,
    network,
    chainId,
    ethBalance,
    nativeSymbol,
  } = useWallet();
  const isSolanaWallet = walletType === 'SOLANA';
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [vaultUsdPrices, setVaultUsdPrices] = useState({});

  const vaultDeposit = useVaultDeposit();

  const aggregate = useDashboardAggregate(userId || null, { walletAddress, walletType });

  const tokenSymbolsKey = useMemo(() => {
    if (!vaultDeposit.tokenOptions?.length) return '';
    return vaultDeposit.tokenOptions.map((t) => t.symbol).sort().join(',');
  }, [vaultDeposit.tokenOptions]);

  useEffect(() => {
    if (walletType !== 'EVM' || vaultDeposit.loading || !tokenSymbolsKey) return;
    const symbols = tokenSymbolsKey.split(',');
    tokenPriceService.getAllTokenPrices(symbols).then((p) => setVaultUsdPrices(p || {})).catch(() => {});
  }, [walletType, vaultDeposit.loading, tokenSymbolsKey]);

  const vaultAccountAligned = useMemo(() => {
    if (!isConnected || walletType !== 'EVM') {
      return { applicable: false };
    }
    const { totalUsd } = computeVaultTotalUsdPersonalAccount({
      tokenOptions: vaultDeposit.tokenOptions || [],
      balances: vaultDeposit.balances || {},
      vaultTokenPrices: vaultUsdPrices,
    });
    return {
      applicable: true,
      loading: vaultDeposit.loading,
      error: vaultDeposit.error || null,
      totalUsd,
    };
  }, [
    isConnected,
    walletType,
    vaultDeposit.loading,
    vaultDeposit.error,
    vaultDeposit.tokenOptions,
    vaultDeposit.balances,
    vaultUsdPrices,
  ]);

  const activityUserId = aggregate.apiUserId || userId || null;

  const activityPayload = useMemo(() => {
    if (!activityUserId) return null;
    const initial =
      (aggregate.isInitialLoading ?? aggregate.loading) && aggregate.lastUpdatedAt == null;
    return {
      trades: aggregate.trades,
      analysisHistory: aggregate.analysisHistory,
      loading: initial,
      isInitialLoading: initial,
      isRefreshing: aggregate.isRefreshing,
      refreshError: aggregate.refreshError,
      error: aggregate.error,
    };
  }, [
    activityUserId,
    aggregate.trades,
    aggregate.analysisHistory,
    aggregate.loading,
    aggregate.isInitialLoading,
    aggregate.lastUpdatedAt,
    aggregate.isRefreshing,
    aggregate.refreshError,
    aggregate.error,
  ]);

  const handleManualRefresh = async () => {
    setRefreshBusy(true);
    try {
      await aggregate.refresh();
    } finally {
      setRefreshBusy(false);
    }
  };

  useEffect(() => {
    const authSuccess = searchParams.get('auth');
    if (authSuccess === 'success') {
      setSearchParams({}, { replace: true });
      setTimeout(() => {
        checkAuthStatus()
          .then(() => toast.success('Login successful!'))
          .catch((err) => {
            console.error('Error refreshing auth after OAuth:', err);
            toast.error('Login successful, but failed to refresh session. Please refresh the page.');
          });
      }, 500);
    }
  }, [searchParams, setSearchParams, checkAuthStatus]);

  return (
    <div className="dashboard-page dashboard-page--cmd">
      <main className="dash-shell">
        {isSolanaWallet && (
          <div className="dashboard-solana-notice" role="status">
            Solana connected. Stats from API/OTA; swap and on-chain data use the selected chain (SOL in header).
          </div>
        )}

        {aggregate.refreshError ? (
          <p className="dashboard-refresh-hint" role="status">
            Refresh failed — showing last successful snapshot.
          </p>
        ) : null}

        <DashboardCommandStrip
          aggregate={aggregate}
          onRefresh={handleManualRefresh}
          refreshBusy={refreshBusy}
          pollRefreshing={aggregate.isRefreshing}
        />

        <div className="dash-stack dash-stack--primary">
          <DashboardWalletSnapshot
            loading={
              (aggregate.isInitialLoading ?? aggregate.loading) && aggregate.lastUpdatedAt == null
            }
            isRefreshing={aggregate.isRefreshing}
            dashboardUserId={userId}
            walletAddress={walletAddress}
            isWalletConnected={isConnected}
            network={network}
            chainId={chainId}
            walletType={walletType}
            nativeBalanceFormatted={ethBalance}
            nativeSymbol={nativeSymbol}
            bundle={aggregate}
            vaultAccountAligned={vaultAccountAligned}
          />
        </div>

        <section
          className="dash-region dash-region--brief dashboard-region-reveal dashboard-region-reveal--mid"
          aria-label="AI daily brief"
        >
          <header className="dash-brief__head">
            <h2 className="dash-brief__title">AI daily brief</h2>
            <p className="dash-brief__desc">
              Start here first: what needs attention now, then the operating state behind it.
            </p>
          </header>

          <DashboardAttentionBar aggregate={aggregate} />

          <DashboardPlatformStatusRow aggregate={aggregate} />

          <DashboardSystemStatusGrid aggregate={aggregate} />
        </section>

        <section
          className="dash-region dash-region--split dashboard-region-reveal dashboard-region-reveal--late"
          aria-label="Operational"
        >
          <div className="dash-split">
            <div className="dash-split__pane">
              <header className="dash-split__head">
                <h2 className="dash-split__title">Live activity</h2>
                <p className="dash-split__lede">Ledger — same refresh.</p>
              </header>
              <div className="dash-panel dash-panel--activity">
                <ErrorBoundary>
                  <Suspense fallback={<Skeleton variant="card" height={180} />}>
                    <RecentActivity userId={activityUserId} aggregate={activityPayload} embedInDashboard />
                  </Suspense>
                </ErrorBoundary>
              </div>
            </div>

            <aside className="dash-split__pane" aria-label="OTA context">
              <header className="dash-split__head">
                <h2 className="dash-split__title">AI context</h2>
                <p className="dash-split__lede">Recent signals, stats and short operating cues.</p>
              </header>
              <div className="dash-split__intel-stack">
                <DashboardInsights aggregate={aggregate} />
                <DashboardIntelMicroBand aggregate={aggregate} />
              </div>
            </aside>
          </div>
        </section>

        <DashboardBentoNav />
      </main>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;
