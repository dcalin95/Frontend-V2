import React from "react";
import { motion } from "framer-motion";
import "./About.css";

const About = () => {
  return (
    <div className="about-page"> {/* Adăugat un container unic pentru izolarea stilurilor */}
      <div className="about-content">
        {/* Introducere */}
        <motion.div
          className="about-intro"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1>Welcome to BitSwapDEX AI</h1>
          <p>
            BitSwapDEX AI revolutionizes decentralized finance by combining advanced artificial intelligence with blockchain technology.
            Our mission is to empower users with intelligent, secure, and adaptive trading solutions that simplify the crypto trading landscape.
          </p>
          <p>
            By integrating AI-driven analytics with blockchain’s transparency and security, BitSwapDEX AI offers a seamless platform for trading and investment,
            enabling users to make informed decisions and maximize returns.
          </p>
        </motion.div>

        {/* Bitcoin și Exchange-uri Descentralizate */}
        <motion.div
          className="about-section"
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
        >
          <h2>Bitcoin and Decentralized Exchanges</h2>
          <p>
            Integrating Bitcoin into decentralized exchanges (DEXs) is reshaping the cryptocurrency trading ecosystem. By removing intermediaries,
            users can execute direct, peer-to-peer transactions that are faster, more secure, and cost-effective.
          </p>
          <ul>
            <li><strong>Seamless Cross-Chain Trading:</strong> Atomic swaps and cross-chain bridges ensure efficient and smooth exchanges.</li>
            <li><strong>Enhanced Security:</strong> Bitcoin’s robust network combined with decentralized trading eliminates single points of failure.</li>
            <li><strong>Reduced Fees:</strong> Lower transaction fees compared to centralized exchanges.</li>
          </ul>
        </motion.div>

        {/* Features and Benefits */}
        <motion.div
          className="features-section"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
        >
          <h2>Features and Benefits</h2>
          <ul className="features-list">
            <li>
              <strong>Seamless Swaps:</strong> Rapid and borderless transactions allow effortless swaps between <strong>BITS</strong> and <strong>Bitcoin</strong>.
            </li>
            <li>
              <strong>Secure and Transparent Code:</strong> Built on the robust open-source Bitcoin code, our ecosystem ensures unparalleled security and decentralization.
            </li>
            <li>
              <strong>The Essential Unit – Bit:</strong> Just as the bit is the foundation of digital data, <strong>BITS</strong> fuels the transactions and innovations of our platform.
            </li>
            <li>
              <strong>AI-Driven Optimization:</strong> Real-time AI analytics ensure optimal trading rates for <strong>BITS/Bitcoin</strong> transactions, reducing costs and risks.
            </li>
            <li>
              <strong>Scalable Ecosystem:</strong> Connects Bitcoin with multiple blockchain networks, enhancing liquidity and fostering a diverse trading environment.
            </li>
          </ul>
        </motion.div>

        {/* Presale */}
        <motion.div
          className="about-section"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h2>$BITS Presale</h2>
          <p>
            The $BITS Presale is your exclusive opportunity to join the BitSwapDEX AI ecosystem early and at a discounted rate.
            Investing during the presale phase gives you access to our native token, $BITS, at its most advantageous pricing.
          </p>
          <ul>
            <li><strong>Early Investor Advantage:</strong> Acquire $BITS at a lower price before it’s listed on exchanges.</li>
            <li><strong>Bonus Tokens:</strong> Enjoy additional tokens as a presale reward.</li>
            <li><strong>Be Part of the Foundation:</strong> Your investment supports the growth of BitSwapDEX AI.</li>
          </ul>
        </motion.div>

        {/* Long-Term Benefits */}
        <motion.div
          className="about-section"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h2>Long-Term Benefits of $BITS</h2>
          <p>
            Investing in $BITS is more than just owning a cryptocurrency; it’s a stake in the future of decentralized finance.
            Here’s why $BITS is a smart investment for the long term:
          </p>
          <ul>
            <li><strong>Rising Demand:</strong> As BitSwapDEX AI grows, the utility and demand for $BITS will expand.</li>
            <li><strong>Staking Rewards:</strong> Earn passive income by staking your $BITS tokens.</li>
            <li><strong>Access to Premium Features:</strong> Enjoy exclusive features and lower fees.</li>
          </ul>
        </motion.div>

        {/* How to Profit */}
        <motion.div
          className="about-section"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h2>How to Profit from $BITS</h2>
          <p>Maximize your profit from $BITS with a strategic approach:</p>
          <ul>
            <li><strong>Buy Early During the Presale:</strong> Secure tokens at the lowest price and leverage presale bonuses for higher token allocations.</li>
            <li><strong>Hold for the Long Term:</strong> Benefit from price appreciation as adoption increases.</li>
            <li><strong>Stake for Passive Income:</strong> Participate in staking programs to earn consistent rewards.</li>
            <li><strong>Trade Strategically:</strong> Use BitSwapDEX AI’s analytics to identify the best trading opportunities.</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default About;

