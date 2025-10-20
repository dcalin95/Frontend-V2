import React, { useState } from "react";
import { ethers } from "ethers";
import axios from "axios";

const SaveTransaction = ({ walletAddress }) => {
  const [loading, setLoading] = useState(false);

  const handleTransaction = async () => {
    if (!window.ethereum || !walletAddress) {
      console.error("❌ Ethereum wallet not found or walletAddress missing!");
      return;
    }

    try {
      setLoading(true);
      console.log("⏳ Starting transaction...");

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      console.log("📤 Sending transaction...");
      const transaction = await signer.sendTransaction({
        to: "0xRecipientWalletAddress", // Replace with recipient address
        value: ethers.utils.parseEther("0.01"), // Replace with desired value
      });

      console.log("✅ Transaction sent:", transaction);

      console.log("⏳ Waiting for confirmation...");
      const receipt = await transaction.wait();
      console.log("✅ Transaction confirmed:", receipt);

      console.log("📤 Sending transaction data to backend...");
      await axios.post("http://localhost:4000/api/transactions", {
        wallet_address: walletAddress,
        amount: ethers.utils.formatEther(transaction.value),
        type: "transfer",
        status: "success",
      });

      console.log("✅ Transaction saved successfully in backend.");
    } catch (error) {
      console.error("❌ Error during transaction:", error.message);

      console.log("📤 Sending error details to backend...");
      await axios.post("http://localhost:4000/api/transactions", {
        wallet_address: walletAddress,
        amount: 0,
        type: "transfer",
        status: "failed",
        error_message: error.message,
      });

      console.error("❌ Transaction failed and error logged.");
    } finally {
      setLoading(false);
      console.log("⏹️ Transaction process complete.");
    }
  };

  return (
    <div>
      <button onClick={handleTransaction} disabled={loading}>
        {loading ? "Processing..." : "Start Transaction"}
      </button>
    </div>
  );
};

export default SaveTransaction;

