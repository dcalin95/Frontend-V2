/**
 * SymphonySwapPanel.jsx – Swap via Symphony SDK on Sei EVM (chain 1329).
 * Wallet: MetaMask or Trust on Sei only. Not Compass/Keplr (those are for Astroport).
 * @see docs/SEI_DEX_AND_AGGREGATORS.md
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ethers } from 'ethers';
import { switchToSeiNetwork, fetchTokenBalance } from '../clob-sei/services/clobTradeService';
import { pickEvmProvider } from '../utils/evmProviderResolver.js';
import { SEI_EVM_TOKENS } from '../clob-sei/config';
import {
  getSymphonyTokenAddress,
  getSymphonyRoute,
  createSeiWalletClient,
  executeSymphonySwap,
} from './services/symphonySeiService';

const SYMPHONY_TOKENS = [
  { symbol: 'SEI', label: 'SEI (native)', address: '0x0', decimals: 18 },
  { symbol: 'wSEI', label: 'WSEI', address: null, decimals: 18 },
  { symbol: 'USDC', label: 'USDC', address: null, decimals: 6 },
  { symbol: 'USDT', label: 'USDT', address: null, decimals: 6 },
  { symbol: 'WETH', label: 'WETH', address: null, decimals: 18 },
].map(t => ({
  ...t,
  address: t.address || getSymphonyTokenAddress(t.symbol),
  decimals: t.decimals ?? SEI_EVM_TOKENS[t.symbol]?.decimals ?? 18,
})).filter(t => t.address);

const PCT_OPTS = [25, 50, 75, 100];

export default function SymphonySwapPanel() {
  const [walletClient, setWalletClient] = useState(null);
  const [account, setAccount] = useState(null);
  const [evmConnecting, setEvmConnecting] = useState(false);
  const [evmError, setEvmError] = useState(null);

  const [fromSymbol, setFromSymbol] = useState('wSEI');
  const [toSymbol, setToSymbol] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [swapLoading, setSwapLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [swapError, setSwapError] = useState(null);
  const [fromBalance, setFromBalance] = useState(null);
  const [fromBalanceLoading, setFromBalanceLoading] = useState(false);

  useEffect(() => {
    if (!account || !fromSymbol) {
      setFromBalance(null);
      return;
    }
    setFromBalanceLoading(true);
    const token = SYMPHONY_TOKENS.find(t => t.symbol === fromSymbol);
    if (!token) {
      setFromBalance(null);
      setFromBalanceLoading(false);
      return;
    }
    const run = async () => {
      try {
        if (fromSymbol === 'SEI') {
          const provider = pickEvmProvider();
          if (!provider) {
            setFromBalance('0');
            return;
          }
          const web3 = new ethers.providers.Web3Provider(provider);
          const bal = await web3.getBalance(account);
          setFromBalance(ethers.utils.formatUnits(bal, 18));
        } else {
          const bal = await fetchTokenBalance(token.address, account, token.decimals);
          setFromBalance(bal ?? '0');
        }
      } catch {
        setFromBalance('0');
      } finally {
        setFromBalanceLoading(false);
      }
    };
    run();
  }, [account, fromSymbol]);

  const connectEvmForSymphony = useCallback(async () => {
    setEvmError(null);
    setEvmConnecting(true);
    try {
      await switchToSeiNetwork();
      const provider = pickEvmProvider();
      if (!provider) {
        setEvmError('No EVM wallet (MetaMask/Trust) found. Install one and connect in the header.');
        return;
      }
      const result = await createSeiWalletClient(provider);
      if (result) {
        setWalletClient(result.walletClient);
        setAccount(result.account);
      } else {
        setEvmError('Could not get EVM address. Connect MetaMask/Trust to Sei (chain 1329).');
      }
    } catch (e) {
      setEvmError(e?.message ?? 'Failed to connect EVM to Sei');
    } finally {
      setEvmConnecting(false);
    }
  }, []);

  const formatAmount = (val) => {
    if (val <= 0) return '0';
    if (val < 1e-6) return '0';
    return Number(val.toFixed(8)).toString();
  };

  const handlePct = useCallback((pct) => {
    const bal = fromBalance != null ? parseFloat(fromBalance) : 0;
    if (bal <= 0) {
      setAmount('0');
      setQuote(null);
      return;
    }
    let value = (bal * pct) / 100;
    if (pct === 100 && fromSymbol === 'SEI') {
      value = Math.max(0, value - 0.001);
    }
    setAmount(formatAmount(value));
    setQuote(null);
  }, [fromBalance, fromSymbol]);

  const fetchQuote = useCallback(async () => {
    const tokenIn = getSymphonyTokenAddress(fromSymbol === 'SEI' ? 'SEI' : fromSymbol);
    const tokenOut = getSymphonyTokenAddress(toSymbol === 'SEI' ? 'SEI' : toSymbol);
    if (!tokenIn || !tokenOut || !amount || Number(amount) <= 0) {
      setQuote(null);
      return;
    }
    setQuoteLoading(true);
    setQuote(null);
    setSwapError(null);
    try {
      const result = await getSymphonyRoute(tokenIn, tokenOut, amount);
      setQuote(result);
    } catch (e) {
      setQuote(null);
      setSwapError(e?.message ?? 'Quote failed');
    } finally {
      setQuoteLoading(false);
    }
  }, [fromSymbol, toSymbol, amount]);

  const handleSwap = useCallback(async () => {
    if (!quote?.route || !walletClient) {
      setSwapError('Get a quote first and connect wallet to Sei.');
      return;
    }
    setSwapLoading(true);
    setSwapError(null);
    setTxHash(null);
    try {
      const result = await executeSymphonySwap(quote.route, walletClient, 100);
      if (result.success) {
        setTxHash(result.txHash);
        setAmount('');
        setQuote(null);
      } else {
        setSwapError(result.error ?? 'Swap failed');
      }
    } catch (e) {
      setSwapError(e?.message ?? 'Swap failed');
    } finally {
      setSwapLoading(false);
    }
  }, [quote, walletClient]);

  const fromToken = SYMPHONY_TOKENS.find(t => t.symbol === fromSymbol);
  const toToken = SYMPHONY_TOKENS.find(t => t.symbol === toSymbol);
  const canQuote = fromToken && toToken && fromSymbol !== toSymbol && amount && Number(amount) > 0;
  const canSwap = quote && walletClient && !swapLoading;
  const hasBalance = account && fromBalance != null && parseFloat(fromBalance) > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>Amount to swap</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="number"
            min="0"
            step="any"
            placeholder="0"
            value={amount}
            onChange={e => { setAmount(e.target.value); setQuote(null); }}
            style={{
              width: 120,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--ds-border-color,#27272a)',
              background: 'rgba(255,255,255,0.02)',
              color: 'var(--ds-text-primary)',
              fontSize: 14,
            }}
          />
          <span style={{ fontSize: 12, color: 'var(--ds-text-tertiary)' }}>or</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {PCT_OPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePct(p)}
                title={hasBalance ? `${p === 100 ? 'MAX' : p + '%'} of balance` : 'Connect wallet & switch to Sei to see balance; % will apply then'}
                style={{
                  padding: '6px 10px',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: '1px solid var(--ds-border-color,#27272a)',
                  background: hasBalance ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                  color: hasBalance ? '#a5b4fc' : 'var(--ds-text-tertiary)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = hasBalance ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = hasBalance ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)'; }}
              >
                {p === 100 ? 'MAX' : `${p}%`}
              </button>
            ))}
          </div>
        </div>
        {account && fromBalance != null && (
          <span style={{ fontSize: 11, color: 'var(--ds-text-tertiary)' }}>
            Balance: {fromBalanceLoading ? '…' : `${Number(fromBalance).toFixed(6)} ${fromToken?.label ?? fromSymbol}`}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>From token</label>
        <select
          value={fromSymbol}
          onChange={e => { setFromSymbol(e.target.value); setQuote(null); }}
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--ds-border-color,#27272a)',
            background: 'var(--ds-bg-surface)',
            color: 'var(--ds-text-primary)',
            fontSize: 13,
          }}
        >
          {SYMPHONY_TOKENS.map(t => (
            <option key={t.symbol} value={t.symbol}>{t.label}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>To token</label>
        <select
          value={toSymbol}
          onChange={e => { setToSymbol(e.target.value); setQuote(null); }}
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--ds-border-color,#27272a)',
            background: 'var(--ds-bg-surface)',
            color: 'var(--ds-text-primary)',
            fontSize: 13,
          }}
        >
          {SYMPHONY_TOKENS.filter(t => t.symbol !== fromSymbol).map(t => (
            <option key={t.symbol} value={t.symbol}>{t.label}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          onClick={fetchQuote}
          disabled={!canQuote || quoteLoading}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid var(--ds-border-color)',
            background: 'rgba(99,102,241,0.15)',
            color: '#a5b4fc',
            fontSize: 13,
            fontWeight: 600,
            cursor: canQuote && !quoteLoading ? 'pointer' : 'not-allowed',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {quoteLoading ? <Loader2 size={14} className="spin" /> : null}
          Get quote
        </button>
        {quote && (
          <span style={{ fontSize: 13, color: 'var(--ds-text-secondary)' }}>
            You receive: <strong style={{ color: '#22c55e' }}>{quote.amountOutFormatted} {toToken?.label ?? toSymbol}</strong>
          </span>
        )}
      </div>

      {quote && (
        <button
          type="button"
          onClick={handleSwap}
          disabled={!canSwap}
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            border: 'none',
            background: walletClient ? '#22c55e' : 'var(--ds-border-color)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: canSwap ? 'pointer' : 'not-allowed',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {swapLoading ? <Loader2 size={16} className="spin" /> : null}
          Swap via Symphony
        </button>
      )}

      {swapError && <p style={{ fontSize: 12, color: '#f87171' }}>{swapError}</p>}
      {txHash && (
        <p style={{ fontSize: 12, color: '#22c55e' }}>
          Success! <a href={`https://seitrace.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ color: '#818cf8' }}>View tx</a>
        </p>
      )}

      {!account && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', margin: 0 }}>
            This form uses <strong>Sei EVM</strong> (MetaMask/Trust on chain 1329). Connect below to use it. The <strong>embed</strong> under the form supports <strong>Keplr on Sei</strong> — you can connect Keplr there instead.
          </p>
          <button
            type="button"
            onClick={connectEvmForSymphony}
            disabled={evmConnecting}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--ds-accent,#6366f1)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              cursor: evmConnecting ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              letterSpacing: '-0.01em',
            }}
            aria-label="Connect EVM wallet on Sei for Symphony"
          >
            {evmConnecting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {evmConnecting ? 'Connecting…' : 'Connect Wallet (MetaMask/Trust on Sei)'}
          </button>
          {evmError && <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{evmError}</p>}
        </div>
      )}
      {account && (
        <p style={{ fontSize: 11, color: 'var(--ds-text-tertiary)' }}>
          Connected: {account.slice(0, 6)}…{account.slice(-4)} (Sei EVM)
        </p>
      )}
    </div>
  );
}
