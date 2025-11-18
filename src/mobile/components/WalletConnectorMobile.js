import React, { useState } from 'react';
import Icon from '../../assets/icons/Icon';
import '../Mobile.css';

const WalletConnectorMobile = ({ onConnect, isConnected, walletAddress }) => {
  const [showOptions, setShowOptions] = useState(false);

  const walletProviders = [
    { name: 'MetaMask', icon: 'wallet', id: 'metamask' },
    { name: 'WalletConnect', icon: 'connect', id: 'walletconnect' },
    { name: 'Coinbase', icon: 'crypto', id: 'coinbase' },
    { name: 'Trust Wallet', icon: 'shield', id: 'trust' }
  ];

  const handleConnect = (providerId) => {
    if (onConnect) {
      onConnect(providerId);
    }
    setShowOptions(false);
  };

  if (isConnected && walletAddress) {
    return (
      <div className="mobile-wallet-connected">
        <Icon name="success" size="small" animate="glow" />
        <span className="mobile-wallet-address">
          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </span>
      </div>
    );
  }

  return (
    <>
      <button 
        className="mobile-wallet-connect-btn"
        onClick={() => setShowOptions(true)}
      >
        <Icon name="wallet" size="medium" animate="float" />
        <span>Connect Wallet</span>
      </button>

      {showOptions && (
        <div className="mobile-wallet-modal-overlay" onClick={() => setShowOptions(false)}>
          <div className="mobile-wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-wallet-modal-header">
              <h3>Select Wallet</h3>
              <button 
                className="mobile-wallet-modal-close"
                onClick={() => setShowOptions(false)}
              >
                <Icon name="close" size="small" />
              </button>
            </div>
            <div className="mobile-wallet-options">
              {walletProviders.map((provider) => (
                <button
                  key={provider.id}
                  className="mobile-wallet-option"
                  onClick={() => handleConnect(provider.id)}
                >
                  <Icon name={provider.icon} size="large" />
                  <span>{provider.name}</span>
                  <Icon name="chevron-right" size="small" className="mobile-wallet-arrow" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WalletConnectorMobile;

