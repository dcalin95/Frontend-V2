/**
 * 📊 PerformanceChart Component - Performance Chart Display
 * 
 * Component pentru displaying performance charts:
 * - Line chart pentru P/L
 * - Area chart pentru equity curve
 * - Bar chart pentru monthly returns
 * - Chart type selector
 * 
 * @module PerformanceChart
 */

import React, { useState } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/DEX/formatters';
import { CHART_TYPES } from '../utils/DEX/constants';
import '../../../styles/DEX/components/performance-chart.css';

const PerformanceChart = ({ chartsData, period = '30d' }) => {
  const [chartType, setChartType] = useState(CHART_TYPES.LINE);

  if (!chartsData) {
    return (
      <div className="performance-chart">
        <p className="performance-chart-empty">No chart data available</p>
      </div>
    );
  }

  // Transform data pentru Recharts
  const chartData = chartsData.data || chartsData.history || [];
  const formattedData = chartData.map(item => ({
    date: item.date || item.createdAt || item.timestamp,
    value: item.value || item.pnl || item.profit || 0,
    cumulative: item.cumulative || item.totalProfit || 0,
    ...item
  }));

  const renderChart = () => {
    switch (chartType) {
      case CHART_TYPES.AREA:
        return (
          <AreaChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(value) => formatDate(value, 'short')} />
            <YAxis tickFormatter={(value) => formatCurrency(value, '$', 0)} />
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              labelFormatter={(label) => formatDate(label, 'datetime')}
            />
            <Legend />
            <Area type="monotone" dataKey="cumulative" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} name="Cumulative P/L" />
          </AreaChart>
        );
      case CHART_TYPES.BAR:
        return (
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(value) => formatDate(value, 'short')} />
            <YAxis tickFormatter={(value) => formatCurrency(value, '$', 0)} />
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              labelFormatter={(label) => formatDate(label, 'datetime')}
            />
            <Legend />
            <Bar dataKey="value" fill="#6366f1" name="P/L" />
          </BarChart>
        );
      case CHART_TYPES.LINE:
      default:
        return (
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={(value) => formatDate(value, 'short')} />
            <YAxis tickFormatter={(value) => formatCurrency(value, '$', 0)} />
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              labelFormatter={(label) => formatDate(label, 'datetime')}
            />
            <Legend />
            <Line type="monotone" dataKey="cumulative" stroke="#6366f1" strokeWidth={2} name="Cumulative P/L" />
            <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={1} name="P/L" />
          </LineChart>
        );
    }
  };

  return (
    <div className="performance-chart">
      <div className="performance-chart-header">
        <h3 className="performance-chart-title">Performance Chart ({period})</h3>
        <div className="performance-chart-type-selector">
          <button
            className={`performance-chart-type-btn ${chartType === CHART_TYPES.LINE ? 'active' : ''}`}
            onClick={() => setChartType(CHART_TYPES.LINE)}
            title="Line Chart"
          >
            <TrendingUp size={16} />
          </button>
          <button
            className={`performance-chart-type-btn ${chartType === CHART_TYPES.AREA ? 'active' : ''}`}
            onClick={() => setChartType(CHART_TYPES.AREA)}
            title="Area Chart"
          >
            <Activity size={16} />
          </button>
          <button
            className={`performance-chart-type-btn ${chartType === CHART_TYPES.BAR ? 'active' : ''}`}
            onClick={() => setChartType(CHART_TYPES.BAR)}
            title="Bar Chart"
          >
            <BarChart3 size={16} />
          </button>
        </div>
      </div>

      <div className="performance-chart-content">
        {formattedData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            {renderChart()}
          </ResponsiveContainer>
        ) : (
          <p className="performance-chart-empty">No data available for selected period</p>
        )}
      </div>
    </div>
  );
};

export default PerformanceChart;

