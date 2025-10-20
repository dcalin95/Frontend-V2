import React, { useEffect, useRef, useState } from "react";
import bitsLogo from "../../assets/logo.png";
import "./BITSAnalytics.css";

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
    <div className="btc-feed">
      <div className="btc-feed-head">
        <span className="btc-feed-icon">₿</span>
        <span className="btc-feed-title">Live Bitcoin Mempool</span>
        <span className="brand-line" title="AI data pipeline">
          <img src={bitsLogo} alt="BITS" className="bits-logo-mini" />
          <span className="bitsPulseLabel">BitPulse®</span>
        </span>
        {error && <span className="btc-feed-error">{error}</span>}
      </div>
      <div className="btc-feed-list">
        {txs.length === 0 && !error && (
          <div className="btc-feed-empty">Loading recent transactions…</div>
        )}
        {txs.map((t) => {
          const f = Number(t.fee || 0);
          const v = Number(t.vsize || 1);
          const rate = v > 0 ? f / v : 0; // sat/vB
          const widthPct = Math.min(100, Math.max(5, (rate / 60) * 100)); // normalize ~0-60 sat/vB
          return (
            <div className="btc-feed-row" key={t.txid}>
              <a className="txid" title={t.txid} href={`https://mempool.space/tx/${t.txid}`} target="_blank" rel="noreferrer">{truncateTxid(t.txid)}</a>
              <div className="val">{formatBTCFromSats(t.value)} BTC</div>
              <div className="meta">{formatFeeRate(t.fee, t.vsize)} · {t.vsize} vB</div>
              <div className="spark-line btc" style={{ ['--w']: `${widthPct}%` }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentBTCFeed;


