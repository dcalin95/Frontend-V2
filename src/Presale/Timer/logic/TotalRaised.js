// src/Presale/Timer/logic/TotalRaised.js
import React, { useEffect, useState } from "react";
import styles from "./TotalRaised.module.css";

const AnimatedNumber = ({ value, duration = 1000, prefix = "$" }) => {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplayed(value * progress);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  const formatted = Math.round(displayed).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <span className={styles.totalRaisedAmount}>
      {prefix}{formatted}
    </span>
  );
};

const TotalRaised = ({ totalBoosted }) => {
  return (
    <div className={styles.totalRaised}>
      <span className={styles.totalRaisedLabel}>Launch Power Raised:</span>
      <AnimatedNumber value={totalBoosted} prefix="$" />
    </div>
  );
};

export default TotalRaised;
