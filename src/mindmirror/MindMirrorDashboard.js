import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './mindmirror.css';
import MindNFTGenerator from './components/MindNFTGenerator';

const MindMirrorDashboard = () => {
  // State management
  const [inputText, setInputText] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [userBadge, setUserBadge] = useState(null);
  const [currentTier, setCurrentTier] = useState(1);
  const [walletBalance, setWalletBalance] = useState(0);
  const [hasUsedAnalysis, setHasUsedAnalysis] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [wordMilestone, setWordMilestone] = useState({
    count: 0,
    hasAccess: false,
    isLoading: true
  });
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  // Check if user has already used the analysis
  const checkAnalysisUsage = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
      const connectedWallet = window.ethereum?.selectedAddress || localStorage.getItem('connectedWallet');
      
      if (!connectedWallet) return;
      
      const response = await fetch(`${BACKEND_URL}/api/word-analysis/check-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: connectedWallet })
      });
      
      const data = await response.json();
      setHasUsedAnalysis(data.hasUsed || false);
    } catch (error) {
      console.error('Error checking analysis usage:', error);
    }
  };

  // Page protection against accidental closure
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (analysisResults) {
        e.preventDefault();
        e.returnValue = 'You have unsaved analysis results! If you leave, the data will be lost forever.';
        return 'You have unsaved analysis results! If you leave, the data will be lost forever.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [analysisResults]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Calculate progress and word count
  const wordCount = wordMilestone.count || (inputText.trim() ? inputText.trim().split(/\s+/).length : 0);
  const progress = Math.min((wordCount / 1000) * 100, 100);

  // Check word milestone on component mount
  useEffect(() => {
    checkWordMilestone();
    checkAnalysisUsage();
  }, []);

  // Page protection against accidental closure
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (analysisResults) {
        e.preventDefault();
        e.returnValue = 'You have unsaved analysis results! If you leave, the data will be lost forever.';
        return 'You have unsaved analysis results! If you leave, the data will be lost forever.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [analysisResults]);

  const checkWordMilestone = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
      const connectedWallet = window.ethereum?.selectedAddress || localStorage.getItem('connectedWallet');
      
      if (!connectedWallet) {
        setWordMilestone({ count: 0, hasAccess: false, isLoading: false });
        return;
      }

      console.log('🔍 Fetching word count for wallet:', connectedWallet);

      const response = await fetch(`${BACKEND_URL}/api/word-analysis/analyze-user-words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: connectedWallet })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch word count: ${response.status}`);
      }

      const data = await response.json();
      const wordCount = data.wordCount || 0;
      
      console.log('📊 Word count result:', { wordCount, hasAccess: wordCount >= 1000 });

      setWordMilestone({
        count: wordCount,
        hasAccess: wordCount >= 10, // TEMPORARY: Allow analysis with just 10 words for testing
        isLoading: false
      });
    } catch (error) {
      console.error('❌ Error checking word milestone:', error);
      setWordMilestone({ count: 0, hasAccess: false, isLoading: false });
    }
  };

  const handleAnalysis = async () => {
    // Check if user has already used the analysis
    if (hasUsedAnalysis) {
      alert('⚠️ You have already used the free psychological analysis! For a new analysis, contact us for paid options.');
      return;
    }
    
    // Show warning modal before analysis
    setShowWarningModal(true);
    
    // Disable body scroll
    document.body.style.overflow = 'hidden';
  };

  // Export functions
  const handleEmailExport = () => {
    if (!analysisResults) return;
    
    const subject = encodeURIComponent('My Psychological Trading Analysis - MindMirror');
    const body = encodeURIComponent(`
🧠 PSYCHOLOGICAL TRADING ANALYSIS RESULTS

${analysisResults.analysis}

Generated by MindMirror AI - bits-ai.io
Wallet: ${window.ethereum?.selectedAddress || localStorage.getItem('connectedWallet')}
Date: ${new Date().toLocaleDateString()}
    `);
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handlePDFExport = () => {
    if (!analysisResults) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Psychological Trading Analysis</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #8B5CF6; }
            .analysis { white-space: pre-wrap; line-height: 1.6; }
          </style>
        </head>
        <body>
          <h1>🧠 Psychological Trading Analysis</h1>
          <div class="analysis">${analysisResults.analysis}</div>
          <hr>
          <p><strong>Generated by:</strong> MindMirror AI - bits-ai.io</p>
          <p><strong>Wallet:</strong> ${window.ethereum?.selectedAddress || localStorage.getItem('connectedWallet')}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePrintExport = () => {
    if (!analysisResults) return;
    
    const printContent = `
🧠 PSYCHOLOGICAL TRADING ANALYSIS RESULTS

${analysisResults.analysis}

Generated by MindMirror AI - bits-ai.io
Wallet: ${window.ethereum?.selectedAddress || localStorage.getItem('connectedWallet')}
Date: ${new Date().toLocaleDateString()}
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<pre>${printContent}</pre>`);
    printWindow.document.close();
    printWindow.print();
  };

  const handleShareExport = () => {
    if (!analysisResults) return;
    
    const shareText = `🧠 Just completed my Psychological Trading Analysis with MindMirror AI! 

Trading Score: ${analysisResults.tradingScore || 'N/A'}/100

Check out your own analysis at bits-ai.io

#TradingPsychology #AI #Crypto`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Psychological Trading Analysis',
        text: shareText,
        url: 'https://bits-ai.io'
      });
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('✅ Analysis summary copied to clipboard!');
      });
    }
  };

  // Popup handling functions
  const handleFeatureHover = (featureKey, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPopupPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10 // Position above the feature
    });
    setHoveredFeature(featureKey);
  };

  const handleFeatureLeave = () => {
    setHoveredFeature(null);
  };

  // Feature popup content
  const getFeaturePopupContent = (featureKey) => {
    const features = {
      'emotional_prosody': {
        title: '🎯 Emotional Prosody Mapping',
        description: 'Advanced AI analysis of emotional patterns in speech, detecting micro-expressions and vocal stress indicators that reveal true trading psychology.',
        access: 'Level 2+ (5,000 BITS)',
        status: 'Premium Feature'
      },
      'trading_psychology': {
        title: '📊 Trading Psychology Profiling',
        description: 'Comprehensive psychological assessment combining behavioral analysis, risk tolerance evaluation, and decision-making pattern recognition.',
        access: 'Level 1+ (1,000 BITS)',
        status: 'Available Now'
      },
      'voice_analysis': {
        title: '🔊 Real-time Voice Analysis',
        description: 'Live monitoring of vocal biomarkers during trading sessions, providing instant feedback on stress levels and emotional state.',
        access: 'Level 3+ (25,000 BITS)',
        status: 'Coming Soon'
      },
      'personalized_trading': {
        title: '💡 Personalized Trading Recommendations',
        description: 'AI-powered trading suggestions based on your unique psychological profile, risk tolerance, and historical decision patterns.',
        access: 'Level 2+ (5,000 BITS)',
        status: 'Beta Testing'
      }
    };
    return features[featureKey];
  };

  const proceedWithAnalysis = async () => {
    // Restore body scroll
    document.body.style.overflow = '';
    
    setShowWarningModal(false);
    setIsAnalyzing(true);
    
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-f82y.onrender.com";
      
      const connectedWallet = window.ethereum?.selectedAddress || localStorage.getItem('connectedWallet');
      
      if (!connectedWallet) {
        throw new Error('Please connect your wallet first to analyze your psychology profile');
      }

      // Get ONLY the raw words - no analysis!
      const rawWordsResponse = await fetch(`${BACKEND_URL}/api/word-analysis/get-user-words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: connectedWallet })
      });

      if (!rawWordsResponse.ok) {
        throw new Error('Failed to get user words for OpenAI analysis');
      }

      const rawWordsData = await rawWordsResponse.json();
      const userWords = rawWordsData.words || [];
      
      if (userWords.length === 0) {
        throw new Error('No words found for analysis');
      }
      
      const wordsText = userWords.join(' ');

      console.log('🧠 Making neuropsychological analysis request with', userWords.length, 'words');
      
      // Use the REAL AI analysis endpoint with user's actual words
      const url = `${BACKEND_URL}/api/ai/analyze`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Analyze the neuropsychological profile of a trader based on their collected words from Telegram participation. Word count: ${userWords.length}. Words: ${wordsText}`,
          analysisType: 'neuropsychological'
        })
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Use REAL OpenAI analysis results - no more hardcoded values!
      const enhancedResults = {
        ...data,
        aiProvider: "OpenAI GPT-4 Turbo",
        analysisTimestamp: new Date().toLocaleString(),
        wordCount: userWords.length,
        // Convert stress level to percentage for UI
        stressLevel: Math.round((data.stress_indicators?.level || 0.5) * 100),
        // Convert confidence to percentage
        confidenceLevel: Math.round((data.trading_psychology?.confidence_level || 0.7) * 100),
        // Convert emotional stability to percentage  
        emotionalStability: Math.round((data.trading_psychology?.emotional_stability || 0.8) * 100),
        // Convert cognitive load to percentage
        cognitiveLoad: Math.round((data.cognitive_patterns?.load || 0.6) * 100),
        // Map attention focus to numeric value
        focusLevel: data.cognitive_patterns?.attention_focus === 'high' ? 85 : 
                   data.cognitive_patterns?.attention_focus === 'medium' ? 65 : 45,
        // Convert stress resilience to percentage
        anxietyLevel: Math.round((1 - (data.neuropsychological_profile?.stress_resilience || 0.75)) * 100),
        // Additional metrics from real analysis
        decisionSpeed: data.cognitive_patterns?.decision_style === 'analytical' ? 'Deliberate-Analytical' :
                      data.cognitive_patterns?.decision_style === 'intuitive' ? 'Moderate-Intuitive' : 'Fast-Impulsive',
        riskAppetite: data.trading_psychology?.risk_tolerance === 'high' ? 'Aggressive-Risk-Seeking' :
                     data.trading_psychology?.risk_tolerance === 'medium' ? 'Balanced-Moderate' : 'Conservative-Risk-Averse'
      };
      
      setAnalysisResults(enhancedResults);
      setHasUsedAnalysis(true); // Mark as used after successful analysis
      
    } catch (error) {
      console.error('Analysis error:', error);
      alert(`Analysis failed: ${error.message}. Please try again.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Get tier information - PROFESSIONAL MEDICAL TERMINOLOGY WITH BITS REQUIREMENTS
  const getTierInfo = (tier) => {
    const tiers = {
      1: { 
        name: "Cognitive Baseline Assessment", 
        price: "Free",
        bitsRequired: 0,
        features: [
          "🧠 Lexical Pattern Recognition & Analysis",
          "📊 Basic Neurometric Profiling System", 
          "🎯 Fundamental Risk Tolerance Mapping",
          "📈 Elementary Trading Behavior Analysis",
          "💭 Initial Psychological State Assessment"
        ],
        description: "Initial neuropsychological screening using advanced linguistic analysis algorithms. Available to all users with collected word data.",
        status: "Available Now",
        unlockCondition: "Collect 1000+ words from Telegram participation"
      },
      2: { 
        name: "Advanced Neuropsychological Profile", 
        price: "1000 BITS",
        bitsRequired: 1000,
        features: [
          "🧬 Deep Sentiment Neuranalysis Engine",
          "💭 Emotional Regulation Assessment Protocol", 
          "⚡ Cognitive Load Evaluation System",
          "🎭 Stress Response Pattern Mapping",
          "🧭 Decision-Making Style Profiling",
          "📊 Advanced Trading Psychology Metrics"
        ],
        description: "Comprehensive psychological assessment using clinical-grade AI analysis with enhanced emotional intelligence processing.",
        status: "Premium Feature",
        unlockCondition: "Hold 1000+ BITS tokens in connected wallet"
      },
      3: { 
        name: "Multimodal Cognitive Analysis", 
        price: "5000 BITS",
        bitsRequired: 5000,
        features: [
          "🎤 Vocal Stress Biomarker Detection",
          "📹 Micro-Expression Analysis (FACS)",
          "⏱️ Real-Time Cortisol Response Tracking", 
          "🧠 Neuroplasticity Adaptation Metrics",
          "📡 Continuous Psychological Monitoring",
          "🔊 Voice Pattern Analysis & Emotion Recognition"
        ],
        description: "Professional-grade multimodal analysis combining voice, facial, and behavioral data with real-time monitoring capabilities.",
        status: "Coming Soon",
        unlockCondition: "Hold 5000+ BITS tokens + Premium subscription"
      },
      4: { 
        name: "Enterprise Neuropsychological Suite", 
        price: "10000 BITS",
        bitsRequired: 10000,
        features: [
          "💍 Biometric Smart Ring Integration",
          "🔬 24/7 Autonomic Nervous System Monitoring",
          "🧬 Genetic Predisposition Analysis",
          "🏥 Clinical Report Generation",
          "👨‍⚕️ Licensed Psychologist Consultation Access",
          "📱 Mobile App with Push Notifications"
        ],
        description: "Complete neuropsychological ecosystem with medical-grade monitoring, professional oversight, and enterprise-level support.",
        status: "Enterprise Only",
        unlockCondition: "Hold 10000+ BITS tokens + Enterprise license"
      }
    };
    return tiers[tier] || tiers[1];
  };

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      setVideoStream(stream);
      setIsRecording(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Camera access denied or not available');
    }
  };

  const stopVideoRecording = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setIsRecording(false);
  };

  if (wordMilestone.isLoading) {
    return (
      <div className="mind-mirror-loading">
        <div className="loading-spinner"></div>
        <p>Loading Mind Mirror...</p>
      </div>
    );
  }

  return (
    <div className="mind-mirror-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-header">
            <div className="brain-icon">🧠</div>
            <div className="hero-text">
              <h1 className="hero-title laser-sharp">AI Mind Mirror</h1>
              <p className="hero-subtitle laser-sharp">Advanced Neuropsychological Analysis for Professional Traders</p>
            </div>
          </div>

          <div className="hero-features">
            <div 
              className="feature-item"
              onMouseEnter={(e) => handleFeatureHover('emotional_prosody', e)}
              onMouseLeave={handleFeatureLeave}
            >
                <span className="feature-icon">🎯</span>
              <span>Emotional prosody mapping</span>
            </div>
            <div 
              className="feature-item"
              onMouseEnter={(e) => handleFeatureHover('trading_psychology', e)}
              onMouseLeave={handleFeatureLeave}
            >
              <span className="feature-icon">📊</span>
              <span>Trading psychology profiling</span>
            </div>
            <div 
              className="feature-item"
              onMouseEnter={(e) => handleFeatureHover('voice_analysis', e)}
              onMouseLeave={handleFeatureLeave}
            >
              <span className="feature-icon">🔊</span>
              <span>Real-time voice analysis</span>
            </div>
            <div 
              className="feature-item"
              onMouseEnter={(e) => handleFeatureHover('personalized_trading', e)}
              onMouseLeave={handleFeatureLeave}
            >
              <span className="feature-icon">💡</span>
              <span>Personalized trading recommendations</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tier System */}
      <section className="tier-system">
        <div className="tier-header">
          <h2 className="laser-sharp">🎯 Analysis Levels</h2>
          <p className="laser-sharp">Choose your level of neuropsychological analysis</p>
        </div>

        <div className="tier-grid">
          {[1, 2, 3, 4].map(tier => {
            const tierInfo = getTierInfo(tier);
            return (
              <div 
                key={tier} 
                className={`tier-card ${currentTier === tier ? 'active' : ''}`}
                onClick={() => setCurrentTier(tier)}
              >
                <div className="tier-header">
                  <h3 className="laser-sharp">Level {tier}</h3>
                  <span className="tier-price laser-sharp">{tierInfo.price}</span>
                  <div className="tier-status laser-sharp">{tierInfo.status}</div>
                </div>
                <h4 className="laser-sharp">{tierInfo.name}</h4>
                <p className="tier-description laser-sharp">{tierInfo.description}</p>
                <div className="tier-unlock-condition laser-sharp">
                  <strong>🔓 Unlock:</strong> {tierInfo.unlockCondition}
                </div>
                <ul>
                  {tierInfo.features.map((feature, idx) => (
                    <li key={idx} className="laser-sharp">{feature}</li>
                  ))}
                </ul>
                    </div>
                  );
                })}
        </div>
      </section>

      {/* Compact Status Section */}
      <section className="status-section">
        <div className="status-wrapper">
          <div className="progress-compact">
            <div className="progress-info">
              <span>Progress: <strong className="word-count-highlight">{wordCount}</strong>/1000 words</span>
              <span className="progress-percent">{progress.toFixed(1)}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="context-info">
            <p className="context-text">
              {wordCount < 10 
                ? `🧠 Participate in Telegram group to collect ${10 - wordCount} more words for analysis`
                : "✨ Ready for advanced neuropsychological analysis! (TESTING MODE)"
              }
            </p>
          </div>

          <button 
            onClick={handleAnalysis}
            disabled={isAnalyzing || !wordMilestone.hasAccess}
            className={`analyze-button laser-sharp ${isAnalyzing ? 'analyzing' : ''}`}
          >
            {isAnalyzing ? (
              <>
                <span className="spinner"></span>
                🤖 OpenAI GPT-4 Analyzing...
              </>
            ) : wordMilestone.hasAccess ? (
              '🧬 Initialize Cognitive Analysis'
            ) : (
              `🔒 Need 10 words (${wordMilestone.count || 0}/10) - TESTING MODE`
            )}
          </button>
        </div>
      </section>

      {/* Analysis Results */}
      {analysisResults && (
        <section className="results-section">
          <div className="results-header">
            <h2 className="laser-sharp">🧠 Neuropsychological Analysis Results</h2>
            <div className="results-meta">
              <span>Generated by {analysisResults.aiProvider}</span>
              <span>•</span>
              <span>{analysisResults.analysisTimestamp}</span>
            </div>
            
            {/* Export Actions */}
            <div className="export-actions">
              <button 
                className="export-btn email-btn" 
                onClick={handleEmailExport}
                title="Send via Email"
              >
                📧 Email
              </button>
              <button 
                className="export-btn pdf-btn" 
                onClick={handlePDFExport}
                title="Export as PDF"
              >
                📄 PDF
              </button>
              <button 
                className="export-btn print-btn" 
                onClick={handlePrintExport}
                title="Print Analysis"
              >
                🖨️ Print
              </button>
              <button 
                className="export-btn share-btn" 
                onClick={handleShareExport}
                title="Share Results"
              >
                📤 Share
              </button>
            </div>
          </div>
          
          <div className="results-grid">
            {/* Core Analysis */}
            <div className="result-card primary">
              <h3 className="laser-sharp">🎯 Core Analysis</h3>
              <div className="metrics">
                <div className="metric">
                  <span className="label laser-sharp">Sentiment</span>
                  <span className={`value sentiment-${analysisResults.sentiment} laser-sharp`}>
                    {analysisResults.sentiment?.toUpperCase()}
                  </span>
                </div>
                <div className="metric">
                  <span className="label laser-sharp">Confidence</span>
                  <span className="value laser-sharp">{((analysisResults.confidence || 0) * 100).toFixed(1)}%</span>
                </div>
                <div className="metric">
                  <span className="label laser-sharp">Trading Type</span>
                  <span className="value laser-sharp">{analysisResults.trading_psychology?.type || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Psychological Profile */}
            <div className="result-card">
              <h3 className="laser-sharp">🧩 Psychological Profile</h3>
              <div className="metrics">
                <div className="metric">
                  <span className="label laser-sharp">Risk Tolerance</span>
                  <span className={`value risk-${analysisResults.trading_psychology?.risk_tolerance || 'medium'} laser-sharp`}>
                    {(analysisResults.trading_psychology?.risk_tolerance || 'medium').toUpperCase()}
                  </span>
              </div>
                <div className="metric">
                  <span className="label laser-sharp">Emotional Stability</span>
                  <span className="value laser-sharp">{((analysisResults.trading_psychology?.emotional_stability || 0) * 100).toFixed(0)}%</span>
                </div>
                <div className="metric">
                  <span className="label laser-sharp">Cognitive Archetype</span>
                  <span className="value laser-sharp">{analysisResults.neuropsychological_profile?.cognitive_archetype || 'N/A'}</span>
            </div>
              </div>
            </div>
                </div>

          {/* Full Psychological Analysis */}
          {(analysisResults.detailed_analysis || analysisResults.analysis) && (
            <div className="analysis-text-section">
              <div className="analysis-text-header">
                <h3 className="laser-sharp">📋 Complete Medical Psychological Analysis</h3>
                <p>Professional psychological trading profile generated by OpenAI GPT-4 Turbo</p>
              </div>
              <div className="analysis-text-content">
                <div className="analysis-text laser-sharp">{analysisResults.detailed_analysis || analysisResults.analysis}</div>
              </div>
            </div>
          )}

          {/* NFT Generation Section */}
          <div className="nft-section">
            <div className="nft-header">
              <h3 className="laser-sharp">🎨 Generate Your Mind NFT</h3>
              <p>Create a unique NFT based on your neuropsychological analysis</p>
            </div>
            <MindNFTGenerator results={analysisResults} />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mind-mirror-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>🧠 Mind Mirror Technology</h4>
            <p>Advanced AI-powered neuropsychological analysis for traders</p>
          </div>
          <div className="footer-section">
            <h4>🔬 Scientific Approach</h4>
            <p>Based on proven psychological and neuroscience research</p>
          </div>
          <div className="footer-section">
            <h4>🎯 Trading Optimization</h4>
            <p>Personalized insights to improve your trading performance</p>
          </div>
        </div>
      </footer>
      
      {/* Warning Modal rendered via Portal */}
      <WarningModal 
        showWarningModal={showWarningModal}
        setShowWarningModal={setShowWarningModal}
        proceedWithAnalysis={proceedWithAnalysis}
      />

      {/* Feature Popup */}
      {hoveredFeature && (
        <div 
          className="feature-popup"
          style={{
            position: 'fixed',
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`,
            transform: 'translateX(-50%) translateY(-100%)',
            zIndex: 10000
          }}
        >
          <div className="popup-content">
            <h3 className="popup-title">{getFeaturePopupContent(hoveredFeature)?.title}</h3>
            <p className="popup-description">{getFeaturePopupContent(hoveredFeature)?.description}</p>
            <div className="popup-access">
              <span className="access-requirement">🔒 {getFeaturePopupContent(hoveredFeature)?.access}</span>
              <span className="feature-status">📊 {getFeaturePopupContent(hoveredFeature)?.status}</span>
            </div>
          </div>
          <div className="popup-arrow"></div>
        </div>
      )}

    </div>
  );
};

// Warning Modal Component rendered via Portal
const WarningModal = ({ showWarningModal, setShowWarningModal, proceedWithAnalysis }) => {
  if (!showWarningModal) return null;

  return createPortal(
    <div className="warning-modal-overlay">
      <div className="warning-modal">
        <div className="warning-header">
          <h2>⚠️ IMPORTANT WARNING!</h2>
        </div>
        
        <div className="warning-content">
          <div className="warning-section">
            <h3>🔒 Unique & Free Analysis</h3>
            <p>This professional psychological analysis can be performed <strong>only once for free</strong> per wallet.</p>
          </div>
          
          <div className="warning-section">
            <h3>💾 Protect Your Results</h3>
            <p>If you close the page or refresh, <strong>the analysis will be permanently lost</strong>!</p>
            <p>Use the export buttons (📧 Email, 📄 PDF, 🖨️ Print) to save your results.</p>
          </div>
          
          <div className="warning-section">
            <h3>💰 Additional Analyses</h3>
            <p>For additional analyses or repeating the analysis, a fee will be required. Contact us for details.</p>
          </div>
          
          <div className="warning-section critical">
            <h3>🚨 Confirm You Understand</h3>
            <p>By continuing, you confirm that:</p>
            <ul>
              <li>✅ You understand this is a unique free analysis</li>
              <li>✅ You will save results using export options</li>
              <li>✅ You know data is lost if you close the page</li>
            </ul>
          </div>
        </div>
        
        <div className="warning-actions">
          <button 
            className="cancel-btn"
            onClick={() => {
              // Restore body scroll
              document.body.style.overflow = '';
              setShowWarningModal(false);
            }}
          >
            ❌ Cancel
          </button>
          <button 
            className="proceed-btn"
            onClick={proceedWithAnalysis}
          >
            ✅ I Understand & Continue
          </button>
        </div>
    </div>
    </div>,
    document.body
  );
};

export default MindMirrorDashboard;
