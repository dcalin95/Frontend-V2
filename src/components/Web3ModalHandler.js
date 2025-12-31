import React, { useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { useWallet } from '../context/WalletContext';
import walletConnectLogo from '../assets/icons/wallet-connect-logo.png';

/**
 * 🔐 WalletConnect Handler - Dedicated component for WalletConnect connector logic
 * Handles WalletConnect connection independently from EVM Direct and Solana Direct
 */
const Web3ModalHandler = ({ onClose }) => {
  const { connect, connectors } = useConnect();
  const { isConnected, address } = useAccount();
  const { setShowWalletModal } = useWallet();

  // Auto-open WalletConnect (non-iframe) when component mounts
  useEffect(() => {
    const openWalletConnect = async () => {
      try {
        const wc = connectors.find(c => c.id === 'walletConnect' || String(c.name || '').toLowerCase().includes('walletconnect'));
        if (!wc) {
          console.warn("⚠️ [Web3ModalHandler] WalletConnect connector not found.");
          return;
        }
        console.log("🌐 [Web3ModalHandler] Opening WalletConnect connector...");
        await connect({ connector: wc });
      } catch (error) {
        console.error("❌ [Web3ModalHandler] Error opening WalletConnect:", error);
      }
    };

    openWalletConnect();
  }, [connect, connectors]);

  // Auto-close this component when connection is successful
  useEffect(() => {
    if (isConnected && address) {
      console.log('✅ [WalletConnectHandler] EVM wallet connected via WalletConnect, closing...');
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
        setShowWalletModal(false);
        // Dispatch event to open wallet box
        window.dispatchEvent(new CustomEvent('openWalletBox'));
      }, 500);
    }
  }, [isConnected, address, onClose, setShowWalletModal]);

  return (
    <div className="web3modal-handler">
      <h2 className="modal-title">WalletConnect</h2>
      <div className="web3modal-content">
        <p>Opening WalletConnect (QR on desktop / deep link on mobile)...</p>
        <button
          className="wallet-option-btn"
          onClick={async () => {
            try {
              const wc = connectors.find(c => c.id === 'walletConnect' || String(c.name || '').toLowerCase().includes('walletconnect'));
              if (!wc) return;
              await connect({ connector: wc });
            } catch (error) {
              console.error("❌ [Web3ModalHandler] Error:", error);
            }
          }}
        >
          <img src={walletConnectLogo} alt="Web3Modal" style={{width: 32, height: 32}} />
          <span>Open WalletConnect</span>
        </button>
      </div>
    </div>
  );
};

export default Web3ModalHandler;

