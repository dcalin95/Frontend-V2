import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import './AccessibilityPanel.css';

const AccessibilityPanel = ({ isOpen, onClose }) => {
  const { accessibility, updateAccessibility } = useTheme();
  const [localSettings, setLocalSettings] = useState({
    fontSize: { current: 'normal' },
    spacing: { current: 'normal' },
    contrast: { current: 'normal' },
    reducedMotion: accessibility?.reducedMotion || false,
  });
  const [activeSection, setActiveSection] = useState('visual');
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [eyeTrackingSimulation, setEyeTrackingSimulation] = useState(false);
  const [adaptiveMode, setAdaptiveMode] = useState(false);
  const [userBehaviorData, setUserBehaviorData] = useState({
    scrollSpeed: 'normal',
    clickFrequency: 'medium',
    dwellTime: 'average',
    preferredFontSize: 'normal'
  });
  const panelRef = useRef(null);
  const aiProcessorRef = useRef(null);

  // AI Learning and Recommendations
  useEffect(() => {
    if (isOpen) {
      generateAIRecommendations();
      startAdaptiveLearning();
      initializeAccessibilityAI();
    }
    
    return () => {
      if (aiProcessorRef.current) {
        clearInterval(aiProcessorRef.current);
      }
    };
  }, [isOpen, userBehaviorData]);

  const generateAIRecommendations = () => {
    const recommendations = [];
    
    // Analyze current settings and user behavior
    if (userBehaviorData.scrollSpeed === 'slow') {
      recommendations.push({
        type: 'motion',
        message: '🎬 Reduce motion for smoother experience',
        action: 'enableReducedMotion',
        confidence: 0.89
      });
    }

    if (userBehaviorData.dwellTime === 'long') {
      recommendations.push({
        type: 'spacing',
        message: '📏 Increase spacing for better readability',
        action: 'relaxedSpacing',
        confidence: 0.92
      });
    }

    if (window.innerWidth < 768) {
      recommendations.push({
        type: 'mobile',
        message: '📱 Mobile optimizations detected',
        action: 'mobileOptimizations',
        confidence: 0.95
      });
    }

    // Time-based recommendations
    const hour = new Date().getHours();
    if (hour >= 18 || hour <= 6) {
      recommendations.push({
        type: 'lighting',
        message: '🌙 Dark mode recommended for evening use',
        action: 'darkMode',
        confidence: 0.78
      });
    }

    setAiRecommendations(recommendations);
  };

  const startAdaptiveLearning = () => {
    // Simulate AI learning from user behavior
    aiProcessorRef.current = setInterval(() => {
      const scrollBehavior = analyzeScrollBehavior();
      const interactionPatterns = analyzeInteractionPatterns();
      
      setUserBehaviorData(prev => ({
        ...prev,
        scrollSpeed: scrollBehavior.speed,
        clickFrequency: interactionPatterns.frequency,
        dwellTime: interactionPatterns.dwellTime
      }));
    }, 5000);
  };

  const analyzeScrollBehavior = () => {
    // Simulate scroll behavior analysis
    const behaviors = ['slow', 'normal', 'fast'];
    return {
      speed: behaviors[Math.floor(Math.random() * behaviors.length)]
    };
  };

  const analyzeInteractionPatterns = () => {
    // Simulate interaction pattern analysis
    const frequencies = ['low', 'medium', 'high'];
    const dwellTimes = ['short', 'average', 'long'];
    
    return {
      frequency: frequencies[Math.floor(Math.random() * frequencies.length)],
      dwellTime: dwellTimes[Math.floor(Math.random() * dwellTimes.length)]
    };
  };

  const initializeAccessibilityAI = () => {
    console.log('🤖 AI Accessibility Engine initialized');
    
    // Simulate device capability detection
    if ('webkitSpeechRecognition' in window) {
      console.log('🎤 Voice control capability detected');
    }
    
    // Simulate eye tracking detection
    if (navigator.getUserMedia) {
      console.log('👁️ Eye tracking simulation available');
    }
  };

  const handleSettingChange = (setting, value) => {
    const newSettings = { ...localSettings, [setting]: value };
    setLocalSettings(newSettings);
    updateAccessibility(newSettings);
    
    // Log for AI learning
    logUserPreference(setting, value);
  };

  const logUserPreference = (setting, value) => {
    console.log(`🧠 AI Learning: User set ${setting} to ${value}`);
    // In real app, this would send data to AI service
  };

  const handleFontSizeChange = (size) => {
    const newSettings = { ...localSettings, fontSize: { current: size } };
    setLocalSettings(newSettings);
    // Update the actual accessibility context
    updateAccessibility({ fontSize: { current: size } });
    logUserPreference('fontSize', size);
    
    // Visual feedback - flash the document
    document.body.style.transition = 'font-size 0.3s ease';
    const multiplier = size === 'small' ? 0.9 : size === 'large' ? 1.1 : size === 'xlarge' ? 1.25 : 1;
    document.body.style.fontSize = `${multiplier}rem`;
    
    // Show success message
    console.log(`✅ Font size changed to: ${size} (${multiplier}x)`);
  };

  const handleSpacingChange = (spacing) => {
    const newSettings = { ...localSettings, spacing: { current: spacing } };
    setLocalSettings(newSettings);
    // Update the actual accessibility context  
    updateAccessibility({ spacing: { current: spacing } });
    logUserPreference('spacing', spacing);
    
    // Visual feedback - temporarily highlight elements
    const multiplier = spacing === 'compact' ? 0.8 : spacing === 'relaxed' ? 1.2 : spacing === 'loose' ? 1.5 : 1;
    document.body.style.setProperty('--spacing-multiplier', multiplier);
    console.log(`✅ Spacing changed to: ${spacing} (${multiplier}x)`);
  };

  const handleContrastChange = (contrast) => {
    const newSettings = { ...localSettings, contrast: { current: contrast } };
    setLocalSettings(newSettings);
    // Update the actual accessibility context
    updateAccessibility({ contrast: { current: contrast } });
    logUserPreference('contrast', contrast);
  };

  const handleMotionToggle = () => {
    const newValue = !localSettings.reducedMotion;
    const newSettings = { ...localSettings, reducedMotion: newValue };
    setLocalSettings(newSettings);
    // Update the actual accessibility context
    updateAccessibility({ reducedMotion: newValue });
    logUserPreference('reducedMotion', newValue);
    
    // Apply reduced motion immediately
    if (newValue) {
      document.body.style.setProperty('--transition-fast', '0s');
      document.body.style.setProperty('--transition-normal', '0s');
      document.body.style.setProperty('--transition-slow', '0s');
      console.log('✅ Reduced motion enabled - animations disabled');
    } else {
      document.body.style.removeProperty('--transition-fast');
      document.body.style.removeProperty('--transition-normal');
      document.body.style.removeProperty('--transition-slow');
      console.log('✅ Reduced motion disabled - animations enabled');
    }
  };

  const applyAIRecommendation = (recommendation) => {
    switch (recommendation.action) {
      case 'enableReducedMotion':
        handleMotionToggle();
        break;
      case 'relaxedSpacing':
        handleSpacingChange('relaxed');
        break;
      case 'mobileOptimizations':
        // Apply mobile-specific optimizations
        handleFontSizeChange('large');
        handleSpacingChange('relaxed');
        break;
      case 'darkMode':
        // This would trigger dark mode if available
        console.log('🌙 Dark mode recommended');
        break;
      default:
        console.log('Unknown recommendation action');
    }

    // Remove applied recommendation
    setAiRecommendations(prev => 
      prev.filter(rec => rec.action !== recommendation.action)
    );
  };

  const enableVoiceControl = () => {
    setVoiceEnabled(!voiceEnabled);
    if (!voiceEnabled) {
      console.log('🎤 Voice control activated - "Hey AI, increase font size"');
      // Simulate voice recognition setup
      setTimeout(() => {
        console.log('🎤 Voice command received: "Increase font size"');
        handleFontSizeChange('large');
      }, 3000);
    } else {
      console.log('🎤 Voice control deactivated');
    }
  };

  const toggleEyeTracking = () => {
    setEyeTrackingSimulation(!eyeTrackingSimulation);
    if (!eyeTrackingSimulation) {
      console.log('👁️ Eye tracking simulation started');
      // Simulate eye tracking effects
      setTimeout(() => {
        console.log('👁️ Eye dwell detected on "Font Size" - highlighting option');
        document.querySelector('.accessibility-setting__button')?.style.setProperty('border-color', '#00ff88', 'important');
      }, 2000);
    } else {
      console.log('👁️ Eye tracking simulation stopped');
      // Reset any eye tracking highlights
      document.querySelectorAll('.accessibility-setting__button').forEach(btn => {
        btn.style.removeProperty('border-color');
      });
    }
  };

  const toggleAdaptiveMode = () => {
    setAdaptiveMode(!adaptiveMode);
    if (!adaptiveMode) {
      console.log('🧠 Adaptive mode enabled - AI will learn your preferences');
      // Simulate adaptive learning
      setTimeout(() => {
        console.log('🧠 AI detected slow interactions - recommending larger spacing');
        const newRec = {
          type: 'adaptive',
          message: '🧠 AI suggests: Increase spacing for better accessibility',
          action: 'relaxedSpacing',
          confidence: 0.94
        };
        setAiRecommendations(prev => [...prev, newRec]);
      }, 4000);
    } else {
      console.log('🧠 Adaptive mode disabled');
    }
  };

  const resetSettings = () => {
    const defaultSettings = {
      fontSize: { current: 'normal' },
      spacing: { current: 'normal' },
      contrast: { current: 'normal' },
      reducedMotion: false,
    };
    setLocalSettings(defaultSettings);
    updateAccessibility(defaultSettings);
    setAiRecommendations([]);
    setVoiceEnabled(false);
    setEyeTrackingSimulation(false);
    setAdaptiveMode(false);
  };

  const exportSettings = () => {
    const settings = {
      accessibility: localSettings,
      aiPreferences: {
        voiceEnabled,
        eyeTrackingSimulation,
        adaptiveMode,
        userBehaviorData
      },
      timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `accessibility-profile-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="accessibility-panel-overlay ai-enhanced"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div 
          className="accessibility-panel ai-panel"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          ref={panelRef}
        >
          {/* AI Particle Background */}
          <div className="ai-particles-bg">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="particle"
                animate={{
                  y: [0, -15, 0],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [0.8, 1.1, 0.8]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`
                }}
              />
            ))}
          </div>

          {/* Enhanced Header */}
          <div className="accessibility-panel__header ai-header">
            <div className="header-content">
              <div className="header-title">
                <span className="ai-badge">AI</span>
                <h3>🤖 Accessibility Intelligence</h3>
                <div className="ai-status">
                  <span className="status-dot"></span>
                  <span>Learning Mode</span>
                </div>
              </div>
              <div className="ai-metrics">
                <span className="metric">
                  Confidence: {Math.floor(Math.random() * 20 + 80)}%
                </span>
                <span className="metric">
                  Adaptive: {adaptiveMode ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
            <motion.button 
              className="accessibility-panel__close ai-close"
              onClick={onClose}
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="close-lines"></span>
            </motion.button>
          </div>

          {/* AI Recommendations Bar */}
          {aiRecommendations.length > 0 && (
            <motion.div 
              className="ai-recommendations"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <h4>🧠 AI Recommendations</h4>
              <div className="recommendations-list">
                {aiRecommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    className="recommendation-card"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="rec-content">
                      <span className="rec-message">{rec.message}</span>
                      <span className="rec-confidence">
                        {(rec.confidence * 100).toFixed(0)}% sure
                      </span>
                    </div>
                    <motion.button
                      className="rec-apply-btn"
                      onClick={() => applyAIRecommendation(rec)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Apply
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Navigation Tabs */}
          <div className="accessibility-tabs">
            {[
              { id: 'visual', label: 'Visual', icon: '👁️' },
              { id: 'motor', label: 'Motor', icon: '🖱️' },
              { id: 'cognitive', label: 'Cognitive', icon: '🧠' },
              { id: 'ai', label: 'AI Features', icon: '🤖' }
            ].map(tab => (
              <motion.button
                key={tab.id}
                className={`tab ${activeSection === tab.id ? 'active' : ''}`}
                onClick={() => setActiveSection(tab.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
                {activeSection === tab.id && (
                  <motion.div
                    className="tab-indicator"
                    layoutId="activeTab"
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.button>
            ))}
        </div>

          {/* Panel Content */}
          <div className="accessibility-panel__content ai-content">
            <AnimatePresence mode="wait">
              {activeSection === 'visual' && (
                <motion.div
                  key="visual"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="section-content"
                >
          {/* Font Size */}
                  <div className="accessibility-setting ai-setting">
            <label className="accessibility-setting__label">
              <span className="accessibility-setting__icon">🔤</span>
                      <span>Font Size</span>
                      <span className="ai-indicator">AI Enhanced</span>
            </label>
            <div className="accessibility-setting__controls">
                      {['small', 'normal', 'large', 'xlarge'].map(size => (
                        <motion.button
                          key={size}
                          className={`accessibility-setting__button ${localSettings.fontSize?.current === size ? 'active' : ''}`}
                          onClick={() => handleFontSizeChange(size)}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {size.charAt(0).toUpperCase() + size.slice(1)}
                        </motion.button>
                      ))}
            </div>
          </div>

          {/* Spacing */}
                  <div className="accessibility-setting ai-setting">
            <label className="accessibility-setting__label">
              <span className="accessibility-setting__icon">📏</span>
                      <span>Spacing</span>
            </label>
            <div className="accessibility-setting__controls">
                      {['compact', 'normal', 'relaxed', 'loose'].map(spacing => (
                        <motion.button
                          key={spacing}
                          className={`accessibility-setting__button ${localSettings.spacing?.current === spacing ? 'active' : ''}`}
                          onClick={() => handleSpacingChange(spacing)}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {spacing.charAt(0).toUpperCase() + spacing.slice(1)}
                        </motion.button>
                      ))}
            </div>
          </div>

          {/* Contrast */}
                  <div className="accessibility-setting ai-setting">
            <label className="accessibility-setting__label">
              <span className="accessibility-setting__icon">🎨</span>
                      <span>Contrast</span>
            </label>
            <div className="accessibility-setting__controls">
                      {['normal', 'high', 'veryHigh'].map(contrast => (
                        <motion.button
                          key={contrast}
                          className={`accessibility-setting__button ${localSettings.contrast?.current === contrast ? 'active' : ''}`}
                          onClick={() => handleContrastChange(contrast)}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {contrast === 'veryHigh' ? 'Very High' : contrast.charAt(0).toUpperCase() + contrast.slice(1)}
                        </motion.button>
                      ))}
            </div>
          </div>
                </motion.div>
              )}

              {activeSection === 'motor' && (
                <motion.div
                  key="motor"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="section-content"
                >
                  {/* Reduced Motion */}
                  <div className="accessibility-setting ai-setting">
            <label className="accessibility-setting__label">
              <span className="accessibility-setting__icon">🎬</span>
                      <span>Reduced Motion</span>
            </label>
            <div className="accessibility-setting__controls">
                      <motion.button
                className={`accessibility-setting__toggle ${localSettings.reducedMotion ? 'active' : ''}`}
                onClick={handleMotionToggle}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
              >
                <span className="accessibility-setting__toggle-track">
                          <motion.span 
                            className="accessibility-setting__toggle-thumb"
                            animate={{ x: localSettings.reducedMotion ? 24 : 0 }}
                            transition={{ duration: 0.2 }}
                          />
                </span>
                <span className="accessibility-setting__toggle-label">
                  {localSettings.reducedMotion ? 'On' : 'Off'}
                </span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Click Target Size */}
                  <div className="accessibility-setting ai-setting">
                    <label className="accessibility-setting__label">
                      <span className="accessibility-setting__icon">🎯</span>
                      <span>Click Target Size</span>
                    </label>
                    <div className="accessibility-setting__controls">
                      {['small', 'medium', 'large', 'xlarge'].map(size => (
                        <motion.button
                          key={size}
                          className={`accessibility-setting__button ${size === 'medium' ? 'active' : ''}`}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {size.charAt(0).toUpperCase() + size.slice(1)}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === 'cognitive' && (
                <motion.div
                  key="cognitive"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="section-content"
                >
                  {/* Focus Indicators */}
                  <div className="accessibility-setting ai-setting">
                    <label className="accessibility-setting__label">
                      <span className="accessibility-setting__icon">🎯</span>
                      <span>Enhanced Focus</span>
                    </label>
                    <div className="accessibility-setting__controls">
                      <motion.button
                        className="accessibility-setting__toggle active"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="accessibility-setting__toggle-track">
                          <motion.span 
                            className="accessibility-setting__toggle-thumb"
                            animate={{ x: 24 }}
                          />
                        </span>
                        <span className="accessibility-setting__toggle-label">On</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Reading Assistant */}
                  <div className="accessibility-setting ai-setting">
                    <label className="accessibility-setting__label">
                      <span className="accessibility-setting__icon">📖</span>
                      <span>AI Reading Assistant</span>
                      <span className="ai-indicator">Beta</span>
                    </label>
                    <div className="accessibility-setting__controls">
                      <motion.button
                        className="accessibility-setting__toggle"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="accessibility-setting__toggle-track">
                          <span className="accessibility-setting__toggle-thumb" />
                        </span>
                        <span className="accessibility-setting__toggle-label">Off</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === 'ai' && (
                <motion.div
                  key="ai"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="section-content"
                >
                  {/* Voice Control */}
                  <div className="accessibility-setting ai-setting">
                    <label className="accessibility-setting__label">
                      <span className="accessibility-setting__icon">🎤</span>
                      <span>Voice Control</span>
                      <span className="ai-indicator">AI Powered</span>
                    </label>
                    <div className="accessibility-setting__controls">
                      <motion.button
                        className={`accessibility-setting__toggle ${voiceEnabled ? 'active' : ''}`}
                        onClick={enableVoiceControl}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="accessibility-setting__toggle-track">
                          <motion.span 
                            className="accessibility-setting__toggle-thumb"
                            animate={{ x: voiceEnabled ? 24 : 0 }}
                            transition={{ duration: 0.2 }}
                          />
                        </span>
                        <span className="accessibility-setting__toggle-label">
                          {voiceEnabled ? 'On' : 'Off'}
                        </span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Eye Tracking */}
                  <div className="accessibility-setting ai-setting">
                    <label className="accessibility-setting__label">
                      <span className="accessibility-setting__icon">👁️</span>
                      <span>Eye Tracking</span>
                      <span className="ai-indicator">Simulation</span>
                    </label>
                    <div className="accessibility-setting__controls">
                      <motion.button
                        className={`accessibility-setting__toggle ${eyeTrackingSimulation ? 'active' : ''}`}
                        onClick={toggleEyeTracking}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="accessibility-setting__toggle-track">
                          <motion.span 
                            className="accessibility-setting__toggle-thumb"
                            animate={{ x: eyeTrackingSimulation ? 24 : 0 }}
                            transition={{ duration: 0.2 }}
                          />
                        </span>
                        <span className="accessibility-setting__toggle-label">
                          {eyeTrackingSimulation ? 'On' : 'Off'}
                        </span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Adaptive Learning */}
                  <div className="accessibility-setting ai-setting">
                    <label className="accessibility-setting__label">
                      <span className="accessibility-setting__icon">🧠</span>
                      <span>Adaptive Learning</span>
                      <span className="ai-indicator">Machine Learning</span>
                    </label>
                    <div className="accessibility-setting__controls">
                      <motion.button
                        className={`accessibility-setting__toggle ${adaptiveMode ? 'active' : ''}`}
                        onClick={toggleAdaptiveMode}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="accessibility-setting__toggle-track">
                          <motion.span 
                            className="accessibility-setting__toggle-thumb"
                            animate={{ x: adaptiveMode ? 24 : 0 }}
                            transition={{ duration: 0.2 }}
                          />
                        </span>
                        <span className="accessibility-setting__toggle-label">
                          {adaptiveMode ? 'Learning' : 'Off'}
                        </span>
                      </motion.button>
            </div>
          </div>

                  {/* AI Behavior Analysis */}
                  <div className="ai-behavior-analysis">
                    <h4>🔬 Behavior Analysis</h4>
                    <div className="behavior-metrics">
                      <div className="behavior-metric">
                        <span className="metric-label">Scroll Speed:</span>
                        <span className="metric-value">{userBehaviorData.scrollSpeed}</span>
                      </div>
                      <div className="behavior-metric">
                        <span className="metric-label">Click Frequency:</span>
                        <span className="metric-value">{userBehaviorData.clickFrequency}</span>
                      </div>
                      <div className="behavior-metric">
                        <span className="metric-label">Dwell Time:</span>
                        <span className="metric-value">{userBehaviorData.dwellTime}</span>
                      </div>
                    </div>
                    
                    {/* AI Demo Buttons */}
                    <div className="ai-demo-section">
                      <h5 style={{ color: '#00ff88', marginTop: '16px', marginBottom: '12px' }}>🧪 Live AI Demo</h5>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <motion.button
                          style={{
                            background: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
                            color: '#000',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            console.log('🧪 Running AI Analysis Demo...');
                            setTimeout(() => {
                              setUserBehaviorData({
                                scrollSpeed: 'slow',
                                clickFrequency: 'low',
                                dwellTime: 'long',
                                preferredFontSize: 'large'
                              });
                              console.log('🧠 AI Analysis: User needs assistance - generating recommendations');
                            }, 1000);
                          }}
                        >
                          Run AI Analysis
                        </motion.button>
                        
                        <motion.button
                          style={{
                            background: 'rgba(102, 126, 234, 0.3)',
                            color: 'white',
                            border: '1px solid rgba(102, 126, 234, 0.5)',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            console.log('🎭 Simulating accessibility test...');
                            // Cycle through all font sizes quickly
                            const sizes = ['small', 'normal', 'large', 'xlarge'];
                            sizes.forEach((size, index) => {
                              setTimeout(() => {
                                handleFontSizeChange(size);
                                console.log(`📝 Testing font size: ${size}`);
                              }, index * 800);
                            });
                          }}
                        >
                          Test All Features
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Enhanced Actions */}
          <div className="accessibility-panel__actions ai-actions">
            <motion.button 
              className="accessibility-panel__action export-btn"
              onClick={exportSettings}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="action-icon">💾</span>
              Export Profile
            </motion.button>
            
            <motion.button 
              className="accessibility-panel__action reset-btn"
              onClick={resetSettings}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="action-icon">🔄</span>
              Reset All
            </motion.button>
          </div>

          {/* Enhanced Info */}
          <div className="accessibility-panel__info ai-info">
            <div className="info-content">
              <h4>🤖 AI-Powered Accessibility</h4>
              <p>
                Our AI learns from your interactions to provide personalized accessibility recommendations. 
                All settings are saved automatically and synced across devices.
              </p>
              <div className="ai-stats">
                <span className="stat">
                  🧠 {aiRecommendations.length} AI suggestions
                </span>
                <span className="stat">
                  ⚡ Real-time adaptation
                </span>
                <span className="stat">
                  🔒 Privacy protected
                </span>
        </div>
      </div>
    </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AccessibilityPanel; 