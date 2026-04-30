/**
 * ChartToolbar – bara de deasupra chart-ului: selector token/perechi + butoane timeframe (1m … 1W).
 * Același aspect pe EVM Trade, SEI Trade, SOL Trade, STX Trade.
 * @module ChartToolbar
 */

import React from 'react';
import '../../styles/components/chart-toolbar.css';

/** Intervale TradingView: 1, 5, 15, 30, 60, 240, D, W */
export const CHART_TIMEFRAMES = [
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '30m', value: '30' },
  { label: '1h', value: '60' },
  { label: '4h', value: '240' },
  { label: '1D', value: 'D' },
  { label: '1W', value: 'W' },
];

const ChartToolbar = ({
  interval,
  onIntervalChange,
  leftContent = null,
  className = '',
  accentClass = '',
}) => (
  <div className={`chart-toolbar ${accentClass} ${className}`.trim()} role="toolbar" aria-label="Chart toolbar">
    {leftContent && <div className="chart-toolbar-left">{leftContent}</div>}
    <div className="chart-toolbar-timeframes">
      {CHART_TIMEFRAMES.map(({ label, value }) => (
        <button
          key={value}
          type="button"
          className={`chart-toolbar-timeframe-btn ${interval === value ? 'active' : ''}`}
          onClick={() => onIntervalChange(value)}
          aria-pressed={interval === value}
          aria-label={`Timeframe ${label}`}
        >
          {label}
        </button>
      ))}
    </div>
  </div>
);

export default ChartToolbar;
