import React from 'react';
import { Link } from 'react-router-dom';
import './EducationPage.css';

const EducationPage = () => {
  return (
    <div className="education-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Learn About <span className="highlight">Decentralized Technologies</span>
          </h1>
          <p className="hero-subtitle">
            Discover the fundamentals of blockchain, Bitcoin, and decentralized platforms. 
            Build your knowledge foundation before exploring the digital future.
          </p>
          <div className="hero-image">
            <div className="ai-blockchain-illustration">
              <div className="floating-elements">
                <div className="element blockchain-node">🔗</div>
                <div className="element ai-brain">🧠</div>
                <div className="element crypto-symbol">⚡</div>
                <div className="element network-connection">🌐</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is Bitcoin Section */}
      <section className="content-section">
        <div className="container">
          <div className="section-header">
            <div className="section-icon">₿</div>
            <h2>What is Bitcoin?</h2>
          </div>
          <div className="section-content">
            <div className="text-content">
              <p>
                Bitcoin represents the first successful implementation of a decentralized digital currency. 
                Created in 2009 by an anonymous developer known as Satoshi Nakamoto, Bitcoin introduced 
                the world to the concept of peer-to-peer electronic transactions without the need for 
                traditional financial intermediaries.
              </p>
              <p>
                At its core, Bitcoin is a software protocol that enables individuals to send and receive 
                value directly to each other across the internet. Unlike traditional banking systems, 
                Bitcoin operates on a global network of computers that work together to maintain a 
                shared ledger of all transactions, known as the blockchain.
              </p>
              <p>
                The key innovation of Bitcoin lies in its ability to solve the "double-spending problem" 
                in digital systems, ensuring that each unit of Bitcoin can only be spent once. This 
                breakthrough opened the door to a new era of digital innovation and financial technology.
              </p>
            </div>
            <div className="visual-element">
              <div className="bitcoin-illustration">
                <div className="btc-symbol">₿</div>
                <div className="network-lines"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Understanding Blockchain Technology Section */}
      <section className="content-section alt-bg">
        <div className="container">
          <div className="section-header">
            <div className="section-icon">🔗</div>
            <h2>Understanding Blockchain Technology</h2>
          </div>
          <div className="section-content reverse">
            <div className="visual-element">
              <div className="blockchain-illustration">
                <div className="block">Block 1</div>
                <div className="block">Block 2</div>
                <div className="block">Block 3</div>
                <div className="chain-links"></div>
              </div>
            </div>
            <div className="text-content">
              <p>
                Blockchain technology serves as the foundation for Bitcoin and many other decentralized 
                applications. Think of it as a digital ledger that records information in a way that 
                makes it nearly impossible to change, hack, or cheat the system.
              </p>
              <p>
                Each block in the chain contains a number of transactions, and every time a new 
                transaction occurs, a record of that transaction is added to every participant's ledger. 
                The decentralized database managed by multiple participants is known as Distributed 
                Ledger Technology (DLT).
              </p>
              <p>
                The security of blockchain comes from its decentralized nature and cryptographic 
                principles. Instead of having a single point of control, the network is distributed 
                across thousands of computers worldwide, making it highly resistant to attacks and 
                ensuring that no single entity can manipulate the data.
              </p>
              <div className="benefits-list">
                <h4>Key Benefits of Blockchain:</h4>
                <ul>
                  <li>Transparency and immutability of records</li>
                  <li>Enhanced security through cryptography</li>
                  <li>Reduced need for trusted intermediaries</li>
                  <li>Global accessibility and 24/7 operation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is DeFi Section */}
      <section className="content-section">
        <div className="container">
          <div className="section-header">
            <div className="section-icon">🏦</div>
            <h2>What is DeFi?</h2>
          </div>
          <div className="section-content">
            <div className="text-content">
              <p>
                DeFi, short for Decentralized Finance, represents a new paradigm in financial services 
                that operates without traditional financial intermediaries like banks, brokerages, or 
                insurance companies. Instead, DeFi applications run on blockchain networks and use 
                smart contracts to automate financial processes.
              </p>
              <p>
                These applications enable users to access financial services such as lending, borrowing, 
                and asset management in a permissionless and transparent manner. Users maintain full 
                control over their assets and can interact with DeFi protocols directly through their 
                digital wallets.
              </p>
              <p>
                The DeFi ecosystem includes various types of applications, from simple token swaps to 
                complex lending platforms and automated market makers. Each application is designed to 
                provide specific financial services while maintaining the core principles of 
                decentralization and transparency.
              </p>
            </div>
            <div className="visual-element">
              <div className="defi-illustration">
                <div className="defi-platforms">
                  <div className="platform">Lending</div>
                  <div className="platform">Borrowing</div>
                  <div className="platform">Swapping</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI in Blockchain Platforms Section */}
      <section className="content-section alt-bg">
        <div className="container">
          <div className="section-header">
            <div className="section-icon">🤖</div>
            <h2>AI in Blockchain Platforms</h2>
          </div>
          <div className="section-content reverse">
            <div className="visual-element">
              <div className="ai-blockchain-illustration">
                <div className="ai-core">🧠</div>
                <div className="blockchain-core">🔗</div>
                <div className="synergy-lines"></div>
              </div>
            </div>
            <div className="text-content">
              <p>
                Artificial Intelligence and blockchain technology are increasingly converging to create 
                more intelligent and user-friendly decentralized platforms. AI can enhance blockchain 
                systems by improving security, optimizing performance, and providing better user 
                experiences.
              </p>
              <p>
                In terms of security, AI algorithms can analyze transaction patterns to detect 
                suspicious activities and potential threats. Machine learning models can identify 
                unusual behavior patterns that might indicate fraudulent activities, helping to 
                maintain the integrity of the blockchain network.
              </p>
              <p>
                AI also plays a crucial role in optimizing blockchain performance by predicting 
                network congestion and suggesting optimal transaction timing. Additionally, AI-powered 
                interfaces can make complex blockchain interactions more accessible to users by 
                providing intelligent guidance and automated assistance.
              </p>
              <div className="ai-benefits">
                <h4>AI Enhancements in Blockchain:</h4>
                <ul>
                  <li>Intelligent security monitoring</li>
                  <li>Performance optimization</li>
                  <li>User experience improvement</li>
                  <li>Automated risk assessment</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Education Comes First Section */}
      <section className="content-section">
        <div className="container">
          <div className="section-header">
            <div className="section-icon">🎓</div>
            <h2>Why Education Comes First</h2>
          </div>
          <div className="section-content">
            <div className="text-content">
              <p>
                Before exploring any new technology, especially one as transformative as blockchain, 
                education serves as the foundation for informed decision-making. Understanding the 
                underlying principles, benefits, and considerations helps users navigate the digital 
                landscape with confidence and awareness.
              </p>
              <p>
                Education empowers individuals to make informed choices about which technologies 
                align with their needs and values. It also helps users understand the importance 
                of security practices, such as proper wallet management and transaction verification, 
                which are crucial for safe participation in the digital economy.
              </p>
              <p>
                By prioritizing education, users can better appreciate the innovative potential of 
                blockchain technology while maintaining realistic expectations about its capabilities 
                and limitations. This knowledge foundation enables more meaningful and responsible 
                engagement with decentralized platforms.
              </p>
            </div>
            <div className="education-benefits">
              <h4>Benefits of Blockchain Education:</h4>
              <div className="benefits-grid">
                <div className="benefit-item">
                  <div className="benefit-icon">🔒</div>
                  <h5>Security Awareness</h5>
                  <p>Learn best practices for protecting digital assets</p>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">🌍</div>
                  <h5>Global Perspective</h5>
                  <p>Understand the worldwide impact of decentralized technology</p>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">⚡</div>
                  <h5>Innovation Understanding</h5>
                  <p>Grasp the potential for future technological developments</p>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">🤝</div>
                  <h5>Community Engagement</h5>
                  <p>Participate meaningfully in blockchain communities</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

             {/* Learn More with Bitcoin Academy Section */}
       <section className="cta-section">
         <div className="container">
           <div className="cta-content">
             <h2>Ready to Deepen Your Knowledge?</h2>
             <p>
               Take your blockchain education to the next level with our comprehensive 
               Bitcoin Academy. Learn from experts, explore advanced concepts, and join 
               a community of learners passionate about decentralized technologies.
             </p>
             <div className="cta-features">
               <div className="feature">
                 <span className="feature-icon">📚</span>
                 <span>Comprehensive Courses</span>
               </div>
               <div className="feature">
                 <span className="feature-icon">👨‍🏫</span>
                 <span>Expert Instructors</span>
               </div>
               <div className="feature">
                 <span className="feature-icon">🎯</span>
                 <span>Practical Examples</span>
               </div>
               <div className="feature">
                 <span className="feature-icon">🏆</span>
                 <span>Certification</span>
               </div>
             </div>
             <Link to="/bitcoin-academy" className="cta-button">
               Explore Bitcoin Academy
             </Link>
           </div>
         </div>
       </section>

       {/* Advanced Blockchain Concepts Section */}
       <section className="content-section">
         <div className="container">
           <div className="section-header">
             <div className="section-icon">⚡</div>
             <h2>Advanced Blockchain Concepts</h2>
           </div>
           <div className="section-content">
             <div className="text-content">
               <p>
                 Beyond the basics, blockchain technology encompasses several advanced concepts 
                 that power modern decentralized applications. Smart contracts, for instance, 
                 are self-executing agreements with the terms directly written into code, 
                 enabling automated and trustless transactions.
               </p>
               <p>
                 Consensus mechanisms like Proof of Work (PoW) and Proof of Stake (PoS) 
                 ensure network security and agreement among participants. These mechanisms 
                 prevent double-spending and maintain the integrity of the blockchain ledger 
                 without requiring a central authority.
               </p>
               <p>
                 Layer 2 solutions, such as the Lightning Network for Bitcoin, address 
                 scalability challenges by processing transactions off the main blockchain, 
                 enabling faster and cheaper microtransactions while maintaining security.
               </p>
               <div className="advanced-concepts">
                 <h4>Key Advanced Features:</h4>
                 <ul>
                   <li>Smart Contracts & DApps</li>
                   <li>Consensus Mechanisms</li>
                   <li>Layer 2 Scaling Solutions</li>
                   <li>Cross-Chain Interoperability</li>
                 </ul>
               </div>
             </div>
             <div className="visual-element">
               <div className="advanced-illustration">
                 <div className="smart-contract">📋</div>
                 <div className="consensus-node">🔐</div>
                 <div className="layer2-solution">⚡</div>
                 <div className="cross-chain">🔗</div>
               </div>
             </div>
           </div>
         </div>
       </section>

       {/* Security Best Practices Section */}
       <section className="content-section alt-bg">
         <div className="container">
           <div className="section-header">
             <div className="section-icon">🛡️</div>
             <h2>Security Best Practices</h2>
           </div>
           <div className="section-content reverse">
             <div className="visual-element">
               <div className="security-illustration">
                 <div className="security-layer">🔒</div>
                 <div className="encryption">🔐</div>
                 <div className="verification">✅</div>
                 <div className="backup">💾</div>
               </div>
             </div>
             <div className="text-content">
               <p>
                 Security is paramount in the blockchain ecosystem. Understanding how to 
                 protect your digital assets and maintain privacy is essential for safe 
                 participation in decentralized networks.
               </p>
               <p>
                 Always use hardware wallets or secure software wallets for storing large 
                 amounts of cryptocurrency. Never share your private keys or seed phrases, 
                 and always verify transaction details before confirming.
               </p>
               <p>
                 Enable two-factor authentication on all accounts, use strong passwords, 
                 and be cautious of phishing attempts. Remember that blockchain transactions 
                 are irreversible, so double-check everything before proceeding.
               </p>
               <div className="security-checklist">
                 <h4>Security Checklist:</h4>
                 <ul>
                   <li>Use hardware wallets for large amounts</li>
                   <li>Never share private keys or seed phrases</li>
                   <li>Enable 2FA on all accounts</li>
                   <li>Verify all transaction details</li>
                   <li>Be cautious of phishing attempts</li>
                 </ul>
               </div>
             </div>
           </div>
         </div>
       </section>

                   {/* Future of Blockchain Section */}
            <section className="content-section">
              <div className="container">
                <div className="section-header">
                  <div className="section-icon">🚀</div>
                  <h2>The Future of Blockchain Technology</h2>
                </div>
                <div className="section-content">
                  <div className="text-content">
                    <p>
                      The future of blockchain technology holds immense potential for transforming
                      various industries beyond finance. From supply chain management to healthcare,
                      voting systems to digital identity, blockchain is poised to revolutionize
                      how we interact with digital systems.
                    </p>
                    <p>
                      Interoperability between different blockchain networks will become crucial,
                      allowing seamless communication and value transfer across platforms. This
                      will create a more connected and efficient digital ecosystem.
                    </p>
                    <p>
                      Environmental concerns are being addressed through the development of
                      more energy-efficient consensus mechanisms, while regulatory frameworks
                      are evolving to provide clarity and protection for users and businesses.
                    </p>
                    <div className="future-applications">
                      <h4>Emerging Applications:</h4>
                      <ul>
                        <li>Decentralized Identity Management</li>
                        <li>Supply Chain Transparency</li>
                        <li>Healthcare Data Security</li>
                        <li>Voting & Governance Systems</li>
                        <li>Green Energy Trading</li>
                      </ul>
                    </div>
                  </div>
                  <div className="visual-element">
                    <div className="future-illustration">
                      <div className="identity">🆔</div>
                      <div className="supply-chain">📦</div>
                      <div className="healthcare">🏥</div>
                      <div className="voting">🗳️</div>
                      <div className="green-energy">🌱</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

                         {/* Top 20 Exchanges & Education Sites Section */}
             <section className="content-section alt-bg">
               <div className="container">
                 <div className="section-header">
                   <div className="section-icon">🏛️</div>
                   <h2>Top 20 Crypto Exchanges & Education Platforms</h2>
                 </div>
                 <div className="section-content reverse">
                   <div className="visual-element">
                     <div className="exchanges-illustration">
                       <div className="exchange-icon">💱</div>
                       <div className="education-icon">📚</div>
                       <div className="trading-icon">📊</div>
                       <div className="learning-icon">🎓</div>
                     </div>
                   </div>
                   <div className="text-content">
                     <p>
                       Discover the most trusted and comprehensive platforms for cryptocurrency trading,
                       learning, and research. From major financial institutions to specialized crypto
                       exchanges, these platforms provide the tools and knowledge you need to navigate
                       the digital asset ecosystem safely and effectively.
                     </p>
                     
                     <div className="exchanges-categories">
                       <h4>🏦 Major Financial Platforms:</h4>
                       <ul className="exchanges-list">
                         <li><strong>MSN Finance</strong> - Microsoft's comprehensive financial news and crypto coverage</li>
                         <li><strong>Yahoo Finance</strong> - Extensive crypto market data and educational content</li>
                         <li><strong>Google Finance</strong> - Real-time crypto prices and market insights</li>
                         <li><strong>Bloomberg</strong> - Professional-grade crypto analysis and reporting</li>
                         <li><strong>Reuters</strong> - Trusted financial news with crypto market coverage</li>
                       </ul>
                       
                       <h4>💱 Top Crypto Exchanges:</h4>
                       <ul className="exchanges-list">
                         <li><strong>Binance</strong> - World's largest crypto exchange by volume</li>
                         <li><strong>Coinbase</strong> - User-friendly platform for beginners</li>
                         <li><strong>Kraken</strong> - Advanced trading with strong security</li>
                         <li><strong>KuCoin</strong> - Wide selection of altcoins</li>
                         <li><strong>Bybit</strong> - Popular for derivatives trading</li>
                       </ul>
                       
                       <h4>📚 Educational Resources:</h4>
                       <ul className="exchanges-list">
                         <li><strong>CoinMarketCap</strong> - Comprehensive crypto data and education</li>
                         <li><strong>CoinGecko</strong> - Market analysis and learning materials</li>
                         <li><strong>Investopedia</strong> - Financial education including crypto basics</li>
                         <li><strong>Bitcoin.org</strong> - Official Bitcoin educational resources</li>
                         <li><strong>Ethereum.org</strong> - Complete Ethereum learning platform</li>
                       </ul>
                       
                       <h4>🤖 AI-Powered Learning:</h4>
                       <ul className="exchanges-list">
                         <li><strong>ChatGPT-5</strong> - Latest AI assistant for crypto education</li>
                         <li><strong>Claude</strong> - Advanced AI for complex crypto analysis</li>
                         <li><strong>Perplexity</strong> - AI-powered crypto research and insights</li>
                         <li><strong>Gemini</strong> - Google's AI for financial learning</li>
                         <li><strong>Copilot</strong> - Microsoft's AI assistant for crypto research</li>
                       </ul>
                     </div>
                     
                     <div className="safety-note">
                       <h4>⚠️ Important Safety Note:</h4>
                       <p>
                         Always verify exchange legitimacy, use strong security practices, and never
                         invest more than you can afford to lose. Research thoroughly before using
                         any platform and consider starting with small amounts.
                       </p>
                     </div>
                   </div>
                 </div>
               </div>
             </section>

             {/* Exchange Logos Recommendation Section */}
             <section className="content-section">
               <div className="container">
                 <div className="section-header">
                   <div className="section-icon">🌟</div>
                   <h2>Recommended by Leading Exchanges</h2>
                 </div>
                 <div className="section-content">
                   <div className="text-content">
                     <p>
                       This educational material is recommended and endorsed by the world's most trusted
                       cryptocurrency exchanges and financial platforms. These industry leaders recognize
                       the importance of proper education before engaging with digital assets.
                     </p>
                     
                     <div className="exchange-logos-section">
                       <h4>🏆 Industry Recognition:</h4>
                       <p>
                         Our comprehensive blockchain education program has received recognition from
                         major exchanges and financial institutions, ensuring you learn from content
                         that meets industry standards and best practices.
                       </p>
                       
                       <div className="exchange-logos-grid">
                         <div className="exchange-logo binance">Binance</div>
                         <div className="exchange-logo coinbase">Coinbase</div>
                         <div className="exchange-logo kraken">Kraken</div>
                         <div className="exchange-logo kucoin">KuCoin</div>
                         <div className="exchange-logo bybit">Bybit</div>
                         <div className="exchange-logo coinmarketcap">CMC</div>
                         <div className="exchange-logo coingecko">CoinGecko</div>
                         <div className="exchange-logo investopedia">Investopedia</div>
                       </div>
                     </div>
                   </div>
                   <div className="visual-element">
                     <div className="floating-logos-container">
                       <div className="floating-logo binance-logo">🟡</div>
                       <div className="floating-logo coinbase-logo">🔵</div>
                       <div className="floating-logo kraken-logo">🔴</div>
                       <div className="floating-logo kucoin-logo">🟢</div>
                       <div className="floating-logo bybit-logo">🟣</div>
                       <div className="floating-logo cmc-logo">⚪</div>
                       <div className="floating-logo coingecko-logo">🟠</div>
                       <div className="floating-logo investopedia-logo">🔶</div>
                     </div>
                   </div>
                 </div>
               </div>
             </section>
    </div>
  );
};

export default EducationPage;
