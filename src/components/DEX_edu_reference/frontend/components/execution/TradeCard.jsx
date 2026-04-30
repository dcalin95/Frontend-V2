/**
 * 🎴 TradeCard Component - Trade Card Display
 * 
 * Refactorized: Using reusable components for better maintainability
 * 
 * @module TradeCard
 */

import React from 'react';
import { getTradeStatusConfig } from '../../utils/statusConfigs';
import {
  TradeCardHeader,
  TradeCardContent,
  TradeCardActions
} from './TradeCard/index';
import '../../styles/components/trade-card.css';

const TradeCard = ({ trade, cancelling = false, onSelect, onCancel }) => {
  const statusConfig = getTradeStatusConfig(trade.status);

  return (
    <div 
      className={`trade-card trade-card-${statusConfig.className}`}
      onClick={onSelect}
    >
      <TradeCardHeader trade={trade} />
      <TradeCardContent trade={trade} />
      <TradeCardActions
        trade={trade}
        onSelect={onSelect}
        onCancel={onCancel}
        cancelling={cancelling}
      />
    </div>
  );
};

export default TradeCard;
