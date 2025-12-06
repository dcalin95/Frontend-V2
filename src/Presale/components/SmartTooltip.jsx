import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './SmartTooltip.css';

// Sound generation for hover feedback
const generateSoundParams = (text) => {
  const stringContent = typeof text === 'string' ? text : JSON.stringify(text || '');
  let hash = 0;
  for (let i = 0; i < stringContent.length; i++) {
    hash = ((hash << 5) - hash) + stringContent.charCodeAt(i);
    hash |= 0; 
  }
  
  const positiveHash = Math.abs(hash);
  const baseFreq = 400 + (positiveHash % 600);
  const slideDirection = (positiveHash % 2 === 0) ? 1 : -0.5;
  const slideAmount = 150 + (positiveHash % 200);
  
  return { 
    freq: baseFreq, 
    endFreq: baseFreq + (slideAmount * slideDirection), 
    type: 'sine'
  };
};

const playHoverSound = (params) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = params.type || 'sine';
    osc.frequency.setValueAtTime(params.freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(100, params.endFreq), ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.01); 
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08); 
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {}
};

const SmartTooltip = ({ children, content, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [placement, setPlacement] = useState('top');
  const [transformOrigin, setTransformOrigin] = useState('center bottom');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const targetRef = useRef(null);
  const tooltipRef = useRef(null);
  const closeTimeoutRef = useRef(null);
  const openTimerRef = useRef(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    
    // Pe mobil, tooltip-ul e fixat jos - nu trebuie calculată poziția
    if (isMobile) return;

    const targetRect = targetRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect() || { height: 0, width: 0 };
    
    const spacing = 14;
    const viewportPadding = 16;

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
    const clampedArrowX = Math.min(Math.max(arrowX, 14), tooltipRect.width - 14);
    
    if (newPlacement === 'top') {
      setTransformOrigin(`${clampedArrowX}px bottom`);
    } else {
      setTransformOrigin(`${clampedArrowX}px top`);
    }
  };

  // Position & Speech effects
  useEffect(() => {
    let speechStartTimer;
    
    if (isVisible) {
      requestAnimationFrame(() => {
        updatePosition();
        requestAnimationFrame(updatePosition);
      });
      
      if (!isMobile) {
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
      }

      // Auto-start speech after 800ms if still visible
      speechStartTimer = setTimeout(() => {
        if (isVisible && 'speechSynthesis' in window) {
          speakText();
        }
      }, 800);

    } else {
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
  }, [isVisible, content, isMobile]);

  const speakText = () => {
    if (!('speechSynthesis' in window)) return;
    
    const textToRead = typeof content === 'string' ? content.replace(/\n/g, ' ').replace(/\s+/g, ' ') : 'System Info';
    const utterance = new SpeechSynthesisUtterance(textToRead);
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      (voice.name.includes('Google') && voice.name.includes('English')) || 
      (voice.name.includes('Samantha') && voice.lang.includes('en')) ||
      voice.lang === 'en-US'
    );
    
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  // 🖱️ HOVER LOGIC - MAI PUȚIN SENSIBIL
  // Desktop: 4 secunde delay
  // Mobile: doar pe click
  const handleMouseEnter = () => {
    // Pe mobil: DISABLE TOTAL HOVER (doar click)
    if (isMobile) return; 
    
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    
    if (!isVisible) {
      openTimerRef.current = setTimeout(() => {
        // Verifică dacă mouse-ul mai e pe element (preventiv)
        if (!targetRef.current) return;
        
        setIsVisible(true);
        // Sunet discret, doar dacă nu e deja vizibil
        const soundParams = generateSoundParams(content);
        playHoverSound(soundParams);
      }, 1500); // ⏳ 1.5 SECUNDE DELAY (Mai puțin invaziv)
    }
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    
    if (openTimerRef.current) clearTimeout(openTimerRef.current);

    // Închide după 500ms dacă mouse-ul pleacă
    closeTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 500);
  };

  // 🖱️ CLICK LOGIC - Deschide/Închide imediat
  const handleClick = (e) => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    
    if (!isVisible) {
      setIsVisible(true);
      const soundParams = generateSoundParams(content);
      playHoverSound(soundParams);
    }
    // Nu închide la click pe trigger - lasă utilizatorul să citească
  };

  // ❌ CLOSE BUTTON - Închide imediat
  const handleClose = (e) => {
    e.stopPropagation();
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setIsVisible(false);
  };

  // 🔊 SPEAKER BUTTON
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
    style: { ...child.props.style, cursor: 'pointer' },
    'data-tooltip': undefined
  });

  if (!isVisible) return trigger;

  // Stiluri pentru poziționare
  const tooltipStyle = isMobile 
    ? { transformOrigin: 'center bottom' }
    : { 
        top: `${position.top}px`, 
        left: `${position.left}px`,
        transformOrigin: transformOrigin
      };

  return (
    <>
      {trigger}
      {ReactDOM.createPortal(
        <div 
          ref={tooltipRef}
          className={`smart-tooltip-container ${placement} ${className}`}
          style={tooltipStyle}
          role="tooltip"
          onMouseEnter={() => {
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
        >
          {/* Control Buttons */}
          <div className="smart-tooltip-controls">
            <button 
              className={`smart-tooltip-speak-btn ${isSpeaking ? 'speaking' : ''}`}
              onClick={handleSpeakClick}
              title={isSpeaking ? "Stop Speaking" : "Read Aloud"}
            >
              {isSpeaking ? '🔊' : '🔈'}
            </button>
            <button 
              className="smart-tooltip-close-btn"
              onClick={handleClose}
              title="Close"
            >
              ✕
            </button>
          </div>

          <div className="smart-tooltip-content">
            {parseContent(content)}
          </div>
          
          {!isMobile && (
            <div className="smart-tooltip-arrow" style={{
              left: targetRef.current 
                ? Math.min(Math.max(targetRef.current.getBoundingClientRect().left + (targetRef.current.getBoundingClientRect().width / 2) - position.left, 14), (tooltipRef.current?.offsetWidth || 0) - 14)
                : '50%'
            }} />
          )}
        </div>,
        document.body
      )}
    </>
  );
};

export default SmartTooltip;
