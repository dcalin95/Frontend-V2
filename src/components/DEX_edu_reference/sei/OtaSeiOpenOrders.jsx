/**
 * OtaSeiOpenOrders – listă ordre deschise / în execuție pentru OTA SEI.
 * Apelează getTrades(userId, { chain: 'sei', status: 'pending' }). Afișează sub Chart pe /dex-edu/ota/sei.
 * Close: swap SEI→USDC on-chain, then POST close. Positions from sei_open_positions (Open position).
 */

import React, { useCallback, useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useDexAuth } from '../frontend/context/DexAuthContext';
import { useSeiWallet } from './context/SeiWalletContext';
import { useOtaSeiPairOptional } from './context/OtaSeiPairContext';
import { getTrades } from '../frontend/services/executionApiService';
import { executeRoundTrip, closeSeiPosition } from './services/otaSeiMicroProfitService';
import { symbolToDenom, denomToSymbol, getTokenDecimals } from './seiTokenConfig';
import { seiNetwork } from './seiConfig';
import '../frontend/styles/components/ota-sei-open-orders.css';

function toMinimalUnits(amount, symbol) {
  const n = parseFloat(String(amount).replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return '0';
  const decimals = getTokenDecimals(symbol);
  return String(Math.floor(n * 10 ** decimals));
}

/** Convertește din minimal units în human (dacă val >= 10^decimals, altfel presupune deja human). */
function toHuman(amount, symbol) {
  if (amount == null) return null;
  const n = parseFloat(String(amount).replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  const decimals = getTokenDecimals(symbol);
  const cutoff = 10 ** decimals;
  if (n >= cutoff) return n / cutoff;
  return n;
}

function txUrl(hash) {
  if (!hash) return null;
  const base = seiNetwork?.blockExplorer || 'https://www.sei.explorers.guru';
  return base.endsWith('/') ? `${base}transaction/${hash}` : `${base}/transaction/${hash}`;
}

export default function OtaSeiOpenOrders() {
  const { user } = useDexAuth();
  const userId = user?.id ?? user?.walletAddress ?? null;
  const { address, getOfflineSigner } = useSeiWallet();
  const pairCtx = useOtaSeiPairOptional();
  /** Shared with Live strip / Live window (OtaSeiPairProvider). */
  const liveSeiPrice = pairCtx?.livePriceUsd ?? null;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [closingId, setClosingId] = useState(null);
  const [closeError, setCloseError] = useState(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setError(null);
    setLoading(true);
    try {
      const res = await getTrades(userId, { chain: 'sei', status: 'pending', limit: 50 });
      const list = Array.isArray(res?.trades) ? res.trades : Array.isArray(res?.data?.trades) ? res.data.trades : [];
      setOrders(list);
    } catch (e) {
      setError(e?.message || 'Failed to load open orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) load();
    else setOrders([]);
  }, [userId, load]);

  useEffect(() => {
    const onRefresh = () => load();
    window.addEventListener('ota-sei-open-orders-refresh', onRefresh);
    return () => window.removeEventListener('ota-sei-open-orders-refresh', onRefresh);
  }, [load]);

  const handleClose = useCallback(async (t) => {
    const positionId = t.positionId ?? (typeof t.id === 'string' && t.id.startsWith('sei-open-') ? parseInt(t.id.replace('sei-open-', ''), 10) : null);
    if (!positionId || !address || !userId) return;
    const amountSeiRaw = t.amountOut ?? t.amount ?? t.amountIn;
    const amountSeiHuman = toHuman(amountSeiRaw, 'SEI');
    if (!amountSeiHuman || amountSeiHuman <= 0) {
      setCloseError('No amount to close');
      return;
    }
    const signer = await getOfflineSigner();
    if (!signer) {
      setCloseError('Reconnect SEI wallet to close');
      return;
    }
    setCloseError(null);
    setClosingId(positionId);
    try {
      const amtSeiMinimal = toMinimalUnits(amountSeiHuman, 'SEI');
      // tokenIn for close = tokenOut of open (SEI); tokenOut for close = tokenIn of open (USDC/USDT)
      const tokenInClose = t.tokenOut ?? symbolToDenom('SEI');
      const tokenOutClose = t.tokenIn ?? symbolToDenom('USDC');
      const result = await executeRoundTrip({
        userAddress: address,
        tokenIn: tokenInClose,
        tokenOut: tokenOutClose,
        amountIn: amtSeiMinimal,
        signer,
        userId,
      });
      if (!result?.success) {
        setCloseError(result?.error || 'Swap failed');
        return;
      }
      await closeSeiPosition(positionId, { userId, txHash: result.txHash });
      await load();
    } catch (e) {
      setCloseError(e?.message || 'Failed to close');
    } finally {
      setClosingId(null);
    }
  }, [address, userId, getOfflineSigner, load]);

  if (!userId) {
    return (
      <section className="ota-sei-open-orders ota-sei-window" aria-labelledby="ota-sei-open-orders-title">
        <h3 id="ota-sei-open-orders-title" className="ota-sei-open-orders__title">Open Orders</h3>
        <p className="ota-sei-open-orders__empty">Sign in to see open orders.</p>
      </section>
    );
  }

  return (
    <section className="ota-sei-open-orders ota-sei-window" aria-labelledby="ota-sei-open-orders-title">
      <div className="ota-sei-open-orders__head">
        <h3 id="ota-sei-open-orders-title" className="ota-sei-open-orders__title">Open Orders</h3>
        <button type="button" onClick={load} disabled={loading} className="ota-sei-open-orders__refresh" aria-label="Refresh open orders">
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
        </div>
      {userId && (
        <p className="ota-sei-open-orders__trace-hint" role="note">
          Manual opens are stored in <code className="ota-sei-open-orders__code">ota.sei_open_positions</code> (shown here as pending). Automated bot fills on SEI appear in <strong>execution history</strong> with source Auto — same API merges both for this list when filtering by chain.
        </p>
      )}
      {error && <p className="ota-sei-open-orders__error" role="alert">{error}</p>}
      {!error && loading && orders.length === 0 && <p className="ota-sei-open-orders__empty">Loading…</p>}
      {!error && !loading && orders.length === 0 && (
        <p className="ota-sei-open-orders__empty">No open orders. Use &quot;Open position&quot; in the panel to buy SEI with USDC; the position will appear here. When Est. profit turns green, click Close to lock in. Completed executions appear in SEI execution history.</p>
      )}
      {closeError && <p className="ota-sei-open-orders__error" role="alert">{closeError}</p>}
      {!error && orders.length > 0 && (
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((t) => {
                const ts = t.timestamp ?? t.createdAt ?? t.executedAt;
                const sinceStr = ts ? new Date(ts).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '—';
                const tokIn = denomToSymbol(t.tokenIn) || t.tokenIn;
                const tokOut = denomToSymbol(t.tokenOut) || t.tokenOut;
                const pair = [tokIn, tokOut].filter(Boolean).join(' → ') || '—';
                const positionId = t.positionId ?? (typeof t.id === 'string' && t.id.startsWith('sei-open-') ? parseInt(t.id.replace('sei-open-', ''), 10) : null);
                const isSeiOpen = !!positionId;
                // Converti la human: amountIn e minimal (ex. 1_000_000), amountOut poate fi human (14.5)
                const amountInHuman = toHuman(t.amountIn, tokIn);
                const amountOutHuman = toHuman(t.amountOut, tokOut);
                const amountDisplay = (isSeiOpen && (amountInHuman != null || amountOutHuman != null))
                  ? [amountInHuman != null ? `${Number(amountInHuman).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${tokIn}` : null, amountOutHuman != null ? `${Number(amountOutHuman).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${tokOut}` : null].filter(Boolean).join(' → ') || '—'
                  : (t.amountIn ?? t.amountOut ?? t.amount ?? '—');
                let priceDisplay = null;
                if (isSeiOpen && amountInHuman != null && amountOutHuman != null && amountOutHuman !== 0) {
                  priceDisplay = amountInHuman / amountOutHuman; // USDC per SEI (backend poate returna price: 0)
                } else if (t.price != null && Number.isFinite(Number(t.price)) && Number(t.price) !== 0) {
                  priceDisplay = Number(t.price);
                }
                const profitUsd = t.profitUsd != null && Number.isFinite(Number(t.profitUsd)) ? Number(t.profitUsd) : null;
                // Pentru poziții deschise USDC→SEI: P&L live = (amountSEI × preț_SEI) - amountUSDC
                let estProfit = profitUsd;
                if (estProfit == null && isSeiOpen && tokOut === 'SEI' && amountInHuman != null && amountOutHuman != null && liveSeiPrice != null) {
                  estProfit = (amountOutHuman * liveSeiPrice) - amountInHuman;
                } else if (estProfit == null && !isSeiOpen && amountInHuman != null && amountOutHuman != null) {
                  estProfit = amountOutHuman - amountInHuman;
                }
                const status = t.status ?? 'pending';
                const source = t.source === 'ota_auto' ? 'Auto' : t.source ?? '—';
                const hash = t.txHash ?? null;
                const url = txUrl(hash);
                const canClose = !!positionId && !!address;
                const isClosing = closingId === positionId;
                const isProfitable = estProfit != null && estProfit > 0;
                return (
                  <tr key={t.id ?? t._id ?? hash ?? sinceStr} className={isProfitable ? 'ota-sei-open-orders__row--profitable' : undefined}>
                    <td>{sinceStr}</td>
                    <td>{pair}</td>
                    <td>{typeof amountDisplay === 'number' ? amountDisplay.toLocaleString(undefined, { maximumFractionDigits: 6 }) : String(amountDisplay)}</td>
                    <td>{priceDisplay != null ? priceDisplay.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—'}</td>
                    <td>
                      {estProfit != null ? (
                        <span className={estProfit >= 0 ? 'ota-sei-open-orders__profit--pos' : 'ota-sei-open-orders__profit--neg'}>
                          ${estProfit >= 0 ? '+' : ''}{Number(estProfit).toFixed(4)}
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
                    <td>
                      {canClose && (
                        <button type="button" onClick={() => handleClose(t)} disabled={isClosing} className={`ota-sei-open-orders__btn-close${isProfitable ? ' ota-sei-open-orders__btn-close--profitable' : ''}`} aria-label={isProfitable ? 'Close position to lock in profit' : 'Close position'} aria-busy={isClosing} title={isProfitable ? `Profitable – click to lock in $${Number(estProfit).toFixed(4)}` : undefined}>
                          {isClosing ? 'Closing…' : isProfitable ? 'Close (profit)' : 'Close'}
                        </button>
                      )}
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
