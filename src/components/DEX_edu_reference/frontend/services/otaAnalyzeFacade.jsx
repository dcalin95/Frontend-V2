/**
 * Fațadă pentru analiză piață: OpenAI (OTA) | Claude (Anthropic) | motor OTA fără LLM.
 * Nu modifică aiTradingApiService.jsx — importă analyzeMarket de acolo și rutează după preferință.
 */

import { analyzeMarket } from './aiTradingApiService';
import { postClaudeAnalyze } from './claudeApiService';
import {
  getOtaFuturesAnalyzeLlmMode,
  OTA_ANALYZE_LLM_WITH_OPENAI,
  OTA_ANALYZE_LLM_OTA_BITS_ONLY,
  OTA_ANALYZE_LLM_ANTHROPIC,
} from '../utils/otaAnalysisModePreference';
import { dispatchOtaLlmBillingRefresh } from '../utils/otaLlmBillingRefresh';
import { formatLedgerUsdDisplay } from '../utils/otaBillingUsdDisplay';

function toNum(x) {
  if (x == null || x === '') return null;
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function formatUsdBillingValue(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return `$${n.toFixed(2)}`;
}

function buildSeparateBillingMessage(providerLabel, billing, code) {
  const trial = formatUsdBillingValue(billing?.trialCreditUsd);
  const spent = formatLedgerUsdDisplay(billing?.spentCreditUsd) ?? formatUsdBillingValue(billing?.spentCreditUsd);
  const available = formatLedgerUsdDisplay(billing?.availableCreditUsd) ?? formatUsdBillingValue(billing?.availableCreditUsd);
  const headline =
    code === 'OTA_LLM_PROVIDER_PAUSED'
      ? `${providerLabel} analyze is paused for this wallet.`
      : `Separate ${providerLabel} credit required.`;
  const parts = [headline];
  if (trial || spent || available) {
    parts.push(`Trial ${trial || '—'} · spent ${spent || '—'} · available ${available || '—'}.`);
  }
  parts.push(
    code === 'OTA_LLM_PROVIDER_PAUSED'
      ? 'Resume the provider in billing controls or switch to OTA Engine.'
      : 'Switch to OTA Engine or add more credit to continue.',
  );
  return parts.join(' ');
}

function toBillingRequiredError(error, providerLabel) {
  const code = error?.code ?? error?.responseBody?.code;
  const billing =
    error?.billing && typeof error.billing === 'object'
      ? error.billing
      : error?.responseBody?.billing && typeof error.responseBody.billing === 'object'
        ? error.responseBody.billing
        : null;
  if (
    (code !== 'OTA_LLM_BILLING_CREDIT_REQUIRED' && code !== 'OTA_LLM_PROVIDER_PAUSED') ||
    !billing
  ) {
    return error;
  }
  const wrapped = new Error(buildSeparateBillingMessage(providerLabel, billing, code));
  wrapped.code = code;
  wrapped.billing = billing;
  wrapped.failedStatus = error?.failedStatus;
  wrapped.failedEndpoint = error?.failedEndpoint;
  wrapped.failedUrl = error?.failedUrl;
  wrapped.responseBody = error?.responseBody;
  wrapped.provider = providerLabel;
  wrapped.cause = error;
  return wrapped;
}

export function getSeparateBillingErrorDetails(error) {
  const code = error?.code ?? error?.responseBody?.code;
  const billing =
    error?.billing && typeof error.billing === 'object'
      ? error.billing
      : error?.responseBody?.billing && typeof error.responseBody.billing === 'object'
        ? error.responseBody.billing
        : null;
  if (
    (code !== 'OTA_LLM_BILLING_CREDIT_REQUIRED' && code !== 'OTA_LLM_PROVIDER_PAUSED') ||
    !billing
  ) {
    return null;
  }
  const providerLabel = String(error?.provider || error?.responseBody?.provider || 'Provider').trim() || 'Provider';
  return {
    code,
    providerLabel,
    billing,
    message: buildSeparateBillingMessage(providerLabel, billing, code),
  };
}

/**
 * Mapează răspunsul POST /api/claude/analyze la un obiect apropiat de OTA analyze (pentru MarketAnalysis).
 * @param {unknown} apiJson
 */
export function mapClaudeAnalyzeResponseToOtaShape(apiJson) {
  const analysis =
    apiJson && typeof apiJson === 'object' && apiJson.analysis != null && typeof apiJson.analysis === 'object'
      ? apiJson.analysis
      : {};
  const signalStr = String(analysis.signal || 'HOLD').toUpperCase();
  const reasoning = typeof analysis.reasoning === 'string' ? analysis.reasoning : '';
  const confidence = toNum(analysis.confidence);
  const stopLoss = toNum(analysis.stopLoss);
  const target = toNum(analysis.target);
  const risk = analysis.risk != null ? String(analysis.risk) : '';
  const direction = signalStr === 'BUY' || signalStr === 'SELL' ? signalStr : 'HOLD';
  return {
    success: true,
    provider:
      (apiJson && typeof apiJson === 'object' && apiJson.provider) || 'anthropic-claude-sonnet',
    billing:
      apiJson && typeof apiJson === 'object' && apiJson.billing && typeof apiJson.billing === 'object'
        ? apiJson.billing
        : null,
    tokenUsage:
      apiJson && typeof apiJson === 'object' && apiJson.tokenUsage && typeof apiJson.tokenUsage === 'object'
        ? apiJson.tokenUsage
        : null,
    signal: {
      direction,
      entryPrice: target,
      takeProfit: target,
      stopLoss,
      confidence: confidence != null ? confidence : null,
      reasoning,
      risk,
      analysisSource: 'anthropic_claude_sonnet',
      billing:
        apiJson && typeof apiJson === 'object' && apiJson.billing && typeof apiJson.billing === 'object'
          ? apiJson.billing
          : null,
      tokenUsage:
        apiJson && typeof apiJson === 'object' && apiJson.tokenUsage && typeof apiJson.tokenUsage === 'object'
          ? apiJson.tokenUsage
          : null,
    },
    reasoning,
  };
}

function normalizeEngineNoOpenAiAnalyzeResponse(out) {
  if (!out || typeof out !== 'object') return out;
  const signal = out.signal && typeof out.signal === 'object'
    ? {
        ...out.signal,
        originalAnalysisSource:
          out.signal.originalAnalysisSource != null
            ? out.signal.originalAnalysisSource
            : out.signal.analysisSource != null
              ? String(out.signal.analysisSource)
              : undefined,
        analysisSource: 'engine_no_openai',
      }
    : out.signal;
  return {
    ...out,
    originalAnalysisSource:
      out.originalAnalysisSource != null
        ? out.originalAnalysisSource
        : out.analysisSource != null
          ? String(out.analysisSource)
          : undefined,
    analysisSource: 'engine_no_openai',
    signal,
  };
}

/**
 * Înlocuitor pentru apelurile directe la analyzeMarket când vrei respectarea comutatorului LLM (OpenAI | Claude | OTA motor).
 * @param {string} token
 * @param {Parameters<typeof analyzeMarket>[1] & { analyzeLlmMode?: string }} options
 */
export async function analyzeMarketWithLlmProvider(token, options = {}) {
  const mode =
    options.analyzeLlmMode === OTA_ANALYZE_LLM_WITH_OPENAI ||
    options.analyzeLlmMode === OTA_ANALYZE_LLM_OTA_BITS_ONLY ||
    options.analyzeLlmMode === OTA_ANALYZE_LLM_ANTHROPIC
      ? options.analyzeLlmMode
      : getOtaFuturesAnalyzeLlmMode();
  if (mode === OTA_ANALYZE_LLM_ANTHROPIC) {
    const tradeData = {
      token: String(token),
      quoteToken: options.quoteToken || 'USDT',
      userId: options.userId ?? null,
      marketData: options.marketData ?? null,
      amountIn: options.amountIn ?? null,
      recentOutcomes: options.recentOutcomes ?? null,
      tradeContext: options.tradeContext ?? null,
    };
    try {
      const raw = await postClaudeAnalyze(tradeData);
      const out = mapClaudeAnalyzeResponseToOtaShape(raw);
      dispatchOtaLlmBillingRefresh();
      return out;
    } catch (error) {
      throw toBillingRequiredError(error, 'Claude');
    }
  }
  const engineNoOpenAi = mode === OTA_ANALYZE_LLM_OTA_BITS_ONLY;
  try {
    const out = await analyzeMarket(token, { ...options, engineNoOpenAi });
    if (!engineNoOpenAi) {
      dispatchOtaLlmBillingRefresh();
    }
    return engineNoOpenAi ? normalizeEngineNoOpenAiAnalyzeResponse(out) : out;
  } catch (error) {
    throw toBillingRequiredError(error, 'OpenAI');
  }
}
