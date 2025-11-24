import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import '../styles/SystemDocumentation.css';

/**
 * System Architecture Documentation
 * Internal technical documentation for AI BITS Neural Intelligence
 */
const SystemDocumentation = () => {
  const [expandedSections, setExpandedSections] = useState({
    goals: false,
    architecture: false,
    client: false,
    api: false,
    orchestration: false,
    trading: false,
    data: false,
    security: false,
    wealthEngine: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="system-docs-container">
      <div className="docs-header">
        <BookOpen size={32} style={{ color: '#00FFA3' }} />
        <h1>System Architecture</h1>
        <p className="docs-subtitle">Internal Documentation - AI BITS Neural Intelligence</p>
      </div>

      {/* Section 1: Goals */}
      <div className="docs-section">
        <button 
          className="section-header"
          onClick={() => toggleSection('goals')}
        >
          {expandedSections.goals ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          <h2>1. Goals of AI BITS</h2>
        </button>
        {expandedSections.goals && (
          <div className="section-content">
            <p className="section-intro">
              <strong>AI BITS ("Neural Intelligence")</strong> is an AI-driven trading and liquidity management 
              layer built around the BitSwapDEX_AI ecosystem. Its goals:
            </p>
            <ul>
              <li>✅ <strong>Assist users</strong> in discovering, configuring, and executing trading strategies.</li>
              <li>✅ <strong>Route trades</strong> through BitSwapDEX (your own exchange) and, when needed, through external DEX/CEX liquidity.</li>
              <li>✅ <strong>Enforce risk limits</strong>, jurisdiction rules, and user preferences automatically.</li>
              <li>✅ <strong>Provide a unified AI experience</strong> across Web UI (bits-ai.io) and Telegram bot.</li>
            </ul>
            <div className="info-box">
              <span className="info-icon">ℹ️</span>
              <span>AI BITS is not a single model, but an <strong>orchestrated system</strong> of services, agents, and smart contracts.</span>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Architecture */}
      <div className="docs-section">
        <button 
          className="section-header"
          onClick={() => toggleSection('architecture')}
        >
          {expandedSections.architecture ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          <h2>2. High-Level Architecture Overview</h2>
        </button>
        {expandedSections.architecture && (
          <div className="section-content">
            <p><strong>Conceptual layers:</strong></p>
            
            <div className="architecture-layer">
              <h3>📱 Client Layer</h3>
              <ul>
                <li>bits-ai.io Web App (Exchange UI + "Neural Intelligence" tab)</li>
                <li>Telegram Bot @bits_ai_bot</li>
              </ul>
            </div>

            <div className="architecture-layer">
              <h3>🔐 API Gateway & Auth Layer</h3>
              <ul>
                <li>REST/GraphQL API for all clients</li>
                <li>Web3 authentication (wallets), plus optional email/username auth</li>
              </ul>
            </div>

            <div className="architecture-layer">
              <h3>🧠 AI Orchestration Layer (AI BITS Core)</h3>
              <ul>
                <li><strong>Strategy Orchestrator</strong></li>
                <li><strong>Market Intelligence Agent</strong></li>
                <li><strong>Risk & Compliance Agent</strong></li>
                <li><strong>Execution Agent</strong></li>
                <li><strong>Conversation/UX Agent</strong> (chat + explanations)</li>
              </ul>
            </div>

            <div className="architecture-layer">
              <h3>💱 Trading & Liquidity Core</h3>
              <ul>
                <li>BitSwapDEX matching engine / swap router</li>
                <li>Smart contracts on BSC / EVM (BITS, Node, CellManager, Staking, etc.)</li>
                <li>External connectors (DEX aggregators, selected CEX APIs)</li>
              </ul>
            </div>

            <div className="architecture-layer">
              <h3>💾 Data & Storage Layer</h3>
              <ul>
                <li>Market data storage (time-series DB)</li>
                <li>User profiles, strategies, risk settings (relational DB)</li>
                <li>Vector DB for AI memory (preferences, conversation embeddings)</li>
                <li>Caches for fast quotes (Redis or similar)</li>
              </ul>
            </div>

            <div className="architecture-layer">
              <h3>🛡️ Security, Monitoring & Governance</h3>
              <ul>
                <li>Observability (logs, metrics, traces)</li>
                <li>Permissions & roles</li>
                <li>Audit & compliance logs</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Client Layer */}
      <div className="docs-section">
        <button 
          className="section-header"
          onClick={() => toggleSection('client')}
        >
          {expandedSections.client ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          <h2>3. Client Layer</h2>
        </button>
        {expandedSections.client && (
          <div className="section-content">
            <h3>3.1 bits-ai.io Web App</h3>
            <p>React frontend with a dedicated section:</p>
            <div className="code-block">
              Sidebar → AI Intelligence → Neural Intelligence
            </div>

            <h4>Main UI Modules:</h4>
            
            <div className="module-card">
              <h5>📊 Strategy Configurator</h5>
              <ul>
                <li>Risk level (low/medium/high)</li>
                <li>Assets & pairs allowed (e.g. BITS/USDT, BTC/USDT, BNB/USDT)</li>
                <li>Time horizon (scalping, swing, long-term)</li>
                <li>Max drawdown / daily loss limits</li>
              </ul>
            </div>

            <div className="module-card">
              <h5>💡 AI Recommendations Panel</h5>
              <ul>
                <li>Natural-language suggestions ("I suggest rotating 15% from BNB to BITS today…")</li>
                <li>Backtest summary and scenario simulations</li>
              </ul>
            </div>

            <div className="module-card">
              <h5>⚙️ Execution Control</h5>
              <ul>
                <li><strong>Mode A:</strong> Advisory only (user clicks "Approve trade")</li>
                <li><strong>Mode B:</strong> Auto-trading within strict wallet allowances / smart-contract limits</li>
              </ul>
            </div>

            <div className="module-card">
              <h5>📈 Portfolio / Positions View</h5>
              <ul>
                <li>Current positions, PnL, realized/unrealized gains</li>
                <li>Risk exposure per asset and per strategy</li>
              </ul>
            </div>

            <h3>3.2 Telegram Bot</h3>
            <p>Uses the same AI core via API.</p>
            <div className="telegram-commands">
              <div className="command-item">
                <code>/status</code> – portfolio summary
              </div>
              <div className="command-item">
                <code>/idea</code> – simple AI suggestion (advisory mode)
              </div>
              <div className="command-item">
                <code>/risk</code> – change risk profile (stored in DB, applied to all channels)
              </div>
            </div>
            <div className="info-box">
              <span className="info-icon">🔒</span>
              <span><strong>No direct custody:</strong> for actual execution, the bot either sends a deep-link to the web UI for signature, or uses pre-approved allowances in on-chain smart contracts.</span>
            </div>
          </div>
        )}
      </div>

      {/* Section 4: API Gateway */}
      <div className="docs-section">
        <button 
          className="section-header"
          onClick={() => toggleSection('api')}
        >
          {expandedSections.api ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          <h2>4. API Gateway & Authentication Layer</h2>
        </button>
        {expandedSections.api && (
          <div className="section-content">
            <h3>API Gateway</h3>
            <p>Exposes REST/GraphQL endpoints:</p>
            <div className="endpoints-list">
              <div className="endpoint-item">
                <span className="method post">POST</span>
                <code>/ai/strategy</code> – create/update strategies
              </div>
              <div className="endpoint-item">
                <span className="method post">POST</span>
                <code>/ai/simulate</code> – run backtests or scenario simulations
              </div>
              <div className="endpoint-item">
                <span className="method post">POST</span>
                <code>/ai/trade</code> – request an AI-generated trade plan
              </div>
              <div className="endpoint-item">
                <span className="method post">POST</span>
                <code>/ai/execute</code> – execute with risk checks
              </div>
              <div className="endpoint-item">
                <span className="method get">GET</span>
                <code>/portfolio/*</code> – read positions, balances, historical trades
              </div>
            </div>

            <h3>Authentication & Authorization</h3>
            <ul>
              <li>🔐 <strong>Wallet-based auth</strong> (e.g. SIWE – Sign-In With Ethereum/BSC)</li>
              <li>📧 <strong>Optional Web2 auth</strong> (email/password, OAuth)</li>
              <li>🎫 <strong>JWT tokens</strong> for stateless API calls</li>
              <li>🛡️ <strong>Rate limiting</strong> & abuse protection for both Web and Telegram</li>
            </ul>
          </div>
        )}
      </div>

      {/* Section 5: AI Orchestration */}
      <div className="docs-section">
        <button 
          className="section-header"
          onClick={() => toggleSection('orchestration')}
        >
          {expandedSections.orchestration ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          <h2>5. AI Orchestration Layer (AI BITS Core)</h2>
        </button>
        {expandedSections.orchestration && (
          <div className="section-content">
            <p className="section-intro">
              This is where GPT-style models and your business logic live.
            </p>

            <h3>5.1 Strategy Orchestrator</h3>
            <p>Receives user intent and profile from the UI or Telegram:</p>
            <div className="example-box">
              <p>"I want conservative yield with BITS + BTC."</p>
              <p>"I accept max 2% daily drawdown."</p>
            </div>
            <p><strong>Builds a strategy object:</strong></p>
            <div className="code-block">
{`{
  "strategy_id": "user_123_conservative_yield",
  "assets": ["BITS", "BTC"],
  "risk_profile": "conservative",
  "max_daily_drawdown": 0.02,
  "time_horizon": "medium",
  "rebalance_frequency": "daily"
}`}
            </div>

            <h3>5.2 Market Intelligence Agent</h3>
            <ul>
              <li>📊 Monitors market data feeds (prices, volumes, orderbook depth)</li>
              <li>🔍 Analyzes on-chain metrics (whale movements, liquidity pools)</li>
              <li>📰 Sentiment analysis from news/social media (optional)</li>
              <li>🎯 Generates trading signals and opportunity alerts</li>
            </ul>

            <h3>5.3 Risk & Compliance Agent</h3>
            <ul>
              <li>⚖️ Validates trades against user-defined risk limits</li>
              <li>🌍 Checks jurisdiction restrictions</li>
              <li>📋 Logs all decisions for audit trail</li>
              <li>🚨 Triggers emergency stops if limits exceeded</li>
            </ul>

            <h3>5.4 Execution Agent</h3>
            <ul>
              <li>💱 Routes orders to BitSwapDEX or external liquidity sources</li>
              <li>⚡ Optimizes for best execution (price, slippage, gas)</li>
              <li>🔄 Manages order lifecycle (pending, filled, cancelled)</li>
              <li>📡 Provides real-time status updates to UI/Telegram</li>
            </ul>

            <h3>5.5 Conversation/UX Agent</h3>
            <ul>
              <li>💬 Natural language interface for user queries</li>
              <li>📖 Explains AI decisions in simple terms</li>
              <li>🎓 Educational content and strategy recommendations</li>
              <li>🤝 Handles multi-turn conversations with context memory</li>
            </ul>
          </div>
        )}
      </div>

      {/* Section 6: AI Wealth Engine */}
      <div className="docs-section">
        <button 
          className="section-header"
          onClick={() => toggleSection('wealthEngine')}
        >
          {expandedSections.wealthEngine ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          <h2>6. AI-Driven Automated Wealth Engine</h2>
        </button>
        {expandedSections.wealthEngine && (
          <div className="section-content">
            <p className="section-intro">
              <strong>AI Wealth Engine</strong> este modulul de automatizare a portofoliului care optimizează 
              alocarea activelor, rebalanseză portofoliul și gestionează riscul pe termen lung.
            </p>

            <h3>6.1 Portfolio Allocator (Core Engine)</h3>
            <p>Sistemul controlează portofoliul utilizatorului prin multiple module inteligente:</p>
            
            <div className="module-card">
              <h5>🔄 Rebalancing Engine</h5>
              <ul>
                <li>Monitorizează diferența între <strong>alocarea actuală</strong> și <strong>alocarea țintă</strong></li>
                <li>Efectuează rebalanșare incrementală doar când este necesar</li>
                <li>Minimizează taxele și slippage-ul prin trade-uri micro</li>
              </ul>
            </div>

            <div className="module-card">
              <h5>📈 Market Regime Classifier</h5>
              <p>Detectează medii de piață și ajustează alocările:</p>
              <ul>
                <li>🟢 <strong>Bullish trend</strong> - tendință ascendentă</li>
                <li>🔴 <strong>Bearish trend</strong> - tendință descendentă</li>
                <li>⚪ <strong>Sideways/Consolidation</strong> - piață laterală</li>
                <li>🟡 <strong>High-volatility phase</strong> - volatilitate mare</li>
                <li>🔵 <strong>Post-crash recovery</strong> - recuperare după corecție</li>
              </ul>
            </div>

            <div className="module-card">
              <h5>⚙️ Micro-Adjustment System</h5>
              <ul>
                <li>Efectuează "micro-trades" la interval de câteva ore</li>
                <li>Focus: minimizare risc, reducere slippage, taxe mici</li>
                <li>Îmbunătățire graduală a performanței pe termen lung</li>
              </ul>
            </div>

            <div className="module-card">
              <h5>🧠 AI Learning Loop</h5>
              <ul>
                <li>Evaluează rezultatele acțiunilor și învață continuu</li>
                <li>Îmbunătățește: selecția strategiilor, sensibilitatea pragurilor, alocările, timing-ul</li>
                <li>Loop-ul de învățare rămâne transparent și auditabil</li>
              </ul>
            </div>

            <h3>6.2 Investment Universe & Risk Constraints</h3>
            
            <div className="architecture-layer">
              <h3>✅ Eligible Assets</h3>
              <ul>
                <li>Stablecoins (USDT, USDC, BUSD)</li>
                <li>BTC / ETH</li>
                <li>BNB, MATIC, alte active majore</li>
                <li>Tokenuri din ecosistemul BITS</li>
                <li>Coșuri filtrate după risc (opțiune viitoare)</li>
              </ul>
            </div>

            <div className="architecture-layer">
              <h3>🚫 Hard Constraints</h3>
              <ul>
                <li>❌ Fără leverage excesiv (decât dacă permis de reglementări)</li>
                <li>❌ Fără futures/derivate până la licențiere</li>
                <li>❌ Fără active ilchiide</li>
                <li>❌ Fără meme/speculative tokens</li>
                <li>❌ Fără comportamente de manipulare a pieței</li>
                <li>✅ Respectarea strictă a limitelor de risc definite de utilizator</li>
              </ul>
            </div>

            <h3>6.3 Execution & Safety Architecture</h3>
            
            <div className="info-box">
              <span className="info-icon">🛡️</span>
              <span><strong>Safety Mechanisms:</strong> Sistemul execută decizii doar în condiții stricte de siguranță.</span>
            </div>

            <div className="endpoints-list">
              <div className="endpoint-item">
                <span className="method get">1</span>
                <strong>Daily Exposure Limits</strong> - Limită de expunere zilnică
              </div>
              <div className="endpoint-item">
                <span className="method get">2</span>
                <strong>Drawdown Protection</strong> - Protecție împotriva pierderilor mari
              </div>
              <div className="endpoint-item">
                <span className="method get">3</span>
                <strong>Slippage & Fee Boundaries</strong> - Limite pentru slippage și taxe
              </div>
              <div className="endpoint-item">
                <span className="method get">4</span>
                <strong>Execution Windows</strong> - Evită orele cu lichiditate redusă
              </div>
              <div className="endpoint-item">
                <span className="method get">5</span>
                <strong>Kill Switches</strong> - Global & per-user emergency stop
              </div>
              <div className="endpoint-item">
                <span className="method get">6</span>
                <strong>Fail-Safe Mode</strong> - Automat când volatilitatea depășește praguri
              </div>
            </div>

            <h3>6.4 Regulatory Compliance Framework</h3>
            <p>Wealth Engine se aliniază la principiile globale pentru investiții automatizate:</p>
            
            <div className="module-card">
              <h5>📋 Operating Modes</h5>
              <ul>
                <li>💡 <strong>Advisory Mode</strong> - Activ în toate regiunile</li>
                <li>⚙️ <strong>Semi-Automatic Mode</strong> - Majoritatea regiunilor</li>
                <li>🤖 <strong>Automated Mode</strong> - Doar în jurisdicții cu licențiere completă</li>
              </ul>
            </div>

            <div className="info-box">
              <span className="info-icon">⚖️</span>
              <span>Automatizarea completă necesită: consimțământ utilizator, verificare KYC, aprobare regulatorie per regiune.</span>
            </div>

            <h3>6.5 Competitive Advantages</h3>
            
            <div className="example-box">
              <p><strong>🔑 Key Differentiators:</strong></p>
              <ul style={{listStyle: 'none', padding: 0}}>
                <li>✅ <strong>On-Chain + Off-Chain Hybrid Intelligence</strong></li>
                <li>✅ <strong>BITS-Aware Strategies</strong> (staking, presale, rewards)</li>
                <li>✅ <strong>DeFi-Native Architecture</strong></li>
                <li>✅ <strong>Community Governance</strong></li>
                <li>✅ <strong>Multi-Chain Expansion</strong></li>
              </ul>
            </div>

            <h3>6.6 Future Expansion Opportunities</h3>
            <div className="telegram-commands">
              <div className="command-item">
                🔮 <strong>AI-powered yield aggregation</strong>
              </div>
              <div className="command-item">
                🌐 <strong>Multi-chain liquidity routing</strong>
              </div>
              <div className="command-item">
                📊 <strong>AI-driven staking optimization</strong>
              </div>
              <div className="command-item">
                🪙 <strong>Tokenized AI portfolios</strong>
              </div>
              <div className="command-item">
                👥 <strong>Social "copy-AI" investing</strong>
              </div>
              <div className="command-item">
                🛡️ <strong>Automated hedging algorithms</strong>
              </div>
              <div className="command-item">
                📈 <strong>Volatility smoothing strategies</strong>
              </div>
              <div className="command-item">
                💰 <strong>Tax optimization modes</strong>
              </div>
              <div className="command-item">
                🏢 <strong>Institutional-grade analytics</strong> (Sharpe, Sortino, VaR)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="docs-footer">
        <p>Last updated: {new Date().toLocaleDateString('ro-RO')}</p>
        <p className="version">Version 1.0.0 - AI BITS Neural Intelligence</p>
      </div>
    </div>
  );
};

export default SystemDocumentation;

