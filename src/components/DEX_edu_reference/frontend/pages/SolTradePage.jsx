import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ExternalLink, Loader2, RefreshCw, ShieldAlert, TrendingUp } from 'lucide-react';
import ErrorBoundary from '../../common/ErrorBoundary';
import { useWallet } from '../../context/WalletContext.jsx';
import { useDEXSettings } from '../../hooks/DEX/useDEXSettings';
import { useSolPair } from '../../sol/context/SolPairContext';
import SwapPanelSol from '../../sol/SwapPanel.sol';
import TradingViewChart from '../components/common/TradingViewChart';
import { fetchJupiterQuoteDepth } from '../../sol/services/solTradeMarketData';
import { SOL_PERPS_MARKETS, SOL_PERPS_PROVIDERS, getSolPerpsProvider } from '../../sol/services/solPerpsProviders';

const SOL_PAIR_TO_SYMBOL = {
  'SOL/USDC': 'BINANCE:SOLUSDT',
  'SOL/USDT': 'BINANCE:SOLUSDT',
  'SOL/BONK': 'BINANCE:BONKUSDT',
  'SOL/JUP': 'BINANCE:JUPUSDT',
  'SOL/RAY': 'BINANCE:RAYUSDT',
  'SOL/mSOL': 'BINANCE:SOLUSDT',
  'USDC/USDT': 'BINANCE:USDCUSDT',
  'USDC/BONK': 'BINANCE:BONKUSDT',
  'JUP/USDC': 'BINANCE:JUPUSDT',
};

const EMPTY_ROWS = {
  open: { title: 'No open orders', detail: 'No live Solana order adapter is connected for this wallet yet.' },
  positions: { title: 'No open positions', detail: 'Perps positions will appear here after a provider SDK adapter is wired.' },
  history: { title: 'No order history', detail: 'History is not synthesized; it needs provider data or indexed wallet activity.' },
};

function formatTime(iso) {
  if (!iso) return 'Not loaded';
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return 'Not loaded';
  }
}

function TabButton({ active, children, onClick }) {
  return (
    <button type="button" className={`sol-terminal-tab ${active ? 'is-active' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

function StatusPill({ tone = 'neutral', children }) {
  return <span className={`sol-status-pill sol-status-pill--${tone}`}>{children}</span>;
}

function SolOtaExecutionStatus({ connected }) {
  return (
    <section className="sol-ota-status-card" aria-label="SOL OTA execution status">
      <div className="sol-panel-title-row">
        <div>
          <h3>SOL OTA Execution Status</h3>
          <p>Native Solana automation is separated from the BSC/EVM OTA policy.</p>
        </div>
        <StatusPill tone="manual">Manual signing</StatusPill>
      </div>

      <div className="sol-ota-status-grid">
        <div className="sol-ota-status-item is-enabled">
          <span>Manual Jupiter spot</span>
          <strong>{connected ? 'Ready with Phantom signature' : 'Connect SOL wallet'}</strong>
          <p>Funding Phantom with SOL enables manual swaps, fee payment, quotes, and signed Jupiter transactions.</p>
        </div>
        <div className="sol-ota-status-item is-assisted">
          <span>OTA assisted trade</span>
          <strong>Analysis/proposal only</strong>
          <p>OTA can guide the trade path, but every native SOL swap still needs an explicit wallet signature.</p>
        </div>
        <div className="sol-ota-status-item is-locked">
          <span>Unattended SOL auto</span>
          <strong>Disabled until delegation exists</strong>
          <p>No backend private-key custody is used. Auto execution needs a limited vault or delegated authority first.</p>
        </div>
      </div>
    </section>
  );
}

function getPairTokens(pair) {
  const [base = 'SOL', quote = 'USDC'] = String(pair || 'SOL/USDC').split('/');
  return { base, quote };
}

function SolAssistedPlanner({ connected, onPrepare, pair, quoteDepth }) {
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState('base-to-quote');
  const { base, quote } = useMemo(() => getPairTokens(pair), [pair]);
  const fromToken = direction === 'base-to-quote' ? base : quote;
  const toToken = direction === 'base-to-quote' ? quote : base;
  const amountNumber = Number(amount);
  const canPrepare = connected && amountNumber > 0 && fromToken !== toToken;
  const depthLabel = quoteDepth
    ? `Quote depth ready for ${pair}; planner will fill the manual swap form.`
    : `Quote depth is still loading for ${pair}; planner can still prepare the manual route.`;

  const handlePrepare = () => {
    if (!canPrepare) return;
    onPrepare({
      id: `${Date.now()}`,
      amount: amount.trim(),
      from: fromToken,
      pair,
      to: toToken,
    });
  };

  return (
    <section className="sol-assisted-panel" aria-label="OTA assisted manual trade planner">
      <div className="sol-panel-title-row">
        <div>
          <h3>OTA Assisted Manual Trade</h3>
          <p>{depthLabel}</p>
        </div>
        <StatusPill tone="manual">No auto spend</StatusPill>
      </div>

      <div className="sol-assisted-grid">
        <label>
          Direction
          <select value={direction} onChange={(event) => setDirection(event.target.value)}>
            <option value="base-to-quote">{base} to {quote}</option>
            <option value="quote-to-base">{quote} to {base}</option>
          </select>
        </label>
        <label>
          Amount
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder={`0.00 ${fromToken}`}
          />
        </label>
        <button type="button" onClick={handlePrepare} disabled={!canPrepare}>
          Prepare wallet-signed swap
        </button>
      </div>

      <p className="sol-assisted-note">
        OTA only prepares {fromToken} to {toToken}. The Jupiter swap button still requires an explicit Phantom signature.
      </p>
    </section>
  );
}

function QuoteDepthTable({ quoteDepth, loading, error }) {
  const bids = quoteDepth?.bids || [];
  const asks = quoteDepth?.asks || [];
  const rows = [...asks.slice().reverse(), { side: 'spread' }, ...bids];

  return (
    <div className="sol-depth-panel">
      <div className="sol-panel-title-row">
        <div>
          <h3>Quote Depth</h3>
          <p>{quoteDepth?.source || 'Jupiter quote depth'} · {formatTime(quoteDepth?.updatedAt)}</p>
        </div>
        {loading && <Loader2 size={16} className="sol-spin" aria-label="Loading quote depth" />}
      </div>

      {error && (
        <div className="sol-inline-warning" role="status">
          {error}
        </div>
      )}

      <table className="sol-terminal-table">
        <thead>
          <tr>
            <th>Price</th>
            <th>Size</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 1 ? (
            <tr>
              <td colSpan={3} className="sol-empty-cell">Enter a supported pair to load Jupiter quote depth.</td>
            </tr>
          ) : rows.map((row, index) => {
            if (row.side === 'spread') {
              return (
                <tr key="spread" className="sol-spread-row">
                  <td colSpan={3}>Spread from routed quotes, not a central order book</td>
                </tr>
              );
            }
            return (
              <tr key={`${row.side}-${index}`} className={`sol-depth-row sol-depth-row--${row.side}`}>
                <td>{row.priceLabel}</td>
                <td>{row.sizeLabel}</td>
                <td>{row.totalLabel}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RecentRouteSamples({ recent }) {
  return (
    <div className="sol-route-samples">
      {(recent || []).length === 0 ? (
        <span>No route samples loaded.</span>
      ) : recent.map((trade, index) => (
        <span key={`${trade.side}-${index}`} className={`sol-route-chip sol-route-chip--${trade.side}`}>
          {trade.side === 'buy' ? 'Buy' : 'Sell'} {trade.price} · {trade.amount} · {trade.venue}
        </span>
      ))}
    </div>
  );
}

function PerpsPanel({ selectedVenue, setSelectedVenue, perpsSide, setPerpsSide }) {
  const [selectedMarket, setSelectedMarket] = useState(SOL_PERPS_MARKETS[0]?.symbol || 'SOL-PERP');
  const [collateral, setCollateral] = useState('');
  const [leverage, setLeverage] = useState(5);
  const provider = getSolPerpsProvider(selectedVenue);
  const market = SOL_PERPS_MARKETS.find((item) => item.symbol === selectedMarket) || SOL_PERPS_MARKETS[0];
  const notional = Number(collateral) > 0 ? Number(collateral) * Number(leverage) : 0;

  return (
    <div className="sol-perps-shell">
      <div className="sol-perps-provider-grid">
        {SOL_PERPS_PROVIDERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sol-provider-card ${selectedVenue === item.id ? 'is-active' : ''}`}
            onClick={() => setSelectedVenue(item.id)}
          >
            <span className="sol-provider-card__name">{item.name}</span>
            <span className="sol-provider-card__meta">{item.maxLeverageLabel}</span>
            <span className="sol-provider-card__note">{item.executionModel}</span>
          </button>
        ))}
      </div>

      <section className="sol-perps-card">
        <div className="sol-panel-title-row">
          <div>
            <h3>{provider.name}</h3>
            <p>{provider.integrationNote}</p>
          </div>
          <a className="sol-doc-link" href={provider.docsUrl} target="_blank" rel="noopener noreferrer">
            Docs <ExternalLink size={13} />
          </a>
        </div>

        <div className="sol-perps-stats">
          <div><span>Markets</span><strong>{provider.marketsLabel}</strong></div>
          <div><span>Collateral</span><strong>{provider.collateralLabel}</strong></div>
          <div><span>Status</span><strong>{provider.status}</strong></div>
        </div>

        <div className="sol-perps-form">
          <label>
            Market
            <select value={selectedMarket} onChange={(event) => setSelectedMarket(event.target.value)}>
              {SOL_PERPS_MARKETS.map((item) => (
                <option key={item.symbol} value={item.symbol}>{item.symbol}</option>
              ))}
            </select>
          </label>
          <label>
            Collateral
            <input value={collateral} onChange={(event) => setCollateral(event.target.value)} type="number" min="0" placeholder="0.00" />
          </label>
          <label>
            Leverage
            <input value={leverage} onChange={(event) => setLeverage(event.target.value)} type="number" min="1" max="250" />
          </label>
        </div>

        <div className="sol-side-toggle" role="tablist" aria-label="Perps side">
          <button type="button" className={perpsSide === 'long' ? 'is-long' : ''} onClick={() => setPerpsSide('long')}>Long</button>
          <button type="button" className={perpsSide === 'short' ? 'is-short' : ''} onClick={() => setPerpsSide('short')}>Short</button>
        </div>

        <div className="sol-risk-box">
          <ShieldAlert size={16} />
          <div>
            <strong>Execution is intentionally disabled</strong>
            <span>
              {market.symbol} {perpsSide.toUpperCase()} notional preview: {notional > 0 ? `$${notional.toFixed(2)}` : '$0.00'}.
              Live submit needs the selected venue adapter to build and simulate the exact Solana transaction.
            </span>
          </div>
        </div>

        <button type="button" className="sol-disabled-submit" disabled>
          Wire {provider.name} adapter before live {perpsSide}
        </button>
      </section>
    </div>
  );
}

function OrdersPanel({ activeTab }) {
  const state = EMPTY_ROWS[activeTab] || EMPTY_ROWS.open;
  const columns = activeTab === 'positions'
    ? ['Pair', 'Side', 'Size', 'Entry Price', 'PnL', 'Action']
    : activeTab === 'history'
      ? ['Time', 'Pair', 'Side', 'Price', 'Amount', 'Status']
      : ['Pair', 'Side', 'Price', 'Amount', 'Filled', 'Action'];

  return (
    <table className="sol-terminal-table sol-orders-table">
      <thead>
        <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
      </thead>
      <tbody>
        <tr>
          <td colSpan={columns.length} className="sol-empty-cell">
            <strong>{state.title}</strong>
            <span>{state.detail}</span>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export default function SolTradePage() {
  const { solanaWalletAddress } = useWallet();
  const { settings } = useDEXSettings();
  const isSolanaConnected = !!solanaWalletAddress;
  const { pair } = useSolPair();
  const [tradeMode, setTradeMode] = useState('spot');
  const [swapLimitTab, setSwapLimitTab] = useState('swap');
  const [ordersTab, setOrdersTab] = useState('open');
  const [selectedVenue, setSelectedVenue] = useState('jupiter');
  const [perpsSide, setPerpsSide] = useState('long');
  const [quoteDepth, setQuoteDepth] = useState(null);
  const [quoteDepthLoading, setQuoteDepthLoading] = useState(false);
  const [quoteDepthError, setQuoteDepthError] = useState('');
  const [assistedDraft, setAssistedDraft] = useState(null);
  const chartSymbol = useMemo(() => SOL_PAIR_TO_SYMBOL[pair] || 'BINANCE:SOLUSDT', [pair]);
  const chartInterval = settings?.defaultChartTimeframe || '60';

  const midPrice = useMemo(() => {
    const bid = quoteDepth?.bids?.[0]?.price;
    const ask = quoteDepth?.asks?.[0]?.price;
    if (Number.isFinite(bid) && Number.isFinite(ask)) return ((bid + ask) / 2).toFixed(4);
    if (Number.isFinite(bid)) return bid.toFixed(4);
    return null;
  }, [quoteDepth]);

  const refreshQuoteDepth = useCallback(async () => {
    setQuoteDepthLoading(true);
    setQuoteDepthError('');
    try {
      const depth = await fetchJupiterQuoteDepth({ pair });
      setQuoteDepth(depth);
    } catch (error) {
      setQuoteDepthError(error?.message || 'Could not load Jupiter quote depth.');
      setQuoteDepth(null);
    } finally {
      setQuoteDepthLoading(false);
    }
  }, [pair]);

  useEffect(() => {
    refreshQuoteDepth();
    const id = setInterval(refreshQuoteDepth, 30000);
    return () => clearInterval(id);
  }, [refreshQuoteDepth]);

  const prepareAssistedSwap = useCallback((draft) => {
    setTradeMode('spot');
    setSwapLimitTab('swap');
    setAssistedDraft(draft);
  }, []);

  return (
    <div className="sol-trade-page sol-terminal">
      <section className="sol-terminal-hero">
        <div>
          <div className="sol-terminal-kicker">
            <StatusPill tone="live">Manual spot via Jupiter</StatusPill>
            <StatusPill tone="manual">OTA assisted only</StatusPill>
            <StatusPill tone="planned">Perps adapters staged</StatusPill>
          </div>
          <h1>Solana Trade Terminal</h1>
          <p>Spot routing uses Jupiter quotes and wallet-signed swaps. SOL OTA auto execution is not live until a limited delegation or vault model exists.</p>
        </div>
        <div className="sol-terminal-metrics">
          <div><span>Pair</span><strong>{pair}</strong></div>
          <div><span>Quote mid</span><strong>{midPrice ? `$${midPrice}` : '-'}</strong></div>
          <div><span>Wallet</span><strong>{isSolanaConnected ? 'SOL connected' : 'Not connected'}</strong></div>
        </div>
      </section>

      {!isSolanaConnected && (
        <div role="status" className="sol-wallet-banner">
          Connect your SOL wallet (Phantom / Solflare) in the header to trade spot on Jupiter.
        </div>
      )}

      <SolOtaExecutionStatus connected={isSolanaConnected} />

      <SolAssistedPlanner
        connected={isSolanaConnected}
        onPrepare={prepareAssistedSwap}
        pair={pair}
        quoteDepth={quoteDepth}
      />

      <div className="sol-mode-tabs" role="tablist" aria-label="SOL trade mode">
        <TabButton active={tradeMode === 'spot'} onClick={() => setTradeMode('spot')}>Spot</TabButton>
        <TabButton active={tradeMode === 'perps'} onClick={() => setTradeMode('perps')}>Perps</TabButton>
      </div>

      <div className="sol-top-row sei-top-three sol-terminal-grid">
        <section className="sol-skeleton-card sol-chart-panel">
          <div className="sol-panel-title-row">
            <div>
              <h3>{tradeMode === 'spot' ? pair : 'SOL-PERP'}</h3>
              <p>Chart interval from Global DEX Settings: {chartInterval}</p>
            </div>
            <TrendingUp size={18} />
          </div>
          <div className="sol-chart-frame">
            <ErrorBoundary fallback={<div className="sol-chart-fallback">Chart failed to load.</div>}>
              <TradingViewChart symbol={chartSymbol} interval={chartInterval} theme="dark" height={360} autosize />
            </ErrorBoundary>
          </div>
        </section>

        <section className="sol-skeleton-card sol-market-panel">
          <div className="sol-market-toolbar">
            <button type="button" onClick={refreshQuoteDepth} disabled={quoteDepthLoading}>
              {quoteDepthLoading ? <Loader2 size={14} className="sol-spin" /> : <RefreshCw size={14} />}
              Refresh
            </button>
          </div>
          {tradeMode === 'spot' ? (
            <>
              <QuoteDepthTable quoteDepth={quoteDepth} loading={quoteDepthLoading} error={quoteDepthError} />
              <RecentRouteSamples recent={quoteDepth?.recent} />
            </>
          ) : (
            <div className="sol-perps-summary">
              <Activity size={20} />
              <h3>Perps venue readiness</h3>
              <p>Provider metadata is loaded from the SOL perps registry. Live order placement stays locked until a venue adapter signs real transactions.</p>
              <ul>
                {SOL_PERPS_PROVIDERS.map((provider) => (
                  <li key={provider.id}>{provider.name}: {provider.maxLeverageLabel}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="sol-skeleton-card sol-action-panel" aria-label="SOL trade actions">
          {tradeMode === 'spot' ? (
            <>
              <div className="sol-mode-tabs sol-mode-tabs--compact" role="tablist" aria-label="Spot action type">
                <TabButton active={swapLimitTab === 'swap'} onClick={() => setSwapLimitTab('swap')}>Swap</TabButton>
                <TabButton active={swapLimitTab === 'limit'} onClick={() => setSwapLimitTab('limit')}>Limit</TabButton>
              </div>
              {swapLimitTab === 'swap' ? (
                <SwapPanelSol assistedDraft={assistedDraft} />
              ) : (
                <div className="sol-risk-box">
                  <ShieldAlert size={16} />
                  <div>
                    <strong>Limit orders are adapter-locked</strong>
                    <span>Limit trading needs an official Solana transaction builder for the selected venue. No synthetic orders are shown.</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <PerpsPanel
              selectedVenue={selectedVenue}
              setSelectedVenue={setSelectedVenue}
              perpsSide={perpsSide}
              setPerpsSide={setPerpsSide}
            />
          )}
        </section>
      </div>

      <section className="sol-orders-section sol-skeleton-card">
        <div className="sol-mode-tabs sol-mode-tabs--compact" role="tablist" aria-label="Orders and positions">
          <TabButton active={ordersTab === 'open'} onClick={() => setOrdersTab('open')}>Open Orders</TabButton>
          <TabButton active={ordersTab === 'positions'} onClick={() => setOrdersTab('positions')}>Positions</TabButton>
          <TabButton active={ordersTab === 'history'} onClick={() => setOrdersTab('history')}>Order History</TabButton>
        </div>
        <OrdersPanel activeTab={ordersTab} />
      </section>
    </div>
  );
}
