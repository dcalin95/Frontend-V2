import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useWallet } from '../context/WalletContext';
import useBitsBalance from '../hooks/useBitsBalance';
import './mindmirror.desktop.css';
import './mindmirror.mobile.css';
import AITradingGuardian from '../components/AIHub/AITradingGuardian';
import DynamicNFTCard from '../components/AIHub/DynamicNFTCard';
import WordCollectionProgress from './components/WordCollectionProgress';
import AnalysisExplainer from './components/AnalysisExplainer';

const MindMirrorDashboard = () => {
  // Wallet & Balance Hooks
  const { walletAddress } = useWallet();
  const { balance: bitsBalance, loading: balanceLoading } = useBitsBalance(walletAddress);

  // State management
  const [inputText] = useState('');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentTier, setCurrentTier] = useState(1);
  const [hasUsedAnalysis, setHasUsedAnalysis] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [wordMilestone, setWordMilestone] = useState({
    count: 0,
    hasAccess: false,
    isLoading: true
  });
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // Toast notification helper
  const showToast = (message, type = 'info', duration = 3000) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), duration);
  };

  // Calculate progress and word count
  const wordCount = wordMilestone.count || (inputText.trim() ? inputText.trim().split(/\s+/).length : 0);

  // Check if user has already used the analysis
  const checkAnalysisUsage = useCallback(async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-eu.onrender.com";
      if (!walletAddress) return;
      const response = await fetch(`${BACKEND_URL}/api/word-analysis/check-usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: walletAddress })
      });
      const data = await response.json();
      setHasUsedAnalysis(data.hasUsed || false);
    } catch (error) {
      console.error('Error checking analysis usage:', error);
    }
  }, [walletAddress]);

  const checkWordMilestone = useCallback(async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-eu.onrender.com";
      
      if (!walletAddress) {
        console.log('❌ [Word Check] No wallet address provided');
        setWordMilestone({ count: 0, hasAccess: false, isLoading: false });
        return;
      }
      
      // Set loading state
      setWordMilestone(prev => ({ ...prev, isLoading: true }));
      
      console.log('🔍 [Word Check] Starting check for wallet:', walletAddress);
      console.log('🔍 [Word Check] Backend URL:', BACKEND_URL);
      console.log('🔍 [Word Check] Full API endpoint:', `${BACKEND_URL}/api/word-analysis/analyze-user-words`);
      
      const requestBody = { walletAddress: walletAddress };
      console.log('🔍 [Word Check] Request body:', JSON.stringify(requestBody));
      
      const response = await fetch(`${BACKEND_URL}/api/word-analysis/analyze-user-words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('🔍 [Word Check] Response status:', response.status);
      console.log('🔍 [Word Check] Response ok:', response.ok);

      // Handle 404 - No words found (user has 0 words or wallet not linked)
      if (response.status === 404) {
        const errorData = await response.json();
        console.log('⚠️ [Word Check] 404 Response:', errorData);
        console.log('⚠️ [Word Check] No words found for this wallet - it may not be linked to Telegram');
        setWordMilestone({ count: 0, hasAccess: false, isLoading: false });
        return;
      }

      // Handle other errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Word Check] API error:', response.status, errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ [Word Check] Full API response:', data);
      
      const fetchedWordCount = data.wordCount || 0;
      console.log('✅ [Word Check] Word count extracted:', fetchedWordCount);
      console.log('✅ [Word Check] Has access (>=1000):', fetchedWordCount >= 1000);
      
      setWordMilestone({
        count: fetchedWordCount,
        hasAccess: fetchedWordCount >= 1000,
        isLoading: false
      });
      
      // Subtle toast notification
      if (fetchedWordCount >= 1000) {
        showToast(`🎉 Complete! ${fetchedWordCount}/1000 words - Ready for analysis!`, 'success', 4000);
      } else {
        showToast(`📊 ${fetchedWordCount}/1000 words collected`, 'info', 2000);
      }
      console.log(`✅ [Word Check] Word count loaded: ${fetchedWordCount}/1000 words`);
    } catch (error) {
      console.error('❌ [Word Check] Fatal error:', error);
      console.error('❌ [Word Check] Error details:', error.message);
      console.error('❌ [Word Check] Error stack:', error.stack);
      setWordMilestone({ count: 0, hasAccess: false, isLoading: false });
      // Subtle error toast
      showToast('⚠️ Could not load word count. Click refresh to try again.', 'error', 4000);
    }
  }, [walletAddress]);

  // Check word milestone and usage on component mount or account change  
  useEffect(() => {
    console.log('🔄 [useEffect] Wallet address changed:', walletAddress);
    if (walletAddress) {
      console.log('✅ [useEffect] Wallet is connected, fetching word count and usage...');
      checkWordMilestone();
      checkAnalysisUsage();
    } else {
      console.log('⚠️ [useEffect] No wallet connected, resetting word milestone');
      setWordMilestone({ count: 0, hasAccess: false, isLoading: false });
    }
  }, [walletAddress, checkWordMilestone, checkAnalysisUsage]);

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

  // checkAnalysisUsage / checkWordMilestone moved above & memoized (useCallback) to satisfy hooks deps

  const handleAnalysis = async () => {
    if (!walletAddress) {
      showToast('🔌 Please connect your wallet first!', 'warning', 3000);
      return;
    }

    if (hasUsedAnalysis) {
      showToast('⚠️ You have already used the free analysis!', 'warning', 4000);
      return;
    }
    
    setShowWarningModal(true);
    document.body.style.overflow = 'hidden';
  };

  // Export functions
  const handleEmailExport = () => {
    if (!analysisResults) return;
    const subject = encodeURIComponent('My Psychological Trading Analysis - MindMirror');
    const body = encodeURIComponent(`🧠 PSYCHOLOGICAL TRADING ANALYSIS RESULTS\n\n${analysisResults.analysis}\n\nGenerated by MindMirror AI - bits-ai.io\nWallet: ${walletAddress}\nDate: ${new Date().toLocaleDateString()}`);
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
          <p><strong>Wallet:</strong> ${walletAddress}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePrintExport = () => {
    if (!analysisResults) return;
    const printContent = `🧠 PSYCHOLOGICAL TRADING ANALYSIS RESULTS\n\n${analysisResults.analysis}\n\nGenerated by MindMirror AI - bits-ai.io\nWallet: ${walletAddress}\nDate: ${new Date().toLocaleDateString()}`;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<pre>${printContent}</pre>`);
    printWindow.document.close();
    printWindow.print();
  };

  const handleShareExport = () => {
    if (!analysisResults) return;
    const shareText = `🧠 Just completed my Psychological Trading Analysis with MindMirror AI!\n\nTrading Score: ${analysisResults.tradingScore || 'N/A'}/100\n\nCheck out your own analysis at bits-ai.io\n\n#TradingPsychology #AI #Crypto`;
    if (navigator.share) {
      navigator.share({ title: 'My Psychological Trading Analysis', text: shareText, url: 'https://bits-ai.io' });
    } else {
      navigator.clipboard.writeText(shareText).then(() => alert('✅ Analysis summary copied to clipboard!'));
    }
  };

  // Popup handling
  const handleFeatureHover = (featureKey, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPopupPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    setHoveredFeature(featureKey);
  };
  const handleFeatureLeave = () => setHoveredFeature(null);

  // --- UPDATED TIER INFO (PROOF OF HOLDING) ---
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
        price: "Hold 300,000 BITS", // x20
        bitsRequired: 300000,
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
        unlockCondition: "Hold 300,000+ BITS tokens in connected wallet"
      },
      3: { 
        name: "Multimodal Cognitive Analysis", 
        price: "Hold 1,500,000 BITS", // x20
        bitsRequired: 1500000,
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
        unlockCondition: "Hold 1,500,000+ BITS tokens"
      },
      4: { 
        name: "Enterprise Neuropsychological Suite", 
        price: "Hold 3,000,000 BITS", // x20
        bitsRequired: 3000000,
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
        unlockCondition: "Hold 3,000,000+ BITS tokens"
      }
    };
    return tiers[tier] || tiers[1];
  };

  // Feature popup content
  const getFeaturePopupContent = (featureKey) => {
    const features = {
      'emotional_prosody': {
        title: '🎯 Emotional Prosody Mapping',
        description: 'Advanced AI analysis of emotional patterns in speech, detecting micro-expressions and vocal stress indicators that reveal true trading psychology.',
        access: 'Level 2+ (Hold 300k BITS)',
        status: 'Premium Feature'
      },
      'trading_psychology': {
        title: '📊 Trading Psychology Profiling',
        description: 'Comprehensive psychological assessment combining behavioral analysis, risk tolerance evaluation, and decision-making pattern recognition.',
        access: 'Level 1+ (Free)',
        status: 'Available Now'
      },
      'voice_analysis': {
        title: '🔊 Real-time Voice Analysis',
        description: 'Live monitoring of vocal biomarkers during trading sessions, providing instant feedback on stress levels and emotional state.',
        access: 'Level 3+ (Hold 1.5M BITS)',
        status: 'Coming Soon'
      },
      'personalized_trading': {
        title: '💡 Personalized Trading Recommendations',
        description: 'AI-powered trading suggestions based on your unique psychological profile, risk tolerance, and historical decision patterns.',
        access: 'Level 2+ (Hold 300k BITS)',
        status: 'Beta Testing'
      }
    };
    return features[featureKey];
  };

  const proceedWithAnalysis = async () => {
    document.body.style.overflow = '';
    setShowWarningModal(false);
    setIsAnalyzing(true);
    
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-eu.onrender.com";
      
      if (!walletAddress) throw new Error('Please connect your wallet first');

      // Get ONLY the raw words
      const rawWordsResponse = await fetch(`${BACKEND_URL}/api/word-analysis/get-user-words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: walletAddress })
      });

      if (!rawWordsResponse.ok) throw new Error('Failed to get user words');

      const rawWordsData = await rawWordsResponse.json();
      const userWords = rawWordsData.words || [];
      
      if (userWords.length === 0) throw new Error('No words found for analysis');
      
      const wordsText = userWords.join(' ');
      const url = `${BACKEND_URL}/api/ai/analyze`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Analyze the neuropsychological profile of a trader based on their collected words from Telegram participation. Word count: ${userWords.length}. Words: ${wordsText}`,
          analysisType: 'neuropsychological'
        })
      });

      if (!response.ok) throw new Error(`Analysis failed: ${response.status}`);

      const data = await response.json();
      
      const enhancedResults = {
        ...data,
        aiProvider: "BITS AI Engine (OpenAI × Anthropic)",
        analysisTimestamp: new Date().toLocaleString(),
        wordCount: userWords.length,
        stressLevel: Math.round((data.stress_indicators?.level || 0.5) * 100),
        confidenceLevel: Math.round((data.trading_psychology?.confidence_level || 0.7) * 100),
        emotionalStability: Math.round((data.trading_psychology?.emotional_stability || 0.8) * 100),
        cognitiveLoad: Math.round((data.cognitive_patterns?.load || 0.6) * 100),
        focusLevel: data.cognitive_patterns?.attention_focus === 'high' ? 85 : 
                   data.cognitive_patterns?.attention_focus === 'medium' ? 65 : 45,
        anxietyLevel: Math.round((1 - (data.neuropsychological_profile?.stress_resilience || 0.75)) * 100),
        decisionSpeed: data.cognitive_patterns?.decision_style === 'analytical' ? 'Deliberate-Analytical' :
                      data.cognitive_patterns?.decision_style === 'intuitive' ? 'Moderate-Intuitive' : 'Fast-Impulsive',
        riskAppetite: data.trading_psychology?.risk_tolerance === 'high' ? 'Aggressive-Risk-Seeking' :
                     data.trading_psychology?.risk_tolerance === 'medium' ? 'Balanced-Moderate' : 'Conservative-Risk-Averse'
      };
      
      setAnalysisResults(enhancedResults);
      setHasUsedAnalysis(true);
      
    } catch (error) {
      console.error('Analysis error:', error);
      alert(`Analysis failed: ${error.message}. Please try again.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

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
              {!walletAddress && (
                  <div style={{marginTop: '1rem', color: '#ff5050', fontWeight: 'bold'}}>
                      <i className="fas fa-exclamation-triangle"></i> Connect Wallet to Access Profile
                  </div>
              )}
              {walletAddress && (
                  <div style={{marginTop: '0.5rem', color: '#00FFA3', fontSize: '0.9rem'}}>
                      Balance: {balanceLoading ? "..." : bitsBalance.toLocaleString()} BITS
                  </div>
              )}
            </div>
          </div>

          <div className="hero-features">
            {['emotional_prosody', 'trading_psychology', 'voice_analysis', 'personalized_trading'].map(feat => (
              <div 
                key={feat}
                className="feature-item"
                onMouseEnter={(e) => handleFeatureHover(feat, e)}
                onMouseLeave={handleFeatureLeave}
              >
                  <span className="feature-icon">{feat === 'voice_analysis' ? '🔊' : feat === 'trading_psychology' ? '📊' : feat === 'emotional_prosody' ? '🎯' : '💡'}</span>
                <span>{getFeaturePopupContent(feat).title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tier System - PROOF OF HOLDING */}
      <section className="tier-system">
        <div className="tier-header">
          <h2 className="laser-sharp">🎯 Analysis Levels</h2>
          <p className="laser-sharp">Unlock premium tiers by holding BITS tokens</p>
        </div>

        <div className="tier-grid">
          {[1, 2, 3, 4].map(tier => {
            const tierInfo = getTierInfo(tier);
            const isUnlocked = bitsBalance >= tierInfo.bitsRequired;
            
            return (
              <div 
                key={tier} 
                className={`tier-card ${currentTier === tier ? 'active' : ''} ${!isUnlocked ? 'locked-tier' : ''}`}
                onClick={() => isUnlocked && setCurrentTier(tier)}
                style={{ opacity: isUnlocked ? 1 : 0.7, cursor: isUnlocked ? 'pointer' : 'not-allowed' }}
              >
                <div className="tier-header">
                  <h3 className="laser-sharp">Level {tier}</h3>
                  <span className="tier-price laser-sharp">{tierInfo.price}</span>
                  <div className="tier-status laser-sharp">{tierInfo.status}</div>
                </div>
                <h4 className="laser-sharp">{tierInfo.name}</h4>
                <p className="tier-description laser-sharp">{tierInfo.description}</p>
                
                {/* UNLOCK CONDITION VISUAL */}
                <div className="tier-unlock-condition laser-sharp">
                  {isUnlocked ? (
                      <div style={{
                        background: 'rgba(0, 255, 163, 0.1)', 
                        border: '1px solid #00FFA3', 
                        color: '#00FFA3',
                        padding: '10px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        marginTop: '10px'
                      }}>
                        <i className="fas fa-check-circle"></i> <strong>Premium Tier Unlocked</strong>
                        <div style={{fontSize: '0.8rem'}}>Requirement Met</div>
                      </div>
                  ) : (
                      <div style={{
                        background: 'rgba(255, 50, 50, 0.1)', 
                        border: '1px solid #ff3333', 
                        color: '#ff3333',
                        padding: '10px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        marginTop: '10px'
                      }}>
                        <i className="fas fa-lock"></i> <strong>Locked</strong>
                        <div style={{fontSize: '0.8rem'}}>Hold {tierInfo.bitsRequired.toLocaleString()} BITS to Unlock</div>
                      </div>
                  )}
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

      {/* Word Collection Progress - New Component */}
      <WordCollectionProgress
        wordCount={wordCount}
        walletAddress={walletAddress}
        onRefresh={checkWordMilestone}
        isLoading={wordMilestone.isLoading}
        onDebugTest={async () => {
          const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://backend-server-eu.onrender.com";
          console.log('🧪 [API TEST] Starting comprehensive API test...');
          console.log('🧪 [API TEST] Wallet:', walletAddress);
          console.log('🧪 [API TEST] Backend:', BACKEND_URL);
          
          // Test 1: Get Telegram ID
          try {
            console.log('🧪 [TEST 1/3] Testing /get-telegram-id...');
            const res1 = await fetch(`${BACKEND_URL}/api/word-analysis/get-telegram-id`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ walletAddress })
            });
            const data1 = await res1.json();
            console.log('✅ [TEST 1/3] Telegram ID response:', data1);
            alert(`TEST 1: Telegram ID\n${JSON.stringify(data1, null, 2)}`);
          } catch (e) {
            console.error('❌ [TEST 1/3] Failed:', e);
            alert(`TEST 1 FAILED: ${e.message}`);
          }
          
          // Test 2: Analyze words
          try {
            console.log('🧪 [TEST 2/3] Testing /analyze-user-words...');
            const res2 = await fetch(`${BACKEND_URL}/api/word-analysis/analyze-user-words`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ walletAddress })
            });
            const data2 = await res2.json();
            console.log('✅ [TEST 2/3] Analyze words response:', data2);
            alert(`TEST 2: Word Count\n${JSON.stringify(data2, null, 2)}`);
          } catch (e) {
            console.error('❌ [TEST 2/3] Failed:', e);
            alert(`TEST 2 FAILED: ${e.message}`);
          }
          
          // Test 3: Get raw words
          try {
            console.log('🧪 [TEST 3/3] Testing /get-user-words...');
            const res3 = await fetch(`${BACKEND_URL}/api/word-analysis/get-user-words`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ walletAddress })
            });
            const data3 = await res3.json();
            console.log('✅ [TEST 3/3] Get words response:', data3);
            alert(`TEST 3: Raw Words\nCount: ${data3.wordCount || 0}\nFirst 10 words: ${(data3.words || []).slice(0, 10).join(', ')}`);
          } catch (e) {
            console.error('❌ [TEST 3/3] Failed:', e);
            alert(`TEST 3 FAILED: ${e.message}`);
          }
          
          console.log('🧪 [API TEST] All tests completed! Check console for details.');
        }}
      />

      {/* Analysis Explainer - What You'll Get */}
      <AnalysisExplainer />

      {/* Analyze Button Section */}
      <section className="status-section">
        <div className="status-wrapper">

          <button 
            onClick={handleAnalysis}
            disabled={isAnalyzing || !wordMilestone.hasAccess || !walletAddress}
            className={`analyze-button laser-sharp ${isAnalyzing ? 'analyzing' : ''}`}
          >
            {isAnalyzing ? (
              <><span className="spinner"></span> 🤖 BITS AI Analyzing...</>
            ) : !walletAddress ? (
                '🔌 Connect Wallet First'
            ) : wordMilestone.hasAccess ? (
              '🧬 Initialize Cognitive Analysis'
            ) : (
              `🔒 Need 1000 words (${wordMilestone.count || 0}/1000)`
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
            
            <div className="export-actions">
              <button className="export-btn email-btn" onClick={handleEmailExport} title="Send via Email">📧 Email</button>
              <button className="export-btn pdf-btn" onClick={handlePDFExport} title="Export as PDF">📄 PDF</button>
              <button className="export-btn print-btn" onClick={handlePrintExport} title="Print Analysis">🖨️ Print</button>
              <button className="export-btn share-btn" onClick={handleShareExport} title="Share Results">📤 Share</button>
            </div>
          </div>
          
          <div className="results-grid">
            <div className="result-card primary">
              <h3 className="laser-sharp">🎯 Core Analysis</h3>
              <div className="metrics">
                <div className="metric">
                  <span className="label laser-sharp">Sentiment</span>
                  <span className={`value sentiment-${analysisResults.sentiment} laser-sharp`}>{analysisResults.sentiment?.toUpperCase()}</span>
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

            <div className="result-card">
              <h3 className="laser-sharp">🧩 Psychological Profile</h3>
              <div className="metrics">
                <div className="metric">
                  <span className="label laser-sharp">Risk Tolerance</span>
                  <span className={`value risk-${analysisResults.trading_psychology?.risk_tolerance || 'medium'} laser-sharp`}>{(analysisResults.trading_psychology?.risk_tolerance || 'medium').toUpperCase()}</span>
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

          {(analysisResults.detailed_analysis || analysisResults.analysis) && (
            <div className="analysis-text-section">
              <div className="analysis-text-header">
                <h3 className="laser-sharp">📋 Complete Medical Psychological Analysis</h3>
                <p>Professional psychological trading profile generated by <strong>BITS AI Engine</strong> (OpenAI × Anthropic)</p>
              </div>
              <div className="analysis-text-content">
                <div className="analysis-text laser-sharp">{analysisResults.detailed_analysis || analysisResults.analysis}</div>
              </div>
            </div>
          )}

          <div className="nft-section">
            <div className="nft-header">
              <h3 className="laser-sharp">💎 Your Soulbound Identity</h3>
              <p>This living NFT evolves as you gain trading experience and BITS holdings.</p>
            </div>
            
            <DynamicNFTCard userProfile={{
              tier: currentTier,
              balance: bitsBalance,
              wallet: walletAddress,
              analysisCount: hasUsedAnalysis ? 1 : 0
            }} />
          </div>
        </section>
      )}

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
      
      <WarningModal 
        showWarningModal={showWarningModal}
        setShowWarningModal={setShowWarningModal}
        proceedWithAnalysis={proceedWithAnalysis}
      />

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

      {/* 🤖 AI TRADING GUARDIAN (Floating HUD) */}
      <AITradingGuardian 
        userProfile={{ 
          tier: currentTier,
          wallet: walletAddress,
          balance: bitsBalance 
        }} 
      />

      {/* 🔔 TOAST NOTIFICATION */}
      {toast.show && (
        <div className={`toast-notification toast-${toast.type}`}>
          <span className="toast-message">{toast.message}</span>
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
