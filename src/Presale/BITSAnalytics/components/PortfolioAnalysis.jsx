import React from "react";
import styles from "../BoosterSummary.module.css";
import { 
  formatUSDClaude, 
  formatBITSClaude, 
  formatPriceClaude, 
  formatROIClaude, 
  formatTransactionsClaude,
  formatTimestampClaude 
} from "../utils/claudeFormatters";

const PortfolioAnalysis = ({ safeData, walletAddress, pulseEffect }) => {
  const formatUSDWithAnimation = (value, isHighlight = false) => {
    const formattedValue = formatUSDClaude(value, isHighlight);
    return (
      <span className={`${styles.animatedValue} ${styles.claudeNeuralPulse} ${
        isHighlight ? styles.claudeHighlight : ''
      } ${pulseEffect ? styles.pulse : ''}`}>
        {formattedValue}
      </span>
    );
  };

  const formatBITSWithAnimation = (value) => {
    const formattedValue = formatBITSClaude(value, true);
    return (
      <span className={`${styles.animatedValue} ${styles.claudeNeuralPulse} ${pulseEffect ? styles.pulse : ''}`}>
        {formattedValue}
      </span>
    );
  };

  const totalBitsIncludingBonuses = 
    (safeData.totalBits || 0) +
    (safeData.referralBonus || 0) +
    (safeData.telegramBonus || 0) +
    (safeData.bonusCalculatedLocally || 0);

  const totalInvestmentValueUSD = 
    totalBitsIncludingBonuses * (safeData.currentPrice || 0);

  return (
    <>
      {/* Total Portfolio Value */}
      <div className={`${styles.aiRow} ${styles.claudeUniform} ${styles.claudePremium}`}>
        <div className={styles.aiLabel}>
          <span className={styles.aiLabelIcon}>💎</span>
          Total Portfolio Value
        </div>
        <div className={`${styles.aiValue} ${styles.aiValueTotal}`}>
          {formatBITSWithAnimation(totalBitsIncludingBonuses)}
        </div>
      </div>

      {/* Current Market Value */}
      <div className={`${styles.aiRow} ${styles.claudeUniform} ${styles.claudePremium}`}>
        <div className={styles.aiLabel}>
          <span className={styles.aiLabelIcon}>📈</span>
          Current Market Value
        </div>
        <div className={`${styles.aiValue} ${styles.aiValueHighlight}`}>
          {formatUSDWithAnimation(totalInvestmentValueUSD, true)}
        </div>
      </div>

      {/* Neural Interactions */}
      <div className={`${styles.aiRow} ${styles.claudeUniform}`}>
        <div className={styles.aiLabel}>
          <span className={styles.aiLabelIcon}>📊</span>
          Neural Interactions
        </div>
        <div className={`${styles.aiValue} ${styles.aiValueNumber} ${styles.claudeMetric}`}>
          {formatTransactionsClaude(safeData.txCount)}
        </div>
      </div>

      {/* Last Neural Update */}
      <div className={`${styles.aiRow} ${styles.claudeUniform} ${styles.claudeTimeline}`}>
        <div className={styles.aiLabel}>
          <span className={styles.aiLabelIcon}>🕰️</span>
          Last Neural Update
        </div>
        <div className={styles.aiValue}>
          {safeData.lastInvestmentDate ? (
            <>
              <div className={`${styles.aiLastInvestmentDate} ${styles.claudeTimestamp}`}>
                {formatTimestampClaude(safeData.lastInvestmentDate).formatted} •{" "}
                {formatUSDWithAnimation(safeData.lastInvestmentUSD)}
              </div>
              <a
                href={`https://bscscan.com/address/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.aiBscScanLink} ${styles.claudeLink}`}
              >
                Blockchain Explorer
                <span className={styles.aiLinkArrow}>→</span>
              </a>
              <div className={`${styles.aiLastInvestmentTime} ${styles.claudeTime}`}>
                {formatTimestampClaude(safeData.lastInvestmentDate).relative} • {formatTimestampClaude(safeData.lastInvestmentDate).time}
              </div>
            </>
          ) : (
            <span className={styles.claudeNoData}>No recent activity detected</span>
          )}
        </div>
      </div>

      {/* Average Entry Point */}
      <div className={`${styles.aiRow} ${styles.claudeUniform}`}>
        <div className={styles.aiLabel}>
          <span className={styles.aiLabelIcon}>📉</span>
          Average Entry Point
        </div>
        <div className={styles.aiValue}>
          {formatPriceClaude(safeData.lastPrice)}
        </div>
      </div>

      {/* Live Market Price */}
      <div className={`${styles.aiRow} ${styles.claudeUniform}`}>
        <div className={styles.aiLabel}>
          <span className={styles.aiLabelIcon}>🔥</span>
          Live Market Price
          {safeData.currentPrice > 0 && <span className={styles.claudeConnected}> ✓</span>}
        </div>
        <div className={styles.aiValue}>
          {safeData.currentPrice > 0 ? 
            formatPriceClaude(safeData.currentPrice) :
            <span className={styles.claudeNoData}>CellManager connecting...</span>
          }
        </div>
      </div>

      {/* Neural Performance ROI */}
      <div className={`${styles.aiRow} ${styles.claudeUniform} ${styles.claudePremium}`}>
        <div className={styles.aiLabel}>
          <span className={styles.aiLabelIcon}>🧠</span>
          Neural Performance
        </div>
        <div
          className={`${styles.aiValue} ${styles.aiValueROI} ${styles.claudeROI} ${
            safeData.roiPercent >= 0 ? styles.aiPositive : styles.aiNegative
          }`}
        >
          {(() => {
            const roiData = formatROIClaude(safeData.roiPercent);
            return (
              <>
                <span className={`${styles.aiROIArrow} ${
                  roiData.isPositive ? styles.aiArrowPositive : styles.aiArrowNegative
                }`}>
                  {roiData.arrow}
                </span>
                {roiData.raw.toFixed(2)}%
              </>
            );
          })()}
        </div>
      </div>
    </>
  );
};

export default PortfolioAnalysis;



