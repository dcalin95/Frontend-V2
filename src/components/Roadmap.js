import React from "react";
import "./Roadmap.css";
import "./Roadmap.mobile.css";

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
    title: "🧱 Phase 1: Foundation & Strategic Setup",
    subtitle: "(Q2–Q3 2025)",
    details: [
      <>
        <span className="ai-bullet"></span> Core team assembled: blockchain, AI & DeFi experts
      </>,
      <>
        <span className="ai-bullet"></span> Smart contract suite drafted (Node, Cell, Referral)
      </>,
      <>
        <span className="ai-bullet"></span> Whitepaper v1.0: tokenomics, vesting, AI governance
      </>,
      <>
        <span className="ai-bullet"></span> Official brand & website launched
      </>,
      <>
        <span className="ai-bullet"></span> Social channels: Telegram, X, LinkedIn, Medium
      </>,
      <>
        <span className="ai-bullet"></span> AI prototypes: liquidity optimization & routing
      </>,
    ],
    titleColor: "#00ffe0",
    font: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  },
  {
    title: "🪙 Phase 2: Presale Campaign",
    subtitle: "(Q1–Q3 2026)",
    details: [
      <>
        <span className="ai-bullet"></span> ERC20 $BITS already deployed on{" "}
        <img src={bscIcon} alt="BSC" className="network-icon" />
        <strong> BSC</strong>
      </>,
      <>
        <span className="ai-bullet"></span> Modular presale spans 8–9 months, with dynamic round lengths
      </>,
      <>
        <span className="ai-bullet"></span> Early supporters receive discounted allocations
      </>,
      <>
        <span className="ai-bullet"></span> Referral logic live; KYC/AML compliant
      </>,
      <>
        <span className="ai-bullet"></span> Strategic pauses for outreach, education, and infrastructure
      </>,
      <>
        <span className="ai-bullet"></span> Closure: snapshot, report & vesting deployed
      </>,
    ],
    titleColor: "#ff9800",
    font: "'Roboto Mono', monospace",
  },
  {
    title: "🧪 Phase 3: TestNet & Security Validation",
    subtitle: "(Q4 2026)",
    details: [
      <>
        <span className="ai-bullet"></span> Contracts deployed:{" "}
        <img src={stxIcon} alt="Stacks" className="network-icon" />
        <strong>Stacks</strong> &{" "}
        <img src={bscIcon} alt="BSC" className="network-icon" />
        <strong>BSC</strong> TestNets
      </>,
      <>
        <span className="ai-bullet"></span> Testing: swaps, staking, rewards, governance
      </>,
      <>
        <span className="ai-bullet"></span> AI integration: routing & liquidity rebalancing
      </>,
      <>
        <span className="ai-bullet"></span> Stress testing & load simulation
      </>,
      <>
        <span className="ai-bullet"></span> Audits: CertiK, Trail of Bits, Hacken
      </>,
    ],
    titleColor: "#2196f3",
    font: "'Montserrat', sans-serif",
  },
  {
    title: "🌐 Phase 4: Initial DEX Launch on BSC",
    subtitle: "(Q1 2027)",
    details: [
      <>
        <span className="ai-bullet"></span> $BITS live on{" "}
        <img src={pancakeIcon} alt="PancakeSwap" className="network-icon" />
        <strong>PancakeSwap</strong> with presale liquidity
      </>,
      <>
        <span className="ai-bullet"></span> Vesting enforced for investor allocations
      </>,
      <>
        <span className="ai-bullet"></span> Anti-whale & MEV protection activated
      </>,
      <>
        <span className="ai-bullet"></span> AI swap monitoring & liquidity analytics live
      </>,
      <>
        <span className="ai-bullet"></span> Governance v0 via Snapshot (off-chain)
      </>,
    ],
    titleColor: "#4caf50",
    font: "'Bebas Neue', cursive",
  },
  {
    title: "🔁 Phase 5: Stacks Mainnet Migration",
    subtitle: "(Q2 2027)",
    details: [
      <>
        <span className="ai-bullet"></span> $BITS as native Clarity contract on{" "}
        <img src={stxIcon} alt="Stacks" className="network-icon" />
        <strong>Stacks</strong>
      </>,
      <>
        <span className="ai-bullet"></span> 1:1 bridge: ERC20 ↔ Stacks-native $BITS
      </>,
      <>
        <span className="ai-bullet"></span> Pools: BITS/BTC, BITS/STX, BITS/USDT
      </>,
      <>
        <span className="ai-bullet"></span> On-chain supply parity proof
      </>,
      <>
        <span className="ai-bullet"></span> Migration dashboard: 1-click conversion
      </>,
    ],
    titleColor: "#ffd700",
    font: "'Lobster', cursive",
  },
  {
    title: "🧠 Phase 6: Bitcoin-Native DEX Expansion",
    subtitle: "(Q3 2027)",
    details: [
      <>
        <span className="ai-bullet"></span> Full DEX on{" "}
        <img src={stxIcon} alt="Stacks" className="network-icon" />
        <strong>Stacks Mainnet</strong>, secured via PoX
      </>,
      <>
        <span className="ai-bullet"></span> Direct BITS/BTC with AI rebalancing
      </>,
      <>
        <span className="ai-bullet"></span> On-chain governance v1 with AI simulations
      </>,
      <>
        <span className="ai-bullet"></span> Cross-chain:{" "}
        <img src={ethIcon} alt="ETH" className="network-icon" />
        <strong>ETH</strong>,{" "}
        <img src={bscIcon} alt="BSC" className="network-icon" />
        <strong>BSC</strong> ↔ Stacks
      </>,
      <>
        <span className="ai-bullet"></span> Community grants: AI bots & analytics tools
      </>,
    ],
    titleColor: "#ff5722",
    font: "'Anton', sans-serif",
  },
  {
    title: "🏦 Phase 7: Institutional Onboarding & CEX Listings",
    subtitle: "(Q4 2027 – Q1 2028)",
    details: [
      <>
        <span className="ai-bullet"></span> Institutional tools: AI limits, risk mgmt, reporting
      </>,
      <>
        <span className="ai-bullet"></span> Margin & leverage trading (jurisdiction dependent)
      </>,
      <>
        <span className="ai-bullet"></span> Global expansion: hackathons & summits
      </>,
      <>
        <span className="ai-bullet"></span> Q4 2027:{" "}
        <img src={gateIcon} alt="Gate" className="network-icon" />
        <strong>Gate</strong>,{" "}
        <img src={mexcIcon} alt="KuCoin" className="network-icon" />
        <strong>KuCoin</strong>, OKX
      </>,
      <>
        <span className="ai-bullet"></span> Q1 2028:{" "}
        <img src={binanceIcon} alt="Binance" className="network-icon" />
        <strong>Binance</strong>, Coinbase, Crypto.com, Kraken
      </>,
    ],
    titleColor: "#e91e63",
    font: "'Pacifico', cursive",
  },
  {
    title: "🌱 Phase 8: Continuous Evolution",
    subtitle: "(Q2 2028+)",
    details: [
      <>
        <span className="ai-bullet"></span> Deep-learning: AI routing, LP optimization, risk
      </>,
      <>
        <span className="ai-bullet"></span> Stacks L2/rollup exploration for scalability
      </>,
      <>
        <span className="ai-bullet"></span> Sustainability pools with AI incentives
      </>,
      <>
        <span className="ai-bullet"></span> Tier-1 CEX listings as liquidity scales
      </>,
      <>
        <span className="ai-bullet"></span> Cross-chain AI trading algorithm research
      </>,
    ],
    titleColor: "#673ab7",
    font: "'Anton', sans-serif",
  },
];

const Roadmap = () => {
  return (
    <div className="roadmap-container">
      <h2 className="roadmap-title">🚀 BitSwapDEX AI — Roadmap (2025–2028+) 🚀</h2>
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

