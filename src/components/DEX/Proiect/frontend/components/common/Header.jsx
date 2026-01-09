/**
 * 📋 Header Component - Main Header
 * 
 * Header component pentru BitSwapDEX AI Trading Frontend:
 * - Logo
 * - Navigation
 * - User info
 * - Wallet connection (opțional)
 * 
 * @module Header
 */

import React from 'react';
import { Brain, Wallet } from 'lucide-react';
import '../../styles/header.css';

const Header = ({ user = null, walletAddress = null, onConnectWallet = null }) => {
  return (
    <header className="ai-trading-header">
      <div className="ai-trading-header-left">
        <div className="ai-trading-logo">
          <Brain size={24} />
          <span className="ai-trading-logo-text">BitSwapDEX AI Trading</span>
        </div>
      </div>
      
      <div className="ai-trading-header-right">
        {walletAddress ? (
          <div className="ai-trading-wallet-connected">
            <Wallet size={16} />
            <span className="ai-trading-wallet-address">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
          </div>
        ) : (
          onConnectWallet && (
            <button 
              className="ai-trading-connect-wallet-btn"
              onClick={onConnectWallet}
            >
              <Wallet size={16} />
              Connect Wallet
            </button>
          )
        )}
        
        {user && (
          <div className="ai-trading-user-info">
            <span className="ai-trading-user-name">{user.name || user.email || user.id}</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

