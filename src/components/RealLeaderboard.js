import React, { useEffect, useState } from "react";
import "./LeaderboardPanel.css";
import { getBackendUrl } from "../utils/getBackendUrl";

const API_URL = getBackendUrl();

export default function RealLeaderboard({ limit = 25 }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [priceUsd, setPriceUsd] = useState(null);
  const [bitsPriceUsd, setBitsPriceUsd] = useState(null);

  const [demoLoading, setDemoLoading] = useState(false);
  const [demoRows, setDemoRows] = useState([]);
  const [demoJitterEnabled, setDemoJitterEnabled] = useState(true);

  const formatUSD = (v) => {
    const n = Number(v || 0);
    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fetchReal = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/leaderboard/real?limit=${encodeURIComponent(limit)}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setPriceUsd(Number.isFinite(Number(data.priceUsd)) ? Number(data.priceUsd) : null);
    } catch (e) {
      setError(e.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchBitsPrice = async () => {
    try {
      const res = await fetch(`${API_URL}/api/presale/current`);
      const data = await res.json().catch(() => null);
      const milicents = Number(data?.price);
      if (res.ok && Number.isFinite(milicents) && milicents > 0) {
        setBitsPriceUsd(milicents / 1000);
      }
    } catch (_) {}
  };

  const fetchDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/leaderboard/demo`);
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        setDemoRows(Array.isArray(data.rows) ? data.rows : []);
        if (typeof data.jitterEnabled === "boolean") setDemoJitterEnabled(data.jitterEnabled);
      }
    } catch (_) {
      // keep silent — demo is optional here (main demo is shown on RewardsHub anyway)
    } finally {
      setDemoLoading(false);
    }
  };

  useEffect(() => {
    fetchReal();
    fetchDemo();
    fetchBitsPrice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  return (
    <>
      <div className="lb-head">
        <div>
          <div className="lb-title">📈 Live Leaderboard</div>
          <div className="lb-sub">
            Top wallets by total Telegram + Referral rewards (masked).{" "}
            {priceUsd != null ? `USD uses live presale price ($${priceUsd.toFixed(6)} / BITS).` : ""}
          </div>
        </div>
        <div className="lb-actions">
          <button className="lb-btn" onClick={fetchReal} disabled={loading}>
            {loading ? "⏳ Loading..." : "🔄 Refresh"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="lb-error">❌ {error}</div>
      ) : (
        <div className="lb-table">
          <div className="lb-row lb-header" style={{ gridTemplateColumns: "64px 1fr 0.9fr 0.8fr 1.6fr" }}>
            <div>#</div>
            <div>Wallet</div>
            <div>Total</div>
            <div>USD</div>
            <div>Breakdown</div>
          </div>
          {rows.map((r) => (
            <div key={r.rank} className="lb-row" style={{ gridTemplateColumns: "64px 1fr 0.9fr 0.8fr 1.6fr" }}>
              <div className="lb-rank">#{r.rank}</div>
              <div style={{ fontWeight: 900 }}>{r.wallet}</div>
              <div className="lb-accent">{Number(r.totalBits || 0).toLocaleString()} $BITS</div>
              <div style={{ fontWeight: 900 }}>${Number(r.usdValue || 0).toFixed(2)}</div>
              <div className="lb-muted" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span>💬 {Number(r.breakdown?.telegramBits || 0).toLocaleString()}</span>
                <span>👥 {Number(r.breakdown?.referralBits || 0).toLocaleString()}</span>
                <span>Pending {Number(r.breakdown?.pendingBits || 0).toLocaleString()}</span>
              </div>
            </div>
          ))}
          {!loading && rows.length === 0 && (
            <div className="lb-empty">
              Live leaderboard is warming up (not enough real reward data yet).
              <div className="lb-muted" style={{ marginTop: 4 }}>Marketing leaderboard is shown below.</div>
            </div>
          )}
        </div>
      )}

      <div className="lb-muted" style={{ marginTop: 10, fontSize: 11 }}>
        Note: this is calculated from backend reward logs (not marketing list). Wallets are masked for privacy.
      </div>

      <div style={{ marginTop: 14 }}>
        <div className="lb-head">
          <div>
            <div className="lb-title">🏆 Marketing Leaderboard</div>
            <div className="lb-sub">
              Curated for marketing (editable in Admin Panel → Leaderboard).
              {demoJitterEnabled ? " (Daily variation: ON)" : " (Daily variation: OFF)"}
              {bitsPriceUsd != null ? ` • USD uses $${bitsPriceUsd.toFixed(6)} / BITS` : ""}
            </div>
          </div>
          <div className="lb-actions">
            <button className="lb-btn" onClick={fetchDemo} disabled={demoLoading}>
              {demoLoading ? "⏳ Loading..." : "🔄 Refresh"}
            </button>
          </div>
        </div>

        <div className="lb-table">
          <div className="lb-row lb-header" style={{ gridTemplateColumns: "64px 1fr 1fr 0.9fr 0.8fr 1fr" }}>
            <div>#</div>
            <div>User</div>
            <div>Wallet</div>
            <div>Rewards</div>
            <div>USD</div>
            <div>Source</div>
          </div>
          {(demoRows || []).slice(0, 10).map((r) => {
            const bits = Math.floor(Number(r.rewardBits || 0));
            const usd = bitsPriceUsd != null ? bits * bitsPriceUsd : null;
            return (
              <div key={r.rank} className="lb-row" style={{ gridTemplateColumns: "64px 1fr 1fr 0.9fr 0.8fr 1fr" }}>
                <div className="lb-rank">#{r.rank}</div>
                <div style={{ fontWeight: 900 }}>{r.name || "—"}</div>
                <div style={{ fontWeight: 800, color: "rgba(255,255,255,0.8)" }}>{r.wallet}</div>
                <div className="lb-accent">{bits.toLocaleString()} $BITS</div>
                <div style={{ fontWeight: 900 }}>{usd != null ? formatUSD(usd) : "—"}</div>
                <div className="lb-muted">{r.source || "—"}</div>
              </div>
            );
          })}
          {!demoLoading && (demoRows || []).length === 0 && (
            <div className="lb-empty">No marketing rows configured yet.</div>
          )}
        </div>
      </div>
    </>
  );
}


