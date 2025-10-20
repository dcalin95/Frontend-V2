import React, { useEffect, useState, useContext } from "react";
import WalletContext from "../../context/WalletContext";
import useBitsPrice from "../../Presale/prices/useBitsPrice";
import { getStakingContract } from "../../contract/getStakingContract";
import { formatUnits } from "ethers/lib/utils";
import "../styles/StakingUSDValue.css";

// Clean number formatting function (NO K/M abbreviations)
const formatAINumber = (number, decimals = 2, isPrice = false) => {
  if (!number || isNaN(number)) return isPrice ? "$0.00" : "0.00";
  
  const num = parseFloat(number);
  
  if (isPrice && num < 1) {
    // For prices less than $1, show more decimals
    return `$${num.toFixed(4)}`;
  }
  
  // Always show numbers with separators; keep two decimals for USD values
  if (isPrice) {
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const StakingUSDValue = ({ signer }) => {
  const { walletAddress } = useContext(WalletContext);
  const { bitsPrice, loading: priceLoading } = useBitsPrice(walletAddress);
  
  const [totalStakedUSD, setTotalStakedUSD] = useState(0);
  const [totalRewardsUSD, setTotalRewardsUSD] = useState(0);
  const [totalValueUSD, setTotalValueUSD] = useState(0);
  const [profitUSD, setProfitUSD] = useState(0);
  const [profitPct, setProfitPct] = useState(0);

  useEffect(() => {
    const fetchUSDValues = async () => {
      console.log("🔍 StakingUSDValue Debug Start:");
      console.log("- bitsPrice:", bitsPrice);
      console.log("- signer:", !!signer);
      console.log("- walletAddress:", walletAddress);
      console.log("- priceLoading:", priceLoading);

      if (!bitsPrice || !walletAddress) {
        console.log("❌ Early return - missing bitsPrice or walletAddress");
        setTotalStakedUSD(0);
        setTotalRewardsUSD(0);
        setTotalValueUSD(0);
        return;
      }

      try {
        const contract = await getStakingContract(null, true);
        console.log("📜 Contract address:", contract.address);

        // Prefer USER staked/rewards, not global totals
        let totalStakedRaw, totalRewardsRaw;
        try {
          totalStakedRaw = await contract.getUserTotalStaked(walletAddress);
        } catch (e) {
          console.warn("⚠️ getUserTotalStaked failed, fallback to summing stakes:", e?.message);
          try {
            const stakes = await contract.getStakeByUser(walletAddress);
            totalStakedRaw = stakes.reduce((acc, s) => (!s.withdrawn ? acc.add(s.locked) : acc),
              (typeof window !== 'undefined' && window.ethers ? window.ethers.BigNumber.from(0) : require('ethers').BigNumber.from(0))
            );
          } catch (e2) {
            console.warn("⚠️ getStakeByUser failed:", e2?.message);
            totalStakedRaw = require('ethers').BigNumber.from(0);
          }
        }
        try {
          totalRewardsRaw = await contract.getTotalCurrentEarnings(walletAddress);
        } catch (e) {
          console.warn("⚠️ getTotalCurrentEarnings failed, fallback to getTotalRewardForUser:", e?.message);
          try {
            totalRewardsRaw = await contract.getTotalRewardForUser(walletAddress);
          } catch (e2) {
            console.warn("⚠️ getTotalRewardForUser failed:", e2?.message);
            totalRewardsRaw = require('ethers').BigNumber.from(0);
          }
        }

        // Convert to readable format
        const stakedBits = parseFloat(formatUnits(totalStakedRaw, 18));
        const rewardsBits = parseFloat(formatUnits(totalRewardsRaw, 18));

        // Calculate USD values
        const stakedUSD = stakedBits * bitsPrice;
        const rewardsUSD = rewardsBits * bitsPrice;
        const totalUSD = stakedUSD + rewardsUSD;
        const plUSD = totalUSD - stakedUSD;
        const plPct = stakedUSD > 0 ? (plUSD / stakedUSD) * 100 : 0;

        setTotalStakedUSD(stakedUSD);
        setTotalRewardsUSD(rewardsUSD);
        setTotalValueUSD(totalUSD);
        setProfitUSD(plUSD);
        setProfitPct(plPct);

        console.log("💰 USD Value Calculation Final:");
        console.log("- BITS Price:", bitsPrice);
        console.log("- Staked BITS:", stakedBits);
        console.log("- Rewards BITS:", rewardsBits);
        console.log("- Staked USD:", stakedUSD);
        console.log("- Rewards USD:", rewardsUSD);
        console.log("- Total USD:", totalUSD);

      } catch (err) {
        console.error("❌ Error fetching USD values:", err);
        setTotalStakedUSD(0);
        setTotalRewardsUSD(0);
        setTotalValueUSD(0);
      }
    };

    fetchUSDValues();
  }, [bitsPrice, signer, walletAddress, priceLoading]);

  if (priceLoading) {
    return (
      <div className="staking-usd-container">
        <h3 className="usd-title">USD Value</h3>
        <div className="usd-loading">Loading price...</div>
      </div>
    );
  }

  return (
    <div className="staking-usd-container">
      <h3 className="usd-title">USD Value</h3>
      
      <div className="usd-grid">
        <div className="usd-item">
          <span className="usd-label">$BITS Price</span>
          <span className="usd-value ai-number">
            {formatAINumber(bitsPrice, 4, true)}
          </span>
        </div>
        
        <div className="usd-item">
          <span className="usd-label">Staked Value</span>
          <span className="usd-value ai-number">
            {formatAINumber(totalStakedUSD, 2, true)}
          </span>
        </div>
        
        <div className="usd-item">
          <span className="usd-label">Rewards Value</span>
          <span className="usd-value ai-number">
            {formatAINumber(totalRewardsUSD, 2, true)}
          </span>
        </div>

        <div className="usd-item">
          <span className="usd-label">P/L</span>
          <span className={`usd-value ai-number ${profitUSD >= 0 ? 'usd-pl-positive' : 'usd-pl-negative'}`}>
            {formatAINumber(profitUSD, 2, true)} {isFinite(profitPct) ? `(${profitPct.toFixed(2)}%)` : ""}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StakingUSDValue;
