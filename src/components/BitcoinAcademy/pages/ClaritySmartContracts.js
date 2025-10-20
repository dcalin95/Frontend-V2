import React from 'react';
import { motion } from 'framer-motion';

const ClaritySmartContracts = () => {
  return (
    <motion.div className="educational-page">
      <div className="page-header">
        <h1 className="page-title">
          <span className="title-icon">📄</span>
          Clarity Smart Contracts
        </h1>
        <p className="page-subtitle">Secure and predictable smart contracts</p>
      </div>

      <div className="content-grid">
        <div className="content-section">
          <h2>Decidable & Secure</h2>
          <p>
            Clarity is a smart contract programming language designed for 
            predictability and security. Unlike other languages, Clarity is 
            interpreted and decidable, making it safer for high-value applications.
          </p>
          
          <div className="clarity-features">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Decidable</h3>
              <p>Know if code will halt before execution</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📖</div>
              <h3>Readable</h3>
              <p>Human-readable code structure</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Secure</h3>
              <p>No reentrancy attacks possible</p>
            </div>
          </div>

          <div className="code-example">
            <h3>Sample Clarity Code</h3>
            <pre className="clarity-code">
{`(define-public (transfer (amount uint) (recipient principal))
  (begin
    (asserts! (>= (stx-get-balance tx-sender) amount) 
              (err u1))
    (stx-transfer? amount tx-sender recipient)))`}
            </pre>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ClaritySmartContracts;