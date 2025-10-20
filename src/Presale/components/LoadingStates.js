import React from 'react';
import './LoadingStates.css';

// Loading pentru estimarea BITS
export const BitsEstimateLoading = () => (
  <div className="loading-container bits-estimate-loading">
    <div className="loading-spinner"></div>
    <p>🧮 Se calculează BITS-urile...</p>
    <div className="loading-steps">
      <span className="step">1. Verificare prețuri</span>
      <span className="step">2. Calculare bonusuri</span>
      <span className="step">3. Estimare finală</span>
    </div>
  </div>
);

// Loading pentru tranzacții
export const TransactionLoading = ({ step = 1 }) => {
  const steps = [
    "🔍 Verificare wallet...",
    "📝 Pregătire tranzacție...",
    "⚡ Confirmare în blockchain...",
    "✅ Finalizare tranzacție..."
  ];

  return (
    <div className="loading-container transaction-loading">
      <div className="loading-spinner"></div>
      <p>{steps[step - 1] || steps[0]}</p>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${(step / steps.length) * 100}%` }}
        ></div>
      </div>
      <p className="step-counter">Pasul {step} din {steps.length}</p>
    </div>
  );
};

// Loading pentru prețuri
export const PricesLoading = () => (
  <div className="loading-container prices-loading">
    <div className="loading-spinner"></div>
    <p>💰 Se încarcă prețurile token-urilor...</p>
    <div className="loading-tokens">
      <span className="token">BNB</span>
      <span className="token">ETH</span>
      <span className="token">USDT</span>
      <span className="token">USDC</span>
    </div>
  </div>
);

// Loading pentru balanțe
export const BalancesLoading = () => (
  <div className="loading-container balances-loading">
    <div className="loading-spinner"></div>
    <p>💳 Se verifică balanțele...</p>
    <div className="loading-animation">
      <div className="balance-item">BNB: ...</div>
      <div className="balance-item">USDT: ...</div>
      <div className="balance-item">BITS: ...</div>
    </div>
  </div>
);

// Loading pentru countdown
export const CountdownLoading = () => (
  <div className="loading-container countdown-loading">
    <div className="loading-spinner"></div>
    <p>⏰ Se sincronizează timer-ul...</p>
    <div className="countdown-placeholder">
      <div className="time-unit">
        <span className="number">--</span>
        <span className="label">Zile</span>
      </div>
      <div className="time-unit">
        <span className="number">--</span>
        <span className="label">Ore</span>
      </div>
      <div className="time-unit">
        <span className="number">--</span>
        <span className="label">Min</span>
      </div>
      <div className="time-unit">
        <span className="number">--</span>
        <span className="label">Sec</span>
      </div>
    </div>
  </div>
);

// Loading generic cu skeleton
export const SkeletonLoading = ({ lines = 3, height = "20px" }) => (
  <div className="skeleton-loading">
    {Array.from({ length: lines }).map((_, index) => (
      <div 
        key={index} 
        className="skeleton-line"
        style={{ height, animationDelay: `${index * 0.1}s` }}
      ></div>
    ))}
  </div>
); 