// src/Presale/Rewards/RewardsMain.jsx

import React from "react";
import RewardCard from "./RewardCard";
import StakeRewards from "./StakeRewards";
import { TELEGRAM_REWARD_CONTRACT, ADDITIONAL_REWARD_CONTRACT } from "./contracts";
import "./rewards.css";

const RewardsMain = ({ provider, userAddress }) => {
  return (
    <div className="rewards-main">
      <h2 style={{letterSpacing: '0.5px'}}>🎁 Rewards Hub · AI Mode</h2>
      <div className="reward-summary-banner">
        AI Insight: Rewards are calculated from your Telegram activity and invite performance. Connect your wallet to claim or stake. Data updates periodically.
      </div>
      <div className="reward-cards-container">
        <RewardCard
          provider={provider}
          userAddress={userAddress}
          contractInfo={TELEGRAM_REWARD_CONTRACT}
          label="Telegram Reward"
        />
        <RewardCard
          provider={provider}
          userAddress={userAddress}
          contractInfo={ADDITIONAL_REWARD_CONTRACT}
          label="Referral Reward"
        />
      </div>

      <StakeRewards provider={provider} userAddress={userAddress} />
    </div>
  );
};

export default RewardsMain;
