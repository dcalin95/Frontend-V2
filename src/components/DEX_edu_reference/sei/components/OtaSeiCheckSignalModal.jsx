/**
 * Modal: micro-profit signal check — logic, edge bps, copy.
 */

import React, { useCallback, useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

export default function OtaSeiCheckSignalModal({ loading, signal, onClose }) {
  const [copySuccess, setCopySuccess] = useState(false);

  const buildCopyText = useCallback(() => {
    const lines = [
      'Check Signal – SEI micro-profit (auxiliary SEI/ATOM pool vs CEX)',
      'Stale CEX/pool bundle (> max age) = hard block (no trigger). Fresh bundle: net edge = gross − DEX fee − slippage − gas.',
      '─────────────────────────────────',
    ];
    if (signal) {
      if (signal.edgeNetBps != null) {
        lines.push(`edgeNetBps: ${signal.edgeNetBps}`);
        if (signal.edgeBreakdown) {
          const b = signal.edgeBreakdown;
          lines.push(`  gross ${b.expectedGrossBps} − fee ${b.dexFeeBps} − slip ${b.slippageGuardBps} − gas ${b.gasCostBps?.toFixed?.(0) ?? b.gasCostBps} (stale = hard block, not in bps)`);
        }
        lines.push('');
      }
      if (signal.spreadPct != null || signal.notionalUsd != null) {
        lines.push('Inputs:');
        if (signal.spreadPct != null) lines.push(`  Spread: ${signal.spreadPct}%`);
        if (signal.notionalUsd != null) lines.push(`  Notional: $${signal.notionalUsd}`);
        if (signal.side) lines.push(`  Side: ${signal.side}`);
        lines.push('');
      }
      if (signal.gasRoundTripUsd != null || signal.minProfit != null || signal.estimatedProfit != null) {
        lines.push('Computation:');
        if (signal.gasRoundTripUsd != null) lines.push(`  Gas: $${signal.gasRoundTripUsd.toFixed(6)}`);
        if (signal.minProfit != null) lines.push(`  Min profit: $${signal.minProfit.toFixed(6)}`);
        if (signal.estimatedProfit != null) lines.push(`  Estimated profit: $${signal.estimatedProfit.toFixed(6)}`);
        lines.push('');
      }
      lines.push(`Result: ${signal.trigger ? 'Signal' : 'No trigger'} ${signal.side || ''} – ${signal.reason || ''}`);
    } else {
      lines.push('Run the check to see inputs, computation and result.');
    }
    return lines.join('\n');
  }, [signal]);

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
      aria-labelledby="signal-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => e.key === 'Escape' && (e.preventDefault(), onClose())}
    >
      <div className="ota-sei-micro-profit__modal ota-sei-micro-profit__modal--signal" onClick={(e) => e.stopPropagation()}>
        <div className="ota-sei-micro-profit__modal-header">
          <div>
            <h3 id="signal-modal-title">Check signal</h3>
            <p className="ota-sei-micro-profit__modal-subtitle">Auxiliary SEI/ATOM pool vs CEX — not your selected pair&apos;s fill price</p>
          </div>
          <div className="ota-sei-micro-profit__modal-header-actions">
            {signal && (
              <button type="button" onClick={handleCopy} className="ota-sei-micro-profit__modal-btn-copy" aria-label="Copy" title="Copy result">
                {copySuccess ? <><Check size={16} /><span>Copied</span></> : <><Copy size={16} /><span>Copy</span></>}
              </button>
            )}
            <button type="button" onClick={onClose} className="ota-sei-micro-profit__modal-close" aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="ota-sei-micro-profit__modal-body">
          <section className="ota-sei-micro-profit__modal-section ota-sei-micro-profit__contract-data-block">
            <p className="ota-sei-micro-profit__signal-explainer">
              <strong>Stale</strong> market bundle (CEX + pool snapshot over max age) → <strong>hard block</strong>, no net-edge math.
              When fresh: trigger needs <strong>net edge ≥ min bps</strong> after fee, slippage, gas. Auxiliary signal is not your selected pair&apos;s execution quote.
            </p>
          </section>

          {loading && (
            <section className="ota-sei-micro-profit__modal-section">
              <p className="ota-sei-micro-profit__signal-status">Checking…</p>
            </section>
          )}

          {!loading && signal && (
            <>
              {(signal.blockReason != null || signal.isStale != null || signal.isTradable != null) && (
                <section className="ota-sei-micro-profit__modal-section ota-sei-micro-profit__contract-data-block">
                  <h4 className="ota-sei-micro-profit__modal-section-title">Signal gate</h4>
                  <dl className="ota-sei-micro-profit__modal-dl ota-sei-micro-profit__modal-dl--compact">
                    <dt>Tradable</dt>
                    <dd className="ota-sei-micro-profit__contract-data-value">{signal.isTradable === true ? 'Yes' : signal.isTradable === false ? 'No' : '—'}</dd>
                    <dt>Stale bundle</dt>
                    <dd className="ota-sei-micro-profit__contract-data-value">{signal.isStale === true ? 'Yes (blocked)' : signal.isStale === false ? 'No' : '—'}</dd>
                    {signal.marketBundleAgeMs != null && (
                      <>
                        <dt>Bundle age</dt>
                        <dd className="ota-sei-micro-profit__contract-data-value">{Math.round(signal.marketBundleAgeMs / 1000)}s</dd>
                      </>
                    )}
                    <dt>Block reason</dt>
                    <dd className="ota-sei-micro-profit__contract-data-value">{signal.blockReason ?? '—'}</dd>
                  </dl>
                </section>
              )}
              {signal.edgeNetBps != null && (
                <section className="ota-sei-micro-profit__modal-section ota-sei-micro-profit__contract-data-block">
                  <h4 className="ota-sei-micro-profit__modal-section-title">Net edge (bps)</h4>
                  <dl className="ota-sei-micro-profit__modal-dl ota-sei-micro-profit__modal-dl--compact">
                    <dt>edgeNetBps</dt>
                    <dd className="ota-sei-micro-profit__contract-data-value">{Number(signal.edgeNetBps).toFixed(0)}</dd>
                    {signal.edgeBreakdown && (
                      <>
                        <dt>Breakdown</dt>
                        <dd className="ota-sei-micro-profit__contract-data-value" style={{ fontSize: 12 }}>
                          gross {signal.edgeBreakdown.expectedGrossBps} − fee {signal.edgeBreakdown.dexFeeBps} − slip {signal.edgeBreakdown.slippageGuardBps}
                          − gas {typeof signal.edgeBreakdown.gasCostBps === 'number' ? signal.edgeBreakdown.gasCostBps.toFixed(0) : signal.edgeBreakdown.gasCostBps}
                          (stale blocked upstream)
                        </dd>
                      </>
                    )}
                  </dl>
                </section>
              )}
              {(signal.spreadPct != null || signal.notionalUsd != null) && (
                <section className="ota-sei-micro-profit__modal-section ota-sei-micro-profit__contract-data-block">
                  <h4 className="ota-sei-micro-profit__modal-section-title">Inputs used</h4>
                  <dl className="ota-sei-micro-profit__modal-dl ota-sei-micro-profit__modal-dl--compact">
                    <dt>Spread (%)</dt>
                    <dd className="ota-sei-micro-profit__contract-data-value">{signal.spreadPct != null ? `${Number(signal.spreadPct)}%` : '—'}</dd>
                    <dt>Notional (USD)</dt>
                    <dd className="ota-sei-micro-profit__contract-data-value">{signal.notionalUsd != null ? `$${Number(signal.notionalUsd).toFixed(2)}` : '—'}</dd>
                    <dt>Side</dt>
                    <dd className="ota-sei-micro-profit__contract-data-value">{signal.side ?? '—'}</dd>
                  </dl>
                </section>
              )}

              {(signal.gasRoundTripUsd != null || signal.minProfit != null || signal.estimatedProfit != null) && (
                <section className="ota-sei-micro-profit__modal-section ota-sei-micro-profit__contract-data-block">
                  <h4 className="ota-sei-micro-profit__modal-section-title">Computation</h4>
                  <dl className="ota-sei-micro-profit__modal-dl ota-sei-micro-profit__modal-dl--compact">
                    <dt>Gas (round-trip, USD)</dt>
                    <dd className="ota-sei-micro-profit__contract-data-value">${signal.gasRoundTripUsd != null ? signal.gasRoundTripUsd.toFixed(6) : '—'}</dd>
                    <dt>Min profit (USD)</dt>
                    <dd className="ota-sei-micro-profit__contract-data-highlight">${signal.minProfit != null ? signal.minProfit.toFixed(6) : '—'}</dd>
                    <dt>Estimated profit (USD)</dt>
                    <dd className="ota-sei-micro-profit__contract-data-highlight">
                      {signal.estimatedProfit != null ? `$${signal.estimatedProfit.toFixed(6)}` : '—'}
                    </dd>
                  </dl>
                </section>
              )}

              <section className="ota-sei-micro-profit__modal-section ota-sei-micro-profit__contract-data-block">
                <h4 className="ota-sei-micro-profit__modal-section-title">Result</h4>
                <div className={`ota-sei-micro-profit__signal-result ota-sei-micro-profit__signal-result--${signal.trigger ? 'trigger' : 'no-trigger'}`}>
                  <span className="ota-sei-micro-profit__signal-result-label">{signal.trigger ? 'Signal' : 'No trigger'}</span>
                  {signal.trigger && signal.side && <span className="ota-sei-micro-profit__signal-result-side">{signal.side}</span>}
                  <span className="ota-sei-micro-profit__signal-result-reason">{signal.reason}</span>
                </div>
              </section>
            </>
          )}

          {!loading && !signal && (
            <section className="ota-sei-micro-profit__modal-section">
              <p className="ota-sei-micro-profit__signal-status">Run the check to see inputs, computation and result.</p>
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
