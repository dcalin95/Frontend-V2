import React, { useState, useEffect } from 'react';
import useGoogleAnalytics from '../hooks/useGoogleAnalytics';
import { Link } from 'react-router-dom';
// import { useWalletOptimization } from '../utils/walletBrowserDetection'; // DISABLED - causing issues in wallet browsers
import './EducationPageModern.css';
import LaserOrbit from './Education/LaserOrbit';
import './Education/LaserOrbit.css';
import MiniQuizGPT from './Education/MiniQuizGPT';

const EducationPageModern = () => {
  const { trackEducationEvent, trackPageView } = useGoogleAnalytics();
  const [activeSection, setActiveSection] = useState('hero');
  const [animationPhase, setAnimationPhase] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  const [activeTooltip, setActiveTooltip] = useState(null);

  // 🎯 GOOGLE ADS CONVERSION TRACKING - EDUCATION PAGE
  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag && !window.educationPageTracked) {
      window.educationPageTracked = true;
      window.gtag('event', 'conversion', {
        send_to: 'AW-952552862/jW1FCOKkrgQQnpubxgM',
        value: 1.0,
        currency: 'EUR'
      });
      console.log('🎯 Google Ads conversion tracked - Education Page Visit');
    }
  }, []);

  // 📊 Analytics: page view + education view
  useEffect(() => {
    try {
      trackPageView('Education', { section: 'education' });
      trackEducationEvent('view', { category: 'education' });
    } catch (_) {}
  }, [trackPageView, trackEducationEvent]);
  const [bitcoinPrice, setBitcoinPrice] = useState({
    price: 67542.31,
    change: 2.34,
    loading: true
  });

  // Bitcoin financial data state
  const [bitcoinData, setBitcoinData] = useState({
    marketCap: 1340000000000,
    volume24h: 28500000000,
    circulatingSupply: 19800000,
    maxSupply: 21000000,
    dominance: 54.2,
    rank: 1,
    ath: 73738,
    atl: 67.81,
    loading: true
  });

  // Countdown Timer State
  const [timeLeft, setTimeLeft] = useState({
    days: 7,
    hours: 12,
    minutes: 45,
    seconds: 30
  });

  // Chart timeframe state
  const [selectedTimeframe, setSelectedTimeframe] = useState('1H');

  // Different candlestick patterns for different timeframes
  const getCandlePatterns = (timeframe) => {
    const patterns = {
      '1H': [
        { x: 60, high: 80, low: 140, open: 100, close: 130, type: 'bullish' },
        { x: 100, high: 70, low: 120, open: 85, close: 110, type: 'bearish' },
        { x: 140, high: 60, low: 110, open: 75, close: 105, type: 'bullish' },
        { x: 180, high: 45, low: 95, open: 60, close: 88, type: 'bullish' },
        { x: 220, high: 55, low: 90, open: 65, close: 85, type: 'bearish' },
        { x: 260, high: 40, low: 85, open: 50, close: 80, type: 'bullish' },
        { x: 300, high: 35, low: 80, open: 45, close: 75, type: 'bullish' },
      ],
      '4H': [
        { x: 60, high: 90, low: 130, open: 110, close: 120, type: 'bullish' },
        { x: 100, high: 80, low: 110, open: 95, close: 105, type: 'bullish' },
        { x: 140, high: 70, low: 100, open: 85, close: 90, type: 'bearish' },
        { x: 180, high: 60, low: 90, open: 75, close: 85, type: 'bullish' },
        { x: 220, high: 50, low: 80, open: 65, close: 75, type: 'bullish' },
        { x: 260, high: 45, low: 75, open: 55, close: 70, type: 'bullish' },
        { x: 300, high: 40, low: 70, open: 50, close: 65, type: 'bullish' },
      ],
      '1D': [
        { x: 60, high: 120, low: 160, open: 140, close: 130, type: 'bearish' },
        { x: 100, high: 100, low: 140, open: 120, close: 110, type: 'bearish' },
        { x: 140, high: 80, low: 120, open: 100, close: 90, type: 'bearish' },
        { x: 180, high: 70, low: 100, open: 85, close: 80, type: 'bearish' },
        { x: 220, high: 60, low: 90, open: 75, close: 70, type: 'bearish' },
        { x: 260, high: 50, low: 80, open: 65, close: 60, type: 'bearish' },
        { x: 300, high: 45, low: 75, open: 60, close: 55, type: 'bearish' },
      ],
      '1W': [
        { x: 60, high: 110, low: 150, open: 130, close: 120, type: 'bearish' },
        { x: 100, high: 90, low: 130, open: 110, close: 100, type: 'bearish' },
        { x: 140, high: 70, low: 110, open: 90, close: 80, type: 'bearish' },
        { x: 180, high: 60, low: 90, open: 75, close: 70, type: 'bearish' },
        { x: 220, high: 50, low: 80, open: 65, close: 60, type: 'bearish' },
        { x: 260, high: 40, low: 70, open: 55, close: 50, type: 'bearish' },
        { x: 300, high: 35, low: 65, open: 50, close: 45, type: 'bearish' },
      ]
    };
    return patterns[timeframe] || patterns['1H'];
  };

  const handleTimeframeChange = (timeframe) => {
    setSelectedTimeframe(timeframe);
  };
  
  // Wallet browser optimization - DISABLED to fix wallet browser issues
  // const walletInfo = useWalletOptimization() || { isWalletBrowser: false };

  const educationSteps = [
    "🧠 Analyzing blockchain fundamentals...",
    "🔗 Processing decentralization concepts...",
    "💡 Generating educational insights...", 
    "✨ Ready to learn!"
  ];

  const tooltipContent = {
    'expert-curriculum': {
      title: '🎓 Expert-Designed Curriculum',
      content: 'Our educational content is crafted by blockchain experts, financial analysts, and AI specialists. Each module is designed to build comprehensive understanding from basic concepts to advanced applications, following industry best practices and academic standards.'
    },
    'ai-learning': {
      title: '🤖 AI-Powered Learning',
      content: 'Personalized educational experience powered by advanced AI algorithms. The system adapts to your learning pace, identifies knowledge gaps, and provides customized explanations and examples tailored to your background and goals.'
    },
    'certification': {
      title: '🏆 Industry Certification',
      content: 'Earn recognized certificates upon completion of educational modules. Our certification program is designed to validate your understanding of blockchain technology, DeFi concepts, and responsible financial education principles.'
    },
    'community': {
      title: '🌍 Global Learning Community',
      content: 'Join thousands of learners worldwide in our educational community. Access discussion forums, study groups, peer learning sessions, and expert-led workshops. Connect with like-minded individuals on their educational journey.'
    }
  };

  useEffect(() => {
    // Standard animation frequency (wallet optimization disabled)
    const intervalTime = 2500;
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % educationSteps.length);
    }, intervalTime);
    return () => clearInterval(interval);
  }, []);

  // Fetch Bitcoin price from CoinGecko API
  useEffect(() => {
    const fetchBitcoinData = async () => {
      try {
        // Fetch comprehensive Bitcoin data from CoinGecko
        const response = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false');
        const data = await response.json();
        
        if (data.market_data) {
          setBitcoinPrice({
            price: data.market_data.current_price.usd,
            change: data.market_data.price_change_percentage_24h || 0,
            loading: false
          });
          
          setBitcoinData({
            marketCap: data.market_data.market_cap.usd,
            volume24h: data.market_data.total_volume.usd,
            circulatingSupply: data.market_data.circulating_supply,
            maxSupply: data.market_data.max_supply,
            dominance: data.market_data.market_cap_rank === 1 ? 54.2 : 0,
            rank: data.market_data.market_cap_rank,
            ath: data.market_data.ath.usd,
            atl: data.market_data.atl.usd,
            loading: false
          });
        }
      } catch (error) {
        console.log('Failed to fetch Bitcoin data, using fallback');
        setBitcoinPrice(prev => ({ ...prev, loading: false }));
        setBitcoinData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchBitcoinData();
    
    // Update data every 30 seconds
    const dataInterval = setInterval(fetchBitcoinData, 30000);
    
    return () => clearInterval(dataInterval);
  }, []);

  // Dynamic Countdown Timer - resets when reaches zero
  useEffect(() => {
    const countdown = setInterval(() => {
      setTimeLeft(prevTime => {
        const { days, hours, minutes, seconds } = prevTime;
        
        // If all values are 0, reset to initial countdown
        if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) {
          return {
            days: 7,
            hours: 12,
            minutes: 45,
            seconds: 30
          };
        }
        
        // Count down logic
        if (seconds > 0) {
          return { ...prevTime, seconds: seconds - 1 };
        } else if (minutes > 0) {
          return { ...prevTime, minutes: minutes - 1, seconds: 59 };
        } else if (hours > 0) {
          return { ...prevTime, hours: hours - 1, minutes: 59, seconds: 59 };
        } else if (days > 0) {
          return { ...prevTime, days: days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        
        return prevTime;
      });
    }, 1000);
    
    return () => clearInterval(countdown);
  }, []);

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(prev => ({
            ...prev,
            [entry.target.id]: entry.isIntersecting
          }));
        });
      },
      { threshold: 0.2 }
    );

    const sections = document.querySelectorAll('[data-animate]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="education-modern">
      {/* AI Hero Section */}
      <section className="ai-hero-section" id="hero" data-animate>
        <div className="ai-hero-background">
          <div className="neural-network-bg">
            <div className="neural-node node-1"></div>
            <div className="neural-node node-2"></div>
            <div className="neural-node node-3"></div>
            <div className="neural-node node-4"></div>
            <div className="neural-connection conn-1"></div>
            <div className="neural-connection conn-2"></div>
            <div className="neural-connection conn-3"></div>
          </div>
        </div>
        
        <div className="ai-hero-content">
          <div className="ai-status-bar">
            <div className="ai-indicator active"></div>
            <span>{educationSteps[animationPhase]}</span>
          </div>
          
          <h1 className="ai-hero-title">
            <span className="ai-gradient-text">Learn About</span>
            <span className="ai-highlight-text">Decentralized Financial Technologies</span>
          </h1>
          
          <p className="ai-hero-subtitle">
            BitSwapDEX AI is an educational platform dedicated to exploring Web3 technologies, 
            decentralized financial innovation, and how artificial intelligence contributes to 
            better decision-making in the blockchain space. Educational content only - no investment advice.
          </p>
          
          <div className="ai-hero-features">
            <div className="ai-feature">
              <span className="ai-feature-icon">🤖</span>
              <span>AI-Guided Learning</span>
            </div>
            <div className="ai-feature">
              <span className="ai-feature-icon">🔒</span>
              <span>Security First</span>
            </div>
            <div className="ai-feature">
              <span className="ai-feature-icon">🌍</span>
              <span>Global Standards</span>
            </div>
          </div>
          
          <div className="ai-hero-cta">
            <Link to="/bitcoin-academy" className="ai-cta-button primary">
              <span className="ai-cta-text">Start Learning Journey</span>
              <span className="ai-cta-arrow">→</span>
            </Link>
            <button className="ai-cta-button secondary" onClick={() => document.getElementById('bitcoin-section').scrollIntoView({ behavior: 'smooth' })}>
              <span className="ai-cta-text">Explore Fundamentals</span>
              <span className="ai-cta-icon">📚</span>
            </button>
            {/* Continue Studies shortcut */}
            <Link to="/bitcoin-academy" className="ai-cta-button secondary" onClick={() => {
              try {
                if (window.gtag) {
                  window.gtag('event', 'education_continue_bitcoin_academy', { source: 'education_hero' });
                }
                if (window.ttq && window.ttq.track) {
                  window.ttq.track('ViewContent', { content_name: 'Continue to Bitcoin Academy', source: 'education_hero' });
                }
              } catch {}
            }}>
              <span className="ai-cta-text">Continue your studies</span>
              <span className="ai-cta-icon">🎓</span>
            </Link>
          </div>

          {/* LaserOrbit moved to hero for immediate visibility */}
          <div className="ai-hero-laser">
            <LaserOrbit centerLabel="₿" variant="ecosystem" />
          </div>
          
          {/* Social Proof Stats */}
          <div className="social-proof-stats">
            <div className="stat-item">
              <div className="stat-number">25,000+</div>
              <div className="stat-label">Active Learners</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">98%</div>
              <div className="stat-label">Completion Rate</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">150+</div>
              <div className="stat-label">Countries</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">AI Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Urgency Banner */}
      <section className="urgency-banner">
        <div className="ai-container">
          <div className="urgency-content">
            <div className="urgency-icon">🚨</div>
            <div className="urgency-text">
              <span className="urgency-main">Limited Time: Free Access to AI Learning Platform</span>
              <span className="urgency-sub">Join 25,000+ learners before this opportunity expires</span>
            </div>
            <div className="urgency-timer">
              <div className="timer-item">
                <span className="timer-number">{timeLeft.days}</span>
                <span className="timer-label">Days</span>
              </div>
              <div className="timer-item">
                <span className="timer-number">{timeLeft.hours}</span>
                <span className="timer-label">Hours</span>
              </div>
              <div className="timer-item">
                <span className="timer-number">{timeLeft.minutes}</span>
                <span className="timer-label">Min</span>
              </div>
              <div className="timer-item">
                <span className="timer-number">{timeLeft.seconds}</span>
                <span className="timer-label">Sec</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bitcoin Foundation Section */}
      <section 
        className={`ai-content-section ${isVisible.bitcoin ? 'animate-in' : ''}`} 
        id="bitcoin-section" 
        data-animate
      >
        <div className="ai-container">
          <div className="ai-section-header">
            <div className="ai-section-icon bitcoin-icon">🔗</div>
            <h2 className="ai-section-title">Bitcoin & Stacks — Educational Foundation</h2>
            <div className="ai-neural-indicator"></div>
          </div>
          
          <div className="ai-content-grid">
            <div className="ai-text-content">
              <div className="ai-content-card">
                <h3>What is Bitcoin Technology?</h3>
                <p>
                  Bitcoin serves as the backbone of Web3, representing the first successful implementation 
                  of a peer-to-peer electronic cash system. We explore how this technology works from 
                  an educational perspective, without promoting any financial products or investment advice.
                </p>
              </div>
              
              <div className="ai-content-card">
                <h3>Stacks Network Overview</h3>
                <p>
                  Stacks enables smart contracts and decentralized applications on Bitcoin without modifying 
                  the original protocol. Through educational analysis, we examine how these technologies 
                  can be used to build transparent, decentralized applications.
                </p>
              </div>
              
              <div className="ai-content-card">
                <h3>Educational Research Focus</h3>
                <p>
                  Our platform analyzes blockchain data patterns, smart contract functionality, and 
                  decentralized application architectures for purely educational purposes. All content 
                  is informational and does not constitute financial advice.
                </p>
              </div>
            </div>
            
            <div className="ai-visual-content">
              <div className="ai-bitcoin-visualization">
                <div className="btc-core">₿</div>
                <div className="network-nodes">
                  <div className="network-node node-1">🌐</div>
                  <div className="network-node node-2">🔒</div>
                  <div className="network-node node-3">⚡</div>
                  <div className="network-node node-4">🔗</div>
                </div>
                <div className="network-connections">
                  <div className="connection line-1"></div>
                  <div className="connection line-2"></div>
                  <div className="connection line-3"></div>
                  <div className="connection line-4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DeFi & Smart Contracts Section */}
      <section className="ai-content-section" id="defi-section" data-animate>
        <div className="ai-container">
          <div className="ai-section-header">
            <div className="ai-section-icon defi-icon">📚</div>
            <h2 className="ai-section-title">Understanding DeFi Technology</h2>
            <div className="ai-neural-indicator"></div>
          </div>
          
          <div className="ai-content-grid">
            <div className="ai-visual-content">
              <div className="ai-defi-visualization">
                <div className="defi-core">
                  <div className="core-ring ring-1"></div>
                  <div className="core-ring ring-2"></div>
                  <div className="core-center">DeFi</div>
                </div>
                <div className="defi-protocols">
                  <div className="protocol-node node-1">🔬</div>
                  <div className="protocol-node node-2">📖</div>
                  <div className="protocol-node node-3">🧪</div>
                  <div className="protocol-node node-4">🎓</div>
                </div>
              </div>
            </div>
            
            <div className="ai-text-content">
              <div className="ai-content-card">
                <h3>What is DeFi Technology?</h3>
                <p>
                  DeFi (Decentralized Finance) refers to financial technologies that allow participation 
                  in activities like saving, exchanges, and lending without traditional banks or intermediaries. 
                  We analyze these protocols from an educational perspective only.
                </p>
              </div>
              
              <div className="ai-content-card">
                <h3>Smart Contract Education</h3>
                <p>
                  Smart contracts are self-executing programs with terms written directly into code. 
                  Through educational simulations, we explore how these transparent protocols work 
                  without promoting any specific financial products.
                </p>
              </div>
              
              <div className="ai-content-card">
                <h3>Educational Concepts</h3>
                <p>
                  We explore concepts like staking, farming, and liquidity pools through educational 
                  analysis and simulated environments. All content is for learning purposes and 
                  contains no investment recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI & Machine Learning in Crypto */}
      <section className="ai-content-section" id="ai-crypto-section" data-animate>
        <div className="ai-container">
          <div className="ai-section-header">
            <div className="ai-section-icon ai-icon">🧠</div>
            <h2 className="ai-section-title">Role of AI in Blockchain Education</h2>
            <div className="ai-neural-indicator"></div>
          </div>
          
          <div className="ai-content-grid">
            <div className="ai-text-content">
              <div className="ai-content-card">
                <h3>Educational Data Analysis</h3>
                <p>
                  Artificial Intelligence helps filter, analyze, and explain blockchain data patterns 
                  for educational purposes. We use AI to detect behaviors in public on-chain data 
                  and create educational content without providing financial advice.
                </p>
              </div>
              
              <div className="ai-content-card">
                <h3>Personalized Learning</h3>
                <p>
                  AI personalizes educational content based on user profiles and learning preferences. 
                  Our algorithms suggest educational allocation strategies for fictional token portfolios 
                  in controlled, risk-free learning environments.
                </p>
              </div>
              
              <div className="ai-content-card">
                <h3>Educational Simulations</h3>
                <p>
                  Through AI-powered simulations, we create safe learning environments where users 
                  can explore DeFi concepts without any financial risk. All tools are designed 
                  for educational purposes only.
                </p>
              </div>
            </div>
            
            <div className="ai-visual-content">
              <div className="ai-brain-visualization">
                <div className="brain-core">🧠</div>
                <div className="neural-paths">
                  <div className="neural-path path-1"></div>
                  <div className="neural-path path-2"></div>
                  <div className="neural-path path-3"></div>
                  <div className="neural-path path-4"></div>
                </div>
                <div className="data-nodes">
                  <div className="data-node node-1">📊</div>
                  <div className="data-node node-2">📈</div>
                  <div className="data-node node-3">⚡</div>
                  <div className="data-node node-4">🎯</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Personal AI Finance Section */}
      <section className="ai-content-section" id="personal-ai-section" data-animate>
        <div className="ai-container">
          <div className="ai-section-header">
            <div className="ai-section-icon personal-ai-icon">🤖</div>
            <h2 className="ai-section-title">The Future: Personal AI for Financial Management</h2>
            <div className="ai-neural-indicator"></div>
          </div>
          
          <div className="ai-content-grid">
            <div className="ai-text-content">
              <div className="ai-content-card">
                <h3>Personal AI Revolution</h3>
                <p>
                  The future of personal finance lies in dedicated AI assistants that understand your unique 
                  financial goals, risk tolerance, and life circumstances. Through educational exploration, 
                  we examine how personalized AI could transform financial decision-making processes.
                </p>
              </div>
              
              <div className="ai-content-card">
                <h3>AI-Powered Financial Education</h3>
                <p>
                  Personal AI systems can analyze vast amounts of financial data, market trends, and 
                  economic indicators to provide educational insights tailored to individual learning needs. 
                  These educational tools help users understand complex financial concepts through personalized explanations.
                </p>
              </div>
              
              <div className="ai-content-card">
                <h3>Educational Simulation Technology</h3>
                <p>
                  Advanced AI algorithms can create sophisticated educational simulations that teach 
                  portfolio management, risk assessment, and financial planning concepts without any 
                  real financial exposure. This represents the foundation of future financial education.
                </p>
              </div>
            </div>
            
            <div className="ai-visual-content">
              {/* Original visualization kept to ensure visibility on all builds */}
              <div className="ai-personal-visualization">
                <div className="personal-ai-core">
                  <div className="ai-pulse-ring ring-1"></div>
                  <div className="ai-pulse-ring ring-2"></div>
                  <div className="ai-center">AI</div>
                </div>
                <div className="finance-modules">
                  <div className="finance-module module-1">📊</div>
                  <div className="finance-module module-2">💡</div>
                  <div className="finance-module module-3">🎯</div>
                  <div className="finance-module module-4">🔮</div>
                  <div className="finance-module module-5">📈</div>
                  <div className="finance-module module-6">🛡️</div>
                </div>
                <div className="ai-connections">
                  <div className="connection-line line-1"></div>
                  <div className="connection-line line-2"></div>
                  <div className="connection-line line-3"></div>
                  <div className="connection-line line-4"></div>
                  <div className="connection-line line-5"></div>
                  <div className="connection-line line-6"></div>
                </div>
              </div>

              {/* New symmetric LaserOrbit representation */}
              <LaserOrbit centerLabel="AI" />
            </div>
          </div>
          
          <div className="ai-future-grid">
            <div className="future-feature">
              <div className="future-icon">🧠</div>
              <h4>Personalized Learning</h4>
              <p>AI adapts educational content to individual understanding levels and financial literacy</p>
            </div>
            
            <div className="future-feature">
              <div className="future-icon">📚</div>
              <h4>Continuous Education</h4>
              <p>24/7 educational support with explanations tailored to personal learning preferences</p>
            </div>
            
            <div className="future-feature">
              <div className="future-icon">🎯</div>
              <h4>Goal-Oriented Teaching</h4>
              <p>Educational pathways designed around individual financial education objectives</p>
            </div>
            
            <div className="future-feature">
              <div className="future-icon">🔒</div>
              <h4>Risk-Free Learning</h4>
              <p>Advanced simulations provide hands-on financial education without any real-world risk</p>
            </div>
            
            <div className="future-feature">
              <div className="future-icon">🌐</div>
              <h4>Global Market Education</h4>
              <p>AI analyzes worldwide financial trends for comprehensive educational insights</p>
            </div>
            
            <div className="future-feature">
              <div className="future-icon">⚡</div>
              <h4>Real-Time Education</h4>
              <p>Instant educational responses to market changes and financial developments</p>
            </div>
          </div>
          
          <div className="ai-content-card featured-future">
            <h3>🚀 The Educational Foundation of Tomorrow</h3>
            <p>
              <strong>Personal AI for financial education represents the next frontier in learning.</strong> 
              By combining artificial intelligence with personalized educational approaches, we can create 
              learning environments that adapt to individual needs, preferences, and goals. This technology 
              forms the foundation for future financial literacy and informed decision-making.
            </p>
            <div className="future-disclaimer">
              <strong>Note:</strong> This content explores emerging educational technologies and does not 
              provide financial advice, investment recommendations, or guarantee any outcomes.
            </div>
          </div>
        </div>
      </section>

      {/* Educational Mission Section */}
      <section className="ai-content-section" id="mission-section" data-animate>
        <div className="ai-container">
          <div className="ai-section-header">
            <div className="ai-section-icon mission-icon">🎓</div>
            <h2 className="ai-section-title">Our Educational Mission</h2>
            <div className="ai-neural-indicator"></div>
          </div>
          
          <div className="ai-content-grid single-column">
            <div className="ai-text-content">
              <div className="ai-content-card featured">
                <h3>Educational Purpose Only</h3>
                <p>
                  <strong>BitSwapDEX AI does not promote buying or selling cryptocurrencies.</strong> 
                  Our goal is to provide clarity and education in accessible language, especially 
                  for those taking their first steps in this space. All articles, simulations, 
                  and tools are provided for <strong>informational and educational purposes only.</strong>
                </p>
              </div>
              
              <div className="ai-educational-grid">
                <div className="educational-item">
                  <div className="edu-icon">📚</div>
                  <h4>Learn & Explore</h4>
                  <p>Discover DeFi concepts through simulated portfolios and educational content</p>
                </div>
                
                <div className="educational-item">
                  <div className="edu-icon">🔬</div>
                  <h4>Research & Understand</h4>
                  <p>Analyze how decentralized exchanges (DEX) work in controlled environments</p>
                </div>
                
                <div className="educational-item">
                  <div className="edu-icon">🧪</div>
                  <h4>Safe Experimentation</h4>
                  <p>Experience blockchain concepts without pressure, risk, or financial promises</p>
                </div>
                
                <div className="educational-item">
                  <div className="edu-icon">🎯</div>
                  <h4>Transparent Learning</h4>
                  <p>AI-explained strategies in simple terms within controlled, transparent environments</p>
                </div>
              </div>
              
              <div className="ai-content-card disclaimer">
                <h3>🔒 Important Disclaimer</h3>
                <p>
                  This content is educational and informational only. It does not constitute 
                  financial advice, investment recommendations, or solicitations. Users should 
                  conduct their own research and consult qualified professionals before making 
                  any financial decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Bitcoin Adoption Section */}
      <section className="ai-content-section" id="bitcoin-adoption-section" data-animate>
        <div className="ai-container">
          <div className="ai-section-header">
            <div className="ai-section-icon bitcoin-global-icon">🌍</div>
            <h2 className="ai-section-title">Global Bitcoin & Crypto Adoption</h2>
            <div className="ai-neural-indicator"></div>
          </div>
          
          <div className="bitcoin-adoption-grid">
            {/* Bitcoin Price Chart with Candlesticks */}
            <div className="bitcoin-chart-container">
              <div className="chart-header">
                <h3>🟠 Bitcoin Live Price Chart</h3>
                <div className="data-source">📊 Data: CoinGecko API</div>
                <div className="price-display">
                  <span className="current-price">
                    {bitcoinPrice.loading ? '$67,542.31' : `$${bitcoinPrice.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                  </span>
                  <span className={`price-change ${bitcoinPrice.change >= 0 ? 'positive' : 'negative'}`}>
                    {bitcoinPrice.loading ? '+2.34%' : `${bitcoinPrice.change >= 0 ? '+' : ''}${bitcoinPrice.change.toFixed(2)}%`}
                  </span>
                </div>
              </div>
              
              {/* Candlestick Chart */}
              <div className="bitcoin-chart">
                <svg viewBox="0 0 400 200" className="candlestick-chart">
                  <defs>
                    <linearGradient id="bullishGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#00FF88" />
                      <stop offset="100%" stopColor="#00D469" />
                    </linearGradient>
                    <linearGradient id="bearishGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FF4444" />
                      <stop offset="100%" stopColor="#D43F3A" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid lines */}
                  <g className="grid">
                    <line x1="0" y1="50" x2="400" y2="50" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                    <line x1="0" y1="100" x2="400" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                    <line x1="0" y1="150" x2="400" y2="150" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                  </g>
                  
                  {/* Dynamic Candlesticks */}
                  {getCandlePatterns(selectedTimeframe).map((candle, index) => {
                    const isLast = index === getCandlePatterns(selectedTimeframe).length - 1;
                    const color = candle.type === 'bullish' ? '#00FF88' : '#FF4444';
                    const gradient = candle.type === 'bullish' ? 'url(#bullishGradient)' : 'url(#bearishGradient)';
                    const rectHeight = Math.abs(candle.close - candle.open);
                    const rectY = Math.min(candle.open, candle.close);
                    
                    return (
                      <g key={index} className={`candle ${candle.type} ${isLast ? 'current' : ''}`}>
                        <line 
                          x1={candle.x} 
                          y1={candle.high} 
                          x2={candle.x} 
                          y2={candle.low} 
                          stroke={color} 
                          strokeWidth={isLast ? "2" : "1"}
                        />
                        <rect 
                          x={candle.x - 5} 
                          y={rectY} 
                          width="10" 
                          height={rectHeight} 
                          fill={gradient} 
                          stroke={color} 
                          strokeWidth={isLast ? "2" : "1"}
                        >
                          {isLast && (
                            <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>
                          )}
                        </rect>
                      </g>
                    );
                  })}
                  
                  {/* Dynamic Volume bars */}
                  <g className="volume">
                    {getCandlePatterns(selectedTimeframe).map((candle, index) => {
                      const isLast = index === getCandlePatterns(selectedTimeframe).length - 1;
                      const volumeHeight = 15 + (index * 5); // Progressive volume increase
                      const volumeY = 180 - volumeHeight;
                      const volumeColor = candle.type === 'bullish' ? 'rgba(0,255,136,0.3)' : 'rgba(255,68,68,0.3)';
                      
                      return (
                        <rect 
                          key={`volume-${index}`}
                          x={candle.x - 5} 
                          y={volumeY} 
                          width="10" 
                          height={volumeHeight} 
                          fill={isLast ? 'rgba(0,255,136,0.4)' : volumeColor}
                        >
                          {isLast && (
                            <animate attributeName="height" values={`${volumeHeight};${volumeHeight + 5};${volumeHeight}`} dur="2s" repeatCount="indefinite"/>
                          )}
                        </rect>
                      );
                    })}
                  </g>
                </svg>
                
                <div className="chart-controls">
                  <span 
                    className={`time-frame ${selectedTimeframe === '1H' ? 'active' : ''}`}
                    onClick={() => handleTimeframeChange('1H')}
                  >
                    1H
                  </span>
                  <span 
                    className={`time-frame ${selectedTimeframe === '4H' ? 'active' : ''}`}
                    onClick={() => handleTimeframeChange('4H')}
                  >
                    4H
                  </span>
                  <span 
                    className={`time-frame ${selectedTimeframe === '1D' ? 'active' : ''}`}
                    onClick={() => handleTimeframeChange('1D')}
                  >
                    1D
                  </span>
                  <span 
                    className={`time-frame ${selectedTimeframe === '1W' ? 'active' : ''}`}
                    onClick={() => handleTimeframeChange('1W')}
                  >
                    1W
                  </span>
                </div>
              </div>
              
              {/* Bitcoin Financial Stats */}
              <div className="bitcoin-stats">
                <div className="stat-row">
                  <div className="stat-item">
                    <span className="stat-label">Market Cap</span>
                    <span className="stat-value">
                      ${bitcoinData.loading ? '1.34T' : (bitcoinData.marketCap / 1e12).toFixed(2) + 'T'}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">24h Volume</span>
                    <span className="stat-value">
                      ${bitcoinData.loading ? '28.5B' : (bitcoinData.volume24h / 1e9).toFixed(1) + 'B'}
                    </span>
                  </div>
                </div>
                <div className="stat-row">
                  <div className="stat-item">
                    <span className="stat-label">Circulating Supply</span>
                    <span className="stat-value">
                      {bitcoinData.loading ? '19.8M' : (bitcoinData.circulatingSupply / 1e6).toFixed(1) + 'M'} BTC
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Max Supply</span>
                    <span className="stat-value">21M BTC</span>
                  </div>
                </div>
                <div className="stat-row">
                  <div className="stat-item">
                    <span className="stat-label">All-Time High</span>
                    <span className="stat-value">
                      ${bitcoinData.loading ? '73,738' : bitcoinData.ath.toLocaleString()}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Market Rank</span>
                    <span className="stat-value rank-1">#1</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Countries Accepting Crypto */}
            <div className="crypto-adoption-container">
              <h3>🏛️ Leading Countries Accepting Crypto Payments</h3>
              <div className="data-source">📊 Sources: CoinDesk, Chainalysis, Government Reports 2024</div>
              <div className="countries-grid">
                <div className="country-item">
                  <span className="country-flag">🇸🇻</span>
                  <div className="country-info">
                    <span className="country-name">El Salvador</span>
                    <span className="adoption-status legal">Legal Tender</span>
                  </div>
                </div>
                <div className="country-item">
                  <span className="country-flag">🇺🇸</span>
                  <div className="country-info">
                    <span className="country-name">United States</span>
                    <span className="adoption-status regulated">Regulated</span>
                  </div>
                </div>
                <div className="country-item">
                  <span className="country-flag">🇨🇦</span>
                  <div className="country-info">
                    <span className="country-name">Canada</span>
                    <span className="adoption-status regulated">Regulated</span>
                  </div>
                </div>
                <div className="country-item">
                  <span className="country-flag">🇩🇪</span>
                  <div className="country-info">
                    <span className="country-name">Germany</span>
                    <span className="adoption-status accepted">Accepted</span>
                  </div>
                </div>
                <div className="country-item">
                  <span className="country-flag">🇯🇵</span>
                  <div className="country-info">
                    <span className="country-name">Japan</span>
                    <span className="adoption-status regulated">Regulated</span>
                  </div>
                </div>
                <div className="country-item">
                  <span className="country-flag">🇨🇭</span>
                  <div className="country-info">
                    <span className="country-name">Switzerland</span>
                    <span className="adoption-status friendly">Crypto-Friendly</span>
                  </div>
                </div>
                <div className="country-item">
                  <span className="country-flag">🇮🇩</span>
                  <div className="country-info">
                    <span className="country-name">Indonesia</span>
                    <span className="adoption-status accepted">Accepted</span>
                  </div>
                </div>
                <div className="country-item">
                  <span className="country-flag">🇦🇺</span>
                  <div className="country-info">
                    <span className="country-name">Australia</span>
                    <span className="adoption-status regulated">Regulated</span>
                  </div>
                </div>
                <div className="country-item">
                  <span className="country-flag">🇸🇬</span>
                  <div className="country-info">
                    <span className="country-name">Singapore</span>
                    <span className="adoption-status friendly">Crypto-Friendly</span>
                  </div>
                </div>
                <div className="country-item">
                  <span className="country-flag">🇳🇱</span>
                  <div className="country-info">
                    <span className="country-name">Netherlands</span>
                    <span className="adoption-status regulated">Regulated</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bitcoin Reserves Ranking */}
            <div className="bitcoin-reserves-container">
              <h3>🏦 Countries with Bitcoin Reserves</h3>
              <div className="data-source">📊 Sources: Bitcoin Treasury, Coinbase Intelligence, Public Records</div>
              <div className="reserves-ranking">
                <div className="reserve-item rank-1">
                  <span className="rank">#1</span>
                  <span className="country-flag">🇺🇸</span>
                  <div className="reserve-info">
                    <span className="country-name">United States</span>
                    <span className="btc-amount">215,245 BTC</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '100%'}}></div>
                  </div>
                </div>
                <div className="reserve-item rank-2">
                  <span className="rank">#2</span>
                  <span className="country-flag">🇨🇳</span>
                  <div className="reserve-info">
                    <span className="country-name">China</span>
                    <span className="btc-amount">194,775 BTC</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '90%'}}></div>
                  </div>
                </div>
                <div className="reserve-item rank-3">
                  <span className="rank">#3</span>
                  <span className="country-flag">🇬🇧</span>
                  <div className="reserve-info">
                    <span className="country-name">United Kingdom</span>
                    <span className="btc-amount">61,245 BTC</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '28%'}}></div>
                  </div>
                </div>
                <div className="reserve-item rank-4">
                  <span className="rank">#4</span>
                  <span className="country-flag">🇸🇻</span>
                  <div className="reserve-info">
                    <span className="country-name">El Salvador</span>
                    <span className="btc-amount">2,847 BTC</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '13%'}}></div>
                  </div>
                </div>
                <div className="reserve-item rank-5">
                  <span className="rank">#5</span>
                  <span className="country-flag">🇩🇪</span>
                  <div className="reserve-info">
                    <span className="country-name">Germany</span>
                    <span className="btc-amount">1,915 BTC</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '9%'}}></div>
                  </div>
                </div>
                <div className="reserve-item rank-6">
                  <span className="rank">#6</span>
                  <span className="country-flag">🇫🇮</span>
                  <div className="reserve-info">
                    <span className="country-name">Finland</span>
                    <span className="btc-amount">1,564 BTC</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '7%'}}></div>
                  </div>
                </div>
                <div className="reserve-item rank-7">
                  <span className="rank">#7</span>
                  <span className="country-flag">🇺🇦</span>
                  <div className="reserve-info">
                    <span className="country-name">Ukraine</span>
                    <span className="btc-amount">46,351 BTC</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '22%'}}></div>
                  </div>
                </div>
                <div className="reserve-item rank-8">
                  <span className="rank">#8</span>
                  <span className="country-flag">🇧🇬</span>
                  <div className="reserve-info">
                    <span className="country-name">Bulgaria</span>
                    <span className="btc-amount">213,519 BTC</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '99%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="adoption-disclaimer">
            <p>
              <strong>Educational Information:</strong> This data represents publicly available information 
              about Bitcoin adoption and reserves for educational purposes only. Figures are approximate 
              and subject to change. This is not investment advice or a recommendation to buy cryptocurrencies.
            </p>
            <p>
              Transparency note: sources include public government disclosures, blockchain analytics dashboards,
              and independent industry research. Time delays and reporting inconsistencies can occur across jurisdictions.
            </p>
            <p>
              Market risk: crypto assets are highly volatile and regulatory positions evolve over time. Always verify
              information from multiple sources and consult qualified professionals before taking any financial action.
            </p>

            <div className="laser-points">
              <div className="laser-point">
                <div className="laser-icon" aria-hidden>🔭</div>
                <div className="laser-text">Public, verifiable data sources; methodology documented where available.</div>
              </div>
              <div className="laser-point">
                <div className="laser-icon" aria-hidden>🔒</div>
                <div className="laser-text">No personal data collected or inferred from these aggregate figures.</div>
              </div>
              <div className="laser-point">
                <div className="laser-icon" aria-hidden>📊</div>
                <div className="laser-text">Numbers are rounded; revisions may be published as new records appear.</div>
              </div>
              <div className="laser-point">
                <div className="laser-icon" aria-hidden>🧠</div>
                <div className="laser-text">Learn‑first policy: education, not advice. Use this as study material only.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Educational CTA */}
      <section className="ai-cta-section">
        <div className="ai-container">
          <div className="ai-cta-content-compact">
            <div className="ai-cta-header-compact">
              <h2>Start Your Educational Journey</h2>
              <p>
                Explore Web3 technologies through our educational platform. Learn blockchain fundamentals in a controlled environment.
              </p>
            </div>
            
            <div className="ai-cta-features-compact">
              <div 
                className="cta-feature-interactive"
                onMouseEnter={() => setActiveTooltip('expert-curriculum')}
                onMouseLeave={() => setActiveTooltip(null)}
                onClick={() => setActiveTooltip(activeTooltip === 'expert-curriculum' ? null : 'expert-curriculum')}
              >
                <div className="feature-icon">🎓</div>
                <span>Expert Curriculum</span>
                {activeTooltip === 'expert-curriculum' && (
                  <>
                    <div className="tooltip-backdrop" onClick={() => setActiveTooltip(null)}></div>
                    <div className="tooltip-popup">
                      <div className="tooltip-close" onClick={() => setActiveTooltip(null)}>×</div>
                      <h4>{tooltipContent['expert-curriculum'].title}</h4>
                      <p>{tooltipContent['expert-curriculum'].content}</p>
                    </div>
                  </>
                )}
              </div>

              <div 
                className="cta-feature-interactive"
                onMouseEnter={() => setActiveTooltip('ai-learning')}
                onMouseLeave={() => setActiveTooltip(null)}
                onClick={() => setActiveTooltip(activeTooltip === 'ai-learning' ? null : 'ai-learning')}
              >
                <div className="feature-icon">🤖</div>
                <span>AI-Powered Learning</span>
                {activeTooltip === 'ai-learning' && (
                  <>
                    <div className="tooltip-backdrop" onClick={() => setActiveTooltip(null)}></div>
                    <div className="tooltip-popup">
                      <div className="tooltip-close" onClick={() => setActiveTooltip(null)}>×</div>
                      <h4>{tooltipContent['ai-learning'].title}</h4>
                      <p>{tooltipContent['ai-learning'].content}</p>
                    </div>
                  </>
                )}
              </div>

              <div 
                className="cta-feature-interactive"
                onMouseEnter={() => setActiveTooltip('certification')}
                onMouseLeave={() => setActiveTooltip(null)}
                onClick={() => setActiveTooltip(activeTooltip === 'certification' ? null : 'certification')}
              >
                <div className="feature-icon">🏆</div>
                <span>Industry Certification</span>
                {activeTooltip === 'certification' && (
                  <>
                    <div className="tooltip-backdrop" onClick={() => setActiveTooltip(null)}></div>
                    <div className="tooltip-popup">
                      <div className="tooltip-close" onClick={() => setActiveTooltip(null)}>×</div>
                      <h4>{tooltipContent['certification'].title}</h4>
                      <p>{tooltipContent['certification'].content}</p>
                    </div>
                  </>
                )}
              </div>

              <div 
                className="cta-feature-interactive"
                onMouseEnter={() => setActiveTooltip('community')}
                onMouseLeave={() => setActiveTooltip(null)}
                onClick={() => setActiveTooltip(activeTooltip === 'community' ? null : 'community')}
              >
                <div className="feature-icon">🌍</div>
                <span>Global Community</span>
                {activeTooltip === 'community' && (
                  <>
                    <div className="tooltip-backdrop" onClick={() => setActiveTooltip(null)}></div>
                    <div className="tooltip-popup">
                      <div className="tooltip-close" onClick={() => setActiveTooltip(null)}>×</div>
                      <h4>{tooltipContent['community'].title}</h4>
                      <p>{tooltipContent['community'].content}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="ai-cta-actions-compact">
              <Link to="/bitcoin-academy" className="ai-cta-button primary compact">
                <span className="cta-text">Explore Bitcoin Education</span>
                <div className="cta-icon">📚</div>
              </Link>
              <Link to="/ai-portfolio" className="ai-cta-button secondary compact">
                <span className="cta-text">Educational Simulations</span>
                <div className="cta-icon">🧪</div>
              </Link>
            </div>

          {/* BitPulse Lightning Quiz */}
          <div style={{ marginTop: 16 }}>
            <MiniQuizGPT />
          </div>
          </div>
        </div>
      </section>
      
      {/* LaserOrbit at page end for identification */}
      <section className="ai-content-section" id="laser-end" data-animate>
        <div className="ai-container">
          <div className="ai-hero-laser" style={{ margin: '36px 0 64px' }}>
            <LaserOrbit centerLabel="₿" variant="ecosystem" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default EducationPageModern;

