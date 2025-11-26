import React from "react";
import { useSpring, animated } from "@react-spring/web";
import { useNavigate } from "react-router-dom";
import SmartTooltip from "../Presale/components/SmartTooltip";
import AddTokenButton from "./AddTokenButton";
import PurchaseProcessViz from "./PurchaseProcessViz";
import "./HowToBuy.css";
import "./HowToBuy.mobile.css";

const HowToBuy = ({ setCurrentSection }) => {
  const navigate = useNavigate();

  const cardData = [
    {
      title: "1. Connect Wallet",
      description: "Securely connect MetaMask, TrustWallet or any Web3 wallet to start.",
      icon: "🔗",
      tooltip: "Secure Connection\nUses standard EIP-1193 provider.\nClient-side only.",
      details: "Click 'Connect Wallet' in the top right corner. Ensure you are on the BNB Smart Chain (BSC) network."
    },
    {
      title: "2. Select Asset",
      description: "Choose your payment currency: BNB, USDT, USDC or Card.",
      icon: "💳",
      tooltip: "Multi-Chain Support\nAccepted: BNB (Native), USDT (BEP20), USDC (BEP20).\nCard: Via Stripe/Wert.",
      details: "Select the token you wish to swap. Ensure you have a small amount of BNB for gas fees."
    },
    {
      title: "3. Input Amount",
      description: "Enter the amount you wish to invest. The AI calculator handles the rates.",
      icon: "💰",
      tooltip: "Smart Calculation\nReal-time oracle price feed.\nZero slippage guarantee on presale.",
      details: "Type the amount in USD or Token quantity. You will see the exact BITS allocation immediately."
    },
    {
      title: "4. Confirm & Claim",
      description: "Approve the transaction and secure your BITS allocation instantly.",
      icon: "⚡",
      tooltip: "Instant Confirmation\nTransaction hash generated on-chain.\nTokens are reserved in the smart contract.",
      details: "Sign the transaction in your wallet. Once confirmed, tokens are linked to your address."
    },
  ];

  const faqData = [
    {
      q: "What is the Gas Fee?",
      a: "A small network fee paid in BNB to process the transaction on the blockchain. Usually < $0.10.",
      icon: "⛽"
    },
    {
      q: "When do I receive BITS?",
      a: "Tokens are allocated immediately to your address in the contract. Claiming opens at TGE (Token Generation Event).",
      icon: "📅"
    },
    {
      q: "Is it Secure?",
      a: "Yes. Our contract is audited. We do not have access to your private keys. You maintain full custody.",
      icon: "🛡️"
    }
  ];

  // Interactive Card Component
  const InteractiveCard = ({ title, description, icon, tooltip, details }) => {
    const [springProps, api] = useSpring(() => ({
      scale: 1,
      rotateX: 0,
      rotateY: 0,
      config: { mass: 1, tension: 300, friction: 20 },
    }));

    const handleMouseMove = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateX = -(y / rect.height - 0.5) * 10; // Subtle rotation
      const rotateY = (x / rect.width - 0.5) * 10;

      api.start({
        scale: 1.03,
        rotateX,
        rotateY,
      });
    };

    const handleMouseLeave = () => {
      api.start({
        scale: 1,
        rotateX: 0,
        rotateY: 0,
      });
    };

    return (
      <SmartTooltip content={tooltip}>
        <animated.div
          className="guide-card"
          style={{
            transform: springProps.scale.to(
              (s) => `scale(${s}) perspective(1000px) rotateX(${springProps.rotateX.get()}deg) rotateY(${springProps.rotateY.get()}deg)`
            ),
          }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="guide-icon-wrapper">{icon}</div>
          <div className="guide-content">
            <h3>{title}</h3>
            <p>{description}</p>
            <span className="guide-details">{details}</span>
          </div>
        </animated.div>
      </SmartTooltip>
    );
  };

  const handleClick = () => {
    if (typeof setCurrentSection === "function") {
      setCurrentSection("presale");
    } else {
      navigate("/presale");
    }
  };

  return (
    <div className="how-to-buy-container">
      {/* HEADER SECTION */}
      <header className="htb-header">
        <SmartTooltip content={`Purchase Guide\nFollow these simple steps to join the BitSwapDEX ecosystem.`}>
          <h1 className="htb-title">
            How to Buy <span className="highlight">$BITS</span>
          </h1>
        </SmartTooltip>
        <p className="htb-subtitle">
          A seamless, AI-optimized process to secure your allocation.
        </p>
      </header>

      {/* 🧬 ABSTRACT VISUALIZATION */}
      <section className="htb-viz-section">
        <div className="viz-label">
          <span>AI Transaction Flow</span>
        </div>
        <PurchaseProcessViz />
      </section>

      {/* STEPS GRID */}
      <div className="htb-steps-grid">
        {cardData.map((card, index) => (
          <InteractiveCard
            key={`step-${index}`}
            {...card}
          />
        ))}
      </div>

      {/* ACTION AREA */}
      <div className="htb-actions">
        <SmartTooltip content={`Go to Presale\nNavigate to the main dashboard to make a purchase.`}>
          <button className="cta-button-glow" onClick={handleClick}>
            <span className="cta-icon">🚀</span>
            Start Purchase
          </button>
        </SmartTooltip>
        
        <AddTokenButton className="large-btn" />
      </div>

      {/* FAQ SECTION */}
      <div className="htb-faq-section">
        <h3 className="faq-title">Common Questions</h3>
        <div className="faq-grid">
          {faqData.map((item, i) => (
            <SmartTooltip key={i} content={`Info: ${item.q}\n${item.a}`}>
              <div className="faq-card">
                <div className="faq-icon">{item.icon}</div>
                <div>
                  <h4>{item.q}</h4>
                  <p>{item.a}</p>
                </div>
              </div>
            </SmartTooltip>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HowToBuy;
