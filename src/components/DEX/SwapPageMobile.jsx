import React, { useState, useEffect } from 'react';
import SwapPanel from './SwapPanel';
import TradingChart from './TradingChart';
import PositionsTable from './PositionsTable';
import CosmicLoader from './CosmicLoader';
import './DEX.css';
import bitsLogo from '../../assets/logo.png';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Waves, 
  Lock, 
  Wallet,
  Menu
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
  const [activeTab, setActiveTab] = useState('swap'); // 'swap', 'chart', 'positions'
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
      { symbol: 'USDT', balance: '45230.00', icon: 'https://cryptologos.cc/logos/tether-usdt-logo.png' }
  ];

  useEffect(() => {
      const timer = setTimeout(() => {
          setIsLoading(false);
      }, 10000);
      return () => clearTimeout(timer);
  }, []);

  useEffect(() => { localStorage.setItem('dex_demo_balance', balance.toString()); }, [balance]);
  useEffect(() => { localStorage.setItem('dex_demo_positions', JSON.stringify(positions)); }, [positions]);

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
  };

  const handleClosePosition = (id, profitAmount) => {
      setPositions(positions.filter(p => p.id !== id));
      setBalance(prev => prev + parseFloat(profitAmount));
  };

  if (isLoading) {
      return <CosmicLoader />;
  }

  return (
    <div className="dex-page-container-mobile" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        background: '#000',
        overflow: 'hidden'
    }}>
      {/* Mobile Header */}
      <header style={{
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '12px 16px',
          background: 'rgba(10,10,10,0.9)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          zIndex: 50
      }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src={bitsLogo} alt="Logo" style={{ width: '28px', height: '28px' }} />
              <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#fff' }}>BitSwap<span style={{color:'#00FFA3'}}>AI</span></span>
          </div>
          <div className="dex-wallet-status">
               <Wallet size={16} color="#00FFA3" />
               <span style={{fontSize:'0.85rem', fontWeight:'600'}}>${balance.toLocaleString('en-US', {maximumFractionDigits: 0})}</span>
          </div>
      </header>

      {/* Main Content Scrollable Area */}
      <main style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '16px', 
          paddingBottom: '80px', // Space for bottom nav
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
      }}>
        
        {/* Conditional View based on Tab */}
        {activeTab === 'swap' && (
            <>
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
                
                {/* Compact Chart Teaser */}
                <section className="mobile-fade-in" style={{ height: '250px', opacity: 0.8, marginTop: '20px' }}>
                     <TradingChart fromToken={payToken.symbol} toToken={receiveToken.symbol} />
                </section>
            </>
        )}

        {activeTab === 'positions' && (
            <section className="mobile-fade-in">
                <PositionsTable 
                    positions={positions} 
                    onClosePosition={handleClosePosition} 
                    balance={balance} 
                />
            </section>
        )}

        {activeTab === 'chart' && (
            <section className="mobile-fade-in" style={{ height: '60vh' }}>
                <TradingChart fromToken={payToken.symbol} toToken={receiveToken.symbol} />
            </section>
        )}

      </main>

      {/* Bottom Navigation Bar */}
      <nav className="dex-bottom-nav" style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          background: 'rgba(5, 5, 5, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          padding: '12px 0',
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          zIndex: 100,
          height: '65px'
      }}>
        <button 
            className={`dex-nav-item-mobile ${activeTab === 'swap' ? 'active' : ''}`}
            onClick={() => setActiveTab('swap')}
            style={{color: activeTab === 'swap' ? '#00FFA3' : '#8b9bb4'}}
        >
            <ArrowRightLeft size={20} />
            <span style={{fontSize:'0.7rem', marginTop:'4px'}}>Swap</span>
        </button>
        
        <button 
            className={`dex-nav-item-mobile ${activeTab === 'chart' ? 'active' : ''}`}
            onClick={() => setActiveTab('chart')}
            style={{color: activeTab === 'chart' ? '#00FFA3' : '#8b9bb4'}}
        >
            <Waves size={20} />
            <span style={{fontSize:'0.7rem', marginTop:'4px'}}>Chart</span>
        </button>

        <button 
            className={`dex-nav-item-mobile ${activeTab === 'positions' ? 'active' : ''}`}
            onClick={() => setActiveTab('positions')}
            style={{color: activeTab === 'positions' ? '#00FFA3' : '#8b9bb4'}}
        >
            <LayoutDashboard size={20} />
            <span style={{fontSize:'0.7rem', marginTop:'4px'}}>Positions</span>
        </button>

        <button 
            className={`dex-nav-item-mobile ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
            style={{color: activeTab === 'menu' ? '#00FFA3' : '#8b9bb4'}}
        >
            <Menu size={20} />
            <span style={{fontSize:'0.7rem', marginTop:'4px'}}>Menu</span>
        </button>
      </nav>
    </div>
  );
};

export default SwapPageMobile;

