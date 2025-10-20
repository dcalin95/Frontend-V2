import React from "react";
import styles from "../BoosterSummary.module.css";
import { formatBITSClaude } from "../utils/claudeFormatters";
import ReferralBonusClaim from "../ReferralBonusClaim";
import TelegramBonusClaim from "../TelegramBonusClaim";

const PortfolioRewards = ({ safeData, pulseEffect }) => {
  const formatBITSWithAnimation = (value) => {
    const formattedValue = formatBITSClaude(value, true);
    return (
      <span className={`${styles.animatedValue} ${styles.claudeNeuralPulse} ${pulseEffect ? styles.pulse : ''}`}>
        {formattedValue}
      </span>
    );
  };

  return (
    <>
      {/* Neural Referral Rewards */}
      <div className={`${styles.aiRow} ${styles.claudeUniform}`}>
        <div className={styles.aiLabel}>
          <span className={styles.aiLabelIcon}>🎯</span>
          Neural Referral Rewards
        </div>
        <div className={`${styles.aiValue} ${styles.aiValueBonus}`}>
          {formatBITSWithAnimation(safeData.referralBonus)}
          <ReferralBonusClaim onClaimed={() => window.location.reload()} />
        </div>
      </div>

      {/* Communication Rewards */}
      <div className={`${styles.aiRow} ${styles.claudeUniform}`}>
        <div className={styles.aiLabel}>
          <span className={styles.aiLabelIcon}>📡</span>
          Communication Rewards
        </div>
        <div className={`${styles.aiValue} ${styles.aiValueBonus}`}>
          {formatBITSWithAnimation(safeData.telegramBonus)}
          <TelegramBonusClaim onClaimed={() => window.location.reload()} />
        </div>
      </div>
    </>
  );
};

export default PortfolioRewards;



