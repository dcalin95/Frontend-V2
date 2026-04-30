/**
 * SwapPanel.sol.jsx – Swap Solana tokens via Jupiter.
 * Live quotes, USD prices, % buttons, price impact, best route display.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Connection } from '@solana/web3.js';
import { VersionedTransaction } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import TokenSelectorSol from './TokenSelector.sol';
import SolTokenIcon from './SolTokenIcon';
import { SOL_RPC } from './solConfig';
import { getQuote, getSwapTransaction, MINT_BY_SYMBOL, toRawAmount, DECIMALS_BY_SYMBOL } from './services/jupiterService';
import { ArrowDownUp, Loader2, TrendingUp, Info, ExternalLink } from 'lucide-react';

const SLIPPAGE_OPTS = [
  { label: '0.1%', bps: 10 },
  { label: '0.5%', bps: 50 },
  { label: '1%', bps: 100 },
  { label: '2%', bps: 200 },
];
const PCT_OPTS = [25, 50, 75, 100];
const MIN_SOL_FEE_BUFFER = 0.01;
const QUOTE_STALE_MS = 45000;

const COINGECKO_IDS = {
  SOL: 'solana', USDC: 'usd-coin', USDT: 'tether',
  BONK: 'bonk', JUP: 'jupiter-exchange-solana', RAY: 'raydium', mSOL: 'msol',
};
const STABLE = { USDC: 1, USDT: 1 };

async function fetchSolPrices(symbols) {
  const prices = { ...STABLE };
  const toFetch = symbols.filter(s => !STABLE[s] && COINGECKO_IDS[s]);
  if (!toFetch.length) return prices;
  try {
    const ids = toFetch.map(s => COINGECKO_IDS[s]).join(',');
    const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
    if (r.ok) {
      const d = await r.json();
      for (const s of toFetch) {
        const id = COINGECKO_IDS[s];
        if (d[id]?.usd) prices[s] = d[id].usd;
      }
    }
  } catch { /* fallback */ }
  return prices;
}

export default function SwapPanelSol({ assistedDraft = null } = {}) {
  const { publicKey, signTransaction, connected, wallet } = useWallet();
  const [fromAmount, setFromAmount] = useState('');
  const [fromPair, setFromPair] = useState('SOL');
  const [toPair, setToPair]     = useState('USDC');
  const [slippage, setSlippage] = useState('0.5%');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [txSig, setTxSig]       = useState(null);

  const [quote, setQuote]             = useState(null); // Jupiter quote object
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteUpdatedAt, setQuoteUpdatedAt] = useState(null);
  const [prices, setPrices]           = useState({});
  const [solBalance, setSolBalance]   = useState(null);

  const allSymbols = ['SOL', 'USDC', 'USDT', 'BONK', 'JUP', 'RAY', 'mSOL'];

  useEffect(() => {
    if (!assistedDraft) return;
    const draftAmount = String(assistedDraft.amount || '').trim();
    if (!draftAmount || !MINT_BY_SYMBOL[assistedDraft.from] || !MINT_BY_SYMBOL[assistedDraft.to]) return;
    setFromPair(assistedDraft.from);
    setToPair(assistedDraft.to);
    setFromAmount(draftAmount);
    setQuote(null);
    setQuoteUpdatedAt(null);
    setError(null);
    setTxSig(null);
  }, [assistedDraft]);

  // USD prices.
  useEffect(() => {
    fetchSolPrices(allSymbols).then(setPrices);
    const id = setInterval(() => fetchSolPrices(allSymbols).then(setPrices), 30000);
    return () => clearInterval(id);
  }, []);

  // SOL balance.
  useEffect(() => {
    if (!connected || !publicKey) { setSolBalance(null); return; }
    const conn = new Connection(SOL_RPC || 'https://api.mainnet-beta.solana.com');
    conn.getBalance(publicKey).then(lamports => setSolBalance(lamports / 1e9)).catch(() => {});
  }, [connected, publicKey]);

  // Live quote from Jupiter, debounced.
  useEffect(() => {
    if (!fromAmount || parseFloat(fromAmount) <= 0 || fromPair === toPair) {
      setQuote(null); setQuoteUpdatedAt(null); return;
    }
    const inputMint  = MINT_BY_SYMBOL[fromPair];
    const outputMint = MINT_BY_SYMBOL[toPair];
    if (!inputMint || !outputMint) { setQuote(null); setQuoteUpdatedAt(null); return; }

    setQuoteLoading(true);
    const bps = SLIPPAGE_OPTS.find(o => o.label === slippage)?.bps ?? 50;
    const rawAmount = toRawAmount(String(fromAmount), fromPair);

    const t = setTimeout(() => {
      getQuote({ inputMint, outputMint, amount: rawAmount, slippageBps: bps })
        .then((q) => { setQuote(q); setQuoteUpdatedAt(Date.now()); })
        .catch(() => { setQuote(null); setQuoteUpdatedAt(null); })
        .finally(() => setQuoteLoading(false));
    }, 500);
    return () => { clearTimeout(t); setQuoteLoading(false); };
  }, [fromAmount, fromPair, toPair, slippage]);

  // Derived calculations from quote.
  const outDecimals  = DECIMALS_BY_SYMBOL[toPair] ?? 6;
  const outAmount    = quote ? Number(quote.outAmount) / 10 ** outDecimals : null;
  const priceImpact  = quote ? parseFloat(quote.priceImpactPct ?? 0) * 100 : null;
  const impactHigh   = priceImpact != null && priceImpact > 15;
  const impactDanger = priceImpact != null && priceImpact > 3;
  const exchangeRate = outAmount && parseFloat(fromAmount) > 0
    ? (outAmount / parseFloat(fromAmount)).toFixed(6) : null;
  const routeLabel   = quote?.routePlan?.[0]?.swapInfo?.label || null;
  const quoteAgeMs = quoteUpdatedAt ? Date.now() - quoteUpdatedAt : null;
  const quoteIsStale = quoteAgeMs != null && quoteAgeMs > QUOTE_STALE_MS;
  const quoteAgeLabel = quoteAgeMs != null ? `${Math.max(0, Math.round(quoteAgeMs / 1000))}s ago` : null;

  const usdIn  = (parseFloat(fromAmount) || 0) * (prices[fromPair] || 0);
  const usdOut = (outAmount || 0) * (prices[toPair] || 0);
  const fromAmountNumber = Number(fromAmount);
  const needsSolFeeBuffer = fromPair === 'SOL';
  const availableSolForSwap = solBalance == null ? null : Math.max(0, solBalance - MIN_SOL_FEE_BUFFER);
  const insufficientSolBalance = connected && needsSolFeeBuffer && solBalance != null && fromAmountNumber > availableSolForSwap;

  const handleFlip = () => {
    setFromPair(toPair); setToPair(fromPair);
    setFromAmount(''); setQuote(null); setQuoteUpdatedAt(null);
  };

  const handlePct = (pct) => {
    if (!solBalance && fromPair === 'SOL') return;
    const bal = fromPair === 'SOL' ? Math.max(0, solBalance - MIN_SOL_FEE_BUFFER) : 0;
    if (bal > 0) setFromAmount(((bal * pct) / 100).toFixed(4));
  };

  const handleSwap = useCallback(async () => {
    setError(null); setTxSig(null);
    if (!connected || !publicKey || !signTransaction) {
      setError('Connect your Solana wallet first.'); return;
    }
    if (impactHigh) {
      setError(`Price impact too high (${priceImpact.toFixed(1)}%). Reduce amount.`); return;
    }
    const inputMint  = MINT_BY_SYMBOL[fromPair];
    const outputMint = MINT_BY_SYMBOL[toPair];
    if (!inputMint || !outputMint) { setError('Token pair not supported.'); return; }
    const rawAmount = toRawAmount(String(fromAmount), fromPair);
    if (!rawAmount || rawAmount === '0') { setError('Enter a valid amount.'); return; }
    if (insufficientSolBalance) {
      setError(`Insufficient SOL after reserving ${MIN_SOL_FEE_BUFFER} SOL for network fees.`);
      return;
    }

    setLoading(true);
    try {
      const bps = SLIPPAGE_OPTS.find(o => o.label === slippage)?.bps ?? 50;
      const q = await getQuote({ inputMint, outputMint, amount: rawAmount, slippageBps: bps });
      const { swapTransaction: txBase64 } = await getSwapTransaction({
        userPublicKey: publicKey.toBase58(), quoteResponse: q,
      });
      const txBuf = typeof Buffer !== 'undefined'
        ? Buffer.from(txBase64, 'base64')
        : Uint8Array.from(atob(txBase64), c => c.charCodeAt(0));
      const tx = VersionedTransaction.deserialize(txBuf);
      const signed = await signTransaction(tx);
      const connection = new Connection(SOL_RPC || 'https://api.mainnet-beta.solana.com');
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false, preflightCommitment: 'confirmed', maxRetries: 3,
      });
      setTxSig(sig);
      setFromAmount(''); setQuote(null); setQuoteUpdatedAt(null);
    } catch (e) {
      const msg = e?.message || String(e);
      setError(msg.includes('User rejected') || msg.includes('4001') ? 'Transaction cancelled.' : msg);
    } finally {
      setLoading(false);
    }
  }, [fromAmount, fromPair, toPair, slippage, connected, publicKey, signTransaction, impactHigh, priceImpact, insufficientSolBalance]);

  const canSwap = connected && publicKey && fromAmount && Number(fromAmount) > 0
    && fromPair !== toPair && !loading && !impactHigh && !insufficientSolBalance;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Network info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--ds-text-secondary)' }}>
        <span>Network: <strong style={{ color: 'var(--ds-text-primary)' }}>Solana mainnet</strong> · <span style={{ color: '#14f195' }}>Jupiter Router</span></span>
        <span>
          {prices.SOL ? `SOL $${prices.SOL.toFixed(3)}` : ''}
          {prices.SOL && prices[toPair] && toPair !== 'SOL' ? ` · ${toPair} $${(prices[toPair] || 0).toFixed(4)}` : ''}
        </span>
      </div>

      <div style={{ padding: '9px 12px', borderRadius: 8, background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.22)', fontSize: 12, color: 'var(--ds-text-secondary)', lineHeight: 1.45 }}>
        SOL trades are wallet-signed. Funding Phantom enables manual Jupiter swaps; it does not authorize unattended OTA spending.
      </div>

      {/* FROM */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--ds-text-secondary)' }}>
          <span>From</span>
          {connected && fromPair === 'SOL' && solBalance != null && (
            <span>Balance: <strong style={{ color: 'var(--ds-text-primary)' }}>{solBalance.toFixed(4)} SOL</strong>
              {prices.SOL ? ` = $${(solBalance * prices.SOL).toFixed(2)}` : ''}
              {availableSolForSwap != null ? ` | usable ${availableSolForSwap.toFixed(4)} SOL` : ''}
            </span>
          )}
        </div>
        <div style={{ padding: '10px 12px', border: '1px solid var(--ds-border-color,#27272a)', borderRadius: 10, background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
            <SolTokenIcon symbol={fromPair} size={24} />
            <input type="number" min="0" placeholder="0.0" value={fromAmount}
              onChange={e => { setFromAmount(e.target.value); setQuote(null); setQuoteUpdatedAt(null); }}
              style={{ flex: '1 1 0', minWidth: 0, width: 0, border: 'none', background: 'transparent', fontSize: 20, fontWeight: 600, outline: 'none', color: 'var(--ds-text-primary,#e2e8f0)' }} />
            <TokenSelectorSol variant="token" value={fromPair}
              onChange={v => { setFromPair(v); setFromAmount(''); setQuote(null); setQuoteUpdatedAt(null); }} label="Token from" />
          </div>
          {usdIn > 0 && <div style={{ fontSize: 11, color: 'var(--ds-text-secondary)', paddingLeft: 30 }}>≈ ${usdIn.toFixed(2)} USD</div>}
        </div>
        {/* % buttons */}
        {connected && fromPair === 'SOL' && solBalance != null && (
          <div style={{ display: 'flex', gap: 6 }}>
            {PCT_OPTS.map(p => (
              <button key={p} type="button" onClick={() => handlePct(p)}
                style={{ flex: 1, padding: '3px 0', fontSize: 11, fontWeight: 600, border: '1px solid var(--ds-border-color,#27272a)', borderRadius: 5, background: 'transparent', color: 'var(--ds-text-secondary)', cursor: 'pointer' }}>
                {p === 100 ? 'MAX' : `${p}%`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Flip */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button type="button" onClick={handleFlip}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--ds-border-color,#27272a)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--ds-text-secondary)', display: 'flex', alignItems: 'center' }}>
          <ArrowDownUp size={16} />
        </button>
      </div>

      {/* TO */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>You receive (estimated)</div>
        <div style={{ padding: '10px 12px', borderRadius: 10, background: impactHigh ? 'rgba(239,68,68,0.04)' : 'rgba(20,241,149,0.03)', border: `1px solid ${impactHigh ? 'rgba(239,68,68,0.25)' : 'rgba(20,241,149,0.12)'}`, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
            <SolTokenIcon symbol={toPair} size={24} />
            <div style={{ flex: 1, fontSize: 20, fontWeight: 600, color: impactHigh ? '#f87171' : quoteLoading ? '#475569' : outAmount != null ? '#14f195' : 'var(--ds-text-secondary)' }}>
              {impactHigh ? <span style={{ fontSize: 14, fontWeight: 500 }}>⛔ Blocked</span>
                : quoteLoading ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> …</span>
                : outAmount != null ? outAmount.toFixed(6) : '0.0'}
            </div>
            <TokenSelectorSol variant="token" value={toPair}
              onChange={v => { setToPair(v); setQuote(null); setQuoteUpdatedAt(null); }} label="Token to" />
          </div>
          {impactHigh
            ? <div style={{ fontSize: 11, color: '#f87171', paddingLeft: 30 }}>Price impact too high — reduce amount</div>
            : outAmount != null && usdOut > 0 && (
              <div style={{ fontSize: 11, color: '#14f195', paddingLeft: 30 }}>≈ ${usdOut.toFixed(2)} USD</div>
            )}
        </div>
      </div>

      {/* Info box */}
      {(exchangeRate || quote) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--ds-border-color,#27272a)', fontSize: 12 }}>
          {exchangeRate && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ds-text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><TrendingUp size={11} /> Rate</span>
              <strong style={{ color: 'var(--ds-text-primary)' }}>1 {fromPair} = {exchangeRate} {toPair}</strong>
            </div>
          )}
          {routeLabel && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--ds-text-secondary)', fontSize: 11 }}>Best route</span>
              <span style={{ fontSize: 11, background: 'rgba(20,241,149,0.12)', color: '#14f195', padding: '1px 7px', borderRadius: 4, fontWeight: 600 }}>{routeLabel}</span>
            </div>
          )}
          {quoteAgeLabel && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: quoteIsStale ? '#eab308' : 'var(--ds-text-secondary)', fontSize: 11 }}>Quote age</span>
              <strong style={{ color: quoteIsStale ? '#eab308' : 'var(--ds-text-primary)', fontSize: 12 }}>{quoteAgeLabel}</strong>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--ds-text-secondary)' }}>Slippage:</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {SLIPPAGE_OPTS.map(o => (
                <button key={o.label} type="button" onClick={() => setSlippage(o.label)}
                  style={{ padding: '2px 7px', borderRadius: 4, border: `1px solid ${slippage === o.label ? 'rgba(20,241,149,0.6)' : 'var(--ds-border-color,#27272a)'}`, background: slippage === o.label ? 'rgba(20,241,149,0.15)' : 'transparent', color: slippage === o.label ? '#14f195' : 'var(--ds-text-secondary)', cursor: 'pointer', fontSize: 11, fontWeight: slippage === o.label ? 600 : 400 }}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          {priceImpact != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: impactHigh ? '#f87171' : impactDanger ? '#eab308' : '#22c55e' }}>
                <Info size={11} /> Price impact
              </span>
              <strong style={{ color: impactHigh ? '#f87171' : impactDanger ? '#eab308' : '#22c55e', fontSize: 12 }}>
                {priceImpact.toFixed(2)}%
              </strong>
            </div>
          )}
        </div>
      )}

      {/* High impact banner */}
      {impactHigh && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)', fontSize: 12, lineHeight: 1.5, color: '#fca5a5' }}>
          ⛔ <strong>Price impact {priceImpact?.toFixed(1)}% — SWAP BLOCKED</strong><br />
          You would lose ~${(usdIn - usdOut).toFixed(2)} USD. Try a smaller amount.
        </div>
      )}

      {insufficientSolBalance && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.35)', fontSize: 12, lineHeight: 1.5, color: '#fca5a5' }}>
          Keep at least {MIN_SOL_FEE_BUFFER} SOL in Phantom for Solana network fees. Lower the amount or add SOL.
        </div>
      )}

      {/* Error / Success */}
      {error && <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 12, color: '#f87171' }}>{error}</div>}
      {txSig && (
        <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(20,241,149,0.08)', border: '1px solid rgba(20,241,149,0.3)', fontSize: 12, color: '#14f195', display: 'flex', alignItems: 'center', gap: 8 }}>
          ✅ Swap confirmed!{' '}
          <a href={`https://explorer.solana.com/tx/${txSig}`} target="_blank" rel="noopener noreferrer"
            style={{ color: '#14f195', display: 'flex', alignItems: 'center', gap: 4 }}>
            View tx <ExternalLink size={11} />
          </a>
        </div>
      )}

      {/* Swap / Connect button */}
      {!connected ? (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(20,241,149,0.06)', border: '1px solid rgba(20,241,149,0.2)', fontSize: 13, color: 'var(--ds-text-secondary)', textAlign: 'center' }}>
          Connect your Solana wallet (Phantom / Backpack) to swap
        </div>
      ) : (
        <button type="button" disabled={!canSwap} onClick={handleSwap}
          style={{ width: '100%', padding: '13px', borderRadius: 10, border: 'none', background: canSwap ? 'linear-gradient(135deg, #14f195, #0ea870)' : 'rgba(255,255,255,0.06)', color: canSwap ? '#000' : '#fff', fontWeight: 700, fontSize: 15, cursor: canSwap ? 'pointer' : 'not-allowed', opacity: canSwap ? 1 : 0.55, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
          {loading ? 'Swapping…' : `Swap ${fromPair} → ${toPair}`}
        </button>
      )}

      <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--ds-text-secondary)', opacity: 0.6 }}>
        Powered by Jupiter · Solana mainnet
      </div>
    </div>
  );
}
