/**
 * 💲 SignalDetailsPrices Component
 */

import React from 'react';
import { DetailsSection, DetailsField } from '../../common/DetailsSection';
import { formatCurrency } from '../../../utils/formatters';

const SignalDetailsPrices = ({ signal }) => {
  if (!signal.entryPrice && !signal.stopLoss && !signal.takeProfit) return null;

  return (
    <DetailsSection title="Prices">
      {signal.entryPrice !== undefined && signal.entryPrice !== null && (
        <DetailsField
          label="Entry Price"
          value={formatCurrency(signal.entryPrice)}
        />
      )}
      {signal.stopLoss !== undefined && signal.stopLoss !== null && (
        <DetailsField
          label="Stop Loss"
          value={formatCurrency(signal.stopLoss)}
        />
      )}
      {signal.takeProfit !== undefined && signal.takeProfit !== null && (
        <DetailsField
          label="Take Profit"
          value={formatCurrency(signal.takeProfit)}
        />
      )}
    </DetailsSection>
  );
};

export default SignalDetailsPrices;

