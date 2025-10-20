import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AIInfographic from '../components/AIInfographic';
import QuizCard from '../components/QuizCard';

const BlockchainTechnology = () => {
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [selectedConsensus, setSelectedConsensus] = useState(null);
  const [selectedComparison, setSelectedComparison] = useState(null);

  const featureDetails = {
    immutable: {
      title: "Immutable",
      fullDescription: "Once a transaction is confirmed and added to the blockchain, it becomes virtually impossible to alter or delete. This immutability is achieved through cryptographic hashing and the distributed nature of the network.",
      details: [
        "🔐 Cryptographic hash functions secure each block",
        "🔗 Changing one block would require changing all subsequent blocks",
        "🌐 Majority of network nodes must agree to any changes",
        "⚡ Computational cost makes tampering prohibitive",
        "📜 Creates permanent, auditable record of all transactions"
      ]
    },
    transparent: {
      title: "Transparent",
      fullDescription: "All transactions on the Bitcoin blockchain are publicly visible and can be verified by anyone. This transparency ensures accountability while maintaining user privacy through pseudonymous addresses.",
      details: [
        "👁️ All transactions are publicly viewable on block explorers",
        "🔍 Anyone can verify transaction history and balances",
        "🏷️ Addresses are pseudonymous, not directly linked to identities",
        "📊 Network statistics and metrics are openly available",
        "🔬 Enables independent auditing and analysis"
      ]
    },
    distributed: {
      title: "Distributed",
      fullDescription: "The blockchain is replicated across thousands of nodes worldwide, ensuring no single point of failure and making the network highly resilient to attacks or technical failures.",
      details: [
        "🌍 Thousands of nodes maintain complete copies",
        "🔄 Automatic synchronization between nodes",
        "🛡️ No single point of failure or control",
        "⚡ Continues operating even if nodes go offline",
        "🌐 Global accessibility and redundancy"
      ]
    },
    chained: {
      title: "Chained Blocks",
      fullDescription: "Each block contains a cryptographic hash of the previous block, creating an unbreakable chain. This linking mechanism ensures the integrity of the entire transaction history.",
      details: [
        "🔗 Each block references the previous block's hash",
        "🧮 SHA-256 algorithm creates unique fingerprints",
        "⛓️ Forms an unbreakable chain of blocks",
        "🔍 Any tampering is immediately detectable",
        "📈 Chain grows chronologically with new blocks"
      ]
    }
  };

  const componentDetails = {
    header: {
      title: "Block Header",
      fullDescription: "The block header contains essential metadata that identifies and validates the block. It includes the previous block hash, merkle root, timestamp, difficulty target, and nonce.",
      details: [
        "🏷️ Previous block hash links to parent block",
        "🌳 Merkle root summarizes all transactions",
        "⏰ Timestamp records when block was mined",
        "🎯 Difficulty target adjusts mining complexity",
        "🎲 Nonce value used for proof-of-work"
      ]
    },
    transactions: {
      title: "Transaction Data",
      fullDescription: "The block body contains all validated transactions with their digital signatures. Each transaction includes inputs, outputs, and cryptographic proofs of ownership.",
      details: [
        "💰 Input references previous transaction outputs",
        "📤 Output specifies recipient addresses and amounts",
        "✍️ Digital signatures prove ownership",
        "🔐 Cryptographic validation ensures authenticity",
        "📊 Transaction fees incentivize miners"
      ]
    },
    hash: {
      title: "Hash Function",
      fullDescription: "SHA-256 (Secure Hash Algorithm 256-bit) creates a unique digital fingerprint for each block. Any change to the block data results in a completely different hash.",
      details: [
        "🧮 SHA-256 produces 256-bit hash output",
        "🔐 Deterministic: same input always produces same hash",
        "🌊 Avalanche effect: small changes create completely different output",
        "⚡ Computationally fast to calculate",
        "🛡️ Cryptographically secure and collision-resistant"
      ]
    },
    merkle: {
      title: "Merkle Tree",
      fullDescription: "A binary tree structure that efficiently summarizes all transactions in a block. It enables quick verification of any transaction without downloading the entire block.",
      details: [
        "🌳 Binary tree structure organizes transaction hashes",
        "⚡ Enables efficient transaction verification",
        "🔍 Can prove transaction inclusion without full block",
        "📊 Reduces storage and bandwidth requirements",
        "🔐 Maintains cryptographic security guarantees"
      ]
    }
  };

  const consensusDetails = {
    pow: {
      title: "Proof of Work",
      fullDescription: "Bitcoin's consensus mechanism where miners compete to solve cryptographic puzzles. The first to solve the puzzle gets to add the next block and receive the mining reward.",
      details: [
        "⚡ Miners compete to solve SHA-256 puzzles",
        "🏆 First to solve gets block reward and fees",
        "🔐 Requires significant computational power",
        "🌡️ Energy-intensive but highly secure",
        "📊 Difficulty adjusts every 2016 blocks"
      ]
    },
    pos: {
      title: "Proof of Stake",
      fullDescription: "Validators are chosen to create new blocks based on their stake in the network. More energy-efficient than Proof of Work but with different security trade-offs.",
      details: [
        "🏆 Validators chosen based on stake amount",
        "🌱 Much lower energy consumption",
        "💰 Staking rewards instead of mining rewards",
        "⚖️ Different security and decentralization model",
        "🔄 Slashing penalties for malicious behavior"
      ]
    },
    pox: {
      title: "Proof of Transfer",
      fullDescription: "Stacks' innovative consensus mechanism that uses Bitcoin's security. Miners transfer Bitcoin to participate in consensus, anchoring Stacks blocks to Bitcoin.",
      details: [
        "₿ Miners send Bitcoin to participate",
        "🔗 Anchors to Bitcoin's security",
        "💡 Innovative hybrid approach",
        "🌉 Enables smart contracts on Bitcoin",
        "🔄 Creates new utility for Bitcoin"
      ]
    }
  };

  const comparisonDetails = {
    traditional: {
      title: "Traditional Systems",
      fullDescription: "Conventional financial and data systems rely on centralized authorities, intermediaries, and trusted third parties. While efficient in many ways, they introduce single points of failure and require users to trust institutions.",
      details: [
        "🏦 Banks and financial institutions act as intermediaries",
        "🔒 Central control over user accounts and transactions",
        "💸 High fees for international transfers and services",
        "⏰ Limited operating hours and processing delays",
        "🚫 Possibility of account freezing or censorship",
        "📊 Opaque internal processes and decision-making",
        "🌍 Geographic restrictions and regulatory barriers",
        "🔐 Single points of failure and security vulnerabilities"
      ]
    },
    blockchain: {
      title: "Blockchain Systems",
      fullDescription: "Blockchain-based systems operate through decentralized networks where trust is established through cryptographic proofs rather than relying on trusted third parties. This creates more resilient and accessible financial infrastructure.",
      details: [
        "🌐 Decentralized network with no single point of control",
        "🔍 Transparent and verifiable transactions",
        "⚡ 24/7 operation without downtime",
        "🌍 Global accessibility regardless of location",
        "💰 Lower fees for cross-border transactions",
        "🛡️ Censorship resistance and financial sovereignty",
        "🔐 Enhanced security through cryptographic methods",
        "📈 Programmable money and smart contracts"
      ]
    },
    why: {
      title: "Why Blockchain Matters",
      fullDescription: "Blockchain technology represents a paradigm shift from trust-based systems to verification-based systems. Instead of trusting institutions, users can verify transactions independently, creating a more equitable and accessible financial system.",
      details: [
        "🌟 Democratizes access to financial services globally",
        "🔄 Eliminates need for trusted intermediaries",
        "💡 Enables innovation in financial products and services",
        "🌍 Creates borderless, permissionless financial infrastructure",
        "📱 Reduces barriers to entry for financial inclusion",
        "🔒 Provides self-custody and financial sovereignty",
        "⚡ Enables programmable and automated transactions",
        "🚀 Foundation for the next generation of internet (Web3)"
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
          <span className="title-icon">⛓️</span>
          Blockchain Technology
        </motion.h1>
        <motion.p 
          className="page-subtitle"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          The distributed ledger that powers Bitcoin
        </motion.p>
      </div>

      <div className="content-grid">
        <motion.div 
          className="content-section"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2>Digital Ledger Revolution</h2>
          <p>
            A blockchain is a distributed ledger technology that maintains a continuously 
            growing list of records (blocks) that are linked and secured using cryptography. 
            Each block contains a hash of the previous block, creating an immutable chain.
          </p>
          
          <div className="key-features">
            <h3>Key Features <span className="interactive-hint">🔍 Click for details</span></h3>
            <motion.div 
              className="feature-card clickable"
              onClick={() => setSelectedFeature('chained')}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="feature-icon">🔗</div>
              <h3>Chained Blocks</h3>
              <p>Each block cryptographically links to the previous one</p>
              <span className="click-indicator">+ Click for more details</span>
            </motion.div>
            <motion.div 
              className="feature-card clickable"
              onClick={() => setSelectedFeature('distributed')}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="feature-icon">🌐</div>
              <h3>Distributed</h3>
              <p>Replicated across thousands of nodes worldwide</p>
              <span className="click-indicator">+ Click for more details</span>
            </motion.div>
            <motion.div 
              className="feature-card clickable"
              onClick={() => setSelectedFeature('immutable')}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="feature-icon">🔒</div>
              <h3>Immutable</h3>
              <p>Once confirmed, transactions cannot be altered</p>
              <span className="click-indicator">+ Click for more details</span>
            </motion.div>
            <motion.div 
              className="feature-card clickable"
              onClick={() => setSelectedFeature('transparent')}
              whileHover={{ scale: 1.05, rotateY: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="feature-icon">👁️</div>
              <h3>Transparent</h3>
              <p>All transactions are publicly visible and verifiable</p>
              <span className="click-indicator">+ Click for more details</span>
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          className="blockchain-explanation"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3>AI-Enhanced Blockchain Visualization</h3>
          <p>
            This advanced AI-powered visualization demonstrates how Bitcoin's blockchain operates in real-time. 
            Each block contains cryptographic hashes, transaction data, and timestamps that create an immutable 
            chain of digital records. The animated network grid represents the distributed nature of the network, 
            while the flowing data connections show how information propagates through the system.
          </p>
          <div className="visualization-features">
            <div className="feature-point">
              <span className="feature-icon">🔗</span>
              <span>Real-time block chaining with cryptographic links</span>
            </div>
            <div className="feature-point">
              <span className="feature-icon">📊</span>
              <span>Live transaction counts and timestamp visualization</span>
            </div>
            <div className="feature-point">
              <span className="feature-icon">🌐</span>
              <span>Animated network grid showing distributed architecture</span>
            </div>
            <div className="feature-point">
              <span className="feature-icon">⚡</span>
              <span>Interactive hover effects revealing block details</span>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="infographic-section"
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <AIInfographic 
            type="blockchain" 
            title="Interactive Blockchain Structure" 
            animated={true}
          />
        </motion.div>
      </div>

      <motion.div 
        className="block-anatomy"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <h2>Anatomy of a Block <span className="interactive-hint">🔍 Click for details</span></h2>
        <div className="block-components">
          <motion.div 
            className="component-card clickable"
            onClick={() => setSelectedComponent('header')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="component-icon">🏷️</div>
            <h3>Block Header</h3>
            <p>Contains metadata including previous block hash, merkle root, and timestamp</p>
            <span className="click-indicator">+ Click for more details</span>
          </motion.div>
          <motion.div 
            className="component-card clickable"
            onClick={() => setSelectedComponent('transactions')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="component-icon">🔢</div>
            <h3>Transaction Data</h3>
            <p>All transactions included in this block with digital signatures</p>
            <span className="click-indicator">+ Click for more details</span>
          </motion.div>
          <motion.div 
            className="component-card clickable"
            onClick={() => setSelectedComponent('hash')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="component-icon">🧮</div>
            <h3>Hash Function</h3>
            <p>SHA-256 creates unique fingerprint for each block</p>
            <span className="click-indicator">+ Click for more details</span>
          </motion.div>
          <motion.div 
            className="component-card clickable"
            onClick={() => setSelectedComponent('merkle')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="component-icon">🌳</div>
            <h3>Merkle Tree</h3>
            <p>Efficient verification structure for all transactions</p>
            <span className="click-indicator">+ Click for more details</span>
          </motion.div>
        </div>
      </motion.div>

      <motion.div 
        className="consensus-section"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <h2>Consensus Mechanisms <span className="interactive-hint">🔍 Click for details</span></h2>
        <div className="consensus-grid">
          <motion.div 
            className="consensus-card clickable"
            onClick={() => setSelectedConsensus('pow')}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="consensus-icon">⚡</div>
            <h3>Proof of Work</h3>
            <p>Bitcoin's energy-intensive but secure consensus mechanism</p>
            <div className="consensus-stats">
              <span>Energy: High</span>
              <span>Security: Maximum</span>
            </div>
            <span className="click-indicator">+ Click for more details</span>
          </motion.div>
          <motion.div 
            className="consensus-card clickable"
            onClick={() => setSelectedConsensus('pos')}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="consensus-icon">🏆</div>
            <h3>Proof of Stake</h3>
            <p>Energy-efficient alternative used by newer blockchains</p>
            <div className="consensus-stats">
              <span>Energy: Low</span>
              <span>Security: High</span>
            </div>
            <span className="click-indicator">+ Click for more details</span>
          </motion.div>
          <motion.div 
            className="consensus-card clickable"
            onClick={() => setSelectedConsensus('pox')}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="consensus-icon">🔄</div>
            <h3>Proof of Transfer</h3>
            <p>Stacks' innovative mechanism using Bitcoin's security</p>
            <div className="consensus-stats">
              <span>Energy: Medium</span>
              <span>Innovation: High</span>
            </div>
            <span className="click-indicator">+ Click for more details</span>
          </motion.div>
        </div>
      </motion.div>

      <motion.div 
        className="blockchain-benefits"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      >
        <h2>Why Blockchain Matters <span className="interactive-hint">🔍 Click for details</span></h2>
        <div className="benefits-comparison">
          <motion.div 
            className="traditional-system clickable"
            onClick={() => setSelectedComparison('traditional')}
            whileHover={{ scale: 1.02, x: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <h3>Traditional Systems</h3>
            <ul>
              <li>❌ Central points of failure</li>
              <li>❌ Requires trust in intermediaries</li>
              <li>❌ Single entity controls data</li>
              <li>❌ Censorship possible</li>
              <li>❌ High fees for cross-border</li>
            </ul>
            <span className="click-indicator">+ Click for detailed analysis</span>
          </motion.div>
          <motion.div 
            className="blockchain-system clickable"
            onClick={() => setSelectedComparison('blockchain')}
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
          >
            <h3>Blockchain Systems</h3>
            <ul>
              <li>✅ Distributed and resilient</li>
              <li>✅ Trustless verification</li>
              <li>✅ No single point of control</li>
              <li>✅ Censorship resistant</li>
              <li>✅ Global, borderless transactions</li>
            </ul>
            <span className="click-indicator">+ Click for detailed analysis</span>
          </motion.div>
        </div>
        
        <motion.div 
          className="why-matters-card"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          <motion.div 
            className="why-card clickable"
            onClick={() => setSelectedComparison('why')}
            whileHover={{ scale: 1.03, rotateY: 2 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="why-icon">🌟</div>
            <h3>The Bigger Picture</h3>
            <p>Discover why blockchain represents a fundamental shift in how we think about trust, value, and digital infrastructure</p>
            <span className="click-indicator">+ Click to explore the revolution</span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Feature Detail Modal */}
      <AnimatePresence>
        {selectedFeature && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedFeature(null)}
          >
            <motion.div
              className="feature-modal"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>{featureDetails[selectedFeature]?.title}</h2>
                <button 
                  className="close-button"
                  onClick={() => setSelectedFeature(null)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-content">
                <p className="modal-description">
                  {featureDetails[selectedFeature]?.fullDescription}
                </p>
                <div className="modal-details-list">
                  <h3>Key Points:</h3>
                  {featureDetails[selectedFeature]?.details.map((detail, index) => (
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

      {/* Component Detail Modal */}
      <AnimatePresence>
        {selectedComponent && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedComponent(null)}
          >
            <motion.div
              className="component-modal"
              initial={{ scale: 0.5, opacity: 0, rotateX: -90 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotateX: 90 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>{componentDetails[selectedComponent]?.title}</h2>
                <button 
                  className="close-button"
                  onClick={() => setSelectedComponent(null)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-content">
                <p className="modal-description">
                  {componentDetails[selectedComponent]?.fullDescription}
                </p>
                <div className="modal-details-list">
                  <h3>Technical Details:</h3>
                  {componentDetails[selectedComponent]?.details.map((detail, index) => (
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

      {/* Consensus Detail Modal */}
      <AnimatePresence>
        {selectedConsensus && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedConsensus(null)}
          >
            <motion.div
              className="consensus-modal"
              initial={{ scale: 0.5, opacity: 0, rotateZ: -180 }}
              animate={{ scale: 1, opacity: 1, rotateZ: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotateZ: 180 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>{consensusDetails[selectedConsensus]?.title}</h2>
                <button 
                  className="close-button"
                  onClick={() => setSelectedConsensus(null)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-content">
                <p className="modal-description">
                  {consensusDetails[selectedConsensus]?.fullDescription}
                </p>
                <div className="modal-details-list">
                  <h3>How It Works:</h3>
                  {consensusDetails[selectedConsensus]?.details.map((detail, index) => (
                    <motion.div
                      key={index}
                      className="detail-item"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
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

      {/* Comparison Detail Modal */}
      <AnimatePresence>
        {selectedComparison && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedComparison(null)}
          >
            <motion.div
              className="comparison-modal"
              initial={{ scale: 0.5, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: -100 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>{comparisonDetails[selectedComparison]?.title}</h2>
                <button 
                  className="close-button"
                  onClick={() => setSelectedComparison(null)}
                >
                  ✕
                </button>
              </div>
              <div className="modal-content">
                <p className="modal-description">
                  {comparisonDetails[selectedComparison]?.fullDescription}
                </p>
                <div className="modal-details-list">
                  <h3>
                    {selectedComparison === 'traditional' ? 'Limitations:' : 
                     selectedComparison === 'blockchain' ? 'Advantages:' : 
                     'Impact Areas:'}
                  </h3>
                  {comparisonDetails[selectedComparison]?.details.map((detail, index) => (
                    <motion.div
                      key={index}
                      className="detail-item"
                      initial={{ opacity: 0, x: selectedComparison === 'traditional' ? -30 : 30 }}
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
      {/* Quiz */}
      <QuizCard
        title="Blockchain Essentials"
        questions={[
          { q: 'What ensures block immutability?', choices: ['Digital signatures','Hash linking between blocks','Large block size','High TPS'], correct: 1 },
          { q: 'What does the Merkle root summarize?', choices: ['All transactions in a block','All nodes in the network','All miners','All smart contracts'], correct: 0 },
          { q: 'PoW difficulty adjusts every?', choices: ['2016 blocks','1 block','10 blocks','210,000 blocks'], correct: 0 }
        ]}
      />

    </motion.div>
  );
};

export default BlockchainTechnology;