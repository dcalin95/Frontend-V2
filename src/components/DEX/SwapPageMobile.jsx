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

    // Feature cards for unimplemented tabs
    const getFeatureInfo = () => {
      switch(activeTab) {
        case 'dashboard': return { icon: '📊', title: 'Dashboard', desc: 'View your portfolio stats, P&L, and performance analytics.' };
        case 'pools': return { icon: '💧', title: 'Liquidity Pools', desc: 'Provide liquidity and earn fees from trading pairs.' };
        case 'stake': return { icon: '🔒', title: 'Staking Vault', desc: 'Stake BITS tokens and earn passive rewards.' };
        case 'vote': return { icon: '⚖️', title: 'Governance', desc: 'Vote on protocol proposals and shape the future of BitSwap.' };
        case 'ai': return { icon: '🤖', title: 'AI Intelligence', desc: 'AI-powered trading signals and market insights.' };
        default: return { icon: '📱', title: 'Coming Soon', desc: 'This feature is being optimized for mobile.' };
      }
    };

    const info = getFeatureInfo();

    return (
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        fontFamily: "'Roboto Mono', 'Courier New', monospace",
        padding: '32px 24px',
        textAlign: 'center',
        minHeight: 'calc(100vh - 220px)',
        background: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 255, 163, 0.05) 100%)'
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '24px',
          filter: 'drop-shadow(0 0 20px rgba(0, 255, 163, 0.3))'
        }}>
          {info.icon}
        </div>
        
        <h2 style={{
          color: '#00FFA3',
          fontSize: '1.5rem',
          fontWeight: '700',
          marginBottom: '12px',
          textShadow: '0 0 20px rgba(0, 255, 163, 0.5)'
        }}>
          {info.title}
        </h2>
        
        <p style={{
          color: '#8b9bb4',
          fontSize: '0.95rem',
          lineHeight: '1.6',
          marginBottom: '24px',
          maxWidth: '300px'
        }}>
          {info.desc}
        </p>
        
        <div style={{
          padding: '12px 24px',
          background: 'rgba(0, 255, 163, 0.1)',
          border: '1px solid rgba(0, 255, 163, 0.3)',
          borderRadius: '12px',
          color: '#00FFA3',
          fontSize: '0.85rem',
          fontWeight: '600'
        }}>
          Available on Desktop
        </div>
        
        <a 
          href="/#/dex" 
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.9rem',
            textDecoration: 'none',
            display: 'inline-block'
          }}
        >
          ← Back to Swap
        </a>
      </div>
    );
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
          
          {/* CYBER WALLET BADGE */}
          <div className="dex-cyber-wallet-badge">
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

      {/* 🎯 NEW: Binance-Style Tab Selector */}
      <div style={{
        display: 'flex',
        gap: '0',
        background: 'rgba(10, 10, 14, 0.98)',
        padding: '4px',
        borderBottom: '2px solid rgba(0, 255, 163, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
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

