import React, { useState } from 'react';
import { Activity, TrendingUp, Shield, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import '../styles/WealthEngineTester.css';

/**
 * Wealth Engine Technical Tester
 * Interactive cards for testing AI Wealth Engine modules
 */
const WealthEngineTester = () => {
  // Test States
  const [rebalanceStatus, setRebalanceStatus] = useState('idle'); // idle, running, success, error
  const [regimeDetected, setRegimeDetected] = useState('unknown');
  const [microTradeCount, setMicroTradeCount] = useState(0);
  const [aiLearningCycle, setAiLearningCycle] = useState(0);
  const [safetyChecks, setSafetyChecks] = useState({
    dailyLimit: false,
    drawdown: false,
    slippage: false,
    killSwitch: false
  });

  // Mock Portfolio Data
  const [portfolioData, setPortfolioData] = useState({
    total: 142590.00,
    allocation: {
      BTC: 35.5,
      ETH: 28.2,
      BITS: 20.0,
      Stablecoins: 16.3
    },
    targetAllocation: {
      BTC: 40.0,
      ETH: 30.0,
      BITS: 20.0,
      Stablecoins: 10.0
    }
  });

  /**
   * Test 1: Rebalancing Engine
   */
  const testRebalancing = async () => {
    setRebalanceStatus('running');
    toast.info('🔄 Starting portfolio rebalancing...');

    // Simulate rebalancing process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update allocation towards target
    const newAllocation = {
      BTC: Math.min(portfolioData.allocation.BTC + 2, portfolioData.targetAllocation.BTC),
      ETH: Math.min(portfolioData.allocation.ETH + 1, portfolioData.targetAllocation.ETH),
      BITS: portfolioData.allocation.BITS,
      Stablecoins: Math.max(portfolioData.allocation.Stablecoins - 3, portfolioData.targetAllocation.Stablecoins)
    };

    setPortfolioData(prev => ({
      ...prev,
      allocation: newAllocation
    }));

    setRebalanceStatus('success');
    toast.success('✅ Rebalancing completed successfully!');

    setTimeout(() => setRebalanceStatus('idle'), 3000);
  };

  /**
   * Test 2: Market Regime Classifier
   */
  const testRegimeDetection = async () => {
    toast.info('📈 Analyzing market regime...');

    // Simulate regime detection
    await new Promise(resolve => setTimeout(resolve, 1500));

    const regimes = ['bullish', 'bearish', 'sideways', 'high-volatility', 'recovery'];
    const detected = regimes[Math.floor(Math.random() * regimes.length)];
    
    setRegimeDetected(detected);
    toast.success(`Market regime detected: ${detected.toUpperCase()}`);
  };

  /**
   * Test 3: Micro-Adjustment System
   */
  const testMicroTrade = async () => {
    toast.info('⚙️ Executing micro-trade...');

    await new Promise(resolve => setTimeout(resolve, 1000));

    setMicroTradeCount(prev => prev + 1);
    
    // Small random adjustment
    const randomAsset = ['BTC', 'ETH', 'BITS'][Math.floor(Math.random() * 3)];
    const adjustment = (Math.random() * 0.5).toFixed(2);
    
    toast.success(`✅ Micro-trade executed: +${adjustment}% ${randomAsset}`);
  };

  /**
   * Test 4: AI Learning Loop
   */
  const testLearningCycle = async () => {
    toast.info('🧠 Running AI learning cycle...');

    await new Promise(resolve => setTimeout(resolve, 2000));

    setAiLearningCycle(prev => prev + 1);
    
    const improvements = [
      'Strategy selection accuracy +2.1%',
      'Timing optimization improved',
      'Risk threshold calibrated',
      'Allocation weights adjusted'
    ];
    
    const improvement = improvements[Math.floor(Math.random() * improvements.length)];
    toast.success(`🎯 Learning cycle complete: ${improvement}`);
  };

  /**
   * Test 5: Safety Mechanisms
   */
  const testSafetyCheck = async (checkType) => {
    toast.info(`🛡️ Testing ${checkType} protection...`);

    await new Promise(resolve => setTimeout(resolve, 800));

    setSafetyChecks(prev => ({
      ...prev,
      [checkType]: true
    }));

    toast.success(`✅ ${checkType.toUpperCase()} check passed!`);

    setTimeout(() => {
      setSafetyChecks(prev => ({
        ...prev,
        [checkType]: false
      }));
    }, 5000);
  };

  /**
   * Reset All Tests
   */
  const resetTests = () => {
    setRebalanceStatus('idle');
    setRegimeDetected('unknown');
    setMicroTradeCount(0);
    setAiLearningCycle(0);
    setSafetyChecks({
      dailyLimit: false,
      drawdown: false,
      slippage: false,
      killSwitch: false
    });
    toast.info('🔄 All tests reset');
  };

  const getRegimeColor = (regime) => {
    const colors = {
      bullish: '#00FFA3',
      bearish: '#E6444D',
      sideways: '#8b9bb4',
      'high-volatility': '#FFC107',
      recovery: '#4FACFE',
      unknown: '#666'
    };
    return colors[regime] || '#666';
  };

  const getRegimeIcon = (regime) => {
    switch(regime) {
      case 'bullish': return '🟢';
      case 'bearish': return '🔴';
      case 'sideways': return '⚪';
      case 'high-volatility': return '🟡';
      case 'recovery': return '🔵';
      default: return '❓';
    }
  };

  return (
    <div className="wealth-tester-container">
      <div className="tester-header">
        <Activity size={32} style={{ color: '#00FFA3' }} />
        <h1>Wealth Engine Technical Tester</h1>
        <p className="tester-subtitle">Interactive testing cards for AI modules</p>
      </div>

      <button className="reset-btn" onClick={resetTests}>
        Reset All Tests
      </button>

      {/* Portfolio Overview */}
      <div className="test-card portfolio-card">
        <h3>📊 Current Portfolio</h3>
        <div className="portfolio-total">
          <span className="label">Total Value:</span>
          <span className="value">${portfolioData.total.toLocaleString()}</span>
        </div>
        
        <div className="allocation-grid">
          {Object.entries(portfolioData.allocation).map(([asset, percent]) => (
            <div key={asset} className="allocation-item">
              <div className="allocation-header">
                <span className="asset-name">{asset}</span>
                <span className="allocation-percent">{percent.toFixed(1)}%</span>
              </div>
              <div className="allocation-bar-container">
                <div 
                  className="allocation-bar" 
                  style={{ width: `${percent}%`, background: '#00FFA3' }}
                ></div>
                <div 
                  className="target-marker" 
                  style={{ left: `${portfolioData.targetAllocation[asset]}%` }}
                  title={`Target: ${portfolioData.targetAllocation[asset]}%`}
                ></div>
              </div>
              <span className="target-label">Target: {portfolioData.targetAllocation[asset]}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Test Cards Grid */}
      <div className="test-cards-grid">
        
        {/* Card 1: Rebalancing Engine */}
        <div className="test-card">
          <div className="card-icon">
            <TrendingUp size={24} style={{ color: '#00FFA3' }} />
          </div>
          <h3>Rebalancing Engine</h3>
          <p>Test incremental portfolio rebalancing towards target allocation.</p>
          
          <button 
            className={`test-btn ${rebalanceStatus === 'running' ? 'loading' : ''}`}
            onClick={testRebalancing}
            disabled={rebalanceStatus === 'running'}
          >
            {rebalanceStatus === 'running' ? '⏳ Rebalancing...' : '▶️ Run Rebalancing'}
          </button>
          
          {rebalanceStatus === 'success' && (
            <div className="status-badge success">
              <CheckCircle size={16} /> Completed
            </div>
          )}
        </div>

        {/* Card 2: Market Regime Classifier */}
        <div className="test-card">
          <div className="card-icon">
            <Activity size={24} style={{ color: '#4FACFE' }} />
          </div>
          <h3>Market Regime Classifier</h3>
          <p>Detect current market environment and adjust strategies.</p>
          
          <button 
            className="test-btn"
            onClick={testRegimeDetection}
          >
            📊 Detect Regime
          </button>
          
          {regimeDetected !== 'unknown' && (
            <div 
              className="regime-display"
              style={{ 
                background: `${getRegimeColor(regimeDetected)}20`,
                border: `1px solid ${getRegimeColor(regimeDetected)}40`
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{getRegimeIcon(regimeDetected)}</span>
              <span style={{ color: getRegimeColor(regimeDetected), fontWeight: 700 }}>
                {regimeDetected.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Card 3: Micro-Adjustment System */}
        <div className="test-card">
          <div className="card-icon">
            <Zap size={24} style={{ color: '#FFC107' }} />
          </div>
          <h3>Micro-Adjustment System</h3>
          <p>Execute small periodic trades to optimize portfolio gradually.</p>
          
          <button 
            className="test-btn"
            onClick={testMicroTrade}
          >
            ⚡ Execute Micro-Trade
          </button>
          
          <div className="counter-display">
            <span className="counter-label">Trades Executed:</span>
            <span className="counter-value">{microTradeCount}</span>
          </div>
        </div>

        {/* Card 4: AI Learning Loop */}
        <div className="test-card">
          <div className="card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00FFA3" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h3>AI Learning Loop</h3>
          <p>Test AI self-improvement and strategy optimization cycle.</p>
          
          <button 
            className="test-btn"
            onClick={testLearningCycle}
          >
            🧠 Run Learning Cycle
          </button>
          
          <div className="counter-display">
            <span className="counter-label">Cycles Completed:</span>
            <span className="counter-value">{aiLearningCycle}</span>
          </div>
        </div>

        {/* Card 5: Safety Mechanisms */}
        <div className="test-card full-width">
          <div className="card-icon">
            <Shield size={24} style={{ color: '#E6444D' }} />
          </div>
          <h3>Safety Mechanisms</h3>
          <p>Test various safety checks and fail-safe protections.</p>
          
          <div className="safety-grid">
            <button 
              className={`safety-btn ${safetyChecks.dailyLimit ? 'active' : ''}`}
              onClick={() => testSafetyCheck('dailyLimit')}
            >
              {safetyChecks.dailyLimit ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              Daily Limit
            </button>
            <button 
              className={`safety-btn ${safetyChecks.drawdown ? 'active' : ''}`}
              onClick={() => testSafetyCheck('drawdown')}
            >
              {safetyChecks.drawdown ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              Drawdown Protection
            </button>
            <button 
              className={`safety-btn ${safetyChecks.slippage ? 'active' : ''}`}
              onClick={() => testSafetyCheck('slippage')}
            >
              {safetyChecks.slippage ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              Slippage Check
            </button>
            <button 
              className={`safety-btn ${safetyChecks.killSwitch ? 'active' : ''}`}
              onClick={() => testSafetyCheck('killSwitch')}
            >
              {safetyChecks.killSwitch ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              Kill Switch
            </button>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="tester-footer">
        <AlertCircle size={18} style={{ color: '#FFC107' }} />
        <p>
          <strong>Note:</strong> This is a testing environment with simulated data. 
          Real execution requires wallet connection and proper authorization.
        </p>
      </div>
    </div>
  );
};

export default WealthEngineTester;

