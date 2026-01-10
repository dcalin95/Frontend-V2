/**
 * 📊 WalletModal Component
 * 
 * Modal pentru wallet connection - Similar cu Oxium DEX
 * Support pentru multiple wallet providers:
 * - MetaMask
 * - WalletConnect
 * - Coinbase Wallet
 * - Injected Wallets
 */

import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Check, ChevronRight, HelpCircle, Search } from 'lucide-react';
import './WalletModal.css';

// Wallet providers configuration - Similar cu Oxium
const WALLET_PROVIDERS = [
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: 'https://avatars.githubusercontent.com/u/37784886?s=200&v=4',
    description: 'Scan QR code with your mobile wallet',
    isInstalled: false,
    isRecommended: false,
    connector: 'walletconnect',
    hasQRCode: true
  },
  {
    id: 'binance',
    name: 'Binance Wallet',
    icon: 'https://www.binance.com/favicon.ico',
    description: 'Connect using Binance Wallet',
    isInstalled: typeof window !== 'undefined' && !!window.BinanceChain,
    isRecommended: false,
    connector: 'binance'
  },
  {
    id: '1inch',
    name: '1inch Wallet',
    icon: 'https://1inch.io/img/favicon/apple-touch-icon.png',
    description: 'Connect using 1inch Wallet',
    isInstalled: false,
    isRecommended: false,
    connector: '1inch'
  },
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
    description: 'Connect using MetaMask browser extension',
    isInstalled: typeof window !== 'undefined' && !!window.ethereum?.isMetaMask,
    isRecommended: true,
    connector: 'injected'
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    icon: 'https://trustwallet.com/assets/images/media/assets/TWT.png',
    description: 'Connect using Trust Wallet',
    isInstalled: typeof window !== 'undefined' && !!window.ethereum?.isTrust,
    isRecommended: false,
    connector: 'injected'
  }
];

const WalletModal = ({ isOpen, onClose, onConnect, recentWallets = [] }) => {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Update installed status
    WALLET_PROVIDERS.forEach(provider => {
      if (provider.connector === 'injected') {
        provider.isInstalled = typeof window !== 'undefined' && !!window.ethereum;
      }
    });
  }, []);

  const handleWalletSelect = async (provider) => {
    if (!termsAccepted) {
      return; // Require terms acceptance
    }

    if (!provider.isInstalled && (provider.id === 'metamask' || provider.id === 'binance')) {
      // Open install page
      const installUrls = {
        metamask: 'https://metamask.io/download/',
        binance: 'https://www.binance.com/en/download'
      };
      window.open(installUrls[provider.id] || '#', '_blank');
      return;
    }

    setSelectedProvider(provider);
    setConnecting(true);

    try {
      // TODO: Implement actual wallet connection
      // await connectWallet(provider.connector);
      
      // Mock connection
      setTimeout(() => {
        setConnecting(false);
        if (onConnect) {
          onConnect(provider);
        }
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Wallet connection error:', error);
      setConnecting(false);
    }
  };

  const filteredProviders = showSearch && searchQuery
    ? WALLET_PROVIDERS.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : WALLET_PROVIDERS;

  if (!isOpen) return null;

  return (
    <div className="wallet-modal-overlay" onClick={onClose}>
      <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wallet-modal-header">
          <button className="wallet-modal-help" title="Help">
            <HelpCircle size={20} />
          </button>
          <h2 className="wallet-modal-title">Connect Wallet</h2>
          <button className="wallet-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="wallet-modal-content">
          {/* Terms Checkbox - Similar cu Oxium */}
          <div className="wallet-terms-section">
            <label className="wallet-terms-checkbox">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <span>
                I agree to our{' '}
                <a href="https://docs.oxium.xyz/reference-and-compliance/terms-of-service" target="_blank" rel="noopener noreferrer">
                  terms of service
                </a>
                {' '}and{' '}
                <a href="https://docs.oxium.xyz/reference-and-compliance/privacy-policy" target="_blank" rel="noopener noreferrer">
                  privacy policy
                </a>
              </span>
            </label>
          </div>
          {/* Recent Wallets */}
          {recentWallets.length > 0 && (
            <div className="wallet-section">
              <div className="wallet-section-title">Recent</div>
              <div className="wallet-list">
                {recentWallets.map((wallet) => {
                  const provider = WALLET_PROVIDERS.find(p => p.id === wallet.providerId);
                  if (!provider) return null;
                  
                  return (
                    <button
                      key={wallet.id}
                      className="wallet-option recent"
                      onClick={() => handleWalletSelect(provider)}
                      disabled={connecting}
                    >
                      {provider.icon && (
                        <img src={provider.icon} alt={provider.name} className="wallet-icon" />
                      )}
                      <div className="wallet-info">
                        <div className="wallet-name">{provider.name}</div>
                        <div className="wallet-address">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</div>
                      </div>
                      <Check size={16} className="wallet-check" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Wallets */}
          <div className="wallet-section">
            <div className="wallet-section-title">Connect a Wallet</div>
            <div className="wallet-list">
              {filteredProviders.map((provider) => (
                <button
                  key={provider.id}
                  className={`wallet-option ${provider.isRecommended ? 'recommended' : ''} ${!provider.isInstalled && (provider.id === 'metamask' || provider.id === 'binance') ? 'not-installed' : ''}`}
                  onClick={() => handleWalletSelect(provider)}
                  disabled={connecting}
                  style={{ opacity: !termsAccepted ? 0.5 : 1, cursor: !termsAccepted ? 'not-allowed' : 'pointer' }}
                >
                  <div className="wallet-option-left">
                    {provider.icon && (
                      <img src={provider.icon} alt={provider.name} className="wallet-icon" />
                    )}
                    <div className="wallet-info">
                      <div className="wallet-name-row">
                        <span className="wallet-name">{provider.name}</span>
                        {provider.isRecommended && (
                          <span className="wallet-badge recommended-badge">Recommended</span>
                        )}
                        {!provider.isInstalled && (provider.id === 'metamask' || provider.id === 'binance') && (
                          <span className="wallet-badge install-badge">Install</span>
                        )}
                        {provider.isInstalled && (
                          <span className="wallet-badge installed-badge">
                            <Check size={12} /> Installed
                          </span>
                        )}
                      </div>
                      {provider.hasQRCode && (
                        <div className="wallet-qr-hint">QR CODE</div>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={20} className="wallet-arrow" />
                </button>
              ))}
            </div>

            {/* Search Wallet Button - Similar cu Oxium */}
            <button
              className="wallet-search-btn"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search size={18} />
              <span>Search Wallet</span>
              <span className="wallet-count">60+</span>
              <ChevronRight size={18} />
            </button>

            {showSearch && (
              <div className="wallet-search-container">
                <input
                  type="text"
                  placeholder="Search wallet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="wallet-search-input"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Network Selector */}
          <div className="wallet-section">
            <div className="wallet-section-title">Network</div>
            <div className="network-selector">
              <button className="network-option active">
                <div className="network-dot"></div>
                <span>BSC Mainnet</span>
              </button>
              <button className="network-option">
                <div className="network-dot testnet"></div>
                <span>BSC Testnet</span>
              </button>
            </div>
          </div>

          {/* Footer - Similar cu Oxium */}
          <div className="wallet-modal-footer">
            <p className="wallet-footer-text">
              UX by{' '}
              <a href="https://reown.com" target="_blank" rel="noopener noreferrer">
                <img 
                  src="https://reown.com/favicon.ico" 
                  alt="Reown" 
                  className="reown-logo"
                />
                reown
              </a>
            </p>
          </div>
        </div>

        {connecting && (
          <div className="wallet-connecting-overlay">
            <div className="wallet-connecting-spinner"></div>
            <p>Connecting to {selectedProvider?.name}...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletModal;

