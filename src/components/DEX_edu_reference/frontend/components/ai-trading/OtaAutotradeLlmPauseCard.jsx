/**
 * Cost control for OTA Autotrade: pause / resume OpenAI and Claude per wallet, using the same API as Futures.
 * `variant="inline"` sits next to Stop/Start; `variant="card"` is a separate legacy section.
 * @module OtaAutotradeLlmPauseCard
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { RefreshCw } from 'lucide-react';
import { AutotradeIconLlmPause, AutotradeIconLlmResume } from './AutoTradeAnimatedIcons';
import { API_ENDPOINTS } from '../../../config/apiEndpoints.js';
import { otaApiRequest } from '../../utils/otaApiClient';
import { OTA_LLM_BILLING_REFRESH, dispatchOtaLlmBillingRefresh } from '../../utils/otaLlmBillingRefresh';

export default function OtaAutotradeLlmPauseCard({ walletAddress, variant = 'card' }) {
  const w = String(walletAddress || '').trim().toLowerCase();
  const [billing, setBilling] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(null);

  const load = useCallback(async () => {
    if (!w) {
      setBilling(null);
      setStatus('idle');
      return;
    }
    setStatus('loading');
    setError(null);
    try {
      const qs = new URLSearchParams({ userId: w });
      const data = await otaApiRequest(`${API_ENDPOINTS.OTA_LLM_BILLING_STATUS}?${qs.toString()}`, {
        method: 'GET',
      });
      if (data.success === false || !data.billing) {
        setBilling(null);
        setError(data.error || 'billing unavailable');
        setStatus('err');
        return;
      }
      setBilling(data.billing);
      setStatus('ok');
    } catch (e) {
      const msg =
        (typeof e?.responseBody?.error === 'string' && e.responseBody.error) ||
        e?.message ||
        'fetch';
      setBilling(null);
      setError(msg);
      setStatus('err');
    }
  }, [w]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onRefresh = () => void load();
    if (typeof window === 'undefined') return undefined;
    window.addEventListener(OTA_LLM_BILLING_REFRESH, onRefresh);
    return () => window.removeEventListener(OTA_LLM_BILLING_REFRESH, onRefresh);
  }, [load]);

  const togglePause = async (provider, paused) => {
    if (!w) {
      toast.info('Connect your wallet.', { autoClose: 4000 });
      return;
    }
    setPending(provider);
    try {
      const data = await otaApiRequest(API_ENDPOINTS.OTA_LLM_BILLING_PROVIDER_CONTROL, {
        method: 'POST',
        body: JSON.stringify({
          userId: w,
          provider,
          paused,
          reason: paused ? 'user_paused_autotrade_ui' : null,
        }),
      });
      if (data.success === false || !data.billing) {
        throw new Error(data.error || 'Provider control failed');
      }
      setBilling(data.billing);
      dispatchOtaLlmBillingRefresh();
      toast.success(
        paused
          ? `${provider === 'openai' ? 'OpenAI' : 'Claude'} suspended - no MetaMask signature.`
          : `${provider === 'openai' ? 'OpenAI' : 'Claude'} reactivated.`,
        { autoClose: 4500 },
      );
    } catch (e) {
      toast.warning(e?.message || 'Provider control error', { autoClose: 7000 });
    } finally {
      setPending(null);
    }
  };

  if (!w) return null;

  const openAiPaused = billing?.providerAvailability?.openai?.pausedByUser === true;
  const anthropicPaused = billing?.providerAvailability?.anthropic?.pausedByUser === true;
  const creditBlocked = billing?.creditBlocked === true;

  const inlineHint =
    'Temporarily suspend paid analyses without stopping the on-chain bot. The server OpenAI Agent stops when OpenAI is paused.';

  if (variant === 'inline') {
    return (
        <div className="auto-trade-panel-llm-inline" role="group" aria-label="Autotrade LLM cost">
        <div className="auto-trade-panel-llm-inline__row">
          <button
            type="button"
            className={`auto-trade-panel-llm-inline__btn ${
              openAiPaused
                ? 'auto-trade-panel-llm-inline__btn--resume-openai'
                : 'auto-trade-panel-llm-inline__btn--suspend-openai'
            }`}
            disabled={pending === 'openai' || status === 'loading'}
            onClick={() => togglePause('openai', !openAiPaused)}
            title={inlineHint}
          >
            {openAiPaused ? (
              <AutotradeIconLlmResume accent="openai" size={20} />
            ) : (
              <AutotradeIconLlmPause accent="openai" size={20} />
            )}
            <span>{pending === 'openai' ? '...' : openAiPaused ? 'Resume OpenAI' : 'Suspend OpenAI'}</span>
          </button>
          <button
            type="button"
            className={`auto-trade-panel-llm-inline__btn ${
              anthropicPaused
                ? 'auto-trade-panel-llm-inline__btn--resume-claude'
                : 'auto-trade-panel-llm-inline__btn--suspend-claude'
            }`}
            disabled={pending === 'anthropic' || status === 'loading'}
            onClick={() => togglePause('anthropic', !anthropicPaused)}
            title={inlineHint}
          >
            {anthropicPaused ? (
              <AutotradeIconLlmResume accent="anthropic" size={20} />
            ) : (
              <AutotradeIconLlmPause accent="anthropic" size={20} />
            )}
            <span>{pending === 'anthropic' ? '...' : anthropicPaused ? 'Resume Claude' : 'Suspend Claude'}</span>
          </button>
          <button
            type="button"
            className="auto-trade-panel-llm-inline__refresh"
            onClick={() => void load()}
            disabled={status === 'loading'}
            title="Reload LLM billing status"
            aria-label="Reload LLM billing status"
          >
            <RefreshCw size={18} style={{ opacity: status === 'loading' ? 0.5 : 1 }} aria-hidden />
          </button>
        </div>
        {(error && status === 'err') || (creditBlocked && status === 'ok') ? (
          <div className="auto-trade-panel-llm-inline__meta">
            {error && status === 'err' ? (
              <span className="auto-trade-panel-llm-inline__err" role="alert">
                {String(error)}
              </span>
            ) : null}
            {creditBlocked && status === 'ok' ? (
              <span className="auto-trade-panel-llm-inline__warn" title="Add separate credit for paid analyses">
                LLM credit depleted
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <section className="auto-trade-panel-llm-pause-card" aria-labelledby="ota-autotrade-llm-pause-title">
      <div className="auto-trade-panel-llm-pause-card__head">
        <h4 id="ota-autotrade-llm-pause-title" className="auto-trade-panel-llm-pause-card__title">
          LLM cost - Autotrade
        </h4>
        <button
          type="button"
          className="auto-trade-panel-llm-pause-card__refresh"
          onClick={() => void load()}
          disabled={status === 'loading'}
          title="Reload billing status"
        >
          <RefreshCw size={14} style={{ opacity: status === 'loading' ? 0.5 : 1 }} />
        </button>
      </div>
      <p className="auto-trade-panel-llm-pause-card__hint">
        Temporarily suspend paid analyses (OpenAI / Claude) for this wallet. This does not stop the on-chain bot; the OTA engine can continue
        through non-agent paths. The server <strong>OpenAI Agent</strong> is stopped when OpenAI is paused.
      </p>
      {error && status === 'err' && (
        <p className="auto-trade-panel-llm-pause-card__err" role="alert">
          {String(error)}
        </p>
      )}
      {creditBlocked && status === 'ok' && (
        <p className="auto-trade-panel-llm-pause-card__warn">
          Separate credit depleted. Add a top-up if you want paid OpenAI/Claude again.
        </p>
      )}
      <div className="auto-trade-panel-llm-pause-card__actions">
        <button
          type="button"
          className={`auto-trade-panel-llm-pause-card__btn ${
            openAiPaused
              ? 'auto-trade-panel-llm-pause-card__btn--resume-openai'
              : 'auto-trade-panel-llm-pause-card__btn--suspend-openai'
          }`}
          disabled={pending === 'openai' || status === 'loading'}
          onClick={() => togglePause('openai', !openAiPaused)}
        >
          {openAiPaused ? <AutotradeIconLlmResume accent="openai" size={18} /> : <AutotradeIconLlmPause accent="openai" size={18} />}
          {pending === 'openai' ? '...' : openAiPaused ? 'Resume OpenAI' : 'Suspend OpenAI'}
        </button>
        <button
          type="button"
          className={`auto-trade-panel-llm-pause-card__btn ${
            anthropicPaused
              ? 'auto-trade-panel-llm-pause-card__btn--resume-claude'
              : 'auto-trade-panel-llm-pause-card__btn--suspend-claude'
          }`}
          disabled={pending === 'anthropic' || status === 'loading'}
          onClick={() => togglePause('anthropic', !anthropicPaused)}
        >
          {anthropicPaused ? (
            <AutotradeIconLlmResume accent="anthropic" size={18} />
          ) : (
            <AutotradeIconLlmPause accent="anthropic" size={18} />
          )}
          {pending === 'anthropic' ? '...' : anthropicPaused ? 'Resume Claude' : 'Suspend Claude'}
        </button>
      </div>
    </section>
  );
}
