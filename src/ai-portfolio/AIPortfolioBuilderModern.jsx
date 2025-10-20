import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from "recharts";
import { GA4_HELPERS } from "../config/googleAnalytics";
// import walletOptimizer, { useWalletOptimization } from "../utils/walletBrowserDetection"; // File removed
import './ModernAIStyles.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
const AI_COLORS = ["#00D4FF", "#7B68EE", "#FF6B9D", "#FFD700", "#00FF88", "#FF4757", "#3742FA"];

export default function AIPortfolioBuilderModern() {
  const [budget, setBudget] = useState(1000);
  const [horizon, setHorizon] = useState("6-12 months");
  const [risk, setRisk] = useState("moderate");
  const [objectives, setObjectives] = useState(["growth"]);
  const [tokenPreferences, setTokenPreferences] = useState(["STX", "ALEX"]);
  const [useBITS, setUseBITS] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [savedOk, setSavedOk] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const [step, setStep] = useState(0);
  const cardRef = useRef(null);
  
  // Wallet browser optimization
  // const walletInfo = useWalletOptimization(); // Hook disabled

  const pieData = useMemo(() => {
    if (!result?.allocations) return [];
    return result.allocations.map((a) => ({ 
      name: a.token, 
      value: a.percent,
      reason: a.reason,
      usdValue: a.usdAllocation 
    }));
  }, [result]);

  const aiSteps = [
    "🧠 Analyzing market conditions...",
    "📊 Processing risk parameters...", 
    "⚡ Running AI optimization algorithms...",
    "🎯 Fine-tuning allocations...",
    "✨ Generating your perfect portfolio..."
  ];

  useEffect(() => {
    if (aiThinking) {
      const interval = setInterval(() => {
        setStep(prev => (prev + 1) % aiSteps.length);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [aiThinking]);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setAiThinking(true);
    setError("");
    setResult(null);
    setStep(0);
    
    try {
      // Simulate AI thinking time (reduced for wallet browsers)
      const thinkingTime = 3000; // Standard timing
      await new Promise(resolve => setTimeout(resolve, thinkingTime));
      
      const payload = { 
        budget: Number(budget), 
        horizon, 
        risk, 
        objectives, 
        tokenPreferences, 
        useBITS 
      };
      
      const { data } = await axios.post(`${BACKEND_URL}/api/generate-portfolio`, payload, { timeout: 20000 });
      setResult(data);
      try { GA4_HELPERS.trackEvent('ai_portfolio_generate_modern', { budget: Number(budget), risk }); } catch {}
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "AI system temporarily unavailable");
    } finally {
      setLoading(false);
      setAiThinking(false);
    }
  }

  // Load from query param or localStorage
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const enc = params.get("result");
      if (enc) {
        const json = JSON.parse(atob(enc));
        if (json && json.allocations) setResult(json);
      } else {
        const last = localStorage.getItem("ai_portfolio_modern_last");
        if (last) setResult(JSON.parse(last));
      }
    } catch {}
  }, []);

  async function sharePortfolio() {
    try {
      if (!result) return;
      const enc = btoa(JSON.stringify(result));
      const url = `${window.location.origin}/ai-portfolio?result=${encodeURIComponent(enc)}`;
      await navigator.clipboard.writeText(url);
      setSavedOk("🔗 Portfolio link copied!");
      try { GA4_HELPERS.trackEvent('ai_portfolio_share_modern'); } catch {}
      setTimeout(() => setSavedOk(""), 2000);
    } catch {}
  }

  async function savePortfolio() {
    try {
      if (!result) return;
      localStorage.setItem("ai_portfolio_modern_last", JSON.stringify(result));
      setSavedOk("💾 Portfolio saved!");
      try { GA4_HELPERS.trackEvent('ai_portfolio_save_modern'); } catch {}
      setTimeout(() => setSavedOk(""), 2000);
    } catch {}
  }

  return (
    <div className="ai-modern-container">
      {/* AI Header */}
      <div className="ai-header">
        <div className="ai-logo">
          <div className="ai-brain-icon">🧠</div>
          <h1 className="ai-title">
            <span className="ai-gradient-text">AI Portfolio</span>
            <span className="ai-sub-text">Neural Architecture</span>
          </h1>
        </div>
        <div className="ai-status-indicator">
          <div className={`ai-pulse ${loading ? 'active' : ''}`}></div>
          <span className="ai-status-text">
            {loading ? 'AI Processing...' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="ai-main-grid">
        {/* Input Panel */}
        <div className="ai-panel ai-input-panel">
          <div className="ai-panel-header">
            <h2 className="ai-panel-title">Portfolio Parameters</h2>
            <div className="ai-neural-lines"></div>
          </div>
          
          <form onSubmit={onSubmit} className="ai-form">
            <div className="ai-input-group">
              <label className="ai-label">
                <span className="ai-label-text">💰 Investment Budget</span>
                <div className="ai-input-wrapper">
                  <input 
                    type="number" 
                    value={budget} 
                    onChange={(e) => setBudget(e.target.value)} 
                    min={0} 
                    step={100}
                    className="ai-input ai-input-glow"
                    placeholder="1000"
                  />
                  <span className="ai-currency">USD</span>
                </div>
              </label>
            </div>

            <div className="ai-input-group">
              <label className="ai-label">
                <span className="ai-label-text">⏰ Time Horizon</span>
                <select 
                  value={horizon} 
                  onChange={(e) => setHorizon(e.target.value)}
                  className="ai-select"
                >
                  <option value="<3 months">🚀 Short-term (&lt;3 months)</option>
                  <option value="6-12 months">📈 Medium-term (6-12 months)</option>
                  <option value=">1 year">💎 Long-term (&gt;1 year)</option>
                </select>
              </label>
            </div>

            <div className="ai-input-group">
              <label className="ai-label">
                <span className="ai-label-text">⚖️ Risk Tolerance</span>
                <div className="ai-risk-selector">
                  {['conservative', 'moderate', 'aggressive'].map(riskLevel => (
                    <button
                      key={riskLevel}
                      type="button"
                      onClick={() => setRisk(riskLevel)}
                      className={`ai-risk-btn ${risk === riskLevel ? 'active' : ''}`}
                    >
                      <span className="ai-risk-emoji">
                        {riskLevel === 'conservative' ? '🛡️' : 
                         riskLevel === 'moderate' ? '⚡' : '🔥'}
                      </span>
                      <span className="ai-risk-text">{riskLevel}</span>
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <div className="ai-input-group">
              <label className="ai-label">
                <span className="ai-label-text">🎯 Investment Goals</span>
                <input
                  value={objectives.join(", ")}
                  onChange={(e) => setObjectives(e.target.value.split(",").map(v => v.trim()).filter(Boolean))}
                  placeholder="growth, yield farming, diversification"
                  className="ai-input"
                />
              </label>
            </div>

            <div className="ai-input-group">
              <label className="ai-label">
                <span className="ai-label-text">🪙 Preferred Tokens</span>
                <input
                  value={tokenPreferences.join(", ")}
                  onChange={(e) => setTokenPreferences(e.target.value.split(",").map(v => v.trim().toUpperCase()).filter(Boolean))}
                  placeholder="STX, ALEX, xBTC"
                  className="ai-input"
                />
              </label>
            </div>

            <div className="ai-toggle-group">
              <label className="ai-toggle">
                <input 
                  type="checkbox" 
                  checked={useBITS} 
                  onChange={(e) => setUseBITS(e.target.checked)}
                  className="ai-checkbox"
                />
                <span className="ai-toggle-slider"></span>
                <span className="ai-toggle-text">
                  🎮 Include BITS Token Simulation
                  <small>Simulate portfolio with 1000 BITS tokens</small>
                </span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="ai-generate-btn"
            >
              <span className="ai-btn-gradient"></span>
              <span className="ai-btn-text">
                {loading ? (
                  <>
                    <span className="ai-spinner"></span>
                    AI Generating...
                  </>
                ) : (
                  <>
                    <span className="ai-brain-emoji">🧠</span>
                    Generate AI Portfolio
                  </>
                )}
              </span>
            </button>
          </form>
        </div>

        {/* AI Thinking Animation */}
        {aiThinking && (
          <div className="ai-thinking-panel">
            <div className="ai-thinking-animation">
              <div className="ai-neural-network">
                <div className="ai-neuron ai-neuron-1"></div>
                <div className="ai-neuron ai-neuron-2"></div>
                <div className="ai-neuron ai-neuron-3"></div>
                <div className="ai-neural-connection ai-connection-1"></div>
                <div className="ai-neural-connection ai-connection-2"></div>
                <div className="ai-neural-connection ai-connection-3"></div>
              </div>
              <div className="ai-thinking-text">
                <h3>{aiSteps[step]}</h3>
                <div className="ai-progress-bar">
                  <div className="ai-progress-fill" style={{width: `${((step + 1) / aiSteps.length) * 100}%`}}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="ai-error-panel">
            <div className="ai-error-icon">⚠️</div>
            <div className="ai-error-text">
              <h3>AI System Alert</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Results Panel */}
        {result && !aiThinking && (
          <div className="ai-results-panel" ref={cardRef}>
            <div className="ai-panel-header">
              <h2 className="ai-panel-title">
                <span className="ai-success-icon">✨</span>
                AI-Generated Portfolio
              </h2>
              <div className="ai-success-score">
                <span className="ai-score-label">AI Confidence</span>
                <span className="ai-score-value">{result.score || 8}/10</span>
              </div>
            </div>

            {/* Portfolio Visualization */}
            <div className="ai-visualization-grid">
              <div className="ai-chart-container">
                <h3 className="ai-chart-title">Asset Allocation</h3>
                <div className="ai-chart-wrapper">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie 
                        data={pieData} 
                        dataKey="value" 
                        nameKey="name" 
                        outerRadius={120}
                        innerRadius={60}
                        paddingAngle={2}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={AI_COLORS[index % AI_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          background: 'rgba(0, 0, 0, 0.9)',
                          border: '1px solid #00D4FF',
                          borderRadius: '8px',
                          boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="ai-allocations-list">
                {result.allocations.map((allocation, index) => (
                  <div key={allocation.token} className="ai-allocation-card">
                    <div className="ai-allocation-header">
                      <div className="ai-token-info">
                        <span 
                          className="ai-token-indicator" 
                          style={{backgroundColor: AI_COLORS[index % AI_COLORS.length]}}
                        ></span>
                        <span className="ai-token-name">{allocation.token}</span>
                        <span className="ai-allocation-percent">{allocation.percent}%</span>
                      </div>
                      {allocation.usdAllocation && (
                        <div className="ai-usd-value">${allocation.usdAllocation}</div>
                      )}
                    </div>
                    {allocation.reason && (
                      <div className="ai-allocation-reason">
                        <span className="ai-reason-icon">💡</span>
                        {allocation.reason}
                      </div>
                    )}
                    {allocation.priceUsd && allocation.estTokenAmount && (
                      <div className="ai-token-details">
                        ≈ {allocation.estTokenAmount} {allocation.token} @ ${allocation.priceUsd}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Portfolio Metadata */}
            <div className="ai-metadata-grid">
              <div className="ai-meta-card">
                <div className="ai-meta-icon">📊</div>
                <div className="ai-meta-content">
                  <div className="ai-meta-label">Risk Score</div>
                  <div className="ai-meta-value">{result.score}/10</div>
                </div>
              </div>
              <div className="ai-meta-card">
                <div className="ai-meta-icon">🔄</div>
                <div className="ai-meta-content">
                  <div className="ai-meta-label">Rebalance</div>
                  <div className="ai-meta-value">{result.rebalance}</div>
                </div>
              </div>
              {result.meta?.generatedAt && (
                <div className="ai-meta-card">
                  <div className="ai-meta-icon">⏰</div>
                  <div className="ai-meta-content">
                    <div className="ai-meta-label">Generated</div>
                    <div className="ai-meta-value">
                      {new Date(result.meta.generatedAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI Summary */}
            {result.summary && (
              <div className="ai-summary-card">
                <div className="ai-summary-header">
                  <span className="ai-summary-icon">🎯</span>
                  <h3>AI Strategy Analysis</h3>
                </div>
                <p className="ai-summary-text">{result.summary}</p>
              </div>
            )}

            {/* BITS Simulation */}
            {result.useBITS && result.bitsSimulation && (
              <div className="ai-bits-card">
                <div className="ai-bits-header">
                  <span className="ai-bits-icon">🎮</span>
                  <h3>BITS Token Simulation</h3>
                  <div className="ai-bits-total">{result.bitsSimulation.totalBITS} BITS</div>
                </div>
                <div className="ai-bits-grid">
                  {result.bitsSimulation.allocations.map((bits) => (
                    <div key={bits.token} className="ai-bits-item">
                      <span className="ai-bits-token">{bits.token}</span>
                      <span className="ai-bits-amount">{bits.bits} BITS</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="ai-actions-grid">
              <button onClick={savePortfolio} className="ai-action-btn ai-save-btn">
                <span className="ai-action-icon">💾</span>
                Save Portfolio
              </button>
              <button onClick={sharePortfolio} className="ai-action-btn ai-share-btn">
                <span className="ai-action-icon">🔗</span>
                Share Portfolio
              </button>
              <button 
                onClick={() => window.print()} 
                className="ai-action-btn ai-print-btn"
              >
                <span className="ai-action-icon">🖨️</span>
                Print Report
              </button>
            </div>

            {/* Success Feedback */}
            {savedOk && (
              <div className="ai-success-toast">
                <span className="ai-toast-icon">✨</span>
                {savedOk}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
