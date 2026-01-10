/**
 * 📊 OrderBook Component
 * 
 * Order book cu bids/asks și Recent Trades
 * Similar cu Oxium DEX
 */

import React, { useState } from 'react';
import { calculateSpread, formatSpread } from '../../utils/calculateSpread';
import { formatPrice, formatVolume } from '../../utils/formatPrice';
import RecentTrades from './RecentTrades';
import './OrderBook.css';

const OrderBook = ({
  bids = [],
  asks = [],
  recentTrades = [],
  onPriceClick = () => {}
}) => {
  const [activeTab, setActiveTab] = useState('orderbook');
  const [decimalPrecision, setDecimalPrecision] = useState(3);

  // Sort bids (descending) and asks (ascending)
  const sortedBids = [...bids].sort((a, b) => b.price - a.price);
  const sortedAsks = [...asks].sort((a, b) => a.price - b.price);

  // Get best bid and ask
  const bestBid = sortedBids[0];
  const bestAsk = sortedAsks[0];

  // Calculate spread
  const spreadData = calculateSpread(
    bestBid?.price || 0,
    bestAsk?.price || 0
  );
  const formattedSpread = formatSpread(spreadData.spread, spreadData.spreadPercent);

  // Calculate cumulative totals
  const calculateCumulative = (orders, isBid = true) => {
    let cumulative = 0;
    return orders.map(order => {
      cumulative += order.size;
      return {
        ...order,
        cumulative
      };
    });
  };

  const bidsWithCumulative = calculateCumulative(sortedBids.slice(0, 10), true);
  const asksWithCumulative = calculateCumulative(sortedAsks.slice(0, 10), false);

  const maxCumulative = Math.max(
    ...bidsWithCumulative.map(b => b.cumulative),
    ...asksWithCumulative.map(a => a.cumulative)
  );

  return (
    <div className="orderbook">
      <div className="orderbook-header">
        <div className="orderbook-tabs">
          <button
            className={`orderbook-tab ${activeTab === 'orderbook' ? 'active' : ''}`}
            onClick={() => setActiveTab('orderbook')}
          >
            Order Book
          </button>
          <button
            className={`orderbook-tab ${activeTab === 'trades' ? 'active' : ''}`}
            onClick={() => setActiveTab('trades')}
          >
            Trades
          </button>
        </div>

        {activeTab === 'orderbook' && (
          <div className="decimal-precision-selector">
            <button
              className={`precision-btn ${decimalPrecision === 0 ? 'active' : ''}`}
              onClick={() => setDecimalPrecision(0)}
            >
              0,0
            </button>
            <button
              className={`precision-btn ${decimalPrecision === 1 ? 'active' : ''}`}
              onClick={() => setDecimalPrecision(1)}
            >
              0,00
            </button>
            <button
              className={`precision-btn ${decimalPrecision === 2 ? 'active' : ''}`}
              onClick={() => setDecimalPrecision(2)}
            >
              0,000
            </button>
            <button
              className={`precision-btn ${decimalPrecision === 3 ? 'active' : ''}`}
              onClick={() => setDecimalPrecision(3)}
            >
              0,0000
            </button>
          </div>
        )}
      </div>

      {activeTab === 'orderbook' ? (
        <div className="orderbook-content">
          {/* Headers */}
          <div className="orderbook-row header">
            <div className="orderbook-col price">Price</div>
            <div className="orderbook-col size">Size</div>
            <div className="orderbook-col total">Total</div>
          </div>

          {/* Asks (Sell Orders) */}
          <div className="orderbook-asks">
            {asksWithCumulative.map((ask, index) => {
              const depthPercent = (ask.cumulative / maxCumulative) * 100;
              return (
                <div
                  key={`ask-${index}`}
                  className="orderbook-row ask"
                  style={{
                    '--depth': `${depthPercent}%`
                  }}
                  onClick={() => onPriceClick(ask.price)}
                >
                  <div className="orderbook-col price">{formatPrice(ask.price, decimalPrecision)}</div>
                  <div className="orderbook-col size">{formatVolume(ask.size)}</div>
                  <div className="orderbook-col total">{formatVolume(ask.cumulative)}</div>
                </div>
              );
            })}
          </div>

          {/* Mid Price & Spread */}
          <div className="orderbook-mid">
            <div className="mid-price">
              Mid: {formatPrice(spreadData.midPrice, decimalPrecision)}
            </div>
            <div className="spread">
              Spread: {formattedSpread.spreadPercent}
            </div>
          </div>

          {/* Bids (Buy Orders) */}
          <div className="orderbook-bids">
            {bidsWithCumulative.map((bid, index) => {
              const depthPercent = (bid.cumulative / maxCumulative) * 100;
              return (
                <div
                  key={`bid-${index}`}
                  className="orderbook-row bid"
                  style={{
                    '--depth': `${depthPercent}%`
                  }}
                  onClick={() => onPriceClick(bid.price)}
                >
                  <div className="orderbook-col price">{formatPrice(bid.price, decimalPrecision)}</div>
                  <div className="orderbook-col size">{formatVolume(bid.size)}</div>
                  <div className="orderbook-col total">{formatVolume(bid.cumulative)}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <RecentTrades trades={recentTrades} />
      )}
    </div>
  );
};

export default OrderBook;

