import React from 'react';
import { MODAL_LABELS } from './constants';

const walletBtnLogoStyle = { width: 22, height: 22, borderRadius: 6, objectFit: 'contain', flexShrink: 0 };

export function WalletModalSectionSolana({ phantomWallet, connecting, onConnect }) {
  if (!phantomWallet) return null;
  return (
    <div className="wallet-section wallet-section-solana">
      <h3 className="wallet-section-title">
        <span className="wallet-section-title-icon" aria-hidden="true">◎</span>
        {MODAL_LABELS.SOLANA_SECTION_TITLE}
      </h3>
      <button
        onClick={() => onConnect(phantomWallet.adapter.name)}
        disabled={connecting}
        className="wallet-option-btn"
        type="button"
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={walletBtnLogoStyle}>👻</span>
          <span>{MODAL_LABELS.PHANTOM_LABEL}</span>
        </span>
        {connecting && <span className="connecting-spinner">⏳</span>}
      </button>
    </div>
  );
}
