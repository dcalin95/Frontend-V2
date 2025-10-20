import React from "react";
import styles from "../BoosterSummary.module.css";

const PortfolioHeader = ({ pulseEffect, isVisible }) => {
  return (
    <div className={`${styles.aiHeader} ${isVisible ? styles.visible : ''}`}>
      <div className={`${styles.aiIcon} ${styles.claudeIcon}`}>📊</div>
      <h3 className={`${styles.aiTitle} ${styles.claudeTitle}`}>
        <span className={styles.claudeGradient}>Portfolio Dashboard</span>
        <span className={styles.claudeSubtitle}>Investment Analytics</span>
      </h3>
      <div className={`${styles.aiSubtitle} ${styles.claudeTagline}`}>
        Real-time investment tracking and performance metrics
      </div>
      <div className={styles.claudeStatus}>
        <div className={`${styles.claudeStatusDot} ${pulseEffect ? styles.active : ''}`}></div>
        <span>Live Data: Connected</span>
      </div>
    </div>
  );
};

export default PortfolioHeader;
