import React, { useState } from 'react';
import { Send, Cpu, Activity, ShieldCheck, Zap } from 'lucide-react';
import './DEX.css';
import './AIIntelligencePage.css';

const AIIntelligencePage = () => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Neural Core Online. I am monitoring 12,405 liquidity pools and 4 blockchains in real-time. How can I assist your trading strategy today?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsgs = [...messages, { role: 'user', text: input }];
    setMessages(newMsgs);
    setInput('');
    
    // Mock AI response
    setTimeout(() => {
        setMessages(prev => [...prev, { 
            role: 'ai', 
            text: 'Analyzing market sentiment... I detect a bullish accumulation pattern on $BITS. Recommendation: Consider DCA entry below $0.85.' 
        }]);
    }, 1000);
  };

  return (
    <section className="dex-ai-page">
      <div className="ai-hero-section">
        <div className="ai-hero-header">
            <div className="ai-hero-avatar"></div>
            <div>
                <h2 className="ai-hero-title">NEURAL INTELLIGENCE</h2>
                <div style={{color:'#00FFA3', fontSize:'0.9rem', letterSpacing:'1px'}}>SYSTEM STATUS: OPERATIONAL</div>
            </div>
        </div>

        <div className="ai-chat-interface">
            <div className="ai-chat-history">
                {messages.map((msg, i) => (
                    <div key={i} className={`ai-chat-bubble ${msg.role}`}>
                        {msg.role === 'ai' && <span style={{fontWeight:'700', display:'block', marginBottom:'4px', color:'#00FFA3'}}>AI CORE</span>}
                        {msg.text}
                    </div>
                ))}
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
    </section>
  );
};

export default AIIntelligencePage;
