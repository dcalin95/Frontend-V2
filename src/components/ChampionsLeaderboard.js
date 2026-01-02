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

  const [activeTab, setActiveTab] = useState("evm"); // "evm" | "solana"
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [solanaRows, setSolanaRows] = useState([]);
  const [solanaLoading, setSolanaLoading] = useState(false);
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

  const fetchSolanaData = async () => {
    setSolanaLoading(true);
    setError("");
    try {
      let payments = [];
      
      // 1. Try /api/transactions/debug/solana (public endpoint that returns all Solana transactions)
      try {
        const response = await fetch(`${API_URL}/api/transactions/debug/solana`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        console.log("🔍 [ChampionsLeaderboard] /api/transactions/debug/solana response status:", response.status);
        if (response.ok) {
          const data = await response.json().catch(() => null);
          console.log("🔍 [ChampionsLeaderboard] /api/transactions/debug/solana data:", data);
          if (Array.isArray(data)) {
            // Transform transactions to payment format
            let solPriceUSD = 150; // Default fallback price
            try {
              const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd`);
              if (priceRes.ok) {
                const priceData = await priceRes.json();
                solPriceUSD = priceData?.solana?.usd || 150;
              }
            } catch (e) {
              // Use fallback price
            }
            
            payments = data
              .filter(tx => (tx.status || '').toLowerCase() === 'confirmed')
              .map(tx => ({
                evm_wallet: tx.wallet_address || tx.evm_wallet || tx.userWallet || "",
                wallet_address: tx.wallet_address || "",
                amount: parseFloat(tx.amount || 0), // SOL
                bits_received: parseFloat(tx.bits_received || tx.bitsToReceive || 0),
                usd_invested: parseFloat(tx.usd_invested || tx.usdInvested || 0) || (parseFloat(tx.amount || 0) * solPriceUSD),
                signature: tx.tx_signature || tx.signature || "",
                created_at: tx.created_at || tx.date || tx.timestamp || new Date().toISOString(),
                status: tx.status || "confirmed"
              }));
            console.log("✅ [ChampionsLeaderboard] Got payments from /api/transactions/debug/solana:", payments.length);
          }
        } else {
          const errorText = await response.text().catch(() => "");
          console.warn("⚠️ [ChampionsLeaderboard] /api/transactions/debug/solana failed:", response.status, errorText);
        }
      } catch (e) {
        console.warn("⚠️ [ChampionsLeaderboard] /api/transactions/debug/solana error:", e.message);
      }
      
      // 2. Fallback: Try /api/solana/payments/all (public endpoint)
      if (payments.length === 0) {
        try {
          const response = await fetch(`${API_URL}/api/solana/payments/all?limit=${encodeURIComponent(limit || 100)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          console.log("🔍 [ChampionsLeaderboard] /api/solana/payments/all response status:", response.status);
          if (response.ok) {
            const data = await response.json().catch(() => null);
            console.log("🔍 [ChampionsLeaderboard] /api/solana/payments/all data:", data);
            if (data?.ok && Array.isArray(data.payments)) {
              payments = data.payments;
              console.log("✅ [ChampionsLeaderboard] Got payments from /api/solana/payments/all:", payments.length);
            } else if (data?.ok && Array.isArray(data.rows)) {
              payments = data.rows;
              console.log("✅ [ChampionsLeaderboard] Got rows from /api/solana/payments/all:", payments.length);
            } else if (Array.isArray(data)) {
              payments = data;
              console.log("✅ [ChampionsLeaderboard] Got array from /api/solana/payments/all:", payments.length);
            }
          } else {
            const errorText = await response.text().catch(() => "");
            console.warn("⚠️ [ChampionsLeaderboard] /api/solana/payments/all failed:", response.status, errorText);
          }
        } catch (e) {
          console.warn("⚠️ [ChampionsLeaderboard] /api/solana/payments/all error:", e.message);
        }
      }
      
      // 3. Fallback: Read from localStorage (presale_sol_tx_history)
      if (payments.length === 0) {
        try {
          const localHistory = JSON.parse(localStorage.getItem('presale_sol_tx_history') || '[]');
          if (Array.isArray(localHistory) && localHistory.length > 0) {
            // Get current SOL price for USD calculation (fallback)
            let solPriceUSD = 150; // Default fallback price
            try {
              const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd`);
              if (priceRes.ok) {
                const priceData = await priceRes.json();
                solPriceUSD = priceData?.solana?.usd || 150;
              }
            } catch (e) {
              // Use fallback price
            }
            
            payments = localHistory.map(tx => {
              const amountSOL = parseFloat(tx.amount || 0);
              // Calculate USD: if usdInvested exists use it, otherwise amount (SOL) * SOL price
              const usdInvested = tx.usdInvested || tx.usd_invested || (amountSOL * solPriceUSD);
              
              return {
                wallet: tx.wallet || tx.walletAddress || "",
                bits_received: tx.bitsToReceive || tx.bits_received || 0,
                usd_invested: usdInvested,
                amount: amountSOL,
                signature: tx.signature || tx.txHash || "",
                created_at: tx.timestamp || tx.created_at || tx.date || new Date().toISOString()
              };
            });
          }
        } catch (e) {
          console.warn("⚠️ [ChampionsLeaderboard] localStorage read failed:", e);
        }
      }
      
      // 4. Aggregate payments by wallet
      if (payments.length > 0) {
        const aggregated = payments.reduce((acc, payment) => {
          // AdminPanel uses: evm_wallet, solana_from, wallet, walletAddress
          const wallet = payment.evm_wallet || payment.evmWallet || payment.wallet || payment.wallet_address || payment.walletAddress || payment.solana_from || "";
          if (!wallet) return acc;
          
          const key = wallet.toLowerCase();
          if (!acc[key]) {
            acc[key] = {
              wallet: wallet,
              totalBits: 0,
              totalUSD: 0,
              count: 0,
              lastPayment: null
            };
          }
          
          // AdminPanel structure: bits_received, bits_to_receive, bitsToReceive
          const bits = parseFloat(payment.bits_received || payment.bits_to_receive || payment.bitsToReceive || payment.bits || 0);
          
          // AdminPanel structure: usd_invested, usdInvested
          // For USD: prioritize usd_invested (from AdminPanel), then calculate from amount (SOL) * SOL price, then from bits * BITS price
          let usd = parseFloat(payment.usd_invested || payment.usdInvested || payment.usd || 0);
          if (usd === 0) {
            // Try to calculate from amount (SOL) - AdminPanel uses 'amount' field
            const amountSOL = parseFloat(payment.amount || 0);
            if (amountSOL > 0) {
              // Use SOL price (default ~150 USD, but will be fetched if possible)
              const solPriceUSD = 150; // Fallback, ideally fetched from API
              usd = amountSOL * solPriceUSD;
            } else if (bits > 0 && bitsPriceUsd != null) {
              // Fallback: calculate from bits * BITS price
              usd = bits * bitsPriceUsd;
            }
          }
          
          acc[key].totalBits += bits;
          acc[key].totalUSD += usd;
          acc[key].count += 1;
          
          const paymentDate = payment.created_at || payment.createdAt || payment.timestamp || payment.date;
          if (paymentDate) {
            const date = new Date(paymentDate);
            if (!acc[key].lastPayment || date > acc[key].lastPayment) {
              acc[key].lastPayment = date;
            }
          }
          
          return acc;
        }, {});
        
        // Convert to array and sort by totalUSD descending (cea mai mare suma in USD sus)
        const sorted = Object.values(aggregated)
          .sort((a, b) => b.totalUSD - a.totalUSD) // Sort by USD, not BITS
          .slice(0, Math.max(1, Math.min(50, Number(limit || 10))))
          .map((item, index) => ({
            rank: index + 1,
            wallet: item.wallet,
            rewardBits: item.totalBits,
            usdValue: item.totalUSD,
            count: item.count,
            source: `Solana (${item.count} ${item.count === 1 ? 'payment' : 'payments'})`
          }));
        
        setSolanaRows(sorted);
      } else {
        // No payments found - set empty array
        setSolanaRows([]);
      }
    } catch (e) {
      console.error("❌ [ChampionsLeaderboard] Error fetching Solana payments:", e);
      setError(e.message || "Failed to load Solana payments");
      setSolanaRows([]);
    } finally {
      setSolanaLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSolanaData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const visibleRows = useMemo(() => {
    if (activeTab === "solana") {
      return (solanaRows || []).slice(0, Math.max(1, Math.min(50, Number(limit || 10))));
    }
    return (rows || []).slice(0, Math.max(1, Math.min(50, Number(limit || 10))));
  }, [rows, solanaRows, activeTab, limit]);

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
          <button className="lb-btn" onClick={activeTab === "evm" ? fetchData : fetchSolanaData} disabled={loading || solanaLoading}>
            {(loading || solanaLoading) ? "⏳ Loading..." : "🔄 Refresh"}
          </button>
        </div>
      </div>

      {/* Tab Selector */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <button
          type="button"
          onClick={() => setActiveTab("evm")}
          style={{
            padding: "8px 16px",
            background: activeTab === "evm" ? "rgba(0, 255, 163, 0.2)" : "transparent",
            border: "none",
            borderBottom: activeTab === "evm" ? "2px solid #00FFA3" : "2px solid transparent",
            color: activeTab === "evm" ? "#00FFA3" : "rgba(255,255,255,0.6)",
            cursor: "pointer",
            fontWeight: activeTab === "evm" ? 700 : 400,
            transition: "all 0.2s ease"
          }}
        >
          🔷 EVM Payments
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("solana")}
          style={{
            padding: "8px 16px",
            background: activeTab === "solana" ? "rgba(220, 31, 255, 0.2)" : "transparent",
            border: "none",
            borderBottom: activeTab === "solana" ? "2px solid #DC1FFF" : "2px solid transparent",
            color: activeTab === "solana" ? "#DC1FFF" : "rgba(255,255,255,0.6)",
            cursor: "pointer",
            fontWeight: activeTab === "solana" ? 700 : 400,
            transition: "all 0.2s ease"
          }}
        >
          🟣 Solana Payments
        </button>
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
            // For Solana, use usdValue if available, otherwise calculate from bitsPriceUsd
            const usd = activeTab === "solana" && r.usdValue != null 
              ? r.usdValue 
              : (bitsPriceUsd != null ? bits * bitsPriceUsd : null);
            const walletDisplay = r.wallet 
              ? `${r.wallet.slice(0, 6)}…${r.wallet.slice(-4)}`
              : "—";
            
            return (
              <div
                key={`${activeTab}-${r.rank}-${r.wallet || r.name || r.rank}`}
                className="lb-row"
                style={{ gridTemplateColumns: "64px 1fr 1fr 1fr 0.8fr 1fr" }}
              >
                <div className="lb-rank">#{r.rank}</div>
                <div style={{ fontWeight: 900 }}>{r.name || (activeTab === "solana" ? "Solana User" : "—")}</div>
                <div style={{ fontWeight: 800, color: "rgba(255,255,255,0.8)" }}>{walletDisplay}</div>
                <div className="lb-accent">{bits.toLocaleString()} $BITS</div>
                <div style={{ fontWeight: 900 }}>{usd != null ? formatUSD(usd) : "—"}</div>
                <div style={{ color: "rgba(255,255,255,0.75)" }}>{r.source || (activeTab === "solana" ? "Solana" : "—")}</div>
              </div>
            );
          })}

          {!loading && !solanaLoading && visibleRows.length === 0 && (
            <div className="lb-empty">
              {activeTab === "solana" 
                ? "No Solana payments found yet. Payments will appear here once users make purchases with SOL."
                : "No champions configured yet. Go to Admin Panel → Leaderboard → Reset default / Save."}
            </div>
          )}
        </div>
      )}
    </>
  );
}


