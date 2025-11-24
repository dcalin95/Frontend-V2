import React, { useState } from 'react';
import AiSuggestionBox from './AiSuggestionBox';
import bitsLogo from '../../assets/logo.png';
import SmartTooltip from '../../Presale/components/SmartTooltip'; // Import SmartTooltip
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

const Sidebar = ({ activeTab, setActiveTab, aiContext, balance = 142590.00, assets }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [showAssets, setShowAssets] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'swap', label: 'Swap', icon: <ArrowRightLeft size={20} /> },
    { id: 'pools', label: 'Pools', icon: <Waves size={20} /> },
    { id: 'stake', label: 'Stake', icon: <Lock size={20} /> },
    { id: 'governance', label: 'Vote', icon: <Scale size={20} /> },
    { id: 'ai-intelligence', label: 'AI Intelligence', icon: <Brain size={20} /> },
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
                   width: 40, height: 40, 
                   filter: 'drop-shadow(0 0 8px rgba(0, 255, 163, 0.4))' 
               }} 
            />
            <div className="dex-logo-text">
              <span className="solana-gradient-text">BitSwap</span>DEX <span style={{ color: '#00FFA3' }}>AI</span>
            </div>
            
            {/* DEMO Badge - Visual only now, trigger is the whole area */}
            <div style={{ marginLeft: 'auto' }}>
                <div className="dex-demo-badge-cosmic">
                    DEMO
                </div>
            </div>
          </div>
        </SmartTooltip>

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

        {/* AI Copilot Insight - Moved to Sidebar */}
        <div className="dex-sidebar-ai-wrapper">
             {/* AI LOGIC TOOLTIP HEADER - TRIGGER ON TITLE */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', padding: '0 4px' }}>
                <SmartTooltip content={`The Institutional Advantage: AI-Driven Execution\n
BitSwapDEX Core is not a standard AMM router. It is a Deep Learning Model processing 50,000+ liquidity points per second across Binance Smart Chain, Ethereum, and Solana.\n
How it wins against the market:\n
1. Predictive Routing: The AI anticipates slippage before it happens, locking in rates that human traders cannot see.\n
2. MEV Shield Protection: Our "Stealth Mode" splits orders into micro-batches to prevent front-running bots and sandwich attacks.\n
3. Gas Optimization: By bundling transactions and using $BITS as fuel, the AI lowers network costs by up to 40% compared to Uniswap or PancakeSwap.\n
This is institutional-grade algorithmic trading, democratized for you.`}>
                  <span style={{ fontSize: '0.75rem', color: '#8b9bb4', fontWeight: '600', cursor: 'help', borderBottom: '1px dashed #8b9bb4' }}>AI INTELLIGENCE</span>
                </SmartTooltip>
            </div>
            
            <AiSuggestionBox 
                fromToken={aiContext?.fromToken} 
                toToken={aiContext?.toToken} 
                slippage={0.5} 
            />
        </div>

        {/* Wallet Logic */}
        {isConnected ? (
          <div className="dex-wallet-card">
            <div className="dex-wallet-header">
              <div className="dex-wallet-status">
                <CheckCircle2 size={12} color="#00FFA3" />
                <span>Connected</span>
              </div>
              <div className="dex-wallet-network">
                BSC Mainnet
              </div>
            </div>
            
            <div className="dex-wallet-info">
              <div className="dex-wallet-avatar-row">
                 <div className="dex-avatar-glow" />
                 <div className="dex-address-col">
                    <span className="dex-addr-text">0x71C...9A21</span>
                    <span className="dex-addr-label">@bits_trader</span>
                 </div>
              </div>
              <button 
                className="dex-wallet-more-btn"
                onClick={() => setShowAssets(!showAssets)}
                title="Toggle Asset View"
              >
                <ChevronDown size={16} style={{ transform: showAssets ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s' }} />
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
               <span className="val" style={{ fontSize: '1.3rem' }}>${balance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
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

                   {/* STX */}
                   <div className="dex-asset-row">
                      <div className="dex-asset-icon-wrapper">
                         <img src="https://cryptologos.cc/logos/stacks-stx-logo.png" alt="STX" style={{width: '100%', height: '100%'}} />
                      </div>
                      <div className="dex-asset-details">
                          <span className="dex-asset-symbol">STX</span>
                          <span className="dex-asset-amount">{assets.STX}</span>
                      </div>
                  </div>
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
                  onClick={() => setIsConnected(false)}
                >
                  <Power size={14} />
                  <span>Disconnect</span>
                </button>
            </SmartTooltip>
          </div>
        ) : (
          <button 
            className="dex-connect-btn"
            onClick={() => {
              // Simulate connection delay
              const btn = document.querySelector('.dex-connect-btn');
              if(btn) btn.innerText = 'Connecting...';
              setTimeout(() => setIsConnected(true), 1000);
            }}
          >
            <Wallet size={18} />
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
