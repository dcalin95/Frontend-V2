// src/Presale/Rewards/StakeRewards.jsx

import React, { useState } from "react";
import { ethers } from "ethers";
import { ADDITIONAL_REWARD_CONTRACT, TELEGRAM_REWARD_CONTRACT } from "./contracts";

const StakeRewards = ({ provider, userAddress }) => {
  const [isStaking, setIsStaking] = useState(false);

  const stakeFromContract = async (contractInfo, label) => {
    try {
      setIsStaking(true);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractInfo.address, contractInfo.abi, signer);
      if (label === "Telegram" && typeof contract.transferTelegramRewardToStaking === 'function') {
        // Fetch available amount then stake that exact amount
        const available = await contract.getTelegramReward(userAddress);
        if (available.eq(0)) { alert('No Telegram reward to stake.'); return; }
        const tx = await contract.transferTelegramRewardToStaking(available);
        await tx.wait();
        alert(`✅ ${label} reward staked!`);
        return;
      }

      // Referral staking not supported in current ABI; show info
      alert('Referral staking is not available via contract at this time.');
      return;
    } catch (err) {
      console.error(`❌ Staking failed for ${label}:`, err);
      alert(`Eroare staking ${label}: ${err.message}`);
    } finally {
      setIsStaking(false);
    }
  };

  if (!provider || !userAddress) {
    return <p>🔒 Wallet not connected. Connect your wallet to stake rewards.</p>;
  }

  return (
    <div className="stake-section">
      <h3>📥 Stake Rewards</h3>
      <button
        onClick={() => stakeFromContract(TELEGRAM_REWARD_CONTRACT, "Telegram")}
        disabled={isStaking}
      >
        {isStaking ? "Staking..." : "📨 Stake Telegram Reward"}
      </button>
      <button disabled title="Referral staking unavailable in current contract">
        📨 Stake Referral Reward
      </button>
    </div>
  );
};

export default StakeRewards;
