/**
 * 📄 TradeCardContent Component
 */

import React from 'react';
import { formatCurrency, formatTokenAmount, formatRelativeTime, formatTxHash } from '../../utils/DEX/formatters';
import { PnLDisplay } from '../../common/PnLDisplay';
import '../../../../styles/DEX/components/trade-card.css';

const TradeCardContent = ({ trade }) => {
  return (
    <div className="trade-card-content">
      {/* Amounts */}
      <div className="trade-card-amounts">
        <div className="trade-card-amount">
          <span className="trade-card-amount-label">Amount In:</span>
          <span className="trade-card-amount-value">
            {formatTokenAmount(trade.amountIn, trade.tokenIn)}
          </span>
        </div>
        {trade.amountOut !== undefined && trade.amountOut !== null && (
          <div className="trade-card-amount">
            <span className="trade-card-amount-label">Amount Out:</span>
            <span className="trade-card-amount-value">
              {formatTokenAmount(trade.amountOut, trade.tokenOut)}
            </span>
          </div>
        )}
      </div>

      {/* Prices */}
      {(trade.entryPrice !== undefined || trade.exitPrice !== undefined) && (
        <div className="trade-card-prices">
          {trade.entryPrice !== undefined && trade.entryPrice !== null && (
            <div className="trade-card-price">
              <span className="trade-card-price-label">Entry:</span>
              <span className="trade-card-price-value">
                {formatCurrency(trade.entryPrice)}
              </span>
            </div>
          )}
          {trade.exitPrice !== undefined && trade.exitPrice !== null && (
            <div className="trade-card-price">
              <span className="trade-card-price-label">Exit:</span>
              <span className="trade-card-price-value">
                {formatCurrency(trade.exitPrice)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Stop Loss & Take Profit */}
      {(trade.stopLoss !== undefined || trade.takeProfit !== undefined) && (
        <div className="trade-card-limits">
          {trade.stopLoss !== undefined && trade.stopLoss !== null && (
            <div className="trade-card-limit">
              <span className="trade-card-limit-label">Stop Loss:</span>
              <span className="trade-card-limit-value">
                {formatCurrency(trade.stopLoss)}
              </span>
            </div>
          )}
          {trade.takeProfit !== undefined && trade.takeProfit !== null && (
            <div className="trade-card-limit">
              <span className="trade-card-limit-label">Take Profit:</span>
              <span className="trade-card-limit-value">
                {formatCurrency(trade.takeProfit)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* P/L */}
      {trade.pnl !== undefined && trade.pnl !== 0 && (
        <div className="trade-card-pnl-wrapper">
          <span className="trade-card-pnl-label">P/L:</span>
          <PnLDisplay value={trade.pnl} size="base" />
        </div>
      )}

      {/* Transaction Hash */}
      {trade.txHash && (
        <div className="trade-card-tx">
          <span className="trade-card-tx-label">TX:</span>
          <span className="trade-card-tx-value" title={trade.txHash}>
            {formatTxHash(trade.txHash)}
          </span>
        </div>
      )}

      {/* Date */}
      {trade.createdAt && (
        <div className="trade-card-date">
          {formatRelativeTime(trade.createdAt)}
        </div>
      )}
    </div>
  );
};

export default TradeCardContent;

