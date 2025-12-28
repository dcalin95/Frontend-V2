import React from 'react';
import telegramLogo from '../assets/icons/telegram.svg';
import './MobileTelegramButton.css';

/**
 * 📱 Mobile-only Telegram button positioned above PresaleCopilot
 * Only visible on mobile devices (body.mode-mobile)
 */
const MobileTelegramButton = () => {
  return (
    <a 
      href="https://t.me/BitSwapDEX_AI/" 
      target="_blank" 
      rel="noopener noreferrer" 
      className="mobile-telegram-button"
      aria-label="Join our Telegram community"
    >
      <img src={telegramLogo} alt="Telegram" width={22} height={22} />
    </a>
  );
};

export default MobileTelegramButton;

