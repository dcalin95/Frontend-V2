import React from "react";
import { useSpring, animated } from "@react-spring/web";
import { useNavigate } from "react-router-dom";
import "./HowToBuy.css";

const HowToBuy = ({ setCurrentSection }) => {
  const navigate = useNavigate();

  const cardData = [
    {
      imageSrc: "https://cdn.pixabay.com/photo/2017/08/06/08/05/bitcoin-2592145_960_720.jpg",
      title: "Step 1: Connect Your Wallet",
      description: "Choose a trusted wallet like MetaMask, TrustWallet, or Ledger. This ensures your funds are stored securely.",
      icon: "🔗"
    },
    {
      imageSrc: "https://cdn.pixabay.com/photo/2018/10/15/18/37/bitcoin-3748224_960_720.jpg",
      title: "Step 2: Select Payment Method",
      description: "Pay with BNB, USDT, or USDC. Our platform supports multiple payment options for your convenience.",
      icon: "💳"
    },
    {
      imageSrc: "https://cdn.pixabay.com/photo/2020/04/08/20/38/cryptocurrency-5026238_960_720.jpg",
      title: "Step 3: Enter Purchase Amount",
      description: "Decide the amount of $BITS you want to buy and confirm your transaction in seconds.",
      icon: "💰"
    },
    {
      imageSrc: "https://cdn.pixabay.com/photo/2021/05/31/16/29/artificial-intelligence-6292681_960_720.jpg",
      title: "Step 4: Discover AI Analytics",
      description: "Access AI-powered predictions and analytics to optimize your trading decisions.",
      icon: "🤖"
    },
    {
      imageSrc: "https://cdn.pixabay.com/photo/2022/06/12/12/13/artificial-intelligence-7252235_960_720.jpg",
      title: "Step 5: Advanced Portfolio Tools",
      description: "Leverage AI-driven portfolio management tools to track and grow your investments.",
      icon: "📊"
    },
    {
      imageSrc: "https://cdn.pixabay.com/photo/2019/06/11/18/56/artificial-intelligence-4263702_960_720.jpg",
      title: "Step 6: Enjoy Lightning-Fast Transactions",
      description: "Experience secure and seamless transactions with zero delays, backed by blockchain technology.",
      icon: "⚡"
    },
  ];

  // Interactive Card Component
  const InteractiveCard = ({ imageSrc, title, description, icon }) => {
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
      const rotateX = -(y / rect.height - 0.5) * 15;
      const rotateY = (x / rect.width - 0.5) * 15;

      api.start({
        scale: 1.05,
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
      <animated.div
        className="info-card"
        style={{
          transform: springProps.scale.to(
            (s) => `scale(${s}) rotateX(${springProps.rotateX.get()}deg) rotateY(${springProps.rotateY.get()}deg)`
          ),
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="card-icon">{icon}</div>
        <img 
          className="info-image" 
          src={imageSrc} 
          alt={title}
          loading="lazy"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <div className="info-content">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </animated.div>
    );
  };

  // CTA Button Animation
  const ctaSpring = useSpring({
    from: { scale: 1 },
    to: async (next) => {
      while (true) {
        await next({ scale: 1.05 });
        await next({ scale: 1 });
      }
    },
    config: { mass: 1, tension: 200, friction: 10 },
  });

  // Handle CTA Click
  const handleClick = () => {
    if (typeof setCurrentSection === "function") {
      setCurrentSection("presale");
    } else {
      navigate("/presale");
    }
  };

  // Header Animation
  const headerSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(-50px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: { mass: 1, tension: 200, friction: 25 },
  });

  // Cards Stagger Animation
  const cardsSpring = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    delay: 300,
    config: { mass: 1, tension: 200, friction: 25 },
  });

  return (
    <div className="how-to-buy-container">
      {/* Animated Header */}
      <animated.header className="how-to-buy-header" style={headerSpring}>
        <div className="header-bg">
          <h1 className="header-title">
            Your Guide to <span className="highlight">$BITS</span> Transactions
          </h1>
          <p className="header-subtitle">
            Secure, intelligent, and fast trading backed by AI-powered tools.
          </p>
        </div>
      </animated.header>

      {/* Animated Info Section */}
      <animated.div className="info-section" style={cardsSpring}>
        {cardData.map((card, index) => (
          <InteractiveCard
            key={`card-${index}`}
            imageSrc={card.imageSrc}
            title={card.title}
            description={card.description}
            icon={card.icon}
          />
        ))}
      </animated.div>

      {/* CTA Section */}
      <div className="cta-section">
        <h2 className="cta-title">Start Your Crypto Journey Today</h2>
        <p className="cta-subtitle">
          Join thousands of traders who trust our AI-powered platform
        </p>
        <animated.button
          className="cta-button"
          style={{
            transform: ctaSpring.scale.to((s) => `scale(${s})`),
          }}
          onClick={handleClick}
          aria-label="Start trading with BITS"
        >
          <span className="cta-icon">🚀</span>
          Get Started
        </animated.button>
      </div>

      {/* Additional Features Section */}
      <div className="features-highlight">
        <h3 className="features-title">Why Choose BITS?</h3>
        <div className="features-grid">
          <div className="feature-item">
            <span className="feature-icon">🔒</span>
            <h4>Secure</h4>
            <p>Bank-level security with multi-layer encryption</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⚡</span>
            <h4>Fast</h4>
            <p>Lightning-fast transactions with minimal fees</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🤖</span>
            <h4>AI-Powered</h4>
            <p>Advanced analytics and trading insights</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🌍</span>
            <h4>Global</h4>
            <p>Available worldwide with 24/7 support</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowToBuy;