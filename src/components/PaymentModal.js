import React from 'react';
import './PaymentModal.css';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  amount, 
  itemName, 
  balance,
  isProcessing 
}) => {
  if (!isOpen) return null;

  const hasInsufficientFunds = parseFloat(balance) < parseFloat(amount);

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal-content">
        <div className="payment-header">
          <div className="payment-icon-wrapper">
            <i className="fas fa-shield-alt payment-secure-icon"></i>
          </div>
          <h2>Secure Payment</h2>
          <p>Blockchain Transaction via BSC</p>
        </div>

        <div className="payment-details">
          <div className="payment-row">
            <span>Service:</span>
            <strong>{itemName}</strong>
          </div>
          <div className="payment-row">
            <span>Cost:</span>
            <strong className="cost-value">{amount.toLocaleString()} BITS</strong>
          </div>
          <div className="payment-row">
            <span>Your Balance:</span>
            <span className={hasInsufficientFunds ? "insufficient" : "sufficient"}>
              {parseFloat(balance).toLocaleString()} BITS
            </span>
          </div>
        </div>

        {hasInsufficientFunds && (
          <div className="payment-error">
            <i className="fas fa-exclamation-circle"></i>
            Insufficient BITS Balance
          </div>
        )}

        <div className="payment-actions">
          <button 
            className="cancel-payment-btn" 
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button 
            className={`confirm-payment-btn ${isProcessing ? 'processing' : ''}`}
            onClick={onConfirm}
            disabled={hasInsufficientFunds || isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="spinner-small"></span> Processing...
              </>
            ) : (
              <>
                <i className="fas fa-check-circle"></i> Pay & Unlock
              </>
            )}
          </button>
        </div>
        
        <div className="payment-footer">
          <i className="fas fa-lock"></i> Secure Blockchain Transaction
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;

