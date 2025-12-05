import React, { useState, useEffect } from 'react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useWallet as useSolanaWalletAdapter } from '@solana/wallet-adapter-react';
import { useWallet } from '../context/WalletContext';
import { 
  detectInstalledWallets, 
  detectInAppBrowser, 
  detectMobile,
  getRecommendedWallet,
  getInstallLink,
  WALLET_INSTALL_LINKS 
} from '../utils/walletDetection';
import './MobileWalletModal.css';

const MobileWalletModal = () => {
  const { showWalletModal, setShowWalletModal } = useWallet();
  const { open: openEvmModal } = useWeb3Modal();
  const { select: selectSolanaWallet, wallets: solanaWallets } = useSolanaWalletAdapter();
  
  const [selectedNetwork, setSelectedNetwork] = useState(null); // "EVM" | "SOLANA"
  const [isConnecting, setIsConnecting] = useState(false);
  const [installedWallets, setInstalledWallets] = useState({});
  const [inAppBrowser, setInAppBrowser] = useState({});
  const [recommendedWallet, setRecommendedWallet] = useState(null);

  useEffect(() => {
    if (showWalletModal) {
      const installed = detectInstalledWallets();
      const inApp = detectInAppBrowser();
      const recommended = getRecommendedWallet();
      
      setInstalledWallets(installed);
      setInAppBrowser(inApp);
      setRecommendedWallet(recommended);
      
      console.log('🔍 [MobileWalletModal] Detected:', { installed, inApp, recommended });
      
      // Dacă suntem în in-app browser și avem doar 1 wallet, conectăm automat EVM
      if (inApp.isInApp && installed.any) {
        console.log('📱 In-app browser detected, preselecting EVM network');
        setSelectedNetwork('EVM');
      }
    }
  }, [showWalletModal]);

  if (!showWalletModal) return null;

  const handleClose = () => {
    setShowWalletModal(false);
    setSelectedNetwork(null);
    setIsConnecting(false);
  };

  // 🔗 Conectare DIRECTĂ la wallet instalat (fără Web3Modal intermediar)
  const handleDirectConnect = async () => {
    try {
      setIsConnecting(true);
      
      if (window.ethereum) {
        console.log('📱 [MobileWalletModal] Direct connection via window.ethereum');
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        setShowWalletModal(false);
      } else {
        // Fallback la Web3Modal dacă nu există ethereum provider
        setShowWalletModal(false);
        await openEvmModal();
      }
    } catch (err) {
      console.error('[MobileWalletModal] Direct connect error:', err);
      // Dacă user reject, nu afișa eroare
      if (err.code !== 4001) {
        setShowWalletModal(false);
        await openEvmModal(); // Fallback
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // 🌐 Deschide Web3Modal pentru WalletConnect și alte opțiuni
  const handleWalletConnectOpen = async () => {
    try {
      setIsConnecting(true);
      setShowWalletModal(false);
      await openEvmModal();
    } catch (err) {
      console.error('[MobileWalletModal] WalletConnect error:', err);
      setIsConnecting(false);
    }
  };

  const handleSolanaConnect = async (walletName) => {
    try {
      setIsConnecting(true);
      const wallet = solanaWallets.find(w => w.adapter.name === walletName);
      if (wallet) {
        await selectSolanaWallet(wallet.adapter.name);
        setTimeout(() => {
          setShowWalletModal(false);
          setIsConnecting(false);
        }, 1000);
      }
    } catch (err) {
      console.error('[MobileWalletModal] Solana error:', err);
      setIsConnecting(false);
    }
  };

  const handleInstallWallet = (walletKey) => {
    const link = getInstallLink(walletKey);
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  // 📱 MAIN VIEW - Network Selection
  if (!selectedNetwork) {
    return (
      <div className="mobile-wallet-overlay" onClick={handleClose}>
        <div className="mobile-wallet-modal" onClick={(e) => e.stopPropagation()}>
          <div className="mobile-wallet-header">
            <h3>Connect Wallet</h3>
            <button className="mobile-wallet-close" onClick={handleClose}>✕</button>
          </div>

          {inAppBrowser.isInApp && (
            <div className="mobile-wallet-info-banner">
              <span className="banner-icon">📱</span>
              <div className="banner-text">
                <strong>In-App Browser Detected</strong>
                <p>{inAppBrowser.detectedBrowser.replace('is', '')} browser ready to connect</p>
              </div>
            </div>
          )}

          <div className="mobile-wallet-networks">
            <button 
              className="mobile-network-card evm-card"
              onClick={() => setSelectedNetwork('EVM')}
            >
              <div className="network-icon">⟠</div>
              <div className="network-info">
                <h4>EVM Networks</h4>
                <p>Ethereum, BSC, Polygon</p>
              </div>
              <div className="network-arrow">→</div>
            </button>

            <button 
              className="mobile-network-card solana-card"
              onClick={() => setSelectedNetwork('SOLANA')}
            >
              <div className="network-icon">◎</div>
              <div className="network-info">
                <h4>Solana</h4>
                <p>Fast & Low Cost</p>
              </div>
              <div className="network-arrow">→</div>
            </button>
          </div>

          {!installedWallets.any && (
            <div className="mobile-wallet-empty">
              <p className="empty-icon">🦊</p>
              <h4>No Wallet Detected</h4>
              <p>Install a wallet to get started</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 📱 EVM WALLETS VIEW
  if (selectedNetwork === 'EVM') {
    return (
      <div className="mobile-wallet-overlay" onClick={handleClose}>
        <div className="mobile-wallet-modal" onClick={(e) => e.stopPropagation()}>
          <div className="mobile-wallet-header">
            <button className="mobile-wallet-back" onClick={() => setSelectedNetwork(null)}>←</button>
            <h3>EVM Wallets</h3>
            <button className="mobile-wallet-close" onClick={handleClose}>✕</button>
          </div>

          <div className="mobile-wallet-list">
            {/* MetaMask - CONECTARE DIRECTĂ */}
            <div className="mobile-wallet-item">
              {installedWallets.metamask ? (
                <button className="mobile-wallet-btn installed" onClick={handleDirectConnect}>
                  <span className="wallet-icon">🦊</span>
                  <div className="wallet-info">
                    <strong>MetaMask</strong>
                    <span className="wallet-status installed-badge">✓ Tap to Connect</span>
                  </div>
                </button>
              ) : (
                <>
                  <button className="mobile-wallet-btn not-installed" disabled>
                    <span className="wallet-icon">🦊</span>
                    <div className="wallet-info">
                      <strong>MetaMask</strong>
                      <span className="wallet-status">Not Installed</span>
                    </div>
                  </button>
                  <button 
                    className="mobile-install-btn"
                    onClick={() => handleInstallWallet('metamask')}
                  >
                    Install
                  </button>
                </>
              )}
            </div>

            {/* Trust Wallet - CONECTARE DIRECTĂ */}
            <div className="mobile-wallet-item">
              {installedWallets.trustWallet ? (
                <button className="mobile-wallet-btn installed" onClick={handleDirectConnect}>
                  <span className="wallet-icon">🛡️</span>
                  <div className="wallet-info">
                    <strong>Trust Wallet</strong>
                    <span className="wallet-status installed-badge">✓ Tap to Connect</span>
                  </div>
                </button>
              ) : (
                <>
                  <button className="mobile-wallet-btn not-installed" disabled>
                    <span className="wallet-icon">🛡️</span>
                    <div className="wallet-info">
                      <strong>Trust Wallet</strong>
                      <span className="wallet-status">Not Installed</span>
                    </div>
                  </button>
                  <button 
                    className="mobile-install-btn"
                    onClick={() => handleInstallWallet('trustWallet')}
                  >
                    Install
                  </button>
                </>
              )}
            </div>

            {/* Coinbase Wallet - CONECTARE DIRECTĂ */}
            <div className="mobile-wallet-item">
              {installedWallets.coinbase ? (
                <button className="mobile-wallet-btn installed" onClick={handleDirectConnect}>
                  <span className="wallet-icon">🪙</span>
                  <div className="wallet-info">
                    <strong>Coinbase Wallet</strong>
                    <span className="wallet-status installed-badge">✓ Tap to Connect</span>
                  </div>
                </button>
              ) : (
                <>
                  <button className="mobile-wallet-btn not-installed" disabled>
                    <span className="wallet-icon">🪙</span>
                    <div className="wallet-info">
                      <strong>Coinbase Wallet</strong>
                      <span className="wallet-status">Not Installed</span>
                    </div>
                  </button>
                  <button 
                    className="mobile-install-btn"
                    onClick={() => handleInstallWallet('coinbase')}
                  >
                    Install
                  </button>
                </>
              )}
            </div>

            {/* WalletConnect - Deschide Web3Modal pentru alte wallet-uri */}
            <button className="mobile-wallet-btn installed" onClick={handleWalletConnectOpen}>
              <span className="wallet-icon">🔗</span>
              <div className="wallet-info">
                <strong>WalletConnect</strong>
                <span className="wallet-status universal-badge">300+ Wallets</span>
              </div>
            </button>
          </div>

          {inAppBrowser.isInApp && (
            <div className="mobile-wallet-tip">
              <span className="tip-icon">💡</span>
              <p>You're browsing from {inAppBrowser.detectedBrowser.replace('is', '')}. Click any wallet to connect!</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 📱 SOLANA WALLETS VIEW
  if (selectedNetwork === 'SOLANA') {
    return (
      <div className="mobile-wallet-overlay" onClick={handleClose}>
        <div className="mobile-wallet-modal" onClick={(e) => e.stopPropagation()}>
          <div className="mobile-wallet-header">
            <button className="mobile-wallet-back" onClick={() => setSelectedNetwork(null)}>←</button>
            <h3>Solana Wallets</h3>
            <button className="mobile-wallet-close" onClick={handleClose}>✕</button>
          </div>

          <div className="mobile-wallet-list">
            {/* Phantom */}
            <div className="mobile-wallet-item">
              {installedWallets.phantom ? (
                <button 
                  className="mobile-wallet-btn installed" 
                  onClick={() => handleSolanaConnect('Phantom')}
                >
                  <span className="wallet-icon">👻</span>
                  <div className="wallet-info">
                    <strong>Phantom</strong>
                    <span className="wallet-status installed-badge">✓ Installed</span>
                  </div>
                </button>
              ) : (
                <>
                  <button className="mobile-wallet-btn not-installed" disabled>
                    <span className="wallet-icon">👻</span>
                    <div className="wallet-info">
                      <strong>Phantom</strong>
                      <span className="wallet-status">Not Installed</span>
                    </div>
                  </button>
                  <button 
                    className="mobile-install-btn"
                    onClick={() => handleInstallWallet('phantom')}
                  >
                    Install
                  </button>
                </>
              )}
            </div>

            {/* Other Solana Wallets (dynamic) */}
            {solanaWallets?.filter(w => w.adapter.name !== 'Phantom').map(wallet => (
              <button 
                key={wallet.adapter.name}
                className="mobile-wallet-btn installed"
                onClick={() => handleSolanaConnect(wallet.adapter.name)}
              >
                <span className="wallet-icon">
                  {wallet.adapter.icon ? (
                    <img src={wallet.adapter.icon} alt={wallet.adapter.name} style={{ width: 24, height: 24 }} />
                  ) : '◎'}
                </span>
                <div className="wallet-info">
                  <strong>{wallet.adapter.name}</strong>
                  <span className="wallet-status installed-badge">✓ Ready</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MobileWalletModal;

