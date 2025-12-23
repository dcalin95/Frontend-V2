import React, { useEffect, useMemo, useState } from "react";
import "./LeaderboardPanel.css";
import { getBackendUrl } from "../utils/getBackendUrl";

const API_URL = getBackendUrl();

export default function ChampionsLeaderboard({ limit = 10 }) {
  const DEFAULT_ROWS = [
    { rank: 1, name: "Nova", wallet: "0xA7c3…F912", rewardBits: 18250, source: "Telegram + Referral" },
    { rank: 2, name: "Atlas", wallet: "0x5B1e…2a44", rewardBits: 12400, source: "Referral" },
    { rank: 3, name: "Vega", wallet: "0x9cD0…0B71", rewardBits: 9800, source: "Telegram" },
    { rank: 4, name: "Orion", wallet: "0x3eF8…88c1", rewardBits: 7400, source: "Telegram + Referral" },
    { rank: 5, name: "Lyra", wallet: "0xF12a…19dE", rewardBits: 5200, source: "Referral" }
  ];

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [jitterEnabled, setJitterEnabled] = useState(true);
  const [bitsPriceUsd, setBitsPriceUsd] = useState(null);
  const [error, setError] = useState("");

  const formatUSD = (v) => {
    const n = Number(v || 0);
    return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [demoRes, priceRes] = await Promise.all([
        fetch(`${API_URL}/api/leaderboard/demo`),
        fetch(`${API_URL}/api/presale/current`)
      ]);

      const demo = await demoRes.json().catch(() => null);
      const price = await priceRes.json().catch(() => null);

      if (!demoRes.ok || !demo?.ok) {
        // If backend isn't restarted yet and route is missing, keep UI populated for marketing.
        if (demo?.error === "API route not found.") {
          setRows(DEFAULT_ROWS);
          setJitterEnabled(true);
          // no error shown
        } else {
          throw new Error(demo?.error || `HTTP ${demoRes.status}`);
        }
      } else {
        if (typeof demo.jitterEnabled === "boolean") setJitterEnabled(demo.jitterEnabled);
        setRows(Array.isArray(demo.rows) ? demo.rows : []);
      }
      const milicents = Number(price?.price);
      if (priceRes.ok && Number.isFinite(milicents) && milicents > 0) {
        setBitsPriceUsd(milicents / 1000);
      }
    } catch (e) {
      setError(e.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleRows = useMemo(() => (rows || []).slice(0, Math.max(1, Math.min(50, Number(limit || 10)))), [rows, limit]);

  return (
    <>
      <div className="lb-head">
        <div>
          <div className="lb-title">
            🏆 Champions Leaderboard
            <button
              type="button"
              className="lb-info"
              title={`Curated leaderboard • daily variation: ${jitterEnabled ? "ON" : "OFF"} • editable via Admin Panel`}
              aria-label="Leaderboard info"
            >
              ℹ︎
            </button>
          </div>
          <div className="lb-sub">
            {bitsPriceUsd != null ? `USD uses current presale price ($${bitsPriceUsd.toFixed(6)} / BITS).` : "USD will load from presale price."}
          </div>
        </div>
        <div className="lb-actions">
          <button className="lb-btn" onClick={fetchData} disabled={loading}>
            {loading ? "⏳ Loading..." : "🔄 Refresh"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="lb-error">❌ {error}</div>
      ) : (
        <div className="lb-table">
          <div className="lb-row lb-header" style={{ gridTemplateColumns: "64px 1fr 1fr 1fr 0.8fr 1fr" }}>
            <div>#</div>
            <div>User</div>
            <div>Wallet</div>
            <div>Rewards</div>
            <div>USD</div>
            <div>Source</div>
          </div>

          {visibleRows.map((r) => {
            const bits = Math.floor(Number(r.rewardBits || 0));
            const usd = bitsPriceUsd != null ? bits * bitsPriceUsd : null;
            return (
              <div
                key={r.rank}
                className="lb-row"
                style={{ gridTemplateColumns: "64px 1fr 1fr 1fr 0.8fr 1fr" }}
              >
                <div className="lb-rank">#{r.rank}</div>
                <div style={{ fontWeight: 900 }}>{r.name || "—"}</div>
                <div style={{ fontWeight: 800, color: "rgba(255,255,255,0.8)" }}>{r.wallet || "—"}</div>
                <div className="lb-accent">{bits.toLocaleString()} $BITS</div>
                <div style={{ fontWeight: 900 }}>{usd != null ? formatUSD(usd) : "—"}</div>
                <div style={{ color: "rgba(255,255,255,0.75)" }}>{r.source || "—"}</div>
              </div>
            );
          })}

          {!loading && visibleRows.length === 0 && (
            <div className="lb-empty">
              No champions configured yet. Go to Admin Panel → Leaderboard → Reset default / Save.
            </div>
          )}
        </div>
      )}
    </>
  );
}


