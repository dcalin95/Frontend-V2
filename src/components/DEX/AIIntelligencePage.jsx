import React, { useState, useEffect } from 'react';
import { Send, Cpu, Activity, ShieldCheck, Zap, Brain, MessageSquare, BookOpen, TestTube } from 'lucide-react';
import './DEX.css';
import './AIIntelligencePage.css';
import { NeuralIntelligencePage } from '../../NeuralIntelligence';
import SystemDocumentation from '../../NeuralIntelligence/components/SystemDocumentation';
import WealthEngineTester from '../../NeuralIntelligence/components/WealthEngineTester';
import aiAvatarVideo from '../../assets/BitSwapDEX_AI.mp4';

const AIIntelligencePage = () => {
  // Tab state: 'chat' or 'neural' or 'docs' or 'tester'
  const [activeAITab, setActiveAITab] = useState('chat');
  
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Neural Core Online. I am monitoring 12,405 liquidity pools and 4 blockchains in real-time. How can I assist your trading strategy today?', formatted: true }
  ]);
  const [input, setInput] = useState('');
  const [btcPrice, setBtcPrice] = useState(null);
  const [priceChange24h, setPriceChange24h] = useState(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [priceHistory, setPriceHistory] = useState([]);

  // Fetch Bitcoin Price with WebSocket for real-time updates
  useEffect(() => {
    let ws = null;
    let reconnectTimeout = null;

    const connectWebSocket = () => {
      try {
        // Binance WebSocket pentru BTC/USDT în timp real
        ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');

        ws.onopen = () => {
          console.log('✅ WebSocket connected - Real-time BTC price streaming');
          setIsLoadingPrice(false);
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          const currentPrice = parseFloat(data.c); // Current price
          const change24h = parseFloat(data.P); // 24h percentage change

          setBtcPrice(currentPrice);
          setPriceChange24h(change24h);
          
          // Keep price history for micro-movements (last 20 ticks)
          setPriceHistory(prev => {
            const newHistory = [...prev, currentPrice];
            return newHistory.slice(-20);
          });
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('WebSocket closed. Reconnecting in 5s...');
          reconnectTimeout = setTimeout(connectWebSocket, 5000);
        };
      } catch (error) {
        console.error('WebSocket connection error:', error);
        // Fallback to REST API
        fetchBitcoinPriceREST();
      }
    };

    const fetchBitcoinPriceREST = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
        const data = await response.json();
        setBtcPrice(data.bitcoin.usd);
        setPriceChange24h(data.bitcoin.usd_24h_change);
        setIsLoadingPrice(false);
      } catch (error) {
        console.error('REST API error:', error);
        setBtcPrice(43250);
        setPriceChange24h(2.3);
        setIsLoadingPrice(false);
      }
    };

    // Start WebSocket connection
    connectWebSocket();

    // Cleanup
    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsgs = [...messages, { role: 'user', text: input }];
    setMessages(newMsgs);
    setInput('');
    
    // Mock AI response with rich formatting
    setTimeout(() => {
        const responses = [
            { 
                text: `Analyzing market sentiment for **$BITS**...\n\nI detect a **bullish accumulation pattern**. Key metrics:\n• Volume: +45% in 24h\n• Support level: $0.82\n• Resistance: $0.95\n\n📊 Recommendation: Consider DCA entry below **$0.85**.\n\n*Bitcoin correlation: ${btcPrice ? `$${btcPrice.toLocaleString()}` : 'Loading...'}*`,
                formatted: true 
            },
            {
                text: `🔍 **Portfolio Risk Analysis**\n\nYour current exposure:\n• High risk: 15%\n• Medium risk: 45%\n• Low risk: 40%\n\n⚠️ Suggestion: Rebalance 5% from high to stable assets.`,
                formatted: true
            },
            {
                text: `💰 **Top Opportunities Right Now:**\n\n1. **BITS/USDT** - Arbitrage spread: 0.8%\n2. **BTC Dip** - Support bounce expected at $${btcPrice ? (btcPrice * 0.98).toFixed(0) : '42,000'}\n3. **Staking Pool** - 127% APY on BITS\n\n🎯 Best ROI: Option 3`,
                formatted: true
            }
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        setMessages(prev => [...prev, { role: 'ai', ...randomResponse }]);
    }, 1000);
  };

  // Quick Action Handlers
  const handleQuickAction = (action) => {
    setInput(action);
    setTimeout(() => handleSend(), 100);
  };

  // Suggested Question Handler
  const handleSuggestedQuestion = (question) => {
    setInput(question);
    setTimeout(() => handleSend(), 100);
  };

  // Format message text (bold, links, code)
  const formatMessage = (text) => {
    if (!text) return text;
    
    // Bold text: **text**
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Code blocks: `text`
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Line breaks
    formatted = formatted.replace(/\n/g, '<br/>');
    
    return formatted;
  };

  return (
    <section className="dex-ai-page">
      {/* AI Mode Selector */}
      <div className="ai-mode-selector">
        <button 
          className={`ai-mode-btn ${activeAITab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveAITab('chat')}
        >
          <MessageSquare size={18} />
          <span>AI Assistant</span>
        </button>
        <button 
          className={`ai-mode-btn ${activeAITab === 'neural' ? 'active' : ''}`}
          onClick={() => setActiveAITab('neural')}
        >
          <Brain size={18} />
          <span>Neural Intelligence</span>
        </button>
        <button 
          className={`ai-mode-btn ${activeAITab === 'docs' ? 'active' : ''}`}
          onClick={() => setActiveAITab('docs')}
        >
          <BookOpen size={18} />
          <span>Documentation</span>
        </button>
        <button 
          className={`ai-mode-btn ${activeAITab === 'tester' ? 'active' : ''}`}
          onClick={() => setActiveAITab('tester')}
        >
          <TestTube size={18} />
          <span>Wealth Engine Test</span>
        </button>
      </div>

      {/* Conditional Render based on active tab */}
      {activeAITab === 'chat' ? (
        <>
          {/* Live Price Ticker */}
          <div className="live-price-ticker">
            <div className="ticker-item">
              <span className="ticker-icon">₿</span>
              <span className="ticker-label">BTC:</span>
              <span className={`ticker-price ${priceHistory.length >= 2 && priceHistory[priceHistory.length - 1] > priceHistory[priceHistory.length - 2] ? 'price-up' : priceHistory.length >= 2 && priceHistory[priceHistory.length - 1] < priceHistory[priceHistory.length - 2] ? 'price-down' : ''}`}>
                {isLoadingPrice ? '...' : `$${btcPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </span>
              <span className={`ticker-change ${priceChange24h >= 0 ? 'positive' : 'negative'}`}>
                {priceChange24h >= 0 ? '▲' : '▼'} {Math.abs(priceChange24h)?.toFixed(2)}%
              </span>
              <span className="live-indicator">
                <span className="live-dot"></span>
                LIVE
              </span>
            </div>
            <div className="ticker-pulse"></div>
          </div>

          <div className="ai-hero-section">
            <div className="ai-hero-header">
                <div className="ai-hero-avatar">
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="ai-avatar-video"
                  >
                    <source src={aiAvatarVideo} type="video/mp4" />
                  </video>
                </div>
                <div>
                    <h2 className="ai-hero-title">AI ASSISTANT</h2>
                    <div style={{color:'#00FFA3', fontSize:'0.9rem', letterSpacing:'1px'}}>SYSTEM STATUS: OPERATIONAL</div>
                </div>
            </div>

            <div className="ai-chat-interface">
                {/* Suggested Questions (shown when chat is empty or few messages) */}
                {messages.length <= 1 && (
                  <div className="suggested-questions">
                    <h4>💡 Suggested Questions:</h4>
                    <div className="suggestions-grid">
                      <button className="suggestion-card" onClick={() => handleSuggestedQuestion("What's the best entry point for BITS?")}>
                        <span className="suggestion-icon">📈</span>
                        <span className="suggestion-text">Best entry point for BITS?</span>
                      </button>
                      <button className="suggestion-card" onClick={() => handleSuggestedQuestion("Analyze my current portfolio risk")}>
                        <span className="suggestion-icon">⚠️</span>
                        <span className="suggestion-text">Portfolio risk analysis</span>
                      </button>
                      <button className="suggestion-card" onClick={() => handleSuggestedQuestion("Which pools have highest APY?")}>
                        <span className="suggestion-icon">💰</span>
                        <span className="suggestion-text">Highest APY pools</span>
                      </button>
                      <button className="suggestion-card" onClick={() => handleSuggestedQuestion("Show me whale movements in last 24h")}>
                        <span className="suggestion-icon">🐋</span>
                        <span className="suggestion-text">Whale movements</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="ai-chat-history">
                    {messages.map((msg, i) => (
                        <div key={i} className={`ai-chat-bubble ${msg.role}`}>
                            {msg.role === 'ai' && <span style={{fontWeight:'700', display:'block', marginBottom:'4px', color:'#00FFA3'}}>AI CORE</span>}
                            {msg.formatted ? (
                              <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />
                            ) : (
                              msg.text
                            )}
                        </div>
                    ))}
                </div>
                
                {/* Quick Action Buttons */}
                <div className="quick-actions">
                  <button className="quick-action-btn" onClick={() => handleQuickAction("Analyze current market conditions")}>
                    📊 Market Analysis
                  </button>
                  <button className="quick-action-btn" onClick={() => handleQuickAction("Review my portfolio performance")}>
                    💰 Portfolio Review
                  </button>
                  <button className="quick-action-btn" onClick={() => handleQuickAction("Check my risk exposure")}>
                    ⚠️ Risk Check
                  </button>
                  <button className="quick-action-btn" onClick={() => handleQuickAction("Show best opportunities now")}>
                    🎯 Best Opportunities
                  </button>
                </div>

                <div className="ai-input-area">
                    <input 
                        type="text" 
                        className="ai-input-field" 
                        placeholder="Ask about market trends, token safety, or strategy..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button className="ai-send-btn" onClick={handleSend}>
                        <Send size={20} />
                    </button>
                </div>
            </div>
          </div>

          <div className="ai-features-grid">
              <div className="ai-feature-card">
                  <div className="ai-feature-icon"><Cpu size={24} /></div>
                  <h3 className="ai-feature-title">Predictive Analytics</h3>
                  <p className="ai-feature-desc">AI models forecast price movements with 84% accuracy using on-chain volume analysis.</p>
              </div>
              <div className="ai-feature-card">
                  <div className="ai-feature-icon"><ShieldCheck size={24} /></div>
                  <h3 className="ai-feature-title">Rug-Pull Detection</h3>
                  <p className="ai-feature-desc">Smart contracts are scanned instantly for malicious code before you swap.</p>
              </div>
              <div className="ai-feature-card">
                  <div className="ai-feature-icon"><Activity size={24} /></div>
                  <h3 className="ai-feature-title">Whale Watcher</h3>
                  <p className="ai-feature-desc">Real-time alerts when large wallets move funds into or out of tracked assets.</p>
              </div>
              <div className="ai-feature-card">
                  <div className="ai-feature-icon"><Zap size={24} /></div>
                  <h3 className="ai-feature-title">MEV Protection</h3>
                  <p className="ai-feature-desc">Your transactions are routed through private channels to prevent front-running.</p>
              </div>
          </div>
        </>
      ) : activeAITab === 'neural' ? (
        /* Neural Intelligence Tab - Advanced Trading AI */
        <NeuralIntelligencePage />
      ) : activeAITab === 'docs' ? (
        /* Documentation Tab - System Architecture */
        <SystemDocumentation />
      ) : (
        /* Wealth Engine Tester Tab */
        <WealthEngineTester />
      )}
    </section>
  );
};

export default AIIntelligencePage;
