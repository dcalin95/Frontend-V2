/**
 * SwapPanel.stx.jsx - Stacks (SIP-010) swap through on-chain dex-wrapper; minOut quote from OTA API (chain=stx).
 * Alex routing is in the deployed contract; UI does not call the Alex SDK directly.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import TokenSelectorStx from './TokenSelector.stx';
import StxTokenIcon from './StxTokenIcon';
import { ArrowDownUp, TrendingUp, Info, ExternalLink } from 'lucide-react';
import { useStxWallet } from './context/StxWalletContext';
import { stxNetwork } from './stxConfig';
import {
  slippageLabelToBps,
  humanToMinimalUnits,
  getDecimalsForSymbol,
  runStxAlexSwap,
} from './services/stxSwapExecution';
import { getStxSwapEnvReadiness } from './stxStacksPrincipals';
import { fetchStxQuote } from './services/otaStxMicroProfitService';

const SLIPPAGE_OPTS = ['0.1%', '0.5%', '1%', '2%'];
const PCT_OPTS = [25, 50, 75, 100];

const COINGECKO_IDS = { STX: 'blockstack', sBTC: 'bitcoin', xBTC: 'bitcoin', ALEX: 'alexgo' };
const STABLE = { USDA: 1, USDC: 1, USDT: 1 };

async function fetchStxPrices(symbols) {
  const prices = { ...STABLE };
  const toFetch = symbols.filter((s) => !STABLE[s] && COINGECKO_IDS[s]);
  if (!toFetch.length) return prices;
  try {
    const ids = toFetch.map((s) => COINGECKO_IDS[s]).join(',');
    const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
    if (r.ok) {
      const d = await r.json();
      for (const s of toFetch) {
        const id = COINGECKO_IDS[s];
        if (d[id]?.usd) prices[s] = d[id].usd;
      }
    }
  } catch {
    /* ignore */
  }
  return prices;
}

const ALL_SYMBOLS = ['STX', 'USDA', 'sBTC', 'xBTC', 'ALEX'];

function txExplorerUrl(txHash) {
  if (!txHash) return null;
  const base = (stxNetwork?.blockExplorer || 'https://explorer.stacks.co').replace(/\/$/, '');
  return `${base}/txid/${txHash}`;
}

export default function SwapPanelStx() {
  const { isConnected, address, getStacksProvider } = useStxWallet();
  const [fromAmount, setFromAmount] = useState('');
  const [fromPair, setFromPair] = useState('STX');
  const [toPair, setToPair] = useState('USDA');
  const [slippage, setSlippage] = useState('0.5%');
  const [prices, setPrices] = useState({});
  const [swapBusy, setSwapBusy] = useState(false);
  const [swapError, setSwapError] = useState(null);
  const [lastTxHash, setLastTxHash] = useState(null);
  const [apiMinOutHuman, setApiMinOutHuman] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  useEffect(() => {
    fetchStxPrices(ALL_SYMBOLS).then(setPrices);
    const id = setInterval(() => fetchStxPrices(ALL_SYMBOLS).then(setPrices), 60000);
    return () => clearInterval(id);
  }, []);

  const readiness = useMemo(
    () => getStxSwapEnvReadiness(fromPair, toPair),
    [fromPair, toPair]
  );

  const handleFlip = () => {
    setFromPair(toPair);
    setToPair(fromPair);
    setFromAmount('');
    setSwapError(null);
    setLastTxHash(null);
  };

  const usdIn = (parseFloat(fromAmount) || 0) * (prices[fromPair] || 0);
  const estRate = prices[fromPair] && prices[toPair] ? prices[fromPair] / prices[toPair] : null;
  const estOut =
    estRate && parseFloat(fromAmount) > 0 ? (parseFloat(fromAmount) * estRate).toFixed(6) : null;
  const usdOut = estOut ? parseFloat(estOut) * (prices[toPair] || 0) : null;

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setApiMinOutHuman(null);
      const { minimal, ok } = humanToMinimalUnits(fromAmount, fromPair);
      if (!ok || fromPair === toPair) return;
      setQuoteLoading(true);
      try {
        const q = await fetchStxQuote(fromPair, toPair, minimal, slippageLabelToBps(slippage));
        if (cancelled || !q?.minAmountOut) return;
        const dec = getDecimalsForSymbol(toPair);
        const h = Number(q.minAmountOut) / 10 ** dec;
        if (Number.isFinite(h) && h > 0) setApiMinOutHuman(h);
      } catch {
        if (!cancelled) setApiMinOutHuman(null);
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    };
    const t = setTimeout(run, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [fromAmount, fromPair, toPair, slippage]);

  const onSwap = useCallback(async () => {
    setSwapError(null);
    setLastTxHash(null);
    if (!isConnected || !address) {
      setSwapError('Connect your STX wallet (Leather / Hiro).');
      return;
    }
    if (!readiness.ready) {
      setSwapError(`Missing env config: ${readiness.missing.join(', ')}`);
      return;
    }
    setSwapBusy(true);
    try {
      const res = await runStxAlexSwap({
        fromSymbol: fromPair,
        toSymbol: toPair,
        humanAmount: fromAmount,
        slippageLabel: slippage,
        userAddress: address,
        stacksProvider: getStacksProvider?.() || null,
      });
      if (!res.ok) {
        setSwapError(res.error || 'Swap failed');
        return;
      }
      setLastTxHash(res.txHash || null);
      setFromAmount('');
    } catch (e) {
      setSwapError(e?.message || String(e));
    } finally {
      setSwapBusy(false);
    }
  }, [
    isConnected,
    address,
    readiness.ready,
    readiness.missing,
    fromPair,
    toPair,
    fromAmount,
    slippage,
    getStacksProvider,
  ]);

  const canSwap =
    isConnected &&
    readiness.ready &&
    humanToMinimalUnits(fromAmount, fromPair).ok &&
    fromPair !== toPair &&
    !swapBusy;

  const tabBtnStyle = (active) => ({
    padding: '2px 7px',
    borderRadius: 4,
    border: `1px solid ${active ? 'rgba(247,147,26,0.6)' : 'var(--ds-border-color,#27272a)'}`,
    background: active ? 'rgba(247,147,26,0.15)' : 'transparent',
    color: active ? '#f7931a' : 'var(--ds-text-secondary)',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: active ? 600 : 400,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: 'var(--ds-text-secondary)',
        }}
      >
        <span>
          Network: <strong style={{ color: 'var(--ds-text-primary)' }}>Stacks {stxNetwork.chainId}</strong> ·{' '}
          <span style={{ color: '#f7931a' }}>Execution: dex-wrapper (Alex routing in contract)</span>
        </span>
        <span>
          {prices.STX ? `STX $${prices.STX.toFixed(3)}` : ''}
          {prices.sBTC
            ? ` · BTC $${prices.sBTC.toLocaleString('en', { maximumFractionDigits: 0 })}`
            : ''}
        </span>
      </div>

      {!readiness.ready && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.35)',
            fontSize: 11,
            color: '#fbbf24',
          }}
        >
          <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong>On-chain swap disabled</strong> until env is set: {readiness.missing.join(', ')}. See{' '}
            <code style={{ fontSize: 10 }}>docs/STX_FRONTEND_ENV.md</code>. You can still use the indicative prices below.
          </span>
        </div>
      )}

      {readiness.ready && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            fontSize: 11,
            color: 'var(--ds-text-secondary)',
          }}
        >
          <Info size={13} />
          <span>
            <strong style={{ color: '#86efac' }}>minOut</strong> comes from{' '}
            <code style={{ fontSize: 10 }}>GET /api/ai-trading/quote?chain=stx</code> (multi-source USD proxy,
            including ALEX). The transaction calls <strong>swap</strong> on the env contract; no Alex calldata is sent
            from the browser.
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ds-text-secondary)' }}>
          <span>From</span>
        </div>
        <div
          style={{
            padding: '10px 12px',
            border: '1px solid var(--ds-border-color,#27272a)',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
            <StxTokenIcon symbol={fromPair} size={24} />
            <input
              type="number"
              min="0"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              style={{
                flex: '1 1 0',
                minWidth: 0,
                width: 0,
                border: 'none',
                background: 'transparent',
                fontSize: 20,
                fontWeight: 600,
                outline: 'none',
                color: 'var(--ds-text-primary,#e2e8f0)',
              }}
            />
            <TokenSelectorStx
              variant="token"
              value={fromPair}
              onChange={(v) => {
                setFromPair(v);
                setFromAmount('');
              }}
              label="Source token"
            />
          </div>
          {usdIn > 0 && (
            <div style={{ fontSize: 11, color: 'var(--ds-text-secondary)', paddingLeft: 30 }}>
              ≈ ${usdIn.toFixed(2)} USD (CoinGecko)
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {PCT_OPTS.map((p) => (
            <button
              key={p}
              type="button"
              disabled
              title="On-chain balance coming soon"
              style={{
                flex: 1,
                padding: '3px 0',
                fontSize: 11,
                fontWeight: 600,
                border: '1px solid var(--ds-border-color,#27272a)',
                borderRadius: 5,
                background: 'transparent',
                color: 'var(--ds-text-secondary)',
                cursor: 'not-allowed',
                opacity: 0.4,
              }}
            >
              {p === 100 ? 'MAX' : `${p}%`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={handleFlip}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--ds-border-color,#27272a)',
            borderRadius: 8,
            padding: '6px 10px',
            cursor: 'pointer',
            color: 'var(--ds-text-secondary)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ArrowDownUp size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>You receive (estimate)</div>
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            background: 'rgba(247,147,26,0.03)',
            border: '1px solid rgba(247,147,26,0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
            <StxTokenIcon symbol={toPair} size={24} />
            <div
              style={{
                flex: 1,
                fontSize: 20,
                fontWeight: 600,
                color: estOut ? '#f7931a' : 'var(--ds-text-secondary)',
              }}
            >
              {quoteLoading ? '…' : estOut ?? '0.0'}
            </div>
            <TokenSelectorStx variant="token" value={toPair} onChange={(v) => setToPair(v)} label="Destination token" />
          </div>
          {apiMinOutHuman != null && (
            <div style={{ fontSize: 11, color: '#86efac', paddingLeft: 30 }}>
              Min. after slippage (OTA API): ~{apiMinOutHuman.toFixed(8)} {toPair}
            </div>
          )}
          {usdOut != null && usdOut > 0 && (
            <div style={{ fontSize: 11, color: '#f7931a', paddingLeft: 30 }}>≈ ${usdOut.toFixed(2)} USD (est.)</div>
          )}
        </div>
      </div>

      {estRate && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--ds-border-color,#27272a)',
            fontSize: 12,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ds-text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendingUp size={11} /> Rate (est. CoinGecko)
            </span>
            <strong style={{ color: 'var(--ds-text-primary)' }}>
              1 {fromPair} ≈ {estRate.toFixed(6)} {toPair}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--ds-text-secondary)' }}>Slippage:</span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {SLIPPAGE_OPTS.map((s) => (
                <button key={s} type="button" onClick={() => setSlippage(s)} style={tabBtnStyle(slippage === s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ds-text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Info size={11} /> DEX fee (indicative)
            </span>
            <span>~0.30% (contract / pool)</span>
          </div>
        </div>
      )}

      {swapError && (
        <p role="alert" style={{ margin: 0, fontSize: 12, color: '#f87171' }}>
          {swapError}
        </p>
      )}

      {lastTxHash && (
        <p style={{ margin: 0, fontSize: 12, color: '#86efac' }}>
          Transaction sent:{' '}
          <a href={txExplorerUrl(lastTxHash)} target="_blank" rel="noopener noreferrer" style={{ color: '#f7931a' }}>
            View in explorer <ExternalLink size={12} style={{ verticalAlign: 'middle' }} />
          </a>
        </p>
      )}

      <button
        type="button"
        disabled={!canSwap}
        onClick={onSwap}
        aria-busy={swapBusy}
        style={{
          width: '100%',
          padding: '13px',
          borderRadius: 10,
          border: '1px solid rgba(247,147,26,0.45)',
          background: canSwap ? 'rgba(247,147,26,0.2)' : 'rgba(247,147,26,0.06)',
          color: '#f7931a',
          fontWeight: 700,
          fontSize: 15,
          cursor: canSwap ? 'pointer' : 'not-allowed',
          opacity: canSwap ? 1 : 0.55,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {swapBusy ? 'Opening wallet...' : !isConnected
          ? 'Connect STX wallet'
          : !readiness.ready
            ? 'Missing contract config (env)'
            : `Swap ${fromPair} → ${toPair}`}
      </button>

      <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--ds-text-secondary)', opacity: 0.75 }}>
        Alex Protocol = routing in deployed contract · SIP-010 · minOut from API (USD proxy)
      </div>
    </div>
  );
}
