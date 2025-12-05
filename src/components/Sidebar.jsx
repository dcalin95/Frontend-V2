import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';
import './Sidebar.mobile.css';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../context/WalletContext';
import cardIcon from '../assets/icons/card-logo.jpg';
import logo from '../assets/logo.png';
import SwapModal from './SwapModal';
import HistoryModal from './HistoryModal';

export default function Sidebar() {
  const { user, isMember, signOut: contextSignOut } = useAuth();
  const { isConnected, walletAddress, bitsBalance, nativeBalance, nativeSymbol, connectWallet, disconnectWallet, chainId } = useWallet();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.sidebar-user-menu')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [userMenuOpen]);

  useEffect(() => {
    if (!walletDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.sidebar-wallet-container')) {
        setWalletDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [walletDropdownOpen]);

  function logStripeClick() {
    try { window.gtag && window.gtag('event','cta_click', { name: 'stripe_fiat_header' }); } catch(_){}
    try { window.ttq && window.ttq.track && window.ttq.track('CTA_Click', { name: 'stripe_fiat_header' }); } catch(_){}
  }

  const checkoutUrl = (() => {
    const base = 'https://buy.stripe.com/aFa5kFc3S40G18daAZa3u00?locale=en';
    if (user?.id) {
      const email = encodeURIComponent(user.email || '');
      const ref = encodeURIComponent(user.id);
      return `${base}&client_reference_id=${ref}${email ? `&prefilled_email=${email}`:''}`;
    }
    return base;
  })();

  async function doSignOut() {
    await contextSignOut();
    window.location.reload();
  }

  return (
    <div className="sidebar">
      {/* Bits Ambassador */}
      <Link to="/ambassadors" className="sidebar-ambassador-btn" data-ttq="ClickSidebar:Ambassador">
        <i className="fa-solid fa-handshake"></i>
        <span>Bits Ambassador</span>
      </Link>

      {/* Join & Telegram */}
      {!user && (
        <>
          <Link to="/join" className="sidebar-btn sidebar-join-btn" title="Create account & unlock resources">
            <i className="fa-solid fa-user-plus"></i>
            <span>Join</span>
          </Link>
          <a href="https://t.me/BitSwapDEX_AI" target="_blank" rel="noopener noreferrer" className="sidebar-btn sidebar-telegram-btn" title="Join our Telegram community">
            <i className="fa-brands fa-telegram"></i>
            <span>Telegram</span>
          </a>
        </>
      )}

      {/* Unlock Access */}
      <div className="sidebar-unlock-wrapper">
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-unlock-btn"
          data-ttq="ClickSidebar:Stripe Fiat Checkout"
          onClick={logStripeClick}
          title="Learn more details"
        >
          <img src={cardIcon} alt="" className="sidebar-unlock-icon" />
          <span>Unlock access (€10)</span>
        </a>
        <Link to="/access-details" className="sidebar-unlock-link">
          Payment details &amp; $BITS utility →
        </Link>
      </div>

      {/* Connect Wallet */}
      {!isConnected ? (
        <button 
          onClick={connectWallet}
          className="sidebar-btn sidebar-wallet-btn"
          title="Connect wallet to verify BITS holdings"
        >
          <i className="fa-solid fa-wallet"></i>
          <span>Connect Wallet</span>
        </button>
      ) : (
        <div className="sidebar-wallet-container">
          <button 
            className="sidebar-wallet-info" 
            onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
          >
            <div className="sidebar-wallet-main">
              <div className="sidebar-wallet-address">
                {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </div>
              <div className="sidebar-wallet-balance">
                <img src={logo} alt="BITS" className="sidebar-token-icon-main" /> {parseFloat(bitsBalance || 0).toFixed(1)} BITS
              </div>
            </div>
            <i className={`fa-solid fa-chevron-${walletDropdownOpen ? 'up' : 'down'} wallet-dropdown-icon`}></i>
          </button>

          {walletDropdownOpen && (
            <div className="sidebar-wallet-dropdown">
              {/* Network Info */}
              <div className="wallet-dropdown-section">
                <div className="wallet-dropdown-label">Network</div>
                <div className="wallet-dropdown-value">
                  {chainId === 56 ? '🟡 BSC' : 
                   chainId === 1 ? '⚪ Ethereum' :
                   chainId === 137 ? '🟣 Polygon' :
                   chainId === 42161 ? '🔵 Arbitrum' :
                   chainId === 10 ? '🔴 Optimism' :
                   chainId === 8453 ? '🔵 Base' :
                   chainId === 43114 ? '🔺 Avalanche' : '🌐 EVM'}
                </div>
              </div>

              {/* Balances */}
              <div className="wallet-dropdown-section">
                <div className="wallet-dropdown-label">Balances</div>
                <div className="wallet-balance-item">
                  <span className="balance-symbol">{nativeSymbol}</span>
                  <span className="balance-amount">{nativeBalance}</span>
                </div>
                <div className="wallet-balance-item bits">
                  <span className="balance-symbol">
                    <img src={logo} alt="BITS" className="sidebar-token-icon-small" /> BITS
                  </span>
                  <span className="balance-amount">{bitsBalance}</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="wallet-dropdown-section">
                <div className="wallet-dropdown-label">Quick Actions</div>
                <button 
                  onClick={() => { setHistoryModalOpen(true); setWalletDropdownOpen(false); }}
                  className="wallet-action-btn"
                >
                  <i className="fa-solid fa-history"></i>
                  View History
                </button>
                <button 
                  onClick={() => { setSwapModalOpen(true); setWalletDropdownOpen(false); }}
                  className="wallet-action-btn"
                >
                  <i className="fa-solid fa-right-left"></i>
                  Swap Tokens
                </button>
              </div>

              {/* Disconnect */}
              <button onClick={() => { disconnectWallet(); setWalletDropdownOpen(false); }} className="sidebar-wallet-disconnect">
                <i className="fa-solid fa-arrow-right-from-bracket"></i>
                Disconnect Wallet
              </button>
            </div>
          )}
        </div>
      )}

      {/* User Menu */}
      {user && (
        <div className="sidebar-user-menu">
          <button 
            className="sidebar-user-btn" 
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <span className="sidebar-user-initial">
              {(user.username || user.email || 'U').slice(0,1).toUpperCase()}
            </span>
            <span className="sidebar-user-name">{user.username || user.email}</span>
            {isMember && <span className="sidebar-user-badge">LIFETIME</span>}
            <i className={`fa-solid fa-chevron-${userMenuOpen ? 'up' : 'down'}`}></i>
          </button>
          {userMenuOpen && (
            <div className="sidebar-user-dropdown">
              <Link to="/members" className="sidebar-dropdown-link" onClick={() => setUserMenuOpen(false)}>
                <i className="fa-solid fa-id-card"></i> Members Area
              </Link>
              <button className="sidebar-dropdown-link signout-link" onClick={doSignOut}>
                <i className="fa-solid fa-arrow-right-from-bracket"></i> Sign out
              </button>
            </div>
          )}
        </div>
      )}

      {/* Swap Modal */}
      <SwapModal isOpen={swapModalOpen} onClose={() => setSwapModalOpen(false)} />
      
      {/* History Modal */}
      <HistoryModal isOpen={historyModalOpen} onClose={() => setHistoryModalOpen(false)} />
    </div>
  );
}

