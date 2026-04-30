/**
 * OpenPositionPnLStrip – banda sub Header, sub butonul Personal Account.
 * Afișează Profit: +X.XX USD (verde) sau Loss: -X.XX USD (roșu) dinamic când există poziție Direct Entry.
 * @module OpenPositionPnLStrip
 */

import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useOTAAccess } from '../../hooks/useOTAAccess';
import { getDirectEntryPosition, getOTAMarketData } from '../../services/aiTradingApiService';
import { formatNumber } from '../../utils/formatters';
import '../../styles/components/open-position-pnl-strip.css';

const TOKEN_DECIMALS = 18;
function toHumanAmount(raw, decimals = TOKEN_DECIMALS) {
  const n = parseFloat(raw);
  if (n == null || !Number.isFinite(n)) return raw;
  if (n >= 1e12) return n / Math.pow(10, decimals);
  return n;
}

export default function OpenPositionPnLStrip() {
  const { walletAddress } = useOTAAccess();
  const [positions, setPositions] = useState([]);
  const [livePrices, setLivePrices] = useState({});

  const fetchPosition = useCallback(async () => {
    if (!walletAddress) {
      setPositions([]);
      return;
    }
    try {
      const pos = await getDirectEntryPosition(walletAddress);
      const openList = Array.isArray(pos) ? pos.filter(p => p && p.status === 'open') : [];
      setPositions(openList);
    } catch (_) {
      setPositions([]);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchPosition();
    const interval = setInterval(fetchPosition, 15000);
    return () => clearInterval(interval);
  }, [fetchPosition]);

  const tokens = positions.map(p => p.token).filter(Boolean);
  useEffect(() => {
    if (tokens.length === 0) {
      setLivePrices({});
      return;
    }
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      const next = {};
      for (const t of tokens) {
        try {
          const r = await getOTAMarketData(t, 'USDT');
          const p = r?.marketData?.price ?? r?.price ?? null;
          if (p != null) next[t] = Number(p);
        } catch (_) {}
      }
      if (!cancelled && Object.keys(next).length > 0) setLivePrices(prev => ({ ...prev, ...next }));
    };
    tick();
    /** AGENTS.md pct. 16: poll GET /api/ai-trading/market ≥ 5s; 8s aliniat feed OTA */
    const interval = setInterval(tick, 8000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [tokens.join(',')]);

  useEffect(() => {
    const onOpened = () => fetchPosition();
    window.addEventListener('ota-direct-entry-opened', onOpened);
    return () => window.removeEventListener('ota-direct-entry-opened', onOpened);
  }, [fetchPosition]);

  if (!walletAddress || positions.length === 0) return null;

  let totalPnlUsd = 0;
  for (const position of positions) {
    const entryPrice = position.entryPrice != null ? parseFloat(position.entryPrice) : null;
    const amountHuman = toHumanAmount(position.amountOut ?? position.amountUsd ?? 0);
    const displayPrice = livePrices[position.token] != null ? livePrices[position.token] : (position.currentPrice != null ? parseFloat(position.currentPrice) : null);
    if (entryPrice != null && displayPrice != null && amountHuman != null) {
      totalPnlUsd += (displayPrice - entryPrice) * amountHuman;
    } else if (position.pnl != null && Number.isFinite(parseFloat(position.pnl))) {
      totalPnlUsd += parseFloat(position.pnl);
    }
  }
  const isProfit = totalPnlUsd >= 0;

  return (
    <div className="open-position-pnl-strip-wrap">
      <div className="open-position-pnl-strip" role="status" aria-live="polite">
        <span className="open-position-pnl-strip-label">{positions.length > 1 ? 'Profit (total)' : 'Profit'}</span>
        <span className={`open-position-pnl-strip-value ${isProfit ? 'positive' : 'negative'}`}>
          {isProfit ? <TrendingUp size={14} aria-hidden className="open-position-pnl-strip-icon" /> : <TrendingDown size={14} aria-hidden className="open-position-pnl-strip-icon" />}
          <span className="open-position-pnl-strip-number">
            {totalPnlUsd >= 0 ? '+' : ''}{formatNumber(totalPnlUsd, 2)} USD
          </span>
          {positions.length > 1 && <span className="open-position-pnl-strip-meta"> ({positions.length} positions)</span>}
        </span>
      </div>
    </div>
  );
}
