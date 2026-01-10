import React from 'react';
import telegramLogo from '../assets/icons/telegram.svg';
import { trackStandardEvent } from '../lib/tiktok';
import { getVisitorIdentity, getSessionId } from '../lib/engagement';
import './MobileTelegramButton.css';

/**
 * 📱 Mobile-only Telegram button positioned above PresaleCopilot
 * Only visible on mobile devices (body.mode-mobile)
 */
const MobileTelegramButton = () => {
  return (
    <a 
      href="https://t.me/BitSwapDEX_AI" 
      target="_blank" 
      rel="noopener noreferrer" 
      className="mobile-telegram-button"
      aria-label="Join our Telegram community"
      onClick={() => {
        const identity = getVisitorIdentity();
        const sessionId = getSessionId();
        trackStandardEvent('Subscribe', {
          description: 'telegram_click',
          page_path: window.location.pathname || window.location.hash?.replace('#', '') || '/',
          method: 'mobile_button',
          session_id: sessionId,
          is_returning: identity.is_returning,
          days_since_first_seen: identity.days_since_first_seen,
          visit_count: identity.visit_count,
        });
      }}
    >
      <img src={telegramLogo} alt="Telegram" width={22} height={22} />
    </a>
  );
};

export default MobileTelegramButton;

