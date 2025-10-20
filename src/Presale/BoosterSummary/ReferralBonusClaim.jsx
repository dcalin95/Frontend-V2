import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { CONTRACTS } from "../../contract/contracts";

const ReferralBonusClaim = ({ onClaimed }) => {
  const [loading, setLoading] = useState(false);
  const [bonusAmount, setBonusAmount] = useState(null);

  useEffect(() => {
    const fetchReferralBonus = async () => {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const userAddress = await signer.getAddress();

        const contract = new ethers.Contract(
          CONTRACTS.NODE.address,
          CONTRACTS.NODE.abi,
          provider
        );

        const bitsAddress = await contract.bitsToken();
        const bitsContract = new ethers.Contract(
          bitsAddress,
          ["function balanceOf(address) view returns (uint256)"],
          provider
        );

        const balance = await bitsContract.balanceOf(userAddress);
        setBonusAmount(parseFloat(ethers.utils.formatUnits(balance, 18)));
      } catch (err) {
        console.error("❌ Failed to fetch referral bonus:", err);
        setBonusAmount(0);
      }
    };

    fetchReferralBonus();
  }, []);

  const handleClaim = async () => {
    if (!window.ethereum) return toast.error("Please connect your wallet.");

    if (!bonusAmount || bonusAmount <= 0) {
      return toast.info("ℹ️ Nu ai nimic de revendicat momentan.");
    }

    setLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACTS.NODE.address,
        CONTRACTS.NODE.abi,
        signer
      );

      const tx = await contract.claimReward();
      await tx.wait();

      toast.success("🎉 Bonusul de referal a fost revendicat cu succes!");
      if (onClaimed) onClaimed();
    } catch (err) {
      console.error("❌ Claim failed:", err);
      toast.error("❌ Revendicarea a eșuat: " + (err.reason || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "6px" }}>
      <button
        disabled={loading}
        onClick={handleClaim}
        style={{
          padding: "6px 14px",
          backgroundColor: "#00ffaa",
          color: "#000",
          fontWeight: "bold",
          border: "none",
          borderRadius: "6px",
          fontSize: "0.9rem",
          cursor: "pointer",
        }}
      >
        {loading ? "Claiming..." : "Claim Bonus"}
      </button>
    </div>
  );
};

export default ReferralBonusClaim;
