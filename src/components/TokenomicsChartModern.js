import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "../assets/icons/Icon";
import bitsLogo from "../assets/logo.png";
import "./TokenomicsChartModern.css";
import SmartTooltip from "../Presale/components/SmartTooltip"; // Import SmartTooltip

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

const TokenomicsChartModern = ({
  totalSupply = 3_000_000_000,
  initialPrice = 0.0001,
  sections = DEFAULT_SECTIONS,
}) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [rotation, setRotation] = useState(0);

  // Calculare amount pentru fiecare secțiune (folosim amount-urile exacte din GitBook)
  const data = sections.map((s, idx) => ({
    ...s,
    amount: s.amount || Math.round((s.value / 100) * totalSupply),
    amountLabel: formatNumber(s.amount || Math.round((s.value / 100) * totalSupply)),
    startAngle: sections.slice(0, idx).reduce((acc, d) => acc + (d.value * 3.6), 0),
    endAngle: sections.slice(0, idx + 1).reduce((acc, d) => acc + (d.value * 3.6), 0),
  }));

  const totalPercent = sections.reduce((acc, d) => acc + d.value, 0);
  const totalMarketCap = formatNumber(totalSupply * initialPrice);

  const handleSegmentClick = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const handleRotate = (direction) => {
    setRotation(rotation + (direction === "left" ? -45 : 45));
  };

  return (
    <div className="tokenomics-modern-container">
      {/* Header */}
      <motion.div
        className="tokenomics-modern-header"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="tokenomics-modern-title">
          <img src={bitsLogo} alt="$BITS Logo" className="title-logo-bits" />
          BitSwapDEX AI $BITS Tokenomics
        </h1>
        <p className="tokenomics-modern-subtitle">
          Smart AI-Powered Token Distribution & Utility
        </p>
        <p className="tokenomics-modern-description">
          The $BITS token serves as the backbone of the BitSwapDEX AI ecosystem, enabling governance, 
          incentivizing liquidity, and enhancing user participation. By integrating Artificial Intelligence (AI) 
          optimizations across token utility and distribution, BitSwapDEX AI ensures sustainable growth and 
          maximum value delivery to its users.
        </p>
        
        {/* GitBook Link */}
        <motion.a
          href="https://bitswap-5.gitbook.io/bitswapdex-ai/tokenomics"
          target="_blank"
          rel="noopener noreferrer"
          className="gitbook-link"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Icon name="info" size="medium" className="gitbook-icon" />
          <span>Read Full Documentation on GitBook</span>
          <Icon name="forward" size="small" className="gitbook-arrow" />
        </motion.a>
      </motion.div>

      {/* Basic Information */}
      <motion.div
        className="tokenomics-basic-info"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h3 className="basic-info-title">
          <Icon name="info" size="medium" className="info-icon" />
          Basic Information
        </h3>
        <div className="basic-info-grid">
          <div className="info-item">
            <span className="info-label">Token Name</span>
            <span className="info-value">BitSwapDEX AI</span>
          </div>
          <div className="info-item">
            <span className="info-label">Token Symbol</span>
            <span className="info-value">$BITS</span>
          </div>
          <div className="info-item">
            <span className="info-label">Token Decimals</span>
            <span className="info-value">18</span>
          </div>
          <div className="info-item">
            <span className="info-label">Total Supply</span>
            <span className="info-value">{formatNumber(totalSupply)} $BITS</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        className="tokenomics-stats-bar"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="stat-item">
          <Icon name="generic-token" size="medium" className="stat-icon" />
          <div className="stat-content">
            <span className="stat-label">Total Supply</span>
            <span className="stat-value">{formatNumber(totalSupply)} $BITS</span>
          </div>
        </div>
        
        <div className="stat-divider" />
        
        <div className="stat-item">
          <Icon name="balance" size="medium" className="stat-icon" />
          <div className="stat-content">
            <span className="stat-label">Initial Price</span>
            <span className="stat-value">${initialPrice} USD</span>
          </div>
        </div>
        
        <div className="stat-divider" />
        
        <div className="stat-item">
          <Icon name="calculator" size="medium" className="stat-icon" />
          <div className="stat-content">
            <span className="stat-label">Market Cap</span>
            <span className="stat-value">${totalMarketCap}</span>
          </div>
        </div>
        
        <div className="stat-divider" />
        
        <div className="stat-item">
          <Icon name="verified" size="medium" className="stat-icon" />
          <div className="stat-content">
            <span className="stat-label">Coverage</span>
            <SmartTooltip content={`Coverage: ${totalPercent}%\nRepresents the total allocated percentage of the supply.`}>
            <span className={`stat-value ${totalPercent !== 100 ? 'warning' : ''}`}>
              {totalPercent}%
            </span>
            </SmartTooltip>
          </div>
        </div>
      </motion.div>

      {/* Main Visualization */}
      <div className="tokenomics-visualization">
        {/* AI Ring Chart */}
        <motion.div
          className="ai-ring-container"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {/* Rotation Controls */}
          <button 
            className="rotate-btn rotate-left"
            onClick={() => handleRotate("left")}
            aria-label="Rotate left"
          >
            <Icon name="chevron-left" size="medium" />
          </button>
          
          <button 
            className="rotate-btn rotate-right"
            onClick={() => handleRotate("right")}
            aria-label="Rotate right"
          >
            <Icon name="chevron-right" size="medium" />
          </button>

          {/* Center Core */}
          <div className="ai-ring-core">
            <div className="core-glow" />
            <img src={bitsLogo} alt="$BITS" className="core-logo" />
            <div className="core-text">
              <span className="core-label">$BITS</span>
              <span className="core-sublabel">Token</span>
            </div>
          </div>

          {/* Ring Segments */}
          <svg
            className="ai-ring-svg"
            viewBox="0 0 400 400"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <defs>
              {data.map((segment, idx) => (
                <linearGradient
                  key={`gradient-${idx}`}
                  id={`gradient-${idx}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={segment.color} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={segment.color} stopOpacity="1" />
                </linearGradient>
              ))}
              
              {/* Glow Filter */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {data.map((segment, idx) => {
              const radius = 150;
              const innerRadius = 100;
              const startAngle = (segment.startAngle - 90) * (Math.PI / 180);
              const endAngle = (segment.endAngle - 90) * (Math.PI / 180);
              
              const x1 = 200 + radius * Math.cos(startAngle);
              const y1 = 200 + radius * Math.sin(startAngle);
              const x2 = 200 + radius * Math.cos(endAngle);
              const y2 = 200 + radius * Math.sin(endAngle);
              
              const x3 = 200 + innerRadius * Math.cos(endAngle);
              const y3 = 200 + innerRadius * Math.sin(endAngle);
              const x4 = 200 + innerRadius * Math.cos(startAngle);
              const y4 = 200 + innerRadius * Math.sin(startAngle);
              
              const largeArcFlag = segment.value > 50 ? 1 : 0;
              
              const pathData = [
                `M ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                `L ${x3} ${y3}`,
                `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                'Z',
              ].join(' ');

              return (
                <motion.path
                  key={idx}
                  d={pathData}
                  fill={`url(#gradient-${idx})`}
                  stroke="rgba(0,0,0,0.3)"
                  strokeWidth="2"
                  className={`ring-segment ${activeIndex === idx ? 'active' : ''}`}
                  onClick={() => handleSegmentClick(idx)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: activeIndex === idx ? 1 : 0.85,
                    scale: activeIndex === idx ? 1.05 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  filter={activeIndex === idx ? "url(#glow)" : "none"}
                  style={{ cursor: 'pointer' }}
                />
              );
            })}
          </svg>

          {/* Segment Labels */}
          {data.map((segment, idx) => {
            const angle = ((segment.startAngle + segment.endAngle) / 2 - 90) * (Math.PI / 180);
            const labelRadius = 185;
            const x = 50 + labelRadius * Math.cos(angle);
            const y = 50 + labelRadius * Math.sin(angle);
            
            return (
              <motion.div
                key={`label-${idx}`}
                className={`segment-label ${activeIndex === idx ? 'active' : ''}`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: activeIndex === idx ? 1 : 0.7, 
                  scale: activeIndex === idx ? 1.2 : 1 
                }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
              >
                <span className="label-percent" style={{ color: segment.color }}>
                  {segment.value}%
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Info Cards */}
        <div className="tokenomics-cards">
          {data.map((segment, idx) => (
            <motion.div
              key={idx}
              className={`tokenomics-card ${activeIndex === idx ? 'active' : ''}`}
              onClick={() => handleSegmentClick(idx)}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 + idx * 0.1 }}
              whileHover={{ scale: 1.03, y: -5 }}
            >
              <div 
                className="card-accent" 
                style={{ background: `linear-gradient(135deg, ${segment.color}40, ${segment.color}80)` }}
              />
              
              <div className="card-header">
                <Icon 
                  name={segment.icon} 
                  size="large" 
                  animate={activeIndex === idx ? "pulse" : null}
                  className="card-icon"
                  style={{ color: segment.color }}
                />
                <h3 className="card-title" style={{ color: segment.color }}>
                  {segment.name}
                </h3>
              </div>
              
              <div className="card-stats">
                <div className="card-stat">
                  <span className="card-stat-label">Allocation</span>
                  <SmartTooltip content={`${segment.value}%\nPercentage of total supply allocated to ${segment.name}.`}>
                  <span className="card-stat-value" style={{ color: segment.color }}>
                    {segment.value}%
                  </span>
                  </SmartTooltip>
                </div>
                <div className="card-stat">
                  <span className="card-stat-label">Amount</span>
                  <SmartTooltip content={`${segment.amountLabel} $BITS\nTotal tokens reserved for this category.`}>
                  <span className="card-stat-value">
                    {segment.amountLabel} $BITS
                  </span>
                  </SmartTooltip>
                </div>
              </div>
              
              <AnimatePresence>
                {activeIndex === idx && (
                  <motion.p
                    className="card-description"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {segment.description}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Vesting Info */}
      <motion.div
        className="tokenomics-vesting"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <Icon name="lock" size="large" className="vesting-icon" />
        <div className="vesting-content">
          <h3 className="vesting-title">Vesting Schedule</h3>
          <p className="vesting-description">
            All allocations follow strategic vesting schedules to ensure long-term commitment, sustainable growth, 
            and protection against inflationary pressures. Team & Advisors tokens are subject to 24-month quarterly 
            vesting with 0% unlock at TGE, demonstrating our dedication to the project's success.
          </p>
        </div>
      </motion.div>

      {/* Token Utility */}
      <motion.div
        className="tokenomics-utility-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.4 }}
      >
        <h2 className="utility-section-title">
          <Icon name="settings" size="large" animate="glow" className="utility-title-icon" />
          Token Utility: Powering the BitSwapDEX AI Ecosystem
        </h2>
        <p className="utility-section-description">
          The $BITS token offers multiple functionalities that drive participation, utility, and value creation 
          within BitSwapDEX AI. By integrating AI-driven optimizations, $BITS ensures an efficient, user-centric 
          experience across governance, liquidity, and staking.
        </p>

        <div className="utility-grid">
          {/* Governance */}
          <motion.div
            className="utility-card"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.6 }}
            whileHover={{ scale: 1.03, y: -5 }}
          >
            <div className="utility-card-header">
              <Icon name="verified" size="xlarge" className="utility-icon" />
              <h3 className="utility-card-title">1. Governance</h3>
            </div>
            <ul className="utility-list">
              <li>$BITS holders play a pivotal role in community-driven governance</li>
              <li>AI-enhanced voting system for proposals analysis</li>
              <li>Vote on protocol upgrades, fee structures, new listings & partnerships</li>
              <li>Predictive analytics on proposals for data-informed decisions</li>
            </ul>
          </motion.div>

          {/* Liquidity Incentives */}
          <motion.div
            className="utility-card"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.7 }}
            whileHover={{ scale: 1.03, y: -5 }}
          >
            <div className="utility-card-header">
              <Icon name="exchange" size="xlarge" className="utility-icon" />
              <h3 className="utility-card-title">2. Liquidity Incentives</h3>
            </div>
            <ul className="utility-list">
              <li>Robust rewards for liquidity pool contributors</li>
              <li>AI-Optimized Rewards: ML algorithms dynamically adjust incentives</li>
              <li>Based on trading activity, pool performance & liquidity depth</li>
              <li>Fair distribution and efficient liquidity management</li>
            </ul>
          </motion.div>

          {/* Fee Advantages */}
          <motion.div
            className="utility-card"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.8 }}
            whileHover={{ scale: 1.03, y: -5 }}
          >
            <div className="utility-card-header">
              <Icon name="fee" size="xlarge" className="utility-icon" />
              <h3 className="utility-card-title">3. Fee Advantages</h3>
            </div>
            <ul className="utility-list">
              <li>Discounts on swap fees for $BITS holders</li>
              <li>AI dynamically assesses user activity & contributions</li>
              <li>Tailored fee benefits based on participation</li>
              <li>Reduced trading costs fostering long-term loyalty</li>
            </ul>
          </motion.div>

          {/* Exclusive Access */}
          <motion.div
            className="utility-card"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.9 }}
            whileHover={{ scale: 1.03, y: -5 }}
          >
            <div className="utility-card-header">
              <Icon name="unlock" size="xlarge" className="utility-icon" />
              <h3 className="utility-card-title">4. Exclusive Access</h3>
            </div>
            <ul className="utility-list">
              <li>Early participation in new features & token launches</li>
              <li>AI-powered yield farming with higher APYs</li>
              <li>Priority access to predictive trading analytics</li>
              <li>Automated liquidity strategies for first-movers</li>
            </ul>
          </motion.div>

          {/* Staking Rewards */}
          <motion.div
            className="utility-card utility-card-featured"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 2.0 }}
            whileHover={{ scale: 1.03, y: -5 }}
          >
            <div className="utility-card-header">
              <Icon name="stake" size="xlarge" className="utility-icon" animate="pulse" />
              <h3 className="utility-card-title">5. Staking Rewards</h3>
            </div>
            <ul className="utility-list">
              <li><strong>Security:</strong> Contributing to platform operational efficiency</li>
              <li><strong>Rewards:</strong> AI-optimized staking reward schedules</li>
              <li><strong>Benefits:</strong> Passive income through sustainable rewards</li>
              <li><strong>Governance:</strong> Enhanced privileges for protocol improvements</li>
              <li><strong>APY:</strong> Enhanced rates for active stakers & liquidity providers</li>
            </ul>
          </motion.div>
        </div>
      </motion.div>

      {/* Key Innovations */}
      <motion.div
        className="tokenomics-innovations"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 2.2 }}
      >
        <h2 className="innovations-title">
          <Icon name="arrow-up" size="large" animate="float" className="innovations-icon" />
          Key Innovations in Tokenomics
        </h2>
        <div className="innovations-grid">
          <div className="innovation-item">
            <Icon name="calculator" size="large" className="innovation-icon" />
            <h4>AI-Driven Dynamic Rewards</h4>
            <p>Machine Learning models optimize liquidity incentives and staking rewards to align with real-time market and platform dynamics.</p>
          </div>
          <div className="innovation-item">
            <Icon name="verified" size="large" className="innovation-icon" />
            <h4>Community-Centric Governance</h4>
            <p>$BITS enables transparent, AI-enhanced governance, ensuring decisions are data-driven and community-aligned.</p>
          </div>
          <div className="innovation-item">
            <Icon name="balance" size="large" className="innovation-icon" />
            <h4>Sustainable Distribution</h4>
            <p>Gradual token vesting and intelligent incentives ensure a balanced ecosystem, avoiding inflationary pressures.</p>
          </div>
        </div>
      </motion.div>

      {/* Conclusion */}
      <motion.div
        className="tokenomics-conclusion"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 2.4 }}
      >
        <Icon name="success" size="xlarge" className="conclusion-icon" animate="glow" />
        <div className="conclusion-content">
          <h3 className="conclusion-title">Conclusion</h3>
          <p className="conclusion-text">
            The <strong>$BITS token</strong> is a versatile asset at the core of the BitSwapDEX AI ecosystem, 
            driving governance, liquidity, and staking rewards. By integrating AI-driven optimizations into tokenomics, 
            BitSwapDEX AI ensures a sustainable, efficient, and user-centric experience. This strategic approach positions 
            $BITS as a utility-rich token with long-term value, essential for the platform's growth and evolution.
          </p>
          <p className="conclusion-tagline">
            <strong>BitSwapDEX AI $BITS:</strong> Empowering Innovation, Governance, and Liquidity in a Smart, Secure DeFi Ecosystem.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default TokenomicsChartModern;

