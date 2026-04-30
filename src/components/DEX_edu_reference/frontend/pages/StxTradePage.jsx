/**
 * StxTradePage – Pagină Trade pe Stacks (Oxium-like). Același aranjament ca SEI: Chart | Order Book | Swap/Limit, apoi Open Orders | Positions | Order History.
 */

import React, { useMemo, useState } from 'react';
import ErrorBoundary from '../../common/ErrorBoundary';
import { useStxWallet } from '../../stx/context/StxWalletContext';
import { useStxPair } from '../../stx/context/StxPairContext';
import { Link } from 'react-router-dom';
import SwapPanelStx from '../../stx/SwapPanel.stx';
import { STX_PAIR_TO_CHART_SYMBOL } from '../../stx/stxTokenConfig';
import TradingViewChart from '../components/common/TradingViewChart';
import OtaBscAutoStatusBanner from '../components/ai-trading/OtaBscAutoStatusBanner';

const ORDER_BOOK_ROWS = [
  { price: '2.4510', size: '8,200', total: '20,098', side: 'bid' },
  { price: '2.4505', size: '12,100', total: '29,651', side: 'bid' },
  { price: '2.4500', size: '5,400', total: '13,230', side: 'bid' },
  { price: '—', size: '—', total: '—', side: 'spread' },
  { price: '2.4515', size: '9,800', total: '24,025', side: 'ask' },
  { price: '2.4520', size: '6,200', total: '15,202', side: 'ask' },
  { price: '2.4525', size: '11,000', total: '26,978', side: 'ask' },
];
const RECENT_TRADES = [
  { price: '2.4510', amount: '800', time: '10:32:01', side: 'buy' },
  { price: '2.4505', amount: '500', time: '10:31:58', side: 'sell' },
  { price: '2.4515', amount: '1,200', time: '10:31:45', side: 'buy' },
];

const OPEN_ORDERS = [];
const POSITIONS = [];
const ORDER_HISTORY = [
  { time: '10:30:15', pair: 'STX/USDA', side: 'buy', price: '2.4510', amount: '100', status: 'Executat' },
  { time: '10:28:02', pair: 'STX/USDA', side: 'sell', price: '2.4505', amount: '50', status: 'Executat' },
];

const cardStyle = {
  border: '1px solid var(--ds-border-color, #27272a)',
  borderRadius: '8px',
  padding: '16px',
  background: 'var(--ds-bg-surface, #18181b)',
};

export default function StxTradePage() {
  const { isConnected } = useStxWallet();
  const { pair } = useStxPair();
  const [swapLimitTab, setSwapLimitTab] = useState('swap');
  const [orderBookTab, setOrderBookTab] = useState('orderbook');
  const [ordersTab, setOrdersTab] = useState('open');
  const chartSymbol = useMemo(
    () => STX_PAIR_TO_CHART_SYMBOL[pair] || 'BINANCE:STXUSDT',
    [pair]
  );

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
    <div className="stx-trade-page" style={{ maxWidth: 1800, margin: '0 auto', padding: '0 12px' }}>
      <OtaBscAutoStatusBanner variant="crossChain" />
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', background: 'var(--ds-bg-subtle)', border: '1px solid var(--ds-border-color)', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', background: 'rgba(247, 147, 26, 0.25)', color: 'var(--ds-accent, #f59e0b)' }}>Preview · sample data</span>
        <span style={{ fontSize: '13px', color: 'var(--ds-text-secondary)' }}>
          Trade STX: Binance proxy chart; demo order book. <strong>Swap</strong> uses dex-wrapper + quote{' '}
          <code style={{ fontSize: 11 }}>/api/ai-trading/quote?chain=stx</code> when env + backend are configured (Alex routing in contract).
        </span>
        <Link to="/dex-edu/ota/stx" style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--ds-accent, #f7931a)', fontWeight: 600, whiteSpace: 'nowrap' }}>
          OTA STX →
        </Link>
      </div>
      {!isConnected && (
        <div role="status" style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', background: 'rgba(247, 147, 26, 0.12)', border: '1px solid rgba(247, 147, 26, 0.3)', color: 'var(--ds-text-primary)', fontSize: '14px' }}>
          Connect the STX wallet (Leather / Hiro) from the header to trade.
        </div>
      )}

      <div className="stx-top-row sei-top-three" style={{ display: 'grid', gridTemplateColumns: '1fr 300px minmax(300px, 440px)', gap: '20px', marginBottom: '20px', alignItems: 'stretch', minHeight: 420 }}>
        <section className="stx-skeleton-card chart-wrapper-single-frame" style={{ display: 'flex', flexDirection: 'column', minHeight: 400 }}>
          <div style={{ flex: 1, minHeight: 320, borderRadius: '6px', overflow: 'hidden' }}>
            <ErrorBoundary fallback={<div style={{ padding: 24, background: 'var(--ds-bg-subtle)', borderRadius: 8, color: 'var(--ds-text-secondary)' }}>Chart did not load.</div>}>
              <TradingViewChart symbol={chartSymbol} interval="60" theme="dark" height={320} autosize />
            </ErrorBoundary>
          </div>
        </section>

        <section style={{ ...cardStyle, display: 'flex', flexDirection: 'column' }}>
          <div role="tablist" aria-label="Order book or trades" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button type="button" role="tab" aria-selected={orderBookTab === 'orderbook'} onClick={() => setOrderBookTab('orderbook')} style={tabBtnStyle(orderBookTab === 'orderbook')}>Order book</button>
            <button type="button" role="tab" aria-selected={orderBookTab === 'trade'} onClick={() => setOrderBookTab('trade')} style={tabBtnStyle(orderBookTab === 'trade')}>Trades</button>
          </div>
          {orderBookTab === 'orderbook' && (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--ds-border-subtle)', color: 'var(--ds-text-secondary)' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 500 }}>Price</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 500 }}>Amount</th>
                    <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 500 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ORDER_BOOK_ROWS.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--ds-border-subtle)', backgroundColor: row.side === 'bid' ? 'rgba(34, 197, 94, 0.06)' : row.side === 'ask' ? 'rgba(239, 68, 68, 0.06)' : 'transparent' }}>
                      <td style={{ padding: '6px 8px', color: row.side === 'bid' ? 'var(--ds-success)' : row.side === 'ask' ? 'var(--ds-danger)' : 'inherit' }}>{row.price}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{row.size}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: '12px', padding: '8px', background: 'var(--ds-bg-subtle)', borderRadius: '6px', fontSize: '12px', color: 'var(--ds-text-secondary)' }}>
                Recent (sample): {RECENT_TRADES.slice(0, 3).map((t, i) => <span key={i} style={{ marginRight: '8px' }}>{t.side === 'buy' ? '↑' : '↓'} {t.price} × {t.amount}</span>)}
              </div>
            </>
          )}
          {orderBookTab === 'trade' && <div style={{ padding: '12px 0', fontSize: '13px', color: 'var(--ds-text-secondary)' }}>Trades view - coming soon.</div>}
        </section>

        <section className="stx-skeleton-card" style={{ ...cardStyle }} aria-label="Swap and limit order">
          <div role="tablist" aria-label="Swap or limit order" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button type="button" role="tab" aria-selected={swapLimitTab === 'swap'} onClick={() => setSwapLimitTab('swap')} style={tabBtnStyle(swapLimitTab === 'swap')}>Swap</button>
            <button type="button" role="tab" aria-selected={swapLimitTab === 'limit'} onClick={() => setSwapLimitTab('limit')} style={tabBtnStyle(swapLimitTab === 'limit')}>Limit</button>
          </div>
          {swapLimitTab === 'swap' ? <SwapPanelStx /> : <div style={{ padding: '12px 0', fontSize: '13px', color: 'var(--ds-text-secondary)' }}>Limit order - coming soon.</div>}
        </section>
      </div>

      <section className="stx-orders-section" style={{ ...cardStyle, marginTop: '20px' }}>
        <div role="tablist" style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button type="button" role="tab" aria-selected={ordersTab === 'open'} onClick={() => setOrdersTab('open')} style={tabBtnStyle(ordersTab === 'open')}>Open orders</button>
          <button type="button" role="tab" aria-selected={ordersTab === 'positions'} onClick={() => setOrdersTab('positions')} style={tabBtnStyle(ordersTab === 'positions')}>Positions</button>
          <button type="button" role="tab" aria-selected={ordersTab === 'history'} onClick={() => setOrdersTab('history')} style={tabBtnStyle(ordersTab === 'history')}>Order history</button>
        </div>
        {ordersTab === 'open' && (
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
              {OPEN_ORDERS.length === 0 ? <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--ds-text-secondary)' }}>No open orders</td></tr> : OPEN_ORDERS.map((o, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--ds-border-subtle)' }}>
                  <td style={{ padding: '8px' }}>{o.pair}</td>
                  <td style={{ padding: '8px', color: o.side === 'buy' ? 'var(--ds-success)' : 'var(--ds-danger)' }}>{o.side}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{o.price}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{o.amount}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{o.filled}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}><button type="button" style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}>Cancel</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {ordersTab === 'positions' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--ds-border-subtle)', color: 'var(--ds-text-secondary)' }}>
                <th style={{ textAlign: 'left', padding: '8px' }}>Pair</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Side</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Size</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Entry price</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>PnL</th>
                <th style={{ textAlign: 'right', padding: '8px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {POSITIONS.length === 0 ? <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--ds-text-secondary)' }}>No open positions</td></tr> : POSITIONS.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--ds-border-subtle)' }}>
                  <td style={{ padding: '8px' }}>{p.pair}</td>
                  <td style={{ padding: '8px', color: p.side === 'long' ? 'var(--ds-success)' : 'var(--ds-danger)' }}>{p.side}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{p.size}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{p.entryPrice}</td>
                  <td style={{ padding: '8px', textAlign: 'right', color: p.pnl >= 0 ? 'var(--ds-success)' : 'var(--ds-danger)' }}>{p.pnl}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}><button type="button" style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}>Close</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {ordersTab === 'history' && (
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
              {ORDER_HISTORY.length === 0 ? <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--ds-text-secondary)' }}>No order history</td></tr> : ORDER_HISTORY.map((h, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--ds-border-subtle)' }}>
                  <td style={{ padding: '8px' }}>{h.time}</td>
                  <td style={{ padding: '8px' }}>{h.pair}</td>
                  <td style={{ padding: '8px', color: h.side === 'buy' ? 'var(--ds-success)' : 'var(--ds-danger)' }}>{h.side}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{h.price}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{h.amount}</td>
                  <td style={{ padding: '8px' }}>{h.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
