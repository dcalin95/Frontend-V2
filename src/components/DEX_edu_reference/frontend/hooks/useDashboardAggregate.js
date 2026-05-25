/**
 * Agregare unică pentru Dashboard: execuții, semnale, OTA history/stats, quota, auto, performanță, health.
 * Cheie API: **adresa wallet** pentru majoritatea endpoint-urilor (vault, analytics, performance, OTA list).
 * `user.id` cont (non-adresă) nu se trimite la aceste API-uri — vezi `resolveWalletBackedApiUserId`.
 *
 * Stale-while-revalidate: la poll/manual refresh datele anterioare rămân vizibile; `isInitialLoading` e true
 * doar până la primul răspuns reușit pentru sesiunea curentă (wallet + user).
 *
 * @module useDashboardAggregate
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getTrades } from '../services/executionApiService';
import { getMetrics, getProfitSummary } from '../services/performanceApiService';
import { getSignals, getSignalPerformance } from '../services/signalApiService';
import {
  getOTAHistory,
  getOTAStats,
  getAutoExecutionStatus,
  getOTAQuota,
  getLastSignal,
  getOTAHealth,
} from '../services/aiTradingApiService';
import { getLiveStatus, getOpenShorts } from '../services/otaShortOpsService';
import {
  getOpenPositionsAnalytics,
  getVaultBalanceComparison,
  getPortfolioSummary as getAnalyticsPortfolioSummary,
} from '../services/analyticsApiService';
import { getDemoStatus, getDemoAccount } from '../services/leverageDemoApiService';
import { mapOtaHistoryToActivityRows } from '../utils/dashboardActivityMap';
import { resolveWalletBackedApiUserId } from '../utils/resolveWalletBackedApiUserId';
import { logDashboardPipeline } from '../utils/dashboardPipelineDebug';

const REFRESH_MS = 45000;

const EMPTY_BUNDLE = {
  trades: [],
  tradesTotal: 0,
  signals: [],
  signalsToday: 0,
  signalPerformance: null,
  autoStatus: null,
  otaStats: null,
  otaQuota: null,
  lastSignal: null,
  otaHealth: null,
  metrics: null,
  profitSummary: null,
  analysisHistory: [],
  futuresLiveStatus: null,
  futuresOpenShorts: null,
  otaTrackedPositions: null,
  vaultBalanceComparison: null,
  leverageDemoStatus: null,
  leverageDemoAccount: null,
  portfolioAnalytics: null,
};

async function safe(fn, fallback) {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

function signalTimeMs(signal) {
  if (!signal || typeof signal !== 'object') return 0;
  const raw =
    signal.createdAt ||
    signal.created_at ||
    signal.timestamp ||
    signal.analyzedAt ||
    signal.analysisAt ||
    signal.lastAnalysisAt ||
    signal.executedAt ||
    signal.updatedAt ||
    signal.updated_at;
  const ms = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(ms) ? ms : 0;
}

function normalizeLastSignalFromFeed(signal) {
  if (!signal || typeof signal !== 'object') return null;
  const token = signal.token || signal.symbol || signal.baseToken || signal.base || null;
  const side = signal.side || signal.signal || signal.action || null;
  if (!token && !side) return null;
  return {
    ...signal,
    token,
    side,
    signal: signal.signal || side,
    executedAt:
      signal.executedAt ||
      signal.createdAt ||
      signal.created_at ||
      signal.timestamp ||
      signal.analyzedAt ||
      signal.analysisAt ||
      null,
  };
}

function pickLatestSignalFromFeed(signals) {
  if (!Array.isArray(signals) || signals.length === 0) return null;
  const [latest] = signals
    .map((signal, index) => ({ signal, index, timeMs: signalTimeMs(signal) }))
    .sort((a, b) => {
      if (a.timeMs !== b.timeMs) return b.timeMs - a.timeMs;
      return a.index - b.index;
    });
  return normalizeLastSignalFromFeed(latest?.signal);
}

/**
 * @param {string|null|undefined} routeUserId - din rută / auth (poate fi id cont sau adresă)
 * @param {{ walletAddress?: string|null, walletType?: string|null }} [options]
 */
export function useDashboardAggregate(routeUserId, options = {}) {
  const { walletAddress = null, walletType = null } = options;

  const [isInitialLoading, setIsInitialLoading] = useState(() => !!(routeUserId || walletAddress));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [refreshError, setRefreshError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const mounted = useRef(true);

  const [bundle, setBundle] = useState(() => ({
    ...EMPTY_BUNDLE,
    aggregateMeta: null,
  }));

  /** După primul `setBundle` reușit pentru cheia curentă, poll-urile nu mai folosesc skeleton global. */
  const sessionKeyRef = useRef('');
  const initialLoadDoneForSessionRef = useRef(false);

  const load = useCallback(async () => {
    const { apiUserId, keySource } = resolveWalletBackedApiUserId({
      connectedWalletAddress: walletAddress,
      fallbackUserId: routeUserId,
      walletType,
    });

    if (!apiUserId) {
      if (!mounted.current) return;
      sessionKeyRef.current = '';
      initialLoadDoneForSessionRef.current = false;
      setIsInitialLoading(false);
      setIsRefreshing(false);
      setError(null);
      setRefreshError(null);
      setBundle({
        ...EMPTY_BUNDLE,
        aggregateMeta: {
          apiUserId: null,
          keySource: 'none',
          routeUserId: routeUserId != null && routeUserId !== '' ? String(routeUserId) : null,
          reason: 'no_wallet_backed_key',
        },
      });
      logDashboardPipeline('skip: no apiUserId', {
        routeUserId,
        hasConnectedWallet: Boolean(walletAddress && String(walletAddress).trim()),
      });
      return;
    }

    const sessionKey = `${String(apiUserId).toLowerCase()}|${String(walletAddress ?? '').toLowerCase()}|${String(
      walletType ?? ''
    )}`;
    if (sessionKeyRef.current !== sessionKey) {
      sessionKeyRef.current = sessionKey;
      initialLoadDoneForSessionRef.current = false;
      setLastUpdatedAt(null);
    }

    const backgroundRefresh = initialLoadDoneForSessionRef.current;

    if (backgroundRefresh) {
      setIsRefreshing(true);
      setRefreshError(null);
    } else {
      setIsInitialLoading(true);
      setError(null);
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    try {
      const [
        tradesRes,
        signalsRes,
        perfRes,
        autoRes,
        historyRes,
        statsRes,
        quotaRes,
        lastSignalRes,
        healthRes,
        metricsRes,
        profitRes,
        futuresLiveRes,
        futuresOpenRes,
        otaTrackedRes,
        vaultCmpRes,
        levDemoStatusRes,
        levDemoAccRes,
        portfolioSummaryRes,
      ] = await Promise.all([
        safe(() => getTrades(apiUserId, { limit: 50, offset: 0 }), { trades: [], total: 0 }),
        safe(() => getSignals(apiUserId, { limit: 40, offset: 0 }), { signals: [] }),
        safe(() => getSignalPerformance(apiUserId, { period: '30d' }), null),
        safe(() => getAutoExecutionStatus(apiUserId), null),
        safe(() => getOTAHistory(apiUserId, { limit: 25, offset: 0 }), {}),
        safe(() => getOTAStats(apiUserId), null),
        safe(() => getOTAQuota(apiUserId), null),
        safe(() => getLastSignal(apiUserId), { lastSignal: null }),
        safe(() => getOTAHealth(), null),
        safe(() => getMetrics(apiUserId, { period: '30d' }), null),
        safe(() => getProfitSummary(apiUserId), null),
        safe(() => getLiveStatus(), null),
        safe(() => getOpenShorts(apiUserId), null),
        safe(() => getOpenPositionsAnalytics(apiUserId), null),
        safe(() => getVaultBalanceComparison(apiUserId), null),
        safe(() => getDemoStatus(apiUserId), null),
        safe(() => getDemoAccount(apiUserId), null),
        safe(() => getAnalyticsPortfolioSummary(apiUserId), null),
      ]);

      logDashboardPipeline('raw.afterSafe', {
        apiUserId,
        keySource,
        tradesTotal: tradesRes?.total,
        signalsLen: Array.isArray(signalsRes?.signals) ? signalsRes.signals.length : null,
        metricsRes: metricsRes && typeof metricsRes === 'object' ? { ...metricsRes, metrics: metricsRes.metrics } : metricsRes,
        profitRes,
        vaultTokenCount: vaultCmpRes?.tokens?.length,
        vaultOnChain: vaultCmpRes?.onChainAvailable,
        otaPosSummary: otaTrackedRes?.summary,
        portfolioKeys: portfolioSummaryRes && typeof portfolioSummaryRes === 'object' ? Object.keys(portfolioSummaryRes) : null,
      });

      if (!mounted.current) return;

      const trades = tradesRes?.trades || tradesRes || [];
      const tradesTotal = tradesRes?.total ?? (Array.isArray(trades) ? trades.length : 0);
      const signals = Array.isArray(signalsRes?.signals) ? signalsRes.signals : [];
      const latestSignalFromFeed = pickLatestSignalFromFeed(signals);
      const signalsToday = signals.filter(
        (s) => new Date(s.createdAt || s.created_at || 0) >= todayStart
      ).length;
      const analysisHistory = mapOtaHistoryToActivityRows(historyRes);

      const metrics = metricsRes?.metrics ?? metricsRes ?? null;

      const portfolioAnalytics =
        portfolioSummaryRes && typeof portfolioSummaryRes === 'object' && portfolioSummaryRes.success !== false
          ? portfolioSummaryRes
          : null;

      const nextMeta = {
        apiUserId,
        keySource,
        routeUserId: routeUserId != null && routeUserId !== '' ? String(routeUserId) : null,
      };

      setBundle({
        trades: Array.isArray(trades) ? trades : [],
        tradesTotal: typeof tradesTotal === 'number' ? tradesTotal : trades.length,
        signals,
        signalsToday,
        signalPerformance: perfRes,
        autoStatus: autoRes,
        otaStats: statsRes,
        otaQuota: quotaRes,
        lastSignal: latestSignalFromFeed ?? lastSignalRes?.lastSignal ?? null,
        otaHealth: healthRes,
        metrics,
        profitSummary: profitRes,
        analysisHistory,
        futuresLiveStatus: futuresLiveRes,
        futuresOpenShorts: futuresOpenRes,
        otaTrackedPositions: otaTrackedRes,
        vaultBalanceComparison: vaultCmpRes,
        leverageDemoStatus: levDemoStatusRes,
        leverageDemoAccount:
          levDemoAccRes && typeof levDemoAccRes === 'object'
            ? levDemoAccRes.account ?? levDemoAccRes
            : null,
        portfolioAnalytics,
        aggregateMeta: nextMeta,
      });

      initialLoadDoneForSessionRef.current = true;
      setLastUpdatedAt(Date.now());
      setRefreshError(null);
      setError(null);

      logDashboardPipeline('bundle.set', {
        aggregateMeta: nextMeta,
        mappedMetricsNet: metrics && typeof metrics === 'object' ? metrics.netProfit : undefined,
        profitSummaryTotal: profitRes?.totalProfitUsd,
        vaultTokensN: vaultCmpRes?.tokens?.length,
      });
    } catch (e) {
      const msg = e?.message || 'Request failed';
      if (initialLoadDoneForSessionRef.current) {
        setRefreshError(msg);
      } else {
        setError(msg);
      }
    } finally {
      if (mounted.current) {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [routeUserId, walletAddress, walletType]);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  useEffect(() => {
    const { apiUserId } = resolveWalletBackedApiUserId({
      connectedWalletAddress: walletAddress,
      fallbackUserId: routeUserId,
      walletType,
    });
    if (!apiUserId) return undefined;
    const id = setInterval(() => load(), REFRESH_MS);
    return () => clearInterval(id);
  }, [routeUserId, walletAddress, walletType, load]);

  const refresh = useCallback(() => load(), [load]);

  return {
    ...bundle,
    /** @deprecated Folosiți `isInitialLoading` — alias pentru compatibilitate (doar primul load). */
    loading: isInitialLoading,
    isInitialLoading,
    isRefreshing,
    refreshError,
    lastUpdatedAt,
    /** Primul snapshot reușit în sesiunea curentă (wallet/api) — pentru UI: fără skeleton după primul paint reușit). */
    hasLoadedSnapshot: lastUpdatedAt != null,
    error,
    refresh,
    apiUserId: bundle.aggregateMeta?.apiUserId ?? null,
    aggregateMeta: bundle.aggregateMeta,
  };
}
