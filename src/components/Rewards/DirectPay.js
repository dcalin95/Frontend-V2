import React, { useState } from "react";
import axios from "axios";
import "./DirectPay.css";

const DirectPay = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("deposit");
  const [status, setStatus] = useState("success");
  const [message, setMessage] = useState("");

  const handleSaveTransaction = async () => {
    if (!walletAddress || !amount || isNaN(amount)) {
      setMessage("⚠️ Please provide a valid wallet address and amount.");
      return;
    }

    try {
      // Convert the amount to a decimal format with up to 18 decimals
      const formattedAmount = parseFloat(amount).toFixed(18);

      await axios.post("http://localhost:4000/api/transactions", {
        wallet_address: walletAddress,
        amount: formattedAmount,
        type,
        status,
      });

      setMessage("✅ Transaction saved successfully!");
    } catch (error) {
      console.error("❌ Error saving transaction:", error.message);
      setMessage(`❌ Error saving transaction: ${error.message}`);
    }
  };

  return (
    <div className="direct-pay-container">
      <h3 className="direct-pay-title">DirectPay</h3>
      <input
        type="text"
        placeholder="Wallet Address"
        value={walletAddress}
        onChange={(e) => setWalletAddress(e.target.value)}
        className="direct-pay-input"
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="direct-pay-input"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="direct-pay-select"
      >
        <option value="deposit">Deposit</option>
        <option value="withdraw">Withdraw</option>
      </select>
      <button onClick={handleSaveTransaction} className="direct-pay-button">
        Save Transaction
      </button>
      {message && <p className={message.startsWith("✅") ? "success-message" : "error-message"}>{message}</p>}
    </div>
  );
};

export default DirectPay;

