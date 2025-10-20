import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { default as axios } from "axios";
import { ethers } from "ethers";
import styles from "./AdminPanel.module.css";
import { toast } from "react-toastify";
import PresaleHistory from "../PresaleHistory";
import RoundEndDisplay from "../RoundEndDisplay";
import useCellManagerData from "../../hooks/useCellManagerData";
import { CONTRACTS } from "../../../contract/contracts";
import SolanaRewardsManager from "../../../components/Admin/SolanaRewardsManager";

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
const ADMIN_PASS = process.env.REACT_APP_ADMIN_PASS || "fallback123";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [autoSimRunning, setAutoSimRunning] = useState(false);
  const [manualUsd, setManualUsd] = useState("");
  const [manualBits, setManualBits] = useState("");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // New state for tabs
  
  // Round management states  
  const [supplyInput, setSupplyInput] = useState("");
  const [presaleInfo, setPresaleInfo] = useState(null);
  const [showRoundEndStats, setShowRoundEndStats] = useState(false);
  const [roundEndData, setRoundEndData] = useState(null);
  
  // Get data directly from CellManager contract
  const cellManagerData = useCellManagerData();


  useEffect(() => {
    const savedToken = localStorage.getItem("admin_token");
    if (savedToken === ADMIN_PASS) {
      setIsAuthorized(true);
      fetchSimulationStatus();
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchSimulationStatus();
      fetchPresaleState();
    }
  }, [isAuthorized]);

  const handleLogin = () => {
    const input = prompt("🔐 Enter Admin Password:");
    if (input === ADMIN_PASS) {
      setIsAuthorized(true);
      localStorage.setItem("admin_token", input);
      toast.success("✅ Autentificare reușită");
    } else {
      alert("❌ Wrong password!");
    }
  };
  const handleManualSimulation = async () => {
  const usd = parseFloat(manualUsd);
  const bits = parseInt(manualBits);

      if (isNaN(usd) || isNaN(bits) || usd <= 0 || bits <= 0) {
      toast.error("⚠️ Enter valid values for USD and BITS.");
      return;
    }

    // Check if enough BITS are available in current round
    if (!presaleInfo) {
      toast.error("❌ No active presale round!");
      return;
    }

    const availableBits = (presaleInfo.totalSupply || 0) - (presaleInfo.sold || 0);
    if (bits > availableBits) {
      toast.error(`❌ Not enough BITS available! Available: ${availableBits.toLocaleString()} BITS`);
      return;
    }

    if (availableBits <= 0) {
      toast.error("❌ No BITS available in current round!");
      return;
    }

  try {
   const res = await axios.post(`${API_URL}/api/manual-simulation/manual`, {
  password: ADMIN_PASS,
  usd,
  bits
});

          toast.success(res.data.message || "✅ Sale simulated successfully.");
      setManualUsd("");
      setManualBits("");
      fetchPresaleState(); // Refresh presale state after simulation
    } catch (err) {
      console.error("❌ Manual simulation error:", err.message);
      toast.error("❌ Manual simulation error: " + (err.response?.data?.message || err.message));
  }
};


  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsAuthorized(false);
    toast.info("🛑 Logged out successfully.");
  };

  // Fetch current presale state
  const fetchPresaleState = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/presale/current`);
      setPresaleInfo(response.data);
      console.log("📊 Current presale state:", response.data);
      console.log("🔍 [DATABASE DEBUG] tokensAvailable:", response.data?.tokensAvailable);
      console.log("🔍 [DATABASE DEBUG] sold:", response.data?.sold);
      console.log("🔍 [DATABASE DEBUG] totalSupply:", response.data?.totalSupply);
      console.log("🔍 [DATABASE DEBUG] price:", response.data?.price);
      console.log("🔍 [DATABASE DEBUG] round:", response.data?.round);
      console.log("🔍 [CALCULATION DEBUG] Should be:", (response.data?.totalSupply || 0) - (response.data?.sold || 0));
      
      // Check if round has ended (14 days = 1,209,600 seconds)
      const now = Math.floor(Date.now() / 1000);
      const roundDuration = 14 * 24 * 60 * 60; // 14 days in seconds
      const roundEndTime = response.data?.startTime + roundDuration;
      
      if (now >= roundEndTime && !showRoundEndStats) {
        // Round has ended, prepare stats
        const endStats = {
          roundNumber: response.data?.roundNumber || 1,
          totalSold: response.data?.sold || 0,
          totalRaised: response.data?.totalRaised || 0,
          duration: roundDuration,
          startTime: response.data?.startTime,
          endTime: roundEndTime,
          averagePrice: (response.data?.totalRaised || 0) / (response.data?.sold || 1),
          participantCount: Math.floor((response.data?.sold || 0) / 1000), // Estimate
          topSale: {
            amount: Math.floor((response.data?.sold || 0) * 0.1),
            value: Math.floor((response.data?.totalRaised || 0) * 0.1)
          }
        };
        setRoundEndData(endStats);
        setShowRoundEndStats(true);
      }
      
      // Check AutoSim blocking conditions
      if (!response.data) {
        console.log("🚨 [AUTOSIM BLOCK] No presale state data!");
      } else if (response.data.tokensAvailable <= 0) {
        console.log("🚨 [AUTOSIM BLOCK] tokensAvailable <= 0:", response.data.tokensAvailable);
      } else if (response.data.price <= 0) {
        console.log("🚨 [AUTOSIM BLOCK] price <= 0:", response.data.price);
      } else {
        console.log("✅ [AUTOSIM OK] All conditions met for AutoSim!");
      }
    } catch (err) {
      console.warn("⚠️ Could not fetch presale state:", err.message);
      setPresaleInfo(null);
    }
  };

  // Add new cell to CellManager
  const handleAddCell = async () => {
    const supply = parseInt(supplyInput);
    
    if (isNaN(supply) || supply <= 0) {
      toast.error("❌ Please enter valid BITS supply");
      return;
    }

    if (!cellManagerData.currentPrice || cellManagerData.currentPrice <= 0) {
      toast.error("❌ Cannot read price from CellManager. Using fallback price $0.055");
      console.warn("⚠️ Using fallback price because cellManagerData.currentPrice is:", cellManagerData.currentPrice);
      // Don't return - continue with fallback price
    }

    try {
      // Use fallback price if currentPrice is invalid
      const fallbackPrice = 0.055;
      const priceToUse = (cellManagerData.currentPrice && cellManagerData.currentPrice > 0) 
        ? cellManagerData.currentPrice 
        : fallbackPrice;
      
      console.log("🔍 [DEBUG] Price calculation:");
      console.log("- cellManagerData.currentPrice:", cellManagerData.currentPrice);
      console.log("- priceToUse:", priceToUse);
      
      // Price is already in correct format (e.g., 0.055), convert to millicents
      const standardPrice = Math.round(priceToUse * 1000);
      const privilegedPrice = Math.round(standardPrice * 0.9); // 10% discount
      const supplyWei = ethers.utils.parseUnits(supply.toString(), 18);
      
      console.log("🔍 [DEBUG] AddCell values:");
      console.log("- currentPrice:", cellManagerData.currentPrice);
      console.log("- priceToUse:", priceToUse);
      console.log("- standardPrice (millicents):", standardPrice);
      console.log("- privilegedPrice (millicents):", privilegedPrice);
      console.log("- supply:", supply);
      console.log("- supplyWei:", supplyWei.toString());

      // Get CellManager contract
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const cellManagerContract = new ethers.Contract(
        CONTRACTS.CELL_MANAGER.address,
        [
          "function addCell(uint256 standardPrice, uint256 privilegedPrice, uint256 supply) external"
        ],
        signer
      );

      toast.info("⏳ Adding new cell to CellManager...");
      
      const tx = await cellManagerContract.addCell(standardPrice, privilegedPrice, supplyWei);
      await tx.wait();

      toast.success(`✅ Cell added successfully! Supply: ${supply.toLocaleString()} BITS`);
      setSupplyInput("");
      
      // Refresh CellManager data
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err) {
      console.error("❌ Error adding cell:", err);
      toast.error("❌ Error adding cell: " + (err.message || "Unknown error"));
    }
  };

  // Set supply for current round (using CellManager data)
  const handleSetSupply = async () => {
    const tokensAvailable = parseInt(supplyInput);

    if (isNaN(tokensAvailable) || tokensAvailable <= 0) {
      toast.error("❌ Please enter valid BITS supply");
      return;
    }

    if (!cellManagerData.roundNumber || !cellManagerData.currentPrice) {
      toast.error("❌ Cannot read round data from CellManager");
      return;
    }

    // Use data from CellManager
    const round = cellManagerData.roundNumber;
    const price = Math.round(cellManagerData.currentPrice * 1000); // Convert to cents

    try {
      const response = await axios.post(`${API_URL}/api/presale/start-round`, {
        password: ADMIN_PASS,
        round,
        price,
        tokensAvailable
      });

      toast.success(response.data.message || `✅ Supply set for Round ${round}!`);
      setSupplyInput("");
      
      // 🔄 Force refresh both states
      await fetchPresaleState(); // Refresh AdminPanel data
      setTimeout(() => {
        fetchPresaleState(); // Double refresh to ensure update
      }, 1000);
    } catch (err) {
      console.error("❌ Error setting supply:", err);
      toast.error("❌ Error setting supply: " + (err.response?.data?.error || err.message));
    }
  };

  // End current round
  const handleEndRound = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/presale/end-round`, {
        password: ADMIN_PASS
      });

      toast.success(response.data.message || "✅ Round ended successfully!");
      fetchPresaleState(); // Refresh state
    } catch (err) {
      console.error("❌ Error ending round:", err);
      toast.error("❌ Error ending round: " + (err.response?.data?.error || err.message));
    }
  };

  // Reset tokens to 0
  const handleResetTokens = async () => {
    if (!window.confirm("🔥 Are you sure you want to reset tokensavailable to 0? This will remove all BITS from database!")) {
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/presale/reset-tokens`, {
        password: ADMIN_PASS
      });

      toast.success(response.data.message || "✅ Tokens reset to 0!");
      fetchPresaleState(); // Refresh state
    } catch (err) {
      console.error("❌ Error resetting tokens:", err);
      toast.error("❌ Error resetting tokens: " + (err.response?.data?.error || err.message));
    }
  };

  // Reset presale data - PRODUCTION SAFETY
  const handleResetPresale = async () => {
    // 🚨 TRIPLE CONFIRMATION FOR PRODUCTION SAFETY
    const firstConfirm = window.confirm("🚨 DANGER: Reset ALL presale data?\n\nThis will DELETE:\n- All sales data\n- All round history\n- All user transactions\n- Timer will restart\n\nThis CANNOT be undone!\n\nAre you absolutely sure?");
    if (!firstConfirm) return;
    
    const secondConfirm = window.confirm("🚨 FINAL WARNING!\n\nYou are about to PERMANENTLY DELETE all presale data!\n\nThis action is IRREVERSIBLE and will:\n- Lose all user trust\n- Delete all sales history\n- Reset everything to zero\n\nType 'DELETE ALL DATA' in the next prompt to confirm.");
    if (!secondConfirm) return;
    
    const finalConfirmation = prompt("🚨 Type exactly: DELETE ALL DATA");
    if (finalConfirmation !== "DELETE ALL DATA") {
      toast.error("❌ Reset cancelled - incorrect confirmation text");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/presale/reset`, {
        password: ADMIN_PASS
      });

      toast.success(response.data.message || "✅ Presale data reset successfully!");
      fetchPresaleState(); // Refresh state
    } catch (err) {
      console.error("❌ Error resetting presale:", err);
      toast.error("❌ Error resetting presale: " + (err.response?.data?.error || err.message));
    }
  };

  // Start new round after current round ends
  const handleStartNewRound = async () => {
    if (!cellManagerData.roundNumber || cellManagerData.roundNumber <= 0) {
      toast.error("❌ Please configure a new cell in CellManager first!");
      return;
    }

    const newSupply = prompt("🎯 Enter BITS supply for the new round:", "20000000");
    if (!newSupply || isNaN(newSupply) || parseInt(newSupply) <= 0) {
      toast.error("❌ Invalid supply amount");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/presale/start-round`, {
        password: ADMIN_PASS,
        round: cellManagerData.roundNumber,
        price: Math.round(cellManagerData.currentPrice * 100),
        tokensAvailable: parseInt(newSupply)
      });

      toast.success(`🎉 Round ${cellManagerData.roundNumber} started successfully!`);
      setShowRoundEndStats(false);
      setRoundEndData(null);
      fetchPresaleState();
    } catch (err) {
      console.error("❌ Error starting new round:", err);
      toast.error("❌ Error starting new round: " + (err.response?.data?.error || err.message));
    }
  };

  const exportToTelegram = async () => {
    try {
      let history = [];
      
      // First try to get data from CellManager
      if (cellManagerData && !cellManagerData.loading && cellManagerData.history && cellManagerData.history.length > 0) {
        console.log("📊 Using CellManager history for export:", cellManagerData.history);
        history = cellManagerData.history;
      } else {
        // Fallback to backend API
        console.log("🔍 Fetching history from backend:", `${API_URL}/api/presale/history`);
        const res = await axios.get(`${API_URL}/api/presale/history`);
        console.log("📊 Backend history response:", res.data);
        
        history = Array.isArray(res.data) ? res.data : [];
        
        if (history.length === 0 && cellManagerData && !cellManagerData.loading) {
          // Create minimal fallback from current cell data
          history = [{
            round: cellManagerData.roundNumber || 1,
            start_time: new Date().toISOString(),
            end_time: null,
            price: cellManagerData.currentPrice || 0,
            sold_bits: cellManagerData.soldBits || 0,
            tokensavailable: cellManagerData.availableBits || 0,
            raised_usd: (cellManagerData.soldBits || 0) * (cellManagerData.currentPrice || 0),
            last_update: new Date().toISOString()
          }];
          console.log("📊 Using current CellManager data as fallback:", history);
        }
      }
      
            let message = "📊 *BITS Presale Round History - Real vs Simulated*\n\n";
      message += "```\n";
      message += "Round | Price    | Real Sold | Sim Sold | Total Sold | Real Raised | Sim Raised | Total Raised | Source\n";
      message += "------|----------|-----------|----------|------------|-------------|------------|--------------|--------\n";

      history.forEach(round => {
        const price = `$${parseFloat(round.price || 0).toFixed(4)}`;
        const realSold = `${(Math.round(round.real_sold_bits || 0) / 1000).toFixed(0)}K`;
        const simSold = `${(Math.round(round.simulated_sold_bits || 0) / 1000).toFixed(0)}K`;
        const totalSold = `${(Math.round(round.total_sold_bits || 0) / 1000).toFixed(0)}K`;
        const realRaised = `$${(Math.round(round.real_raised_usd || 0) / 1000).toFixed(0)}K`;
        const simRaised = `$${(Math.round(round.simulated_raised_usd || 0) / 1000).toFixed(0)}K`;
        const totalRaised = `$${(Math.round(round.total_raised_usd || 0) / 1000).toFixed(0)}K`;
        const source = (round.data_source || 'Unknown').substring(0, 8);
        
        message += `${String(round.round || 'N/A').padEnd(5)} | ${price.padEnd(8)} | ${realSold.padEnd(9)} | ${simSold.padEnd(8)} | ${totalSold.padEnd(10)} | ${realRaised.padEnd(11)} | ${simRaised.padEnd(10)} | ${totalRaised.padEnd(12)} | ${source}\n`;
      });
      
      message += "```\n\n";
      message += `Generated: ${new Date().toLocaleString()}`;
      
      // Determine data source
      let dataSource = "No data";
      if (cellManagerData?.history?.length > 0) {
        dataSource = "CellManager Contract";
      } else if (history.length > 0) {
        dataSource = "Backend API";
      }
      message += `\nData source: ${dataSource}`;
      
      // Copy to clipboard first
      await navigator.clipboard.writeText(message);
      
      // Then open Telegram channel
      window.open('https://t.me/BitSwapDEX_AI', '_blank');
      
      // Show instructions to user
      toast.success("📱 Message copied to clipboard! Telegram channel opened - paste with Ctrl+V", {
        autoClose: 5000
      });
      
    } catch (err) {
      console.error("Export error:", err);
      toast.error("❌ Export failed: " + err.message);
    }
  };

  const exportToFile = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/presale/history`);
      const history = Array.isArray(res.data) ? res.data : [];
      
      // Create CSV content
      let csvContent = "Round,Start,End,Price,Sold BITS,Available BITS,Raised USD,Last Update\n";
      
      history.forEach(round => {
        const start = round.start_time ? new Date(round.start_time).toLocaleDateString() : 'N/A';
        const end = round.end_time ? new Date(round.end_time).toLocaleDateString() : 'N/A';
        const price = parseFloat(round.price || 0).toFixed(6);
        const sold = Math.round(round.sold_bits || 0);
        const available = Math.round(round.tokensavailable || 0);
        const raised = Math.round(round.raised_usd || 0);
        const updated = round.last_update ? new Date(round.last_update).toLocaleDateString() : 'N/A';
        
        csvContent += `${round.round || 'N/A'},${start},${end},$${price},${sold},${available},$${raised},${updated}\n`;
      });
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `presale_history_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("💾 History exported as CSV file!");
      
    } catch (err) {
      console.error("Export error:", err);
      toast.error("❌ Export failed");
    }
  };

  const fetchSimulationStatus = async () => {
    try {
      console.log("🔍 [DEBUG] Checking AutoSim status:", `${API_URL}/api/admin/status`);
      const res = await axios.get(`${API_URL}/api/admin/status`);
      console.log("📊 [DEBUG] Status response:", res.data);
      console.log("🔍 [DEBUG] Setting autoSimRunning to:", res.data.running);
      setAutoSimRunning(res.data.running);
    } catch (err) {
      console.error("❌ Eroare la status autosimulare:", err.message);
    }
  };

  const handleStartAutoSim = async () => {
    try {
      console.log("🔍 [DEBUG] Starting AutoSim - presaleInfo:", presaleInfo);
      console.log("🔍 [DEBUG] API URL:", `${API_URL}/api/admin/start`);
      console.log("🔍 [DEBUG] ADMIN_PASS:", ADMIN_PASS ? "Present" : "Missing");
      
      const res = await axios.post(`${API_URL}/api/admin/start`, {
        password: ADMIN_PASS,
      });
      
      console.log("✅ [DEBUG] AutoSim API response:", res.data);
      
      // VERIFICARE REALĂ - dacă backend-ul MINTE!
      if (res.data && res.data.message && res.data.message.includes("pornit")) {
        toast.success("⏳ Backend says started... verifying...");
        
        // Verifică imediat dacă chiar pornește
        setTimeout(async () => {
          await fetchSimulationStatus();
          
          // Verifică din nou după 3 secunde
          setTimeout(async () => {
            const statusCheck = await axios.get(`${API_URL}/api/admin/status`);
            console.log("🔍 [VERIFICATION] Status after 3 seconds:", statusCheck.data);
            
            if (!statusCheck.data.running) {
              toast.error("❌ BACKEND MINTE! Spune că a pornit dar nu pornește!");
              console.error("🚨 [BACKEND LIES] Backend returned success but simulation is NOT running!");
            } else {
              toast.success("✅ AutoSim verified as running!");
            }
          }, 3000);
        }, 1000);
      } else {
        toast.success(res.data.message || "✅ AutoSim started!");
      }
      
    } catch (err) {
      console.error("❌ [DEBUG] AutoSim error:", err);
      console.error("❌ [DEBUG] Error response:", err.response?.data);
      toast.error("❌ Error starting AutoSim: " + (err.response?.data?.message || err.message));
    }
  };

  const handleStopAutoSim = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/admin/stop`, {
        password: ADMIN_PASS,
      });
      toast.success(res.data.message || "🛑 AutoSim stopped!");
      await fetchSimulationStatus();
    } catch (err) {
      console.error("❌ Stop auto:", err.message);
      toast.error("❌ Error stopping AutoSim.");
    }
  };



  return (
    <>
      <div
        className={styles["status-badge"]}
        style={{ background: isAuthorized ? "#0f0" : "#f00" }}
      />
      {!isAuthorized ? (
        <button onClick={handleLogin} className={styles["login-btn"]}>
          🔐 Login
        </button>
      ) : (
        <div className={styles["admin-panel"]}>
          <button onClick={handleLogout} className={styles["logout-btn"]}>
            🛑 Logout
          </button>

          {/* Tab Navigation */}
          <div className={styles["tab-navigation"]} style={{
            display: 'flex',
            gap: '10px',
            margin: '20px 0',
            borderBottom: '1px solid #555',
            paddingBottom: '10px'
          }}>
            <button 
              onClick={() => setActiveTab("overview")}
              className={activeTab === "overview" ? styles["tab-active"] : styles["tab-inactive"]}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px 6px 0 0',
                background: activeTab === "overview" ? '#14F195' : '#444',
                color: activeTab === "overview" ? '#000' : '#fff',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              📊 Overview
            </button>
            <button 
              onClick={() => setActiveTab("solana-rewards")}
              className={activeTab === "solana-rewards" ? styles["tab-active"] : styles["tab-inactive"]}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px 6px 0 0',
                background: activeTab === "solana-rewards" ? '#14F195' : '#444',
                color: activeTab === "solana-rewards" ? '#000' : '#fff',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🟣 Solana Rewards
            </button>
          </div>

          {activeTab === "overview" && (
            <>
              <div style={{ 
                background: '#2a2a2a', 
                border: '1px solid #555', 
                borderRadius: '4px', 
                padding: '10px', 
                margin: '10px 0',
                fontSize: '12px',
                color: '#cccccc',
                textAlign: 'left'
              }}>
                ℹ️ <strong>Data Sources:</strong><br/>
                • <span style={{color: '#00ff88'}}>Real Sales</span>: Blockchain transactions via CellManager.sol<br/>
                • <span style={{color: '#ffaa00'}}>Simulated Sales</span>: Backend testing data (AdminPanel simulations)<br/>
                • <span style={{color: '#00d4ff'}}>Total</span>: Combined real + simulated for complete overview
              </div>



          {/* ROUND MANAGEMENT */}
          <div className={styles["section"]}>
            <h3>🎯 Set BITS Supply for Current Round</h3>
            
            {/* CellManager Data (Read-Only) */}
            <div style={{ 
              background: '#1a3a1a', 
              border: '1px solid #00ff88',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '12px',
              fontSize: '13px',
              color: '#cccccc'
            }}>
              <div style={{ color: '#00ff88', marginBottom: '8px' }}>
                <strong>📊 From CellManager (Blockchain):</strong>
              </div>
              <div><strong>Round Number:</strong> {cellManagerData.loading ? "⏳ Loading..." : (cellManagerData.roundNumber || 'N/A')}</div>
              <div><strong>Current Price:</strong> {cellManagerData.loading ? "⏳ Loading..." : `$${(cellManagerData.currentPrice || 0).toFixed(6)}`}</div>
              <div><strong>Real BITS Available:</strong> {
                cellManagerData.loading ? "⏳ Loading..." : 
                (cellManagerData.availableBits || 0) === 0 ? 
                  <span style={{color: '#ff6b35'}}>0 BITS (⚠️ Cell not configured)</span> :
                  `${(cellManagerData.availableBits || 0).toLocaleString()} BITS`
              }</div>
              <div><strong>Sold:</strong> {cellManagerData.loading ? "⏳ Loading..." : `${(cellManagerData.soldBits || 0).toLocaleString()} BITS`}</div>
              <div><strong>USD Value:</strong> {cellManagerData.loading ? "⏳ Loading..." : `$${(cellManagerData.totalUsdValue || 0).toFixed(2)}`}</div>
              <div><strong>Transactions:</strong> {cellManagerData.loading ? "⏳ Loading..." : (cellManagerData.totalTransactions || 0)}</div>
              <div><strong>Unique Wallets:</strong> {cellManagerData.loading ? "⏳ Loading..." : (cellManagerData.uniqueWallets || 0)}</div>
              {!cellManagerData.loading && (cellManagerData.availableBits || 0) === 0 && (
                <div style={{ fontSize: '11px', color: '#ff6b35', marginTop: '4px' }}>
                  💡 Cell {cellManagerData.cellId} needs BITS supply set in CellManager contract
                  <br />
                  <strong>Use "Add Cell to CellManager" button below to configure it</strong>
                </div>
              )}
            </div>

            {/* Database Data (Editable) */}
            {presaleInfo && (
              <div style={{ 
                background: '#2a2a1a', 
                border: '1px solid #ffaa00',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '12px',
                fontSize: '13px',
                color: '#cccccc'
              }}>
                <div style={{ color: '#ffaa00', marginBottom: '8px' }}>
                  <strong>💾 From Database (Simulations):</strong>
                </div>
                <div><strong>Simulation Supply:</strong> {(presaleInfo.totalSupply || 0).toLocaleString()} BITS</div>
                <div><strong>Simulated Sold:</strong> {(presaleInfo.sold || 0).toLocaleString()} BITS</div>
                <div><strong>Simulation Available:</strong> {Math.max(0, (presaleInfo.totalSupply || 0) - (presaleInfo.sold || 0)).toLocaleString()} BITS</div>
              </div>
            )}

            <input
              type="number"
              placeholder="BITS Supply for Simulations (e.g., 20000000)"
              value={supplyInput}
              onChange={(e) => setSupplyInput(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '8px',
                borderRadius: '4px',
                border: '1px solid #555',
                background: '#1a1a1a',
                color: '#fff',
                fontSize: '12px'
              }}
            />
            
            {/* Always show Database Supply button */}
            <button 
              onClick={handleSetSupply}
              disabled={!supplyInput || cellManagerData.loading}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: 'none',
                background: cellManagerData.loading ? '#666' : '#00aa00',
                color: '#fff',
                cursor: cellManagerData.loading ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}
            >
              {cellManagerData.loading ? "⏳ Loading CellManager..." : "💾 Set BITS Supply for Database Simulation"}
            </button>

            {/* Reset Tokens to 0 button */}
            <button 
              onClick={handleResetTokens}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: 'none',
                background: '#ff4444',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}
            >
              🔥 Reset Tokens to 0
            </button>
            
            {/* Optional: Add Cell to CellManager button (for blockchain) */}
            {!cellManagerData.loading && (cellManagerData.availableBits || 0) === 0 && (
              <button 
                onClick={handleAddCell}
                disabled={!supplyInput}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: 'none',
                  background: !supplyInput ? '#666' : '#ff6600',
                  color: '#fff',
                  cursor: !supplyInput ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}
              >
                🏗️ Add Cell to CellManager (Blockchain)
              </button>
            )}
            
            {/* Info text */}
            <div style={{ fontSize: '10px', color: '#888', textAlign: 'center', marginTop: '4px' }}>
              {!cellManagerData.loading && (cellManagerData.availableBits || 0) === 0 ? 
                "This will create a new cell in CellManager with the specified BITS supply" :
                "This will set simulation supply in database (CellManager already configured)"
              }
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className={styles["section"]}>
            <h3>⚡ Quick Actions</h3>
            
            <button 
              onClick={handleEndRound}
              disabled={!presaleInfo}
              className={styles.button}
              style={{ background: '#ff6b35' }}
            >
              ⏹️ End Current Round
            </button>
            
            
            {/* New Round Button - Only show when CellManager is configured */}
            {cellManagerData && !cellManagerData.loading && cellManagerData.roundNumber > 0 && (
              <button 
                onClick={handleStartNewRound}
                className={styles.button}
                style={{ background: '#28a745' }}
              >
                🚀 Start New Round {cellManagerData.roundNumber}
              </button>
            )}
          </div>

          <div className={styles["section"]}>
            <h3>🤖 Auto Simulation</h3>
            
            {/* BITS Availability Status */}
            <div style={{ 
              background: '#2a2a2a', 
              border: '1px solid #555',
              borderRadius: '6px',
              padding: '8px',
              marginBottom: '12px',
              fontSize: '13px',
              color: '#cccccc'
            }}>
              <strong>Available BITS:</strong> {
                presaleInfo 
                  ? `${((presaleInfo.totalSupply || 0) - (presaleInfo.sold || 0)).toLocaleString()} BITS`
                  : "No active round"
              }
              {presaleInfo && ((presaleInfo.totalSupply || 0) - (presaleInfo.sold || 0)) <= 0 && (
                <div style={{ color: '#cccccc', marginTop: '4px' }}>
                  ⚠️ AutoSim cannot start without available BITS
                </div>
              )}
            </div>

            <button 
              onClick={handleStartAutoSim}
              disabled={autoSimRunning}
              style={{
                opacity: autoSimRunning ? 0.5 : 1,
                cursor: autoSimRunning ? 'not-allowed' : 'pointer'
              }}
            >
              ▶️ Start AutoSim
            </button>
            
            <button 
              onClick={handleStopAutoSim}
              disabled={!autoSimRunning}
              style={{
                background: '#ffa500',
                opacity: !autoSimRunning ? 0.5 : 1,
                cursor: !autoSimRunning ? 'not-allowed' : 'pointer'
              }}
            >
              ⏸️ Pause Simulation
            </button>

            
            {/* Info message when all tokens are sold */}
            {presaleInfo && presaleInfo.sold >= presaleInfo.totalSupply && presaleInfo.totalSupply > 0 && (
              <div style={{
                background: '#2a1a1a',
                border: '1px solid #ff6b35',
                borderRadius: '4px',
                padding: '8px',
                marginTop: '8px',
                fontSize: '12px',
                color: '#ff6b35',
                textAlign: 'center'
              }}>
                ℹ️ All tokens sold - round complete! AutoSim will not perform new sales.
              </div>
            )}
            <button onClick={handleStopAutoSim} disabled={!autoSimRunning}>
              ⏹️ Stop AutoSim
            </button>
            
            <p style={{ fontSize: "14px", marginTop: "8px" }}>
              Status: {autoSimRunning ? "🟢 Active" : "🔴 Inactive"}
            </p>
          </div>
<div className={styles["section"]}>
  <h3>💰 Manual Simulation</h3>
  
  {/* BITS Availability Info */}
      <div style={{ 
      background: '#2a2a2a', 
      border: '1px solid #555',
      borderRadius: '6px',
      padding: '8px',
      marginBottom: '12px',
      fontSize: '13px',
      color: '#cccccc'
    }}>
      <strong>Available BITS:</strong> {
        presaleInfo 
          ? `${Math.max(0, (presaleInfo.totalSupply || 20000000) - (presaleInfo.sold || 0)).toLocaleString()} BITS`
          : "No active round"
      }
    </div>

 <input
  type="number"
  placeholder="Simulate USD"
  value={manualUsd}
  onChange={(e) => setManualUsd(e.target.value)}
/>
<input
  type="number"
    placeholder={`Simulate BITS (max: ${presaleInfo ? ((presaleInfo.totalSupply || 0) - (presaleInfo.sold || 0)).toLocaleString() : '0'})`}
  value={manualBits}
  onChange={(e) => setManualBits(e.target.value)}
    max={presaleInfo ? (presaleInfo.totalSupply || 0) - (presaleInfo.sold || 0) : 0}
  />

  <button 
    onClick={handleManualSimulation}
    disabled={!presaleInfo || ((presaleInfo.totalSupply || 0) - (presaleInfo.sold || 0)) <= 0}
    style={{
      opacity: (!presaleInfo || ((presaleInfo.totalSupply || 0) - (presaleInfo.sold || 0)) <= 0) ? 0.5 : 1,
      cursor: (!presaleInfo || ((presaleInfo.totalSupply || 0) - (presaleInfo.sold || 0)) <= 0) ? 'not-allowed' : 'pointer'
    }}
  >
    ➕ Simulate Sale
  </button>
</div>

            <div className={styles["info-section"]}>
            <h3>📊 Current State (from CellManager)</h3>
            {cellManagerData.loading ? (
              <p>⏳ Loading data from CellManager...</p>
            ) : cellManagerData.error ? (
              <p style={{ color: 'red' }}>❌ {cellManagerData.error}</p>
            ) : (
              <>
                <p>Cell ID: {cellManagerData.cellId}</p>
                <p>Round: {cellManagerData.roundNumber}</p>
                <p>Price: ${cellManagerData.currentPrice?.toFixed(6) || 'N/A'}</p>
                <p>Available: {cellManagerData.availableBits?.toLocaleString() || 'N/A'} BITS</p>
                <p>Sold: {cellManagerData.soldBits?.toLocaleString() || 'N/A'} BITS</p>
              </>
            )}
            </div>
          <div className={styles["section"]}>
            <h3>📜 Round History</h3>
            <button 
              onClick={() => setShowHistoryModal(true)}
              style={{
                background: '#00d4ff',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              📊 View Round History
            </button>
          </div>

          {/* Smart Staking Quick Access */}
          <div className={styles["section"]} style={{ marginTop: '15px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 51, 102, 0.1)',
              border: '1px solid rgba(255, 51, 102, 0.3)',
              borderRadius: '8px',
              padding: '12px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px' }}>🚀</span>
                <div>
                  <div style={{ 
                    color: '#ff3366', 
                    fontSize: '13px', 
                    fontWeight: 'bold',
                    marginBottom: '2px'
                  }}>
                    Smart Staking
                  </div>
                  <div style={{ 
                    color: '#ccc', 
                    fontSize: '11px'
                  }}>
                    Pre-authorize NFT purchases
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {
                  navigate('/smart-staking');
                  toast.success('🚀 Navigating to Smart Staking...', {
                    position: "top-right",
                    autoClose: 2000
                  });
                }}
                style={{
                  background: 'linear-gradient(135deg, #ff3366, #ff1a4d)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(255, 51, 102, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(255, 51, 102, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 8px rgba(255, 51, 102, 0.3)';
                }}
              >
                Open 🎯
              </button>
            </div>
          </div>

            </>
          )}

          {activeTab === "solana-rewards" && (
            <SolanaRewardsManager onBack={() => setActiveTab("overview")} />
          )}

        </div>
      )}

      {/* History Modal - Outside AdminPanel container */}
      {showHistoryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#1a1a1a',
            border: '2px solid #00d4ff',
            borderRadius: '12px',
            padding: '20px',
            width: '95vw',
            height: '90vh',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header with close and export buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px',
              paddingRight: '40px'
            }}>
              <h2 style={{ color: '#00d4ff', margin: 0 }}>📜 Round History</h2>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => exportToTelegram()}
                  style={{
                    background: '#0088cc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  📱 Export to Telegram
                </button>
                <button 
                  onClick={() => exportToFile()}
                  style={{
                    background: '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  💾 Save as File
                </button>
              </div>
            </div>

            <button 
              onClick={() => setShowHistoryModal(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: '#ff4444',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                zIndex: 10000
              }}
            >
              ✕
            </button>

            {/* Content area */}
            <div style={{
              flex: 1,
              overflow: 'auto', /* Enable scrolling */
              display: 'flex',
              flexDirection: 'column'
            }}>
              <PresaleHistory />
            </div>
          </div>
        </div>
      )}

      {/* Round End Statistics Display */}
      {showRoundEndStats && roundEndData && (
        <RoundEndDisplay 
          roundData={roundEndData}
          onStartNewRound={handleStartNewRound}
        />
      )}
    </>
  );
};

export default AdminPanel;
