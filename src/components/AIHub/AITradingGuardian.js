import React, { useState, useEffect, useRef } from 'react';
import './AITradingGuardian.css';
import { useWallet } from '../../context/WalletContext';

const AITradingGuardian = ({ userProfile }) => {
  const { walletAddress } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      type: 'guardian', 
      text: 'Guardian System Online. I am monitoring your psychological state and market conditions. Stay disciplined.' 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  const toggleGuardian = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // 🧠 THE BRAIN: Local Heuristic Analysis
  // This mimics AI logic without burning API credits for every interaction
  const analyzeInputAndRespond = async (text) => {
    setIsThinking(true);
    const lowerText = text.toLowerCase();
    
    let responseText = "";
    let type = "guardian";

    // Simulated delay for "Thinking"
    await new Promise(r => setTimeout(r, 1500));

    // 1. FOMO Detection
    if (lowerText.includes("buy") || lowerText.includes("moon") || lowerText.includes("pump")) {
      responseText = "⚠️ High FOMO detected. Based on your risk profile, chasing green candles has a 72% failure rate. Are you entering based on setup or emotion?";
      type = "guardian"; // Warning tone
    }
    // 2. Panic Detection
    else if (lowerText.includes("sell") || lowerText.includes("dump") || lowerText.includes("crash") || lowerText.includes("lost")) {
      responseText = "🛑 Panic Selling Protocol activated. Take a breath. Is the fundamental thesis invalid, or is this just price action noise? Do not act on fear.";
      type = "alert";
    }
    // 3. Wallet Context
    else if (lowerText.includes("balance") || lowerText.includes("wallet")) {
      responseText = walletAddress 
        ? `Wallet connected: ${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}. Your BITS holdings qualify you for Level ${userProfile?.tier || 1} protection.`
        : "Wallet not connected. I cannot analyze your portfolio exposure.";
    }
    // 4. General Advice
    else if (lowerText.includes("advice") || lowerText.includes("help")) {
      responseText = "I advise sticking to your trading plan. The market is volatile today. Monitor your leverage and avoid revenge trading.";
    }
    // Default
    else {
      responseText = "I am listening. My primary directive is capital preservation. What is your current market query?";
    }

    const newMessage = {
      id: Date.now(),
      type: type,
      text: responseText
    };

    setMessages(prev => [...prev, newMessage]);
    setIsThinking(false);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add User Message
    const userMsg = {
      id: Date.now(),
      type: 'user',
      text: inputValue
    };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputValue;
    setInputValue('');

    // Trigger AI Analysis
    analyzeInputAndRespond(currentInput);
  };

  const handleQuickAction = (action) => {
    const userMsg = { id: Date.now(), type: 'user', text: action };
    setMessages(prev => [...prev, userMsg]);
    analyzeInputAndRespond(action);
  };

  return (
    <div className="guardian-container">
      
      {/* The Interface Window */}
      {isOpen && (
        <div className="guardian-interface">
          <div className="guardian-header">
            <div className="guardian-identity">
              <div className="guardian-avatar">🛡️</div>
              <div>
                <div className="guardian-name">SENTINEL AI</div>
                <div className="guardian-level">Status: Active • Level 2</div>
              </div>
            </div>
            <button className="close-btn" onClick={toggleGuardian}>
              <i className="fas fa-chevron-down"></i>
            </button>
          </div>

          <div className="guardian-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`message ${msg.type}`}>
                {msg.text}
              </div>
            ))}
            {isThinking && (
              <div className="message guardian">
                <span className="loading-dots">Analyzing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="guardian-chips">
            <button className="chip" onClick={() => handleQuickAction("Should I buy now?")}>Should I buy?</button>
            <button className="chip" onClick={() => handleQuickAction("I want to sell everything!")}>Panic Sell</button>
            <button className="chip" onClick={() => handleQuickAction("Check my risk profile")}>Risk Profile</button>
          </div>

          <form className="guardian-input-area" onSubmit={handleSend}>
            <input 
              type="text" 
              className="guardian-input" 
              placeholder="Ask the Guardian..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button type="submit" className="send-btn">
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}

      {/* The Floating Orb Activator */}
      <div className="guardian-orb" onClick={toggleGuardian}>
        <div className="guardian-status-dot" style={{ background: isThinking ? '#DC1FFF' : '#00FFA3' }}></div>
        <div className="orb-icon">🛡️</div>
      </div>

    </div>
  );
};

export default AITradingGuardian;

