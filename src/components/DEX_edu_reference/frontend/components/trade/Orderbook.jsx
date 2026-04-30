/**
 * 📊 Orderbook Component - Orderbook Display
 * 
 * Component pentru afișarea orderbook-ului cu date reale:
 * - Bids (cumpărări) - din API
 * - Asks (vânzări) - din API
 * - Last price - din API
 * - Spread - calculat din date reale
 * 
 * @module Orderbook
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Real API data only. No prescribed data.
import { getOrderbook as getOrderbookApi } from '../../services/dexApiService';
import { Card, Table, Badge } from '../ui';
import { errorWithPrefix } from '../../utils/logger';
import '../../styles/components/orderbook.css';

const Orderbook = React.memo(() => {
  const [orderbook, setOrderbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [baseToken, setBaseToken] = useState('BITS');
  const [quoteToken, setQuoteToken] = useState('USDT');

  useEffect(() => {
    // Load orderbook data from API
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getOrderbookApi(baseToken, quoteToken, 20);
        
        if (data.success) {
          // Transform API response to match component format
          const transformedData = {
            bids: data.bids || [],
            asks: data.asks || [],
            lastPrice: data.lastPrice || null,
            spread: data.asks.length > 0 && data.bids.length > 0 
              ? data.asks[0].price - data.bids[0].price 
              : 0
          };
          setOrderbook(transformedData);
        } else {
          throw new Error('Failed to load orderbook');
        }
      } catch (err) {
        errorWithPrefix('Orderbook', '❌ API ERROR:', err);
        // Empty on error. Real data from API only.
        setOrderbook({ bids: [], asks: [] });
        setError(err?.message || String(err) || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Refresh every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [baseToken, quoteToken]);

  const formatNumber = useCallback((num, decimals = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  }, []);

  const getPriceColor = useCallback((price, isBid) => {
    if (!isBid) return 'orderbook-price-ask';
    return 'orderbook-price-bid';
  }, []);

  const formattedBids = useMemo(() => {
    if (!orderbook) return [];
    return orderbook.bids.slice(0, 10).reverse();
  }, [orderbook]);

  const formattedAsks = useMemo(() => {
    if (!orderbook) return [];
    return orderbook.asks.slice(0, 10);
  }, [orderbook]);

  if (loading || !orderbook) {
    return (
      <Card className="orderbook-container" padding="md">
        <div className="orderbook-loading">Loading orderbook...</div>
      </Card>
    );
  }

  return (
    <Card className="orderbook-container" padding="md">
      <Card.Header>
        <Card.Title>Orderbook</Card.Title>
        <Badge variant="default" size="sm">{baseToken}/{quoteToken}</Badge>
        {error && (
          <Badge variant="warning" size="sm" title={error}>
            Using fallback data
          </Badge>
        )}
      </Card.Header>

      <Card.Body>
        {/* Asks (Sell orders) */}
        <div className="orderbook-section orderbook-asks-section">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head align="right">Price (USDT)</Table.Head>
                <Table.Head align="right">Amount (BTC)</Table.Head>
                <Table.Head align="right">Total</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {formattedAsks.map((order, index) => (
                <Table.Row key={`ask-${index}`} className="orderbook-row-ask">
                  <Table.Cell align="right" className={getPriceColor(order.price, false)}>
                    {formatNumber(order.price, 2)}
                  </Table.Cell>
                  <Table.Cell align="right">
                    {formatNumber(order.amount, 4)}
                  </Table.Cell>
                  <Table.Cell align="right">
                    {formatNumber(order.total, 2)}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>

        {/* Spread & Last Price */}
        <div className="orderbook-spread">
          <div className="orderbook-last-price">
            <span className="orderbook-last-label">Last Price:</span>
            <span className="orderbook-last-value">
              {formatNumber(orderbook.lastPrice, 2)}
            </span>
          </div>
          <div className="orderbook-spread-value">
            Spread: {formatNumber(orderbook.spread, 2)}
          </div>
        </div>

        {/* Bids (Buy orders) */}
        <div className="orderbook-section orderbook-bids-section">
          <Table>
            <Table.Body>
              {formattedBids.map((order, index) => (
                <Table.Row key={`bid-${index}`} className="orderbook-row-bid">
                  <Table.Cell align="right" className={getPriceColor(order.price, true)}>
                    {formatNumber(order.price, 2)}
                  </Table.Cell>
                  <Table.Cell align="right">
                    {formatNumber(order.amount, 4)}
                  </Table.Cell>
                  <Table.Cell align="right">
                    {formatNumber(order.total, 2)}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      </Card.Body>

      {orderbook && orderbook.bids.length === 0 && orderbook.asks.length === 0 && (
        <Card.Footer>
          <span className="orderbook-footer-text">No orders available</span>
        </Card.Footer>
      )}
    </Card>
  );
});

Orderbook.displayName = 'Orderbook';

export default Orderbook;
