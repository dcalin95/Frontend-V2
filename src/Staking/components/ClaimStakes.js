import React, { useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import { toast, ToastContainer } from "react-toastify";
import WalletContext from "../../context/WalletContext";
import { getStakingContract } from "../../contract/getStakingContract";
import "../styles/ClaimStakes.css";
import "../styles/ClaimStakes.mobile.css"; // 🆕 Import Mobile CSS

// --- AI GEMINI 3 ICONS ---
const AiIcons = {
  Brain: ({ size = 24, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-4.04z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-4.04z" />
      <path d="M12 12h.01" />
    </svg>
  ),
  Chip: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 1v3" /><path d="M15 1v3" /><path d="M9 20v3" /><path d="M15 20v3" />
      <path d="M20 9h3" /><path d="M20 14h3" /><path d="M1 9h3" /><path d="M1 14h3" />
    </svg>
  ),
  Pulse: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Rocket: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.1 4-1 4-1" />
      <path d="M12 15v5s3.03-.55 4-2c1.1-1.62 1-4 1-4" />
    </svg>
  ),
  Lock: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Unlock: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  ),
  History: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Coins: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M16 12h-8" />
      <path d="M12 16V8" />
    </svg>
  ),
  Calendar: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Check: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Trophy: ({ size = 20, color = "currentColor" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10" />
      <path d="M17 4v8a5 5 0 0 1-10 0V4" />
      <path d="M5 9a5 5 0 0 0-1 4" />
      <path d="M19 9a5 5 0 0 1 1 4" />
    </svg>
  )
};

// Helper styles extracted from Staking Protocol card
const cardStyle = {
  background: "rgba(12, 16, 20, 0.35)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "16px",
  padding: "16px", // COMPACT: Reduced from 24px
  marginBottom: "12px", // COMPACT: Reduced from 20px
  backdropFilter: "blur(10px)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)"
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px", // COMPACT: Reduced from 20px
  borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
  paddingBottom: "10px" // COMPACT: Reduced from 15px
};

const labelStyle = {
  fontSize: "0.85rem",
  color: "rgba(255, 255, 255, 0.5)",
  marginBottom: "4px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  fontWeight: "600",
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontFamily: "'Inter', sans-serif"
};

const valueStyle = {
  fontSize: "1.25rem",
  fontWeight: "700",
  color: "#ffffff",
  textShadow: "0 0 10px rgba(255, 255, 255, 0.1)",
  fontFamily: "'Orbitron', 'Space Grotesk', sans-serif", /* SOLANA AI FONT */
  letterSpacing: "0.5px"
};

const buttonStyle = {
  background: "linear-gradient(135deg, #9dffce, #9ad7ff)",
  color: "#0a0a0a",
  border: "none",
  borderRadius: "10px",
  padding: "12px 20px",
  fontWeight: "800",
  fontSize: "0.95rem",
  cursor: "pointer",
  transition: "all 0.3s ease",
  boxShadow: "0 4px 15px rgba(0, 255, 136, 0.2)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px'
};

const secondaryButtonStyle = {
  background: "rgba(255, 255, 255, 0.05)",
  color: "#9ad7ff",
  border: "1px solid rgba(154, 215, 255, 0.3)",
  borderRadius: "10px",
  padding: "12px 20px",
  fontWeight: "700",
  fontSize: "0.95rem",
  cursor: "pointer",
  transition: "all 0.3s ease",
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px'
};

const formatAprPercentFrom1e18 = (raw) => {
  try {
    const n = Number(raw);
    if (!isFinite(n)) return "0.00%";
    if (n > 1e10) {
      const pct = parseFloat(require('ethers').ethers.utils.formatUnits(raw, 16));
      return `${pct.toFixed(2)}%`;
    }
    return `${(n / 100).toFixed(2)}%`;
  } catch (_) {
    return "0.00%";
  }
};

const aprPercentNumber = (raw) => {
  try {
    const n = Number(raw?.toString ? raw.toString() : raw);
    if (!isFinite(n)) return 0;
    if (n > 1e10) {
      return parseFloat(require('ethers').ethers.utils.formatUnits(raw, 16));
    }
    return n / 100; 
  } catch (_) {
    return 0;
  }
};

const clampBits = (v) => {
  const n = parseFloat(v || '0');
  if (!isFinite(n) || n <= 0) return '0';
  if (n >= 1) return Math.floor(n).toLocaleString();
  return n.toFixed(4).replace(/\.0+$/, '');
};

const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) seconds = 0;
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
};

const formatTimeLeft = (seconds) => {
  const days = Math.floor(seconds / (60 * 60 * 24));
  const hours = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  return `${days} days, ${hours} hours, ${minutes} minutes`;
};

// Stiluri CSS inline pentru loader
const loaderStyles = `
@keyframes aiSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes aiPulse {
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
}
`;

const ClaimStakes = ({ signer }) => {
  const { walletAddress } = useContext(WalletContext);
  const [stakes, setStakes] = useState([]);
  const [cooldown, setCooldown] = useState(0);
  const [tgeDate, setTgeDate] = useState(0);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));
  const [loadingIndex, setLoadingIndex] = useState(null);
  const [totalClaimable, setTotalClaimable] = useState("0");
  const [dynamicRewards, setDynamicRewards] = useState({});
  const [hasClaimReward, setHasClaimReward] = useState(false);
  const [unstakeFeePct, setUnstakeFeePct] = useState(0);
  const [showAPRBreakdown, setShowAPRBreakdown] = useState({}); // Store toggle state per index
  const [showProjections, setShowProjections] = useState({}); // Store toggle state per index
  const [isLoading, setIsLoading] = useState(true);

  const decodeRevert = (err) => {
    try {
      const data = err?.data || err?.error?.data || "";
      const msg = err?.error?.message || err?.message || "";
      if (typeof data === 'string' && data.startsWith('0x4e487b71')) {
        const codeHex = data.slice(-64);
        const code = parseInt(codeHex, 16);
        if (code === 0x32) return "Invalid stake index.";
        return `Contract panic (code 0x${code.toString(16)}).`;
      }
      return msg || "Transaction reverted";
    } catch (_) {
      return "Transaction reverted";
    }
  };

  // ✅ Update every second for dynamic rewards
  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = Math.floor(Date.now() / 1000);
      setNow(currentTime);
      
      const newDynamicRewards = {};
      stakes.forEach((stake, index) => {
        if (!stake.withdrawn && stake.apr && stake.locked) {
          const secondsPassed = Math.max(0, currentTime - stake.startTime.toNumber());
          const aprPercentage = aprPercentNumber(stake.apr);
          const aprDecimal = aprPercentage / 100;
          const aprPerSecond = aprDecimal / (365 * 24 * 60 * 60);
          const stakedAmount = parseFloat(formatUnits(stake.locked, 18));
          const currentReward = stakedAmount * aprPerSecond * secondsPassed;
          newDynamicRewards[index] = currentReward;
        }
      });
      setDynamicRewards(newDynamicRewards);
    }, 1000);
    return () => clearInterval(timer);
  }, [stakes]);

  const fetchData = async () => {
    if (!signer || !walletAddress) return;
    try {
      if (stakes.length === 0) setIsLoading(true);
      
      const contract = getStakingContract(signer);
      try {
        const iface = contract.interface;
        setHasClaimReward(!!iface.functions["claimReward(uint256)"]);
      } catch (_) { setHasClaimReward(false); }
      
      // 🆕 Fetch unstake fee percentage from contract
      try {
        const rawFee = await contract.unstakeFee?.();
        if (rawFee) {
          const pct = parseFloat(formatUnits(rawFee, 16)); // unstakeFee is stored as 1e16 = 1%
          setUnstakeFeePct(pct);
          console.log("📊 Unstake Fee from contract:", pct + "%");
        }
      } catch(err) {
        console.warn("⚠️ Could not fetch unstakeFee:", err.message);
      }
      const rawStakes = await contract.getStakeByUser(walletAddress);
      const cd = await contract.cooldown();
      const tge = await contract.tgeDate();

      setCooldown(cd.toNumber());
      setTgeDate(tge.toNumber());
      setStakes(rawStakes);

      let total = ethers.BigNumber.from("0");
      for (let s of rawStakes) {
        const unlockTime = s.startTime.toNumber() + cd.toNumber();
        const currentT = Math.floor(Date.now() / 1000);
        if (!s.withdrawn && currentT >= unlockTime && currentT >= tge.toNumber()) {
          const reward = s.locked
            .mul(s.apr)
            .mul(currentT - s.updatedAt)
            .div(365 * 24 * 3600)
            .div(ethers.constants.WeiPerEther);
          total = total.add(reward);
        }
      }
      setTotalClaimable(Math.floor(parseFloat(formatUnits(total, 18))).toString());
    } catch (err) {
      console.error("Error fetching stakes:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [signer, walletAddress]);

  const canWithdraw = (stake) => {
    const perStakeLock = stake.lockPeriod?.toNumber ? stake.lockPeriod.toNumber() : cooldown;
    const unlockTime = stake.startTime.toNumber() + perStakeLock;
    return !stake.withdrawn && now >= unlockTime && now >= tgeDate;
  };

  const handleClaim = async (index) => {
    if (!signer) return;
    try {
      setLoadingIndex(index);
      const contract = getStakingContract(signer);
      try {
        const ro = await getStakingContract(null, true);
        await ro.callStatic.withdraw(index, { from: walletAddress });
      } catch (e) {
        const s = stakes[index];
        const perStakeLock = s.lockPeriod?.toNumber ? s.lockPeriod.toNumber() : cooldown;
        const unlockTime = s.startTime.toNumber() + perStakeLock;
        const lockLeft = Math.max(0, unlockTime - now);
        if (s.withdrawn) throw new Error("Already withdrawn.");
        if (lockLeft > 0) throw new Error(`Locked for ${formatTimeLeft(lockLeft)}.`);
        const msg = decodeRevert(e) || "Simulation failed";
        throw new Error(msg);
      }
      const tx = await contract.withdraw(index);
      await tx.wait();
      await fetchData();
    } catch (err) {
      toast.error(err.message || "Transaction failed");
    } finally {
      setLoadingIndex(null);
    }
  };

  const handleClaimRewardOnly = async (index) => {
    if (!signer || !hasClaimReward) return;
    try {
      setLoadingIndex(index);
      const contract = getStakingContract(signer);
      try { await contract.callStatic.claimReward(index); } catch (e) {
        throw new Error("Claim not available.");
      }
      const tx = await contract.claimReward(index);
      await tx.wait();
      await fetchData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingIndex(null);
    }
  };

  const handleEarlyUnstake = async (index) => {
    if (!signer) return;
    try {
      setLoadingIndex(index);
      const contract = getStakingContract(signer);
      let feePct = 0;
      try {
        const raw = await contract.unstakeFee();
        feePct = parseFloat(require('ethers').ethers.utils.formatUnits(raw, 16));
      } catch (_) {}
      const s = stakes[index];
      const principal = parseFloat(formatUnits(s.locked, 18));
      const ok = window.confirm(`Early Unstake applies a ${feePct.toFixed(2)}% fee.\nContinue?`);
      if (!ok) { setLoadingIndex(null); return; }
      const tx = await contract.withdraw(index);
      await tx.wait();
      await fetchData();
    } catch (err) {
      toast.error(err?.reason || err?.message || 'Unstake failed');
    } finally {
      setLoadingIndex(null);
    }
  };

  return (
    <>
      <style>{loaderStyles}</style>
      
      {/* Section Title - AI Solana Style */}
      <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
        <AiIcons.Brain size={28} color="#00ffa3" />
        <h3 style={{ 
          margin: 0, 
          fontSize: "1.6rem", 
          fontWeight: "700", 
          fontFamily: "'Orbitron', 'Space Grotesk', sans-serif",
          background: "linear-gradient(135deg, #00FFA3, #DC1FFF)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          filter: "drop-shadow(0 0 12px rgba(0, 255, 163, 0.3))",
          letterSpacing: "0.5px",
          textAlign: "center"
        }}>
          MY STAKED POSITIONS
        </h3>
      </div>

      {/* Total Claimable (Staking Protocol Style) */}
      <div className="claim-card-total" style={{
        ...cardStyle,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: "linear-gradient(90deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)",
        border: "1px solid rgba(0, 255, 136, 0.3)"
      }}>
        <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#eaf9f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AiIcons.Coins size={20} color="#eaf9f6" /> Total Claimable:
        </span>
        <strong style={{
            fontSize: '1.8rem', 
            background: 'linear-gradient(90deg, #00ff87 0%, #60efff 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent', 
            backgroundClip: 'text',
            fontWeight: '900'
        }}>
          {Math.floor(parseFloat(totalClaimable))} $BITS
        </strong>
      </div>

      {/* LOADING STATE: AI INTELLIGENT LOADER */}
      {isLoading && (
        <div style={{
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '60px 20px',
            background: 'rgba(12, 16, 20, 0.35)',
            borderRadius: '16px',
            border: '1px dashed rgba(0, 255, 163, 0.2)'
        }}>
            <div style={{
                width: '50px', 
                height: '50px', 
                border: '3px solid rgba(0, 255, 163, 0.1)', 
                borderTop: '3px solid #00ffa3', 
                borderRadius: '50%', 
                animation: 'aiSpin 1s linear infinite',
                marginBottom: '20px'
            }}></div>
            <div style={{
                fontSize: '14px', 
                color: '#00ffa3', 
                fontFamily: 'monospace', 
                letterSpacing: '2px',
                animation: 'aiPulse 1.5s infinite ease-in-out',
                textTransform: 'uppercase'
            }}>
                ⚡ AI Agent: Syncing Blockchain Data...
            </div>
        </div>
      )}

      {/* No Stakes */}
      {!isLoading && stakes.length === 0 && (
        <div style={{textAlign: 'center', padding: '40px', color: '#888', background: 'rgba(0,0,0,0.2)', borderRadius: '16px'}}>
          No active staking positions found. Start staking to earn rewards!
        </div>
      )}

      {/* Stakes List - REFACTORED TO MATCH STAKING PROTOCOL STYLE */}
      {!isLoading && stakes.map((s, i) => {
        const eligible = canWithdraw(s);
        const dynamicReward = dynamicRewards[i] || 0;
        const lockPeriodVal = s.lockPeriod?.toNumber ? s.lockPeriod.toNumber() : cooldown;
        const unlockTime = s.startTime.toNumber() + lockPeriodVal;
        const secondsLeft = Math.max(0, unlockTime - now);
        
        return (
          <React.Fragment key={i}>
            <div className="claim-card" style={{
              ...cardStyle,
              borderColor: s.withdrawn ? 'rgba(255, 255, 255, 0.1)' : (eligible ? 'rgba(0, 255, 136, 0.4)' : 'rgba(255, 255, 255, 0.1)'),
              boxShadow: eligible && !s.withdrawn ? '0 0 20px rgba(0, 255, 136, 0.15)' : 'none'
            }}>
              
              {/* 1. HEADER */}
              <div style={headerStyle}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <div style={{
                      background: s.withdrawn ? 'rgba(255,255,255,0.1)' : 'rgba(0, 255, 200, 0.15)',
                      width: '32px', height: '32px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: s.withdrawn ? '#888' : '#00ffa3',
                      fontWeight: 'bold', fontSize: '0.9rem', border: `1px solid ${s.withdrawn ? '#444' : '#00ffa340'}`
                    }}>
                      <AiIcons.Chip size={16} />
                    </div>
                    <div>
                        <div style={{fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px'}}>
                          POSITION #{i + 1} <span style={{opacity:0.5}}>•</span> <AiIcons.Calendar size={14}/> {new Date(s.startTime.toNumber() * 1000).toLocaleDateString()}
                        </div>
                        {/* TIER BADGE */}
                        {(() => {
                            const amt = parseFloat(formatUnits(s.locked, 18));
                            let tier = { name: "Bronze", icon: "🥉", color: "#CD7F32" };
                            if (amt >= 10001) tier = { name: "Platinum", icon: "💎", color: "#E5E4E2" };
                            else if (amt >= 5001) tier = { name: "Gold", icon: "🥇", color: "#FFD700" };
                            else if (amt >= 1001) tier = { name: "Silver", icon: "🥈", color: "#C0C0C0" };
                            
                            return !s.withdrawn && (
                                <div className="ai-tier-badge" style={{ color: tier.color, borderColor: tier.color + '40' }}>
                                    {tier.icon} {tier.name} Tier
                                </div>
                            );
                        })()}
                    </div>
                </div>
                
                {s.withdrawn ? (
                   <div style={{fontSize: '0.8rem', padding: '4px 10px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', color: '#aaa', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px'}}>
                     <AiIcons.Check size={14} /> CLOSED
                   </div>
                ) : eligible ? (
                   <div style={{fontSize: '0.8rem', padding: '4px 10px', borderRadius: '20px', background: 'rgba(0, 255, 163, 0.15)', color: '#00ffa3', border: '1px solid rgba(0, 255, 163, 0.3)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px'}}>
                     <AiIcons.Rocket size={14} /> READY
                   </div>
                ) : (
                   <div style={{fontSize: '0.8rem', padding: '4px 10px', borderRadius: '20px', background: 'rgba(147, 51, 234, 0.15)', color: '#d8b4fe', border: '1px solid rgba(147, 51, 234, 0.3)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px'}}>
                     <AiIcons.Lock size={14} /> LOCKED
                   </div>
                )}
              </div>

              {/* 2. BODY GRID */}
              <div className="claim-main-grid" style={{display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr', gap: '24px', alignItems: 'center'}}>
                
                {/* COL 1: VALUE & APR */}
                <div>
                    <div style={labelStyle}>Staked Amount</div>
                    <div style={{...valueStyle, fontSize: '1.8rem', marginBottom: '8px'}}>
                      {Math.floor(parseFloat(formatUnits(s.locked, 18))).toLocaleString()} <span style={{fontSize: '1rem', color: '#00ffa3', fontWeight: '600'}}>$BITS</span>
                    </div>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.85rem', 
                        fontWeight: '700', 
                        color: '#ffd700',
                        background: 'rgba(255, 215, 0, 0.1)',
                        border: '1px solid rgba(255, 215, 0, 0.3)',
                        padding: '4px 10px',
                        borderRadius: '20px'
                    }}>
                      <AiIcons.Pulse size={14} /> {formatAprPercentFrom1e18(s.apr)} APR
                    </div>
                </div>

                {/* COL 2: REWARDS - LIVE TICKING */}
                <div style={{ paddingLeft: '24px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={labelStyle}>Unclaimed Rewards</div>
                    <div style={{
                        ...valueStyle, 
                        fontSize: '1.4rem',
                        color: s.withdrawn ? '#888' : '#00ffa3',
                        marginBottom: '5px',
                        fontFamily: 'monospace', 
                        letterSpacing: '-0.5px'
                    }}>
                        {s.withdrawn ? '---' : `+${dynamicReward.toFixed(6)}`}
                    </div>
                    {!s.withdrawn && (
                        <div style={{fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)'}}>
                            Live accumulation...
                        </div>
                    )}
                </div>

                {/* COL 3: TIMER / STATUS */}
                <div style={{textAlign: 'right'}}>
                    <div style={{...labelStyle, justifyContent: 'flex-end'}}>
                        {s.withdrawn ? 'Status' : (eligible ? 'Action' : 'Unlocks In')}
                    </div>
                    <div style={{fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '5px'}}>
                        {s.withdrawn ? 'Withdrawn' : (eligible ? 'Claim Now' : formatTimeLeft(secondsLeft))}
                    </div>
                    
                    {s.withdrawn && (
                       <div style={{fontSize: '0.75rem', color: '#aaa'}}>
                         {formatDuration(Math.max(0, Math.min(now, (s.startTime?.toNumber?.() || Number(s.startTime)) + ((s.lockPeriod?.toNumber?.() || 0) > 0 ? s.lockPeriod.toNumber() : cooldown)) - (s.startTime?.toNumber?.() || Number(s.startTime))))}
                       </div>
                    )}
                </div>
              </div>

              {/* 🆕 ADDITIONAL INFO SECTION */}
              {!s.withdrawn && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  
                  {/* PROGRESS BAR */}
                  {(() => {
                    const lockSeconds = s.lockPeriod?.toNumber?.() || cooldown;
                    const totalLockDays = Math.floor(lockSeconds / (24 * 60 * 60));
                    const startTimeNum = s.startTime.toNumber();
                    const daysStaked = Math.floor((now - startTimeNum) / (24 * 60 * 60));
                    const isCompleted = daysStaked >= totalLockDays;
                    const unlockDate = new Date((startTimeNum + lockSeconds) * 1000);
                    
                    // Calculate Total Reward at Maturity based on contract formula
                    const amountVal = parseFloat(formatUnits(s.locked, 18));
                    // FIX: Use aprPercentNumber which returns number directly
                    const aprPercent = aprPercentNumber(s.apr);
                    const aprDecimal = aprPercent / 100;
                    
                    // Yearly Reward = Amount * APR_Decimal
                    // Total Reward = Yearly * (LockDuration / 365 days)
                    const yearlyRewardEst = amountVal * aprDecimal;
                    const totalRewardAtMaturity = yearlyRewardEst * (lockSeconds / (365 * 24 * 60 * 60));

                    return (
                      <>
                        {totalLockDays > 0 && (
                          <div className="ai-progress-container">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600', letterSpacing: '0.5px' }}>
                                ⏱️ STAKING PROGRESS
                              </span>
                              <span style={{ fontSize: '0.75rem', color: isCompleted ? '#00FFA3' : '#fff', fontWeight: '700', fontFamily: 'Orbitron, sans-serif' }}>
                                {isCompleted ? 'COMPLETED' : `${daysStaked}/${totalLockDays} DAYS`}
                              </span>
                            </div>
                            <div className="ai-progress-track">
                              <div className="ai-progress-fill" style={{
                                width: isCompleted ? '100%' : `${Math.min((daysStaked / totalLockDays) * 100, 100)}%`,
                                background: isCompleted ? '#00FFA3' : undefined // Use default gradient if not completed
                              }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                               <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                                 {isCompleted ? '100%' : `${Math.min(Math.round((daysStaked / totalLockDays) * 100), 100)}%`}
                               </span>
                               <span style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                                 Unlock: {unlockDate.toLocaleDateString()}
                               </span>
                            </div>
                          </div>
                        )}
                        
                        {/* MATURITY REWARD INFO - ONLY IF LOCKED */}
                        {totalLockDays > 0 && (
                            <div className="ai-maturity-box">
                                <span className="ai-maturity-label">
                                    <AiIcons.Trophy size={14} color="#d8b4fe"/> 
                                    Total Reward at Maturity:
                                </span>
                                <span className="ai-financial-value" style={{ fontSize: '1rem' }}>
                                    +{totalRewardAtMaturity.toFixed(4)} $BITS
                                </span>
                            </div>
                        )}

                        {/* 🆕 FINANCIAL INSIGHTS GRID */}
                        {(() => {
                            // Calculate projections mathematically
                            const dailyYield = yearlyRewardEst / 365;
                            const monthlyYield = yearlyRewardEst / 12;
                            
                            // FIX: ROI Calculation
                            // If locked: ROI = Total Reward / Amount
                            // If no lock: ROI = Yearly Reward / Amount (Annualized)
                            const rewardBasis = totalLockDays > 0 ? totalRewardAtMaturity : yearlyRewardEst;
                            const roiPercent = amountVal > 0 ? (rewardBasis / amountVal) * 100 : 0;

                            return (
                                <div className="ai-financial-grid">
                                    {/* Daily */}
                                    <div className="ai-financial-card">
                                        <div className="ai-financial-label">Daily Yield</div>
                                        <div className="ai-financial-value ai-text-gradient">+{dailyYield.toFixed(2)}</div>
                                    </div>
                                    {/* Monthly */}
                                    <div className="ai-financial-card">
                                        <div className="ai-financial-label">Monthly</div>
                                        <div className="ai-financial-value ai-text-gradient">+{monthlyYield.toFixed(2)}</div>
                                    </div>
                                    {/* ROI */}
                                    <div className="ai-financial-card">
                                        <div className="ai-financial-label">{totalLockDays > 0 ? "Net ROI" : "Annual ROI"}</div>
                                        <div className="ai-financial-value ai-text-gold">{roiPercent.toFixed(2)}%</div>
                                    </div>
                                </div>
                            );
                        })()}

                      </>
                    );
                  })()}

                  
                  {/* UNSTAKE FEE WARNING */}
                  {(!eligible && secondsLeft > 0) && (
                    <div className="ai-warning-box">
                      <span className="ai-warning-icon">⚠️</span>
                      <div style={{ flex: 1 }}>
                        <div className="ai-warning-title">
                          Early Unstake Fee
                        </div>
                        <div className="ai-warning-text">
                          {unstakeFeePct ? (
                              <>
                                Withdrawing before unlock applies a <span className="ai-warning-highlight">{unstakeFeePct.toFixed(2)}%</span> penalty.
                                You'll receive ≈ <span className="ai-warning-highlight">{(parseFloat(formatUnits(s.locked, 18)) * (1 - unstakeFeePct/100)).toFixed(2)}</span> $BITS.
                              </>
                          ) : (
                              <>
                                Warning: Unstaking before maturity may incur a penalty fee or forfeiture of rewards depending on protocol rules.
                              </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* APR BREAKDOWN TOGGLE */}
                  <button 
                    onClick={() => setShowAPRBreakdown(prev => ({...prev, [i]: !prev[i]}))}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#00FFA3',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '0'
                    }}
                  >
                    <span>📊 APR Breakdown</span>
                    <span style={{ fontSize: '0.7rem' }}>{showAPRBreakdown[i] ? '▲' : '▼'}</span>
                  </button>
                  
                  {/* APR BREAKDOWN DETAILS */}
                  {showAPRBreakdown[i] && (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      padding: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                         <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem' }}>Base APR:</span>
                         <span style={{ color: '#fff', fontWeight: '600', fontSize: '0.8rem' }}>{formatAprPercentFrom1e18(s.apr)}</span>
                       </div>
                       <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '6px', marginTop: '6px' }}>
                         <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' }}>
                           💡 Includes Tier & Lock bonuses
                         </div>
                       </div>
                    </div>
                  )}

                  {/* REWARD PROJECTIONS TOGGLE */}
                  <button 
                    onClick={() => setShowProjections(prev => ({...prev, [i]: !prev[i]}))}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#00FFA3',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '0'
                    }}
                  >
                    <span>📈 Reward Projections</span>
                    <span style={{ fontSize: '0.7rem' }}>{showProjections[i] ? '▲' : '▼'}</span>
                  </button>

                  {/* REWARD PROJECTIONS DETAILS */}
                  {showProjections[i] && (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      padding: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      {(() => {
                        const stakedVal = parseFloat(formatUnits(s.locked, 18));
                        const aprVal = parseFloat(formatAprPercentFrom1e18(s.apr)); // returns string like "20.00"
                        const yearly = stakedVal * (aprVal / 100);
                        const monthly = yearly / 12;
                        const daily = yearly / 365;
                        
                        return (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem' }}>Daily:</span>
                              <span style={{ color: '#00FFA3', fontWeight: '700', fontSize: '0.8rem' }}>+{daily.toFixed(4)} $BITS</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem' }}>Monthly:</span>
                              <span style={{ color: '#00FFA3', fontWeight: '700', fontSize: '0.8rem' }}>+{monthly.toFixed(2)} $BITS</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem' }}>Yearly:</span>
                              <span style={{ color: '#DC1FFF', fontWeight: '700', fontSize: '0.8rem' }}>+{yearly.toFixed(2)} $BITS</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                  
                </div>
              )}

              {/* 3. FOOTER ACTIONS - Custom Buttons */}
              {!s.withdrawn && (
                  <div style={{
                      marginTop: '10px',
                      paddingTop: '10px',
                      borderTop: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '10px'
                  }}>
                      {/* Warning Info */}
                      {(!eligible && secondsLeft > 0) ? (
                          <div style={{fontSize: '0.85rem', color: '#ff9a76', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 154, 118, 0.1)', padding: '6px 12px', borderRadius: '8px'}}>
                              🔒 Locked until maturity
                          </div>
                      ) : (
                          <div style={{fontSize: '0.85rem', color: '#00ffa3', display: 'flex', alignItems: 'center', gap: '6px'}}>
                              ✨ Position unlocked. Full rewards available.
                          </div>
                      )}

                      <div style={{display: 'flex', gap: '12px'}}>
                          {hasClaimReward && (
                              <button
                                onClick={() => handleClaimRewardOnly(i)}
                                disabled={loadingIndex === i}
                                style={secondaryButtonStyle}
                                onMouseEnter={(e) => e.target.style.background = "rgba(255, 255, 255, 0.1)"}
                                onMouseLeave={(e) => e.target.style.background = "rgba(255, 255, 255, 0.05)"}
                              >
                                {loadingIndex === i ? "⏳" : <><AiIcons.Coins size={16} /> Claim Rewards</>}
                              </button>
                          )}

                          <button
                            onClick={() => handleClaim(i)}
                            disabled={loadingIndex === i || !eligible}
                            style={
                                eligible 
                                ? buttonStyle 
                                : {
                                    ...secondaryButtonStyle, 
                                    opacity: 1, 
                                    cursor: 'not-allowed', 
                                    borderColor: 'rgba(255, 50, 50, 0.5)', 
                                    background: 'rgba(255, 50, 50, 0.05)',
                                    color: '#ff6b6b',
                                    boxShadow: '0 0 10px rgba(255, 50, 50, 0.1)'
                                }
                            }
                            onMouseEnter={(e) => {
                                if(eligible) {
                                    e.target.style.transform = "translateY(-2px)";
                                    e.target.style.boxShadow = "0 6px 20px rgba(0, 255, 136, 0.4)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if(eligible) {
                                    e.target.style.transform = "translateY(0)";
                                    e.target.style.boxShadow = "0 4px 15px rgba(0, 255, 136, 0.2)";
                                }
                            }}
                          >
                            {loadingIndex === i ? (
                                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                    <div className="spinner" style={{width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
                                    Processing...
                                </div>
                            ) : (
                                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                    {eligible ? <AiIcons.Unlock size={18} /> : <AiIcons.Lock size={18} />}
                                    {eligible ? "Unstake & Claim" : "Locked"}
                                </div>
                            )}
                          </button>
                      </div>
                  </div>
              )}
            </div>
          </React.Fragment>
        );
      })}
      
      <ToastContainer position="top-right" autoClose={4000} pauseOnHover />
    </>
  );
};

export default ClaimStakes;
