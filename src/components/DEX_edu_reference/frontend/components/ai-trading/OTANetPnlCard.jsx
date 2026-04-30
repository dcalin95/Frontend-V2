/**
 * OTANetPnlCard – afișează PnL salvat (suma din tranzacțiile închise OTA), același sens ca hero în AutoTradePanel.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { getTrades } from '../../services/executionApiService';
import { getProfitSummary } from '../../services/performanceApiService';
import '../../styles/components/grid-trading-panel.css';

export default function OTANetPnlCard({ walletAddress }) {
  const [loading, setLoading] = useState(true);
  const [profitEfectiv, setProfitEfectiv] = useState(0);
  const [tradesCount, setTradesCount] = useState(0);

  const fetchOtaPnl = useCallback(async () => {
    if (!walletAddress) {
      setProfitEfectiv(0);
      setTradesCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [profitRes, tradesRes] = await Promise.all([
        getProfitSummary(walletAddress),
        getTrades(walletAddress, { limit: 50 })
      ]);
      const pnlInregistrat = profitRes?.totalProfitUsd ?? (Number(profitRes?.fromExecutions ?? 0) + Number(profitRes?.fromDirectEntry ?? 0));
      let gross = Number.isFinite(pnlInregistrat) ? Number(pnlInregistrat) : 0;
      const raw = Array.isArray(tradesRes?.trades) ? tradesRes.trades : [];
      const otaOnly = raw.filter(
        t => t.source === 'ota_auto' || t.execution_mode === 'ota_auto' || t.execution_mode === 'auto'
      );
      const seenTx = new Set();
      const deduped = otaOnly.filter(t => {
        const tx = t.txHash || t.transaction_hash;
        if (tx && seenTx.has(tx)) return false;
        if (tx) seenTx.add(tx);
        return true;
      });
      setTradesCount(deduped.length);
      if (gross === 0 && deduped.length > 0) {
        const sumFromTrades = deduped.reduce((acc, t) => {
          const p = t.profitUsd ?? t.profit_usd ?? t.pnl ?? t.pnlUsd ?? t.pnl_usd ?? null;
          if (p == null) return acc;
          const n = Number(p);
          return acc + (Number.isFinite(n) ? (n >= 1e12 ? n / 1e18 : n) : 0);
        }, 0);
        if (Number.isFinite(sumFromTrades) && sumFromTrades !== 0) gross = sumFromTrades;
      }
      setProfitEfectiv(gross);
    } catch {
      setProfitEfectiv(0);
      setTradesCount(0);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchOtaPnl();
    const id = setInterval(fetchOtaPnl, 30000);
    return () => clearInterval(id);
  }, [fetchOtaPnl]);

  if (!walletAddress) return null;

  const displayValue = Number.isFinite(profitEfectiv) ? profitEfectiv : 0;
  const pnlColor = displayValue > 0 ? '#22c55e' : displayValue < 0 ? '#ef4444' : '#888';
  const pnlIcon = displayValue >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />;

  return (
    <div className="ota-net-pnl-card grid-trading-panel__stats" role="region" aria-label="OTA Profit">
      {loading ? (
        <div className="grid-trading-panel__pnl-banner" style={{ gridColumn: '1 / -1' }}>
          <span className="grid-trading-panel__pnl-label">Loading…</span>
        </div>
      ) : (
        <>
          <div className="grid-trading-panel__pnl-banner" style={{ borderColor: pnlColor }}>
            <div className="grid-trading-panel__pnl-row">
              <span style={{ color: pnlColor }}>{pnlIcon}</span>
              <span className="grid-trading-panel__pnl-label">Profit</span>
              <span className="grid-trading-panel__pnl-value" style={{ color: pnlColor }}>
                {displayValue >= 0 ? '+' : ''}{displayValue.toFixed(2)} USD
              </span>
            </div>
            {tradesCount > 0 && (
              <div className="grid-trading-panel__pnl-details">
                <span>{tradesCount} tranzacții</span>
              </div>
            )}
          </div>
          <div className="grid-trading-panel__stat">
            <Activity size={14} />
            <span>{tradesCount} trades</span>
          </div>
        </>
      )}
    </div>
  );
}
