import React from 'react';
import { motion } from 'framer-motion';
import AIInfographic from '../components/AIInfographic';

const HowBitcoinWorks = () => {
  return (
    <motion.div className="educational-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">⛓️</span>
          How Bitcoin Works
        </h1>
        <p className="page-subtitle">Understanding blockchain technology</p>
      </div>

      <div className="content-grid">
        <div className="content-section">
          <h2>The Blockchain Foundation</h2>
          <p>
            Bitcoin operates on a blockchain - a distributed ledger that records all 
            transactions across a network of computers. Each block contains multiple 
            transactions and is cryptographically linked to the previous block.
          </p>
          
          <div className="process-steps">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Transaction Created</h3>
              <p>User initiates a Bitcoin transfer</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Network Verification</h3>
              <p>Network nodes verify the transaction</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Block Mining</h3>
              <p>Miners compete to add the block</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <h3>Confirmation</h3>
              <p>Transaction becomes permanent</p>
            </div>
          </div>
        </div>

        <div className="infographic-section">
          <AIInfographic 
            type="blockchain" 
            title="Blockchain Structure" 
            animated={true}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default HowBitcoinWorks;