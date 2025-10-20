import React from "react";
import styles from "../BoosterSummary.module.css";
import { formatUSDClaude, formatBITSClaude, shortenAddressClaude } from "../utils/claudeFormatters";

const PortfolioMetrics = ({ safeData, walletAddress, pulseEffect }) => {
  const shorten = (addr) => shortenAddressClaude(addr, 6, 4);
  
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

  const totalInvestedUSDCalculated = safeData.realInvestedUSD !== undefined
    ? safeData.realInvestedUSD
    : safeData.totalBits && safeData.currentPrice
    ? safeData.totalBits * safeData.currentPrice
    : 0;

  return (
    <>
      {/* Wallet Address */}
      <div className={`${styles.aiRow} ${styles.claudeUniform}`}>
        <div className={styles.aiLabel}>
          <span className={styles.aiLabelIcon}>🔗</span>
          Neural Wallet ID
        </div>
        <div className={styles.aiValue}>
          <a
            href={`https://bscscan.com/address/${walletAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.aiWalletLink} ${styles.claudeLink}`}
          >
            {shorten(walletAddress)}
            <span className={styles.aiLinkArrow}>→</span>
          </a>
        </div>
      </div>

      {/* Total Invested */}
      <div className={`${styles.aiRow} ${styles.claudeUniform}`}>
        <div className={styles.aiLabel}>
          <span className={styles.aiLabelIcon}>💵</span>
          Total Invested (USD)
        </div>
        <div className={`${styles.aiValue} ${styles.aiValueHighlight}`}>
          {formatUSDWithAnimation(totalInvestedUSDCalculated, true)}
        </div>
      </div>

      {/* Solana Investments */}
      <div className={`${styles.aiRow} ${styles.claudeUniform}`}>
        <div className={styles.aiLabel}>
          <span className={styles.aiLabelIcon}>⚡</span>
          Solana Investments
        </div>
        <div className={styles.aiValue}>
          {safeData.investedUSDOnSolana > 0 ? 
            formatUSDWithAnimation(safeData.investedUSDOnSolana) : 
            <span className={styles.claudeNoData}>No SOL activity detected</span>
          }
        </div>
      </div>

      {/* BITS Holdings */}
      <div className={`${styles.aiRow} ${styles.claudeUniform}`}>
        <div className={styles.aiLabel}>
          <span className={styles.aiLabelIcon}>💠</span>
          Total BITS Holdings
          {safeData.totalBits > 0 && <span className={styles.claudeConnected}> ✓</span>}
        </div>
        <div className={`${styles.aiValue} ${styles.aiValueBits}`}>
          {safeData.totalBits > 0 ? 
            formatBITSWithAnimation(safeData.totalBits) :
            <span className={styles.claudeNoData}>Contract connecting...</span>
          }
        </div>
      </div>
    </>
  );
};

export default PortfolioMetrics;



