import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

const StakingMobile = ({ walletAddress }) => {
  const [stakingBalance, setStakingBalance] = useState(0);
  const [availableToStake, setAvailableToStake] = useState(0);
  const [stakeAmount, setStakeAmount] = useState("");
  const [isStaking, setIsStaking] = useState(false);

  useEffect(() => {
    if (walletAddress) {
      fetchStakingData();
    }
  }, [walletAddress]);

  const fetchStakingData = async () => {
    try {
      // Placeholder - replace with actual contract calls
      setStakingBalance(0);
      setAvailableToStake(0);
    } catch (error) {
      console.error("Error fetching staking data:", error);
    }
  };

  const handleStake = async () => {
    if (!walletAddress) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsStaking(true);

    try {
      // Placeholder - replace with actual staking logic
      toast.success("Staking successful!");
      setStakeAmount("");
      fetchStakingData();
    } catch (error) {
      console.error("Staking error:", error);
      toast.error(`Staking failed: ${error.message}`);
    } finally {
      setIsStaking(false);
    }
  };

  return (
    <div className="mobile-staking-box">
      <div className="mobile-staking-info">
        <div className="mobile-staking-stat">
          <span className="mobile-stat-label">Staked Balance</span>
          <span className="mobile-stat-value">
            {stakingBalance.toLocaleString()} $BITS
          </span>
        </div>
        <div className="mobile-staking-stat">
          <span className="mobile-stat-label">Available to Stake</span>
          <span className="mobile-stat-value">
            {availableToStake.toLocaleString()} $BITS
          </span>
        </div>
      </div>

      <div className="mobile-staking-actions">
        <input
          type="number"
          className="mobile-input"
          placeholder="Amount to stake"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          disabled={isStaking || !walletAddress}
        />
        <button
          className="mobile-stake-btn"
          onClick={handleStake}
          disabled={isStaking || !walletAddress || !stakeAmount}
        >
          {isStaking ? "Staking..." : "Stake $BITS"}
        </button>
      </div>

      {!walletAddress && (
        <div className="mobile-wallet-warning">
          ⚠️ Connect wallet to stake
        </div>
      )}
    </div>
  );
};

export default StakingMobile;
