/**
 * 💫 SwapProgressModal - Modal pentru progresul swap-ului
 * 
 * Afișează progresul swap-ului cu loading states și error handling
 * - Loading animation
 * - Success confirmation cu link la BSCScan
 * - Error messages user-friendly
 * - Progress steps visualization
 * - Keyboard: ESC to close
 * 
 * @module SwapProgressModal
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, CheckCircle, AlertCircle, ExternalLink, Loader, Clock, Zap, Copy } from 'lucide-react';
import '../../styles/components/swap-progress-modal.css';

const BSC_DEFAULT_RPC = 'https://bsc-dataseed1.binance.org';

function CopyRpcButton({ url }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      // fallback: select + copy
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };
  return (
    <button type="button" className="swap-progress-copy-rpc" onClick={handleCopy} title={url}>
      <Copy size={14} />
      {copied ? ' Copied!' : ' Copy RPC URL'}
    </button>
  );
}

const SwapProgressModal = ({
  isOpen,
  onClose,
  onOpenSettings,
  swapState, // 'idle' | 'approving' | 'swapping' | 'success' | 'error'
  swapData,
  error,
  txHash,
  fromAmount,
  toAmount,
  feeAmount
}) => {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getProgressSteps = () => {
    const steps = [
      {
        id: 'approve',
        label: swapData?.fromToken?.symbol === 'BNB' ? 'Preparing swap' : 'Approve token',
        status: swapState === 'approving' ? 'loading' : 
                swapState === 'swapping' || swapState === 'success' ? 'completed' : 'pending'
      },
      {
        id: 'swap',
        label: 'Execute swap',
        status: swapState === 'swapping' ? 'loading' :
                swapState === 'success' ? 'completed' : 'pending'
      },
      {
        id: 'confirm',
        label: 'Blockchain confirmation',
        status: swapState === 'success' ? 'completed' : 'pending'
      }
    ];

    return steps;
  };

  const getUserFriendlyError = (errorMessage) => {
    if (!errorMessage) return 'Unknown error occurred';
    
    const message = errorMessage.toLowerCase();
    
    if (message.includes('already pending') || message.includes('public_signtransaction')) {
      return 'You have a pending transaction in MetaMask. Please complete or cancel it first.';
    }
    
    if (message.includes('user rejected') || message.includes('user denied') || message.includes('rejected by user')) {
      return 'Transaction was cancelled. If your wallet showed "couldn\'t be completed" or "would fail", increase slippage to 3–4% in Settings, then try again.';
    }
    
    if (message.includes('swap would revert') || message.includes('swap failed:')) {
      return errorMessage;
    }
    if (message.includes('insufficient funds') || message.includes('insufficient balance')) {
      return 'Insufficient balance to complete this swap.';
    }
    
    if (message.includes('likely to fail') || message.includes('would fail') || message.includes('couldn\'t be completed') || message.includes('canceled to save') || message.includes('unnecessary gas fees')) {
      return 'Transaction would revert (slippage). Open Swap Settings (gear icon) and set slippage to 2.5% or 3%, then try again.';
    }
    
    if (message.includes('slippage') || message.includes('min')) {
      return 'Slippage tolerance exceeded. Try increasing slippage or reducing amount.';
    }
    
    if (message.includes('deadline') || message.includes('expired')) {
      return 'Transaction deadline exceeded. Please try again.';
    }
    
    if (message.includes('transaction hash') || message.includes('was not broadcast')) {
      return 'Transaction was not broadcast. If in MetaMask you see bsc-mainnet.infura.io: Settings → Networks → BSC → RPC URL → change to https://bsc-dataseed1.bnbchain.org (or remove BSC network and click Fix network).';
    }
    
    if (message.includes('network') || message.includes('rpc')) {
      return 'Connection issue (server or wallet RPC). Please try again in a moment.';
    }
    
    if (message.includes('gas') || message.includes('limit')) {
      return 'Transaction failed due to gas limit. Please try with a smaller amount.';
    }
    
    // Return first 100 characters of original error for debugging
    return errorMessage.length > 100 ? errorMessage.substring(0, 100) + '...' : errorMessage;
  };

  const getProgressIcon = (status) => {
    switch (status) {
      case 'loading':
        return <Loader className="swap-progress-step-icon loading" size={16} />;
      case 'completed':
        return <CheckCircle className="swap-progress-step-icon completed" size={16} />;
      default:
        return <Clock className="swap-progress-step-icon pending" size={16} />;
    }
  };

  const steps = getProgressSteps();

  return (
    <div
      className="swap-progress-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="swap-progress-title"
    >
      <div className="swap-progress-modal" onClick={(e) => e.stopPropagation()}>
        <div className="swap-progress-header">
          <h3 id="swap-progress-title">
            {swapState === 'success' ? '🎉 Swap Successful!' : 
             swapState === 'error' ? '⚠️ Swap Failed' :
             '⏳ Processing Swap...'}
          </h3>
          <button
            ref={closeButtonRef}
            type="button"
            className="swap-progress-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="swap-progress-content">
          {/* Swap Details */}
          {swapData && (
            <div className="swap-progress-details">
              <div className="swap-progress-detail-row">
                <span>From:</span>
                <span className="swap-progress-detail-value">
                  {fromAmount} {swapData.fromToken.symbol}
                </span>
              </div>
              <div className="swap-progress-detail-row">
                <span>To:</span>
                <span className="swap-progress-detail-value">
                  {toAmount && !isNaN(parseFloat(toAmount)) 
                    ? new Intl.NumberFormat('en-US', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 6
                      }).format(parseFloat(toAmount))
                    : toAmount} {swapData.toToken.symbol}
                </span>
              </div>
              {feeAmount && (
                <div className="swap-progress-detail-row">
                  <span>Protocol Fee:</span>
                  <span className="swap-progress-detail-value">
                    0.1% (~${feeAmount.toFixed(2)})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Progress Steps */}
          <div className="swap-progress-steps">
            {steps.map((step, index) => (
              <div key={step.id} className={`swap-progress-step ${step.status}`}>
                <div className="swap-progress-step-indicator">
                  <div className="swap-progress-step-number">
                    {getProgressIcon(step.status)}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`swap-progress-step-line ${step.status === 'completed' ? 'completed' : ''}`} />
                  )}
                </div>
                <div className="swap-progress-step-content">
                  <div className="swap-progress-step-label">{step.label}</div>
                  {step.status === 'loading' && (
                    <div className="swap-progress-step-sublabel">
                      {step.id === 'approve' ? 'Confirm in wallet...' : 
                       step.id === 'swap' ? 'Executing swap...' : 
                       'Waiting for confirmation...'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Success State */}
          {swapState === 'success' && (
            <div className="swap-progress-success">
              <CheckCircle size={48} className="swap-progress-success-icon" />
              <h4>Swap completed successfully!</h4>
              {toAmount && !isNaN(parseFloat(toAmount)) && swapData?.toToken?.symbol && (
                <p className="swap-progress-received">
                  You received{' '}
                  <strong>
                    {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(parseFloat(toAmount))}{' '}
                    {swapData.toToken.symbol}
                  </strong>
                </p>
              )}
              <p>Your transaction has been confirmed on the blockchain.</p>
              
              {txHash && (
                <a
                  href={`https://bscscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="swap-progress-bscscan-link"
                >
                  <ExternalLink size={16} />
                  View on BSCScan
                  <span className="swap-progress-tx-hash">
                    {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)}
                  </span>
                </a>
              )}
            </div>
          )}

          {/* Error State */}
          {swapState === 'error' && (
            <div className="swap-progress-error">
              <AlertCircle size={48} className="swap-progress-error-icon" />
              <h4>Swap failed</h4>
              <div className="swap-progress-error-message">
                {getUserFriendlyError(error)}
              </div>
              
              {error && onOpenSettings && !/insufficient|funds|balance/.test(error.toLowerCase()) && (
                <div className="swap-progress-error-help swap-progress-slippage-help" style={{ marginTop: '12px', padding: '12px', background: 'rgba(247, 147, 26, 0.1)', borderRadius: '8px', border: '1px solid rgba(247, 147, 26, 0.3)' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', lineHeight: 1.4 }}>
                    <strong>Quick fix:</strong> If your wallet showed &quot;couldn&apos;t be completed&quot; or the swap would fail, the service is fine – some pairs (e.g. CAKE→BNB) need 3–4% slippage.
                  </p>
                  <button
                    type="button"
                    className="swap-progress-btn primary"
                    onClick={onOpenSettings}
                    style={{ marginTop: '4px' }}
                  >
                    Open Settings → Increase Slippage
                  </button>
                </div>
              )}
              
              {error && error.toLowerCase().includes('pending') && (
                <div className="swap-progress-error-help">
                  <Zap size={16} />
                  <span>
                    <strong>Quick fix:</strong> Open MetaMask → Check pending transactions → 
                    Complete or cancel them, then try again.
                  </span>
                </div>
              )}
              
              {error && /was not broadcast|metamask|rpc|bsc mainnet|misconfigured|transaction hash|network.*returned|rețeaua a returnat/i.test(error) && (
                <div className="swap-progress-error-help swap-progress-error-rpc">
                  <Zap size={16} />
                  <p className="swap-progress-error-rpc-intro">
                    {error && /twnodes/i.test(error)
                      ? 'Error mentions TWNodes. Check the TWNodes NaaS extension (disable it) or in MetaMask BSC network → RPC URL (change to official RPC, copy below). The app only uses your wallet.'
                      : 'Error mentions network/RPC. The app only uses your wallet.'}
                  </p>
                  <p className="swap-progress-error-rpc-intro">
                    <strong>If in MetaMask you see bsc-mainnet.infura.io:</strong> it is not from us. Settings → Networks → BSC → RPC URL → change to the URL below (or remove BSC network and click "Fix network" in the error modal).
                  </p>
                  <span>
                    <strong>MetaMask</strong> → Settings → BSC network → RPC URL. You can use:
                  </span>
                  <CopyRpcButton url={BSC_DEFAULT_RPC} />
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="swap-progress-actions">
            {swapState === 'success' && (
              <button
                className="swap-progress-btn primary"
                onClick={onClose}
              >
                Done
              </button>
            )}
            
            {swapState === 'error' && (
              <>
                <button
                  className="swap-progress-btn secondary"
                  onClick={onClose}
                >
                  Close
                </button>
                {(error && onOpenSettings && !/insufficient|funds|balance/.test(error.toLowerCase())) ? (
                  <button
                    className="swap-progress-btn primary"
                    onClick={onOpenSettings}
                  >
                    Open Settings (increase slippage)
                  </button>
                ) : (
                  <button
                    className="swap-progress-btn primary"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </button>
                )}
              </>
            )}
            
            {(swapState === 'approving' || swapState === 'swapping') && (
              <>
                <p style={{ fontSize: '12px', color: 'var(--token-text-secondary)', marginBottom: '8px', lineHeight: 1.4 }}>
                  {swapState === 'approving'
                    ? 'Confirm Approve in MetaMask (one-time per token).'
                    : 'Confirm Swap in MetaMask. You may need to confirm 1–2 times – this is normal.'}
                </p>
                <p style={{ fontSize: '11px', color: 'var(--token-text-secondary)', opacity: 0.85, marginBottom: '10px', lineHeight: 1.3 }}>
                  If MetaMask says &quot;would fail&quot;, wait a few seconds and try again – it often succeeds on retry.
                </p>
                <button
                  className="swap-progress-btn secondary"
                  onClick={onClose}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwapProgressModal;