/**
 * 🔘 ModalFooter Component - Modal Footer
 */

import React from 'react';
import './Modal.css';

const ModalFooter = ({ children, className = '' }) => {
  return (
    <div className={`modal-footer ${className}`}>
      {children}
    </div>
  );
};

export default ModalFooter;

