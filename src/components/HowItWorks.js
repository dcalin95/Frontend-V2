import React from "react";
import "./HowItWorks.css";

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

