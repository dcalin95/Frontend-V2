/**
 * 📈 MarketAnalysis Component - Market Analysis Display
 *
 * Analysis result ONLY from onAnalyze (POST /ai-trading/analyze, OTA AI OpenAI). No demo or preset data.
 *
 * @module MarketAnalysis
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { TrendingUp, TrendingDown, RefreshCw, ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { formatNumber, formatPercentage, formatCurrency } from '../../utils/formatters';
import { useOTAAccess } from '../../hooks/useOTAAccess';
import { errorWithPrefix } from '../../utils/logger';
import { isOpenAiUnavailableResult, OTA_OPENAI_UNAVAILABLE_MESSAGE } from '../../utils/helpers';
import { getOTAQuota } from '../../services/aiTradingApiService.jsx';
import { getSeparateBillingErrorDetails } from '../../services/otaAnalyzeFacade.jsx';
import LoadingSpinner from '../common/LoadingSpinner';
import Skeleton from '../common/Skeleton';
import EducationalTooltip from '../common/EducationalTooltip';
import { Button } from '../ui';
import HeaderTokenSelector from '../common/HeaderTokenSelector';
import '../../styles/components/market-analysis.css';
import '../../styles/components/header-token-selector.css';
import {
  LABEL_LIVE_ANALYSIS,
  LABEL_TECHNICAL_DETAILS,
  describeAnalysisSourceForUser,
  getTechnicalAnalysisSourceRaw,
  mapAnalysisSourceToPrimaryLabel,
} from '../../utils/otaLlmDisplayLabels';

// Only show analysis when backend returns at least one real price (entry/stop/take profit).
// Signal + reasoning without prices = not actionable; show "No real data" until backend sends prices.
function hasNoRealAnalysisData(result) {
  if (!result || typeof result !== 'object') return true;
  const p = typeof result.signal === 'object' && result.signal !== null ? result.signal : result;
  const entry = p.entryPrice ?? result.entryPrice;
  const sl = p.stopLoss ?? result.stopLoss;
  const tp = p.takeProfit ?? result.takeProfit;
  const currentPrice = p.currentPrice ?? result.currentPrice ?? p.marketData?.price;
  const hasAnyPrice = [entry, sl, tp, currentPrice].some(v => v != null && v !== '' && Number(v) > 0);
  return !hasAnyPrice;
}

function formatLatency(ms) {
  if (ms == null || typeof ms !== 'number') return '—';
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

const MarketAnalysis = ({ 
  userId, 
  selectedToken, 
  onTokenChange, 
  onAnalyze,
  onExecuteSwap, // Callback pentru execute swap: (tokenIn, tokenOut, amountIn?) => void
  onResultChange, // Optional: (result) => void - parent can store last result (e.g. for "Go to Trade" with prefill)
  loading = false, // Loading state for skeleton
  headerSlot = null // Când setat: token selector + Analyze button se renderează în header în loc de în card
}) => {
  const { isPreviewMode, can } = useOTAAccess();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [billingErrorDetails, setBillingErrorDetails] = useState(null);
  const [quota, setQuota] = useState({ analysesToday: 0, maxAnalysesPerDay: 0, analysesLeft: 0, isExempt: false });
  const [rateLimitedUntil, setRateLimitedUntil] = useState(null);

  const fetchQuota = useCallback(async () => {
    if (!userId) {
      setQuota({ analysesToday: 0, maxAnalysesPerDay: 0, analysesLeft: 0 });
      return;
    }
    try {
      const q = await getOTAQuota(userId);
      setQuota({ ...q, isExempt: Boolean(q.isExempt) });
    } catch {
      // Keep previous quota on error so we don't block the user (fail open)
      setQuota(prev => (prev.maxAnalysesPerDay > 0 ? prev : { analysesToday: 0, maxAnalysesPerDay: 0, analysesLeft: 999 }));
    }
  }, [userId]);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  // Clear rate-limit cooldown after 60s
  useEffect(() => {
    if (!rateLimitedUntil) return;
    const t = setTimeout(() => setRateLimitedUntil(null), Math.max(0, rateLimitedUntil - Date.now()));
    return () => clearTimeout(t);
  }, [rateLimitedUntil]);

  // D3: clear persistent error after 8s so it doesn't stay forever
  useEffect(() => {
    if (!apiError) return;
    const t = setTimeout(() => setApiError(null), 8000);
    return () => clearTimeout(t);
  }, [apiError]);

  const isNoRealData = analysisResult && hasNoRealAnalysisData(analysisResult);
  const openAiUnavailable = analysisResult && isOpenAiUnavailableResult(analysisResult);
  // API returns { success, signal: payload } or hook returns payload directly
  const payload = analysisResult && typeof analysisResult.signal === 'object' && analysisResult.signal !== null && !Array.isArray(analysisResult.signal)
    ? analysisResult.signal
    : analysisResult;

  const handleAnalyze = async () => {
    if (!onAnalyze || !selectedToken) return;

    try {
      setAnalyzing(true);
      setAnalysisResult(null);
      setApiError(null);
      setBillingErrorDetails(null);
      const result = await onAnalyze(selectedToken);
      setAnalysisResult(result);
      if (typeof onResultChange === 'function') onResultChange(result);
      await fetchQuota();
    } catch (error) {
      errorWithPrefix('MarketAnalysis', 'Error analyzing market:', error);
      setAnalysisResult(null);
      const msg = error?.message || 'Analysis failed. Please try again.';
      setBillingErrorDetails(getSeparateBillingErrorDetails(error));
      setApiError(msg);
      if (/Daily analysis limit reached|limit reached/i.test(msg)) {
        await fetchQuota();
      }
      if (/Too many requests|try again later|try again in a minute/i.test(msg)) {
        setRateLimitedUntil(Date.now() + 60 * 1000);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const quotaExhausted = quota.maxAnalysesPerDay > 0 && quota.analysesLeft <= 0;
  const isRateLimited = rateLimitedUntil != null && rateLimitedUntil > Date.now();
  const isExempt = Boolean(quota.isExempt);
  const analyzeDisabled = analyzing || !selectedToken || (quotaExhausted && !isExempt) || isRateLimited;

  // Show skeleton loader while loading
  if (loading) {
    return (
      <div className="market-analysis">
        <div className="market-analysis-header">
          <Skeleton variant="text" width="200px" height="24px" />
        </div>
        <div className="market-analysis-content">
          <div style={{ marginBottom: '16px' }}>
            <Skeleton variant="text" width="100px" height="16px" style={{ marginBottom: '8px' }} />
            <Skeleton variant="rectangle" width="100%" height="40px" />
          </div>
          <Skeleton variant="rectangle" width="100%" height="48px" style={{ marginBottom: '24px' }} />
          <div style={{ padding: '20px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <Skeleton variant="text" width="150px" height="20px" style={{ marginBottom: '16px' }} />
            <Skeleton variant="text" width="100%" height="16px" style={{ marginBottom: '8px' }} />
            <Skeleton variant="text" width="80%" height="16px" style={{ marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <Skeleton variant="rectangle" width="120px" height="60px" />
              <Skeleton variant="rectangle" width="120px" height="60px" />
              <Skeleton variant="rectangle" width="120px" height="60px" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const triggerBlock = (
    <div className="market-analysis-header-trigger" aria-label="Analyze market">
      <HeaderTokenSelector
        selectedToken={selectedToken}
        onTokenChange={(s) => onTokenChange?.(s)}
        ariaLabel="Select token for analysis"
        disabled={analyzing}
      />
      <button
        type="button"
        className="market-analysis-btn market-analysis-btn-header"
        onClick={handleAnalyze}
        disabled={analyzeDisabled}
        title={quotaExhausted ? 'Daily limit reached' : isRateLimited ? 'Wait a minute before trying again' : isExempt ? 'No limit for this account' : 'Run OTA AI OpenAI analysis'}
      >
        {analyzing ? (
          <LoadingSpinner size="small" message="" />
        ) : isRateLimited ? (
          'Wait 1 min'
        ) : quotaExhausted ? (
          'Limit reached'
        ) : (
          <>
            <RefreshCw size={16} aria-hidden />
            Analyze Market
          </>
        )}
      </button>
    </div>
  );

  // When token + Analyze are in header (headerSlot) and no result yet: no empty card — skip until result/error/loading
  const showCard = !headerSlot || analysisResult || apiError || analyzing;

  return (
    <>
      {headerSlot && typeof document !== 'undefined' && createPortal(triggerBlock, headerSlot)}
      {!showCard && headerSlot && userId && (quota.maxAnalysesPerDay > 0 || isExempt) && (
        <p className="market-analysis-quota market-analysis-quota-standalone" style={{ margin: '4px 0', fontSize: '13px', color: 'var(--ds-text-secondary)' }} aria-live="polite">
          {isExempt ? 'Unlimited analyses.' : quotaExhausted ? `Daily limit reached (${quota.analysesToday}/${quota.maxAnalysesPerDay}).` : `${quota.analysesLeft} analyses left today.`}
        </p>
      )}
      {showCard && (
      <div className="market-analysis">
        <div className="market-analysis-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} className="market-analysis-ai-icon" aria-hidden />
            <EducationalTooltip
              title="Live Analysis — market snapshot and signal"
              content="The active provider is shown as a product label (OpenAI, Claude, or OTA Engine). Raw analysisSource values stay under Technical details. Token usage is proof of an LLM call when present."
              howItWorks="This panel shows the latest analyze result from the server for your current mode. Historical feed cards may differ — check Signal History for older rows."
              bestPractices={[
                'Score is not a probability of success',
                'Always use stop loss to manage risk',
                'Check "Data used" and "Limitations" for context',
                'Signals are for information only; no guaranteed outcome'
              ]}
              position="right"
            />
          </div>
        </div>

      <div className="market-analysis-content">
        {!headerSlot && (
          <>
            <div className="market-analysis-token-selector">
              <HeaderTokenSelector
                selectedToken={selectedToken}
                onTokenChange={(symbol) => onTokenChange(symbol)}
                ariaLabel="Select token for analysis"
                disabled={analyzing}
              />
            </div>
            {userId && (quota.maxAnalysesPerDay > 0 || isExempt) && (
              <p className="market-analysis-quota" aria-live="polite">
                {isExempt ? 'Unlimited.' : quotaExhausted ? `Daily limit reached (${quota.analysesToday}/${quota.maxAnalysesPerDay}).` : `${quota.analysesLeft} left today.`}
              </p>
            )}
            <button
              className="market-analysis-btn"
              onClick={handleAnalyze}
              disabled={analyzeDisabled}
              title={quotaExhausted ? 'Daily limit reached' : isRateLimited ? 'Wait a minute' : 'Run OTA AI analysis'}
            >
              {analyzing ? <LoadingSpinner size="small" message="" /> : isRateLimited ? 'Wait 1 min' : quotaExhausted ? 'Limit reached' : <><RefreshCw size={16} /> Analyze Market</>}
            </button>
          </>
        )}
        {headerSlot && userId && (quota.maxAnalysesPerDay > 0 || isExempt) && (
          <p className="market-analysis-quota" aria-live="polite">
            {isExempt ? 'Unlimited.' : quotaExhausted ? `Daily limit reached (${quota.analysesToday}/${quota.maxAnalysesPerDay}).` : `${quota.analysesLeft} analysis requests left today.`}
          </p>
        )}

        {billingErrorDetails ? (
          <div
            className="market-analysis-result-content"
            style={{
              padding: '12px 16px',
              marginTop: '12px',
              background: 'rgba(251, 191, 36, 0.14)',
              border: '1px solid rgba(251, 191, 36, 0.36)',
              borderRadius: '8px',
              color: 'var(--ds-text-primary)',
              fontSize: '13px'
            }}
            role="alert"
          >
            <strong>{billingErrorDetails.message}</strong>
            <p style={{ marginTop: '6px', fontSize: '12px', opacity: 0.92 }}>
              Trial {billingErrorDetails.billing?.trialCreditUsd != null ? `$${Number(billingErrorDetails.billing.trialCreditUsd).toFixed(2)}` : '—'}
              {' · '}
              spent {billingErrorDetails.billing?.spentCreditUsd != null ? `$${Number(billingErrorDetails.billing.spentCreditUsd).toFixed(2)}` : '—'}
              {' · '}
              available {billingErrorDetails.billing?.availableCreditUsd != null ? `$${Number(billingErrorDetails.billing.availableCreditUsd).toFixed(2)}` : '—'}
            </p>
            <p style={{ marginTop: '6px', fontSize: '12px', opacity: 0.92 }}>
              Switch to OTA Engine or add more separate provider credit before running {billingErrorDetails.providerLabel} again.
            </p>
          </div>
        ) : null}

        {apiError && !billingErrorDetails && (
          <div
            className="market-analysis-result-content"
            style={{
              padding: '12px 16px',
              marginTop: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: 'var(--ds-text-primary)',
              fontSize: '13px'
            }}
          >
            <strong>Error</strong>: {apiError}
            <p style={{ marginTop: '6px', fontSize: '12px', opacity: 0.9 }}>
              Signal source unavailable (analysis failed — no OpenAI or OTA Engine output).
            </p>
          </div>
        )}
        
        {isPreviewMode && (
          <p style={{ 
            fontSize: '12px', 
            color: 'rgba(255,255,255,0.5)', 
            marginTop: '8px',
            textAlign: 'center'
          }}>
            Analysis result from OTA AI (OpenAI) only. Register for full access.
          </p>
        )}

        {/* Market Snapshot + Signal (computed) */}
        {analysisResult && (
          <div className="market-analysis-result">
            <div className="market-analysis-result-header">
              <h3 style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--ds-text-secondary)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    padding: '2px 8px',
                  }}
                >
                  {LABEL_LIVE_ANALYSIS}
                </span>
                <span>Market snapshot — {selectedToken}</span>
              </h3>
            </div>

            {/* Bloc dovezi: OpenAI a analizat cu adevărat – tokens, model, what_data_was_used */}
            {/* Banner: 0 candles = Binance poate fi geo-blockat (Render), fallback CoinGecko nu oferă OHLCV */}
            {!openAiUnavailable && payload?.dataProvenance?.candleCount === 0 && (
              <div className="market-analysis-data-warning" role="alert">
                <strong>Insufficient data (0 candles) – OpenAI analyzes directly</strong>
                <p>Backend fallback to CoinGecko (no OHLCV). Binance may be geo-blocked. OpenAI receives price, volume, change24h and produces signal + confidence – not hardcoded.</p>
              </div>
            )}

            {!openAiUnavailable && (payload?.model || payload?.requestId || payload?.reasoning) && (
              <div className="market-analysis-llm-proof" role="status" aria-live="polite">
                <div className="market-analysis-llm-proof-header" style={{ flexWrap: 'wrap', gap: '6px' }}>
                  <ShieldCheck size={18} aria-hidden />
                  <span>
                    <strong>{mapAnalysisSourceToPrimaryLabel(payload?.analysisSource)}</strong>
                    {' — '}
                    {describeAnalysisSourceForUser(payload?.analysisSource)}
                  </span>
                </div>
                <details className="market-analysis-llm-proof-details" style={{ marginTop: '8px' }}>
                  <summary style={{ cursor: 'pointer', fontSize: '12px', color: 'var(--ds-text-secondary)' }}>
                    {LABEL_TECHNICAL_DETAILS}
                  </summary>
                  <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span className="market-analysis-llm-proof-item">
                      <strong>analysisSource (raw):</strong> {getTechnicalAnalysisSourceRaw(payload?.analysisSource) || '—'}
                    </span>
                    {payload?.model && (
                      <span className="market-analysis-llm-proof-item" title="Model used when applicable">
                        Model: {payload.model}
                      </span>
                    )}
                    {payload?.latency != null && (
                      <span className="market-analysis-llm-proof-item">Latency: {formatLatency(payload.latency)}</span>
                    )}
                    {payload?.requestId && (
                      <span className="market-analysis-llm-proof-item" title="Request id for support">
                        ID: {String(payload.requestId).slice(0, 20)}…
                      </span>
                    )}
                    {payload?.btcLeading && (payload.btcLeading.summary || payload.btcLeading.return1h != null) && (
                      <span
                        className="market-analysis-llm-proof-item"
                        title="Reference BTC price for context when the analyzed token is not BTC (live fetch; may use Binance with fallbacks)."
                      >
                        <strong>BTC context:</strong>{' '}
                        {typeof payload.btcLeading.summary === 'string'
                          ? payload.btcLeading.summary
                          : `1h: ${Number(payload.btcLeading.return1h).toFixed(2)}%`}
                      </span>
                    )}
                  </div>
                </details>
                {/* Cost și tokeni OpenAI: USD, total, prompt + completion */}
                <div className="market-analysis-llm-cost" aria-label="Analysis cost in USD and OpenAI tokens">
                  <div className="market-analysis-llm-cost-row">
                    <span className="market-analysis-llm-cost-label">Cost (USD):</span>
                    <span className="market-analysis-llm-cost-value">
                      {payload?.costEstimate != null ? `$${Number(payload.costEstimate).toFixed(6)}` : '—'}
                    </span>
                  </div>
                  <div className="market-analysis-llm-cost-row">
                    <span className="market-analysis-llm-cost-label">Tokens OpenAI:</span>
                    <span className="market-analysis-llm-cost-value">
                      {payload?.tokenUsage?.totalTokens != null ? (
                        payload.tokenUsage.promptTokens != null && payload.tokenUsage.completionTokens != null
                          ? `${payload.tokenUsage.totalTokens} (prompt: ${payload.tokenUsage.promptTokens}, completion: ${payload.tokenUsage.completionTokens})`
                          : `${payload.tokenUsage.totalTokens} total`
                      ) : '—'}
                    </span>
                  </div>
                </div>
                {(Array.isArray(payload?.openAI?.what_data_was_used) && payload.openAI.what_data_was_used.length > 0) || (payload?.dataProvenance?.sources?.length > 0) ? (
                  <div className="market-analysis-llm-proof-data" title="Data analyzed">
                    <strong>Data analyzed:</strong>{' '}
                    {(payload?.openAI?.what_data_was_used?.length > 0
                      ? payload.openAI.what_data_was_used.slice(0, 5).join(', ')
                      : [].concat(payload?.dataProvenance?.sources || []).slice(0, 3).join(', ')) || '—'}
                    {((payload?.openAI?.what_data_was_used?.length ?? 0) > 5 || (payload?.dataProvenance?.sources?.length ?? 0) > 3) && '…'}
                  </div>
                ) : null}
              </div>
            )}

            {openAiUnavailable && (
              <div className="market-analysis-result-content" style={{ padding: '16px', background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.4)', borderRadius: '8px', marginTop: '12px', marginBottom: '12px' }} role="alert">
                <p style={{ margin: 0, color: 'var(--ds-text-primary)', fontWeight: 600 }}>
                  OpenAI temporarily unavailable
                </p>
                <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
                  {OTA_OPENAI_UNAVAILABLE_MESSAGE}
                </p>
              </div>
            )}

            {isNoRealData ? (
              <div className="market-analysis-result-content" style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', marginTop: '12px' }}>
                <p style={{ margin: 0, color: 'var(--ds-text-primary)', fontWeight: 500 }}>
                  No real data
                </p>
                <p style={{ margin: '8px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                  Backend returned no usable analysis (missing or zero prices, no reasoning). Fix backend / OpenAI config.
                </p>
              </div>
            ) : (
            <div className="market-analysis-result-content">
              <div className="market-analysis-signal">
                <span className="market-analysis-signal-label">Signal:</span>
                <span className={`market-analysis-signal-value market-analysis-signal-${(typeof payload?.signal === 'string' ? payload.signal : 'hold').toLowerCase()}`}>
                  {(typeof payload?.signal === 'string' ? payload.signal : 'HOLD').toUpperCase()}
                  {(typeof payload?.signal === 'string' ? payload.signal : '') === 'buy' && <TrendingUp size={16} />}
                  {(typeof payload?.signal === 'string' ? payload.signal : '') === 'sell' && <TrendingDown size={16} />}
                </span>
              </div>

              {(payload?.score != null || payload?.confidence !== undefined) && (
                <div className="market-analysis-confidence">
                  <span className="market-analysis-confidence-label">Score:</span>
                  <span className="market-analysis-confidence-value" title={payload?.scoreDefinition || 'Aggregate of rule strength (0–100). Not a probability.'}>
                    {formatPercentage(
                      payload?.score != null ? payload.score / 100 : (payload?.confidence ?? 0),
                      2,
                      true
                    )}
                  </span>
                </div>
              )}

              {/* Cost + Tokens – vizibil imediat după Signal+Score */}
              {(payload?.costEstimate != null || payload?.tokenUsage?.totalTokens != null) && (
                <div className="market-analysis-cost-row" style={{ marginTop: '8px', fontSize: '12px', color: 'var(--ds-text-secondary)' }}>
                  {payload?.costEstimate != null && <span>Cost: ${Number(payload.costEstimate).toFixed(6)} USD</span>}
                  {payload?.costEstimate != null && payload?.tokenUsage?.totalTokens != null && <span style={{ margin: '0 8px', opacity: 0.6 }}>·</span>}
                  {payload?.tokenUsage?.totalTokens != null && (
                    <span>Tokens: {payload.tokenUsage.promptTokens != null ? `${payload.tokenUsage.totalTokens} (p: ${payload.tokenUsage.promptTokens}, c: ${payload.tokenUsage.completionTokens})` : payload.tokenUsage.totalTokens}</span>
                  )}
                </div>
              )}

              {/* Execute / Fortare – vizibil imediat după Signal+Score */}
              {!isPreviewMode && onExecuteSwap && (() => {
                const signalStr = typeof payload?.signal === 'string' ? payload.signal : 'hold';
                const tokenIn = selectedToken;
                const tokenOut = 'USDT';
                const amountIn = payload?.amountIn ?? null;
                if (signalStr === 'buy' || signalStr === 'swap') {
                  return (
                    <div className="market-analysis-execute" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <Button variant="primary" size="md" fullWidth onClick={() => onExecuteSwap(tokenIn, tokenOut, amountIn)} icon={<ArrowRight size={16} />}>
                        Execute Recommended Swap
                      </Button>
                      <p style={{ marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
                        Signal: {tokenIn} → {tokenOut}{amountIn && ` (${amountIn})`}
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="market-analysis-fortare" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Button variant="secondary" size="lg" className="market-analysis-fortare-btn" onClick={() => onExecuteSwap(tokenIn, tokenOut, amountIn)} icon={<Zap size={18} />} title="Open position anyway, ignoring AI">
                      Force – Open position
                    </Button>
                    <p style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,193,7,0.85)', textAlign: 'center' }}>
                      AI: {signalStr.toUpperCase()}. You assume the risk.
                    </p>
                  </div>
                );
              })()}

              {payload?.dataProvenance && (
                <div className="market-analysis-data-used" style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                  <strong>Data used:</strong>{' '}
                  {[].concat(payload.dataProvenance?.sources || []).join(', ') || '—'}
                  {payload.dataProvenance?.candleCount != null && ` · ${payload.dataProvenance.candleCount} candles`}
                  {payload.dataProvenance?.asOf && ` · ${payload.dataProvenance.asOf}`}
                </div>
              )}

              {Array.isArray(payload?.drivers) && payload.drivers.length > 0 && (
                <div className="market-analysis-drivers" style={{ marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>
                  <strong>Drivers:</strong> {payload.drivers.join(' · ')}
                </div>
              )}

              {Array.isArray(payload?.warnings) && payload.warnings.length > 0 && (
                <div className="market-analysis-warnings" style={{ marginTop: '6px', padding: '6px 10px', background: 'rgba(255,193,7,0.06)', borderRadius: '6px', fontSize: '12px', color: 'rgba(255,193,7,0.95)' }}>
                  <strong>Warnings:</strong> {(payload.warnings || []).map(w => (w === 'data_insufficient_candles' ? 'Insufficient data (0 candles)' : w)).join(' · ')}
                </div>
              )}

              {Array.isArray(payload?.openAI?.limitations) && payload.openAI.limitations.length > 0 && (
                <div className="market-analysis-limitations" style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.25)', borderRadius: '6px', fontSize: '12px' }}>
                  <strong>Limitations:</strong>
                  <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
                    {payload.openAI.limitations.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(payload?.openAI?.risk_notes) && payload.openAI.risk_notes.length > 0 && (
                <div className="market-analysis-risk-notes" style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontSize: '12px', color: 'rgba(239,68,68,0.95)' }}>
                  <strong>Risk notes:</strong>
                  <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
                    {payload.openAI.risk_notes.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(payload?.openAI?.assumptions) && payload.openAI.assumptions.length > 0 && (
                <details className="market-analysis-assumptions">
                  <summary style={{ cursor: 'pointer', fontSize: '12px', color: 'var(--ds-text-secondary)' }}>Assumptions ({payload.openAI.assumptions.length})</summary>
                  <ul style={{ margin: '4px 0 0', paddingLeft: '18px', fontSize: '12px', color: 'var(--ds-text-secondary)' }}>
                    {payload.openAI.assumptions.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </details>
              )}

              {(payload?.reasoning) && (
                <div className="market-analysis-reasoning">
                  <span className="market-analysis-reasoning-label">Explanation:</span>
                  <p className="market-analysis-reasoning-text">{payload.reasoning}</p>
                </div>
              )}

              {(payload?.entryPrice !== undefined) && (
                <div className="market-analysis-entry-price">
                  <span className="market-analysis-entry-price-label">Entry Price:</span>
                  <span className="market-analysis-entry-price-value">
                    {payload.entryPrice != null && Number(payload.entryPrice) !== 0 ? formatCurrency(payload.entryPrice) : '—'}
                  </span>
                </div>
              )}

              {(payload?.stopLoss !== undefined) && (
                <div className="market-analysis-stop-loss">
                  <span className="market-analysis-stop-loss-label">Stop Loss:</span>
                  <span className="market-analysis-stop-loss-value">
                    {payload.stopLoss != null && Number(payload.stopLoss) !== 0 ? formatCurrency(payload.stopLoss) : '—'}
                  </span>
                </div>
              )}

              {(payload?.takeProfit !== undefined) && (
                <div className="market-analysis-take-profit">
                  <span className="market-analysis-take-profit-label">Take Profit:</span>
                  <span className="market-analysis-take-profit-value">
                    {payload.takeProfit != null && Number(payload.takeProfit) !== 0 ? formatCurrency(payload.takeProfit) : '—'}
                  </span>
                </div>
              )}

              </div>
            )}

            {/* Preview Mode Message */}
            {isPreviewMode && (
              <div style={{ 
                marginTop: '16px', 
                padding: '16px', 
                background: 'rgba(20, 241, 149, 0.1)', 
                border: '1px solid rgba(20, 241, 149, 0.3)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <p style={{ 
                  margin: 0, 
                  fontSize: '13px', 
                  color: '#14f195',
                  fontWeight: 500
                }}>
                  Register for OTA to execute recommended swaps
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
      )}
    </>
  );
};

export default MarketAnalysis;

