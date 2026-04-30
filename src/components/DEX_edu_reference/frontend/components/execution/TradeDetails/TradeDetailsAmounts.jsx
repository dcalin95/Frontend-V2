/**
 * 💵 TradeDetailsAmounts Component
 */

import React from 'react';
import { DetailsSection, DetailsField } from '../../common/DetailsSection';
import { formatTokenAmount } from '../../../utils/formatters';

const TradeDetailsAmounts = ({ trade }) => {
  return (
    <DetailsSection title="Amounts">
      <DetailsField
        label="Amount In"
        value={formatTokenAmount(trade.amountIn, trade.tokenIn)}
      />
      {trade.amountOut !== undefined && trade.amountOut !== null && (
        <DetailsField
          label="Amount Out"
          value={formatTokenAmount(trade.amountOut, trade.tokenOut)}
        />
      )}
    </DetailsSection>
  );
};

export default TradeDetailsAmounts;

