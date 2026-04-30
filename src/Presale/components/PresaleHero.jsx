import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./PresaleHero.css";

function formatLaunchPowerUsd(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

const PresaleHero = ({ onStartInvesting, currentPrice, daysRemaining, isLoading, launchPowerUsd }) => {
  const navigate = useNavigate();
  const [displayPrice, setDisplayPrice] = useState(null);
  const [displayDays, setDisplayDays] = useState(null);

  useEffect(() => {
    if (currentPrice && currentPrice > 0) {
      setDisplayPrice(`$${currentPrice.toFixed(6)}`);
    } else {
      setDisplayPrice(null);
    }
  }, [currentPrice]);

  useEffect(() => {
    if (daysRemaining !== undefined && daysRemaining !== null && daysRemaining >= 0) {
      setDisplayDays(daysRemaining.toString());
    } else {
      setDisplayDays(null);
    }
  }, [daysRemaining]);

  const handleScrollToPayment = () => {
    if (onStartInvesting) {
      onStartInvesting();
    } else {
      // Fallback: scroll to payment section
      const paymentSection = document.querySelector('.grid-payment');
      if (paymentSection) {
        paymentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="presale-hero">
      <div className="presale-hero-content">
        <h1 className="presale-hero-title">
          Invest in <span className="presale-hero-highlight">$BITS Token</span> Presale
        </h1>
        <p className="presale-hero-subtitle">
          Early Bird Price: <strong>{displayPrice || (isLoading ? "Loading..." : "N/A")} per BITS</strong>
        </p>
        <p className="presale-hero-round-status">
          Round 2 has ended. Waiting for the next round to open.
        </p>
        <p className="presale-hero-timer">
          Limited Time: <span className="presale-hero-timer-value">{displayDays !== null ? `${displayDays} Days Remaining` : (isLoading ? "Calculating..." : "N/A")}</span>
        </p>
        <p className="presale-hero-launch-power" translate="no">
          <span className="presale-hero-launch-label">Launch Power Raised:</span>{" "}
          <span className="presale-hero-launch-value">
            {isLoading ? "…" : formatLaunchPowerUsd(launchPowerUsd)}
          </span>
        </p>
        <div className="presale-hero-buttons">
          <button 
            className="presale-hero-cta presale-hero-cta-primary"
            onClick={handleScrollToPayment}
          >
            🚀 INVEST NOW
          </button>
          <button 
            className="presale-hero-cta presale-hero-cta-secondary presale-hero-how-it-works-btn"
            onClick={() => {
              navigate('/how-it-works');
            }}
          >
            📖 How It Works
          </button>
        </div>
      </div>
    </div>
  );
};

export default PresaleHero;

