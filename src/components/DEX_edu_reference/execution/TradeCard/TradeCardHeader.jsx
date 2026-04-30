/**
 * 📋 TradeCardHeader Component
 */

import React from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { StatusBadge } from '../../common/StatusBadge';
import { getTradeStatusConfig } from '../../utils/DEX/statusConfigs';
import '../../../../styles/DEX/components/trade-card.css';

const TradeCardHeader = ({ trade }) => {
  const statusConfig = getTradeStatusConfig(trade.status);

  return (
    <div className="trade-card-header">
      <div className="trade-card-pair">
        <ArrowRightLeft size={16} />
        <span className="trade-card-pair-tokens">
          {trade.tokenIn} → {trade.tokenOut}
        </span>
      </div>
      <StatusBadge status={trade.status} config={statusConfig} className="trade-card-status" />
    </div>
  );
};

export default TradeCardHeader;

