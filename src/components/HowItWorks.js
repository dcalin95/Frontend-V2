import React from "react";
import "./HowItWorks.css";
import "./HowItWorks.mobile.css";

const HowItWorks = () => {
  const features = [
    {
      title: "AI-Driven Pool Optimization",
      description:
        "BitSwapDEX AI leverages Artificial Intelligence to optimize liquidity pools, providing users with higher rewards and improved trading efficiency.",
      icon: "fas fa-brain",
    },
    {
      title: "Seamless Integration with Bitcoin",
      description:
        "Built on the Stacks blockchain, BitSwapDEX AI uses the Proof-of-Transfer (PoX) mechanism to securely anchor transactions to the Bitcoin network.",
      icon: "fab fa-bitcoin",
    },
    {
      title: "Smart Contract Security",
      description:
        "All pools and exchange functionalities are powered by robust smart contracts, ensuring transparency, security, and decentralization.",
      icon: "fas fa-lock",
    },
    {
      title: "Decentralized Exchange (DEX)",
      description:
        "Trade directly with other users in a fully decentralized manner. BitSwapDEX AI removes intermediaries, providing a trustless trading experience.",
      icon: "fas fa-exchange-alt",
    },
    {
      title: "Earn Rewards with $BITS",
      description:
        "Stake your $BITS tokens in liquidity pools or participate in governance to earn lucrative rewards. The staking mechanism is optimized for long-term profitability.",
      icon: "fas fa-coins",
    },
    {
      title: "AI-Powered Governance",
      description:
        "Participate in the governance of the platform using AI-driven voting mechanisms. This ensures the community has a fair say in decision-making processes.",
      icon: "fas fa-robot",
    },
    {
      title: "AI Portfolio Allocator",
      description:
        "Automated portfolio management with intelligent rebalancing engine. Monitors actual vs target allocation and performs incremental adjustments to optimize long-term performance.",
      icon: "fas fa-chart-pie",
    },
    {
      title: "Market Regime Classifier",
      description:
        "AI detects market environments (bullish, bearish, sideways, high-volatility, post-crash recovery) and automatically adjusts portfolio allocations according to regime conditions.",
      icon: "fas fa-wave-square",
    },
    {
      title: "Research Mode Intelligence",
      description:
        "Real-time monitoring of order books, trades, and liquidity. Detects liquidity gaps, spread anomalies, and volume spikes with quantitative scores and alerts.",
      icon: "fas fa-search",
    },
    {
      title: "Co-Pilot Trading Mode",
      description:
        "AI proposes concrete trades with rationale, risk levels, and portfolio impact. You confirm each execution, maintaining full control while benefiting from AI insights.",
      icon: "fas fa-user-astronaut",
    },
  ];

  return (
    <div className="how-it-works-page">
      {/* Titlu */}
      <h1 className="how-it-works-title">How It Works</h1>
      {/* Secțiunea de funcționalități */}
      <div className="how-it-works-grid">
        {features.map((feature, index) => (
          <div key={index} className="how-it-works-card">
            <div className="icon">
              <i className={feature.icon}></i>
            </div>
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HowItWorks;

