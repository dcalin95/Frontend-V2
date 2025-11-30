import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './SmartTooltip.css';

// Futuristic UI "Blip" Sound (Short, High-tech)
const HOVER_SOUND = "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; // Placeholder

const generateSoundParams = (text) => {
  const stringContent = typeof text === 'string' ? text : JSON.stringify(text || '');
  let hash = 0;
  for (let i = 0; i < stringContent.length; i++) {
    hash = ((hash << 5) - hash) + stringContent.charCodeAt(i);
    hash |= 0; 
  }
  
  const positiveHash = Math.abs(hash);
  
  const amountMatch = text.match(/\$([0-9,]+(?:\.[0-9]+)?)/);
  let isLargeAmount = false;
  if (amountMatch) {
    const val = parseFloat(amountMatch[1].replace(/,/g, ''));
    if (val >= 1000) isLargeAmount = true;
  }

  const baseFreq = 400 + (positiveHash % 800);
  const slideDirection = (positiveHash % 2 === 0) ? 1 : -0.5;
  const slideAmount = 200 + (positiveHash % 300);
  const type = (positiveHash % 5 === 0) ? 'triangle' : 'sine';

  return { 
    freq: baseFreq, 
    endFreq: baseFreq + (slideAmount * slideDirection), 
    type,
    isLargeAmount 
  };
};

const playHoverSound = (params) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (params.isLargeAmount) {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc.type = 'sine'; osc2.type = 'triangle';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc2.frequency.setValueAtTime(900, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.4);
        osc2.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        gain2.gain.setValueAtTime(0.05, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain); osc2.connect(gain2);
        gain.connect(ctx.destination); gain2.connect(ctx.destination);
        osc.start(); osc2.start();
        osc.stop(ctx.currentTime + 0.4); osc2.stop(ctx.currentTime + 0.4);
        return;
    }

    osc.type = params.type || 'sine';
    osc.frequency.setValueAtTime(params.freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(100, params.endFreq), ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.01); 
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1); 
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {}
};

const SmartTooltip = ({ children, content, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [placement, setPlacement] = useState('top');
  const [transformOrigin, setTransformOrigin] = useState('center bottom');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const targetRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);
  const openTimerRef = useRef(null); // ⏳ Timer for delayed opening

  // 🧠 AI INTELLIGENT PARSER
  const parseContent = (text) => {
    if (typeof text !== 'string') return text;

    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      if (!line) return null; 

      const parts = line.split(/(\$\d+(?:,\d{3})*(?:\.\d+)?|\d+(?:,\d{3})*(?:\.\d+)?\s*BITS|\d+(?:\.\d+)?%|\d+(?:\.\d+)?h|\d+(?:,\d{3})*(?:\.\d+)?\s*messages|\d+ rewards|AI|Neural|Blockchain|DEX|Wallet|Liquidity|Yield|Profit|Smart Contract|Tokenomics|Burn|Mining|XTB|Binance|Coinbase|Assets)/gi);

      return (
        <div key={lineIndex} className="smart-tooltip-line">
          {parts.map((part, partIndex) => {
            const isHighlight = /^(\$\d+|\d+(?:,\d{3})*(\.\d+)?\s*BITS|\d+(\.\d+)?%|\d+(\.\d+)?h|\d+\s*messages|\d+ rewards|AI|Neural|Blockchain|DEX|Wallet|Liquidity|Yield|Profit|Smart Contract|Tokenomics|Burn|Mining|XTB|Binance|Coinbase|Assets)/i.test(part);
            
            if (isHighlight) {
              return (
                <span key={partIndex} className="ai-value-highlight">
                  {part}
                </span>
              );
            }
            return <span key={partIndex}>{part}</span>;
          })}
        </div>
      );
    });
  };

  const updatePosition = () => {
    if (!targetRef.current || !isVisible) return;

    const targetRect = targetRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect() || { height: 0, width: 0 };
    
    const spacing = 14;
    const viewportPadding = 12;

    let top = targetRect.top - tooltipRect.height - spacing;
    let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
    let newPlacement = 'top';

    if (top < viewportPadding) {
      top = targetRect.bottom + spacing;
      newPlacement = 'bottom';
    }

    if (left < viewportPadding) {
      left = viewportPadding;
    } else if (left + tooltipRect.width > window.innerWidth - viewportPadding) {
      left = window.innerWidth - tooltipRect.width - viewportPadding;
    }

    setPosition({ top, left });
    setPlacement(newPlacement);
    
    const arrowX = targetRect.left + (targetRect.width / 2) - left;
    const clampedArrowX = Math.min(Math.max(arrowX, 10), tooltipRect.width - 10);
    
    if (newPlacement === 'top') {
        setTransformOrigin(`${clampedArrowX}px bottom`);
    } else {
        setTransformOrigin(`${clampedArrowX}px top`);
    }
  };

  // Auto-Speak Logic
  useEffect(() => {
    let speechStartTimer;
    
    if (isVisible) {
      requestAnimationFrame(() => {
        updatePosition();
        requestAnimationFrame(updatePosition);
      });
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      // Auto-start speech after 500ms if still visible
      speechStartTimer = setTimeout(() => {
          if (isVisible && 'speechSynthesis' in window) {
            speakText();
          }
      }, 500);

    } else {
      // Cancel everything when not visible
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      if (speechStartTimer) clearTimeout(speechStartTimer);
    }
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      window.speechSynthesis?.cancel();
      if (speechStartTimer) clearTimeout(speechStartTimer);
    };
  }, [isVisible, content]);

  const speakText = () => {
      if (!('speechSynthesis' in window)) return;
      
      const textToRead = typeof content === 'string' ? content.replace(/\n/g, ' ').replace(/\s+/g, ' ') : 'System Info';
      const utterance = new SpeechSynthesisUtterance(textToRead);
      
      const voices = window.speechSynthesis.getVoices();
      // Try to find a good English voice
      const preferredVoice = voices.find(voice => 
        (voice.name.includes('Google') && voice.name.includes('English')) || 
        (voice.name.includes('Samantha') && voice.lang.includes('en')) ||
        voice.lang === 'en-US'
      );
      
      if (preferredVoice) utterance.voice = preferredVoice;
      utterance.rate = 1.05; // Slightly faster for tech feel
      utterance.pitch = 1.0;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.cancel(); // Stop any previous
      window.speechSynthesis.speak(utterance);
  };

  // 🖱️ Hover Logic with 3s Delay
  const handleMouseEnter = () => {
    // Clear any closing timer
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Only start opening timer if not already visible
    if (!isVisible) {
        openTimerRef.current = setTimeout(() => {
            setIsVisible(true);
            const soundParams = generateSoundParams(content);
            playHoverSound(soundParams);
        }, 3000); // ⏳ 3 SECONDS DELAY
    }
  };

  const handleMouseLeave = () => {
    // Cancel opening if mouse leaves before 3s
    if (openTimerRef.current) clearTimeout(openTimerRef.current);

    // Close immediately if open (standard behavior for tooltip usually, or small delay)
    // User requested "daca userul decide poate sa staea citeva secunde... si atunci sa se deschida"
    // If it's already open, we can close it with a small grace period or immediately.
    // Let's keep a small grace period for usability.
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 300); 
  };

  // 🖱️ Click Logic: Immediate Open
  const handleClick = (e) => {
      // If user clicks, open immediately (bypass timer)
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      
      if (!isVisible) {
          setIsVisible(true);
          const soundParams = generateSoundParams(content);
          playHoverSound(soundParams);
      } else {
          // Optional: Click again to close? Or keep open? 
          // Usually clicking a tooltip trigger might perform an action (like navigation), 
          // so we should be careful not to block navigation.
          // But if it's just for info, toggle is fine.
          // For buttons that navigate (Link), the click will navigate away anyway.
      }
  };

  // Manual toggle via button (inside tooltip)
  const handleSpeakClick = (e) => {
    e.stopPropagation();
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      speakText();
    }
  };

  const child = React.Children.only(children);
  const trigger = React.cloneElement(child, {
    ref: (node) => {
      targetRef.current = node;
      const { ref } = child;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    onMouseEnter: (e) => {
      handleMouseEnter();
      child.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e) => {
      handleMouseLeave();
      child.props.onMouseLeave?.(e);
    },
    onClick: (e) => {
        handleClick(e);
        child.props.onClick?.(e);
    },
    // Add a visual cursor indicator if needed
    style: { ...child.props.style, cursor: child.props.onClick ? 'pointer' : 'help' },
    'data-tooltip': undefined
  });

  if (!isVisible) return trigger;

  return (
    <>
      {trigger}
      {ReactDOM.createPortal(
        <div 
          ref={tooltipRef}
          className={`smart-tooltip-container ${placement} ${className}`}
          style={{ 
            top: `${position.top}px`, 
            left: `${position.left}px`,
            transformOrigin: transformOrigin
          }}
          role="tooltip"
          onMouseEnter={() => {
              // Keep open if hovering the tooltip itself
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
        >
          <button 
            className={`smart-tooltip-speak-btn ${isSpeaking ? 'speaking' : ''}`}
            onClick={handleSpeakClick}
            title={isSpeaking ? "Stop Speaking" : "Read Aloud"}
          >
            {isSpeaking ? <span className="speaker-wave">🔊</span> : <span>🔈</span>}
          </button>

          <div className="smart-tooltip-content">
            {parseContent(content)}
          </div>
          <div className="smart-tooltip-arrow" style={{
             left: targetRef.current 
               ? Math.min(Math.max(targetRef.current.getBoundingClientRect().left + (targetRef.current.getBoundingClientRect().width / 2) - position.left, 10), (tooltipRef.current?.offsetWidth || 0) - 10)
               : '50%'
          }} />
        </div>,
        document.body
      )}
    </>
  );
};

export default SmartTooltip;
