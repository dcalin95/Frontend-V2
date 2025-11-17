// StakingMobile wraps the desktop StakingPage component
// Uses the SAME logic, just with mobile-optimized styling

import React from "react";
import StakingPage from "../../Staking/StakingPage";

const StakingMobile = ({ walletAddress }) => {
  return (
    <div className="mobile-staking-wrapper">
      <StakingPage />
    </div>
  );
};

export default StakingMobile;
