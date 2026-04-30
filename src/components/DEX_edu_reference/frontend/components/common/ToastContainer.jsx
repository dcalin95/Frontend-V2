/**
 * 🔔 ToastContainer Component - Toast Container Manager
 * 
 * Container pentru management-ul toast notifications:
 * - Stack toasts
 * - Auto-positioning
 * - Auto-dismiss
 * 
 * @module ToastContainer
 */

import React from 'react';
import Toast from './Toast';
import '../../styles/components/toast-container.css';

const ToastContainer = ({ toasts = [], onRemove }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          title={toast.title}
          duration={toast.duration}
          onClose={onRemove}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
