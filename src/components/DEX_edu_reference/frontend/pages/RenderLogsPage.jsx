/**
 * Backend (Render) logs: persisted Render errors, viewing, and export.
 * Backend must expose GET /api/admin/render-errors (see docs/RENDER_ERRORS_UI_AND_BACKEND_SPEC.md).
 * Unread errors are visually marked; row click or "Mark all read" marks them as read in localStorage.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { getRenderErrors, getRenderSuccesses, exportErrorsAsText, exportSuccessesAsText } from '../services/renderErrorsService';
import { RefreshCw, Download, FileText, AlertCircle, CheckCheck, CheckCircle2 } from 'lucide-react';
import OtaBscAutoStatusBanner from '../components/ai-trading/OtaBscAutoStatusBanner';
import '../styles/components/render-logs-page.css';

const STORAGE_KEY_READ_IDS = 'bits_render_logs_read';

function getRowKey(row) {
  if (row.id != null && row.id !== '') return String(row.id);
  return `${row.created_at || ''}|${(row.message || '').slice(0, 100)}`;
}

function loadReadIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_READ_IDS);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveReadIds(set) {
  try {
    localStorage.setItem(STORAGE_KEY_READ_IDS, JSON.stringify([...set]));
  } catch (_) {}
}

/** Extract common reasons from message/raw for short display. */
function getErrorReason(message, rawLine) {
  const text = [message, rawLine].filter(Boolean).join(' ');
  if (/Slippage exceeds limit|OTAPolicyManager.*[Ss]lippage/i.test(text)) return { code: 'SLIPPAGE_EXCEEDS_LIMIT', label: 'Slippage exceeds Policy limit', hint: 'Backend must cap slippage to Policy maxSlippageBps (max 1000 bps). When building executeTrade: effectiveSlippageBps = min(bufferBps, getPolicy(user).maxSlippageBps), then minOut from this slippage. See docs/OTA_SLIPPAGE_EXCEEDS_LIMIT_FIX.md.' };
  if (/LOW_SLIPPAGE_HINT|revert.*0x.*Policy=\d+\s*bps/i.test(text)) return { code: 'REVERT_0X_LOW_SLIPPAGE', label: 'Revert 0x - Policy slippage too low', hint: 'Policy Max Slippage is very low (for example 150 bps = 1.5%). Buffer is not applied; price moves between quote and tx, causing revert 0x. Increase OTA Auto → Policy to 500-1000 bps (5-10%).' };
  if (/POLICY_TOO_TIGHT_HINT|maxSlippageBps=\d+.*buffer interzis/i.test(text)) return { code: 'POLICY_TOO_TIGHT', label: 'Policy slippage too low for quote→tx delay', hint: 'At 150 bps (1.5%), the buffer is forbidden by Policy → Pancake INSUFFICIENT_OUTPUT_AMOUNT. Raise OTA Auto → Policy Max Slippage to 500-1000 bps (5-10%).' };
  if (/INSUFFICIENT_OUTPUT_AMOUNT/i.test(text)) return { code: 'INSUFFICIENT_OUTPUT_AMOUNT', label: 'Price moved (insufficient output)', hint: 'If Policy is already 500+ bps: increase OTA_AUTO_BUY_MINOUT_BUFFER_BPS (for example 500) on Render. If Policy is 150 bps: increase Policy to 500-1000 bps; otherwise the buffer cannot be applied.' };
  // Revert 0x when diagnostics show minDelay: contract blocks executions before minDelaySeconds elapses.
  if ((/revert 0x|UNPREDICTABLE_GAS_LIMIT/i.test(text) && /minDelaySeconds|lastExecution|lastTradeAt|minDelay not elapsed|contract minDelay/i.test(text))) return { code: 'REVERT_0X_MIN_DELAY', label: 'Revert 0x - contract minDelay cooldown', hint: 'The contract allows the next trade only after minDelaySeconds (for example 60s) from the last trade. Backend should read getPolicy(user).lastTradeAt and avoid executeTrade if block.timestamp - lastTradeAt < minDelaySeconds. Wait 1-2 minutes and retry.' };
  if (/UNPREDICTABLE_GAS_LIMIT/i.test(text)) return { code: 'UNPREDICTABLE_GAS_LIMIT', label: 'Gas estimate failed', hint: 'Check vault, allowlist, slippage, or simulate on BSCScan.' };
  if (/cannot estimate gas/i.test(text)) return { code: 'CANNOT_ESTIMATE_GAS', label: 'Gas estimate failed', hint: 'Check vault, allowlist, slippage, or simulate on BSCScan. It may also be a revert (insufficient balance, unsupported token).' };
  if (/execution reverted/i.test(text)) return { code: 'REVERT', label: 'Transaction reverted', hint: 'Check allowlist, vault balance, and PolicyManager.' };
  return null;
}

/** Format date for short display. */
function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'medium' });
  } catch {
    return String(iso).slice(0, 19);
  }
}

export default function RenderLogsPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [levelFilter, setLevelFilter] = useState('');
  const [readIds, setReadIds] = useState(() => loadReadIds());
  const [readFilter, setReadFilter] = useState('all'); // 'all' | 'unread' | 'read'
  const [viewMode, setViewMode] = useState('errors'); // 'errors' | 'successes'

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotConfigured(false);
    try {
      if (viewMode === 'successes') {
        const res = await getRenderSuccesses(undefined, { limit: 200 });
        if (res._notConfigured) {
          setNotConfigured(true);
          setItems([]);
          setTotal(0);
          return;
        }
        setItems(res.items || []);
        setTotal(res.total ?? res.items?.length ?? 0);
        return;
      }
      const res = await getRenderErrors(undefined, { limit: 200, level: levelFilter || undefined });
      if (res._notConfigured) {
        setNotConfigured(true);
        setItems([]);
        setTotal(0);
        return;
      }
      setItems(res.items || []);
      setTotal(res.total ?? res.items?.length ?? 0);
    } catch (e) {
      setError(e?.message || String(e));
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [levelFilter, viewMode]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const markAsRead = useCallback((key) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(key);
      saveReadIds(next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    const keys = items.map((row) => getRowKey(row));
    setReadIds((prev) => {
      const next = new Set([...prev, ...keys]);
      saveReadIds(next);
      return next;
    });
  }, [items]);

  const displayedItems = viewMode === 'successes'
    ? items
    : items.filter((row) => {
        const key = getRowKey(row);
        const isRead = readIds.has(key);
        if (readFilter === 'unread') return !isRead;
        if (readFilter === 'read') return isRead;
        return true;
      });
  const unreadCount = items.filter((row) => !readIds.has(getRowKey(row))).length;

  const onExport = () => {
    const text = viewMode === 'successes' ? exportSuccessesAsText(items) : exportErrorsAsText(items);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = viewMode === 'successes'
      ? `render-successes-${new Date().toISOString().slice(0, 10)}.txt`
      : `render-errors-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (notConfigured) {
    return (
      <div className="render-logs-page render-logs-page--not-configured">
        <h1 className="render-logs-page__title">
          <FileText size={24} aria-hidden /> Backend (Render) logs
        </h1>
        <div className="render-logs-page__message render-logs-page__message--info">
          <AlertCircle size={20} aria-hidden />
          <div>
            <p><strong>The endpoint is not configured yet.</strong></p>
            <p>Backend must expose <code>GET /api/admin/render-errors</code> and persist errors in the database table <code>render_errors</code>.</p>
            <p>See <code>docs/RENDER_ERRORS_UI_AND_BACKEND_SPEC.md</code> for implementation.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="render-logs-page">
      <header className="render-logs-page__header">
        <h1 className="render-logs-page__title">
          <FileText size={24} aria-hidden /> Backend (Render) logs
        </h1>
        <OtaBscAutoStatusBanner />
        <p className="render-logs-page__subtitle">
          {viewMode === 'successes'
            ? 'Successful OTA Auto transactions (execution_history): analysis next to errors, without manually opening BSCScan for each one.'
            : 'Errors saved from Render logs: repair them one by one without opening Render every day.'}
        </p>
        <div className="render-logs-page__tabs" role="tablist" aria-label="Logs view">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'errors'}
            className={`render-logs-page__tab ${viewMode === 'errors' ? 'render-logs-page__tab--active' : ''}`}
            onClick={() => setViewMode('errors')}
          >
            <AlertCircle size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} aria-hidden />
            Errors
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'successes'}
            className={`render-logs-page__tab render-logs-page__tab--success ${viewMode === 'successes' ? 'render-logs-page__tab--active' : ''}`}
            onClick={() => setViewMode('successes')}
          >
            <CheckCircle2 size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} aria-hidden />
            Successful trade
          </button>
        </div>
        <div className="render-logs-page__actions">
          {viewMode === 'errors' && (
            <>
              <select
                className="render-logs-page__filter"
                value={readFilter}
                onChange={(e) => setReadFilter(e.target.value)}
                aria-label="Filter read / unread"
              >
                <option value="all">All</option>
                <option value="unread">Unread ({unreadCount})</option>
                <option value="read">Read</option>
              </select>
              <select
                className="render-logs-page__filter"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                aria-label="Filter by level"
              >
                <option value="">All levels</option>
                <option value="error">error</option>
                <option value="warn">warn</option>
                <option value="info">info</option>
              </select>
            </>
          )}
          <button
            type="button"
            className="render-logs-page__btn render-logs-page__btn--refresh"
            onClick={fetchLogs}
            disabled={loading}
            aria-label="Refresh"
          >
            <RefreshCw size={18} /> {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            type="button"
            className="render-logs-page__btn render-logs-page__btn--mark-read"
            onClick={markAllAsRead}
            disabled={viewMode !== 'errors' || !items.length || unreadCount === 0}
            aria-label="Mark all read"
          >
            <CheckCheck size={18} /> Mark all read
          </button>
          <button
            type="button"
            className="render-logs-page__btn render-logs-page__btn--export"
            onClick={onExport}
            disabled={!items.length}
            aria-label="Export as text file"
          >
            <Download size={18} /> Export .txt
          </button>
        </div>
      </header>

      {error && (
        <div className="render-logs-page__message render-logs-page__message--error" role="alert">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {viewMode === 'successes' && (
        <div className="render-logs-page__rubric render-logs-page__rubric--success" role="region" aria-label="Successful trade">
          <CheckCircle2 size={22} className="render-logs-page__rubric-icon" aria-hidden />
          <div>
            <h2 className="render-logs-page__rubric-title">Successful trade</h2>
            <p className="render-logs-page__rubric-desc">OTA Auto executions confirmed on-chain: same flow as Trade, listed here for analysis.</p>
          </div>
        </div>
      )}

      <p className="render-logs-page__count">
        {viewMode === 'successes' ? (
          <>{total} records (displayed {displayedItems.length})</>
        ) : (
          <>{total} errors (displayed {displayedItems.length}{readFilter !== 'all' ? ` of ${items.length}` : ''}){unreadCount > 0 ? ` · ${unreadCount} unread` : ''}</>
        )}
      </p>

      <div className="render-logs-page__table-wrap" role="region" aria-label={viewMode === 'successes' ? 'Successful transactions list' : 'Errors list'}>
        <table className="render-logs-page__table">
          <thead>
            <tr>
              <th>Date / Time</th>
              <th>Level</th>
              <th>Message</th>
              <th>Path</th>
              <th>Request ID</th>
              <th aria-hidden></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="render-logs-page__empty">
                  {error ? '—' : viewMode === 'successes' ? 'No successful transaction in history, or the table is missing.' : 'No saved errors.'}
                </td>
              </tr>
            )}
            {displayedItems.length === 0 && items.length > 0 && !loading && (
              <tr>
                <td colSpan={6} className="render-logs-page__empty">
                  {readFilter === 'unread' ? 'No unread errors.' : readFilter === 'read' ? 'No errors marked as read.' : '—'}
                </td>
              </tr>
            )}
            {displayedItems.map((row) => {
              const rowKey = getRowKey(row);
              const isSuccess = viewMode === 'successes' || row.level === 'success';
              const isRead = readIds.has(rowKey);
              const isExpanded = expandedId === (row.id ?? row.created_at + row.message);
              const reason = isSuccess ? null : getErrorReason(row.message, row.raw_line);
              return (
                <React.Fragment key={rowKey}>
                  <tr
                    className={`render-logs-page__row ${row.level === 'error' ? 'render-logs-page__row--error' : ''} ${isSuccess ? 'render-logs-page__row--success' : ''} ${isExpanded ? 'render-logs-page__row--expanded' : ''} ${!isRead && !isSuccess ? 'render-logs-page__row--unread' : ''}`}
                    onClick={() => !isRead && !isSuccess && markAsRead(rowKey)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && !isRead) {
                        e.preventDefault();
                        markAsRead(rowKey);
                      }
                    }}
                    aria-label={isRead || isSuccess ? undefined : 'Click to mark as read'}
                  >
                    <td className="render-logs-page__cell render-logs-page__cell--time">
                      {formatDateTime(row.created_at)}
                    </td>
                    <td className="render-logs-page__cell render-logs-page__cell--level">
                      <span className={`render-logs-page__badge render-logs-page__badge--${row.level === 'success' ? 'success' : (row.level || 'info')}`}>
                        {row.level === 'success' ? 'ok' : (row.level || 'info')}
                      </span>
                    </td>
                    <td className="render-logs-page__cell render-logs-page__cell--message">
                      {row.tx_hash && (
                        <a
                          href={`https://bscscan.com/tx/${row.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="render-logs-page__tx-link"
                          onClick={(e) => e.stopPropagation()}
                        >
                          BSCScan
                        </a>
                      )}
                      {reason ? (
                        <>
                          <span className="render-logs-page__message-reason">{reason.label}</span>
                          {' · '}
                          {(row.message || row.raw_line || '—').slice(0, 80)}
                          {(row.message || row.raw_line || '').length > 80 ? '…' : ''}
                        </>
                      ) : isSuccess ? (
                        <>{row.message || row.raw_line || '—'}</>
                      ) : (
                        <>
                          {(row.message || row.raw_line || '—').slice(0, 120)}
                          {(row.message || row.raw_line || '').length > 120 ? '…' : ''}
                        </>
                      )}
                    </td>
                    <td className="render-logs-page__cell render-logs-page__cell--path">
                      {row.path || '—'}
                    </td>
                    <td className="render-logs-page__cell render-logs-page__cell--reqid">
                      {row.request_id ? String(row.request_id).slice(0, 8) + '…' : '—'}
                    </td>
                    <td className="render-logs-page__cell render-logs-page__cell--expand">
                      {(row.stack || row.raw_line) && (
                        <button
                          type="button"
                          className="render-logs-page__expand-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isRead) markAsRead(rowKey);
                            setExpandedId(isExpanded ? null : (row.id ?? row.created_at + row.message));
                          }}
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? 'Hide details' : 'Show stack / raw'}
                        >
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      )}
                      {!isRead && !isSuccess && (
                        <span className="render-logs-page__unread-dot" title="Unread" aria-hidden />
                      )}
                    </td>
                  </tr>
                  {isExpanded && (row.stack || row.raw_line) && (
                    <tr className="render-logs-page__detail-row">
                      <td colSpan={6} className="render-logs-page__detail-cell">
                        <div className="render-logs-page__detail-panel">
                          {reason && (
                            <div className="render-logs-page__detail-reason">
                              <span className="render-logs-page__reason-badge" title={reason.code}>{reason.label}</span>
                              {reason.hint && <p className="render-logs-page__reason-hint">{reason.hint}</p>}
                            </div>
                          )}
                          <details className="render-logs-page__detail-raw" open={!reason}>
                            <summary className="render-logs-page__detail-raw-summary">
                              Technical details (raw)
                            </summary>
                            <div className="render-logs-page__detail-raw-content">
                              {row.raw_line && (
                                <pre className="render-logs-page__pre render-logs-page__pre--raw">{row.raw_line}</pre>
                              )}
                              {row.stack && (
                                <pre className="render-logs-page__pre render-logs-page__pre--stack">{row.stack}</pre>
                              )}
                            </div>
                          </details>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
