import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import SwapPanel from './SwapPanel';
import TradingChart from './TradingChart';
import PositionsTable from './PositionsTable';
import CosmicLoader from './CosmicLoader'; // New AI Loader
import './DEX.css';
import bitsLogo from '../../assets/logo.png';

// Data Definitions (RESTORED TO ORIGINAL STATE: bBNB, xBTC)
const tokens = [
  { id: 'BTC', name: 'Bitcoin', symbol: 'BTC', icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
  { id: 'bBNB', name: 'Binance Coin', symbol: 'bBNB', icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
  { id: 'xBTC', name: 'Wrapped BTC', symbol: 'xBTC', icon: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png' },
  { id: 'STX', name: 'Stacks', symbol: 'STX', icon: 'https://cryptologos.cc/logos/stacks-stx-logo.png' },
  { id: 'BITS', name: 'BitSwap Token', symbol: 'BITS', icon: bitsLogo },
];

const MOCK_BALANCES = {
  BTC: '2.45',
  bBNB: '0.00',
  xBTC: '0.50',
  STX: '1250.00',
  BITS: '5000.00'
};

const SwapPage = () => {
  const [activeTab, setActiveTab] = useState('swap');
  const [isLoading, setIsLoading] = useState(true); // Loading State
  
  // Lifted State for Tokens to share with Sidebar AI
  const [payToken, setPayToken] = useState(tokens[0]);
  const [receiveToken, setReceiveToken] = useState(tokens[1]);

  // --- PERSISTENT STATE (LocalStorage) ---
  // 1. Initialize Balance
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem('dex_demo_balance');
    return saved ? parseFloat(saved) : 142590.00; // Default if new
  });

  // 2. Initialize Positions
  const [positions, setPositions] = useState(() => {
    const saved = localStorage.getItem('dex_demo_positions');
    return saved ? JSON.parse(saved) : [];
  });

  // Simulate AI Initialization
  useEffect(() => {
      const timer = setTimeout(() => {
          setIsLoading(false);
      }, 3500); // Increased to 3.5s for full dramatic effect
      return () => clearTimeout(timer);
  }, []);

  // Save changes to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dex_demo_balance', balance.toString());
  }, [balance]);

  useEffect(() => {
    localStorage.setItem('dex_demo_positions', JSON.stringify(positions));
  }, [positions]);


  const handleSwapExecution = (tradeDetails) => {
    // Not really deducting from balance for Swap (assuming Margin trading or just adding position)
    // But let's say we deduct margin or fee? For now, just adding position.
    
    const newPosition = {
      id: Date.now(),
      symbol: `${tradeDetails.payToken}/${tradeDetails.receiveToken}`,
      type: 'Buy',
      amount: tradeDetails.amount,
      openPrice: tradeDetails.price,
      timestamp: new Date()
    };
    setPositions(prev => [newPosition, ...prev]);
  };

  const handleClosePosition = (id, profit) => {
    // 1. Remove position
    setPositions(prev => prev.filter(p => p.id !== id));
    
    // 2. Realize Profit/Loss (Add/Subtract from Balance)
    setBalance(prev => prev + profit);
  };

  // AI Loader View
  if (isLoading) {
      return <CosmicLoader />;
  }

  return (
    <div className="dex-page-container">
      <div className="stagger-fade-in stagger-1" style={{height: '100%'}}>
        <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
            aiContext={{ fromToken: payToken.symbol, toToken: receiveToken.symbol }}
            balance={balance} // Pass dynamic balance
            assets={MOCK_BALANCES} // Pass assets breakdown
        />
      </div>

      <div className="dex-main-content">
        <div className="dex-glow-bg">
          <div className="dex-glow-1" />
          <div className="dex-glow-2" />
        </div>

        <div className="dex-main-inner">
          <main className="dex-trading-area">
            {activeTab === 'swap' ? (
              <>
                {/* Upper Section: Panel + Chart */}
                <div className="dex-top-split">
                    <section className="dex-panel-section stagger-fade-in stagger-2">
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

                    <section className="dex-chart-section stagger-fade-in stagger-3">
                      <TradingChart fromToken={payToken.symbol} toToken={receiveToken.symbol} />
                    </section>
                </div>

                {/* Bottom Section: Positions Table */}
                <section className="dex-positions-section stagger-fade-in stagger-4">
                    <PositionsTable 
                        positions={positions} 
                        onClosePosition={handleClosePosition} 
                        balance={balance} // Pass balance for Footer
                    />
                </section>
              </>
            ) : (
              <div className="dex-coming-soon stagger-fade-in">
                <h2>Coming Soon</h2>
                <p>The {activeTab} module is currently under development.</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SwapPage;
