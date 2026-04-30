/**
 * Lifecycle CLOB: open (cu partial), istoric Mangrove core, MangroveOrder, jurnal local reconciliat.
 */
import React, { useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { Activity, AlertTriangle, Ban, ClipboardList, Info, LayoutList, RefreshCw } from 'lucide-react';
import { CLOB_SEI_TX_EXPLORER_BASE } from '../config';
import { tickToPrice } from '../services/clobTradeService';
import { filterLifecycleByMarket } from '../utils/clobSeiLifecycleMerge';

function fmtPx(side, tickStr) {
  const t = Number(tickStr);
  if (!Number.isFinite(t)) return '—';
  const raw = tickToPrice(t);
  const p = side === 'buy' ? raw : 1 / (raw || 1);
  if (p >= 100) return p.toFixed(2);
  if (p >= 1) return p.toFixed(4);
  return p.toFixed(6);
}

function fmtGives(row) {
  try {
    const dec = row.side === 'buy' ? row.baseDecimals : row.quoteDecimals;
    return ethers.utils.formatUnits(row.givesRaw, dec);
  } catch {
    return row.givesRaw;
  }
}

function statusLabel(restingStatus) {
  if (restingStatus === 'partial_fill') return 'partial fill';
  if (restingStatus === 'filled') return 'filled (edge)';
  return 'open';
}

export default function ClobSeiLifecyclePanel({
  openOrders = [],
  mangroveCoreActivity = [],
  mangroveOrderEvents = [],
  sessionTagged = [],
  loading = false,
  error = null,
  explorerBase = CLOB_SEI_TX_EXPLORER_BASE,
  onRetractOffer,
  cancelling = {},
  selectedMarketId = null,
}) {
  const handleCancel = useCallback(
    async (row) => {
      if (!onRetractOffer) return;
      try {
        await onRetractOffer(row);
        toast.success('Retract submitted — wait for confirmation.');
      } catch (e) {
        toast.error(e?.message || 'Retract failed');
      }
    },
    [onRetractOffer],
  );

  const coreFiltered = useMemo(
    () => filterLifecycleByMarket(mangroveCoreActivity, selectedMarketId),
    [mangroveCoreActivity, selectedMarketId],
  );
  const moFiltered = useMemo(
    () => filterLifecycleByMarket(mangroveOrderEvents, selectedMarketId),
    [mangroveOrderEvents, selectedMarketId],
  );
  const openFiltered = useMemo(
    () =>
      selectedMarketId
        ? (openOrders || []).filter((r) => r.marketId === selectedMarketId)
        : [...(openOrders || [])],
    [openOrders, selectedMarketId],
  );

  const fillsAndTrades = useMemo(() => {
    const rows = [];
    for (const ev of coreFiltered) {
      if (ev.kind === 'offer_success' || ev.kind === 'offer_success_posthook') {
        rows.push({ ...ev, section: 'fill', label: 'Offer filled (Mangrove)' });
      }
      if (ev.kind === 'order_start' || ev.kind === 'order_complete') {
        rows.push({ ...ev, section: 'trade', label: ev.kind === 'order_start' ? 'Market order start' : 'Market order complete' });
      }
    }
    for (const ev of moFiltered) {
      rows.push({ ...ev, section: 'mo', label: 'MangroveOrder (taker)' });
    }
    rows.sort((a, b) => b.blockNumber - a.blockNumber || (b.logIndex || 0) - (a.logIndex || 0));
    return rows;
  }, [coreFiltered, moFiltered]);

  const cancelledRows = useMemo(
    () => coreFiltered.filter((x) => x.kind === 'offer_retract'),
    [coreFiltered],
  );

  const failedRows = useMemo(
    () => coreFiltered.filter((x) => x.kind === 'offer_fail' || x.kind === 'offer_fail_posthook'),
    [coreFiltered],
  );

  return (
    <section className="clob-sei-lifecycle" aria-label="CLOB orders and activity">
      <header className="clob-sei-lifecycle__hero">
        <div className="clob-sei-lifecycle__hero-text">
          <h2 className="clob-sei-lifecycle__title">Orders & activity</h2>
          <p className="clob-sei-lifecycle__tagline">
            Resting liquidity and Mangrove core events for the pair you trade — refreshed from chain via RPC.
          </p>
        </div>
        {selectedMarketId ? (
          <span className="clob-sei-lifecycle__market-pill" title="This panel shows only this market">
            {selectedMarketId}
          </span>
        ) : null}
      </header>

      <details className="clob-sei-lifecycle__details">
        <summary className="clob-sei-lifecycle__details-sum">
          <Info className="clob-sei-lifecycle__details-ico" size={15} aria-hidden />
          Data source &amp; limits
        </summary>
        <div className="clob-sei-lifecycle__details-body">
          <p className="clob-sei-lifecycle__sub">
            <strong>Source of truth:</strong> Mangrove core <code>Mangrove.sol</code> events (<code>OfferSuccess</code>,{' '}
            <code>OfferWrite</code>, <code>OfferRetract</code>, <code>OrderStart</code> / <code>OrderComplete</code>) via{' '}
            <code>eth_getLogs</code> (chunked RPC) + <code>MangroveOrder</code> taker events. Partial fills: remaining outbound
            vs last <code>OfferWrite</code> in the lookback window + live <code>offerList</code> scan. Full history beyond the
            block window needs an indexer/subgraph (not in this repo).
          </p>
        </div>
      </details>

      {error && (
        <p className="clob-sei-lifecycle__err" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <div className="clob-sei-lifecycle__sync" role="status" aria-live="polite">
          <RefreshCw className="clob-sei-lifecycle__sync-ico" size={16} aria-hidden />
          <span>Syncing on-chain data…</span>
        </div>
      ) : null}

      <div className="clob-sei-lifecycle__block clob-sei-lifecycle__panel">
        <div className="clob-sei-lifecycle__section-head">
          <span className="clob-sei-lifecycle__section-ico clob-sei-lifecycle__section-ico--orders" aria-hidden>
            <LayoutList size={16} strokeWidth={2} />
          </span>
          <h3 className="clob-sei-lifecycle__h3">Open resting orders (on-chain)</h3>
        </div>
        {!openFiltered.length && !loading ? (
          <div className="clob-sei-lifecycle__empty-state">
            <div className="clob-sei-lifecycle__empty-art" aria-hidden />
            <p className="clob-sei-lifecycle__empty-title">No resting orders</p>
            <p className="clob-sei-lifecycle__empty-sub">Place a limit order in the panel on the right to see open offers here.</p>
          </div>
        ) : (
          <div className="clob-sei-table-wrap">
            <table className="clob-sei-table clob-sei-table--striped">
              <thead>
                <tr>
                  <th>Pair</th>
                  <th>Side</th>
                  <th>Status</th>
                  <th>Offer ID</th>
                  <th>Price ({'quote/base'})</th>
                  <th>Remaining (outbound)</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {openFiltered.map((row) => (
                  <tr key={row.key}>
                    <td>
                      {row.baseSymbol}/{row.quoteSymbol}
                    </td>
                    <td>{row.side}</td>
                    <td>
                      <span className={`clob-sei-pill clob-sei-pill--${row.restingStatus || 'open'}`}>
                        {statusLabel(row.restingStatus)}
                      </span>
                    </td>
                    <td className="clob-sei-mono">{row.offerId}</td>
                    <td>{fmtPx(row.side, row.tick)}</td>
                    <td className="clob-sei-mono">{fmtGives(row)}</td>
                    <td>
                      <button
                        type="button"
                        className="clob-sei-btn-cancel"
                        disabled={!onRetractOffer || cancelling[row.offerId]}
                        onClick={() => handleCancel(row)}
                      >
                        {cancelling[row.offerId] ? 'Cancelling…' : 'Retract'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="clob-sei-lifecycle__activity-cluster" aria-label="Fills, cancellations, failures">
        <div className="clob-sei-lifecycle__block clob-sei-lifecycle__block--fills clob-sei-lifecycle__panel">
          <div className="clob-sei-lifecycle__section-head">
            <span className="clob-sei-lifecycle__section-ico clob-sei-lifecycle__section-ico--fills" aria-hidden>
              <Activity size={16} strokeWidth={2} />
            </span>
            <h3 className="clob-sei-lifecycle__h3">Recent fills & taker activity (reconciled on-chain)</h3>
          </div>
          {!fillsAndTrades.length && !loading ? (
            <div className="clob-sei-lifecycle__empty-state clob-sei-lifecycle__empty-state--compact">
              <div className="clob-sei-lifecycle__empty-art clob-sei-lifecycle__empty-art--pulse" aria-hidden />
              <p className="clob-sei-lifecycle__empty-title">No fills in lookback</p>
              <p className="clob-sei-lifecycle__empty-sub">Executions and taker flow will appear here after trades in this window.</p>
            </div>
          ) : (
            <ul className="clob-sei-lifecycle__evlist">
              {fillsAndTrades.map((ev) => (
                <li key={`${ev.txHash}-${ev.blockNumber}-${ev.kind}-${ev.logIndex}`} className="clob-sei-lifecycle__ev">
                  <span className="clob-sei-mono">blk {ev.blockNumber}</span>
                  <span className="clob-sei-ev-kind">{ev.label || ev.kind}</span>
                  {ev.role && <span className="clob-sei-ev-role">{ev.role}</span>}
                  {ev.offerId != null && <span className="clob-sei-mono">id {ev.offerId}</span>}
                  {ev.takerWants != null && <span>wants {ev.takerWants}</span>}
                  {ev.takerGives != null && <span>gives {ev.takerGives}</span>}
                  {ev.tick != null && <span>tick {ev.tick}</span>}
                  {ev.fillVolume != null && <span>vol {ev.fillVolume}</span>}
                  <a href={`${explorerBase}/${ev.txHash}`} target="_blank" rel="noreferrer" className="clob-sei-activity__link">
                    tx
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="clob-sei-lifecycle__cluster-row">
          <div className="clob-sei-lifecycle__block clob-sei-lifecycle__block--compact clob-sei-lifecycle__block--cancel">
            <div className="clob-sei-lifecycle__section-head clob-sei-lifecycle__section-head--compact">
              <span className="clob-sei-lifecycle__section-ico clob-sei-lifecycle__section-ico--cancel" aria-hidden>
                <Ban size={15} strokeWidth={2} />
              </span>
              <h3 className="clob-sei-lifecycle__h3">Cancelled (OfferRetract)</h3>
            </div>
            {!cancelledRows.length && !loading ? (
              <p className="clob-sei-lifecycle__empty clob-sei-lifecycle__empty--inline">None in lookback.</p>
            ) : (
              <ul className="clob-sei-lifecycle__evlist">
                {cancelledRows.map((ev) => (
                  <li key={`${ev.txHash}-${ev.logIndex}-retract`} className="clob-sei-lifecycle__ev">
                    <span className="clob-sei-mono">blk {ev.blockNumber}</span>
                    <span>offer {ev.offerId}</span>
                    <span>{ev.deprovision ? 'deprovision' : 'keep provision'}</span>
                    <a href={`${explorerBase}/${ev.txHash}`} target="_blank" rel="noreferrer" className="clob-sei-activity__link">
                      tx
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="clob-sei-lifecycle__block clob-sei-lifecycle__block--compact clob-sei-lifecycle__block--fail">
            <div className="clob-sei-lifecycle__section-head clob-sei-lifecycle__section-head--compact">
              <span className="clob-sei-lifecycle__section-ico clob-sei-lifecycle__section-ico--fail" aria-hidden>
                <AlertTriangle size={15} strokeWidth={2} />
              </span>
              <h3 className="clob-sei-lifecycle__h3">Failed offers (OfferFail)</h3>
            </div>
            {!failedRows.length && !loading ? (
              <p className="clob-sei-lifecycle__empty clob-sei-lifecycle__empty--inline">None in lookback.</p>
            ) : (
              <ul className="clob-sei-lifecycle__evlist">
                {failedRows.map((ev) => (
                  <li key={`${ev.txHash}-${ev.logIndex}-fail`} className="clob-sei-lifecycle__ev">
                    <span className="clob-sei-mono">blk {ev.blockNumber}</span>
                    <span>{ev.role}</span>
                    <span>offer {ev.offerId}</span>
                    <span className="clob-sei-mono" title={ev.mgvData}>
                      {ev.mgvData ? String(ev.mgvData).slice(0, 18) : '—'}
                    </span>
                    <a href={`${explorerBase}/${ev.txHash}`} target="_blank" rel="noreferrer" className="clob-sei-activity__link">
                      tx
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {sessionTagged.length > 0 && (
        <div className="clob-sei-lifecycle__block clob-sei-lifecycle__panel">
          <div className="clob-sei-lifecycle__section-head">
            <span className="clob-sei-lifecycle__section-ico clob-sei-lifecycle__section-ico--session" aria-hidden>
              <ClipboardList size={16} strokeWidth={2} />
            </span>
            <h3 className="clob-sei-lifecycle__h3">Local session (pending / reconciled)</h3>
          </div>
          <p className="clob-sei-lifecycle__hint">
            Submissions from this browser. <strong>Reconciled</strong> means the same tx hash appears in Mangrove / MangroveOrder
            logs above.
          </p>
          <ul className="clob-sei-activity__list">
            {sessionTagged.map((e) => (
              <li key={`${e.txHash}-${e.at}`} className="clob-sei-activity__item">
                <span className="clob-sei-activity__meta">
                  {e.reconciledOnChain ? (
                    <span className="clob-sei-pill clob-sei-pill--reconciled">reconciled</span>
                  ) : (
                    <span className="clob-sei-pill clob-sei-pill--pending">pending echo</span>
                  )}{' '}
                  {e.orderType} · {e.side} · {e.baseSymbol}/{e.quoteSymbol}
                  {e.offerId ? ` · offer ${e.offerId}` : ''}
                </span>
                <a href={`${explorerBase}/${e.txHash}`} target="_blank" rel="noreferrer" className="clob-sei-activity__link">
                  {e.txHash.slice(0, 10)}…
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
