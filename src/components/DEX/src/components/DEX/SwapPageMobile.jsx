import React, { useState, useEffect } from 'react';
import SwapPanel from './SwapPanel';
import TradingChart from './TradingChart';
import PositionsTable from './PositionsTable';
import CosmicLoader from './CosmicLoader';
import './DEX.css';
import bitsLogo from '../../assets/logo.png';
import usdtLogo from '../../assets/icons/tether-usdt-logo.png';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Waves, 
  Wallet,
  Menu,
  Bell
} from 'lucide-react';

// Mock Balances
const MOCK_BALANCES = {
    ETH: '12.54',
    BTC: '0.85',
    SOL: '145.20',
    USDT: '45,230.00',
    BITS: '1,250,000.00',
    STX: '12,500.00'
};

const SwapPageMobile = () => {
  const [activeTab, setActiveTab] = useState('swap'); 
  const [isLoading, setIsLoading] = useState(true);
  
  // Shared State
  const [payToken, setPayToken] = useState({ symbol: 'BTC', balance: '2.45', icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' });
  const [receiveToken, setReceiveToken] = useState({ symbol: 'bBNB', balance: '0.00', icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' });
  
  const [balance, setBalance] = useState(() => {
      const saved = localStorage.getItem('dex_demo_balance');
      return saved ? parseFloat(saved) : 142591.07;
  });

  const [positions, setPositions] = useState(() => {
      const saved = localStorage.getItem('dex_demo_positions');
      return saved ? JSON.parse(saved) : [
          { id: 1, symbol: 'BITS/bBNB', type: 'Buy', volume: '6.59', openPrice: '645.20', marketPrice: '645.46', pnl: '+1.73' }
      ];
  });

  const tokens = [
      { symbol: 'BTC', balance: '2.45', icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
      { symbol: 'ETH', balance: '12.5', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
      { symbol: 'SOL', balance: '145.2', icon: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
      { symbol: 'BITS', balance: '5000.00', icon: bitsLogo },
      { symbol: 'bBNB', balance: '0.00', icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
      { symbol: 'USDT', balance: '45230.00', icon: usdtLogo }
  ];

  useEffect(() => {
      const timer = setTimeout(() => {
          setIsLoading(false);
      }, 8000); // Slightly faster on mobile
      return () => clearTimeout(timer);
  }, []);

  const handleSwapExecution = (fromAmount, toAmount) => {
      const newPos = {
          id: Date.now(),
          symbol: `${payToken.symbol}/${receiveToken.symbol}`,
          type: 'Buy',
          volume: fromAmount,
          openPrice: (Math.random() * 1000).toFixed(2),
          marketPrice: (Math.random() * 1000).toFixed(2),
          pnl: '0.00'
      };
      setPositions([newPos, ...positions]);
      setActiveTab('positions'); // Auto-switch to positions to see result
  };

  const handleClosePosition = (id, profitAmount) => {
      setPositions(positions.filter(p => p.id !== id));
      setBalance(prev => prev + parseFloat(profitAmount));
  };

  if (isLoading) {
      return <CosmicLoader />;
  }

  return (
    <div className="dex-mobile-app">
      {/* 1. Top Bar (Binance Style) */}
      <header className="dex-mobile-header">
          <div className="mobile-user-profile">
              <div className="mobile-avatar-circle">
                  <img src={bitsLogo} alt="User" />
              </div>
              <div className="mobile-user-info">
                  <span className="user-name">Demo User</span>
                  <span className="user-id">ID: 42069</span>
              </div>
          </div>
          <div className="mobile-header-actions">
              <Bell size={20} color="#8b9bb4" />
              <div className="mobile-scan-btn">
                  <Wallet size={18} color="#00FFA3" />
              </div>
          </div>
      </header>

      {/* 2. Main Scrollable Content */}
      <main className="dex-mobile-content">
        
        {activeTab === 'swap' && (
            <div className="mobile-tab-content">
                {/* Asset Balance Card */}
                <div className="mobile-balance-card">
                    <span className="label">Total Assets (USD)</span>
                    <h2 className="value">${balance.toLocaleString('en-US', {minimumFractionDigits: 2})}</h2>
                    <div className="pnl-pill positive">+2.45% today</div>
                </div>

                {/* The Swap Panel - Wrapped to force style overrides */}
                <div className="mobile-swap-wrapper">
                    <SwapPanel 
                        tokens={tokens}
                        balances={MOCK_BALANCES}
                        payToken={payToken}
                        setPayToken={setPayToken}
                        receiveToken={receiveToken}
                        setReceiveToken={setReceiveToken}
                        onSwap={handleSwapExecution} 
                    />
                </div>
                
                {/* Quick Chart Peek */}
                <div className="mobile-chart-teaser">
                    <div className="teaser-header">
                        <span>{payToken.symbol}/{receiveToken.symbol}</span>
                        <span className="teaser-change text-up">+1.2%</span>
                    </div>
                    <div style={{ height: '150px', pointerEvents: 'none' }}>
                        <TradingChart fromToken={payToken.symbol} toToken={receiveToken.symbol} />
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'positions' && (
            <div className="mobile-tab-content">
                <h3 className="mobile-section-title">Open Positions ({positions.length})</h3>
                <PositionsTable 
                    positions={positions} 
                    onClosePosition={handleClosePosition} 
                    balance={balance} 
                />
            </div>
        )}

        {activeTab === 'chart' && (
            <div className="mobile-tab-content full-height">
                <TradingChart fromToken={payToken.symbol} toToken={receiveToken.symbol} />
            </div>
        )}

      </main>

      {/* 3. Bottom Navigation (Fixed) */}
      <nav className="dex-mobile-bottom-nav">
        <button 
            className={`mobile-nav-item ${activeTab === 'swap' ? 'active' : ''}`}
            onClick={() => setActiveTab('swap')}
        >
            <ArrowRightLeft size={22} />
            <span>Trade</span>
        </button>
        
        <button 
            className={`mobile-nav-item ${activeTab === 'chart' ? 'active' : ''}`}
            onClick={() => setActiveTab('chart')}
        >
            <Waves size={22} />
            <span>Markets</span>
        </button>

        <button 
            className={`mobile-nav-item ${activeTab === 'positions' ? 'active' : ''}`}
            onClick={() => setActiveTab('positions')}
        >
            <LayoutDashboard size={22} />
            <span>Portfolio</span>
        </button>

        <button 
            className={`mobile-nav-item ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
        >
            <Menu size={22} />
            <span>Menu</span>
        </button>
      </nav>
    </div>
  );
};

export default SwapPageMobile;

