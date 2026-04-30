/* eslint-disable */
/**
 * OtaSeiLpPanel – LP Market Making pe Astroport SEI/ATOM XYK.
 * Stil: Sonnet design system. Colapsibil by default.
 * @module OtaSeiLpPanel
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Droplets, ChevronDown, ChevronUp, TrendingUp, Plus, Minus, ExternalLink, RefreshCw, Info, AlertTriangle, Activity, DollarSign, Clock } from 'lucide-react';

/** localStorage: P&L baseline per wallet; legacy key without address for compatibility. */
const SNAPSHOT_KEY_PREFIX = 'lp_snapshot_sei_atom_v1';
const SEISCAN_POOL = 'https://www.seiscan.app/pacific-1/contracts/sei14kxy2g2cw37ng0mmyk6u54qq7xxxnksyhwcvsaf57g30q7ym23vqlmjpm0';
const ASTROPORT_POOL_PAGE = 'https://app.astroport.fi/pools/sei14kxy2g2cw37ng0mmyk6u54qq7xxxnksyhwcvsaf57g30q7ym23vqlmjpm0';

function snapshotStorageKey(walletAddress) {
  if (!walletAddress) return SNAPSHOT_KEY_PREFIX;
  return `${SNAPSHOT_KEY_PREFIX}_${String(walletAddress).toLowerCase()}`;
}

/**
 * @param {string|null|undefined} walletAddress
 * @returns {{ depositUsd: number, depositSei?: number|null, depositAtom?: number|null, ts: number, manual?: boolean }|null}
 */
function loadSnapshot(walletAddress) {
  const keys = [snapshotStorageKey(walletAddress), SNAPSHOT_KEY_PREFIX];
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.depositUsd === 'number') return parsed;
      }
    } catch (_) { /* ignore */ }
  }
  return null;
}

/**
 * @param {string|null|undefined} walletAddress
 * @param {number} posUsd
 * @param {number|null|undefined} seiShare
 * @param {number|null|undefined} atomShare
 * @param {{ manual?: boolean }} [opts]
 */
function saveSnapshot(walletAddress, posUsd, seiShare, atomShare, opts = {}) {
  const snap = {
    depositUsd: posUsd,
    depositSei: seiShare == null ? null : seiShare,
    depositAtom: atomShare == null ? null : atomShare,
    ts: Date.now(),
    manual: Boolean(opts.manual)
  };
  try {
    localStorage.setItem(snapshotStorageKey(walletAddress), JSON.stringify(snap));
  } catch (_) { /* quota / private mode */ }
}

function clearSnapshot(walletAddress) {
  try {
    localStorage.removeItem(snapshotStorageKey(walletAddress));
  } catch (_) { /* ignore */ }
}

/** Local LP position history (browser); not an on-chain indexer and does not include global swap count or separate USD fees. */
const HISTORY_KEY_PREFIX = 'lp_history_sei_atom_v1';
const HISTORY_MIN_INTERVAL_MS = 5 * 60 * 1000;
const HISTORY_MAX_ENTRIES = 200;

function historyStorageKey(walletAddress) {
  return `${HISTORY_KEY_PREFIX}_${String(walletAddress).toLowerCase()}`;
}

/** @returns {{ version: 1, startedAt: number, snapshots: Array<{ ts: number, posUsd: number, seiShare: number, atomShare: number, sharePercent: number, poolSeiReserve: number, poolAtomReserve: number, poolTotalShares: number }> } | null} */
function loadHistory(walletAddress) {
  if (!walletAddress) return null;
  try {
    const raw = localStorage.getItem(historyStorageKey(walletAddress));
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || p.version !== 1 || !Array.isArray(p.snapshots)) return null;
    return p;
  } catch (_) {
    return null;
  }
}

/**
 * Adds a point if the minimum interval passed or this is the first point.
 * @returns {boolean} true if written to localStorage
 */
function appendLpHistory(walletAddress, row) {
  if (!walletAddress) return false;
  const now = Date.now();
  let data = loadHistory(walletAddress);
  if (!data) {
    data = { version: 1, startedAt: now, snapshots: [] };
  }
  const last = data.snapshots[data.snapshots.length - 1];
  if (last && now - last.ts < HISTORY_MIN_INTERVAL_MS) return false;
  data.snapshots.push({
    ts: now,
    posUsd: row.posUsd,
    seiShare: row.seiShare,
    atomShare: row.atomShare,
    sharePercent: row.sharePercent,
    poolSeiReserve: row.poolSeiReserve,
    poolAtomReserve: row.poolAtomReserve,
    poolTotalShares: row.poolTotalShares
  });
  if (data.snapshots.length > HISTORY_MAX_ENTRIES) {
    data.snapshots = data.snapshots.slice(-HISTORY_MAX_ENTRIES);
  }
  try {
    localStorage.setItem(historyStorageKey(walletAddress), JSON.stringify(data));
    return true;
  } catch (_) {
    return false;
  }
}

function clearLpHistory(walletAddress) {
  try {
    localStorage.removeItem(historyStorageKey(walletAddress));
  } catch (_) { /* ignore */ }
}

function timeSince(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m ago`;
  return `${Math.floor(s/86400)}d ago`;
}
import { useSeiWallet } from './context/SeiWalletContext';
import { ASTROPORT_POOLS } from './seiTokenConfig';
import {
  getPoolInfo,
  getLpPosition,
  provideLiquidity,
  withdrawLiquidity,
  calcAtomForSei,
  calcSeiForAtom,
} from './services/seiLpService';
import '../frontend/styles/components/ota-sei-lp-panel.css';

const POOL = ASTROPORT_POOLS.SEI_ATOM_XYK;
const ASTROPORT_APP_URL = `https://app.astroport.fi/pools/${POOL.pairAddress}`;

function fmt(n, d = 4) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtUsd(n) {
  if (n == null || isNaN(n)) return '—';
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function useBinancePrice(symbol) {
  const [price, setPrice] = useState(null);
  useEffect(() => {
    const go = () =>
      fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`)
        .then(r => r.json()).then(d => setPrice(parseFloat(d.price) || null)).catch(() => {});
    go();
    const id = setInterval(go, 60000);
    return () => clearInterval(id);
  }, [symbol]);
  return price;
}

export default function OtaSeiLpPanel() {
  const { isConnected, address, getOfflineSigner } = useSeiWallet();
  const seiPrice = useBinancePrice('SEIUSDT');
  const atomPrice = useBinancePrice('ATOMUSDT');

  const [open, setOpen] = useState(true);
  const [poolInfo, setPoolInfo] = useState(null);
  const [lpPosition, setLpPosition] = useState(null);
  const [loadingPool, setLoadingPool] = useState(false);
  /** getPoolInfo / getLpPosition error; otherwise the UI looks empty without explanation. */
  const [poolLoadError, setPoolLoadError] = useState(null);
  const [txLoading, setTxLoading] = useState(false);
  const [txResult, setTxResult] = useState(null);
  const [txError, setTxError] = useState(null);

  const [seiInput, setSeiInput] = useState('');
  const [atomInput, setAtomInput] = useState('');
  const [slippage, setSlippage] = useState('1');
  const [removePercent, setRemovePercent] = useState(50);
  const [activeTab, setActiveTab] = useState('add');
  const [snapshot, setSnapshot] = useState(null);
  /** Manual baseline (USD) when there is no automatic snapshot (for example deposit on Astroport). */
  const [manualBaselineUsd, setManualBaselineUsd] = useState('');
  /** Optional SEI/ATOM amounts at reference time for price vs pool split (if only USD was saved). */
  const [manualSplitSei, setManualSplitSei] = useState('');
  const [manualSplitAtom, setManualSplitAtom] = useState('');
  /** Incremented when LP history is written to localStorage (UI re-read). */
  const [historyRefresh, setHistoryRefresh] = useState(0);

  useEffect(() => {
    setSnapshot(loadSnapshot(address));
  }, [address]);

  const loadData = useCallback(async () => {
    setLoadingPool(true);
    setPoolLoadError(null);
    try {
      const info = await getPoolInfo(POOL);
      setPoolInfo(info);
      if (isConnected && address) {
        const pos = await getLpPosition(address, POOL);
        setLpPosition(pos);
        if (pos && pos.lpBalance > 0 && seiPrice && atomPrice && info) {
          const usd = pos.seiShare * seiPrice + pos.atomShare * atomPrice;
          const appended = appendLpHistory(address, {
            posUsd: usd,
            seiShare: pos.seiShare,
            atomShare: pos.atomShare,
            sharePercent: pos.sharePercent,
            poolSeiReserve: info.seiReserve,
            poolAtomReserve: info.atomReserve,
            poolTotalShares: info.totalShares
          });
          if (appended) setHistoryRefresh((x) => x + 1);
        }
      }
    } catch (e) {
      setPoolLoadError(e?.message || 'Could not load the pool / position.');
    } finally {
      setLoadingPool(false);
    }
  }, [isConnected, address, seiPrice, atomPrice]);

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 30000);
    return () => clearInterval(id);
  }, [loadData]);

  const handleSeiChange = (val) => {
    setSeiInput(val);
    if (poolInfo && val) {
      const a = calcAtomForSei(parseFloat(val) || 0, poolInfo);
      setAtomInput(a > 0 ? a.toFixed(6) : '');
    } else setAtomInput('');
  };

  const handleAtomChange = (val) => {
    setAtomInput(val);
    if (poolInfo && val) {
      const s = calcSeiForAtom(parseFloat(val) || 0, poolInfo);
      setSeiInput(s > 0 ? s.toFixed(4) : '');
    } else setSeiInput('');
  };

  const handleAdd = async () => {
    setTxLoading(true); setTxResult(null); setTxError(null);
    try {
      const signer = await getOfflineSigner();
      if (!signer) throw new Error('Connect Keplr first.');
      const sei = parseFloat(seiInput), atom = parseFloat(atomInput);
      if (!sei || !atom) throw new Error('Enter both amounts.');
      const slip = Math.min(Math.max(parseFloat(slippage) / 100 || 0.01, 0.001), 0.5);
      const { txHash } = await provideLiquidity({ walletAddress: address, signer, pool: POOL, seiAmount: sei, atomAmount: atom, slippageTolerance: slip });
      setTxResult(txHash);
      // Save snapshot for the P&L tracker (only add from this panel).
      const depUsd = seiPrice && atomPrice ? sei * seiPrice + atom * atomPrice : null;
      if (depUsd) {
        saveSnapshot(address, depUsd, sei, atom, { manual: false });
        setSnapshot(loadSnapshot(address));
      }
      setSeiInput(''); setAtomInput('');
      setTimeout(loadData, 3000);
    } catch (e) { setTxError(e?.message || 'Transaction failed'); }
    finally { setTxLoading(false); }
  };

  const handleRemove = async () => {
    if (!lpPosition?.lpBalance) return;
    setTxLoading(true); setTxResult(null); setTxError(null);
    try {
      const signer = await getOfflineSigner();
      if (!signer) throw new Error('Connect Keplr first.');
      const lpAmt = Math.floor(lpPosition.lpBalance * (removePercent / 100));
      if (lpAmt <= 0) throw new Error('LP amount too small.');
      const { txHash } = await withdrawLiquidity({ walletAddress: address, signer, pool: POOL, lpAmount: lpAmt });
      setTxResult(txHash);
      setTimeout(loadData, 3000);
    } catch (e) { setTxError(e?.message || 'Transaction failed'); }
    finally { setTxLoading(false); }
  };

  const tvlUsd = poolInfo && seiPrice ? poolInfo.tvlSei * seiPrice : null;
  const hasPosition = lpPosition && lpPosition.lpBalance > 0;
  const posUsd = hasPosition && seiPrice && atomPrice
    ? lpPosition.seiShare * seiPrice + lpPosition.atomShare * atomPrice : null;

  const handleSetBaselineCurrent = useCallback(() => {
    if (!address || posUsd == null || !lpPosition) return;
    saveSnapshot(address, posUsd, lpPosition.seiShare, lpPosition.atomShare, { manual: true });
    setSnapshot(loadSnapshot(address));
  }, [address, posUsd, lpPosition]);

  const handleSaveManualBaseline = useCallback(() => {
    const v = parseFloat(String(manualBaselineUsd).replace(',', '.'));
    if (!address || !Number.isFinite(v) || v <= 0) return;
    saveSnapshot(address, v, null, null, { manual: true });
    setSnapshot(loadSnapshot(address));
    setManualBaselineUsd('');
  }, [address, manualBaselineUsd]);

  const handleClearBaseline = useCallback(() => {
    if (!address) return;
    clearSnapshot(address);
    setSnapshot(null);
  }, [address]);

  const handleClearLpHistory = useCallback(() => {
    if (!address) return;
    clearLpHistory(address);
    setHistoryRefresh((x) => x + 1);
  }, [address]);

  const lpHistory = useMemo(() => (address ? loadHistory(address) : null), [address, historyRefresh]);

  const historyStats = useMemo(() => {
    const s = lpHistory?.snapshots || [];
    if (s.length === 0) return null;
    const first = s[0];
    const last = s[s.length - 1];
    return {
      n: s.length,
      startedAt: lpHistory.startedAt,
      deltaUsd: last.posUsd - first.posUsd,
      lastRows: s.slice(-8)
    };
  }, [lpHistory]);

  /**
   * Split when the reference has SEI+ATOM: price move = HODL vs depositUsd; LP-HODL = fees+IL combined (fees are not separated in USD here).
   * Without amounts: do not show invented "fee profit"; see the honesty box + Astroport.
   */
  const pnlSplit = useMemo(() => {
    const snap = snapshot;
    if (!snap) return null;
    if (posUsd == null || !seiPrice || !atomPrice) return { kind: 'noPrices' };
    const { depositUsd, depositSei, depositAtom } = snap;
    if (!Number.isFinite(depositUsd) || depositUsd <= 0) return null;
    const totalUsd = posUsd - depositUsd;
    const hasAmounts =
      depositSei != null &&
      depositAtom != null &&
      Number.isFinite(Number(depositSei)) &&
      Number.isFinite(Number(depositAtom));
    if (hasAmounts) {
      const ds = Number(depositSei);
      const da = Number(depositAtom);
      const hodlUsdNow = ds * seiPrice + da * atomPrice;
      const priceMoveUsd = hodlUsdNow - depositUsd;
      const poolEffectUsd = posUsd - hodlUsdNow;
      return {
        kind: 'split',
        hodlUsdNow,
        priceMoveUsd,
        poolEffectUsd,
        totalUsd,
        depositSei: ds,
        depositAtom: da
      };
    }
    return { kind: 'noAmounts', totalUsd };
  }, [snapshot, posUsd, seiPrice, atomPrice]);

  const handleSaveSplitAmounts = useCallback(() => {
    if (!address || !snapshot) return;
    const s = parseFloat(String(manualSplitSei).replace(',', '.'));
    const a = parseFloat(String(manualSplitAtom).replace(',', '.'));
    if (!Number.isFinite(s) || !Number.isFinite(a) || (s <= 0 && a <= 0)) return;
    saveSnapshot(address, snapshot.depositUsd, s, a, { manual: true });
    setSnapshot(loadSnapshot(address));
    setManualSplitSei('');
    setManualSplitAtom('');
  }, [address, snapshot, manualSplitSei, manualSplitAtom]);

  const fmtPnlSigned = (diff, baseUsd) => {
    const pct = baseUsd > 0 ? (diff / baseUsd) * 100 : 0;
    return (
      <span style={{ fontWeight: 600, color: diff >= 0 ? '#22c55e' : '#f87171' }}>
        {diff >= 0 ? '+' : ''}{fmtUsd(diff)} ({pct >= 0 ? '+' : ''}{pct.toFixed(2)}%)
      </span>
    );
  };

  return (
    <section className="ota-sei-lp-panel" aria-label="LP Market Making">

      {/* ── Header / Toggle ── */}
      <button
        type="button"
        className="ota-sei-lp-panel__toggle-row"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="ota-sei-lp-panel__toggle-left">
          <Droplets size={16} className="ota-sei-lp-panel__heading-icon" aria-hidden />
          <span className="ota-sei-lp-panel__toggle-title">LP Market Making</span>
          <span className="ota-sei-lp-panel__toggle-sub">SEI/ATOM · Astroport XYK · 0.3% fee</span>
        </span>
        <span className="ota-sei-lp-panel__toggle-right">
          <span className="ota-sei-lp-panel__apy-badge" title="Fee per swap in the pool; APR/volume are not calculated in this panel">
            0.3% swap fee
          </span>
          {poolInfo && (
            <span className="ota-sei-lp-panel__toggle-stats">
              {fmt(poolInfo.seiReserve, 0)} SEI / {fmt(poolInfo.atomReserve, 2)} ATOM
              {tvlUsd ? ` · ${fmtUsd(tvlUsd)}` : ''}
            </span>
          )}
          <button
            type="button"
            className="ota-sei-lp-panel__icon-btn"
            onClick={e => { e.stopPropagation(); loadData(); }}
            disabled={loadingPool}
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw size={13} className={loadingPool ? 'ota-sei-lp-panel__spin' : ''} />
          </button>
          <a
            href={ASTROPORT_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ota-sei-lp-panel__icon-btn"
            title="Open on Astroport"
            aria-label="Astroport"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink size={13} />
          </a>
          {open ? <ChevronUp size={15} aria-hidden /> : <ChevronDown size={15} aria-hidden />}
        </span>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="ota-sei-lp-panel__body">

          {/* My position, if any */}
          {isConnected && hasPosition && (
            <div className="ota-sei-lp-panel__position">
              <span className="ota-sei-lp-panel__position-title">
                <TrendingUp size={12} aria-hidden />
                My LP Position ({fmt(lpPosition.sharePercent, 4)}% of pool)
              </span>
              <span className="ota-sei-lp-panel__position-nums">
                {fmt(lpPosition.seiShare, 4)} SEI · {fmt(lpPosition.atomShare, 6)} ATOM
                {posUsd ? ` · ${fmtUsd(posUsd)}` : ''}
              </span>
            </div>
          )}

          {/* Warning: ai nevoie de ATOM */}
          <div className="ota-sei-lp-panel__warn-block">
            <AlertTriangle size={13} style={{ flexShrink: 0, color: '#fbbf24' }} aria-hidden />
            <span>
              To add liquidity you need <strong>both SEI and ATOM</strong> in your Keplr wallet.
              Get ATOM via IBC on{' '}
              <a href="https://app.astroport.fi" target="_blank" rel="noopener noreferrer" className="ota-sei-lp-panel__result-link">
                Astroport
              </a>{' '}or bridge from Cosmos Hub.
            </span>
          </div>

          {/* P&L / Earnings widget (baseline from Add in panel OR manual setting), shown with LP position even if Binance has no USD yet */}
          {hasPosition && isConnected && (
            <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {poolLoadError && (
                <div role="alert" style={{ fontSize: 11, color: '#f87171', padding: '8px 10px', background: 'rgba(248,113,113,0.1)', borderRadius: 8 }}>
                  Pool loading: {poolLoadError}
                </div>
              )}
              {(!seiPrice || !atomPrice) && (
                <div style={{ fontSize: 10, color: '#fbbf24', padding: '8px 10px', background: 'rgba(251,191,36,0.08)', borderRadius: 8, border: '1px solid rgba(251,191,36,0.3)' }}>
                  <strong>Binance prices (SEI/ATOM) unavailable</strong> — USD P&amp;L is not calculated until the feed loads. The SEI/ATOM position remains above if it exists.
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexWrap: 'wrap' }}>
                <DollarSign size={12} style={{ color: '#818cf8', marginTop: 2 }} aria-hidden />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: '#818cf8', fontWeight: 600 }}>Earnings tracker</div>
                  <div style={{ fontSize: 10, color: 'var(--ds-text-secondary)', marginTop: 2, lineHeight: 1.35 }}>
                    <strong>There is no separate "interest".</strong> Swap fees (0.3%) go into the pool reserves; without an indexer/tx history, we cannot show in USD "how much you earned only from fees". Total P&amp;L = LP value vs reference (Binance). With reference amounts, we split <strong>price move (HODL)</strong> from <strong>LP-HODL</strong> (fees+IL combined, not separable here).
                  </div>
                </div>
                {snapshot?.ts && (
                  <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--ds-text-secondary)', marginLeft: 'auto' }}>
                    Ref. set {timeSince(snapshot.ts)}{snapshot.manual ? ' · manual' : ''}
                  </span>
                )}
              </div>

              {!snapshot && isConnected && address && (
                <div
                  role="status"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(251,191,36,0.08)',
                    border: '1px solid rgba(251,191,36,0.35)',
                    fontSize: 11,
                    lineHeight: 1.45,
                    color: 'var(--ds-text-primary)'
                  }}
                >
                  <strong style={{ color: '#fbbf24' }}>Why is profit/loss not shown?</strong>
                  <p style={{ margin: '6px 0 0', color: 'var(--ds-text-secondary)' }}>
                    The comparison baseline is saved <strong>automatically</strong> only when you press <strong>Add liquidity</strong> in <em>this</em> panel.
                    If you deposited on Astroport, from another browser, or cleared site data, there is <strong>no "initial deposit"</strong> in this browser, so you see "—".
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={handleSetBaselineCurrent}
                      disabled={posUsd == null}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(129,140,248,0.5)',
                        background: posUsd != null ? 'rgba(99,102,241,0.15)' : 'rgba(63,63,70,0.5)',
                        color: posUsd != null ? '#a5b4fc' : '#71717a',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: posUsd != null ? 'pointer' : 'not-allowed',
                        textAlign: 'left'
                      }}
                    >
                      Use current value ({posUsd != null ? fmtUsd(posUsd) : '—'}) as reference → P&amp;L from now on (requires Binance prices)
                    </button>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      <label style={{ fontSize: 10, color: 'var(--ds-text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        Or enter the estimated total deposit (USD) at entry:
                        <input
                          type="text"
                          inputMode="decimal"
                          value={manualBaselineUsd}
                          onChange={(e) => setManualBaselineUsd(e.target.value)}
                          placeholder="ex. 5.50"
                          style={{
                            maxWidth: 140,
                            padding: '6px 8px',
                            borderRadius: 6,
                            border: '1px solid var(--ds-border-color, #3f3f46)',
                            background: 'var(--ds-bg-secondary, #18181b)',
                            color: 'var(--ds-text-primary)',
                            fontSize: 12
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleSaveManualBaseline}
                        disabled={!manualBaselineUsd.trim()}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 8,
                          border: 'none',
                          background: manualBaselineUsd.trim() ? '#22c55e' : '#3f3f46',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: manualBaselineUsd.trim() ? 'pointer' : 'not-allowed',
                          alignSelf: 'flex-end'
                        }}
                      >
                        Save reference
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 11 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ color: 'var(--ds-text-secondary)' }}>Reference deposit (USD)</span>
                  <span style={{ fontWeight: 600, color: 'var(--ds-text-primary)' }}>
                    {snapshot ? fmtUsd(snapshot.depositUsd) : '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ color: 'var(--ds-text-secondary)' }}>Current value (est.)</span>
                  <span style={{ fontWeight: 600, color: 'var(--ds-text-primary)' }}>
                    {posUsd != null ? fmtUsd(posUsd) : '—'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ color: 'var(--ds-text-secondary)' }}>{snapshot ? 'Total P&amp;L (est.)' : 'Total P&amp;L'}</span>
                  {snapshot ? (() => {
                    if (posUsd == null) {
                      return <span style={{ color: 'var(--ds-text-secondary)', fontWeight: 600 }}>— (waiting for prices)</span>;
                    }
                    const diff = posUsd - snapshot.depositUsd;
                    const pct = (diff / snapshot.depositUsd) * 100;
                    return (
                      <span style={{ fontWeight: 700, color: diff >= 0 ? '#22c55e' : '#f87171' }}>
                        {diff >= 0 ? '+' : ''}{fmtUsd(diff)} ({pct >= 0 ? '+' : ''}{pct.toFixed(2)}%)
                      </span>
                    );
                  })() : (
                    <span style={{ color: 'var(--ds-text-secondary)', fontWeight: 600 }}>— set the reference above</span>
                  )}
                </div>
              </div>

              {snapshot && pnlSplit && pnlSplit.kind === 'split' && (
                <div
                  style={{
                    marginTop: 4,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(15,23,42,0.45)',
                    border: '1px solid rgba(148,163,184,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}
                >
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>Breakdown (est.)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 11 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ color: 'var(--ds-text-secondary)', fontSize: 10 }}>Price move (HODL)</span>
                      <span style={{ fontSize: 10, color: 'var(--ds-text-secondary)', lineHeight: 1.35 }}>
                        Same {fmt(pnlSplit.depositSei, 4)} SEI + {fmt(pnlSplit.depositAtom, 6)} ATOM as at reference, held in wallet (without LP).
                      </span>
                      {fmtPnlSigned(pnlSplit.priceMoveUsd, snapshot.depositUsd)}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ color: 'var(--ds-text-secondary)', fontSize: 10 }}>LP - HODL (swap fees + IL, not separable)</span>
                      <span style={{ fontSize: 10, color: 'var(--ds-text-secondary)', lineHeight: 1.35 }}>
                        Includes swap fees and impermanent loss; we <strong>do not</strong> show separate USD "fee profit" without additional on-chain data.
                      </span>
                      {fmtPnlSigned(pnlSplit.poolEffectUsd, snapshot.depositUsd)}
                    </div>
                  </div>
                </div>
              )}

              {snapshot && pnlSplit && (pnlSplit.kind === 'noAmounts' || pnlSplit.kind === 'noPrices') && (
                <div
                  style={{
                    marginTop: 4,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(15,23,42,0.45)',
                    border: '1px solid rgba(148,163,184,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}
                >
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>Swap fee profit in USD?</div>
                  <p style={{ margin: 0, fontSize: 10, color: 'var(--ds-text-secondary)', lineHeight: 1.45 }}>
                    <strong>We do not calculate it here.</strong> Fees do not enter a separate account; they are added to pool reserves and shared through your LP share. We cannot say "you made X USD from fees" without historical volume + indexing.
                    For <strong>APR / volume</strong> on this pool, see{' '}
                    <a href={ASTROPORT_POOL_PAGE} target="_blank" rel="noopener noreferrer" className="ota-sei-lp-panel__result-link">
                      Astroport (pool)
                    </a>
                    . For <strong>price move vs LP-HODL</strong> split (fees+IL combined, no separate USD fee amount), fill SEI+ATOM at reference below or use <strong>Add liquidity</strong> in this panel.
                  </p>
                </div>
              )}

              {snapshot &&
                (snapshot.depositSei == null || snapshot.depositAtom == null) &&
                (
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(59,130,246,0.06)',
                      border: '1px solid rgba(59,130,246,0.25)',
                      fontSize: 11
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#93c5fd', marginBottom: 6 }}>Price / pool split (optional)</div>
                    <p style={{ margin: '0 0 8px', fontSize: 10, color: 'var(--ds-text-secondary)', lineHeight: 1.4 }}>
                      Enter the <strong>SEI</strong> and <strong>ATOM</strong> amounts from your position at the reference time (for example from Astroport history). We keep the same saved USD deposit.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}>
                      <label style={{ fontSize: 10, color: 'var(--ds-text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        SEI at reference
                        <input
                          type="text"
                          inputMode="decimal"
                          value={manualSplitSei}
                          onChange={(e) => setManualSplitSei(e.target.value)}
                          placeholder="ex. 49.64"
                          style={{
                            width: 120,
                            padding: '6px 8px',
                            borderRadius: 6,
                            border: '1px solid var(--ds-border-color, #3f3f46)',
                            background: 'var(--ds-bg-secondary, #18181b)',
                            color: 'var(--ds-text-primary)',
                            fontSize: 12
                          }}
                        />
                      </label>
                      <label style={{ fontSize: 10, color: 'var(--ds-text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        ATOM at reference
                        <input
                          type="text"
                          inputMode="decimal"
                          value={manualSplitAtom}
                          onChange={(e) => setManualSplitAtom(e.target.value)}
                          placeholder="ex. 1.1725"
                          style={{
                            width: 120,
                            padding: '6px 8px',
                            borderRadius: 6,
                            border: '1px solid var(--ds-border-color, #3f3f46)',
                            background: 'var(--ds-bg-secondary, #18181b)',
                            color: 'var(--ds-text-primary)',
                            fontSize: 12
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleSaveSplitAmounts}
                        disabled={!manualSplitSei.trim() || !manualSplitAtom.trim()}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: 'none',
                          background: manualSplitSei.trim() && manualSplitAtom.trim() ? '#3b82f6' : '#3f3f46',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: manualSplitSei.trim() && manualSplitAtom.trim() ? 'pointer' : 'not-allowed'
                        }}
                      >
                        Save for split
                      </button>
                    </div>
                  </div>
                )}

              {snapshot && (
                <button
                  type="button"
                  onClick={handleClearBaseline}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '4px 0',
                    border: 'none',
                    background: 'none',
                    color: 'var(--ds-text-secondary)',
                    fontSize: 10,
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                >
                  Reset reference (local)
                </button>
              )}

              <div style={{ fontSize: 10, color: 'var(--ds-text-secondary)', marginTop: 2 }}>
                Pool share: <strong style={{ color: '#818cf8' }}>{fmt(lpPosition.sharePercent, 4)}%</strong>
                {tvlUsd != null && <> · Pool TVL (est.): <strong>{fmtUsd(tvlUsd)}</strong></>}
                {' · '}
                <a href={ASTROPORT_POOL_PAGE} target="_blank" rel="noopener noreferrer" className="ota-sei-lp-panel__result-link" style={{ fontSize: 10 }}>
                APR/volume (Astroport)
                </a>
              </div>
            </div>
          )}

          {/* Local history: periodic points (not an indexer; no swap count / separate USD fees) */}
          {hasPosition && address && (
            <div
              style={{
                marginTop: 6,
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.22)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Clock size={14} style={{ color: '#34d399', flexShrink: 0 }} aria-hidden />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#6ee7b7' }}>Local history (browser)</span>
              </div>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--ds-text-secondary)', lineHeight: 1.45 }}>
                From now on, this browser saves one <strong>point</strong> at most every <strong>5 minutes</strong> (while you have a position and Binance prices), with estimated LP value and pool reserves.
                This <strong>does not</strong> mean "how many swaps happened" or "how much you have from fees in USD"; that would require an indexer / contract. For <strong>global</strong> pool activity:{' '}
                <a href={SEISCAN_POOL} target="_blank" rel="noopener noreferrer" className="ota-sei-lp-panel__result-link">Seiscan</a>.
              </p>
              {historyStats ? (
                <>
                  <div style={{ fontSize: 11, color: 'var(--ds-text-primary)' }}>
                    Collection started:{' '}
                    <strong>{new Date(historyStats.startedAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}</strong>
                    {' · '}
                    Points: <strong>{historyStats.n}</strong>
                    {' · '}
                    Δ value (first→last point, est.):{' '}
                    <strong style={{ color: historyStats.deltaUsd >= 0 ? '#22c55e' : '#f87171' }}>
                      {historyStats.deltaUsd >= 0 ? '+' : ''}
                      {fmtUsd(historyStats.deltaUsd)}
                    </strong>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ color: 'var(--ds-text-secondary)', textAlign: 'left' }}>
                          <th style={{ padding: '4px 6px 4px 0' }}>Time</th>
                          <th style={{ padding: '4px 6px' }}>LP value (est.)</th>
                          <th style={{ padding: '4px 0 4px 6px' }}>Pool share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyStats.lastRows.map((row) => (
                          <tr key={row.ts} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <td style={{ padding: '4px 6px 4px 0', whiteSpace: 'nowrap' }}>
                              {new Date(row.ts).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td style={{ padding: '4px 6px' }}>{fmtUsd(row.posUsd)}</td>
                            <td style={{ padding: '4px 0 4px 6px' }}>{fmt(row.sharePercent, 4)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p style={{ margin: 0, fontSize: 10, color: 'var(--ds-text-secondary)' }}>
                  The first point appears after the first successful position refresh (stay on the page with wallet connected).
                </p>
              )}
              <button
                type="button"
                onClick={handleClearLpHistory}
                style={{
                  alignSelf: 'flex-start',
                  padding: '4px 0',
                  border: 'none',
                  background: 'none',
                  color: 'var(--ds-text-secondary)',
                  fontSize: 10,
                  textDecoration: 'underline',
                  cursor: 'pointer'
                }}
              >
                Clear local history
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="ota-sei-lp-panel__tabs" role="tablist">
            {[
              { id: 'add', label: 'Add Liquidity', icon: <Plus size={12} aria-hidden /> },
              { id: 'remove', label: 'Remove', icon: <Minus size={12} aria-hidden />, disabled: !hasPosition },
              { id: 'activity', label: 'Activity', icon: <Activity size={12} aria-hidden /> },
              { id: 'info', label: 'Info', icon: <Info size={12} aria-hidden /> },
            ].map(({ id, label, icon, disabled }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeTab === id}
                disabled={disabled}
                onClick={() => !disabled && setActiveTab(id)}
                className={`ota-sei-lp-panel__tab${activeTab === id ? ' ota-sei-lp-panel__tab--active' : ''}`}
              >
                {icon}{label}
              </button>
            ))}
          </div>

          {/* ── Tab: Add ── */}
          {activeTab === 'add' && (
            <div className="ota-sei-lp-panel__tab-body">
              {!isConnected ? (
                <p className="ota-sei-lp-panel__not-connected">Connect Keplr to add liquidity.</p>
              ) : (
                <>
                  <div className="ota-sei-lp-panel__two-inputs">
                    <div className="ota-sei-lp-panel__field">
                      <label className="ota-sei-lp-panel__label">
                        SEI
                        {seiPrice && seiInput && (
                          <span className="ota-sei-lp-panel__label-usd">{fmtUsd(parseFloat(seiInput) * seiPrice)}</span>
                        )}
                      </label>
                      <input type="number" min="0" step="0.01" value={seiInput}
                        onChange={e => handleSeiChange(e.target.value)}
                        placeholder="e.g. 50" className="ota-sei-lp-panel__input" />
                    </div>
                    <div className="ota-sei-lp-panel__field">
                      <label className="ota-sei-lp-panel__label">
                        ATOM
                        {atomPrice && atomInput && (
                          <span className="ota-sei-lp-panel__label-usd">{fmtUsd(parseFloat(atomInput) * atomPrice)}</span>
                        )}
                      </label>
                      <input type="number" min="0" step="0.0001" value={atomInput}
                        onChange={e => handleAtomChange(e.target.value)}
                        placeholder="auto" className="ota-sei-lp-panel__input" />
                    </div>
                  </div>

                  <div className="ota-sei-lp-panel__slippage-row">
                    <span>Slippage:</span>
                    {['0.5', '1', '3'].map(v => (
                      <button key={v} type="button" onClick={() => setSlippage(v)}
                        className={`ota-sei-lp-panel__slippage-btn${slippage === v ? ' ota-sei-lp-panel__slippage-btn--active' : ''}`}>
                        {v}%
                      </button>
                    ))}
                    {poolInfo && (
                      <span className="ota-sei-lp-panel__ratio-hint">
                        · 1 ATOM = {fmt(poolInfo.seiPerAtom, 2)} SEI
                      </span>
                    )}
                  </div>

                  <button type="button" onClick={handleAdd}
                    disabled={txLoading || !seiInput || !atomInput}
                    className="ota-sei-lp-panel__btn ota-sei-lp-panel__btn--add">
                    <Plus size={14} aria-hidden />
                    {txLoading ? 'Processing…' : 'Add Liquidity'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Tab: Remove ── */}
          {activeTab === 'remove' && (
            <div className="ota-sei-lp-panel__tab-body">
              {hasPosition ? (
                <>
                  <div className="ota-sei-lp-panel__field">
                    <label className="ota-sei-lp-panel__label">
                      Withdraw {removePercent}% &nbsp;
                      <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--ds-text-primary)' }}>
                        ({lpPosition.lpBalance.toLocaleString()} LP tokens)
                      </span>
                    </label>
                    <input type="range" min="1" max="100" value={removePercent}
                      onChange={e => setRemovePercent(Number(e.target.value))}
                      className="ota-sei-lp-panel__slider" />
                    <div className="ota-sei-lp-panel__slider-labels">
                      {[25, 50, 75, 100].map(v => (
                        <button key={v} type="button" onClick={() => setRemovePercent(v)}
                          className={`ota-sei-lp-panel__pct-btn${removePercent === v ? ' ota-sei-lp-panel__pct-btn--active' : ''}`}>
                          {v}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="ota-sei-lp-panel__preview">
                    <span className="ota-sei-lp-panel__preview-label">You receive approx:</span>
                    <span>{fmt(lpPosition.seiShare * removePercent / 100, 4)} SEI
                      {seiPrice ? ` (${fmtUsd(lpPosition.seiShare * removePercent / 100 * seiPrice)})` : ''}</span>
                    <span>{fmt(lpPosition.atomShare * removePercent / 100, 6)} ATOM
                      {atomPrice ? ` (${fmtUsd(lpPosition.atomShare * removePercent / 100 * atomPrice)})` : ''}</span>
                  </div>

                  <button type="button" onClick={handleRemove} disabled={txLoading}
                    className="ota-sei-lp-panel__btn ota-sei-lp-panel__btn--remove">
                    <Minus size={14} aria-hidden />
                    {txLoading ? 'Processing…' : `Remove ${removePercent}%`}
                  </button>
                </>
              ) : (
                <p className="ota-sei-lp-panel__no-position">No LP position in this pool.</p>
              )}
            </div>
          )}

          {/* ── Tab: Activity ── */}
          {activeTab === 'activity' && (
            <div className="ota-sei-lp-panel__tab-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', margin: 0 }}>
                  See live swaps and activity in the SEI/ATOM pool on the blockchain explorer:
                </p>
                <a href={SEISCAN_POOL} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--ds-border-color, #27272a)', borderRadius: 8, textDecoration: 'none', color: 'var(--ds-text-primary)', fontSize: 12 }}>
                  <Activity size={14} style={{ color: '#818cf8' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>Seiscan — Pool Transactions</div>
                    <div style={{ fontSize: 10, color: 'var(--ds-text-secondary)' }}>See every swap, deposit, withdrawal live</div>
                  </div>
                  <ExternalLink size={12} style={{ color: 'var(--ds-text-secondary)' }} />
                </a>
                <a href={ASTROPORT_POOL_PAGE} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--ds-border-color, #27272a)', borderRadius: 8, textDecoration: 'none', color: 'var(--ds-text-primary)', fontSize: 12 }}>
                  <TrendingUp size={14} style={{ color: '#22c55e' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>Astroport — Pool Stats</div>
                    <div style={{ fontSize: 10, color: 'var(--ds-text-secondary)' }}>24h volume, TVL, official APR</div>
                  </div>
                  <ExternalLink size={12} style={{ color: 'var(--ds-text-secondary)' }} />
                </a>
                {hasPosition && (
                  <div style={{ padding: '10px 14px', background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 8, fontSize: 11 }}>
                    <div style={{ color: '#22c55e', fontWeight: 600, marginBottom: 4 }}>Current position (live)</div>
                    <div style={{ color: 'var(--ds-text-secondary)', lineHeight: 1.6 }}>
                      SEI: <strong style={{ color: 'var(--ds-text-primary)' }}>{fmt(lpPosition.seiShare, 4)}</strong> ·
                      ATOM: <strong style={{ color: 'var(--ds-text-primary)' }}>{fmt(lpPosition.atomShare, 6)}</strong><br />
                      Pool share: <strong style={{ color: '#818cf8' }}>{fmt(lpPosition.sharePercent, 4)}%</strong> ·
                      Est. value: <strong style={{ color: 'var(--ds-text-primary)' }}>{posUsd ? fmtUsd(posUsd) : '—'}</strong>
                    </div>
                    <p style={{ margin: '8px 0 0', fontSize: 10, color: 'var(--ds-text-secondary)', lineHeight: 1.45 }}>
                      The pool is <strong>public</strong>: anyone can swap through it (that is normal; swaps accumulate fees for LPs).
                      It is unrelated to the P&amp;L "reference" in the tracker; that one is set by you or by Add liquidity here.
                      Full history: <a href={SEISCAN_POOL} target="_blank" rel="noopener noreferrer" className="ota-sei-lp-panel__result-link">Seiscan</a>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Tab: Info ── */}
          {activeTab === 'info' && (
            <div className="ota-sei-lp-panel__tab-body">
              <div className="ota-sei-lp-panel__info-block">
                <p className="ota-sei-lp-panel__info-title">How LP Market Making works</p>
                <ul className="ota-sei-lp-panel__info-list">
                  <li>Deposit SEI + ATOM proportional to the pool ratio</li>
                  <li>Receive LP tokens representing your share</li>
                  <li>Earn <strong>0.3% fee</strong> on every swap through the pool</li>
                  <li>Withdraw anytime — fees are included in your share</li>
                </ul>
              </div>
              <div className="ota-sei-lp-panel__warn-block" style={{ flexDirection: 'column', gap: 4 }}>
                <p className="ota-sei-lp-panel__warn-title">⚠ Impermanent Loss risk</p>
                <p className="ota-sei-lp-panel__warn-body">
                  If the SEI/ATOM price ratio changes significantly, withdrawal value may be lower than
                  holding the tokens separately. Fees partially offset this risk.
                </p>
              </div>
              <div className="ota-sei-lp-panel__info-links">
                <span>Pool: <a href={ASTROPORT_APP_URL} target="_blank" rel="noopener noreferrer">Astroport SEI/ATOM XYK ↗</a></span>
                <span style={{ fontSize: 10, wordBreak: 'break-all', color: 'var(--ds-text-secondary)' }}>{POOL.pairAddress}</span>
              </div>
            </div>
          )}

          {/* Result / Error */}
          {txResult && (
            <div className="ota-sei-lp-panel__result" style={{ margin: '0 0 4px' }}>
              <span className="ota-sei-lp-panel__result-label">Done!</span>
              <a href={`https://www.seiscan.app/pacific-1/tx/${txResult}`}
                target="_blank" rel="noopener noreferrer"
                className="ota-sei-lp-panel__result-link">
                {txResult.slice(0, 10)}…{txResult.slice(-8)}
              </a>
            </div>
          )}
          {txError && (
            <div className="ota-sei-lp-panel__error" style={{ margin: '0 0 4px' }}>{txError}</div>
          )}
        </div>
      )}
    </section>
  );
}
