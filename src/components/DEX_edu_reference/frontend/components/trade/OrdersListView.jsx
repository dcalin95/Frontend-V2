/**
 * OrdersListView – listă Open Orders sau Order History cu toolbar (Copy, Email, Export, Half screen, Popup)
 * Folosit pe rutele dedicate și în modal/drawer.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders, getTrades, cancelOrder } from '../../services/dexApiService';
import { useDexAuth } from '../../context/DexAuthContext';
import useWallet from '../../hooks/useWallet';
import { Button } from '../ui';
import Table from '../ui/Table';
import Badge from '../ui/Badge';
import { Copy, Mail, Download, Maximize2, ExternalLink } from 'lucide-react';
import '../../styles/components/orders-list-view.css';

const buildOpenOrdersCsv = (rows, marketPrices = {}) => {
  const headers = 'Market,Side,Entry Price,Current Price,Amount,Unrealized P&L (USDT),Status\n';
  const lines = rows.map((o) => {
    const market = `${o.base_token || ''}/${o.quote_token || 'USDT'}`;
    const side = String(o.side || '').toUpperCase();
    const entryPrice = o.price ? parseFloat(o.price).toFixed(2) : '';
    const currentPrice = marketPrices[o.base_token] ? parseFloat(marketPrices[o.base_token]).toFixed(2) : '';
    const amount = o.amount ? parseFloat(o.amount).toFixed(8) : '';
    let pnl = '';
    if (marketPrices[o.base_token] && o.price && o.amount) {
      const p = (parseFloat(marketPrices[o.base_token]) - parseFloat(o.price)) * parseFloat(o.amount);
      pnl = p.toFixed(2);
    }
    const status = o.status ?? 'open';
    return [market, side, entryPrice, currentPrice, amount, pnl, status].join(',');
  });
  return headers + lines.join('\n');
};

const buildOrderHistoryCsv = (rows) => {
  const headers = 'Market,Role,Price,Amount,Status,Time\n';
  const lines = rows.map((t) => {
    const market = `${t.base_token || ''}/${t.quote_token || 'USDT'}`;
    const role = t.role || '';
    const price = t.price ? parseFloat(t.price).toFixed(2) : '';
    const amount = t.amount ? parseFloat(t.amount).toFixed(8) : '';
    const status = t._type === 'order' && t.status ? t.status : '';
    const time = t.created_at ? new Date(t.created_at).toISOString() : '';
    return [market, role, price, amount, status, time].join(',');
  });
  return headers + lines.join('\n');
};

export default function OrdersListView({
  type, // 'openOrders' | 'orderHistory'
  embedded = false,
  onOpenHalfScreen,
  onOpenPopup,
  title,
}) {
  const { isAuthenticated, login } = useDexAuth();
  const wallet = useWallet();
  const navigate = useNavigate();
  const [openOrders, setOpenOrders] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [marketPrices, setMarketPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copyDone, setCopyDone] = useState(false);
  const isOpenOrders = type === 'openOrders';

  const fetchOpenOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getOrders({ status: 'pending,partially_filled', limit: 50, offset: 0 });
      const list = Array.isArray(res?.orders) ? res.orders : [];
      setOpenOrders(list);
      const tokens = [...new Set(list.map((o) => o.base_token).filter(Boolean))];
      if (tokens.length > 0) {
        const symbols = JSON.stringify(tokens.map((t) => `${t}USDT`));
        const priceRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbols=${symbols}`);
        if (priceRes.ok) {
          const data = await priceRes.json();
          const prices = {};
          data.forEach((item) => {
            prices[item.symbol.replace('USDT', '')] = parseFloat(item.price);
          });
          setMarketPrices(prices);
        }
      }
    } catch (e) {
      setError(e?.message || String(e));
      setOpenOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrderHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [tradesRes, ordersRes] = await Promise.all([
        getTrades({ limit: 50, offset: 0 }),
        getOrders({ status: 'filled,cancelled', limit: 50, offset: 0 }),
      ]);
      const trades = Array.isArray(tradesRes?.trades) ? tradesRes.trades : [];
      const filledCancelled = Array.isArray(ordersRes?.orders) ? ordersRes.orders : [];
      const tradeOrderIds = new Set(trades.map((t) => t.order_id).filter(Boolean));
      const ordersAsRows = filledCancelled
        .filter((o) => !tradeOrderIds.has(o.id))
        .map((o) => ({
          ...o,
          role: o.side,
          _type: 'order',
        }));
      const history = [...trades.map((t) => ({ ...t, _type: 'trade' })), ...ordersAsRows].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setOrderHistory(history);
    } catch (e) {
      setError(e?.message || String(e));
      setOrderHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setOpenOrders([]);
      setOrderHistory([]);
      setLoading(false);
      setError(null);
      return;
    }
    if (isOpenOrders) fetchOpenOrders();
    else fetchOrderHistory();
  }, [isAuthenticated, isOpenOrders, fetchOpenOrders, fetchOrderHistory]);

  const csvContent = useMemo(() => {
    if (isOpenOrders) return buildOpenOrdersCsv(openOrders, marketPrices);
    return buildOrderHistoryCsv(orderHistory);
  }, [isOpenOrders, openOrders, orderHistory, marketPrices]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(csvContent);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    } catch (_) {}
  }, [csvContent]);

  const handleEmail = useCallback(() => {
    const subject = encodeURIComponent(isOpenOrders ? 'Open Orders' : 'Order History');
    const body = encodeURIComponent(csvContent);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }, [isOpenOrders, csvContent]);

  const handleExport = useCallback(() => {
    const filename = isOpenOrders ? 'open-orders.csv' : 'order-history.csv';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [isOpenOrders, csvContent]);

  const isDexSessionError = useMemo(() => {
    const msg = (error || '').toLowerCase();
    return msg.includes('no session found') || msg.includes('authenticate via') || msg.includes('auth/verify');
  }, [error]);

  const handleDexSignIn = useCallback(async () => {
    try {
      await login();
      setError(null);
      if (isOpenOrders) fetchOpenOrders();
      else fetchOrderHistory();
    } catch (e) {
      setError(e?.message || String(e));
    }
  }, [login, isOpenOrders, fetchOpenOrders, fetchOrderHistory]);

  if (!isAuthenticated) {
    return (
      <div className="orders-list-view orders-list-view-empty">
        <p>Connect and sign in to view {isOpenOrders ? 'open orders' : 'order history'}.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="orders-list-view">
        <div className="orders-list-view-loading">Loading…</div>
      </div>
    );
  }

  if (error) {
    if (isDexSessionError && wallet.isConnected) {
      return (
        <div className="orders-list-view orders-list-view-dex-sign-cta">
          <p className="orders-list-view-dex-sign-message">
            Order History requires wallet signature. Sign the message to view orders and trades.
          </p>
          <Button variant="primary" onClick={handleDexSignIn}>
            Sign with wallet
          </Button>
        </div>
      );
    }
    if (isDexSessionError && !wallet.isConnected) {
      return (
        <div className="orders-list-view orders-list-view-dex-sign-cta">
          <p className="orders-list-view-dex-sign-message">
            Connect your wallet in the header, then sign to view Order History.
          </p>
        </div>
      );
    }
    return (
      <div className="orders-list-view">
        <div className="orders-list-view-error">Error: {error}</div>
      </div>
    );
  }

  const rows = isOpenOrders ? openOrders : orderHistory;
  const hasRows = rows.length > 0;

  return (
    <div className={`orders-list-view ${embedded ? 'orders-list-view-embedded' : ''}`}>
      {title && <h2 className="orders-list-view-title">{title}</h2>}
      <div className="orders-list-view-toolbar">
        {!embedded && (
          <>
            <Button variant="ghost" size="sm" icon={<Maximize2 size={16} />} onClick={onOpenHalfScreen}>
              Half screen
            </Button>
            <Button variant="ghost" size="sm" icon={<ExternalLink size={16} />} onClick={onOpenPopup}>
              Popup
            </Button>
            <span className="orders-list-view-toolbar-sep" />
          </>
        )}
        <Button variant="ghost" size="sm" icon={<Copy size={16} />} onClick={handleCopy}>
          {copyDone ? 'Copied!' : 'Copy'}
        </Button>
        <Button variant="ghost" size="sm" icon={<Mail size={16} />} onClick={handleEmail}>
          Email
        </Button>
        <Button variant="ghost" size="sm" icon={<Download size={16} />} onClick={handleExport}>
          Save to computer
        </Button>
      </div>
      {!isOpenOrders && (
        <div className="orders-list-view-swap-hint">
          <span>Swap outcomes (e.g. BNB→CAKE) appear in Trading History.</span>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dex-edu/trade', { state: { openHistory: true } })}>
            Open Trading History
          </Button>
        </div>
      )}
      {!hasRows ? (
        <div className="orders-list-view-empty">No {isOpenOrders ? 'open orders' : 'order history'}.</div>
      ) : isOpenOrders ? (
        <div className="orders-list-view-table">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Market</Table.Head>
                <Table.Head align="right">Side</Table.Head>
                <Table.Head align="right">Entry Price</Table.Head>
                <Table.Head align="right">Current Price</Table.Head>
                <Table.Head align="right">Amount</Table.Head>
                <Table.Head align="right">Unrealized P&L</Table.Head>
                <Table.Head align="right">Status</Table.Head>
                <Table.Head align="right">Actions</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {openOrders.map((o) => {
                const marketPrice = marketPrices[o.base_token];
                const orderPrice = parseFloat(o.price);
                const amount = parseFloat(o.amount);
                const pnlUsd = marketPrice && orderPrice && amount ? (marketPrice - orderPrice) * amount : null;
                const pnlPercent = marketPrice && orderPrice && amount ? ((marketPrice - orderPrice) / orderPrice) * 100 : null;
                return (
                  <Table.Row key={o.id || o.order_id || `${o.created_at}-${o.price}`}>
                    <Table.Cell>{o.base_token}/{o.quote_token || 'USDT'}</Table.Cell>
                    <Table.Cell align="right">
                      <span style={{ color: o.side === 'buy' ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                        {String(o.side || '').toUpperCase()}
                      </span>
                    </Table.Cell>
                    <Table.Cell align="right">{o.price ? parseFloat(o.price).toFixed(2) : '—'}</Table.Cell>
                    <Table.Cell align="right">
                      {marketPrice ? `$${marketPrice.toFixed(2)}` : '—'}
                    </Table.Cell>
                    <Table.Cell align="right">{o.amount ? parseFloat(o.amount).toFixed(8) : '—'}</Table.Cell>
                    <Table.Cell align="right">
                      {pnlUsd != null ? (
                        <span style={{ color: pnlUsd >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                          {(pnlUsd >= 0 ? '+' : '') + pnlUsd.toFixed(2)} USDT
                          {pnlPercent != null && ` (${(pnlPercent >= 0 ? '+' : '') + pnlPercent.toFixed(2)}%)`}
                        </span>
                      ) : (
                        '—'
                      )}
                    </Table.Cell>
                    <Table.Cell align="right">
                      <Badge variant={o.status === 'pending' ? 'warning' : o.status === 'partially_filled' ? 'info' : 'default'} size="sm">
                        {o.status ?? 'open'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell align="right">
                      {['pending', 'partially_filled'].includes(o.status) && (
                        <Button
                          variant="danger"
                          size="xs"
                          onClick={async () => {
                            const orderId = o.id ?? o.order_id;
                            if (!orderId) return;
                            try {
                              const res = await cancelOrder(orderId);
                              if (res?.success) fetchOpenOrders();
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        </div>
      ) : (
        <div className="orders-list-view-table">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head>Market</Table.Head>
                <Table.Head align="right">Role</Table.Head>
                <Table.Head align="right">Price</Table.Head>
                <Table.Head align="right">Amount</Table.Head>
                <Table.Head align="right">Status</Table.Head>
                <Table.Head align="right">Time</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {orderHistory.map((t) => (
                <Table.Row key={t.id || t.trade_id || `${t.created_at}-${t.price}`}>
                  <Table.Cell>{t.base_token}/{t.quote_token || 'USDT'}</Table.Cell>
                  <Table.Cell align="right">
                    <span style={{ color: (t.role === 'buyer' || t.role === 'buy') ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                      {t.role || '—'}
                    </span>
                  </Table.Cell>
                  <Table.Cell align="right">{t.price ? parseFloat(t.price).toFixed(2) : '—'}</Table.Cell>
                  <Table.Cell align="right">{t.amount ? parseFloat(t.amount).toFixed(8) : '—'}</Table.Cell>
                  <Table.Cell align="right">
                    {t._type === 'order' && t.status ? t.status : '—'}
                  </Table.Cell>
                  <Table.Cell align="right">{t.created_at ? new Date(t.created_at).toLocaleString() : '—'}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      )}
    </div>
  );
}
