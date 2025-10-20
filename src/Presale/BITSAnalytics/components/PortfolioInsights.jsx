import React from "react";
import styles from "../BoosterSummary.module.css";
import { formatROIClaude, formatTransactionsClaude } from "../utils/claudeFormatters";

const PortfolioInsights = ({ safeData }) => {
  return (
    <div className={`${styles.aiInsightsFooter} ${styles.claudeInsights}`}>
      <div className={`${styles.aiInsightIcon} ${styles.claudeInsightIcon}`}>🧠</div>
      <div className={`${styles.aiInsightText} ${styles.claudeInsightText}`}>
        <strong>Claude 4 Sonnet Analysis:</strong> {(() => {
          const roiData = formatROIClaude(safeData.roiPercent);
          const txFormatted = formatTransactionsClaude(safeData.txCount);
          return `Your neural portfolio shows ${roiData.analysis.toLowerCase()} across ${txFormatted}. ${roiData.isPositive ? 'Excellent strategic positioning!' : 'Temporary market dynamics - maintain long-term vision.'}`;
        })()}
      </div>
      <div className={styles.claudeConfidence}>
        <div className={styles.claudeConfidenceBar}>
          <div 
            className={styles.claudeConfidenceFill} 
            style={{width: `${Math.min(Math.abs(safeData.roiPercent || 0) + 60, 100)}%`}}
          ></div>
        </div>
        <span className={styles.claudeConfidenceText}>
          Confidence: {formatROIClaude(safeData.roiPercent).confidence}
        </span>
      </div>
    </div>
  );
};

export default PortfolioInsights;



