/**
 * 📋 TradeDetailsHeader Component
 */

import React from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { ModalHeader } from '../../common/Modal';
import { StatusBadge } from '../../common/StatusBadge';
import { getTradeStatusConfig } from '../../utils/DEX/statusConfigs';

const TradeDetailsHeader = ({ trade, onClose }) => {
  const statusConfig = getTradeStatusConfig(trade.status);

  return (
    <ModalHeader title="Trade Details" onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <ArrowRightLeft size={24} />
        <StatusBadge status={trade.status} config={statusConfig} />
      </div>
    </ModalHeader>
  );
};

export default TradeDetailsHeader;

