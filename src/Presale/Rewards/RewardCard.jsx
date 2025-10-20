import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

const RewardCard = ({ provider, userAddress, contractInfo, label }) => {
  const [rewardAmount, setRewardAmount] = useState(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReward = async () => {
      setIsLoading(true);
      try {
        if (!provider || !userAddress) {
          setRewardAmount(null);
          return;
        }

        const contract = new ethers.Contract(
          contractInfo.address,
          contractInfo.abi,
          provider
        );
        const rawReward = await contract.getAvailableReward(userAddress);
        const formatted = parseFloat(ethers.utils.formatEther(rawReward));
        setRewardAmount(formatted);
      } catch (error) {
        console.error(`❌ Error fetching ${label} reward:`, error);
        setRewardAmount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReward();
  }, [provider, userAddress, contractInfo]);

  const handleClaim = async () => {
    if (!provider) return alert("🔌 Te rugăm să îți conectezi wallet-ul.");
    setIsClaiming(true);

    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        contractInfo.address,
        contractInfo.abi,
        signer
      );
      const tx = await contract.claimReward();
      await tx.wait();
      alert(`✅ ${label} reward claimed!`);
    } catch (error) {
      console.error("❌ Claim error:", error);
      alert(`Eroare la revendicare: ${error.message}`);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="reward-card">
      <h3>{label}</h3>
      {isLoading ? (
        <p>🔄 Loading...</p>
      ) : rewardAmount !== null ? (
        <>
          <p>
            <strong>Available:</strong> {rewardAmount.toFixed(4)} BITS
          </p>
          <button
            onClick={handleClaim}
            disabled={isClaiming || rewardAmount <= 0}
          >
            {isClaiming ? "Claiming..." : "🎁 Claim"}
          </button>
        </>
      ) : (
        <p>🔌 Wallet not connected</p>
      )}
    </div>
  );
};

export default RewardCard;
