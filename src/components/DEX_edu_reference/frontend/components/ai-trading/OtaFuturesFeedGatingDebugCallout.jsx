import React from 'react';

/**
 * Debug vizibil: simboluri cu rânduri pe allowlist, ascunse din feed de suspend LLM sau blocare token.
 * Folosit identic în ShortOpsPanel și LongOpsPanel.
 *
 * @param {{ rows: Array<{ token: string, reasons: Array<{ code: string, text: string, blockedUntil?: string|null }> }>, variant: 'short'|'long' }} props
 */
export default function OtaFuturesFeedGatingDebugCallout({ rows, variant }) {
  if (!rows || rows.length === 0) return null;
  const lane = variant === 'short' ? 'SHORT' : 'LONG';
  const holdLabel = variant === 'short' ? 'Hold SHORT' : 'Hold LONG / token block';
  return (
    <div
      role="status"
      style={{
        marginTop: 10,
        padding: '10px 12px',
        background: 'rgba(127, 29, 29, 0.22)',
        border: '1px solid rgba(248, 113, 113, 0.42)',
        borderRadius: 8,
        fontSize: 11,
        lineHeight: 1.45,
        color: '#fecaca',
      }}
    >
      <div style={{ fontWeight: 800, color: '#fecaca', marginBottom: 4 }}>
        Debug feed — allowlist: symbols removed from list ({lane})
      </div>
      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500, marginBottom: 8 }}>
        LLM suspend from the <strong style={{ color: '#cbd5e1' }}>open positions</strong> flow (e.g. Analytics)
        stops OpenAI for the <strong style={{ color: '#cbd5e1' }}>entire {lane} lane</strong> for that
        symbol — not just an isolated card.
      </div>
      <ul style={{ margin: '0 0 8px 0', paddingLeft: 18, color: '#e5e7eb' }}>
        {rows.map((row) => (
          <li key={row.token} style={{ marginBottom: 5 }}>
            <strong style={{ fontFamily: 'ui-monospace, monospace' }}>{row.token}</strong>
            {' — '}
            {row.reasons.map((r, i) => (
              <span key={`${row.token}-${r.code}-${i}`}>
                {i > 0 ? '; ' : ''}
                <span style={{ color: '#fda4af', fontWeight: 700 }}>{r.text}</span>
                {r.blockedUntil ? (
                  <span style={{ color: '#94a3b8', fontWeight: 500 }}>
                    {' '}
                    (blocked until{' '}
                    {new Date(r.blockedUntil).toLocaleString('en-US', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                    )
                  </span>
                ) : null}
              </span>
            ))}
          </li>
        ))}
      </ul>
      <div style={{ fontSize: 10, color: '#fcd34d', fontWeight: 600 }}>
        <strong>Unblock:</strong> resume LLM for the symbol (e.g. Analytics → open positions → “Resume LLM analysis”),{' '}
        clear <strong>{holdLabel}</strong> if active — then «Refresh analyses» or Resume / Start LLM.
      </div>
    </div>
  );
}
