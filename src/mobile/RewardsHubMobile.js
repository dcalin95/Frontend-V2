import React from "react";
import RewardsHub from "../components/RewardsHub";
import "../components/RewardsHub.desktop.css";
import "../components/RewardsHub.mobile.css";

const RewardsHubMobile = () => {
  return (
    <div className="mobile-rewards-hub-wrapper">
      <RewardsHub />
    </div>
  );
};

export default RewardsHubMobile;

