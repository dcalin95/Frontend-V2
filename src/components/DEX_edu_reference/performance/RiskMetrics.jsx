/**
 * ⚠️ RiskMetrics Component - Risk Metrics Display
 * 
 * Component pentru displaying risk metrics:
 * - Max drawdown
 * - Volatility
 * - Value at Risk (VaR)
 * - Risk-adjusted returns
 * 
 * @module RiskMetrics
 */

import React from 'react';
import { AlertTriangle, TrendingDown, Activity, Shield } from 'lucide-react';
import { formatNumber, formatPercentage, formatCurrency } from '../utils/DEX/formatters';
import '../../../styles/DEX/components/risk-metrics.css';

const RiskMetrics = ({ riskMetrics }) => {
  if (!riskMetrics) {
    return (
      <div className="risk-metrics">
        <p className="risk-metrics-empty">No risk metrics available</p>
      </div>
    );
  }

  return (
    <div className="risk-metrics">
      <div className="risk-metrics-header">
        <h2 className="risk-metrics-title">Risk Metrics</h2>
      </div>

      <div className="risk-metrics-grid">
        {/* Max Drawdown */}
        {riskMetrics.maxDrawdown !== undefined && (
          <div className="risk-metrics-card">
            <div className="risk-metrics-card-header">
              <TrendingDown size={20} />
              <span className="risk-metrics-card-label">Max Drawdown</span>
            </div>
            <div className="risk-metrics-card-value">
              {formatPercentage(riskMetrics.maxDrawdown, 2)}
            </div>
            {riskMetrics.maxDrawdownAmount !== undefined && (
              <div className="risk-metrics-card-subtext">
                {formatCurrency(Math.abs(riskMetrics.maxDrawdownAmount))}
              </div>
            )}
          </div>
        )}

        {/* Volatility */}
        {riskMetrics.volatility !== undefined && (
          <div className="risk-metrics-card">
            <div className="risk-metrics-card-header">
              <Activity size={20} />
              <span className="risk-metrics-card-label">Volatility</span>
            </div>
            <div className="risk-metrics-card-value">
              {formatPercentage(riskMetrics.volatility, 2)}
            </div>
            <div className="risk-metrics-card-subtext">
              {riskMetrics.volatility >= 20 ? 'High' : riskMetrics.volatility >= 10 ? 'Medium' : 'Low'}
            </div>
          </div>
        )}

        {/* Value at Risk (VaR) */}
        {riskMetrics.var !== undefined && (
          <div className="risk-metrics-card">
            <div className="risk-metrics-card-header">
              <AlertTriangle size={20} />
              <span className="risk-metrics-card-label">Value at Risk (VaR)</span>
            </div>
            <div className="risk-metrics-card-value">
              {formatCurrency(Math.abs(riskMetrics.var))}
            </div>
            <div className="risk-metrics-card-subtext">
              95% confidence level
            </div>
          </div>
        )}

        {/* Risk-Adjusted Returns */}
        {riskMetrics.riskAdjustedReturns !== undefined && (
          <div className="risk-metrics-card">
            <div className="risk-metrics-card-header">
              <Shield size={20} />
              <span className="risk-metrics-card-label">Risk-Adjusted Returns</span>
            </div>
            <div className="risk-metrics-card-value">
              {formatPercentage(riskMetrics.riskAdjustedReturns, 2)}
            </div>
          </div>
        )}

        {/* Average Loss */}
        {riskMetrics.averageLoss !== undefined && (
          <div className="risk-metrics-card">
            <div className="risk-metrics-card-header">
              <TrendingDown size={20} />
              <span className="risk-metrics-card-label">Average Loss</span>
            </div>
            <div className="risk-metrics-card-value loss">
              {formatCurrency(Math.abs(riskMetrics.averageLoss))}
            </div>
          </div>
        )}

        {/* Largest Loss */}
        {riskMetrics.largestLoss !== undefined && (
          <div className="risk-metrics-card">
            <div className="risk-metrics-card-header">
              <AlertTriangle size={20} />
              <span className="risk-metrics-card-label">Largest Loss</span>
            </div>
            <div className="risk-metrics-card-value loss">
              {formatCurrency(Math.abs(riskMetrics.largestLoss))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskMetrics;

