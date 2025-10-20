// src/Presale/Rewards/TelegramRewardSection.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import './rewards.css';


const TelegramRewardSection = ({ walletAddress }) => {
  const [telegramReward, setTelegramReward] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    const fetchTelegramReward = async () => {
      if (!walletAddress) return;
      setLoading(true);
      try {
        const { data } = await axios.get(`/api/telegram-rewards/reward/${walletAddress}`);
        setTelegramReward(data.reward);
      } catch {
        setTelegramReward(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTelegramReward();
  }, [walletAddress]);

  const handleCopy = async (text, label = "Value") => {
    try {
      await navigator.clipboard.writeText(text);
      setStatusMsg(`✅ ${label} copied to clipboard!`);
    } catch {
      setStatusMsg(`❌ Failed to copy ${label}.`);
    }
  };

  return (
    <div className="telegram-reward-section">
      <h4>💬 Telegram Reward</h4>

      {!walletAddress ? (
        <p>🔌 Connect your wallet to see your Telegram reward.</p>
      ) : loading ? (
        <p>⏳ Loading Telegram reward...</p>
      ) : telegramReward !== null ? (
        <>
          <p>
            🎁 <strong>{telegramReward}</strong> BITS earned
            <button
              className="mini-copy-btn"
              onClick={() => handleCopy(telegramReward.toString(), "Reward amount")}
              style={{ marginLeft: "8px" }}
            >
              📋 Copy
            </button>
          </p>
          <p>
            👜 Wallet: <code>{walletAddress}</code>
            <button
              className="mini-copy-btn"
              onClick={() => handleCopy(walletAddress, "Wallet")}
              style={{ marginLeft: "8px" }}
            >
              📋 Copy
            </button>
          </p>
        </>
      ) : (
        <p>📭 No Telegram reward found.</p>
      )}

      {statusMsg && (
        <p style={{ color: "#00ffaa", marginTop: "10px" }}>{statusMsg}</p>
      )}
    </div>
  );
};

export default TelegramRewardSection;
