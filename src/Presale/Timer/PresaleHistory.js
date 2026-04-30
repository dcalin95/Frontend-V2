import React, { useEffect, useState } from "react";
import styles from "./PresaleHistory.module.css";
import axios from "axios";
import useCellManagerData from "../hooks/useCellManagerData";
import { resolvePresaleBackendUrl } from "../presaleApi";

const PresaleHistory = () => {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const cellManagerData = useCellManagerData();

  const exportPublicToTelegram = async () => {
    try {
      let message = "📊 *BITS Presale Progress Report*\n\n";
      message += "```\n";
      message += "Round | Price    | Sold   | Raised | Available | Status\n";
      message += "------|----------|--------|--------|-----------|--------\n";

      if (Array.isArray(history) && history.length > 0) {
        history.forEach(round => {
          const price = `$${parseFloat(round.price || 0).toFixed(4)}`;
          const sold = `${(Math.round(round.total_sold_bits || 0) / 1000).toFixed(0)}K`;
          const raised = `$${(Math.round(round.total_raised_usd || 0) / 1000).toFixed(0)}K`;
          const available = `${(Math.round(round.theoretical_available || round.real_available || 0) / 1000).toFixed(0)}K`;
          const status = round.end_time && round.end_time !== 'N/A' ? 'Closed' : 'Active';
          
          message += `${String(round.round || 'N/A').padEnd(5)} | ${price.padEnd(8)} | ${sold.padEnd(6)} | ${raised.padEnd(6)} | ${available.padEnd(9)} | ${status}\n`;
        });
      } else {
        message += "No presale rounds available yet\n";
      }

      message += "```\n\n";
      message += `🚀 Join the BITS presale now!\n`;
      message += `💎 Early bird prices available\n`;
      message += `📈 Multiple rounds with increasing value\n\n`;
      message += `Generated: ${new Date().toLocaleString()}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(message);

      // Open Telegram channel
      window.open('https://t.me/BitSwapDEX_AI', '_blank');

      // Show success message
      console.log("📱 Public presale stats exported to Telegram:", message);
      alert("📱 Public presale stats copied to clipboard! Telegram channel opened - paste with Ctrl+V");

    } catch (err) {
      console.error("❌ Export error:", err);
      alert("❌ Export failed: " + err.message);
    }
  };

  const combineRealAndSimulatedData = (realHistory, simulatedHistory) => {
    console.log("🔄 [PresaleHistory] Combining real and simulated data");
    console.log("📊 Real history:", realHistory);
    console.log("📘 Backend analytics history:", simulatedHistory);

    const combinedHistory = [];

    // Create a map of simulated data by round
    const simulatedMap = {};
    if (Array.isArray(simulatedHistory)) {
      simulatedHistory.forEach(sim => {
        simulatedMap[sim.round] = sim;
      });
    }

            // Combine real data with simulated data
        realHistory.forEach(real => {
          const simulated = simulatedMap[real.round] || {};
          
          const combined = {
            ...real,
            // Real data (from CellManager)
            real_sold_bits: real.real_sold_bits || 0,
            real_raised_usd: real.real_raised_usd || 0,
            // Backend analytics (off-chain)
            simulated_sold_bits: simulated.sold_bits || 0,
            simulated_raised_usd: simulated.raised_usd || 0,
            // Totals
            total_sold_bits: (real.real_sold_bits || 0) + (simulated.sold_bits || 0),
            total_raised_usd: (real.real_raised_usd || 0) + (simulated.raised_usd || 0),
            // SMART AVAILABLE CALCULATION
            real_available: real.tokensavailable || 0,
            theoretical_available: Math.max(0, (real.tokensavailable || 0) - (simulated.sold_bits || 0)),
            // Legacy fields (use totals for compatibility)
            sold_bits: (real.real_sold_bits || 0) + (simulated.sold_bits || 0),
            raised_usd: (real.real_raised_usd || 0) + (simulated.raised_usd || 0),
            data_source: "Combined: Real + Backend Analytics"
          };

      combinedHistory.push(combined);
    });

    console.log("✅ [PresaleHistory] Combined result:", combinedHistory);
    return combinedHistory;
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        let realHistory = [];
        let simulatedHistory = [];

        // Get real data from CellManager
        if (cellManagerData && !cellManagerData.loading && cellManagerData.history && cellManagerData.history.length > 0) {
          console.log("📊 [PresaleHistory] Got real data from CellManager:", cellManagerData.history);
          realHistory = cellManagerData.history;
        }

        // Get backend analytics (off-chain)
        try {
          const backendUrl = await resolvePresaleBackendUrl();
          console.log("📘 [PresaleHistory] Fetching backend analytics:", `${backendUrl}/api/presale/history`);
          const res = await axios.get(`${backendUrl}/api/presale/history`);
          console.log("📘 [PresaleHistory] Backend analytics response:", res.data);
          simulatedHistory = Array.isArray(res.data) ? res.data : [];
        } catch (backendErr) {
          console.warn("⚠️ [PresaleHistory] Backend analytics unavailable:", backendErr.message);
          simulatedHistory = [];
        }

        // Combine real and simulated data
        if (realHistory.length > 0) {
          const combinedData = combineRealAndSimulatedData(realHistory, simulatedHistory);
          setHistory(combinedData);
          setError("");
        } else if (simulatedHistory.length > 0) {
          // Only backend analytics available
          console.log("📘 [PresaleHistory] Only backend analytics available");
          const simulatedOnly = simulatedHistory.map(sim => ({
            ...sim,
            real_sold_bits: 0,
            real_raised_usd: 0,
            simulated_sold_bits: sim.sold_bits || 0,
            simulated_raised_usd: sim.raised_usd || 0,
            total_sold_bits: sim.sold_bits || 0,
            total_raised_usd: sim.raised_usd || 0,
            data_source: "Backend Analytics Only (No Real Sales)"
          }));
          setHistory(simulatedOnly);
          setError("⚠️ Showing backend analytics only - no real blockchain sales detected");
        } else {
          // No data at all
          console.log("❌ [PresaleHistory] No data available from any source");
          setHistory([]);
          setError("No history data available from CellManager or backend");
        }
        
      } catch (err) {
        console.error("❌ Error fetching history:", err.message);
        setError("Could not load history data");
        setHistory([]);
      }
    };
    
    fetchHistory();
  }, [cellManagerData]);

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>📜 Presale Round History</h2>
      <div style={{ fontSize: '13px', color: '#666', marginBottom: '16px', background: '#1a1a1a', padding: '12px', borderRadius: '6px', border: '1px solid #333' }}>
        <p style={{ margin: '0 0 8px 0' }}>
          <strong>Data Sources:</strong> Prices and rounds are managed exclusively in CellManager.sol
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          <strong>Available BITS Logic:</strong>
        </p>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li><span style={{color: '#00ff88'}}>Real Available</span>: Actual BITS in CellManager contract</li>
          <li><span style={{color: '#ffaa00'}}>Theoretical Available</span>: Real Available minus simulated sales</li>
          <li><strong>Note:</strong> Simulations don't affect the blockchain contract, only frontend calculations</li>
        </ul>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {/* 1. REAL SALES TABLE - Blockchain Only */}
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ color: '#00ff88', marginBottom: '5px', fontSize: '14px' }}>
          🟢 Real Sales (Blockchain Transactions)
        </h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Start</th>
              <th>End</th>
              <th>Price</th>
              <th>Sold BITS</th>
              <th>Raised USD</th>
              <th>Available</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(history) && history.length > 0 ? (
              history.map((round, index) => (
                <tr key={`real-${round.id || index}`}>
                  <td><strong>{round.round || 'N/A'}</strong></td>
                  <td>{round.start_time ? new Date(round.start_time).toLocaleDateString() : 'N/A'}</td>
                  <td>{round.end_time ? new Date(round.end_time).toLocaleDateString() : 'N/A'}</td>
                  <td><strong>${parseFloat(round.price || 0).toFixed(4)}</strong></td>
                  <td style={{ color: '#00ff88', fontWeight: 'bold' }}>
                    {(Math.round(round.real_sold_bits || 0) / 1000).toFixed(0)}K
                  </td>
                  <td style={{ color: '#00ff88', fontWeight: 'bold' }}>
                    ${(Math.round(round.real_raised_usd || 0) / 1000).toFixed(0)}K
                  </td>
                  <td>{(Math.round(round.tokensavailable || 0) / 1000).toFixed(0)}K</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                  ⏳ No real sales data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 2. SIMULATED SALES TABLE - Backend Only */}
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ color: '#ffaa00', marginBottom: '5px', fontSize: '14px' }}>
          🟠 Testing Sales (AdminPanel Data)
        </h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Start</th>
              <th>End</th>
              <th>Price</th>
              <th>Sold BITS</th>
              <th>Raised USD</th>
              <th>Available</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(history) && history.length > 0 ? (
              history.map((round, index) => (
                <tr key={`sim-${round.id || index}`}>
                  <td><strong>{round.round || 'N/A'}</strong></td>
                  <td>{round.start_time ? new Date(round.start_time).toLocaleDateString() : 'N/A'}</td>
                  <td>{round.end_time ? new Date(round.end_time).toLocaleDateString() : 'N/A'}</td>
                  <td><strong>${parseFloat(round.price || 0).toFixed(4)}</strong></td>
                  <td style={{ color: '#ffaa00', fontWeight: 'bold' }}>
                    {(Math.round(round.simulated_sold_bits || 0) / 1000).toFixed(0)}K
                  </td>
                  <td style={{ color: '#ffaa00', fontWeight: 'bold' }}>
                    ${(Math.round(round.simulated_raised_usd || 0) / 1000).toFixed(0)}K
                  </td>
                  <td>{(Math.round(round.tokensavailable || 0) / 1000).toFixed(0)}K</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                  ⏳ No simulated sales data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 3. TOTAL SALES TABLE - Combined */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: '#00d4ff', marginBottom: '5px', fontSize: '14px' }}>
          🔵 Total Sales (Internal Analysis)
        </h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Start</th>
              <th>End</th>
              <th>Price</th>
              <th>Total Sold</th>
              <th>Total Raised</th>
              <th>Real Available</th>
              <th>Theoretical Available</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(history) && history.length > 0 ? (
              history.map((round, index) => (
                <tr key={`total-${round.id || index}`}>
                  <td><strong>{round.round || 'N/A'}</strong></td>
                  <td>{round.start_time ? new Date(round.start_time).toLocaleDateString() : 'N/A'}</td>
                  <td>{round.end_time ? new Date(round.end_time).toLocaleDateString() : 'N/A'}</td>
                  <td><strong>${parseFloat(round.price || 0).toFixed(4)}</strong></td>
                  <td style={{ color: '#00d4ff', fontWeight: 'bold' }}>
                    {round.total_sold_bits > 0 
                      ? `${Math.round(round.total_sold_bits).toLocaleString()}`
                      : '0 (No Sales)'
                    }
                  </td>
                  <td style={{ color: '#00d4ff', fontWeight: 'bold' }}>
                    {round.total_raised_usd > 0 
                      ? `$${Math.round(round.total_raised_usd).toLocaleString()}`
                      : '$0 (No Sales)'
                    }
                  </td>
                  <td style={{ color: '#00ff88' }}>
                    {Math.round(round.real_available || 0).toLocaleString()}
                    <br/><small>(CellManager)</small>
                  </td>
                  <td style={{ color: '#ffaa00' }}>
                    {Math.round(round.theoretical_available || 0).toLocaleString()}
                    <br/><small>(Real - Simulated)</small>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>
                  {error ? '❌ Error loading data' : '⏳ No history data available'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. PUBLIC EXPORT TABLE - For Telegram */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
          <h3 style={{ color: '#00ff00', margin: 0, fontSize: '14px' }}>
            📈 Public Presale Stats (For Export)
          </h3>
          <button
            onClick={() => exportPublicToTelegram()}
            style={{
              background: '#00aa00',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: 'bold'
            }}
          >
            📱 Export to Telegram
          </button>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Round #</th>
              <th>Price</th>
              <th>BITS Sold</th>
              <th>USD Raised</th>
              <th>BITS Available</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(history) && history.length > 0 ? (
              history.map((round, index) => (
                <tr key={`public-${round.id || index}`}>
                  <td><strong>{round.round || 'N/A'}</strong></td>
                  <td><strong>${parseFloat(round.price || 0).toFixed(4)}</strong></td>
                  <td style={{ color: '#00ff00', fontWeight: 'bold' }}>
                    {round.total_sold_bits > 0 
                      ? `${(Math.round(round.total_sold_bits) / 1000).toFixed(0)}K`
                      : '0K'
                    }
                  </td>
                  <td style={{ color: '#00ff00', fontWeight: 'bold' }}>
                    {round.total_raised_usd > 0 
                      ? `$${(Math.round(round.total_raised_usd) / 1000).toFixed(0)}K`
                      : '$0K'
                    }
                  </td>
                  <td style={{ color: '#ffaa00' }}>
                    {(Math.round(round.theoretical_available || round.real_available || 0) / 1000).toFixed(0)}K
                  </td>
                  <td style={{ fontSize: '10px', color: '#999' }}>
                    {round.end_time && round.end_time !== 'N/A' ? 'Closed' : 'Active'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                  ⏳ No presale data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PresaleHistory;
