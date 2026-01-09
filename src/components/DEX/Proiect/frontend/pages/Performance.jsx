/**
 * 📈 Performance Page - Performance Analytics Page
 * 
 * Performance analytics page:
 * - Performance metrics
 * - Risk metrics
 * - Performance charts
 * - Trading history
 * 
 * @module Performance
 */

import React, { useState } from 'react';
import { usePerformance } from '../hooks/usePerformance';
import PerformanceChart from '../components/performance/PerformanceChart';
import MetricsDisplay from '../components/performance/MetricsDisplay';
import RiskMetrics from '../components/performance/RiskMetrics';
import PerformanceHistory from '../components/performance/PerformanceHistory';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { TIME_PERIODS } from '../utils/constants';

const Performance = ({ userId }) => {
  const [period, setPeriod] = useState('30d');
  
  const {
    metrics,
    riskMetrics,
    history,
    chartsData,
    loading,
    error,
    refreshing,
    refresh
  } = usePerformance(userId, { period, autoRefresh: true });

  if (!userId) {
    return (
      <div className="performance-page">
        <p>User ID is required</p>
      </div>
    );
  }

  return (
    <div className="performance-page">
      <div className="performance-page-header">
        <h1 className="performance-page-title">Performance Analytics</h1>
        <div className="performance-page-period-selector">
          <label>Period:</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            {Object.entries(TIME_PERIODS).map(([key, value]) => (
              <option key={key} value={value}>{key}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="performance-page-error">
          <p>{error}</p>
        </div>
      )}

      {loading && !metrics && (
        <LoadingSpinner message="Loading performance data..." />
      )}

      <div className="performance-page-content">
        {/* Metrics Display */}
        {metrics && (
          <section className="performance-page-section">
            <MetricsDisplay metrics={metrics} />
          </section>
        )}

        {/* Risk Metrics */}
        {riskMetrics && (
          <section className="performance-page-section">
            <RiskMetrics riskMetrics={riskMetrics} />
          </section>
        )}

        {/* Performance Chart */}
        {chartsData && (
          <section className="performance-page-section">
            <PerformanceChart chartsData={chartsData} period={period} />
          </section>
        )}

        {/* Trading History */}
        <section className="performance-page-section">
          <PerformanceHistory userId={userId} />
        </section>
      </div>
    </div>
  );
};

export default Performance;

