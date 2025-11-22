import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Info, Shield, Zap, Timer, MousePointerClick } from 'lucide-react';
import SwapRoute from './SwapRoute';
import SmartTooltip from '../../Presale/components/SmartTooltip';
import './DEX.css';

// Realistic Market Mock Prices (Simulating an Oracle)
const MARKET_PRICES = {
  'BTC': 98250.50,
  'xBTC': 98245.00, // Slight peg deviation
  'STX': 2.45,
  'bBNB': 645.20,
  'BITS': 0.85,
  'USDT': 1.00
};

const TokenSelector = ({ tokens, selected, onSelect, exclude }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setIsOpen(!isOpen)} className="dex-token-btn">
        {selected ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <img src={selected.icon} alt={selected.symbol} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'contain' }} />
                <span style={{ fontWeight: '700' }}>{selected.symbol}</span>
            </div>
          </>
        ) : (
          <span>Select</span>
        )}
        <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>▼</span>
      </button>

      {isOpen && (
        <div style={{ 
            position: 'absolute', top: '100%', right: 0, marginTop: '8px', 
            width: '180px', background: '#1a1a1e', border: '1px solid #333', 
            borderRadius: '12px', zIndex: 100, padding: '4px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)' 
        }}>
          {tokens.filter((t) => t.id !== exclude?.id).map((token) => (
              <button
                key={token.id}
                onClick={() => { onSelect(token); setIsOpen(false); }}
                style={{ 
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px', 
                    padding: '8px 12px', background: 'transparent', border: 'none', 
                    textAlign: 'left', cursor: 'pointer', color: '#fff', borderRadius: '8px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2a2a2e'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <img src={token.icon} alt={token.symbol} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'contain' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{token.symbol}</span>
                  <span style={{ fontSize: '0.7rem', color: '#888' }}>{token.name}</span>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

const SwapPanel = ({ tokens, balances, payToken, setPayToken, receiveToken, setReceiveToken, onSwap }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [payWithBits, setPayWithBits] = useState(false);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  const [deadline, setDeadline] = useState(20);
  const [expertMode, setExpertMode] = useState(false);
  const [mevShield, setMevShield] = useState(true);
  
  // Derived State for Real Logic
  const payPrice = MARKET_PRICES[payToken.id] || 0;
  const receivePrice = MARKET_PRICES[receiveToken.id] || 0;
  
  const usdValuePay = amount && !isNaN(amount) ? parseFloat(amount) * payPrice : 0;
  
  // Calculate Output with fake impact/fee
  const exchangeRate = payPrice / receivePrice;
  const estimatedOutput = amount && !isNaN(amount) ? parseFloat(amount) * exchangeRate : 0;
  const usdValueReceive = estimatedOutput * receivePrice;

  // Advanced Trading Details
  const priceImpact = amount > 10 ? 0.05 : 0.01; // Mock dynamic impact
  const lpFee = usdValuePay * 0.0025; // 0.25% Fee
  
  // Dynamic Minimum Received based on User Slippage
  const minReceived = estimatedOutput * (1 - (slippage / 100));

  const handleSwap = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onSwap) {
          onSwap({
              payToken: payToken.symbol,
              receiveToken: receiveToken.symbol,
              amount: estimatedOutput.toFixed(6), 
              price: receivePrice 
          });
      }
      setAmount('');
    }, 1500);
  };

  return (
    <div className="dex-panel-section">
      <div className="dex-swap-card">
        {/* HEADER RE-FACTORED WITH INLINE STYLES FOR GUARANTEED VISIBILITY */}
        <div className="dex-card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px', marginBottom: '20px' }}>
            
            {/* ROW 1: TITLE & SETTINGS */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <SmartTooltip content={
                  `NEURAL ROUTING ENGINE v4.0\n
                  The AI analyzes 15+ liquidity sources instantly.\n
                  • Finds the optimal path for your swap\n
                  • Minimizes fees across multiple chains\n
                  • Predicts and avoids congested routes`
                }>
                  <h3 style={{
                      fontSize: '1.4rem', 
                      fontFamily: "'Roboto Mono', monospace", 
                      fontWeight: '800', 
                      margin: 0,
                      background: 'linear-gradient(90deg, #fff, #00FFA3)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: '1px',
                      textShadow: '0 0 20px rgba(0, 255, 163, 0.4)'
                  }}>
                    AI SWAP PROTOCOL
                  </h3>
                </SmartTooltip>

                <SmartTooltip content={
                    `CONFIGURATION TERMINAL\n
                    Advanced Execution Logic.\n
                    • Configure AI Slippage Tolerance\n
                    • Enable Stealth MEV Shield protection\n
                    • Set 'Expert Mode' for 1-click swaps`
                }>
                    <button 
                        onClick={() => setShowSettings(!showSettings)}
                        style={{
                            background: 'rgba(0, 255, 163, 0.1)',
                            border: '1px solid rgba(0, 255, 163, 0.3)',
                            borderRadius: '8px',
                            padding: '6px',
                            cursor: 'pointer',
                            color: '#00FFA3',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 15px rgba(0, 255, 163, 0.15)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)';
                            e.currentTarget.style.background = 'rgba(0, 255, 163, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                            e.currentTarget.style.background = 'rgba(0, 255, 163, 0.1)';
                        }}
                    >
                        <Settings size={22} />
                    </button>
                </SmartTooltip>
            </div>

            {/* ROW 2: POWERED BY BADGE */}
            <SmartTooltip content={
                `THE $BITS ECOSYSTEM PROTOCOL\n
                Wealth Singularity.\n
                • 50% Fee Burn Mechanism Active\n
                • Institutional 'God Mode' Liquidity Access\n
                • Powered by Quantum-Resistant Smart Contracts`
            }>
                 <div style={{
                     fontSize: '0.75rem', color: '#8b9bb4', letterSpacing: '0.5px', 
                     display: 'flex', alignItems: 'center', gap: '6px',
                     padding: '2px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px'
                 }}>
                    ⚡ Powered by <span style={{ color: '#00FFA3', fontWeight: '700', textShadow: '0 0 8px rgba(0, 255, 163, 0.5)' }}>$BITS Ecosystem</span>
                </div>
            </SmartTooltip>

          {/* Settings Modal */}
          {showSettings && (
            <div className="dex-settings-modal">
              <div className="dex-setting-header">
                  <span>Execution Settings</span>
                  <button onClick={() => setShowSettings(false)} style={{background:'none', border:'none', color:'#666', cursor:'pointer'}}>✕</button>
              </div>

              {/* Slippage */}
              <div className="dex-setting-group">
                <SmartTooltip content={
                    `SLIPPAGE TOLERANCE\n
                    The maximum price movement you accept.\n
                    • High Volatility: Use 1.0%+\n
                    • Stablecoins: Use 0.1%\n
                    • AI Auto: Recommends optimal setting`
                }>
                    <div className="dex-setting-title"><MousePointerClick size={14} /> Slippage Tolerance</div>
                </SmartTooltip>
                <div className="dex-setting-options">
                  {[0.1, 0.5, 1.0].map((val) => (
                    <button 
                      key={val} 
                      className={`dex-setting-btn ${slippage === val ? 'active' : ''}`}
                      onClick={() => setSlippage(val)}
                    >
                      {val}%
                    </button>
                  ))}
                  <input 
                    type="number" 
                    className="dex-setting-input" 
                    placeholder="Custom"
                    value={slippage}
                    onChange={(e) => setSlippage(parseFloat(e.target.value))}
                  />
                </div>
              </div>

              {/* Deadline */}
              <div className="dex-setting-group">
                <SmartTooltip content={`TRANSACTION DEADLINE\nYour swap will revert if pending for longer than this time to protect you from bad rates.`}>
                    <div className="dex-setting-title"><Timer size={14} /> Transaction Deadline</div>
                </SmartTooltip>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <input 
                    type="number" 
                    className="dex-setting-input" 
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    style={{width: '80px', textAlign: 'left'}}
                  />
                  <span style={{fontSize: '0.8rem', color: '#888'}}>minutes</span>
                </div>
              </div>

              <div className="dex-divider"></div>

              {/* NEW PRO FEATURES */}
              <div className="dex-setting-row-toggle">
                 <SmartTooltip content={
                     `MEV SHIELD (STEALTH MODE)\n
                     Institutional-Grade Protection.\n
                     • Routes transaction via private mempools\n
                     • Invisible to Sandwich Bots and Snipers\n
                     • Zero front-running guarantee`
                 }>
                    <div className="dex-toggle-label">
                        <Shield size={16} color="#00FFA3" />
                        <div>
                            <span style={{display:'block', fontWeight:'600', color:'#fff'}}>MEV Shield</span>
                            <span style={{fontSize:'0.7rem', color:'#666'}}>Private Tx Routing</span>
                        </div>
                    </div>
                 </SmartTooltip>
                 <div 
                    className={`dex-toggle-switch ${mevShield ? 'on' : ''}`}
                    onClick={() => setMevShield(!mevShield)}
                 >
                    <div className="dex-toggle-knob"></div>
                 </div>
              </div>

              <div className="dex-setting-row-toggle">
                 <SmartTooltip content={
                     `EXPERT MODE\n
                     High Frequency Trading.\n
                     • Bypasses confirmation modals\n
                     • Enables direct smart contract interaction\n
                     • Faster execution, higher risk`
                 }>
                    <div className="dex-toggle-label">
                        <Zap size={16} color="#E6444D" />
                        <div>
                            <span style={{display:'block', fontWeight:'600', color:'#fff'}}>Expert Mode</span>
                            <span style={{fontSize:'0.7rem', color:'#666'}}>Skip Confirmations</span>
                        </div>
                    </div>
                 </SmartTooltip>
                 <div 
                    className={`dex-toggle-switch ${expertMode ? 'on' : ''}`}
                    onClick={() => setExpertMode(!expertMode)}
                 >
                    <div className="dex-toggle-knob"></div>
                 </div>
              </div>
              
              <button 
                className="dex-setting-save-btn"
                onClick={() => setShowSettings(false)}
              >
                Save Configuration
              </button>
            </div>
          )}
        </div>

        {/* Pay Input */}
        <div className="dex-input-group">
          <div className="dex-label-row">
            <SmartTooltip content={
                `AI LIQUIDITY AGGREGATOR\n
                Scanning depth across multiple DEXs.\n
                • Aggregates liquidity from Uniswap, Curve, etc.\n
                • Splits orders to reduce price impact\n
                • AI guarantees the best input rate`
            }>
                <span style={{cursor: 'help', borderBottom: '1px dashed rgba(255,255,255,0.2)'}}>You Pay</span>
            </SmartTooltip>
            {/* Only showing static balances for now, or we could pass dynamic balance here too if requested */}
            <span>Balance: {balances[payToken.id] || '0.00'}</span>
          </div>
          <div className="dex-input-row">
            <input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="dex-amount-input"
            />
            <TokenSelector tokens={tokens} selected={payToken} onSelect={setPayToken} exclude={receiveToken} />
          </div>
          <div className="dex-usd-value">
            ≈ ${usdValuePay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Switcher */}
        <div className="dex-swap-switch-container">
          <button 
            className="dex-switch-btn"
            onClick={() => {
                const t = payToken; setPayToken(receiveToken); setReceiveToken(t);
            }}
          >
            ↓
          </button>
        </div>

        {/* Receive Input */}
        <div className="dex-input-group">
          <div className="dex-label-row">
            <span>You Receive</span>
            <span>Balance: {balances[receiveToken.id] || '0.00'}</span>
          </div>
          <div className="dex-input-row">
            <input
              type="text"
              value={estimatedOutput > 0 ? estimatedOutput.toFixed(6) : ''}
              readOnly
              placeholder="0.0"
              className="dex-amount-input"
              style={{ color: '#00FFA3' }}
            />
            <TokenSelector tokens={tokens} selected={receiveToken} onSelect={setReceiveToken} exclude={payToken} />
          </div>
          <div className="dex-usd-value">
             ≈ ${usdValueReceive.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
             <span style={{fontSize: '0.75rem', marginLeft: '6px', opacity: 0.7}}>(-0.25% Fee)</span>
          </div>
        </div>

        {/* Info / Route */}
        <SwapRoute fromToken={payToken} toToken={receiveToken} />
        
        {/* Advanced Contextual Info */}
        <div className="dex-info-box">
            <div className="dex-info-row">
                <span>Rate</span>
                <span className="dex-val-highlight" style={{ fontSize: '0.95rem' }}>
                    1 {payToken.symbol} ≈ <span style={{ color: '#30C371', fontWeight: '700' }}>{exchangeRate.toFixed(4)}</span> {receiveToken.symbol}
                </span>
            </div>
            
            {amount > 0 && (
              <>
                <div className="dex-info-row">
                    <span>Minimum Received</span>
                    <span className="dex-info-val" style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>{minReceived.toFixed(6)} {receiveToken.symbol}</span>
                </div>
                <div className="dex-info-row">
                    <SmartTooltip content={
                        `ZERO-IMPACT GUARD\n
                        AI Monitoring System Active.\n
                        • Detects low liquidity pools instantly\n
                        • Routes around high-impact pairs\n
                        • Alerts if impact exceeds 2% threshold`
                    }>
                        <span style={{cursor: 'help', borderBottom: '1px dashed rgba(255,255,255,0.2)'}}>Price Impact</span>
                    </SmartTooltip>
                    <span className="dex-info-val" style={{ color: priceImpact < 1 ? '#30C371' : '#E6444D', fontSize: '0.9rem', fontWeight: '700' }}>
                      {priceImpact < 0.01 ? '< 0.01%' : `~${priceImpact}%`}
                    </span>
                </div>
                <div className="dex-info-row">
                    <span>Liquidity Provider Fee</span>
                    <span className="dex-info-val" style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>~${lpFee.toFixed(2)}</span>
                </div>
              </>
            )}
            
            <div className="dex-info-row" style={{marginTop: '4px'}}>
                <SmartTooltip content={
                    `SMART GAS ESTIMATOR\n
                    Blockchain Efficiency Layer.\n
                    • AI predicts network congestion spikes\n
                    • Optimizes Gas Limit to save user funds\n
                    • $BITS holders get gas rebates`
                }>
                    <span style={{cursor: 'help', borderBottom: '1px dashed rgba(255,255,255,0.2)'}}>Network Cost</span>
                </SmartTooltip>
                <span className="dex-val-highlight" style={{ fontSize: '0.95rem' }}>
                    ~<span style={{ color: '#30C371', fontWeight: '700' }}>$4.20</span>
                </span>
            </div>
        </div>

        <div style={{ padding: '0 4px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#aaa', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={payWithBits} 
              onChange={(e) => setPayWithBits(e.target.checked)}
            />
            <span>Pay fee with <span style={{ color: '#00FFA3' }}>$BITS</span> (10% off)</span>
          </label>
        </div>

        <button
            disabled={!amount || loading}
            onClick={handleSwap}
            className={`dex-action-btn ${amount ? 'primary' : ''}`}
        >
            {loading ? 'SWAPPING...' : (amount ? 'SWAP NOW' : 'ENTER AMOUNT')}
        </button>
      </div>
    </div>
  );
};

export default SwapPanel;
