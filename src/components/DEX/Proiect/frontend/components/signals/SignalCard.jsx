/**
 * 🎴 SignalCard Component - Signal Card Display
 * 
 * Component pentru displaying single signal card:
 * - Signal type (buy/sell/hold)
 * - Signal confidence
 * - Signal token și price
 * - Signal actions (validate, view details)
 * 
 * @module SignalCard
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus, CheckCircle, XCircle, Radio } from 'lucide-react';
import { formatCurrency, formatPercentage, formatRelativeTime } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';
import '../../styles/components/signal-card.css';

const SignalCard = ({ signal, validating = false, onSelect, onValidate }) => {
  const getSignalConfig = (signalType) => {
    switch (signalType?.toLowerCase()) {
      case 'buy':
        return {
          icon: <TrendingUp size={20} className="signal-icon buy" />,
          label: 'BUY',
          className: 'buy',
          color: '#10b981'
        };
      case 'sell':
        return {
          icon: <TrendingDown size={20} className="signal-icon sell" />,
          label: 'SELL',
          className: 'sell',
          color: '#ef4444'
        };
      case 'hold':
      default:
        return {
          icon: <Minus size={20} className="signal-icon hold" />,
          label: 'HOLD',
          className: 'hold',
          color: '#6b7280'
        };
    }
  };

  const signalConfig = getSignalConfig(signal.signal);

  const confidence = signal.confidence !== undefined ? signal.confidence : null;
  const confidencePercent = confidence !== null ? confidence * 100 : null;

  return (
    <div 
      className={`signal-card signal-card-${signalConfig.className}`}
      onClick={onSelect}
    >
      <div className="signal-card-header">
        <div className="signal-card-signal">
          {signalConfig.icon}
          <span className="signal-card-signal-label">{signalConfig.label}</span>
        </div>
        <div className={`signal-card-valid ${signal.valid !== false ? 'valid' : 'invalid'}`}>
          {signal.valid !== false ? (
            <CheckCircle size={16} className="signal-valid-icon" />
          ) : (
            <XCircle size={16} className="signal-invalid-icon" />
          )}
        </div>
      </div>

      <div className="signal-card-content">
        <div className="signal-card-token">
          <Radio size={16} />
          <span className="signal-card-token-symbol">{signal.token || 'N/A'}</span>
        </div>

        {confidencePercent !== null && (
          <div className="signal-card-confidence">
            <span className="signal-card-confidence-label">Confidence:</span>
            <span className={`signal-card-confidence-value ${confidencePercent >= 70 ? 'high' : confidencePercent >= 50 ? 'medium' : 'low'}`}>
              {formatPercentage(confidencePercent, 1)}
            </span>
          </div>
        )}

        {signal.entryPrice !== undefined && signal.entryPrice !== null && (
          <div className="signal-card-price">
            <span className="signal-card-price-label">Entry Price:</span>
            <span className="signal-card-price-value">
              {formatCurrency(signal.entryPrice)}
            </span>
          </div>
        )}

        {signal.stopLoss !== undefined && signal.stopLoss !== null && (
          <div className="signal-card-stop-loss">
            <span className="signal-card-stop-loss-label">Stop Loss:</span>
            <span className="signal-card-stop-loss-value">
              {formatCurrency(signal.stopLoss)}
            </span>
          </div>
        )}

        {signal.takeProfit !== undefined && signal.takeProfit !== null && (
          <div className="signal-card-take-profit">
            <span className="signal-card-take-profit-label">Take Profit:</span>
            <span className="signal-card-take-profit-value">
              {formatCurrency(signal.takeProfit)}
            </span>
          </div>
        )}

        {signal.reasoning && (
          <div className="signal-card-reasoning">
            <p className="signal-card-reasoning-text">{signal.reasoning}</p>
          </div>
        )}

        {signal.createdAt && (
          <div className="signal-card-date">
            {formatRelativeTime(signal.createdAt)}
          </div>
        )}
      </div>

      <div className="signal-card-actions">
        {onValidate && signal.valid === false && (
          <button
            className="signal-card-btn signal-card-btn-validate"
            onClick={(e) => {
              e.stopPropagation();
              onValidate();
            }}
            disabled={validating}
            title="Validate signal"
          >
            {validating ? (
              <LoadingSpinner size="small" message="" />
            ) : (
              <>
                <CheckCircle size={16} />
                Validate
              </>
            )}
          </button>
        )}
        
        <button
          className="signal-card-btn signal-card-btn-view"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
          title="View details"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

export default SignalCard;

