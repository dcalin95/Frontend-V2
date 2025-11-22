import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './SmartTooltip.css';

// Futuristic UI "Blip" Sound (Short, High-tech)
const HOVER_SOUND = "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; // Placeholder, will replace with a real short blip base64

// A real short "tick" / "blip" sound (10ms sine wave pluck or similar) - Very subtle
// We generate unique sounds based on the tooltip content hash

const generateSoundParams = (text) => {
  // Handle non-string content gracefully
  const stringContent = typeof text === 'string' ? text : JSON.stringify(text || '');
  
  let hash = 0;
  for (let i = 0; i < stringContent.length; i++) {
    hash = ((hash << 5) - hash) + stringContent.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  const positiveHash = Math.abs(hash);
  
  // 🔍 Amount Detection for WOW Sound
  // Check if text contains a large dollar amount (> $1,000)
  // Matches: $1,000, $1000, $10,000.00
  const amountMatch = text.match(/\$([0-9,]+(?:\.[0-9]+)?)/);
  let isLargeAmount = false;
  if (amountMatch) {
    const val = parseFloat(amountMatch[1].replace(/,/g, ''));
    if (val >= 1000) isLargeAmount = true;
  }

  // 🎵 Sound Signature Generator
  // 1. Frequency: Map hash to 400Hz - 1200Hz range (pentatonic-ish feel)
  const baseFreq = 400 + (positiveHash % 800);
  
  // 2. Slide: Some sounds slide UP (discovery), some DOWN (confirmation)
  // even hash = slide up, odd hash = slide down
  const slideDirection = (positiveHash % 2 === 0) ? 1 : -0.5;
  const slideAmount = 200 + (positiveHash % 300);
  
  // 3. Type: Mostly sine for clean UI, but occassional triangle for "texture"
  // 20% chance of triangle wave for variety
  const type = (positiveHash % 5 === 0) ? 'triangle' : 'sine';

  return { 
    freq: baseFreq, 
    endFreq: baseFreq + (slideAmount * slideDirection), 
    type,
    isLargeAmount // Pass flag to player
  };
};

const playHoverSound = (params) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // 🔊 WOW EFFECT for Large Amounts
    if (params.isLargeAmount) {
        // Dual oscillator "shimmer" for rich sound
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        
        osc.type = 'sine';
        osc2.type = 'triangle';
        
        // Harmonious interval (Perfect 5th)
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc2.frequency.setValueAtTime(900, ctx.currentTime);
        
        // Slow upward sweep
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.4);
        osc2.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.4);
        
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        
        gain2.gain.setValueAtTime(0.05, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        
        osc.connect(gain);
        osc2.connect(gain2);
        gain.connect(ctx.destination);
        gain2.connect(ctx.destination);
        
        osc.start();
        osc2.start();
        osc.stop(ctx.currentTime + 0.4);
        osc2.stop(ctx.currentTime + 0.4);
        return;
    }

    // Normal Blip Logic
    osc.type = params.type || 'sine';
    
    // Frequency envelope
    osc.frequency.setValueAtTime(params.freq, ctx.currentTime);
    // Smooth slide to target frequency
    osc.frequency.exponentialRampToValueAtTime(Math.max(100, params.endFreq), ctx.currentTime + 0.1);
    
    // Volume envelope (Attack - Decay)
    gain.gain.setValueAtTime(0.0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.01); // Fast attack
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1); // Smooth decay
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    // Ignore audio errors
  }
};

const SmartTooltip = ({ children, content, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [placement, setPlacement] = useState('top'); // top, bottom
  const [transformOrigin, setTransformOrigin] = useState('center bottom');
  
  const targetRef = useRef(null);
  const tooltipRef = useRef(null);

  // 🧠 AI INTELLIGENT PARSER
  const parseContent = (text) => {
    if (typeof text !== 'string') return text;

    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      if (!line) return <div key={lineIndex}>{'\u00A0'}</div>;

      // Regex for values
      const parts = line.split(/(\$\d+(?:,\d{3})*(?:\.\d+)?|\d+(?:,\d{3})*(?:\.\d+)?\s*BITS|\d+(?:\.\d+)?%|\d+(?:\.\d+)?h|\d+(?:,\d{3})*(?:\.\d+)?\s*messages|\d+ rewards)/g);

      return (
        <div key={lineIndex}>
          {parts.map((part, partIndex) => {
            const isHighlight = /^(\$\d+|\d+(?:,\d{3})*(\.\d+)?\s*BITS|\d+(\.\d+)?%|\d+(\.\d+)?h|\d+\s*messages|\d+ rewards)/.test(part);
            
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

    // 1. Check Vertical Fit
    if (top < viewportPadding) {
      top = targetRect.bottom + spacing;
      newPlacement = 'bottom';
    }

    // 2. Check Horizontal Fit
    if (left < viewportPadding) {
      left = viewportPadding;
    } else if (left + tooltipRect.width > window.innerWidth - viewportPadding) {
      left = window.innerWidth - tooltipRect.width - viewportPadding;
    }

    setPosition({ top, left });
    setPlacement(newPlacement);
    
    // Smart Transform Origin Calculation
    // Calculate where the arrow is relative to the tooltip box
    const arrowX = targetRect.left + (targetRect.width / 2) - left;
    const clampedArrowX = Math.min(Math.max(arrowX, 10), tooltipRect.width - 10);
    
    if (newPlacement === 'top') {
        setTransformOrigin(`${clampedArrowX}px bottom`);
    } else {
        setTransformOrigin(`${clampedArrowX}px top`);
    }
  };

  useEffect(() => {
    if (isVisible) {
      requestAnimationFrame(() => {
        updatePosition();
        requestAnimationFrame(updatePosition);
      });
      
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible]);

  const showTooltip = () => {
    setIsVisible(true);
    // 🔊 Play unique sonic signature based on content
    const soundParams = generateSoundParams(content);
    playHoverSound(soundParams);
  };
  
  const hideTooltip = () => setIsVisible(false);

  const child = React.Children.only(children);

  const trigger = React.cloneElement(child, {
    ref: (node) => {
      targetRef.current = node;
      const { ref } = child;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    onMouseEnter: (e) => {
      showTooltip();
      child.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e) => {
      hideTooltip();
      child.props.onMouseLeave?.(e);
    },
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
            transformOrigin: transformOrigin // 🚀 Intelligent Origin
          }}
          role="tooltip"
        >
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
