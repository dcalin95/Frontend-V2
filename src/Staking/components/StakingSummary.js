import React, { useEffect, useState, useContext } from "react";
import WalletContext from "../../context/WalletContext";
import { getStakingContract } from "../../contract/getStakingContract";
import { formatUnits } from "ethers/lib/utils";
import "../styles/StakingSummary.css";
import { aprPercentDisplayFrom1e18 } from "../utils/aprFormat";

// AI-style number formatting function
const formatAINumber = (number, decimals = 2) => {
  if (!number || isNaN(number)) return "0.00";
  
  const num = parseFloat(number);
  
  if (num >= 1000000) {
    // Millions: 1,234,567.89 → 1.23M
    return `${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    // Thousands: 11,664.00 → 11.66K
    return `${(num / 1000).toFixed(2)}K`;
  } else {
    // Regular numbers with comma separators
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
};

// Convert raw APR (storage) to percent number (e.g., 20.00 for 20%)
const aprPercentNumber = (raw) => {
  try {
    const n = Number(raw?.toString?.() || raw);
    if (!isFinite(n)) return 0;
    // Heuristic: very large => 1e18 based
    if (n > 1e10) {
      return parseFloat(require('ethers').ethers.utils.formatUnits(raw, 16));
    }
    // Otherwise it's percent*100 (e.g., 2200 => 22.00)
    return n / 100;
  } catch(_) { return 0; }
};

const StakingSummary = ({ signer, stakes: stakesFromPage }) => {
  const { walletAddress } = useContext(WalletContext);

  const [totalStaked, setTotalStaked] = useState("0");
  const [totalRewards, setTotalRewards] = useState("0");
  const [activeStakes, setActiveStakes] = useState(0);

  useEffect(() => {
    const fetchSummary = async () => {
      console.log("🔍 signer:", signer);
      console.log("🔍 walletAddress:", walletAddress);

      if (!walletAddress) {
        console.warn("🚫 Wallet not connected or signer missing.");
        return;
      }

      try {
        // If avem stakes din pagină, evităm on-chain reads și calculăm direct
        if (Array.isArray(stakesFromPage) && stakesFromPage.length) {
          console.log("🟢 SUMMARY: using stakes from page (no RPC)");
          const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;
          const now = Math.floor(Date.now() / 1000);

          let totalStakedBits = 0;
          let dynRewards = 0;
          let active = 0;
          stakesFromPage.forEach((s, idx) => {
            if (s.withdrawn) return;
            active++;
            const rawAmount = s.locked ?? s.amount ?? 0;
            const staked = parseFloat(require('ethers').utils.formatUnits(rawAmount, 18)) || 0;
            totalStakedBits += staked;

            const start = s.startTime?.toNumber ? s.startTime.toNumber() : Number(s.startTime || 0);
            const lock = s.lockPeriod?.toNumber ? s.lockPeriod.toNumber() : Number(s.lockPeriod || SECONDS_IN_YEAR);
            const elapsed = Math.max(0, now - start);
            const secs = Math.min(elapsed, lock);
            const aprPercent = aprPercentNumber(s.apr); // robust parse (percent)
            const aprDecimal = aprPercent / 100;       // 22.00% -> 0.22
            const perSecond = aprDecimal / SECONDS_IN_YEAR;
            const partial = staked * perSecond * secs;
            dynRewards += partial;
            console.log("🧮 SUMMARY (page) stake["+idx+"] partial:", { staked, secs, aprPercent, partial });
          });

          setTotalStaked(String(totalStakedBits));
          setTotalRewards(String(dynRewards));
          setActiveStakes(active);
          return;
        }

        // Prefer robust read-only provider to avoid MetaMask JSON-RPC issues in Firefox
        const contract = await getStakingContract(null, true);
        console.log("📜 Contract address:", contract.address);

        // Prefer per-user metrics over global totals
        const [total, rewards, stakes] = await Promise.all([
          (async () => {
            try {
              const v = await contract.getUserTotalStaked(walletAddress);
              console.log("📊 User total staked (raw):", v.toString());
              return v;
            } catch (e) {
              console.warn("⚠️ getUserTotalStaked failed, fallback to sum stakes:", e?.message);
              try {
                const arr = await contract.getStakeByUser(walletAddress);
                const { BigNumber } = require('ethers');
                const sum = arr.reduce((acc, s) => (!s.withdrawn ? acc.add(s.locked) : acc), BigNumber.from(0));
                return sum;
              } catch (e2) {
                console.warn("⚠️ getStakeByUser sum fallback failed:", e2?.message);
                const { BigNumber } = require('ethers');
                return BigNumber.from(0);
              }
            }
          })(),
          (async () => {
            try {
              const v = await contract.getTotalCurrentEarnings(walletAddress);
              console.log("🏆 User total current earnings (raw):", v.toString());
              return v;
            } catch (e) {
              console.warn("⚠️ getTotalCurrentEarnings failed, fallback to getTotalRewardForUser:", e?.message);
              try {
                const v2 = await contract.getTotalRewardForUser(walletAddress);
                console.log("🏆 User total reward fallback (raw):", v2.toString());
                return v2;
              } catch (e2) {
                console.warn("⚠️ getTotalRewardForUser failed:", e2?.message);
                const { BigNumber } = require('ethers');
                return BigNumber.from(0);
              }
            }
          })(),
          (async () => {
            if (Array.isArray(stakesFromPage) && stakesFromPage.length) {
              console.log("🌀 Stakes from page hook (preferred):", stakesFromPage);
              return stakesFromPage;
            }
            const s = await contract.getStakeByUser(walletAddress);
            console.log("🌀 Stakes from contract:", s);
            return s;
          })()
        ]);

        const active = stakes.filter(s => !s.withdrawn).length;
        console.log("🧮 Active stakes count:", active);

        console.log("🧩 SUMMARY DEBUG: raw totalStaked BN:", total?.toString?.());
        setTotalStaked(formatUnits(total, 18));

        console.log("🧩 SUMMARY DEBUG: raw totalRewards BN:", rewards?.toString?.());
        console.log("🧩 SUMMARY DEBUG: stakes length:", Array.isArray(stakes) ? stakes.length : 'n/a');

        // Compute deterministic dynamic estimate regardless, for sanity check
        let dyn = 0;
        try {
          const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;
          const now = Math.floor(Date.now() / 1000);
          stakes.forEach((s, idx) => {
            if (s.withdrawn) return;
            const rawAmount = s.locked ?? s.amount ?? 0;
            const staked = parseFloat(formatUnits(rawAmount, 18)) || 0;
            const start = s.startTime?.toNumber ? s.startTime.toNumber() : Number(s.startTime || 0);
            const lock = s.lockPeriod?.toNumber ? s.lockPeriod.toNumber() : Number(s.lockPeriod || SECONDS_IN_YEAR);
            const elapsed = Math.max(0, now - start);
            const secs = Math.min(elapsed, lock);
            const aprPercent = aprPercentNumber(s.apr); // robust parse (percent)
            const aprDecimal = aprPercent / 100;       // to decimal
            const perSecond = aprDecimal / SECONDS_IN_YEAR;
            dyn += staked * perSecond * secs;
          });
        } catch (_){ dyn = 0; }

        // Prefer on-chain total unless it is clearly unrealistic
        let rewardsReadable = parseFloat(formatUnits(rewards, 18));
        const totalStakedBits = parseFloat(formatUnits(total, 18)) || 0;
        const isUnrealistic = !Number.isFinite(rewardsReadable)
          || rewardsReadable < 0
          || (dyn > 0 && rewardsReadable > dyn * 3) // far above calculated accrual
          || rewardsReadable > (totalStakedBits * 2); // >2x principal is unlikely without long history
        if (isUnrealistic) {
          console.warn("⚠️ On-chain rewards looked unrealistic; using dynamic estimate.", { rewardsReadable, dyn, totalStakedBits });
          rewardsReadable = dyn;
        }
        console.log("🧩 SUMMARY DEBUG: final chosen rewardsReadable:", rewardsReadable);
        setTotalRewards(String(rewardsReadable));
        setActiveStakes(active);

      } catch (err) {
        console.error("❌ Error fetching staking summary:", err);
      }
    };

    fetchSummary();
  }, [signer, walletAddress, stakesFromPage]);

  return (
    <div className="stakingCard">
      {/* Title removed to avoid duplication in mobile view */}
      
      <div className="ai-stats-grid">
        <div className="ai-stat-item">
          <div className="ai-stat-label">Total Staked</div>
          <div className="ai-stat-value ai-number">{formatAINumber(totalStaked, 2)}</div>
          <div className="ai-stat-label">$BITS</div>
        </div>
        
        <div className="ai-stat-item">
          <div className="ai-stat-label">Total Rewards</div>
          <div className="ai-stat-value ai-number">
            {(() => {
              const val = parseFloat(totalRewards || '0');
              if (!isFinite(val) || val === 0) return '0.00';
              // Show more precision for small values instead of "< 0.01"
              const decimals = val < 1 ? 4 : 2;
              return val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
            })()}
          </div>
          <div className="ai-stat-label">$BITS</div>
        </div>
        
        <div className="ai-stat-item">
          <div className="ai-stat-label">Active Stakes</div>
          <div className="ai-stat-value ai-number">{activeStakes}</div>
          <div className="ai-stat-label">Positions</div>
        </div>
        
        <div className="ai-stat-item">
          <div className="ai-stat-label">Efficiency</div>
          <div className="ai-stat-value">{activeStakes > 0 ? '95%' : '0%'}</div>
          <div className="ai-stat-label">Rate</div>
        </div>
      </div>
    </div>
  );
};

export default StakingSummary;
