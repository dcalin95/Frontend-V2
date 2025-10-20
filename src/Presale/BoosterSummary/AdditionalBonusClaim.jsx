import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../../contract/contracts";
import { toast } from "react-toastify";

/**
 * 🛠 Helper to format BITS with 4 decimals
 */
const formatBITS = (value) => {
  try {
    const num = typeof value === "string" ? parseFloat(value) : Number(value);
    return isNaN(num) ? "0.0000 $BITS" : `${num.toFixed(4)} $BITS`;
  } catch (err) {
    console.warn("Error formatting BITS:", err.message);
    return "0.0000 $BITS";
  }
};

const AdditionalBonusClaim = ({ onClaimed }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [rewardAmount, setRewardAmount] = useState(0);
  const [error, setError] = useState(null);

  /**
   * 🔥 Fetch Claimable Reward
   */
  const fetchReward = async () => {
    console.group("🚀 Fetching Claimable Reward");
    setError(null);

    try {
      if (!window.ethereum) {
        console.warn("⚠️ MetaMask is not connected.");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      console.log("📦 Fetching for address:", address);

      const contract = new ethers.Contract(
        CONTRACTS.ADDITIONAL_REWARD.address,
        CONTRACTS.ADDITIONAL_REWARD.abi,
        signer
      );

      console.log("Contract Address:", contract.address);

      const raw = await contract.getAvailableReward(address);
      console.log("🎯 Raw Reward (wei):", raw.toString());

      const formatted = parseFloat(ethers.utils.formatUnits(raw, 18));
      console.log("🎯 Formatted Reward (BITS):", formatted);

      setRewardAmount(formatted);

    } catch (err) {
      console.error("❌ Error fetching reward:", err.message);
      setError("Failed to load claimable reward.");
      toast.error("❌ Error: " + err.message);
    }

    console.groupEnd();
  };

  /**
   * 🌟 Claim Reward Function
   */
  const handleClaim = async () => {
    console.group("🚀 Claiming Reward");
    setLoading(true);
    setStatus("Claiming...");

    try {
      if (!window.ethereum) {
        toast.warn("Please connect to MetaMask.");
        console.warn("⚠️ MetaMask not detected.");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = provider.getSigner();

      const contract = new ethers.Contract(
        CONTRACTS.ADDITIONAL_REWARD.address,
        CONTRACTS.ADDITIONAL_REWARD.abi,
        signer
      );

      console.log("Contract Address for Claim:", contract.address);
      console.log("Attempting to claim:", rewardAmount, "BITS");

      const tx = await contract.claimReward();
      console.log("⏳ Transaction sent:", tx.hash);

      setStatus("Waiting for confirmation...");
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed:", receipt.transactionHash);

      toast.success(`🎉 Successfully claimed ${formatBITS(rewardAmount)}!`);
      setRewardAmount(0);
      setStatus("✅ Claimed successfully!");

      if (onClaimed) onClaimed();

    } catch (err) {
      console.error("❌ Claim failed:", err.message);
      toast.error("❌ Claim failed: " + err.message);
      setStatus(`❌ Claim failed: ${err.message}`);
      setError(err.message);

    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  /**
   * 🌐 Fetch Data on Component Mount or Update
   */
  useEffect(() => {
    console.log("🔄 Fetching reward data on mount or claim...");
    fetchReward();
  }, [onClaimed]);

  /**
   * 🛠 Conditional Rendering
   */
  if (rewardAmount <= 0) {
    console.log("ℹ️ No reward available to claim.");
    return null;
  }

  return (
    <div style={{ marginTop: 8, padding: "10px", backgroundColor: "#333", borderRadius: "8px" }}>
      <div style={{ fontSize: 14, marginBottom: 6, color: "#00ff99" }}>
        🎁 Claimable Bonus: <strong>{formatBITS(rewardAmount)}</strong>
      </div>

      <button
        disabled={loading}
        onClick={handleClaim}
        style={{
          padding: "8px 16px",
          fontSize: "1rem",
          backgroundColor: "#00ff99",
          color: "#000",
          border: "none",
          borderRadius: 6,
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: "bold",
        }}
      >
        {loading ? "Claiming..." : "Claim Bonus"}
      </button>

      {status && (
        <div style={{ fontSize: 12, marginTop: 6, color: "#ccc" }}>{status}</div>
      )}

      {error && (
        <div style={{ fontSize: 12, marginTop: 6, color: "#ff4040" }}>{error}</div>
      )}
    </div>
  );
};

export default AdditionalBonusClaim;
