import React, { useState, useEffect, useContext } from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import WalletContext from "../../context/WalletContext";
import { CONTRACT_MAP as CONTRACTS } from "../../contract/contractMap";
import { toBitsInteger, formatBITS, calculateBonusBITSInteger, logBITSConversion, bitsToWei } from "../../utils/bitsUtils";
import "./SolanaRewardsManager.css";

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";

const SolanaRewardsManager = ({ onBack }) => {
  const { signer, walletAddress } = useContext(WalletContext);
  const [solanaInvestments, setSolanaInvestments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedInvestments, setSelectedInvestments] = useState(new Set());
  const [usingTestData, setUsingTestData] = useState(false);
  const [bscWallets, setBscWallets] = useState({}); // solanaWallet -> bsc wallet mapping
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Tier rates for bonus calculation
  const BONUS_TIERS = [
    { min: 250, max: 499, rate: 5 },
    { min: 500, max: 999, rate: 7 },
    { min: 1000, max: 2499, rate: 10 },
    { min: 2500, max: Infinity, rate: 15 }
  ];

  useEffect(() => {
    fetchSolanaInvestments();
  }, []);

  const fetchSolanaInvestments = async () => {
    setLoading(true);
    try {
      console.log("🔍 [SolanaRewardsManager] Fetching Solana investments from:", `${API_URL}/api/admin/solana-investments`);
      
      const response = await fetch(`${API_URL}/api/admin/solana-investments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        }
      });

      console.log("📡 [SolanaRewardsManager] Response status:", response.status);

      if (!response.ok) {
        console.warn(`⚠️ [SolanaRewardsManager] Admin endpoint failed with status ${response.status}:`, response.statusText);
        
        // Try to get error details
        try {
          const errorText = await response.text();
          console.error("📄 [SolanaRewardsManager] Response body:", errorText);
        } catch (e) {
          console.error("❌ [SolanaRewardsManager] Could not read response body:", e);
        }
        
        // Fallback: Use mock data for testing
        console.log("🔄 [SolanaRewardsManager] Falling back to test data...");
        const fallbackInvestments = await fetchSolanaInvestmentsFallback();
        await processFetchedInvestments(fallbackInvestments);
        setUsingTestData(true);
        toast.warning("⚠️ Using test data - Backend endpoint not available");
        return;
      }

      const investments = await response.json();
      console.log("✅ [SolanaRewardsManager] Raw investments from admin endpoint:", investments);
      
      // Process the investments data
      await processFetchedInvestments(investments);
      setUsingTestData(false); // Reset test data flag on successful load

    } catch (error) {
      console.error("❌ [SolanaRewardsManager] Error in fetchSolanaInvestments:", error);
      console.error("❌ [SolanaRewardsManager] Error details:", {
        message: error.message,
        stack: error.stack,
        apiUrl: API_URL,
        token: localStorage.getItem('admin_token') ? 'Present' : 'Missing'
      });
      
      // Try fallback before showing error
      try {
        console.log("🔄 [SolanaRewardsManager] Attempting fallback due to primary error...");
        const fallbackInvestments = await fetchSolanaInvestmentsFallback();
        
        // Process fallback data same way as primary data
        await processFetchedInvestments(fallbackInvestments);
        setUsingTestData(true);
        
        toast.warning("⚠️ Using test data - Backend endpoint not available");
      } catch (fallbackError) {
        console.error("❌ [SolanaRewardsManager] Fallback also failed:", fallbackError);
        toast.error(`Failed to load Solana investments: ${error.message}. Fallback: ${fallbackError.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const processFetchedInvestments = async (investments) => {
    console.log("🔄 [SolanaRewardsManager] Processing investments data:", investments);
    
    // Group by wallet and calculate totals
    const grouped = {};
    investments.forEach(inv => {
      const wallet = inv.userWallet || inv.wallet;
      if (!grouped[wallet]) {
        grouped[wallet] = {
          wallet: wallet,
          investments: [],
          totalUSD: 0,
          totalBITS: 0,
          bonusCalculated: 0,
          bonusRate: 0,
          processed: false
        };
      }
      grouped[wallet].investments.push(inv);
      grouped[wallet].totalUSD += inv.usdInvested || 0;
      grouped[wallet].totalBITS += inv.bitsReceived || 0;
    });

    // Calculate bonus for each wallet
    for (const group of Object.values(grouped)) {
      const tier = BONUS_TIERS.find(t => group.totalUSD >= t.min && group.totalUSD <= t.max);
      if (tier) {
        group.bonusRate = tier.rate;
        group.bonusUSD = (group.totalUSD * tier.rate) / 100;
        group.bonusCalculated = await calculateBonusInBITS(group.totalUSD);
        group.bonusType = "BITS";
      }
      // Check if already processed (all investments have loyalty_processed = true)
      group.processed = group.investments.every(inv => inv.loyalty_processed);
    }

    setSolanaInvestments(Object.values(grouped));
    console.log("📊 [SolanaRewardsManager] Processed investments:", Object.values(grouped));
  };

  const fetchSolanaInvestmentsFallback = async () => {
    console.log("🔄 [SolanaRewardsManager] Using fallback data loading...");
    
    try {
      // Try to fetch from alternative endpoints (backend transactions)
      console.log("📊 [SolanaRewardsManager] Checking alternative data sources (transactions)...");
      try {
        const resp = await fetch(`${API_URL}/api/transactions/debug/solana`);
        if (resp.ok) {
          const txs = await resp.json();
          // Fetch live SOL price for USD conversion
          let solPrice = 150;
          try {
            const cg = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
            if (cg.ok) {
              const d = await cg.json();
              const live = Number(d?.solana?.usd);
              if (Number.isFinite(live) && live > 0) solPrice = live;
            }
          } catch (e) {}
          const mapped = txs
            .filter(tx => (tx.status || '').toLowerCase() === 'confirmed')
            .map(tx => ({
              userWallet: tx.wallet_address,
              amount: Number(tx.amount || 0), // SOL
              bitsReceived: Number(tx.bits_received || 0),
              usdInvested: Number(tx.amount || 0) * solPrice,
              type: 'SOL',
              network: 'Solana',
              signature: tx.tx_signature || tx.signature || null,
              loyaltyEligible: true,
              loyalty_processed: false,
              created_at: tx.date || new Date().toISOString()
            }));
          if (mapped.length > 0) {
            console.log("✅ [SolanaRewardsManager] Built investments from /api/transactions/debug/solana", mapped);
            return mapped;
          }
        }
      } catch (e) {
        console.log("ℹ️ [SolanaRewardsManager] Alternative transactions source not available:", e.message);
      }
      
      // Fallback: Generate mock data for development/testing
      const mockInvestments = [
        {
          id: 1,
          userWallet: "7nYJvKp8EZrJtECb9qK6uP3zKnMdZvK8oU2sF9sA3B",
          amount: 2.5,
          bitsReceived: 375,
          usdInvested: 375.0,
          type: "SOL",
          network: "Solana",
          signature: "3nX1B5K8R7Y8gP2mW9aZ3T5nD4cV1uJ8oK3sL6hU4F",
          loyaltyEligible: true,
          loyalty_processed: false,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          userWallet: "4nYJvKp8EZrJtECb9qK6uP3zKnMdZvK8oU2sF9sB4C",
          amount: 750,
          bitsReceived: 750,
          usdInvested: 750.0,
          type: "USDC-Solana",
          network: "Solana",
          signature: "4nX1B5K8R7Y8gP2mW9aZ3T5nD4cV1uJ8oK3sL6hU5G",
          loyaltyEligible: true,
          loyalty_processed: false,
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          userWallet: "7nYJvKp8EZrJtECb9qK6uP3zKnMdZvK8oU2sF9sA3B", // Same wallet as first
          amount: 1250,
          bitsReceived: 1250,
          usdInvested: 1250.0,
          type: "USDC-Solana",
          network: "Solana", 
          signature: "5nX1B5K8R7Y8gP2mW9aZ3T5nD4cV1uJ8oK3sL6hU6H",
          loyaltyEligible: true,
          loyalty_processed: true, // Already processed
          created_at: new Date().toISOString()
        }
      ];

      console.log("🧪 [SolanaRewardsManager] Using mock data for testing:", mockInvestments);
      return mockInvestments;

    } catch (fallbackError) {
      console.error("❌ [SolanaRewardsManager] Fallback also failed:", fallbackError);
      throw new Error("Both primary and fallback data loading failed");
    }
  };

  const calculateBonusInBITS = async (usdAmount) => {
    const tier = BONUS_TIERS.find(t => usdAmount >= t.min && usdAmount <= t.max);
    if (!tier) return 0;
    
    const bonusUSD = (usdAmount * tier.rate) / 100;
    
    // Get current BITS price from presale data  
    try {
      const response = await fetch(`${API_URL}/api/presale/current`);
      const presaleData = await response.json();
      const bitsPrice = presaleData.currentPrice || 1.0;
      
      // Calculate integer BITS bonus
      const bonusInBITSInteger = calculateBonusBITSInteger(usdAmount, bitsPrice, tier.rate);
      
      console.log(`💎 [BONUS CALC - INTEGER] ${usdAmount} USD → ${tier.rate}% → ${bonusUSD} USD → ${bonusInBITSInteger} BITS (price: $${bitsPrice}) - ROUNDED DOWN FOR NODE.SOL`);
      
      return bonusInBITSInteger;
    } catch (error) {
      console.error("❌ Error fetching BITS price:", error);
      // Fallback calculation with integer rounding
      const fallbackBITS = toBitsInteger(bonusUSD); // Assume $1 per BITS fallback
      console.log(`⚠️ [FALLBACK] Using ${fallbackBITS} BITS (assuming $1 per BITS)`);
      return fallbackBITS;
    }
  };

  const handleSelectInvestment = (wallet) => {
    const newSelected = new Set(selectedInvestments);
    if (newSelected.has(wallet)) {
      newSelected.delete(wallet);
    } else {
      newSelected.add(wallet);
    }
    setSelectedInvestments(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedInvestments.size === solanaInvestments.filter(inv => !inv.processed).length) {
      setSelectedInvestments(new Set());
    } else {
      const unprocessed = solanaInvestments.filter(inv => !inv.processed).map(inv => inv.wallet);
      setSelectedInvestments(new Set(unprocessed));
    }
  };

  const processSingleReward = async (investment) => {
    if (!signer) {
      toast.error("Please connect your wallet");
      return;
    }

    try {
      // Validate destination BSC wallet
      const targetBscWallet = (bscWallets[investment.wallet] || "").trim();
      if (!ethers.utils.isAddress(targetBscWallet)) {
        toast.error("Invalid or missing BSC wallet. Please enter a valid 0x address.");
        return;
      }

      // Ensure BITS amount is integer for contract processing
      const integerBITS = toBitsInteger(investment.bonusCalculated);
      const bitsInWei = bitsToWei(integerBITS);
      
      console.log("🎁 [SolanaRewardsManager] Processing BITS reward for:", investment.wallet);
      console.log("💎 Original amount:", investment.bonusCalculated, "BITS");
      console.log("🎯 Integer amount for contract:", integerBITS, "BITS");
      console.log("🔢 Wei amount:", bitsInWei);
      
      // First, authorize node.sol to transfer BITS
      const nodeContract = new ethers.Contract(
        CONTRACTS.NODE.address,
        CONTRACTS.NODE.abi,
        signer
      );

      // Get admin wallet address for authorization
      const adminAddress = await signer.getAddress();
      
      // Authorize additional reward contract to distribute BITS
      console.log("🔑 [NODE AUTH] Authorizing AdditionalReward.sol to transfer:", bitsInWei, "Wei");
      
      // Call node.sol to authorize the reward transfer
      const authTx = await nodeContract.authorizeRewardDistribution(
        CONTRACTS.ADDITIONAL_REWARD.address,
        targetBscWallet,
        bitsInWei
      );
      
      await authTx.wait();
      console.log("✅ Node authorization completed:", authTx.hash);

      // Now process the reward through AdditionalReward contract
      const additionalReward = new ethers.Contract(
        CONTRACTS.ADDITIONAL_REWARD.address,
        CONTRACTS.ADDITIONAL_REWARD.abi,
        signer
      );

      // Use the integer BITS amount for contract calls
      const tx = await additionalReward.processSolanaReward(
        targetBscWallet,
        bitsInWei,
        investment.totalUSD // keep USD for tracking
      );
      
      console.log("📤 Reward transaction sent:", tx.hash);
      toast.info(`⏳ Processing ${integerBITS} BITS reward for ${investment.wallet.slice(0, 8)}...`);
      
      const receipt = await tx.wait();
      console.log("✅ BITS reward transaction confirmed:", receipt);

      // Mark as processed in backend
      await fetch(`${API_URL}/api/admin/mark-solana-processed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({
          wallet: investment.wallet,
          txHash: receipt.transactionHash,
          bonusAmount: integerBITS, // Use integer amount
          bonusType: "BITS",
          bonusUSD: investment.bonusUSD,
          authTxHash: authTx.hash,
          bscWallet: targetBscWallet
        })
      });

      toast.success(`🎉 ${integerBITS} BITS reward sent to ${investment.wallet.slice(0, 8)}...${investment.wallet.slice(-6)}`);
      
      // Refresh data
      fetchSolanaInvestments();

    } catch (error) {
      console.error("❌ Error processing BITS reward:", error);
      let errorMsg = error.message;
      if (error.message.includes("authorizeRewardDistribution")) {
        errorMsg = "Failed to authorize reward distribution via node.sol";
      } else if (error.message.includes("processSolanaReward")) {
        errorMsg = "Failed to process Solana reward in AdditionalReward.sol";  
      }
      toast.error(`Failed to process reward: ${errorMsg}`);
    }
  };

  const processBatchRewards = async () => {
    if (selectedInvestments.size === 0) {
      toast.warning("Please select investments to process");
      return;
    }

    if (!signer) {
      toast.error("Please connect your wallet");
      return;
    }

    setProcessing(true);
    let successCount = 0;
    
    try {
      for (const wallet of selectedInvestments) {
        const investment = solanaInvestments.find(inv => inv.wallet === wallet);
        if (investment && !investment.processed) {
          try {
            await processSingleReward(investment);
            successCount++;
            // Small delay between transactions
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (error) {
            console.error(`Failed to process ${wallet}:`, error);
          }
        }
      }

      toast.success(`🎉 Successfully processed ${successCount} rewards!`);
      setSelectedInvestments(new Set());
      
    } finally {
      setProcessing(false);
    }
  };

  const formatWallet = (wallet) => {
    return `${wallet.slice(0, 8)}...${wallet.slice(-6)}`;
  };

  const formatUSD = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatReward = (investment) => {
    if (investment.bonusType === "BITS") {
      // Use integer BITS formatting
      const integerBits = toBitsInteger(investment.bonusCalculated);
      return formatBITS(integerBits);
    }
    return formatUSD(investment.bonusCalculated);
  };

  return (
    <div className="solana-rewards-manager">
      <div className="srm-header">
        {onBack && (
          <button onClick={onBack} className="back-btn">
            ← Back
          </button>
        )}
        <h2>🟣 Solana Rewards Manager</h2>
        <button onClick={fetchSolanaInvestments} disabled={loading} className="refresh-btn">
          {loading ? "⏳" : "🔄"} {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {solanaInvestments.some(inv => !inv.processed) && (
        <div style={{
          background: 'rgba(20,241,149,0.08)',
          border: '1px solid rgba(20,241,149,0.25)',
          borderRadius: '8px',
          padding: '12px 14px',
          margin: '10px 0 14px 0'
        }}>
          <div style={{fontWeight:700, color:'#14F195', marginBottom:4}}>Manual BITS Distribution Required</div>
          <div style={{fontSize:'0.9rem', opacity:0.85}}>There are confirmed Solana investments pending rewards. Select wallets and click “Process” to send BITS via AdditionalReward.sol.</div>
        </div>
      )}

      {usingTestData && (
        <div style={{
          background: 'rgba(255, 165, 0, 0.1)',
          border: '1px solid rgba(255, 165, 0, 0.3)',
          borderRadius: '6px',
          padding: '10px',
          margin: '10px 0',
          textAlign: 'center',
          fontSize: '0.9rem',
          color: '#ffa500'
        }}>
          🧪 <strong>Test Mode:</strong> Using mock data - Backend endpoint not available
          <div style={{ fontSize: '0.8rem', marginTop: '5px', opacity: 0.8 }}>
            Click Refresh to retry connecting to backend
          </div>
        </div>
      )}

      <div className="stats">
        <div className="stat-card">
          <span className="stat-label">Total Wallets</span>
          <span className="stat-value">{solanaInvestments.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Unprocessed</span>
          <span className="stat-value">{solanaInvestments.filter(inv => !inv.processed).length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Selected</span>
          <span className="stat-value">{selectedInvestments.size}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Pending Rewards</span>
          <span className="stat-value">
            {formatBITS(
              solanaInvestments
                .filter(inv => !inv.processed)
                .reduce((sum, inv) => sum + toBitsInteger(inv.bonusCalculated || 0), 0)
            )}
          </span>
        </div>
      </div>

      <div className="actions">
        <button 
          onClick={handleSelectAll} 
          className="select-all-btn"
          disabled={solanaInvestments.filter(inv => !inv.processed).length === 0}
        >
          {selectedInvestments.size === solanaInvestments.filter(inv => !inv.processed).length ? "Deselect All" : "Select All"}
        </button>
        <button 
          onClick={processBatchRewards}
          disabled={selectedInvestments.size === 0 || processing}
          className="process-btn"
        >
          {processing ? "⏳ Processing..." : `🚀 Process ${selectedInvestments.size} Rewards`}
        </button>
      </div>

      <div className="investments-table">
        <div className="table-header">
          <div className="col-select">Select</div>
          <div className="col-wallet">Wallet</div>
          <div className="col-total-usd">Total USD</div>
          <div className="col-total-bits">Total BITS</div>
          <div className="col-bonus-rate">Bonus Rate</div>
          <div className="col-bonus-amount">Reward (BITS)</div>
          <div className="col-status">Status</div>
          <div className="col-actions">Actions</div>
        </div>

        {loading ? (
          <div className="loading">⏳ Loading investments...</div>
        ) : solanaInvestments.length === 0 ? (
          <div className="no-data">
            <div>No Solana investments found</div>
            <div style={{ fontSize: '0.8rem', marginTop: '10px', opacity: 0.7 }}>
              📡 API Endpoint: {API_URL}/api/admin/solana-investments
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '5px', opacity: 0.7 }}>
              🔑 Token: {localStorage.getItem('admin_token') ? 'Present' : 'Missing'}
            </div>
          </div>
        ) : (
          solanaInvestments.map((investment) => (
            <div key={investment.wallet} className={`investment-row ${investment.processed ? 'processed' : ''}`}>
              <div className="col-select">
                <input
                  type="checkbox"
                  checked={selectedInvestments.has(investment.wallet)}
                  onChange={() => handleSelectInvestment(investment.wallet)}
                  disabled={investment.processed}
                />
              </div>
              <div className="col-wallet" title={investment.wallet}>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <span>{formatWallet(investment.wallet)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const s = new Set(expandedRows);
                      s.has(investment.wallet) ? s.delete(investment.wallet) : s.add(investment.wallet);
                      setExpandedRows(s);
                    }}
                    className="details-btn"
                    style={{border:'1px solid rgba(255,255,255,0.25)', background:'transparent', color:'#e6f5ff', borderRadius:6, padding:'2px 6px', fontSize:'0.75rem'}}
                  >
                    {expandedRows.has(investment.wallet) ? 'Hide' : 'Details'}
                  </button>
                </div>
              </div>
              <div className="col-total-usd">
                {formatUSD(investment.totalUSD)}
              </div>
              <div className="col-total-bits">
                {formatBITS(investment.totalBITS)}
              </div>
              <div className="col-bonus-rate">
                {investment.bonusRate}%
              </div>
              <div className="col-bonus-amount">
                {formatReward(investment)}
              </div>
              <div className="col-status">
                <span className={`status ${investment.processed ? 'processed' : 'pending'}`}>
                  {investment.processed ? "✅ Processed" : "⏳ Pending"}
                </span>
              </div>
              <div className="col-actions">
                {!investment.processed && (
                  <button
                    onClick={() => processSingleReward(investment)}
                    className="process-single-btn"
                    disabled={processing}
                  >
                    🚀 Process
                  </button>
                )}
              </div>

              {/* Expanded details: tx signatures + BSC wallet entry */}
              {expandedRows.has(investment.wallet) && (
                <div className="row-details" style={{ gridColumn: '1 / -1', padding:'8px 10px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, marginTop:6 }}>
                  <div style={{ display:'grid', gap:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span style={{ opacity:0.85 }}>Destination BSC wallet:</span>
                      <input
                        type="text"
                        placeholder="0x..."
                        value={bscWallets[investment.wallet] || ''}
                        onChange={(e)=> setBscWallets(prev=>({ ...prev, [investment.wallet]: e.target.value }))}
                        style={{ flex:'1 1 260px', minWidth:260, background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.25)', color:'#e6f5ff', borderRadius:6, padding:'6px 8px' }}
                      />
                      {bscWallets[investment.wallet] && !ethers.utils.isAddress(bscWallets[investment.wallet]) && (
                        <span style={{ color:'#ff6b6b', fontSize:'0.85rem' }}>Invalid 0x address</span>
                      )}
                    </div>
                    {Array.isArray(investment.investments) && investment.investments.length > 0 && (
                      <div style={{ marginTop:6 }}>
                        <div style={{ fontWeight:700, marginBottom:4 }}>On-chain transactions:</div>
                        <div style={{ display:'grid', gap:4 }}>
                          {investment.investments.map((tx, idx)=> (
                            <div key={idx} style={{ display:'flex', alignItems:'center', gap:10, fontSize:'0.9rem' }}>
                              <span style={{ opacity:0.8 }}>{tx.type || 'TX'}</span>
                              <a href={`https://solscan.io/tx/${tx.signature}`} target="_blank" rel="noreferrer" className="legal-link">
                                {tx.signature ? `${tx.signature.slice(0,10)}...${tx.signature.slice(-8)}` : '—'}
                              </a>
                              <span style={{ opacity:0.8 }}>
                                {typeof tx.amount === 'number' ? `${tx.amount} ${tx.type === 'USDC-Solana' ? 'USDC' : 'SOL'}` : ''}
                              </span>
                              <span style={{ opacity:0.8 }}>
                                {typeof tx.bitsReceived === 'number' ? `${tx.bitsReceived} BITS` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="bonus-tiers">
        <h3>💎 Bonus Tier System - BITS Rewards</h3>
        <div className="tiers">
          {BONUS_TIERS.map((tier, index) => (
            <div key={index} className="tier">
              <span className="tier-range">
                ${tier.min} - {tier.max === Infinity ? "∞" : `$${tier.max}`}
              </span>
              <span className="tier-rate">{tier.rate}% in BITS</span>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
          💡 Rewards are calculated in USD but distributed as BITS tokens based on current presale price
        </div>
      </div>
    </div>
  );
};

export default SolanaRewardsManager;
