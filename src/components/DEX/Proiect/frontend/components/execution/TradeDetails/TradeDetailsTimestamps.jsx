/**
 * 🕐 TradeDetailsTimestamps Component
 */

import React from 'react';
import { DetailsSection, DetailsField } from '../../common/DetailsSection';
import { formatDate } from '../../../utils/formatters';

const TradeDetailsTimestamps = ({ trade }) => {
  return (
    <DetailsSection title="Timestamps">
      {trade.createdAt && (
        <DetailsField
          label="Created"
          value={formatDate(trade.createdAt, 'datetime')}
        />
      )}
      {trade.executedAt && (
        <DetailsField
          label="Executed"
          value={formatDate(trade.executedAt, 'datetime')}
        />
      )}
      {trade.closedAt && (
        <DetailsField
          label="Closed"
          value={formatDate(trade.closedAt, 'datetime')}
        />
      )}
    </DetailsSection>
  );
};

export default TradeDetailsTimestamps;

