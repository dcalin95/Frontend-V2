import React from 'react';
import { motion } from 'framer-motion';

const SectionLayout = ({ 
  children, 
  onBack, 
  onNext, 
  onPrev, 
  progress, 
  pageTitle 
}) => {
  return (
    <div className="section-layout">
      {/* Header with navigation */}
      <motion.header 
        className="section-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="header-left">
          <motion.button 
            className="back-button"
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Back to Academy
          </motion.button>
          <div className="breadcrumb">
            <span>Bitcoin Academy</span>
            <span className="separator">/</span>
            <span className="current-page">{pageTitle}</span>
          </div>
        </div>

        <div className="header-right">
          <div className="progress-indicator">
            <span className="progress-text">{Math.round(progress)}% Complete</span>
            <div className="mini-progress-bar">
              <motion.div 
                className="mini-progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="section-content">
        {children}
      </main>

      {/* Footer with navigation */}
      <motion.footer 
        className="section-footer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="footer-navigation">
          {onPrev && (
            <motion.button 
              className="nav-button prev"
              onClick={onPrev}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              ← Previous
            </motion.button>
          )}
          
          <div className="nav-spacer"></div>
          
          {onNext && (
            <motion.button 
              className="nav-button next"
              onClick={onNext}
              whileHover={{ scale: 1.05, x: 2 }}
              whileTap={{ scale: 0.95 }}
            >
              Next →
            </motion.button>
          )}
        </div>

        <div className="footer-info">
          <span className="powered-by">
            Powered by <span className="ai-text">AI</span> • Bitcoin Academy
          </span>
        </div>
      </motion.footer>
    </div>
  );
};

export default SectionLayout;