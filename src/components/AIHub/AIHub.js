import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AI_TOOLS_PRICING } from './pricingConfig';
import { useWallet } from '../../context/WalletContext'; // Core Wallet Context
import useBitsBalance from '../../hooks/useBitsBalance'; // Dedicated Balance Hook
import './AIHub.desktop.css';
import './AIHub.mobile.css';

const AIHub = () => {
  const navigate = useNavigate();
  
  // 1. Get wallet address from global context
  const { account } = useWallet(); 
  
  // 2. Fetch REAL BITS balance using the hook
  const { balance: bitsBalance, loading } = useBitsBalance(account);

  // Debugging
  useEffect(() => {
    console.log("AI Hub - Wallet:", account);
    console.log("AI Hub - BITS Balance:", bitsBalance);
  }, [account, bitsBalance]);

  const displayBalance = loading ? "..." : bitsBalance?.toLocaleString() || "0";

  const tools = [
    {
      ...AI_TOOLS_PRICING.marketOracle,
      icon: '🔮',
      route: '/ai-hub/market-oracle'
    },
    {
      ...AI_TOOLS_PRICING.portfolioStress,
      icon: '⚡',
      route: '/ai-hub/portfolio-stress'
    },
    {
      ...AI_TOOLS_PRICING.lieDetector,
      icon: '🎙️',
      route: '/ai-hub/lie-detector'
    },
    {
      ...AI_TOOLS_PRICING.smartAudit,
      icon: '🛡️',
      route: '/ai-hub/smart-audit'
    },
    {
      ...AI_TOOLS_PRICING.mindMirror,
      icon: '🧠',
      route: '/mind-mirror'
    }
  ];

  return (
    <div className="ai-hub-container">
      <div className="ai-hub-header">
        <h1 className="ai-hub-title">
          <span className="title-icon">🤖</span>
          AI UTILITY NEXUS
        </h1>
        <p className="ai-hub-subtitle">
          Powered by BITS Tokens • Your Balance: <span className="balance-highlight">{displayBalance}</span> BITS
        </p>
        {!account && (
            <p style={{color: '#ff5050', fontSize: '0.9rem', marginTop: '5px'}}>
                <i className="fas fa-exclamation-circle"></i> Wallet not connected. Please connect your wallet to access tools.
            </p>
        )}
      </div>

      <div className="tools-grid">
        {tools.map((tool) => {
          // Only allow access if wallet connected AND balance sufficient
          const canAfford = account && (bitsBalance >= tool.cost);
          
          return (
            <div
              key={tool.id}
              className={`tool-card ${!canAfford ? 'locked' : ''}`}
              onClick={() => canAfford && navigate(tool.route)}
            >
              <div className="tool-icon">{tool.icon}</div>
              <h3 className="tool-name">{tool.name}</h3>
              <p className="tool-description">{tool.description}</p>
              <div className="tool-cost">
                <span className="cost-label">Cost:</span>
                <span className="cost-value">{tool.cost === 0 ? "Free Tier" : `${tool.cost} BITS`}</span>
              </div>
              {!canAfford && (
                <div className="locked-overlay">
                  <i className="fas fa-lock"></i>
                  <span>{!account ? "Connect Wallet" : "Insufficient BITS"}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Admin Neural Link - Hidden at bottom */}
      <div style={{ marginTop: '60px', opacity: 0.3 }}>
        <p style={{ fontSize: '12px', textAlign: 'center' }}>
          Admin Neural Link available for authorized users
        </p>
      </div>
    </div>
  );
};

export default AIHub;
