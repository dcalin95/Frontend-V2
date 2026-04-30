/**
 * 📦 Modal Component - Reusable Modal Wrapper
 * 
 * Reusable modal component wrapper:
 * - Modal overlay
 * - Modal content container
 * - Close handler
 * - Focus management (trap focus, ESC key, return focus)
 * 
 * @module Modal
 */

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children, size = 'medium', className = '', showHeader = true, closeOnBackdropClick = true, closeOnEscape = true }) => {
  const modalRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  // Get all focusable elements inside modal
  const getFocusableElements = (element) => {
    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');
    return Array.from(element.querySelectorAll(focusableSelectors));
  };

  // Focus management when modal opens/closes
  useEffect(() => {
    if (!isOpen) return;

    // Store the element that was focused before modal opened
    previousActiveElementRef.current = document.activeElement;

    // Focus first focusable element in modal
    const modalElement = modalRef.current;
    if (modalElement) {
      const focusableElements = getFocusableElements(modalElement);
      if (focusableElements.length > 0) {
        // Focus the close button or first element
        const closeButton = modalElement.querySelector('.modal-close');
        if (closeButton) {
          closeButton.focus();
        } else {
          focusableElements[0].focus();
        }
      }
    }

    // Handle ESC key to close modal (only if closeOnEscape)
    const handleEscape = (e) => {
      if (e.key === 'Escape' && closeOnEscape && onClose) {
        onClose();
      }
    };

    // Handle Tab key for focus trap
    const handleTab = (e) => {
      if (!modalElement) return;
      const focusableElements = getFocusableElements(modalElement);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
      document.body.style.overflow = '';
      
      // Return focus to previous element
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const sizeClasses = {
    small: 'modal-size-small',
    medium: 'modal-size-medium',
    large: 'modal-size-large',
    fullscreen: 'modal-size-fullscreen'
  };

  // onMouseDown pe overlay evită „flicker” (deschide + închide instant) vs onClick
  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose?.();
    }
  };

  const handleModalContentMouseDown = (e) => {
    e.stopPropagation();
  };

  const modalContent = (
    <div
      className="modal-wrapper"
      onMouseDown={handleOverlayMouseDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        className={`modal-content ${sizeClasses[size]} ${className}`}
        onMouseDown={handleModalContentMouseDown}
      >
        {showHeader && title && (
          <div className="modal-header">
            <h2 id="modal-title" className="modal-title">{title}</h2>
            {onClose && (
              <button
                className="modal-close"
                onClick={onClose}
                aria-label="Close modal"
                type="button"
              >
                <X size={20} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );

  // Portal către document.body: scapi de stacking context / overflow / transform pe părinți
  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};

export default Modal;

