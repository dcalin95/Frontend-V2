import React, { useEffect, useState, useContext } from "react";
import { ethers } from "ethers";
import WalletContext from "../../context/WalletContext";
import { CONTRACTS } from "../../contract/contracts";
import './BoosterCalculator.css';

const BoosterCalculator = ({ baseBits }) => {
  const { walletAddress } = useContext(WalletContext);

  const [bonusPercent, setBonusPercent] = useState(0);
  const [bonusTokens, setBonusTokens] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [rewardInfo, setRewardInfo] = useState([]);
  const [usdEstimated, setUsdEstimated] = useState(0);

  const fallbackTiers = [
    { limit: 100, percent: 5 },
    { limit: 500, percent: 7 },
    { limit: 1000, percent: 10 },
    { limit: 2000, percent: 12 },
  ];

  // Fetch reward tiers from the contract or use fallback
  const fetchRewardInfo = async () => {
    if (!walletAddress || !window.ethereum) {
      console.warn("⚠️ Wallet or provider not found");
      setRewardInfo(fallbackTiers);
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        CONTRACTS.NODE.address,
        CONTRACTS.NODE.abi,
        provider
      );

      const rewards = await contract.getAdditionalRewardInfo();
      console.log("🧾 Raw rewards from contract:", rewards);

      const formatted = rewards.map((r, i) => {
        const limit = parseFloat(ethers.utils.formatUnits(r.limit, 18));
        const percent = Number(r.percent); // Percent values are integers (5, 7, 10, 15)
        console.log(`📈 Tier ${i}: limit=${limit}, bonus=${percent}%`);
        return { limit, percent };
      });

      setRewardInfo(formatted.length === 0 ? fallbackTiers : formatted);
    } catch (err) {
      console.error("❌ Failed to fetch reward tiers, using fallback", err);
      setRewardInfo(fallbackTiers);
    }
  };

  // Calculate the bonus based on the provided baseBits
  const calculateBonus = async () => {
    if (!baseBits || baseBits <= 0 || rewardInfo.length === 0 || !window.ethereum) {
      setBonusPercent(0);
      setBonusTokens(0);
      setTotalTokens(0);
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const cellManager = new ethers.Contract(CONTRACTS.CELL_MANAGER.address, [
        "function getCurrentOpenCellPrice(address) view returns (uint256)"
      ], provider);

      // Get price per BIT in USD (using current cell price)
      const pricePerBit = await cellManager.getCurrentOpenCellPrice(walletAddress);
      const bitsFloat = parseFloat(baseBits);
      const usd = (bitsFloat * parseFloat(pricePerBit.toString())) / 1000;  // converting millicents to USD
      const usdRounded = Math.floor(usd);
      setUsdEstimated(usdRounded);  // Display USD estimate

      // Find applicable bonus tier based on USD calculated
      const applicable = rewardInfo
        .slice()
        .reverse()
        .find((r) => usdRounded >= r.limit);

      const percent = applicable ? applicable.percent : 0;
      const bonus = (baseBits * percent) / 100;  // Calculate the bonus in $BITS
      const total = baseBits + bonus;  // Total amount in $BITS (BITS + bonus)

      console.log("📊 USD Calculated from on-chain price:", usdRounded);
      console.log("🎁 Bonus % =", percent);
      console.log("🎯 Bonus tokens =", bonus);

      // Update state for bonus calculations
      setBonusPercent(percent);
      setBonusTokens(bonus);
      setTotalTokens(total);  // Total amount to be displayed
    } catch (err) {
      console.error("❌ Failed to fetch price from CellManager:", err);
    }
  };

  // Fetch reward tiers and calculate bonus when wallet address changes
  useEffect(() => {
    fetchRewardInfo();
  }, [walletAddress]);

  // Recalculate bonus when baseBits or reward info change
  useEffect(() => {
    if (rewardInfo.length > 0) {
      calculateBonus();
    }
  }, [baseBits, rewardInfo]);

  return (
    <div className="booster-bar">
      <div className="booster-item">
        <span className="label" title="Estimated USD used to determine your bonus tier">💵</span>
        <span className="value"
          style={{
            backgroundColor: "#0a0a0a",
            border: "1px solid #00ffaa55",
            color: "#00ffaa",
            padding: "2px 8px",
            borderRadius: "6px",
            fontWeight: "bold",
            fontSize: "13px"
          }}
        >
          ${usdEstimated.toFixed(0)}
        </span>
      </div>

      <div className="booster-item">
        <span className="label">🎯</span>
        <span className="value">{bonusTokens.toFixed(2)} $BITS</span>
      </div>

      <div className="booster-item">
        <span className="label">🔥</span>
        <span className="value">{bonusPercent.toFixed(0)}%</span>
      </div>

      <div className="booster-item">
        <span className="label">🛡️</span>
        <span className="value">{totalTokens.toFixed(2)} $BITS</span>
      </div>
    </div>
  );
};

export default BoosterCalculator;
