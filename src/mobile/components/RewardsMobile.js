import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";

const RewardsMobile = ({ walletAddress }) => {
  const [totalRewards, setTotalRewards] = useState(0);
  const [pendingRewards, setPendingRewards] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      fetchRewardsData();
      fetchInviteCode();
    }
  }, [walletAddress]);

  const fetchRewardsData = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
      const response = await axios.get(`${backendUrl}/api/referral?wallet=${walletAddress}`);
      
      if (response.data) {
        setTotalRewards(response.data.totalRewards || 0);
        setPendingRewards(response.data.pendingRewards || 0);
      }
    } catch (error) {
      console.error("Error fetching rewards:", error);
    }
  };

  const fetchInviteCode = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
      const response = await axios.get(`${backendUrl}/api/invite/get?wallet=${walletAddress}`);
      
      if (response.data && response.data.code) {
        setInviteCode(response.data.code);
      }
    } catch (error) {
      console.error("Error fetching invite code:", error);
    }
  };

  const handleGenerateCode = async () => {
    if (!walletAddress) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsGenerating(true);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
      const response = await axios.post(`${backendUrl}/api/invite/generate`, {
        wallet: walletAddress,
      });

      if (response.data && response.data.code) {
        setInviteCode(response.data.code);
        toast.success("Invite code generated!");
      }
    } catch (error) {
      console.error("Error generating code:", error);
      toast.error("Failed to generate code");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      toast.success("Code copied to clipboard!");
    }
  };

  const handleClaimRewards = async () => {
    if (!walletAddress) {
      toast.error("Please connect your wallet");
      return;
    }

    if (pendingRewards <= 0) {
      toast.error("No rewards to claim");
      return;
    }

    setIsClaiming(true);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
      const response = await axios.post(`${backendUrl}/api/referral/claim`, {
        wallet: walletAddress,
      });

      if (response.data && response.data.success) {
        toast.success(`Claimed ${pendingRewards} $BITS!`);
        fetchRewardsData();
      }
    } catch (error) {
      console.error("Error claiming rewards:", error);
      toast.error("Failed to claim rewards");
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="mobile-rewards-box">
      {/* Rewards Summary */}
      <div className="mobile-rewards-info">
        <div className="mobile-rewards-stat">
          <span className="mobile-stat-label">Total Rewards</span>
          <span className="mobile-stat-value">
            {totalRewards.toLocaleString()} $BITS
          </span>
        </div>
        <div className="mobile-rewards-stat">
          <span className="mobile-stat-label">Pending</span>
          <span className="mobile-stat-value mobile-stat-pending">
            {pendingRewards.toLocaleString()} $BITS
          </span>
        </div>
      </div>

      {/* Claim Button */}
      <button
        className="mobile-claim-btn"
        onClick={handleClaimRewards}
        disabled={isClaiming || !walletAddress || pendingRewards <= 0}
      >
        {isClaiming ? "Claiming..." : "Claim Rewards"}
      </button>

      {/* Invite Code Section */}
      <div className="mobile-invite-section">
        <h4 className="mobile-invite-title">Your Invite Code</h4>
        {inviteCode ? (
          <div className="mobile-code-display">
            <span className="mobile-code-text">{inviteCode}</span>
            <button className="mobile-copy-btn" onClick={handleCopyCode}>
              📋
            </button>
          </div>
        ) : (
          <button
            className="mobile-generate-btn"
            onClick={handleGenerateCode}
            disabled={isGenerating || !walletAddress}
          >
            {isGenerating ? "Generating..." : "Generate Code"}
          </button>
        )}
      </div>

      {!walletAddress && (
        <div className="mobile-wallet-warning">
          ⚠️ Connect wallet to view rewards
        </div>
      )}
    </div>
  );
};

export default RewardsMobile;
