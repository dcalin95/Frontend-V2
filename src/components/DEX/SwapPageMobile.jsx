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

// Mock Balances for Demo
const MOCK_BALANCES = {
    ETH: '12.54',
    BTC: '0.85',
    SOL: '145.20',
    USDT: '45,230.00',
    BITS: '1,250,000.00',
    STX: '12,500.00'
};

const SwapPageMobile = () => {
  const [activeTab, setActiveTab] = useState('swap'); // 'dashboard', 'swap', 'pools', 'stake', 'governance'
  const [isLoading, setIsLoading] = useState(true);
  
  // Shared State
  const [payToken, setPayToken] = useState({ id: 'BTC', symbol: 'BTC', balance: '2.45', icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' });
  const [receiveToken, setReceiveToken] = useState({ id: 'bBNB', symbol: 'bBNB', balance: '0.00', icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' });
  
  const [balance, setBalance] = useState(() => {
      const saved = localStorage.getItem('dex_demo_balance');
      return saved ? parseFloat(saved) : 142591.07;
  });

  const [positions, setPositions] = useState(() => {
      const saved = localStorage.getItem('dex_demo_positions');
      return saved ? JSON.parse(saved) : [
          { id: 1, symbol: 'BITS/bBNB', type: 'Buy', volume: 6.59, openPrice: 645.20, marketPrice: 645.46, pnl: 1.73 }
      ];
  });

  const tokens = [
      { id: 'BTC', symbol: 'BTC', balance: '2.45', icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
      { id: 'ETH', symbol: 'ETH', balance: '12.5', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
      { id: 'SOL', symbol: 'SOL', balance: '145.2', icon: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
      { id: 'BITS', symbol: 'BITS', balance: '5000.00', icon: bitsLogo },
      { id: 'bBNB', symbol: 'bBNB', balance: '0.00', icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
      { id: 'USDT', symbol: 'USDT', balance: '45230.00', icon: usdtLogo }
  ];

  useEffect(() => {
      const timer = setTimeout(() => {
          setIsLoading(false);
      }, 2000); // Faster load for mobile
      return () => clearTimeout(timer);
  }, []);

  useEffect(() => { localStorage.setItem('dex_demo_balance', balance.toString()); }, [balance]);
  useEffect(() => { localStorage.setItem('dex_demo_positions', JSON.stringify(positions)); }, [positions]);

  const handleSwapExecution = (fromAmount, toAmount) => {
      // Ensure numeric values are stored to prevent errors
      const entryPrice = parseFloat((Math.random() * 1000).toFixed(2));
      const currentMarketPrice = parseFloat((Math.random() * 1000).toFixed(2));

      const newPos = {
          id: Date.now(),
          symbol: `${payToken.symbol}/${receiveToken.symbol}`,
          type: 'Buy',
          volume: parseFloat(fromAmount) || 0,
          openPrice: entryPrice,
          marketPrice: currentMarketPrice,
          pnl: 0.00
      };
      setPositions([newPos, ...positions]);
      // Stay on swap tab to see result in the "3rd card"
  };

  const handleClosePosition = (id, profitAmount) => {
      setPositions(positions.filter(p => p.id !== id));
      setBalance(prev => prev + parseFloat(profitAmount));
  };

  if (isLoading) {
      return <CosmicLoader />;
  }

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
                   <span className="wallet-amount">${balance.toLocaleString('en-US', {maximumFractionDigits: 0})}</span>
               </div>
               <div className="wallet-glow-dot"></div>
          </div>
      </header>

      {/* Main Content Scrollable Area */}
      <main className="force-black-bg dex-mobile-scroll-area" style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '16px', 
          paddingTop: '0px', // ZERO padding top
          paddingBottom: '120px', // INCREASED space for bottom nav + scroll buffer
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          backgroundColor: '#000000', /* Force Black here too */
          WebkitOverflowScrolling: 'touch' // Smooth iOS scroll
      }}>
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
             <div className="mobile-fade-in">
                <DashboardOverview 
                    positions={positions}
                    balance={balance}
                    onClosePosition={handleClosePosition}
                />
             </div>
        )}

        {/* SWAP TAB */}
        {activeTab === 'swap' && (
            <>
                {/* 1. Swap Panel */}
                <section className="mobile-fade-in">
                    <SwapPanel 
                        tokens={tokens}
                        balances={MOCK_BALANCES}
                        payToken={payToken}
                        setPayToken={setPayToken}
                        receiveToken={receiveToken}
                        setReceiveToken={setReceiveToken}
                        onSwap={handleSwapExecution} 
                    />
                </section>
                
                {/* 2. Chart Teaser */}
                <section className="mobile-fade-in" style={{ height: '300px', marginTop: '20px' }}>
                     <TradingChart fromToken={payToken.symbol} toToken={receiveToken.symbol} />
                </section>

                {/* 3. Positions Table (The Requested "Third Card") */}
                {positions.length > 0 && (
                    <section className="mobile-fade-in" style={{ marginTop: '20px', paddingBottom: '10px' }}>
                        <h3 style={{ 
                            fontSize: '1rem', 
                            color: '#8b9bb4', 
                            marginBottom: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            fontWeight: '700' 
                        }}>Active Trades ({positions.length})</h3>
                        <div className="dex-mobile-positions-wrapper">
                            <PositionsTable 
                                positions={positions} 
                                onClosePosition={handleClosePosition} 
                                balance={balance} 
                            />
                        </div>
                    </section>
                )}
            </>
        )}

        {/* POOLS TAB */}
        {activeTab === 'pools' && (
            <section className="mobile-fade-in">
                <LiquidityPools layout="column" />
            </section>
        )}

        {/* STAKE TAB */}
        {activeTab === 'stake' && (
            <section className="mobile-fade-in">
                <StakeVault layout="mobile" />
            </section>
        )}

        {/* GOVERNANCE TAB */}
        {activeTab === 'governance' && (
            <section className="mobile-fade-in">
                <VoteCenter />
            </section>
        )}

        {/* AI INTELLIGENCE TAB */}
        {activeTab === 'ai-intelligence' && (
            <section className="mobile-fade-in">
                <AIIntelligencePage />
            </section>
        )}

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
            onClick={() => setActiveTab('dashboard')}
            style={{color: activeTab === 'dashboard' ? '#00FFA3' : '#8b9bb4'}}
        >
            <LayoutDashboard size={20} />
            <span style={{fontSize:'0.7rem', marginTop:'4px'}}>Dashboard</span>
        </button>

        <button 
            className={`dex-nav-item-mobile ${activeTab === 'swap' ? 'active' : ''}`}
            onClick={() => setActiveTab('swap')}
            style={{color: activeTab === 'swap' ? '#00FFA3' : '#8b9bb4'}}
        >
            <ArrowRightLeft size={20} />
            <span style={{fontSize:'0.7rem', marginTop:'4px'}}>Swap</span>
        </button>
        
        <button 
            className={`dex-nav-item-mobile ${activeTab === 'pools' ? 'active' : ''}`}
            onClick={() => setActiveTab('pools')}
            style={{color: activeTab === 'pools' ? '#00FFA3' : '#8b9bb4'}}
        >
            <Waves size={20} />
            <span style={{fontSize:'0.7rem', marginTop:'4px'}}>Pools</span>
        </button>

        <button 
            className={`dex-nav-item-mobile ${activeTab === 'stake' ? 'active' : ''}`}
            onClick={() => setActiveTab('stake')}
            style={{color: activeTab === 'stake' ? '#00FFA3' : '#8b9bb4'}}
        >
            <Lock size={20} />
            <span style={{fontSize:'0.7rem', marginTop:'4px'}}>Stake</span>
        </button>

        <button 
            className={`dex-nav-item-mobile ${activeTab === 'governance' ? 'active' : ''}`}
            onClick={() => setActiveTab('governance')}
            style={{color: activeTab === 'governance' ? '#00FFA3' : '#8b9bb4'}}
        >
            <Scale size={20} />
            <span style={{fontSize:'0.7rem', marginTop:'4px'}}>Vote</span>
        </button>

        <button 
            className={`dex-nav-item-mobile ${activeTab === 'ai-intelligence' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai-intelligence')}
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

