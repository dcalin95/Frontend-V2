import React, { useEffect, useMemo, useRef, useState, useCallback, useContext } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, LineChart, Line } from "recharts";
import { GA4_HELPERS } from "../config/googleAnalytics";
import WalletContext from "../context/WalletContext";
import useBlockchainPortfolioData from "./hooks/useBlockchainPortfolioData";
import './EnhancedAIStyles.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
const AI_COLORS = ["#00D4FF", "#7B68EE", "#FF6B9D", "#FFD700", "#00FF88", "#FF4757", "#3742FA"];

// Enhanced debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
};

// Advanced error boundary component
class AIErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 AI Portfolio Error:', error, errorInfo);
    try { GA4_HELPERS.trackEvent('ai_portfolio_error', { error: error.message }); } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="ai-error-boundary">
          <div className="ai-error-icon">⚠️</div>
          <h3>AI System Temporarily Unavailable</h3>
          <p>Our neural networks are recalibrating. Please try again in a moment.</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="ai-retry-btn"
          >
            🔄 Retry Analysis
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced portfolio analytics component
export default function AIPortfolioAnalyticsRefactored() {
  // Wallet context for blockchain integration
  const { walletAddress } = useContext(WalletContext);
  
  // Blockchain data integration
  const blockchainData = useBlockchainPortfolioData(walletAddress);
  
  // Core state management
  const [budget, setBudget] = useState(() => {
    const saved = localStorage.getItem('ai_portfolio_budget');
    return saved ? Number(saved) : 1000;
  });
  const [horizon, setHorizon] = useState(() => 
    localStorage.getItem('ai_portfolio_horizon') || "6-12 months"
  );
  const [risk, setRisk] = useState(() => 
    localStorage.getItem('ai_portfolio_risk') || "moderate"
  );
  const [objectives, setObjectives] = useState(() => {
    const saved = localStorage.getItem('ai_portfolio_objectives');
    return saved ? JSON.parse(saved) : ["growth"];
  });
  const [tokenPreferences, setTokenPreferences] = useState(() => {
    const saved = localStorage.getItem('ai_portfolio_tokens');
    return saved ? JSON.parse(saved) : ["STX", "ALEX"];
  });
  const [useBITS, setUseBITS] = useState(() => 
    localStorage.getItem('ai_portfolio_bits') === 'true'
  );

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [savedOk, setSavedOk] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const [step, setStep] = useState(0);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [realTimePrices, setRealTimePrices] = useState({});
  const [performanceMetrics, setPerformanceMetrics] = useState(null);

  // Refs
  const cardRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Debounced values for auto-save
  const debouncedBudget = useDebounce(budget, 1000);
  const debouncedObjectives = useDebounce(objectives, 1000);
  const debouncedTokens = useDebounce(tokenPreferences, 1000);

  // Enhanced AI thinking steps with more realistic progression
  const aiSteps = [
    "🧠 Initializing neural networks...",
    "📊 Analyzing market conditions and volatility patterns...", 
    "⚡ Processing risk parameters through ML algorithms...",
    "🔍 Evaluating token correlations and historical performance...",
    "🎯 Optimizing allocations using advanced portfolio theory...",
    "📈 Running Monte Carlo simulations for risk assessment...",
    "✨ Generating personalized investment strategy...",
    "🔬 Validating recommendations against market data..."
  ];

  // Auto-save preferences
  useEffect(() => {
    localStorage.setItem('ai_portfolio_budget', debouncedBudget);
  }, [debouncedBudget]);

  useEffect(() => {
    localStorage.setItem('ai_portfolio_horizon', horizon);
  }, [horizon]);

  useEffect(() => {
    localStorage.setItem('ai_portfolio_risk', risk);
  }, [risk]);

  useEffect(() => {
    localStorage.setItem('ai_portfolio_objectives', JSON.stringify(debouncedObjectives));
  }, [debouncedObjectives]);

  useEffect(() => {
    localStorage.setItem('ai_portfolio_tokens', JSON.stringify(debouncedTokens));
  }, [debouncedTokens]);

  useEffect(() => {
    localStorage.setItem('ai_portfolio_bits', useBITS);
  }, [useBITS]);

  // Enhanced AI thinking animation with realistic timing
  useEffect(() => {
    if (aiThinking) {
      const interval = setInterval(() => {
        setStep(prev => {
          const nextStep = (prev + 1) % aiSteps.length;
          // Slower progression for more realistic feel
          return Math.random() > 0.7 ? nextStep : prev;
        });
      }, 1200);
      return () => clearInterval(interval);
    }
  }, [aiThinking]);

  // Real-time price updates
  useEffect(() => {
    const updatePrices = async () => {
      if (result?.allocations) {
        try {
          const tokens = result.allocations.map(a => a.token);
          const response = await axios.get(`${BACKEND_URL}/api/token-prices`, {
            params: { tokens: tokens.join(',') },
            timeout: 5000
          });
          setRealTimePrices(response.data);
        } catch (err) {
          console.warn('Price update failed:', err.message);
        }
      }
    };

    const interval = setInterval(updatePrices, 30000); // Update every 30 seconds
    updatePrices(); // Initial update
    return () => clearInterval(interval);
  }, [result]);

  // Load analysis history
  useEffect(() => {
    const history = localStorage.getItem('ai_portfolio_history');
    if (history) {
      try {
        setAnalysisHistory(JSON.parse(history));
      } catch {}
    }
  }, []);

  // Enhanced pie chart data with real-time prices
  const pieData = useMemo(() => {
    if (!result?.allocations) return [];
    return result.allocations.map((a) => {
      const currentPrice = realTimePrices[a.token] || a.priceUsd;
      const currentValue = currentPrice && a.estTokenAmount ? 
        currentPrice * a.estTokenAmount : a.usdAllocation;
      
      return { 
        name: a.token, 
        value: a.percent,
        reason: a.reason,
        usdValue: currentValue || a.usdAllocation,
        priceChange: currentPrice && a.priceUsd ? 
          ((currentPrice - a.priceUsd) / a.priceUsd * 100).toFixed(2) : 0
      };
    });
  }, [result, realTimePrices]);

  // Performance tracking data
  const performanceData = useMemo(() => {
    if (!analysisHistory.length) return [];
    return analysisHistory.slice(-10).map((analysis, index) => ({
      session: index + 1,
      score: analysis.score || 0,
      totalValue: analysis.allocations?.reduce((sum, a) => sum + (a.usdAllocation || 0), 0) || 0,
      timestamp: analysis.timestamp
    }));
  }, [analysisHistory]);

  // Enhanced form submission with better error handling
  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setAiThinking(true);
    setError("");
    setResult(null);
    setStep(0);
    
    try {
      // Enhanced AI thinking simulation with variable timing
      const thinkingTime = Math.random() * 2000 + 3000; // 3-5 seconds
      await new Promise(resolve => setTimeout(resolve, thinkingTime));
      
      const payload = { 
        budget: Number(budget), 
        horizon, 
        risk, 
        objectives, 
        tokenPreferences, 
        useBITS,
        timestamp: new Date().toISOString(),
        sessionId: Date.now().toString(36)
      };
      
      const { data } = await axios.post(
        `${BACKEND_URL}/api/generate-portfolio`, 
        payload, 
        { 
          timeout: 30000,
          signal: abortControllerRef.current.signal
        }
      );
      
      // Enhanced result with performance metrics
      const enhancedResult = {
        ...data,
        timestamp: new Date().toISOString(),
        sessionId: payload.sessionId,
        inputHash: btoa(JSON.stringify(payload)).slice(0, 8)
      };
      
      setResult(enhancedResult);
      
      // Update analysis history
      const newHistory = [...analysisHistory, enhancedResult].slice(-20); // Keep last 20
      setAnalysisHistory(newHistory);
      localStorage.setItem('ai_portfolio_history', JSON.stringify(newHistory));
      
      // Calculate performance metrics
      if (newHistory.length > 1) {
        const previous = newHistory[newHistory.length - 2];
        const current = enhancedResult;
        setPerformanceMetrics({
          scoreImprovement: (current.score || 0) - (previous.score || 0),
          diversificationChange: current.allocations.length - previous.allocations.length,
          riskAdjustment: risk !== previous.risk ? `${previous.risk} → ${risk}` : 'No change'
        });
      }
      
      try { 
        GA4_HELPERS.trackEvent('ai_portfolio_generate_enhanced', { 
          budget: Number(budget), 
          risk, 
          tokens: tokenPreferences.length,
          score: data.score 
        }); 
      } catch {}
      
    } catch (err) {
      if (err.name === 'AbortError') {
        setError("Analysis cancelled");
      } else {
        const errorMsg = err?.response?.data?.error || err.message || "AI system temporarily unavailable";
        setError(errorMsg);
        console.error('Portfolio generation error:', err);
      }
    } finally {
      setLoading(false);
      setAiThinking(false);
      abortControllerRef.current = null;
    }
  }, [budget, horizon, risk, objectives, tokenPreferences, useBITS, analysisHistory]);

  // Enhanced sharing with analytics
  const sharePortfolio = useCallback(async () => {
    try {
      if (!result) return;
      
      const shareData = {
        portfolioData: result,
        generatedAt: result.timestamp,
        shareId: `ai-${Date.now().toString(36)}`
      };
      
      const response = await axios.post(`${BACKEND_URL}/api/portfolio/share`, shareData);
      
      if (response.data.url) {
        await navigator.clipboard.writeText(response.data.url);
        setSavedOk("🔗 Shareable link copied to clipboard!");
      } else {
        // Fallback to URL encoding
        const enc = btoa(JSON.stringify(result));
        const url = `${window.location.origin}/ai-portfolio?result=${encodeURIComponent(enc)}`;
        await navigator.clipboard.writeText(url);
        setSavedOk("🔗 Portfolio link copied!");
      }
      
      try { GA4_HELPERS.trackEvent('ai_portfolio_share_enhanced'); } catch {}
      setTimeout(() => setSavedOk(""), 3000);
    } catch (err) {
      setSavedOk("❌ Share failed - please try again");
      setTimeout(() => setSavedOk(""), 3000);
    }
  }, [result]);

  // Enhanced save with versioning
  const savePortfolio = useCallback(async () => {
    try {
      if (!result) return;
      
      const saveKey = `ai_portfolio_saved_${Date.now()}`;
      const saveData = {
        ...result,
        savedAt: new Date().toISOString(),
        version: '2.0'
      };
      
      localStorage.setItem(saveKey, JSON.stringify(saveData));
      localStorage.setItem("ai_portfolio_latest", JSON.stringify(saveData));
      
      setSavedOk("💾 Portfolio saved with version history!");
      try { GA4_HELPERS.trackEvent('ai_portfolio_save_enhanced'); } catch {}
      setTimeout(() => setSavedOk(""), 3000);
    } catch (err) {
      setSavedOk("❌ Save failed - storage full");
      setTimeout(() => setSavedOk(""), 3000);
    }
  }, [result]);

  // Cancel analysis
  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
    setAiThinking(false);
    setError("Analysis cancelled by user");
  }, []);

  // Load from query param or localStorage on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const enc = params.get("result");
      if (enc) {
        const json = JSON.parse(atob(enc));
        if (json && json.allocations) {
          setResult(json);
          return;
        }
      }
      
      const latest = localStorage.getItem("ai_portfolio_latest");
      if (latest) {
        const parsed = JSON.parse(latest);
        if (parsed.version === '2.0') {
          setResult(parsed);
        }
      }
    } catch (err) {
      console.warn('Failed to load saved portfolio:', err);
    }
  }, []);

  return (
    <AIErrorBoundary>
      <div className="ai-modern-container">
          {/* Enhanced AI Header with Status */}
        <div className="ai-header">
          <div className="ai-logo">
            <div className="ai-brain-icon">🧠</div>
            <h1 className="ai-title">
              <span className="ai-gradient-text">AI Portfolio Analytics</span>
              <span className="ai-sub-text">Advanced Neural Architecture v2.0</span>
            </h1>
          </div>
          <div className="ai-status-indicator">
            <div className={`ai-pulse ${loading ? 'active' : ''}`}></div>
            <span className="ai-status-text">
              {loading ? 'Neural Processing...' : 'Ready for Analysis'}
            </span>
            {analysisHistory.length > 0 && (
              <span className="ai-history-count">
                {analysisHistory.length} analyses completed
              </span>
            )}
          </div>
        </div>

        {/* Blockchain Portfolio Overview */}
        {walletAddress && !blockchainData.loading && (
          <div className="ai-blockchain-overview">
            <div className="ai-blockchain-header">
              <h2>🔗 Your Blockchain Portfolio</h2>
              <button 
                onClick={blockchainData.refreshData}
                className="ai-refresh-btn"
                disabled={blockchainData.loading}
              >
                🔄 Refresh Data
              </button>
            </div>
            <div className="ai-blockchain-grid">
              <div className="ai-blockchain-card">
                <div className="ai-card-icon">💎</div>
                <div className="ai-card-content">
                  <div className="ai-card-label">Portfolio Value</div>
                  <div className="ai-card-value">${blockchainData.portfolioValue}</div>
                </div>
              </div>
              <div className="ai-blockchain-card">
                <div className="ai-card-icon">📈</div>
                <div className="ai-card-content">
                  <div className="ai-card-label">Performance</div>
                  <div className={`ai-card-value ${parseFloat(blockchainData.portfolioPerformance) >= 0 ? 'positive' : 'negative'}`}>
                    {parseFloat(blockchainData.portfolioPerformance) >= 0 ? '+' : ''}{blockchainData.portfolioPerformance}%
                  </div>
                </div>
              </div>
              <div className="ai-blockchain-card">
                <div className="ai-card-icon">🎮</div>
                <div className="ai-card-content">
                  <div className="ai-card-label">BITS Holdings</div>
                  <div className="ai-card-value">{blockchainData.bitsHolding} BITS</div>
                </div>
              </div>
              <div className="ai-blockchain-card">
                <div className="ai-card-icon">⚖️</div>
                <div className="ai-card-content">
                  <div className="ai-card-label">Risk Score</div>
                  <div className="ai-card-value">{blockchainData.riskScore}/10</div>
                </div>
              </div>
              <div className="ai-blockchain-card">
                <div className="ai-card-icon">🎯</div>
                <div className="ai-card-content">
                  <div className="ai-card-label">Diversification</div>
                  <div className="ai-card-value">{blockchainData.diversificationScore}/10</div>
                </div>
              </div>
              <div className="ai-blockchain-card">
                <div className="ai-card-icon">💰</div>
                <div className="ai-card-content">
                  <div className="ai-card-label">Total Invested</div>
                  <div className="ai-card-value">${blockchainData.totalInvested}</div>
                </div>
              </div>
            </div>
            {blockchainData.userTransactions && blockchainData.userTransactions.length > 0 && (
              <div className="ai-transaction-summary">
                <h3>📊 Recent Transactions</h3>
                <div className="ai-transaction-list">
                  {blockchainData.userTransactions.slice(0, 3).map((tx, index) => (
                    <div key={index} className="ai-transaction-item">
                      <div className="ai-tx-info">
                        <span className="ai-tx-amount">{parseFloat(tx.bitsAmount).toFixed(2)} BITS</span>
                        <span className="ai-tx-value">${parseFloat(tx.usdAmount).toFixed(2)}</span>
                      </div>
                      <div className="ai-tx-meta">
                        <span className="ai-tx-token">{tx.paymentSource}</span>
                        <span className="ai-tx-date">
                          {new Date(parseInt(tx.timestamp) * 1000).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Blockchain Loading State */}
        {walletAddress && blockchainData.loading && (
          <div className="ai-blockchain-loading">
            <div className="ai-loading-spinner"></div>
            <span>Loading blockchain portfolio data...</span>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="ai-main-grid">
          {/* Enhanced Input Panel */}
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
                      min={100} 
                      max={10000000}
                      step={100}
                      className="ai-input ai-input-glow"
                      placeholder="1000"
                      disabled={loading}
                    />
                    <span className="ai-currency">USD</span>
                  </div>
                  <small className="ai-input-hint">
                    Minimum: $100 • Maximum: $10M
                  </small>
                </label>
              </div>

              <div className="ai-input-group">
                <label className="ai-label">
                  <span className="ai-label-text">⏰ Investment Horizon</span>
                  <select 
                    value={horizon} 
                    onChange={(e) => setHorizon(e.target.value)}
                    className="ai-select"
                    disabled={loading}
                  >
                    <option value="<3 months">🚀 Short-term (&lt;3 months)</option>
                    <option value="6-12 months">📈 Medium-term (6-12 months)</option>
                    <option value=">1 year">💎 Long-term (&gt;1 year)</option>
                    <option value=">5 years">🏛️ Ultra long-term (&gt;5 years)</option>
                  </select>
                </label>
              </div>

              <div className="ai-input-group">
                <label className="ai-label">
                  <span className="ai-label-text">⚖️ Risk Tolerance</span>
                  <div className="ai-risk-selector">
                    {[
                      { key: 'conservative', emoji: '🛡️', desc: 'Low risk, stable returns' },
                      { key: 'moderate', emoji: '⚡', desc: 'Balanced risk-reward' },
                      { key: 'aggressive', emoji: '🔥', desc: 'High risk, high potential' },
                      { key: 'speculative', emoji: '🎲', desc: 'Maximum risk tolerance' }
                    ].map(riskLevel => (
                      <button
                        key={riskLevel.key}
                        type="button"
                        onClick={() => setRisk(riskLevel.key)}
                        className={`ai-risk-btn ${risk === riskLevel.key ? 'active' : ''}`}
                        disabled={loading}
                        title={riskLevel.desc}
                      >
                        <span className="ai-risk-emoji">{riskLevel.emoji}</span>
                        <span className="ai-risk-text">{riskLevel.key}</span>
                      </button>
                    ))}
                  </div>
                </label>
              </div>

              <div className="ai-input-group">
                <label className="ai-label">
                  <span className="ai-label-text">🎯 Investment Objectives</span>
                  <input
                    value={objectives.join(", ")}
                    onChange={(e) => setObjectives(
                      e.target.value.split(",").map(v => v.trim()).filter(Boolean)
                    )}
                    placeholder="growth, yield farming, diversification, passive income"
                    className="ai-input"
                    disabled={loading}
                  />
                  <small className="ai-input-hint">
                    Separate multiple objectives with commas
                  </small>
                </label>
              </div>

              <div className="ai-input-group">
                <label className="ai-label">
                  <span className="ai-label-text">🪙 Preferred Tokens</span>
                  <input
                    value={tokenPreferences.join(", ")}
                    onChange={(e) => setTokenPreferences(
                      e.target.value.split(",").map(v => v.trim().toUpperCase()).filter(Boolean)
                    )}
                    placeholder="STX, ALEX, xBTC, USDA, sBTC"
                    className="ai-input"
                    disabled={loading}
                  />
                  <small className="ai-input-hint">
                    Available: STX, ALEX, xBTC, USDA, sBTC
                  </small>
                </label>
              </div>

              <div className="ai-toggle-group">
                <label className="ai-toggle">
                  <input 
                    type="checkbox" 
                    checked={useBITS} 
                    onChange={(e) => setUseBITS(e.target.checked)}
                    className="ai-checkbox"
                    disabled={loading}
                  />
                  <span className="ai-toggle-slider"></span>
                  <span className="ai-toggle-text">
                    🎮 Include BITS Token Simulation
                    <small>Simulate portfolio performance with 1000 BITS tokens</small>
                  </span>
                </label>
              </div>

              <div className="ai-button-group">
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
                        AI Analyzing...
                      </>
                    ) : (
                      <>
                        <span className="ai-brain-emoji">🧠</span>
                        Generate AI Portfolio
                      </>
                    )}
                  </span>
                </button>
                
                {loading && (
                  <button 
                    type="button"
                    onClick={cancelAnalysis}
                    className="ai-cancel-btn"
                  >
                    ❌ Cancel Analysis
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Enhanced AI Thinking Animation */}
          {aiThinking && (
            <div className="ai-thinking-panel">
              <div className="ai-thinking-animation">
                <div className="ai-neural-network">
                  <div className="ai-neuron ai-neuron-1"></div>
                  <div className="ai-neuron ai-neuron-2"></div>
                  <div className="ai-neuron ai-neuron-3"></div>
                  <div className="ai-neuron ai-neuron-4"></div>
                  <div className="ai-neural-connection ai-connection-1"></div>
                  <div className="ai-neural-connection ai-connection-2"></div>
                  <div className="ai-neural-connection ai-connection-3"></div>
                  <div className="ai-neural-connection ai-connection-4"></div>
                </div>
                <div className="ai-thinking-text">
                  <h3>{aiSteps[step]}</h3>
                  <div className="ai-progress-bar">
                    <div 
                      className="ai-progress-fill" 
                      style={{width: `${((step + 1) / aiSteps.length) * 100}%`}}
                    ></div>
                  </div>
                  <div className="ai-thinking-stats">
                    <span>Processing {tokenPreferences.length} tokens</span>
                    <span>Budget: ${Number(budget).toLocaleString()}</span>
                    <span>Risk: {risk}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Error Display */}
          {error && (
            <div className="ai-error-panel">
              <div className="ai-error-icon">⚠️</div>
              <div className="ai-error-text">
                <h3>Neural Network Alert</h3>
                <p>{error}</p>
                <button 
                  onClick={() => setError("")}
                  className="ai-error-dismiss"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Enhanced Results Panel */}
          {result && !aiThinking && (
            <div className="ai-results-panel" ref={cardRef}>
              <div className="ai-panel-header">
                <h2 className="ai-panel-title">
                  <span className="ai-success-icon">✨</span>
                  AI-Generated Portfolio Analysis
                </h2>
                <div className="ai-success-score">
                  <span className="ai-score-label">AI Confidence</span>
                  <span className="ai-score-value">{result.score || 8}/10</span>
                </div>
              </div>

              {/* Performance Metrics */}
              {performanceMetrics && (
                <div className="ai-performance-panel">
                  <h3>📊 Performance Insights</h3>
                  <div className="ai-metrics-grid">
                    <div className="ai-metric">
                      <span className="ai-metric-label">Score Change</span>
                      <span className={`ai-metric-value ${performanceMetrics.scoreImprovement >= 0 ? 'positive' : 'negative'}`}>
                        {performanceMetrics.scoreImprovement >= 0 ? '+' : ''}{performanceMetrics.scoreImprovement.toFixed(1)}
                      </span>
                    </div>
                    <div className="ai-metric">
                      <span className="ai-metric-label">Diversification</span>
                      <span className="ai-metric-value">
                        {performanceMetrics.diversificationChange >= 0 ? '+' : ''}{performanceMetrics.diversificationChange} tokens
                      </span>
                    </div>
                    <div className="ai-metric">
                      <span className="ai-metric-label">Risk Profile</span>
                      <span className="ai-metric-value">{performanceMetrics.riskAdjustment}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Portfolio Visualization */}
              <div className="ai-visualization-grid">
                <div className="ai-chart-container">
                  <h3 className="ai-chart-title">Asset Allocation</h3>
                  <div className="ai-chart-wrapper">
                    <ResponsiveContainer width="100%" height={350}>
                      <PieChart>
                        <Pie 
                          data={pieData} 
                          dataKey="value" 
                          nameKey="name" 
                          outerRadius={130}
                          innerRadius={70}
                          paddingAngle={3}
                          animationBegin={0}
                          animationDuration={1500}
                        >
                          {pieData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={AI_COLORS[index % AI_COLORS.length]}
                              stroke="rgba(255,255,255,0.1)"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            background: 'rgba(0, 0, 0, 0.95)',
                            border: '1px solid #00D4FF',
                            borderRadius: '12px',
                            boxShadow: '0 0 30px rgba(0, 212, 255, 0.4)',
                            color: '#ffffff'
                          }}
                          formatter={(value, name, props) => [
                            `${value}% ($${props.payload.usdValue?.toFixed(2) || 'N/A'})`,
                            name
                          ]}
                        />
                        <Legend 
                          wrapperStyle={{ color: '#ffffff' }}
                          iconType="circle"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Performance History Chart */}
                {performanceData.length > 1 && (
                  <div className="ai-chart-container">
                    <h3 className="ai-chart-title">Analysis History</h3>
                    <div className="ai-chart-wrapper">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={performanceData}>
                          <XAxis 
                            dataKey="session" 
                            stroke="#ffffff"
                            fontSize={12}
                          />
                          <YAxis 
                            stroke="#ffffff"
                            fontSize={12}
                          />
                          <Tooltip 
                            contentStyle={{
                              background: 'rgba(0, 0, 0, 0.9)',
                              border: '1px solid #7B68EE',
                              borderRadius: '8px'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#00D4FF" 
                            strokeWidth={3}
                            dot={{ fill: '#00D4FF', strokeWidth: 2, r: 6 }}
                            activeDot={{ r: 8, stroke: '#00D4FF', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Enhanced Allocations List */}
                <div className="ai-allocations-list">
                  {result.allocations.map((allocation, index) => {
                    const currentPrice = realTimePrices[allocation.token] || allocation.priceUsd;
                    const priceChange = currentPrice && allocation.priceUsd ? 
                      ((currentPrice - allocation.priceUsd) / allocation.priceUsd * 100) : 0;
                    
                    return (
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
                          <div className="ai-token-values">
                            {allocation.usdAllocation && (
                              <div className="ai-usd-value">${allocation.usdAllocation}</div>
                            )}
                            {Math.abs(priceChange) > 0.1 && (
                              <div className={`ai-price-change ${priceChange >= 0 ? 'positive' : 'negative'}`}>
                                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                              </div>
                            )}
                          </div>
                        </div>
                        {allocation.reason && (
                          <div className="ai-allocation-reason">
                            <span className="ai-reason-icon">💡</span>
                            {allocation.reason}
                          </div>
                        )}
                        {allocation.priceUsd && allocation.estTokenAmount && (
                          <div className="ai-token-details">
                            ≈ {allocation.estTokenAmount} {allocation.token} @ ${currentPrice?.toFixed(4) || allocation.priceUsd}
                            {currentPrice && currentPrice !== allocation.priceUsd && (
                              <span className="ai-price-updated"> (updated)</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Enhanced Portfolio Metadata */}
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
                <div className="ai-meta-card">
                  <div className="ai-meta-icon">🎯</div>
                  <div className="ai-meta-content">
                    <div className="ai-meta-label">Diversification</div>
                    <div className="ai-meta-value">{result.allocations.length} assets</div>
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

              {/* Enhanced AI Summary */}
              {result.summary && (
                <div className="ai-summary-card">
                  <div className="ai-summary-header">
                    <span className="ai-summary-icon">🎯</span>
                    <h3>AI Strategy Analysis</h3>
                  </div>
                  <p className="ai-summary-text">{result.summary}</p>
                  {result.inputHash && (
                    <div className="ai-summary-meta">
                      Analysis ID: {result.inputHash} • Generated: {new Date(result.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced BITS Simulation */}
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
                        <span className="ai-bits-percent">
                          {((bits.bits / result.bitsSimulation.totalBITS) * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced Action Buttons */}
              <div className="ai-actions-grid">
                <button onClick={savePortfolio} className="ai-action-btn ai-save-btn">
                  <span className="ai-action-icon">💾</span>
                  Save Portfolio
                </button>
                <button onClick={sharePortfolio} className="ai-action-btn ai-share-btn">
                  <span className="ai-action-icon">🔗</span>
                  Share Analysis
                </button>
                <button 
                  onClick={() => window.print()} 
                  className="ai-action-btn ai-print-btn"
                >
                  <span className="ai-action-icon">🖨️</span>
                  Export Report
                </button>
                <button 
                  onClick={() => {
                    setResult(null);
                    setError("");
                    setPerformanceMetrics(null);
                  }}
                  className="ai-action-btn ai-reset-btn"
                >
                  <span className="ai-action-icon">🔄</span>
                  New Analysis
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
    </AIErrorBoundary>
  );
}
