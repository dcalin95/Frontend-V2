/**
 * OTAOpenAIConnectionStatus – UI indicator: OpenAI API connected or not.
 * Uses GET /ai-trading/ready (checks.circuitBreaker). Proof: "Checked at HH:MM:SS".
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, RefreshCw, Sparkles } from 'lucide-react';
import { getApiBaseUrl, API_ENDPOINTS } from '../../../config/apiEndpoints.js';
import '../../styles/components/ota-openai-connection-status.css';

function formatTime(ts) {
  if (!ts || !Number.isFinite(ts)) return '—';
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function OTAOpenAIConnectionStatus() {
  const [status, setStatus] = useState(null); // null = loading, 'connected' | 'disconnected'
  const [lastCheck, setLastCheck] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const check = useCallback(async () => {
    try {
      const url = `${getApiBaseUrl()}${API_ENDPOINTS.OTA_READY}`;
      const res = await fetch(url, { method: 'GET', credentials: 'include' });
      const data = res.ok ? await res.json().catch(() => ({})) : {};
      const cb = data?.checks?.circuitBreaker;
      const connected = res.ok && cb !== 'OPEN';
      setStatus(connected ? 'connected' : 'disconnected');
      setLastCheck(Date.now());
      setError(res.ok ? null : (data?.error || `HTTP ${res.status}`));
    } catch (e) {
      setStatus('disconnected');
      setError(e?.message || 'Check error');
      setLastCheck(Date.now());
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await check();
    setRefreshing(false);
  };

  return (
    <div className="ota-openai-connection-status" role="status" aria-live="polite">
      <div className="ota-openai-connection-status__row">
      <div className={`ota-openai-connection-status__pill ota-openai-connection-status__pill--${status === 'connected' ? 'on' : 'off'}`}>
        {status === null ? (
          <>
            <Sparkles size={16} className="ota-openai-connection-status__ai-icon" aria-hidden />
            <span className="ota-openai-connection-status__label">OpenAI API: checking…</span>
          </>
        ) : status === 'connected' ? (
          <>
            <CheckCircle size={18} aria-hidden />
            <span className="ota-openai-connection-status__label">OpenAI API: Connected</span>
          </>
        ) : (
          <>
            <XCircle size={18} aria-hidden />
            <span className="ota-openai-connection-status__label">OpenAI (analysis/auto): circuit breaker open</span>
          </>
        )}
      </div>
      {(lastCheck || error) && (
        <span className="ota-openai-connection-status__proof">
          {error ? `Error: ${error}` : `Checked at ${formatTime(lastCheck)}`}
        </span>
      )}
      <button
        type="button"
        className="ota-openai-connection-status__refresh"
        onClick={handleRefresh}
        disabled={refreshing}
        title="Refresh OpenAI status"
        aria-label="Refresh OpenAI status"
      >
        <RefreshCw size={14} className={refreshing ? 'spinning' : ''} />
        Refresh
      </button>
      </div>
      {status === 'disconnected' && (
        <div className="ota-openai-connection-status__why" role="region" aria-label="Circuit breaker explanation">
          <strong>What it means:</strong> The circuit breaker is open for <em>market analysis</em> and <em>auto flows</em>. The backend stopped these calls after consecutive errors.
          <strong className="ota-openai-connection-status__why-fix">OpenAI Chat (<Link to="/dex-edu/ota/chat" className="ota-openai-connection-status__link">/dex-edu/ota/chat</Link>) can still respond</strong> – it uses the same API. For SEI analysis and auto: on the OTA page → <em>OTA Access Control</em> → <strong>Reset Circuit</strong>. Check backend: <code>OPENAI_API_KEY</code>, quota, rate limit; in logs: 429, 401, 5xx.
        </div>
      )}
    </div>
  );
}

export default OTAOpenAIConnectionStatus;
