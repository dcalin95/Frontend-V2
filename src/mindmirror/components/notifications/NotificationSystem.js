import React, { useState, useEffect } from 'react';
import './NotificationSystem.css';

const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  INFO: 'info',
  ACHIEVEMENT: 'achievement'
};

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = NOTIFICATION_TYPES.INFO) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Custom hook pentru evenimente
  useEffect(() => {
    const handleMindEvent = (event) => {
      switch(event.type) {
        case 'tier_unlock':
          addNotification(`🎉 Tier ${event.tier} Unlocked! New features available.`, NOTIFICATION_TYPES.ACHIEVEMENT);
          break;
        case 'analysis_complete':
          addNotification('✨ Mind analysis complete!', NOTIFICATION_TYPES.SUCCESS);
          break;
        case 'nft_ready':
          addNotification('🎨 Your Mind NFT is ready to mint!', NOTIFICATION_TYPES.SUCCESS);
          break;
        case 'bits_required':
          addNotification(`💎 ${event.amount} BITS needed for next tier`, NOTIFICATION_TYPES.INFO);
          break;
        default:
          break;
      }
    };

    window.addEventListener('mind_event', handleMindEvent);
    return () => window.removeEventListener('mind_event', handleMindEvent);
  }, []);

  return (
    <div className="notification-container">
      {notifications.map(({ id, message, type }) => (
        <div 
          key={id}
          className={`notification ${type}`}
          onClick={() => removeNotification(id)}
        >
          <p>{message}</p>
          <div className="notification-progress" />
        </div>
      ))}
    </div>
  );
};

export default NotificationSystem;

// Helper pentru emiterea evenimentelor
export const emitMindEvent = (type, data = {}) => {
  const event = new CustomEvent('mind_event', {
    detail: { type, ...data }
  });
  window.dispatchEvent(event);
};










