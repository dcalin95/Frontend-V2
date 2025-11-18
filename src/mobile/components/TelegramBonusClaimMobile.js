import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACTS } from '../../contract/contracts';
import Icon from '../../assets/icons/Icon';
import '../Mobile.css';

const TelegramBonusClaimMobile = ({ onClaimed }) => {
  const [reward, setReward] = useState(0);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const fetchReward = async () => {
    try {
      if (!window.ethereum || !CONTRACTS.TELEGRAM_REWARD) {
        setReward(0);
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      
      if (network.chainId !== 56 && network.chainId !== 1) {
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
      console.error("Failed to fetch telegram reward:", err);
      setReward(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchReward();
  }, [onClaimed]);

  const handleClaim = async () => {
    if (reward <= 0) {
      alert("Nothing to claim yet");
      return;
    }

    setClaiming(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const contract = new ethers.Contract(
        CONTRACTS.TELEGRAM_REWARD.address,
        CONTRACTS.TELEGRAM_REWARD.abi,
        signer
      );

      const tx = await contract.claimTelegramReward(
        ethers.utils.parseUnits(reward.toString(), 18)
      );

      await tx.wait();
      alert("🎉 Telegram reward claimed!");
      setReward(0);
      if (onClaimed) onClaimed();
    } catch (err) {
      console.error("Claim failed:", err);
      alert("❌ Claim failed: " + (err.reason || err.message));
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="mobile-telegram-bonus">
      <div className="mobile-telegram-header">
        <Icon name="telegram" size="large" animate="float" />
        <h3>Telegram Bonus</h3>
      </div>

      {loading ? (
        <div className="mobile-telegram-loading">
          <Icon name="loading" size="medium" animate="spin" />
          <p>Checking rewards...</p>
        </div>
      ) : (
        <>
          <div className="mobile-telegram-reward-display">
            <div className="mobile-telegram-reward-label">Available Reward</div>
            <div className="mobile-telegram-reward-value">
              {reward.toFixed(2)} $BITS
            </div>
          </div>

          {reward > 0 ? (
            <button 
              onClick={handleClaim}
              disabled={claiming}
              className="mobile-telegram-claim-btn"
            >
              {claiming ? (
                <>
                  <Icon name="loading" size="small" animate="spin" />
                  <span>Claiming...</span>
                </>
              ) : (
                <>
                  <Icon name="gift" size="small" />
                  <span>Claim Reward</span>
                </>
              )}
            </button>
          ) : (
            <div className="mobile-telegram-no-reward">
              <Icon name="info" size="small" />
              <p>No rewards available yet</p>
            </div>
          )}

          <a 
            href="https://t.me/BitSwapDEX_AI" 
            target="_blank" 
            rel="noreferrer"
            className="mobile-telegram-join-link"
          >
            <Icon name="telegram" size="small" />
            <span>Join Telegram</span>
            <Icon name="external-link" size="small" />
          </a>
        </>
      )}
    </div>
  );
};

export default TelegramBonusClaimMobile;

