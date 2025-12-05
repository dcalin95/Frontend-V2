import React, { useState } from 'react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useWallet as useSolanaWalletAdapter } from '@solana/wallet-adapter-react';
import { useWallet } from '../context/WalletContext';
import { prepareForConnection, handleConnectionError } from '../utils/walletConnectionFix';
import walletConnectLogo from '../assets/icons/wallet-connect-logo.png'; 
import evmIcon from '../assets/icons/evm-logo.jpg'; // Import EVM logo
import solanaIcon from '../assets/icons/solana-logo.png'; // Import Solana logo
import binanceLogo from '../assets/exchanges/binance.png'; // Import Binance logo
import './UnifiedWalletModal.css';
import './UnifiedWalletModal.mobile.css';

const UnifiedWalletModal = () => {
  const { showWalletModal, setShowWalletModal, hardReset } = useWallet(); // Get hardReset
  const { open: openEvmModal } = useWeb3Modal();
  const { select: selectSolanaWallet, wallets: solanaWallets } = useSolanaWalletAdapter();
  
  const [selectedNetwork, setSelectedNetwork] = useState(null); // "EVM" | "SOLANA" | null
  const [isConnecting, setIsConnecting] = useState(false); // ⏳ New connecting state
  const [error, setError] = useState(null);

  if (!showWalletModal) return null;

  const handleClose = () => {
    setShowWalletModal(false);
    setSelectedNetwork(null);
    setError(null);
    setIsConnecting(false);
  };

  const handleEvmConnect = async () => {
    try {
      setError(null);
      setIsConnecting(true); // Start loading
      
      // 🔧 FIX: Prepare connection before opening modal
      await prepareForConnection();
      
      // Short delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setShowWalletModal(false);

      // 📱 MOBILE OPTIMIZATION: If inside MetaMask/Trust/Coinbase app, auto-select injected
      if (window.ethereum && (window.ethereum.isMetaMask || window.ethereum.isTrust || window.ethereum.isCoinbaseWallet)) {
          console.log("📱 Detected In-App Browser - connecting directly via Web3Modal default...");
          // Web3Modal handles this automatically usually, but let's ensure smooth transition
      }

      await openEvmModal();
    } catch (err) {
      console.error('[WalletModal] EVM connection error:', err);
      const errorInfo = await handleConnectionError(err);
      
      if (errorInfo.retry) {
        setError('EVM connection failed. Try "Clear Cache & Retry" button below.');
      } else if (errorInfo.reason === 'user_rejected') {
        setShowWalletModal(false);
      } else {
        setError('EVM connection failed. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSolanaConnect = async (walletName) => {
    try {
      setError(null);
      setIsConnecting(true); // Start loading
      
      const wallet = solanaWallets.find(w => w.adapter.name === walletName);
      if (wallet) {
        console.log("Connecting to Solana wallet:", walletName);
        await selectSolanaWallet(wallet.adapter.name);
        // Delay closing modal to allow connection to initialize
        setTimeout(() => {
            setShowWalletModal(false);
            setSelectedNetwork(null);
            setIsConnecting(false);
        }, 1000);
      }
    } catch (error) {
      console.error("Error connecting Solana wallet:", error);
      setError("Solana connection failed. Please try again.");
      setIsConnecting(false);
    }
  };

  return (
    <div className="unified-wallet-modal-overlay" onClick={handleClose}>
      <div className="unified-wallet-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={handleClose}>✖</button>
        
        {isConnecting && (
          <div className="connecting-overlay">
            <div className="loading-spinner"></div>
            <p>Initializing connection...</p>
          </div>
        )}
        
        {!selectedNetwork ? (
          // Step 1: Network Selection
          <>
            <h2 className="modal-title">Select Network</h2>
            <p className="modal-subtitle">Choose which blockchain to connect</p>
            
            <div className="network-grid">
              <button 
                className="network-card evm-card"
                onClick={() => setSelectedNetwork("EVM")}
              >
                <div className="network-icon-wrapper">
                  <img src={evmIcon} alt="EVM" className="network-icon-img" />
                </div>
                <div className="network-info">
                  <div className="network-name">EVM Networks</div>
                  <div className="network-chains">BSC • ETH • Polygon • Arbitrum</div>
                  <div className="network-chains">Optimism • Base • Avalanche</div>
                </div>
              </button>

              <button 
                className="network-card solana-card"
                onClick={() => setSelectedNetwork("SOLANA")}
              >
                <div className="network-icon-wrapper">
                   <img src={solanaIcon} alt="Solana" className="network-icon-img" />
                </div>
                <div className="network-info">
                  <div className="network-name">Solana</div>
                  <div className="network-chains">Mainnet Beta</div>
                  <div className="network-chains">Fast & Low Fees</div>
                </div>
              </button>
            </div>
          </>
        ) : selectedNetwork === "EVM" ? (
          // Step 2a: EVM Wallet Selection
          <>
            <button className="back-btn" onClick={() => setSelectedNetwork(null)}>← Back</button>
            <h2 className="modal-title">Connect EVM Wallet</h2>
            <p className="modal-subtitle">Supports 7+ blockchains - Auto-switch enabled</p>
            
            <div className="wallet-list">
              <button className="wallet-option" onClick={handleEvmConnect}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" />
                <span>MetaMask</span>
              </button>
              <button className="wallet-option" onClick={handleEvmConnect}>
                <img src={walletConnectLogo} alt="WalletConnect" />
                <span>WalletConnect</span>
              </button>
              <button className="wallet-option" onClick={handleEvmConnect}>
                <img src="https://avatars.githubusercontent.com/u/18060234?s=200&v=4" alt="Coinbase" />
                <span>Coinbase Wallet</span>
              </button>
              <button className="wallet-option" onClick={handleEvmConnect}>
                <img src="https://avatars.githubusercontent.com/u/48327834?s=200&v=4" alt="Rainbow" />
                <span>Rainbow</span>
              </button>
               <button className="wallet-option" onClick={handleEvmConnect}>
                <img src="https://trustwallet.com/assets/images/media/assets/TWT.png" alt="Trust Wallet" />
                <span>Trust Wallet</span>
              </button>
              <button className="wallet-option" onClick={handleEvmConnect}>
                <img src={binanceLogo} alt="Binance Web3" />
                <span>Binance Web3</span>
              </button>
               <button className="wallet-option" onClick={handleEvmConnect}>
                <div style={{width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', borderRadius: 8}}>➕</div>
                <span>All Wallets (350+)</span>
              </button>
            </div>
          </>
        ) : (
          // Step 2b: Solana Wallet Selection
          <>
            <button className="back-btn" onClick={() => setSelectedNetwork(null)}>← Back</button>
            <h2 className="modal-title">Connect Solana Wallet</h2>
            <p className="modal-subtitle">Supports SPL tokens & Solana Pay</p>
            
            <div className="wallet-list">
              {solanaWallets.filter(w => w.readyState === 'Installed' || w.readyState === 'Loadable').map((wallet) => (
                <button 
                  key={wallet.adapter.name}
                  className="wallet-option" 
                  onClick={() => handleSolanaConnect(wallet.adapter.name)}
                >
                  <img src={wallet.adapter.icon} alt={wallet.adapter.name} />
                  <span>{wallet.adapter.name}</span>
                </button>
              ))}
              {solanaWallets.filter(w => w.readyState === 'Installed' || w.readyState === 'Loadable').length === 0 && (
                <div className="no-wallets">
                  <p>No Solana wallets detected</p>
                  <a href="https://phantom.app/" target="_blank" rel="noopener noreferrer" className="install-link">
                    Install Phantom →
                  </a>
                </div>
              )}
            </div>
          </>
        )}

        {/* 🔧 Error message */}
        {error && (
          <div className="wallet-error-box" style={{
            background: 'rgba(255, 100, 100, 0.1)',
            border: '1px solid rgba(255, 100, 100, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '16px',
            color: '#ff6464',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* 🔧 Clear Cache & Retry Button */}
        <button
          onClick={hardReset} // Use HARD RESET
          className="clear-cache-btn"
          style={{
            width: '100%',
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(255, 50, 50, 0.15)',
            border: '1px solid rgba(255, 50, 50, 0.4)',
            borderRadius: '12px',
            color: '#ff6464',
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          🧨 Resetare Totală Conexiune (Fix)
        </button>

        {/* Info text */}
        <p style={{fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '12px', textAlign: 'center', lineHeight: '1.4'}}>
          Dacă primești eroarea "Request Pending" sau nu te poți conecta, apasă butonul roșu de mai sus.
        </p>
      </div>
    </div>
  );
};

export default UnifiedWalletModal;

