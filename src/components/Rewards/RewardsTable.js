import React from "react";
import InvestmentRewards from "../RewardsDashboard/InvestmentRewards";

const RewardsTable = () => {
  return (
    <div className="rewards-table-container">
      {/* Eliminăm Referral Rewards și păstrăm doar Investment Rewards */}
      <InvestmentRewards totalInvestment="819750.69" bonusEarned="81975.07" />
    </div>
  );
};

export default RewardsTable;

