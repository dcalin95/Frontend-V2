/**
 * ⚠️ TradeDetailsRiskLimits Component
 */

import React from 'react';
import { DetailsSection, DetailsField } from '../../common/DetailsSection';
import { formatCurrency } from '../../../utils/formatters';

const TradeDetailsRiskLimits = ({ trade }) => {
  if (!trade.stopLoss && !trade.takeProfit) return null;

  return (
    <DetailsSection title="Risk Limits">
      {trade.stopLoss !== undefined && trade.stopLoss !== null && (
        <DetailsField
          label="Stop Loss"
          value={formatCurrency(trade.stopLoss)}
        />
      )}
      {trade.takeProfit !== undefined && trade.takeProfit !== null && (
        <DetailsField
          label="Take Profit"
          value={formatCurrency(trade.takeProfit)}
        />
      )}
    </DetailsSection>
  );
};

export default TradeDetailsRiskLimits;

