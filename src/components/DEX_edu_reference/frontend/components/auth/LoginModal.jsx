/**
 * 🔐 Login Modal Component
 * 
 * Modal component pentru wallet-based authentication:
 * - Connect wallet (MetaMask/Trust Wallet)
 * - Sign message
 * - Authenticate with backend
 * 
 * @module LoginModal
 */

import React, { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../common/Modal';
import { useDexAuth } from '../../context/DexAuthContext';
import { getUserFriendlyError } from '../../utils/helpers';
import './LoginModal.css';

/**
 * LoginModal Component
 * 
 * @param {object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {function} props.onClose - Close modal callback
 */
const LoginModal = ({ isOpen, onClose }) => {
  const { login, loading, error, wallet, clearAuthError } = useDexAuth();
  const [loginStep, setLoginStep] = useState('connect'); // connect, signing, verifying, success
  const [loginError, setLoginError] = useState(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      clearAuthError();
      setLoginStep('connect');
      setLoginError(null);
    }
  }, [isOpen, clearAuthError]);

  // Handle login flow
  const handleLogin = async () => {
    try {
      setLoginError(null);
      setLoginStep('signing');

      await login();

      setLoginStep('success');

      // Close modal after short delay
      setTimeout(() => {
        onClose();
        setLoginStep('connect');
      }, 1000);
    } catch (err) {
      // Use user-friendly error message (Phase 3: UX Improvements)
      setLoginError(getUserFriendlyError(err));
      setLoginStep('connect');
    }
  };

  const handleClose = () => {
    if (!loading) {
      setLoginStep('connect');
      setLoginError(null);
      onClose();
    }
  };

  const getStepMessage = () => {
    switch (loginStep) {
      case 'connect':
        return 'Connect your wallet to continue';
      case 'signing':
        return 'Please sign the message in your wallet';
      case 'verifying':
        return 'Verifying signature...';
      case 'success':
        return 'Authentication successful!';
      default:
        return '';
    }
  };

  const isProcessing = loginStep === 'signing' || loginStep === 'verifying' || loading;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="medium">
      <ModalHeader onClose={handleClose}>
        <h2>Connect Wallet</h2>
      </ModalHeader>

      <ModalBody>
        <div className="login-modal-content">
          {/* Step indicator */}
          <div className="login-step-indicator">
            <div className={`step ${loginStep === 'connect' ? 'active' : ''} ${loginStep !== 'connect' ? 'completed' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Connect</div>
            </div>
            <div className="step-connector"></div>
            <div className={`step ${loginStep === 'signing' || loginStep === 'verifying' ? 'active' : ''} ${loginStep === 'success' ? 'completed' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Sign</div>
            </div>
            <div className="step-connector"></div>
            <div className={`step ${loginStep === 'success' ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Verify</div>
            </div>
          </div>

          {/* Message */}
          <div className="login-message">
            <p>{getStepMessage()}</p>
          </div>

          {/* Error display - Phase 3: UX Improvements */}
          {(error || loginError) && (
            <div className="login-error">
              <p>{error ? getUserFriendlyError(error) : loginError}</p>
            </div>
          )}

          {/* Wallet info */}
          {wallet.walletAddress && (
            <div className="login-wallet-info">
              <p>
                <strong>Wallet:</strong> {wallet.walletAddress.slice(0, 6)}...
                {wallet.walletAddress.slice(-4)}
              </p>
            </div>
          )}

          {/* Instructions */}
          {loginStep === 'connect' && (
            <div className="login-instructions">
              <p>Click the button below to connect your wallet. You'll be asked to:</p>
              <ol>
                <li>Approve the connection request</li>
                <li>Sign a message to verify ownership</li>
              </ol>
            </div>
          )}

          {/* Loading indicator */}
          {isProcessing && (
            <div className="login-loading">
              <div className="spinner"></div>
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          className="confirmation-modal-button confirmation-modal-button-cancel"
          onClick={handleClose}
          disabled={isProcessing}
        >
          Cancel
        </button>
        <button
          type="button"
          className="confirmation-modal-button confirmation-modal-button-confirm"
          onClick={handleLogin}
          disabled={isProcessing}
        >
          {loginStep === 'connect' && 'Connect & Sign'}
          {loginStep === 'signing' && 'Signing...'}
          {loginStep === 'verifying' && 'Verifying...'}
          {loginStep === 'success' && 'Success!'}
          {isProcessing && 'Processing...'}
        </button>
      </ModalFooter>
    </Modal>
  );
};

export default LoginModal;
