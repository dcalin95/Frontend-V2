/**
 * SignalCard — L1 levels / L2 score / L3 reasoning; presentation only.
 */

import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency, formatPercentage, formatRelativeTime } from '../../utils/formatters';
import LoadingSpinner from '../common/LoadingSpinner';
import '../../styles/components/signal-card.css';

const getSignalConfig = (signalType) => {
  switch (signalType?.toLowerCase()) {
    case 'buy':
      return { label: 'BUY', className: 'buy' };
    case 'sell':
      return { label: 'SELL', className: 'sell' };
    case 'hold':
    default:
      return { label: 'HOLD', className: 'hold' };
  }
};

const scoreBand = (pct) => {
  if (pct >= 70) return 'high';
  if (pct >= 50) return 'medium';
  return 'low';
};

/** Presentation-only: request/correlation id tails → discrete line (same string source). */
function splitReasoningForDisplay(raw) {
  const text = String(raw || '').trim();
  if (!text) return { body: '', meta: '' };

  const metaReq = text.match(/\s+((?:request|req\.?|correlation)\s*id\s*[:#]?\s*.+)$/i);
  if (metaReq && metaReq.index > 8) {
    return {
      body: text.slice(0, metaReq.index).trim(),
      meta: metaReq[1].trim(),
    };
  }

  const metaUuid = text.match(/\s+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[^.]*)\s*$/i);
  if (metaUuid && metaUuid.index > 12) {
    return {
      body: text.slice(0, metaUuid.index).trim(),
      meta: metaUuid[1].trim(),
    };
  }

  return { body: text, meta: '' };
}

const SignalCard = ({ signal, validating = false, onSelect, onValidate, onExecuteSignal }) => {
  const signalConfig = getSignalConfig(signal.signal);

  const confidence = signal.confidence !== undefined ? signal.confidence : null;
  const confidencePercent = confidence !== null ? confidence * 100 : null;

  const hasEntry = signal.entryPrice !== undefined && signal.entryPrice !== null;
  const hasSl = signal.stopLoss !== undefined && signal.stopLoss !== null;
  const hasTp = signal.takeProfit !== undefined && signal.takeProfit !== null;
  const hasLevels = hasEntry || hasSl || hasTp;
  const hasScore = confidencePercent !== null;

  const reasoning = signal.reasoning ? String(signal.reasoning) : '';
  const { body: reasoningBody, meta: reasoningMeta } = splitReasoningForDisplay(reasoning);

  return (
    <div className={`signal-card signal-card-${signalConfig.className}`} onClick={onSelect}>
      <div className="signal-card__head">
        <div className="signal-card__identity">
          <span className="signal-card__signal-label">{signalConfig.label}</span>
          <span className="signal-card__token">{signal.token || '—'}</span>
        </div>
        <div className={`signal-card__valid ${signal.valid !== false ? 'valid' : 'invalid'}`}>
          {signal.valid !== false ? (
            <CheckCircle size={14} strokeWidth={2} className="signal-valid-icon" aria-hidden />
          ) : (
            <XCircle size={14} strokeWidth={2} className="signal-invalid-icon" aria-hidden />
          )}
        </div>
      </div>

      {hasLevels ? (
        <div className="signal-card__levels" aria-label="Price levels">
          {hasEntry && (
            <div className="signal-card__metric">
              <span className="signal-card__metric-label">Entry</span>
              <span className="signal-card__metric-value">{formatCurrency(signal.entryPrice)}</span>
            </div>
          )}
          {hasSl && (
            <div className="signal-card__metric">
              <span className="signal-card__metric-label">Stop loss</span>
              <span className="signal-card__metric-value">{formatCurrency(signal.stopLoss)}</span>
            </div>
          )}
          {hasTp && (
            <div className="signal-card__metric">
              <span className="signal-card__metric-label">Take profit</span>
              <span className="signal-card__metric-value">{formatCurrency(signal.takeProfit)}</span>
            </div>
          )}
        </div>
      ) : null}

      {hasScore ? (
        <div className="signal-card__score-row">
          <span className="signal-card__score-label">Decision score</span>
          <span
            className={`signal-card__score-value signal-card__score-value--${scoreBand(confidencePercent)}`}
            title="Heuristic decision score; not a calibrated probability."
          >
            {formatPercentage(confidencePercent, 1)}
          </span>
        </div>
      ) : null}

      {reasoningBody || reasoningMeta ? (
        <div className="signal-card__reasoning" title={reasoning}>
          {reasoningBody ? <p className="signal-card__reasoning-text">{reasoningBody}</p> : null}
          {reasoningMeta ? <p className="signal-card__reasoning-meta">{reasoningMeta}</p> : null}
        </div>
      ) : null}

      <div className="signal-card__foot">
        <span className="signal-card__time">
          {signal.createdAt ? formatRelativeTime(signal.createdAt) : '—'}
        </span>
        <div className="signal-card__actions">
          {onExecuteSignal && (signal.signal === 'buy' || signal.signal === 'sell') && (
            <button
              type="button"
              className="signal-card-btn signal-card-btn-execute"
              onClick={(e) => {
                e.stopPropagation();
                onExecuteSignal(signal);
              }}
              title="Execute signal on Trade page"
            >
              Execute
            </button>
          )}
          {onValidate && signal.valid === false && (
            <button
              type="button"
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
                  <CheckCircle size={13} aria-hidden />
                  Validate
                </>
              )}
            </button>
          )}
          <button
            type="button"
            className="signal-card-btn signal-card-btn-view"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            title="View details"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignalCard;
