import React, { useEffect, useState } from "react";
import bitsLogo from "../../assets/logo.png";
import "./BITSAnalytics.desktop.css";
import "./BITSAnalytics.mobile.css";

const STX_MEMPOOL = "https://api.hiro.so/extended/v1/tx/mempool?limit=6";

function truncate(id) {
  if (!id) return "";
  return `${id.slice(0, 8)}…${id.slice(-6)}`;
}

const RecentStacksFeed = () => {
  const [txs, setTxs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    let timer;

    const fetchOnce = async () => {
      try {
        const res = await fetch(STX_MEMPOOL, { headers: { "cache-control": "no-cache" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!alive) return;
        const list = Array.isArray(data?.results) ? data.results.slice(0, 6) : [];
        setTxs(list);
        setError("");
      } catch (e) {
        if (!alive) return;
        setError("Feed unavailable");
      }
    };

    fetchOnce();
    timer = setInterval(fetchOnce, 7000);
    return () => { alive = false; clearInterval(timer); };
  }, []);

  return (
    <div className="terminal-feed stx">
      <div className="terminal-head">
        <div className="terminal-title-group">
          <span className="terminal-icon">🟧</span>
          <span className="terminal-label">Live Stacks (STX) Mempool</span>
        </div>
        <div className="terminal-branding">
          <img src={bitsLogo} alt="BITS" className="bits-logo-pulse" />
          <span className="pulse-text">BitPulse®</span>
        </div>
        {error && <span className="terminal-error">{error}</span>}
      </div>

      <div className="terminal-table-head">
        <span>TXID</span>
        <span>METHOD</span>
        <span>NONCE / FEE</span>
      </div>

      <div className="terminal-list">
        {txs.length === 0 && !error && (
          <div className="terminal-loading">📡 SCANNING STACKS NETWORK...</div>
        )}
        {txs.map((t) => {
          const fee = Number(t.fee_rate ?? t.fee ?? 0);
          const widthPct = Math.min(100, Math.max(10, (fee / 1000) * 100)); // normalized
          
          return (
            <div className="terminal-row" key={t.tx_id}>
              <a 
                className="t-txid" 
                href={`https://explorer.hiro.so/txid/${t.tx_id}?chain=mainnet`} 
                target="_blank" 
                rel="noreferrer"
              >
                {truncate(t.tx_id)}
              </a>
              <div className="t-val stx-method">{t.tx_type.replace('_', ' ')}</div>
              <div className="t-meta">
                <span className="t-fee">n.{t.nonce ?? '-'}</span>
                <span className="t-size">{fee} STX</span>
              </div>
              <div className="t-progress-bg">
                <div className="t-progress-fill stx" style={{ width: `${widthPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentStacksFeed;


