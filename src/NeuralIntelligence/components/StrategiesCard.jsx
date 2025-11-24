import React, { useState } from 'react';
import { Target, Shield, TrendingUp } from 'lucide-react';
import '../styles/NeuralIntelligence.css';

/**
 * Strategy Card Component
 * Displays individual strategy with toggle and risk level selector
 * 
 * @param {Object} props
 * @param {Object} props.strategy - Strategy data
 * @param {Function} props.onToggle - Callback when strategy is toggled
 * @param {Function} props.onRiskChange - Callback when risk level changes
 * @param {boolean} props.disabled - Whether controls are disabled
 */
const StrategyCard = ({ strategy, onToggle, onRiskChange, disabled }) => {
  const [showDetails, setShowDetails] = useState(false);

  const riskLevels = ['Conservative', 'Balanced', 'Aggressive'];
  const riskColors = {
    'Conservative': '#00FFA3',
    'Balanced': '#FFC107',
    'Aggressive': '#E6444D'
  };

  return (
    <div className={`strategy-card ${strategy.enabled ? 'enabled' : 'disabled'}`}>
      <div className="strategy-header">
        <div className="strategy-title-row">
          <h4>{strategy.name}</h4>
          <div 
            className="risk-badge" 
            style={{ 
              background: `${riskColors[strategy.riskLevel]}20`,
              color: riskColors[strategy.riskLevel],
              border: `1px solid ${riskColors[strategy.riskLevel]}40`
            }}
          >
            {strategy.riskLevel}
          </div>
        </div>

        <label className="strategy-toggle">
          <input
            type="checkbox"
            checked={strategy.enabled}
            onChange={() => onToggle(strategy.id)}
            disabled={disabled}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <p className="strategy-description">{strategy.description}</p>

      {/* Performance Stats (if available) */}
      {strategy.performance && (
        <div className="strategy-performance">
          <div className="perf-stat">
            <span className="perf-label">Win Rate</span>
            <span className="perf-value">{strategy.performance.winRate}%</span>
          </div>
          <div className="perf-stat">
            <span className="perf-label">Avg Profit</span>
            <span className="perf-value">+{strategy.performance.avgProfit}%</span>
          </div>
          <div className="perf-stat">
            <span className="perf-label">Trades (30d)</span>
            <span className="perf-value">{strategy.performance.tradesLast30d}</span>
          </div>
        </div>
      )}

      {/* Risk Level Selector (only when enabled) */}
      {strategy.enabled && (
        <div className="risk-selector">
          <label className="risk-label">Risk Level:</label>
          <div className="risk-buttons">
            {riskLevels.map(level => (
              <button
                key={level}
                className={`risk-btn ${strategy.riskLevel === level ? 'active' : ''}`}
                onClick={() => onRiskChange(strategy.id, level)}
                disabled={disabled}
                style={{
                  borderColor: strategy.riskLevel === level ? riskColors[level] : 'transparent'
                }}
              >
                {level.substring(0, 4)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Strategies & Risk Profile Component
 * Main container for all strategies and global risk settings
 * 
 * @param {Object} props
 * @param {Array} props.strategies - List of available strategies
 * @param {Object} props.riskLimits - Global risk limits
 * @param {Function} props.onStrategyToggle - Callback when strategy is toggled
 * @param {Function} props.onRiskLevelChange - Callback when risk level changes
 * @param {boolean} props.disabled - Whether controls are disabled
 */
const StrategiesCard = ({
  strategies,
  riskLimits,
  onStrategyToggle,
  onRiskLevelChange,
  disabled
}) => {
  return (
    <div className="neural-card strategies-card">
      {/* Header */}
      <div className="neural-card-header">
        <div className="header-left">
          <Target size={20} style={{ color: '#00FFA3' }} />
          <h3>Strategies & Risk Profile</h3>
        </div>
        <div className="active-count">
          {strategies.filter(s => s.enabled).length} / {strategies.length} Active
        </div>
      </div>

      {/* Strategies List */}
      <div className="strategies-list">
        {strategies.map(strategy => (
          <StrategyCard
            key={strategy.id}
            strategy={strategy}
            onToggle={onStrategyToggle}
            onRiskChange={onRiskLevelChange}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Global Risk Limits */}
      <div className="risk-limits-section">
        <div className="section-header">
          <Shield size={18} style={{ color: '#00FFA3' }} />
          <h4>Global Risk Limits</h4>
        </div>
        
        <div className="risk-limits-grid">
          <div className="limit-item">
            <span className="limit-label">Max % Per Trade</span>
            <span className="limit-value">{riskLimits.maxPercentPerTrade}%</span>
          </div>
          <div className="limit-item">
            <span className="limit-label">Max Open Positions</span>
            <span className="limit-value">{riskLimits.maxOpenPositions}</span>
          </div>
          <div className="limit-item">
            <span className="limit-label">Daily Loss Limit</span>
            <span className="limit-value">{riskLimits.dailyLossLimit}%</span>
          </div>
          <div className="limit-item">
            <span className="limit-label">Stop Loss Default</span>
            <span className="limit-value">{riskLimits.stopLossDefault}%</span>
          </div>
        </div>

        <div className="limits-note">
          <span className="note-icon">ℹ️</span>
          <span>Risk limits are enforced automatically by the AI system</span>
        </div>
      </div>
    </div>
  );
};

export default StrategiesCard;

