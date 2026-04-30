// src/Presale/Timer/logic/TotalRaised.js
import React, { useEffect, useState } from "react";
import styles from "./TotalRaised.module.css";
import { getPresaleCurrentUrl, parseLaunchPowerUsd } from "../../presaleApi";

const AnimatedNumber = ({ value, duration = 1000, prefix = "$" }) => {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplayed(safe * progress);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [safe, duration]);

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
  const propN = Number(totalBoosted);
  const [fetched, setFetched] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(await getPresaleCurrentUrl(), { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;
        const n = parseLaunchPowerUsd(data);
        if (!cancelled && Number.isFinite(n)) setFetched(n);
      } catch (_) {
        /* păstrăm fallback la prop */
      }
    };
    void load();
    const id = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const merged = Number.isFinite(fetched)
    ? fetched
    : Number.isFinite(propN)
      ? propN
      : 0;

  return (
    <div className={styles.totalRaised}>
      <span className={styles.totalRaisedLabel}>Launch Power Raised:</span>
      <AnimatedNumber value={merged} prefix="$" />
    </div>
  );
};

export default TotalRaised;
