import React, { useEffect, useState } from "react";
import styles from "./PresaleCountdownMini.module.css";
import { usePresaleState } from "./usePresaleState";

const getTimeLeft = (endTime) => {
  if (!endTime) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  const now = Date.now();
  const end = endTime;
  const diff = end - now;

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
};

const PresaleCountdownMini = () => {
  const { endTime, isLoaded } = usePresaleState();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  console.log('🕒 [PresaleCountdownMini] endTime:', endTime, 'isLoaded:', isLoaded);

  useEffect(() => {
    if (!isLoaded || !endTime) return;

    const updateTime = () => setTimeLeft(getTimeLeft(endTime));
    updateTime();

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [endTime, isLoaded]);

  if (!isLoaded || !endTime) return null;

  return (
    <div className={styles.miniTimer} translate="no">
      <span className={styles.block} translate="no">{timeLeft.days}d</span>
      <span className={styles.sep} translate="no">:</span>
      <span className={styles.block} translate="no">{timeLeft.hours}h</span>
      <span className={styles.sep} translate="no">:</span>
      <span className={styles.block} translate="no">{timeLeft.minutes}m</span>
      <span className={styles.sep} translate="no">:</span>
      <span className={styles.block} translate="no">{timeLeft.seconds}s</span>
    </div>
  );
};

export default PresaleCountdownMini;
