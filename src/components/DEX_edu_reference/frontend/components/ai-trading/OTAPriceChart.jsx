/**
 * OTAPriceChart – chart pentru perechea token/USDT selectată în Header.
 * Sincronizat cu HeaderTokenSelector via token prop.
 * @module OTAPriceChart
 */

import React, { useMemo } from 'react';
import { LineChart } from 'lucide-react';
import TradingViewChart from '../common/TradingViewChart';
import '../../styles/components/ota-price-chart.css';

const DEFAULT_TOKEN = 'BNB';

/**
 * Get TradingView symbol for token (BINANCE:{token}USDT)
 * @param {string} token - Token symbol (BTC, ETH, CAKE, etc.)
 */
function getChartSymbol(token) {
  const t = (token || DEFAULT_TOKEN).toUpperCase();
  return `BINANCE:${t}USDT`;
}

const OTAPriceChart = ({ height = 240, interval = '60', className = '', token }) => {
  const chartSymbol = useMemo(() => getChartSymbol(token), [token]);
  const pairLabel = `${token || DEFAULT_TOKEN}/USDT`;

  return (
    <div className={`ota-price-chart ${className}`} role="region" aria-label={`OTA chart ${pairLabel}`}>
      <div className="ota-price-chart-header">
        <LineChart size={16} className="ota-price-chart-icon" />
        <span className="ota-price-chart-title">{pairLabel}</span>
      </div>
      <div className="ota-price-chart-body" style={{ height: `${height}px` }}>
        <TradingViewChart
          symbol={chartSymbol}
          interval={interval}
          theme="dark"
          height={height}
          autosize={false}
        />
      </div>
    </div>
  );
};

export default OTAPriceChart;
