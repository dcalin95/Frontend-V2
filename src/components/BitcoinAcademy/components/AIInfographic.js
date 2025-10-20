import React from 'react';
import { motion } from 'framer-motion';

const AIInfographic = ({ type, title, animated = true }) => {
  const renderBlockchain = () => {
    const blocks = [
      { id: 1, hash: 'a7f8d9e2', prev: '00000000', txCount: 3, time: '10:15:23' },
      { id: 2, hash: 'b4c7f1a8', prev: 'a7f8d9e2', txCount: 5, time: '10:25:45' },
      { id: 3, hash: 'c9e2b8f4', prev: 'b4c7f1a8', txCount: 2, time: '10:35:12' },
      { id: 4, hash: 'd1a8c7e9', prev: 'c9e2b8f4', txCount: 4, time: '10:45:33' }
    ];

    return (
      <>
        <motion.div 
          className="network-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ duration: 2 }}
        >
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="grid-dot"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1, 0] }}
              transition={{ 
                duration: 2, 
                delay: Math.random() * 2, 
                repeat: Infinity,
                repeatDelay: Math.random() * 3
              }}
            />
          ))}
        </motion.div>

        <div className="blockchain-chain-ai">
            {blocks.map((block, index) => (
              <motion.div 
                key={block.id}
                className="ai-block"
                initial={{ opacity: 0, y: 50, rotateX: -90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.8, delay: index * 0.3 }}
                whileHover={{ scale: 1.05, rotateY: 5 }}
              >
                <div className="block-glow"></div>
                
                <div className="block-header-ai">
                  <div className="block-number">#{block.id}</div>
                  <div className="block-time">{block.time}</div>
                </div>

                <div className="block-data">
                  <motion.div 
                    className="data-stream"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="data-line"></div>
                    <div className="data-line"></div>
                    <div className="data-line short"></div>
                  </motion.div>
                  <div className="tx-count">{block.txCount} TX</div>
                </div>

                <div className="block-hash-section">
                  <div className="hash-label">Hash</div>
                  <div className="hash-value">{block.hash}</div>
                </div>

                <div className="prev-hash-section">
                  <div className="prev-label">Prev</div>
                  <div className="prev-value">{block.prev}</div>
                </div>

                {index < blocks.length - 1 && (
                  <motion.div 
                    className="chain-connector"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5, delay: (index + 1) * 0.3 }}
                  >
                    <motion.div 
                      className="data-flow"
                      animate={{ x: [0, 100, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div className="connector-arrow">⟶</div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="network-info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.5 }}
          >
            <div className="info-item">
              <span className="info-icon">🌐</span>
              <span>Global Network</span>
            </div>
            <div className="info-item">
              <span className="info-icon">🔐</span>
              <span>Cryptographically Secured</span>
            </div>
            <div className="info-item">
              <span className="info-icon">⚡</span>
              <span>Real-time Validation</span>
            </div>
          </motion.div>
      </>
    );
  };

  const renderMining = () => (
    <div className="infographic mining">
      <div className="mining-setup">
        <motion.div 
          className="miner"
          animate={animated ? { rotate: [0, 360] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          ⚙️
        </motion.div>
        <div className="mining-arrows">
          {[1, 2, 3].map((arrow, index) => (
            <motion.div 
              key={arrow}
              className="hash-arrow"
              initial={{ opacity: 0.3 }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, delay: index * 0.3, repeat: Infinity }}
            >
              💻→🧮
            </motion.div>
          ))}
        </div>
        <motion.div 
          className="new-block"
          animate={animated ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          📦 New Block
        </motion.div>
      </div>
    </div>
  );

  const renderLightning = () => (
    <div className="infographic lightning">
      <div className="lightning-network">
        <div className="node-grid">
          {['Alice', 'Bob', 'Carol', 'Dave'].map((node, index) => (
            <motion.div 
              key={node}
              className="lightning-node"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="node-icon">👤</div>
              <div className="node-name">{node}</div>
            </motion.div>
          ))}
        </div>
        <svg className="channel-lines" viewBox="0 0 400 300">
          <motion.path
            d="M50,100 Q200,50 350,100"
            stroke="#FFD700"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
          />
          <motion.path
            d="M50,200 Q200,150 350,200"
            stroke="#FFD700"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.7 }}
          />
        </svg>
      </div>
    </div>
  );

  const renderStacks = () => (
    <div className="infographic stacks">
      <div className="stacks-layers">
        <motion.div 
          className="layer bitcoin-layer"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="layer-icon">₿</div>
          <div className="layer-name">Bitcoin Layer</div>
          <div className="layer-desc">Security & Settlement</div>
        </motion.div>
        
        <motion.div 
          className="connection-arrow"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          ⬆️
        </motion.div>
        
        <motion.div 
          className="layer stacks-layer"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="layer-icon">🏗️</div>
          <div className="layer-name">Stacks Layer</div>
          <div className="layer-desc">Smart Contracts & DApps</div>
        </motion.div>
      </div>
    </div>
  );

  const renderPoX = () => (
    <div className="infographic pox">
      <div className="pox-cycle">
        <motion.div 
          className="pox-center"
          animate={animated ? { rotate: 360 } : {}}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          <div className="cycle-title">PoX Cycle</div>
        </motion.div>
        
        {['Prepare', 'Reward', 'Stack', 'Vote'].map((phase, index) => (
          <motion.div 
            key={phase}
            className={`pox-phase phase-${index}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            style={{
              transform: `rotate(${index * 90}deg) translateY(-100px)`,
            }}
          >
            <div className="phase-content" style={{ transform: `rotate(${-index * 90}deg)` }}>
              <div className="phase-number">{index + 1}</div>
              <div className="phase-name">{phase}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderInfographic = () => {
    switch (type) {
      case 'blockchain': return renderBlockchain();
      case 'mining': return renderMining();
      case 'lightning': return renderLightning();
      case 'stacks': return renderStacks();
      case 'pox': return renderPoX();
      default: return <div>Infographic not found</div>;
    }
  };

  return (
    <motion.div 
      className="ai-infographic"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h3 className="infographic-title">{title}</h3>
      <div className="infographic-content">
        {renderInfographic()}
      </div>
    </motion.div>
  );
};

export default AIInfographic;