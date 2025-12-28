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
import FloatingAIAvatar from './FloatingAIAvatar'; // Floating AI Avatar
import WalletContext from '../../context/WalletContext'; // Import Wallet Context
import { Wallet } from 'lucide-react'; // Wallet icon
import { ethers } from 'ethers';
import { fetchTokenBalances } from './services/fetchTokenBalances';
import './DEX.css';
import bitsLogo from '../../assets/logo.png';
import usdtLogo from '../../assets/icons/tether-usdt-logo.png';
import { useDeviceDetect } from '../../hooks/useDeviceDetect'; // Import device detection hook

// DEMO Tokens (Simulation mode - current behavior)
const tokensDemo = [
  { id: 'BTCB', name: 'Bitcoin', symbol: 'BTC', icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' }, // align id with real token map
  { id: 'BNB', name: 'Binance Coin', symbol: 'BNB', icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
  { id: 'ETH', name: 'Ethereum', symbol: 'ETH', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
  { id: 'USDT', name: 'Tether USD', symbol: 'USDT', icon: usdtLogo },
  { id: 'BITS', name: 'BitSwap Token', symbol: 'BITS', icon: bitsLogo },
];

// REAL Tokens (BSC on-chain mode - PancakeSwap)
const tokensReal = [
  {
    id: 'BNB',
    name: 'Binance Coin',
    symbol: 'BNB',
    address: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native token placeholder
    decimals: 18,
    isNative: true,
    icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
  },
  {
    id: 'BTCB',
    name: 'Bitcoin (BTCB)',
    symbol: 'BTC',
    address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', // ✅ Verified BTCB on BSC
    decimals: 18,
    isNative: false,
    icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
  },
  {
    id: 'ETH',
    name: 'Ethereum (Binance-Peg)',
    symbol: 'ETH',
    address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', // ✅ Verified ETH on BSC
    decimals: 18,
    isNative: false,
    icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  {
    id: 'USDT',
    name: 'Tether USD (BSC-USD)',
    symbol: 'USDT',
    address: '0x55d398326f99059fF775485246999027B3197955', // ✅ Verified USDT on BSC
    decimals: 18,
    isNative: false,
    icon: usdtLogo,
  },
  {
    id: 'BITS',
    name: 'BitSwap Token',
    symbol: 'BITS',
    address: '0xCE056ee6ED7Ae0944f10BAfc5E7f5d160c8641fe', // ✅ Your BITS contract on BSC
    decimals: 18,
    isNative: false,
    icon: bitsLogo,
  },
];

const MOCK_BALANCES = {
  BTCB: '2.45',
  BNB: '15.50',
  ETH: '8.25',
  USDT: '25000.00',
  BITS: '5000.00'
};

const SwapPage = () => {
  const isMobileDetected = useDeviceDetect(); // Width-based detection
  const [isMobile, setIsMobile] = useState(isMobileDetected); // Combined state
  
  const [activeTab, setActiveTab] = useState('swap');
  const [isLoading, setIsLoading] = useState(true); // Loading State
  
  // Wallet Context
  const { 
    walletAddress, 
    bitsBalance, 
    ethBalance, 
    nativeSymbol, 
    connectWallet, 
    disconnectWallet,
    connector,
    chainId,
    switchNetwork
  } = useContext(WalletContext);
  
  // Account Mode: DEMO (simulator) vs REAL (on-chain BSC)
  const [accountMode, setAccountMode] = useState('DEMO'); // 'DEMO' | 'REAL'
  
  // Select token universe based on mode
  const tokens = accountMode === 'DEMO' ? tokensDemo : tokensReal;
  
  // Lifted State for Tokens to share with Sidebar AI
  const [payToken, setPayToken] = useState(tokens[0]);
  const [receiveToken, setReceiveToken] = useState(tokens[1]);

  // ✅ REAL TOKEN BALANCES (fetched from blockchain)
  const [realBalances, setRealBalances] = useState({});

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

  // Reset tokens when account mode changes
  useEffect(() => {
    setPayToken(tokens[0]);
    setReceiveToken(tokens[1]);
  }, [accountMode]);

  // ✅ FETCH REAL BALANCES when in REAL mode and wallet connected
  const loadRealBalances = async () => {
    if (accountMode !== 'REAL' || !walletAddress || !window.ethereum) {
      return;
    }

    try {
      // Verify we're on BSC (Chain ID 56)
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      
      if (network.chainId !== 56) {
        console.warn('⚠️ Not on BSC! Chain ID:', network.chainId, '| Expected: 56');
      }
      
      const balances = await fetchTokenBalances(provider, walletAddress, tokensReal);
      setRealBalances(balances);
    } catch (error) {
      console.error('❌ Failed to fetch real balances:', error);
    }
  };

  useEffect(() => {
    loadRealBalances();

    // Refresh balances every 15 seconds in REAL mode
    if (accountMode === 'REAL' && walletAddress) {
      const interval = setInterval(loadRealBalances, 15000);
      return () => clearInterval(interval);
    }
  }, [accountMode, walletAddress]);


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
    // Prepare balances for SwapPanel
    const balancesToPass = accountMode === 'DEMO' ? MOCK_BALANCES : realBalances;
    
    switch (activeTab) {
      case 'swap':
        return (
          <>
            <div className="dex-top-split">
              <section className="dex-layout-sidebar-slot stagger-fade-in stagger-2">
                <SwapPanel 
                  accountMode={accountMode}
                  setAccountMode={setAccountMode}
                  tokens={tokens}
                  balances={balancesToPass}
                  payToken={payToken}
                  setPayToken={setPayToken}
                  receiveToken={receiveToken}
                  setReceiveToken={setReceiveToken}
                  onSwap={handleSwapExecution}
                  onBalanceRefresh={loadRealBalances}
                />
              </section>

              <section className="dex-chart-section stagger-fade-in stagger-3">
                <TradingChart 
                  fromToken={payToken.symbol} 
                  toToken={receiveToken.symbol}
                  walletAddress={walletAddress}
                  bitsBalance={bitsBalance}
                  ethBalance={ethBalance}
                  nativeSymbol={nativeSymbol}
                  connectorName={connector?.name || ''}
                  chainId={chainId}
                  onConnectWallet={connectWallet}
                  onDisconnectWallet={disconnectWallet}
                  onSwitchNetwork={switchNetwork}
                />
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
      return (
        <SwapPageMobile 
          accountMode={accountMode}
          setAccountMode={setAccountMode}
          walletAddress={walletAddress}
          balance={balance}
          positions={positions}
          tokens={tokens}
          balances={balancesToPass}
          payToken={payToken}
          setPayToken={setPayToken}
          receiveToken={receiveToken}
          setReceiveToken={setReceiveToken}
          onSwap={handleSwapExecution}
          onClosePosition={handleClosePosition}
          onBalanceRefresh={loadRealBalances}
          bitsBalance={bitsBalance}
          ethBalance={ethBalance}
          nativeSymbol={nativeSymbol}
          connectorName={connector?.name || ''}
          chainId={chainId}
          onConnectWallet={connectWallet}
          onDisconnectWallet={disconnectWallet}
          onSwitchNetwork={switchNetwork}
        />
      );
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
            accountMode={accountMode}
            setAccountMode={setAccountMode}
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

        {/* Floating AI Avatar - Random Position */}
        <FloatingAIAvatar onNavigate={setActiveTab} />
      </div>
    </div>
  );
};

export default SwapPage;
