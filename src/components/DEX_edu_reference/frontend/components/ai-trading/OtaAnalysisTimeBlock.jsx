import React from 'react';
import {
  pickAnalysisInstant,
  fmtOtaAnalysisDateTimeFullEn,
  analysisAgeAccentMs,
  formatGeneratedRelativeEn,
} from '../../utils/otaAnalysisTimestamps';

const DEFAULT_STALE_AFTER_MS = 4 * 60 * 60 * 1000;

/** Când „latest” vizibil e mai vechi decât primul rând din API (după filtre lane), explică diferența fără a da vina doar pe executor. */
export const STALE_FEED_HINT_REASON = /** @type {const} */ ({
  default: 'default',
  newerHiddenByFilters: 'newer_hidden_by_filters',
});

/**
 * 1) Absolute generation time (`created_at` / `createdAt`) — English (DEX).
 * 2) Relative “Generated … ago” — English; re-renders with `nowMs`.
 * Optional `showStaleFeedHint`: warn when newest row is older than `staleAfterMs` (default 4h).
 */
export default function OtaAnalysisTimeBlock({
  sig,
  nowMs,
  align = 'right',
  variant = 'inline',
  showStaleFeedHint = false,
  staleAfterMs = DEFAULT_STALE_AFTER_MS,
  staleFeedHintReason = STALE_FEED_HINT_REASON.default,
}) {
  const inst = pickAnalysisInstant(sig);
  const full = fmtOtaAnalysisDateTimeFullEn(inst);
  const cron = formatGeneratedRelativeEn(inst, nowMs);
  const ageMs = inst ? nowMs - inst.getTime() : NaN;
  const accent = analysisAgeAccentMs(ageMs);
  const stale =
    showStaleFeedHint &&
    Boolean(inst) &&
    Number.isFinite(ageMs) &&
    ageMs > (Number(staleAfterMs) > 0 ? Number(staleAfterMs) : DEFAULT_STALE_AFTER_MS);
  const title = inst
    ? `${full} · ${cron} · local browser timezone · source: created_at / createdAt (GET /ai-trading/signals)`
    : '';
  const hasTs = Boolean(inst);

  if (variant === 'banner') {
    return (
      <div
        title={title}
        style={{
          marginTop: 6,
          padding: '4px 8px',
          borderRadius: 6,
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
        }}
      >
        {!hasTs ? (
          <div style={{ fontSize: 10, fontWeight: 600, color: '#fb923c', lineHeight: 1.3 }}>
            Missing <code style={{ fontSize: 9 }}>created_at</code> / <code style={{ fontSize: 9 }}>createdAt</code> in
            the API response — generation time cannot be shown.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, lineHeight: 1.35 }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'baseline',
                gap: '4px 8px',
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, color: '#64748b', letterSpacing: 0.3, textTransform: 'uppercase' }}>
                Generated
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#e2e8f0',
                  letterSpacing: 0.02,
                }}
              >
                {full}
              </span>
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: accent,
                letterSpacing: 0.02,
              }}
            >
              {cron}
            </div>
            {stale ? (
              <div
                role="status"
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#fde68a',
                  lineHeight: 1.4,
                  padding: '6px 8px',
                  borderRadius: 6,
                  background: 'rgba(120, 53, 15, 0.35)',
                  border: '1px solid rgba(251, 191, 36, 0.35)',
                }}
              >
                {staleFeedHintReason === STALE_FEED_HINT_REASON.newerHiddenByFilters ? (
                  <>
                    Newer analyses already exist in <code style={{ fontSize: 9 }}>GET /ai-trading/signals</code>, but this
                    panel does not list every symbol (e.g. active <strong>Hold / token block</strong> for a symbol hides
                    its rows here). Open <strong>Debug feed</strong> to see gating. The timestamp below is the newest row{' '}
                    <em>shown</em> in this list, not necessarily the newest row in the API for all symbols.
                  </>
                ) : (
                  <>
                    Stale feed: the newest row shown here is older than expected. Confirm the executor is running and
                    check GET /ai-trading/signals for fresher rows. If you use per-symbol Hold/block, newer rows may exist
                    only for symbols not listed here.
                  </>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      title={title}
      style={{
        textAlign: align,
        minWidth: 168,
        flexShrink: 0,
      }}
    >
      {!hasTs ? (
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fb923c' }}>No created_at in API</div>
      ) : (
        <>
          <div
            style={{
              fontSize: 12,
              color: '#94a3b8',
              fontWeight: 700,
              marginBottom: 4,
              lineHeight: 1.25,
            }}
          >
            Generated
          </div>
          <div
            style={{
              fontSize: 19,
              fontWeight: 900,
              color: '#e2e8f0',
              letterSpacing: 0.2,
              lineHeight: 1.2,
              textShadow: '0 0 1px rgba(0,0,0,0.5)',
            }}
          >
            {full}
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: accent,
              marginTop: 6,
              lineHeight: 1.2,
            }}
          >
            {cron}
          </div>
        </>
      )}
    </div>
  );
}
