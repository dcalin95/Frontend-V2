import React from "react";
import { formatBITS } from "../utils/dataFormatters";

const RewardCards = ({ safeData, pulseEffect }) => {
  const formatBITSWithAnimation = (value) => {
    const formattedValue = formatBITS(value, true);
    return (
      <span style={{ 
        background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        fontWeight: "700",
        filter: "drop-shadow(0 0 15px rgba(59, 130, 246, 0.4))",
        textAlign: "center"
      }}>
        {formattedValue}
      </span>
    );
  };

  const ClaimButton = ({ onClaimed, loading, type, available = false }) => (
    <button
      className={`portfolio-claim-button ${available ? 'available' : ''}`}
      onClick={onClaimed}
      disabled={loading || !available}
    >
      {loading ? (
        <span style={{
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}>
          <div style={{
            width: "10px",
            height: "10px",
            border: "2px solid transparent",
            borderTop: "2px solid currentColor",
            borderRadius: "50%",
            animation: "portfolio-spin 1s linear infinite"
          }}></div>
          Processing...
        </span>
      ) : available ? "🎁 Claim Reward" : "⏳ Pending"}
    </button>
  );

  const RewardCard = ({ icon, label, value, onClaimed, loading, available, rewardType }) => (
    <div className={`portfolio-reward-card ${available ? 'available' : ''}`}>
      {/* Content */}
      <div className="portfolio-reward-content">
        <div className="portfolio-reward-info">
          <div className={`portfolio-reward-icon ${available ? 'available' : ''}`}>
            {icon}
          </div>
          <div>
            <div className="portfolio-reward-label">
              {label}
            </div>
          </div>
        </div>
        
        <div className="portfolio-reward-value-section">
          <div className="portfolio-reward-value">
            {value}
          </div>
          <ClaimButton 
            onClaimed={onClaimed} 
            loading={loading} 
            type={rewardType}
            available={available}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <RewardCard 
        icon="🎯"
        label="Referral Rewards"
        value={formatBITSWithAnimation(safeData.referralBonus)}
        onClaimed={() => window.location.reload()}
        loading={false}
        available={safeData.referralBonus > 0}
        rewardType="referral"
      />

      <RewardCard 
        icon="📡"
        label="Telegram Rewards"
        value={formatBITSWithAnimation(safeData.telegramBonus)}
        onClaimed={() => window.location.reload()}
        loading={false}
        available={safeData.telegramBonus > 0}
        rewardType="telegram"
      />
    </>
  );
};

export default RewardCards;