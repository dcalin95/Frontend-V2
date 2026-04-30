/**
 * 📊 MetricsDisplay Component - Performance Metrics Display
 * 
 * Component pentru displaying performance metrics:
 * - Total trades
 * - Win rate
 * - Total profit/loss
 * - Average profit per trade
 * - Profit factor
 * - Sharpe ratio
 * 
 * @module MetricsDisplay
 */

import React from 'react';
import { TrendingUp, TrendingDown, Target, DollarSign, BarChart3, Activity } from 'lucide-react';
import { formatNumber, formatPercentage, formatCurrency } from '../utils/DEX/formatters';
import '../../../styles/DEX/components/metrics-display.css';

const MetricsDisplay = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="metrics-display">
        <p className="metrics-display-empty">No metrics available</p>
      </div>
    );
  }

  const totalProfit = metrics.totalProfit || 0;
  const isProfit = totalProfit >= 0;

  return (
    <div className="metrics-display">
      <div className="metrics-display-header">
        <h2 className="metrics-display-title">Performance Metrics</h2>
      </div>

      <div className="metrics-display-grid">
        {/* Total Trades */}
        <div className="metrics-display-card">
          <div className="metrics-display-card-header">
            <Target size={20} />
            <span className="metrics-display-card-label">Total Trades</span>
          </div>
          <div className="metrics-display-card-value">
            {formatNumber(metrics.totalTrades || 0, 0)}
          </div>
          {metrics.winningTrades !== undefined && metrics.losingTrades !== undefined && (
            <div className="metrics-display-card-subtext">
              {metrics.winningTrades}W / {metrics.losingTrades}L
            </div>
          )}
        </div>

        {/* Win Rate */}
        <div className="metrics-display-card">
          <div className="metrics-display-card-header">
            <TrendingUp size={20} />
            <span className="metrics-display-card-label">Win Rate</span>
          </div>
          <div className="metrics-display-card-value">
            {formatPercentage(metrics.winRate || 0, 2, true)}
          </div>
          <div className="metrics-display-card-subtext">
            {metrics.winningTrades || 0} winning trades
          </div>
        </div>

        {/* Total Profit/Loss */}
        <div className={`metrics-display-card ${isProfit ? 'profit' : 'loss'}`}>
          <div className="metrics-display-card-header">
            {isProfit ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            <span className="metrics-display-card-label">Total P/L</span>
          </div>
          <div className={`metrics-display-card-value ${isProfit ? 'profit' : 'loss'}`}>
            {formatCurrency(Math.abs(totalProfit))}
            {isProfit ? ' ↗' : ' ↘'}
          </div>
          {metrics.totalProfitUSD !== undefined && (
            <div className="metrics-display-card-subtext">
              ≈ {formatCurrency(metrics.totalProfitUSD, '$', 2)}
            </div>
          )}
        </div>

        {/* Average Profit Per Trade */}
        {metrics.averageProfitPerTrade !== undefined && (
          <div className="metrics-display-card">
            <div className="metrics-display-card-header">
              <DollarSign size={20} />
              <span className="metrics-display-card-label">Avg P/Trade</span>
            </div>
            <div className={`metrics-display-card-value ${metrics.averageProfitPerTrade >= 0 ? 'profit' : 'loss'}`}>
              {formatCurrency(Math.abs(metrics.averageProfitPerTrade))}
            </div>
          </div>
        )}

        {/* Profit Factor */}
        {metrics.profitFactor !== undefined && (
          <div className="metrics-display-card">
            <div className="metrics-display-card-header">
              <BarChart3 size={20} />
              <span className="metrics-display-card-label">Profit Factor</span>
            </div>
            <div className="metrics-display-card-value">
              {formatNumber(metrics.profitFactor, 2)}
            </div>
            <div className="metrics-display-card-subtext">
              {metrics.profitFactor >= 1 ? 'Profitable' : 'Unprofitable'}
            </div>
          </div>
        )}

        {/* Sharpe Ratio */}
        {metrics.sharpeRatio !== undefined && (
          <div className="metrics-display-card">
            <div className="metrics-display-card-header">
              <Activity size={20} />
              <span className="metrics-display-card-label">Sharpe Ratio</span>
            </div>
            <div className="metrics-display-card-value">
              {formatNumber(metrics.sharpeRatio, 2)}
            </div>
            <div className="metrics-display-card-subtext">
              {metrics.sharpeRatio >= 1 ? 'Good' : metrics.sharpeRatio >= 0.5 ? 'Fair' : 'Poor'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsDisplay;

