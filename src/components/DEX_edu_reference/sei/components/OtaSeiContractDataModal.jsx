/**
 * Modal: full SEI swap executor contract data after Verify.
 * @module OtaSeiContractDataModal
 */

import React, { useCallback, useState } from 'react';
import { CheckCircle, Copy, X } from 'lucide-react';

export default function OtaSeiContractDataModal({
  seiNetwork,
  contractAddress,
  contractStatus,
  verifyError,
  contractConfig,
  whitelisted,
  onClose,
}) {
  const [copySuccess, setCopySuccess] = useState(false);

  const buildCopyText = useCallback(() => {
    const lines = [
      'SEI Contract Data',
      '─────────────────',
      `Network: ${seiNetwork?.chainId ?? '—'}`,
      `Contract: ${contractAddress || '—'}`,
      `Status: ${contractStatus === 'ok' ? 'Reachable' : contractStatus === 'error' ? 'Error' : '—'}`,
    ];
    if (contractStatus === 'error' && verifyError) lines.push(`Error: ${verifyError}`);
    if (contractConfig) {
      lines.push('', 'Config (from contract):');
      lines.push(`Admin: ${contractConfig.admin ?? '—'}`);
      lines.push(`Fee: ${contractConfig.fee_percentage != null ? `${Number(contractConfig.fee_percentage) / 100}%` : '—'}`);
      lines.push(`OTA-only: ${contractConfig.ota_only_mode ? 'Yes' : 'No'}`);
      lines.push(`DEX pairs: ${contractConfig.dex_addresses?.length ? contractConfig.dex_addresses.join(', ') : 'None'}`);
      if (contractConfig.ota_only_mode) lines.push(`Whitelisted: ${whitelisted === true ? 'Yes' : whitelisted === false ? 'No' : '—'}`);
    }
    return lines.join('\n');
  }, [seiNetwork, contractAddress, contractStatus, verifyError, contractConfig, whitelisted]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildCopyText());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      setCopySuccess(false);
    }
  }, [buildCopyText]);

  return (
    <div
      className="ota-sei-micro-profit__modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verify-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => e.key === 'Escape' && (e.preventDefault(), onClose())}
    >
      <div className="ota-sei-micro-profit__modal ota-sei-micro-profit__modal--contract-data" onClick={(e) => e.stopPropagation()}>
        <div className="ota-sei-micro-profit__modal-header">
          <div>
            <h3 id="verify-modal-title">SEI contract data</h3>
            <p className="ota-sei-micro-profit__modal-subtitle">On-chain config from the swap executor contract</p>
          </div>
          <div className="ota-sei-micro-profit__modal-header-actions">
            <button
              type="button"
              onClick={handleCopy}
              className="ota-sei-micro-profit__modal-btn-copy"
              aria-label="Copy to clipboard"
              title="Copy contract data"
            >
              {copySuccess ? (
                <><CheckCircle size={16} aria-hidden /> <span>Copied</span></>
              ) : (
                <><Copy size={16} aria-hidden /> <span>Copy</span></>
              )}
            </button>
            <button type="button" onClick={onClose} className="ota-sei-micro-profit__modal-close" aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="ota-sei-micro-profit__modal-body">
          <section className="ota-sei-micro-profit__modal-section ota-sei-micro-profit__contract-data-block">
            <h4 className="ota-sei-micro-profit__modal-section-title">Network &amp; contract</h4>
            <dl className="ota-sei-micro-profit__modal-dl">
              <dt>Network (chain ID)</dt>
              <dd className="ota-sei-micro-profit__contract-data-value">{seiNetwork?.chainId ?? '—'}</dd>
              <dt>Contract address</dt>
              <dd className="ota-sei-micro-profit__modal-monospace ota-sei-micro-profit__contract-data-highlight">{contractAddress || '—'}</dd>
              <dt>Status</dt>
              <dd>
                <span className={`ota-sei-micro-profit__contract-data-badge ${contractStatus === 'ok' ? 'ota-sei-micro-profit__modal-ok' : contractStatus === 'error' ? 'ota-sei-micro-profit__modal-err' : ''}`}>
                  {contractStatus === 'ok' ? 'Reachable' : contractStatus === 'error' ? 'Error' : '—'}
                </span>
              </dd>
              {contractStatus === 'error' && verifyError && (
                <>
                  <dt>Error message</dt>
                  <dd className="ota-sei-micro-profit__modal-err">{verifyError}</dd>
                </>
              )}
            </dl>
          </section>

          {contractStatus === 'ok' && contractConfig && (
            <section className="ota-sei-micro-profit__modal-section ota-sei-micro-profit__contract-data-block">
              <h4 className="ota-sei-micro-profit__modal-section-title">Config (from contract)</h4>
              <dl className="ota-sei-micro-profit__modal-dl">
                <dt>Admin address</dt>
                <dd className="ota-sei-micro-profit__modal-monospace ota-sei-micro-profit__contract-data-highlight">{contractConfig.admin ?? '—'}</dd>
                <dt>Fee</dt>
                <dd className="ota-sei-micro-profit__contract-data-value">{contractConfig.fee_percentage != null ? `${Number(contractConfig.fee_percentage) / 100}%` : '—'}</dd>
                <dt>OTA-only mode</dt>
                <dd className="ota-sei-micro-profit__contract-data-value">{contractConfig.ota_only_mode ? 'Yes' : 'No'}</dd>
                <dt>DEX pair addresses</dt>
                <dd>
                  {contractConfig.dex_addresses?.length ? (
                    <ul className="ota-sei-micro-profit__modal-list">
                      {contractConfig.dex_addresses.map((addr, i) => (
                        <li key={i} className="ota-sei-micro-profit__modal-monospace">{addr}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="ota-sei-micro-profit__modal-muted">None (empty in contract or different field name on-chain)</span>
                  )}
                </dd>
                {contractConfig.ota_only_mode && (
                  <>
                    <dt>Your wallet whitelisted</dt>
                    <dd className="ota-sei-micro-profit__contract-data-value">{whitelisted === true ? 'Yes' : whitelisted === false ? 'No' : '—'}</dd>
                  </>
                )}
              </dl>
            </section>
          )}
        </div>
        <div className="ota-sei-micro-profit__modal-footer">
          <button type="button" onClick={onClose} className="ota-sei-micro-profit__modal-btn-close">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
