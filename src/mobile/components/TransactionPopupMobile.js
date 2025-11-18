import React from 'react';
import Icon from '../../assets/icons/Icon';
import '../Mobile.css';

const TransactionPopupMobile = ({ message, type = 'info', onClose, duration = 5000 }) => {
  React.useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIconName = () => {
    switch(type) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  };

  return (
    <div className={`mobile-transaction-popup mobile-transaction-popup-${type}`}>
      <Icon name={getIconName()} size="medium" animate="pulse" />
      <span className="mobile-transaction-message">{message}</span>
      {onClose && (
        <button 
          className="mobile-transaction-close"
          onClick={onClose}
          aria-label="Close"
        >
          <Icon name="close" size="small" />
        </button>
      )}
    </div>
  );
};

export default TransactionPopupMobile;

