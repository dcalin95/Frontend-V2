/**
 * ClobSeiTradePage – Trade CLOB pe Sei (Oxium-style, Mangrove).
 * Layout proporțional: Chart | OrderBook | Form (3 coloane, aceeași înălțime).
 * Wallet: MetaMask / EVM injected pe Sei (chain ID 1329).
 * UI: English only (docs/DEX_UI_LANGUAGE.md).
 * Modes: Beginner (guided, with hints) / Expert (clean UI).
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { pickEvmProvider } from '../../utils/evmProviderResolver.js';
import ErrorBoundary from '../../common/ErrorBoundary';
import { useClobSeiOrderBook } from '../../clob-sei/hooks/useClobSeiOrderBook';
import { useClobSeiUserLifecycle } from '../../clob-sei/hooks/useClobSeiUserLifecycle';
import { useClobSeiMarket } from '../../clob-sei/context/ClobSeiMarketContext';
import ClobSeiOrderBook from '../../clob-sei/components/ClobSeiOrderBook';
import { ClobSeiHint, ClobSeiStep } from '../../clob-sei/components/ClobSeiBeginnerHints';
import {
  CLOB_SEI_CHAIN_ID,
  CLOB_CHART_SYMBOL_BY_MARKET,
  CLOB_SEI_TX_EXPLORER_BASE,
  CLOB_SEI_MARKETS,
} from '../../clob-sei/config';
import { CLOB_MARKET_SLIPPAGE_FRACTION } from '../../clob-sei/constants';
import {
  getEvmSigner,
  fetchTokenBalance,
  executeMarketOrder,
  executeLimitOrder,
  tickToPrice,
  switchToSeiNetwork,
  assertMarketReferencePrices,
} from '../../clob-sei/services/clobTradeService';
import {
  CLOB_SEI_CHART_SOURCE_TITLE,
  CLOB_SEI_CHART_SOURCE_DESCRIPTION,
  CLOB_SEI_BOOK_SOURCE_BADGE,
} from '../../clob-sei/clobSeiLabels';
import ClobSeiLifecyclePanel from '../../clob-sei/components/ClobSeiLifecyclePanel';
import { appendClobSeiActivity, loadClobSeiActivity } from '../../clob-sei/services/clobSeiActivityStorage';
import { shortAddr, fmtBalance, fmtMidPrice } from '../../clob-sei/utils/clobSeiFormat';
import TradingViewChart from '../components/common/TradingViewChart';
import OtaBscAutoStatusBanner from '../components/ai-trading/OtaBscAutoStatusBanner';
import '../styles/components/clob-sei-page.css';

const SLIPPAGE_PCT_LABEL = Math.round(CLOB_MARKET_SLIPPAGE_FRACTION * 100);

export default function ClobSeiTradePage() {
  const { marketId } = useClobSeiMarket();
  const [orderType, setOrderType] = useState('market');
  const [side, setSide]           = useState('buy');
  const [amount, setAmount]       = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastTxHash, setLastTxHash] = useState(null);
  const [activityLog, setActivityLog] = useState(() => loadClobSeiActivity());

  // Wallet
  const [walletAddress, setWalletAddress] = useState(null);
  const [connecting, setConnecting]       = useState(false);
  const [switching, setSwitching]         = useState(false);
  const [walletChainId, setWalletChainId] = useState(null);

  // Balances
  const [baseBalance, setBaseBalance]   = useState('0');
  const [quoteBalance, setQuoteBalance] = useState('0');

  // Beginner / Expert mode (persisted in localStorage)
  const [beginnerMode, setBeginnerMode] = useState(() => {
    try { return localStorage.getItem('clob-sei-mode') !== 'expert'; }
    catch { return true; }
  });

  const toggleMode = useCallback(() => {
    setBeginnerMode((prev) => {
      const next = !prev;
      try { localStorage.setItem('clob-sei-mode', next ? 'beginner' : 'expert'); } catch {}
      return next;
    });
  }, []);

  const { asks, bids, loading, error, refresh, market, isEmptyBook } = useClobSeiOrderBook(marketId);

  const {
    openOrders: chainOpenOrders,
    mangroveCoreActivity,
    mangroveOrderEvents,
    sessionTagged,
    loading: lifecycleLoading,
    error: lifecycleError,
    refresh: refreshUserLifecycle,
    retractOpenOffer,
    cancelling: retractCancelling,
  } = useClobSeiUserLifecycle(walletAddress, CLOB_SEI_MARKETS, {
    enabled: Boolean(walletAddress),
    sessionEntries: activityLog,
  });
  const chartSymbol = useMemo(
    () => CLOB_CHART_SYMBOL_BY_MARKET[marketId] || 'BINANCE:SEIUSDT',
    [marketId]
  );
  const baseSymbol  = market?.base  ?? 'wSEI';
  const quoteSymbol = market?.quote ?? 'USDC';

  const bestAskPrice = useMemo(() => {
    if (!asks.length) return null;
    return tickToPrice(asks[0].tick);
  }, [asks]);

  const bestBidPrice = useMemo(() => {
    if (!bids.length) return null;
    return 1 / (tickToPrice(bids[0].tick) || 1);
  }, [bids]);

  const midPrice = useMemo(() => {
    if (bestAskPrice && bestBidPrice) return ((bestAskPrice + bestBidPrice) / 2);
    return bestAskPrice ?? bestBidPrice ?? null;
  }, [bestAskPrice, bestBidPrice]);

  const spread = useMemo(() => {
    if (!bestAskPrice || !bestBidPrice) return null;
    return bestAskPrice - bestBidPrice;
  }, [bestAskPrice, bestBidPrice]);

  const spreadPct = useMemo(() => {
    if (!spread || !bestBidPrice) return null;
    return ((spread / bestBidPrice) * 100).toFixed(3);
  }, [spread, bestBidPrice]);

  /** Market order fără best price din book = blocat (fără fallback artificial). */
  const marketOrderBlockedNoLiquidity = useMemo(() => {
    if (orderType !== 'market') return false;
    if (side === 'buy') {
      return bestAskPrice == null || !Number.isFinite(bestAskPrice) || bestAskPrice <= 0;
    }
    return bestBidPrice == null || !Number.isFinite(bestBidPrice) || bestBidPrice <= 0;
  }, [orderType, side, bestAskPrice, bestBidPrice]);

  const estimatedCost = useMemo(() => {
    const n = Number(amount);
    if (!n || !bestAskPrice) return null;
    return (n * bestAskPrice).toFixed(4);
  }, [amount, bestAskPrice]);

  const estimatedReceive = useMemo(() => {
    const n = Number(amount);
    if (!n || !bestBidPrice) return null;
    return (n * bestBidPrice).toFixed(4);
  }, [amount, bestBidPrice]);

  // Detect wallet already connected — același provider ca clobTradeService (pickEvmProvider), nu doar window.ethereum
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const eth = pickEvmProvider();
    if (!eth?.request) return;
    eth
      .request({ method: 'eth_accounts' })
      .then((a) => {
        if (a[0]) setWalletAddress(a[0]);
      })
      .catch(() => {});
    eth
      .request({ method: 'eth_chainId' })
      .then((h) => setWalletChainId(parseInt(h, 16)))
      .catch(() => {});

    const onAccounts = (a) => setWalletAddress(a[0] || null);
    const onChain = (h) => setWalletChainId(parseInt(h, 16));
    if (typeof eth.on === 'function') {
      eth.on('accountsChanged', onAccounts);
      eth.on('chainChanged', onChain);
      return () => {
        eth.removeListener?.('accountsChanged', onAccounts);
        eth.removeListener?.('chainChanged', onChain);
      };
    }
    return undefined;
  }, []);

  // Fetch balances (cleanup: ignoră rezultat dacă s-a schimbat piața în timpul requestului)
  useEffect(() => {
    if (!walletAddress || !market?.outboundAddress || !market?.inboundAddress) return;
    let cancelled = false;
    (async () => {
      try {
        const [base, quote] = await Promise.all([
          fetchTokenBalance(market.outboundAddress, walletAddress, market.baseDecimals),
          fetchTokenBalance(market.inboundAddress, walletAddress, market.quoteDecimals),
        ]);
        if (!cancelled) {
          setBaseBalance(base);
          setQuoteBalance(quote);
        }
      } catch {
        if (!cancelled) {
          setBaseBalance('0');
          setQuoteBalance('0');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    walletAddress,
    market?.id,
    market?.outboundAddress,
    market?.inboundAddress,
    market?.baseDecimals,
    market?.quoteDecimals,
  ]);

  const connectWallet = useCallback(async () => {
    setConnecting(true);
    try {
      const signer = await getEvmSigner();
      const addr   = await signer.getAddress();
      setWalletAddress(addr);
      toast.success(`Wallet connected: ${shortAddr(addr)}`);
    } catch (err) {
      toast.error(err?.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  }, []);

  const isWrongChain = Boolean(walletAddress && walletChainId !== Number(CLOB_SEI_CHAIN_ID));

  const handleSwitchNetwork = useCallback(async () => {
    setSwitching(true);
    try {
      await switchToSeiNetwork();
      const raw = pickEvmProvider();
      if (raw?.request) {
        const hex = await raw.request({ method: 'eth_chainId' });
        setWalletChainId(parseInt(hex, 16));
      }
      toast.success('Switched to Sei EVM network!');
    } catch (err) {
      toast.error(err?.message || 'Failed to switch network');
    } finally {
      setSwitching(false);
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) { toast.warn('Enter a valid amount.'); return; }
    if (orderType === 'limit' && (!limitPrice || Number(limitPrice) <= 0)) {
      toast.warn('Enter a valid limit price.'); return;
    }
    if (!walletAddress) { toast.warn('Connect your EVM wallet first.'); return; }
    if (isWrongChain) {
      toast.warn(`Switch to Sei EVM (chain ${CLOB_SEI_CHAIN_ID}) before placing an order.`);
      return;
    }
    if (orderType === 'market') {
      try {
        assertMarketReferencePrices(side, bestAskPrice, bestBidPrice);
      } catch (err) {
        toast.error(err?.message || 'Cannot place market order without best bid/ask from the order book.');
        return;
      }
    }

    setSubmitting(true);
    setLastTxHash(null);
    try {
      const signer = await getEvmSigner();
      const result = orderType === 'market'
        ? await executeMarketOrder({ market, side, amountBase: amount, bestAskPrice, bestBidPrice, signer })
        : await executeLimitOrder({ market, side, amountBase: amount, limitPrice, signer });

      setLastTxHash(result.txHash);
      setActivityLog(
        appendClobSeiActivity({
          txHash: result.txHash,
          marketId: market.id,
          side,
          orderType,
          baseSymbol,
          quoteSymbol,
          offerId: result.offerId || null,
        }),
      );
      toast.success(
        <span>
          ✓ Order confirmed!{' '}
          <a
            href={`${CLOB_SEI_TX_EXPLORER_BASE}/${result.txHash}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: '#6366f1', textDecoration: 'underline' }}
          >
            View on explorer
          </a>
        </span>
      );
      setAmount('');
      setLimitPrice('');
      refresh();
      refreshUserLifecycle();
      setTimeout(() => {
        fetchTokenBalance(market.outboundAddress, walletAddress, market.baseDecimals).then(setBaseBalance);
        fetchTokenBalance(market.inboundAddress,  walletAddress, market.quoteDecimals).then(setQuoteBalance);
      }, 2000);
    } catch (err) {
      console.error('[clob-sei] order error:', err);
      const msg = err?.reason || err?.data?.message || err?.message || 'Order failed';
      toast.error(msg.length > 120 ? msg.slice(0, 120) + '…' : msg);
    } finally {
      setSubmitting(false);
    }
  }, [
    amount,
    limitPrice,
    orderType,
    side,
    market,
    walletAddress,
    bestAskPrice,
    bestBidPrice,
    refresh,
    isWrongChain,
    baseSymbol,
    quoteSymbol,
    refreshUserLifecycle,
  ]);

  return (
    <div className={`clob-sei-trade-page${beginnerMode ? ' clob-sei--beginner' : ''}`}>
      <div style={{ padding: '12px 16px 0', maxWidth: 1600, margin: '0 auto', boxSizing: 'border-box' }}>
        <OtaBscAutoStatusBanner variant="crossChain" />
      </div>

      {/* ── Page header ── */}
      <header className="clob-sei-page-header">
        <span className="clob-sei-page-title">
          {baseSymbol}/{quoteSymbol}
        </span>
        <span className="clob-sei-header-badge">CLOB · Mangrove · Sei EVM</span>
        {midPrice && (
          <div className="clob-sei-mid-price">
            <span>Mid</span>
            <strong className="clob-sei-mid-price__value">{fmtMidPrice(midPrice)}</strong>
            <span className="clob-sei-mid-price__quote">{quoteSymbol}</span>
          </div>
        )}
        {spreadPct && (
          <div className="clob-sei-spread-info">
            Spread <span className="clob-sei-spread-info__val">{spreadPct}%</span>
          </div>
        )}

        {/* ── Mode toggle ── */}
        <button
          type="button"
          className={`clob-sei-mode-toggle${beginnerMode ? ' clob-sei-mode-toggle--beginner' : ''}`}
          onClick={toggleMode}
          title={beginnerMode ? 'Switch to Expert mode (clean UI, no hints)' : 'Switch to Beginner mode (guided UI with explanations)'}
        >
          <span className="clob-sei-mode-toggle__icon">{beginnerMode ? '🎓' : '⚡'}</span>
          <span className="clob-sei-mode-toggle__label">{beginnerMode ? 'Beginner' : 'Expert'}</span>
        </button>
      </header>

      {/* ── Beginner: Getting Started banner ── */}
      {beginnerMode && (
        <div className="clob-sei-guide-banner">
          <div className="clob-sei-guide-banner__title">
            📖 How to trade on CLOB — Step by step
          </div>
          <div className="clob-sei-guide-banner__steps">
            <ClobSeiStep n="1" text="Install MetaMask (browser extension) if you don't have it." />
              <ClobSeiStep n="2" text={'Click "Connect wallet" → MetaMask opens → confirm connection.'} />
              <ClobSeiStep n="3" text={'If wrong network, click "Switch to Sei EVM" → confirm in MetaMask.'} />
            <ClobSeiStep n="4" text="Choose Market or Limit order, pick Buy or Sell, enter the amount." />
            <ClobSeiStep n="5" text="Click the Buy / Sell button → approve the transaction in MetaMask → done!" />
          </div>
          <div className="clob-sei-guide-banner__note">
            💡 <strong>What is CLOB?</strong> Unlike a regular Swap (where you trade against a liquidity pool), a CLOB (Central Limit Order Book) works like a stock exchange — buyers and sellers post orders at specific prices, and the system matches them automatically. Your orders are executed on-chain via{' '}
            <a href="https://docs.mangrove.exchange/" target="_blank" rel="noreferrer">Mangrove Protocol</a>.
          </div>
        </div>
      )}

      {/* ── 3-column grid ── */}
      <div className="clob-sei-grid">

        {/* ── Chart ── */}
        <section className="clob-sei-card clob-sei-card--chart" aria-label="Price chart">
          <div className="clob-sei-card-header">
            <span className="clob-sei-card-label">{CLOB_SEI_CHART_SOURCE_TITLE} · {chartSymbol}</span>
          </div>
          <p className="clob-sei-source-note" data-testid="clob-sei-chart-source-note">
            {CLOB_SEI_CHART_SOURCE_DESCRIPTION}
          </p>
          {beginnerMode && (
            <ClobSeiHint>
              This chart shows the real-time price of <strong>{baseSymbol}</strong> in USDT (from Binance).
              Use it to identify trends before placing your order. Green candles = price went up, red candles = price went down.
            </ClobSeiHint>
          )}
          <div className="clob-sei-chart-body">
            <ErrorBoundary
              fallback={
                <div style={{ padding: 24, color: 'var(--c-text-sec)' }}>
                  Chart unavailable. Check TradingView connectivity.
                </div>
              }
            >
              <TradingViewChart
                symbol={chartSymbol}
                interval="60"
                theme="dark"
                height="100%"
                autosize
              />
            </ErrorBoundary>
          </div>
        </section>

        {/* ── Order Book ── */}
        <div className="clob-sei-card clob-sei-card--book">
          <div className="clob-sei-card-header">
            <span className="clob-sei-card-label">
              Order book · <span className="clob-sei-source-pill">{CLOB_SEI_BOOK_SOURCE_BADGE}</span>
            </span>
            <button
              type="button"
              className="clob-sei-refresh-btn"
              onClick={refresh}
              aria-label="Refresh order book"
            >
              ↻ Refresh
            </button>
          </div>
          {beginnerMode && (
            <ClobSeiHint icon="📋">
              <strong>Asks (red)</strong> = people who want to <em>sell</em> {baseSymbol} at that price.{' '}
              <strong>Bids (green)</strong> = people who want to <em>buy</em> {baseSymbol}.{' '}
              The gap between lowest ask and highest bid is the <strong>spread</strong> — a smaller spread means a healthier market.
              If the book is empty, no one has posted orders yet.
            </ClobSeiHint>
          )}
          <div className="clob-sei-book-body">
            <ClobSeiOrderBook
              asks={asks}
              bids={bids}
              loading={loading}
              error={error}
              baseSymbol={baseSymbol}
              quoteSymbol={quoteSymbol}
              baseDecimals={market?.baseDecimals  ?? 18}
              quoteDecimals={market?.quoteDecimals ?? 6}
            />
          </div>
        </div>

        {/* ── Place Order ── */}
        <div className="clob-sei-card clob-sei-card--form">

          {/* Wallet bar */}
          <div className="clob-sei-wallet-bar">
            <span className="clob-sei-card-label">Place Order</span>
            {walletAddress ? (
              isWrongChain ? (
                <button
                  type="button"
                  className="clob-sei-switch-btn"
                  onClick={handleSwitchNetwork}
                  disabled={switching}
                  title={`Switch MetaMask to Sei EVM (chain ${CLOB_SEI_CHAIN_ID})`}
                >
                  {switching ? 'Switching…' : '⚠ Switch to Sei EVM'}
                </button>
              ) : (
                <span className="clob-sei-wallet-status">
                  <span className="clob-sei-wallet-dot" />
                  {shortAddr(walletAddress)}
                </span>
              )
            ) : (
              <button
                type="button"
                className="clob-sei-connect-btn"
                onClick={connectWallet}
                disabled={connecting}
              >
                {connecting ? 'Connecting…' : 'Connect wallet'}
              </button>
            )}
          </div>

          {/* Beginner: wallet explanation */}
          {beginnerMode && !walletAddress && (
            <ClobSeiHint icon="🦊">
              You need <strong>MetaMask</strong> (EVM wallet) to place orders.
              Click <em>"Connect wallet"</em> above — MetaMask will open and ask for permission.
              Your Cosmos wallet (Keplr/Compass) is <strong>not</strong> compatible with this page.
            </ClobSeiHint>
          )}
          {beginnerMode && walletAddress && isWrongChain && (
            <ClobSeiHint icon="🔗">
              Your wallet is connected but on the <strong>wrong network</strong>.
              Click <em>&quot;Switch to Sei EVM&quot;</em> above — MetaMask will automatically add and switch to the Sei EVM network (chain {CLOB_SEI_CHAIN_ID}). Just confirm.
            </ClobSeiHint>
          )}

          {/* Balances */}
          {walletAddress && (
            <div className="clob-sei-balances">
              <div className="clob-sei-balance-item">
                <span className="clob-sei-balance-label">{baseSymbol}</span>
                <span className="clob-sei-balance-value">{fmtBalance(baseBalance)}</span>
              </div>
              <div className="clob-sei-balance-item">
                <span className="clob-sei-balance-label">{quoteSymbol}</span>
                <span className="clob-sei-balance-value">{fmtBalance(quoteBalance)}</span>
              </div>
              {beginnerMode && (
                <ClobSeiHint icon="💰">
                  Your token balances on Sei EVM. To <strong>buy</strong> {baseSymbol} you need {quoteSymbol}. To <strong>sell</strong> {baseSymbol} you need {baseSymbol} in your wallet.
                </ClobSeiHint>
              )}
            </div>
          )}

          {/* Scrollable form body */}
          <form
            className="clob-sei-form-body"
            onSubmit={handleSubmit}
            aria-label="Place order form"
          >
            <div className="clob-sei-form-section">

              {/* Order type */}
              <div className="clob-sei-type-toggle" role="group" aria-label="Order type">
                {['market', 'limit'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`clob-sei-tab-btn${orderType === t ? ' active' : ''}`}
                    onClick={() => setOrderType(t)}
                    aria-pressed={orderType === t}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {/* Beginner: order type explanation */}
              {beginnerMode && orderType === 'market' && (
                <ClobSeiHint icon="⚡">
                  <strong>Market order</strong> — executes immediately at the best available price.
                  {` Fast, but you may pay slightly more/less than the displayed price (up to ${SLIPPAGE_PCT_LABEL}% slippage protection).`}
                  Best for beginners.
                </ClobSeiHint>
              )}
              {beginnerMode && orderType === 'limit' && (
                <ClobSeiHint icon="🎯">
                  <strong>Limit order</strong> — you set the exact price you want to buy/sell at.
                  If someone matches your price, the order executes. Otherwise it stays in the book waiting.
                  Requires 0.1 SEI deposit (bounty) — returned when the order is filled or cancelled.
                </ClobSeiHint>
              )}

              {/* Buy / Sell */}
              <div className="clob-sei-side-group" role="group" aria-label="Side">
                <button
                  type="button"
                  className={`clob-sei-side-btn buy${side === 'buy' ? ' active' : ''}`}
                  onClick={() => setSide('buy')}
                  aria-pressed={side === 'buy'}
                >
                  Buy
                </button>
                <button
                  type="button"
                  className={`clob-sei-side-btn sell${side === 'sell' ? ' active' : ''}`}
                  onClick={() => setSide('sell')}
                  aria-pressed={side === 'sell'}
                >
                  Sell
                </button>
              </div>

              {/* Beginner: buy/sell explanation */}
              {beginnerMode && (
                <ClobSeiHint icon={side === 'buy' ? '🟢' : '🔴'}>
                  {side === 'buy'
                    ? `You will spend ${quoteSymbol} to receive ${baseSymbol}. You need ${quoteSymbol} in your wallet.`
                    : `You will give ${baseSymbol} and receive ${quoteSymbol}. You need ${baseSymbol} in your wallet.`}
                </ClobSeiHint>
              )}

              {/* Amount */}
              <div className="clob-sei-field">
                <div className="clob-sei-field-label">
                  <label htmlFor="clob-amount" className="clob-sei-field-label__main">
                    Amount ({baseSymbol})
                  </label>
                  {side === 'buy'  && estimatedCost    && <span className="clob-sei-field-label__hint">≈ {estimatedCost} {quoteSymbol}</span>}
                  {side === 'sell' && estimatedReceive && <span className="clob-sei-field-label__hint">≈ {estimatedReceive} {quoteSymbol}</span>}
                </div>
                <input
                  id="clob-amount"
                  className="clob-sei-input"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  aria-invalid={amount !== '' && (Number(amount) <= 0 || isNaN(Number(amount)))}
                />
                {beginnerMode && (
                  <ClobSeiHint icon="📝">
                    Enter the amount of <strong>{baseSymbol}</strong> you want to {side}.
                    {estimatedCost && side === 'buy' && ` At current price you'll pay ≈ ${estimatedCost} ${quoteSymbol}.`}
                    {estimatedReceive && side === 'sell' && ` At current price you'll receive ≈ ${estimatedReceive} ${quoteSymbol}.`}
                  </ClobSeiHint>
                )}
              </div>

              {/* Limit price */}
              {orderType === 'limit' && (
                <div className="clob-sei-field">
                  <div className="clob-sei-field-label">
                    <label htmlFor="clob-price" className="clob-sei-field-label__main">
                      Price ({quoteSymbol}/{baseSymbol})
                    </label>
                    {midPrice != null && (
                      <span className="clob-sei-field-label__hint">mid {fmtMidPrice(midPrice)}</span>
                    )}
                  </div>
                  <input
                    id="clob-price"
                    className="clob-sei-input"
                    type="text"
                    inputMode="decimal"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    placeholder={midPrice != null ? fmtMidPrice(midPrice) : '0.0'}
                  />
                  {beginnerMode && (
                    <ClobSeiHint icon="🏷️">
                      Set your desired price per {baseSymbol} in {quoteSymbol}.
                      {midPrice != null
                        ? ` Current mid price is ${fmtMidPrice(midPrice)} ${quoteSymbol}. Set lower to buy cheaper, higher to sell for more.`
                        : ' No active price data — check the order book first.'}
                    </ClobSeiHint>
                  )}
                </div>
              )}

              {/* Market info */}
              {orderType === 'market' && (
                <div className="clob-sei-market-info">
                  <span>
                    {side === 'buy' ? 'Best ask' : 'Best bid'}:{' '}
                    <span className="clob-sei-market-info__price">
                      {side === 'buy'
                        ? (bestAskPrice ? (bestAskPrice >= 100 ? bestAskPrice.toFixed(2) : bestAskPrice.toFixed(6)) : '—')
                        : (bestBidPrice ? (bestBidPrice >= 100 ? bestBidPrice.toFixed(2) : bestBidPrice.toFixed(6)) : '—')}
                    </span>
                  </span>
                  <span className="clob-sei-market-info__note">{SLIPPAGE_PCT_LABEL}% slippage</span>
                </div>
              )}
              {orderType === 'market' && marketOrderBlockedNoLiquidity && !error && (
                <p className="clob-sei-source-note clob-sei-source-note--warn" role="status">
                  Market order needs a best {side === 'buy' ? 'ask' : 'bid'} from the Mangrove book. {isEmptyBook ? 'Book is empty.' : 'Refresh the order book or wait for liquidity.'}
                </p>
              )}

              {/* Limit note */}
              {orderType === 'limit' && (
                <div className="clob-sei-limit-note">
                  ⚡ Resting limit order on Mangrove. Requires 0.1 SEI provision as bounty.
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className={`clob-sei-submit-btn clob-sei-submit-btn--${side}`}
                disabled={
                  submitting ||
                  !walletAddress ||
                  isWrongChain ||
                  !amount ||
                  Number(amount) <= 0 ||
                  Number.isNaN(Number(amount)) ||
                  (orderType === 'market' && marketOrderBlockedNoLiquidity) ||
                  (orderType === 'limit' &&
                    (!limitPrice || Number(limitPrice) <= 0 || Number.isNaN(Number(limitPrice))))
                }
                aria-busy={submitting}
              >
                {submitting
                  ? 'Processing…'
                  : `${side === 'buy' ? 'Buy' : 'Sell'} ${baseSymbol}`}
              </button>

              {beginnerMode && (
                <ClobSeiHint icon="✅">
                  After clicking the button, <strong>MetaMask will open</strong> and ask you to confirm the transaction.
                  First it may ask to <em>approve</em> the token (one-time setup), then to confirm the actual trade.
                  Transaction confirms in ~400ms on Sei.
                </ClobSeiHint>
              )}

              {/* TX link */}
              {lastTxHash && (
                <div className="clob-sei-tx-row">
                  <span className="clob-sei-tx-row__icon">✓</span>
                  <span>Tx:</span>
                  <a
                    href={`${CLOB_SEI_TX_EXPLORER_BASE}/${lastTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="clob-sei-tx-link"
                  >
                    {lastTxHash.slice(0, 20)}…
                  </a>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="clob-sei-form-footer">
              Powered by{' '}
              <a href="https://docs.mangrove.exchange/" target="_blank" rel="noreferrer">
                Mangrove Protocol
              </a>{' '}
              on Sei EVM (chain {String(CLOB_SEI_CHAIN_ID)}).
              {!walletAddress && ' Connect MetaMask to place orders.'}
              {isWrongChain && ' Switch to Sei network in your wallet.'}
            </div>
          </form>
        </div>

      </div>

      <div className="clob-sei-activity-wrap">
        <ClobSeiLifecyclePanel
          openOrders={chainOpenOrders}
          mangroveCoreActivity={mangroveCoreActivity}
          mangroveOrderEvents={mangroveOrderEvents}
          sessionTagged={sessionTagged}
          loading={lifecycleLoading}
          error={lifecycleError}
          explorerBase={CLOB_SEI_TX_EXPLORER_BASE}
          onRetractOffer={walletAddress ? retractOpenOffer : null}
          cancelling={retractCancelling}
          selectedMarketId={marketId}
        />
      </div>
    </div>
  );
}
