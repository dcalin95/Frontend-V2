import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PresaleHistoryMobileBanner.css';

const API_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";

/**
 * 📱 PresaleHistory Mobile Banner
 * Afișează tranzacțiile simulate pe mobile sub BitcoinPriceTicker
 * Dispare automat după 5 secunde
 */
const PresaleHistoryMobileBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verifică dacă suntem pe mobile
    const isMobile = window.matchMedia('(max-width: 768px)').matches || 
                     document.body.classList.contains('mode-mobile');
    
    if (!isMobile) {
      return; // Nu afișa pe desktop
    }

    // Afișează banner-ul imediat
    setIsVisible(true);

    // Fetch tranzacțiile simulate
    const fetchSimulatedHistory = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/presale/history`);
        const simulatedHistory = Array.isArray(res.data) ? res.data : [];
        
        // Preia doar ultimele 3 runde pentru a fi compact
        const recentRounds = simulatedHistory
          .filter(round => round.simulated_sold_bits > 0 || round.sold_bits > 0)
          .slice(-3);
        
        setHistory(recentRounds);
        setIsLoading(false);
      } catch (err) {
        console.warn("⚠️ [PresaleHistoryMobileBanner] Could not fetch simulated history:", err.message);
        setIsLoading(false);
      }
    };

    fetchSimulatedHistory();

    // Dispare după 5 secunde
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => {
      clearTimeout(hideTimer);
    };
  }, []);

  // Nu afișa dacă nu este vizibil sau nu suntem pe mobile
  if (!isVisible) {
    return null;
  }

  const isMobile = window.matchMedia('(max-width: 768px)').matches || 
                   document.body.classList.contains('mode-mobile');
  
  if (!isMobile) {
    return null;
  }

  // Calculează totaluri
  const totalSold = history.reduce((sum, round) => sum + (round.simulated_sold_bits || round.sold_bits || 0), 0);
  const totalRaised = history.reduce((sum, round) => sum + (round.simulated_raised_usd || round.raised_usd || 0), 0);

  return (
    <div className="presale-history-mobile-banner">
      <div className="presale-history-mobile-content">
        <div className="presale-history-mobile-header">
          <span className="presale-history-mobile-icon">🟠</span>
          <span className="presale-history-mobile-title">Recent Transactions</span>
          <button 
            className="presale-history-mobile-close"
            onClick={() => setIsVisible(false)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        
        {isLoading ? (
          <div className="presale-history-mobile-loading">
            <span>Loading...</span>
          </div>
        ) : history.length > 0 ? (
          <div className="presale-history-mobile-stats">
            <div className="presale-history-mobile-stat">
              <span className="stat-label">BITS Sold</span>
              <span className="stat-value">
                {(totalSold / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="presale-history-mobile-stat">
              <span className="stat-label">USD Raised</span>
              <span className="stat-value">
                ${(totalRaised / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="presale-history-mobile-stat">
              <span className="stat-label">Rounds</span>
              <span className="stat-value">{history.length}</span>
            </div>
          </div>
        ) : (
          <div className="presale-history-mobile-empty">
            <span>No transactions yet</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PresaleHistoryMobileBanner;

