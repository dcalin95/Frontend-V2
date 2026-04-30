/**
 * 📈 PortfolioValueChart Component - Portfolio Value Chart
 * 
 * Component pentru afișarea evoluției valorii portofoliului în timp:
 * - Area chart pentru portfolio value
 * - Time period selector (1D, 7D, 30D, 90D, 1Y, All)
 * - Real portfolio data (din wallet/API)
 * 
 * @module PortfolioValueChart
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../ui';
import { getChartsData } from '../../services/performanceApiService';
import { useDexAuth } from '../../context/DexAuthContext';
import { errorWithPrefix } from '../../utils/logger';
import '../../styles/components/portfolio-value-chart.css';

const PortfolioValueChart = React.memo(() => {
  const { walletAddress, associatedWalletAddress } = useDexAuth();
  const effectiveUserWallet = walletAddress || associatedWalletAddress || null;
  const [period, setPeriod] = useState('30d'); // '1d', '7d', '30d', '90d', '1y', 'all'
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Real API data only. No fake or unverified chart data.
  useEffect(() => {
    const loadChartData = async () => {
      if (!effectiveUserWallet) {
        setChartData([]);
        setLoadError(null);
        return;
      }

      try {
        setLoading(true);
        setLoadError(null);
        const apiPeriod = period === 'all' ? '1y' : period;
        const response = await getChartsData(effectiveUserWallet, apiPeriod);

        if (response.success && response.charts) {
          const data = (response.charts.portfolioValue || []).map(point => ({
            date: point.date || point.timestamp,
            value: parseFloat(point.value || 0),
            timestamp: new Date(point.date || point.timestamp).getTime()
          }));
          setChartData(data.length > 0 ? data : []);
        } else {
          setChartData([]);
        }
      } catch (err) {
        errorWithPrefix('PortfolioValueChart', 'Error loading chart data:', err);
        setLoadError(err?.message || 'Failed to load chart data');
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, [period, effectiveUserWallet]);

  const formatNumber = useCallback((num) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  }, []);

  const formatDate = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (period === '1d') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    if (period === '7d') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    if (diffDays < 30) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }, [period]);

  const noWallet = !effectiveUserWallet;
  const hasData = chartData.length > 0;
  const currentValue = chartData[chartData.length - 1]?.value || 0;
  const previousValue = chartData[chartData.length - 2]?.value || currentValue;
  const change = currentValue - previousValue;
  const changePercent = previousValue > 0 ? ((change / previousValue) * 100) : 0;
  const isPositive = change >= 0;

  const periods = [
    { value: '1d', label: '1D' },
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
    { value: '90d', label: '90D' },
    { value: '1y', label: '1Y' },
    { value: 'all', label: 'All' }
  ];

  return (
    <Card className="portfolio-value-chart-container" padding="md">
      <Card.Header>
        <div className="portfolio-value-chart-header">
          <div>
            <Card.Title>Portfolio Value</Card.Title>
            <div className="portfolio-value-chart-stats">
              <span className="portfolio-value-chart-current-value">
                {(noWallet || (!hasData && !loading)) ? '—' : formatNumber(currentValue)}
              </span>
              {hasData && (
              <div className={`portfolio-value-chart-change ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>
                  {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                </span>
                <span className="portfolio-value-chart-change-amount">
                  ({isPositive ? '+' : ''}{formatNumber(change)})
                </span>
              </div>
              )}
            </div>
          </div>
          <div className="portfolio-value-chart-period-selector">
            {periods.map(p => (
              <button
                key={p.value}
                className={`portfolio-value-chart-period-btn ${period === p.value ? 'active' : ''}`}
                onClick={() => setPeriod(p.value)}
                aria-label={`Select ${p.label} period`}
                aria-pressed={period === p.value}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <div className="portfolio-value-chart-wrapper">
          {hasData && (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="portfolioValueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--dex-border)" opacity={0.3} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatDate}
                stroke="var(--dex-text-secondary)"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                tickFormatter={formatNumber}
                stroke="var(--dex-text-secondary)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                formatter={(value) => formatNumber(value)}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                }}
                contentStyle={{
                  backgroundColor: 'var(--dex-bg-secondary)',
                  border: '1px solid var(--dex-border)',
                  borderRadius: 'var(--dex-border-radius)',
                  color: 'var(--dex-text-primary)'
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={isPositive ? '#10b981' : '#ef4444'}
                strokeWidth={2}
                fill="url(#portfolioValueGradient)"
                dot={false}
                activeDot={{ r: 4, fill: isPositive ? '#10b981' : '#ef4444' }}
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>
      </Card.Body>
    </Card>
  );
});

PortfolioValueChart.displayName = 'PortfolioValueChart';

export default PortfolioValueChart;
