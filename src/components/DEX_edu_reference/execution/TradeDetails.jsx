/**
 * 📄 TradeDetails Component - Trade Details Modal
 * 
 * Refactorized: Using reusable components for better maintainability
 * 
 * @module TradeDetails
 */

import React, { useState, useEffect } from 'react';
import { useExecution } from '../hooks/DEX/useExecution';
import { Modal, ModalBody } from '../common/Modal';
import { PnLDisplay } from '../common/PnLDisplay';
import {
  TradeDetailsHeader,
  TradeDetailsAmounts,
  TradeDetailsPrices,
  TradeDetailsRiskLimits,
  TradeDetailsTransaction,
  TradeDetailsTimestamps,
  TradeDetailsActions
} from './TradeDetails/index';
import { DetailsSection, DetailsField } from '../common/DetailsSection';
import LoadingSpinner from '../common/LoadingSpinner';
import '../../../styles/DEX/components/trade-details.css';

const TradeDetails = ({ userId, tradeId, onClose }) => {
  const { getTrade, cancelTrade, loading, error } = useExecution(userId);
  const [trade, setTrade] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (tradeId) {
      loadTrade();
    }
  }, [tradeId]);

  const loadTrade = async () => {
    try {
      const tradeData = await getTrade(tradeId);
      setTrade(tradeData);
    } catch (error) {
      console.error('Error loading trade:', error);
    }
  };

  const handleCancel = async () => {
    try {
      setCancelling(true);
      await cancelTrade(tradeId);
      await loadTrade();
    } catch (error) {
      console.error('Error cancelling trade:', error);
    } finally {
      setCancelling(false);
    }
  };

  if (loading && !trade) {
    return (
      <Modal isOpen={true} onClose={onClose} size="medium">
        <ModalBody>
          <LoadingSpinner message="Loading trade details..." />
        </ModalBody>
      </Modal>
    );
  }

  if (!trade) {
    return (
      <Modal isOpen={true} onClose={onClose} size="small" title="Error">
        <ModalBody>
          <div className="trade-details-error">
            <p>{error || 'Trade not found'}</p>
          </div>
        </ModalBody>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} size="large" showHeader={false}>
      <TradeDetailsHeader trade={trade} onClose={onClose} />

      <ModalBody>
        {/* Trade Pair */}
        <DetailsSection>
          <DetailsField
            label="Trade Pair"
            value={`${trade.tokenIn} → ${trade.tokenOut}`}
          />
        </DetailsSection>

        {/* Amounts */}
        <TradeDetailsAmounts trade={trade} />

        {/* Prices */}
        <TradeDetailsPrices trade={trade} />

        {/* Risk Limits */}
        <TradeDetailsRiskLimits trade={trade} />

        {/* P/L */}
        {trade.pnl !== undefined && trade.pnl !== 0 && (
          <DetailsSection title="Profit/Loss">
            <PnLDisplay value={trade.pnl} size="lg" />
          </DetailsSection>
        )}

        {/* Transaction */}
        <TradeDetailsTransaction trade={trade} />

        {/* Timestamps */}
        <TradeDetailsTimestamps trade={trade} />
      </ModalBody>

      {/* Actions */}
      <TradeDetailsActions
        trade={trade}
        onCancel={handleCancel}
        onClose={onClose}
        cancelling={cancelling}
      />
    </Modal>
  );
};

export default TradeDetails;
