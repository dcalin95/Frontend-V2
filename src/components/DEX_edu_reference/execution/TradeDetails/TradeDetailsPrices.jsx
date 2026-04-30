/**
 * 💲 TradeDetailsPrices Component
 */

import React from 'react';
import { DetailsSection, DetailsField } from '../../common/DetailsSection';
import { formatCurrency } from '../../utils/DEX/formatters';

const TradeDetailsPrices = ({ trade }) => {
  if (!trade.entryPrice && !trade.exitPrice) return null;

  return (
    <DetailsSection title="Prices">
      {trade.entryPrice !== undefined && trade.entryPrice !== null && (
        <DetailsField
          label="Entry Price"
          value={formatCurrency(trade.entryPrice)}
        />
      )}
      {trade.exitPrice !== undefined && trade.exitPrice !== null && (
        <DetailsField
          label="Exit Price"
          value={formatCurrency(trade.exitPrice)}
        />
      )}
    </DetailsSection>
  );
};

export default TradeDetailsPrices;

