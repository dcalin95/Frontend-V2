/**
 * 🔔 Toast Component - Toast Notification
 * 
 * Component reutilizabil pentru toast notifications:
 * - Success, error, warning, info types
 * - Auto-dismiss
 * - Manual dismiss
 * - Stack multiple toasts
 * 
 * @module Toast
 */

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import '../../styles/components/toast.css';

const Toast = ({ 
  id,
  type = 'info',
  message,
  title,
  duration = 0,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose(id);
    }, 300);
  };

  if (!isVisible) return null;

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  };

  const Icon = icons[type] || Info;

  const getToastClass = () => {
    return `toast toast-${type} ${isExiting ? 'toast-exiting' : 'toast-entering'}`;
  };

  return (
    <div className={getToastClass()}>
      <div className="toast-icon-wrapper">
        <Icon size={20} className={`toast-icon toast-icon-${type}`} />
      </div>
      <div className="toast-content">
        {title && <div className="toast-title">{title}</div>}
        <div className="toast-message">{message}</div>
      </div>
      <button 
        className="toast-close"
        onClick={handleClose}
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
