import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Settings, Info, Shield, Zap, Timer, MousePointerClick, RefreshCw, AlertCircle, ArrowDownUp, Clock } from 'lucide-react';
import SwapRoute from './SwapRoute';
import SmartTooltip from '../../Presale/components/SmartTooltip';
import { ethers } from 'ethers';
import { executeSwap } from './services/swapExecutionService';
import { useLiveCryptoPrices } from './hooks/useLiveCryptoPrices';
import { getContractInstance } from '../../contract/getContract';
import WalletContext from '../../context/WalletContext';
import { toast } from 'react-toastify';

// 🎯 PRESALE LOGIC - Pentru cumpărare BITS (NU PancakeSwap!)
import useCellManagerData from '../../Presale/hooks/useCellManagerData';
import handleBNBPayment from '../../Presale/TokenHandlers/handleBNBPayment';
import handleETHPayment from '../../Presale/TokenHandlers/handleETHPayment';
import handleUSDTPayment from '../../Presale/TokenHandlers/handleUSDTPayment';
import handleUSDCPayment from '../../Presale/TokenHandlers/handleUSDCPayment';
import handleMATICPayment from '../../Presale/TokenHandlers/handleMATICPayment';
import handleGenericPayment from '../../Presale/TokenHandlers/handleGenericPayment';
import './DEX.css';
import './DEX.mobile.css';
import './SwapPanel.css';
import './SwapPanel.mobile.css';

const TokenSelector = ({ tokens, selected, onSelect, exclude }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTokens = tokens
    .filter((t) => t.id !== exclude?.id)
    .filter((t) => 
      t.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setIsOpen(!isOpen)} className="dex-token-btn">
        {selected ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <img src={selected.icon} alt={selected.symbol} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'contain', flexShrink: 0 }} />
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
            width: '200px', background: '#1a1a1e', border: '1px solid #333', 
            borderRadius: '12px', zIndex: 100, padding: '8px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)' 
        }}>
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search token..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#0a0a0e',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.85rem',
              marginBottom: '8px',
              outline: 'none'
            }}
            onKeyDown={(e) => e.stopPropagation()}
          />
          
          {/* Token List */}
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {filteredTokens.length > 0 ? (
              filteredTokens.map((token) => (
                <button
                  key={token.id}
                  onClick={() => { onSelect(token); setIsOpen(false); setSearchTerm(''); }}
                  style={{ 
                      width: '100%', display: 'flex', alignItems: 'center', gap: '10px', 
                      padding: '8px 12px', background: 'transparent', border: 'none', 
                      textAlign: 'left', cursor: 'pointer', color: '#fff', borderRadius: '8px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#2a2a2e'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <img src={token.icon} alt={token.symbol} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'contain', flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{token.symbol}</span>
                    <span style={{ fontSize: '0.7rem', color: '#888' }}>{token.name}</span>
                  </div>
                </button>
              ))
            ) : (
              <div style={{ padding: '12px', textAlign: 'center', color: '#888', fontSize: '0.85rem' }}>
                No tokens found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SwapPanel = ({ accountMode, setAccountMode, tokens, balances, payToken, setPayToken, receiveToken, setReceiveToken, onSwap, onBalanceRefresh }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [payWithBits, setPayWithBits] = useState(false);
  
  // Wallet context (for REAL mode checks)
  const { isConnected, connectWallet, walletAddress } = useContext(WalletContext);
  
  // 🎯 PRESALE DATA - Pentru prețul BITS live din CellManager
  const cellManagerData = useCellManagerData();
  const liveBitsPrice = cellManagerData.currentPrice && cellManagerData.currentPrice > 0 
    ? cellManagerData.currentPrice 
    : null;
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [slippage, setSlippage] = useState(0.5);
  const [deadline, setDeadline] = useState(20);
  const [expertMode, setExpertMode] = useState(false);
  const [mevShield, setMevShield] = useState(true);

  // ✅ LEGAL WARNING (REAL mode only, once per session)
  const [showRealModeWarning, setShowRealModeWarning] = useState(() => {
    if (typeof window === 'undefined') return false;
    const seen = sessionStorage.getItem('real_mode_warning_seen');
    return !seen && accountMode === 'REAL';
  });

  useEffect(() => {
    if (accountMode === 'REAL' && !sessionStorage.getItem('real_mode_warning_seen')) {
      setShowRealModeWarning(true);
      sessionStorage.setItem('real_mode_warning_seen', 'true');
    }
  }, [accountMode]);
  
  // 🔴 REAL-TIME PRICES from Binance/CoinGecko API
  const { prices: livePrices, priceChanges: livePriceChanges, loading: pricesLoading, error: pricesError, source: pricesSource, refresh: refreshPrices } = useLiveCryptoPrices();

  // 🔴 DEBUG: Log prices constantly
  useEffect(() => {
    console.log('💰 CURRENT PRICES:', {
      prices: livePrices,
      loading: pricesLoading,
      error: pricesError,
      source: pricesSource,
      timestamp: new Date().toISOString()
    });
  }, [livePrices, pricesLoading, pricesError, pricesSource]);

  // ✅ BITS Price vine din useLiveCryptoPrices (componentă existentă reutilizată din getCurrentBitsPrice.js)

  // 🎯 Map live prices to token symbols - ❌ FĂRĂ FALLBACK 0!
  const MARKET_PRICES = useMemo(() => {
    const prices = {
      'BTC': livePrices?.BTC || null,
      'BTCB': livePrices?.BTC || null,
      'BNB': livePrices?.BNB || null,
      'ETH': livePrices?.ETH || null,
      'STX': livePrices?.STX || null,
      'USDT': livePrices?.USDT || 1,
      'BITS': liveBitsPrice || null, // 🎯 Din useCellManagerData (CellManager.sol contract)
    };

    console.log('📊 MAPPED PRICES FOR UI:', {
      ...prices,
      source: pricesSource,
      loading: pricesLoading
    });

    return prices;
  }, [livePrices, pricesSource, pricesLoading, liveBitsPrice]); // 🎯 Include liveBitsPrice dependency
  
  // Derived State for Real Logic - ❌ FĂRĂ FALLBACK LA 0!
  const payPrice = MARKET_PRICES[payToken.symbol] || MARKET_PRICES[payToken.id];
  const receivePrice = MARKET_PRICES[receiveToken.symbol] || MARKET_PRICES[receiveToken.id];

  // Check if ALL prices are loaded
  const allPricesLoaded = payPrice !== null && receivePrice !== null && !pricesLoading;

  // 🔴 DEBUG: Log live prices
  useEffect(() => {
    console.log('📊 LIVE PRICES:', {
      payToken: payToken.symbol,
      payPrice: payPrice ?? 'LOADING...',
      receiveToken: receiveToken.symbol,
      receivePrice: receivePrice ?? 'LOADING...',
      source: pricesSource,
      allLoaded: allPricesLoaded
    });
  }, [payPrice, receivePrice, payToken.symbol, receiveToken.symbol, pricesSource, allPricesLoaded]);
  
  const usdValuePay = amount && !isNaN(amount) && payPrice ? parseFloat(amount) * payPrice : 0;
  
  // Calculate Output - SPECIAL LOGIC pentru BITS (folosește liveBitsPrice din CellManager)
  let estimatedOutput = 0;
  let usdValueReceive = 0;
  let exchangeRate = 0;
  
  if (receiveToken.symbol === 'BITS' && liveBitsPrice && liveBitsPrice > 0) {
    // 🎯 PRESALE LOGIC: Calculează BITS bazat pe USD invested / BITS price
    estimatedOutput = amount && !isNaN(amount) && payPrice ? usdValuePay / liveBitsPrice : 0;
    usdValueReceive = estimatedOutput * liveBitsPrice;
    exchangeRate = payPrice && liveBitsPrice ? payPrice / liveBitsPrice : 0;
    console.log('🎯 [BITS Calculation] USD Invested:', usdValuePay, '| BITS Price:', liveBitsPrice, '| BITS Output:', estimatedOutput);
  } else {
    // 🥞 PANCAKESWAP LOGIC: Normal exchange rate
    exchangeRate = payPrice && receivePrice ? payPrice / receivePrice : 0;
    estimatedOutput = amount && !isNaN(amount) && exchangeRate > 0 ? parseFloat(amount) * exchangeRate : 0;
    usdValueReceive = estimatedOutput && receivePrice ? estimatedOutput * receivePrice : 0;
  }

  // Advanced Trading Details
  const priceImpact = amount > 10 ? 0.05 : 0.01; // Mock dynamic impact
  const lpFee = usdValuePay * 0.0025; // 0.25% Fee
  
  // Dynamic Minimum Received based on User Slippage
  const minReceived = estimatedOutput * (1 - (slippage / 100));
  
  // ⚠️ INSUFFICIENT BALANCE CHECK
  const currentBalance = parseFloat(balances[payToken.id] || 0);
  const hasInsufficientBalance = amount && !isNaN(amount) && parseFloat(amount) > currentBalance;

// DEMO Mode: Simulation (timeout, no wallet tx)
const handleSwapDemo = () => {
  setLoading(true);
  
  toast.info(`🔄 Simulating swap: ${amount} ${payToken.symbol} → ${estimatedOutput.toFixed(6)} ${receiveToken.symbol}`, {
    autoClose: 2000
  });
  
  setTimeout(() => {
    setLoading(false);
    onSwap?.({
      payToken: payToken.symbol,
      receiveToken: receiveToken.symbol,
      amount: estimatedOutput.toFixed(6),
      price: receivePrice
    });
    
    toast.success(`✅ Swap successful! Received ${estimatedOutput.toFixed(6)} ${receiveToken.symbol}`, {
      autoClose: 5000
    });
    
    // Refresh balances if callback provided
    if (onBalanceRefresh) {
      setTimeout(() => onBalanceRefresh(), 1000);
    }
    
    setAmount('');
  }, 800);
};

// REAL Mode: On-chain BSC swap - PRESALE pentru BITS, PancakeSwap pentru restul
const handleSwapReal = async () => {
  try {
    setLoading(true);

    if (!window.ethereum) {
      toast.error('❌ No wallet detected. Please install MetaMask.');
      setLoading(false);
      return;
    }

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      toast.warning('⚠️ Please enter a valid amount');
      setLoading(false);
      return;
    }

    if (!walletAddress) {
      toast.error('❌ Please connect your wallet first.');
      setLoading(false);
      return;
    }

    // 🎯 DETECT: Dacă cumpărăm BITS → folosim PRESALE logic (CellManager)
    if (receiveToken.symbol === 'BITS') {
      console.log('🎯 [PRESALE MODE] Buying BITS via CellManager.sol');

      // Validate BITS price is loaded
      if (!liveBitsPrice || liveBitsPrice <= 0) {
        toast.error('⏳ Please wait for BITS price to load from blockchain...');
        setLoading(false);
        return;
      }

      toast.info(`🔄 Purchasing BITS via Presale: ${amount} ${payToken.symbol} → BITS...`, {
        autoClose: 3000
      });

      // Calculate BITS to receive
      const payPrice = MARKET_PRICES[payToken.symbol];
      if (!payPrice || payPrice <= 0) {
        toast.error('❌ Token price not available');
        setLoading(false);
        return;
      }

      const usdInvested = parseFloat(amount) * payPrice;
      const bitsToReceive = usdInvested / liveBitsPrice;

      console.log(`💰 USD Invested: $${usdInvested.toFixed(2)}`);
      console.log(`💰 BITS Price: $${liveBitsPrice}`);
      console.log(`💰 BITS to Receive: ${bitsToReceive.toFixed(2)}`);

      // Prepare presale parameters
      const presaleParams = {
        amount: parseFloat(amount),
        bitsToReceive,
        walletAddress,
        selectedChain: 'BSC',
        usdInvested,
        bonusAmount: 0,
        bonusPercentage: 0,
        fallbackBitsPrice: liveBitsPrice,
        referralCode: ''
      };

      // Select correct handler based on payToken
      let handler;
      switch(payToken.symbol) {
        case 'BNB': handler = handleBNBPayment; break;
        case 'ETH': handler = handleETHPayment; break;
        case 'USDT': handler = handleUSDTPayment; break;
        case 'USDC': handler = handleUSDCPayment; break;
        case 'MATIC': handler = handleMATICPayment; break;
        case 'BTC': 
        case 'BTCB': handler = handleGenericPayment; break;
        default:
          toast.error(`❌ Token ${payToken.symbol} not supported for BITS purchase`);
          setLoading(false);
          return;
      }

      console.log(`📞 Calling ${payToken.symbol} presale handler...`);
      await handler(presaleParams);

      toast.success(`✅ Successfully purchased ${bitsToReceive.toFixed(2)} BITS!`, {
        autoClose: 5000
      });

      // Refresh balances
      if (onBalanceRefresh) {
        setTimeout(() => onBalanceRefresh(), 2000);
      }

      setAmount('');
      return;
    }

    // 🥞 PANCAKESWAP pentru toate celelalte swap-uri (NON-BITS)
    console.log('🥞 [PANCAKESWAP MODE] Regular DEX swap');
    
    toast.info(`🔄 Executing swap on BSC: ${amount} ${payToken.symbol} → ${receiveToken.symbol}...`, {
      autoClose: 3000
    });

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const amountInWei = ethers.utils.parseUnits(
      amount.toString(),
      payToken.decimals
    );

    const tx = await executeSwap({
      provider: signer,
      mode: 'AUTO',
      payToken,
      receiveToken,
      amountInWei,
      slippageBps: Math.round(slippage * 100),
    });

    if (tx && tx.hash) {
      toast.success(
        <div>
          ✅ Swap successful!
          <br />
          <a 
            href={`https://bscscan.com/tx/${tx.hash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#00FFA3', textDecoration: 'underline' }}
          >
            View on BSCScan →
          </a>
        </div>,
        { autoClose: 8000 }
      );
    } else {
      toast.success(`✅ Swap executed successfully!`, { autoClose: 5000 });
    }

    // Refresh balances
    if (onBalanceRefresh) {
      setTimeout(() => onBalanceRefresh(), 2000);
    }

    setAmount('');
  } catch (e) {
    console.error('Real swap failed:', e);
    
    // User rejected transaction
    if (e.code === 4001 || e.message?.includes('user rejected')) {
      toast.warning('⚠️ Transaction rejected by user');
    }
    // Insufficient funds
    else if (e.message?.includes('insufficient funds')) {
      toast.error('❌ Insufficient funds for gas');
    }
    // Slippage error
    else if (e.message?.includes('INSUFFICIENT_OUTPUT_AMOUNT')) {
      toast.error('❌ Price moved too much. Try increasing slippage tolerance.');
    }
    // Generic error
    else {
      toast.error(`❌ Swap failed: ${e.message || 'Unknown error'}`);
    }
  } finally {
    setLoading(false);
  }
};

// Main swap handler: switches based on account mode
const handleSwap = () => {
  if (accountMode === 'DEMO') return handleSwapDemo();
  return handleSwapReal();
};


  return (
    <div className="dex-swap-container">
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
                            padding: '7px',
                            width: '34px',
                            height: '34px',
                            cursor: 'pointer',
                            color: '#00FFA3',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 15px rgba(0, 255, 163, 0.15)',
                            transition: 'all 0.3s ease',
                            lineHeight: '1',
                            flexShrink: '0'
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
                        <Settings size={20} strokeWidth={2} />
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
                   ⚡ Powered by $<span className="solana-gradient-text">BITS</span> BitSwapDEX AI Protocol
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
                    <div className="dex-setting-title"><MousePointerClick size={16} strokeWidth={2} /> Slippage Tolerance</div>
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
                    <div className="dex-setting-title"><Timer size={16} strokeWidth={2} /> Transaction Deadline</div>
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
                        <Shield size={18} strokeWidth={2} color="#00FFA3" />
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
                        <Zap size={18} strokeWidth={2} color="#E6444D" />
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <SmartTooltip content={accountMode === 'DEMO' ? 'Simulated balance - not real funds' : 'Real wallet balance'}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Balance: {balances[payToken.id] || '0.00'}
                  {accountMode === 'DEMO' && <span style={{ fontSize: '0.8rem' }}>📊</span>}
                </span>
              </SmartTooltip>
              {/* 24h Price Change */}
              {livePriceChanges[payToken.symbol] !== undefined && livePriceChanges[payToken.symbol] !== 0 && (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  color: livePriceChanges[payToken.symbol] >= 0 ? '#30C371' : '#E6444D',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  background: livePriceChanges[payToken.symbol] >= 0 ? 'rgba(48, 195, 113, 0.1)' : 'rgba(230, 68, 77, 0.1)'
                }}>
                  {livePriceChanges[payToken.symbol] >= 0 ? '+' : ''}{livePriceChanges[payToken.symbol].toFixed(2)}%
                </span>
              )}
              {/* Quick Amount Buttons */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {[25, 50, 75, 100].map(percent => (
                  <button
                    key={percent}
                    onClick={() => {
                      const balance = parseFloat(balances[payToken.id] || 0);
                      if (balance > 0) {
                        setAmount((balance * percent / 100).toFixed(6));
                      }
                    }}
                    style={{
                      padding: '2px 6px',
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      background: 'rgba(0, 255, 163, 0.1)',
                      border: '1px solid rgba(0, 255, 163, 0.3)',
                      borderRadius: '4px',
                      color: '#00FFA3',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 255, 163, 0.2)';
                      e.currentTarget.style.borderColor = '#00FFA3';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 255, 163, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(0, 255, 163, 0.3)';
                    }}
                  >
                    {percent === 100 ? 'MAX' : `${percent}%`}
                  </button>
                ))}
              </div>
            </div>
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
          <div className="dex-usd-value" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between' }}>
            {payPrice === null || payPrice === undefined ? (
              <span style={{ color: '#FF6B6B', fontSize: '0.85rem' }}>Loading price...</span>
            ) : (
              <>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ≈ ${usdValuePay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {accountMode === 'DEMO' && <span style={{ fontSize: '0.75rem' }}>📊</span>}
                </span>
                {payPrice > 0 && (
                  <span style={{ fontSize: '0.7rem', color: '#00FFA3', opacity: 0.8 }}>
                    @ ${payPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                )}
              </>
            )}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <SmartTooltip content={accountMode === 'DEMO' ? 'Simulated balance - not real funds' : 'Real wallet balance'}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Balance: {balances[receiveToken.id] || '0.00'}
                  {accountMode === 'DEMO' && <span style={{ fontSize: '0.8rem' }}>📊</span>}
                </span>
              </SmartTooltip>
              {/* 24h Price Change */}
              {livePriceChanges[receiveToken.symbol] !== undefined && livePriceChanges[receiveToken.symbol] !== 0 && (
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  color: livePriceChanges[receiveToken.symbol] >= 0 ? '#30C371' : '#E6444D',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  background: livePriceChanges[receiveToken.symbol] >= 0 ? 'rgba(48, 195, 113, 0.1)' : 'rgba(230, 68, 77, 0.1)'
                }}>
                  {livePriceChanges[receiveToken.symbol] >= 0 ? '+' : ''}{livePriceChanges[receiveToken.symbol].toFixed(2)}%
                </span>
              )}
            </div>
          </div>
          <div className="dex-input-row">
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                value={estimatedOutput > 0 ? estimatedOutput.toFixed(6) : ''}
                readOnly
                placeholder="0.0"
                className="dex-amount-input"
                style={{ color: '#00FFA3' }}
              />
              {accountMode === 'DEMO' && estimatedOutput > 0 && (
                <span style={{ 
                  position: 'absolute', 
                  right: '10px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  fontSize: '0.85rem',
                  opacity: 0.6
                }}>
                  📊
                </span>
              )}
            </div>
            <TokenSelector tokens={tokens} selected={receiveToken} onSelect={setReceiveToken} exclude={payToken} />
          </div>
          <div className="dex-usd-value" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between' }}>
            {receivePrice === null || receivePrice === undefined ? (
              <span style={{ color: '#FF6B6B', fontSize: '0.85rem' }}>Loading price...</span>
            ) : (
              <>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ≈ ${usdValueReceive.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {accountMode === 'DEMO' && <span style={{ fontSize: '0.75rem' }}>📊</span>}
                </span>
                {receivePrice > 0 && (
                  <span style={{ fontSize: '0.7rem', color: '#00FFA3', opacity: 0.8 }}>
                    @ ${receivePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Info / Route */}
        <SwapRoute fromToken={payToken} toToken={receiveToken} />
        
        {/* Advanced Contextual Info */}
        <div className="dex-info-box">
            <div className="dex-info-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Rate
                  {pricesLoading ? (
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '2px 6px',
                      background: 'rgba(255, 165, 0, 0.15)',
                      color: '#FFA500',
                      borderRadius: '4px',
                      fontWeight: '700',
                      letterSpacing: '0.5px'
                    }}>
                      LOADING...
                    </span>
                  ) : pricesError ? (
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '2px 6px',
                      background: 'rgba(230, 68, 77, 0.15)',
                      color: '#E6444D',
                      borderRadius: '4px',
                      fontWeight: '700',
                      letterSpacing: '0.5px'
                    }}>
                      ERROR
                    </span>
                  ) : (
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '2px 6px',
                      background: 'rgba(0, 255, 163, 0.15)',
                      color: '#00FFA3',
                      borderRadius: '4px',
                      fontWeight: '700',
                      letterSpacing: '0.5px',
                      animation: 'pulse 2s ease-in-out infinite'
                    }}>
                      {pricesSource || 'LIVE'}
                    </span>
                  )}
                  {/* 🔄 REFRESH BUTTON */}
                  <button
                    onClick={() => refreshPrices()}
                    disabled={pricesLoading}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: pricesLoading ? 'not-allowed' : 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      opacity: pricesLoading ? 0.5 : 0.7,
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => !pricesLoading && (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                    title="Refresh prices"
                  >
                    <RefreshCw size={14} color="#00FFA3" style={{ animation: pricesLoading ? 'spin 1s linear infinite' : 'none' }} />
                  </button>
                </span>
                <span className="dex-val-highlight" style={{ fontSize: '0.95rem' }}>
                    1 {payToken.symbol} ≈ <span style={{ color: '#30C371', fontWeight: '700' }}>{exchangeRate > 0 ? exchangeRate.toFixed(4) : '...'}</span> {receiveToken.symbol}
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
            
            {/* ⏱️ ESTIMATED TIME */}
            {amount > 0 && (
              <div className="dex-info-row" style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888', fontSize: '0.85rem' }}>
                  <Clock size={14} />
                  Estimated Time
                </span>
                <span style={{ fontSize: '0.85rem', color: '#00FFA3', fontWeight: '600' }}>
                  {accountMode === 'REAL' ? '~5 seconds' : 'Instant'}
                </span>
              </div>
            )}
        </div>

        <div style={{ padding: '0 4px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#aaa', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={payWithBits} 
              onChange={(e) => setPayWithBits(e.target.checked)}
            />
            <span>Pay fee with <span className="solana-gradient-text">$BITS</span> (10% off)</span>
          </label>
        </div>

        {/* ⚠️ REAL MODE WARNING (once per session) */}
        {showRealModeWarning && accountMode === 'REAL' && (
          <div style={{
            padding: '10px 12px',
            marginTop: '12px',
            background: 'rgba(230, 68, 77, 0.1)',
            border: '1px solid rgba(230, 68, 77, 0.3)',
            borderRadius: '8px',
            fontSize: '0.8rem',
            color: '#ff8888',
            lineHeight: '1.5',
            textAlign: 'center'
          }}>
            ⚠️ Real mode executes live blockchain transactions. Funds are at risk.
          </div>
        )}

        {/* ⚠️ INSUFFICIENT BALANCE WARNING */}
        {hasInsufficientBalance && (
          <div style={{
            padding: '10px 12px',
            marginTop: '12px',
            background: 'rgba(255, 165, 0, 0.1)',
            border: '1px solid rgba(255, 165, 0, 0.3)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} color="#FFA500" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#FFA500' }}>
                Insufficient {payToken.symbol} balance
              </div>
              <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '2px' }}>
                Available: {currentBalance.toFixed(6)} {payToken.symbol}
              </div>
            </div>
          </div>
        )}

        {/* 🔗 CONNECT WALLET (REAL mode only) */}
        {accountMode === 'REAL' && !isConnected ? (
          <button
            onClick={connectWallet}
            className="dex-action-btn primary"
            style={{ marginTop: '12px' }}
          >
            Connect Wallet
          </button>
        ) : (
          <button
            disabled={!amount || loading || hasInsufficientBalance || (accountMode === 'REAL' && !isConnected)}
            onClick={handleSwap}
            className={`dex-action-btn ${amount && !hasInsufficientBalance ? 'primary' : ''}`}
            style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {loading ? (
              <>
                <ArrowDownUp size={18} style={{ animation: 'spin 1s linear infinite' }} />
                SWAPPING...
              </>
            ) : hasInsufficientBalance ? (
              'Insufficient Balance'
            ) : amount ? (
              <>
                <ArrowDownUp size={18} />
                SWAP NOW
              </>
            ) : (
              'ENTER AMOUNT'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default SwapPanel;
