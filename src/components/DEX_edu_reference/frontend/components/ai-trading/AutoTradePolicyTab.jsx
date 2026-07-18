/**
 * AutoTradePolicyTab - Trading policy sub-component
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Shield, Clock, DollarSign, AlertCircle, CheckCircle, ExternalLink, X, Lock, Unlock, Sliders } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import { setRiskLevel, getPolicyFromBackendOnly, getLlmTuning, setLlmTuning, resetLossStreak } from '../../services/otaPolicyService';
import { OTA_ANALYZE_LLM_OTA_BITS_ONLY, OTA_ANALYZE_LLM_WITH_OPENAI, setOtaFuturesAnalyzeLlmMode } from '../../utils/otaAnalysisModePreference';

const LLM_TUNING_PRESETS = {
  /** 0.65 = automatic open when the signal has confidence >= 65% (aligned with DEFAULT + product requirement). */
  conservative: { minConfidenceToOpen: 0.65, confidenceCap: 0.85, cooldownLossStreak: 2, cooldownPenalty: 0.12, cooldownBoostMinConfidenceToOpen: 0.10 },
  balanced: { minConfidenceToOpen: 0.65, confidenceCap: 0.90, cooldownLossStreak: 2, cooldownPenalty: 0.10, cooldownBoostMinConfidenceToOpen: 0.08 },
  aggressive: { minConfidenceToOpen: 0.65, confidenceCap: 0.92, cooldownLossStreak: 3, cooldownPenalty: 0.06, cooldownBoostMinConfidenceToOpen: 0.04 }
};
const DEFAULT_LLM_TUNING = { preset: 'balanced', minConfidenceToOpen: 0.65, confidenceCap: 0.90, cooldownEnabled: true, cooldownLossStreak: 2, cooldownPenalty: 0.10, cooldownBoostMinConfidenceToOpen: 0.08 };

function PolicySavedSummary({ summary, onDismiss }) {
  if (!summary) return null;
  return (
    <div className="policy-saved-summary">
      <div className="policy-saved-summary__header">
        <CheckCircle size={18} className="policy-saved-summary__icon" />
        <span className="policy-saved-summary__title">Policy saved on-chain</span>
        <button className="policy-saved-summary__close" onClick={onDismiss} aria-label="Close">
          <X size={14} />
        </button>
      </div>
      <div className="policy-saved-summary__grid">
        <div className="policy-saved-summary__item">
          <span className="policy-saved-summary__label">Status</span>
          <span className={`policy-saved-summary__value ${summary.enabled ? 'policy-saved-summary__value--active' : ''}`}>
            {summary.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <div className="policy-saved-summary__item">
          <span className="policy-saved-summary__label">Expires</span>
          <span className="policy-saved-summary__value">{summary.expiresAt}</span>
        </div>
        <div className="policy-saved-summary__item">
          <span className="policy-saved-summary__label">Max Slippage</span>
          <span className="policy-saved-summary__value">{summary.maxSlippageBps} bps ({summary.slippagePercent}%)</span>
        </div>
        <div className="policy-saved-summary__item">
          <span className="policy-saved-summary__label">Min Delay</span>
          <span className="policy-saved-summary__value">{summary.minDelaySeconds}s</span>
        </div>
      </div>
      <div className="policy-saved-summary__footer">
        <span className="policy-saved-summary__time">Confirmed at {summary.savedAt}</span>
        {summary.txHash && (
          <a
            href={`https://bscscan.com/tx/${summary.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="policy-saved-summary__link"
          >
            View on BscScan <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}

function AutoTradePolicyTab({
  policy,
  setPolicy,
  saving,
  handleSavePolicy,
  walletAddress,
  policyAcceptedOnChain = false,
  policyLastCheckedAt = null,
  verifyingPolicy = false,
  policyVerificationMessage = null,
  onVerifyPolicyOnChain,
  onInlineNotify,
  savedPolicySummary = null,
  onDismissSummary
}) {
  const [editMode, setEditMode] = useState(false);
  const locked = policyAcceptedOnChain && !editMode;
  const [llmTuning, setLlmTuningState] = useState(DEFAULT_LLM_TUNING);
  const [llmTuningLoading, setLlmTuningLoading] = useState(false);
  const [llmTuningSaving, setLlmTuningSaving] = useState(false);
  const [llmTuningVerifying, setLlmTuningVerifying] = useState(false);
  const [llmTuningVerified, setLlmTuningVerified] = useState(null);
  const [savingRiskLevel, setSavingRiskLevel] = useState(false);
  const [verifyingRiskLevel, setVerifyingRiskLevel] = useState(false);
  const [riskLevelVerified, setRiskLevelVerified] = useState(null);
  const [lossStreakResetting, setLossStreakResetting] = useState(false);
  /** Persistent confirmation after Reset loss streak: { success, resetAt?, message? } or { success: false, error }. */
  const [lossStreakResetConfirm, setLossStreakResetConfirm] = useState(null);

  useEffect(() => {
    if (!walletAddress) return;
    setLlmTuningLoading(true);
    getLlmTuning(walletAddress)
      .then((res) => {
        if (res?.llmTuning && typeof res.llmTuning === 'object') setLlmTuningState((prev) => ({ ...DEFAULT_LLM_TUNING, ...prev, ...res.llmTuning }));
      })
      .catch(() => {})
      .finally(() => setLlmTuningLoading(false));
  }, [walletAddress]);

  const handleLlmPresetChange = useCallback((preset) => {
    const p = LLM_TUNING_PRESETS[preset] || LLM_TUNING_PRESETS.balanced;
    setLlmTuningState((prev) => ({ ...prev, preset, ...p }));
  }, []);

  const handleSaveLlmTuning = useCallback(async () => {
    if (!walletAddress) return;
    setLlmTuningSaving(true);
    try {
      const res = await setLlmTuning(walletAddress, llmTuning);
      const savedMode =
        res?.llmTuning?.analyzeLlmMode === OTA_ANALYZE_LLM_OTA_BITS_ONLY
          ? OTA_ANALYZE_LLM_OTA_BITS_ONLY
          : OTA_ANALYZE_LLM_WITH_OPENAI;
      setOtaFuturesAnalyzeLlmMode(savedMode, { source: 'server' });
      onInlineNotify?.('success', 'LLM Tuning saved');
    } catch (err) {
      onInlineNotify?.('error', err?.message || 'Failed to save LLM Tuning');
    } finally {
      setLlmTuningSaving(false);
    }
  }, [walletAddress, llmTuning, onInlineNotify]);

  const handleVerifyLlmTuning = useCallback(async () => {
    if (!walletAddress) return;
    setLlmTuningVerifying(true);
    setLlmTuningVerified(null);
    try {
      const res = await getLlmTuning(walletAddress);
      const saved = res?.llmTuning && typeof res.llmTuning === 'object' ? res.llmTuning : null;
      if (saved) {
        setLlmTuningState((prev) => ({ ...DEFAULT_LLM_TUNING, ...prev, ...saved }));
        const savedMode =
          saved.analyzeLlmMode === OTA_ANALYZE_LLM_OTA_BITS_ONLY
            ? OTA_ANALYZE_LLM_OTA_BITS_ONLY
            : OTA_ANALYZE_LLM_WITH_OPENAI;
        setOtaFuturesAnalyzeLlmMode(savedMode, { source: 'server' });
        const minConf = saved.minConfidenceToOpen ?? DEFAULT_LLM_TUNING.minConfidenceToOpen;
        setLlmTuningVerified(minConf);
        onInlineNotify?.('success', `Saved in backend: minConfidenceToOpen = ${Number(minConf).toFixed(2)}`);
      } else {
        setLlmTuningVerified('(default)');
        onInlineNotify?.('info', 'Backend did not return LLM Tuning; default values are used.');
      }
    } catch (err) {
      onInlineNotify?.('error', err?.message || 'LLM Tuning verification failed');
      setLlmTuningVerified(null);
    } finally {
      setLlmTuningVerifying(false);
    }
  }, [walletAddress, onInlineNotify]);

  const handleUnlock = useCallback(() => {
    setEditMode(true);
    onDismissSummary?.();
  }, [onDismissSummary]);

  const handleSaveRiskLevel = useCallback(async () => {
    if (!walletAddress || !policy.riskLevel) return;
    setSavingRiskLevel(true);
    setRiskLevelVerified(null);
    try {
      await setRiskLevel(walletAddress, policy.riskLevel);
      onInlineNotify?.('success', `Risk tolerance saved in backend: ${policy.riskLevel}`);
    } catch (err) {
      onInlineNotify?.('error', err?.message || 'Risk level save failed');
    } finally {
      setSavingRiskLevel(false);
    }
  }, [walletAddress, policy.riskLevel, onInlineNotify]);

  const handleVerifyRiskLevel = useCallback(async () => {
    if (!walletAddress) return;
    setVerifyingRiskLevel(true);
    setRiskLevelVerified(null);
    try {
      const data = await getPolicyFromBackendOnly(walletAddress);
      const saved = data?.riskLevel ?? data?.risk_level ?? null;
      if (saved) {
        setPolicy((prev) => ({ ...prev, riskLevel: saved }));
        setRiskLevelVerified(saved);
        onInlineNotify?.('success', `Saved in backend: ${saved}`);
      } else {
        setRiskLevelVerified('(nothing)');
        onInlineNotify?.('info', 'Backend did not return risk level.');
      }
    } catch (err) {
      onInlineNotify?.('error', err?.message || 'Verification failed');
      setRiskLevelVerified(null);
    } finally {
      setVerifyingRiskLevel(false);
    }
  }, [walletAddress, setPolicy, onInlineNotify]);

  const wrappedSave = useCallback(async () => {
    // Save LLM Tuning to backend first (no signature); then on-chain policy if changed
    await handleSaveLlmTuning();
    await handleSavePolicy();
    setEditMode(false);
  }, [handleSavePolicy, handleSaveLlmTuning]);

  return (
    <div className="auto-trade-panel-content auto-trade-panel-content--compact">
      <div className="auto-trade-panel-section auto-trade-panel-section--compact">
        <PolicySavedSummary summary={savedPolicySummary} onDismiss={onDismissSummary} />

        <h4 className="auto-trade-panel-section-title" id="policy-section-title">
          <Shield size={18} aria-hidden />
          Trading policy
          {locked && (
            <span className="policy-lock-badge">
              <Lock size={13} /> Accepted
            </span>
          )}
        </h4>

        {locked && (
          <div className="policy-locked-banner">
            <Lock size={14} />
            <span>Policy is accepted on-chain. To modify settings, unlock editing first.</span>
            <button
              type="button"
              className="policy-locked-banner__btn"
              onClick={handleUnlock}
            >
              <Unlock size={13} /> Change settings
            </button>
          </div>
        )}

        <div className={`auto-trade-panel-auto-mode-card ${locked ? 'auto-trade-panel-auto-mode-card--locked' : ''}`}>
          <div className="auto-trade-panel-form-row auto-trade-panel-form-row--toggle">
            <label className="auto-trade-panel-label auto-trade-panel-label--toggle" htmlFor="policy-enabled">
              <input
                id="policy-enabled"
                type="checkbox"
                checked={policy.enabled}
                disabled={locked}
                onChange={(e) => setPolicy((prev) => ({ ...prev, enabled: e.target.checked }))}
                className="auto-trade-panel-checkbox"
              />
              <span>Enable automatic execution</span>
            </label>
            <span className="auto-trade-panel-hint-inline">Check the box to activate – OTA executes trades based on AI signals.</span>
          </div>

          <div className="auto-trade-panel-form-row auto-trade-panel-form-row--expires">
            <div className="auto-trade-panel-input-group auto-trade-panel-input-group--expires">
              <label className="auto-trade-panel-label" htmlFor="policy-expires">
                <Clock size={14} aria-hidden />
                Policy expiration
              </label>
              <div className="auto-trade-panel-expires-row">
                <label className="auto-trade-panel-label auto-trade-panel-label--radio">
                  <input
                    type="radio"
                    name="policy-expires"
                    checked={!policy.expiresAt || policy.expiresAt.getTime?.() === 0}
                    disabled={locked}
                    onChange={() => setPolicy((prev) => ({ ...prev, expiresAt: null }))}
                    className="auto-trade-panel-radio"
                  />
                  <span>Never</span>
                </label>
                <label className="auto-trade-panel-label auto-trade-panel-label--radio">
                  <input
                    type="radio"
                    name="policy-expires"
                    checked={policy.expiresAt && policy.expiresAt.getTime?.() > 0}
                    disabled={locked}
                    onChange={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 30);
                      setPolicy((prev) => ({ ...prev, expiresAt: d }));
                    }}
                    className="auto-trade-panel-radio"
                  />
                  <span>Set date</span>
                </label>
                {policy.expiresAt && policy.expiresAt.getTime?.() > 0 && (
                  <input
                    id="policy-expires"
                    type="date"
                    value={policy.expiresAt ? policy.expiresAt.toISOString().slice(0, 10) : ''}
                    disabled={locked}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPolicy((prev) => ({ ...prev, expiresAt: v ? new Date(v + 'T23:59:59') : null }));
                    }}
                    className="auto-trade-panel-input auto-trade-panel-input--date"
                    min={new Date().toISOString().slice(0, 10)}
                  />
                )}
              </div>
              <span className="auto-trade-panel-hint">Limit policy duration for safety (e.g. 30 days)</span>
            </div>
          </div>

          <div className="auto-trade-panel-form-row auto-trade-panel-form-row--risk">
            <div className="auto-trade-panel-input-group">
              <label className="auto-trade-panel-label" htmlFor="policy-risk">
                <Shield size={14} aria-hidden />
                Risk tolerance
              </label>
              <select
                id="policy-risk"
                value={policy.riskLevel ?? 'moderate'}
                disabled={locked}
                onChange={async (e) => {
                  const v = e.target.value;
                  setPolicy((prev) => ({ ...prev, riskLevel: v }));
                  if (walletAddress && v) {
                    try {
                      await setRiskLevel(walletAddress, v);
                      onInlineNotify?.('success', `Risk level set to ${v}`);
                    } catch (err) {
                      onInlineNotify?.('error', err?.message || 'Failed to save risk level');
                    }
                  }
                }}
                className="auto-trade-panel-input auto-trade-panel-select"
              >
                <option value="conservative">Conservative (min 75% confidence)</option>
                <option value="moderate">Moderate (min 65% confidence)</option>
                <option value="aggressive">Aggressive (min 55% confidence)</option>
                <option value="high">High (min 45% confidence)</option>
              </select>
              <span className="auto-trade-panel-hint">Saved only in backend (not in contract). Effective threshold: "Min confidence to open" (LLM Tuning).</span>
              <div className="auto-trade-panel-form-row" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button type="button" onClick={handleSaveRiskLevel} disabled={savingRiskLevel || !walletAddress || locked} className="auto-trade-panel-button" title="Save Risk tolerance in backend">
                  {savingRiskLevel ? <LoadingSpinner size={14} /> : null} Save
                </button>
                <button type="button" onClick={handleVerifyRiskLevel} disabled={verifyingRiskLevel || !walletAddress} className="auto-trade-panel-button" title="Load saved value from backend">
                  {verifyingRiskLevel ? <LoadingSpinner size={14} /> : null} Verify
                </button>
                {riskLevelVerified != null && (
                  <span className="auto-trade-panel-hint" style={{ marginLeft: '0.25rem' }}>In backend: <strong>{riskLevelVerified}</strong></span>
                )}
              </div>
            </div>
          </div>

          <div className="auto-trade-panel-section auto-trade-panel-section--compact" style={{ marginTop: '1rem' }}>
            <h4 className="auto-trade-panel-section-title">
              <Sliders size={18} aria-hidden />
              LLM Tuning
            </h4>
            <p className="auto-trade-panel-hint" style={{ marginBottom: '0.75rem' }}>Server-enforced gates: min confidence to open, confidence cap, cooldown after losses. Auto/Worker use these.</p>
            {llmTuningLoading ? (
              <LoadingSpinner size={20} />
            ) : (
              <>
                <div className="auto-trade-panel-form-row">
                  <label className="auto-trade-panel-label">Preset</label>
                  <select
                    value={llmTuning.preset ?? 'balanced'}
                    onChange={(e) => handleLlmPresetChange(e.target.value)}
                    className="auto-trade-panel-input auto-trade-panel-select"
                  >
                    <option value="conservative">Conservative</option>
                    <option value="balanced">Balanced (default)</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </div>
                <div className="auto-trade-panel-form-row">
                  <label className="auto-trade-panel-label">Min confidence to open</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input type="range" min="0.25" max="0.80" step="0.01" value={Math.max(0.25, Math.min(0.80, llmTuning.minConfidenceToOpen ?? DEFAULT_LLM_TUNING.minConfidenceToOpen))} onChange={(e) => setLlmTuningState((p) => ({ ...p, minConfidenceToOpen: parseFloat(e.target.value) }))} className="auto-trade-panel-input" style={{ flex: '1', minWidth: '120px' }} />
                    <span className="auto-trade-panel-hint" style={{ minWidth: '2.5rem', fontWeight: 600 }}>{(Math.max(0.25, Math.min(0.80, llmTuning.minConfidenceToOpen ?? DEFAULT_LLM_TUNING.minConfidenceToOpen))).toFixed(2)}</span>
                    <button type="button" onClick={() => { setLlmTuningState((p) => ({ ...p, minConfidenceToOpen: 0.30 })); onInlineNotify?.('success', 'Min confidence set to 0.30 (most permissive). Press Save policy.'); }} className="auto-trade-panel-button" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }} title="Lowest value - very permissive">0.30</button>
                    <button type="button" onClick={() => { setLlmTuningState((p) => ({ ...p, minConfidenceToOpen: 0.35 })); onInlineNotify?.('success', 'Min confidence set to 0.35. Press Save policy.'); }} className="auto-trade-panel-button" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }} title="Set 0.35">0.35</button>
                    <button type="button" onClick={() => { setLlmTuningState((p) => ({ ...p, minConfidenceToOpen: 0.4 })); onInlineNotify?.('success', 'Min confidence set to 0.40. Press Save policy.'); }} className="auto-trade-panel-button" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }} title="Set 0.40">0.40</button>
                    <button type="button" onClick={() => { setLlmTuningState((p) => ({ ...p, minConfidenceToOpen: 0.45 })); onInlineNotify?.('success', 'Min confidence set to 0.45. Press Save policy.'); }} className="auto-trade-panel-button" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }} title="Set 0.45">0.45</button>
                    <button type="button" onClick={() => { setLlmTuningState((p) => ({ ...p, minConfidenceToOpen: DEFAULT_LLM_TUNING.minConfidenceToOpen })); onInlineNotify?.('success', 'Min confidence 0.65 - Auto/executor opens at signal >= 65%. Press Save policy.'); }} className="auto-trade-panel-button" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }} title="Recommended threshold: open at confidence >= 65%">0.65</button>
                  </div>
                  <span className="auto-trade-panel-hint">UI default + presets: 0.65 (&gt;= 65% confidence for automatic open, if backend applies llm_tuning). Worker must be active on the server. Press Save policy after changes.</span>
                </div>
                <div className="auto-trade-panel-form-row">
                  <label className="auto-trade-panel-label">Confidence cap ({(llmTuning.confidenceCap ?? 0.9).toFixed(2)})</label>
                  <input type="range" min="0.70" max="0.95" step="0.01" value={llmTuning.confidenceCap ?? 0.9} onChange={(e) => setLlmTuningState((p) => ({ ...p, confidenceCap: parseFloat(e.target.value) }))} className="auto-trade-panel-input" />
                </div>
                <div className="auto-trade-panel-form-row auto-trade-panel-form-row--toggle">
                  <label className="auto-trade-panel-label auto-trade-panel-label--toggle">
                    <input type="checkbox" checked={llmTuning.cooldownEnabled !== false} onChange={(e) => setLlmTuningState((p) => ({ ...p, cooldownEnabled: e.target.checked }))} className="auto-trade-panel-checkbox" />
                    <span>Cooldown after losses</span>
                  </label>
                </div>
                <div className="auto-trade-panel-form-row">
                  <label className="auto-trade-panel-label">Cooldown loss streak (1–5)</label>
                  <input type="number" min="1" max="5" value={llmTuning.cooldownLossStreak ?? 2} onChange={(e) => setLlmTuningState((p) => ({ ...p, cooldownLossStreak: Math.max(1, Math.min(5, parseInt(e.target.value, 10) || 2)) }))} className="auto-trade-panel-input" style={{ maxWidth: '4rem' }} />
                </div>
                <div className="auto-trade-panel-form-row">
                  <label className="auto-trade-panel-label">Cooldown penalty ({(llmTuning.cooldownPenalty ?? 0.1).toFixed(2)})</label>
                  <input type="range" min="0" max="0.25" step="0.01" value={llmTuning.cooldownPenalty ?? 0.1} onChange={(e) => setLlmTuningState((p) => ({ ...p, cooldownPenalty: parseFloat(e.target.value) }))} className="auto-trade-panel-input" />
                </div>
                <div className="auto-trade-panel-form-row">
                  <label className="auto-trade-panel-label">Cooldown boost min open ({(llmTuning.cooldownBoostMinConfidenceToOpen ?? 0.08).toFixed(2)})</label>
                  <input type="range" min="0" max="0.20" step="0.01" value={llmTuning.cooldownBoostMinConfidenceToOpen ?? 0.08} onChange={(e) => setLlmTuningState((p) => ({ ...p, cooldownBoostMinConfidenceToOpen: parseFloat(e.target.value) }))} className="auto-trade-panel-input" />
                </div>
                <div className="auto-trade-panel-form-row" style={{ marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!walletAddress || lossStreakResetting) return;
                      setLossStreakResetConfirm(null);
                      setLossStreakResetting(true);
                      try {
                        const res = await resetLossStreak(walletAddress, 'manual_reset_ui');
                        const ok = res && (res.success === true || res.success === 'true');
                        const resetAt = res?.resetAt ?? res?.reset_at;
                        if (ok && resetAt) {
                          setLossStreakResetConfirm({ success: true, resetAt: String(resetAt), message: res?.message ?? null });
                          onInlineNotify?.('success', 'Reset recorded. The next OTA cycle will use only outcomes after this time.');
                        } else {
                          setLossStreakResetConfirm({ success: false, error: res?.message || res?.error || 'Backend did not return confirmation (success + resetAt).' });
                          onInlineNotify?.('warning', 'Unexpected server response. Check the logs.');
                        }
                      } catch (e) {
                        const errMsg = e?.message || 'Reset loss streak failed';
                        setLossStreakResetConfirm({ success: false, error: errMsg });
                        onInlineNotify?.('error', errMsg);
                      } finally {
                        setLossStreakResetting(false);
                      }
                    }}
                    disabled={lossStreakResetting || !walletAddress}
                    className="auto-trade-panel-button"
                    title="Reset the consecutive-loss counter. Backend records an audit entry; the next OTA cycle will ignore earlier losses."
                  >
                    {lossStreakResetting ? <LoadingSpinner size={14} /> : null}
                    {' Reset loss streak'}
                  </button>
                  <span className="auto-trade-panel-hint">Reset cooldown (audit only; PnL remains unchanged).</span>
                </div>
                {lossStreakResetConfirm && (
                  <div
                    className="auto-trade-panel-form-row"
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid',
                      backgroundColor: lossStreakResetConfirm.success ? 'var(--ds-success-bg, rgba(34, 197, 94, 0.12))' : 'var(--ds-error-bg, rgba(239, 68, 68, 0.12))',
                      borderColor: lossStreakResetConfirm.success ? 'var(--ds-success-border, #22c55e)' : 'var(--ds-error-border, #ef4444)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      {lossStreakResetConfirm.success ? (
                        <CheckCircle size={20} style={{ color: 'var(--ds-success, #22c55e)', flexShrink: 0, marginTop: '1px' }} aria-hidden />
                      ) : (
                        <AlertCircle size={20} style={{ color: 'var(--ds-error, #ef4444)', flexShrink: 0, marginTop: '1px' }} aria-hidden />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {lossStreakResetConfirm.success ? (
                          <>
                            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Reset recorded</strong>
                            <span style={{ fontSize: '0.875rem' }}>
                              Backend confirmed the reset. Recorded date/time: <strong>{lossStreakResetConfirm.resetAt}</strong>. The next OTA cycle will calculate loss streak only from transactions after this time.
                            </span>
                            {lossStreakResetConfirm.message && (
                              <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', opacity: 0.9 }}>{lossStreakResetConfirm.message}</div>
                            )}
                          </>
                        ) : (
                          <>
                            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Reset failed</strong>
                            <span style={{ fontSize: '0.875rem' }}>{lossStreakResetConfirm.error}</span>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setLossStreakResetConfirm(null)}
                        className="auto-trade-panel-button"
                        style={{ flexShrink: 0, padding: '0.2rem 0.4rem' }}
                        aria-label="Close confirmation"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
                <div className="auto-trade-panel-form-row" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button type="button" onClick={handleSaveLlmTuning} disabled={llmTuningSaving || !walletAddress} className="auto-trade-panel-button primary">
                    {llmTuningSaving ? <LoadingSpinner size={14} /> : 'Save LLM Tuning'}
                  </button>
                  <button type="button" onClick={handleVerifyLlmTuning} disabled={llmTuningVerifying || !walletAddress} className="auto-trade-panel-button" title="Load saved backend value (minConfidenceToOpen etc.)">
                    {llmTuningVerifying ? <LoadingSpinner size={14} /> : 'Verify'}
                  </button>
                  {llmTuningVerified != null && (
                    <span className="auto-trade-panel-hint" style={{ fontWeight: 600 }}>
                      Saved: minConfidenceToOpen = {typeof llmTuningVerified === 'number' ? llmTuningVerified.toFixed(2) : llmTuningVerified}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="auto-trade-panel-form-row auto-trade-panel-form-row--profit-loss">
            <div className="auto-trade-panel-input-group">
              <label className="auto-trade-panel-label" htmlFor="policy-profit-tier">
                <DollarSign size={14} aria-hidden />
                Profit tier
              </label>
              <select
                id="policy-profit-tier"
                value={String(policy.profitTier ?? 100)}
                disabled={locked}
                onChange={(e) => setPolicy((prev) => ({ ...prev, profitTier: parseInt(e.target.value, 10) }))}
                className="auto-trade-panel-input auto-trade-panel-select"
              >
                <option value="5">Micro (5% above gas)</option>
                <option value="50">Medium (50% above gas)</option>
                <option value="100">Large (100% above gas)</option>
                <option value="1000">Huge (1000% above gas)</option>
              </select>
              <span className="auto-trade-panel-hint">Minimum profit above gas to execute. Sent to backend on Start.</span>
            </div>
            <div className="auto-trade-panel-input-group">
              <label className="auto-trade-panel-label" htmlFor="policy-loss-limit">
                <AlertCircle size={14} aria-hidden />
                Loss limit
              </label>
              <select
                id="policy-loss-limit"
                value={String(policy.lossLimit ?? 0)}
                disabled={locked}
                onChange={(e) => setPolicy((prev) => ({ ...prev, lossLimit: parseInt(e.target.value, 10) }))}
                className="auto-trade-panel-input auto-trade-panel-select"
              >
                <option value="0">Off (no percent-loss auto-close)</option>
                <option value="3">Tight (close at 3% loss)</option>
                <option value="5">Moderate (close at 5% loss)</option>
                <option value="10">Loose (close at 10% loss)</option>
              </select>
              <span className="auto-trade-panel-hint">0 disables this percent-loss auto-close. Choose 3/5/10 only when you explicitly want executor loss exits.</span>
            </div>
          </div>

          <div className="auto-trade-panel-form-row auto-trade-panel-form-row--inputs">
            <div className="auto-trade-panel-input-group">
              <label className="auto-trade-panel-label" htmlFor="policy-slippage">Max Slippage (bps)</label>
              <input
                id="policy-slippage"
                type="number"
                min="1"
                max="1000"
                value={policy.maxSlippageBps ?? 300}
                disabled={locked}
                onChange={(e) => setPolicy((prev) => ({ ...prev, maxSlippageBps: Math.max(1, Math.min(1000, parseInt(e.target.value, 10) || 300)) }))}
                className="auto-trade-panel-input"
                title="100 = 1%, 300 = 3%, 1000 = 10% (contract max)"
              />
            </div>
            <div className="auto-trade-panel-input-group">
              <label className="auto-trade-panel-label" htmlFor="policy-delay"><Clock size={14} aria-hidden /> Delay (sec)</label>
              <input
                id="policy-delay"
                type="number"
                min="0"
                max="300"
                value={policy.minDelaySeconds ?? 60}
                disabled={locked}
                onChange={(e) => setPolicy((prev) => ({ ...prev, minDelaySeconds: Math.max(0, Math.min(300, parseInt(e.target.value, 10) || 0)) }))}
                className="auto-trade-panel-input"
                title="0 = no delay between transactions"
              />
            </div>
          </div>

          <div className="auto-trade-panel-form-row auto-trade-panel-form-row--checkboxes">
            <label className="auto-trade-panel-label auto-trade-panel-label--checkbox">
              <input
                type="checkbox"
                checked={policy.enforceTokenAllowlist}
                disabled={locked}
                onChange={(e) => setPolicy((prev) => ({ ...prev, enforceTokenAllowlist: e.target.checked }))}
                className="auto-trade-panel-checkbox"
              />
              <span>Only tokens from allowlist</span>
            </label>
            <label className="auto-trade-panel-label auto-trade-panel-label--checkbox">
              <input
                type="checkbox"
                checked={policy.enforcePairAllowlist}
                disabled={locked}
                onChange={(e) => setPolicy((prev) => ({ ...prev, enforcePairAllowlist: e.target.checked }))}
                className="auto-trade-panel-checkbox"
              />
              <span>Only pairs from allowlist</span>
            </label>
          </div>

          <div className="auto-trade-panel-apply-zone">
            <p className="auto-trade-panel-apply-label">Apply settings</p>
            <div className={`auto-trade-panel-policy-status ${policyAcceptedOnChain ? 'accepted' : 'pending'}`}>
              <span className="auto-trade-panel-policy-status-dot" />
              <span>
                {policyAcceptedOnChain ? 'Policy accepted on-chain' : 'Policy not yet synced on-chain'}
                {policyLastCheckedAt ? ` (${new Date(policyLastCheckedAt).toLocaleTimeString()})` : ''}
              </span>
            </div>
            <div className="auto-trade-panel-policy-actions">
              <button
                type="button"
                onClick={onVerifyPolicyOnChain}
                disabled={saving || verifyingPolicy || !walletAddress}
                className="auto-trade-panel-button auto-trade-panel-button--verify"
                title="Read from contract (OTAPolicyManager) and update the form"
              >
                {verifyingPolicy ? <LoadingSpinner size={14} /> : 'Verify on-chain'}
              </button>
            </div>
            {policyVerificationMessage?.text ? (
              <div className={`auto-trade-panel-policy-verify-result ${policyVerificationMessage.type || 'info'}`}>
                {policyVerificationMessage.text}
              </div>
            ) : null}
            {locked ? (
              <button
                type="button"
                onClick={handleUnlock}
                className="auto-trade-panel-button auto-trade-panel-button--change-settings"
              >
                <Unlock size={15} /> Change settings
              </button>
            ) : (
              <button
                onClick={wrappedSave}
                disabled={saving}
                className="auto-trade-panel-button primary auto-trade-panel-button--apply"
              >
                {saving ? <LoadingSpinner size={16} /> : 'Save policy'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AutoTradePolicyTab;
