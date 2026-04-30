/**
 * 📄 HistoryItem Component - Single Trade History Item
 */

import React from 'react';
import { formatCurrency, formatTokenAmount, formatRelativeTime } from '../../../utils/formatters';
import { StatusBadge } from '../../common/StatusBadge';
import { PnLDisplay } from '../../common/PnLDisplay';
import { getTradeStatusConfig } from '../../../utils/statusConfigs';
import { formatTxHash } from '../../../utils/formatters';
import '../../../styles/components/performance-history.css';

const HistoryItem = ({ trade }) => {
  const statusConfig = getTradeStatusConfig(trade.status);
  const pnl = trade.pnl || 0;

  return (
    <div className={`performance-history-item performance-history-item-${trade.status}`}>
      <div className="performance-history-item-header">
        <span className="performance-history-item-trade">
          <span className="performance-history-item-pair">
            {trade.tokenIn} → {trade.tokenOut}
          </span>
        </span>
        <StatusBadge status={trade.status} config={statusConfig} />
      </div>

      <div className="performance-history-item-content">
        <div className="performance-history-item-amounts">
          <div className="performance-history-item-amount">
            <span className="performance-history-item-amount-label">Amount In:</span>
            <span className="performance-history-item-amount-value">
              {formatTokenAmount(trade.amountIn, trade.tokenIn)}
            </span>
          </div>
          {trade.amountOut !== undefined && trade.amountOut !== null && (
            <div className="performance-history-item-amount">
              <span className="performance-history-item-amount-label">Amount Out:</span>
              <span className="performance-history-item-amount-value">
                {formatTokenAmount(trade.amountOut, trade.tokenOut)}
              </span>
            </div>
          )}
        </div>

        {(trade.entryPrice !== undefined || trade.exitPrice !== undefined) && (
          <div className="performance-history-item-prices">
            {trade.entryPrice !== undefined && trade.entryPrice !== null && (
              <div className="performance-history-item-price">
                <span className="performance-history-item-price-label">Entry:</span>
                <span className="performance-history-item-price-value">
                  {formatCurrency(trade.entryPrice)}
                </span>
              </div>
            )}
            {trade.exitPrice !== undefined && trade.exitPrice !== null && (
              <div className="performance-history-item-price">
                <span className="performance-history-item-price-label">Exit:</span>
                <span className="performance-history-item-price-value">
                  {formatCurrency(trade.exitPrice)}
                </span>
              </div>
            )}
          </div>
        )}

        {pnl !== 0 && (
          <div className="performance-history-item-pnl-wrapper">
            <PnLDisplay value={pnl} size="base" />
          </div>
        )}

        {trade.txHash && (
          <div className="performance-history-item-tx">
            <span className="performance-history-item-tx-label">TX:</span>
            <span className="performance-history-item-tx-value" title={trade.txHash}>
              {formatTxHash(trade.txHash)}
            </span>
          </div>
        )}

        {trade.createdAt && (
          <div className="performance-history-item-date">
            {formatRelativeTime(trade.createdAt)}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryItem;

