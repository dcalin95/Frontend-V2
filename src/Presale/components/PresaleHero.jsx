import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./PresaleHero.css";

const PresaleHero = ({ onStartInvesting, currentPrice, daysRemaining, isLoading }) => {
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
        <p className="presale-hero-timer">
          Limited Time: <span className="presale-hero-timer-value">{displayDays !== null ? `${displayDays} Days Remaining` : (isLoading ? "Calculating..." : "N/A")}</span>
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

