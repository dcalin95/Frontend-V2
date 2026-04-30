/**
 * 📊 BotStatistics Component - OpenAI Trading Agent (OTA) Statistics Display
 * 
 * Component pentru displaying OpenAI Trading Agent (OTA) statistics:
 * - Total trades
 * - Win rate
 * - Total profit/loss
 * - Average profit per trade
 * - Best/Worst trades
 * 
 * @module BotStatistics
 */

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import { formatNumber, formatPercentage, formatCurrency } from '../../utils/formatters';
import { AGENT_UI_LABELS } from '../../utils/aiTradingConstants';
import '../../styles/components/bot-statistics.css';

const BotStatistics = React.memo(({ stats }) => {
  // All hooks must be called before any early returns
  const totalProfit = useMemo(() => stats?.totalProfit || 0, [stats?.totalProfit]);
  const isProfit = useMemo(() => totalProfit >= 0, [totalProfit]);
  
  const winRateDisplay = useMemo(() => 
    stats?.winRate ? formatPercentage(stats.winRate, 2, true) : formatPercentage(0, 2, true),
    [stats?.winRate]
  );

  const profitDisplay = useMemo(() => 
    formatCurrency(Math.abs(totalProfit)),
    [totalProfit]
  );

  // Early return after all hooks
  if (!stats) {
    return (
      <div className="bot-statistics ota-statistics" role="status" aria-live="polite">
        <p className="bot-statistics-empty ota-statistics-empty">No statistics available</p>
      </div>
    );
  }

  return (
    <div className="bot-statistics ota-statistics" role="region" aria-label={AGENT_UI_LABELS.statistics}>
      <header className="bot-statistics-header ota-statistics-header">
        <h2 className="bot-statistics-title ota-statistics-title">{AGENT_UI_LABELS.statistics}</h2>
      </header>

      <div className="bot-statistics-grid">
        {/* Total Trades */}
        <div className="bot-statistics-card">
          <div className="bot-statistics-card-header">
            <Target size={20} />
            <span className="bot-statistics-card-label">Total Trades</span>
          </div>
          <div className="bot-statistics-card-value">
            {formatNumber(stats.totalTrades || 0, 0)}
          </div>
        </div>

        {/* Win Rate */}
        <div className="bot-statistics-card">
          <div className="bot-statistics-card-header">
            <TrendingUp size={20} />
            <span className="bot-statistics-card-label">Win Rate</span>
          </div>
          <div className="bot-statistics-card-value" aria-label={`Win rate: ${winRateDisplay}`}>
            {winRateDisplay}
          </div>
          {stats.winningTrades !== undefined && stats.losingTrades !== undefined && (
            <div className="bot-statistics-card-subtext">
              {stats.winningTrades}W / {stats.losingTrades}L
            </div>
          )}
        </div>

        {/* Total Profit/Loss */}
        <div className={`bot-statistics-card ${isProfit ? 'profit' : 'loss'}`}>
          <div className="bot-statistics-card-header">
            {isProfit ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            <span className="bot-statistics-card-label">Total P/L</span>
          </div>
          <div 
            className={`bot-statistics-card-value ${isProfit ? 'profit' : 'loss'}`}
            aria-label={`Total profit/loss: ${profitDisplay} ${isProfit ? 'profit' : 'loss'}`}
          >
            {profitDisplay}
            <span aria-hidden="true">{isProfit ? ' ↗' : ' ↘'}</span>
          </div>
          {stats.totalProfitUSD !== undefined && (
            <div className="bot-statistics-card-subtext">
              ≈ {formatCurrency(stats.totalProfitUSD, '$', 2)}
            </div>
          )}
        </div>

        {/* Average Profit Per Trade */}
        {stats.averageProfitPerTrade !== undefined && (
          <div className="bot-statistics-card">
            <div className="bot-statistics-card-header">
              <DollarSign size={20} />
              <span className="bot-statistics-card-label">Avg P/Trade</span>
            </div>
            <div className={`bot-statistics-card-value ${stats.averageProfitPerTrade >= 0 ? 'profit' : 'loss'}`}>
              {formatCurrency(Math.abs(stats.averageProfitPerTrade))}
            </div>
          </div>
        )}

        {/* Profit Factor */}
        {stats.profitFactor !== undefined && (
          <div className="bot-statistics-card">
            <div className="bot-statistics-card-header">
              <TrendingUp size={20} />
              <span className="bot-statistics-card-label">Profit Factor</span>
            </div>
            <div className="bot-statistics-card-value">
              {formatNumber(stats.profitFactor, 2)}
            </div>
            <div className="bot-statistics-card-subtext">
              {stats.profitFactor >= 1 ? 'Profitable' : 'Unprofitable'}
            </div>
          </div>
        )}

        {/* Sharpe Ratio */}
        {stats.sharpeRatio !== undefined && (
          <div className="bot-statistics-card">
            <div className="bot-statistics-card-header">
              <Target size={20} />
              <span className="bot-statistics-card-label">Sharpe Ratio</span>
            </div>
            <div className="bot-statistics-card-value">
              {formatNumber(stats.sharpeRatio, 2)}
            </div>
            <div className="bot-statistics-card-subtext">
              {stats.sharpeRatio >= 1 ? 'Good' : stats.sharpeRatio >= 0.5 ? 'Fair' : 'Poor'}
            </div>
          </div>
        )}
      </div>

      {/* Additional Stats */}
      {(stats.bestTrade !== undefined || stats.worstTrade !== undefined) && (
        <div className="bot-statistics-additional">
          {stats.bestTrade !== undefined && (
            <div className="bot-statistics-additional-item">
              <span className="bot-statistics-additional-label">Best Trade:</span>
              <span className="bot-statistics-additional-value profit">
                {formatCurrency(stats.bestTrade)}
              </span>
            </div>
          )}
          {stats.worstTrade !== undefined && (
            <div className="bot-statistics-additional-item">
              <span className="bot-statistics-additional-label">Worst Trade:</span>
              <span className="bot-statistics-additional-value loss">
                {formatCurrency(Math.abs(stats.worstTrade))}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

BotStatistics.displayName = 'BotStatistics';

export default BotStatistics;

