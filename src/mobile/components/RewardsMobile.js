// RewardsMobile wraps the desktop RewardsHub component
// Uses the SAME logic for rewards, referrals, and claims

import React from "react";
import RewardsHub from "../../components/RewardsHub";

const RewardsMobile = ({ walletAddress }) => {
  return (
    <div className="mobile-rewards-wrapper">
      <RewardsHub />
    </div>
  );
};

export default RewardsMobile;
