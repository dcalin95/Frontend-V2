import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../../contract/contracts";

const BONUS_TIERS = [
  { threshold: 250, rate: 5 },
  { threshold: 500, rate: 7 },
  { threshold: 1000, rate: 10 },
  { threshold: 2500, rate: 15 },
];

const useAdditionalBonus = (walletAddress) => {
  const [loading, setLoading] = useState(false);
  const [investmentHistory, setInvestmentHistory] = useState([]);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalEstimatedBonus, setTotalEstimatedBonus] = useState(0);
  const [claimableBonus, setClaimableBonus] = useState(0);
  const [claimedBonus, setClaimedBonus] = useState(0);
  const [tier, setTier] = useState(null);
  const [nextTier, setNextTier] = useState(null);
  const [canClaim, setCanClaim] = useState(false);

  useEffect(() => {
    if (!walletAddress || !window.ethereum) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const rewardContract = new ethers.Contract(
          CONTRACTS.ADDITIONAL_REWARD.address,
          CONTRACTS.ADDITIONAL_REWARD.abi,
          provider
        );

        const rawHistory = await rewardContract.getInvestmentHistory(walletAddress);

        let totalInvestedUSD = 0;
        let totalBonus = 0;
        let claimed = 0;
        let unclaimed = 0;

        const parsed = rawHistory.map((inv) => {
          const amount = parseFloat(ethers.utils.formatUnits(inv.amount, 18));
          const rate = Number(inv.rate);
          const bonus = (amount * rate) / 100;
          const claimedStatus = inv.claimed;

          totalInvestedUSD += amount;
          totalBonus += bonus;
          if (claimedStatus) claimed += bonus;
          else unclaimed += bonus;

          return {
            amount,
            rate,
            bonus,
            claimed: claimedStatus,
            timestamp: Number(inv.timestamp),
          };
        });

        const currentTier = BONUS_TIERS.slice().reverse().find(t => totalInvestedUSD >= t.threshold) || null;
        const next = BONUS_TIERS.find(t => totalInvestedUSD < t.threshold);
        const nextTierData = next
          ? { ...next, remaining: next.threshold - totalInvestedUSD }
          : null;

        setInvestmentHistory(parsed);
        setTotalInvested(totalInvestedUSD);
        setTotalEstimatedBonus(totalBonus);
        setClaimableBonus(unclaimed);
        setClaimedBonus(claimed);
        setTier(currentTier);
        setNextTier(nextTierData);
        setCanClaim(unclaimed > 0);
      } catch (err) {
        console.error("❌ useAdditionalBonus error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [walletAddress]);

  return {
    loading,
    investmentHistory,
    totalInvested,
    totalEstimatedBonus,
    claimableBonus,
    claimedBonus,
    tier,
    nextTier,
    canClaim,
  };
};

export default useAdditionalBonus;
