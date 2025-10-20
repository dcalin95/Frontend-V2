import React, { useEffect, useState } from "react";
import styles from "./SaleChart.module.css";
import {
  CircularProgressbarWithChildren,
  buildStyles
} from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import logo from "../../assets/logo.png"; // ajustează dacă alt path

// 🔹 Mică componentă internă pentru număr animat
const AnimatedNumber = ({ value = 0, duration = 1000, formatFn }) => {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = value * progress;
      setDisplayed(eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration]);

  const formatted = formatFn
    ? formatFn(displayed)
    : parseInt(displayed).toLocaleString();

  return <span>{formatted}</span>;
};

const getGradientColor = (percent) => {
  if (percent >= 75) return "#00ff88";
  if (percent >= 50) return "#00f0ff";
  return "#ff00cc";
};

const SaleChart = ({ sold, supply, progress }) => {
  const progressPercent = Math.min(progress.toFixed(1), 100);
  const gradientColor = getGradientColor(progressPercent);

  return (
    <div className={styles.chartWrapper}>
      <CircularProgressbarWithChildren
        value={progressPercent}
        maxValue={100}
        styles={buildStyles({
          trailColor: "rgba(0, 255, 255, 0.1)",
          pathColor: "url(#dynamicGradient)",
          strokeLinecap: "round"
        })}
      >
        <svg style={{ height: 0 }}>
          <defs>
            <linearGradient id="dynamicGradient" gradientTransform="rotate(90)">
              <stop offset="0%" stopColor={gradientColor} />
              <stop offset="100%" stopColor="#000" />
            </linearGradient>
          </defs>
        </svg>

        <div className={styles.centerText}>
          <img src={logo} alt="$BITS Logo" className={styles.logo} />
          <div className={styles.percent}>{progressPercent}%</div>
          <div className={styles.label}>Sold</div>
          <div className={styles.subLabelGroup}>
            <div className={styles.soldAmount}>
              <AnimatedNumber value={sold} duration={1000} />
            </div>
            <div className={styles.totalLabel}>
              of{" "}
              <AnimatedNumber
                value={supply}
                duration={1000}
                formatFn={(v) => `${parseInt(v).toLocaleString()} $BITS`}
              />
            </div>
          </div>
        </div>
      </CircularProgressbarWithChildren>
    </div>
  );
};

export default SaleChart;
