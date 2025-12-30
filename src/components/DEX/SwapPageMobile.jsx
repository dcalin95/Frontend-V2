import React, { useState, useEffect } from 'react';
import SwapPanel from './SwapPanel';
import TradingChart from './TradingChart';
import PositionsTable from './PositionsTable';
import DashboardOverview from './DashboardOverview';
import LiquidityPools from './LiquidityPools';
import StakeVault from './StakeVault';
import VoteCenter from './VoteCenter';
import AIIntelligencePage from './AIIntelligencePage'; // New Page
import CosmicLoader from './CosmicLoader';
import './DEX.css';
import bitsLogo from '../../assets/logo.png';
import usdtLogo from '../../assets/icons/tether-usdt-logo.png';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Waves, 
  Lock, 
  Wallet,
  Scale,
  Brain, // New Icon
  Home 
} from 'lucide-react';

const SwapPageMobile = ({
  accountMode = 'DEMO',
  setAccountMode = () => {},
  walletAddress = null,
  balance = 0,
  positions = [],
  tokens = [],
  balances = {},
  payToken = null,
  setPayToken = () => {},
  receiveToken = null,
  setReceiveToken = () => {},
  onSwap = () => {},
  onClosePosition = () => {},
  onBalanceRefresh = () => {},
  bitsBalance = '0',
  ethBalance = '0',
  nativeSymbol = 'BNB',
  connectorName = '',
  chainId = null,
  onConnectWallet = () => {},
  onDisconnectWallet = () => {},
  onSwitchNetwork = () => {}
}) => {
  const [activeTab, setActiveTab] = useState('swap'); // Main tab state
  const [isLoading, setIsLoading] = useState(true);
  const [showWatchlist, setShowWatchlist] = useState(false); // ✅ NEW: Watchlist drawer state
  const [showBalanceDetails, setShowBalanceDetails] = useState(false); // ✅ NEW: Balance details state
  
  // Tab state monitoring
  useEffect(() => {
    // Only log critical tab changes in production
  }, [activeTab, accountMode, walletAddress]);
  
  // Shared State - use props if provided, fallback to internal state
  const [localPayToken, setLocalPayToken] = useState({ id: 'BTC', symbol: 'BTC', balance: '2.45', icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' });
  const [localReceiveToken, setLocalReceiveToken] = useState({ id: 'BNB', symbol: 'BNB', balance: '0.00', icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' }); // ✅ FIXED: BNB instead of bBNB
  
  const [localBalance, setLocalBalance] = useState(() => {
      const saved = localStorage.getItem('dex_demo_balance');
      return saved ? parseFloat(saved) : 142591.07;
  });

  const [localPositions, setLocalPositions] = useState(() => {
      const saved = localStorage.getItem('dex_demo_positions');
      return saved ? JSON.parse(saved) : [
          { id: 1, symbol: 'BITS/BNB', type: 'Buy', volume: 6.59, openPrice: 645.20, marketPrice: 645.46, pnl: 1.73 }
      ];
  });

  // Use props if available, otherwise use local state
  const finalPayToken = payToken || localPayToken;
  const finalReceiveToken = receiveToken || localReceiveToken;
  const finalBalance = balance || localBalance;
  const finalPositions = positions.length > 0 ? positions : localPositions;
  const finalTokens = tokens.length > 0 ? tokens : [
      { id: 'BTC', symbol: 'BTC', balance: '2.45', icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
      { id: 'ETH', symbol: 'ETH', balance: '12.5', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
      { id: 'SOL', symbol: 'SOL', balance: '145.2', icon: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
      { id: 'BITS', symbol: 'BITS', balance: '5000.00', icon: bitsLogo },
      { id: 'BNB', symbol: 'BNB', balance: '0.00', icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
      { id: 'USDT', symbol: 'USDT', balance: '45230.00', icon: usdtLogo }
  ];
  const finalBalances = Object.keys(balances).length > 0 ? balances : {
    ETH: '12.54',
    BTC: '0.85',
    SOL: '145.20',
    USDT: '45,230.00',
    BITS: '1,250,000.00',
    STX: '12,500.00'
  };
  
  const handleSetPayToken = setPayToken || setLocalPayToken;
  const handleSetReceiveToken = setReceiveToken || setLocalReceiveToken;

  useEffect(() => {
      const timer = setTimeout(() => {
          setIsLoading(false);
      }, 2000); // Faster load for mobile
      return () => clearTimeout(timer);
  }, []);

  useEffect(() => { localStorage.setItem('dex_demo_balance', finalBalance.toString()); }, [finalBalance]);
  useEffect(() => { localStorage.setItem('dex_demo_positions', JSON.stringify(finalPositions)); }, [finalPositions]);

  const handleSwapExecution = (fromAmount, toAmount) => {
      // If parent onSwap is provided, use it
      if (onSwap && onSwap !== (() => {})) {
        return onSwap(fromAmount, toAmount);
      }

      // Fallback to local logic for demo mode
      const entryPrice = parseFloat((Math.random() * 1000).toFixed(2));
      const currentMarketPrice = parseFloat((Math.random() * 1000).toFixed(2));

      const newPos = {
          id: Date.now(),
          symbol: `${finalPayToken.symbol}/${finalReceiveToken.symbol}`,
          type: 'Buy',
          volume: parseFloat(fromAmount) || 0,
          openPrice: entryPrice,
          marketPrice: currentMarketPrice,
          pnl: 0.00
      };
      setLocalPositions([newPos, ...localPositions]);
  };

  const handleClosePosition = (id, profitAmount) => {
      // If parent onClosePosition is provided, use it
      if (onClosePosition && onClosePosition !== (() => {})) {
        return onClosePosition(id, profitAmount);
      }

      // Fallback to local logic
      setLocalPositions(localPositions.filter(p => p.id !== id));
      setLocalBalance(prev => prev + parseFloat(profitAmount));
  };

  if (isLoading) {
      return <CosmicLoader />;
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const renderTabContent = () => {
    if (activeTab === 'swap') {
      return (
        <>
          {/* 1. Swap Panel */}
          <section className="mobile-fade-in">
              <SwapPanel 
                  accountMode={accountMode}
                  setAccountMode={setAccountMode}
                  tokens={finalTokens}
                  balances={finalBalances}
                  payToken={finalPayToken}
                  setPayToken={handleSetPayToken}
                  receiveToken={finalReceiveToken}
                  setReceiveToken={handleSetReceiveToken}
                  onSwap={handleSwapExecution}
                  onBalanceRefresh={onBalanceRefresh}
              />
          </section>

          {/* 2. Positions Table */}
          {finalPositions.length > 0 && (
              <section className="mobile-fade-in" style={{ marginTop: '20px', paddingBottom: '10px' }}>
                  <h3 style={{ 
                      fontSize: '1rem', 
                      color: '#8b9bb4', 
                      marginBottom: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      fontWeight: '700' 
                  }}>Active Trades ({finalPositions.length})</h3>
                  <div className="dex-mobile-positions-wrapper">
                      <PositionsTable 
                          positions={finalPositions} 
                          onClosePosition={handleClosePosition} 
                          balance={finalBalance} 
                      />
                  </div>
              </section>
          )}
        </>
      );
    }

    if (activeTab === 'chart') {
      return (
        <div style={{ 
          height: 'calc(100vh - 160px)', 
          width: '100%', 
          margin: 0, 
          padding: 0 
        }}>
            <TradingChart 
              fromToken={finalPayToken.symbol} 
              toToken={finalReceiveToken.symbol}
              walletAddress={walletAddress}
              bitsBalance={bitsBalance}
              ethBalance={ethBalance}
              nativeSymbol={nativeSymbol}
              connectorName={connectorName}
              chainId={chainId}
              onConnectWallet={onConnectWallet}
              onDisconnectWallet={onDisconnectWallet}
              onSwitchNetwork={onSwitchNetwork}
            />
        </div>
      );
    }

    // ✅ DASHBOARD TAB - Full Overview
    if (activeTab === 'dashboard') {
      return (
        <div style={{ padding: '0 16px', paddingBottom: '20px' }}>
          <DashboardOverview 
            positions={finalPositions}
            balance={finalBalance}
            onClosePosition={handleClosePosition}
          />
        </div>
      );
    }

    // ✅ POOLS TAB - Liquidity Pools
    if (activeTab === 'pools') {
      return (
        <div style={{ padding: '0 16px', paddingBottom: '20px' }}>
          <LiquidityPools />
        </div>
      );
    }

    // ✅ STAKE TAB - Staking Vault
    if (activeTab === 'stake') {
      return (
        <div style={{ padding: '0 16px', paddingBottom: '20px' }}>
          <StakeVault layout="mobile" />
        </div>
      );
    }

    // ✅ VOTE TAB - Governance Center
    if (activeTab === 'vote') {
      return (
        <div style={{ padding: '0 16px', paddingBottom: '20px' }}>
          <VoteCenter />
        </div>
      );
    }

    // ✅ AI TAB - AI Intelligence
    if (activeTab === 'ai') {
      return (
        <div style={{ padding: '0 16px', paddingBottom: '20px' }}>
          <AIIntelligencePage />
        </div>
      );
    }

    // Default fallback
    return null;
  };

  return (
    <div className="dex-mobile-app force-black-bg" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        backgroundColor: '#000000', /* Force Black */
        overflow: 'hidden'
    }}>
      {/* Mobile Header */}
      <header className="dex-mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* HOME BUTTON ADDED HERE */}
              <a href="/" style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.7)', 
                  textDecoration: 'none', 
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.08)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  marginRight: '4px'
              }}>
                  <Home size={18} />
              </a>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src={bitsLogo} alt="Logo" style={{ width: '32px', height: '32px', filter: 'drop-shadow(0 0 8px rgba(0,255,163,0.5))' }} />
                  <span style={{ fontWeight: '900', fontSize: '1.1rem', color: '#fff', letterSpacing: '0.5px' }}>
                      Bit<span style={{background: 'linear-gradient(90deg, #9945FF, #14F195)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Swap</span>DEX<span style={{color:'#00FFA3', textShadow: '0 0 10px rgba(0,255,163,0.6)', marginLeft:'4px'}}>AI</span>
                  </span>
              </div>
          </div>
          
          {/* CYBER WALLET BADGE - CLICKABLE FOR DETAILS */}
          <div 
            className="dex-cyber-wallet-badge" 
            onClick={() => setShowBalanceDetails(!showBalanceDetails)}
            style={{ cursor: 'pointer' }}
          >
               <div className="wallet-icon-wrapper">
                   <Wallet size={14} color="#000" fill="#00FFA3" />
               </div>
               <div className="wallet-balance-wrapper">
                   <span className="wallet-label">NET WORTH</span>
                   <span className="wallet-amount">${finalBalance.toLocaleString('en-US', {maximumFractionDigits: 0})}</span>
               </div>
               <div className="wallet-glow-dot"></div>
          </div>
      </header>

      {/* ✅ NEW: BALANCE DETAILS DROPDOWN */}
      {showBalanceDetails && (
        <div style={{
          background: 'rgba(0, 10, 20, 0.95)',
          borderBottom: '1px solid rgba(0, 255, 163, 0.3)',
          padding: '16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          fontSize: '0.85rem'
        }}>
          <div>
            <div style={{ color: '#8b9bb4', marginBottom: '4px' }}>Balance:</div>
            <div style={{ color: '#00FFA3', fontWeight: 'bold' }}>${finalBalance.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ color: '#8b9bb4', marginBottom: '4px' }}>Equity:</div>
            <div style={{ color: '#00FFA3', fontWeight: 'bold' }}>${finalBalance.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ color: '#8b9bb4', marginBottom: '4px' }}>Margin:</div>
            <div style={{ color: '#00FFA3', fontWeight: 'bold' }}>$0.00</div>
          </div>
          <div>
            <div style={{ color: '#8b9bb4', marginBottom: '4px' }}>Profit:</div>
            <div style={{ color: '#00FFA3', fontWeight: 'bold' }}>+$0.00</div>
          </div>
        </div>
      )}

      {/* 🎯 NEW: Binance-Style Tab Selector */}
      <div style={{
        display: 'flex',
        gap: '0',
        background: 'rgba(10, 10, 14, 0.98)',
        padding: '4px',
        borderBottom: '2px solid rgba(0, 255, 163, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', flex: 1 }}>
          <button
            onClick={() => setActiveTab('swap')}
            style={{
              flex: 1,
              padding: '14px',
              background: activeTab === 'swap' ? 'rgba(0, 255, 163, 0.2)' : 'transparent',
              color: activeTab === 'swap' ? '#00FFA3' : 'rgba(255,255,255,0.7)',
              border: 'none',
              borderBottom: activeTab === 'swap' ? '3px solid #00FFA3' : '3px solid transparent',
              fontFamily: "'Roboto Mono', 'Courier New', monospace",
              fontWeight: activeTab === 'swap' ? '700' : '600',
              fontSize: '1rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textShadow: activeTab === 'swap' ? '0 0 10px rgba(0, 255, 163, 0.5)' : 'none'
            }}
          >
            SWAP
          </button>
          <button
            onClick={() => setActiveTab('chart')}
            style={{
              flex: 1,
              padding: '14px',
              background: activeTab === 'chart' ? 'rgba(0, 255, 163, 0.2)' : 'transparent',
              color: activeTab === 'chart' ? '#00FFA3' : 'rgba(255,255,255,0.7)',
              border: 'none',
              borderBottom: activeTab === 'chart' ? '3px solid #00FFA3' : '3px solid transparent',
              fontFamily: "'Roboto Mono', 'Courier New', monospace",
              fontWeight: activeTab === 'chart' ? '700' : '600',
              fontSize: '1rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textShadow: activeTab === 'chart' ? '0 0 10px rgba(0, 255, 163, 0.5)' : 'none'
            }}
          >
            CHART
          </button>
        </div>
        
        {/* ✅ WATCHLIST TOGGLE BUTTON */}
        <button
          onClick={() => setShowWatchlist(!showWatchlist)}
          style={{
            padding: '12px 16px',
            background: showWatchlist ? 'rgba(0, 255, 163, 0.2)' : 'transparent',
            color: showWatchlist ? '#00FFA3' : 'rgba(255,255,255,0.7)',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          📊
        </button>
      </div>

      {/* ✅ NEW: WATCHLIST DRAWER */}
      {showWatchlist && (
        <div style={{
          background: 'rgba(0, 10, 20, 0.98)',
          borderBottom: '1px solid rgba(0, 255, 163, 0.3)',
          padding: '16px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <h3 style={{ color: '#00FFA3', marginBottom: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>Watchlist</h3>
          {[
            { symbol: 'BTCUSDT', price: '87,852.67', change: '-0.11%', color: '#ff4444' },
            { symbol: 'ETHUSDT', price: '2,941.09', change: '-0.33%', color: '#ff4444' },
            { symbol: 'BNBUSDT', price: '855.24', change: '-0.47%', color: '#ff4444' },
            { symbol: 'SOLUSD', price: '123.84', change: '-1.14%', color: '#ff4444' },
            { symbol: 'STXUSD', price: '0.2584', change: '-2.49%', color: '#ff4444' }
          ].map((item, idx) => (
            <div key={idx} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              fontSize: '0.85rem'
            }}>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{item.symbol}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#fff' }}>{item.price}</div>
                <div style={{ color: item.color, fontSize: '0.75rem' }}>{item.change}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content Scrollable Area */}
      <main className="force-black-bg dex-mobile-scroll-area" style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: activeTab === 'chart' ? '0' : '16px', 
          paddingTop: '0px',
          paddingBottom: activeTab === 'chart' ? '0' : '120px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          backgroundColor: '#000000',
          WebkitOverflowScrolling: 'touch',
          minHeight: 'calc(100vh - 140px)'
      }}>
        
        {renderTabContent()}

      </main>

      {/* Bottom Navigation Bar - Matches User's Screenshot */}
      <nav className="dex-bottom-nav" style={{
          display: 'flex',
          justifyContent: 'space-evenly', /* Changed from space-around to accommodate 6 items */
          alignItems: 'center',
          background: 'rgba(5, 5, 5, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: '12px 0',
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          zIndex: 2147483647,
          height: '65px'
      }}>
        <button 
            className={`dex-nav-item-mobile ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabChange('dashboard')}
            style={{color: activeTab === 'dashboard' ? '#00FFA3' : '#8b9bb4'}}
        >
            <LayoutDashboard size={20} />
            <span style={{fontSize:'0.7rem', marginTop:'4px'}}>Dashboard</span>
        </button>

        <button 
            className={`dex-nav-item-mobile ${activeTab === 'swap' ? 'active' : ''}`}
            onClick={() => handleTabChange('swap')}
            style={{color: activeTab === 'swap' ? '#00FFA3' : '#8b9bb4'}}
        >
            <ArrowRightLeft size={20} />
            <span style={{fontSize:'0.7rem', marginTop:'4px'}}>Swap</span>
        </button>
        
        <button 
            className={`dex-nav-item-mobile ${activeTab === 'pools' ? 'active' : ''}`}
            onClick={() => handleTabChange('pools')}
            style={{color: activeTab === 'pools' ? '#00FFA3' : '#8b9bb4'}}
        >
            <Waves size={20} />
            <span style={{fontSize:'0.7rem', marginTop:'4px'}}>Pools</span>
        </button>

        <button 
            className={`dex-nav-item-mobile ${activeTab === 'stake' ? 'active' : ''}`}
            onClick={() => handleTabChange('stake')}
            style={{color: activeTab === 'stake' ? '#00FFA3' : '#8b9bb4'}}
        >
            <Lock size={20} />
            <span style={{fontSize:'0.7rem', marginTop:'4px'}}>Stake</span>
        </button>

        <button 
            className={`dex-nav-item-mobile ${activeTab === 'governance' ? 'active' : ''}`}
            onClick={() => handleTabChange('governance')}
            style={{color: activeTab === 'governance' ? '#00FFA3' : '#8b9bb4'}}
        >
            <Scale size={20} />
            <span style={{fontSize:'0.7rem', marginTop:'4px'}}>Vote</span>
        </button>

        <button 
            className={`dex-nav-item-mobile ${activeTab === 'ai-intelligence' ? 'active' : ''}`}
            onClick={() => handleTabChange('ai-intelligence')}
            style={{color: activeTab === 'ai-intelligence' ? '#00FFA3' : '#8b9bb4'}}
        >
            <Brain size={20} />
            <span style={{fontSize:'0.7rem', marginTop:'4px'}}>AI</span>
        </button>
      </nav>
    </div>
  );
};

export default SwapPageMobile;

