/**
 * 📊 RecentTrades Component
 * 
 * Recent trades feed
 */

import React from 'react';
import { formatPrice, formatVolume } from '../../utils/formatPrice';
import './RecentTrades.css';

const RecentTrades = ({ trades = [] }) => {
  return (
    <div className="recent-trades">
      <div className="recent-trades-header">
        <div className="trade-col price">Price</div>
        <div className="trade-col size">Size</div>
        <div className="trade-col time">Time</div>
      </div>

      <div className="recent-trades-list">
        {trades.length === 0 ? (
          <div className="empty-trades">
            No recent trades
          </div>
        ) : (
          trades.slice(0, 20).map((trade, index) => {
            const isBuy = trade.side === 'buy';
            return (
              <div
                key={`trade-${index}`}
                className={`recent-trade-item ${isBuy ? 'buy' : 'sell'}`}
              >
                <div className="trade-col price">
                  {formatPrice(trade.price)}
                </div>
                <div className="trade-col size">
                  {formatVolume(trade.size)}
                </div>
                <div className="trade-col time">
                  {new Date(trade.timestamp).toLocaleTimeString()}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentTrades;

