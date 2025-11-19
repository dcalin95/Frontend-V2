import React, { useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import { toast, ToastContainer } from "react-toastify";
import WalletContext from "../../context/WalletContext";
import { getStakingContract } from "../../contract/getStakingContract";
import "../StakingPageMobile.css";

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
  return `${days}d ${hours}h ${minutes}m`;
};

const ClaimStakesMobile = ({ signer }) => {
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
      const contract = getStakingContract(signer);
      try {
        const iface = contract.interface;
        setHasClaimReward(!!iface.functions["claimReward(uint256)"]);
      } catch (_) { setHasClaimReward(false); }
      try {
        const feeRaw = await contract.unstakeFee();
        setUnstakeFeePct(parseFloat(require('ethers').ethers.utils.formatUnits(feeRaw, 16)));
      } catch(_) {}
      const rawStakes = await contract.getStakeByUser(walletAddress);
      const cd = await contract.cooldown();
      const tge = await contract.tgeDate();

      setCooldown(cd.toNumber());
      setTgeDate(tge.toNumber());
      setStakes(rawStakes);

      let total = ethers.BigNumber.from("0");
      for (let s of rawStakes) {
        const unlockTime = s.startTime.toNumber() + cd.toNumber();
        if (!s.withdrawn && now >= unlockTime && now >= tge.toNumber()) {
          const reward = s.locked
            .mul(s.apr)
            .mul(now - s.updatedAt)
            .div(365 * 24 * 3600)
            .div(ethers.constants.WeiPerEther);
          total = total.add(reward);
        }
      }
      setTotalClaimable(Math.floor(parseFloat(formatUnits(total, 18))).toString());
    } catch (err) {
      console.error("Error fetching stakes:", err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [signer, walletAddress, now]);

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
      const estNet = Math.max(0, principal * (1 - feePct / 100));
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
      {/* Title Header */}
      <div className="mobile-payment-option" style={{
        borderColor: 'rgba(123, 104, 238, 0.5)', 
        background: 'rgba(123, 104, 238, 0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 2 16.9706 2 12C2 7.02944 7.02944 2 12 2C16.9706 2 21 7.02944 21 12Z" stroke="#7b68ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h3 style={{margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#fff'}}>My Positions</h3>
      </div>

      {/* Total Claimable Summary */}
      <div className="mobile-payment-option">
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%'}}>
          <span style={{fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '5px'}}>TOTAL CLAIMABLE REWARDS</span>
          <div style={{
            fontSize: '28px', 
            fontWeight: 'bold', 
            background: 'linear-gradient(90deg, #00ff87 0%, #60efff 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px rgba(0,255,135,0.3)'
          }}>
            {Math.floor(parseFloat(totalClaimable))} $BITS
          </div>
        </div>
      </div>

      {/* No Stakes State */}
      {stakes.length === 0 && (
        <div className="mobile-payment-option" style={{textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: '40px 20px'}}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{marginBottom: '10px', opacity: 0.5}}>
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
          <p>No active staking positions found.</p>
        </div>
      )}

      {/* Active Stakes List */}
      {stakes.map((s, i) => {
        const eligible = canWithdraw(s);
        const dynamicReward = dynamicRewards[i] || 0;
        const unlockTime = s.startTime.toNumber() + ((s.lockPeriod?.toNumber?.() || 0) > 0 ? s.lockPeriod.toNumber() : cooldown);
        const secondsLeft = Math.max(0, unlockTime - now);
        
        return (
          <React.Fragment key={i}>
            {/* Main Stake Card - Gemini AI King Style */}
            <div className="mobile-payment-option" style={{
              borderColor: s.withdrawn ? 'rgba(0, 255, 163, 0.3)' : 'rgba(147, 51, 234, 0.5)',
              background: s.withdrawn 
                ? 'linear-gradient(180deg, rgba(0, 255, 163, 0.05) 0%, rgba(0, 0, 0, 0) 100%)' 
                : 'linear-gradient(180deg, rgba(147, 51, 234, 0.05) 0%, rgba(0, 0, 0, 0) 100%)',
              padding: '0',
              overflow: 'hidden'
            }}>
              {/* Header of Card */}
              <div style={{
                padding: '15px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.2)'
              }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                  <div style={{
                    width: '24px', height: '24px', 
                    borderRadius: '50%', 
                    background: s.withdrawn ? 'rgba(0,255,163,0.2)' : 'rgba(147,51,234,0.2)',
                    color: s.withdrawn ? '#00ffa3' : '#9333ea',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 'bold'
                  }}>
                    #{i + 1}
                  </div>
                  <span style={{fontWeight: 'bold', color: '#fff'}}>
                    {s.withdrawn ? 'COMPLETED' : 'ACTIVE POSITION'}
                  </span>
                </div>
                <div style={{
                  fontSize: '12px', 
                  padding: '4px 8px', 
                  borderRadius: '10px',
                  background: s.withdrawn ? 'rgba(0,255,163,0.1)' : 'rgba(147,51,234,0.1)',
                  color: s.withdrawn ? '#00ffa3' : '#9333ea',
                  border: `1px solid ${s.withdrawn ? 'rgba(0,255,163,0.2)' : 'rgba(147,51,234,0.2)'}`
                }}>
                  {s.withdrawn ? 'Claimed' : 'Locked'}
                </div>
              </div>

              {/* Content Body */}
              <div style={{padding: '20px'}}>
                
                {/* Row 1: Amount */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '14px'}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                    </svg>
                    Staked Amount
                  </div>
                  <div style={{fontWeight: 'bold', fontSize: '16px', color: '#fff'}}>
                    {Math.floor(parseFloat(formatUnits(s.locked, 18)))} $BITS
                  </div>
                </div>

                {/* Row 2: APR */}
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '14px'}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                      <polyline points="17 6 23 6 23 12"></polyline>
                    </svg>
                    APR Rate
                  </div>
                  <div style={{fontWeight: 'bold', fontSize: '16px', color: '#00ffa3'}}>
                    {formatAprPercentFrom1e18(s.apr)}
                  </div>
                </div>

                {/* Row 3: Rewards */}
                {!s.withdrawn && (
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.6)', fontSize: '14px'}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                      Earned Rewards
                    </div>
                    <div style={{fontWeight: 'bold', fontSize: '16px', color: '#f39c12'}}>
                      {clampBits(dynamicReward)} $BITS
                    </div>
                  </div>
                )}

                {/* Row 4: Duration/Timer */}
                {!s.withdrawn && (
                   <div style={{
                     marginTop: '15px', 
                     padding: '10px', 
                     background: 'rgba(0,0,0,0.3)', 
                     borderRadius: '8px',
                     border: '1px solid rgba(255,255,255,0.05)',
                     display: 'flex',
                     justifyContent: 'center',
                     alignItems: 'center',
                     gap: '8px',
                     fontSize: '13px',
                     color: eligible ? '#00ffa3' : 'rgba(255,255,255,0.5)'
                   }}>
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                       <circle cx="12" cy="12" r="10"></circle>
                       <polyline points="12 6 12 12 16 14"></polyline>
                     </svg>
                     {eligible ? 'UNLOCKED - READY TO CLAIM' : `Unlocks in: ${formatTimeLeft(secondsLeft)}`}
                   </div>
                )}

              </div>
            </div>

            {/* Actions - Separated nice buttons */}
            {!s.withdrawn && (
              <div style={{
                display: 'grid', 
                gridTemplateColumns: hasClaimReward ? '1fr 1fr' : '1fr', 
                gap: '10px', 
                marginBottom: '20px'
              }}>
                {/* WITHDRAW BUTTON */}
                <button
                  onClick={() => eligible ? handleClaim(i) : handleEarlyUnstake(i)}
                  disabled={loadingIndex === i}
                  className="mobile-payment-option"
                  style={{
                    marginBottom: 0,
                    background: eligible 
                      ? 'linear-gradient(135deg, #00ffa3 0%, #00b8ff 100%)' 
                      : 'rgba(255, 59, 48, 0.1)',
                    borderColor: eligible ? 'transparent' : 'rgba(255, 59, 48, 0.5)',
                    color: eligible ? '#000' : '#ff3b30',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    padding: '15px'
                  }}
                >
                  {loadingIndex === i ? 'Processing...' : (eligible ? 'WITHDRAW' : 'UNSTAKE EARLY')}
                </button>

                {/* CLAIM REWARDS BUTTON */}
                {hasClaimReward && (
                  <button
                    onClick={() => handleClaimRewardOnly(i)}
                    disabled={loadingIndex === i}
                    className="mobile-payment-option"
                    style={{
                      marginBottom: 0,
                      background: 'rgba(243, 156, 18, 0.1)',
                      borderColor: 'rgba(243, 156, 18, 0.5)',
                      color: '#f39c12',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      padding: '15px'
                    }}
                  >
                    CLAIM REWARDS
                  </button>
                )}
              </div>
            )}
          </React.Fragment>
        );
      })}
      
      <ToastContainer position="top-right" autoClose={4000} theme="dark" />
    </>
  );
};

export default ClaimStakesMobile;

