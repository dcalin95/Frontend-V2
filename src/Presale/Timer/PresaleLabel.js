import React, { useState, useEffect } from "react";
import styles from "./PresaleLabel.module.css";

// 60 Variante de sloganuri - scurte, impactante, unele pe 2 rânduri
const labelVariants = [
  // URGENȚĂ MAXIMĂ (2 Rânduri)
  "🔥 Before Price Increase\n⚡ Act Fast Now",
  "⏰ Last Chance to Buy\n🚀 100x Potential",
  "💎 Don't Miss Out\n💰 Wealth Awaits",
  "🎯 Early Bird Discount\n📉 Ends Very Soon",
  "⚡ Limited Time Offer\n🔐 Secure Your Spot",

  // BITCOIN SYNERGY
  "₿ BITS × Bitcoin Power\n🔗 The Future of DeFi",
  "🌐 Built on Bitcoin\n⚡ Speed of Solana",
  "₿ Bitcoin's Best Friend\n🚀 BITS to the Moon",
  "🏦 Stake BITS = Earn BTC\n💰 Passive Income 24/7",

  // EXCHANGE & LISTING
  "🟡 Binance Listing Soon\n🚀 Prepare for Takeoff",
  "📈 Major CEX Incoming\n💹 Volume Exploding",
  "🏆 Top Tier Exchanges\n🌟 Listing Confirmed",
  "📊 Pre-Listing Price\n💎 Lowest Entry Point",

  // AI & TECH REVOLUTION
  "🤖 AI Trading Engine\n🧠 Profits Automator",
  "🔮 Next-Gen AI Crypto\n⚡ Smarter Investing",
  "🌐 Web3 + AI United\n🚀 Unstoppable Force",
  "🧠 Neural Profit System\n💰 Let AI Work for You",

  // WEALTH & FREEDOM
  "👑 Be Your Own Bank\n🔐 Financial Freedom",
  "💎 Diamond Hands Win\n🚀 HODL to Riches",
  "🏆 Elite Investor Club\n✨ Join the Revolution",
  "💰 Daily Rewards Live\n📈 Claim Your Share",

  // SCURTE & PUNCHY (1 Rând)
  "🚀 Next 1000x Gem",
  "🔥 Supply Shock Soon",
  "💎 The Next Solana",
  "⚡ Faster Than Light",
  "🌐 Global Adoption",
  "🤖 AI Dominance",
  "₿ Bitcoin 2.0",
  "💰 Massive APY %",
  "🔐 Audited & Safe",
  "🏆 #1 AI Project",
];

// DOAR TEXT - Fără logo-uri, suport multiline
const PresaleLabel = ({ compact = false, sloganOnly = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTyping(false); // Start fade out
      
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % labelVariants.length);
        setIsTyping(true); // Start fade in
      }, 800); // Așteaptă finalizarea fade-out (0.8s)
    }, 6000); // Interval total puțin mai lung (6s)

    return () => clearInterval(interval);
  }, []);

  const currentText = labelVariants[currentIndex];
  const lines = currentText.split('\n');

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  if (sloganOnly) {
    return (
      <a 
        href="/presale"
        className={styles.sloganContainer} 
        translate="no"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ 
          minHeight: '22px',
          display: 'flex',
          flexDirection: 'column', // Permite stivuire verticală
          alignItems: 'center',
          justifyContent: 'center',
          textDecoration: 'none',
          cursor: 'pointer',
          border: 'none',
          borderBottom: 'none',
          outline: 'none',
          background: 'transparent',
          lineHeight: '1.2', // Spațiere între linii
          gap: '2px'
        }}
      >
        {lines.map((line, idx) => (
        <span 
            key={idx}
            className={`${styles.suffixRow} ${isHovered ? styles.hovered : ''} ${isTyping ? styles.typing : styles.fadeOut}`}
            style={{
              textDecoration: 'none',
              border: 'none',
              borderBottom: 'none',
              display: 'block',
              fontSize: idx === 0 && lines.length > 1 ? '1em' : '1.1em', // Mărit de la 0.9em/1em pentru mai multă vizibilitate
              opacity: idx === 1 ? 0.95 : 1, // Al doilea rând ușor mai transparent (mărit de la 0.9)
              whiteSpace: 'nowrap'
            }}
          >
            {line}
        </span>
        ))}
      </a>
    );
  }

  return (
    <div 
      className={`${styles.labelContainer} ${compact ? styles.compactMode : ''}`} 
      translate="no"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.mainRow}>
        <img 
          src="/favicon_io/favicon.ico" 
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

