import React from 'react';
import { getWalletIcon } from './evmConnectorsForModal';
import { getWalletLogoSrc } from './walletLogos';
import { MODAL_LABELS } from './constants';

const logoStyle = { width: 22, height: 22, borderRadius: 6, objectFit: 'contain', flexShrink: 0 };

export function WalletModalSectionEVM({ evmConnectors, connecting, onConnect }) {
  return (
    <div className="wallet-section">
      <h3 className="wallet-section-title">
        <span className="wallet-section-title-icon" aria-hidden="true">◆</span>
        {MODAL_LABELS.EVM_SECTION_TITLE}
      </h3>
      <div className="wallet-section-evm-buttons">
        {evmConnectors.map((item) => {
          const connector = item.connector ?? item;
          const rawName = item.displayName ?? connector?.name ?? '';
          const isInjected = String(rawName).toLowerCase().trim() === 'injected';
          const displayName = isInjected ? MODAL_LABELS.INJECTED_TITLE : rawName;
          const normalizedDisplay = String(displayName || '').toLowerCase();
          const preferredProvider =
            item.preferredProvider ||
            (displayName === 'MetaMask'
              ? 'metamask'
              : normalizedDisplay.startsWith('trust wallet')
                ? 'trust'
                : displayName === 'Coinbase Wallet'
                  ? 'coinbase'
                  : displayName === 'Binance Web3 Wallet'
                    ? 'binance'
                    : null);
          const logoSrc = getWalletLogoSrc(rawName);
          return (
            <button
              key={connector.uid || `${connector.id}-${rawName}`}
              onClick={() => onConnect(connector, preferredProvider)}
              disabled={connecting}
              className="wallet-option-btn"
              type="button"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {logoSrc ? (
                  <img src={logoSrc} alt={displayName} style={logoStyle} />
                ) : (
                  <span style={{ fontSize: '1.15rem' }}>{getWalletIcon(rawName)}</span>
                )}
                <span>
                  {displayName}
                  {isInjected && <span className="wallet-option-annotation"> {MODAL_LABELS.INJECTED_ANNOTATION}</span>}
                </span>
              </span>
              {connecting && <span className="connecting-spinner">⏳</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
