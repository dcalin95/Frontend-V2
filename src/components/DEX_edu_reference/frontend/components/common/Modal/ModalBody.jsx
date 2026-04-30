/**
 * 📄 ModalBody Component - Modal Body
 */

import React from 'react';
import './Modal.css';

const ModalBody = ({ children, className = '' }) => {
  return (
    <div className={`modal-body ${className}`}>
      {children}
    </div>
  );
};

export default ModalBody;

