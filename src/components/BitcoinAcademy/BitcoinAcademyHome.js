import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageRouter from './PageRouter';
import TopicCard from './components/TopicCard';
import ProgressNavigator from './components/ProgressNavigator';
import { trackTikTokEvent } from '../../utils/tiktok';
// CSS imports moved to App.js to avoid chunk loading issues

const BitcoinAcademyHome = () => {
  const [currentPage, setCurrentPage] = useState(null);
  const [progress, setProgress] = useState(0);

  // 🎯 GOOGLE ADS CONVERSION TRACKING - BITCOIN ACADEMY PAGE
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag && !window.bitcoinAcademyTracked) {
      window.bitcoinAcademyTracked = true;
      window.gtag('event', 'conversion', {
        send_to: 'AW-952552862/jW1FCOKkrgQQnpubxgM',
        value: 1.0,
        currency: 'EUR'
      });
      console.log('🎯 Google Ads conversion tracked - Bitcoin Academy Visit');
    }
  }, []);

  // 🔙 BACK BUTTON HANDLER (Browser History Support)
  useEffect(() => {
    const handlePopState = (event) => {
      // Când userul dă back din browser/telefon, închidem modalul
      setCurrentPage(null);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const bitcoinFundamentals = [
    {
      id: 'satoshi-nakamoto',
      title: 'Satoshi Nakamoto',
      description: 'The mysterious creator of Bitcoin',
      icon: '👤',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      difficulty: 'Beginner'
    },
    {
      id: 'blockchain-technology',
      title: 'Blockchain Technology',
      description: 'Distributed ledger fundamentals',
      icon: '⛓️',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      difficulty: 'Beginner'
    },
    {
      id: 'proof-of-work',
      title: 'Proof of Work',
      description: 'Mining and network security',
      icon: '⚡',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      difficulty: 'Intermediate'
    },
    {
      id: 'bitcoin-mining',
      title: 'Bitcoin Mining',
      description: 'How new bitcoins are created',
      icon: '⛏️',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      difficulty: 'Intermediate'
    },
    {
      id: 'bitcoin-halving',
      title: 'Bitcoin Halving',
      description: 'Supply reduction mechanism',
      icon: '📉',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      difficulty: 'Intermediate'
    },
    {
      id: 'lightning-network',
      title: 'Lightning Network',
      description: 'Instant Bitcoin payments',
      icon: '⚡',
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      difficulty: 'Advanced'
    }
  ];

  const bitcoinStacksTopics = [
    {
      id: 'proof-of-transfer',
      title: 'Proof of Transfer',
      description: 'PoX consensus mechanism',
      icon: '🔄',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      difficulty: 'Intermediate'
    },
    {
      id: 'sip-010-tokens',
      title: 'SIP-010 Tokens',
      description: 'Stacks token standard',
      icon: '🪙',
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      difficulty: 'Intermediate'
    },
    {
      id: 'sbtc-xbtc',
      title: 'sBTC & xBTC',
      description: 'Bitcoin on Stacks ecosystem',
      icon: '₿',
      gradient: 'linear-gradient(135deg, #e0c3fc 0%, #9bb5ff 100%)',
      difficulty: 'Advanced'
    },
    {
      id: 'defi-on-bitcoin',
      title: 'DeFi on Bitcoin',
      description: 'Decentralized finance via Stacks',
      icon: '🏦',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      difficulty: 'Advanced'
    }
  ];

  const dexLiquidityTopics = [
    {
      id: 'what-is-dex',
      title: 'What is a DEX?',
      description: 'Decentralized exchange fundamentals',
      icon: '🔄',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      difficulty: 'Beginner'
    },
    {
      id: 'amm-explained',
      title: 'Automated Market Makers',
      description: 'How AMMs power DEXs',
      icon: '🤖',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      difficulty: 'Intermediate'
    },
    {
      id: 'ai-pool-optimization',
      title: 'AI Pool Optimization',
      description: 'AI-powered liquidity management',
      icon: '🧠',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      difficulty: 'Advanced'
    },
    {
      id: 'cross-chain-swaps',
      title: 'Cross-Chain Swaps',
      description: 'Trading across blockchains',
      icon: '🌉',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      difficulty: 'Advanced'
    }
  ];

  const aiDefiTopics = [
    {
      id: 'ai-price-prediction',
      title: 'AI Price Prediction',
      description: 'Machine learning for market analysis',
      icon: '📈',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      difficulty: 'Advanced'
    },
    {
      id: 'liquidity-ai',
      title: 'Liquidity Management AI',
      description: 'Automated liquidity strategies',
      icon: '💧',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      difficulty: 'Advanced'
    },
    {
      id: 'sentiment-analysis',
      title: 'Sentiment Analysis',
      description: 'AI-driven market sentiment',
      icon: '🎭',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      difficulty: 'Advanced'
    }
  ];

  const securityTopics = [
    {
      id: 'hardware-wallets',
      title: 'Hardware Wallets',
      description: 'Cold storage security',
      icon: '🔐',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      difficulty: 'Intermediate'
    },
    {
      id: 'ai-fraud-detection',
      title: 'AI Fraud Detection',
      description: 'AI-powered security systems',
      icon: '🛡️',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      difficulty: 'Advanced'
    }
  ];

  const futureTopics = [
    {
      id: 'bitcoin-ordinals',
      title: 'Bitcoin Ordinals',
      description: 'NFTs on Bitcoin blockchain',
      icon: '🎨',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      difficulty: 'Advanced'
    },
    {
      id: 'bitcoin-daos',
      title: 'Bitcoin DAOs',
      description: 'Decentralized governance',
      icon: '🏛️',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      difficulty: 'Advanced'
    },
    {
      id: 'layer2-solutions',
      title: 'Layer 2 Solutions',
      description: 'Scaling Bitcoin ecosystem',
      icon: '🚀',
      gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      difficulty: 'Advanced'
    },
    {
      id: 'halving-effects',
      title: 'Halving Effects',
      description: 'Economic impact analysis',
      icon: '📊',
      gradient: 'linear-gradient(135deg, #e0c3fc 0%, #9bb5ff 100%)',
      difficulty: 'Advanced'
    },
    {
      id: 'ai-governance',
      title: 'AI Governance',
      description: 'AI in DeFi governance',
      icon: '🤖',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      difficulty: 'Expert'
    }
  ];

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  };

  const allTopics = [
    ...bitcoinFundamentals,
    ...bitcoinStacksTopics,
    ...dexLiquidityTopics,
    ...aiDefiTopics,
    ...securityTopics,
    ...futureTopics
  ];

  const handleTopicSelect = (topicId) => {
    // Push state to history for back button support
    window.history.pushState({ modalOpen: true }, '', window.location.pathname);
    setCurrentPage(topicId);
    setProgress(prev => Math.min(prev + 1, allTopics.length));
    // Scroll to top when selecting a topic
    setTimeout(scrollToTop, 100);
  };

  const handleBackToHome = () => {
    if (window.history.state?.modalOpen) {
      window.history.back();
    } else {
      setCurrentPage(null);
    }
  };

  // Scroll to top whenever currentPage changes
  useEffect(() => {
    if (currentPage !== null) {
      scrollToTop();
    }
  }, [currentPage]);

  if (currentPage) {
    return (
      <div className="active-topic-container" style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        zIndex: 999999, 
        background: '#050508', 
        overflowY: 'auto',
        paddingTop: '0',
        animation: 'fadeIn 0.3s ease'
      }}>
        {/* Floating Close Button */}
        <button 
            onClick={handleBackToHome}
            className="academy-close-btn"
            aria-label="Close topic"
            style={{
              position: 'fixed',
              top: '20px', /* MUTAT SUS PENTRU FULLSCREEN */
              right: '20px',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(10, 10, 20, 0.8)',
              border: '1px solid rgba(255, 80, 80, 0.5)',
              color: '#ff5050',
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000000, /* Z-Index MAXIM */
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.background = 'rgba(255, 80, 80, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = 'rgba(10, 10, 20, 0.8)';
            }}
        >
            ✕
        </button>

        <PageRouter 
          currentPage={currentPage} 
          onBack={handleBackToHome}
          onNext={(nextPage) => setCurrentPage(nextPage)}
        />
      </div>
    );
  }

  return (
    <motion.div 
      className="bitcoin-academy-home"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div className="academy-header">
        <motion.div 
          className="academy-title"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1>
            <span className="bitcoin-icon">₿</span>
            Bitcoin Academy
            <span className="ai-badge">AI</span>
          </h1>
          <p>Master Bitcoin & Stacks with AI-powered visual learning. Join our Telegram for daily micro-lessons.</p>
        </motion.div>

        <ProgressNavigator 
          current={progress} 
          total={allTopics.length} 
        />
      </div>

      {/* AI Landing CTA */}
      <motion.section
        className="topic-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        <div className="reward-summary-banner">
          Learn faster with AI: track progress, test yourself, and get curated tips. 
          <a href="https://t.me/BitSwapDEX_AI" target="_blank" rel="noreferrer" style={{marginLeft:8, fontWeight:800}} onClick={() => { trackTikTokEvent('CompleteRegistration', { content_name: 'Telegram Join', method: 'bitcoin_academy' }, { retry: true }); }}>Join Telegram →</a>
          <span style={{margin: '0 8px'}}>•</span>
          <a href="#resume" onClick={(e)=>{ e.preventDefault(); try { if (window.gtag) { window.gtag('event', 'education_resume_learning', { source: 'academy_banner' }); } if (window.ttq && window.ttq.track) { window.ttq.track('ViewContent', { content_name: 'Resume learning' }); } } catch {} window.scrollTo({top:0, behavior:'smooth'}); }} style={{fontWeight:700}}>Resume where you left off →</a>
        </div>
      </motion.section>

      {/* Bitcoin Fundamentals Section */}
      <motion.section 
        className="topic-section"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h2 className="section-title">
          <span className="section-icon">₿</span>
          Bitcoin Fundamentals
        </h2>
        <div className="topics-grid">
          {bitcoinFundamentals.map((topic, index) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onClick={() => handleTopicSelect(topic.id)}
              delay={index * 0.1}
            />
          ))}
        </div>
      </motion.section>

      {/* Bitcoin + Stacks Section */}
      <motion.section 
        className="topic-section"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <h2 className="section-title">
          <span className="section-icon">🏗️</span>
          Bitcoin + Stacks
        </h2>
        <div className="topics-grid">
          {bitcoinStacksTopics.map((topic, index) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onClick={() => handleTopicSelect(topic.id)}
              delay={index * 0.1 + 0.4}
            />
          ))}
        </div>
      </motion.section>

      {/* DEX & Liquidity Section */}
      <motion.section 
        className="topic-section"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <h2 className="section-title">
          <span className="section-icon">🔄</span>
          DEX & Liquidity
        </h2>
        <div className="topics-grid">
          {dexLiquidityTopics.map((topic, index) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onClick={() => handleTopicSelect(topic.id)}
              delay={index * 0.1 + 0.6}
            />
          ))}
        </div>
      </motion.section>

      {/* AI in DeFi Section */}
      <motion.section 
        className="topic-section"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <h2 className="section-title">
          <span className="section-icon">🤖</span>
          AI in DeFi
        </h2>
        <div className="topics-grid">
          {aiDefiTopics.map((topic, index) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onClick={() => handleTopicSelect(topic.id)}
              delay={index * 0.1 + 0.8}
            />
          ))}
        </div>
      </motion.section>

      {/* Security & Custody Section */}
      <motion.section 
        className="topic-section"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      >
        <h2 className="section-title">
          <span className="section-icon">🔐</span>
          Security & Custody
        </h2>
        <div className="topics-grid">
          {securityTopics.map((topic, index) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onClick={() => handleTopicSelect(topic.id)}
              delay={index * 0.1 + 1.0}
            />
          ))}
        </div>
      </motion.section>

      {/* Future of Bitcoin & DeFi Section */}
      <motion.section 
        className="topic-section"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <h2 className="section-title">
          <span className="section-icon">🚀</span>
          Future of Bitcoin & DeFi
        </h2>
        <div className="topics-grid">
          {futureTopics.map((topic, index) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onClick={() => handleTopicSelect(topic.id)}
              delay={index * 0.1 + 1.2}
            />
          ))}
        </div>
      </motion.section>

      {/* Footer Info */}
      <motion.div 
        className="academy-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <div className="footer-stats">
          <div className="stat">
            <span className="stat-number">{allTopics.length}</span>
            <span className="stat-label">Learning Modules</span>
          </div>
          <div className="stat">
            <span className="stat-number">6</span>
            <span className="stat-label">Categories</span>
          </div>
          <div className="stat">
            <span className="stat-number">AI</span>
            <span className="stat-label">Powered Education</span>
          </div>
          <div className="stat">
            <span className="stat-number">100%</span>
            <span className="stat-label">Visual Learning</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BitcoinAcademyHome;