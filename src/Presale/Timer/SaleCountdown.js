// src/Presale/Timer/SaleCountdown.js
import React, { useState, useEffect } from "react";
import styles from "./SaleCountdown.module.css";

const formatUnit = (num) => String(num).padStart(2, "0");

const getTimeLeft = (endTime, offset = 0) => {
  const now = Date.now() + offset;
  const target = typeof endTime === "number" ? endTime : 0;
  const total = Math.max(target - now, 0);

  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / 1000 / 60) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
};

const SaleCountdown = ({ endTime, serverTimeOffset = 0, progress = 0 }) => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(endTime, serverTimeOffset));

  useEffect(() => {
    const timer = setInterval(() => {
      const next = getTimeLeft(endTime, serverTimeOffset);
      setTimeLeft(next);
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, serverTimeOffset, progress]);

  if (typeof endTime !== "number" || endTime <= 0) {
    return (
      <div className={styles.countdownWrapper}>
        <h2 className={styles.expired}>🕒 Nicio rundă activă</h2>
      </div>
    );
  }

  // Se oprește când timpul expiră SAU când se vând toți tokenii
  if (timeLeft.total <= 0 || progress >= 100) {
    return (
      <div className={styles.countdownWrapper}>
        <h2 className={styles.expired}>
          {progress >= 100 ? "🎯 All Tokens Sold!" : "🚀 Presale Ended"}
        </h2>
      </div>
    );
  }

  return (
    <div className={styles.countdownWrapper}>
      <h2 className={styles.title}>⏳ Time Left</h2>
      <div className={styles.timer}>
        {["days", "hours", "minutes", "seconds"].map((unit) => (
          <div key={unit} className={styles.unit}>
            <div className={styles.digit}>{formatUnit(timeLeft[unit])}</div>
            <div className={styles.label}>
              {unit.charAt(0).toUpperCase() + unit.slice(1)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SaleCountdown;
