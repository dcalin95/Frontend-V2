/**
 * OpenOrdersPanel – poziții Direct Entry sub Chart.
 * Token, Amount, Entry, Current, P&L%, Close manual sau LLM may close.
 * Afișează: profit % curent live, praguri OTA auto-close, toggle „Eu preiau controlul".
 * @module OpenOrdersPanel
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { List, TrendingUp, TrendingDown, XCircle, Bot, RefreshCw, ShieldAlert, User, Banknote } from 'lucide-react';
import { useOTAAccess } from '../../hooks/useOTAAccess';
import {
  getDirectEntryPosition,
  getDirectEntryClosedPositions,
  directEntryClose,
  setDirectEntryLlmMayClose,
  recordManualOutcome,
  getOTAMarketData,
  getOtaPositionOpenAiSuspendList,
} from '../../services/aiTradingApiService';
import OtaLlmSuspendControl from './OtaLlmSuspendControl';
import { getPolicy } from '../../services/otaPolicyService';
import { formatNumber } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';
import TokenLogo from '../common/TokenLogo';
import { toast } from 'react-toastify';
import '../../styles/components/open-orders-panel.css';

const LLM_MAY_CLOSE_KEY = (wallet) => `ota_llm_may_close_direct_entry_${(wallet || '').toLowerCase()}`;

const TOKEN_DECIMALS = 18;

/** Număr de zecimale pentru afișare Amount în funcție de token (BTC/ETH = multe, USDT = puține). */
function amountDisplayDecimals(tokenSymbol) {
  const t = (tokenSymbol || '').toUpperCase();
  if (t === 'BTC' || t === 'ETH') return 8;
  if (t === 'USDT' || t === 'BUSD' || t === 'USDC') return 2;
  return 6;
}

/** Dacă valoarea e în wei (foarte mare), o convertește în unități umane (÷ 10^decimals). */
function toHumanAmount(raw, decimals = TOKEN_DECIMALS) {
  const n = parseFloat(raw);
  if (n == null || !Number.isFinite(n)) return raw;
  if (n >= 1e12) return n / Math.pow(10, decimals);
  return n;
}

/** Calculează profit % din entryPrice + currentPrice sau din pnl + amountUsd */
function calcPnlPercent(position) {
  if (!position) return null;
  const entry = parseFloat(position.entryPrice ?? 0);
  const current = parseFloat(position.currentPrice ?? 0);
  if (entry > 0 && current > 0) {
    return ((current - entry) / entry) * 100;
  }
  const pnl = parseFloat(position.pnl ?? 0);
  const amountUsd = toHumanAmount(position.amountUsd ?? position.amountOut ?? 0);
  if (amountUsd > 0 && Number.isFinite(pnl)) {
    return (pnl / amountUsd) * 100;
  }
  return null;
}

/** Estimare tipică BSC pentru tx de închidere poziție (aliniat cu backend OTA_CLOSE_ESTIMATED_GAS_USD). */
const ESTIMATED_CLOSE_GAS_USD = 0.30;

/** Label user-friendly pentru profitTier */
function profitTierLabel(tier) {
  if (tier == null) return null;
  const map = { 5: 'MicroProfit (>5%)', 50: 'MediumProfit (>50%)', 100: 'LargeProfit (>100%)', 1000: 'HugeProfit (>1000%)' };
  return map[tier] || `>${tier}% over gas`;
}

/** Formatează openedAt: "Opened 2h 15m ago" sau "Opened Mar 3, 19:00" */
function formatOpenedAt(openedAt) {
  if (!openedAt) return '—';
  const d = new Date(openedAt);
  if (Number.isNaN(d.getTime())) return '—';
  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffM / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffD > 0) return `Opened ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })} ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  if (diffH > 0) return `Opened ${diffH}h ${diffM % 60}m ago`;
  if (diffM > 0) return `Opened ${diffM}m ago`;
  return 'Opened just now';
}

const OpenOrdersPanel = ({ token, onPositionChange, className = '' }) => {
  const { walletAddress } = useOTAAccess();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [closingId, setClosingId] = useState(null);
  const [togglingPositionId, setTogglingPositionId] = useState(null);
  const [policyData, setPolicyData] = useState(null);
  const [livePrices, setLivePrices] = useState({});
  const [llmSuspendSymbols, setLlmSuspendSymbols] = useState(() => new Set());
  const [closedPositions, setClosedPositions] = useState([]);
  const [loadingClosed, setLoadingClosed] = useState(false);

  // Fetch policy pentru praguri auto-close
  useEffect(() => {
    if (!walletAddress) return;
    let cancelled = false;
    getPolicy(walletAddress)
      .then((p) => {
        if (!cancelled && p) {
          setPolicyData({
            lossLimit: p.lossLimit ?? p.maxLossPercent ?? null,
            profitTier: p.profitTier ?? p.minProfitOverGasPercent ?? null,
          });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [walletAddress]);

  const fetchPosition = useCallback(async () => {
    if (!walletAddress) {
      setPositions([]);
      setLlmSuspendSymbols(new Set());
      return;
    }
    setLoading(true);
    try {
      const pos = await getDirectEntryPosition(walletAddress);
      const openList = Array.isArray(pos) ? pos.filter(p => p && p.status === 'open') : [];
      setPositions(openList);
      onPositionChange?.(openList.length > 0 ? openList : null);
      try {
        const r = await getOtaPositionOpenAiSuspendList(walletAddress, { lane: 'long' });
        setLlmSuspendSymbols(new Set((r.symbols || []).map((s) => String(s).trim().toUpperCase())));
      } catch {
        setLlmSuspendSymbols(new Set());
      }
    } catch (_) {
      setPositions([]);
      setLlmSuspendSymbols(new Set());
    } finally {
      setLoading(false);
    }
  }, [walletAddress, onPositionChange]);

  useEffect(() => {
    fetchPosition();
    const interval = setInterval(fetchPosition, 15000);
    return () => clearInterval(interval);
  }, [fetchPosition]);

  const fetchClosedPositions = useCallback(async () => {
    if (!walletAddress) {
      setClosedPositions([]);
      return;
    }
    setLoadingClosed(true);
    try {
      const list = await getDirectEntryClosedPositions(walletAddress, 10);
      setClosedPositions(Array.isArray(list) ? list : []);
    } catch (_) {
      setClosedPositions([]);
    } finally {
      setLoadingClosed(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchClosedPositions();
    const t = setInterval(fetchClosedPositions, 20000);
    return () => clearInterval(t);
  }, [fetchClosedPositions]);

  // Preț live per token — poll la 8s (AGENTS.md pct. 16: /ai-trading/market)
  const positionTokensKey = useMemo(() => positions.map(p => p.token).filter(Boolean).join(','), [positions]);
  useEffect(() => {
    const tokens = positionTokensKey ? positionTokensKey.split(',').filter(Boolean) : [];
    if (tokens.length === 0) {
      setLivePrices({});
      return;
    }
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      const next = {};
      for (const t of tokens) {
        try {
          const r = await getOTAMarketData(t, 'USDT');
          const p = r?.marketData?.price ?? r?.price ?? null;
          if (p != null) next[t] = Number(p);
        } catch (_) {}
      }
      if (!cancelled && Object.keys(next).length > 0) setLivePrices(prev => ({ ...prev, ...next }));
    };
    tick();
    const interval = setInterval(tick, 8000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [positionTokensKey]);

  useEffect(() => {
    const onOpened = (e) => {
      const addr = e?.detail?.walletAddress;
      if (addr && String(addr).toLowerCase() === String(walletAddress).toLowerCase()) fetchPosition();
    };
    window.addEventListener('ota-direct-entry-opened', onOpened);
    return () => window.removeEventListener('ota-direct-entry-opened', onOpened);
  }, [walletAddress, fetchPosition]);

  const handleToggleControl = useCallback(async (position) => {
    const posId = position?.id ?? position?.positionId ?? position?._id;
    if (!posId || !walletAddress) return;
    const next = !position.llmMayClose;
    setTogglingPositionId(posId);
    try {
      await setDirectEntryLlmMayClose(walletAddress, posId, next);
      await fetchPosition();
      toast.info(next ? 'OTA is now in control – will auto-close on SELL signal.' : 'You are in control – OTA will NOT auto-close.');
    } catch (err) {
      toast.error(err?.message || 'Failed to update control mode');
    } finally {
      setTogglingPositionId(null);
    }
  }, [walletAddress, fetchPosition]);

  const handleClosePosition = useCallback(async (position) => {
    const posId = position?.id ?? position?.positionId ?? position?._id;
    if (!walletAddress || !posId) return;
    setClosingId(posId);
    try {
      const closeRes = await directEntryClose(walletAddress, posId);
      const isReconciled = closeRes?.reconciled === true || closeRes?.reason === 'zero_vault_balance_reconciled';
      if (!isReconciled) {
        const pnlValue = Number(position.pnl ?? 0);
        recordManualOutcome({
          userId: walletAddress,
          token: position.token || token || 'UNKNOWN',
          side: 'sell',
          entryPrice: position.entryPrice ?? null,
          exitPrice: position.currentPrice ?? null,
          pnl: Number.isFinite(pnlValue) ? pnlValue : null,
          source: 'manual',
          txHash: closeRes?.txHash || position.txHash || null,
        }).catch(() => {});
      }
      await fetchPosition();
      await fetchClosedPositions();
      if (isReconciled) {
        toast.info('Position reconciled (no new swap). Token balance was already 0 in the vault; the position was synced with the real state.');
      } else {
        toast.success('Position closed. Profit/loss settled in your Personal Account.');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to close position');
    } finally {
      setClosingId(null);
    }
  }, [walletAddress, token, fetchPosition, fetchClosedPositions]);

  if (!walletAddress) return null;

  return (
    <div className={`open-orders-panel ${className}`} role="region" aria-label="Open Orders (Direct Entry)">
      <div className="open-orders-panel-header">
        <List size={18} className="open-orders-panel-icon" aria-hidden />
        <span className="open-orders-panel-title">Open Orders</span>
        <button
          type="button"
          className="open-orders-panel-refresh"
          onClick={fetchPosition}
          disabled={loading}
          aria-label="Refresh positions"
          title="Refresh"
        >
          <RefreshCw size={14} aria-hidden />
        </button>
      </div>

      <div className="open-orders-panel-body">
        {loading && positions.length === 0 ? (
          <div className="open-orders-panel-loading">
            <LoadingSpinner size={20} />
            <span>Loading positions…</span>
          </div>
        ) : positions.length === 0 ? (
          <p className="open-orders-panel-empty">
            No open position. Use <strong>Direct Entry</strong> in Auto panel to open (max 3).
          </p>
        ) : (
          positions.map((position) => {
            const displayPrice = livePrices[position.token] != null ? livePrices[position.token] : position.currentPrice;
            const entryPrice = position.entryPrice != null ? parseFloat(position.entryPrice) : null;
            const amountHuman = toHumanAmount(position.amountOut ?? position.amountUsd ?? 0);
            const displayPnlPercent = entryPrice != null && displayPrice != null && entryPrice > 0
              ? ((displayPrice - entryPrice) / entryPrice) * 100
              : calcPnlPercent(position);
            const rawPnlUsd = entryPrice != null && displayPrice != null && amountHuman != null
              ? (displayPrice - entryPrice) * amountHuman
              : position.pnl != null ? parseFloat(position.pnl) : null;
            const displayPnlUsd = rawPnlUsd != null && Number.isFinite(rawPnlUsd) ? rawPnlUsd : null;
            const pnlUsdDecimals = displayPnlUsd != null && Math.abs(displayPnlUsd) < 1 && displayPnlUsd !== 0 ? 4 : 2;
            const pnlPositive = displayPnlPercent != null && displayPnlPercent >= 0;
            const manualControl = !position.llmMayClose;
            const inProfit = (displayPnlPercent != null && displayPnlPercent > 0) || (displayPnlUsd != null && displayPnlUsd > 0);
            const isClosing = closingId === (position.id ?? position.positionId);
            const isToggling = togglingPositionId === (position.id ?? position.positionId);

            const tradeNum = position.id ?? position.positionId ?? position._id;
            return (
              <div key={position.id ?? position.positionId ?? position.token} className="open-orders-panel-position">
                <div className="open-orders-panel-top-row">
                  <div className="open-orders-panel-token-info">
                    {tradeNum != null && (
                      <span className="open-orders-panel-trade-num" title="Trade identifier">#{tradeNum}</span>
                    )}
                    <span className="open-orders-panel-label">Token</span>
                    <TokenLogo symbol={position.token || token} size="md" showBorder className="open-orders-panel-token-logo" aria-hidden />
                    <span className="open-orders-panel-value open-orders-panel-token-name">
                      {position.token || token || '—'}
                    </span>
                  </div>
                  {(displayPnlPercent != null || displayPnlUsd != null) && (
                    <div className={`open-orders-panel-profit-badge ${pnlPositive ? 'positive' : 'negative'}`} title="Dynamic PnL (live price)">
                      {pnlPositive ? <TrendingUp size={16} aria-hidden /> : <TrendingDown size={16} aria-hidden />}
                      <span>{pnlPositive ? '+' : ''}{formatNumber(displayPnlPercent ?? 0, 2)}%</span>
                      {displayPnlUsd != null && (
                        <span className="open-orders-panel-profit-usd">
                          ({pnlPositive ? '+' : ''}{formatNumber(displayPnlUsd, pnlUsdDecimals)} USD)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {tradeNum != null && (
                  <div className="open-orders-panel-position-row">
                    <span className="open-orders-panel-label">Trade</span>
                    <span className="open-orders-panel-value open-orders-panel-trade-id">#{tradeNum}</span>
                  </div>
                )}
                <div className="open-orders-panel-position-row">
                  <span className="open-orders-panel-label">Entry price</span>
                  <span className="open-orders-panel-value">${formatNumber(position.entryPrice ?? 0, 4)}</span>
                </div>
                <div className="open-orders-panel-position-row">
                  <span className="open-orders-panel-label">Current price</span>
                  <span className={`open-orders-panel-value open-orders-panel-pnl ${pnlPositive ? 'positive' : 'negative'}`}>
                    {displayPrice != null ? `$${formatNumber(displayPrice, 4)}` : (position.currentPrice != null ? `$${formatNumber(position.currentPrice, 4)}` : '—')}
                  </span>
                </div>
                <div className="open-orders-panel-position-row">
                  <span className="open-orders-panel-label">Profit</span>
                  <span className={`open-orders-panel-value open-orders-panel-pnl ${pnlPositive ? 'positive' : 'negative'}`}>
                    {displayPnlUsd != null
                      ? `${pnlPositive ? '+' : ''}${formatNumber(displayPnlUsd, pnlUsdDecimals)} USD`
                      : (displayPnlPercent != null ? `${pnlPositive ? '+' : ''}${formatNumber(displayPnlPercent, 2)}%` : '—')}
                    <span className="open-orders-panel-profit-gas-hint" title="Estimated BSC close cost (tx fee).">
                      {' '}(gas ~{formatNumber(ESTIMATED_CLOSE_GAS_USD, 2)} USD)
                    </span>
                  </span>
                </div>
                <div className="open-orders-panel-position-row">
                  <span className="open-orders-panel-label">Amount</span>
                  <span className="open-orders-panel-value">{formatNumber(amountHuman, amountDisplayDecimals(position.token))} {position.token || ''}</span>
                </div>
                <div className="open-orders-panel-position-row">
                  <span className="open-orders-panel-label">Opened</span>
                  <span className="open-orders-panel-value" title={position.openedAt ? new Date(position.openedAt).toLocaleString() : ''}>{formatOpenedAt(position.openedAt)}</span>
                </div>
                {position.amountUsd != null && Number.isFinite(position.amountUsd) && (
                  <div className="open-orders-panel-position-row" title="Position value at open in quote currency (USD).">
                    <span className="open-orders-panel-label">Entry value</span>
                    <span className="open-orders-panel-value">{formatNumber(position.amountUsd, 2)} USD</span>
                  </div>
                )}

                {(policyData?.lossLimit != null || policyData?.profitTier != null) && (
                  <div className="open-orders-panel-thresholds" aria-label="OTA auto-close thresholds">
                    <span className="open-orders-panel-thresholds-label">OTA closes at:</span>
                    <div className="open-orders-panel-thresholds-items">
                      {policyData?.lossLimit != null && policyData.lossLimit > 0 && (
                        <span className="open-orders-panel-threshold-item loss">-{policyData.lossLimit}% loss</span>
                      )}
                      {policyData?.profitTier != null && (
                        <span className="open-orders-panel-threshold-item profit">{profitTierLabel(policyData.profitTier)}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="open-orders-panel-divider" />

                <div className="open-orders-panel-control-mode" aria-live="polite">
                  <div className={`open-orders-panel-control-status ${manualControl ? 'manual' : 'auto'}`}>
                    {manualControl ? (
                      <><User size={15} aria-hidden /><span><strong>You are in control</strong> – OTA will NOT auto-close.</span></>
                    ) : (
                      <><Bot size={15} aria-hidden /><span><strong>OTA is in control</strong> – closes on SELL signal.</span></>
                    )}
                  </div>
                  {!manualControl && position.token && (
                    <p className="open-orders-panel-ota-wait-hint" role="status">
                      Wait for OTA <strong>SELL</strong> for {position.token}. <a href="#ota-recent-activity" className="open-orders-panel-ota-wait-link">Recent Activity</a>
                    </p>
                  )}
                  <button
                    type="button"
                    className={`open-orders-panel-toggle-btn ${manualControl ? 'is-manual' : 'is-auto'}`}
                    onClick={() => handleToggleControl(position)}
                    disabled={isToggling}
                    aria-pressed={manualControl}
                    title={manualControl ? 'Let OTA decide when to close' : 'Take manual control'}
                  >
                    {isToggling ? <LoadingSpinner size={14} /> : manualControl ? <><Bot size={14} aria-hidden /><span>Let OTA decide</span></> : <><ShieldAlert size={14} aria-hidden /><span>I take control</span></>}
                  </button>
                  {position.token && walletAddress && (
                    <div className="open-orders-panel-llm-suspend" style={{ marginTop: 10 }}>
                      <OtaLlmSuspendControl
                        walletAddress={walletAddress}
                        token={position.token}
                        suspended={llmSuspendSymbols.has(String(position.token || '').toUpperCase())}
                        onChanged={fetchPosition}
                        suspendLane="long"
                        compact
                      />
                    </div>
                  )}
                </div>

                {inProfit && (
                  <button
                    type="button"
                    className="open-orders-panel-take-profit-btn"
                    onClick={() => handleClosePosition(position)}
                    disabled={isClosing}
                    aria-label="Take profit"
                    title="Lock in profit"
                  >
                    {isClosing ? <LoadingSpinner size={16} /> : <Banknote size={16} aria-hidden />}
                    <span>Take Profit</span>
                  </button>
                )}
                <button
                  type="button"
                  className="open-orders-panel-close-btn"
                  onClick={() => handleClosePosition(position)}
                  disabled={isClosing}
                  aria-label="Close position"
                  title="Close position"
                >
                  {isClosing ? <LoadingSpinner size={16} /> : <XCircle size={16} aria-hidden />}
                  <span>Close Position</span>
                </button>
              </div>
            );
          })
        )}

        {walletAddress && (
          <div className="open-orders-panel-closed-section" id="ota-recent-activity" aria-label="Recently closed Direct Entry positions">
            <h4 className="open-orders-panel-closed-title">Recently closed</h4>
            <p className="open-orders-panel-closed-hint">When OTA closes a position (SELL signal) or you close manually, it appears here. PnL is net of gas (transaction fee deducted when available).</p>
            {closedPositions.length > 0 && (() => {
              const pnls = closedPositions.map(c => c.pnlUsd != null ? parseFloat(c.pnlUsd) : null).filter(n => n != null && Number.isFinite(n));
              const totalRows = closedPositions.length;
              const totalWithPnl = pnls.length;
              const avgPnl = totalWithPnl > 0 ? pnls.reduce((a, b) => a + b, 0) / totalWithPnl : null;
              const best = pnls.length > 0 ? Math.max(...pnls) : null;
              const worst = pnls.length > 0 ? Math.min(...pnls) : null;
              return (
                <div className="open-orders-panel-closed-stats" role="status" aria-label="Closed positions summary">
                  <span>Total: {totalRows}</span>
                  <span>With PnL: {totalWithPnl}</span>
                  {avgPnl != null && <span>Avg PnL: {avgPnl >= 0 ? '+' : ''}{formatNumber(avgPnl, 2)} USD</span>}
                  {best != null && <span>Best: +{formatNumber(best, 2)} USD</span>}
                  {worst != null && <span>Worst: {formatNumber(worst, 2)} USD</span>}
                </div>
              );
            })()}
            {loadingClosed ? (
              <p className="open-orders-panel-closed-loading">Loading…</p>
            ) : closedPositions.length === 0 ? (
              <p className="open-orders-panel-closed-empty">No closed positions yet.</p>
            ) : (
              <ul className="open-orders-panel-closed-list">
                {closedPositions.map((c) => {
                  const pnl = c.pnlUsd != null ? parseFloat(c.pnlUsd) : null;
                  const isProfit = pnl != null && pnl >= 0;
                  const closedAt = c.closedAt ? new Date(c.closedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '—';
                  const byOta = c.closeSource === 'llm_close';
                  const bscUrl = c.txHashClose ? `https://bscscan.com/tx/${c.txHashClose}` : null;
                  const likelyReconciled = !byOta && !bscUrl && (pnl == null || !Number.isFinite(pnl));
                  return (
                    <li key={c.id} className="open-orders-panel-closed-item">
                      <span className="open-orders-panel-trade-num-inline" title="Trade number">#{c.id}</span>
                      <span className="open-orders-panel-closed-token">{c.token}</span>
                      <span className={`open-orders-panel-closed-pnl ${isProfit ? 'positive' : 'negative'}`}>
                        {pnl != null ? `${isProfit ? '+' : ''}${formatNumber(pnl, 2)} USD` : (likelyReconciled ? 'Reconciled' : '—')}
                      </span>
                      <span className="open-orders-panel-closed-source" title={byOta ? 'Closed by OTA (SELL signal)' : 'Closed by you'}>
                        {byOta ? <><Bot size={12} aria-hidden /> OTA closed</> : <><User size={12} aria-hidden /> You closed</>}
                      </span>
                      <span className="open-orders-panel-closed-date">{closedAt}</span>
                      {bscUrl ? (
                        <a href={bscUrl} target="_blank" rel="noopener noreferrer" className="open-orders-panel-closed-tx" aria-label="View on BSCScan">Tx</a>
                      ) : (
                        <span className="open-orders-panel-closed-tx" title={likelyReconciled ? 'No on-chain swap tx (reconciled)' : 'Tx unavailable'}>
                          {likelyReconciled ? 'No Tx (reconciled)' : 'No Tx'}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(OpenOrdersPanel);
