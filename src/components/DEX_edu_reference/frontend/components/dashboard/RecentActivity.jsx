/**
 * 📋 RecentActivity Component - Recent Activity/Trades
 * 
 * Component for displaying recent activity with real data:
 * - Recent trades (from API or blockchain)
 * - Transaction history (from API or blockchain)
 * - Status indicators
 * 
 * @module RecentActivity
 */

import React, { useMemo, useEffect, useCallback, useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Card, Badge, Table } from '../ui';
import EmptyState from '../common/EmptyState';
import { useExecution } from '../../hooks/useExecution';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { getOTAHistory } from '../../services/aiTradingApiService';
import {
  mapOtaHistoryToActivityRows,
  mapExecutionTradesToDashboardActivities,
  buildMixedDashboardLiveActivities,
  DASHBOARD_LIVE_ACTIVITY_MAX_VISIBLE,
  DASHBOARD_VALUE_UNAVAILABLE,
} from '../../utils/dashboardActivityMap';
import { formatLargeNumber, formatRelativeTime } from '../../utils/formatters';
import '../../styles/components/recent-activity.css';

/** Shorten long contract-style strings for table cells; full value stays in title. */
function formatActivityDetailLabel(raw) {
  if (raw == null) return '—';
  const s = String(raw).trim();
  if (!s) return '—';
  if (/^0x[a-fA-F0-9]{12,}$/.test(s)) return `${s.slice(0, 6)}…${s.slice(-4)}`;
  if (/^sei[a-z0-9]{20,}$/i.test(s)) return `${s.slice(0, 8)}…${s.slice(-4)}`;
  if (s.length > 24) return `${s.slice(0, 14)}…`;
  return s;
}

const RecentActivity = React.memo(({ userId, aggregate, embedInDashboard }) => {
  const useAgg = Boolean(aggregate);
  const [analysisHistoryFetched, setAnalysisHistoryFetched] = useState([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const {
    trades: execTrades,
    loading: execLoading,
    error: execError,
  } = useExecution(userId || null, {
    limit: 20,
    autoRefresh: !useAgg,
    refreshInterval: 15000,
    skip: useAgg,
  });

  const trades = useAgg ? aggregate.trades : execTrades;
  const initialLoading = useAgg
    ? aggregate.loading ?? aggregate.isInitialLoading ?? false
    : execLoading;
  const pollRefreshing = useAgg ? Boolean(aggregate.isRefreshing) : false;
  const error = useAgg ? aggregate.error : execError;
  const analysisHistory = useAgg
    ? (aggregate.analysisHistory || [])
    : analysisHistoryFetched;

  const { handleError } = useErrorHandler();

  // Load OTA analysis history only when not using Dashboard aggregation.
  useEffect(() => {
    if (useAgg) {
      setAnalysisHistoryFetched([]);
      return undefined;
    }
    let cancelled = false;

    const loadHistory = async () => {
      if (!userId) {
        setAnalysisHistoryFetched([]);
        return;
      }
      try {
        setAnalysisLoading(true);
        const res = await getOTAHistory(userId, { limit: 20, offset: 0 });
        const mapped = mapOtaHistoryToActivityRows(res);
        if (!cancelled) setAnalysisHistoryFetched(mapped);
      } catch (e) {
        if (!cancelled) setAnalysisHistoryFetched([]);
      } finally {
        if (!cancelled) setAnalysisLoading(false);
      }
    };

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [userId, useAgg]);

  // Show toast notification for errors, not during background refresh while preserving the snapshot.
  useEffect(() => {
    if (error && !initialLoading && !pollRefreshing) {
      handleError(error, {
        title: 'Failed to Load Recent Activity',
        showToast: true,
      });
    }
  }, [error, initialLoading, pollRefreshing, handleError]);

  // Executions first (pool sorted desc), then OTA signals; avoids one global sort + slice(8) starving executions.
  const { rows: liveRows, stats: liveActivityStats } = useMemo(() => {
    const tradeActivities = mapExecutionTradesToDashboardActivities(trades || []);
    return buildMixedDashboardLiveActivities({
      executionRows: tradeActivities,
      signalRows: analysisHistory || [],
      maxVisible: DASHBOARD_LIVE_ACTIVITY_MAX_VISIBLE,
    });
  }, [trades, analysisHistory]);

  // 🛑 IMPORTANT: All hooks must be declared before any conditional returns.
  const getActivityIcon = useCallback((type, signal) => {
    if (type === 'analysis') {
      // For analysis, use signal type
      switch (signal) {
        case 'buy':
          return <Sparkles size={16} className="activity-icon analysis-buy" />;
        case 'sell':
          return <Sparkles size={16} className="activity-icon analysis-sell" />;
        default:
          return <Sparkles size={16} className="activity-icon analysis-hold" />;
      }
    }
    switch (type) {
      case 'buy':
        return <ArrowUpRight size={16} className="activity-icon buy" />;
      case 'sell':
        return <ArrowDownRight size={16} className="activity-icon sell" />;
      case 'swap':
        return <ArrowLeftRight size={16} className="activity-icon swap" />;
      case 'deposit':
        return <ArrowDownCircle size={16} className="activity-icon deposit" />;
      case 'withdraw':
        return <ArrowUpCircle size={16} className="activity-icon withdraw" />;
      default:
        return <Clock size={16} className="activity-icon" />;
    }
  }, []);

  /** Safe modifier for CSS classes, without hardcoded inline colors. */
  const getActivityTypeModifier = useCallback((type, signal) => {
    if (type === 'analysis') {
      const s = String(signal || 'hold').toLowerCase();
      if (s === 'buy' || s === 'sell') return `analysis-${s}`;
      return 'analysis-hold';
    }
    const t = String(type || 'other').toLowerCase();
    if (['buy', 'sell', 'swap', 'deposit', 'withdraw'].includes(t)) return `exec-${t}`;
    return 'exec-other';
  }, []);

  const formatCurrencyValue = useCallback((num, decimals = 2) => {
    return `$${formatLargeNumber(num, decimals)}`;
  }, []);

  const cardClass =
    'recent-activity-container recent-activity-container--dash' +
    (embedInDashboard ? ' recent-activity-container--embed-dash' : '');

  if (initialLoading) {
    return (
      <Card className={cardClass} padding={embedInDashboard ? 'sm' : 'md'}>
        {!embedInDashboard ? (
          <Card.Header>
            <Card.Title>Live activity</Card.Title>
          </Card.Header>
        ) : null}
        <Card.Body>
          <div className="recent-activity-skeleton" aria-busy="true" aria-label="Loading activity">
            {[1, 2, 3, 4, 5, 6].map((k) => (
              <div key={k} className="recent-activity-skeleton-row">
                <span className="recent-activity-skeleton-cell recent-activity-skeleton-cell--sm" />
                <span className="recent-activity-skeleton-cell recent-activity-skeleton-cell--lg" />
                <span className="recent-activity-skeleton-cell recent-activity-skeleton-cell--md" />
                <span className="recent-activity-skeleton-cell recent-activity-skeleton-cell--sm" />
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    );
  }

  if (error && liveRows.length === 0) {
    return (
      <Card className={cardClass} padding={embedInDashboard ? 'sm' : 'md'}>
        {!embedInDashboard ? (
          <Card.Header>
            <Card.Title>Live activity</Card.Title>
          </Card.Header>
        ) : null}
        <Card.Body>
          <EmptyState
            icon="alert"
            title="Unable to load activity"
            message={error || 'No activity data available yet.'}
          />
        </Card.Body>
      </Card>
    );
  }

  if (liveRows.length === 0) {
    return (
      <Card className={cardClass} padding={embedInDashboard ? 'sm' : 'md'}>
        {!embedInDashboard ? (
          <Card.Header>
            <Card.Title>Live activity</Card.Title>
          </Card.Header>
        ) : null}
        <Card.Body>
          <EmptyState
            icon="inbox"
            title="No Recent Activity"
            message="Activity will appear here after trades are executed."
          />
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card
      className={`${cardClass}${pollRefreshing ? ' recent-activity-container--poll-refresh' : ''}`}
      padding={embedInDashboard ? 'sm' : 'md'}
    >
      {!embedInDashboard ? (
        <Card.Header>
          <Card.Title>Live activity</Card.Title>
          <Badge variant="default" size="sm">
            {liveRows.length} shown · {liveActivityStats.executionShown} exec · {liveActivityStats.signalShown} OTA
            {pollRefreshing ? (
              <span className="recent-activity-refreshing-badge" title="Refreshing data in background">
                {' '}
                <Loader2 size={12} className="recent-activity-refreshing-icon" aria-hidden />
                Updating
              </span>
            ) : null}
          </Badge>
        </Card.Header>
      ) : null}

      <Card.Body>
        {embedInDashboard ? (
          <div className="recent-activity-embed-meta recent-activity-embed-meta--dashboard" aria-live="polite">
            <span className="recent-activity-embed-count">
              {liveActivityStats.executionShown} exec · {liveActivityStats.signalShown} OTA
            </span>
            {pollRefreshing ? (
              <span className="recent-activity-refresh-pip" aria-label="Updating" title="Updating">
                <Loader2 size={11} className="recent-activity-refreshing-icon" aria-hidden />
              </span>
            ) : null}
          </div>
        ) : null}
        <div className="recent-activity-table-wrapper">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Type</Table.Head>
                <Table.Head>Details</Table.Head>
                <Table.Head align="right">Amount</Table.Head>
                <Table.Head align="right">Value</Table.Head>
                <Table.Head align="center">Status</Table.Head>
                <Table.Head align="right">Time</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {liveRows.map((activity) => (
                <Table.Row
                  key={`${activity.activitySource || 'row'}-${activity.id}`}
                  className={`recent-activity-item ${activity.type === 'analysis' ? 'activity-analysis' : 'activity-execution'}`}
                >
                  <Table.Cell>
                    <div
                      className={`activity-icon-wrapper activity-type-stack activity-type-stack--${getActivityTypeModifier(
                        activity.type,
                        activity.signal
                      )}`}
                    >
                      {getActivityIcon(activity.type, activity.signal)}
                      <span className="activity-type-text">
                        {activity.type === 'analysis'
                          ? `${String(activity.signal || 'hold').toUpperCase()} · AI`
                          : String(activity.type).toUpperCase()}
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="activity-details">
                      <span className="activity-token" title={String(activity.token ?? '')}>
                        {formatActivityDetailLabel(activity.token)}
                      </span>
                      {activity.type === 'analysis' && activity.confidence !== undefined && (
                        <span className="activity-confidence" style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.7 }} title="Heuristic decision score; not a calibrated probability.">
                          {Math.round((activity.confidence || 0) * 100)}% score
                        </span>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell align="right">
                    {activity.type === 'analysis' ? (
                      <span className="activity-amount" style={{ fontStyle: 'italic', opacity: 0.7 }} title="OTA signal (rule-based + LLM). Not calibrated analysis.">Signal</span>
                    ) : (
                      <span
                        className={`activity-amount${activity.amountStatus === 'unavailable' ? ' activity-amount--ledger-muted' : ''}`}
                        title={
                          activity.amountStatus === 'unavailable'
                            ? 'Amount could not be normalized from API (raw units / decimals).'
                            : String(activity.amountLabel || '')
                        }
                      >
                        {activity.amountLabel}
                      </span>
                    )}
                  </Table.Cell>
                  <Table.Cell align="right">
                    {activity.type === 'analysis' ? (
                      <span className="activity-value" style={{ fontStyle: 'italic', opacity: 0.7 }}>-</span>
                    ) : (
                      <div className="activity-value-stack">
                        <span
                          className={`activity-value${
                            activity.valueStatus === 'unavailable' ||
                            activity.valueUsd == null ||
                            !Number.isFinite(activity.valueUsd)
                              ? ' activity-value--ledger-muted'
                              : ' activity-value--usd-valid'
                          }`}
                          title={
                            activity.valueStatus === 'unavailable'
                              ? 'No trustworthy USD: missing stable quote leg or verifiable total from API.'
                              : 'USD estimate from API or stable leg (1 USDT ≈ 1 USD).'
                          }
                        >
                          {activity.valueUsd != null && Number.isFinite(activity.valueUsd)
                            ? formatCurrencyValue(activity.valueUsd)
                            : DASHBOARD_VALUE_UNAVAILABLE}
                        </span>
                        {activity.dataBadge ? (
                          <Badge variant="default" size="sm" className="activity-data-badge">
                            {activity.dataBadge}
                          </Badge>
                        ) : null}
                      </div>
                    )}
                  </Table.Cell>
                  <Table.Cell align="center">
                    {activity.type === 'analysis' ? (
                      <Badge variant="default" size="sm">OTA</Badge>
                    ) : (
                      <Badge variant={activity.status === 'completed' ? 'success' : activity.status === 'pending' ? 'warning' : 'error'} size="sm">
                        {activity.status}
                      </Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell align="right">
                    <span className="activity-time">{formatRelativeTime(activity.timestamp)}</span>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      </Card.Body>
    </Card>
  );
});

RecentActivity.displayName = 'RecentActivity';

export default RecentActivity;
