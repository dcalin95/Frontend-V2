import React, { useState } from 'react';
import { AI_TOOLS_PRICING } from './pricingConfig';
import useBitsBalance from '../../hooks/useBitsBalance';
import { useWallet } from '../../context/WalletContext';
import './AIHub.desktop.css';

const StressTest = () => {
  const { account } = useWallet();
  const { balance: bitsBalance } = useBitsBalance(account);
  const [portfolio, setPortfolio] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (bitsBalance < AI_TOOLS_PRICING.portfolioStress.cost) {
      alert(`Insufficient BITS! You need ${AI_TOOLS_PRICING.portfolioStress.cost} BITS.`);
      return;
    }

    setLoading(true);
    // Simulate stress test
    setTimeout(() => {
      setResult({
        crashScenario: '-' + Math.floor(Math.random() * 50 + 30) + '%',
        riskScore: Math.floor(Math.random() * 40 + 30) + '/100',
        recommendation: 'Diversify into stablecoins',
        worstCase: '$' + (Math.random() * 10000).toFixed(2)
      });
      setLoading(false);
    }, 3000);
  };

  return (
    <div className="ai-hub-container">
      <div className="ai-hub-header">
        <h1 className="ai-hub-title">
          <span className="title-icon">⚡</span>
          PORTFOLIO STRESS TEST
        </h1>
        <p className="ai-hub-subtitle">
          Test Against Extreme Conditions • Cost: {AI_TOOLS_PRICING.portfolioStress.cost} BITS
        </p>
      </div>

      <div style={{maxWidth: '600px', margin: '0 auto'}}>
        <div className="tool-card">
          <label style={{display: 'block', marginBottom: '12px', fontSize: '0.9rem', opacity: 0.8}}>
            Enter Portfolio Value (USD)
          </label>
          <input
            type="text"
            value={portfolio}
            onChange={(e) => setPortfolio(e.target.value)}
            placeholder="10000"
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
            onClick={handleTest}
            disabled={loading || !portfolio}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #00FFA3 0%, #DC1FFF 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#000',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: loading || !portfolio ? 'not-allowed' : 'pointer',
              opacity: loading || !portfolio ? 0.5 : 1
            }}
          >
            {loading ? '⚡ Testing...' : '⚡ Run Stress Test'}
          </button>
        </div>

        {result && (
          <div className="tool-card" style={{marginTop: '24px', background: 'rgba(255, 50, 50, 0.1)'}}>
            <h3 style={{color: '#ff5050', marginTop: 0}}>⚠️ Stress Test Results</h3>
            <p><strong>Market Crash (-80%):</strong> {result.crashScenario}</p>
            <p><strong>Risk Score:</strong> {result.riskScore}</p>
            <p><strong>Worst Case Value:</strong> {result.worstCase}</p>
            <p><strong>Recommendation:</strong> {result.recommendation}</p>
            <p style={{fontSize: '0.8rem', opacity: 0.6, marginTop: '16px'}}>
              ⚠️ Simulated results. Always DYOR.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StressTest;

