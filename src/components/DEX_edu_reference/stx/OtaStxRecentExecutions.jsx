/**
 * Recent STX-related rows from ota.execution_history (and merged sources), filtered by chain=stx.
 * Not "open orders": STX has no sei_open_positions-style queue in this product.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useDexAuth } from '../frontend/context/DexAuthContext';
import { getTrades } from '../frontend/services/executionApiService';
import { stxNetwork } from './stxConfig';
import '../frontend/styles/components/ota-sei-open-orders.css';

function txUrl(hash) {
  if (!hash) return null;
  const base = stxNetwork?.blockExplorer || 'https://explorer.stacks.co';
  const clean = base.replace(/\/$/, '');
  return `${clean}/txid/${hash}`;
}

export default function OtaStxRecentExecutions() {
  const { user } = useDexAuth();
  const userId = user?.id ?? user?.walletAddress ?? null;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setError(null);
    setLoading(true);
    try {
      const res = await getTrades(userId, { chain: 'stx', limit: 20 });
      const list = Array.isArray(res?.trades) ? res.trades : Array.isArray(res?.data?.trades) ? res.data.trades : [];
      setRows(list);
    } catch (e) {
      setError(e?.message || 'Failed to load activity');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) load();
    else setRows([]);
  }, [userId, load]);

  if (!userId) {
    return (
      <section className="ota-sei-open-orders ota-sei-window ota-stx-open-orders" aria-labelledby="ota-stx-recent-title">
        <h3 id="ota-stx-recent-title" className="ota-sei-open-orders__title">Recent STX activity</h3>
        <p className="ota-sei-open-orders__empty">Sign in to see recorded executions (when present in backend).</p>
      </section>
    );
  }

  return (
    <section className="ota-sei-open-orders ota-sei-window ota-stx-open-orders" aria-labelledby="ota-stx-recent-title">
      <div className="ota-sei-open-orders__head">
        <div>
          <h3 id="ota-stx-recent-title" className="ota-sei-open-orders__title">Recent STX activity</h3>
          <p className="ota-sei-open-orders__hint" style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>
            From execution history when trades are recorded — not an on-chain “open orders” book (STX OTA has no pending
            queue like SEI open positions).
          </p>
        </div>
        <button type="button" onClick={load} disabled={loading} className="ota-sei-open-orders__refresh" aria-label="Refresh activity">
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      {error && <p className="ota-sei-open-orders__error" role="alert">{error}</p>}
      {!error && loading && rows.length === 0 && <p className="ota-sei-open-orders__empty">Loading…</p>}
      {!error && !loading && rows.length === 0 && (
        <p className="ota-sei-open-orders__empty">No STX executions in history yet. Completed swaps may appear here after the backend records them.</p>
      )}
      {!error && rows.length > 0 && (
        <div className="ota-sei-open-orders__wrap">
          <table className="ota-sei-open-orders__table">
            <thead>
              <tr>
                <th>Since</th>
                <th>Pair</th>
                <th>Amount</th>
                <th>Price</th>
                <th>Est. profit</th>
                <th>Status</th>
                <th>Source</th>
                <th>Tx</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const ts = t.timestamp ?? t.createdAt ?? t.executedAt;
                const sinceStr = ts ? new Date(ts).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '—';
                const pair = [t.tokenIn, t.tokenOut].filter(Boolean).join(' → ') || '—';
                const amount = t.amountIn ?? t.amountOut ?? t.amount ?? '—';
                const amountIn = t.amountIn != null ? Number(t.amountIn) : null;
                const amountOut = t.amountOut != null ? Number(t.amountOut) : null;
                const price = t.price != null && Number.isFinite(Number(t.price)) ? Number(t.price) : null;
                const profitUsd = t.profitUsd != null && Number.isFinite(Number(t.profitUsd)) ? Number(t.profitUsd) : null;
                const estProfit = profitUsd != null ? profitUsd : (amountIn != null && amountOut != null ? amountOut - amountIn : null);
                const status = t.status ?? '—';
                const source = t.source === 'ota_auto' ? 'Auto' : t.source ?? '—';
                const hash = t.txHash ?? null;
                const url = txUrl(hash);
                return (
                  <tr key={t.id ?? t._id ?? hash ?? sinceStr}>
                    <td>{sinceStr}</td>
                    <td>{pair}</td>
                    <td>{typeof amount === 'number' ? amount.toLocaleString(undefined, { maximumFractionDigits: 6 }) : String(amount)}</td>
                    <td>{price != null ? price.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—'}</td>
                    <td>
                      {estProfit != null ? (
                        <span className={estProfit >= 0 ? 'ota-sei-open-orders__profit--pos' : 'ota-sei-open-orders__profit--neg'}>
                          {profitUsd != null ? '$' : ''}{estProfit >= 0 ? '+' : ''}{Number(estProfit).toFixed(4)}
                        </span>
                      ) : '—'}
                    </td>
                    <td>{status}</td>
                    <td>{source}</td>
                    <td>
                      {hash && url ? (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="ota-sei-open-orders__link">
                          {hash.slice(0, 8)}… <ExternalLink size={10} aria-hidden />
                        </a>
                      ) : hash ? (
                        <span className="ota-sei-open-orders__hash">{hash.slice(0, 10)}…</span>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
