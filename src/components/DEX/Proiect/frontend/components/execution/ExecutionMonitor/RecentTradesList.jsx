/**
 * 📋 RecentTradesList Component - Recent Trades Display
 */

import React from 'react';
import { formatTokenAmount, formatRelativeTime } from '../../../utils/formatters';
import { PnLDisplay } from '../../common/PnLDisplay';
import { StatusBadge } from '../../common/StatusBadge';
import { getTradeStatusConfig } from '../../../utils/statusConfigs';
import '../../../../styles/components/execution-monitor.css';

const RecentTradesList = ({ trades, limit = 5 }) => {
  const recentTrades = trades?.slice(0, limit) || [];

  if (recentTrades.length === 0) {
    return (
      <div className="execution-monitor-recent-empty">
        <p>No recent trades</p>
      </div>
    );
  }

  return (
    <div className="execution-monitor-recent-list">
      {recentTrades.map((trade) => {
        const statusConfig = getTradeStatusConfig(trade.status);
        const pnl = trade.pnl || 0;

        return (
          <div key={trade.id} className="execution-monitor-recent-item">
            <div className="execution-monitor-recent-item-header">
              <span className="execution-monitor-recent-item-pair">
                {trade.tokenIn} → {trade.tokenOut}
              </span>
              <StatusBadge status={trade.status} config={statusConfig} />
            </div>
            <div className="execution-monitor-recent-item-content">
              <span className="execution-monitor-recent-item-amount">
                {formatTokenAmount(trade.amountIn, trade.tokenIn)}
              </span>
              {pnl !== 0 && (
                <PnLDisplay value={pnl} size="sm" />
              )}
            </div>
            {trade.createdAt && (
              <div className="execution-monitor-recent-item-date">
                {formatRelativeTime(trade.createdAt)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RecentTradesList;

