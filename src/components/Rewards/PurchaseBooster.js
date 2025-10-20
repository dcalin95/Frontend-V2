import React, { useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { ethers } from "ethers";
import "./PurchaseBooster.css";
import nodeABI from "../../abi/NodeABI.js";

const NODE_CONTRACT_ADDRESS = "0xA2AeEb08262EaA44D6f5A6b29Ddaf2F4378FDC2B";

const PurchaseBooster = ({ tokensReceive }) => {
  const [rewardInfo, setRewardInfo] = useState([]); // Praguri și procente
  const [bonusPercent, setBonusPercent] = useState(0);
  const [bonusTokens, setBonusTokens] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [animationClass, setAnimationClass] = useState(""); // Pentru efectele animate
  const [sparkles, setSparkles] = useState([]); // Particule stelate

  // Fetch reward info from the smart contract
  const fetchRewardInfo = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(NODE_CONTRACT_ADDRESS, nodeABI, provider);

      const rewards = await contract.getAdditionalRewardInfo();
      const formattedRewards = rewards.map((reward) => ({
        limit: parseFloat(ethers.utils.formatUnits(reward.limit, 18)),
        percent: Number(reward.percent), // Percent values are integers (5, 7, 10, 15)
      }));
      setRewardInfo(formattedRewards);
    } catch (error) {
      console.error("Error fetching reward info:", error);
    }
  };

  // Calculate bonus based on the tokensReceive value
  const calculateBonus = (tokens) => {
    const applicableReward = rewardInfo.find((reward) => tokens >= reward.limit);
    const calculatedBonusPercent = applicableReward ? applicableReward.percent : 0;
    const calculatedBonusTokens = (tokens * calculatedBonusPercent) / 100;

    setBonusPercent(calculatedBonusPercent);
    setBonusTokens(calculatedBonusTokens);
    setTotalTokens(tokens + calculatedBonusTokens);
  };

  // Animații când suma totală se schimbă
  useEffect(() => {
    if (tokensReceive > 0) {
      // Activează clasa de animație
      setAnimationClass("updated");
      // Creează stelute ✨
      setSparkles(Array.from({ length: 6 }, (_, i) => i)); // 6 steluțe

      // Dezactivează animația după 0.6 secunde
      setTimeout(() => {
        setAnimationClass("");
        setSparkles([]);
      }, 600);
    }
  }, [tokensReceive]); // Se declanșează la schimbarea sumei primite

  // Fetch reward info on component mount
  useEffect(() => {
    fetchRewardInfo();
  }, []);

  // Update bonus calculations whenever tokensReceive or rewardInfo changes
  useEffect(() => {
    if (tokensReceive > 0 && rewardInfo.length > 0) {
      calculateBonus(tokensReceive);
    }
  }, [tokensReceive, rewardInfo]);

  return (
    <div className="purchase-booster">
      <h2>Booster Rewards</h2>
      <p className="booster-message">
        ➡️ Boost your rewards! The more $BITS you buy, the more bonus tokens you receive!
      </p>

      <div className="reward-display">
        <p>
          Bonus Percent: <strong>{bonusPercent}%</strong>
        </p>
        <p>
          Bonus Tokens: <strong>{bonusTokens.toFixed(2)} $BITS</strong>
        </p>
        <p>
          Total Tokens:{" "}
          <span className={`bits-amount ${animationClass}`}>
            {totalTokens.toFixed(2)} $BITS
            {/* Stelute animate */}
            {sparkles.map((_, index) => (
              <span key={index} className="sparkle"></span>
            ))}
          </span>
        </p>
      </div>

      <div className="reward-info">
        <h3>Reward Tiers:</h3>
        <ul>
          {rewardInfo.map((reward, index) => (
            <li key={index}>
              Invest ${reward.limit.toFixed(2)} or more to get{" "}
              {reward.percent.toFixed(2)}% bonus!
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PurchaseBooster;


