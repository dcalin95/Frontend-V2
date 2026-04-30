/**
 * OtaStxMicroProfitPanel – UI for OTA micro-profit strategy on Stacks.
 * Live price: shared OtaStxPairContext. Server STX Auto status from GET /stx/auto/status (DB + worker).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Zap, CheckCircle, XCircle, ExternalLink, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useStxWallet } from './context/StxWalletContext';
import { useOtaStxPairOptional } from './context/OtaStxPairContext';
import { useOtaStxMicroProfit } from './hooks/useOtaStxMicroProfit';
import { useDexAuth } from '../frontend/context/DexAuthContext';
import { STX_PAIRS, STX_TOKENS } from './stxTokenConfig';
import { getStxSwapEnvReadiness } from './stxStacksPrincipals';
import TokenSelectorStx from './TokenSelector.stx';
import { requestOtaAiStxRoundTripAck, getStxAutoStatus, setStxAuto } from './services/otaStxMicroProfitService';
import { getTrades } from '../frontend/services/executionApiService';
import { stxNetwork } from './stxConfig';
import '../frontend/styles/components/ota-sei-micro-profit.css';

const STORAGE_KEY_PERCENT = 'ota-stx-micro-profit-percent';
const DEFAULT_PAIR = 'STX/USDA';

function parsePairId(pairId) {
  const p = STX_PAIRS.find((x) => x.id === pairId);
  if (p) return { base: p.base, quote: p.quote };
  const parts = String(pairId || DEFAULT_PAIR).split('/').map((s) => s.trim());
  return { base: parts[0] || 'STX', quote: parts[1] || 'USDA' };
}

function getTokenDecimals(symbol) {
  const t = STX_TOKENS.find((x) => x.symbol === symbol);
  return t?.decimals ?? 6;
}

function toMinimalUnits(amount, decimals = 6) {
  const n = parseFloat(String(amount).replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return '0';
  return String(Math.floor(n * 10 ** decimals));
}

export default function OtaStxMicroProfitPanel({ splitLayout = false, pair: pairProp, setPair: setPairProp }) {
  const [internalPair, setInternalPair] = useState(DEFAULT_PAIR);
  const effectivePair = pairProp != null ? pairProp : internalPair;
  const setEffectivePair = setPairProp || setInternalPair;
  const { base, quote } = useMemo(() => parsePairId(effectivePair), [effectivePair]);
  const swapEnvReadiness = useMemo(() => getStxSwapEnvReadiness(base, quote), [base, quote]);

  const pairPageCtx = useOtaStxPairOptional();
  const livePrice = pairPageCtx?.livePriceUsd ?? null;
  const livePriceError = pairPageCtx?.livePriceError ?? null;

  const { user } = useDexAuth();
  const userId = user?.id ?? user?.walletAddress ?? null;
  const { isConnected, address, getStacksProvider } = useStxWallet();
  const [roundTripModalOpen, setRoundTripModalOpen] = useState(false);
  const [roundTripResult, setRoundTripResult] = useState(null);
  const [otaAiMessage, setOtaAiMessage] = useState(null);
  const [otaAiLoading, setOtaAiLoading] = useState(false);
  const [amountStx, setAmountStx] = useState('1');
  const [stxHistoryOpen, setStxHistoryOpen] = useState(false);
  const [stxHistory, setStxHistory] = useState([]);
  const [stxHistoryLoading, setStxHistoryLoading] = useState(false);
  const [signalModalOpen, setSignalModalOpen] = useState(false);
  const [stxAutoStatus, setStxAutoStatus] = useState(null);

  const {
    gasEstimateUsd,
    minProfitUsd,
    minProfitOverGasPercent,
    setMinProfitOverGasPercent,
    signal,
    loading,
    refreshAll,
    checkSignal,
    runRoundTrip,
  } = useOtaStxMicroProfit();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PERCENT);
    if (saved != null) {
      const p = parseInt(saved, 10);
      if ([50, 100, 150, 200].includes(p)) setMinProfitOverGasPercent(p);
    }
  }, [setMinProfitOverGasPercent]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const refreshStxAutoStatus = useCallback(async () => {
    if (!userId) {
      setStxAutoStatus(null);
      return;
    }
    const s = await getStxAutoStatus(userId);
    setStxAutoStatus(s);
  }, [userId]);

  useEffect(() => {
    refreshStxAutoStatus();
    const id = setInterval(refreshStxAutoStatus, 20000);
    return () => clearInterval(id);
  }, [refreshStxAutoStatus]);

  const loadStxHistory = useCallback(async () => {
    if (!userId) return;
    setStxHistoryLoading(true);
    try {
      const res = await getTrades(userId, { chain: 'stx', limit: 20 });
      const trades = Array.isArray(res?.trades) ? res.trades : Array.isArray(res?.data?.trades) ? res.data.trades : [];
      setStxHistory(trades);
    } catch {
      setStxHistory([]);
    } finally {
      setStxHistoryLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (stxHistoryOpen && userId) loadStxHistory();
  }, [stxHistoryOpen, userId, loadStxHistory]);

  const handlePercentChange = useCallback(
    (pct) => {
      setMinProfitOverGasPercent(pct);
      try {
        localStorage.setItem(STORAGE_KEY_PERCENT, String(pct));
      } catch {}
    },
    [setMinProfitOverGasPercent]
  );

  const handleCheckSignal = useCallback(() => {
    setSignalModalOpen(true);
    checkSignal({ spreadPct: 0.05, notionalUsd: 10, side: 'buy' });
  }, [checkSignal]);

  const handleRunRoundTrip = useCallback(async () => {
    setRoundTripResult(null);
    setOtaAiMessage(null);
    if (!address) return;
    const decimals = getTokenDecimals(base);
    const amt = toMinimalUnits(amountStx || '1', decimals);
    if (amt === '0') {
      setRoundTripResult({ success: false, error: 'Enter a valid amount (e.g. 1).' });
      setRoundTripModalOpen(true);
      return;
    }
    const result = await runRoundTrip({
      userAddress: address,
      tokenIn: base,
      tokenOut: quote,
      amountIn: amt,
      stacksProvider: typeof getStacksProvider === 'function' ? getStacksProvider() : null,
      userId: userId ?? address ?? undefined,
    });
    if (result?.success) {
      setStxHistoryOpen(true);
      loadStxHistory();
      setTimeout(() => loadStxHistory(), 2000);
    }
    setRoundTripResult(result ?? { success: false, error: 'Unknown error' });
    setRoundTripModalOpen(true);
    setOtaAiLoading(true);
    try {
      const ack = await requestOtaAiStxRoundTripAck({
        txHash: result?.txHash,
        amountStx: amountStx || '1',
      });
      const parts = [ack?.message ?? null];
      if (ack?.ackOnly === true) {
        parts.push('(Ack only — not persisted as execution audit in DB.)');
      }
      setOtaAiMessage(parts.filter(Boolean).join(' '));
    } catch {
      setOtaAiMessage('Ack endpoint unavailable; your on-chain tx is still the source of truth.');
    } finally {
      setOtaAiLoading(false);
    }
  }, [address, amountStx, base, quote, runRoundTrip, userId, loadStxHistory]);

  const blockExplorer = stxNetwork?.blockExplorer || 'https://explorer.stacks.co';
  const txUrl = (hash) => (hash ? `${blockExplorer.replace(/\/$/, '')}/txid/${hash}` : null);

  if (!isConnected) {
    return (
      <section className="ota-stx-micro-profit ota-sei-micro-profit" aria-labelledby="ota-stx-micro-profit-heading">
        <h2 id="ota-stx-micro-profit-heading" className="ota-sei-micro-profit__heading ota-sei-micro-profit__heading--compact">
          OTA Micro-Profit STX
        </h2>
        <p className="ota-sei-micro-profit__subtitle ota-sei-micro-profit__subtitle--alone">
          Connect your Stacks wallet (Leather) for STX OTA. Server auto status is shown after connect when a user id is
          available.
        </p>
        <div className="ota-sei-micro-profit__live-price" role="status" aria-live="polite">
          <span className="ota-sei-micro-profit__live-price-label">{effectivePair}</span>
          {livePriceError ? (
            <span className="ota-sei-micro-profit__live-price-err">{livePriceError}</span>
          ) : livePrice != null ? (
            <span className="ota-sei-micro-profit__live-price-value">${Number(livePrice).toFixed(4)}</span>
          ) : (
            <span className="ota-sei-micro-profit__live-price-loading">…</span>
          )}
        </div>
      </section>
    );
  }

  const settingsBlock = (
    <div className="ota-sei-micro-profit__row ota-sei-micro-profit__gas-row">
      <span className="ota-sei-micro-profit__label">Min profit over gas</span>
      <div className="ota-sei-micro-profit__profit-block">
        <span className="ota-sei-micro-profit__profit-value">{minProfitOverGasPercent ?? 100}%</span>
        <div className="ota-sei-micro-profit__percent-btns">
          {[50, 100, 150, 200].map((p) => (
            <button
              key={p}
              type="button"
              className={`ota-sei-micro-profit__percent-btn ${minProfitOverGasPercent === p ? 'ota-sei-micro-profit__percent-btn--active' : ''}`}
              onClick={() => handlePercentChange(p)}
            >
              {p}%
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const mainContent = (
    <>
      <div className="ota-sei-micro-profit__row ota-sei-micro-profit__row--pair">
        <span className="ota-sei-micro-profit__label">Pair</span>
        <TokenSelectorStx variant="pair" value={effectivePair} onChange={setEffectivePair} label="Select pair" />
      </div>
      {userId && stxAutoStatus && (
        <div
          className="ota-sei-micro-profit__hint"
          style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px', lineHeight: 1.45 }}
          role="status"
        >
          <strong>Server STX Auto:</strong> mode={stxAutoStatus.mode ?? '—'} · worker={stxAutoStatus.workerActive ? 'active' : 'idle'}{' '}
          · executionReady={stxAutoStatus.executionReady ? 'yes' : 'no'}
          {stxAutoStatus.blockReason ? ` · block: ${stxAutoStatus.blockReason}` : ''}
          {stxAutoStatus.latestDecision?.finalAction
            ? ` · last cycle: ${stxAutoStatus.latestDecision.finalAction} (${stxAutoStatus.latestDecision.finalReason ?? ''})`
            : ''}
        </div>
      )}
      <p className="ota-sei-micro-profit__hint" style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px' }}>
        <strong>Local signal.</strong> “Check signal” estimates in the browser from your thresholds — it does not by
        itself submit a server trade. Server auto (when enabled below) runs only if the backend worker and env are
        configured.
      </p>
      {userId && address && (
        <div className="ota-sei-micro-profit__row" style={{ alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!stxAutoStatus?.enabled}
              onChange={async (e) => {
                const on = e.target.checked;
                await setStxAuto(userId, {
                  enabled: on,
                  stacksUserPrincipal: address,
                  preferredPair: effectivePair,
                  minProfitOverGasPercent,
                  maxAmountPerTrade: stxAutoStatus?.maxAmountPerTrade ?? '10',
                });
                await refreshStxAutoStatus();
              }}
            />
            Persist STX Auto on server (uses your Stacks address for vault-style flows)
          </label>
        </div>
      )}
      {settingsBlock}
      <div className="ota-sei-micro-profit__row ota-sei-micro-profit__gas-row">
        <span className="ota-sei-micro-profit__label">Gas (round-trip)</span>
        <span className="ota-sei-micro-profit__gas-value">
          {gasEstimateUsd != null ? `$${Number(gasEstimateUsd).toFixed(4)}` : '…'}
        </span>
      </div>
      <div className="ota-sei-micro-profit__row">
        <span className="ota-sei-micro-profit__label">Min profit (USD)</span>
        <span className="ota-sei-micro-profit__profit-value">{minProfitUsd != null ? `$${Number(minProfitUsd).toFixed(4)}` : '…'}</span>
      </div>
      <div className="ota-sei-micro-profit__live-price">
        <span className="ota-sei-micro-profit__live-price-label">{effectivePair}</span>
        {livePriceError ? (
          <span className="ota-sei-micro-profit__live-price-err">{livePriceError}</span>
        ) : livePrice != null ? (
          <span className="ota-sei-micro-profit__live-price-value">${Number(livePrice).toFixed(4)}</span>
        ) : (
          <span className="ota-sei-micro-profit__live-price-loading">…</span>
        )}
        <span className="ota-sei-micro-profit__live-price-meta" style={{ marginLeft: 8, fontSize: 11, color: '#64748b' }}>
          (shared quote)
        </span>
      </div>
      <div className="ota-sei-micro-profit__input-group">
        <label className="ota-sei-micro-profit__label">Amount ({base})</label>
        <input
          type="text"
          className="ota-sei-micro-profit__input"
          value={amountStx}
          onChange={(e) => setAmountStx(e.target.value)}
          placeholder="1"
          aria-label={`Amount ${base}`}
        />
      </div>
      {!swapEnvReadiness.ready && (
        <div className="ota-sei-micro-profit__alert ota-sei-micro-profit__alert--stx-env" role="status">
          <p>
            <strong>Swap env incomplete.</strong> For local <code>dex-wrapper</code> signing, set (see <code>docs/STX_FRONTEND_ENV.md</code>):
          </p>
          <ul className="ota-sei-micro-profit__env-missing-list">
            {swapEnvReadiness.missing.map((m) => (
              <li key={m}>
                <code>{m}</code>
              </li>
            ))}
          </ul>
          <p className="ota-sei-micro-profit__env-missing-note">
            If your backend returns a ready-to-sign payload only, configure the backend; local token principals may not be required in the browser.
          </p>
        </div>
      )}
      <div className="ota-sei-micro-profit__signal-box">
        <button type="button" className="ota-sei-micro-profit__btn ota-sei-micro-profit__btn--secondary" onClick={handleCheckSignal} disabled={loading}>
          <Zap size={16} aria-hidden /> Check signal
        </button>
        <button type="button" className="ota-sei-micro-profit__btn ota-sei-micro-profit__btn--primary" onClick={handleRunRoundTrip} disabled={loading}>
          <Sparkles size={16} aria-hidden /> Run round-trip
        </button>
      </div>
      {signalModalOpen && (
        <div className="ota-sei-micro-profit__result">
          <p>{signal?.reason ?? (signal?.trigger ? 'Trigger' : 'No trigger')}</p>
          <button type="button" className="ota-sei-micro-profit__btn" onClick={() => setSignalModalOpen(false)}>
            Close
          </button>
        </div>
      )}
      {roundTripModalOpen && (
        <div className="ota-sei-micro-profit__result" role="dialog" aria-label="Round-trip result">
          {roundTripResult?.success ? (
            <>
              <CheckCircle className="ota-sei-micro-profit__icon-success" size={24} aria-hidden />
              <p>Round-trip submitted.</p>
              {roundTripResult?.txHash && (
                <a href={txUrl(roundTripResult.txHash)} target="_blank" rel="noopener noreferrer" className="ota-sei-micro-profit__link">
                  View on explorer <ExternalLink size={14} />
                </a>
              )}
            </>
          ) : (
            <>
              <XCircle className="ota-sei-micro-profit__icon-error" size={24} aria-hidden />
              <p>{roundTripResult?.error ?? 'Failed'}</p>
            </>
          )}
          {otaAiLoading ? <p>Ack…</p> : otaAiMessage && <p className="ota-sei-micro-profit__ota-ai-msg">{otaAiMessage}</p>}
          <button type="button" className="ota-sei-micro-profit__btn" onClick={() => setRoundTripModalOpen(false)}>
            Close
          </button>
        </div>
      )}
      {userId && (
        <>
          <button
            type="button"
            className="ota-sei-micro-profit__expand"
            onClick={() => setStxHistoryOpen((o) => !o)}
            aria-expanded={stxHistoryOpen}
          >
            Recent activity {stxHistoryOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {stxHistoryOpen && (
            <div className="ota-sei-micro-profit__recent-activity">
              {stxHistoryLoading ? (
                <p>Loading…</p>
              ) : !stxHistory?.length ? (
                <p>No STX rows in execution history yet (records appear when the backend stores them).</p>
              ) : (
                <ul className="ota-sei-micro-profit__history-list">
                  {stxHistory.slice(0, 5).map((t, i) => (
                    <li key={t.txHash || t.id || i}>
                      {t.txHash ? (
                        <a href={txUrl(t.txHash)} target="_blank" rel="noopener noreferrer">
                          {String(t.txHash).slice(0, 12)}…
                        </a>
                      ) : (
                        <span>—</span>
                      )}
                      <span>
                        {' '}
                        {t.amountIn ?? ''} → {t.amountOut ?? ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </>
  );

  if (splitLayout) {
    return (
      <section
        className="ota-stx-micro-profit ota-sei-window ota-sei-micro-profit ota-sei-micro-profit-settings"
        aria-label="OTA Micro-Profit STX – Settings"
      >
        {mainContent}
      </section>
    );
  }

  return (
    <section className="ota-stx-micro-profit ota-sei-micro-profit" aria-labelledby="ota-stx-micro-profit-heading">
      <h2 id="ota-stx-micro-profit-heading" className="ota-sei-micro-profit__heading">
        OTA Micro-Profit STX
      </h2>
      <p className="ota-sei-micro-profit__subtitle">
        Stacks micro-profit: manual round-trip signing in your wallet, plus optional server STX Auto when the backend
        worker is enabled (see status below).
      </p>
      {mainContent}
    </section>
  );
}
