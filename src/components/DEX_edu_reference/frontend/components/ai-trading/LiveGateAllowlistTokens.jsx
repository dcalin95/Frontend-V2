/**
 * Bloc comun Long/Short: simboluri cu logo (TokenLogo SSOT).
 * - execution: sursă GET live-status (`liveSymbolAllowlist`) — voie de execuție live.
 * - openAiAnalysis: simboluri din scope-ul UI unde analiza OpenAI nu e suspendată pe lane-ul dat
 *   (complement față de GET …/openai-suspend?lane= — listă livrată de părinte ca `symbols`).
 */

import React from 'react';
import TokenLogo from '../common/TokenLogo';

const DEFAULT_MUTED = '#8e8e93';

export default function LiveGateAllowlistTokens({
  symbols,
  count,
  mutedColor = DEFAULT_MUTED,
  /** Ex: "LONG" | "SHORT" — separare clară în UI */
  futuresSideLabel = null,
  /**
   * execution = allowlist trade/live din backend.
   * openAiAnalysis = tokeni cu analiza OpenAI activă pe lane (părintele filtrează după suspend).
   */
  listKind = 'execution',
}) {
  const list = Array.isArray(symbols) ? symbols.filter((s) => s != null && String(s).trim() !== '') : [];
  const n = count != null ? count : list.length;
  const lane = futuresSideLabel ? String(futuresSideLabel).trim().toUpperCase() : '';
  const isOpenAi = listKind === 'openAiAnalysis';

  const headerText = isOpenAi
    ? `OpenAI analysis allowed${lane ? ` · ${lane}` : ''}`
    : `Live execution allowlist${lane ? ` · ${lane}` : ''}`;

  const emptyText = isOpenAi
    ? '— no symbols with analysis enabled (all in scope may be suspended for this lane, or set user filter)'
    : '— no symbols in live execution allowlist';

  const wrapStyle = isOpenAi
    ? {
        marginTop: 8,
        marginBottom: 8,
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid #48484a',
        background: '#0a0a0a',
      }
    : {
        marginTop: 8,
        marginBottom: 8,
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid rgba(74, 222, 128, 0.35)',
        background: 'rgba(5, 46, 22, 0.22)',
      };

  const headerColorStyle = isOpenAi
    ? {
        fontSize: 10,
        color: '#aeaeb2',
        fontWeight: 800,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 6,
      }
    : {
        fontSize: 10,
        color: '#86efac',
        fontWeight: 800,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginBottom: 6,
      };

  return (
    <div style={wrapStyle}>
      <div style={headerColorStyle}>{headerText}</div>
      {list.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px 14px',
            alignItems: 'center',
          }}
        >
          {list.map((raw) => {
            const sym = String(raw).trim().toUpperCase();
            return (
              <span
                key={sym}
                title={sym}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#e2e8f0',
                  lineHeight: 1.2,
                }}
              >
                <TokenLogo symbol={sym} size="sm" showBorder />
                <span>{sym}</span>
              </span>
            );
          })}
        </div>
      ) : (
        <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.45 }}>{emptyText}</div>
      )}
      <div style={{ fontSize: 9, color: mutedColor, marginTop: list.length > 0 ? 8 : 4 }}>
        {isOpenAi ? (
          <>
            count: {n}
            <span style={{ display: 'block', marginTop: 4, opacity: 0.95 }}>
              Scope = tracked / ops symbols in this panel; excluded if OpenAI-suspended for this lane or on active token hold/block for this side.
            </span>
          </>
        ) : (
          <>count: {n} · source: GET live-status</>
        )}
      </div>
    </div>
  );
}
