/**
 * RpcRepairModal – BSC RPC misconfigured (Invalid RPC URL in wallet).
 * Shown when wallet cannot broadcast (e.g. TWNodes / invalid BSC RPC).
 * Offers: Fix automatically, Copy recommended RPC, Re-test, Cancel.
 * @module RpcRepairModal
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Wifi, Copy, RefreshCw } from 'lucide-react';
import { repairBscNetwork, BSC_RPC_RECOMMENDED } from '../../services/repairBscNetwork';
import { rpcHealthCheck } from '../../services/rpcHealthCheck';
import { getInjectedProvider } from '../../services/injectedProvider';
import '../../styles/components/rpc-repair-modal.css';

const RpcRepairModal = ({ isOpen, onClose, onFixed }) => {
  const [fixing, setFixing] = useState(false);
  const [retesting, setRetesting] = useState(false);
  const [copied, setCopied] = useState(false);
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
      const provider = getInjectedProvider();
      if (!provider) {
        console.warn('[RpcRepairModal] No provider');
        setFixing(false);
        return;
      }
      const repaired = await repairBscNetwork(provider);
      if (repaired && onFixed) onFixed();
    } catch (err) {
      console.warn('[RpcRepairModal] repair error', err);
    } finally {
      setFixing(false);
    }
  };

  const handleCopyRpc = async () => {
    try {
      await navigator.clipboard.writeText(BSC_RPC_RECOMMENDED);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {
      const input = document.createElement('input');
      input.value = BSC_RPC_RECOMMENDED;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleRetest = async () => {
    if (retesting) return;
    setRetesting(true);
    try {
      const provider = getInjectedProvider();
      if (!provider) {
        setRetesting(false);
        return;
      }
      const result = await rpcHealthCheck(provider);
      if (result.ok) {
        if (onFixed) onFixed();
        onClose();
      }
    } catch (_) {
      // still broken
    } finally {
      setRetesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="rpc-repair-overlay" role="dialog" aria-modal="true" aria-labelledby="rpc-repair-title">
      <div className="rpc-repair-modal">
        <div className="rpc-repair-header">
          <h3 id="rpc-repair-title">BSC RPC misconfigured</h3>
          <button type="button" className="rpc-repair-close" onClick={onClose} ref={closeRef} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="rpc-repair-body">
          <p className="rpc-repair-message">
            Your wallet is using an invalid BSC RPC URL and cannot send transactions.
          </p>
          <p className="rpc-repair-manual">
            Open wallet → Settings → Networks → BNB Smart Chain → RPC URL → select another or add:
          </p>
          <code className="rpc-repair-url">{BSC_RPC_RECOMMENDED}</code>
          <div className="rpc-repair-actions">
            <button
              type="button"
              className="rpc-repair-btn rpc-repair-btn-primary"
              onClick={handleFix}
              disabled={fixing}
            >
              {fixing ? (
                <>
                  <span className="rpc-repair-spinner" aria-hidden />
                  Fixing...
                </>
              ) : (
                <>
                  <Wifi size={18} />
                  Fix automatically
                </>
              )}
            </button>
            <button
              type="button"
              className="rpc-repair-btn rpc-repair-btn-secondary"
              onClick={handleCopyRpc}
            >
              <Copy size={16} />
              {copied ? ' Copied!' : ' Copy recommended RPC'}
            </button>
            <button
              type="button"
              className="rpc-repair-btn rpc-repair-btn-secondary"
              onClick={handleRetest}
              disabled={retesting}
            >
              {retesting ? (
                <>
                  <span className="rpc-repair-spinner" aria-hidden />
                  Re-testing...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Re-test
                </>
              )}
            </button>
            <button type="button" className="rpc-repair-btn rpc-repair-btn-ghost" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RpcRepairModal;
