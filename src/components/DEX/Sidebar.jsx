import React, { useState, useContext } from 'react';
import AiSuggestionBox from './AiSuggestionBox';
import bitsLogo from '../../assets/logo.png';
import usdtLogo from '../../assets/icons/tether-usdt-logo.png';
import SmartTooltip from '../../Presale/components/SmartTooltip'; // Import SmartTooltip
import WalletContext from '../../context/WalletContext'; // ✅ REAL WALLET
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Waves, 
  Lock, 
  Scale, 
  Wallet, 
  Power, 
  ChevronDown,
  CheckCircle2,
  LogIn,
  Coins,
  Brain
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, accountMode, setAccountMode, aiContext, balance = 142590.00, assets }) => {
  // ✅ REAL WALLET CONNECTION from WalletContext
  const { 
    isConnected, 
    walletAddress, 
    ethBalance, 
    nativeSymbol,
    bitsBalance,
    connectWallet, 
    disconnectWallet,
    network 
  } = useContext(WalletContext);
  
  const [showAssets, setShowAssets] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { id: 'swap', label: 'Swap', icon: <ArrowRightLeft size={16} /> },
    { id: 'pools', label: 'Pools', icon: <Waves size={16} /> },
    { id: 'stake', label: 'Stake', icon: <Lock size={16} /> },
    { id: 'governance', label: 'Vote', icon: <Scale size={16} /> },
    { id: 'ai-intelligence', label: 'AI Intelligence', icon: <Brain size={16} /> },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="dex-sidebar">
        <SmartTooltip content={`BitSwapDEX Neural Simulation Environment\n
This is not just a demo. It represents the active training ground for our proprietary "Quantum-Liquidity" Neural Network.\n
Current Status: Learning Phase (Epoch 42)\n
The platform is currently ingesting live blockchain data (BSC, ETH, SOL) to train the AI Agent on volatility patterns and slippage prediction.\n
Why are you here?\n
You are testing the interface that will dominate DeFi. The Mainnet will use this exact AI kernel to execute trades with 0.01s latency, beating standard AMMs by anticipating price movements before they happen.\n
Every trade you make here refines the algorithm for maximum profitability.`}>
          <div 
            className="dex-logo-area" 
            onClick={() => window.location.href = '/'} 
            style={{ cursor: 'pointer' }}
            title="Back to Home"
          >
            <img 
               src={bitsLogo} 
               alt="BitSwap Logo" 
               style={{ 
                   width: 32, height: 32, 
                   filter: 'drop-shadow(0 0 6px rgba(139, 155, 180, 0.3))' 
               }} 
            />
            <div className="dex-logo-text">
              <span className="solana-gradient-text">BitSwap</span>DEX <span style={{ color: '#DC1FFF' }}>AI</span>
            </div>
            
            {/* HOME Badge - Click to go back to homepage */}
            <div style={{ marginLeft: 'auto' }}>
                <div className="dex-demo-badge-cosmic">
                    HOME
                </div>
            </div>
          </div>
        </SmartTooltip>

        {/* 🎯 DEMO/REAL MODE TOGGLE (Compact) */}
        <div style={{ 
          padding: '12px', 
          borderBottom: '2px solid rgba(255,255,255,0.08)',
          marginBottom: '12px',
          background: 'linear-gradient(180deg, rgba(0,255,163,0.03) 0%, rgba(0,0,0,0) 100%)'
        }}>
          <div style={{ 
            fontSize: '0.65rem', 
            color: '#00FFA3', 
            marginBottom: '10px',
            fontWeight: '700',
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            textAlign: 'center'
          }}>
            ⚙️ Trading Mode
          </div>
          
          <div style={{ 
            display: 'flex', 
            gap: '6px', 
            padding: '5px', 
            background: 'rgba(0,0,0,0.5)', 
            borderRadius: '10px', 
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)'
          }}>
            <button
              onClick={() => setAccountMode('DEMO')}
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: '0.8rem',
                fontWeight: '800',
                border: accountMode === 'DEMO' ? '2px solid #00FFA3' : '2px solid transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: accountMode === 'DEMO' 
                  ? 'linear-gradient(135deg, #00FFA3 0%, #00D484 100%)' 
                  : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                color: accountMode === 'DEMO' ? '#000' : '#666',
                boxShadow: accountMode === 'DEMO' 
                  ? '0 0 20px rgba(0, 255, 163, 0.5), inset 0 1px 3px rgba(255,255,255,0.3)' 
                  : 'none',
                textShadow: accountMode === 'DEMO' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <span style={{ fontSize: '0.9rem' }}>📊</span>
              DEMO
            </button>
            <button
              onClick={() => setAccountMode('REAL')}
              style={{
                flex: 1,
                padding: '10px 12px',
                fontSize: '0.8rem',
                fontWeight: '800',
                border: accountMode === 'REAL' ? '2px solid #E6444D' : '2px solid transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: accountMode === 'REAL' 
                  ? 'linear-gradient(135deg, #E6444D 0%, #FF6B6B 100%)' 
                  : 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                color: accountMode === 'REAL' ? '#fff' : '#666',
                boxShadow: accountMode === 'REAL' 
                  ? '0 0 20px rgba(230, 68, 77, 0.5), inset 0 1px 3px rgba(255,255,255,0.2)' 
                  : 'none',
                textShadow: accountMode === 'REAL' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <span style={{ fontSize: '0.9rem' }}>⚡</span>
              REAL
            </button>
          </div>
          
          {/* Explicație detaliată */}
          <div style={{
            marginTop: '10px',
            padding: '8px 10px',
            background: accountMode === 'DEMO' 
              ? 'rgba(0, 255, 163, 0.08)' 
              : 'rgba(230, 68, 77, 0.08)',
            borderLeft: `3px solid ${accountMode === 'DEMO' ? '#00FFA3' : '#E6444D'}`,
            borderRadius: '4px',
            fontSize: '0.65rem',
            lineHeight: '1.5',
            color: '#bbb'
          }}>
            {accountMode === 'DEMO' ? (
              <>
                <div style={{ fontWeight: '700', color: '#00FFA3', marginBottom: '4px' }}>
                  📊 SIMULATION MODE
                </div>
                <div style={{ opacity: 0.9 }}>
                  • Practice trading risk-free with virtual funds
                  <br />
                  • Instant swaps, no blockchain fees
                  <br />
                  • Perfect for learning & testing strategies
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: '700', color: '#E6444D', marginBottom: '4px' }}>
                  ⚡ LIVE BLOCKCHAIN MODE
                </div>
                <div style={{ opacity: 0.9 }}>
                  • Real BSC transactions using your wallet
                  <br />
                  • Actual gas fees & slippage apply
                  <br />
                  • <strong style={{ color: '#FF6B6B' }}>Your funds are at risk</strong> - trade carefully
                </div>
              </>
            )}
          </div>
        </div>

        <nav className="dex-nav-menu">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`dex-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="dex-nav-icon">{item.icon}</span>
              <span className="dex-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* REMOVED: AI Copilot Insight - Now floating avatar instead */}

        {/* Wallet Logic */}
        {isConnected ? (
          <div className="dex-wallet-card">
            <div className="dex-wallet-header">
              <div className="dex-wallet-status">
                <CheckCircle2 size={12} color="#00FFA3" />
                <span>Connected</span>
              </div>
              <div className="dex-wallet-network">
                {network || 'Unknown Network'}
              </div>
            </div>
            
            <div className="dex-wallet-info">
              <div className="dex-wallet-avatar-row">
                 <div className="dex-avatar-glow" />
                 <div className="dex-address-col">
                    <span className="dex-addr-text">
                      {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : '0x...'}
                    </span>
                    <span className="dex-addr-label">@trader</span>
                 </div>
              </div>
              <button 
                className="dex-wallet-more-btn"
                onClick={() => setShowAssets(!showAssets)}
                title="Toggle Asset View"
              >
                <ChevronDown size={14} style={{ transform: showAssets ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s' }} />
              </button>
            </div>

            <div className="dex-wallet-balance-row">
               <SmartTooltip content={
                   `PORTFOLIO HEALTH SCORE\n
                   AI Risk Assessment: 98/100.\n
                   • Diversification analysis in real-time\n
                   • Exposure alerts for volatile assets\n
                   • Suggests rebalancing opportunities`
               }>
                   <span className="label" style={{cursor: 'help', borderBottom: '1px dashed #555'}}>Total Balance</span>
               </SmartTooltip>
               <span className="val" style={{ fontSize: '1.1rem' }}>${balance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>

            {/* ASSET BREAKDOWN - GLOBAL LOGIC VISUALIZER */}
            {showAssets && assets && (
              <div className="dex-asset-list">
                  {/* BITS (Native Token) Highlight - TRIGGER ON WHOLE ROW */}
                  <SmartTooltip content={`$BITS: The Wealth Engine of the Ecosystem\n
$BITS is not just a utility token; it is the fuel for the entire AI economy. Holding it is the key to capturing the platform's value.\n
Why hold $BITS?\n
1. Universal Gas: Pay ALL transaction fees in $BITS at a significantly discounted rate. You save money on every trade.\n
2. Yield Multiplier: Staking $BITS unlocks "AI Sniper" tiers, granting you higher APY in liquidity pools and access to exclusive presales.\n
3. Deflationary Burn Mechanism: A percentage of every trade fee collected by the DEX is used to buy back and burn $BITS. This permanently reduces the supply.\n
As DEX volume grows, demand for $BITS increases while supply decreases. This mathematical certainty drives value appreciation for early adopters.`}>
                    <div className="dex-asset-row highlight" style={{ cursor: 'help' }}>
                        <div className="dex-asset-icon-wrapper">
                          <img src={bitsLogo} alt="BITS" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
                        </div>
                        <div className="dex-asset-details">
                            <span className="dex-asset-symbol"><span className="solana-gradient-text">BITS</span> <span className="dex-asset-badge">Fee Discount</span></span>
                            <span className="dex-asset-amount">{assets.BITS}</span>
                        </div>
                    </div>
                  </SmartTooltip>
                  
                  {/* BTC */}
                  <div className="dex-asset-row">
                      <div className="dex-asset-icon-wrapper">
                         <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.png" alt="BTC" style={{width: '100%', height: '100%'}} />
                      </div>
                      <div className="dex-asset-details">
                          <span className="dex-asset-symbol">BTC</span>
                          <span className="dex-asset-amount">{assets.BTC}</span>
                      </div>
                  </div>

                  {/* BNB */}
                  {assets.BNB && (
                    <div className="dex-asset-row">
                        <div className="dex-asset-icon-wrapper">
                           <img src="https://cryptologos.cc/logos/bnb-bnb-logo.png" alt="BNB" style={{width: '100%', height: '100%'}} />
                        </div>
                        <div className="dex-asset-details">
                            <span className="dex-asset-symbol">BNB</span>
                            <span className="dex-asset-amount">{assets.BNB}</span>
                        </div>
                    </div>
                  )}

                  {/* ETH */}
                  {assets.ETH && (
                    <div className="dex-asset-row">
                        <div className="dex-asset-icon-wrapper">
                           <img src="https://cryptologos.cc/logos/ethereum-eth-logo.png" alt="ETH" style={{width: '100%', height: '100%'}} />
                        </div>
                        <div className="dex-asset-details">
                            <span className="dex-asset-symbol">ETH</span>
                            <span className="dex-asset-amount">{assets.ETH}</span>
                        </div>
                    </div>
                  )}

                  {/* USDT */}
                  {assets.USDT && (
                    <div className="dex-asset-row">
                        <div className="dex-asset-icon-wrapper">
                           <img src={usdtLogo} alt="USDT" style={{width: '100%', height: '100%'}} />
                        </div>
                        <div className="dex-asset-details">
                            <span className="dex-asset-symbol">USDT</span>
                            <span className="dex-asset-amount">{assets.USDT}</span>
                        </div>
                    </div>
                  )}

                  {/* STX */}
                  {assets.STX && (
                    <div className="dex-asset-row">
                        <div className="dex-asset-icon-wrapper">
                           <img src="https://cryptologos.cc/logos/stacks-stx-logo.png" alt="STX" style={{width: '100%', height: '100%'}} />
                        </div>
                        <div className="dex-asset-details">
                            <span className="dex-asset-symbol">STX</span>
                            <span className="dex-asset-amount">{assets.STX}</span>
                        </div>
                    </div>
                  )}
              </div>
            )}

            <SmartTooltip content={
                `NON-CUSTODIAL SECURITY\n
                Your Keys, Your Crypto.\n
                • No central authority controls your funds\n
                • Smart contracts audited by CertiK\n
                • Emergency withdrawal function enabled`
            }>
                <button 
                  className="dex-disconnect-btn"
                  onClick={disconnectWallet}
                >
                  <Power size={14} />
                  <span>Disconnect</span>
                </button>
            </SmartTooltip>
          </div>
        ) : (
          <button 
            className="dex-connect-btn"
            onClick={connectWallet}
          >
            <Wallet size={16} />
            <span>Connect Wallet</span>
          </button>
        )}
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="dex-bottom-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`dex-nav-item-mobile ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
