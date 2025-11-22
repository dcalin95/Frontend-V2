import React, { useState, useEffect, useMemo } from 'react';
import SwapRoute from './SwapRoute';
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
        {/* Header */}
        <div className="dex-card-header">
          <h3 className="dex-card-title">Swap</h3>
          <div className="dex-card-actions">
            <button onClick={() => setShowSettings(!showSettings)}>⚙️</button>
          </div>

          {/* Settings Modal */}
          {showSettings && (
            <div className="dex-settings-modal">
              <div className="dex-setting-group">
                <div className="dex-setting-title">Slippage Tolerance <span>ℹ️</span></div>
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
              <div className="dex-setting-group" style={{marginBottom: 16}}>
                <div className="dex-setting-title">Transaction Deadline</div>
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
              
              <button 
                className="dex-setting-save-btn"
                onClick={() => setShowSettings(false)}
              >
                Save Settings
              </button>
            </div>
          )}
        </div>

        {/* Pay Input */}
        <div className="dex-input-group">
          <div className="dex-label-row">
            <span>You Pay</span>
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
                    <span>Price Impact</span>
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
                <span>Network Cost</span>
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
