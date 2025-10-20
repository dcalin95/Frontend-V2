import React from "react";
import StakingSummary from "./StakingSummary";
import StakingBox from "./StakingBox";
import StakingInfoBox from "./StakingInfoBox";
import "../styles/StakingCard.css";

const StakingCard = () => {
  return (
    <div className="staking-card">
      <StakingSummary />
      <StakingBox />
      <StakingInfoBox />
    </div>
  );
};

export default StakingCard;
