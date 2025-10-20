import React, { useEffect, useState } from "react";
import bitsLogo from "../../assets/logo.png";
import "./BITSAnalytics.css";

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
    <div className="stx-feed">
      <div className="stx-feed-head">
        <span className="stx-feed-icon">🟧</span>
        <span className="stx-feed-title">Live Stacks (STX) Mempool</span>
        <span className="brand-line" title="AI data pipeline">
          <img src={bitsLogo} alt="BITS" className="bits-logo-mini" />
          <span className="bitsPulseLabel">BitPulse®</span>
        </span>
        {error && <span className="stx-feed-error">{error}</span>}
      </div>
      <div className="stx-feed-list">
        {txs.length === 0 && !error && (
          <div className="stx-feed-empty">Loading recent transactions…</div>
        )}
        {txs.map((t) => {
          const fee = Number(t.fee_rate ?? t.fee ?? 0);
          const widthPct = Math.min(100, Math.max(5, (fee / 500) * 100)); // normalize ~0-500
          return (
            <div className="stx-feed-row" key={t.tx_id}>
              <a className="txid" title={t.tx_id} href={`https://explorer.hiro.so/txid/${t.tx_id}?chain=mainnet`} target="_blank" rel="noreferrer">{truncate(t.tx_id)}</a>
              <div className="meta">{t.tx_type} · nonce {t.nonce ?? '-'} · fee {fee}</div>
              <div className="spark-line stx" style={{ ['--w']: `${widthPct}%` }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentStacksFeed;


