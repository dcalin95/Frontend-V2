// src/Presale/Timer/PresaleCountdownFlip.js
import React, { useEffect, useState } from "react";
import styles from "./PresaleCountdownFlip.module.css";
import { usePresaleState } from "./usePresaleState";
import useCellManagerData from "../hooks/useCellManagerData";
import TotalRaised from "./logic/TotalRaised";
import bitsLogo from "../../assets/logo.png";

// Removed TOTAL_ROUNDS limit - rounds are managed dynamically

const getTimeLeft = (endTime) => {
  const now = Date.now();
  const diff = endTime - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
};

const TimeBox = ({ label, value }) => (
  <div className={styles.timeBox} translate="no">
    <div className={styles.timeValue} translate="no">{String(value).padStart(2, "0")}</div>
    <div className={styles.timeLabel} translate="no">{label}</div>
  </div>
);

const PresaleCountdownFlip = () => {
  // Get database data for sold/progress/endTime
  const {
    isLoaded,
    endTime,
    totalBoosted,
    sold,
    supply,
    progress,
  } = usePresaleState();

  // Get CellManager data for price and round
  const cellManagerData = useCellManagerData();

  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0,
  });

  useEffect(() => {
    if (!endTime) return;
    const update = () => setTimeLeft(getTimeLeft(endTime));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  // Use CellManager price or fallback
  const currentPrice = cellManagerData.currentPrice || 0.06;
  const roundNumber = cellManagerData.roundNumber || 9;



  if (!isLoaded || cellManagerData.loading) return null;

  return (
    <div className={styles.countdownFlip} translate="no">
      <div className={styles.cardHeader}>
        <img src={bitsLogo} alt="BITS Token Logo" className={styles.bitsLogo} />
      </div>

      <div className={styles.priceInfo}>
        <div className={styles.roundText} translate="no">
          {roundNumber ? (
            <>
              $BITS Presale Round <span className={styles.currentRound}>{roundNumber}</span>
            </>
          ) : (
            "No round active"
          )}
        </div>

        <div className={styles.remainingText} translate="no">
          {/* Always show presale as active if supply exists */}
          {"⏳ Presale Active"}
        </div>



        <div className={styles.priceLine} translate="no">
          <span>
            <img src={bitsLogo} alt="BITS Logo" className={styles.priceLogo} />
          </span>
          {currentPrice > 0 ? (
            <span className={styles.currentPriceDisplay}>${currentPrice.toFixed(3)}</span>
          ) : (
            <span className={styles.unavailablePrice}>Unavailable</span>
          )}
        </div>
      </div>

      <div className={styles.timeBoxes} translate="no">
        <TimeBox label="Days" value={timeLeft.days} />
        <TimeBox label="Hours" value={timeLeft.hours} />
        <TimeBox label="Minutes" value={timeLeft.minutes} />
        <TimeBox label="Seconds" value={timeLeft.seconds} />
      </div>

      <TotalRaised totalBoosted={totalBoosted} />
    </div>
  );
};

export default PresaleCountdownFlip;
