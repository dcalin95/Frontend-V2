import React, { useEffect, useRef, useState } from "react";
import bitsLogo from "../../assets/logo.png";
import "./BITSAnalytics.desktop.css";
import "./BITSAnalytics.mobile.css";

const ESPLORA_PRIMARY = "https://mempool.space/api/mempool/recent";
const ESPLORA_FALLBACK = "https://blockstream.info/api/mempool/recent";

function formatBTCFromSats(sats) {
  const n = Number(sats || 0) / 1e8;
  return n.toLocaleString("en-US", { minimumFractionDigits: 8, maximumFractionDigits: 8 });
}

function formatFeeRate(fee, vsize) {
  const f = Number(fee || 0);
  const v = Number(vsize || 1);
  const rate = v > 0 ? f / v : 0;
  return `${rate.toFixed(1)} sat/vB`;
}

function truncateTxid(txid) {
  if (!txid) return "";
  return `${txid.slice(0, 8)}…${txid.slice(-6)}`;
}

const RecentBTCFeed = () => {
  const [txs, setTxs] = useState([]);
  const [error, setError] = useState("");
  const etagRef = useRef(null);
  const usingFallbackRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    let timer;

    const fetchOnce = async () => {
      try {
        const url = usingFallbackRef.current ? ESPLORA_FALLBACK : ESPLORA_PRIMARY;
        const res = await fetch(url, {
          headers: etagRef.current ? { "If-None-Match": etagRef.current } : {}
        });
        if (res.status === 304) return; // Not modified
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const etag = res.headers.get("etag");
        if (etag) etagRef.current = etag;
        const data = await res.json();
        if (!mounted) return;
        // Normalize and keep at most 6
        const normalized = Array.isArray(data) ? data.slice(0, 6).map((t) => ({
          txid: t.txid,
          value: t.value, // sats
          fee: t.fee,
          vsize: t.vsize,
          time: t.time,
        })) : [];
        setTxs(normalized);
        setError("");
      } catch (e) {
        if (!mounted) return;
        // Switch to fallback once on failure
        if (!usingFallbackRef.current) {
          usingFallbackRef.current = true;
        } else {
          setError("Feed unavailable");
        }
      }
    };

    fetchOnce();
    timer = setInterval(fetchOnce, 5000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="terminal-feed btc">
      <div className="terminal-head">
        <div className="terminal-title-group">
          <span className="terminal-icon">₿</span>
          <span className="terminal-label">Live Bitcoin Mempool</span>
        </div>
        <div className="terminal-branding">
          <img src={bitsLogo} alt="BITS" className="bits-logo-pulse" />
          <span className="pulse-text">BitPulse®</span>
        </div>
        {error && <span className="terminal-error">{error}</span>}
      </div>
      
      <div className="terminal-table-head">
        <span>TXID</span>
        <span>VALUE</span>
        <span>FEE / SIZE</span>
      </div>

      <div className="terminal-list">
        {txs.length === 0 && !error && (
          <div className="terminal-loading">📡 SCANNING BLOCKCHAIN...</div>
        )}
        {txs.map((t) => {
          const f = Number(t.fee || 0);
          const v = Number(t.vsize || 1);
          const rate = v > 0 ? f / v : 0;
          const widthPct = Math.min(100, Math.max(10, (rate / 50) * 100));
          
          return (
            <div className="terminal-row" key={t.txid}>
              <a 
                className="t-txid" 
                href={`https://mempool.space/tx/${t.txid}`} 
                target="_blank" 
                rel="noreferrer"
              >
                {truncateTxid(t.txid)}
              </a>
              <div className="t-val">{formatBTCFromSats(t.value)} BTC</div>
              <div className="t-meta">
                <span className="t-fee">{rate.toFixed(1)} sat/vB</span>
                <span className="t-size">{t.vsize} vB</span>
              </div>
              <div className="t-progress-bg">
                <div className="t-progress-fill" style={{ width: `${widthPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentBTCFeed;


