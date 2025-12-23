import React, { useEffect } from 'react';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount } from 'wagmi';
import { useWallet } from '../context/WalletContext';
import walletConnectLogo from '../assets/icons/wallet-connect-logo.png';

/**
 * 🔐 Web3Modal Handler - Separate component for Web3Modal logic
 * Handles Web3Modal connection independently from EVM Direct and Solana Direct
 */
const Web3ModalHandler = ({ onClose }) => {
  const { open: openEvmModal } = useWeb3Modal();
  const { isConnected, address } = useAccount();
  const { setShowWalletModal } = useWallet();

  // Auto-open Web3Modal when component mounts
  useEffect(() => {
    const openModal = async () => {
      try {
        console.log("🌐 [Web3ModalHandler] Opening Web3Modal...");
        await openEvmModal();
      } catch (error) {
        console.error("❌ [Web3ModalHandler] Error opening Web3Modal:", error);
      }
    };

    openModal();
  }, [openEvmModal]);

  // Auto-close this component when connection is successful
  useEffect(() => {
    if (isConnected && address) {
      console.log('✅ [Web3ModalHandler] EVM wallet connected via Web3Modal, closing...');
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
      <h2 className="modal-title">Web3Modal</h2>
      <div className="web3modal-content">
        <p>Opening Web3Modal to select from all available wallets...</p>
        <button
          className="wallet-option-btn"
          onClick={async () => {
            try {
              await openEvmModal();
            } catch (error) {
              console.error("❌ [Web3ModalHandler] Error:", error);
            }
          }}
        >
          <img src={walletConnectLogo} alt="Web3Modal" style={{width: 32, height: 32}} />
          <span>Open Web3Modal</span>
        </button>
      </div>
    </div>
  );
};

export default Web3ModalHandler;

