/**
 * 📊 MarketStats Component
 * 
 * 24h market statistics display
 * Similar cu Oxium DEX
 */

import React from 'react';
import { formatPrice, formatVolume, formatPercent } from '../../utils/formatPrice';
import './MarketStats.css';

const MarketStats = ({ marketData = null }) => {
  if (!marketData) {
    return (
      <div className="market-stats">
        <div className="market-stat-item">
          <div className="stat-label">Price</div>
          <div className="stat-value">--</div>
        </div>
      </div>
    );
  }

  const {
    price = 0,
    change24h = 0,
    changePercent24h = 0,
    volume24h = 0,
    high24h = 0,
    low24h = 0
  } = marketData;

  const isPositive = change24h >= 0;

  return (
    <div className="market-stats">
      <div className="market-stat-item">
        <div className="stat-label">Price</div>
        <div className="stat-value price-value">
          {formatPrice(price)}
        </div>
      </div>

      <div className="market-stat-item">
        <div className="stat-label">24h Change</div>
        <div className={`stat-value ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '+' : ''}{formatPrice(change24h)} / {formatPercent(changePercent24h)}
        </div>
      </div>

      <div className="market-stat-item">
        <div className="stat-label">24h Volume</div>
        <div className="stat-value">
          ${formatVolume(volume24h)}
        </div>
      </div>

      <div className="market-stat-item">
        <div className="stat-label">24h High</div>
        <div className="stat-value">
          ${formatPrice(high24h)}
        </div>
      </div>

      <div className="market-stat-item">
        <div className="stat-label">24h Low</div>
        <div className="stat-value">
          ${formatPrice(low24h)}
        </div>
      </div>
    </div>
  );
};

export default MarketStats;

