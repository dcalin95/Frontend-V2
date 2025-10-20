import React from "react";

const BonusProgressBar = ({ investedUSD, nextTier }) => {
  if (!nextTier || !nextTier.threshold) return null;

  const percent = Math.min((investedUSD / nextTier.threshold) * 100, 100);

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 13, marginBottom: 4 }}>
        🚀 {`$${nextTier.remaining.toFixed(2)}`} more to unlock <strong>{nextTier.rate}%</strong> bonus
      </div>
      <div style={{
        height: 10,
        width: "100%",
        backgroundColor: "#222",
        borderRadius: 6,
        overflow: "hidden"
      }}>
        <div style={{
          height: "100%",
          width: `${percent}%`,
          backgroundColor: "#00ffaa",
          transition: "width 0.3s"
        }} />
      </div>
    </div>
  );
};

export default BonusProgressBar;
