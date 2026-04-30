/**
 * SeiTradePage – Trade on SEI (Oxium-like). Chart + order book (Mangrove CLOB, read-only) + Swap/Limit panel.
 * Swap: Astroport (Cosmos wallet). Order book / limit orders: CLOB page (EVM wallet on Sei).
 */

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import ErrorBoundary from '../../common/ErrorBoundary';
import { useSeiWallet } from '../../sei/context/SeiWalletContext';
import { useSeiPair } from '../../sei/context/SeiPairContext';
import SwapPanelSei from '../../sei/SwapPanel.sei';
import TradingViewChart from '../components/common/TradingViewChart';
import { SEI_PAIR_TO_CHART_SYMBOL } from '../../sei/seiTokenConfig';
import { useClobSeiOrderBook } from '../../clob-sei/hooks/useClobSeiOrderBook';
import ClobSeiOrderBook from '../../clob-sei/components/ClobSeiOrderBook';
import '../styles/components/clob-sei-page.css';
import OtaBscAutoStatusBanner from '../components/ai-trading/OtaBscAutoStatusBanner';

const PAIR_TO_CLOB_MARKET = { 'SEI/USDC': 'wSEI-USDC', 'SEI/USDT': 'wSEI-USDT' };

const cardStyle = {
  border: '1px solid var(--ds-border-color, #27272a)',
  borderRadius: '8px',
  padding: '16px',
  background: 'var(--ds-bg-surface, #18181b)',
};

export default function SeiTradePage() {
  const { isConnected } = useSeiWallet();
  const { pair } = useSeiPair();
  const [swapLimitTab, setSwapLimitTab] = useState('swap'); // 'swap' | 'limit'
  const [orderBookTab, setOrderBookTab] = useState('orderbook'); // 'orderbook' | 'trade'
  const [ordersTab, setOrdersTab] = useState('open'); // 'open' | 'positions' | 'history'
  const chartSymbol = useMemo(() => SEI_PAIR_TO_CHART_SYMBOL[pair] || 'BINANCE:SEIUSDT', [pair]);
  const clobMarketId = PAIR_TO_CLOB_MARKET[pair] || 'wSEI-USDC';
  const { asks, bids, loading: obLoading, error: obError, refresh: obRefresh, market: clobMarket } = useClobSeiOrderBook(clobMarketId);

  const tabBtnStyle = (active) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid var(--ds-border-subtle)',
    background: active ? 'var(--ds-accent)' : 'transparent',
    color: active ? '#fff' : 'inherit',
    fontWeight: 500,
    cursor: 'pointer',
    fontSize: '1rem',
  });

  return (
    <div className="sei-trade-page" style={{ maxWidth: 1800, margin: '0 auto', padding: '0 12px' }}>
      <OtaBscAutoStatusBanner variant="crossChain" />
      {!isConnected && (
        <div
          role="status"
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(124, 58, 237, 0.12)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            color: 'var(--ds-text-primary)',
            fontSize: '14px',
          }}
        >
          Connect your SEI wallet (Keplr / Compass) in the header to trade. You can explore the interface without a wallet.
        </div>
      )}
      {/* Oxium: 3 componente pe același rând – Chart | Order Book | Swap/Limit (un panou cu butoane Swap | Limit) */}
      <div className="sei-top-row sei-top-three" style={{ display: 'grid', gridTemplateColumns: '1fr 300px minmax(300px, 440px)', gap: '20px', marginBottom: '20px', alignItems: 'stretch', minHeight: 420 }}>
        {/* 1. Chart – fără titlu (perechea e în header) */}
        <section className="sei-skeleton-card chart-wrapper-single-frame" style={{ display: 'flex', flexDirection: 'column', minHeight: 400 }}>
          <div style={{ flex: 1, minHeight: 320, borderRadius: '6px', overflow: 'hidden' }}>
            <ErrorBoundary fallback={<div style={{ padding: 24, background: 'var(--ds-bg-subtle)', borderRadius: 8, color: 'var(--ds-text-secondary)' }}>Chart failed to load.</div>}>
              <TradingViewChart symbol={chartSymbol} interval="60" theme="dark" height={320} autosize />
            </ErrorBoundary>
          </div>
        </section>

        {/* 2. Order book + Trade */}
        <section style={{ ...cardStyle, display: 'flex', flexDirection: 'column', minHeight: 320 }}>
          <div role="tablist" aria-label="Order book or Trade" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              role="tab"
              aria-selected={orderBookTab === 'orderbook'}
              onClick={() => setOrderBookTab('orderbook')}
              style={tabBtnStyle(orderBookTab === 'orderbook')}
            >
              Order book
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={orderBookTab === 'trade'}
              onClick={() => setOrderBookTab('trade')}
              style={tabBtnStyle(orderBookTab === 'trade')}
            >
              Trade
            </button>
            {orderBookTab === 'orderbook' && (
              <button
                type="button"
                onClick={() => obRefresh()}
                disabled={obLoading}
                aria-label="Refresh order book"
                style={{ marginLeft: 'auto', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, border: '1px solid var(--ds-border-subtle)', borderRadius: 6, background: 'transparent', color: 'var(--ds-text-secondary)', cursor: obLoading ? 'wait' : 'pointer' }}
              >
                <RefreshCw size={12} /> Refresh
              </button>
            )}
          </div>
          {orderBookTab === 'orderbook' && (
            <>
              <div style={{ minHeight: 220, flex: 1 }}>
                <ErrorBoundary fallback={<div style={{ padding: 12, fontSize: 12, color: 'var(--ds-text-secondary)' }}>Order book failed to load.</div>}>
                  <ClobSeiOrderBook
                    asks={asks}
                    bids={bids}
                    loading={obLoading}
                    error={obError}
                    baseSymbol={clobMarket?.base ?? 'wSEI'}
                    quoteSymbol={clobMarket?.quote ?? 'USDC'}
                    baseDecimals={clobMarket?.baseDecimals ?? 18}
                    quoteDecimals={clobMarket?.quoteDecimals ?? 6}
                  />
                </ErrorBoundary>
              </div>
              <p style={{ marginTop: 10, fontSize: 11, color: 'var(--ds-text-tertiary)' }}>
                Live order book (Mangrove). To place market/limit orders use the <Link to="/dex-edu/clob-sei" className="sei-trade-clob-link">CLOB page</Link> (EVM wallet on Sei).
              </p>
              {obError && (
                <p style={{ marginTop: 6, fontSize: 11, color: 'var(--ds-text-tertiary)' }}>
                  If the book is empty or failed, check Sei EVM RPC or try the <Link to="/dex-edu/clob-sei" className="sei-trade-clob-link">CLOB page</Link> directly.
                </p>
              )}
            </>
          )}
          {orderBookTab === 'trade' && (
            <div style={{ padding: '16px 0', fontSize: '13px', color: 'var(--ds-text-secondary)' }}>
              <p style={{ marginBottom: 12 }}>Place market and limit orders on the CLOB (EVM wallet on Sei required).</p>
              <Link to="/dex-edu/clob-sei" style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 8, background: 'var(--ds-accent)', color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Go to CLOB Trade</Link>
            </div>
          )}
        </section>

        {/* 3. Un singur panou cu butoane Swap | Limit */}
        <section className="sei-skeleton-card" style={{ ...cardStyle }} aria-label="Swap and Limit orders">
          <div role="tablist" aria-label="Swap or Limit" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              type="button"
              role="tab"
              aria-selected={swapLimitTab === 'swap'}
              onClick={() => setSwapLimitTab('swap')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--ds-border-subtle)',
                background: swapLimitTab === 'swap' ? 'var(--ds-accent)' : 'transparent',
                color: swapLimitTab === 'swap' ? '#fff' : 'inherit',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Swap
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={swapLimitTab === 'limit'}
              onClick={() => setSwapLimitTab('limit')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--ds-border-subtle)',
                background: swapLimitTab === 'limit' ? 'var(--ds-accent)' : 'transparent',
                color: swapLimitTab === 'limit' ? '#fff' : 'inherit',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Limit
            </button>
          </div>
          {swapLimitTab === 'swap' ? (
            <SwapPanelSei />
          ) : (
            <div style={{ padding: '16px 0', fontSize: '13px', color: 'var(--ds-text-secondary)' }}>
              <p style={{ marginBottom: 12 }}>Limit orders are on the CLOB page. Connect an EVM wallet (MetaMask) on Sei network.</p>
              <Link to="/dex-edu/clob-sei" style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 8, background: 'var(--ds-accent)', color: '#fff', textDecoration: 'none', fontWeight: 500 }}>Go to CLOB (Limit orders)</Link>
            </div>
          )}
        </section>
      </div>

      {/* Oxium: Open Orders | Positions | Order History – jos sub grid */}
      <section className="sei-orders-section" style={{ ...cardStyle, marginTop: '20px' }}>
        <div role="tablist" aria-label="Open Orders, Positions, Order History" style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            role="tab"
            aria-selected={ordersTab === 'open'}
            onClick={() => setOrdersTab('open')}
            style={tabBtnStyle(ordersTab === 'open')}
          >
            Open Orders
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={ordersTab === 'positions'}
            onClick={() => setOrdersTab('positions')}
            style={tabBtnStyle(ordersTab === 'positions')}
          >
            Positions
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={ordersTab === 'history'}
            onClick={() => setOrdersTab('history')}
            style={tabBtnStyle(ordersTab === 'history')}
          >
            Order History
          </button>
        </div>
        {ordersTab === 'open' && (
          <div className="sei-open-orders">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--ds-border-subtle)', color: 'var(--ds-text-secondary)' }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Pair</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Side</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Amount</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Filled</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--ds-text-secondary)' }}>No open orders. For CLOB limit/market orders use the <Link to="/dex-edu/clob-sei" className="sei-trade-clob-link">CLOB page</Link>.</td></tr>
              </tbody>
            </table>
          </div>
        )}
        {ordersTab === 'positions' && (
          <div className="sei-positions">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--ds-border-subtle)', color: 'var(--ds-text-secondary)' }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Pair</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Side</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Size</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Entry Price</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>PnL</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--ds-text-secondary)' }}>No open positions. For CLOB positions use the <Link to="/dex-edu/clob-sei" className="sei-trade-clob-link">CLOB page</Link>.</td></tr>
              </tbody>
            </table>
          </div>
        )}
        {ordersTab === 'history' && (
          <div className="sei-order-history">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--ds-border-subtle)', color: 'var(--ds-text-secondary)' }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Time</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Pair</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Side</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '8px' }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--ds-text-secondary)' }}>No order history here. Swap history: check your wallet on a block explorer. For CLOB order history use the <Link to="/dex-edu/clob-sei" className="sei-trade-clob-link">CLOB page</Link>.</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
