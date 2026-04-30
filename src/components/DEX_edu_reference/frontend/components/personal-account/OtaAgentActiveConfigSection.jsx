/**
 * "OTA Agent - Active configuration" section: server data for intervals, tokens, OpenAI + Claude/Anthropic budgets.
 * Compact cards with visual variants for engine, OpenAI, Anthropic, and costs.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { getApiBaseUrl, API_ENDPOINTS } from '../../../config/apiEndpoints.js';
import { parseOtaTradingReadyPayload } from '../../utils/otaReadyOpenAiLlm';

function formatDurationMs(raw) {
  if (raw == null || raw === '') return '—';
  const n = parseInt(String(raw).replace(/\s/g, ''), 10);
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n === 0) return '0 s';
  if (n < 1000) return `${n} ms`;
  if (n < 60_000) return `${Math.round(n / 1000)} s`;
  const min = n / 60_000;
  if (min < 120) return `${min % 1 === 0 ? String(min) : min.toFixed(1)} min`;
  const h = n / 3_600_000;
  return `${h % 1 === 0 ? String(h) : h.toFixed(1)} h`;
}

function parseEnvBool(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim().toLowerCase();
  if (s === 'true' || s === '1' || s === 'yes') return true;
  if (s === 'false' || s === '0' || s === 'no') return false;
  return null;
}

/** USD displayed with API source; negative without tilde, positive with ~ estimate. */
function fmtUsd(n) {
  if (n == null || !Number.isFinite(Number(n))) return '—';
  const v = Number(n);
  const abs = Math.abs(v).toFixed(2);
  if (v < 0) return `−$${abs}`;
  return `~$${abs}`;
}

/**
 * @param {{
 *   variant: 'motor' | 'openai' | 'anthropic' | 'cost',
 *   label: string,
 *   value: React.ReactNode,
 *   meta?: string,
 *   metaExtra?: string,
 *   valueClassName?: string,
 * }} props
 */
function OtaConfigCard({ variant, label, value, meta, metaExtra, valueClassName = '' }) {
  return (
    <div className={`ota-agent-config-card ota-agent-config-card--${variant}`}>
      <div className="ota-agent-config-card__label">{label}</div>
      <div className={`ota-agent-config-card__value ${valueClassName}`.trim()}>{value}</div>
      {meta != null && meta !== '' && <div className="ota-agent-config-card__meta">{meta}</div>}
      {metaExtra != null && metaExtra !== '' && (
        <div className="ota-agent-config-card__meta ota-agent-config-card__meta--extra">{metaExtra}</div>
      )}
    </div>
  );
}

/**
 * @param {{ bar: 'motor' | 'openai' | 'anthropic' | 'cost', children: React.ReactNode }} props
 */
function OtaConfigSubheading({ bar, children }) {
  return (
    <h3 className="ota-agent-config__sub">
      <span className={`ota-agent-config__sub-bar ota-agent-config__sub-bar--${bar}`} aria-hidden />
      {children}
    </h3>
  );
}

/**
 * @param {{ walletAddress?: string | null }} props
 */
export default function OtaAgentActiveConfigSection({ walletAddress = null }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payload, setPayload] = useState(null);

  const load = useCallback(async () => {
    if (!walletAddress) return;
    setLoading(true);
    setError(null);
    const base = getApiBaseUrl();
    if (!base) {
      setError('Missing API base (runtime-config / env).');
      setLoading(false);
      return;
    }

    const urls = {
      env: `${base}${API_ENDPOINTS.OTA_ENV_CHECK}`,
      tracked: `${base}${API_ENDPOINTS.OTA_TRACKED_TOKENS_GET}`,
      ready: `${base}${API_ENDPOINTS.OTA_READY}`,
      openAiBudget: `${base}${API_ENDPOINTS.OTA_OPENAI_PLATFORM_BUDGET}`,
      claude: `${base}${API_ENDPOINTS.CLAUDE_BUDGET}`,
    };

    try {
      const [resEnv, resTrack, resReady, resOb, resClaude] = await Promise.all([
        fetch(urls.env, { method: 'GET', credentials: 'include', cache: 'no-store' }),
        fetch(urls.tracked, { method: 'GET', credentials: 'include', cache: 'no-store' }),
        fetch(urls.ready, { method: 'GET', credentials: 'include', cache: 'no-store' }),
        fetch(urls.openAiBudget, { method: 'GET', credentials: 'include', cache: 'no-store' }),
        fetch(urls.claude, { method: 'GET', credentials: 'include', cache: 'no-store' }),
      ]);

      const envJson = await resEnv.json().catch(() => ({}));
      const trackJson = await resTrack.json().catch(() => ({}));
      const readyJson = await resReady.json().catch(() => ({}));
      const obJson = await resOb.json().catch(() => ({}));
      const claudeJson = await resClaude.json().catch(() => ({}));

      const vars = envJson && envJson.vars && typeof envJson.vars === 'object' ? envJson.vars : {};
      const symbols = Array.isArray(trackJson.symbols) ? trackJson.symbols : [];
      const readySnap = parseOtaTradingReadyPayload(readyJson);

      setPayload({
        vars,
        tracked: {
          symbols,
          source: trackJson.source || null,
          fetchOk: resTrack.ok && trackJson.success !== false,
        },
        ready: { raw: readyJson, snap: readySnap, httpOk: resReady.ok },
        openAiBudget: { ok: resOb.ok && obJson.ok !== false, json: obJson, status: resOb.status },
        claude: { ok: resClaude.ok && claudeJson.ok !== false, json: claudeJson, status: resClaude.status },
        fetchedAt: new Date(),
      });
    } catch (e) {
      setError(e?.message || String(e));
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) load();
  }, [walletAddress, load]);

  if (!walletAddress) return null;

  const v = payload?.vars || {};
  const monMs = v.OTA_MONITORING_INTERVAL_MS;
  const minAnalysisMs = v.OTA_MIN_ANALYSIS_INTERVAL_MS;
  const decidesRaw = v.OTA_OPENAI_DECIDES_SIGNAL;
  const decidesParsed = parseEnvBool(decidesRaw);
  const openaiModel = v.OPENAI_MODEL;
  const anthropicModelEnv = v.ANTHROPIC_MODEL;

  const snap = payload?.ready?.snap;
  const ob = payload?.openAiBudget?.json;
  const cl = payload?.claude?.json;

  const symbols = payload?.tracked?.symbols || [];
  const preview = symbols.slice(0, 8).join(', ');
  const more = symbols.length > 8 ? ` +${symbols.length - 8}` : '';

  const decidesValue =
    decidesParsed === true ? (
      <span className="ota-agent-config-card__value--on">ON</span>
    ) : decidesParsed === false ? (
      <span className="ota-agent-config-card__value--off">OFF</span>
    ) : (
      '—'
    );

  const openAiKeyLine = (
    <>
      {snap?.openaiKeyConfigured === true ? 'Key set' : snap?.openaiKeyConfigured === false ? 'No key' : '—'}
      <span style={{ opacity: 0.5 }}> · </span>
      <span className={snap?.openaiLlmEnabled === true ? 'ota-agent-config-card__value--on' : 'ota-agent-config-card__value--off'}>
        LLM {snap?.openaiLlmEnabled === true ? 'ON' : snap?.openaiLlmEnabled === false ? 'OFF' : '—'}
      </span>
    </>
  );

  /** Aligned with OpenAI "Key + LLM": key + Live from GET /api/claude/budget -> llmEnabled. */
  const anthropicKeyLine = (() => {
    if (cl == null) return '—';
    if (cl.keyConfigured === false) {
      return (
        <>
          <span className="ota-agent-config-card__value--off">No key</span>
          <span style={{ opacity: 0.5 }}> · </span>
          <span className="ota-agent-config-card__value--off">Off</span>
        </>
      );
    }
    if (cl.keyConfigured === true) {
      const off = cl.llmEnabled === false;
      return (
        <>
          Key set
          <span style={{ opacity: 0.5 }}> · </span>
          <span className={off ? 'ota-agent-config-card__value--off' : 'ota-agent-config-card__value--on'}>
            {off ? 'Off' : 'Live'}
          </span>
        </>
      );
    }
    return '—';
  })();

  return (
    <section className="personal-account-section ota-agent-config" role="region" aria-label="OTA Agent configuration">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h2 className="personal-account-section-title" style={{ marginBottom: 0 }}>
          OTA Agent - Active configuration
        </h2>
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          className="personal-account-page-btn personal-account-page-btn-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '6px 10px' }}
        >
          <RefreshCw size={13} aria-hidden style={{ opacity: loading ? 0.6 : 1 }} />
          Reload
        </button>
      </div>

      {error && (
        <p style={{ color: '#f87171', fontSize: 12, marginTop: 8 }} role="alert">
          {error}
        </p>
      )}

      {loading && !payload && (
        <p style={{ fontSize: 12, color: 'var(--ds-text-tertiary)', marginTop: 8 }}>Loading configuration...</p>
      )}

      <OtaConfigSubheading bar="motor">Engine &amp; timing</OtaConfigSubheading>
      <div className="ota-agent-config__grid">
        <OtaConfigCard
          variant="motor"
          label="Monitoring cycle"
          value={formatDurationMs(monMs)}
          meta="OTA_MONITORING_INTERVAL_MS · /ota-env-check"
        />
        <OtaConfigCard
          variant="motor"
          label="Min. analysis interval"
          value={formatDurationMs(minAnalysisMs)}
          meta="OTA_MIN_ANALYSIS_INTERVAL_MS"
        />
        <OtaConfigCard
          variant="motor"
          label="Tracked tokens"
          value={symbols.length || '—'}
          valueClassName={symbols.length ? 'ota-agent-config-card__value--lg' : ''}
          meta={symbols.length ? `${preview}${more}` : undefined}
          metaExtra={`Source: ${payload?.tracked?.source || '—'} · /tracked-tokens`}
        />
        <OtaConfigCard variant="motor" label="OpenAI decides signal" value={decidesValue} meta="OTA_OPENAI_DECIDES_SIGNAL" />
      </div>

      <OtaConfigSubheading bar="openai">OpenAI</OtaConfigSubheading>
      <div className="ota-agent-config__grid">
        <OtaConfigCard
          variant="openai"
          label="Model (inference)"
          value={openaiModel || '—'}
          meta="OPENAI_MODEL · /ota-env-check"
        />
        <OtaConfigCard
          variant="openai"
          label="Key + LLM"
          value={openAiKeyLine}
          meta={`GET /ai-trading/ready${snap?.circuitBreaker ? ` · circuit ${snap.circuitBreaker}` : ''}`}
        />
      </div>

      <OtaConfigSubheading bar="anthropic">Claude (Anthropic)</OtaConfigSubheading>
      <div className="ota-agent-config__grid">
        <OtaConfigCard
          variant="anthropic"
          label="Model (server)"
          value={(cl && cl.model) || anthropicModelEnv || '—'}
          meta="GET /api/claude/budget · ANTHROPIC_MODEL"
        />
        <OtaConfigCard
          variant="anthropic"
          label="Key + Live"
          value={anthropicKeyLine}
          meta="GET /api/claude/budget · llmEnabled (key + optional OTA_ANTHROPIC_LLM_ENABLED)"
        />
        <OtaConfigCard
          variant="anthropic"
          label="Org spend ~30 days"
          value={<span className="ota-agent-config-card__value--lg">{fmtUsd(cl?.costUsdLast30d)}</span>}
          meta={cl?.costReportError ? String(cl.costReportError) : 'Costs API if ANTHROPIC_ADMIN_API_KEY is set'}
        />
      </div>

      <OtaConfigSubheading bar="cost">Costs (OpenAI Platform)</OtaConfigSubheading>
      <div className="ota-agent-config__grid">
        <OtaConfigCard
          variant="cost"
          label="Org spend (MTD UTC)"
          value={<span className="ota-agent-config-card__value--lg">{fmtUsd(ob?.monthSpendUsd)}</span>}
          meta="monthSpendUsd"
        />
        <OtaConfigCard
          variant="cost"
          label="OTA analyses estimate (DB)"
          value={<span className="ota-agent-config-card__value--lg">{fmtUsd(ob?.otaAnalysesEstimatedUsdMtd)}</span>}
          meta="otaAnalysesEstimatedUsdMtd"
        />
        <OtaConfigCard
          variant="cost"
          label="Credit prepay"
          value={<span className="ota-agent-config-card__value--lg">{fmtUsd(ob?.prepaidAvailableUsd)}</span>}
          meta="prepaidAvailableUsd"
        />
      </div>

      <div className="ota-agent-config__links">
        <a className="ota-agent-config__link ota-agent-config__link--openai" href="https://platform.openai.com/usage" target="_blank" rel="noopener noreferrer">
          <ExternalLink size={11} aria-hidden />
          OpenAI Usage
        </a>
        <a className="ota-agent-config__link ota-agent-config__link--ft" href="https://platform.openai.com/finetune" target="_blank" rel="noopener noreferrer">
          <ExternalLink size={11} aria-hidden />
          Fine-Tuning
        </a>
        <a
          className="ota-agent-config__link ota-agent-config__link--bill-oai"
          href="https://platform.openai.com/settings/organization/billing/overview"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink size={11} aria-hidden />
          OpenAI Billing
        </a>
        <a
          className="ota-agent-config__link ota-agent-config__link--anthropic"
          href={cl?.billingConsoleUrl || 'https://console.anthropic.com/settings/billing'}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink size={11} aria-hidden />
          Anthropic Billing
        </a>
        <a className="ota-agent-config__link ota-agent-config__link--anthropic-soft" href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">
          <ExternalLink size={11} aria-hidden />
          Anthropic Console
        </a>
      </div>

      <p className="ota-agent-config__footer">
        Sources: <code>/api/ai-trading/ota-env-check</code>, <code>/tracked-tokens</code>, <code>/ready</code>, <code>/openai-platform-budget</code>,{' '}
        <code>/api/claude/budget</code>. Env on Render → redeploy. Updated:{' '}
        {payload?.fetchedAt ? payload.fetchedAt.toLocaleString('en-US') : '—'}.
      </p>
      {decidesRaw != null && decidesParsed === null && (
        <p style={{ fontSize: 10, color: '#fb923c', marginTop: 6 }}>
          OTA_OPENAI_DECIDES_SIGNAL nestandard: {String(decidesRaw)}
        </p>
      )}
    </section>
  );
}
