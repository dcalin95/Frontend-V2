import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AIInfographic from '../components/AIInfographic';

const SatoshiNakamoto = () => {
  const [selectedTimelineItem, setSelectedTimelineItem] = useState(null);
  const [selectedTheory, setSelectedTheory] = useState(null);

  const timelineDetails = {
    2008: {
      title: "Whitepaper Released",
      fullDescription: "On October 31, 2008, Satoshi Nakamoto published the document 'Bitcoin: A Peer-to-Peer Electronic Cash System' on the cryptography@metzdowd.com mailing list. This 9-page whitepaper described the Bitcoin and blockchain concept for the first time.",
      details: [
        "📧 Posted to cryptography@metzdowd.com mailing list",
        "📄 9 pages of detailed technical explanations", 
        "🌍 First public announcement of Bitcoin concept",
        "🔗 Original link: bitcoin.org/bitcoin.pdf",
        "💡 Solved the 'double-spending' problem without central authority"
      ]
    },
    2009: {
      title: "Genesis Block",
      fullDescription: "On January 3, 2009, Satoshi mined the first Bitcoin block (Genesis Block) which contained the message 'The Times 03/Jan/2009 Chancellor on brink of second bailout for banks' - a reference to the 2008 financial crisis.",
      details: [
        "📅 January 3, 2009, 18:15:05 GMT",
        "🗞️ Message: 'The Times 03/Jan/2009 Chancellor on brink of second bailout for banks'",
        "💰 Reward: 50 BTC (never spent)",
        "🔢 Block hash: 000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
        "⚡ First proof that Bitcoin works in practice"
      ]
    },
    2010: {
      title: "Active Development", 
      fullDescription: "In 2010, Satoshi continued to actively develop Bitcoin software, communicate with the community, and make important improvements. It was the first year with real commercial transactions.",
      details: [
        "💻 Regular Bitcoin software releases",
        "🍕 First commercial transaction: 10,000 BTC for 2 pizzas",
        "👥 Bitcoin community began to grow",
        "🔧 Protocol and security improvements",
        "📈 First exchange: BitcoinMarket.com"
      ]
    },
    2011: {
      title: "Final Messages",
      fullDescription: "In April 2011, Satoshi sent his last known public messages, handing over Bitcoin development to the community and disappearing forever from public space.",
      details: [
        "📧 Last public email: April 23, 2011",
        "🔑 Gave domain and code access to developers",
        "👨‍💻 Gavin Andresen took over project leadership",
        "🌫️ Complete disappearance from public communication",
        "🎯 'I've moved on to other things' - final words"
      ]
    }
  };

  const theoryDetails = {
    government: {
      title: "Government Agency",
      fullDescription: "The theory that Satoshi was a government agency is based on Bitcoin's technical sophistication and the perfect timing of its launch during the 2008 financial crisis.",
      details: [
        "🏛️ NSA published papers on digital currencies in 1996",
        "⏰ Perfect timing with 2008 financial crisis", 
        "🔐 Advanced cryptographic knowledge",
        "🇺🇸 American writing style and activity hours",
        "❌ Counter-argument: Decentralization contradicts government interests"
      ]
    },
    group: {
      title: "Group of People",
      fullDescription: "Many experts believe Bitcoin is too complex to be created by one person and that Satoshi represents a group of cryptographers and programmers.",
      details: [
        "👥 Multiple programming styles in code",
        "🧠 Vast knowledge across diverse domains",
        "⏱️ 24/7 activity across different timezones",
        "🔧 Extraordinary technical complexity",
        "💬 Variations in communication style"
      ]
    },
    academic: {
      title: "Academic Researcher", 
      fullDescription: "The academic theory suggests Satoshi was a university professor or cryptography researcher, based on the scientific rigor of the whitepaper.",
      details: [
        "📚 Whitepaper follows academic structure",
        "🎓 References to relevant scientific papers",
        "🔬 Methodical and rigorous approach",
        "🏫 Access to advanced research resources",
        "📖 Formal and technical writing style"
      ]
    },
    executive: {
      title: "Tech Executive",
      fullDescription: "The tech executive theory is based on deep understanding of the software industry and digital payment market needs.",
      details: [
        "💼 Deep understanding of software market",
        "🚀 Experience in launching tech products",
        "💰 Motivation to disrupt financial industry",
        "📊 Knowledge of startup ecosystem",
        "🎯 Long-term strategic vision"
      ]
    }
  };
  return (
    <motion.div 
      className="educational-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="page-header">
        <motion.h1 
          className="page-title"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <span className="title-icon">👤</span>
          Satoshi Nakamoto
        </motion.h1>
        <motion.p 
          className="page-subtitle"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          The mysterious creator of Bitcoin
        </motion.p>
      </div>

      <div className="content-grid">
        <motion.div 
          className="content-section"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2>The Enigma Behind Bitcoin</h2>
          <p>
            Satoshi Nakamoto is the pseudonymous person or group who created Bitcoin, 
            authored the Bitcoin whitepaper, and created the first Bitcoin software. 
            Their true identity remains one of the greatest mysteries in the crypto world.
          </p>
          
          <div className="key-features">
            <div className="feature-card">
              <div className="feature-icon">📄</div>
              <h3>Whitepaper Author</h3>
              <p>Published "Bitcoin: A Peer-to-Peer Electronic Cash System" on October 31, 2008</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚙️</div>
              <h3>Original Developer</h3>
              <p>Created the first Bitcoin software and mined the genesis block</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👻</div>
              <h3>Mysterious Exit</h3>
              <p>Disappeared from public view in 2011, leaving Bitcoin to the community</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💎</div>
              <h3>Untouched Wealth</h3>
              <p>Estimated 1 million BTC remain unmoved in Satoshi's wallets</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="infographic-section"
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="mystery-timeline">
            <h3>Satoshi Timeline <span className="interactive-hint">🔍 Click for details</span></h3>
            <div className="timeline-events">
              <motion.div 
                className="timeline-item clickable"
                onClick={() => setSelectedTimelineItem(2008)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="timeline-date">2008</div>
                <div className="timeline-content">
                  <h4>Whitepaper Released 📄</h4>
                  <p>Bitcoin concept introduced to the world</p>
                  <span className="click-indicator">+ Click for more details</span>
                </div>
              </motion.div>
              <motion.div 
                className="timeline-item clickable"
                onClick={() => setSelectedTimelineItem(2009)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="timeline-date">2009</div>
                <div className="timeline-content">
                  <h4>Genesis Block ⛓️</h4>
                  <p>First Bitcoin block mined with newspaper headline</p>
                  <span className="click-indicator">+ Click for more details</span>
                </div>
              </motion.div>
              <motion.div 
                className="timeline-item clickable"
                onClick={() => setSelectedTimelineItem(2010)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="timeline-date">2010</div>
                <div className="timeline-content">
                  <h4>Active Development 💻</h4>
                  <p>Continued Bitcoin software improvements</p>
                  <span className="click-indicator">+ Click for more details</span>
                </div>
              </motion.div>
              <motion.div 
                className="timeline-item clickable"
                onClick={() => setSelectedTimelineItem(2011)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="timeline-date">2011</div>
                <div className="timeline-content">
                  <h4>Final Messages 🌫️</h4>
                  <p>Last known communications before disappearing</p>
                  <span className="click-indicator">+ Click for more details</span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div 
        className="theories-section"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <h2>Popular Theories <span className="interactive-hint">🔍 Click for detailed analysis</span></h2>
        <div className="theories-grid">
          <motion.div 
            className="theory-card clickable"
            onClick={() => setSelectedTheory('government')}
            whileHover={{ scale: 1.05, rotateY: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="theory-icon">🏛️</div>
            <h3>Government Agency</h3>
            <p>Some believe Satoshi was a government project or intelligence agency</p>
            <span className="click-indicator">+ Click for complete analysis</span>
          </motion.div>
          <motion.div 
            className="theory-card clickable"
            onClick={() => setSelectedTheory('group')}
            whileHover={{ scale: 1.05, rotateY: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="theory-icon">👥</div>
            <h3>Group of People</h3>
            <p>Multiple cryptographers and developers working together</p>
            <span className="click-indicator">+ Click for complete analysis</span>
          </motion.div>
          <motion.div 
            className="theory-card clickable"
            onClick={() => setSelectedTheory('academic')}
            whileHover={{ scale: 1.05, rotateY: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="theory-icon">🎓</div>
            <h3>Academic Researcher</h3>
            <p>University professor or cryptography researcher</p>
            <span className="click-indicator">+ Click for complete analysis</span>
          </motion.div>
          <motion.div 
            className="theory-card clickable"
            onClick={() => setSelectedTheory('executive')}
            whileHover={{ scale: 1.05, rotateY: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="theory-icon">💼</div>
            <h3>Tech Executive</h3>
            <p>High-profile technology industry figure</p>
            <span className="click-indicator">+ Click for complete analysis</span>
          </motion.div>
        </div>
      </motion.div>

      <motion.div 
        className="impact-section"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <h2>Satoshi's Legacy</h2>
        <div className="legacy-stats">
          <div className="stat-item">
            <span className="stat-number">$1T+</span>
            <span className="stat-label">Bitcoin Market Cap Created</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">100M+</span>
            <span className="stat-label">People Using Bitcoin</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">15,000+</span>
            <span className="stat-label">Cryptocurrencies Inspired</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">∞</span>
            <span className="stat-label">Revolutionary Impact</span>
          </div>
        </div>
      </motion.div>

      {/* Timeline Detail Modal */}
      <AnimatePresence>
        {selectedTimelineItem && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTimelineItem(null)}
          >
            <motion.div
              className="timeline-modal"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>{timelineDetails[selectedTimelineItem]?.title}</h2>
                <button 
                  className="close-button"
                  onClick={() => setSelectedTimelineItem(null)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-content">
                <p className="modal-description">
                  {timelineDetails[selectedTimelineItem]?.fullDescription}
                </p>
                <div className="modal-details-list">
                  {timelineDetails[selectedTimelineItem]?.details.map((detail, index) => (
                    <motion.div
                      key={index}
                      className="detail-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {detail}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Theory Detail Modal */}
      <AnimatePresence>
        {selectedTheory && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTheory(null)}
          >
            <motion.div
              className="theory-modal"
              initial={{ scale: 0.5, opacity: 0, rotateY: -90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotateY: 90 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>{theoryDetails[selectedTheory]?.title}</h2>
                <button 
                  className="close-button"
                  onClick={() => setSelectedTheory(null)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-content">
                <p className="modal-description">
                  {theoryDetails[selectedTheory]?.fullDescription}
                </p>
                <div className="modal-details-list">
                  <h3>Evidence and Arguments:</h3>
                  {theoryDetails[selectedTheory]?.details.map((detail, index) => (
                    <motion.div
                      key={index}
                      className="detail-item"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {detail}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SatoshiNakamoto;