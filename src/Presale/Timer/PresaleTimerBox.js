import React from "react";
import styles from "./PresaleTimerBox.module.css";
import SaleCountdown from "./SaleCountdown";
import { usePresaleState } from "./usePresaleState";

const PresaleTimerBox = () => {
 const { endTime, serverTimeOffset, isLoaded, progress } = usePresaleState();


  if (!isLoaded || endTime === null) return null;

  return (
    <div className={styles.timerBox}>
      <h2 className={styles.subtitle}>Presale Ends In</h2>
      <SaleCountdown 
        endTime={endTime} 
        serverTimeOffset={serverTimeOffset} 
        progress={progress}
      />

      <a href="/presale" className={styles.presaleButton}>
        Go to Presale
      </a>
    </div>
  );
};

export default PresaleTimerBox;
