/**
 * 🔗 TradeDetailsTransaction Component
 */

import React from 'react';
import { DetailsSection, DetailsField } from '../../common/DetailsSection';
import { formatTxHash } from '../../utils/DEX/formatters';

const TradeDetailsTransaction = ({ trade }) => {
  if (!trade.txHash) return null;

  return (
    <DetailsSection title="Transaction">
      <DetailsField label="Transaction Hash">
        <span className="trade-details-tx-hash" title={trade.txHash}>
          {formatTxHash(trade.txHash)}
        </span>
      </DetailsField>
    </DetailsSection>
  );
};

export default TradeDetailsTransaction;

