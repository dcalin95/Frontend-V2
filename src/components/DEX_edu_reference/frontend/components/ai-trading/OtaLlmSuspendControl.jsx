/**
 * Suspends / reactivates LLM analysis for (wallet, token) on the SHORT or LONG lane (separate API).
 * @module OtaLlmSuspendControl
 */

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { postOtaPositionOpenAiSuspend, deleteOtaPositionOpenAiSuspend } from '../../services/aiTradingApiService';

export default function OtaLlmSuspendControl({
  walletAddress,
  token,
  suspended,
  onChanged,
  compact = true,
  /** @type {'short'|'long'} Required: do not mix panels. */
  suspendLane,
}) {
  const [busy, setBusy] = useState(false);
  const w = (walletAddress || '').toString().trim().toLowerCase();
  const tok = (token || '').toString().trim().toUpperCase();
  const lane = suspendLane === 'long' ? 'long' : suspendLane === 'short' ? 'short' : '';
  if (!w || !tok || !lane) return null;

  const runToggle = async () => {
    const currently = suspended === true;
    const laneLabel = lane === 'short' ? 'SHORT (Binance futures)' : 'LONG / vault';
    const msg = currently
      ? `Reactivate OpenAI/LLM analysis for ${tok} on ${laneLabel}?`
      : `Suspend OpenAI/LLM analysis for ${tok} on ${laneLabel}? The other panel is not affected.`;
    if (!window.confirm(msg)) return;
    setBusy(true);
    try {
      if (currently) {
        await deleteOtaPositionOpenAiSuspend(w, tok, { lane });
        toast.success(`LLM analysis reactivated (${lane}).`);
      } else {
        await postOtaPositionOpenAiSuspend(w, tok, { lane });
        toast.success(`LLM analysis suspended (${lane}).`);
      }
      onChanged?.();
    } catch (e) {
      toast.error(e?.message || 'LLM suspend/reactivate error');
    } finally {
      setBusy(false);
    }
  };

  const styleBtn = {
    padding: compact ? '4px 8px' : '6px 12px',
    fontSize: compact ? 10 : 12,
    fontWeight: 700,
    borderRadius: 5,
    border: `1px solid ${suspended ? '#166534' : '#713f12'}`,
    cursor: busy ? 'wait' : 'pointer',
    whiteSpace: 'nowrap',
    background: suspended ? '#14532d' : '#422006',
    color: suspended ? '#bbf7d0' : '#fde68a',
    opacity: busy ? 0.7 : 1,
  };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={runToggle}
      style={styleBtn}
      title={
        suspended
          ? `Reactivate LLM (${lane})`
          : `Suspend LLM only for ${lane === 'short' ? 'SHORT' : 'LONG'}, not for ${lane === 'short' ? 'LONG' : 'SHORT'}.`
      }
    >
      {busy ? '…' : suspended ? '▶ Resume LLM' : '⏸ Suspend LLM'}
    </button>
  );
}
