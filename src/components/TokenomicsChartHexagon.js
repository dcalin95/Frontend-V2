import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "../assets/icons/Icon";
import bitsLogo from "../assets/logo.png";
import "./TokenomicsChartHexagon.css";

const DEFAULT_SECTIONS = [
  { 
    name: "Public Presale", 
    value: 35, 
    amount: 1050000000,
    color: "#DC1FFF", 
    description: "35% unlocked at TGE • 65% linear vesting over 3 months",
    icon: "crypto-coin",
    details: "1,050,000,000 $BITS allocated for public token sale with early-bird bonuses"
  },
  { 
    name: "Ecosystem Growth", 
    value: 18, 
    amount: 540000000,
    color: "#FF6B35", 
    description: "Immediate allocation for grants, partnerships & community growth",
    icon: "arrow-up",
    details: "540,000,000 $BITS for ecosystem development and strategic partnerships"
  },
  { 
    name: "Treasury", 
    value: 16, 
    amount: 480000000,
    color: "#00C2FF", 
    description: "Strategic reserves with DAO-governed flexible vesting",
    icon: "balance",
    details: "480,000,000 $BITS for long-term sustainability and strategic initiatives"
  },
  { 
    name: "CEX & DEX Liquidity", 
    value: 12, 
    amount: 360000000,
    color: "#00FFA3", 
    description: "3-month cliff • Linear vesting over the following 9 months",
    icon: "exchange",
    details: "360,000,000 $BITS for liquidity pools across exchanges"
  },
  { 
    name: "Marketing & Community", 
    value: 12, 
    amount: 360000000,
    color: "#FFD700", 
    description: "Used over 12 months for airdrops, campaigns & community rewards",
    icon: "share",
    details: "360,000,000 $BITS for marketing initiatives and community engagement"
  },
  { 
    name: "Team & Advisors", 
    value: 7, 
    amount: 210000000,
    color: "#9945FF", 
    description: "0% unlocked at TGE • 100% vested over 24 months (quarterly releases)",
    icon: "lock",
    details: "210,000,000 $BITS for team and advisors with long-term commitment"
  },
];

const formatNumber = (n) =>
  Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

const TokenomicsChartHexagon = ({
  totalSupply = 3_000_000_000,
  initialPrice = 0.0001,
  sections = DEFAULT_SECTIONS,
}) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const data = sections.map((s) => ({
    ...s,
    amount: s.amount || Math.round((s.value / 100) * totalSupply),
    amountLabel: formatNumber(s.amount || Math.round((s.value / 100) * totalSupply)),
  }));

  const totalPercent = sections.reduce((acc, d) => acc + d.value, 0);
  const totalMarketCap = formatNumber(totalSupply * initialPrice);

  return (
    <div className="tokenomics-hexagon-container">
      {/* Header */}
      <motion.div
        className="tokenomics-hexagon-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="tokenomics-hexagon-title">
          <img src={bitsLogo} alt="$BITS Logo" className="title-logo-bits-hex" />
          BitSwapDEX AI $BITS Tokenomics
        </h1>
        <p className="tokenomics-hexagon-subtitle">
          Smart AI-Powered Token Distribution & Utility
        </p>
        <p className="tokenomics-hexagon-description">
          The $BITS token serves as the backbone of the BitSwapDEX AI ecosystem, enabling governance, 
          incentivizing liquidity, and enhancing user participation through AI-driven optimizations.
        </p>
        
        {/* GitBook Link */}
        <motion.a
          href="https://bitswap-5.gitbook.io/bitswapdex-ai/tokenomics"
          target="_blank"
          rel="noopener noreferrer"
          className="gitbook-link-hex"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Icon name="info" size="medium" className="gitbook-icon-hex" />
          <span>Read Full Documentation on GitBook</span>
          <Icon name="forward" size="small" className="gitbook-arrow-hex" />
        </motion.a>
      </motion.div>

      {/* Basic Information */}
      <motion.div
        className="tokenomics-basic-info-hex"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h3 className="basic-info-title-hex">
          <Icon name="info" size="medium" className="info-icon" />
          Basic Information
        </h3>
        <div className="basic-info-grid-hex">
          <div className="info-item-hex">
            <span className="info-label-hex">Token Name</span>
            <span className="info-value-hex">BitSwapDEX AI</span>
          </div>
          <div className="info-item-hex">
            <span className="info-label-hex">Token Symbol</span>
            <span className="info-value-hex">$BITS</span>
          </div>
          <div className="info-item-hex">
            <span className="info-label-hex">Token Decimals</span>
            <span className="info-value-hex">18</span>
          </div>
          <div className="info-item-hex">
            <span className="info-label-hex">Total Supply</span>
            <span className="info-value-hex">{formatNumber(totalSupply)} $BITS</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        className="tokenomics-stats-bar-hex"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="stat-item-hex">
          <Icon name="generic-token" size="medium" className="stat-icon-hex" />
          <div className="stat-content-hex">
            <span className="stat-label-hex">Total Supply</span>
            <span className="stat-value-hex">{formatNumber(totalSupply)} $BITS</span>
          </div>
        </div>
        
        <div className="stat-divider-hex" />
        
        <div className="stat-item-hex">
          <Icon name="balance" size="medium" className="stat-icon-hex" />
          <div className="stat-content-hex">
            <span className="stat-label-hex">Initial Price</span>
            <span className="stat-value-hex">${initialPrice} USD</span>
          </div>
        </div>
        
        <div className="stat-divider-hex" />
        
        <div className="stat-item-hex">
          <Icon name="calculator" size="medium" className="stat-icon-hex" />
          <div className="stat-content-hex">
            <span className="stat-label-hex">Market Cap</span>
            <span className="stat-value-hex">${totalMarketCap}</span>
          </div>
        </div>
        
        <div className="stat-divider-hex" />
        
        <div className="stat-item-hex">
          <Icon name="verified" size="medium" className="stat-icon-hex" />
          <div className="stat-content-hex">
            <span className="stat-label-hex">Coverage</span>
            <span className={`stat-value-hex ${totalPercent !== 100 ? 'warning' : ''}`}>
              {totalPercent}%
            </span>
          </div>
        </div>
      </motion.div>

      {/* Hexagon Grid Visualization */}
      <motion.div
        className="hexagon-visualization"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <div className="hexagon-grid">
          {data.map((segment, idx) => (
            <motion.div
              key={idx}
              className={`hexagon-item ${activeIndex === idx ? 'active' : ''}`}
              onClick={() => setActiveIndex(activeIndex === idx ? null : idx)}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 + idx * 0.1 }}
              whileHover={{ scale: 1.05, y: -8 }}
              style={{
                borderColor: segment.color,
                boxShadow: activeIndex === idx ? `0 0 40px ${segment.color}80` : `0 0 20px ${segment.color}40`
              }}
            >
              <div className="hexagon-icon-wrapper">
                <Icon 
                  name={segment.icon} 
                  size="xlarge" 
                  animate={activeIndex === idx ? "pulse" : null}
                  style={{ color: segment.color }}
                />
              </div>
              
              <h3 className="hexagon-title" style={{ color: segment.color }}>
                {segment.name}
              </h3>
              
              <div className="hexagon-percent" style={{ color: segment.color }}>
                {segment.value}%
              </div>
              
              <div className="hexagon-amount">
                {segment.amountLabel} $BITS
              </div>
              
              <AnimatePresence>
                {activeIndex === idx && (
                  <motion.div
                    className="hexagon-description"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {segment.description}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Rest of content remains the same... */}
      <div className="tokenomics-hexagon-content">
        {/* Vesting, Utility, Innovations, Conclusion sections */}
        <p className="hex-note">
          📊 Click on any hexagon to view detailed vesting schedule
        </p>
      </div>
    </div>
  );
};

export default TokenomicsChartHexagon;

