/**
 * OTA Activity Panel – fereastră sub Chart: worker status, PnL metrici, risc.
 * Cu buton expand/collapse ca să poată fi afișată singură.
 *
 * Conținut (propunere):
 * - Worker: lastRunAt, executions (24h), circuit breaker
 * - PnL: net PnL, win rate, trades count (perioadă)
 * - Risc: max drawdown
 * - Sursă: getAutoExecutionStatus, getMetrics, getRiskMetrics
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Activity, ChevronDown, ChevronUp, RefreshCw, AlertTriangle } from 'lucide-react';
import { useOTAAccess } from '../../hooks/useOTAAccess';
import { getAutoExecutionStatus } from '../../services/aiTradingApiService';
import { getMetrics, getRiskMetrics } from '../../services/performanceApiService';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import '../../styles/components/ota-activity-panel.css';

const OTAActivityPanel = ({ className = '', defaultExpanded = false }) => {
  const { walletAddress } = useOTAAccess();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [worker, setWorker] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    if (!walletAddress) {
      setWorker(null);
      setMetrics(null);
      setRisk(null);
      return;
    }
    setLoading(true);
    try {
      const [workerRes, metricsRes, riskRes] = await Promise.all([
        getAutoExecutionStatus(walletAddress).catch(() => null),
        getMetrics(walletAddress, { period: '30d' }).catch(() => null),
        getRiskMetrics(walletAddress, { period: '24h' }).catch(() => null)
      ]);
      setWorker(workerRes);
      setMetrics(metricsRes?.success ? metricsRes : null);
      setRisk(riskRes?.success ? riskRes : null);
    } catch (e) {
      setError(e?.message || 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (expanded) fetchAll();
  }, [expanded, fetchAll]);

  const hasData = worker != null || (metrics && (metrics.netPnl != null || metrics.winRate != null || metrics.tradesCount > 0)) || (risk && risk.riskMetrics);

  return (
    <section
      className={`ota-activity-panel ${className}`}
      aria-label="OTA Activity and metrics"
    >
      <button
        type="button"
        className="ota-activity-panel-toggle"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-controls="ota-activity-panel-body"
      >
        <Activity size={18} className="ota-activity-panel-toggle-icon" aria-hidden />
        <span className="ota-activity-panel-toggle-label">Activity &amp; metrics</span>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {expanded && (
        <div id="ota-activity-panel-body" className="ota-activity-panel-body">
          {loading && !hasData && (
            <p className="ota-activity-panel-loading">Loading…</p>
          )}
          {error && (
            <p className="ota-activity-panel-error" role="alert">
              <AlertTriangle size={14} /> {error}
            </p>
          )}
          {!loading && hasData && (
            <>
              <div className="ota-activity-panel-grid">
                {/* Worker */}
                <div className="ota-activity-panel-block">
                  <h5 className="ota-activity-panel-block-title">Worker</h5>
                  {worker ? (
                    <ul className="ota-activity-panel-list">
                      <li>
                        <span className="ota-activity-panel-label">Status</span>
                        <span className="ota-activity-panel-value">{worker.enabled ? 'Enabled' : 'Disabled'}</span>
                      </li>
                      {worker.lastRunAt != null && (
                        <li>
                          <span className="ota-activity-panel-label">Last run</span>
                          <span className="ota-activity-panel-value">
                            {new Date(worker.lastRunAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </li>
                      )}
                      {typeof worker.executionsCount24h === 'number' && (
                        <li>
                          <span className="ota-activity-panel-label">Executions (24h)</span>
                          <span className="ota-activity-panel-value">{worker.executionsCount24h}</span>
                        </li>
                      )}
                      {worker.circuitBreaker && (worker.circuitBreaker.consecutiveFailures > 0 || worker.circuitBreaker.openUntil) && (
                        <li>
                          <span className="ota-activity-panel-label">Circuit breaker</span>
                          <span className="ota-activity-panel-value ota-activity-panel-value-warn">
                            {worker.circuitBreaker.consecutiveFailures > 0 && `${worker.circuitBreaker.consecutiveFailures} failures`}
                            {worker.circuitBreaker.openUntil && ` until ${new Date(worker.circuitBreaker.openUntil).toLocaleTimeString()}`}
                          </span>
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="ota-activity-panel-muted">Worker status unavailable</p>
                  )}
                </div>

                {/* PnL */}
                <div className="ota-activity-panel-block">
                  <h5 className="ota-activity-panel-block-title">PnL (30d)</h5>
                  {metrics && (metrics.netPnl != null || metrics.winRate != null || (metrics.tradesCount != null && metrics.tradesCount > 0)) ? (
                    <ul className="ota-activity-panel-list">
                      {metrics.netPnl != null && (
                        <li>
                          <span className="ota-activity-panel-label">Net PnL</span>
                          <span className={`ota-activity-panel-value ${metrics.netPnl >= 0 ? 'ota-activity-panel-value-profit' : 'ota-activity-panel-value-loss'}`}>
                            {formatNumber(metrics.netPnl)} USD
                          </span>
                        </li>
                      )}
                      {metrics.winRate != null && (
                        <li>
                          <span className="ota-activity-panel-label">Win rate</span>
                          <span className="ota-activity-panel-value">{formatPercentage(metrics.winRate * 100)}</span>
                        </li>
                      )}
                      {metrics.tradesCount != null && metrics.tradesCount > 0 && (
                        <li>
                          <span className="ota-activity-panel-label">Trades</span>
                          <span className="ota-activity-panel-value">{metrics.tradesCount}</span>
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="ota-activity-panel-muted">No metrics yet</p>
                  )}
                </div>

                {/* Risk */}
                <div className="ota-activity-panel-block">
                  <h5 className="ota-activity-panel-block-title">Risk</h5>
                  {risk?.riskMetrics && (risk.riskMetrics.maxDrawdown != null || risk.riskMetrics.winRate != null || risk.riskMetrics.tradesCount24h != null) ? (
                    <ul className="ota-activity-panel-list">
                      {risk.riskMetrics.maxDrawdown != null && (
                        <li>
                          <span className="ota-activity-panel-label">Max drawdown</span>
                          <span className="ota-activity-panel-value">{formatPercentage(risk.riskMetrics.maxDrawdown * 100)}</span>
                        </li>
                      )}
                      {risk.riskMetrics.tradesCount24h != null && (
                        <li>
                          <span className="ota-activity-panel-label">Trades (24h)</span>
                          <span className="ota-activity-panel-value">{risk.riskMetrics.tradesCount24h}</span>
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="ota-activity-panel-muted">No risk data yet</p>
                  )}
                </div>
              </div>
              <div className="ota-activity-panel-actions">
                <button type="button" className="ota-activity-panel-refresh" onClick={fetchAll} disabled={loading} aria-label="Refresh">
                  <RefreshCw size={14} className={loading ? 'ota-activity-panel-spin' : ''} /> Refresh
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};

export default OTAActivityPanel;
