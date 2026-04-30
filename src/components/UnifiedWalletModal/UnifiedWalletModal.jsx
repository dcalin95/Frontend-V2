import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useConnect } from 'wagmi';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useWallet } from '../../context/WalletContext';
import { getSortedEvmConnectorsForModal } from './evmConnectorsForModal';
import { useUnifiedWalletModalHandlers } from './useUnifiedWalletModalHandlers';
import { WalletModalSectionEVM } from './WalletModalSectionEVM';
import { WalletModalSectionSolana } from './WalletModalSectionSolana';
import { MODAL_LABELS } from './constants';
import '../UnifiedWalletModal.css';
import '../UnifiedWalletModal.mobile.css';

export default function UnifiedWalletModal() {
  const {
    showWalletModal,
    setShowWalletModal,
    walletModalError: error,
    setWalletModalError: setError,
    isConnectingWallet: connecting,
    setIsConnectingWallet: setConnecting,
  } = useWallet();
  const { connectors } = useConnect();
  const { wallets: solanaWallets } = useSolanaWallet();
  const prevBodyOverflowRef = useRef(null);
  const [infoMessage, setInfoMessage] = useState(null);

  const { handleClose, handleEvmConnect, handleSolanaConnect } = useUnifiedWalletModalHandlers(
    setShowWalletModal,
    setError,
    setConnecting,
    setInfoMessage
  );

  const evmConnectors = useMemo(() => getSortedEvmConnectorsForModal(connectors), [connectors]);
  const phantomWallet = solanaWallets?.find((wallet) => wallet.adapter.name === 'Phantom');

  useEffect(() => {
    if (!showWalletModal) return undefined;
    const prev = document.body.style.overflow;
    prevBodyOverflowRef.current = prev;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflowRef.current ?? '';
    };
  }, [showWalletModal]);

  if (!showWalletModal) return null;

  return (
    <div className="unified-wallet-modal-overlay" onClick={handleClose}>
      <div className="unified-wallet-modal" onClick={(event) => event.stopPropagation()}>
        <div className="unified-wallet-modal-red-stripe" aria-hidden="true" />
        <button
          type="button"
          className="modal-close-btn"
          onClick={handleClose}
          aria-label={MODAL_LABELS.CLOSE_ARIA}
        >
          ×
        </button>
        <h2 className="modal-title">{MODAL_LABELS.TITLE}</h2>
        <div className="network-grid">
          <WalletModalSectionEVM
            evmConnectors={evmConnectors}
            connecting={connecting}
            onConnect={handleEvmConnect}
          />
          <WalletModalSectionSolana
            phantomWallet={phantomWallet}
            connecting={connecting}
            onConnect={handleSolanaConnect}
          />
        </div>
        {error && (
          <div className="wallet-error-box">
            {MODAL_LABELS.ERROR_PREFIX}{error}
          </div>
        )}
        {infoMessage && (
          <div className="wallet-info-popup" role="alert">
            <span className="wallet-info-popup-text">{infoMessage}</span>
            <button type="button" className="wallet-info-popup-dismiss" onClick={() => setInfoMessage(null)} aria-label="Dismiss">×</button>
          </div>
        )}
      </div>
    </div>
  );
}
