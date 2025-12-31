// src/Presale/components/SOLPaymentProgress.jsx

import React from 'react';
import './SOLPaymentProgress.css';

const SOLPaymentProgress = ({ isOpen, onClose, steps, currentStep, error, signature }) => {
  if (!isOpen) return null;

  const getStepStatus = (stepIndex) => {
    if (error && currentStep === stepIndex) return 'error';
    if (currentStep > stepIndex) return 'completed';
    if (currentStep === stepIndex) return 'active';
    return 'pending';
  };

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'active': return '⏳';
      case 'error': return '❌';
      default: return '⚪';
    }
  };

  return (
    <div className="sol-payment-overlay" onClick={error ? onClose : undefined}>
      <div className="sol-payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sol-payment-header">
          <h3>🚀 SOL Payment Progress</h3>
          {error && (
            <button className="sol-close-btn" onClick={onClose}>✕</button>
          )}
        </div>

        <div className="sol-payment-body">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            return (
              <div key={index} className={`sol-step sol-step--${status}`}>
                <div className="sol-step-icon">
                  {getStepIcon(status)}
                </div>
                <div className="sol-step-content">
                  <div className="sol-step-title">
                    Step {index + 1}/10: {step.title}
                  </div>
                  {step.details && status !== 'pending' && (
                    <div className="sol-step-details">
                      {step.details.map((detail, i) => (
                        <div key={i} className="sol-step-detail">
                          {detail}
                        </div>
                      ))}
                    </div>
                  )}
                  {step.error && status === 'error' && (
                    <div className="sol-step-error">
                      <strong>Error:</strong> {step.error}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {error && (
            <div className="sol-error-box">
              <div className="sol-error-icon">❌</div>
              <div className="sol-error-content">
                <h4>Transaction Failed</h4>
                <p>{error}</p>
                {signature && (
                  <a
                    href={`https://solscan.io/tx/${signature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sol-error-link"
                  >
                    Check on Solscan →
                  </a>
                )}
              </div>
            </div>
          )}

          {!error && currentStep === 10 && signature && (
            <div className="sol-success-box">
              <div className="sol-success-icon">🎉</div>
              <div className="sol-success-content">
                <h4>Payment Successful!</h4>
                <p>Your transaction has been confirmed on Solana blockchain.</p>
                <a
                  href={`https://solscan.io/tx/${signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sol-success-link"
                >
                  View on Solscan →
                </a>
              </div>
            </div>
          )}
        </div>

        {(error || currentStep === 10) && (
          <div className="sol-payment-footer">
            <button className="sol-btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SOLPaymentProgress;

