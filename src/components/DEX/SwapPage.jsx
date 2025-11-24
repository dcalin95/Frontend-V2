import React, { useState, useEffect, useContext } from 'react';
import Sidebar from './Sidebar';
import SwapPanel from './SwapPanel';
import TradingChart from './TradingChart';
import PositionsTable from './PositionsTable';
import DashboardOverview from './DashboardOverview';
import LiquidityPools from './LiquidityPools';
import StakeVault from './StakeVault';
import VoteCenter from './VoteCenter';
import AIIntelligencePage from './AIIntelligencePage'; // New Page
import CosmicLoader from './CosmicLoader'; // New AI Loader
import SwapPageMobile from './SwapPageMobile'; // Import Mobile Version
import WalletContext from '../../context/WalletContext'; // Import Wallet Context
import { Wallet } from 'lucide-react'; // Wallet icon
import './DEX.css';
import bitsLogo from '../../assets/logo.png';
import { useDeviceDetect } from '../../hooks/useDeviceDetect'; // Import device detection hook

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
  const isMobileDetected = useDeviceDetect(); // Width-based detection
  const [isMobile, setIsMobile] = useState(isMobileDetected); // Combined state
  
  const [activeTab, setActiveTab] = useState('swap');
  const [isLoading, setIsLoading] = useState(true); // Loading State
  
  // Wallet Context
  const { walletAddress, bitsBalance, ethBalance, nativeSymbol, connectWallet, disconnectWallet } = useContext(WalletContext);
  
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

  // Force Mobile Check via User Agent as fallback
  useEffect(() => {
      const checkMobileUserAgent = () => {
          const userAgent = navigator.userAgent || navigator.vendor || window.opera;
          if (/android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent) || window.innerWidth <= 768) {
              setIsMobile(true);
          } else {
              setIsMobile(isMobileDetected);
          }
      };
      checkMobileUserAgent();
      window.addEventListener('resize', checkMobileUserAgent);
      return () => window.removeEventListener('resize', checkMobileUserAgent);
  }, [isMobileDetected]);

  // Simulate AI Initialization (Cinematic 10s Intro)
  useEffect(() => {
      const timer = setTimeout(() => {
          setIsLoading(false);
      }, 10000); // Reduced to 10 Seconds as requested
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

  const renderMainContent = () => {
    switch (activeTab) {
      case 'swap':
        return (
          <>
            <div className="dex-top-split">
              <section className="dex-layout-sidebar-slot stagger-fade-in stagger-2">
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

            <section className="dex-positions-section stagger-fade-in stagger-4">
              <PositionsTable 
                  positions={positions} 
                  onClosePosition={handleClosePosition} 
                  balance={balance} 
              />
            </section>
          </>
        );
      case 'dashboard':
        return (
          <DashboardOverview 
            positions={positions}
            balance={balance}
            onClosePosition={handleClosePosition}
          />
        );
      case 'pools':
        return <LiquidityPools layout="grid" />;
      case 'stake':
        return <StakeVault layout="desktop" />;
      case 'governance':
        return <VoteCenter />;
      case 'ai-intelligence':
        return <AIIntelligencePage />;
      default:
        return null;
    }
  };

  // Mobile View - Prioritize Mobile Component
  if (isMobile) {
      return <SwapPageMobile />;
  }

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

        {/* Desktop Wallet Header */}
        <div className="dex-desktop-wallet-header">
          {!walletAddress ? (
            <button className="dex-wallet-connect-btn" onClick={connectWallet}>
              <Wallet size={18} />
              <span>Connect Wallet</span>
            </button>
          ) : (
            <div className="dex-wallet-info-display">
              <div className="dex-wallet-balances">
                <div className="dex-wallet-balance-item">
                  <img src={bitsLogo} alt="BITS" style={{ width: 20, height: 20 }} />
                  <span className="balance-amount">{parseFloat(bitsBalance).toFixed(2)}</span>
                  <span className="balance-symbol">BITS</span>
                </div>
                <div className="dex-wallet-balance-item">
                  <span className="balance-amount">{parseFloat(ethBalance).toFixed(4)}</span>
                  <span className="balance-symbol">{nativeSymbol}</span>
                </div>
              </div>
              <div className="dex-wallet-address-chip">
                <Wallet size={16} />
                <span>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
              </div>
              <button className="dex-wallet-disconnect-btn" onClick={disconnectWallet}>
                Disconnect
              </button>
            </div>
          )}
        </div>

        <div className="dex-main-inner">
          <main className="dex-trading-area">
            {renderMainContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SwapPage;
