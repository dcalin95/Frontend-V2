/**
 * 📦 Modal Component - Reusable Modal Wrapper
 * 
 * Reusable modal component wrapper:
 * - Modal overlay
 * - Modal content container
 * - Close handler
 * 
 * @module Modal
 */

import React from 'react';
import { X } from 'lucide-react';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children, size = 'medium', className = '', showHeader = true }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    small: 'modal-size-small',
    medium: 'modal-size-medium',
    large: 'modal-size-large',
    fullscreen: 'modal-size-fullscreen'
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div className="modal-wrapper" onClick={handleOverlayClick}>
      <div className={`modal-content ${sizeClasses[size]} ${className}`}>
        {showHeader && title && (
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            {onClose && (
              <button className="modal-close" onClick={onClose} aria-label="Close modal">
                <X size={20} />
              </button>
            )}
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;

