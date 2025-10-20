import React from 'react';
import { motion } from 'framer-motion';
import AIInfographic from '../components/AIInfographic';
import MiningProcessCard from './MiningProcessCard';
import ProofOfWorkCard from './ProofOfWorkCard';

const ProofOfWork = () => {
  return (
    <motion.div className="educational-page">
      <div className="page-header">
        <h1 className="page-title text-2xl sm:text-3xl lg:text-4xl">
          <span className="title-icon">⚡</span>
          Proof of Work
        </h1>
        <p className="page-subtitle text-sm sm:text-base lg:text-lg">Bitcoin's consensus mechanism</p>
      </div>

      {/* AI-styled presentation card */}
      <div className="mb-6 sm:mb-8 lg:mb-12">
        <ProofOfWorkCard />
      </div>

      <div className="content-grid grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 mt-8 sm:mt-12 lg:mt-16">
        <div className="content-section order-2 xl:order-1">
          <h2 className="text-xl sm:text-2xl lg:text-3xl mb-4 sm:mb-6">Mining & Network Security</h2>
          <p className="text-sm sm:text-base lg:text-lg leading-relaxed mb-6 sm:mb-8">
            Proof of Work is Bitcoin's consensus mechanism where miners compete 
            to solve computational puzzles. This process secures the network 
            and validates transactions.
          </p>
          
          <div className="pow-stats grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-3 gap-4 sm:gap-6">
            <motion.div 
              className="pow-card clickable"
              whileHover={{ scale: 1.05, y: -6 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="pow-icon text-2xl sm:text-3xl">⚙️</div>
              <h3 className="text-base sm:text-lg lg:text-xl">Hash Rate</h3>
              <p className="text-xs sm:text-sm lg:text-base">Network computational power</p>
            </motion.div>
            <motion.div 
              className="pow-card clickable"
              whileHover={{ scale: 1.05, y: -6 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="pow-icon text-2xl sm:text-3xl">🏆</div>
              <h3 className="text-base sm:text-lg lg:text-xl">Block Reward</h3>
              <p className="text-xs sm:text-sm lg:text-base">6.25 BTC (current)</p>
            </motion.div>
            <motion.div 
              className="pow-card clickable"
              whileHover={{ scale: 1.05, y: -6 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="pow-icon text-2xl sm:text-3xl">⏰</div>
              <h3 className="text-base sm:text-lg lg:text-xl">Difficulty</h3>
              <p className="text-xs sm:text-sm lg:text-base">Adjusts every 2016 blocks</p>
            </motion.div>
          </div>
        </div>

        <div className="infographic-section order-1 xl:order-2">
          <MiningProcessCard />
        </div>
      </div>
    </motion.div>
  );
};

export default ProofOfWork;