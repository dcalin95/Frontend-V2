import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./PresaleLabel.module.css";

// Import logo-uri exchange-uri + Bitcoin + BITS
import binanceLogo from "../../assets/exchanges/binance-official.svg";
import coinbaseLogo from "../../assets/exchanges/coinbase-official.svg";
import krakenLogo from "../../assets/exchanges/kraken-official.svg";
import bybitLogo from "../../assets/exchanges/bybit-official.svg";
import kucoinLogo from "../../assets/exchanges/kucoin-official.svg";
import okxLogo from "../../assets/exchanges/okx-official.svg";
import mexcLogo from "../../assets/exchanges/mexc-official.svg";
import bitcoinLogo from "../../assets/icons/bitcoin.svg";
import bitsLogo from "../../assets/logo.png";

// Array cu logo-uri pentru animație
const exchangeLogos = [
  { src: binanceLogo, name: 'Binance' },
  { src: bitcoinLogo, name: 'Bitcoin' },
  { src: coinbaseLogo, name: 'Coinbase' },
  { src: bitsLogo, name: 'BITS' },
  { src: krakenLogo, name: 'Kraken' },
  { src: bitcoinLogo, name: 'Bitcoin' },
  { src: bybitLogo, name: 'Bybit' },
  { src: bitsLogo, name: 'BITS' },
  { src: kucoinLogo, name: 'KuCoin' },
  { src: bitcoinLogo, name: 'Bitcoin' },
  { src: okxLogo, name: 'OKX' },
  { src: bitsLogo, name: 'BITS' },
  { src: mexcLogo, name: 'MEXC' },
  { src: bitcoinLogo, name: 'Bitcoin' },
  { src: bitsLogo, name: 'BITS' },
];

// Sloganuri cu exchange-uri individuale - LOGO + NUME
const exchangeSlogans = [
  // Exchange Listings
  { src: binanceLogo, name: 'Binance', text: '🚀 Coming to Binance' },
  { src: coinbaseLogo, name: 'Coinbase', text: '📈 Coinbase Listing Soon' },
  { src: krakenLogo, name: 'Kraken', text: '🔥 Kraken Target Set' },
  { src: bybitLogo, name: 'Bybit', text: '⚡ Bybit Integration' },
  { src: kucoinLogo, name: 'KuCoin', text: '💎 KuCoin Coming' },
  { src: okxLogo, name: 'OKX', text: '🌟 OKX Listing Soon' },
  { src: mexcLogo, name: 'MEXC', text: '🎯 MEXC Launch' },
  
  // Bitcoin & BITS Ecosystem
  { src: bitcoinLogo, name: 'Bitcoin', text: '₿ Bitcoin Ecosystem' },
  { src: bitsLogo, name: 'BITS', text: '💰 $BITS Presale Live' },
  { src: bitcoinLogo, name: 'Bitcoin', text: '₿ BTC-BITS Liquidity' },
  { src: bitsLogo, name: 'BITS', text: '🏦 Stake & Earn BTC' },
  { src: bitcoinLogo, name: 'Bitcoin', text: '🔄 Swap BTC ↔ BITS' },
  { src: bitsLogo, name: 'BITS', text: '🤖 AI Trading Engine' },
  { src: bitcoinLogo, name: 'Bitcoin', text: '💹 Bitcoin DEX Target' },
  { src: bitsLogo, name: 'BITS', text: '🗳️ Vote & Govern' },
  { src: bitcoinLogo, name: 'Bitcoin', text: '⚡ Native BTC Trading' },
  { src: bitsLogo, name: 'BITS', text: '💎 HODL & Earn' },
];

// 45 Variante de sloganuri - scurte, impactante, cu referințe la Bitcoin, BITS, Binance, Stacks
const labelVariants = [
  // URGENȚĂ & TIMING
  "🔥 Before Price Increase",
  "⚡ Limited Time Only",
  "🎯 Early Bird Discount",
  "⏰ Last Chance",
  "🚀 Get In Early",
  "💎 Don't Miss Out",
  "📈 Price Goes Up Soon",
  "⚡ Act Fast Now",
  
  // BITCOIN & BITS CONNECTION
  "₿ BITS × Bitcoin Synergy",
  "₿ Powered by Bitcoin",
  "🔗 BITS + BTC United",
  "₿ Bitcoin's DeFi Partner",
  "⚡ BTC Meets BITS",
  "🌐 Bitcoin Ecosystem Token",
  "₿ Built on Bitcoin Vision",
  "🔥 BITS: Bitcoin's Ally",
  
  // BINANCE LISTING
  "🟡 Binance Listing Soon",
  "🚀 Next Stop: Binance",
  "📊 Binance Target Set",
  "🟡 Pre-Binance Price",
  "💹 Binance Bound",
  "🌟 Before Binance Launch",
  
  // STACKS & MULTI-CHAIN
  "⚡ Stacks Integration Live",
  "🔗 Multi-Chain Ready",
  "🌐 Cross-Chain Pioneer",
  "⚡ STX + BITS Power",
  "🔥 Stacks Ecosystem",
  
  // EXCHANGE LISTINGS
  "📈 Major CEX Coming",
  "🏆 Top 10 CEX Target",
  "💹 Exchange Listings Soon",
  "🌟 Pre-Listing Price",
  "🚀 CEX Launch Imminent",
  "📊 DEX + CEX Strategy",
  
  // EXCLUSIVITATE & VALOARE
  "👑 Founding Member Price",
  "💰 Best Entry Point",
  "🔐 Secure Your Position",
  "✨ VIP Early Access",
  "🏆 Elite Investor Tier",
  "💎 Diamond Hands Only",
  
  // AI & TECH
  "🤖 AI-Powered Trading",
  "🧠 Smart DeFi Protocol",
  "⚡ Next-Gen Technology",
  "🔮 Future of Finance",
  "🌐 Web3 Revolution",
  
  // PROFIT & CÂȘTIG
  "💰 Earn Daily Rewards",
  "📈 Passive Income Stream",
  "💎 Hold & Earn More",
  "🔥 10x Profit Potential",
  
  // STAKING & VOTING
  "🏦 Stake BITS, Earn BTC",
  "🗳️ Vote & Govern BITS",
  "⚡ Staking APY Live",
  "🔐 Lock & Multiply",
  
  // AI INTEGRAT & TEHNOLOGIE
  "🤖 AI Trading Engine",
  "🧠 Neural Profit System",
  "⚡ AI × Bitcoin Power",
  "🔮 Smart AI Decisions",
  
  // DEȚINERE & HODL
  "💎 HODL BITS, Win Big",
  "🏆 Holders Get Rewards",
  "📊 Hold = More Power",
  "🔒 Secure Your BITS",
  
  // TARGET: EXCHANGE BTC-BITS
  "🎯 BTC-BITS Exchange",
  "💹 Bitcoin Liquidity Pool",
  "🔄 Swap BTC ↔ BITS",
  "🏦 DEX: BTC × BITS",
  "⚡ Native BTC Trading",
  "🌐 Bitcoin DeFi Hub",
];

// Efecte de animație pentru slogan
const animationEffects = [
  'glitch', 'bounce', 'shake', 'pulse', 'wave', 
  'flicker', 'zoom', 'spin', 'float', 'explode'
];

// Generare sunet AI style folosind Web Audio API
const createAISound = (type = 'transition') => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
      case 'transition':
        // Sunet futuristic de tranziție
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        break;
        
      case 'whoosh':
        // Sunet de whoosh
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.06, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
        break;
        
      case 'blip':
        // Sunet scurt de blip
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.05);
        break;
        
      case 'laser':
        // Sunet de laser
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(1500, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.04, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
        
      case 'powerup':
        // Sunet de power-up
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
        
      default:
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
  } catch (e) {
    // Audio not supported or blocked
    console.log('Audio not available');
  }
};

const soundTypes = ['transition', 'whoosh', 'blip', 'laser', 'powerup'];

// Slogan special cu logo-uri - apare la fiecare 4 sloganuri
const LOGO_FREQUENCY = 4; // La fiecare al 4-lea slogan, afișăm logo-uri

// Tipuri de afișare pentru slogan
const DISPLAY_MODES = {
  TEXT: 'text',           // Slogan text normal
  LOGOS: 'logos',         // Multiple logo-uri animate
  EXCHANGE: 'exchange'    // Un exchange cu logo + nume
};

const PresaleLabel = ({ compact = false, sloganOnly = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentEffect, setCurrentEffect] = useState('pulse');
  const [isHovered, setIsHovered] = useState(false);
  const [displayMode, setDisplayMode] = useState(DISPLAY_MODES.TEXT);
  const [logoAnimationPhase, setLogoAnimationPhase] = useState(0);
  const [currentExchangeIndex, setCurrentExchangeIndex] = useState(0);
  const hasInteracted = useRef(false);

  // Activează sunetul după prima interacțiune
  const enableSound = useCallback(() => {
    hasInteracted.current = true;
  }, []);

  useEffect(() => {
    // Ascultă pentru prima interacțiune
    window.addEventListener('click', enableSound, { once: true });
    window.addEventListener('touchstart', enableSound, { once: true });
    
    return () => {
      window.removeEventListener('click', enableSound);
      window.removeEventListener('touchstart', enableSound);
    };
  }, [enableSound]);

  useEffect(() => {
    // Schimbă textul și efectul la fiecare 5 secunde
    const interval = setInterval(() => {
      setIsAnimating(true);
      
      // Alege un efect aleatoriu
      const randomEffect = animationEffects[Math.floor(Math.random() * animationEffects.length)];
      setCurrentEffect(randomEffect);
      
      // Redă sunet AI dacă utilizatorul a interacționat
      if (hasInteracted.current) {
        const randomSound = soundTypes[Math.floor(Math.random() * soundTypes.length)];
        createAISound(randomSound);
      }
      
      setTimeout(() => {
        const nextIndex = (currentIndex + 1) % labelVariants.length;
        setCurrentIndex(nextIndex);
        
        // Rotație între moduri: TEXT -> TEXT -> EXCHANGE -> TEXT -> LOGOS -> TEXT -> TEXT -> EXCHANGE...
        // Logo-uri apar mai des (la fiecare al 5-lea)
        const cyclePosition = (nextIndex + 1) % 5;
        
        if (cyclePosition === 2) {
          // La fiecare al 3-lea, afișăm un exchange individual
          setDisplayMode(DISPLAY_MODES.EXCHANGE);
          setCurrentExchangeIndex((prev) => (prev + 1) % exchangeSlogans.length);
          setLogoAnimationPhase(0);
        } else if (cyclePosition === 4) {
          // La fiecare al 5-lea, afișăm multiple logo-uri (mai des)
          setDisplayMode(DISPLAY_MODES.LOGOS);
          setLogoAnimationPhase(0);
        } else {
          // Restul - text normal
          setDisplayMode(DISPLAY_MODES.TEXT);
        }
        
        setIsAnimating(false);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  // Animație pentru logo-uri - schimbă faza la fiecare 1.5 secunde (mai lent)
  useEffect(() => {
    if (displayMode === DISPLAY_MODES.LOGOS) {
      const logoInterval = setInterval(() => {
        setLogoAnimationPhase((prev) => (prev + 1) % 4);
      }, 1500);
      return () => clearInterval(logoInterval);
    }
  }, [displayMode]);

  const currentSuffix = labelVariants[currentIndex];

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (hasInteracted.current) {
      createAISound('blip');
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Dacă sloganOnly, afișăm doar sloganul - LINK TO PRESALE - MINIMAL AI STYLE
  if (sloganOnly) {
    // MODE: EXCHANGE - Un exchange cu logo + nume
    if (displayMode === DISPLAY_MODES.EXCHANGE) {
      const currentExchange = exchangeSlogans[currentExchangeIndex];
      return (
        <a 
          href="/presale"
          className={`${styles.sloganContainer} ${styles.exchangeMode}`} 
          translate="no"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ 
            minHeight: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            cursor: 'pointer',
            border: 'none',
            outline: 'none',
            gap: '6px',
            padding: '3px 10px',
            background: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '10px',
            animation: 'exchangeFadeIn 0.5s ease-out'
          }}
        >
          {/* Logo exchange */}
          <img 
            src={currentExchange.src} 
            alt={currentExchange.name}
            style={{
              width: '30px',
              height: '30px',
              objectFit: 'contain',
              filter: 'none',
            }}
          />
          
          {/* Text cu gradient Solana */}
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            backgroundImage: 'linear-gradient(90deg, #14F195 0%, #00D4FF 40%, #9945FF 80%, #14F195 100%)',
            backgroundSize: '200% 100%',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'sloganGradientFlow 3s linear infinite',
            whiteSpace: 'nowrap'
          }}>
            {currentExchange.text}
          </span>
          
          {/* Logo exchange la final */}
          <img 
            src={currentExchange.src} 
            alt={currentExchange.name}
            style={{
              width: '22px',
              height: '22px',
              objectFit: 'contain',
              opacity: 0.9,
              filter: 'none',
            }}
          />
        </a>
      );
    }
    
    // MODE: LOGOS - Multiple logo-uri animate - DOAR LOGO-URI MARI ȘI CLARE
    if (displayMode === DISPLAY_MODES.LOGOS) {
      // Logo-uri pentru afișare - include Bitcoin frecvent
      const displayLogos = [
        { src: bitcoinLogo, name: 'Bitcoin' },
        { src: binanceLogo, name: 'Binance' },
        { src: bitsLogo, name: 'BITS' },
        { src: coinbaseLogo, name: 'Coinbase' },
        { src: bitcoinLogo, name: 'Bitcoin' },
        { src: krakenLogo, name: 'Kraken' },
      ];
      
      return (
        <a 
          href="/presale"
          className={`${styles.sloganContainer} ${styles.logoMode}`} 
          translate="no"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ 
            minHeight: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            cursor: 'pointer',
            border: 'none',
            outline: 'none',
            gap: '6px',
            padding: '2px 6px',
            background: 'transparent'
          }}
        >
          {/* DOAR Logo-uri - MARI și CLARE - fără text */}
          {displayLogos.map((logo, idx) => (
            <img 
              key={`${logo.name}-${idx}`}
              src={logo.src} 
              alt={logo.name}
              style={{
                width: '28px',
                height: '28px',
                objectFit: 'contain',
                opacity: 1,
                filter: 'none',
                animation: `logoFloat ${3 + idx * 0.4}s ease-in-out infinite alternate`,
              }}
            />
          ))}
        </a>
      );
    }
    
    // Slogan normal cu text
    return (
      <a 
        href="/presale"
        className={`${styles.sloganContainer} ${isAnimating ? styles.animating : ''}`} 
        translate="no"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ 
          minHeight: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          cursor: 'pointer',
          border: 'none',
          outline: 'none'
        }}
      >
        <span 
          className={`
            ${styles.suffixRow} 
            ${styles[currentEffect]} 
            ${isHovered ? styles.hovered : ''}
          `}
        >
          {currentSuffix}
        </span>
      </a>
    );
  }

  return (
    <div 
      className={`${styles.labelContainer} ${isAnimating ? styles.animating : ''} ${compact ? styles.compactMode : ''}`} 
      translate="no"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.mainRow}>
        <img 
          src="/logo.png" 
          alt="BITS" 
          className={styles.bitsLogo}
        />
        <span className={styles.bitsText}>$BITS</span>
        <span className={styles.presaleText}>PRESALE</span>
      </div>
    </div>
  );
};

export default PresaleLabel;

