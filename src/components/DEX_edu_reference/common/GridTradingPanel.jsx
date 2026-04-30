/**
 * GridTradingPanel - reusable UI for Grid Trading (SEI + EVM).
 * Props: chain, pair (default), userId, currentPrice
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Grid, TrendingUp, TrendingDown, DollarSign, Power, PowerOff, RefreshCw, BarChart3, Activity, Layers, AlertTriangle, Zap, ChevronDown, Info, Server, ChevronRight } from 'lucide-react';
import { getApiBaseUrl } from '../config/apiEndpoints.js';
import { GAS_ESTIMATE_USD_PER_TRADE } from '../frontend/utils/constants';

async function gridApi(method, path, body) {
  const url = `${getApiBaseUrl()}/ai-trading/grid/${path}`;
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  if (!text || !String(text).trim()) {
    return res.ok ? { success: true } : { success: false, error: `Server (${res.status})` };
  }
  try {
    return JSON.parse(text);
  } catch {
    const raw = String(text).trim();
    const lower = raw.toLowerCase();
    if (res.status === 429 || lower.includes('too many')) {
      return { success: false, error: 'Too many requests. Wait ~1 min and try again (rate limit).' };
    }
    return { success: false, error: raw.length > 160 ? `${raw.slice(0, 160)}…` : raw };
  }
}

const ICON_CDN = 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32/icon';
const ICONS = {
  DOGE: `${ICON_CDN}/doge.png`, CAKE: `${ICON_CDN}/cake.png`, BNB: `${ICON_CDN}/bnb.png`,
  ETH:  `${ICON_CDN}/eth.png`,  SOL:  `${ICON_CDN}/sol.png`,  XRP: `${ICON_CDN}/xrp.png`,
  STX:  'https://assets.coingecko.com/coins/images/2069/small/Stacks_logo_full.png',
  ATOM: `${ICON_CDN}/atom.png`, USDT: `${ICON_CDN}/usdt.png`, USDC: `${ICON_CDN}/usdc.png`,
  SEI:  'https://assets.coingecko.com/coins/images/28205/small/Sei_Logo_-_Transparent.png',
  PEPE: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg',
  SHIB: 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
};

function getPairIcons(pair) {
  const [base, quote] = pair.split('/');
  return { base: ICONS[base] || null, quote: ICONS[quote] || null };
}

const EVM_PAIRS = [
  { pair: 'DOGE/USDT', symbol: 'DOGEUSDT', label: 'DOGE/USDT', volatility: 'high' },
  { pair: 'CAKE/USDT', symbol: 'CAKEUSDT', label: 'CAKE/USDT', volatility: 'high' },
  { pair: 'PEPE/USDT', symbol: 'PEPEUSDT', label: 'PEPE/USDT', volatility: 'very high' },
  { pair: 'SHIB/USDT', symbol: 'SHIBUSDT', label: 'SHIB/USDT', volatility: 'high' },
  { pair: 'BNB/USDT',  symbol: 'BNBUSDT',  label: 'BNB/USDT',  volatility: 'low' },
  { pair: 'ETH/USDT',  symbol: 'ETHUSDT',  label: 'ETH/USDT',  volatility: 'medium' },
  { pair: 'SOL/USDT',  symbol: 'SOLUSDT',  label: 'SOL/USDT',  volatility: 'high' },
  { pair: 'STX/USDT',  symbol: 'STXUSDT',  label: 'STX/USDT',  volatility: 'high' },
  { pair: 'XRP/USDT',  symbol: 'XRPUSDT',  label: 'XRP/USDT',  volatility: 'medium' },
];

const SEI_PAIRS = [
  { pair: 'SEI/USDC',  symbol: 'SEIUSDT',  label: 'SEI/USDC',  volatility: 'high' },
  { pair: 'SEI/USDT',  symbol: 'SEIUSDT',  label: 'SEI/USDT',  volatility: 'high' },
  { pair: 'SEI/ATOM',  symbol: 'SEIUSDT',  label: 'SEI/ATOM',  volatility: 'high' },
  { pair: 'WETH/USDC', symbol: 'ETHUSDT',  label: 'WETH/USDC (ref ETH)', volatility: 'medium' },
  { pair: 'WETH/SEI',  symbol: 'ETHUSDT',  label: 'WETH/SEI (ref ETH)', volatility: 'medium' },
  { pair: 'ATOM/SEI',  symbol: 'ATOMUSDT', label: 'ATOM/SEI (ref ATOM)', volatility: 'medium' },
  { pair: 'ATOM/USDC', symbol: 'ATOMUSDT', label: 'ATOM/USDC', volatility: 'medium' },
  { pair: 'ATOM/USDT', symbol: 'ATOMUSDT', label: 'ATOM/USDT', volatility: 'medium' },
  { pair: 'SOL/USDC',  symbol: 'SOLUSDT',  label: 'SOL/USDC', volatility: 'high' },
  { pair: 'SOL/SEI',   symbol: 'SOLUSDT',  label: 'SOL/SEI (ref SOL)', volatility: 'high' },
];

const VOLATILITY_COLORS = { 'very high': '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#6b7280' };

const PRICE_SOURCES = [
  { name: 'binance', url: (s) => `https://api.binance.com/api/v3/ticker/price?symbol=${s}`, parse: (d) => d?.price },
  { name: 'mexc',    url: (s) => `https://api.mexc.com/api/v3/ticker/price?symbol=${s}`,    parse: (d) => d?.price },
  { name: 'okx',     url: (s) => `https://www.okx.com/api/v5/market/ticker?instId=${s.replace('USDT', '-USDT')}`, parse: (d) => d?.data?.[0]?.last },
  { name: 'kucoin',  url: (s) => `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${s.replace('USDT', '-USDT')}`, parse: (d) => d?.data?.price },
];

async function fetchLivePrice(chain, pairConfig) {
  if (!pairConfig?.symbol) return null;
  for (const src of PRICE_SOURCES) {
    try {
      const res = await fetch(src.url(pairConfig.symbol), { signal: AbortSignal.timeout(4000) });
      if (!res.ok) continue;
      const data = await res.json();
      const price = parseFloat(src.parse(data));
      if (price > 0) return price;
    } catch { continue; }
  }
  return null;
}

function suggestRange(price, spreadPct = 15) {
  const spread = price * (spreadPct / 100);
  const decimals = price < 0.01 ? 8 : price < 1 ? 6 : price < 100 ? 2 : 0;
  const factor = Math.pow(10, decimals);
  const min = Math.floor((price - spread) * factor) / factor;
  const max = Math.ceil((price + spread) * factor) / factor;
  return { min, max };
}

const STATUS_LABELS = {
  bought: 'Bought',
  buy_pending: 'Buy',
  sell_pending: 'Sell',
  sold: 'Sold',
  neutral: '—',
};

function formatPrice(price) {
  if (price < 0.0001) return price.toFixed(8);
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  if (price < 100) return price.toFixed(2);
  return price.toFixed(0);
}

export default function GridTradingPanel({
  chain = 'sei',
  pair: defaultPair = 'SEI/USDC',
  userId,
  currentPrice: currentPriceProp,
  /** When set (SEI only), grid pair follows page pair mapping from mapOtaPagePairToGridPair */
  syncPagePair = null,
}) {
  const availablePairs = chain === 'evm' ? EVM_PAIRS : SEI_PAIRS;
  const initialSeiPair = chain === 'sei' && syncPagePair
    ? (availablePairs.find((x) => x.pair === syncPagePair)?.pair
        || availablePairs.find((x) => x.pair === 'SEI/USDC')?.pair
        || defaultPair)
    : defaultPair;
  const [selectedPair, setSelectedPair] = useState(initialSeiPair);
  const [pageSyncHint, setPageSyncHint] = useState(null);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [gridCount, setGridCount] = useState(20);
  const [amountPerGrid, setAmountPerGrid] = useState(1);
  const [forceExecute, setForceExecute] = useState(false);
  const [grid, setGrid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [livePrice, setLivePrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [serverGrids, setServerGrids] = useState(null);
  const [serverGridsLoading, setServerGridsLoading] = useState(false);
  const [serverGridsError, setServerGridsError] = useState(null);
  const [serverGridsOpen, setServerGridsOpen] = useState(false);
  const pollRef = useRef(null);
  const initializedRef = useRef(false);

  const pairConfig = availablePairs.find((p) => p.pair === selectedPair) || availablePairs[0];
  const currentPrice = currentPriceProp || livePrice;

  const handleAutoSuggest = useCallback((price) => {
    if (!price || price <= 0) return;
    const { min, max } = suggestRange(price);
    setPriceMin(String(min));
    setPriceMax(String(max));
  }, []);

  const refreshLivePrice = useCallback(async () => {
    setPriceLoading(true);
    try {
      const p = await fetchLivePrice(chain, pairConfig);
      if (p && p > 0) {
        setLivePrice(p);
        return p;
      }
    } catch { /* silent */ }
    finally { setPriceLoading(false); }
    return null;
  }, [chain, pairConfig]);

  const fetchStatus = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await gridApi('GET', `status?userId=${encodeURIComponent(userId)}&chain=${chain}&pair=${encodeURIComponent(selectedPair)}`);
      if (data.success && data.grid) {
        setGrid(data.grid);
        setPriceMin(String(data.grid.priceMin));
        setPriceMax(String(data.grid.priceMax));
        setGridCount(data.grid.gridCount);
        setAmountPerGrid(data.grid.amountPerGrid);
        setForceExecute(Boolean(data.grid.forceExecute));
        initializedRef.current = true;
      } else {
        setGrid(null);
      }
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId, chain, selectedPair]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  useEffect(() => {
    if (chain !== 'sei' || !syncPagePair) return;
    let cancelled = false;
    (async () => {
      try {
        const { mapOtaPagePairToGridPair } = await import('../sei/utils/seiGridPagePairSync');
        const { gridPair, hint } = mapOtaPagePairToGridPair(syncPagePair);
        if (cancelled) return;
        if (SEI_PAIRS.some((x) => x.pair === gridPair)) {
          setSelectedPair(gridPair);
          setPageSyncHint(hint);
        }
      } catch {
        if (!cancelled) setPageSyncHint(null);
      }
    })();
    return () => { cancelled = true; };
  }, [chain, syncPagePair]);

  useEffect(() => {
    initializedRef.current = false;
    setGrid(null);
    setLivePrice(null);
    setPriceMin('');
    setPriceMax('');
    refreshLivePrice().then((p) => {
      if (p && !initializedRef.current) {
        handleAutoSuggest(p);
        initializedRef.current = true;
      }
    });
  }, [selectedPair]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (grid?.enabled) {
      pollRef.current = setInterval(fetchStatus, 30000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [grid?.enabled, fetchStatus]);

  const handleSave = useCallback(async () => {
    setError(null);
    const min = parseFloat(priceMin);
    const max = parseFloat(priceMax);
    if (!min || !max || min >= max) { setError('Price Min must be < Price Max'); return; }
    if (gridCount < 2 || gridCount > 100) { setError('Grids: 2–100'); return; }
    if (amountPerGrid <= 0) { setError('Amount must be > 0'); return; }
    setSaving(true);
    try {
      const data = await gridApi('POST', 'set', {
        userId, chain, pair: selectedPair,
        priceMin: min, priceMax: max, gridCount, amountPerGrid,
        enabled: grid?.enabled || false,
        forceExecute,
        currentPrice: currentPrice || (min + max) / 2,
      });
      if (data.success) await fetchStatus();
      else setError(data.error || 'Save failed');
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }, [userId, chain, selectedPair, priceMin, priceMax, gridCount, amountPerGrid, forceExecute, grid, currentPrice, fetchStatus]);

  const handleToggle = useCallback(async () => {
    if (!grid) return;
    setSaving(true);
    setError(null);
    try {
      const data = await gridApi('POST', 'enable', { userId, chain, pair: selectedPair, enabled: !grid.enabled });
      if (data.success) setGrid((p) => p ? { ...p, enabled: data.enabled } : p);
      else setError(data.error || 'Toggle failed');
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }, [userId, chain, selectedPair, grid]);

  const fetchAllGridsFromServer = useCallback(async () => {
    if (!userId) return;
    setServerGridsLoading(true);
    setServerGridsError(null);
    try {
      const data = await gridApi('GET', `all?userId=${encodeURIComponent(userId)}`);
      if (data.success && Array.isArray(data.grids)) {
        setServerGrids(data.grids);
        setServerGridsOpen(true);
      } else {
        setServerGrids([]);
      }
    } catch (e) {
      setServerGrids(null);
      setServerGridsError(e.message || 'Loading error');
    } finally {
      setServerGridsLoading(false);
    }
  }, [userId]);

  const handleDisableAllGrids = useCallback(async () => {
    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      const data = await gridApi('POST', 'disable-all', { userId });
      if (data.success) {
        setServerGrids((prev) => (Array.isArray(prev) ? prev.map((g) => ({ ...g, enabled: false })) : prev));
        await fetchStatus();
        await fetchAllGridsFromServer();
      } else {
        setError(data.error || 'Disable failed');
      }
    } catch (e) {
      setError(e.message || 'Error');
    } finally {
      setSaving(false);
    }
  }, [userId, fetchStatus, fetchAllGridsFromServer]);

  if (!userId) {
    return (
      <div className="grid-trading-panel grid-trading-panel--empty">
        <div className="grid-trading-panel__header">
          <BarChart3 size={18} />
          <span>Grid Trading</span>
          <span className="grid-trading-panel__badge">{chain.toUpperCase()}</span>
        </div>
        <div className="grid-trading-panel__connect">
          <AlertTriangle size={16} />
          <span>Connect wallet to configure Grid Trading</span>
        </div>
      </div>
    );
  }

  const gridLevels = grid?.gridState || [];
  const stats = grid || {};
  const spacing = stats.gridSpacingPct || 0;

  return (
    <div className="grid-trading-panel">
      <div className="grid-trading-panel__header">
        <BarChart3 size={18} />
        <span>Grid Trading</span>
        <span className="grid-trading-panel__badge">{chain.toUpperCase()}</span>
        <span className="grid-trading-panel__badge" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontSize: '0.65em' }}>AI Gate</span>
        {grid && (
          <span className={`grid-trading-panel__status ${grid.enabled ? 'grid-trading-panel__status--on' : 'grid-trading-panel__status--off'}`}>
            {grid.enabled ? 'ACTIVE' : 'OFF'}
          </span>
        )}
      </div>

      <div className="grid-trading-panel__config">
        {/* Pair Selector with Token Icons */}
        <div className="grid-trading-panel__pair-selector">
          <label>Pair</label>
          <div className="grid-trading-panel__pair-icons">
            {(() => { const ic = getPairIcons(selectedPair); return (<>
              {ic.base && <img src={ic.base} alt="" className="grid-trading-panel__token-icon" />}
              {ic.quote && <img src={ic.quote} alt="" className="grid-trading-panel__token-icon grid-trading-panel__token-icon--quote" />}
            </>); })()}
          </div>
          <div className="grid-trading-panel__pair-select-wrap">
            <select
              className="grid-trading-panel__pair-select"
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
            >
              {availablePairs.map((p) => (
                <option key={p.pair} value={p.pair}>{p.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="grid-trading-panel__pair-chevron" />
          </div>
          <span className="grid-trading-panel__volatility" style={{ color: VOLATILITY_COLORS[pairConfig.volatility] }}>
            {pairConfig.volatility === 'very high' ? 'Very High Vol' : pairConfig.volatility === 'high' ? 'High Vol' : pairConfig.volatility === 'medium' ? 'Medium Vol' : 'Low Vol'}
          </span>
        </div>

        {chain === 'sei' && pageSyncHint && (
          <div className="grid-trading-panel__row" style={{ fontSize: 11, opacity: 0.85, marginBottom: 6 }} title="Grid reference pair vs page context">
            {pageSyncHint}
          </div>
        )}
        {livePrice > 0 && (
          <div className="grid-trading-panel__live-price">
            <Activity size={13} />
            <span title="referencePrice: CEX aggregate for grid sizing — not on-chain fill.">Live (ref): <strong>${formatPrice(livePrice)}</strong></span>
            <button
              className="grid-trading-panel__btn grid-trading-panel__btn--auto"
              onClick={() => { refreshLivePrice().then((p) => { if (p) handleAutoSuggest(p); }); }}
              disabled={priceLoading}
              title="Automatically fill Price Min/Max with ±15% around live price"
            >
              <Zap size={13} />
              {priceLoading ? '...' : 'Auto'}
            </button>
          </div>
        )}
        <div className="grid-trading-panel__row-group">
          <div className="grid-trading-panel__row">
            <label>Price Min</label>
            <input type="number" step="any" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder={livePrice ? String(suggestRange(livePrice).min) : ''} />
          </div>
          <div className="grid-trading-panel__row">
            <label>Price Max</label>
            <input type="number" step="any" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder={livePrice ? String(suggestRange(livePrice).max) : ''} />
          </div>
        </div>
        <div className="grid-trading-panel__row-group">
          <div className="grid-trading-panel__row">
            <label>Price steps</label>
            <input type="number" min={2} max={100} value={gridCount} onChange={(e) => setGridCount(Number(e.target.value))} />
          </div>
          <div className="grid-trading-panel__row">
            <label>Amount (USD) per price step</label>
            <input type="number" step="any" min={0.1} value={amountPerGrid} onChange={(e) => setAmountPerGrid(Number(e.target.value))} />
          </div>
        </div>
        <div className="grid-trading-panel__row" style={{ marginTop: 6 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={forceExecute} onChange={(e) => setForceExecute(e.target.checked)} />
            <span>Force level execution (without OpenAI validation)</span>
          </label>
          <span className="grid-trading-panel__mode-hint" style={{ fontSize: 10, opacity: 0.8, marginTop: 2, display: 'block' }}>
            Check this so the grid opens/closes positions at levels without asking for AI approval.
          </span>
        </div>

        <div className="grid-trading-panel__actions">
          <button className="grid-trading-panel__btn grid-trading-panel__btn--save" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save Grid'}
          </button>
          {grid && (
            <button
              className={`grid-trading-panel__btn ${grid.enabled ? 'grid-trading-panel__btn--stop' : 'grid-trading-panel__btn--start'}`}
              onClick={handleToggle}
              disabled={saving}
            >
              {grid.enabled ? <><PowerOff size={14} /> Stop</> : <><Power size={14} /> Start</>}
            </button>
          )}
          <button className="grid-trading-panel__btn grid-trading-panel__btn--refresh" onClick={fetchStatus} disabled={loading} title="Refresh">
            <RefreshCw size={14} className={loading ? 'grid-trading-panel__spin' : ''} />
          </button>
          <button
            className="grid-trading-panel__btn grid-trading-panel__btn--server"
            onClick={fetchAllGridsFromServer}
            disabled={serverGridsLoading || !userId}
            title="Load and display all grids saved on the server (Render)"
          >
            <Server size={14} />
            {serverGridsLoading ? '...' : 'Render settings'}
          </button>
          <button
            className="grid-trading-panel__btn grid-trading-panel__btn--stop"
            onClick={handleDisableAllGrids}
            disabled={saving || !userId}
            title="Stop all grids across all pairs, EVM + SEI. Only OTA LLM Auto Trade remains."
          >
            <PowerOff size={14} />
            Disable all grids
          </button>
        </div>

        {serverGridsError && (
          <div className="grid-trading-panel__error grid-trading-panel__server-error">{serverGridsError}</div>
        )}

        {serverGrids && (
          <div className="grid-trading-panel__server-grids">
            <button
              type="button"
              className="grid-trading-panel__server-grids-toggle"
              onClick={() => setServerGridsOpen((o) => !o)}
              aria-expanded={serverGridsOpen}
            >
              <ChevronRight size={16} className={serverGridsOpen ? 'grid-trading-panel__server-chevron-open' : ''} />
              <span>Settings present on server (Render): {serverGrids.length} grid{serverGrids.length !== 1 ? 's' : ''}</span>
            </button>
            {serverGridsOpen && (
              <div className="grid-trading-panel__server-grids-list">
                {serverGrids.length === 0 ? (
                  <p className="grid-trading-panel__server-empty">No grid saved on server.</p>
                ) : (
                  <table className="grid-trading-panel__server-table">
                    <thead>
                      <tr>
                        <th>Chain</th>
                        <th>Pair</th>
                        <th>Min / Max</th>
                        <th>Steps</th>
                        <th>USD/step</th>
                        <th>Active</th>
                        <th>Force exec.</th>
                        <th>Profit</th>
                        <th>Trades</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serverGrids.map((g, i) => (
                        <tr key={`${g.chain}-${g.pair}-${i}`}>
                          <td>{String(g.chain || '').toUpperCase()}</td>
                          <td>{g.pair}</td>
                          <td>{Number(g.priceMin)} / {Number(g.priceMax)}</td>
                          <td>{g.gridCount}</td>
                          <td>{g.amountPerGrid}</td>
                          <td>{g.enabled ? 'Yes' : 'No'}</td>
                          <td>{g.forceExecute ? 'Yes' : 'No'}</td>
                          <td>${Number(g.totalProfit ?? 0).toFixed(2)}</td>
                          <td>{g.totalTrades ?? 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        <p className="grid-trading-panel__mode-hint" style={{ fontSize: 11, opacity: 0.9, marginTop: 8, marginBottom: 0 }}>
          Grid off = only LLM (Auto) decides positions.
        </p>

        {error && <div className="grid-trading-panel__error">{error}</div>}
      </div>

      {grid && (() => {
        const profitFromTrades = stats.totalProfit ?? stats.totalProfitUsd ?? 0;
        const trades = stats.totalTrades || 0;
        const gasPerTrade = chain === 'evm' ? GAS_ESTIMATE_USD_PER_TRADE.evm : GAS_ESTIMATE_USD_PER_TRADE.nonEvm;
        const taxeReteaEst = trades * gasPerTrade;
        // Use "gas paid" only when backend sends a total > 0; otherwise show the estimate so -$0.0000 does not appear for 4 trades.
        const rawGasUsd = (stats.totalGasUsd != null && Number.isFinite(Number(stats.totalGasUsd))) ? Number(stats.totalGasUsd) : null;
        const taxeReteaUsd = (rawGasUsd != null && rawGasUsd > 0) ? rawGasUsd : null;
        const taxeRetea = taxeReteaUsd != null ? taxeReteaUsd : taxeReteaEst;
        const netPnl = profitFromTrades - taxeRetea;
        const pnlColor = netPnl > 0 ? '#22c55e' : netPnl < 0 ? '#ef4444' : '#888';
        const pnlIcon = netPnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />;
        const gasLabel = `~$${gasPerTrade}/trade`;
        const useRealGas = taxeReteaUsd != null;
        return (
          <div className="grid-trading-panel__stats">
            <div
              className="grid-trading-panel__pnl-banner"
              style={{ borderColor: pnlColor }}
              title="Grid: Net P&L = profit from trades minus network fees. When backend tracks real gas, paid gas is shown."
            >
              <div className="grid-trading-panel__pnl-row">
                <span style={{ color: pnlColor }}>{pnlIcon}</span>
                <span className="grid-trading-panel__pnl-label">Net P&L (grid)</span>
                <span className="grid-trading-panel__pnl-value" style={{ color: pnlColor }}>
                  {netPnl >= 0 ? '+' : ''}{netPnl.toFixed(4)} USD
                </span>
                <Info size={12} className="grid-trading-panel__pnl-info" style={{ opacity: 0.7, marginLeft: 4 }} aria-hidden />
              </div>
              <div className="grid-trading-panel__pnl-details">
                <span title="Realized profit from level trades before network fees.">Grid profit: ${Number(profitFromTrades).toFixed(4)}</span>
                <span title={useRealGas ? 'Network fees (gas) actually paid, from backend.' : `Estimated network fees (gas) ${gasLabel} for ${trades} transactions.`}>
                  {useRealGas ? 'Network fees (paid gas):' : 'Network fees (est.):'} -${taxeRetea.toFixed(4)}
                </span>
              </div>
              {trades > 0 && (
                <div className="grid-trading-panel__pnl-legend" style={{ fontSize: 10, opacity: 0.8, marginTop: 4 }}>
                  Net P&L = Grid profit - Network fees {useRealGas ? '(paid)' : '(est.)'}
                </div>
              )}
            </div>
            <div className="grid-trading-panel__stat" title="Number of executed transactions (buy + sell) on grid">
              <Activity size={14} />
              <span>{trades} trades</span>
            </div>
            <div className="grid-trading-panel__stat" title="Percentage distance between two consecutive price levels">
              <Layers size={14} />
              <span>{spacing.toFixed(1)}% spacing</span>
            </div>
            <div className="grid-trading-panel__stat" title="Levels: Bought / Sold / total grid levels">
              <Grid size={14} />
              <span>{stats.boughtLevels || 0}B / {stats.soldLevels || 0}S / {stats.totalLevels || 0}</span>
            </div>
          </div>
        );
      })()}

      {gridLevels.length > 0 && (
        <div className="grid-trading-panel__levels">
          <div className="grid-trading-panel__levels-header">
            <span>Price</span><span>Status</span><span>P&L</span>
          </div>
          <div className="grid-trading-panel__levels-body">
            {gridLevels.slice().reverse().map((lvl, i) => {
              const isCurrentZone = currentPrice && Math.abs(lvl.price - currentPrice) / currentPrice < 0.015;
              return (
                <div
                  key={i}
                  className={`grid-trading-panel__level grid-trading-panel__level--${lvl.status} ${isCurrentZone ? 'grid-trading-panel__level--current' : ''}`}
                >
                  <span className="grid-trading-panel__level-price">${formatPrice(lvl.price)}</span>
                  <span className="grid-trading-panel__level-status">
                    {(lvl.status === 'bought' || lvl.status === 'sold') && <TrendingDown size={11} />}
                    {(lvl.status === 'buy_pending' || lvl.status === 'sell_pending') && <TrendingUp size={11} />}
                    {STATUS_LABELS[lvl.status] || lvl.status}
                  </span>
                  <span className="grid-trading-panel__level-pnl" style={{ color: (lvl.profitUsd || 0) > 0 ? '#22c55e' : (lvl.profitUsd || 0) < 0 ? '#ef4444' : '#555' }}>
                    {(lvl.profitUsd || 0) > 0 ? `+$${lvl.profitUsd.toFixed(3)}` : (lvl.profitUsd || 0) < 0 ? `-$${Math.abs(lvl.profitUsd).toFixed(3)}` : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
