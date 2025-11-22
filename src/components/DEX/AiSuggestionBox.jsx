import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Zap, ScanLine } from 'lucide-react';
import './DEX.css';
import aiVideo from '../../assets/BitSwapDEX_AI.mp4';

const AiSuggestionBox = ({ fromToken, toToken, slippage }) => {
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  
  // Use ref to track typing index to prevent closure staleness or strict mode double-invocations
  const indexRef = useRef(0);

  // Constants must be declared before useEffect
  const isBtcToBnb = fromToken === 'BTC' && toToken === 'bBNB';
  const involvesBits = fromToken === 'BITS' || toToken === 'BITS';

  // Dynamic Message Logic
  let mainMessage = '';
  let subMessage = '';
  
  if (isBtcToBnb) {
    mainMessage = "High-Speed Bridge Detected via Stacks (STX).";
    subMessage = "Gas Efficiency: +35% | Est. Time: ~4.5 mins";
  } else if (involvesBits) {
    mainMessage = "Native Token Boost Active.";
    subMessage = "Trading with $BITS unlocks premium staking APY tiers.";
  } else {
    mainMessage = `Analyzing liquidity for ${fromToken}/${toToken}...`;
    subMessage = `Market volatility normal. Slippage ${slippage}% optimal.`;
  }

  // Typing Effect (Robust)
  useEffect(() => {
    if (!fromToken || !toToken) return;

    setTypedText('');
    setIsTyping(true);
    indexRef.current = 0;
    
    const fullText = mainMessage;
    
    const timer = setInterval(() => {
      const currentIndex = indexRef.current;
      
      if (currentIndex < fullText.length) {
        const char = fullText.charAt(currentIndex);
        setTypedText((prev) => prev + char);
        indexRef.current++;
      } else {
        clearInterval(timer);
        setIsTyping(false);
        // Ensure full text matches exactly at the end
        setTypedText(fullText);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [mainMessage, fromToken, toToken]);

  // Conditional rendering AFTER all hooks
  if (!fromToken || !toToken) return null;

  return (
    <div className="dex-neural-card">
      {/* Scanner Animation Overlay */}
      <div className="dex-neural-scan-line" />
      
      <div className="dex-neural-header">
        <div className="dex-neural-title">
          {/* AI AVATAR VIDEO */}
          <div className="dex-ai-avatar-container">
             <video 
                src={aiVideo} 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="dex-ai-video"
             />
             <div className="dex-ai-glow-ring" />
          </div>
          <span style={{ marginLeft: '8px' }}>AI Copilot Insight</span>
        </div>
        <div className="dex-neural-badge">
          <span className="dex-dot-live" />
          LIVE
        </div>
      </div>
      
      <div className="dex-neural-content">
        <div className="dex-neural-message">
          {involvesBits ? <Zap size={18} className="text-yellow-400 fill-yellow-400" style={{minWidth: '18px'}} /> : <ScanLine size={18} />}
          <span className="typing-text">
            {typedText}
            {isTyping && <span className="cursor-blink">|</span>}
          </span>
        </div>

        {/* Contextual Rich Content */}
        {!isTyping && (
          <div className="dex-neural-details fade-in-up">
            {subMessage}
            
            {involvesBits && (
              <div className="dex-apy-highlight">
                <span style={{ opacity: 0.8 }}>Current APY for BITS Staking:</span>
                <span className="dex-neon-val">125%</span>
              </div>
            )}

            {!involvesBits && (
               <div className="dex-hint-row">
                 <Sparkles size={12} color="#00FFA3" />
                 <span>Pro Tip: Pay fees with <strong style={{color:'#00FFA3'}}>$BITS</strong> for 10% off.</span>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiSuggestionBox;
