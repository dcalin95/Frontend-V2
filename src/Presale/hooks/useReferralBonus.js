import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../contract/contracts";

/**
 * Hook pentru a extrage bonusul de referral din Node.sol
 */
const useReferralBonus = (walletAddress) => {
  const [bonus, setBonus] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferralBonus = async () => {
      if (!walletAddress) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // 🛑 READ-ONLY: use public RPC for reads
        const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed1.binance.org");
        const nodeContract = new ethers.Contract(
          CONTRACTS.NODE.address,
          CONTRACTS.NODE.abi,
          provider
        );

        const raw = await nodeContract.getUserRewardBalance(walletAddress);
        const parsed = parseFloat(ethers.utils.formatUnits(raw, 18));
        setBonus(parsed);
      } catch (err) {
        console.error("❌ Eroare la useReferralBonus:", err);
        setBonus(0);
      } finally {
        setLoading(false);
      }
    };

    fetchReferralBonus();
  }, [walletAddress]);

  return { bonus, loading };
};

export default useReferralBonus;
