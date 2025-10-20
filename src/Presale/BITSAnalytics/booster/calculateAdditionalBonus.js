import { ethers } from "ethers";
import { getContractInstance } from "../../../contract/getContractInstance";

const BONUS_TIERS = [
  { threshold: 2500, rate: 15 },
  { threshold: 1000, rate: 10 },
  { threshold: 500, rate: 7 },
  { threshold: 250, rate: 5 },
];

const calculateAdditionalBonus = async (walletAddress) => {
  console.group("🎯 [calculateAdditionalBonus] Using AdditionalReward Contract");

  if (!walletAddress || !window.ethereum) {
    console.warn("⚠️ Wallet not connected or window.ethereum not available");
    console.groupEnd();
    return {
      reward: 0,
      estimatedBonus: 0,
      usdInvested: 0,
      tier: "0%",
    };
  }

  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = await getContractInstance("ADDITIONAL_REWARD", provider);

    const [rawReward, rawInvested] = await Promise.all([
      contract.calculateClaimableReward(walletAddress),
      contract.getTotalInvestment(walletAddress),
    ]);

    const reward = parseFloat(ethers.utils.formatUnits(rawReward, 18));
    const usdInvested = parseFloat(ethers.utils.formatUnits(rawInvested, 18));

    // Determină tier-ul curent
    let tier = "0%";
    let rate = 0;
    for (const t of BONUS_TIERS) {
      if (usdInvested >= t.threshold) {
        tier = `${t.rate}%`;
        rate = t.rate;
        break;
      }
    }

    const estimatedBonus = parseFloat(((usdInvested * rate) / 100).toFixed(6));

    // DEBUG
    console.log("🎁 Claimable Reward:", reward);
    console.log("💵 Invested USD:", usdInvested);
    console.log("🏆 Tier:", tier);
    console.log("🧠 Estimated Bonus:", estimatedBonus);

    console.groupEnd();

    return {
      reward,
      estimatedBonus,
      usdInvested,
      tier,
    };

  } catch (err) {
    console.error("❌ Error in calculateAdditionalBonus:", err);
    console.groupEnd();
    return {
      reward: 0,
      estimatedBonus: 0,
      usdInvested: 0,
      tier: "0%",
    };
  }
};

export default calculateAdditionalBonus;
