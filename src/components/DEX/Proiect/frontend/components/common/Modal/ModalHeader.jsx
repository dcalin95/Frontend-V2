/**
 * 📋 ModalHeader Component - Modal Header
 */

import React from 'react';
import { X } from 'lucide-react';
import './Modal.css';

const ModalHeader = ({ title, onClose, children }) => {
  return (
    <div className="modal-header">
      {title && <h2 className="modal-title">{title}</h2>}
      {children}
      {onClose && (
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>
      )}
    </div>
  );
};

export default ModalHeader;

