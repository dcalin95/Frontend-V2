import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./HomeAISection.css";

const HomeAISection = () => {
  const aiFeatures = [
    {
      title: "AI-Powered Trading",
      description: "Revolutionize your trades with real-time AI analytics.",
      detailedDescription:
        "AI-Powered Trading transforms the trading experience by utilizing advanced algorithms and machine learning to analyze market trends, identify patterns, and optimize entry and exit points in real-time. By automating trade execution and minimizing human intervention, it enhances efficiency and reduces emotional biases. Key Benefits: Real-Time Market Insights: Processes vast amounts of data to uncover trends and opportunities. Automated Execution: Executes trades with precision, reducing delays and maximizing profitability. Risk Management: Monitors market conditions to identify and mitigate potential risks. AI-powered trading empowers users to make data-driven decisions, adapt to market dynamics, and achieve greater success in ever-changing financial markets.",
      icon: "🤖",
    },
    {
      title: "Dynamic Liquidity",
      description: "Maximize profits with smart liquidity management.",
      detailedDescription:
        "Our Dynamic Liquidity system employs advanced algorithms to optimize your investments across multiple liquidity pools. By continuously analyzing real-time market data, it reallocates assets to capitalize on arbitrage opportunities and respond to shifting market conditions. This dynamic approach enhances capital efficiency, reduces exposure to liquidity risks, and maximizes profitability by ensuring optimal asset distribution in an ever-evolving financial landscape.",
      icon: "🌊",
    },
    {
      title: "Secure Ecosystem",
      description: "Enhanced security for reliable decentralized transactions.",
      detailedDescription:
        "Our Secure Ecosystem integrates state-of-the-art encryption technologies, such as fully homomorphic encryption (FHE) and end-to-end encryption protocols, to ensure that your data remains secure throughout its lifecycle. By leveraging advanced monitoring systems powered by artificial intelligence (AI) and machine learning (ML), we provide real-time threat detection and mitigation, safeguarding your transactions and sensitive information from malicious actors. This robust security framework is designed to uphold the highest standards of data confidentiality, integrity, and resilience against evolving cyber threats.",
      icon: "🔒",
    },
    {
      title: "Intelligent Insights",
      description: "Unlock growth opportunities with predictive AI models.",
      detailedDescription:
        "AI-Dfor Emerging Market Trends. Artificial Intelligence (AI) provides actionable insights and predictive analytics, enabling organizations to identify and capitalize on emerging market trends. By leveraging large datasets and advanced algorithms, AI empowers businesses to make proactive decisions and stay ahead in competitive markets. For instance, in the financial sector, AI analyzes vast quantities of real-time data to detect patterns and forecast market movements with unparalleled accuracy. Similarly, in retail, AI optimizes inventory management while personalizing customer recommendations, boosting sales and enhancing customer satisfaction. AI-driven predictive analytics not only improve operational efficiency but also offer a significant competitive advantage. Organizations can anticipate market dynamics, swiftly adapt to changes, and better meet evolving consumer demands. This proactive approach ensures businesses remain resilient and innovative in a rapidly shifting landscape.",
      icon: "🧠",
    },
  ];

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);
  const [selectedFeature, setSelectedFeature] = useState(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };

    const handleScroll = () => {
      setScrollOffset(window.scrollY / window.innerHeight);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleCardClick = (feature) => {
    setSelectedFeature(feature);
  };

  const closePopup = () => {
    setSelectedFeature(null);
  };

  return (
    <section className="home-ai-section">
      <h2 className="ai-section-title">Explore BitSwapDEX AI Features</h2>
      <div className="ai-cards-container">
        {aiFeatures.map((feature, index) => (
          <motion.div
            key={index}
            className="ai-card"
            initial={{ opacity: 0, y: 50 }}
            animate={{
              opacity: 1,
              y: 0,
              x: mousePosition.x * 30 - 15,
              scale: 1 + scrollOffset * 0.1,
              rotate: scrollOffset * 5,
            }}
            transition={{
              duration: 0.5,
              ease: "easeInOut",
              delay: index * 0.2,
            }}
            whileHover={{
              scale: 1.1,
              rotate: 5,
              boxShadow: "0 0 20px rgba(0, 255, 255, 0.7)",
            }}
            onClick={() => handleCardClick(feature)} // Afișează pop-up-ul la click
          >
            <div className="ai-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Pop-up pentru detalii suplimentare */}
      {selectedFeature && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={closePopup}>
              ✖
            </button>
            <h3>{selectedFeature.title}</h3>
            <p>{selectedFeature.detailedDescription}</p>
          </div>
        </div>
      )}
    </section>
  );
};

export default HomeAISection;

