/**
 * OTA panel: price sources, open position PnL, optional on-demand advice.
 * Price: Binance (primary), CoinGecko, PancakeSwap (fallback).
 * @module LLMMonitoringPanel
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, TrendingUp, ExternalLink, Info, MessageCircle, RefreshCw } from 'lucide-react';
import { useOTAAccess } from '../../hooks/useOTAAccess';
import { getDirectEntryPosition, getDirectEntryAdvice } from '../../services/aiTradingApiService';
import { formatNumber } from '../../utils/formatters';
import '../../styles/components/llm-monitoring-panel.css';

const PRICE_SOURCES = [
  { id: 'binance', label: 'Binance', desc: 'Primary – klines, ticker' },
  { id: 'coingecko', label: 'CoinGecko', desc: 'Fallback – price, 24h' },
  { id: 'pancakeswap', label: 'PancakeSwap', desc: 'On-chain BSC price' }
];

const LLMMonitoringPanel = ({ token, className = '' }) => {
  const { walletAddress } = useOTAAccess();
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState(null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  const fetchPosition = React.useCallback(async (isInitial = false) => {
    if (!walletAddress) {
      setPosition(null);
      return;
    }
    if (isInitial) setLoading(true);
    try {
      const pos = await getDirectEntryPosition(walletAddress);
      const openList = Array.isArray(pos) ? pos.filter(p => p && p.status === 'open') : [];
      setPosition(openList.length > 0 ? openList[0] : null);
    } catch {
      setPosition(null);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchPosition(true);
    if (!walletAddress) return;
    const interval = setInterval(() => fetchPosition(false), 15000);
    return () => clearInterval(interval);
  }, [fetchPosition, walletAddress]);

  const fetchAdvice = useCallback(async () => {
    if (!walletAddress) return;
    setAdviceLoading(true);
    try {
      const data = await getDirectEntryAdvice(walletAddress);
      setAdvice(data);
    } catch {
      setAdvice(null);
    } finally {
      setAdviceLoading(false);
    }
  }, [walletAddress]);

  return (
    <div className={`llm-monitoring-panel ${className}`} role="region" aria-label="OTA price and position">
      <div className="llm-monitoring-panel-header">
        <BarChart2 size={18} className="llm-monitoring-panel-icon" aria-hidden />
        <span className="llm-monitoring-panel-title">OTA · Price &amp; position</span>
      </div>
      <p className="llm-monitoring-section-desc" style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--ds-text-secondary, rgba(255,255,255,0.65))' }}>
        Live market data and P&amp;L. LLM advice only appears when you request it below.
      </p>
      <div className="llm-monitoring-panel-body">
        <section className="llm-monitoring-section">
          <h5 className="llm-monitoring-section-title">
            <Info size={14} aria-hidden />
            Price source
          </h5>
          <p className="llm-monitoring-section-desc">
            Price for {token || 'selected token'}/USDT comes from:
          </p>
          <ul className="llm-monitoring-sources">
            {PRICE_SOURCES.map((s) => (
              <li key={s.id}>
                <span className="llm-monitoring-source-label">{s.label}</span>
                <span className="llm-monitoring-source-desc">{s.desc}</span>
              </li>
            ))}
          </ul>
        </section>

        {!loading && position && (
          <section className="llm-monitoring-section llm-monitoring-section-position">
            <h5 className="llm-monitoring-section-title">
              <TrendingUp size={14} aria-hidden />
              Position P&amp;L
            </h5>
            <div className="llm-monitoring-pnl-row">
              <span className="llm-monitoring-pnl-label">Token</span>
              <span className="llm-monitoring-pnl-value">{position.token || token || '—'}</span>
            </div>
            {(position.currentPrice != null || position.pnl != null) && (
              <div className="llm-monitoring-pnl-row">
                <span className="llm-monitoring-pnl-label">Current / P&amp;L</span>
                <span className={`llm-monitoring-pnl-value llm-monitoring-pnl ${Number(position.pnl || 0) >= 0 ? 'positive' : 'negative'}`}>
                  {position.currentPrice != null ? `$${formatNumber(position.currentPrice, 4)} ` : ''}
                  {position.pnl != null && `${Number(position.pnl) >= 0 ? '+' : ''}${formatNumber(position.pnl, 2)} USD`}
                </span>
              </div>
            )}
          </section>
        )}

        <section className="llm-monitoring-section llm-monitoring-section-tips">
          <h5 className="llm-monitoring-section-title">
            <MessageCircle size={14} aria-hidden />
            On-demand advice
          </h5>
          {position && (
            <>
              <button
                type="button"
                className="llm-monitoring-advice-btn"
                onClick={fetchAdvice}
                disabled={adviceLoading}
                aria-label="Get LLM advice for open position"
              >
                {adviceLoading ? <RefreshCw size={14} className="spin" aria-hidden /> : <RefreshCw size={14} aria-hidden />}
                <span>{adviceLoading ? 'Loading…' : 'Get advice for position'}</span>
              </button>
              {advice?.hasPosition && (advice.advice || advice.signal) && (
                <div className="llm-monitoring-advice-block">
                  {advice.signal && (
                    <p className="llm-monitoring-advice-signal">
                      Signal: <strong>{String(advice.signal).toUpperCase()}</strong>
                      {advice.token && ` (${advice.token})`}
                    </p>
                  )}
                  {advice.advice && (
                    <p className="llm-monitoring-advice-text">{advice.advice}</p>
                  )}
                  <p className="llm-monitoring-advice-provenance" role="status" aria-label="Data provenance">
                    Signal: OTA Engine (market data) • Explanation: OpenAI when used
                  </p>
                </div>
              )}
            </>
          )}
          <p className="llm-monitoring-tips-desc">
            OTA learns from your activity (manual, Direct Entry, Auto). Open <strong>Advisory</strong> and run <strong>Analyze Market</strong> for a full Live Analysis card.
          </p>
          <p className="llm-monitoring-tips-desc" style={{ marginTop: '6px', fontSize: '12px' }}>
            <strong>Who decides?</strong> Advisory → Analyze Market → check the product label (OpenAI, Claude, or OTA Engine) and expand <strong>Technical details</strong> for raw <code>analysisSource</code>.
          </p>
          <Link to="/dex-edu/ota?mode=advisory#ota-advisory-analyze" className="llm-monitoring-tips-link">
            <ExternalLink size={12} aria-hidden />
            Open Advisory — Live Analysis
          </Link>
        </section>
      </div>
    </div>
  );
};

export default React.memo(LLMMonitoringPanel);
