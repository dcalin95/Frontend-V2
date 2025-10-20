import React from 'react';
import { motion } from 'framer-motion';

const ProgressNavigator = ({ current, total }) => {
  const percentage = (current / total) * 100;

  return (
    <div className="progress-navigator">
      <div className="progress-info">
        <span className="progress-text">Learning Progress</span>
        <span className="progress-stats">{current}/{total} modules</span>
      </div>
      
      <div className="progress-bar-container">
        <div className="progress-bar-bg">
          <motion.div 
            className="progress-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <div className="progress-glow"></div>
        </div>
        <span className="progress-percentage">{Math.round(percentage)}%</span>
      </div>

      {/* Achievement badges */}
      <div className="achievement-badges">
        {percentage >= 25 && (
          <motion.div 
            className="badge bronze"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            🥉
          </motion.div>
        )}
        {percentage >= 50 && (
          <motion.div 
            className="badge silver"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            🥈
          </motion.div>
        )}
        {percentage >= 75 && (
          <motion.div 
            className="badge gold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            🥇
          </motion.div>
        )}
        {percentage === 100 && (
          <motion.div 
            className="badge master"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            🏆
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProgressNavigator;