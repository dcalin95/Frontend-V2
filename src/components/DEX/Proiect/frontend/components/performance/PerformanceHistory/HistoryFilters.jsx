/**
 * 🔍 HistoryFilters Component - Performance History Filters
 */

import React from 'react';
import { TIME_PERIODS, TRADE_STATUS } from '../../../utils/constants';
import '../../../../styles/components/performance-history.css';

const HistoryFilters = ({ filters, onFilterChange }) => {
  const periodOptions = Object.entries(TIME_PERIODS).map(([key, value]) => ({
    value,
    label: key
  }));

  const statusOptions = Object.values(TRADE_STATUS).map(status => ({
    value: status,
    label: status.charAt(0).toUpperCase() + status.slice(1)
  }));

  return (
    <div className="performance-history-filters">
      <select
        className="performance-history-filter-select"
        value={filters.period || '30d'}
        onChange={(e) => onFilterChange({ ...filters, period: e.target.value })}
      >
        {periodOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        className="performance-history-filter-select"
        value={filters.status || ''}
        onChange={(e) => onFilterChange({ ...filters, status: e.target.value || null })}
      >
        <option value="">All Status</option>
        {statusOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default HistoryFilters;

