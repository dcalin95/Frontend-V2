/**
 * Auxiliary SEI/ATOM pool vs CEX discrepancy display (not selected pair truth).
 */

import React from 'react';

export default function SeiAuxiliarySignalStatus({
  priceDiscrepancy,
  priceDiscrepancyLoading,
  poolHealth,
  poolHealthLoading,
  showPoolChips = false,
  onRecheckPools,
}) {
  return (
    <div className="ota-sei-micro-profit__signal-block" style={{ marginTop: 8 }}>
      {showPoolChips && (
        <div style={{ margin: '6px 0 8px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ color: '#94a3b8', fontWeight: 600, letterSpacing: '0.03em' }}>Monitored pools (orientativ):</span>
            {poolHealthLoading && <span style={{ color: '#94a3b8' }}>⏳ Checking…</span>}
            {typeof onRecheckPools === 'function' && (
              <button
                type="button"
                onClick={onRecheckPools}
                disabled={poolHealthLoading}
                style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '6px', border: '1px solid var(--ds-border-color)', background: 'transparent', color: 'inherit', cursor: 'pointer', marginLeft: 'auto' }}
              >
                ↺
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {poolHealth?.pools?.length > 0 ? poolHealth.pools.map((pool) => (
              <span
                key={pool.id}
                title={
                  pool.ok
                    ? `✅ TRADEABLE — Spread: ${pool.spreadPct?.toFixed(2)}% ≤ ${pool.tightSpreadPct}% (bot will trade)`
                    : pool.healthy
                      ? `⚠️ Pool healthy but spread ${pool.spreadPct?.toFixed(2)}% > ${pool.tightSpreadPct}% — bot WAITS for tighter spread`
                      : `⛔ Imbalanced — spread ${pool.spreadPct?.toFixed(2)}% > max ${pool.maxSpreadPct}%`
                }
                style={{
                  padding: '2px 10px',
                  borderRadius: '20px',
                  fontWeight: 600,
                  background: pool.ok
                    ? 'rgba(74,222,128,0.12)'
                    : pool.healthy
                      ? 'rgba(251,191,36,0.12)'
                      : 'rgba(239,68,68,0.12)',
                  color: pool.ok ? '#4ade80' : pool.healthy ? '#fbbf24' : '#f87171',
                  border: `1px solid ${pool.ok ? 'rgba(74,222,128,0.3)' : pool.healthy ? 'rgba(251,191,36,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  cursor: 'help',
                }}
              >
                {pool.ok
                  ? `✅ ${pool.label} (${pool.spreadPct?.toFixed(1)}%)`
                  : pool.healthy
                    ? `⚠️ ${pool.label} (${pool.spreadPct?.toFixed(1)}%) — waiting`
                    : `⛔ ${pool.label}${pool.spreadPct != null ? ` (${pool.spreadPct?.toFixed(1)}%)` : ''}`}
              </span>
            )) : !poolHealthLoading && (
              <span style={{ color: '#94a3b8' }}>—</span>
            )}
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 6, lineHeight: 1.4 }} role="note">
            Simulare on-chain (spread) + praguri bot — orientativ, nu garanție de execuție sau „adevăr” pentru toate perechile.
          </div>
        </div>
      )}
      {!showPoolChips && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>Pool health</span>
        {poolHealthLoading && <span style={{ color: '#94a3b8', fontSize: 11 }}>⏳</span>}
        {!poolHealthLoading && poolHealth && (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 99,
              fontWeight: 700,
              fontSize: 11,
              background: poolHealth.ok ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.12)',
              color: poolHealth.ok ? '#4ade80' : '#f87171',
              border: `1px solid ${poolHealth.ok ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.25)'}`,
            }}
          >
            {poolHealth.ok ? '🟢 Tradeable' : '🔴 Tight spread'}
          </span>
        )}
      </div>
      )}
      {!showPoolChips && poolHealth?.pools?.length > 0 && (
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
          {poolHealth.pools.map((p) => (
            <div key={p.id}>
              {p.label}: spread {p.spreadPct != null ? `${p.spreadPct.toFixed(3)}%` : '—'} {p.ok ? '✓' : p.reason ? `(${p.reason})` : ''}
            </div>
          ))}
        </div>
      )}

      {(() => {
        const discrepancyBody = (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', ...(showPoolChips ? { justifyContent: 'space-between', marginBottom: 6 } : {}) }}>
              <span style={{ fontWeight: showPoolChips ? 700 : 600, color: showPoolChips ? '#94a3b8' : '#e2e8f0', letterSpacing: showPoolChips ? '0.03em' : undefined }}>
                {showPoolChips ? '📊 Market Price vs Pool (orientativ)' : 'Price check (aux)'}
                {showPoolChips && priceDiscrepancy?.source && (
                  <span style={{ fontSize: 10, fontWeight: 400, color: '#475569', marginLeft: 5 }}>
                    via {priceDiscrepancy.source}
                  </span>
                )}
              </span>
              {priceDiscrepancyLoading && <span style={{ color: '#94a3b8', fontSize: 11 }}>⏳</span>}
              {!priceDiscrepancyLoading && priceDiscrepancy && (
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 99,
                    fontWeight: 700,
                    fontSize: 11,
                    background: priceDiscrepancy.priceError ? 'rgba(234,179,8,0.12)'
                      : priceDiscrepancy.hasOpportunity ? 'rgba(74,222,128,0.15)' : 'rgba(148,163,184,0.1)',
                    color: priceDiscrepancy.priceError ? '#eab308'
                      : priceDiscrepancy.hasOpportunity ? '#4ade80' : '#64748b',
                    border: `1px solid ${priceDiscrepancy.priceError ? 'rgba(234,179,8,0.3)'
                      : priceDiscrepancy.hasOpportunity ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  {priceDiscrepancy.priceError ? '⚠️ Price error' : priceDiscrepancy.hasOpportunity ? '🟢 OPPORTUNITY' : '⚪ No opportunity'}
                </span>
              )}
            </div>
            {priceDiscrepancy && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', marginTop: showPoolChips ? 0 : 6 }}>
                <div style={{ color: '#94a3b8' }}>Binance SEI:</div>
                <div style={{ fontWeight: 600, color: '#e2e8f0' }}>${priceDiscrepancy.binanceSeiUsd?.toFixed(5) || '—'}</div>
                <div style={{ color: '#94a3b8' }}>Pool SEI (implied):</div>
                <div style={{ fontWeight: 600, color: '#e2e8f0' }}>${priceDiscrepancy.poolSeiUsd?.toFixed(5) || '—'}</div>
                <div style={{ color: '#94a3b8' }}>Discrepancy:</div>
                <div style={{ fontWeight: 700, color: Math.abs(priceDiscrepancy.discrepancyPct) >= 2 ? '#4ade80' : '#64748b' }}>
                  {priceDiscrepancy.discrepancyPct != null ? `${priceDiscrepancy.discrepancyPct > 0 ? '+' : ''}${priceDiscrepancy.discrepancyPct.toFixed(2)}%` : '—'}
                </div>
                <div style={{ color: '#94a3b8' }}>Threshold:</div>
                <div style={{ color: '#64748b' }}>≥ 2.0% to trigger</div>
              </div>
            )}
            {priceDiscrepancy && !priceDiscrepancy.hasOpportunity && !priceDiscrepancy.priceError && (
              <div style={{ marginTop: 6, fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
                {priceDiscrepancy.discrepancyPct > 0
                  ? '⬆ Pool has depleted ATOM — bot needs ATOM to exploit. No action.'
                  : '⬇ Bot opportunity: pool SEI is overpriced → can sell SEI profitably.'}
              </div>
            )}
            {priceDiscrepancy?.hasOpportunity && (
              <div style={{ marginTop: 6, fontSize: 11, color: '#4ade80', fontWeight: 600 }}>
                ✅ {priceDiscrepancy.reason}
              </div>
            )}
            {!priceDiscrepancy && !priceDiscrepancyLoading && (
              <div style={{ color: '#64748b' }}>Loading prices…</div>
            )}
          </>
        );
        if (showPoolChips) {
          return (
            <div style={{ margin: '8px 0 10px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${priceDiscrepancy?.hasOpportunity ? 'rgba(74,222,128,0.35)' : 'rgba(255,255,255,0.08)'}`, fontSize: '12px' }}>
              {discrepancyBody}
            </div>
          );
        }
        return discrepancyBody;
      })()}
    </div>
  );
}
