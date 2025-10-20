import React from "react";
import "./Roadmap.css";

// Import icoane
import bscIcon from "../assets/bsc-icon.png";
import ethIcon from "../assets/eth-icon.png";
import stxIcon from "../assets/stx-icon.png";
import binanceIcon from "../assets/bsc-icon.png";
import gateIcon from "../assets/gate-icon.png";
import mexcIcon from "../assets/mexc-icon.png";
import pancakeIcon from "../assets/pancake-icon.png";
import raydiumIcon from "../assets/raydium-icon.png";
import bitsLogo from "../assets/logo.png"; // Importăm icoana pentru $BITS

const phases = [
  {
    title: "Phase 1: Conceptualization & Strategic Planning",
    subtitle: "(Q3 2025)",
    details: [
      <>
        <span className="ai-bullet"></span> Project Inception: Form the core development team including blockchain developers, AI specialists, and strategic advisors
      </>,
      <>
        <span className="ai-bullet"></span> Whitepaper & Documentation: Develop comprehensive whitepaper detailing BitSwapDEX AI's architecture, tokenomics, and strategic vision
      </>,
      <>
        <span className="ai-bullet"></span> Community Engagement & Branding: Launch official communication channels (Website, Telegram, Twitter, LinkedIn)
      </>,
      <>
        <span className="ai-bullet"></span> AI Research & Initial Prototyping: Develop foundational AI models for predictive market analytics and liquidity optimization
      </>,
    ],
    titleColor: "#00ffe0",
    font: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  },
  {
    title: "Phase 2: Development & Testing",
    subtitle: "(Q3-Q4 2025)",
    details: [
      <>
        <span className="ai-bullet"></span> Smart Contract Development: Develop and audit Clarity smart contracts for liquidity pools, swap mechanisms, and AI-powered governance
      </>,
      <>
        <span className="ai-bullet"></span> Security Audits: Engage reputable third-party security firms to audit all smart contracts
      </>,
      <>
        <span className="ai-bullet"></span> Testnet Launch on Stacks: Deploy smart contracts on Stacks Testnet for user testing
      </>,
      <>
        <span className="ai-bullet"></span> AI Model Calibration: Implement Machine Learning models to analyze market trends and optimize trade execution
      </>,
    ],
    titleColor: "#ff9800",
    font: "'Roboto Mono', monospace",
  },
  {
    title: "Phase 3: Presale & Initial Exchange Offering",
    subtitle: "(Q1 2026)",
    details: [
      <>
        <span className="ai-bullet"></span> Multi-Stage Presale: Conduct multi-round presale with tiered pricing structure for early investors
      </>,
      <>
        <span className="ai-bullet"></span> Token Generation Event (TGE): Launch $BITS on 
        <img src={bscIcon} alt="Binance Smart Chain" className="network-icon" />
        <strong> Binance Smart Chain (BSC)</strong> for liquidity and trading
      </>,
      <>
        <span className="ai-bullet"></span> Exchange Listing Strategy: Initiate negotiations with top-tier exchanges including 
        <img src={binanceIcon} alt="Binance" className="network-icon" />
        <strong> Binance</strong>,
        <img src={gateIcon} alt="Gate.io" className="network-icon" />
        <strong> Gate.io</strong>, and
        <img src={pancakeIcon} alt="PancakeSwap" className="network-icon" />
        <strong> PancakeSwap</strong>
      </>,
      <>
        <span className="ai-bullet"></span> AI-Driven Tokenomics Optimization: Deploy AI models to monitor presale activity and adjust pricing models in real-time
      </>,
    ],
    titleColor: "#2196f3",
    font: "'Montserrat', sans-serif",
  },
  {
    title: "Phase 4: Mainnet Launch & Liquidity Provision",
    subtitle: "(Q1 2026)",
    details: [
      <>
        <span className="ai-bullet"></span> Mainnet Deployment on Stacks: Deploy smart contracts and launch BitSwapDEX AI on Stacks Mainnet
      </>,
      <>
        <span className="ai-bullet"></span> Initial Liquidity Pools (ILP): Establish liquidity pools for BTC-STX, BITS-BTC, and BITS-USDT trading pairs
      </>,
      <>
        <span className="ai-bullet"></span> AI-Optimized Trading Features: Activate AI-enhanced trading tools including predictive market analysis and automated liquidity rebalancing
      </>,
      <>
        <span className="ai-bullet"></span> Monitoring & Security Enhancements: Deploy AI-driven security protocols for transaction monitoring and fraud detection
      </>,
    ],
    titleColor: "#4caf50",
    font: "'Bebas Neue', cursive",
  },
  {
    title: "Phase 5: Ecosystem Expansion & Cross-Chain Integration",
    subtitle: "(Q2-Q3 2026)",
    details: [
      <>
        <span className="ai-bullet"></span> Cross-Chain Functionality: Integrate multi-chain swap capabilities with 
        <img src={ethIcon} alt="Ethereum" className="network-icon" />
        <strong> Ethereum</strong>,
        <img src={bscIcon} alt="Binance Smart Chain" className="network-icon" />
        <strong> Binance Smart Chain</strong>, and
        <img src={stxIcon} alt="Solana" className="network-icon" />
        <strong> Solana</strong>
      </>,
      <>
        <span className="ai-bullet"></span> AI-Driven Governance Activation: Enable AI-enhanced governance module with predictive insights on proposal outcomes
      </>,
      <>
        <span className="ai-bullet"></span> Community Grants & Development Program: Launch development grant program to fund community-driven initiatives
      </>,
      <>
        <span className="ai-bullet"></span> Partnership Integration: Establish strategic partnerships with leading DeFi platforms to expand user base and liquidity
      </>,
    ],
    titleColor: "#ffd700",
    font: "'Lobster', cursive",
  },
  {
    title: "Phase 6: Strategic Partnerships & Advanced Trading",
    subtitle: "(Q3-Q4 2026)",
    details: [
      <>
        <span className="ai-bullet"></span> Institutional Onboarding: Develop institutional-grade trading features including AI-optimized limit orders and risk management
      </>,
      <>
        <span className="ai-bullet"></span> Advanced Trading Features: Launch margin trading and leveraged swaps with AI models for position management
      </>,
      <>
        <span className="ai-bullet"></span> Global Community Expansion: Host global events, hackathons, and webinars to onboard developers and traders
      </>,
      <>
        <span className="ai-bullet"></span> Targeted CEX Listings: Apply for listings on 
        <img src={binanceIcon} alt="Binance" className="network-icon" />
        <strong> Binance</strong>,
        <img src={mexcIcon} alt="Crypto.com" className="network-icon" />
        <strong> Crypto.com</strong>, and
        <img src={gateIcon} alt="Coinbase" className="network-icon" />
        <strong> Coinbase</strong>
      </>,
    ],
    titleColor: "#ff5722",
    font: "'Anton', sans-serif",
  },
  {
    title: "Phase 7: Continuous Improvement & Global Expansion",
    subtitle: "(2027 and Beyond)",
    details: [
      <>
        <span className="ai-bullet"></span> Protocol Upgrades: Integrate new AI models based on community feedback and advanced market analysis
      </>,
      <>
        <span className="ai-bullet"></span> AI-Enhanced Sustainability Initiatives: Deploy eco-friendly incentive programs to offset carbon emissions
      </>,
      <>
        <span className="ai-bullet"></span> Research & Development: Invest in AI tools for predictive trading analytics and real-time liquidity optimization
      </>,
      <>
        <span className="ai-bullet"></span> Global Exchange Listings: Focus on maintaining dedicated liquidity pools for 
        <img src={binanceIcon} alt="Binance" className="network-icon" />
        <strong> Binance</strong>,
        <img src={mexcIcon} alt="Crypto.com" className="network-icon" />
        <strong> Crypto.com</strong>, and
        <img src={gateIcon} alt="Coinbase" className="network-icon" />
        <strong> Coinbase</strong> to support trading volume
      </>,
    ],
    titleColor: "#673ab7",
    font: "'Pacifico', cursive",
  },
];

const Roadmap = () => {
  return (
    <div className="roadmap-container">
      <h2 className="roadmap-title">🚀 BitSwapDEX AI - Strategic Development Roadmap 2025-2027 🚀</h2>
      <div className="roadmap-grid">
        <div className="roadmap-column">
          {phases.slice(0, 4).map((phase, index) => (
            <div
              key={index}
              className={`roadmap-card card-float-${index % 2}`}
            >
              <h3
                style={{
                  color: phase.titleColor,
                  fontFamily: phase.font,
                }}
              >
                {phase.title}
              </h3>
              <p className="phase-subtitle">{phase.subtitle}</p>
              <ul>
                {phase.details.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="roadmap-column">
          {phases.slice(4).map((phase, index) => (
            <div
              key={index + 4}
              className={`roadmap-card card-float-${(index + 1) % 2}`}
            >
              <h3
                style={{
                  color: phase.titleColor,
                  fontFamily: phase.font,
                }}
              >
                {phase.title}
              </h3>
              <p className="phase-subtitle">{phase.subtitle}</p>
              <ul>
                {phase.details.map((detail, idx) => (
                  <li key={idx}>{detail}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Roadmap;

