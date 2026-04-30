/**
 * Run round-trip result / waiting state (manual test on SEI).
 * @module OtaSeiRoundTripResultModal
 */

import React from 'react';
import { ExternalLink, X } from 'lucide-react';

export default function OtaSeiRoundTripResultModal({
  onClose,
  roundTripResult,
  base,
  quote,
  effectivePair,
  livePrice,
  livePriceError,
  txUrl,
  otaAiMessage,
  /** When false, OTA AI ack line is not shown (matches split-layout modal that sat on top in DOM). */
  includeOtaAiBlock = true,
}) {
  return (
    <div
      className="ota-sei-micro-profit__modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="round-trip-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => e.key === 'Escape' && (e.preventDefault(), onClose())}
    >
      <div className="ota-sei-micro-profit__modal ota-sei-micro-profit__modal--round-trip" onClick={(e) => e.stopPropagation()}>
        <div className="ota-sei-micro-profit__modal-header">
          <div>
            <h3 id="round-trip-modal-title">Run round-trip – Result</h3>
            <p className="ota-sei-micro-profit__modal-subtitle">Your transaction on SEI Mainnet</p>
          </div>
          <button type="button" onClick={onClose} className="ota-sei-micro-profit__modal-close" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="ota-sei-micro-profit__modal-body">
          {roundTripResult ? (
            <>
              <section className="ota-sei-micro-profit__modal-section ota-sei-micro-profit__round-trip-summary">
                <h4 className="ota-sei-micro-profit__modal-section-title">Result</h4>
                <div className={`ota-sei-micro-profit__round-trip-result ota-sei-micro-profit__round-trip-result--${roundTripResult.success ? 'success' : 'error'}`}>
                  {roundTripResult.success ? (
                    <>
                      <span className="ota-sei-micro-profit__round-trip-result-label">Transaction successful</span>
                      {roundTripResult.txHash && (
                        <a href={txUrl(roundTripResult.txHash)} target="_blank" rel="noopener noreferrer" className="ota-sei-micro-profit__result-link" title="View in explorer">
                          {roundTripResult.txHash.slice(0, 12)}…{roundTripResult.txHash.slice(-6)}
                          <ExternalLink size={14} aria-hidden />
                        </a>
                      )}
                    </>
                  ) : (
                    <span className="ota-sei-micro-profit__round-trip-result-error">{roundTripResult.error || 'Unknown error'}</span>
                  )}
                </div>
              </section>
              {roundTripResult.success && (
                <>
                  <section className="ota-sei-micro-profit__modal-section ota-sei-micro-profit__contract-data-block">
                    <h4 className="ota-sei-micro-profit__modal-section-title">What happened</h4>
                    <p className="ota-sei-micro-profit__round-trip-explain">
                      You ran a round-trip: <strong>{base} → {quote} → {base}</strong>. The transaction is confirmed on-chain. The swap contract exchanged tokens using your wallet.
                    </p>
                  </section>
                  <section className="ota-sei-micro-profit__modal-section ota-sei-micro-profit__contract-data-block">
                    <h4 className="ota-sei-micro-profit__modal-section-title">Next step</h4>
                    <p className="ota-sei-micro-profit__round-trip-next">
                      Click <strong>Close</strong> below, then <strong>Refresh</strong> in OTA AI Micro-Trade. You will see the execution in <strong>SEI execution history</strong> and any profit.
                    </p>
                  </section>
                </>
              )}
              {includeOtaAiBlock && otaAiMessage ? (
                <section className="ota-sei-micro-profit__modal-section">
                  <h4 className="ota-sei-micro-profit__modal-section-title">OTA AI</h4>
                  <div className="ota-sei-micro-profit__ota-ai-block">
                    <p className="ota-sei-micro-profit__ota-ai-message">{otaAiMessage}</p>
                  </div>
                </section>
              ) : null}
            </>
          ) : (
            <>
              <section className="ota-sei-micro-profit__modal-section ota-sei-micro-profit__live-block">
                <h4 className="ota-sei-micro-profit__modal-section-title">Pair: {effectivePair}</h4>
                <div className="ota-sei-micro-profit__live-block-inner">
                  {livePrice != null ? (
                    <span className="ota-sei-micro-profit__live-block-price">${Number(livePrice).toFixed(4)}</span>
                  ) : livePriceError ? (
                    <span className="ota-sei-micro-profit__live-price-err">{livePriceError}</span>
                  ) : (
                    <span className="ota-sei-micro-profit__live-price-loading">Loading…</span>
                  )}
                </div>
              </section>
              <p className="ota-sei-micro-profit__signal-explainer">
                Running a round-trip on SEI Mainnet: {base} → {quote} → {base}. Sign in your wallet. After confirmation you will see the result here.
              </p>
              <p className="ota-sei-micro-profit__signal-status">Waiting for transaction confirmation…</p>
            </>
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
