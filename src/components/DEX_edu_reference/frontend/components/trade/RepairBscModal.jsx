/**
 * Repair BSC Modal – RPC misconfigured
 *
 * Shown when swap fails with -32603 "Transaction does not have a transaction hash"
 * (wallet on BSC with bad custom RPC). Offers "Fix network" (EIP-3085/3326) or Cancel.
 *
 * @module RepairBscModal
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Wifi } from 'lucide-react';
import '../../styles/components/repair-bsc-modal.css';

const RepairBscModal = ({ isOpen, onClose, onFix }) => {
  const [fixing, setFixing] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleFix = async () => {
    if (fixing) return;
    setFixing(true);
    try {
      await onFix();
      // Parent closes modal when repair + retry flow is done (success or final error)
    } catch (err) {
      console.warn('[RepairBscModal] onFix error', err);
    } finally {
      setFixing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="repair-bsc-overlay" role="dialog" aria-modal="true" aria-labelledby="repair-bsc-title">
      <div className="repair-bsc-modal">
        <div className="repair-bsc-header">
          <h3 id="repair-bsc-title">Fix BSC network</h3>
          <button
            type="button"
            className="repair-bsc-close"
            onClick={onClose}
            ref={closeRef}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="repair-bsc-body">
          <p className="repair-bsc-message">
            The app only uses your wallet (we do not set any RPC). The network returned an error.
          </p>
          <p className="repair-bsc-message repair-bsc-infura">
            <strong>If in MetaMask you see RPC = bsc-mainnet.infura.io</strong> (not from us): MetaMask does not allow apps to change the RPC of an already added network. You can <strong>edit manually</strong>: Settings → Networks → BSC (or BNB Smart Chain) → RPC URL → replace with <code>https://bsc-dataseed1.bnbchain.org</code>; or <strong>remove the BSC network</strong> from MetaMask (Settings → Networks → Delete) and click "Fix network" below – we will add it with the official RPC.
          </p>
          <p className="repair-bsc-message">
            If the error mentions <strong>TWNodes</strong>, check the TWNodes NaaS extension (disable it) or change the BSC RPC in MetaMask to bsc-dataseed1.bnbchain.org. You can try "Fix network" below or close if you are already on the correct BSC.
          </p>
          <div className="repair-bsc-actions">
            <button
              type="button"
              className="repair-bsc-btn repair-bsc-btn-primary"
              onClick={handleFix}
              disabled={fixing}
            >
              {fixing ? (
                <>
                  <span className="repair-bsc-spinner" aria-hidden />
                  Fixing...
                </>
              ) : (
                <>
                  <Wifi size={18} />
                  Fix network
                </>
              )}
            </button>
            <button type="button" className="repair-bsc-btn repair-bsc-btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepairBscModal;
