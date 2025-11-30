import React, { useState } from 'react';
import { AI_TOOLS_PRICING } from './pricingConfig';
import useBitsBalance from '../../hooks/useBitsBalance';
import { useWallet } from '../../context/WalletContext';
import './AIHub.desktop.css';

const LieDetector = () => {
  const { account } = useWallet();
  const { balance: bitsBalance } = useBitsBalance(account);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async () => {
    if (bitsBalance < AI_TOOLS_PRICING.lieDetector.cost) {
      alert(`Insufficient BITS! You need ${AI_TOOLS_PRICING.lieDetector.cost} BITS.`);
      return;
    }

    setAnalyzing(true);
    // Simulate voice analysis
    setTimeout(() => {
      setResult({
        verdict: Math.random() > 0.6 ? '🚨 DECEPTION DETECTED' : '✅ TRUTH DETECTED',
        confidence: Math.floor(Math.random() * 30 + 60) + '%',
        stressLevel: Math.floor(Math.random() * 100) + '/100',
        recommendation: Math.random() > 0.6 ? 'Avoid this project!' : 'Seems legit, but DYOR!'
      });
      setAnalyzing(false);
    }, 3000);
  };

  return (
    <div className="ai-hub-container">
      <div className="ai-hub-header">
        <h1 className="ai-hub-title">
          <span className="title-icon">🎙️</span>
          VOICE LIE DETECTOR
        </h1>
        <p className="ai-hub-subtitle">
          Analyze Voice Patterns • Cost: {AI_TOOLS_PRICING.lieDetector.cost} BITS
        </p>
      </div>

      <div style={{maxWidth: '600px', margin: '0 auto'}}>
        <div className="tool-card">
          <p style={{fontSize: '0.9rem', opacity: 0.8, marginBottom: '20px'}}>
            Upload an audio file or record live to detect deception in crypto influencer speech patterns.
          </p>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #00FFA3 0%, #DC1FFF 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#000',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: analyzing ? 'not-allowed' : 'pointer',
              opacity: analyzing ? 0.5 : 1
            }}
          >
            {analyzing ? '🎙️ Analyzing Voice...' : '🎙️ Start Analysis (Demo)'}
          </button>
        </div>

        {result && (
          <div className="tool-card" style={{marginTop: '24px', background: result.verdict.includes('DECEPTION') ? 'rgba(255, 50, 50, 0.1)' : 'rgba(0, 255, 163, 0.1)'}}>
            <h3 style={{color: result.verdict.includes('DECEPTION') ? '#ff5050' : '#00FFA3', marginTop: 0}}>
              {result.verdict}
            </h3>
            <p><strong>Confidence:</strong> {result.confidence}</p>
            <p><strong>Stress Level:</strong> {result.stressLevel}</p>
            <p><strong>Recommendation:</strong> {result.recommendation}</p>
            <p style={{fontSize: '0.8rem', opacity: 0.6, marginTop: '16px'}}>
              ⚠️ Simulated AI analysis. Always verify information independently.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LieDetector;

