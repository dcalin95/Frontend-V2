import React, { useEffect, useState } from "react";
import styles from "./PresaleStatsCard.module.css";

// 💡 Full number formatter (no K/M abbreviations)
const formatCompactNumber = (value) => {
  return Math.floor(value).toLocaleString();
};

// AnimatedNumber
const AnimatedNumber = ({ value, duration = 800, prefix = "", suffix = "", compact = false }) => {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const animatedValue = value * progress;
      setDisplayed(animatedValue);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  const formatted = compact
    ? formatCompactNumber(displayed)
    : parseFloat(displayed).toLocaleString(undefined, {
        maximumFractionDigits: 4,
        minimumFractionDigits: 0,
      });

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

// SVGs
const TokenIcon = () => (
  <svg className={styles.icon} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="#00f0ff" strokeWidth="2" />
    <text x="12" y="16" textAnchor="middle" fill="#00f0ff" fontSize="10" fontFamily="monospace">🪙</text>
  </svg>
);
const SoldIcon = () => (
  <svg className={styles.icon} viewBox="0 0 24 24" fill="none">
    <path d="M4 12h16M12 4v16" stroke="#00ff99" strokeWidth="2" />
  </svg>
);
const PriceIcon = () => (
  <svg className={styles.icon} viewBox="0 0 24 24" fill="none">
    <path d="M6 18L18 6" stroke="#ffaa00" strokeWidth="2" />
    <circle cx="18" cy="6" r="2" fill="#ffaa00" />
  </svg>
);

// Main component
const PresaleStatsCard = ({ sold, supply, price }) => {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Presale Stats</h3>

      <div className={`${styles.statLine} ${styles.delay1}`}>
        <div className={styles.labelGroup}>
          <TokenIcon />
          <span>Total Supply:&nbsp;</span>
        </div>
        <span className={styles.value}>
          <AnimatedNumber value={supply} suffix=" $BITS" compact />
        </span>
      </div>

      <div className={`${styles.statLine} ${styles.delay2}`}>
        <div className={styles.labelGroup}>
          <SoldIcon />
          <span>Tokens Sold:&nbsp;</span>
        </div>
        <span className={styles.value}>
          <AnimatedNumber value={sold} suffix=" $BITS" compact />
        </span>
      </div>

      <div className={`${styles.statLine} ${styles.delay3}`}>
        <div className={styles.labelGroup}>
          <PriceIcon />
        </div>
        <span className={`${styles.value} ${styles.priceDisplay}`}>
         <AnimatedNumber value={price / 100} prefix="$" suffix=" USD" />
        </span>
      </div>
    </div>
  );
};

export default PresaleStatsCard;
