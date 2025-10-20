import React, { useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import { toast, ToastContainer } from "react-toastify";
import WalletContext from "../../context/WalletContext";
import { getStakingContract } from "../../contract/getStakingContract";
import "../styles/ClaimStakes.css";

const formatAprPercentFrom1e18 = (raw) => {
  try {
    // In storage APR is percent*100 (e.g. 2000 => 20.00%) or 1e18 style depending on version.
    // Detect big numbers: if > 1e10, treat as 1e18 and scale accordingly using ethers formatter.
    const n = Number(raw);
    if (!isFinite(n)) return "0.00%";
    if (n > 1e10) {
      // fallback when APR uses 1e18 precision
      const pct = parseFloat(require('ethers').ethers.utils.formatUnits(raw, 16));
      return `${pct.toFixed(2)}%`;
    }
    return `${(n / 100).toFixed(2)}%`;
  } catch (_) {
    return "0.00%";
  }
};

// Return APR as percent number (e.g., 20.00 for 20%) from raw storage value
const aprPercentNumber = (raw) => {
  try {
    const n = Number(raw?.toString ? raw.toString() : raw);
    if (!isFinite(n)) return 0;
    if (n > 1e10) {
      return parseFloat(require('ethers').ethers.utils.formatUnits(raw, 16));
    }
    return n / 100; // percent with 2 decimals encoded as *100
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
  const decodeRevert = (err) => {
    try {
      const data = err?.data || err?.error?.data || "";
      const msg = err?.error?.message || err?.message || "";
      // Solidity Panic(uint256): 0x4e487b71 + 32-byte code
      if (typeof data === 'string' && data.startsWith('0x4e487b71')) {
        const codeHex = data.slice(-64);
        const code = parseInt(codeHex, 16);
        if (code === 0x32) return "Invalid stake index (stake not found). Please refresh your positions.";
        if (code === 0x11) return "Arithmetic overflow/underflow in contract.";
        if (code === 0x12) return "Division by zero in contract.";
        if (code === 0x21) return "Enum conversion out of range.";
        if (code === 0x22) return "Incorrect storage byte array access.";
        if (code === 0x31) return "Pop on empty array or out-of-bounds slice.";
        if (code === 0x41) return "Allocation error (too much memory).";
        if (code === 0x51) return "Out-of-bounds array access.";
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
      
      // Calculate dynamic rewards for each stake
      const newDynamicRewards = {};
      stakes.forEach((stake, index) => {
        if (!stake.withdrawn && stake.apr && stake.locked) {
          const secondsPassed = Math.max(0, currentTime - stake.startTime.toNumber());
          const aprPercentage = aprPercentNumber(stake.apr); // e.g., 20.00
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
      // detect optional claimReward(index) function
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

      // Calculate total claimable reward
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

  const renderCountdown = (stake) => {
    const unlockTime = stake.startTime.toNumber() + cooldown;
    const secondsLeft = Math.max(tgeDate, unlockTime) - now;
    return (
      <p className="countdown">
        ⏳ Available in: {formatTimeLeft(secondsLeft)}
      </p>
    );
  };

  const handleClaim = async (index) => {
    if (!signer) return;
    try {
      setLoadingIndex(index);
      const contract = getStakingContract(signer);
      // toast removed; show friendly text in-card only
      // preflight on robust provider to avoid MetaMask RPC errors
      try {
        const ro = await getStakingContract(null, true);
        await ro.callStatic.withdraw(index, { from: walletAddress });
      } catch (e) {
        // friendly diagnostics
        const s = stakes[index];
        const perStakeLock = s.lockPeriod?.toNumber ? s.lockPeriod.toNumber() : cooldown;
        const unlockTime = s.startTime.toNumber() + perStakeLock;
        const lockLeft = Math.max(0, unlockTime - now);
        const tgeLeft = Math.max(0, tgeDate - now);
        if (s.withdrawn) throw new Error("Already withdrawn.");
        if (lockLeft > 0) throw new Error(`Stake is still locked for ${formatTimeLeft(lockLeft)}.`);
        if (tgeLeft > 0) throw new Error(`TGE not reached. Available in ${formatTimeLeft(tgeLeft)}.`);
        const msg = decodeRevert(e) || "Simulation failed";
        throw new Error(msg);
      }
      const tx = await contract.withdraw(index);
      await tx.wait();
      // optional toast removed
      await fetchData();
    } catch (err) {
      console.error("Claim error:", err);
      // Map known revert to friendly message
      let friendly = err?.message || "Transaction failed";
      try {
        const s = stakes[index];
        const perStakeLock = s.lockPeriod?.toNumber ? s.lockPeriod.toNumber() : cooldown;
        const unlockTime = s.startTime.toNumber() + perStakeLock;
        const lockLeft = Math.max(0, unlockTime - now);
        const tgeLeft = Math.max(0, tgeDate - now);
        const dataHex = err?.data || err?.error?.data || "";
        const name = err?.errorName || "";
        if (name === 'ErrCooldown' || dataHex === '0x8cd97582') {
          if (lockLeft > 0) friendly = `Stake is still locked for ${formatTimeLeft(lockLeft)}.`;
          else if (tgeLeft > 0) friendly = `TGE not reached. Available in ${formatTimeLeft(tgeLeft)}.`;
          else friendly = "Stake is still locked.";
        }
      } catch(_) {}
      toast.error(friendly);
    } finally {
      setLoadingIndex(null);
    }
  };

  const handleClaimRewardOnly = async (index) => {
    if (!signer || !hasClaimReward) return;
    try {
      setLoadingIndex(index);
      const contract = getStakingContract(signer);
      // toast removed
      try { await contract.callStatic.claimReward(index); } catch (e) {
        const msg = (e?.error?.message || e?.data || e?.message || "Simulation failed");
        throw new Error("Claim not available: " + msg);
      }
      const tx = await contract.claimReward(index);
      await tx.wait();
      // toast removed
      await fetchData();
    } catch (err) {
      console.error("ClaimReward error:", err.message);
      toast.error(err.message);
    } finally {
      setLoadingIndex(null);
    }
  };

  // Early Unstake with penalty (user-consented)
  const handleEarlyUnstake = async (index) => {
    if (!signer) return;
    try {
      setLoadingIndex(index);
      const contract = getStakingContract(signer);
      // read fee for estimation
      let feePct = 0;
      try {
        const raw = await contract.unstakeFee();
        feePct = parseFloat(require('ethers').ethers.utils.formatUnits(raw, 16)); // e.g., 10.00
      } catch (_) {}
      const s = stakes[index];
      const principal = parseFloat(formatUnits(s.locked, 18));
      const estNet = Math.max(0, principal * (1 - feePct / 100));
      const ok = window.confirm(`Early Unstake applies a ${feePct.toFixed(2)}% fee.\nYou staked ~${principal.toLocaleString()} BITS.\nYou will receive ≈ ${estNet.toLocaleString()} BITS.\nContinue?`);
      if (!ok) { setLoadingIndex(null); return; }
      // Let the contract enforce rules and apply fee
      const tx = await contract.withdraw(index);
      await tx.wait();
      await fetchData();
    } catch (err) {
      console.error("Early Unstake error:", err);
      const msg = err?.reason || err?.message || 'Unstake failed';
      toast.error(msg);
    } finally {
      setLoadingIndex(null);
    }
  };

  return (
    <div className="claim-stakes">
      <h3>📊 My Staked Positions</h3>
      <p><strong>💰 Total Claimable:</strong> {Math.floor(parseFloat(totalClaimable))} $BITS</p>
      {stakes.length === 0 && <p>No stakes found.</p>}
      {stakes.map((s, i) => {
        const eligible = canWithdraw(s);
        const dynamicReward = dynamicRewards[i] || 0;
        
        return (
          <div key={i} className="stake-entry">
            <p><strong>Amount:</strong> {Math.floor(parseFloat(formatUnits(s.locked, 18)))} $BITS</p>
            <p><strong>APR:</strong> {formatAprPercentFrom1e18(s.apr)}</p>
            {!s.withdrawn && (<p><strong>Reward:</strong> {clampBits(dynamicReward)} $BITS</p>)}
            {s.withdrawn ? (
              <>
                <p><strong>Status:</strong> ✅ Claimed</p>
                <p><strong>Duration:</strong> {formatDuration(Math.max(0, Math.min(now, (s.startTime?.toNumber?.() || Number(s.startTime)) + ((s.lockPeriod?.toNumber?.() || 0) > 0 ? s.lockPeriod.toNumber() : cooldown)) - (s.startTime?.toNumber?.() || Number(s.startTime))))}</p>
                {!!unstakeFeePct && <p style={{ color:'#ffd27f' }}><strong>Penalty (est.):</strong> {(parseFloat(formatUnits(s.locked, 18)) * (unstakeFeePct/100)).toFixed(4)} $BITS</p>}
              </>
            ) : (
              <p><strong>Status:</strong> 🔒 Locked</p>
            )}

            {!eligible && !s.withdrawn && renderCountdown(s)}

            {/* Withdraw stake (+rewards) */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                className="claim-button"
                onClick={() => handleClaim(i)}
                disabled={!eligible || s.withdrawn || loadingIndex === i}
              >
                {loadingIndex === i
                  ? "Processing..."
                  : s.withdrawn
                  ? "✅ Withdrawn"
                  : eligible
                  ? `⬇️ Withdraw ${Math.floor(parseFloat(formatUnits(s.locked, 18)))} $BITS`
                  : "⬇️ Withdraw"}
              </button>
 
               {/* Early Unstake with penalty - always visible when not withdrawn */}
              {!s.withdrawn && (
                <button
                  className="claim-button"
                  onClick={() => handleEarlyUnstake(i)}
                  disabled={loadingIndex === i}
                  style={{ background: 'transparent', borderColor: '#f39c12', color: '#f39c12' }}
                  title="Unstake early with penalty"
                >
                  {loadingIndex === i ? 'Processing...' : '⚠️ Unstake early (−fee)'}
                </button>
              )}
 
               {hasClaimReward && !s.withdrawn && (
                 <button
                   className="claim-button"
                   onClick={() => handleClaimRewardOnly(i)}
                   disabled={loadingIndex === i}
                   style={{ background: 'transparent', borderColor: '#4ecdc4' }}
                 >
                   {loadingIndex === i ? "Processing..." : `💰 Claim Rewards`}
                 </button>
               )}
             </div>
 
             {/* Explicație dacă butonul e dezactivat */}
            {!s.withdrawn && (
              <p className="claim-info" style={{ fontSize: "0.85em", color: "#bbb", marginTop: "4px" }}>
                ⚠️ Unstake early: applies a protocol fee if the position is still locked; if READY, fee is 0%.
              </p>
            )}
          </div>
        );
      })}
      <ToastContainer position="top-right" autoClose={4000} pauseOnHover />
    </div>
  );
};

export default ClaimStakes;
