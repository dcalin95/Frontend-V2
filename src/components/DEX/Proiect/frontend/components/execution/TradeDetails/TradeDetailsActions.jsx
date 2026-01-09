/**
 * 🔘 TradeDetailsActions Component
 */

import React from 'react';
import { X } from 'lucide-react';
import { ModalFooter } from '../../common/Modal';
import LoadingSpinner from '../../common/LoadingSpinner';
import { TRADE_STATUS } from '../../../utils/constants';
import '../../../../styles/components/trade-details.css';

const TradeDetailsActions = ({ trade, onCancel, onClose, cancelling }) => {
  const canCancel = trade.status === TRADE_STATUS.PENDING;

  return (
    <ModalFooter>
      {canCancel && (
        <button
          className="trade-details-btn trade-details-btn-cancel"
          onClick={onCancel}
          disabled={cancelling}
        >
          {cancelling ? (
            <LoadingSpinner size="small" message="" />
          ) : (
            <>
              <X size={16} />
              Cancel Trade
            </>
          )}
        </button>
      )}
      <button
        className="trade-details-btn trade-details-btn-close"
        onClick={onClose}
      >
        Close
      </button>
    </ModalFooter>
  );
};

export default TradeDetailsActions;

