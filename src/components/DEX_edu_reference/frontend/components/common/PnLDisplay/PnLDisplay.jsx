/**
 * 💰 PnLDisplay Component - Profit/Loss Display
 */

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';
import './PnLDisplay.css';

const PnLDisplay = ({ value, size = 'base', showIcon = true, className = '' }) => {
  const isProfit = value >= 0;
  const absValue = Math.abs(value);

  return (
    <div className={`pnl-display ${isProfit ? 'pnl-profit' : 'pnl-loss'} pnl-size-${size} ${className}`}>
      {showIcon && (
        isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />
      )}
      <span className="pnl-value">
        {formatCurrency(absValue)}
        {isProfit ? ' ↗' : ' ↘'}
      </span>
    </div>
  );
};

export default PnLDisplay;

