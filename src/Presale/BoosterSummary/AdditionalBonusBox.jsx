import React, { useEffect, useState, useContext } from "react";
import { toast } from "react-toastify";
import { ethers } from "ethers";
import WalletContext from "../../context/WalletContext";
import { getContract as getNodeContract } from "../../contract/Node";
import styles from "./BoosterSummary.module.css";

// 🔢 Format BITS
const formatBITS = (value) => {
  try {
    const num = typeof value === "string" ? parseFloat(value) : Number(value);
    return isNaN(num) ? "0.0000 $BITS" : `${num.toFixed(4)} $BITS`;
  } catch {
    return "0.0000 $BITS";
  }
};

// 💵 Format USD
const formatUSD = (value) => {
  try {
    return Number(value).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return "$0.00";
  }
};

const AdditionalBonusBox = ({ onClaimed }) => {
  const { walletAddress, signer } = useContext(WalletContext);

  const [reward, setReward] = useState(0);
  const [estimatedBonus, setEstimatedBonus] = useState(0);
  const [usdInvested, setUsdInvested] = useState(0);
  const [activeTier, setActiveTier] = useState("0%");
  const [loading, setLoading] = useState(false);

  const determineBonusTier = (usd) => {
    if (usd >= 2500) return 15;
    if (usd >= 1000) return 10;
    if (usd >= 500) return 7;
    if (usd >= 250) return 5;
    return 0;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const contract = getNodeContract(signer);

      const [rewardRaw, purchases] = await Promise.all([
        contract.getUserRewardBalance(walletAddress),
        contract.getUserPurchases(walletAddress),
      ]);

      if (!purchases || purchases.length === 0) {
        setReward(0);
        setEstimatedBonus(0);
        setUsdInvested(0);
        setActiveTier("0%");
        setLoading(false);
        return;
      }

      const totalUsdInvested = purchases.reduce((sum, p) => {
        return sum + Number(p.usdAmount || 0) / 1000;
      }, 0);

      const bitsEstimated = purchases.reduce((sum, p) => {
        return sum + Number(p.bitsAmount || 0) / 1e18;
      }, 0);

      const tierRate = determineBonusTier(totalUsdInvested);

      setReward(parseFloat(ethers.utils.formatUnits(rewardRaw, 18)));
      setEstimatedBonus(bitsEstimated);
      setUsdInvested(totalUsdInvested);
      setActiveTier(`${tierRate}%`);
    } catch (err) {
      console.error("❌ Error fetching Node data:", err.message);
      toast.error("Failed to fetch bonus data.");
      setReward(0);
      setEstimatedBonus(0);
      setUsdInvested(0);
      setActiveTier("0%");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (!walletAddress || !signer) return;

    const contract = getNodeContract(signer);

    const handleRewardDistributed = (user, amount) => {
      if (user.toLowerCase() === walletAddress.toLowerCase()) {
        toast.success(`🎉 You received ${ethers.utils.formatUnits(amount, 18)} $BITS`);
        fetchData();
      }
    };

    const handleBitsPurchased = (buyer, bitsAmount) => {
      if (buyer.toLowerCase() === walletAddress.toLowerCase()) {
        fetchData();
      }
    };

    contract.on("RewardDistributed", handleRewardDistributed);
    contract.on("BitsPurchased", handleBitsPurchased);

    return () => {
      contract.off("RewardDistributed", handleRewardDistributed);
      contract.off("BitsPurchased", handleBitsPurchased);
    };
  }, [walletAddress, signer, onClaimed]);

  const handleClaim = async () => {
    if (!walletAddress || !signer) return toast.error("Wallet not connected.");
    if (reward <= 0) return toast.info("No claimable reward.");
    setLoading(true);

    try {
      const contract = getNodeContract(signer);
      const tx = await contract.claimReward();
      await tx.wait();
      toast.success(`Claimed ${reward} $BITS successfully!`);
      setReward(0);
      setEstimatedBonus(0);
      if (onClaimed) onClaimed();
      fetchData();
    } catch (err) {
      toast.error(`Claim failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.row} style={{ padding: "12px" }}>
      <div className={styles.label} style={{ fontSize: "14px", marginBottom: "4px" }}>
        🎁 Additional Bonus
      </div>

      <div className={styles.value} style={{ fontSize: "13px", lineHeight: "1.4" }}>
        <div>Claimable: {loading ? "Loading..." : formatBITS(reward)}</div>
        <div>Estimated: {loading ? "Loading..." : formatBITS(estimatedBonus)}</div>
        <div>Invested: {loading ? "Loading..." : usdInvested === 0 ? "No investments yet" : formatUSD(usdInvested)}</div>
        <div>Tier: {loading ? "Loading..." : activeTier}</div>
      </div>

      <div style={{ marginTop: "8px" }}>
        <button
          onClick={handleClaim}
          disabled={loading}
          style={{
            padding: "4px 10px",
            fontSize: "12px",
            backgroundColor: "#00ffc3",
            border: "none",
            borderRadius: "5px",
            color: "#000",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Processing..." : "Claim Bonus"}
        </button>
      </div>
    </div>
  );
};

export default AdditionalBonusBox;
