/**
 * ⚠️ ConfirmationModal Component - Confirmation Dialog
 * 
 * Component reutilizabil pentru confirmation dialogs:
 * - Customizable title and message
 * - Confirm/Cancel actions
 * - Danger variant
 * - Keyboard: ESC to close, Enter to confirm (via focused button), Tab trap, return focus on close
 * 
 * @module ConfirmationModal
 */

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import '../../styles/components/confirmation-modal.css';

const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

const getFocusableElements = (el) =>
  el ? Array.from(el.querySelectorAll(FOCUSABLE_SELECTORS)) : [];

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default', // 'default' or 'danger'
  isLoading = false,
  className = '' // optional: extra class on dialog (e.g. confirmation-modal-direct-entry)
}) => {
  const dialogRef = useRef(null);
  const previousActiveRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveRef.current = document.activeElement;

    const dialogEl = dialogRef.current;
    if (dialogEl) {
      const focusable = getFocusableElements(dialogEl);
      const confirmBtn = dialogEl.querySelector('.confirmation-modal-button-confirm');
      if (confirmBtn && focusable.includes(confirmBtn)) {
        confirmBtn.focus();
      } else if (focusable.length > 0) {
        focusable[0].focus();
      }
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };

    const handleTab = (e) => {
      if (!dialogRef.current) return;
      const focusable = getFocusableElements(dialogRef.current);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
      document.body.style.overflow = '';
      if (previousActiveRef.current && typeof previousActiveRef.current.focus === 'function') {
        previousActiveRef.current.focus();
      }
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!isLoading && onConfirm) {
      onConfirm();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <div 
      className="confirmation-modal-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-message"
    >
      <div
        ref={dialogRef}
        className={`confirmation-modal ${variant === 'danger' ? 'confirmation-modal-danger' : ''} ${className}`.trim()}
      >
        <div className="confirmation-modal-header">
          <div className="confirmation-modal-title-section">
            {variant === 'danger' && (
              <div className="confirmation-modal-icon-wrapper">
                <AlertTriangle size={24} className="confirmation-modal-icon" />
              </div>
            )}
            <h2 id="confirmation-modal-title" className="confirmation-modal-title">
              {title}
            </h2>
          </div>
          {!isLoading && (
            <button
              className="confirmation-modal-close"
              onClick={onClose}
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="confirmation-modal-body">
          <p id="confirmation-modal-message" className="confirmation-modal-message">
            {message}
          </p>
        </div>

        <div className="confirmation-modal-footer">
          <button
            className="confirmation-modal-button confirmation-modal-button-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            className={`confirmation-modal-button confirmation-modal-button-confirm ${
              variant === 'danger' ? 'confirmation-modal-button-danger' : ''
            }`}
            onClick={handleConfirm}
            disabled={isLoading}
            autoFocus
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
