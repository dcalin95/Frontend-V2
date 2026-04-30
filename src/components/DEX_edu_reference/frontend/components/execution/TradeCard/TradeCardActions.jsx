/**
 * 🔘 TradeCardActions Component
 */

import React from 'react';
import { X } from 'lucide-react';
import { TRADE_STATUS } from '../../../utils/constants';
import LoadingSpinner from '../../common/LoadingSpinner';
import '../../../styles/components/trade-card.css';

const TradeCardActions = ({ trade, onSelect, onCancel, cancelling }) => {
  const canCancel = trade.status === TRADE_STATUS.PENDING && onCancel;

  return (
    <div className="trade-card-actions">
      {canCancel && (
        <button
          className="trade-card-btn trade-card-btn-cancel"
          onClick={(e) => {
            e.stopPropagation();
            onCancel();
          }}
          disabled={cancelling}
          title="Cancel trade"
        >
          {cancelling ? (
            <LoadingSpinner size="small" message="" />
          ) : (
            <>
              <X size={16} />
              Cancel
            </>
          )}
        </button>
      )}
      
      <button
        className="trade-card-btn trade-card-btn-view"
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.();
        }}
        title="View details"
      >
        View Details
      </button>
    </div>
  );
};

export default TradeCardActions;

