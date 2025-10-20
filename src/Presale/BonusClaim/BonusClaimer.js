// src/components/BonusClaimer.js
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACTS } from "../contract/contracts";

const BonusClaimer = () => {
  const [wallet, setWallet] = useState(null);
  const [bonus, setBonus] = useState("0.00");
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState("");

  const fetchBonus = async (address) => {
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        CONTRACTS.ADDITIONAL_REWARD.address,
        CONTRACTS.ADDITIONAL_REWARD.abi,
        provider
      );

      const raw = await contract.getAvailableReward(address);
      const formatted = ethers.utils.formatUnits(raw, 18);
      setBonus(formatted);
    } catch (err) {
      console.error("❌ Error fetching bonus:", err.message);
      setMessage("Failed to fetch bonus");
    } finally {
      setLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) return alert("Please install MetaMask");

      const [account] = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWallet(account);
      await fetchBonus(account);
    } catch (err) {
      console.error("❌ Wallet error:", err.message);
    }
  };

  const claimBonus = async () => {
    if (!wallet) return alert("Wallet not connected");

    try {
      setClaiming(true);
      setMessage("");

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACTS.ADDITIONAL_REWARD.address,
        CONTRACTS.ADDITIONAL_REWARD.abi,
        signer
      );

      const tx = await contract.claimReward();
      setMessage(`⏳ Transaction sent: ${tx.hash}`);
      await tx.wait();
      setMessage("✅ Bonus claimed!");

      await fetchBonus(wallet);
    } catch (err) {
      console.error("❌ Claim error:", err.message);
      setMessage("❌ Claim failed: " + err.message);
    } finally {
      setClaiming(false);
    }
  };

  useEffect(() => {
    if (wallet) fetchBonus(wallet);
  }, [wallet]);

  return (
    <div style={{
      padding: "20px",
      background: "#0f172a",
      color: "#fff",
      borderRadius: "10px",
      border: "1px solid #00ffff44",
      boxShadow: "0 0 12px #00ffff22",
      maxWidth: "400px",
      margin: "20px auto",
      fontFamily: "Arial"
    }}>
      <h3>🎁 Claim Bonus BITS</h3>
      {!wallet ? (
        <button onClick={connectWallet}>🔗 Connect Wallet</button>
      ) : (
        <>
          <p><strong>Wallet:</strong> {wallet}</p>
          <p><strong>Available Bonus:</strong> {parseFloat(bonus).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })} $BITS</p>
          <button
            onClick={claimBonus}
            disabled={claiming || parseFloat(bonus) <= 0}
            style={{
              marginTop: "10px",
              padding: "8px 16px",
              background: "#00ffff",
              color: "#000",
              fontWeight: "bold",
              borderRadius: "8px",
              border: "none",
              cursor: claiming ? "not-allowed" : "pointer"
            }}
          >
            {claiming ? "Claiming..." : "Claim Now"}
          </button>
          {message && <p style={{ marginTop: "10px", fontSize: "0.9rem" }}>{message}</p>}
        </>
      )}
    </div>
  );
};

export default BonusClaimer;
