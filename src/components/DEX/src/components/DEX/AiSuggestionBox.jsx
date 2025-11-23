import React, { useEffect, useState, useRef } from 'react';
import { Sparkles, Zap, ScanLine, Activity } from 'lucide-react';
import './DEX.css';
import aiVideo from '../../assets/BitSwapDEX_AI.mp4';

const AiSuggestionBox = ({ fromToken, toToken, slippage }) => {
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const indexRef = useRef(0);

  const isBtcToBnb = fromToken === 'BTC' && toToken === 'bBNB';
  const involvesBits = fromToken === 'BITS' || toToken === 'BITS';

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
        setTypedText(fullText);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [mainMessage, fromToken, toToken]);

  if (!fromToken || !toToken) return null;

  return (
    <div className="dex-ai-hud-module">
      {/* HUD DECORATIVE CORNERS */}
      <div className="hud-corner hud-tl"></div>
      <div className="hud-corner hud-tr"></div>
      <div className="hud-corner hud-bl"></div>
      <div className="hud-corner hud-br"></div>

      {/* HEADER */}
      <div className="dex-ai-hud-header">
        <div className="dex-ai-status-indicator">
            <div className="ai-pulse-ring"></div>
            <div className="ai-core-dot"></div>
        </div>
        <span className="dex-ai-hud-title">AI COPILOT // INSIGHT_V2</span>
        <div className="dex-ai-hud-live-tag">
            <Activity size={10} /> LIVE
        </div>
      </div>

      {/* CONTENT */}
      <div className="dex-ai-hud-body">
        <div className="dex-ai-hud-message-row">
            <div className="dex-ai-avatar-wrapper">
                 <video 
                    src={aiVideo} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="dex-ai-video-feed"
                 />
                 <div className="video-scanline"></div>
            </div>
            
            <div className="dex-ai-text-stream">
                <span className="stream-text">
                    {typedText}
                    {isTyping && <span className="cursor-block">█</span>}
                </span>
            </div>
        </div>

        {/* DATA STREAM FOOTER */}
        {!isTyping && (
            <div className="dex-ai-hud-footer fade-in-fast">
                <div className="hud-data-line">{subMessage}</div>
                
                {involvesBits ? (
                    <div className="hud-metric-box highlight">
                        <span>APY BOOST</span>
                        <span className="metric-val">125%</span>
                    </div>
                ) : (
                    <div className="hud-metric-box">
                        <Sparkles size={10} color="#00FFA3" />
                        <span>Use <strong style={{color: '#00FFA3'}}>$BITS</strong> for -10% fees</span>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default AiSuggestionBox;
