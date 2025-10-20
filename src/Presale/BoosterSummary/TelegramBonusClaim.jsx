import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { CONTRACTS } from "../../contract/contracts";

const TelegramBonusClaim = ({ onClaimed }) => {
  const [reward, setReward] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchReward = async () => {
    try {
      // 🌟 Only fetch Telegram reward on BSC/ETH chains
      if (!window.ethereum || !CONTRACTS.TELEGRAM_REWARD) {
        console.log("⚠️ Telegram rewards only available on BSC/ETH chains");
        setReward(0);
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      
      // Only fetch on Binance Smart Chain (56) or Ethereum (1)
      if (network.chainId !== 56 && network.chainId !== 1) {
        console.log("⚠️ Telegram rewards not available on chain:", network.chainId);
        setReward(0);
        return;
      }

      const signer = provider.getSigner();
      const address = await signer.getAddress();

      const contract = new ethers.Contract(
        CONTRACTS.TELEGRAM_REWARD.address,
        CONTRACTS.TELEGRAM_REWARD.abi,
        provider
      );

      const raw = await contract.getTelegramReward(address);
      const formatted = parseFloat(ethers.utils.formatUnits(raw, 18));
      setReward(formatted);
    } catch (err) {
      console.error("❌ Failed to fetch telegram reward:", err);
      // Don't show error toast for expected failures on different chains
      setReward(0);
    }
  };

  useEffect(() => {
    fetchReward();
  }, [onClaimed]);

  const handleClaim = async () => {
    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const contract = new ethers.Contract(
        CONTRACTS.TELEGRAM_REWARD.address,
        CONTRACTS.TELEGRAM_REWARD.abi,
        signer
      );

      if (reward <= 0) {
        toast.info("Nothing to claim yet.");
        setLoading(false);
        return;
      }

      const tx = await contract.claimTelegramReward(
        ethers.utils.parseUnits(reward.toString(), 18)
      );

      await tx.wait();
      toast.success("🎉 Telegram reward claimed!");
      setReward(0);
      if (onClaimed) onClaimed();
    } catch (err) {
      console.error("❌ Claim failed:", err);
      toast.error("❌ Claim failed: " + (err.reason || err.message));
    }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: "6px" }}>
      <button
        onClick={handleClaim}
        disabled={loading}
        style={{
          padding: "6px 12px",
          fontSize: "0.85rem",
          backgroundColor: "#00ffaa",
          border: "none",
          borderRadius: "6px",
          color: "#000",
          fontWeight: "bold",
          cursor: "pointer"
        }}
      >
        {loading ? "Claiming..." : "Claim Bonus"}
      </button>
    </div>
  );
};

export default TelegramBonusClaim;
