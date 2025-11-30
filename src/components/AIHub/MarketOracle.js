import React, { useState } from 'react';
import { AI_TOOLS_PRICING } from './pricingConfig';
import useBitsBalance from '../../hooks/useBitsBalance';
import { useWallet } from '../../context/WalletContext';
import './AIHub.desktop.css';

const MarketOracle = () => {
  const { account } = useWallet();
  const { balance: bitsBalance } = useBitsBalance(account);
  const [symbol, setSymbol] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    if (bitsBalance < AI_TOOLS_PRICING.marketOracle.cost) {
      alert(`Insufficient BITS! You need ${AI_TOOLS_PRICING.marketOracle.cost} BITS.`);
      return;
    }

    setLoading(true);
    // Simulate AI prediction
    setTimeout(() => {
      setPrediction({
        symbol: symbol.toUpperCase(),
        trend: Math.random() > 0.5 ? 'BULLISH 📈' : 'BEARISH 📉',
        confidence: Math.floor(Math.random() * 30 + 70) + '%',
        targetPrice: '$' + (Math.random() * 1000).toFixed(2)
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="ai-hub-container">
      <div className="ai-hub-header">
        <h1 className="ai-hub-title">
          <span className="title-icon">🔮</span>
          MARKET ORACLE
        </h1>
        <p className="ai-hub-subtitle">
          AI-Powered Market Predictions • Cost: {AI_TOOLS_PRICING.marketOracle.cost} BITS
        </p>
      </div>

      <div style={{maxWidth: '600px', margin: '0 auto'}}>
        <div className="tool-card">
          <label style={{display: 'block', marginBottom: '12px', fontSize: '0.9rem', opacity: 0.8}}>
            Enter Crypto Symbol (e.g., BTC, ETH)
          </label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="BTC"
            style={{
              width: '100%',
              padding: '14px',
              background: 'rgba(0, 255, 163, 0.05)',
              border: '1px solid rgba(0, 255, 163, 0.3)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem',
              marginBottom: '20px'
            }}
          />
          <button
            onClick={handlePredict}
            disabled={loading || !symbol}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #00FFA3 0%, #DC1FFF 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#000',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: loading || !symbol ? 'not-allowed' : 'pointer',
              opacity: loading || !symbol ? 0.5 : 1
            }}
          >
            {loading ? '🔮 Predicting...' : '🔮 Predict Market Trend'}
          </button>
        </div>

        {prediction && (
          <div className="tool-card" style={{marginTop: '24px', background: 'rgba(0, 255, 163, 0.1)'}}>
            <h3 style={{color: '#00FFA3', marginTop: 0}}>Prediction for {prediction.symbol}</h3>
            <p><strong>Trend:</strong> {prediction.trend}</p>
            <p><strong>Confidence:</strong> {prediction.confidence}</p>
            <p><strong>Target Price:</strong> {prediction.targetPrice}</p>
            <p style={{fontSize: '0.8rem', opacity: 0.6, marginTop: '16px'}}>
              ⚠️ This is a simulated AI prediction. Not financial advice.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketOracle;

